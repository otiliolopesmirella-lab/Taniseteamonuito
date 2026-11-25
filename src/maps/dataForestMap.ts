import type { DatsCollider, DatsInteractionPoint } from './datsCenterMap';
import type {
  EnemyMonsterInstance,
  EnemyMonsterTemplate,
  FriendlyFieldNpc,
  HuntingDepthDrawable,
  HuntingExplorationZone,
  HuntingHabitatPackSpec,
} from './huntingFieldMap';
import { KUWAGAMON_BOSS_ID, KUWAGAMON_MAX_HP } from '../services/worldBossService';
import {
  applyContrastAdaptiveSharpen,
  MAP_HIDPI_SCALE,
} from '../utils/canvasSharpen';

export const DATA_FOREST_MAP_ID = 'data-forest' as const;

/**
 * Exact 16:9 world dimensions matching the uploaded 1672x941 Floresta de Dados artwork.
 * Crafted for silky mobile-first exploration across 3 wooden bridges, ancient crystal ruins,
 * 5 dedicated Lv. 10–20 hunting grounds, and the monumental Sacred Great Tree Raid Arena.
 */
export const DATA_FOREST_WORLD_W = 2400;
export const DATA_FOREST_WORLD_H = 1350;

export const DATA_FOREST_IMAGE_URL =
  '/assets/aistudio/file_00000000e718820e94cc1cd8031886df_8112833e.webp';

/**
 * Player spawns safely inside the glowing cyan Teleport Sanctuary at the bottom-right plaza,
 * facing west toward the Lower Wooden Bridge leading into the forest trails.
 */
export const DATA_FOREST_SPAWN_POINT = {
  x: 2070,
  y: 1095,
  facingDir: 'W' as const,
};

/**
 * Glowing cyan teleport circle inside the Sanctuary returning to DATS Center.
 */
export const DATA_FOREST_RETURN_PORTAL = {
  x: 2215,
  y: 1085,
  radius: 86,
} as const;

/**
 * Protected Sanctuary around the bottom-right Teleport Plaza:
 * Partner never initiates combat here and HP/DS regenerate safely.
 */
export const DATA_FOREST_SAFE_ZONE = {
  x: 2150,
  y: 1085,
  radius: 195,
  label: 'Santuário do Portal Sul',
} as const;

/**
 * Center of the monumental Sacred Great Tree Raid Arena at top-center,
 * right above the stone staircase where Raid Boss Kuwagamon always spawns.
 */
export const DATA_FOREST_BOSS_ARENA = {
  x: 1215,
  y: 472,
  radius: 145,
} as const;

export const DATA_FOREST_EXPLORATION_ZONES: readonly HuntingExplorationZone[] = [
  {
    id: 'df-sanctuary',
    name: 'Santuário do Portal Sul',
    subtitle: 'Zona Segura · Portal de Retorno DATS',
    x: 2150,
    y: 1085,
    radius: 205,
  },
  {
    id: 'df-south-glade',
    name: 'Clareira do Sul',
    subtitle: 'Território dos Impmon (Nv. 10–11)',
    x: 1095,
    y: 1105,
    radius: 260,
    speciesLabel: 'Impmon',
  },
  {
    id: 'df-crystal-woods',
    name: 'Bosque dos Cristais',
    subtitle: 'Território dos Renamon (Nv. 12–13)',
    x: 560,
    y: 895,
    radius: 235,
    speciesLabel: 'Renamon',
  },
  {
    id: 'df-west-falls',
    name: 'Trilha da Cachoeira Oeste',
    subtitle: 'Território dos Guilmon (Nv. 14–15)',
    x: 545,
    y: 580,
    radius: 190,
    speciesLabel: 'Guilmon',
  },
  {
    id: 'df-east-roots',
    name: 'Bosque das Raízes Leste',
    subtitle: 'Território dos Garurumon (Nv. 16–17)',
    x: 1810,
    y: 780,
    radius: 245,
    speciesLabel: 'Garurumon',
  },
  {
    id: 'df-data-terrace',
    name: 'Terraço dos Dados',
    subtitle: 'Território dos Greymon (Nv. 18–20)',
    x: 1845,
    y: 530,
    radius: 245,
    speciesLabel: 'Greymon',
  },
  {
    id: 'df-sacred-tree',
    name: 'Altar da Grande Árvore',
    subtitle: 'Arena de Raid · Boss Kuwagamon (Nv. 20)',
    x: 1215,
    y: 485,
    radius: 215,
    speciesLabel: 'Kuwagamon (BOSS)',
  },
] as const;

