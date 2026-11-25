import type { DatsCollider, DatsInteractionPoint } from './datsCenterMap';
import type {
  EnemyMonsterInstance,
  EnemyMonsterTemplate,
  FriendlyFieldNpc,
  HuntingDepthDrawable,
  HuntingExplorationZone,
  HuntingHabitatPackSpec,
} from './huntingFieldMap';
import {
  applyContrastAdaptiveSharpen,
  MAP_HIDPI_SCALE,
} from '../utils/canvasSharpen';

export const DARK_AREA_MAP_ID = 'dark-area' as const;

/**
 * Exact 16:9 world dimensions matching the Área Sombria artwork,
 * keeping identical scale, HiDPI sharpness, and 2.5D navigation to all other maps.
 */
export const DARK_AREA_WORLD_W = 2400;
export const DARK_AREA_WORLD_H = 1350;

export const DARK_AREA_IMAGE_URL =
  '/assets/aistudio/file_00000000685c820eab8031e9566fd2a7_68177180.webp';
export const DARK_AREA_BANNER_URL = DARK_AREA_IMAGE_URL;

/**
 * Player arrives on the South-East Circular Rune Sanctuary facing north-west
 * across the great obsidian arch bridge toward the Violet Cascades and Dark Citadel.
 */
export const DARK_AREA_SPAWN_POINT = {
  x: 1565,
  y: 1095,
  facingDir: 'N' as const,
};

/**
 * Luminous violet-gold rune circle at the SE Sanctuary returning to DATS Center.
 */
export const DARK_AREA_RETURN_PORTAL = {
  x: 1565,
  y: 1135,
  radius: 92,
} as const;

/**
 * Safe Sanctuary around the SE Circular Rune Altar:
 * Partner never initiates combat here and HP/DS recover naturally.
 */
export const DARK_AREA_SAFE_ZONE = {
  x: 1565,
  y: 1110,
  radius: 190,
  label: 'Altar do Portal Sombrio',
} as const;

export const DARK_AREA_EXPLORATION_ZONES: readonly HuntingExplorationZone[] = [
  {
    id: 'dark-south-altar',
    name: 'Altar do Portal Sombrio',
    subtitle: 'Zona Segura · Portal de Retorno DATS',
    x: 1565,
    y: 1110,
    radius: 200,
  },
  {
    id: 'dark-bridge-terrace',
    name: 'Terraço da Ponte Abissal',
    subtitle: 'Território dos MetalEtemon (Nv. 60–61)',
    x: 700,
    y: 890,
    radius: 265,
    speciesLabel: 'MetalEtemon',
  },
  {
    id: 'dark-chained-spire',
    name: 'Torre Acorrentada Oeste',
    subtitle: 'Território dos Boltmon (Nv. 62–63)',
    x: 420,
    y: 690,
    radius: 245,
    speciesLabel: 'Boltmon',
  },
  {
    id: 'dark-violet-cascades',
    name: 'Cascatas Violetas Centrais',
    subtitle: 'Território dos GranKuwagamon (Nv. 64–65)',
    x: 1225,
    y: 735,
    radius: 255,
    speciesLabel: 'GranKuwagamon',
  },
  {
    id: 'dark-floating-ridge',
    name: 'Penhasco da Ilha Flutuante',
    subtitle: 'Território dos Beelzemon (Nv. 66–67)',
    x: 1865,
    y: 735,
    radius: 255,
    speciesLabel: 'Beelzemon',
  },
  {
    id: 'dark-citadel-forecourt',
    name: 'Átrio da Cidadela Sombria',
    subtitle: 'Território dos Diaboromon (Nv. 68–70)',
    x: 1410,
    y: 475,
    radius: 290,
    speciesLabel: 'Diaboromon',
  },
] as const;

