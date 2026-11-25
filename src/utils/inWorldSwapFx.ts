import type { DigimonWorldDimensions } from '../types/digimon';

export interface InWorldSwapAnimationState {
  fromFormId: string;
  toFormId: string;
  toName: string;
  fromAccentHex: string;
  toAccentHex: string;
  elapsed: number;
  duration: number;
  /** Exact progress (0..1) where the outgoing Digimon swaps to the incoming Digimon */
  swapPoint: number;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = (hex || '#22d3ee').replace('#', '').trim();
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
  return { r: 34, g: 211, b: 238 };
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(alpha).toFixed(3)})`;
}

function drawFourPointSpark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outerR: number,
  innerR: number,
  rot = 0
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
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

/**
 * Distinct Digivice Quantum-Transfer sprite transform for Partner Swapping:
 * - Phase 1 (0..swapPoint): Outgoing Digimon digitizes upward into a cyber-cyan
 *   data beam (stretches vertically & narrows smoothly while dissolving).
 * - Phase 2 (swapPoint..1): Incoming Digimon materializes down from the Digivice
 *   portal with a crisp elastic landing bounce & bright holographic flash.
 */
export function getInWorldSwapSpriteTransform(anim: InWorldSwapAnimationState): {
  liftY: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
} {
  const t = clamp01(anim.elapsed / Math.max(0.1, anim.duration));
  const swap = anim.swapPoint;

  if (t < swap) {
    const p = t / Math.max(0.01, swap);
    const easeIn = p * p;
    return {
      liftY: -easeIn * 28,
      scaleX: Math.max(0.14, 1 - easeIn * 0.86),
      scaleY: 1 + easeIn * 0.46,
      alpha: Math.max(0, 1 - Math.pow(p, 1.5)),
    };
  }

  const post = (t - swap) / Math.max(0.01, 1 - swap);
  if (post < 0.34) {
    const m = post / 0.34;
    const easeOut = 1 - Math.pow(1 - m, 3);
    return {
      liftY: -(1 - easeOut) * 30,
      scaleX: 0.22 + easeOut * 0.9,
      scaleY: 1.36 - easeOut * 0.42,
      alpha: Math.min(1, m * 1.45),
    };
  }

  const settle = (post - 0.34) / 0.66;
  const bounce = Math.sin(settle * Math.PI) * 0.095 * (1 - settle);
  return {
    liftY: 0,
    scaleX: 1 + bounce,
    scaleY: 1 - bounce,
    alpha: 1,
  };
}

/**
 * BACK layer of the Partner Swap Digivice Quantum Transfer FX
 * (visually distinct from the golden-yellow Digivolution helix):
 * - Hexagonal Digivice Teleport Pad with dual counter-spinning tech rings & 6 corner nodes
 * - Vertical holographic cyan-emerald/partner-accent transfer cylinder & core beam
 * - Dual counter-sweeping cybernetic orbital ribbons
 */
export function drawInWorldSwapBackLayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dims: DigimonWorldDimensions,
  anim: InWorldSwapAnimationState
): void {
  const t = clamp01(anim.elapsed / Math.max(0.1, anim.duration));
  const swap = anim.swapPoint;
  const envelope =
    t < 0.1
      ? t / 0.1
      : t > 0.78
        ? Math.max(0, (1 - t) / 0.22)
        : 1;

  const baseR = Math.max(36, dims.widthPx * 0.62);
  const beamH = Math.max(130, dims.heightPx * 1.8);
  const beamW = Math.max(44, dims.widthPx * 0.72);
  const activeAccent = t < swap ? anim.fromAccentHex : anim.toAccentHex;
  const cyanHex = '#22d3ee';
  const mintHex = '#34d399';

  ctx.save();

  // 1. Isometric Hexagonal Digivice Teleport Pad on the ground
  const padScale =
    t < swap
      ? 0.55 + (t / swap) * 0.52
      : 1.07 + ((t - swap) / (1 - swap)) * 0.14;
  const rx = baseR * padScale;

  ctx.save();
  ctx.translate(x, y + 2);
  ctx.scale(1, 0.42);

  // Soft glowing quantum portal well
  const poolGrad = ctx.createRadialGradient(0, 0, rx * 0.08, 0, 0, rx * 1.38);
  poolGrad.addColorStop(0, 'rgba(224, 255, 250, 0.72)');
  poolGrad.addColorStop(0.42, rgba(activeAccent, 0.48));
  poolGrad.addColorStop(0.75, 'rgba(34, 211, 238, 0.28)');
  poolGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.globalAlpha = envelope * 0.95;
  ctx.fillStyle = poolGrad;
  ctx.beginPath();
  ctx.arc(0, 0, rx * 1.38, 0, Math.PI * 2);
  ctx.fill();

  // Outer rotating hexagonal Digivice circuit frame + glowing vertex nodes
  const spinHex = anim.elapsed * 2.25;
  ctx.strokeStyle = cyanHex;
  ctx.lineWidth = 2.6;
  ctx.globalAlpha = envelope * 0.92;
  ctx.beginPath();
  const hexVerts: Array<[number, number]> = [];
  for (let i = 0; i < 6; i++) {
    const a = spinHex + (i * Math.PI * 2) / 6;
    const vx = Math.cos(a) * rx;
    const vy = Math.sin(a) * rx;
    hexVerts.push([vx, vy]);
    if (i === 0) ctx.moveTo(vx, vy);
    else ctx.lineTo(vx, vy);
  }
  ctx.closePath();
  ctx.stroke();

  // Vertex crystal nodes on the hex corners
  ctx.fillStyle = '#ffffff';
  for (const [vx, vy] of hexVerts) {
    ctx.beginPath();
    ctx.arc(vx, vy, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Secondary inner hex counter-rotating in partner accent
  ctx.strokeStyle = activeAccent;
  ctx.lineWidth = 1.9;
  ctx.globalAlpha = envelope * 0.85;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = -spinHex * 1.35 + (i * Math.PI * 2) / 6;
    const vx = Math.cos(a) * rx * 0.78;
    const vy = Math.sin(a) * rx * 0.78;
    if (i === 0) ctx.moveTo(vx, vy);
    else ctx.lineTo(vx, vy);
  }
  ctx.closePath();
  ctx.stroke();

  // Inner counter-spinning segmented mint data ring
  ctx.strokeStyle = mintHex;
  ctx.lineWidth = 2.2;
  ctx.globalAlpha = envelope * 0.88;
  const dashCount = 8;
  for (let i = 0; i < dashCount; i++) {
    const a0 = -anim.elapsed * 4.1 + (i * Math.PI * 2) / dashCount;
    ctx.beginPath();
    ctx.arc(0, 0, rx * 0.54, a0, a0 + 0.45);
    ctx.stroke();
  }

  ctx.restore();

  // 2. Vertical Quantum Teleport Cylinder (color-shifts from outgoing to incoming partner)
  const distSwap = Math.abs(t - swap);
  const beamIntensity = Math.max(0.24, 1 - distSwap * 1.55) * envelope;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = beamIntensity * 0.78;

  const colGrad = ctx.createLinearGradient(x, y, x, y - beamH);
  colGrad.addColorStop(0, mintHex);
  colGrad.addColorStop(0.32, cyanHex);
  colGrad.addColorStop(0.68, activeAccent);
  colGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
  ctx.fillStyle = colGrad;
  ctx.fillRect(x - beamW * 0.46, y - beamH, beamW * 0.92, beamH + 4);

  // Crisp luminous inner plasma core ribbon
  const coreW = beamW * (0.18 + Math.max(0, 0.3 - distSwap) * 0.82);
  const coreGrad = ctx.createLinearGradient(x, y, x, y - beamH * 0.92);
  coreGrad.addColorStop(0, '#ffffff');
  coreGrad.addColorStop(0.5, 'rgba(167, 243, 208, 0.9)');
  coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = coreGrad;
  ctx.fillRect(x - coreW * 0.5, y - beamH * 0.92, coreW, beamH * 0.92 + 2);

  // 3. Back-arc cyber orbital rings circling vertically around the beam
  const ringCount = 3;
  for (let r = 0; r < ringCount; r++) {
    const phase = (anim.elapsed * 1.8 + r / ringCount) % 1;
    const progress = t < swap ? phase : 1 - phase;
    const ringY = y - progress * beamH * 0.78;
    const ringAlpha = Math.sin(phase * Math.PI) * envelope * 0.62;
    if (ringAlpha <= 0.02) continue;
    const ringR = baseR * (0.72 + Math.sin(phase * Math.PI) * 0.25);
    ctx.strokeStyle = r % 2 === 0 ? cyanHex : activeAccent;
    ctx.lineWidth = 2.0;
    ctx.globalAlpha = ringAlpha;
    ctx.beginPath();
    ctx.ellipse(x, ringY, ringR, ringR * 0.28, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore();
}

/**
 * FRONT layer of the Partner Swap Digivice Quantum Transfer FX:
 * - Sweeping holographic scanner rings (upward during recall, downward during materialize)
 * - Rising & cascading digital matrix squares + four-point cyan/emerald/partner sparkles
 * - Crisp holographic diamond prism burst & cross-flare right at swapPoint
 * - Post-swap dual mint-cyan arrival shockwaves + sleek floating incoming partner nameplate
 */
export function drawInWorldSwapFrontLayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dims: DigimonWorldDimensions,
  anim: InWorldSwapAnimationState
): void {
  const t = clamp01(anim.elapsed / Math.max(0.1, anim.duration));
  const swap = anim.swapPoint;
  const envelope =
    t < 0.08
      ? t / 0.08
      : t > 0.78
        ? Math.max(0, (1 - t) / 0.22)
        : 1;

  const baseR = Math.max(36, dims.widthPx * 0.62);
  const beamH = Math.max(130, dims.heightPx * 1.8);
  const bodyCenterY = y - dims.heightPx * 0.5;
  const activeAccent = t < swap ? anim.fromAccentHex : anim.toAccentHex;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // 1. Horizontal Holographic Scanner Ring sweeping over the Digimon
  if (t < swap) {
    const p = t / Math.max(0.01, swap);
    const scanY = y - p * dims.heightPx * 1.2;
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 3.0;
    ctx.globalAlpha = (1 - p * 0.3) * 0.95;
    ctx.beginPath();
    ctx.ellipse(x, scanY, baseR * 0.96, baseR * 0.28, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner bright scanline disc
    ctx.fillStyle = rgba(anim.fromAccentHex, (1 - p * 0.35) * 0.28);
    ctx.fill();
  } else {
    const post = (t - swap) / Math.max(0.01, 1 - swap);
    const scanY = y - dims.heightPx * 1.2 * (1 - Math.min(1, post * 1.55));
    const fade = Math.max(0, 1 - post * 1.3);
    if (fade > 0.02) {
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3.0 * fade;
      ctx.globalAlpha = fade * 0.96;
      ctx.beginPath();
      ctx.ellipse(
        x,
        scanY,
        baseR * (0.86 + post * 0.34),
        baseR * 0.28,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.fillStyle = rgba(anim.toAccentHex, fade * 0.24);
      ctx.fill();
    }
  }

  // 2. Digital Matrix Data Squares & Sparkling Cyber Motes (20 crisp particles)
  for (let i = 0; i < 20; i++) {
    const seed = i * 1.6180339;
    const cycle = (t * 2.25 + (seed % 1)) % 1;
    const dirProgress = t < swap ? cycle : 1 - cycle;
    const lane = ((i % 9) - 4) / 4;
    const px = x + lane * baseR * 0.98 + Math.sin(anim.elapsed * 9 + i) * 4.5;
    const py = y - dirProgress * beamH * 0.94;
    const alpha = Math.sin(cycle * Math.PI) * envelope;
    if (alpha <= 0.02) continue;

    ctx.globalAlpha = alpha * 0.94;
    ctx.fillStyle =
      i % 4 === 0
        ? '#ffffff'
        : i % 4 === 1
          ? '#34d399'
          : i % 4 === 2
            ? '#22d3ee'
            : activeAccent;

    if (i % 5 === 0) {
      drawFourPointSpark(ctx, px, py, 5.2, 1.5, anim.elapsed * 5 + i);
    } else {
      const size = 2.8 + (i % 3) * 1.45;
      ctx.fillRect(px - size / 2, py - size / 2, size, size);
    }
  }

  // 3. Swap Moment Holographic Diamond Prism Burst (t ≈ swapPoint)
  const distSwap = Math.abs(t - swap);
  const flashWin = 0.2;
  if (distSwap < flashWin) {
    const f = 1 - distSwap / flashWin;
    const intensity = f * f;
    const orbR = Math.max(40, dims.heightPx * 0.6) * (0.78 + (1 - f) * 0.56);

    const orbGrad = ctx.createRadialGradient(
      x,
      bodyCenterY,
      2,
      x,
      bodyCenterY,
      orbR * 1.3
    );
    orbGrad.addColorStop(0, '#ffffff');
    orbGrad.addColorStop(0.32, 'rgba(103, 232, 249, 0.95)');
    orbGrad.addColorStop(0.64, rgba(anim.toAccentHex, 0.72));
    orbGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.globalAlpha = intensity * 0.96;
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(x, bodyCenterY, orbR * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Expanding crisp holographic diamond outline
    const diaR = orbR * (0.65 + (1 - f) * 0.95);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.4, 3.0 * f);
    ctx.globalAlpha = intensity * 0.92;
    ctx.beginPath();
    ctx.moveTo(x, bodyCenterY - diaR);
    ctx.lineTo(x + diaR * 0.85, bodyCenterY);
    ctx.lineTo(x, bodyCenterY + diaR);
    ctx.lineTo(x - diaR * 0.85, bodyCenterY);
    ctx.closePath();
    ctx.stroke();

    // Crisp horizontal + vertical transfer star flare
    const flareLen = orbR * (1.5 + intensity * 0.75);
    const flareW = orbR * 0.14;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = intensity;
    ctx.beginPath();
    ctx.moveTo(x - flareLen, bodyCenterY);
    ctx.lineTo(x, bodyCenterY - flareW);
    ctx.lineTo(x + flareLen, bodyCenterY);
    ctx.lineTo(x, bodyCenterY + flareW);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x, bodyCenterY - flareLen * 0.78);
    ctx.lineTo(x + flareW * 0.9, bodyCenterY);
    ctx.lineTo(x, bodyCenterY + flareLen * 0.78);
    ctx.lineTo(x - flareW * 0.9, bodyCenterY);
    ctx.closePath();
    ctx.fill();
  }

  // 4. Post-Swap Expanding Mint-Cyan Arrival Shockwaves + Orbiting Arrival Stars
  if (t >= swap) {
    const post = (t - swap) / Math.max(0.01, 1 - swap);
    const waveAlpha = Math.max(0, 1 - post * 1.25);
    if (waveAlpha > 0.02) {
      const shockR = baseR * (0.58 + post * 1.65);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = Math.max(1.2, 3.6 * waveAlpha);
      ctx.globalAlpha = waveAlpha * 0.92;
      ctx.beginPath();
      ctx.ellipse(x, y - 3, shockR, shockR * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();

      const shockR2 = baseR * (0.4 + post * 1.22);
      ctx.strokeStyle = anim.toAccentHex || '#67e8f9';
      ctx.lineWidth = Math.max(1.0, 2.4 * waveAlpha);
      ctx.globalAlpha = waveAlpha * 0.82;
      ctx.beginPath();
      ctx.ellipse(x, y - 9, shockR2, shockR2 * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 6 sparkling arrival glyphs bursting outward
      for (let i = 0; i < 6; i++) {
        const a = post * 2.4 + (i * Math.PI * 2) / 6;
        const dist = baseR * (0.55 + post * 0.85);
        const sx = x + Math.cos(a) * dist;
        const sy = bodyCenterY + Math.sin(a) * dist * 0.55;
        ctx.globalAlpha = waveAlpha * 0.95;
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : anim.toAccentHex;
        drawFourPointSpark(ctx, sx, sy, 5.5 * waveAlpha, 1.6 * waveAlpha, a);
      }
    }
  }

  ctx.restore();

  // 5. Sleek Floating Holographic Tag-In Banner right above arriving Digimon
  if (t >= swap && anim.toName) {
    const post = (t - swap) / Math.max(0.01, 1 - swap);
    const fadeIn = clamp01(post / 0.18);
    const fadeOut = post > 0.68 ? clamp01(1 - (post - 0.68) / 0.32) : 1;
    const bannerAlpha = fadeIn * fadeOut;

    if (bannerAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = bannerAlpha;
      const tagY = y - dims.heightPx - 24 - post * 14;
      const label = `✦ ${anim.toName.toUpperCase()} ✦`;
      ctx.font = '900 10.5px "Exo 2", sans-serif';
      ctx.textAlign = 'center';
      const w = Math.max(92, ctx.measureText(label).width + 20);
      const h = 20;
      const bx = x - w / 2;
      const by = tagY - h / 2;

      ctx.fillStyle = 'rgba(3, 15, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(bx, by, w, h, 7);
      ctx.fill();

      ctx.strokeStyle = anim.toAccentHex || '#34d399';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.fillStyle = '#e0f2fe';
      ctx.fillText(label, x, tagY + 3.5);
      ctx.restore();
    }
  }
}