export const DATA_FOREST_INTERACTION_POINTS: readonly DatsInteractionPoint[] = [
  {
    id: 'df-crystal-ruin-point',
    kind: 'tamer-terminal',
    title: 'Ruína dos Cristais de Dados',
    badge: 'Cristais',
    description:
      'Pilares ancestrais cobertos por cristais de dados puros. Os Renamon patrulham silenciosamente este bosque e dropam seu DigiEgg Mercenário.',
    futureModule: 'Coleta de Fragmentos de Dados e Missões da Floresta',
    x: 555,
    y: 985,
    radius: 82,
    accentColor: '#38e8ff',
  },
  {
    id: 'df-sacred-tree-altar',
    kind: 'main-entrance',
    title: 'Altar da Grande Árvore Sagrada',
    badge: 'Boss Raid',
    description:
      'O coração energético da Floresta de Dados. O temível Boss Kuwagamon (Nv. 20) surge constantemente diante desta escadaria — reúna outros Tamers online para derrotá-lo em equipe!',
    futureModule: 'Sistema de Drops Especiais de Raid Boss',
    x: 1205,
    y: 418,
    radius: 92,
    accentColor: '#f87171',
  },
  {
    id: 'df-east-bridge-view',
    kind: 'info-npc',
    title: 'Arco das Raízes Antigas',
    badge: 'Observatório',
    description:
      'Passagem de pedra entre o Santuário Sul e o Terraço dos Dados, guardada pelos Garurumon e Greymon de nível alto.',
    futureModule: 'Expedições Cooperativas da Floresta',
    x: 1850,
    y: 745,
    radius: 78,
    accentColor: '#34d399',
  },
] as const;

export const DATA_FOREST_FRIENDLY_NPCS: readonly FriendlyFieldNpc[] = [] as const;

/**
 * Smooth, natural walking physics colliders mapped cleanly onto the 2400x1350 artwork:
 * - All 3 wooden bridges (Lower x:1500..1775 y:955..1075, Middle x:930..1160 y:710..805,
 *   Upper-Right x:1380..1580 y:465..560) remain 100% open & snag-free!
 * - Deep waterfalls, central river basin, outer cliffs, and foreground stone ruins stay solid.
 */
export const DATA_FOREST_COLLIDERS: readonly DatsCollider[] = [
  // 1. Northern Horizon Sky, Floating Islands & Mountain Cliffs (opens cleanly at Great Tree stairs x:1125..1285)
  { id: 'df-north-west', x: 0, y: 0, w: 1125, h: 395, kind: 'wall' },
  { id: 'df-north-east', x: 1285, y: 0, w: 1115, h: 395, kind: 'wall' },
  { id: 'df-great-tree-portal', x: 1125, y: 0, w: 160, h: 368, kind: 'building' },

  // 2. Outer Western, Eastern & Southern Perimeter Walls
  { id: 'df-west-edge', x: 0, y: 395, w: 245, h: 955, kind: 'wall' },
  { id: 'df-east-cascade', x: 2150, y: 395, w: 250, h: 240, kind: 'wall' },
  { id: 'df-east-edge-lower', x: 2335, y: 635, w: 65, h: 715, kind: 'wall' },
  { id: 'df-south-west', x: 0, y: 1225, w: 940, h: 125, kind: 'wall' },
  { id: 'df-south-mid', x: 940, y: 1255, w: 805, h: 95, kind: 'wall' },
  { id: 'df-south-sanctuary', x: 1960, y: 1245, w: 440, h: 105, kind: 'wall' },

  // 3. River Water & Cascading Waterfalls (placed STRICTLY between the 3 wooden bridges!)
  { id: 'df-river-upper-west', x: 700, y: 585, w: 220, h: 120, kind: 'wall' },
  { id: 'df-river-mid-basin', x: 1155, y: 760, w: 340, h: 215, kind: 'wall' },
  { id: 'df-river-south-fall', x: 1745, y: 1085, w: 215, h: 265, kind: 'wall' },

  // 4. Landmark Ruins & Cliff Formations (tight footprint so trails feel effortless)
  { id: 'df-sw-crystal-ruin', x: 245, y: 1030, w: 295, h: 195, kind: 'pillar' },
  { id: 'df-nw-waterfall-rock', x: 245, y: 430, w: 115, h: 110, kind: 'planter' },
  { id: 'df-east-ruin-arch', x: 1860, y: 655, w: 175, h: 68, kind: 'pillar' },
] as const;