export const DARK_AREA_INTERACTION_POINTS: readonly DatsInteractionPoint[] = [
  {
    id: 'dark-citadel-gate',
    kind: 'main-entrance',
    title: 'Portão da Cidadela Sombria',
    badge: 'Cidadela',
    description:
      'Fortaleza gótica erguida sob a lua cheia no ápice da Área Sombria. Diaboromon (Nv. 68–70) guardam o átrio superior com poder de anomalia extrema.',
    futureModule: 'Santuário da Cidadela Sombria e Raids Mega',
    x: 1495,
    y: 410,
    radius: 94,
    accentColor: '#c084fc',
  },
  {
    id: 'dark-chained-monolith',
    kind: 'tamer-terminal',
    title: 'Torre Acorrentada Oeste',
    badge: 'Monólito',
    description:
      'Obelisco aprisionado por correntes colossais às margens do mar sombrio. Boltmon (Nv. 62–63) patrulham o círculo rúnico ao redor da torre.',
    futureModule: 'Selo das Correntes Abissais',
    x: 410,
    y: 660,
    radius: 90,
    accentColor: '#a855f7',
  },
  {
    id: 'dark-cascades-basin',
    kind: 'info-npc',
    title: 'Lagoa das Cascatas Violetas',
    badge: 'Cascatas',
    description:
      'Bacia iluminada por energia ametista no coração da ilha, abaixo das escadarias principais. GranKuwagamon (Nv. 64–65) sobrevoam o desfiladeiro.',
    futureModule: 'Fenda das Cascatas Sombrias',
    x: 1215,
    y: 735,
    radius: 90,
    accentColor: '#e879f9',
  },
  {
    id: 'dark-floating-rift-cliff',
    kind: 'tamer-terminal',
    title: 'Mirante da Ilha Flutuante',
    badge: 'Fenda',
    description:
      'Penhasco oriental sob o portal suspenso no céu noturno. Beelzemon (Nv. 66–67) duelam ao longo das escadarias de obsidiana.',
    futureModule: 'Ascensão ao Portal Suspenso',
    x: 1920,
    y: 720,
    radius: 90,
    accentColor: '#f472b6',
  },
  {
    id: 'dark-bridge-gatehouse',
    kind: 'tamer-terminal',
    title: 'Ponte de Obsidiana Sul',
    badge: 'Ponte',
    description:
      'Grande ponte em arcos que liga o Altar do Portal Sombrio às terras baixas ocidentais dominadas pelos MetalEtemon (Nv. 60–61).',
    futureModule: 'Travessia do Abismo',
    x: 1095,
    y: 945,
    radius: 88,
    accentColor: '#38bdf8',
  },
] as const;

export const DARK_AREA_FRIENDLY_NPCS: readonly FriendlyFieldNpc[] = [] as const;

/**
 * Snag-free collision geometry aligned to the 2400x1350 Área Sombria artwork:
 * - Keeps the SE Circular Rune Sanctuary, Stone Arch Bridge, West Bridge Terrace,
 *   West Chained Tower Plaza, Central Violet Cascades, East Floating-Island Ridge,
 *   and North Dark Citadel Forecourt 100% open and walkable!
 * - Bounds outer abyssal seas, lunar sky horizon, and citadel summit back cleanly.
 */
export const DARK_AREA_COLLIDERS: readonly DatsCollider[] = [
  // 1. Northern Moonlit Sky Horizon & Dark Citadel Summit Back
  { id: 'da-north-sky-nw', x: 0, y: 0, w: 960, h: 415, kind: 'wall' },
  { id: 'da-north-citadel-back', x: 960, y: 0, w: 880, h: 380, kind: 'building' },
  { id: 'da-north-sky-ne', x: 1840, y: 0, w: 560, h: 470, kind: 'wall' },

  // 2. Outer Dark Sea Borders (West, East & South)
  { id: 'da-west-ocean-mid', x: 0, y: 415, w: 185, h: 435, kind: 'wall' },
  { id: 'da-west-ocean-bot', x: 0, y: 850, w: 280, h: 500, kind: 'wall' },
  { id: 'da-east-ocean-mid', x: 2205, y: 470, w: 195, h: 460, kind: 'wall' },
  { id: 'da-east-ocean-bot', x: 2215, y: 930, w: 185, h: 420, kind: 'wall' },
  { id: 'da-south-ocean-left', x: 280, y: 1125, w: 1060, h: 225, kind: 'wall' },
  { id: 'da-south-ocean-right', x: 1795, y: 1215, w: 420, h: 135, kind: 'wall' },
  { id: 'da-south-sanctuary-tip', x: 1340, y: 1295, w: 455, h: 55, kind: 'wall' },
] as const;

