import {
  DIRECTIONS_8,
  type Direction8,
  type SpriteFrameRect,
  type TamerAnimationState,
  type TamerCharacter,
  type TamerId,
  type TamerSpritesheetData,
} from '../types/character';

export const TAMER_CHARACTERS: readonly TamerCharacter[] = [
  {
    id: 'kai',
    code: 'TAMER 01',
    gender: 'Menino',
    archetypeTitle: 'Tamer Corajoso e Determinado',
    shortLabel: 'Corajoso',
    appearanceSummary:
      'Cabelo castanho espetado, óculos azuis na cabeça, jaqueta azul com detalhes amarelos, camiseta branca, calça escura e tênis azul e branco',
    theme: {
      accentHex: '#2be3ff',
      glowRgba: 'rgba(0, 180, 255, 0.55)',
      borderGradient: 'from-[#3be8ff] via-[#0080ff] to-[#3be8ff]',
      cardBgGradient: 'from-[#0b3478]/92 via-[#061c4a]/94 to-[#041130]/96',
      pedestalColor: '#2be3ff',
    },
  },
  {
    id: 'ren',
    code: 'TAMER 02',
    gender: 'Menino',
    archetypeTitle: 'Tamer Estratégico e Inteligente',
    shortLabel: 'Estratégico',
    appearanceSummary:
      'Cabelo preto espetado, jaqueta vermelha, camiseta escura, calça preta e tênis vermelho e branco',
    theme: {
      accentHex: '#ff3050',
      glowRgba: 'rgba(255, 48, 80, 0.58)',
      borderGradient: 'from-[#ff7085] via-[#dc2626] to-[#ff7085]',
      cardBgGradient: 'from-[#7a1024]/92 via-[#470917]/94 to-[#22050d]/96',
      pedestalColor: '#ff3050',
    },
  },
  {
    id: 'hina',
    code: 'TAMER 03',
    gender: 'Menina',
    archetypeTitle: 'Tamer Alegre e Persistente',
    shortLabel: 'Alegre',
    appearanceSummary:
      'Cabelo castanho comprido preso em rabo de cavalo, óculos rosa na cabeça, jaqueta rosa, saia rosa e botas rosa',
    theme: {
      accentHex: '#f472b6',
      glowRgba: 'rgba(236, 72, 153, 0.55)',
      borderGradient: 'from-[#ff8ae2] via-[#d926a9] to-[#ff8ae2]',
      cardBgGradient: 'from-[#5e1463]/90 via-[#380b47]/94 to-[#1e0730]/96',
      pedestalColor: '#f472b6',
    },
  },
  {
    id: 'yuna',
    code: 'TAMER 04',
    gender: 'Menina',
    archetypeTitle: 'Tamer Sonhadora e Forte',
    shortLabel: 'Sonhadora',
    appearanceSummary:
      'Cabelo preto comprido, presilha roxa, jaqueta roxa, saia escura e botas roxas',
    theme: {
      accentHex: '#c084fc',
      glowRgba: 'rgba(168, 85, 247, 0.55)',
      borderGradient: 'from-[#d8b4fe] via-[#7e22ce] to-[#d8b4fe]',
      cardBgGradient: 'from-[#421570]/90 via-[#280d4a]/94 to-[#16072b]/96',
      pedestalColor: '#c084fc',
    },
  },
] as const;

interface CharacterPalette {
  outline: string;
  skin: string;
  skinShadow: string;
  eye: string;
  hairBase: string;
  hairLight: string;
  hairShadow: string;
  goggleFrame: string;
  goggleLens: string;
  hasGoggles: boolean;
  hasPonytail: boolean;
  hasLongHair: boolean;
  hasHairClip: boolean;
  hairClipColor: string;
  jacketMain: string;
  jacketDark: string;
  jacketTrim: string;
  shirt: string;
  pantsOrSkirt: string;
  pantsShadow: string;
  isSkirt: boolean;
  hasBoots: boolean;
  glove: string;
  gloveTrim: string;
  shoeMain: string;
  shoeLight: string;
  attackAura: string;
}