export function ensureSafeDataForestSpawn(
  x: number,
  y: number
): { x: number; y: number } {
  if (
    x < 260 ||
    x > DATA_FOREST_WORLD_W - 80 ||
    y < 380 ||
    y > DATA_FOREST_WORLD_H - 120
  ) {
    return { x: DATA_FOREST_SPAWN_POINT.x, y: DATA_FOREST_SPAWN_POINT.y };
  }
  for (const col of DATA_FOREST_COLLIDERS) {
    if (
      x >= col.x - 18 &&
      x <= col.x + col.w + 18 &&
      y >= col.y - 18 &&
      y <= col.y + col.h + 18
    ) {
      return { x: DATA_FOREST_SPAWN_POINT.x, y: DATA_FOREST_SPAWN_POINT.y };
    }
  }
  return { x, y };
}

/**
 * 2.5D depth scaling calibrated for the lush angled perspective of Floresta de Dados.
 */
export function getDataForestPerspectiveScale(worldY: number): number {
  const t = Math.max(0, Math.min(1, (worldY - 390) / (1180 - 390)));
  return 0.84 + t * 0.22;
}

export function getDataForestZoneAtPoint(
  x: number,
  y: number
): HuntingExplorationZone | null {
  let closest: HuntingExplorationZone | null = null;
  let closestDist = Infinity;
  for (const z of DATA_FOREST_EXPLORATION_ZONES) {
    const d = Math.hypot(x - z.x, y - z.y);
    if (d <= z.radius && d < closestDist) {
      closest = z;
      closestDist = d;
    }
  }
  return closest;
}

export function isPointInDataForestSafeZone(x: number, y: number): boolean {
  return (
    Math.hypot(x - DATA_FOREST_SAFE_ZONE.x, y - DATA_FOREST_SAFE_ZONE.y) <=
    DATA_FOREST_SAFE_ZONE.radius
  );
}

/**
 * Five dedicated Lv. 10–20 wild Digimon packs across Floresta de Dados (7 mobs each = 35 mobs)
 * plus the World Raid Boss Kuwagamon at the Sacred Great Tree.
 */