export function ensureSafeDarkAreaSpawn(
  x: number,
  y: number
): { x: number; y: number } {
  if (
    x < 200 ||
    x > DARK_AREA_WORLD_W - 210 ||
    y < 390 ||
    y > DARK_AREA_WORLD_H - 65
  ) {
    return { x: DARK_AREA_SPAWN_POINT.x, y: DARK_AREA_SPAWN_POINT.y };
  }
  for (const col of DARK_AREA_COLLIDERS) {
    if (
      x >= col.x - 18 &&
      x <= col.x + col.w + 18 &&
      y >= col.y - 18 &&
      y <= col.y + col.h + 18
    ) {
      return { x: DARK_AREA_SPAWN_POINT.x, y: DARK_AREA_SPAWN_POINT.y };
    }
  }
  return { x, y };
}

/**
 * 2.5D perspective depth scaling calibrated for Área Sombria.
 */
export function getDarkAreaPerspectiveScale(worldY: number): number {
  const t = Math.max(0, Math.min(1, (worldY - 385) / (1220 - 385)));
  return 0.84 + t * 0.22;
}

export function isPointInDarkAreaSafeZone(x: number, y: number): boolean {
  return (
    Math.hypot(x - DARK_AREA_SAFE_ZONE.x, y - DARK_AREA_SAFE_ZONE.y) <=
    DARK_AREA_SAFE_ZONE.radius
  );
}

export function getDarkAreaZoneAtPoint(
  x: number,
  y: number
): HuntingExplorationZone | null {
  let closest: HuntingExplorationZone | null = null;
  let bestDist = Infinity;
  for (const zone of DARK_AREA_EXPLORATION_ZONES) {
    const d = Math.hypot(x - zone.x, y - zone.y);
    if (d <= zone.radius && d < bestDist) {
      bestDist = d;
      closest = zone;
    }
  }
  return closest;
}

// ============================================================================
// 5 DARK MEGA WILD DIGIMON TERRITORIES (LV. 60–70 · 35 MOBS TOTAL)
// MetalEtemon (Gotsumon), Boltmon (DemiMeramon), GranKuwagamon (Kunemon),
// Beelzemon (Impmon) & Diaboromon (Keramon)
// Every single spawn coordinate sits cleanly clear of all colliders!
// ============================================================================

