import type { DigimonWorldDimensions } from '../types/digimon';

export interface InWorldEvoAnimationState {
  fromFormId: string;
  toFormId: string;
  accentHex: string;
  glowRgba: string;
  elapsed: number;
  duration: number;
  isUpgrade: boolean;
  /** Progress threshold (0..1) where the Digimon sprite swaps into the evolved form */
  swapPoint: number;
}

/**
 * Computes subtle vertical levitation and elastic emergence scale right on the Digimon
 * during its in-world digivolution sequence (no screen overlay).
 */
export function getInWorldEvoSpriteTransform(anim: InWorldEvoAnimationState): {
  liftY: number;
  scaleX: number;
  scaleY: number;
  silhouetteFlashAlpha: number;
} {
  const t = Math.max(0, Math.min(1, anim.elapsed / Math.max(0.1, anim.duration)));
  const swap = anim.swapPoint;

  if (!anim.isUpgrade) {
    // Sleek quick revert pulse
    const peak = Math.sin(t * Math.PI);
    return {
      liftY: -peak * 8,
      scaleX: 1 - peak * 0.06,
      scaleY: 1 + peak * 0.06,
      silhouetteFlashAlpha: Math.pow(peak, 2.2) * 0.72,
    };
  }

  if (t < swap) {
    // Phase 1: Energetic hover charge + rhythmic convergence
    const p = t / swap;
    const easeIn = p * p;
    const pulse = Math.sin(p * Math.PI * 6) * 0.03 * p;
    return {
      liftY: -easeIn * 16 - Math.sin(p * Math.PI) * 5,
      scaleX: 1 - easeIn * 0.14 + pulse,
      scaleY: 1 + easeIn * 0.16 - pulse,
      silhouetteFlashAlpha: Math.min(0.95, Math.pow(p, 1.8) * 0.95),
    };
  }

  // Phase 2 & 3: Majestic radiant emergence into evolved form
  const post = (t - swap) / Math.max(0.01, 1 - swap);
  const elastic =
    post < 0.3
      ? 0.82 + (post / 0.3) * 0.28 // pops smoothly from 0.82 -> 1.10
      : 1.1 - ((post - 0.3) / 0.7) * 0.1; // settles crisply 1.10 -> 1.00
  const settleLift = -Math.max(0, 1 - post * 1.45) * 18;
  const flashFade = Math.max(0, 1 - post * 2.3);

  return {
    liftY: settleLift,
    scaleX: elastic,
    scaleY: elastic,
    silhouetteFlashAlpha: flashFade * flashFade * 0.95,
  };
}

/**
 * Draws the BACK layer of the in-world Digivolution effect (directly behind/under the Digimon):
 * - Rotating holographic isometric Digi-Crest magic circle on the ground
 * - Tapered vertical pillar of translucent digital light (strictly localized to the Digimon)
 * - Back arcs of twin spiraling DNA / Data helices
 */
export function drawInWorldEvoBackLayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dims: DigimonWorldDimensions,
  anim: InWorldEvoAnimationState
): void {
  const t = Math.max(0, Math.min(1, anim.elapsed / Math.max(0.1, anim.duration)));
  const swap = anim.swapPoint;
  const envelope =
    t < 0.12
      ? t / 0.12
      : t > 0.78
        ? Math.max(0, (1 - t) / 0.22)
        : 1;

  const baseR = Math.max(36, dims.widthPx * 0.62);
  const beamH = Math.max(135, dims.heightPx * 1.85);
  const beamW = Math.max(46, dims.widthPx * 0.78);
  const primaryColor = anim.isUpgrade ? '#fde047' : '#38e8ff';
  const secondaryColor = anim.isUpgrade ? anim.accentHex : '#a78bfa';

  ctx.save();

  // 1. Soft luminous ground energy pool + Isometric Digi-Crest Circle
  const ringExpand = anim.isUpgrade
    ? t < swap
      ? 0.72 + (t / swap) * 0.38
      : 1.1 + ((t - swap) / (1 - swap)) * 0.24
    : 0.85 + Math.sin(t * Math.PI) * 0.2;
  const rx = baseR * ringExpand;
  const ry = rx * 0.38;

  ctx.save();
  ctx.translate(x, y + 2);

  // Soft radial pool under feet
  const poolGrad = ctx.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx * 1.35);
  poolGrad.addColorStop(0, anim.isUpgrade ? 'rgba(254, 240, 138, 0.52)' : 'rgba(56, 232, 255, 0.45)');
  poolGrad.addColorStop(0.55, anim.glowRgba);
  poolGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.globalAlpha = envelope * 0.9;
  ctx.scale(1, 0.42);
  ctx.fillStyle = poolGrad;
  ctx.beginPath();
  ctx.arc(0, 0, rx * 1.35, 0, Math.PI * 2);
  ctx.fill();

  // Outer rotating segmented cyber ring (12 precision tech arcs)
  const spinA = anim.elapsed * (anim.isUpgrade ? 2.6 : -3.0);
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = primaryColor;
  ctx.globalAlpha = envelope * 0.92;
  const segments = 12;
  for (let i = 0; i < segments; i++) {
    const a0 = spinA + (i * Math.PI * 2) / segments;
    const a1 = a0 + (Math.PI * 2) / segments - 0.14;
    ctx.beginPath();
    ctx.arc(0, 0, rx, a0, a1);
    ctx.stroke();
  }

  // Counter-rotating inner octagonal crest + glowing vertex nodes
  const spinB = -anim.elapsed * 3.4;
  const innerR = rx * 0.72;
  ctx.strokeStyle = '#38e8ff';
  ctx.lineWidth = 1.9;
  ctx.globalAlpha = envelope * 0.85;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = spinB + (i * Math.PI * 2) / 8;
    const vx = Math.cos(a) * innerR;
    const vy = Math.sin(a) * innerR;
    if (i === 0) ctx.moveTo(vx, vy);
    else ctx.lineTo(vx, vy);
  }
  ctx.closePath();
  ctx.stroke();

  // Crisp glowing nodes at vertices
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 8; i++) {
    const a = spinB + (i * Math.PI * 2) / 8;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * innerR, Math.sin(a) * innerR, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 2. Tapered Vertical Pillar of Digital Light (strictly centered on Digimon, never blocks screen)
  if (anim.isUpgrade) {
    const beamAlpha =
      t < swap
        ? Math.pow(t / swap, 0.8) * 0.62
        : Math.max(0, 1 - (t - swap) / (1 - swap)) * 0.72;
    if (beamAlpha > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = beamAlpha;

      // Outer feathered cyan/elemental beam
      const outerGrad = ctx.createLinearGradient(x, y, x, y - beamH);
      outerGrad.addColorStop(0, secondaryColor);
      outerGrad.addColorStop(0.45, '#38e8ff');
      outerGrad.addColorStop(1, 'rgba(56, 232, 255, 0)');
      ctx.fillStyle = outerGrad;
      ctx.beginPath();
      ctx.moveTo(x - beamW * 0.56, y + 4);
      ctx.lineTo(x + beamW * 0.56, y + 4);
      ctx.lineTo(x + beamW * 0.24, y - beamH);
      ctx.lineTo(x - beamW * 0.24, y - beamH);
      ctx.closePath();
      ctx.fill();

      // Inner bright white-gold core column
      const coreGrad = ctx.createLinearGradient(x, y, x, y - beamH * 0.85);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.5, '#fef08a');
      coreGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.moveTo(x - beamW * 0.24, y + 2);
      ctx.lineTo(x + beamW * 0.24, y + 2);
      ctx.lineTo(x + beamW * 0.08, y - beamH * 0.85);
      ctx.lineTo(x - beamW * 0.08, y - beamH * 0.85);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // 3. Back-half of Twin Spiraling DNA / Data Helices (depth < 0 -> behind Digimon)
  drawDataHelixHalf(ctx, x, y, rx * 0.88, beamH * 0.82, anim, envelope, primaryColor, '#38e8ff', false);

  ctx.restore();
}

/**
 * Draws the FRONT layer of the in-world Digivolution effect (directly in front of the Digimon):
 * - Front arcs of twin spiraling DNA / Data helices
 * - Rising digital data cubes & luminous sparks
 * - Climax diamond prism flare + blinding core silhouette flash at exact swap moment
 * - Expanding isometric shockwave rings & prism shards on reveal
 */
export function drawInWorldEvoFrontLayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dims: DigimonWorldDimensions,
  anim: InWorldEvoAnimationState
): void {
  const t = Math.max(0, Math.min(1, anim.elapsed / Math.max(0.1, anim.duration)));
  const swap = anim.swapPoint;
  const envelope =
    t < 0.1
      ? t / 0.1
      : t > 0.78
        ? Math.max(0, (1 - t) / 0.22)
        : 1;

  const baseR = Math.max(36, dims.widthPx * 0.62);
  const beamH = Math.max(135, dims.heightPx * 1.85);
  const bodyCenterY = y - dims.heightPx * 0.52;
  const primaryColor = anim.isUpgrade ? '#fde047' : '#38e8ff';
  const secondaryColor = anim.isUpgrade ? anim.accentHex : '#a78bfa';

  ctx.save();

  // 1. Front-half of Twin Spiraling DNA / Data Helices (depth >= 0 -> wraps in front of Digimon)
  drawDataHelixHalf(ctx, x, y, baseR * 0.88, beamH * 0.82, anim, envelope, primaryColor, '#38e8ff', true);

  // 2. Rising Luminous Digital Cubes & Data Sparks (18 deterministic particles)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const count = anim.isUpgrade ? 18 : 10;
  for (let i = 0; i < count; i++) {
    const seed = i * 1.6180339;
    const cycle = (t * (anim.isUpgrade ? 1.85 : 1.35) + (seed % 1)) % 1;
    const angle = seed * 6.283 + anim.elapsed * (i % 2 === 0 ? 3.2 : -2.8);
    const radius = baseR * (0.35 + ((i * 37) % 100) / 135) * (1 - cycle * 0.35);
    const px = x + Math.cos(angle) * radius;
    const py = y - cycle * beamH * 0.92 + Math.sin(angle) * 6;
    const pAlpha = Math.sin(cycle * Math.PI) * envelope;
    if (pAlpha <= 0.02) continue;

    const size = (2.6 + (i % 3) * 1.5) * (1 - cycle * 0.35);
    ctx.globalAlpha = pAlpha * 0.95;
    ctx.fillStyle = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? primaryColor : secondaryColor;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle + anim.elapsed * 4);
    // Crisp rotated digital diamond/pixel square
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  }
  ctx.restore();

  // 3. Climax Morph Singularity Starburst & Silhouette Core Flash right at t ≈ swapPoint
  const distFromSwap = Math.abs(t - swap);
  const flashWindow = anim.isUpgrade ? 0.17 : 0.22;
  if (distFromSwap < flashWindow) {
    const f = 1 - distFromSwap / flashWindow;
    const intensity = f * f;
    const coreR = Math.max(42, dims.heightPx * 0.62) * (0.75 + (1 - f) * 0.55);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Bright radiant orb centered right on the Digimon's body
    const orbGrad = ctx.createRadialGradient(x, bodyCenterY, 2, x, bodyCenterY, coreR * 1.35);
    orbGrad.addColorStop(0, '#ffffff');
    orbGrad.addColorStop(0.32, anim.isUpgrade ? 'rgba(254, 240, 138, 0.95)' : 'rgba(125, 211, 252, 0.9)');
    orbGrad.addColorStop(0.68, anim.glowRgba);
    orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.globalAlpha = intensity * 0.98;
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(x, bodyCenterY, coreR * 1.35, 0, Math.PI * 2);
    ctx.fill();

    // Crisp 4-point + 4-point Anamorphic Prism Star Flare
    const rayLong = coreR * (1.55 + intensity * 0.75);
    const rayShort = coreR * 0.16;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = intensity;
    for (let r = 0; r < 2; r++) {
      ctx.save();
      ctx.translate(x, bodyCenterY);
      ctx.rotate(r === 0 ? 0 : Math.PI / 4);
      const len = r === 0 ? rayLong : rayLong * 0.62;
      const wid = r === 0 ? rayShort : rayShort * 0.65;
      // Horizontal diamond spike
      ctx.beginPath();
      ctx.moveTo(-len, 0);
      ctx.lineTo(0, -wid);
      ctx.lineTo(len, 0);
      ctx.lineTo(0, wid);
      ctx.closePath();
      ctx.fill();
      // Vertical diamond spike
      ctx.beginPath();
      ctx.moveTo(0, -len * 0.92);
      ctx.lineTo(wid, 0);
      ctx.lineTo(0, len * 0.92);
      ctx.lineTo(-wid, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  // 4. Post-Morph Expanding Double Shockwave Ring & Radiant Prism Shards
  if (t >= swap) {
    const post = (t - swap) / Math.max(0.01, 1 - swap);
    const waveAlpha = Math.max(0, 1 - post * 1.25);

    if (waveAlpha > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      // Primary golden-white isometric shockwave ripple
      const shockR = baseR * (0.65 + post * 1.75);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = Math.max(1.2, 4.2 * waveAlpha);
      ctx.globalAlpha = waveAlpha * 0.95;
      ctx.beginPath();
      ctx.ellipse(x, y - 4, shockR, shockR * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary cyan ascending halo ring sweeping up past the evolved Digimon!
      const riseY = y - post * dims.heightPx * 1.18;
      const haloR = baseR * (0.92 + post * 0.48);
      ctx.strokeStyle = '#38e8ff';
      ctx.lineWidth = Math.max(1, 2.8 * waveAlpha);
      ctx.globalAlpha = waveAlpha * 0.82;
      ctx.beginPath();
      ctx.ellipse(x, riseY, haloR, haloR * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 14 Radiant Prism Shards bursting outward from body center on Upgrade
      if (anim.isUpgrade) {
        const shardFade = Math.max(0, 1 - post * 1.35);
        if (shardFade > 0.02) {
          for (let i = 0; i < 14; i++) {
            const a = (i * Math.PI * 2) / 14 + 0.22;
            const speed = 0.72 + (i % 3) * 0.28;
            const dist = post * baseR * 1.65 * speed;
            const sx = x + Math.cos(a) * dist;
            const sy = bodyCenterY + Math.sin(a) * dist * 0.78 - post * 18;
            const len = (9 + (i % 3) * 4) * shardFade;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(a);
            ctx.globalAlpha = shardFade * 0.92;
            ctx.fillStyle = i % 2 === 0 ? '#ffffff' : i % 3 === 0 ? secondaryColor : '#fde047';
            ctx.beginPath();
            ctx.moveTo(len, 0);
            ctx.lineTo(0, 2.3);
            ctx.lineTo(-len * 0.55, 0);
            ctx.lineTo(0, -2.3);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }
      }
      ctx.restore();
    }
  }

  ctx.restore();
}

function drawDataHelixHalf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  height: number,
  anim: InWorldEvoAnimationState,
  envelope: number,
  colorA: string,
  colorB: string,
  frontHalf: boolean
): void {
  const t = Math.max(0, Math.min(1, anim.elapsed / Math.max(0.1, anim.duration)));
  const spin = anim.elapsed * (anim.isUpgrade ? 6.8 : -5.2);
  const steps = 28;
  const maxFrac = Math.min(1, t * 2.1);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';

  for (let strand = 0; strand < 2; strand++) {
    const phaseOffset = strand * Math.PI;
    ctx.strokeStyle = strand === 0 ? colorA : colorB;

    for (let i = 0; i < steps; i++) {
      const f0 = (i / steps) * maxFrac;
      const f1 = ((i + 1) / steps) * maxFrac;
      const midF = (f0 + f1) * 0.5;
      const angleMid = spin + midF * Math.PI * 3.4 + phaseOffset;
      const depth = Math.sin(angleMid);
      if (frontHalf ? depth < 0 : depth >= 0) continue;

      const r0 = radius * (1 - f0 * 0.42);
      const r1 = radius * (1 - f1 * 0.42);
      const a0 = spin + f0 * Math.PI * 3.4 + phaseOffset;
      const a1 = spin + f1 * Math.PI * 3.4 + phaseOffset;

      const x0 = x + Math.cos(a0) * r0;
      const y0 = y - f0 * height + Math.sin(a0) * (r0 * 0.24);
      const x1 = x + Math.cos(a1) * r1;
      const y1 = y - f1 * height + Math.sin(a1) * (r1 * 0.24);

      const segAlpha = Math.sin(midF * Math.PI) * envelope * (frontHalf ? 0.92 : 0.48);
      if (segAlpha <= 0.02) continue;

      ctx.globalAlpha = segAlpha;
      ctx.lineWidth = (frontHalf ? 3.2 : 2.1) * (1 - midF * 0.35);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }

  ctx.restore();
}
