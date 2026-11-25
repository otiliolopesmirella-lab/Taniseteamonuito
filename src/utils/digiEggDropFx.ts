import type { ItemRarity } from '../types/hud';

export interface DigiEggDropFx {
  id: number;
  worldX: number;
  worldY: number;
  iconUrl: string;
  name: string;
  accentColor: string;
  rarity: ItemRarity;
  elapsed: number;
  duration: number;
  collectedNotified: boolean;
}

const eggImageCache = new Map<string, HTMLImageElement>();

export function preloadDigiEggDropIcon(iconUrl: string): HTMLImageElement | null {
  if (typeof window === 'undefined' || !iconUrl) return null;
  const existing = eggImageCache.get(iconUrl);
  if (existing) return existing;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = iconUrl;
  eggImageCache.set(iconUrl, img);
  return img;
}

function getReadyEggImage(iconUrl: string): HTMLImageElement | null {
  const img = preloadDigiEggDropIcon(iconUrl);
  if (!img || !img.complete || img.naturalWidth === 0) return null;
  return img;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return { r: 250, g: 204, b: 21 };
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha).toFixed(3)})`;
}

function drawFourPointStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outerR: number,
  innerR: number,
  rotation = 0
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI) / 4;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export interface DrawDigiEggDropParams {
  ctx: CanvasRenderingContext2D;
  fxList: DigiEggDropFx[];
  camX: number;
  camY: number;
  cameraZoom: number;
  viewW: number;
  viewH: number;
  onCollectArrive?: (fx: DigiEggDropFx) => void;
}

/**
 * Renders the 3-phase cinematic DigiEgg drop-to-inventory sequence directly in
 * screen space (seamlessly anchored to world coordinates during showcase, then
 * flying along a radiant curved comet arc straight into the bottom-right dock):
 *
 * Phase 1 (0.00s - 0.55s): Golden/elemental vertical light pillar + expanding
 *                          ground rune shockwaves + elastic pop-up above monster.
 * Phase 2 (0.55s - 1.65s): Radiant showcase hover with rotating volumetric
 *                          starlight god-rays, orbiting sparkles & glowing nameplate.
 * Phase 3 (1.65s - 2.30s): Silky curved Bezier comet flight with stardust tail
 *                          straight into the bottom-right MENU/Inventário dock.
 * Arrival (2.30s - 2.65s): Radiant golden collection burst ring + "+1 INVENTÁRIO"
 *                          micro-flash right over the dock.
 */
export function drawDigiEggDropFx({
  ctx,
  fxList,
  camX,
  camY,
  cameraZoom,
  viewW,
  viewH,
  onCollectArrive,
}: DrawDigiEggDropParams): void {
  if (fxList.length === 0) return;

  const targetX = viewW - 56;
  const targetY = viewH - 34;

  const PHASE_POP_END = 0.55;
  const PHASE_HOVER_END = 1.65;
  const PHASE_FLY_END = 2.28;

  for (const fx of fxList) {
    const t = fx.elapsed;
    const total = fx.duration;
    if (t < 0 || t >= total) continue;

    // Exact world-to-screen projection of the slain monster's spot
    const originX = (fx.worldX - camX) * cameraZoom + viewW / 2;
    const originY = (fx.worldY - camY) * cameraZoom + viewH / 2;

    const accent = fx.accentColor || '#facc15';
    const goldHex = '#fde047';
    const hoverLift = 72 * Math.max(0.85, Math.min(1.2, cameraZoom));

    const img = getReadyEggImage(fx.iconUrl);

    // =========================================================================
    // WORLD-ANCHORED RADIANT PILLAR & GROUND RUNES (Active during Pop & Hover)
    // =========================================================================
    if (t < PHASE_HOVER_END + 0.25) {
      const pillarAlpha =
        t < 0.16
          ? t / 0.16
          : t < PHASE_HOVER_END - 0.1
            ? 0.92
            : clamp01(1 - (t - (PHASE_HOVER_END - 0.1)) / 0.35);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Tall vertical golden + elemental pillar of light shooting from slain monster
      const pillarHeight = 250 * Math.max(0.85, Math.min(1.18, cameraZoom));
      const pillarHalfW = (t < 0.25 ? 36 : 26) * (0.9 + Math.sin(t * 14) * 0.08);
      const pillarGrad = ctx.createLinearGradient(
        originX,
        originY + 8,
        originX,
        originY - pillarHeight
      );
      pillarGrad.addColorStop(0, rgba(goldHex, 0.72 * pillarAlpha));
      pillarGrad.addColorStop(0.28, rgba(accent, 0.45 * pillarAlpha));
      pillarGrad.addColorStop(0.68, rgba(goldHex, 0.16 * pillarAlpha));
      pillarGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = pillarGrad;
      ctx.beginPath();
      ctx.moveTo(originX - pillarHalfW * 1.15, originY + 8);
      ctx.lineTo(originX + pillarHalfW * 1.15, originY + 8);
      ctx.lineTo(originX + pillarHalfW * 0.42, originY - pillarHeight);
      ctx.lineTo(originX - pillarHalfW * 0.42, originY - pillarHeight);
      ctx.closePath();
      ctx.fill();

      // Inner razor-white core beam
      const coreGrad = ctx.createLinearGradient(
        originX,
        originY + 6,
        originX,
        originY - pillarHeight * 0.82
      );
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${(0.85 * pillarAlpha).toFixed(3)})`);
      coreGrad.addColorStop(0.45, rgba(goldHex, 0.36 * pillarAlpha));
      coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(
        originX - pillarHalfW * 0.24,
        originY - pillarHeight * 0.82,
        pillarHalfW * 0.48,
        pillarHeight * 0.82 + 6
      );

      // Ground golden energy pool & dual expanding shockwave rings
      const poolR = 46 * (0.95 + Math.sin(t * 10) * 0.08);
      ctx.save();
      ctx.translate(originX, originY + 6);
      ctx.scale(1, 0.4);
      const poolGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, poolR);
      poolGrad.addColorStop(0, `rgba(255, 253, 224, ${(0.9 * pillarAlpha).toFixed(3)})`);
      poolGrad.addColorStop(0.45, rgba(accent, 0.52 * pillarAlpha));
      poolGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = poolGrad;
      ctx.beginPath();
      ctx.arc(0, 0, poolR, 0, Math.PI * 2);
      ctx.fill();

      // Shockwave Ring 1 (instant burst)
      if (t < 0.72) {
        const rp = clamp01(t / 0.72);
        const r = 14 + rp * 76;
        ctx.strokeStyle = rgba(goldHex, (1 - rp) * 0.92);
        ctx.lineWidth = 3.5 * (1 - rp * 0.6);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Shockwave Ring 2 (delayed accent ripple)
      if (t > 0.14 && t < 0.92) {
        const rp = clamp01((t - 0.14) / 0.78);
        const r = 10 + rp * 66;
        ctx.strokeStyle = rgba(accent, (1 - rp) * 0.85);
        ctx.lineWidth = 2.6 * (1 - rp * 0.5);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Rising golden light motes around the defeated monster
      for (let i = 0; i < 10; i++) {
        const seed = fx.id * 17 + i * 31;
        const cycle = (t * 0.95 + (seed % 100) / 100) % 1;
        const spreadX = Math.sin(seed * 1.7 + t * 3.2) * (16 + (i % 4) * 9);
        const moteX = originX + spreadX;
        const moteY = originY - cycle * 145;
        const moteAlpha = Math.sin(cycle * Math.PI) * pillarAlpha * 0.95;
        ctx.fillStyle = i % 2 === 0 ? rgba(goldHex, moteAlpha) : rgba(accent, moteAlpha);
        drawFourPointStar(ctx, moteX, moteY, 4.8, 1.4, t * 3 + i);
      }

      ctx.restore();
    }

    // =========================================================================
    // COMPUTE CURRENT EGG POSITION & SCALE ACROSS THE 3 PHASES
    // =========================================================================
    const hoverX = originX;
    const hoverY = originY - hoverLift + Math.sin(t * 6.5) * 4.5;

    let eggX = hoverX;
    let eggY = hoverY;
    let eggScale = 1;
    let eggAlpha = 1;
    let eggTilt = Math.sin(t * 5.2) * 0.08;

    const isFlying = t >= PHASE_HOVER_END && t < PHASE_FLY_END;
    const isArrived = t >= PHASE_FLY_END;

    if (t < PHASE_POP_END) {
      const p = clamp01(t / PHASE_POP_END);
      const spring = easeOutBack(p);
      eggX = originX;
      eggY = originY - 12 - (hoverLift - 12) * Math.min(1.08, spring);
      eggScale = 0.25 + 0.82 * Math.min(1.12, spring);
      eggTilt = Math.sin(p * Math.PI * 2.5) * 0.16 * (1 - p);
    } else if (t < PHASE_HOVER_END) {
      const pulse = 1 + Math.sin((t - PHASE_POP_END) * 7.5) * 0.06;
      eggScale = 1.04 * pulse;
    } else if (isFlying) {
      const rawP = clamp01((t - PHASE_HOVER_END) / (PHASE_FLY_END - PHASE_HOVER_END));
      const p = easeInOutCubic(rawP);

      // High, sweeping Bezier control point so the egg arcs gracefully across the screen
      const midX = (hoverX + targetX) * 0.5;
      const ctrlX = midX + (hoverX > targetX ? -70 : 55);
      const ctrlY = Math.min(hoverY, targetY) - Math.max(110, viewH * 0.22);

      const inv = 1 - p;
      eggX = inv * inv * hoverX + 2 * inv * p * ctrlX + p * p * targetX;
      eggY = inv * inv * hoverY + 2 * inv * p * ctrlY + p * p * targetY;

      eggScale = 1.04 * (1 - 0.56 * p);
      eggTilt = rawP * Math.PI * 0.35;
      eggAlpha = rawP > 0.9 ? clamp01(1 - (rawP - 0.9) / 0.1) : 1;

      // Draw luminous comet stardust ribbon trailing behind the flying egg
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const trailSteps = 16;
      for (let s = 1; s <= trailSteps; s++) {
        const tp = Math.max(0, rawP - s * 0.022);
        const ep = easeInOutCubic(tp);
        const tinv = 1 - ep;
        const tx = tinv * tinv * hoverX + 2 * tinv * ep * ctrlX + ep * ep * targetX;
        const ty = tinv * tinv * hoverY + 2 * tinv * ep * ctrlY + ep * ep * targetY;
        const fade = Math.pow(1 - s / trailSteps, 1.5) * (1 - Math.max(0, rawP - 0.85) * 6);
        if (fade <= 0.01) continue;

        const r = (16 - s * 0.72) * (0.7 + 0.3 * (1 - p));
        const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, Math.max(2, r));
        g.addColorStop(0, `rgba(255, 255, 255, ${(0.88 * fade).toFixed(3)})`);
        g.addColorStop(0.45, rgba(goldHex, 0.72 * fade));
        g.addColorStop(1, rgba(accent, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(tx, ty, Math.max(2, r), 0, Math.PI * 2);
        ctx.fill();

        if (s % 2 === 0) {
          const jitterX = Math.sin(fx.id * 11 + s * 4.3 + t * 18) * (7 + s * 0.45);
          const jitterY = Math.cos(fx.id * 7 + s * 3.7 + t * 18) * (7 + s * 0.45);
          ctx.fillStyle = s % 4 === 0 ? rgba(goldHex, fade * 0.95) : rgba(accent, fade * 0.95);
          drawFourPointStar(ctx, tx + jitterX, ty + jitterY, 5.2 * fade, 1.5 * fade, t * 6 + s);
        }
      }
      ctx.restore();
    }

    // =========================================================================
    // DRAW RADIANT HALO, ROTATING GOD-RAYS, ORBITING SPARKLES & CUSTOM DIGIEGG
    // =========================================================================
    if (!isArrived) {
      const showcaseStrength =
        t < PHASE_HOVER_END
          ? 1
          : clamp01(1 - (t - PHASE_HOVER_END) / 0.25);

      ctx.save();
      ctx.translate(eggX, eggY);

      // 1. Rotating Volumetric Starlight God-Rays (during Pop & Hover)
      if (showcaseStrength > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const rayCount = 12;
        const baseSpin = t * 1.15;
        for (let i = 0; i < rayCount; i++) {
          const a = baseSpin + (i * Math.PI * 2) / rayCount;
          const rayLen =
            (i % 2 === 0 ? 74 : 52) *
            (0.92 + Math.sin(t * 9 + i * 1.4) * 0.12) *
            showcaseStrength;
          const halfSpread = i % 2 === 0 ? 0.12 : 0.085;
          const rayGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, rayLen);
          rayGrad.addColorStop(
            0,
            i % 2 === 0
              ? rgba(goldHex, 0.72 * showcaseStrength)
              : rgba(accent, 0.62 * showcaseStrength)
          );
          rayGrad.addColorStop(0.55, rgba(accent, 0.22 * showcaseStrength));
          rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, rayLen, a - halfSpread, a + halfSpread);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Multi-layer Glowing Aura Orb behind the DigiEgg
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const auraR = (isFlying ? 36 : 52) * eggScale;
      const auraGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, auraR);
      auraGrad.addColorStop(0, `rgba(255, 255, 255, ${(0.9 * eggAlpha).toFixed(3)})`);
      auraGrad.addColorStop(0.38, rgba(goldHex, 0.62 * eggAlpha));
      auraGrad.addColorStop(0.72, rgba(accent, 0.34 * eggAlpha));
      auraGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, auraR, 0, Math.PI * 2);
      ctx.fill();

      // Tilted crystalline orbital ring around the egg during showcase
      if (showcaseStrength > 0.05) {
        ctx.save();
        ctx.rotate(-0.28 + Math.sin(t * 2.4) * 0.08);
        ctx.scale(1, 0.36);
        ctx.strokeStyle = rgba(goldHex, 0.78 * showcaseStrength);
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, 38 * eggScale, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = rgba(accent, 0.6 * showcaseStrength);
        ctx.lineWidth = 1.6;
        ctx.setLineDash([8, 7]);
        ctx.rotate(t * 2.5);
        ctx.beginPath();
        ctx.arc(0, 0, 46 * eggScale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      ctx.restore();

      // 3. The actual Custom DigiEgg PNG Sprite with crisp golden rim glow
      ctx.save();
      ctx.globalAlpha = eggAlpha;
      ctx.rotate(eggTilt);
      const drawSize = 58 * eggScale;
      if (img) {
        ctx.drawImage(img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
      } else {
        // Ultra-brief fallback while image decodes on very first drop
        const fallbackGrad = ctx.createRadialGradient(-6, -8, 3, 0, 0, drawSize * 0.46);
        fallbackGrad.addColorStop(0, '#fef9c3');
        fallbackGrad.addColorStop(0.55, accent);
        fallbackGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = fallbackGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, drawSize * 0.36, drawSize * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
      ctx.restore();

      // 4. Orbiting sparkle stars around the egg
      if (showcaseStrength > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6; i++) {
          const a = t * 3.4 + (i * Math.PI * 2) / 6;
          const rx = 34 * eggScale;
          const ry = 22 * eggScale;
          const sx = Math.cos(a) * rx;
          const sy = Math.sin(a) * ry - 2;
          const twinkle = 0.55 + 0.45 * Math.sin(t * 14 + i * 2.1);
          ctx.fillStyle =
            i % 2 === 0
              ? `rgba(255, 253, 224, ${(twinkle * showcaseStrength).toFixed(3)})`
              : rgba(accent, twinkle * showcaseStrength);
          drawFourPointStar(ctx, sx, sy, 6.2 * twinkle, 1.8 * twinkle, a);
        }
        ctx.restore();
      }

      ctx.restore();

      // 5. Sleek Floating DigiEgg Nameplate Banner right below the hovering egg
      if (t > 0.14 && t < PHASE_HOVER_END + 0.12) {
        const bannerIn = clamp01((t - 0.14) / 0.22);
        const bannerOut =
          t > PHASE_HOVER_END - 0.18
            ? clamp01(1 - (t - (PHASE_HOVER_END - 0.18)) / 0.24)
            : 1;
        const bannerAlpha = bannerIn * bannerOut;

        if (bannerAlpha > 0.02) {
          ctx.save();
          ctx.globalAlpha = bannerAlpha;

          const topTag = '★ DIGIEGG DROPADO! ★';
          const mainLabel = fx.name;

          ctx.font = '900 11.5px "Exo 2", sans-serif';
          const mainW = ctx.measureText(mainLabel).width;
          ctx.font = '900 8.5px "Exo 2", sans-serif';
          const tagW = ctx.measureText(topTag).width;

          const boxW = Math.max(132, Math.max(mainW, tagW) + 28);
          const boxH = 34;
          const bx = Math.max(12, Math.min(viewW - boxW - 12, eggX - boxW / 2));
          const by = eggY + 34;

          // Deep futuristic navy backdrop
          const bgGrad = ctx.createLinearGradient(bx, by, bx, by + boxH);
          bgGrad.addColorStop(0, 'rgba(9, 32, 82, 0.94)');
          bgGrad.addColorStop(1, 'rgba(3, 13, 38, 0.96)');
          ctx.fillStyle = bgGrad;
          ctx.beginPath();
          ctx.roundRect(bx, by, boxW, boxH, 9);
          ctx.fill();

          // Luminous accent border
          ctx.strokeStyle = rgba(accent, 0.95);
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Subtle top sheen line
          ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.fillRect(bx + 10, by + 1.5, boxW - 20, 1);

          // Top golden header
          ctx.textAlign = 'center';
          ctx.font = '900 8.5px "Exo 2", sans-serif';
          ctx.fillStyle = '#fde047';
          ctx.fillText(topTag, bx + boxW / 2, by + 13);

          // Main DigiEgg species name
          ctx.font = '800 11.5px "Exo 2", sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(mainLabel, bx + boxW / 2, by + 27);

          ctx.restore();
        }
      }
    }

    // =========================================================================
    // PHASE 4: ARRIVAL COLLECT BURST RIGHT ON THE BOTTOM-RIGHT MENU/INVENTÁRIO
    // =========================================================================
    if (isArrived) {
      if (!fx.collectedNotified) {
        fx.collectedNotified = true;
        onCollectArrive?.(fx);
      }

      const arriveDuration = Math.max(0.2, total - PHASE_FLY_END);
      const ap = clamp01((t - PHASE_FLY_END) / arriveDuration);
      const fade = 1 - ap;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Expanding radiant collect ring
      const ringR = 16 + ap * 54;
      ctx.strokeStyle = rgba(goldHex, fade * 0.95);
      ctx.lineWidth = 3.6 * fade;
      ctx.beginPath();
      ctx.arc(targetX, targetY, ringR, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary accent shockwave
      const ringR2 = 8 + ap * 38;
      ctx.strokeStyle = rgba(accent, fade * 0.85);
      ctx.lineWidth = 2.2 * fade;
      ctx.beginPath();
      ctx.arc(targetX, targetY, ringR2, 0, Math.PI * 2);
      ctx.stroke();

      // Flash glow core over MENU button
      const flashGrad = ctx.createRadialGradient(targetX, targetY, 2, targetX, targetY, 42 * (1 - ap * 0.4));
      flashGrad.addColorStop(0, `rgba(255, 255, 255, ${(0.95 * fade).toFixed(3)})`);
      flashGrad.addColorStop(0.45, rgba(goldHex, 0.72 * fade));
      flashGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(targetX, targetY, 42, 0, Math.PI * 2);
      ctx.fill();

      // 8 starburst sparks flying out from the MENU button
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI * 2) / 8 + 0.3;
        const dist = 12 + ap * 44;
        const sx = targetX + Math.cos(a) * dist;
        const sy = targetY + Math.sin(a) * dist;
        ctx.fillStyle = i % 2 === 0 ? rgba(goldHex, fade) : rgba(accent, fade);
        drawFourPointStar(ctx, sx, sy, 6.2 * fade, 1.8 * fade, a + ap * 2);
      }
      ctx.restore();

      // Crisp "+1 INVENTÁRIO" floating confirm pill rising above the MENU button
      ctx.save();
      ctx.globalAlpha = clamp01(fade * 1.4);
      const pillY = targetY - 28 - ap * 24;
      ctx.font = '900 10.5px "Exo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(2, 6, 23, 0.95)';
      ctx.lineWidth = 3.2;
      ctx.strokeText('+1 DIGIEGG · INVENTÁRIO', targetX - 24, pillY);
      ctx.fillStyle = '#fde047';
      ctx.fillText('+1 DIGIEGG · INVENTÁRIO', targetX - 24, pillY);
      ctx.restore();
    }
  }
}