export const DARK_AREA_HABITAT_PACKS: readonly HuntingHabitatPackSpec[] = [
  {
    species: 'metaletemon',
    displayName: 'MetalEtemon',
    habitatName: 'Terraço da Ponte Abissal',
    zoneId: 'dark-bridge-terrace',
    levelMin: 60,
    levelMax: 61,
    baseHp: 60500,
    hpPerLevel: 3000,
    baseExp: 12900,
    expPerLevel: 720,
    bodyColor: '#94a3b8',
    accentColor: '#f59e0b',
    eyeColor: '#ef4444',
    spawns: [
      [425, 865],
      [515, 920],
      [610, 845],
      [700, 910],
      [795, 845],
      [885, 905],
      [945, 945],
    ],
  },
  {
    species: 'boltmon',
    displayName: 'Boltmon',
    habitatName: 'Torre Acorrentada Oeste',
    zoneId: 'dark-chained-spire',
    levelMin: 62,
    levelMax: 63,
    baseHp: 67200,
    hpPerLevel: 3300,
    baseExp: 14500,
    expPerLevel: 790,
    bodyColor: '#64748b',
    accentColor: '#f97316',
    eyeColor: '#fde047',
    spawns: [
      [245, 675],
      [330, 625],
      [425, 705],
      [515, 640],
      [605, 695],
      [345, 765],
      [510, 765],
    ],
  },
  {
    species: 'grankuwagamon',
    displayName: 'GranKuwagamon',
    habitatName: 'Cascatas Violetas Centrais',
    zoneId: 'dark-violet-cascades',
    levelMin: 64,
    levelMax: 65,
    baseHp: 74500,
    hpPerLevel: 3600,
    baseExp: 16250,
    expPerLevel: 860,
    bodyColor: '#312e81',
    accentColor: '#a855f7',
    eyeColor: '#ef4444',
    spawns: [
      [1015, 710],
      [1105, 660],
      [1215, 745],
      [1315, 665],
      [1425, 720],
      [1135, 810],
      [1345, 810],
    ],
  },
  {
    species: 'beelzemon',
    displayName: 'Beelzemon',
    habitatName: 'Penhasco da Ilha Flutuante',
    zoneId: 'dark-floating-ridge',
    levelMin: 66,
    levelMax: 67,
    baseHp: 82400,
    hpPerLevel: 3900,
    baseExp: 18100,
    expPerLevel: 940,
    bodyColor: '#4c1d95',
    accentColor: '#c084fc',
    eyeColor: '#ef4444',
    spawns: [
      [1645, 725],
      [1745, 660],
      [1845, 745],
      [1945, 665],
      [2055, 720],
      [1765, 820],
      [1965, 815],
    ],
  },
  {
    species: 'diaboromon',
    displayName: 'Diaboromon',
    habitatName: 'Átrio da Cidadela Sombria',
    zoneId: 'dark-citadel-forecourt',
    levelMin: 68,
    levelMax: 70,
    baseHp: 91200,
    hpPerLevel: 4200,
    baseExp: 20200,
    expPerLevel: 1050,
    bodyColor: '#581c87',
    accentColor: '#e879f9',
    eyeColor: '#facc15',
    spawns: [
      [1075, 465],
      [1190, 440],
      [1315, 495],
      [1445, 435],
      [1565, 445],
      [1675, 490],
      [1745, 520],
    ],
  },
] as const;

const DARK_AREA_TEMPLATES: readonly EnemyMonsterTemplate[] =
  DARK_AREA_HABITAT_PACKS.flatMap((pack) => {
    const levelSpan = Math.max(0, pack.levelMax - pack.levelMin);
    return pack.spawns.map(([homeX, homeY], memberIdx) => {
      const level =
        levelSpan === 0
          ? pack.levelMin
          : pack.levelMin +
            Math.min(
              levelSpan,
              Math.floor((memberIdx * (levelSpan + 1)) / pack.spawns.length)
            );
      const lvOffset = Math.max(0, level - pack.levelMin);
      return {
        species: pack.species,
        name: pack.displayName,
        level,
        maxHp: Math.round(pack.baseHp + lvOffset * pack.hpPerLevel),
        expReward: Math.round(pack.baseExp + lvOffset * pack.expPerLevel),
        bodyColor: pack.bodyColor,
        accentColor: pack.accentColor,
        eyeColor: pack.eyeColor,
        homeX,
        homeY,
        zoneId: pack.zoneId,
      };
    });
  });

export function createInitialDarkAreaMonsters(): EnemyMonsterInstance[] {
  return DARK_AREA_TEMPLATES.map((tpl, idx) => ({
    ...tpl,
    id: `dark-${idx}-${tpl.species}`,
    disposition: 'enemy',
    x: tpl.homeX,
    y: tpl.homeY,
    hp: tpl.maxHp,
    alive: true,
    respawnTimer: 0,
    hitFlashTimer: 0,
    attackAnimTimer: 0,
    facingRight: idx % 2 === 0,
    patrolAngle: (idx * 1.27) % (Math.PI * 2),
    patrolTimer: 0,
    aggroed: false,
    aggroTimer: 0,
    counterCooldown: 0,
  }));
}

/**
 * Static subtle vector accents layered cleanly over the decoded Área Sombria artwork:
 * - Soft nocturnal moonlight & violet abyss wash
 * - Luminous amethyst sanctuary aura ring around the SE Rune Altar
 * ZERO text or labels painted on the ground!
 */