export const DATA_FOREST_HABITAT_PACKS: readonly HuntingHabitatPackSpec[] = [
  {
    species: 'impmon',
    displayName: 'Impmon',
    habitatName: 'Clareira do Sul',
    zoneId: 'df-south-glade',
    levelMin: 10,
    levelMax: 11,
    baseHp: 1020,
    hpPerLevel: 115,
    baseExp: 175,
    expPerLevel: 26,
    bodyColor: '#6d28d9',
    accentColor: '#ef4444',
    eyeColor: '#22c55e',
    spawns: [
      [835, 1055],
      [955, 1042],
      [1082, 1060],
      [1210, 1050],
      [1318, 1068],
      [930, 1152],
      [1160, 1160],
    ],
  },
  {
    species: 'renamon',
    displayName: 'Renamon',
    habitatName: 'Bosque dos Cristais',
    zoneId: 'df-crystal-woods',
    levelMin: 12,
    levelMax: 13,
    baseHp: 1290,
    hpPerLevel: 135,
    baseExp: 235,
    expPerLevel: 32,
    bodyColor: '#eab308',
    accentColor: '#f8fafc',
    eyeColor: '#38bdf8',
    spawns: [
      [355, 822],
      [468, 814],
      [584, 826],
      [702, 818],
      [402, 922],
      [536, 918],
      [698, 928],
    ],
  },
  {
    species: 'guilmon',
    displayName: 'Guilmon',
    habitatName: 'Trilha da Cachoeira Oeste',
    zoneId: 'df-west-falls',
    levelMin: 14,
    levelMax: 15,
    baseHp: 1620,
    hpPerLevel: 160,
    baseExp: 305,
    expPerLevel: 38,
    bodyColor: '#dc2626',
    accentColor: '#f8fafc',
    eyeColor: '#facc15',
    spawns: [
      [412, 484],
      [522, 476],
      [626, 488],
      [432, 566],
      [554, 558],
      [468, 654],
      [592, 666],
    ],
  },
  {
    species: 'garurumon',
    displayName: 'Garurumon',
    habitatName: 'Bosque das Raízes Leste',
    zoneId: 'df-east-roots',
    levelMin: 16,
    levelMax: 17,
    baseHp: 2040,
    hpPerLevel: 190,
    baseExp: 395,
    expPerLevel: 48,
    bodyColor: '#e2e8f0',
    accentColor: '#2563eb',
    eyeColor: '#38bdf8',
    spawns: [
      [1556, 706],
      [1668, 696],
      [1782, 708],
      [1592, 804],
      [1732, 818],
      [1882, 804],
      [2045, 802],
    ],
  },
  {
    species: 'greymon',
    displayName: 'Greymon',
    habitatName: 'Terraço dos Dados',
    zoneId: 'df-data-terrace',
    levelMin: 18,
    levelMax: 20,
    baseHp: 2540,
    hpPerLevel: 230,
    baseExp: 510,
    expPerLevel: 60,
    bodyColor: '#ea580c',
    accentColor: '#2563eb',
    eyeColor: '#facc15',
    spawns: [
      [1628, 466],
      [1756, 458],
      [1888, 468],
      [2018, 464],
      [1678, 566],
      [1834, 574],
      [2012, 574],
    ],
  },
] as const;

/**
 * World Raid Boss Kuwagamon (Lv. 20) — ALWAYS spawns right beneath the Sacred Great Tree
 * at the top-center monumental staircase, synchronized live across all online Tamers via Firestore!
 */
export const DATA_FOREST_BOSS_TEMPLATE: EnemyMonsterTemplate = {
  species: 'kuwagamon',
  name: 'Kuwagamon',
  level: 20,
  maxHp: KUWAGAMON_MAX_HP,
  expReward: 1500,
  bodyColor: '#dc2626',
  accentColor: '#fef08a',
  eyeColor: '#fde047',
  homeX: DATA_FOREST_BOSS_ARENA.x,
  homeY: DATA_FOREST_BOSS_ARENA.y,
  zoneId: 'df-sacred-tree',
  isBoss: true,
  bossId: KUWAGAMON_BOSS_ID,
};

const DATA_FOREST_MONSTER_TEMPLATES: readonly EnemyMonsterTemplate[] = [
  ...DATA_FOREST_HABITAT_PACKS.flatMap((pack) =>
    pack.spawns.map(([homeX, homeY], memberIdx) => {
      const span = Math.max(1, pack.levelMax - pack.levelMin);
      const level =
        pack.levelMin + Math.min(span, Math.floor((memberIdx / pack.spawns.length) * (span + 1)));
      const lvOffset = level - pack.levelMin;
      return {
        species: pack.species,
        name: pack.displayName,
        level,
        maxHp: pack.baseHp + lvOffset * pack.hpPerLevel,
        expReward: pack.baseExp + lvOffset * pack.expPerLevel,
        bodyColor: pack.bodyColor,
        accentColor: pack.accentColor,
        eyeColor: pack.eyeColor,
        homeX,
        homeY,
        zoneId: pack.zoneId,
      };
    })
  ),
  DATA_FOREST_BOSS_TEMPLATE,
];

