/**
 * High-craft animated pixel/cel-shaded sprites baked to offscreen canvases
 * for all 5 wild Digimon of Floresta de Dados (Lv. 10–20) + World Boss Kuwagamon.
 *
 * Each species pre-bakes:
 * - 3 distinct idle/patrol frames (ping-pong animated at species-specific FPS)
 * - 1 dynamic attack frame (vines, sparks, spores, branch slam, dive-peck, giant pincer snap)
 * - 1 recoil hit frame
 * - Crisp white hit-flash silhouette canvases
 * - Transparent PNG portrait data URL for HUD target panel & World Map catalog
 */

export type DataForestSpriteSpeciesId =
  | 'palmon'
  | 'kunemon'
  | 'mushroomon'
  | 'woodmon'
  | 'kiwimon'
  | 'kuwagamon';

export interface BakedForestFrame {
  canvas: HTMLCanvasElement;
  flashCanvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface BakedForestSpeciesAtlas {
  worldHeightPx: number;
  idleFps: number;
  shadowRx: number;
  hoverOffsetPx?: number;
  isBoss?: boolean;
  idle: [BakedForestFrame, BakedForestFrame, BakedForestFrame];
  attack: BakedForestFrame;
  hit: BakedForestFrame;
  portraitDataUrl: string;
}

type PoseKind = 'idle0' | 'idle1' | 'idle2' | 'attack' | 'hit';

const FOREST_SPECIES_SET = new Set<string>([
  'palmon',
  'kunemon',
  'mushroomon',
  'woodmon',
  'kiwimon',
  'kuwagamon',
]);

export function isDataForestSpriteSpecies(
  species: string
): species is DataForestSpriteSpeciesId {
  return FOREST_SPECIES_SET.has(species);
}

const atlasCache = new Map<DataForestSpriteSpeciesId, BakedForestSpeciesAtlas>();

function makeFrame(
  w: number,
  h: number,
  paint: (ctx: CanvasRenderingContext2D) => void
): BakedForestFrame {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    paint(ctx);
  }

  const flashCanvas = document.createElement('canvas');
  flashCanvas.width = w;
  flashCanvas.height = h;
  const fctx = flashCanvas.getContext('2d');
  if (fctx) {
    fctx.drawImage(canvas, 0, 0);
    fctx.globalCompositeOperation = 'source-atop';
    fctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    fctx.fillRect(0, 0, w, h);
  }

  return { canvas, flashCanvas, width: w, height: h };
}

function outlineFill(
  ctx: CanvasRenderingContext2D,
  fill: string | CanvasGradient,
  stroke = '#0f172a',
  lw = 2.4
) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}