function paintDarkAreaStaticEnhancements(ctx: CanvasRenderingContext2D): void {
  ctx.save();

  const nightWash = ctx.createRadialGradient(1320, 260, 140, 1200, 680, 1500);
  nightWash.addColorStop(0, 'rgba(192, 132, 252, 0.11)');
  nightWash.addColorStop(0.55, 'rgba(126, 34, 206, 0.05)');
  nightWash.addColorStop(1, 'rgba(9, 4, 24, 0.18)');
  ctx.fillStyle = nightWash;
  ctx.fillRect(0, 0, DARK_AREA_WORLD_W, DARK_AREA_WORLD_H);

  // SE Rune Altar Safe Zone sanctuary ring
  ctx.save();
  ctx.translate(DARK_AREA_SAFE_ZONE.x, DARK_AREA_SAFE_ZONE.y);
  const safeAura = ctx.createRadialGradient(
    0,
    0,
    24,
    0,
    0,
    DARK_AREA_SAFE_ZONE.radius
  );
  safeAura.addColorStop(0, 'rgba(192, 132, 252, 0.18)');
  safeAura.addColorStop(0.75, 'rgba(168, 85, 247, 0.06)');
  safeAura.addColorStop(1, 'rgba(168, 85, 247, 0)');
  ctx.fillStyle = safeAura;
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    DARK_AREA_SAFE_ZONE.radius,
    DARK_AREA_SAFE_ZONE.radius * 0.44,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.strokeStyle = 'rgba(216, 180, 254, 0.52)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    DARK_AREA_SAFE_ZONE.radius - 6,
    (DARK_AREA_SAFE_ZONE.radius - 6) * 0.42,
    0,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.restore();
}

/**
 * High-DPI offscreen terrain layer for Área Sombria with contrast-adaptive sharpening.
 */
export function buildDarkAreaStaticLayer(): HTMLCanvasElement {
  const pixelW = Math.round(DARK_AREA_WORLD_W * MAP_HIDPI_SCALE);
  const pixelH = Math.round(DARK_AREA_WORLD_H * MAP_HIDPI_SCALE);
  const canvas = document.createElement('canvas');
  canvas.width = pixelW;
  canvas.height = pixelH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const fallbackGrad = ctx.createLinearGradient(0, 0, 0, pixelH);
  fallbackGrad.addColorStop(0, '#1e1b4b');
  fallbackGrad.addColorStop(0.45, '#2e1065');
  fallbackGrad.addColorStop(1, '#090518');
  ctx.fillStyle = fallbackGrad;
  ctx.fillRect(0, 0, pixelW, pixelH);

  const img = new Image();
  img.decoding = 'async';
  img.src = DARK_AREA_IMAGE_URL;
  img.onload = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pixelW, pixelH);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = 'contrast(1.07) saturate(1.1) brightness(1.03)';
    ctx.drawImage(img, 0, 0, pixelW, pixelH);
    ctx.restore();

    applyContrastAdaptiveSharpen(ctx, pixelW, pixelH, 1.08);

    ctx.save();
    ctx.scale(MAP_HIDPI_SCALE, MAP_HIDPI_SCALE);
    paintDarkAreaStaticEnhancements(ctx);
    ctx.restore();
  };

  return canvas;
}

/**
 * Living 2.5D environmental animations layered smoothly over Área Sombria:
 * - North Dark Citadel violet gate beacon & moonlit spire shimmer
 * - SE Rune Altar Safe Return Portal glow, highlight ring & rising amethyst motes
 * - West Chained Tower spire pulse & circling spectral sparks
 * - Floating East Ring Island energy beam shimmer
 * - Central Violet Waterfall mist & abyssal shoreline lava/violet embers
 */
