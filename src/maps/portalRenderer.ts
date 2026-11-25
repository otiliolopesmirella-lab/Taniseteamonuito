export type DimensionalPortalTheme = 'digital' | 'amethyst' | 'crimson' | 'solar';

interface PortalPalette {
  outerGlowRgb: string;
  vortexPrimary: string;
  vortexSecondary: string;
  vortexCore: string;
  abyssInner: string;
  abyssOuter: string;
  pillarMetalLight: string;
  pillarMetalDark: string;
  conduitGlow: string;
  keystoneGlow: string;
  ringAccent: string;
}

const PORTAL_PALETTES: Record<DimensionalPortalTheme, PortalPalette> = {
  digital: {
    outerGlowRgb: '56, 232, 255',
    vortexPrimary: '#38e8ff',
    vortexSecondary: '#3b82f6',
    vortexCore: '#e0faff',
    abyssInner: '#0c4a9e',
    abyssOuter: '#030b26',
    pillarMetalLight: '#cbd5e1',
    pillarMetalDark: '#1e293b',
    conduitGlow: '#38e8ff',
    keystoneGlow: '#7dd3fc',
    ringAccent: '#67e8f9',
  },
  amethyst: {
    outerGlowRgb: '192, 132, 252',
    vortexPrimary: '#c084fc',
    vortexSecondary: '#38bdf8',
    vortexCore: '#f5d0fe',
    abyssInner: '#4c1d95',
    abyssOuter: '#0c0524',
    pillarMetalLight: '#d8b4fe',
    pillarMetalDark: '#1e1b4b',
    conduitGlow: '#e879f9',
    keystoneGlow: '#c084fc',
    ringAccent: '#a855f7',
  },
  crimson: {
    outerGlowRgb: '244, 63, 94',
    vortexPrimary: '#fb7185',
    vortexSecondary: '#a855f7',
    vortexCore: '#ffe4e6',
    abyssInner: '#881337',
    abyssOuter: '#140312',
    pillarMetalLight: '#cbd5e1',
    pillarMetalDark: '#1f1224',
    conduitGlow: '#fb7185',
    keystoneGlow: '#fda4af',
    ringAccent: '#f43f5e',
  },
  solar: {
    outerGlowRgb: '56, 210, 255',
    vortexPrimary: '#38e8ff',
    vortexSecondary: '#f59e0b',
    vortexCore: '#fef9c3',
    abyssInner: '#0e4f7a',
    abyssOuter: '#08142b',
    pillarMetalLight: '#e2e8f0',
    pillarMetalDark: '#1e293b',
    conduitGlow: '#fbbf24',
    keystoneGlow: '#fde047',
    ringAccent: '#38e8ff',
  },
};

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

/**
 * Draws the radiant floor illumination pool, recessed metallic dais, and animated
 * dimensional floor rings beneath a real upright portal gateway.
 */