const PALETTES: Record<TamerId, CharacterPalette> = {
  kai: {
    outline: '#090d1a',
    skin: '#fcd5b5',
    skinShadow: '#e2a37d',
    eye: '#3b1d0e',
    hairBase: '#8a451d',
    hairLight: '#c47135',
    hairShadow: '#57260d',
    goggleFrame: '#e5f3ff',
    goggleLens: '#00c8ff',
    hasGoggles: true,
    hasPonytail: false,
    hasLongHair: false,
    hasHairClip: false,
    hairClipColor: '#ffd43b',
    jacketMain: '#1264e3',
    jacketDark: '#0a3c94',
    jacketTrim: '#ffd43b',
    shirt: '#ffffff',
    pantsOrSkirt: '#1d2432',
    pantsShadow: '#111622',
    isSkirt: false,
    hasBoots: false,
    glove: '#f1f5f9',
    gloveTrim: '#1264e3',
    shoeMain: '#1264e3',
    shoeLight: '#ffffff',
    attackAura: '#38e8ff',
  },
  ren: {
    outline: '#090d1a',
    skin: '#fad0af',
    skinShadow: '#dda079',
    eye: '#18181b',
    hairBase: '#232838',
    hairLight: '#47506e',
    hairShadow: '#12151f',
    goggleFrame: '#232838',
    goggleLens: '#232838',
    hasGoggles: false,
    hasPonytail: false,
    hasLongHair: false,
    hasHairClip: false,
    hairClipColor: '#ef4444',
    jacketMain: '#dc2626',
    jacketDark: '#991b1b',
    jacketTrim: '#1f2937',
    shirt: '#111827',
    pantsOrSkirt: '#171b24',
    pantsShadow: '#0c0f15',
    isSkirt: false,
    hasBoots: false,
    glove: '#1f2937',
    gloveTrim: '#ef4444',
    shoeMain: '#dc2626',
    shoeLight: '#ffffff',
    attackAura: '#ff5c5c',
  },
  hina: {
    outline: '#16091c',
    skin: '#fde0c6',
    skinShadow: '#e4ad87',
    eye: '#592512',
    hairBase: '#944c22',
    hairLight: '#cc7a3f',
    hairShadow: '#5e2b10',
    goggleFrame: '#fbcfe8',
    goggleLens: '#ec4899',
    hasGoggles: true,
    hasPonytail: true,
    hasLongHair: false,
    hasHairClip: false,
    hairClipColor: '#f472b6',
    jacketMain: '#ec4899',
    jacketDark: '#be185d',
    jacketTrim: '#fdf2f8',
    shirt: '#ffffff',
    pantsOrSkirt: '#f43f97',
    pantsShadow: '#be185d',
    isSkirt: true,
    hasBoots: true,
    glove: '#1f2937',
    gloveTrim: '#f472b6',
    shoeMain: '#ec4899',
    shoeLight: '#fbcfe8',
    attackAura: '#ff70c8',
  },
  yuna: {
    outline: '#12081e',
    skin: '#fde2cc',
    skinShadow: '#e2ae8c',
    eye: '#2d1547',
    hairBase: '#1e2030',
    hairLight: '#3d4160',
    hairShadow: '#10111c',
    goggleFrame: '#c084fc',
    goggleLens: '#a855f7',
    hasGoggles: false,
    hasPonytail: false,
    hasLongHair: true,
    hasHairClip: true,
    hairClipColor: '#c084fc',
    jacketMain: '#7c3aed',
    jacketDark: '#5b21b6',
    jacketTrim: '#f3e8ff',
    shirt: '#f8fafc',
    pantsOrSkirt: '#1e1338',
    pantsShadow: '#110924',
    isSkirt: true,
    hasBoots: true,
    glove: '#f3e8ff',
    gloveTrim: '#7c3aed',
    shoeMain: '#7c3aed',
    shoeLight: '#e9d5ff',
    attackAura: '#c084fc',
  },
};

const FRAME_W = 48;
const FRAME_H = 56;
const COLS = 4;
// Rows: idle(8) + walk(8) + run(8) + attack(8) + hurt(8) + victory(1) = 41
const TOTAL_ROWS = 41;

function createCanvas(
  w: number,
  h: number
): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  w = 1,
  h = 1
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function outlinedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  outline: string
) {
  px(ctx, x, y, outline, w, h);
  if (w > 2 && h > 2) {
    px(ctx, x + 1, y + 1, fill, w - 2, h - 2);
  }
}

/**
 * Draws a crisp, detailed 48x56 standing showcase sprite with transparent background
 * for character selection cards and enlarged preview.
 */