export function drawDarkAreaGroundAnimations(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  nearPortal: boolean
): void {
  const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  ctx.save();

  // 1. North Dark Citadel violet gate & spire pulse
  const citadelPulse = 0.24 + Math.sin(safeElapsed * 2.5) * 0.1;
  ctx.fillStyle = `rgba(192, 132, 252, ${citadelPulse.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(1495, 290, 44, 68, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Return portal rendered by unified dimensional portal gate
  void nearPortal;

  // 3. West Chained Tower amethyst ring & circling sparks
  const towerPulse = 1 + Math.sin(safeElapsed * 3.1) * 0.1;
  const towerGlow = ctx.createRadialGradient(410, 680, 8, 410, 680, 96 * towerPulse);
  towerGlow.addColorStop(0, 'rgba(192, 132, 252, 0.44)');
  towerGlow.addColorStop(0.55, 'rgba(126, 34, 206, 0.18)');
  towerGlow.addColorStop(1, 'rgba(126, 34, 206, 0)');
  ctx.fillStyle = towerGlow;
  ctx.beginPath();
  ctx.ellipse(410, 680, 90 * towerPulse, 44 * towerPulse, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 6; i++) {
    const phase = (safeElapsed * 0.46 + i * 0.17) % 1;
    const wx = 410 + Math.sin(safeElapsed * 1.8 + i * 2.1) * 44;
    const wy = 710 - phase * 125;
    const alpha = Math.sin(phase * Math.PI) * 0.66;
    ctx.fillStyle = `rgba(216, 180, 254, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(wx, wy, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Floating East Portal Island energy beam pulse
  const riftPulse = 0.24 + Math.sin(safeElapsed * 3.0) * 0.12;
  ctx.fillStyle = `rgba(217, 70, 239, ${riftPulse.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(2148, 292, 34, 86, 0, 0, Math.PI * 2);
  ctx.fill();

  // 5. Animated Violet Waterfall Mist across the central chasm
  const waterfalls = [
    { x: 1325, y: 745, rx: 48, ry: 16 },
    { x: 1715, y: 725, rx: 40, ry: 14 },
    { x: 760, y: 970, rx: 36, ry: 13 },
  ];
  for (let f = 0; f < waterfalls.length; f++) {
    const wf = waterfalls[f];
    const wave = (safeElapsed * 1.55 + f * 0.26) % 1;
    const mistAlpha = 0.22 + Math.sin(safeElapsed * 3.4 + f * 1.3) * 0.08;
    ctx.fillStyle = `rgba(233, 213, 255, ${mistAlpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(
      wf.x + Math.sin(safeElapsed * 2.1 + f) * 3.5,
      wf.y,
      wf.rx,
      wf.ry,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle = `rgba(216, 180, 254, ${((1 - wave) * 0.42).toFixed(3)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(
      wf.x,
      wf.y + 4,
      wf.rx * (0.52 + wave * 0.68),
      wf.ry * (0.52 + wave * 0.68),
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  // 6. Abyssal embers & moonlight glints across the sea and cliffs
  const abyssGlints: ReadonlyArray<readonly [number, number, string]> = [
    [620, 1140, '192, 132, 252'],
    [1180, 1210, '251, 146, 60'],
    [1860, 1200, '249, 115, 22'],
    [410, 860, '216, 180, 254'],
    [1220, 725, '232, 121, 249'],
    [1900, 725, '192, 132, 252'],
    [1470, 455, '216, 180, 254'],
  ];
  for (let i = 0; i < abyssGlints.length; i++) {
    const [fx, fy, rgb] = abyssGlints[i];
    const dx = Math.sin(safeElapsed * 1.15 + i * 2.1) * 26;
    const dy =
      Math.cos(safeElapsed * 0.85 + i * 1.6) * 10 -
      ((safeElapsed * 5 + i * 11) % 20);
    const alpha = 0.28 + Math.sin(safeElapsed * 2.8 + i * 1.3) * 0.18;
    ctx.fillStyle = `rgba(${rgb}, ${Math.max(0.08, alpha).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(fx + dx, fy + dy, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Depth-sorted dynamic actors on Área Sombria (only entities with real sprites render in-world).
 */
export function buildDarkAreaDepthProps(): HuntingDepthDrawable[] {
  return [];
}