export function createInitialDataForestMonsters(): EnemyMonsterInstance[] {
  return DATA_FOREST_MONSTER_TEMPLATES.map((tpl, idx) => ({
    ...tpl,
    id: tpl.isBoss ? `boss-${tpl.bossId ?? tpl.species}` : `df-enemy-${idx}-${tpl.species}`,
    disposition: 'enemy',
    x: tpl.homeX,
    y: tpl.homeY,
    hp: tpl.maxHp,
    alive: true,
    respawnTimer: 0,
    hitFlashTimer: 0,
    attackAnimTimer: 0,
    facingRight: idx % 2 === 0,
    patrolAngle: idx * 0.87,
    patrolTimer: 0,
    aggroed: false,
    aggroTimer: 0,
    counterCooldown: 0,
  }));
}

/**
 * Paints crisp high-DPI mobile terrain accents & gently blends away the static top-left
 * title plaque baked into the source art so the live sky & mobile HUD stay ultra-clean.
 */
function paintDataForestStaticEnhancements(ctx: CanvasRenderingContext2D): void {
  ctx.save();

  // 1. Seamless natural sky-cloud blend over the top-left baked badge (x:0..640, y:0..205)
  const skyPatch = ctx.createRadialGradient(240, 75, 40, 260, 95, 420);
  skyPatch.addColorStop(0, 'rgba(18, 138, 245, 0.98)');
  skyPatch.addColorStop(0.58, 'rgba(42, 166, 250, 0.94)');
  skyPatch.addColorStop(0.84, 'rgba(110, 205, 255, 0.52)');
  skyPatch.addColorStop(1, 'rgba(110, 205, 255, 0)');
  ctx.fillStyle = skyPatch;
  ctx.fillRect(0, 0, 680, 245);

  // Soft sunlit cumulus clouds over that top-left sky corner
  const clouds: ReadonlyArray<readonly [number, number, number, number, number]> = [
    [105, 118, 92, 34, 0.72],
    [225, 134, 118, 38, 0.68],
    [355, 108, 98, 32, 0.64],
    [475, 130, 88, 28, 0.52],
    [160, 78, 76, 26, 0.45],
  ];
  for (const [cx, cy, rx, ry, a] of clouds) {
    const cg = ctx.createRadialGradient(cx, cy - 6, 8, cx, cy, rx);
    cg.addColorStop(0, `rgba(248, 252, 255, ${a})`);
    cg.addColorStop(0.65, `rgba(219, 244, 255, ${(a * 0.55).toFixed(2)})`);
    cg.addColorStop(1, 'rgba(219, 244, 255, 0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Crisp warm sunlit atmosphere across the lush valley
  const sunWash = ctx.createRadialGradient(1205, 190, 90, 1205, 620, 1420);
  sunWash.addColorStop(0, 'rgba(254, 249, 195, 0.14)');
  sunWash.addColorStop(0.52, 'rgba(56, 232, 255, 0.05)');
  sunWash.addColorStop(1, 'rgba(4, 28, 52, 0.14)');
  ctx.fillStyle = sunWash;
  ctx.fillRect(0, 0, DATA_FOREST_WORLD_W, DATA_FOREST_WORLD_H);

  // 3. Bottom-Right Teleport Sanctuary luminous DATS Safe Zone ring
  ctx.save();
  ctx.translate(DATA_FOREST_SAFE_ZONE.x, DATA_FOREST_SAFE_ZONE.y);
  const safeGlow = ctx.createRadialGradient(0, 0, 20, 0, 0, DATA_FOREST_SAFE_ZONE.radius);
  safeGlow.addColorStop(0, 'rgba(56, 232, 255, 0.18)');
  safeGlow.addColorStop(0.75, 'rgba(56, 232, 255, 0.06)');
  safeGlow.addColorStop(1, 'rgba(56, 232, 255, 0)');
  ctx.fillStyle = safeGlow;
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    DATA_FOREST_SAFE_ZONE.radius,
    DATA_FOREST_SAFE_ZONE.radius * 0.52,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.strokeStyle = 'rgba(103, 232, 249, 0.48)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    DATA_FOREST_SAFE_ZONE.radius - 6,
    (DATA_FOREST_SAFE_ZONE.radius - 6) * 0.52,
    0,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 4. Sacred Great Tree Raid Arena carved crimson-cyan ground seal
  ctx.save();
  ctx.translate(DATA_FOREST_BOSS_ARENA.x, DATA_FOREST_BOSS_ARENA.y);
  const arenaGlow = ctx.createRadialGradient(0, 0, 18, 0, 0, 142);
  arenaGlow.addColorStop(0, 'rgba(239, 68, 68, 0.16)');
  arenaGlow.addColorStop(0.62, 'rgba(56, 232, 255, 0.10)');
  arenaGlow.addColorStop(1, 'rgba(56, 232, 255, 0)');
  ctx.fillStyle = arenaGlow;
  ctx.beginPath();
  ctx.ellipse(0, 8, 142, 58, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(251, 146, 60, 0.34)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 8, 128, 50, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 5. Crisp mobile grass tufts & forest wildflowers across the 5 hunting zones
  const flora: ReadonlyArray<readonly [number, number, string]> = [
    [870, 1105, '#f472b6'], [1020, 1112, '#fde047'], [1165, 1118, '#f9a8d4'], [1302, 1108, '#bbf7d0'],
    [418, 868, '#38e8ff'], [542, 875, '#fde047'], [668, 882, '#c084fc'], [742, 868, '#67e8f9'],
    [455, 524, '#e879f9'], [576, 520, '#a7f3d0'], [515, 616, '#f0abfc'], [625, 622, '#67e8f9'],
    [1620, 756, '#86efac'], [1768, 764, '#fde047'], [1908, 782, '#bef264'], [2015, 766, '#86efac'],
    [1685, 514, '#bef264'], [1822, 518, '#67e8f9'], [1962, 522, '#fde047'], [2045, 516, '#a7f3d0'],
  ];
  for (let i = 0; i < flora.length; i++) {
    const [fx, fy, petal] = flora[i];
    ctx.strokeStyle = 'rgba(20, 83, 45, 0.72)';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx - 4.5, fy - 7);
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + 0.5, fy - 9);
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + 5, fy - 6.5);
    ctx.stroke();

    ctx.fillStyle = petal;
    ctx.beginPath();
    ctx.arc(fx - 3.2, fy - 7.5, 2.2, 0, Math.PI * 2);
    ctx.arc(fx + 4.4, fy - 6.2, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function buildDataForestStaticLayer(): HTMLCanvasElement {
  const pixelW = Math.round(DATA_FOREST_WORLD_W * MAP_HIDPI_SCALE);
  const pixelH = Math.round(DATA_FOREST_WORLD_H * MAP_HIDPI_SCALE);
  const canvas = document.createElement('canvas');
  canvas.width = pixelW;
  canvas.height = pixelH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const fallback = ctx.createLinearGradient(0, 0, 0, pixelH);
  fallback.addColorStop(0, '#0ea5e9');
  fallback.addColorStop(0.45, '#15803d');
  fallback.addColorStop(1, '#064e3b');
  ctx.fillStyle = fallback;
  ctx.fillRect(0, 0, pixelW, pixelH);

  const img = new Image();
  img.decoding = 'async';
  img.src = DATA_FOREST_IMAGE_URL;
  img.onload = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pixelW, pixelH);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = 'contrast(1.06) saturate(1.12) brightness(1.02)';
    ctx.drawImage(img, 0, 0, pixelW, pixelH);
    ctx.restore();

    applyContrastAdaptiveSharpen(ctx, pixelW, pixelH, 1.08);

    ctx.save();
    ctx.scale(MAP_HIDPI_SCALE, MAP_HIDPI_SCALE);
    paintDataForestStaticEnhancements(ctx);
    ctx.restore();
  };

  return canvas;
}

/**
 * Living 2.5D environmental FX for Floresta de Dados:
 * - Golden sunbeams through the canopy of the Sacred Great Tree
 * - Animated waterfalls & foaming ripples
 * - Pulsing blue data crystal glints
 * - Glowing Teleport Sanctuary portal & orbit motes
 * - Sacred Great Tree Raid Arena ring (pulsing crimson danger while Kuwagamon is alive,
 *   or shimmering cyan-gold summoning seal while Kuwagamon is respawning!)
 */
export function drawDataForestGroundAnimations(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  nearPortal: boolean,
  bossAlive: boolean
): void {
  ctx.save();

  // 1. Sacred Great Tree divine golden-cyan sky sunbeam
  const beamShift = Math.sin(elapsed * 0.42) * 22;
  const beamGrad = ctx.createLinearGradient(1100 + beamShift, 0, 1320 + beamShift, 620);
  beamGrad.addColorStop(0, 'rgba(186, 246, 255, 0.16)');
  beamGrad.addColorStop(0.55, 'rgba(254, 249, 195, 0.08)');
  beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(1060 + beamShift, 0);
  ctx.lineTo(1355 + beamShift, 0);
  ctx.lineTo(1495 + beamShift, 595);
  ctx.lineTo(955 + beamShift, 595);
  ctx.closePath();
  ctx.fill();

  // 2. Bottom-Right Teleport Sanctuary Portal glow + rising cyan data particles
  const pulse = 1 + Math.sin(elapsed * 3.5) * 0.08;
  const portalGlow = ctx.createRadialGradient(
    DATA_FOREST_RETURN_PORTAL.x,
    DATA_FOREST_RETURN_PORTAL.y - 12,
    8,
    DATA_FOREST_RETURN_PORTAL.x,
    DATA_FOREST_RETURN_PORTAL.y - 12,
    102 * pulse
  );
  portalGlow.addColorStop(
    0,
    nearPortal ? 'rgba(254, 240, 138, 0.48)' : 'rgba(56, 232, 255, 0.42)'
  );
  portalGlow.addColorStop(0.55, 'rgba(14, 165, 233, 0.16)');
  portalGlow.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = portalGlow;
  ctx.beginPath();
  ctx.ellipse(
    DATA_FOREST_RETURN_PORTAL.x,
    DATA_FOREST_RETURN_PORTAL.y - 6,
    92 * pulse,
    38 * pulse,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  if (nearPortal) {
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.88)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(
      DATA_FOREST_RETURN_PORTAL.x,
      DATA_FOREST_RETURN_PORTAL.y,
      64 * pulse,
      24 * pulse,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  for (let i = 0; i < 8; i++) {
    const phase = (elapsed * 0.55 + i * 0.125) % 1;
    const mx = DATA_FOREST_RETURN_PORTAL.x + Math.sin(elapsed * 2 + i * 1.5) * 34;
    const my = DATA_FOREST_RETURN_PORTAL.y + 10 - phase * 185;
    const alpha = Math.sin(phase * Math.PI) * 0.68;
    ctx.fillStyle = `rgba(165, 243, 252, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Sacred Great Tree Raid Boss Arena dynamic energy ring
  const bossRingPulse = 1 + Math.sin(elapsed * (bossAlive ? 3.8 : 2.1)) * 0.05;
  ctx.strokeStyle = bossAlive
    ? 'rgba(239, 68, 68, 0.52)'
    : 'rgba(56, 232, 255, 0.45)';
  ctx.lineWidth = bossAlive ? 2.8 : 2.0;
  ctx.beginPath();
  ctx.ellipse(
    DATA_FOREST_BOSS_ARENA.x,
    DATA_FOREST_BOSS_ARENA.y + 10,
    118 * bossRingPulse,
    46 * bossRingPulse,
    0,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  // Rising sacred runes around the Great Tree Arch
  for (let i = 0; i < 10; i++) {
    const phase = (elapsed * 0.42 + i * 0.1) % 1;
    const rx = DATA_FOREST_BOSS_ARENA.x + Math.cos(elapsed * 1.1 + i * 0.9) * 86;
    const ry = DATA_FOREST_BOSS_ARENA.y + 12 - phase * 155;
    const alpha = Math.sin(phase * Math.PI) * 0.55;
    ctx.fillStyle = bossAlive
      ? `rgba(252, 165, 165, ${alpha.toFixed(3)})`
      : `rgba(125, 243, 255, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(rx, ry, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Animated Waterfall Foam Rings & Cascading Mist
  const waterfalls = [
    { x: 1140, y: 848, rx: 48, ry: 17 },
    { x: 1385, y: 865, rx: 42, ry: 15 },
    { x: 1845, y: 1215, rx: 52, ry: 18 },
    { x: 1675, y: 315, rx: 48, ry: 16 },
    { x: 2248, y: 556, rx: 40, ry: 15 },
  ];
  for (let f = 0; f < waterfalls.length; f++) {
    const wf = waterfalls[f];
    const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
    const rawWave = (safeElapsed * 1.45 + f * 0.31) % 1;
    const wave = rawWave < 0 ? rawWave + 1 : rawWave;
    const mistAlpha = 0.22 + Math.sin(safeElapsed * 3.4 + f * 1.4) * 0.08;
    ctx.fillStyle = `rgba(224, 249, 255, ${mistAlpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(
      wf.x + Math.sin(safeElapsed * 2 + f) * 3.5,
      wf.y,
      Math.max(0.5, wf.rx),
      Math.max(0.5, wf.ry),
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle = `rgba(235, 252, 255, ${((1 - wave) * 0.38).toFixed(3)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(
      wf.x,
      wf.y + 4,
      Math.max(0.5, wf.rx * (0.52 + wave * 0.65)),
      Math.max(0.5, wf.ry * (0.52 + wave * 0.65)),
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  // 5. Pulsing Data Crystal Shimmers & Emerald Forest Fireflies
  const crystals: ReadonlyArray<readonly [number, number]> = [
    [275, 960],
    [1195, 560],
    [1785, 622],
    [1145, 1265],
    [2258, 868],
  ];
  for (let i = 0; i < crystals.length; i++) {
    const [cx, cy] = crystals[i];
    const glow = 0.24 + Math.sin(elapsed * 3.2 + i * 1.4) * 0.14;
    ctx.fillStyle = `rgba(56, 232, 255, ${glow.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  const fireflies: ReadonlyArray<readonly [number, number, string]> = [
    [980, 1080, '167, 243, 208'],
    [1220, 1110, '244, 114, 182'],
    [520, 880, '254, 240, 138'],
    [665, 915, '103, 232, 249'],
    [515, 560, '232, 121, 249'],
    [1685, 765, '134, 239, 172'],
    [1920, 785, '190, 242, 100'],
    [1765, 520, '163, 230, 53'],
    [1960, 530, '125, 243, 255'],
  ];
  for (let i = 0; i < fireflies.length; i++) {
    const [fx, fy, rgb] = fireflies[i];
    const dx = Math.sin(elapsed * 1.2 + i * 2.1) * 24;
    const dy = Math.cos(elapsed * 0.95 + i * 1.6) * 14 - ((elapsed * 8 + i * 11) % 22);
    const alpha = 0.28 + Math.sin(elapsed * 2.7 + i) * 0.22;
    ctx.fillStyle = `rgba(${rgb}, ${Math.max(0.08, alpha).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(fx + dx, fy + dy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Depth-sorted dynamic actors on Floresta de Dados (only entities with real sprites render in-world).
 */
export function buildDataForestDepthProps(): HuntingDepthDrawable[] {
  return [];
}