export function drawDimensionalPortalGround(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  elapsed: number,
  isNearby: boolean,
  options?: {
    scale?: number;
    theme?: DimensionalPortalTheme;
  }
): void {
  const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const scale = options?.scale ?? 1;
  const palette = PORTAL_PALETTES[options?.theme ?? 'digital'];
  const pulse = 1 + Math.sin(safeElapsed * 3.2) * 0.05;

  ctx.save();
  ctx.translate(x, y);

  // 1. Wide ambient energy pool spilling across ground tiles
  const spillGrad = ctx.createRadialGradient(0, 4 * scale, 10 * scale, 0, 4 * scale, 118 * scale * pulse);
  spillGrad.addColorStop(
    0,
    isNearby
      ? 'rgba(253, 224, 71, 0.44)'
      : `rgba(${palette.outerGlowRgb}, 0.42)`
  );
  spillGrad.addColorStop(0.45, `rgba(${palette.outerGlowRgb}, 0.18)`);
  spillGrad.addColorStop(1, `rgba(${palette.outerGlowRgb}, 0)`);
  ctx.fillStyle = spillGrad;
  ctx.beginPath();
  ctx.ellipse(0, 6 * scale, 118 * scale * pulse, 50 * scale * pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Contact ground shadow under the stone/metallic archway plinth
  ctx.fillStyle = 'rgba(2, 6, 20, 0.56)';
  ctx.beginPath();
  ctx.ellipse(0, 6 * scale, 78 * scale, 29 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Stepped cyber-stone circular base dais
  const daisGrad = ctx.createLinearGradient(-72 * scale, -18 * scale, 72 * scale, 26 * scale);
  daisGrad.addColorStop(0, '#1e293b');
  daisGrad.addColorStop(0.5, '#334155');
  daisGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = daisGrad;
  ctx.beginPath();
  ctx.ellipse(0, 2 * scale, 72 * scale, 26 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isNearby ? '#fde047' : palette.conduitGlow;
  ctx.lineWidth = (isNearby ? 2.6 : 1.9) * scale;
  ctx.stroke();

  // Inner luminous energy well on the floor dais
  const wellGrad = ctx.createRadialGradient(0, 2 * scale, 4 * scale, 0, 2 * scale, 54 * scale);
  wellGrad.addColorStop(0, isNearby ? 'rgba(254, 240, 138, 0.85)' : 'rgba(224, 250, 255, 0.82)');
  wellGrad.addColorStop(0.5, `rgba(${palette.outerGlowRgb}, 0.45)`);
  wellGrad.addColorStop(1, 'rgba(3, 11, 38, 0.72)');
  ctx.fillStyle = wellGrad;
  ctx.beginPath();
  ctx.ellipse(0, 2 * scale, 54 * scale, 19 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4. Counter-rotating segmented dimensional rune rings around the plinth
  ctx.save();
  ctx.strokeStyle = isNearby ? '#fef08a' : palette.ringAccent;
  ctx.globalAlpha = isNearby ? 0.92 : 0.72;
  ctx.lineWidth = 2.1 * scale;
  ctx.setLineDash([14 * scale, 10 * scale]);
  ctx.lineDashOffset = -safeElapsed * 28;
  ctx.beginPath();
  ctx.ellipse(0, 3 * scale, 84 * scale * pulse, 32 * scale * pulse, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = isNearby ? '#38e8ff' : '#bae6fd';
  ctx.globalAlpha = 0.52;
  ctx.lineWidth = 1.4 * scale;
  ctx.setLineDash([7 * scale, 12 * scale]);
  ctx.lineDashOffset = safeElapsed * 22;
  ctx.beginPath();
  ctx.ellipse(0, 3 * scale, 62 * scale, 22 * scale, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.restore();
}

/**
 * Draws a true upright 3D-perspective dimensional portal gateway with sculpted
 * metallic archway pillars, a swirling cosmic energy vortex, pulsing ripples,
 * rising digital sparks, and a clean floating nameplate.
 */
export function drawDimensionalPortalGate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  elapsed: number,
  isNearby: boolean,
  options?: {
    scale?: number;
    theme?: DimensionalPortalTheme;
    title?: string;
    subtitle?: string;
  }
): void {
  const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  const s = options?.scale ?? 1;
  const palette = PORTAL_PALETTES[options?.theme ?? 'digital'];
  const pulse = 1 + Math.sin(safeElapsed * 3.4) * 0.04;

  const gateCenterY = y - 66 * s;
  const apertureRx = 43 * s;
  const apertureRy = 62 * s;

  ctx.save();

  // 1. Soft atmospheric back-aura behind the upright portal archway
  const haloGrad = ctx.createRadialGradient(
    x,
    gateCenterY,
    18 * s,
    x,
    gateCenterY,
    102 * s * pulse
  );
  haloGrad.addColorStop(
    0,
    isNearby
      ? 'rgba(253, 224, 71, 0.42)'
      : `rgba(${palette.outerGlowRgb}, 0.36)`
  );
  haloGrad.addColorStop(0.55, `rgba(${palette.outerGlowRgb}, 0.14)`);
  haloGrad.addColorStop(1, `rgba(${palette.outerGlowRgb}, 0)`);
  ctx.fillStyle = haloGrad;
  ctx.beginPath();
  ctx.ellipse(x, gateCenterY, 96 * s * pulse, 108 * s * pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Sculpted outer metallic archway ring (back frame behind the vortex)
  ctx.save();
  const frameGrad = ctx.createLinearGradient(x - 62 * s, gateCenterY - 76 * s, x + 62 * s, y);
  frameGrad.addColorStop(0, palette.pillarMetalLight);
  frameGrad.addColorStop(0.45, '#475569');
  frameGrad.addColorStop(1, palette.pillarMetalDark);

  ctx.fillStyle = frameGrad;
  ctx.beginPath();
  ctx.ellipse(x, gateCenterY, apertureRx + 15 * s, apertureRy + 14 * s, 0, Math.PI * 0.96, Math.PI * 2.04);
  ctx.lineTo(x + apertureRx + 18 * s, y + 3 * s);
  ctx.lineTo(x + apertureRx - 2 * s, y + 3 * s);
  ctx.lineTo(x + apertureRx - 2 * s, gateCenterY);
  ctx.ellipse(x, gateCenterY, apertureRx + 2 * s, apertureRy + 2 * s, 0, 0, Math.PI, true);
  ctx.lineTo(x - apertureRx + 2 * s, y + 3 * s);
  ctx.lineTo(x - apertureRx - 18 * s, y + 3 * s);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = isNearby ? '#fde047' : '#94a3b8';
  ctx.lineWidth = 1.6 * s;
  ctx.stroke();

  // Left & Right grounded metallic anchor feet with glowing conduits
  for (const side of [-1, 1] as const) {
    const footX = x + side * (apertureRx + 8 * s);
    ctx.fillStyle = '#1e293b';
    drawRoundedRectPath(ctx, footX - 13 * s, y - 18 * s, 26 * s, 22 * s, 5 * s);
    ctx.fill();
    ctx.strokeStyle = isNearby ? '#fde047' : palette.conduitGlow;
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();

    // Glowing vertical energy conduit running along each pillar
    ctx.strokeStyle = isNearby ? '#fde047' : palette.conduitGlow;
    ctx.lineWidth = 3 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(footX, y - 14 * s);
    ctx.quadraticCurveTo(
      x + side * (apertureRx + 10 * s),
      gateCenterY - 26 * s,
      x + side * (apertureRx * 0.62),
      gateCenterY - apertureRy - 3 * s
    );
    ctx.stroke();
  }
  ctx.restore();

  // 3. SWIRLING DIMENSIONAL VORTEX INTERIOR (clipped cleanly to the elliptical doorway)
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, gateCenterY, apertureRx, apertureRy, 0, 0, Math.PI * 2);
  ctx.clip();

  // Deep cosmic dimensional backdrop
  const vortexBg = ctx.createRadialGradient(
    x,
    gateCenterY,
    4 * s,
    x,
    gateCenterY,
    apertureRy * 1.05
  );
  vortexBg.addColorStop(0, palette.vortexCore);
  vortexBg.addColorStop(0.24, isNearby ? '#fde047' : palette.vortexPrimary);
  vortexBg.addColorStop(0.58, palette.abyssInner);
  vortexBg.addColorStop(1, palette.abyssOuter);
  ctx.fillStyle = vortexBg;
  ctx.fillRect(x - apertureRx - 4, gateCenterY - apertureRy - 4, (apertureRx + 4) * 2, (apertureRy + 4) * 2);

  // Rotating spiral energy arms (stretched vertically to match elliptical perspective)
  ctx.save();
  ctx.translate(x, gateCenterY);
  ctx.scale(apertureRx / apertureRy, 1);

  const armCount = 6;
  for (let i = 0; i < armCount; i++) {
    const baseAngle = safeElapsed * 1.95 + (i * Math.PI * 2) / armCount;
    ctx.save();
    ctx.rotate(baseAngle);
    ctx.strokeStyle =
      i % 2 === 0
        ? isNearby
          ? 'rgba(254, 240, 138, 0.88)'
          : 'rgba(186, 246, 255, 0.82)'
        : `rgba(${palette.outerGlowRgb}, 0.65)`;
    ctx.lineWidth = (i % 2 === 0 ? 4.2 : 2.8) * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(4 * s, 0);
    ctx.bezierCurveTo(
      18 * s,
      -18 * s,
      44 * s,
      -14 * s,
      apertureRy * 0.94,
      14 * s
    );
    ctx.stroke();
    ctx.restore();
  }

  // Counter-rotating inner filament swirls
  for (let i = 0; i < 4; i++) {
    const innerAngle = -safeElapsed * 2.8 + (i * Math.PI) / 2;
    ctx.save();
    ctx.rotate(innerAngle);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.52)';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.arc(0, 0, (18 + i * 7) * s, 0, Math.PI * 0.72);
    ctx.stroke();
    ctx.restore();
  }

  // 3 expanding concentric dimensional distortion ripples
  for (let r = 0; r < 3; r++) {
    const phase = (safeElapsed * 0.65 + r / 3) % 1;
    const radius = (8 + phase * (apertureRy * 0.92)) * s;
    const alpha = Math.sin(phase * Math.PI) * 0.65;
    ctx.strokeStyle =
      r === 0 && isNearby
        ? `rgba(254, 240, 138, ${alpha.toFixed(3)})`
        : `rgba(224, 250, 255, ${alpha.toFixed(3)})`;
    ctx.lineWidth = (2.4 - phase * 1.4) * s;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Bright pulsing dimensional core singularity
  const corePulse = (14 + Math.sin(safeElapsed * 5.2) * 3) * s;
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, corePulse * 1.8);
  coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
  coreGrad.addColorStop(0.45, isNearby ? 'rgba(254, 240, 138, 0.75)' : `rgba(${palette.outerGlowRgb}, 0.72)`);
  coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, corePulse * 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // end elliptical scale
  ctx.restore(); // end vortex clip

  // 4. Crisp glowing event-horizon rim around the doorway
  ctx.save();
  ctx.strokeStyle = isNearby ? '#fef08a' : palette.vortexCore;
  ctx.lineWidth = (isNearby ? 3.4 : 2.6) * s;
  ctx.shadowColor = isNearby ? '#facc15' : palette.vortexPrimary;
  ctx.shadowBlur = 14 * s;
  ctx.beginPath();
  ctx.ellipse(x, gateCenterY, apertureRx, apertureRy, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 5. Apex Keystone Diamond Crystal at top of the archway
  const apexY = gateCenterY - apertureRy - 11 * s;
  const gemBob = Math.sin(safeElapsed * 3.4) * 2.2 * s;
  ctx.save();
  ctx.translate(x, apexY + gemBob);
  ctx.fillStyle = isNearby ? '#fef08a' : palette.keystoneGlow;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.moveTo(0, -11 * s);
  ctx.lineTo(8 * s, 0);
  ctx.lineTo(0, 11 * s);
  ctx.lineTo(-8 * s, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 6. Orbiting energy sparks & rising luminous digital data motes
  for (let i = 0; i < 8; i++) {
    const phase = (safeElapsed * 0.48 + i * 0.125) % 1;
    const angle = safeElapsed * 1.4 + i * 1.1;
    const px = x + Math.cos(angle) * (apertureRx * 0.85 + Math.sin(phase * Math.PI) * 14 * s);
    const py = y - 6 * s - phase * (apertureRy * 2.15);
    const alpha = Math.sin(phase * Math.PI) * 0.88;
    const r = (1.9 + (i % 3) * 0.7) * s;

    ctx.fillStyle =
      i % 3 === 0
        ? `rgba(254, 240, 138, ${alpha.toFixed(3)})`
        : `rgba(186, 246, 255, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Floating Overhead Portal Nameplate (cleanly aligned above keystone)
  if (options?.title) {
    const bob = Math.sin(safeElapsed * 2.5) * 2;
    const tagW = 124;
    const tagH = options.subtitle ? 30 : 22;
    const tagX = x - tagW / 2;
    const tagY = apexY - (options.subtitle ? 44 : 34) + bob;

    ctx.fillStyle = 'rgba(4, 20, 58, 0.9)';
    drawRoundedRectPath(ctx, tagX, tagY, tagW, tagH, 7);
    ctx.fill();
    ctx.strokeStyle = isNearby ? '#fde047' : `rgba(${palette.outerGlowRgb}, 0.88)`;
    ctx.lineWidth = isNearby ? 2 : 1.4;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 10.5px "Exo 2", sans-serif';
    ctx.fillStyle = isNearby ? '#fef08a' : '#ffffff';
    ctx.fillText(
      options.title,
      x,
      options.subtitle ? tagY + 10.5 : tagY + tagH / 2
    );

    if (options.subtitle) {
      ctx.font = '800 9px "Exo 2", sans-serif';
      ctx.fillStyle = isNearby ? '#fde047' : '#7dd3fc';
      ctx.fillText(
        isNearby ? 'Toque ou [E] para viajar' : options.subtitle,
        x,
        tagY + 21.5
      );
    }
  }

  ctx.restore();
}