function drawShowcaseSprite48(id: TamerId): string {
  const p = PALETTES[id];
  const [canvas, ctx] = createCanvas(FRAME_W, FRAME_H);

  // Subtle transparent shadow under feet
  px(ctx, 13, 52, 'rgba(0,0,0,0.35)', 22, 2);
  px(ctx, 16, 51, 'rgba(0,0,0,0.2)', 16, 1);

  // Back long hair (Yuna) or side ponytail (Hina)
  if (p.hasLongHair) {
    outlinedRect(ctx, 12, 13, 24, 24, p.hairBase, p.outline);
    px(ctx, 13, 18, p.hairShadow, 3, 16);
    px(ctx, 32, 18, p.hairShadow, 3, 16);
    px(ctx, 15, 15, p.hairLight, 2, 10);
  }
  if (p.hasPonytail) {
    outlinedRect(ctx, 7, 11, 8, 17, p.hairBase, p.outline);
    px(ctx, 8, 13, p.hairLight, 3, 7);
    px(ctx, 9, 21, p.hairShadow, 3, 5);
    px(ctx, 8, 27, p.outline, 4, 2);
    px(ctx, 9, 27, p.hairBase, 2, 1);
  }

  // Legs & Footwear
  if (p.isSkirt) {
    outlinedRect(ctx, 16, 38, 5, 6, p.skin, p.outline);
    outlinedRect(ctx, 27, 38, 5, 6, p.skin, p.outline);
    // Tall boots (Hina pink boots / Yuna purple boots)
    outlinedRect(ctx, 15, 43, 7, 9, p.shoeMain, p.outline);
    outlinedRect(ctx, 26, 43, 7, 9, p.shoeMain, p.outline);
    px(ctx, 16, 44, p.shoeLight, 5, 2);
    px(ctx, 27, 44, p.shoeLight, 5, 2);
    px(ctx, 16, 50, p.shoeLight, 5, 1);
    px(ctx, 27, 50, p.shoeLight, 5, 1);
  } else {
    // Dark pants (Kai & Ren)
    outlinedRect(ctx, 16, 36, 7, 11, p.pantsOrSkirt, p.outline);
    outlinedRect(ctx, 25, 36, 7, 11, p.pantsOrSkirt, p.outline);
    px(ctx, 17, 38, p.pantsShadow, 2, 7);
    px(ctx, 26, 38, p.pantsShadow, 2, 7);
    // Sneakers (blue/white or red/white)
    outlinedRect(ctx, 14, 46, 9, 6, p.shoeMain, p.outline);
    outlinedRect(ctx, 25, 46, 9, 6, p.shoeMain, p.outline);
    px(ctx, 15, 50, p.shoeLight, 7, 1);
    px(ctx, 26, 50, p.shoeLight, 7, 1);
    px(ctx, 16, 47, p.shoeLight, 3, 2);
    px(ctx, 28, 47, p.shoeLight, 3, 2);
  }

  // Skirt or Belt
  if (p.isSkirt) {
    outlinedRect(ctx, 14, 34, 20, 7, p.pantsOrSkirt, p.outline);
    px(ctx, 15, 39, p.shoeLight, 18, 1);
    px(ctx, 18, 35, p.pantsShadow, 1, 4);
    px(ctx, 24, 35, p.pantsShadow, 1, 4);
    px(ctx, 29, 35, p.pantsShadow, 1, 4);
  } else {
    outlinedRect(ctx, 16, 33, 16, 5, p.pantsOrSkirt, p.outline);
    px(ctx, 21, 34, p.jacketTrim, 6, 2);
    px(ctx, 23, 34, '#ffffff', 2, 2);
  }

  // Arms & Gloves
  outlinedRect(ctx, 10, 23, 5, 10, p.jacketMain, p.outline);
  px(ctx, 11, 30, p.jacketTrim, 3, 2);
  outlinedRect(ctx, 9, 32, 5, 5, p.glove, p.outline);
  px(ctx, 10, 32, p.gloveTrim, 3, 1);

  outlinedRect(ctx, 33, 23, 5, 10, p.jacketMain, p.outline);
  px(ctx, 34, 30, p.jacketTrim, 3, 2);
  outlinedRect(ctx, 34, 32, 5, 5, p.glove, p.outline);
  px(ctx, 35, 32, p.gloveTrim, 3, 1);

  // Torso / Jacket
  outlinedRect(ctx, 14, 22, 20, 12, p.jacketMain, p.outline);
  // Inner shirt
  px(ctx, 21, 23, p.shirt, 6, 10);
  // Jacket shading & collar accents
  px(ctx, 15, 23, p.jacketDark, 3, 10);
  px(ctx, 30, 23, p.jacketDark, 3, 10);
  px(ctx, 18, 23, p.jacketTrim, 3, 3);
  px(ctx, 27, 23, p.jacketTrim, 3, 3);
  px(ctx, 23, 26, p.jacketTrim, 2, 2);

  // Neck
  px(ctx, 21, 20, p.outline, 6, 3);
  px(ctx, 22, 20, p.skinShadow, 4, 2);

  // Head / Face
  outlinedRect(ctx, 14, 8, 20, 13, p.skin, p.outline);
  px(ctx, 17, 19, p.skinShadow, 14, 1);

  // Expressive anime eyes
  px(ctx, 17, 13, '#ffffff', 4, 4);
  px(ctx, 18, 13, p.eye, 3, 4);
  px(ctx, 18, 13, '#ffffff', 1, 2);

  px(ctx, 27, 13, '#ffffff', 4, 4);
  px(ctx, 27, 13, p.eye, 3, 4);
  px(ctx, 28, 13, '#ffffff', 1, 2);

  // Smile
  px(ctx, 22, 18, '#c2695b', 4, 1);

  // Hair Crown & Bangs
  outlinedRect(ctx, 13, 5, 22, 7, p.hairBase, p.outline);
  px(ctx, 15, 6, p.hairLight, 18, 2);
  px(ctx, 14, 11, p.hairBase, 4, 2);
  px(ctx, 21, 10, p.hairBase, 6, 3);
  px(ctx, 30, 11, p.hairBase, 4, 2);

  if (!p.hasLongHair && !p.hasPonytail) {
    // Spiky anime boy hair
    px(ctx, 11, 7, p.outline, 3, 5);
    px(ctx, 12, 8, p.hairBase, 2, 3);
    px(ctx, 34, 7, p.outline, 3, 5);
    px(ctx, 34, 8, p.hairBase, 2, 3);
    // Top spikes (kept below y=2 so zero clipping!)
    px(ctx, 15, 2, p.outline, 4, 4);
    px(ctx, 16, 3, p.hairBase, 3, 3);
    px(ctx, 22, 1, p.outline, 5, 5);
    px(ctx, 23, 2, p.hairLight, 3, 4);
    px(ctx, 29, 2, p.outline, 4, 4);
    px(ctx, 29, 3, p.hairBase, 3, 3);
  } else {
    // Side locks framing face
    px(ctx, 13, 11, p.outline, 2, 10);
    px(ctx, 14, 11, p.hairBase, 1, 9);
    px(ctx, 33, 11, p.outline, 2, 10);
    px(ctx, 33, 11, p.hairBase, 1, 9);
  }

  // Goggles on head (Kai blue goggles / Hina pink goggles)
  if (p.hasGoggles) {
    outlinedRect(ctx, 14, 6, 20, 5, p.goggleFrame, p.outline);
    px(ctx, 15, 7, p.goggleLens, 6, 3);
    px(ctx, 27, 7, p.goggleLens, 6, 3);
    px(ctx, 16, 7, '#ffffff', 2, 1);
    px(ctx, 28, 7, '#ffffff', 2, 1);
    px(ctx, 21, 7, p.outline, 6, 3);
  }

  // Purple hairclip (Yuna)
  if (p.hasHairClip) {
    px(ctx, 15, 8, p.hairClipColor, 4, 3);
    px(ctx, 16, 9, '#ffffff', 2, 1);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Draws a single 48x56 Top-Down 2D frame with transparent background
 * supporting idle, walk, run, attack, hurt, and victory across 8 directions.
 */
function drawAnimationFrame48(
  ctx: CanvasRenderingContext2D,
  cellX: number,
  cellY: number,
  id: TamerId,
  state: TamerAnimationState,
  dir: Direction8,
  frameIdx: 0 | 1 | 2 | 3
) {
  const p = PALETTES[id];

  // Calculate per-state offsets (kept safely inside 48x56 frame bounds)
  let bobY = 0;
  let shiftX = 0;
  let stride = 0;
  let armSwing = 0;
  let leanX = 0;

  const facingBack = dir === 'N' || dir === 'NE' || dir === 'NW';
  const facingLeft = dir === 'W' || dir === 'NW' || dir === 'SW';
  const facingRight = dir === 'E' || dir === 'NE' || dir === 'SE';
  const sideProfile = dir === 'W' || dir === 'E';

  if (state === 'idle') {
    bobY = frameIdx === 2 ? -1 : 0;
  } else if (state === 'walk') {
    bobY = frameIdx === 1 || frameIdx === 3 ? 0 : -1;
    stride = frameIdx === 0 ? -2 : frameIdx === 2 ? 2 : 0;
    armSwing = stride;
  } else if (state === 'run') {
    bobY = frameIdx === 1 || frameIdx === 3 ? 0 : -2;
    stride = frameIdx === 0 ? -4 : frameIdx === 2 ? 4 : frameIdx === 1 ? -1 : 1;
    armSwing = stride;
    leanX = facingLeft ? -2 : facingRight ? 2 : 0;
  } else if (state === 'attack') {
    const lunge = frameIdx === 0 ? -2 : frameIdx === 1 ? 4 : frameIdx === 2 ? 3 : 1;
    shiftX = facingLeft ? -lunge : facingRight ? lunge : 0;
    bobY = frameIdx === 1 ? 1 : frameIdx === 2 ? -1 : 0;
  } else if (state === 'hurt') {
    const recoil = frameIdx === 0 ? -3 : frameIdx === 1 ? -2 : frameIdx === 2 ? -1 : 0;
    shiftX = facingLeft ? -recoil : facingRight ? recoil : recoil;
    bobY = frameIdx < 2 ? -1 : 0;
  } else if (state === 'victory') {
    bobY = frameIdx === 1 ? -5 : frameIdx === 2 ? -4 : frameIdx === 3 ? -1 : 1;
  }

  const cx = cellX + 24 + shiftX + leanX;
  const oy = cellY + 6 + bobY;

  // Ground shadow anchored cleanly at bottom of cell
  px(ctx, cellX + 15, cellY + 49, 'rgba(0,0,0,0.34)', 18, 3);

  // Speed streaks behind character when running
  if (state === 'run') {
    const trailX = facingRight ? cx - 17 : facingLeft ? cx + 11 : cx - 3;
    px(ctx, trailX, oy + 24, 'rgba(125,211,252,0.55)', 5, 1);
    px(ctx, trailX + (frameIdx % 2), oy + 30, 'rgba(125,211,252,0.4)', 4, 1);
  }

  // Footwear / Legs
  if (sideProfile) {
    const f1x = cx - 4 + stride;
    const f2x = cx - 2 - stride;
    if (p.hasBoots) {
      outlinedRect(ctx, f1x, oy + 36, 6, 8, p.shoeMain, p.outline);
      outlinedRect(ctx, f2x, oy + 36, 6, 8, p.shoeMain, p.outline);
      px(ctx, f1x + 1, oy + 37, p.shoeLight, 4, 1);
    } else {
      outlinedRect(ctx, f1x, oy + 38, 7, 6, p.shoeMain, p.outline);
      outlinedRect(ctx, f2x, oy + 38, 7, 6, p.shoeMain, p.outline);
      px(ctx, f1x + 1, oy + 42, p.shoeLight, 5, 1);
    }
  } else {
    const lShiftY = Math.round(stride * 0.5);
    const rShiftY = -lShiftY;
    if (p.hasBoots) {
      outlinedRect(ctx, cx - 8, oy + 36 + lShiftY, 6, 8, p.shoeMain, p.outline);
      outlinedRect(ctx, cx + 2, oy + 36 + rShiftY, 6, 8, p.shoeMain, p.outline);
      px(ctx, cx - 7, oy + 37 + lShiftY, p.shoeLight, 4, 1);
      px(ctx, cx + 3, oy + 37 + rShiftY, p.shoeLight, 4, 1);
    } else {
      outlinedRect(ctx, cx - 8, oy + 38 + lShiftY, 7, 6, p.shoeMain, p.outline);
      outlinedRect(ctx, cx + 1, oy + 38 + rShiftY, 7, 6, p.shoeMain, p.outline);
      px(ctx, cx - 7, oy + 42 + lShiftY, p.shoeLight, 5, 1);
      px(ctx, cx + 2, oy + 42 + rShiftY, p.shoeLight, 5, 1);
    }
  }

  // Pants or Skirt
  if (sideProfile) {
    outlinedRect(ctx, cx - 6, oy + 31, 12, 7, p.pantsOrSkirt, p.outline);
    if (p.isSkirt) px(ctx, cx - 5, oy + 36, p.shoeLight, 10, 1);
  } else {
    outlinedRect(ctx, cx - 8, oy + 31, 16, 7, p.pantsOrSkirt, p.outline);
    if (p.isSkirt) {
      px(ctx, cx - 7, oy + 36, p.shoeLight, 14, 1);
    } else {
      px(ctx, cx - 2, oy + 32, p.jacketTrim, 4, 1);
    }
  }

  // Back long hair (Yuna) when facing front/diagonal-front
  if (p.hasLongHair && !facingBack) {
    outlinedRect(ctx, cx - 10, oy + 14, 20, 17, p.hairBase, p.outline);
    px(ctx, cx - 8, oy + 16, p.hairShadow, 2, 12);
    px(ctx, cx + 6, oy + 16, p.hairShadow, 2, 12);
  }

  // Torso & Arms
  if (sideProfile) {
    outlinedRect(ctx, cx - 6, oy + 20, 12, 12, p.jacketMain, p.outline);
    px(ctx, cx - 4, oy + 22, p.jacketDark, 8, 8);
    // Active arm pose
    if (state === 'attack') {
      const punchDir = facingRight ? 1 : -1;
      const reach = frameIdx === 1 || frameIdx === 2 ? 9 : 4;
      outlinedRect(
        ctx,
        cx + punchDir * reach - 3,
        oy + 22,
        7,
        5,
        p.jacketMain,
        p.outline
      );
      outlinedRect(
        ctx,
        cx + punchDir * (reach + 4) - 2,
        oy + 22,
        5,
        5,
        p.glove,
        p.outline
      );
    } else {
      outlinedRect(
        ctx,
        cx - 3 + armSwing,
        oy + 22,
        6,
        9,
        p.jacketDark,
        p.outline
      );
      px(ctx, cx - 2 + armSwing, oy + 29, p.glove, 4, 3);
    }
  } else {
    // Left & Right Arms
    if (state === 'victory') {
      // Both arms raised triumphantly on frames 1-3!
      const raiseY = frameIdx === 0 ? oy + 22 : oy + 11;
      outlinedRect(ctx, cx - 12, raiseY, 5, 9, p.jacketMain, p.outline);
      px(ctx, cx - 11, raiseY - 2, p.glove, 3, 3);
      outlinedRect(ctx, cx + 7, raiseY, 5, 9, p.jacketMain, p.outline);
      px(ctx, cx + 8, raiseY - 2, p.glove, 3, 3);
    } else if (state === 'attack') {
      outlinedRect(ctx, cx - 12, oy + 21, 5, 9, p.jacketMain, p.outline);
      const strikeY = frameIdx === 1 || frameIdx === 2 ? oy + 18 : oy + 22;
      outlinedRect(ctx, cx + 7, strikeY, 6, 9, p.jacketMain, p.outline);
      outlinedRect(ctx, cx + 8, strikeY + 7, 5, 5, p.glove, p.outline);
    } else if (state === 'hurt') {
      outlinedRect(ctx, cx - 12, oy + 19, 5, 8, p.jacketMain, p.outline);
      outlinedRect(ctx, cx + 7, oy + 19, 5, 8, p.jacketMain, p.outline);
    } else {
      outlinedRect(
        ctx,
        cx - 12,
        oy + 21 - Math.round(armSwing * 0.5),
        5,
        10,
        p.jacketMain,
        p.outline
      );
      px(ctx, cx - 11, oy + 29 - Math.round(armSwing * 0.5), p.glove, 3, 3);
      outlinedRect(
        ctx,
        cx + 7,
        oy + 21 + Math.round(armSwing * 0.5),
        5,
        10,
        p.jacketMain,
        p.outline
      );
      px(ctx, cx + 8, oy + 29 + Math.round(armSwing * 0.5), p.glove, 3, 3);
    }

    // Jacket Torso
    outlinedRect(ctx, cx - 8, oy + 20, 16, 12, p.jacketMain, p.outline);
    if (!facingBack) {
      px(ctx, cx - 2, oy + 21, p.shirt, 4, 10);
      px(ctx, cx - 5, oy + 21, p.jacketTrim, 2, 3);
      px(ctx, cx + 3, oy + 21, p.jacketTrim, 2, 3);
    } else {
      px(ctx, cx - 5, oy + 22, p.jacketDark, 10, 7);
    }
  }

  // Head
  outlinedRect(ctx, cx - 9, oy + 4, 18, 16, p.skin, p.outline);

  if (facingBack) {
    outlinedRect(ctx, cx - 9, oy + 3, 18, 17, p.hairBase, p.outline);
    px(ctx, cx - 6, oy + 5, p.hairLight, 12, 4);
    if (!p.hasLongHair && !p.hasPonytail) {
      // Spikes on back of head
      px(ctx, cx - 5, oy + 1, p.hairBase, 4, 3);
      px(ctx, cx + 1, oy + 1, p.hairBase, 4, 3);
    }
    if (p.hasLongHair) {
      outlinedRect(ctx, cx - 8, oy + 16, 16, 11, p.hairBase, p.outline);
      px(ctx, cx - 5, oy + 18, p.hairShadow, 10, 7);
    }
    if (p.hasPonytail) {
      const sway = state === 'run' || state === 'walk' ? (frameIdx % 2 === 0 ? -1 : 1) : 0;
      outlinedRect(ctx, cx - 3 + sway, oy + 10, 7, 13, p.hairBase, p.outline);
      px(ctx, cx - 1 + sway, oy + 12, p.hairLight, 3, 6);
    }
  } else {
    // Top hair & bangs
    outlinedRect(ctx, cx - 9, oy + 3, 18, 7, p.hairBase, p.outline);
    px(ctx, cx - 6, oy + 4, p.hairLight, 12, 2);

    if (!p.hasLongHair && !p.hasPonytail) {
      // Spiky hair crown
      px(ctx, cx - 7, oy + 1, p.outline, 4, 3);
      px(ctx, cx - 6, oy + 2, p.hairBase, 2, 2);
      px(ctx, cx - 2, oy + 0, p.outline, 5, 4);
      px(ctx, cx - 1, oy + 1, p.hairLight, 3, 3);
      px(ctx, cx + 4, oy + 1, p.outline, 4, 3);
      px(ctx, cx + 5, oy + 2, p.hairBase, 2, 2);
    }

    // Blink on idle frame 3, squint on hurt
    const isBlinking = state === 'idle' && frameIdx === 3;
    const isHurt = state === 'hurt';
    const eyeShiftX = facingLeft ? -3 : facingRight ? 3 : 0;

    if (sideProfile) {
      const ex = facingLeft ? cx - 6 : cx + 3;
      if (isBlinking || isHurt) {
        px(ctx, ex, oy + 13, p.outline, 3, 1);
      } else {
        px(ctx, ex, oy + 11, '#ffffff', 3, 4);
        px(ctx, ex + (facingRight ? 1 : 0), oy + 11, p.eye, 2, 4);
        px(ctx, ex + 1, oy + 11, '#ffffff', 1, 1);
      }
    } else {
      if (isBlinking || isHurt) {
        px(ctx, cx - 6 + eyeShiftX, oy + 13, p.outline, 3, 1);
        px(ctx, cx + 3 + eyeShiftX, oy + 13, p.outline, 3, 1);
      } else {
        px(ctx, cx - 6 + eyeShiftX, oy + 11, '#ffffff', 3, 4);
        px(ctx, cx - 5 + eyeShiftX, oy + 11, p.eye, 2, 4);
        px(ctx, cx - 5 + eyeShiftX, oy + 11, '#ffffff', 1, 1);

        px(ctx, cx + 3 + eyeShiftX, oy + 11, '#ffffff', 3, 4);
        px(ctx, cx + 3 + eyeShiftX, oy + 11, p.eye, 2, 4);
        px(ctx, cx + 4 + eyeShiftX, oy + 11, '#ffffff', 1, 1);
      }
    }

    // Ponytail visible on side (Hina)
    if (p.hasPonytail) {
      const ponyX = facingRight ? cx - 13 : cx + 8;
      const sway = state === 'run' ? (frameIdx % 2 === 0 ? -1 : 1) : 0;
      outlinedRect(ctx, ponyX, oy + 7 + sway, 6, 12, p.hairBase, p.outline);
      px(ctx, ponyX + 1, oy + 9 + sway, p.hairLight, 2, 5);
    }
  }

  // Goggles (Kai blue / Hina pink)
  if (p.hasGoggles) {
    if (facingBack) {
      px(ctx, cx - 8, oy + 6, p.goggleFrame, 16, 3);
    } else {
      const gx = facingLeft ? cx - 8 : facingRight ? cx - 4 : cx - 7;
      outlinedRect(ctx, gx, oy + 4, 14, 4, p.goggleFrame, p.outline);
      px(ctx, gx + 1, oy + 5, p.goggleLens, 4, 2);
      px(ctx, gx + 9, oy + 5, p.goggleLens, 4, 2);
      px(ctx, gx + 2, oy + 5, '#ffffff', 1, 1);
      px(ctx, gx + 10, oy + 5, '#ffffff', 1, 1);
    }
  }

  // Purple hairclip (Yuna)
  if (p.hasHairClip && !facingBack) {
    px(ctx, cx - 7, oy + 7, p.hairClipColor, 3, 3);
    px(ctx, cx - 6, oy + 8, '#ffffff', 1, 1);
  }

  // Attack Digital Energy Burst FX (frames 1 & 2, safely within frame bounds)
  if (state === 'attack' && (frameIdx === 1 || frameIdx === 2)) {
    const burstX = facingLeft ? cx - 19 : facingRight ? cx + 11 : cx + 6;
    const burstY = facingBack ? oy + 8 : dir === 'S' ? oy + 28 : oy + 20;
    const size = frameIdx === 1 ? 7 : 9;
    px(ctx, burstX, burstY, p.attackAura, size, 3);
    px(ctx, burstX + 2, burstY - 2, '#ffffff', 3, 7);
    px(ctx, burstX - 1, burstY + 1, '#ffffff', size + 2, 1);
  }

  // Hurt Impact Flash Tint (frames 0 & 2)
  if (state === 'hurt' && (frameIdx === 0 || frameIdx === 2)) {
    px(ctx, cx - 10, oy + 3, 'rgba(255, 90, 110, 0.38)', 20, 40);
  }

  // Victory Sparkles (frames 1 & 2)
  if (state === 'victory' && (frameIdx === 1 || frameIdx === 2)) {
    px(ctx, cx - 15, oy + 6, '#ffd43b', 3, 1);
    px(ctx, cx - 14, oy + 5, '#ffd43b', 1, 3);
    px(ctx, cx + 13, oy + 4, '#38e8ff', 3, 1);
    px(ctx, cx + 14, oy + 3, '#38e8ff', 1, 3);
    px(ctx, cx, oy - 1, '#ffffff', 2, 2);
  }
}

const spriteCache = new Map<TamerId, TamerSpritesheetData>();

function getRowIndex(state: TamerAnimationState, dir: Direction8): number {
  const dirIdx = Math.max(0, DIRECTIONS_8.indexOf(dir));
  switch (state) {
    case 'idle':
      return dirIdx;
    case 'walk':
      return 8 + dirIdx;
    case 'run':
      return 16 + dirIdx;
    case 'attack':
      return 24 + dirIdx;
    case 'hurt':
      return 32 + dirIdx;
    case 'victory':
      return 40;
  }
}

/**
 * Generates and caches an individual transparent-background 2D spritesheet
 * containing all 10 required animations in uniform 48x56 frames.
 */
export function getTamerSprites(id: TamerId): TamerSpritesheetData {
  const cached = spriteCache.get(id);
  if (cached) return cached;

  const [sheetCanvas, sheetCtx] = createCanvas(
    FRAME_W * COLS,
    FRAME_H * TOTAL_ROWS
  );

  const statesWith8Dir: TamerAnimationState[] = [
    'idle',
    'walk',
    'run',
    'attack',
    'hurt',
  ];

  // Draw all 8-direction animation groups
  statesWith8Dir.forEach((state) => {
    DIRECTIONS_8.forEach((dir) => {
      const row = getRowIndex(state, dir);
      ([0, 1, 2, 3] as const).forEach((col) => {
        drawAnimationFrame48(
          sheetCtx,
          col * FRAME_W,
          row * FRAME_H,
          id,
          state,
          dir,
          col
        );
      });
    });
  });

  // Draw victory row (row 40)
  ([0, 1, 2, 3] as const).forEach((col) => {
    drawAnimationFrame48(
      sheetCtx,
      col * FRAME_W,
      40 * FRAME_H,
      id,
      'victory',
      'S',
      col
    );
  });

  // Extract walk frames as quick URLs for the CharacterSelect preview widget
  const topDownFrames = {} as Record<
    Direction8,
    [string, string, string, string]
  >;
  DIRECTIONS_8.forEach((dir) => {
    const row = getRowIndex('walk', dir);
    const urls: string[] = [];
    ([0, 1, 2, 3] as const).forEach((col) => {
      const [fc, fctx] = createCanvas(FRAME_W, FRAME_H);
      fctx.drawImage(
        sheetCanvas,
        col * FRAME_W,
        row * FRAME_H,
        FRAME_W,
        FRAME_H,
        0,
        0,
        FRAME_W,
        FRAME_H
      );
      urls.push(fc.toDataURL('image/png'));
    });
    topDownFrames[dir] = urls as [string, string, string, string];
  });

  const data: TamerSpritesheetData = {
    id,
    frameWidth: FRAME_W,
    frameHeight: FRAME_H,
    columns: COLS,
    rows: TOTAL_ROWS,
    directions: DIRECTIONS_8,
    spritesheetCanvas: sheetCanvas,
    spritesheetUrl: sheetCanvas.toDataURL('image/png'),
    showcaseSpriteUrl: drawShowcaseSprite48(id),
    topDownFrames,
    getFrameRect(state, direction, frameIndex): SpriteFrameRect {
      const row = getRowIndex(state, direction);
      const col = ((frameIndex % COLS) + COLS) % COLS;
      return {
        sx: col * FRAME_W,
        sy: row * FRAME_H,
        sw: FRAME_W,
        sh: FRAME_H,
      };
    },
  };

  spriteCache.set(id, data);
  return data;
}