// ============================================================================
// 1. PALMON (Lv. 10–11) — Vibrant plant Digimon with blooming magenta flower
// ============================================================================
function paintPalmon(ctx: CanvasRenderingContext2D, pose: PoseKind) {
  const bounce = pose === 'idle1' ? -2.5 : pose === 'idle2' ? -4.5 : pose === 'hit' ? 3 : 0;
  const lunge = pose === 'attack' ? 8 : pose === 'hit' ? -5 : 0;
  ctx.save();
  ctx.translate(48 + lunge, 78 + bounce);

  // Root-like little green feet
  for (const fx of [-10, 10]) {
    ctx.beginPath();
    ctx.ellipse(fx, -4, 8, 5, fx < 0 ? -0.15 : 0.15, 0, Math.PI * 2);
    outlineFill(ctx, '#16a34a', '#052e16', 2.2);
  }

  // Round emerald body
  const bodyGrad = ctx.createRadialGradient(-5, -26, 4, 0, -22, 22);
  bodyGrad.addColorStop(0, '#4ade80');
  bodyGrad.addColorStop(1, '#15803d');
  ctx.beginPath();
  ctx.ellipse(0, -21, 16, 17, 0, 0, Math.PI * 2);
  outlineFill(ctx, bodyGrad, '#052e16', 2.4);

  // Vine-claw arms (stretched forward during Poison Ivy attack!)
  const armReach = pose === 'attack' ? 20 : pose === 'idle2' ? 4 : 0;
  // Back arm
  ctx.beginPath();
  ctx.moveTo(10, -25);
  ctx.quadraticCurveTo(22 + armReach * 0.5, -28, 25 + armReach, -22);
  ctx.lineWidth = 6.5;
  ctx.strokeStyle = '#052e16';
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#22c55e';
  ctx.stroke();
  // Purple claw tips
  for (let c = -1; c <= 1; c++) {
    ctx.beginPath();
    ctx.moveTo(24 + armReach, -22 + c * 3);
    ctx.lineTo(31 + armReach, -23 + c * 5);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }
  // Front arm
  ctx.beginPath();
  ctx.moveTo(-12, -23);
  ctx.quadraticCurveTo(-22, -18, -19, -11);
  ctx.lineWidth = 6.5;
  ctx.strokeStyle = '#052e16';
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#4ade80';
  ctx.stroke();

  // Leafy collar ruff
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(i * 7.5, -34, 7.5, 4.5, i * 0.28, 0, Math.PI * 2);
    outlineFill(ctx, '#22c55e', '#052e16', 1.8);
  }

  // Head
  const headGrad = ctx.createRadialGradient(-4, -46, 3, 0, -44, 18);
  headGrad.addColorStop(0, '#86efac');
  headGrad.addColorStop(1, '#16a34a');
  ctx.beginPath();
  ctx.ellipse(0, -44, 15.5, 13.5, 0, 0, Math.PI * 2);
  outlineFill(ctx, headGrad, '#052e16', 2.4);

  // Expressive eyes + cheerful mouth
  for (const ex of [-5.5, 6.5]) {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(ex, -44, 3.1, pose === 'hit' ? 1.4 : 4, 0, 0, Math.PI * 2);
    ctx.fill();
    if (pose !== 'hit') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex - 0.8, -45.5, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = '#052e16';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  if (pose === 'attack') {
    ctx.fillStyle = '#be123c';
    ctx.arc(1, -37, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.arc(1, -38, 4.2, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }

  // Blooming pink-magenta tropical flower crown on head
  const flowerTilt = pose === 'idle2' ? 0.08 : pose === 'attack' ? 0.16 : 0;
  ctx.save();
  ctx.translate(0, -57);
  ctx.rotate(flowerTilt);
  const petals = [
    { x: -13, y: -4, r: 9, a: -0.45 },
    { x: 13, y: -4, r: 9, a: 0.45 },
    { x: -7, y: -11, r: 9.5, a: -0.2 },
    { x: 7, y: -11, r: 9.5, a: 0.2 },
    { x: 0, y: -13, r: 8.5, a: 0 },
  ];
  for (const p of petals) {
    const pGrad = ctx.createRadialGradient(p.x, p.y - 2, 1, p.x, p.y, p.r);
    pGrad.addColorStop(0, '#f472b6');
    pGrad.addColorStop(1, '#db2777');
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.r, p.r * 0.68, p.a, 0, Math.PI * 2);
    outlineFill(ctx, pGrad, '#500724', 2);
  }
  // Golden center stamen
  ctx.beginPath();
  ctx.arc(0, -5, 5, 0, Math.PI * 2);
  outlineFill(ctx, '#fde047', '#713f12', 1.8);
  ctx.restore();

  // Poison Ivy attack energy sparkle
  if (pose === 'attack') {
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(26, -24);
    ctx.quadraticCurveTo(40, -34, 46, -20);
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================================
// 2. KUNEMON (Lv. 12–13) — Yellow caterpillar Digimon with purple lightning stripes
// ============================================================================
function paintKunemon(ctx: CanvasRenderingContext2D, pose: PoseKind) {
  const wiggle = pose === 'idle1' ? 2.5 : pose === 'idle2' ? -2.5 : 0;
  const lunge = pose === 'attack' ? 7 : pose === 'hit' ? -5 : 0;
  ctx.save();
  ctx.translate(48 + lunge, 70);

  // Segmented yellow caterpillar body (rear to front)
  const segments = [
    { x: -24, y: -11 + wiggle * 0.5, rx: 10, ry: 9 },
    { x: -12, y: -14 - wiggle * 0.6, rx: 12, ry: 11 },
    { x: 1, y: -16 + wiggle * 0.5, rx: 13, ry: 12 },
    { x: 14, y: -21, rx: 14, ry: 13 },
  ];

  // Small stubby caterpillar feet
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    ctx.beginPath();
    ctx.ellipse(s.x, -4, 4.5, 3.2, 0, 0, Math.PI * 2);
    outlineFill(ctx, '#ca8a04', '#422006', 1.8);
  }

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const grad = ctx.createRadialGradient(s.x - 3, s.y - 4, 2, s.x, s.y, s.rx + 3);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.65, '#facc15');
    grad.addColorStop(1, '#ca8a04');
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2);
    outlineFill(ctx, grad, '#422006', 2.3);

    // Signature purple lightning bolt marking on back segments
    if (i < 3) {
      ctx.beginPath();
      ctx.moveTo(s.x - 4, s.y - s.ry + 3);
      ctx.lineTo(s.x + 2, s.y - 1);
      ctx.lineTo(s.x - 2, s.y + 1);
      ctx.lineTo(s.x + 4, s.y + 6);
      ctx.strokeStyle = '#7e22ce';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }

  // Head visor/face mask (dark purple-navy mask with fierce glowing eyes)
  const hx = 16;
  const hy = pose === 'attack' ? -25 : -22;
  ctx.beginPath();
  ctx.ellipse(hx + 3, hy, 10, 8.5, 0.15, 0, Math.PI * 2);
  outlineFill(ctx, '#1e1b4b', '#09090b', 2);

  // Twin curved antennae
  for (const ax of [-2, 6]) {
    ctx.beginPath();
    ctx.moveTo(hx + ax, hy - 10);
    ctx.quadraticCurveTo(hx + ax + 6, hy - 22, hx + ax + 11, hy - 20);
    ctx.strokeStyle = '#581c87';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hx + ax + 11, hy - 20, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();
  }

  // Glowing electric-yellow eyes
  ctx.fillStyle = pose === 'hit' ? '#fb7185' : '#fef08a';
  ctx.beginPath();
  ctx.ellipse(hx + 1, hy - 1, 2.8, 2.2, -0.25, 0, Math.PI * 2);
  ctx.ellipse(hx + 8, hy - 1, 2.8, 2.2, 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Electric Thread silk-lightning attack
  if (pose === 'attack') {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(hx + 11, hy + 2);
    ctx.lineTo(hx + 22, hy - 3);
    ctx.lineTo(hx + 27, hy + 4);
    ctx.lineTo(hx + 38, hy - 2);
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================================
// 3. MUSHROOMON (Lv. 14–15) — Purple spotted toadstool Digimon
// ============================================================================
function paintMushroomon(ctx: CanvasRenderingContext2D, pose: PoseKind) {
  const hop = pose === 'idle1' ? -2 : pose === 'idle2' ? -5 : pose === 'hit' ? 2 : 0;
  const lunge = pose === 'attack' ? 7 : pose === 'hit' ? -5 : 0;
  ctx.save();
  ctx.translate(48 + lunge, 78 + hop);

  // Stubby dark boots
  for (const fx of [-9, 9]) {
    ctx.beginPath();
    ctx.ellipse(fx, -4, 7.5, 4.5, 0, 0, Math.PI * 2);
    outlineFill(ctx, '#4c1d95', '#1e1b4b', 2.2);
  }

  // Cream-beige mushroom stem body with brown strap belt
  const stemGrad = ctx.createLinearGradient(-13, -34, 13, -6);
  stemGrad.addColorStop(0, '#fef3c7');
  stemGrad.addColorStop(1, '#d6c19e');
  ctx.beginPath();
  ctx.roundRect(-13, -34, 26, 28, 9);
  outlineFill(ctx, stemGrad, '#2e1065', 2.4);

  // Diagonal brown bandolier strap
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-11, -30);
  ctx.lineTo(11, -12);
  ctx.stroke();

  // Arms holding toxic mini-mushroom bomb on attack
  ctx.strokeStyle = '#2e1065';
  ctx.lineWidth = 6.5;
  ctx.beginPath();
  ctx.moveTo(-12, -24);
  ctx.lineTo(-22, -17);
  ctx.moveTo(12, -24);
  ctx.lineTo(pose === 'attack' ? 27 : 22, pose === 'attack' ? -28 : -17);
  ctx.stroke();
  ctx.strokeStyle = '#fef3c7';
  ctx.lineWidth = 3.8;
  ctx.stroke();

  if (pose === 'attack') {
    // Glowing Poison S-Masher spore cap
    ctx.beginPath();
    ctx.arc(31, -32, 7.5, Math.PI, 0);
    ctx.closePath();
    outlineFill(ctx, '#c026d3', '#3b0764', 1.8);
    ctx.fillStyle = '#a3e635';
    ctx.beginPath();
    ctx.arc(31, -35, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shadowy face under mushroom cap brim + glowing mischievous yellow eyes
  ctx.beginPath();
  ctx.ellipse(0, -34, 14, 7.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#1e1038';
  ctx.fill();

  ctx.fillStyle = pose === 'hit' ? '#fb7185' : '#fde047';
  ctx.beginPath();
  ctx.ellipse(-5, -34, 3.3, 2.5, -0.2, 0, Math.PI * 2);
  ctx.ellipse(6, -34, 3.3, 2.5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Huge vivid purple-magenta toadstool cap with lime/cream spots
  const capGrad = ctx.createRadialGradient(-8, -54, 4, 0, -45, 30);
  capGrad.addColorStop(0, '#d946ef');
  capGrad.addColorStop(0.65, '#9333ea');
  capGrad.addColorStop(1, '#581c87');
  ctx.beginPath();
  ctx.moveTo(-28, -36);
  ctx.quadraticCurveTo(-28, -66, 0, -67);
  ctx.quadraticCurveTo(28, -66, 28, -36);
  ctx.quadraticCurveTo(0, -31, -28, -36);
  ctx.closePath();
  outlineFill(ctx, capGrad, '#2e1065', 2.6);

  // Iconic bright mushroom cap spots
  const spots = [
    { x: -13, y: -49, r: 5.2 },
    { x: 1, y: -57, r: 5.8 },
    { x: 15, y: -48, r: 4.8 },
    { x: -2, y: -43, r: 3.6 },
  ];
  for (const sp of spots) {
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
    ctx.fillStyle = '#f5d0fe';
    ctx.fill();
    ctx.strokeStyle = '#581c87';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================================
// 4. WOODMON (Lv. 16–17) — Gnarled wooden tree-trunk Digimon with branch arms
// ============================================================================
function paintWoodmon(ctx: CanvasRenderingContext2D, pose: PoseKind) {
  const sway = pose === 'idle1' ? -1.5 : pose === 'idle2' ? 1.5 : 0;
  const lunge = pose === 'attack' ? 8 : pose === 'hit' ? -5 : 0;
  ctx.save();
  ctx.translate(54 + lunge, 96);

  // Thick gnarled root feet
  for (const rx of [-14, 0, 14]) {
    ctx.beginPath();
    ctx.ellipse(rx, -5, 9, 5, rx * 0.02, 0, Math.PI * 2);
    outlineFill(ctx, '#713f12', '#271306', 2.4);
  }

  // Tall wooden trunk body
  const barkGrad = ctx.createLinearGradient(-20, -76, 22, -6);
  barkGrad.addColorStop(0, '#92400e');
  barkGrad.addColorStop(0.5, '#78350f');
  barkGrad.addColorStop(1, '#451a03');
  ctx.beginPath();
  ctx.moveTo(-19, -6);
  ctx.quadraticCurveTo(-21 + sway, -38, -16 + sway, -74);
  ctx.lineTo(16 + sway, -74);
  ctx.quadraticCurveTo(22 + sway, -38, 19, -6);
  ctx.closePath();
  outlineFill(ctx, barkGrad, '#271306', 2.6);

  // Vertical bark grain cracks
  ctx.strokeStyle = 'rgba(39, 19, 6, 0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-8 + sway * 0.5, -66);
  ctx.lineTo(-9, -18);
  ctx.moveTo(9 + sway * 0.5, -64);
  ctx.lineTo(11, -16);
  ctx.stroke();

  // Branch arms with leafy clusters
  const atkReach = pose === 'attack' ? 16 : 0;
  // Left branch arm
  ctx.beginPath();
  ctx.moveTo(-17 + sway, -48);
  ctx.lineTo(-34 + sway, -38);
  ctx.lineTo(-39 + sway, -47);
  ctx.strokeStyle = '#271306';
  ctx.lineWidth = 9;
  ctx.stroke();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 5.5;
  ctx.stroke();

  // Right slamming branch arm
  ctx.beginPath();
  ctx.moveTo(17 + sway, -48);
  ctx.lineTo(34 + atkReach, pose === 'attack' ? -30 : -40);
  ctx.lineTo(42 + atkReach, pose === 'attack' ? -24 : -50);
  ctx.strokeStyle = '#271306';
  ctx.lineWidth = 9.5;
  ctx.stroke();
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Lush leafy twigs on top of head & shoulders
  const leafClusters = [
    { x: -16 + sway, y: -76, r: 10 },
    { x: 0 + sway, y: -82, r: 12 },
    { x: 15 + sway, y: -76, r: 10 },
    { x: -37 + sway, y: -48, r: 7 },
    { x: 40 + atkReach, y: pose === 'attack' ? -26 : -50, r: 7.5 },
  ];
  for (const lc of leafClusters) {
    const lGrad = ctx.createRadialGradient(lc.x - 2, lc.y - 3, 2, lc.x, lc.y, lc.r);
    lGrad.addColorStop(0, '#4ade80');
    lGrad.addColorStop(1, '#15803d');
    ctx.beginPath();
    ctx.arc(lc.x, lc.y, lc.r, 0, Math.PI * 2);
    outlineFill(ctx, lGrad, '#052e16', 2);
  }

  // Hollow dark eye sockets with menacing glowing crimson-amber eyes
  ctx.fillStyle = '#1c0b04';
  ctx.beginPath();
  ctx.ellipse(-6 + sway, -54, 5, 4, -0.15, 0, Math.PI * 2);
  ctx.ellipse(7 + sway, -54, 5, 4, 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = pose === 'hit' ? '#ffffff' : '#ef4444';
  ctx.beginPath();
  ctx.arc(-5.5 + sway, -54, 2.3, 0, Math.PI * 2);
  ctx.arc(6.5 + sway, -54, 2.3, 0, Math.PI * 2);
  ctx.fill();

  // Jagged wooden grin
  ctx.fillStyle = '#1c0b04';
  ctx.beginPath();
  ctx.moveTo(-10 + sway, -38);
  ctx.lineTo(-4 + sway, -34);
  ctx.lineTo(1 + sway, -39);
  ctx.lineTo(6 + sway, -34);
  ctx.lineTo(11 + sway, -38);
  ctx.lineTo(9 + sway, -28);
  ctx.lineTo(-8 + sway, -28);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// ============================================================================
// 5. KIWIMON (Lv. 18–20) — Plump leafy avian Digimon with spiky crest & beak
// ============================================================================
function paintKiwimon(ctx: CanvasRenderingContext2D, pose: PoseKind) {
  const bob = pose === 'idle1' ? -2 : pose === 'idle2' ? -4.5 : 0;
  const lunge = pose === 'attack' ? 9 : pose === 'hit' ? -5 : 0;
  ctx.save();
  ctx.translate(52 + lunge, 88 + bob);

  // Sturdy orange-brown avian legs & claws
  for (const lx of [-10, 8]) {
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(lx, -18);
    ctx.lineTo(lx, -5);
    ctx.lineTo(lx + 7, -3);
    ctx.moveTo(lx, -5);
    ctx.lineTo(lx - 4, -2);
    ctx.stroke();
  }

  // Spiky tail leaf-feathers
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-16, -28 - i * 4);
    ctx.lineTo(-34, -36 - i * 6);
    ctx.lineTo(-20, -21 - i * 3);
    ctx.closePath();
    outlineFill(ctx, '#16a34a', '#052e16', 2);
  }

  // Round leafy-bush body
  const bodyGrad = ctx.createRadialGradient(-4, -36, 5, 0, -32, 26);
  bodyGrad.addColorStop(0, '#84cc16');
  bodyGrad.addColorStop(0.6, '#22c55e');
  bodyGrad.addColorStop(1, '#15803d');
  ctx.beginPath();
  ctx.ellipse(-2, -33, 22, 19, -0.08, 0, Math.PI * 2);
  outlineFill(ctx, bodyGrad, '#052e16', 2.5);

  // Leaf-wing flutter on side
  const wingAngle = pose === 'attack' ? -0.55 : pose === 'idle2' ? -0.25 : 0.1;
  ctx.save();
  ctx.translate(-4, -34);
  ctx.rotate(wingAngle);
  ctx.beginPath();
  ctx.ellipse(-4, 2, 13, 7.5, -0.2, 0, Math.PI * 2);
  outlineFill(ctx, '#4ade80', '#052e16', 2);
  ctx.restore();

  // Head & neck
  const hx = pose === 'attack' ? 16 : 12;
  const hy = pose === 'attack' ? -47 : -52;
  ctx.beginPath();
  ctx.arc(hx, hy, 13, 0, Math.PI * 2);
  outlineFill(ctx, '#4ade80', '#052e16', 2.4);

  // Spiky crown crest feathers
  ctx.beginPath();
  ctx.moveTo(hx - 4, hy - 11);
  ctx.lineTo(hx - 12, hy - 24);
  ctx.lineTo(hx, hy - 14);
  ctx.lineTo(hx + 2, hy - 26);
  ctx.lineTo(hx + 8, hy - 12);
  ctx.closePath();
  outlineFill(ctx, '#a3e635', '#052e16', 1.8);

  // Sharp dark curved beak
  ctx.beginPath();
  ctx.moveTo(hx + 10, hy - 4);
  ctx.lineTo(hx + 27, hy + 2);
  ctx.lineTo(hx + 10, hy + 6);
  ctx.closePath();
  outlineFill(ctx, '#f59e0b', '#451a03', 2.2);

  // Bright fierce golden eye
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(hx + 4, hy - 2, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = pose === 'hit' ? '#fb7185' : '#fde047';
  ctx.beginPath();
  ctx.arc(hx + 4.4, hy - 2.2, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Little Lily / Wind Peck slash VFX on attack
  if (pose === 'attack') {
    ctx.strokeStyle = '#bef264';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(hx + 28, hy + 2, 10, -0.8, 0.9);
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================================
// 6. WORLD BOSS KUWAGAMON (Lv. 20 · BOSS DE RAID)
//    Monumental crimson-armored stag-beetle Digimon with giant serrated pincers,
//    iridescent insect wings, 4 armored clawed legs & crackling red aura!
// ============================================================================
function paintKuwagamonBoss(ctx: CanvasRenderingContext2D, pose: PoseKind) {
  const hover = pose === 'idle1' ? -4 : pose === 'idle2' ? -9 : pose === 'hit' ? 3 : -6;
  const lunge = pose === 'attack' ? 14 : pose === 'hit' ? -8 : 0;
  const wingFlap = pose === 'idle1' ? 0.22 : pose === 'idle2' ? -0.25 : pose === 'attack' ? -0.35 : 0;
  const pincerSnap = pose === 'attack' ? 0.36 : pose === 'idle2' ? -0.08 : 0;

  ctx.save();
  ctx.translate(92 + lunge, 152 + hover);

  // Subtle crimson Raid Boss aura glow behind body
  const auraGrad = ctx.createRadialGradient(0, -68, 12, 0, -68, 74);
  auraGrad.addColorStop(0, 'rgba(239, 68, 68, 0.32)');
  auraGrad.addColorStop(0.65, 'rgba(185, 28, 28, 0.14)');
  auraGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(0, -68, 74, 0, Math.PI * 2);
  ctx.fill();

  // 4 Buzzing Iridescent Translucent Insect Wings (back pair + front pair)
  const wingSpecs = [
    { side: -1, y: -88, rx: 44, ry: 14, baseRot: -0.45 + wingFlap },
    { side: 1, y: -88, rx: 44, ry: 14, baseRot: 0.45 - wingFlap },
    { side: -1, y: -74, rx: 36, ry: 11, baseRot: -0.15 - wingFlap * 0.7 },
    { side: 1, y: -74, rx: 36, ry: 11, baseRot: 0.15 + wingFlap * 0.7 },
  ];
  for (const w of wingSpecs) {
    ctx.save();
    ctx.translate(w.side * 16, w.y);
    ctx.rotate(w.baseRot);
    const wGrad = ctx.createLinearGradient(0, 0, w.side * w.rx * 1.8, 0);
    wGrad.addColorStop(0, 'rgba(254, 215, 170, 0.72)');
    wGrad.addColorStop(0.55, 'rgba(186, 230, 253, 0.56)');
    wGrad.addColorStop(1, 'rgba(244, 114, 182, 0.34)');
    ctx.beginPath();
    ctx.ellipse(w.side * w.rx * 0.85, 0, w.rx, w.ry, 0, 0, Math.PI * 2);
    outlineFill(ctx, wGrad, 'rgba(255, 241, 242, 0.7)', 1.6);
    // Wing vein
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w.side * w.rx * 1.5, 0);
    ctx.stroke();
    ctx.restore();
  }

  // Segmented Crimson Insect Abdomen (lower tail)
  for (let i = 0; i < 3; i++) {
    const ay = -28 - i * 11;
    const arx = 18 + i * 3;
    const grad = ctx.createLinearGradient(-arx, ay - 6, arx, ay + 6);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(0.5, '#b91c1c');
    grad.addColorStop(1, '#7f1d1d');
    ctx.beginPath();
    ctx.ellipse(0, ay, arx, 10, 0, 0, Math.PI * 2);
    outlineFill(ctx, grad, '#2a0505', 2.4);
  }

  // 4 Armored Spiked Insect Legs + Twin Scissor Forearms
  const legPairs = [
    { x: -24, y: -52, ex: -44, ey: -24, side: -1 },
    { x: 24, y: -52, ex: 44, ey: -24, side: 1 },
    { x: -20, y: -38, ex: -36, ey: -10, side: -1 },
    { x: 20, y: -38, ex: 36, ey: -10, side: 1 },
  ];
  for (const leg of legPairs) {
    ctx.strokeStyle = '#2a0505';
    ctx.lineWidth = 8.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(leg.x, leg.y);
    ctx.lineTo(leg.x + leg.side * 16, leg.y + 8);
    ctx.lineTo(leg.ex, leg.ey);
    ctx.stroke();

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4.6;
    ctx.stroke();

    // Ivory claw tip
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(leg.ex, leg.ey, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Armored Muscular Crimson Thorax / Carapace
  const thoraxGrad = ctx.createRadialGradient(-8, -76, 6, 0, -68, 34);
  thoraxGrad.addColorStop(0, '#f87171');
  thoraxGrad.addColorStop(0.55, '#dc2626');
  thoraxGrad.addColorStop(1, '#7f1d1d');
  ctx.beginPath();
  ctx.ellipse(0, -68, 28, 24, 0, 0, Math.PI * 2);
  outlineFill(ctx, thoraxGrad, '#2a0505', 2.8);

  // Dark metallic chest plating lines
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-18, -72);
  ctx.quadraticCurveTo(0, -62, 18, -72);
  ctx.moveTo(-16, -60);
  ctx.quadraticCurveTo(0, -52, 16, -60);
  ctx.stroke();

  // Giant Scythe Forearms (reaching aggressively)
  for (const side of [-1, 1]) {
    const reachY = pose === 'attack' ? -54 : -64;
    ctx.strokeStyle = '#2a0505';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(side * 24, -76);
    ctx.lineTo(side * 46, reachY);
    ctx.stroke();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 5.5;
    ctx.stroke();

    // Curved bone blade claw
    ctx.beginPath();
    ctx.moveTo(side * 44, reachY - 4);
    ctx.lineTo(side * 58, reachY + 12);
    ctx.lineTo(side * 42, reachY + 8);
    ctx.closePath();
    outlineFill(ctx, '#fef3c7', '#450a0a', 2);
  }

  // Fierce Armored Stag-Beetle Head
  const headGrad = ctx.createRadialGradient(-4, -98, 4, 0, -94, 24);
  headGrad.addColorStop(0, '#f87171');
  headGrad.addColorStop(0.6, '#b91c1c');
  headGrad.addColorStop(1, '#450a0a');
  ctx.beginPath();
  ctx.ellipse(0, -94, 22, 17, 0, 0, Math.PI * 2);
  outlineFill(ctx, headGrad, '#2a0505', 2.8);

  // GIANT SERRATED STAG-BEETLE PINCERS (Signature Kuwagamon silhouette!)
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 12, -106);
    ctx.rotate(side * -pincerSnap);
    const pGrad = ctx.createLinearGradient(0, 0, side * 12, -38);
    pGrad.addColorStop(0, '#fde68a');
    pGrad.addColorStop(0.5, '#fef3c7');
    pGrad.addColorStop(1, '#e2e8f0');
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(side * 24, -14, side * 18, -36);
    ctx.lineTo(side * 4, -44);
    ctx.lineTo(side * 9, -28);
    // Serrated inner teeth
    ctx.lineTo(side * 2, -24);
    ctx.lineTo(side * 8, -18);
    ctx.lineTo(side * 1, -13);
    ctx.lineTo(side * 6, -6);
    ctx.closePath();
    outlineFill(ctx, pGrad, '#2a0505', 2.4);
    ctx.restore();
  }

  // Glowing Menacing Boss Eyes (bright gold-amber slits)
  ctx.fillStyle = pose === 'hit' ? '#ffffff' : '#fde047';
  ctx.beginPath();
  ctx.moveTo(-14, -96);
  ctx.lineTo(-4, -92);
  ctx.lineTo(-11, -88);
  ctx.closePath();
  ctx.moveTo(14, -96);
  ctx.lineTo(4, -92);
  ctx.lineTo(11, -88);
  ctx.closePath();
  ctx.fill();

  // Sharp Fanged Mandible Mouth
  ctx.fillStyle = '#180404';
  ctx.beginPath();
  ctx.ellipse(0, -83, 12, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fef3c7';
  for (const fx of [-8, -3, 3, 8]) {
    ctx.beginPath();
    ctx.moveTo(fx - 2, -86);
    ctx.lineTo(fx, -81);
    ctx.lineTo(fx + 2, -86);
    ctx.closePath();
    ctx.fill();
  }

  // Scissor Claw Crimson X-Slash VFX during Boss Attack
  if (pose === 'attack') {
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(-30, -142);
    ctx.lineTo(30, -104);
    ctx.moveTo(30, -142);
    ctx.lineTo(-30, -104);
    ctx.stroke();
  }

  ctx.restore();
}

function buildAtlas(species: DataForestSpriteSpeciesId): BakedForestSpeciesAtlas {
  if (species === 'palmon') {
    const idle0 = makeFrame(96, 86, (c) => paintPalmon(c, 'idle0'));
    return {
      worldHeightPx: 56,
      idleFps: 4.0,
      shadowRx: 16,
      idle: [
        idle0,
        makeFrame(96, 86, (c) => paintPalmon(c, 'idle1')),
        makeFrame(96, 86, (c) => paintPalmon(c, 'idle2')),
      ],
      attack: makeFrame(112, 86, (c) => paintPalmon(c, 'attack')),
      hit: makeFrame(96, 86, (c) => paintPalmon(c, 'hit')),
      portraitDataUrl: idle0.canvas.toDataURL('image/png'),
    };
  }

  if (species === 'kunemon') {
    const idle0 = makeFrame(96, 76, (c) => paintKunemon(c, 'idle0'));
    return {
      worldHeightPx: 42,
      idleFps: 4.4,
      shadowRx: 17,
      idle: [
        idle0,
        makeFrame(96, 76, (c) => paintKunemon(c, 'idle1')),
        makeFrame(96, 76, (c) => paintKunemon(c, 'idle2')),
      ],
      attack: makeFrame(110, 76, (c) => paintKunemon(c, 'attack')),
      hit: makeFrame(96, 76, (c) => paintKunemon(c, 'hit')),
      portraitDataUrl: idle0.canvas.toDataURL('image/png'),
    };
  }

  if (species === 'mushroomon') {
    const idle0 = makeFrame(96, 86, (c) => paintMushroomon(c, 'idle0'));
    return {
      worldHeightPx: 52,
      idleFps: 4.2,
      shadowRx: 17,
      idle: [
        idle0,
        makeFrame(96, 86, (c) => paintMushroomon(c, 'idle1')),
        makeFrame(96, 86, (c) => paintMushroomon(c, 'idle2')),
      ],
      attack: makeFrame(112, 86, (c) => paintMushroomon(c, 'attack')),
      hit: makeFrame(96, 86, (c) => paintMushroomon(c, 'hit')),
      portraitDataUrl: idle0.canvas.toDataURL('image/png'),
    };
  }

  if (species === 'woodmon') {
    const idle0 = makeFrame(110, 102, (c) => paintWoodmon(c, 'idle0'));
    return {
      worldHeightPx: 86,
      idleFps: 3.4,
      shadowRx: 25,
      idle: [
        idle0,
        makeFrame(110, 102, (c) => paintWoodmon(c, 'idle1')),
        makeFrame(110, 102, (c) => paintWoodmon(c, 'idle2')),
      ],
      attack: makeFrame(126, 102, (c) => paintWoodmon(c, 'attack')),
      hit: makeFrame(110, 102, (c) => paintWoodmon(c, 'hit')),
      portraitDataUrl: idle0.canvas.toDataURL('image/png'),
    };
  }

  if (species === 'kiwimon') {
    const idle0 = makeFrame(108, 96, (c) => paintKiwimon(c, 'idle0'));
    return {
      worldHeightPx: 76,
      idleFps: 4.2,
      shadowRx: 22,
      idle: [
        idle0,
        makeFrame(108, 96, (c) => paintKiwimon(c, 'idle1')),
        makeFrame(108, 96, (c) => paintKiwimon(c, 'idle2')),
      ],
      attack: makeFrame(124, 96, (c) => paintKiwimon(c, 'attack')),
      hit: makeFrame(108, 96, (c) => paintKiwimon(c, 'hit')),
      portraitDataUrl: idle0.canvas.toDataURL('image/png'),
    };
  }

  // BOSS KUWAGAMON
  const idle0 = makeFrame(184, 162, (c) => paintKuwagamonBoss(c, 'idle0'));
  return {
    worldHeightPx: 146,
    idleFps: 5.8,
    shadowRx: 52,
    hoverOffsetPx: 16,
    isBoss: true,
    idle: [
      idle0,
      makeFrame(184, 162, (c) => paintKuwagamonBoss(c, 'idle1')),
      makeFrame(184, 162, (c) => paintKuwagamonBoss(c, 'idle2')),
    ],
    attack: makeFrame(200, 162, (c) => paintKuwagamonBoss(c, 'attack')),
    hit: makeFrame(184, 162, (c) => paintKuwagamonBoss(c, 'hit')),
    portraitDataUrl: idle0.canvas.toDataURL('image/png'),
  };
}

export function getOrBakeDataForestAtlas(
  species: DataForestSpriteSpeciesId
): BakedForestSpeciesAtlas {
  let atlas = atlasCache.get(species);
  if (!atlas) {
    atlas = buildAtlas(species);
    atlasCache.set(species, atlas);
  }
  return atlas;
}

export function preloadDataForestSprites(): void {
  const all: DataForestSpriteSpeciesId[] = [
    'palmon',
    'kunemon',
    'mushroomon',
    'woodmon',
    'kiwimon',
    'kuwagamon',
  ];
  for (const sp of all) {
    getOrBakeDataForestAtlas(sp);
  }
}
