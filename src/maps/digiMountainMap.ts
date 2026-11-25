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

export const DIGI_MOUNTAIN_MAP_ID = 'digi-mountain' as const;

/**
 * Exact 16:9 world dimensions matching the Montanha Digi illustrated artwork,
 * identical in style, proportions, and smooth exploration feel to Planície Digital
 * and Floresta de Dados.
 */
export const DIGI_MOUNTAIN_WORLD_W = 2400;
export const DIGI_MOUNTAIN_WORLD_H = 1350;

export const DIGI_MOUNTAIN_IMAGE_URL =
  '/assets/aistudio/file_0000000078b0820ead291cb0c6b01dc1_dce341ca.webp';
export const DIGI_MOUNTAIN_BANNER_URL = DIGI_MOUNTAIN_IMAGE_URL;

/**
 * Player spawns cleanly on the glowing West Circular Technological Platform,
 * facing east toward the green mountain trails, bridges, cave, and fortress.
 */
export const DIGI_MOUNTAIN_SPAWN_POINT = {
  x: 455,
  y: 745,
  facingDir: 'E' as const,
};

/**
 * Glowing cyan portal ring inside the West Technological Platform returning to DATS Center.
 */
export const DIGI_MOUNTAIN_RETURN_PORTAL = {
  x: 445,
  y: 742,
  radius: 88,
} as const;

/**
 * Safe Sanctuary around the West Technological Platform:
 * Partner never initiates combat here and HP/DS recover naturally.
 */
export const DIGI_MOUNTAIN_SAFE_ZONE = {
  x: 455,
  y: 745,
  radius: 190,
  label: 'Plataforma Tecnológica Oeste',
} as const;

export const DIGI_MOUNTAIN_EXPLORATION_ZONES: readonly HuntingExplorationZone[] = [
  {
    id: 'dm-west-platform',
    name: 'Plataforma Tecnológica Oeste',
    subtitle: 'Zona Segura · Portal de Retorno DATS',
    x: 455,
    y: 745,
    radius: 205,
  },
  {
    id: 'dm-south-meadow',
    name: 'Trilha da Ponte e Chamas',
    subtitle: 'Território dos Meramon (Nv. 20–21)',
    x: 865,
    y: 945,
    radius: 245,
    speciesLabel: 'Meramon',
  },
  {
    id: 'dm-canyon-east',
    name: 'Cânion da Cachoeira Sul',
    subtitle: 'Território dos Digmon (Nv. 22–23)',
    x: 1755,
    y: 1045,
    radius: 255,
    speciesLabel: 'Digmon',
  },
  {
    id: 'dm-central-platform',
    name: 'Plataforma Circular Central',
    subtitle: 'Encruzilhada dos Cristais e Pontes',
    x: 1205,
    y: 600,
    radius: 170,
  },
  {
    id: 'dm-east-observatory',
    name: 'Observatório de Cristal Leste',
    subtitle: 'Território dos Kabuterimon (Nv. 24–25)',
    x: 1845,
    y: 505,
    radius: 215,
    speciesLabel: 'Kabuterimon',
  },
  {
    id: 'dm-purple-cave',
    name: 'Caverna dos Cristais Roxos',
    subtitle: 'Território dos Chrysalimon (Nv. 26–27)',
    x: 1995,
    y: 725,
    radius: 235,
    speciesLabel: 'Chrysalimon',
  },
  {
    id: 'dm-fortress',
    name: 'Fortaleza Tecnológica Central',
    subtitle: 'Território dos Veedramon (Nv. 28–30)',
    x: 1200,
    y: 445,
    radius: 240,
    speciesLabel: 'Veedramon',
  },
] as const;

export const DIGI_MOUNTAIN_INTERACTION_POINTS: readonly DatsInteractionPoint[] = [
  {
    id: 'dm-fortress-gate',
    kind: 'main-entrance',
    title: 'Portão da Fortaleza Tecnológica',
    badge: 'Fortaleza',
    description:
      'A imponente fortaleza digital incrustada na Montanha Digi. Seu núcleo de energia ciano protege o cume nevado, guardado por Veedramon poderosos (Nv. 28–30).',
    futureModule: 'Expedições da Fortaleza Digital e Desafios Avançados',
    x: 1200,
    y: 412,
    radius: 92,
    accentColor: '#38e8ff',
  },
  {
    id: 'dm-purple-cave-relic',
    kind: 'tamer-terminal',
    title: 'Entrada da Caverna dos Cristais Roxos',
    badge: 'Caverna',
    description:
      'Caverna repleta de cristais ametista luminosos irradiando dados raros. Chrysalimon (Nv. 26–27), a forma Champion de Keramon, vigiam toda esta escarpa rochosa.',
    futureModule: 'Câmara Profunda dos Cristais Ametista',
    x: 2055,
    y: 665,
    radius: 92,
    accentColor: '#c084fc',
  },
  {
    id: 'dm-east-observatory-point',
    kind: 'info-npc',
    title: 'Observatório de Cristal Leste',
    badge: 'Observatório',
    description:
      'Torre panorâmica ligada à Fortaleza pelo Viaduto da Cachoeira, com vista privilegiada para a Cidadela Flutuante nos céus. Kabuterimon (Nv. 24–25) patrulham este terraço.',
    futureModule: 'Sinais das Ilhas Flutuantes',
    x: 1825,
    y: 495,
    radius: 86,
    accentColor: '#60a5fa',
  },
  {
    id: 'dm-waterfall-bridge-view',
    kind: 'tamer-terminal',
    title: 'Mirante da Ponte da Cachoeira',
    badge: 'Cachoeira',
    description:
      'Travessia monumental sobre o cânion turquesa ligando os campos de Meramon às trilhas de Digmon no sudeste da Montanha Digi.',
    futureModule: 'Exploração das Cachoeiras Digitais',
    x: 1320,
    y: 978,
    radius: 82,
    accentColor: '#34d399',
  },
] as const;

export const DIGI_MOUNTAIN_FRIENDLY_NPCS: readonly FriendlyFieldNpc[] = [] as const;

/**
 * Precise, snag-free collision geometry mapped directly onto the 2400x1350 Montanha Digi artwork:
 * - Keeps the West Tech Platform, Central Platform, Fortress Plaza, East Observatory, Purple Crystal Cave
 *   terrace, all 3 bridges (South Bridge y:925..1045, East Bridge y:635..705, Upper Viaduct y:445..505),
 *   and every scenic grass/dirt trail 100% open & effortless to walk!
 * - Seals sky/floating islands, sheer mountain crags, deep canyon river & waterfalls, and outer cloud edges.
 */
export const DIGI_MOUNTAIN_COLLIDERS: readonly DatsCollider[] = [
  // 1. Northern Sky, Floating Islands & Snow-Capped Mountain Peaks (opens at Fortress Plaza & East Observatory)
  { id: 'dm-north-west-sky', x: 0, y: 0, w: 985, h: 418, kind: 'wall' },
  { id: 'dm-fortress-peak-back', x: 985, y: 0, w: 485, h: 388, kind: 'building' },
  { id: 'dm-north-east-sky', x: 1470, y: 0, w: 930, h: 432, kind: 'wall' },

  // 2. Outer Western, Eastern & Southern Cloud Abyss / Cliff Walls
  { id: 'dm-west-crags', x: 0, y: 418, w: 265, h: 270, kind: 'wall' },
  { id: 'dm-west-edge', x: 0, y: 688, w: 175, h: 662, kind: 'wall' },
  { id: 'dm-east-upper-cliff', x: 2055, y: 432, w: 345, h: 175, kind: 'wall' },
  { id: 'dm-east-edge', x: 2190, y: 607, w: 210, h: 743, kind: 'wall' },
  { id: 'dm-south-west-abyss', x: 175, y: 1125, w: 425, h: 225, kind: 'wall' },
  { id: 'dm-south-meadow-cliff', x: 600, y: 1195, w: 515, h: 155, kind: 'wall' },
  { id: 'dm-south-waterfall-abyss', x: 1115, y: 1055, w: 395, h: 295, kind: 'wall' },
  { id: 'dm-south-east-cliff', x: 1510, y: 1235, w: 680, h: 115, kind: 'wall' },

  // 3. Canyon Rivers & Waterfalls (strictly BETWEEN the 3 crossable bridges!)
  // Upper waterfall directly below the Fortress -> Observatory viaduct
  { id: 'dm-upper-waterfall', x: 1430, y: 512, w: 175, h: 105, kind: 'wall' },
  // Central rocky cliff bluff below Central Platform (leaves west trail x<1085 and east path x>1360 open)
  { id: 'dm-central-bluff', x: 1095, y: 665, w: 255, h: 145, kind: 'wall' },
  // Mid canyon river pool above South Waterfall Bridge (leaves South Bridge y>=925 wide open!)
  { id: 'dm-mid-river-west', x: 1105, y: 815, w: 375, h: 102, kind: 'wall' },
  // Mid-east river channel below East Bridge (leaves East Bridge y<=705 & SE path y>=915 open!)
  { id: 'dm-mid-river-east', x: 1595, y: 718, w: 195, h: 190, kind: 'wall' },

  // 4. Landmark Cliff Pillars (tight footprints)
  { id: 'dm-nw-crystal-ridge', x: 265, y: 418, w: 165, h: 110, kind: 'pillar' },
  { id: 'dm-cave-north-rock', x: 1995, y: 565, w: 195, h: 48, kind: 'planter' },
] as const;

/**
 * Ensures any saved coordinate sits cleanly inside walkable Montanha Digi terrain.
 */
export function ensureSafeDigiMountainSpawn(
  x: number,
  y: number
): { x: number; y: number } {
  if (
    x < 210 ||
    x > DIGI_MOUNTAIN_WORLD_W - 210 ||
    y < 395 ||
    y > DIGI_MOUNTAIN_WORLD_H - 135
  ) {
    return { x: DIGI_MOUNTAIN_SPAWN_POINT.x, y: DIGI_MOUNTAIN_SPAWN_POINT.y };
  }
  for (const col of DIGI_MOUNTAIN_COLLIDERS) {
    if (
      x >= col.x - 18 &&
      x <= col.x + col.w + 18 &&
      y >= col.y - 18 &&
      y <= col.y + col.h + 18
    ) {
      return { x: DIGI_MOUNTAIN_SPAWN_POINT.x, y: DIGI_MOUNTAIN_SPAWN_POINT.y };
    }
  }
  return { x, y };
}

/**
 * 2.5D perspective depth scaling calibrated for Montanha Digi, matching Planície Digital & Floresta de Dados.
 */
export function getDigiMountainPerspectiveScale(worldY: number): number {
  const t = Math.max(0, Math.min(1, (worldY - 395) / (1180 - 395)));
  return 0.84 + t * 0.22;
}

export function isPointInDigiMountainSafeZone(x: number, y: number): boolean {
  return (
    Math.hypot(x - DIGI_MOUNTAIN_SAFE_ZONE.x, y - DIGI_MOUNTAIN_SAFE_ZONE.y) <=
    DIGI_MOUNTAIN_SAFE_ZONE.radius
  );
}

export function getDigiMountainZoneAtPoint(
  x: number,
  y: number
): HuntingExplorationZone | null {
  let closest: HuntingExplorationZone | null = null;
  let bestDist = Infinity;
  for (const zone of DIGI_MOUNTAIN_EXPLORATION_ZONES) {
    const d = Math.hypot(x - zone.x, y - zone.y);
    if (d <= zone.radius && d < bestDist) {
      bestDist = d;
      closest = zone;
    }
  }
  return closest;
}

// ============================================================================
// 5 CHAMPION WILD DIGIMON TERRITORIES (LV. 20–30 · 35 MOBS TOTAL)
// Meramon, Digmon, Kabuterimon, Chrysalimon (Keramon Champion) & Veedramon
// Every single spawn coordinate is verified clear of all colliders!
// ============================================================================

export const DIGI_MOUNTAIN_HABITAT_PACKS: readonly HuntingHabitatPackSpec[] = [
  {
    species: 'meramon',
    displayName: 'Meramon',
    habitatName: 'Trilha da Ponte e Chamas',
    zoneId: 'dm-south-meadow',
    levelMin: 20,
    levelMax: 21,
    baseHp: 3150,
    hpPerLevel: 240,
    baseExp: 690,
    expPerLevel: 52,
    bodyColor: '#f97316',
    accentColor: '#fde047',
    eyeColor: '#fef08a',
    spawns: [
      [735, 920],
      [825, 985],
      [915, 915],
      [985, 1025],
      [1045, 965],
      [860, 1085],
      [775, 845],
    ],
  },
  {
    species: 'digmon',
    displayName: 'Digmon',
    habitatName: 'Cânion da Cachoeira Sul',
    zoneId: 'dm-canyon-east',
    levelMin: 22,
    levelMax: 23,
    baseHp: 3820,
    hpPerLevel: 280,
    baseExp: 810,
    expPerLevel: 60,
    bodyColor: '#eab308',
    accentColor: '#64748b',
    eyeColor: '#ef4444',
    spawns: [
      [1585, 1045],
      [1675, 985],
      [1765, 1075],
      [1865, 1015],
      [1715, 1155],
      [1845, 1135],
      [1965, 1075],
    ],
  },
  {
    species: 'kabuterimon',
    displayName: 'Kabuterimon',
    habitatName: 'Observatório de Cristal Leste',
    zoneId: 'dm-east-observatory',
    levelMin: 24,
    levelMax: 25,
    baseHp: 4620,
    hpPerLevel: 325,
    baseExp: 940,
    expPerLevel: 68,
    bodyColor: '#2563eb',
    accentColor: '#38bdf8',
    eyeColor: '#facc15',
    spawns: [
      [1715, 485],
      [1795, 535],
      [1895, 485],
      [1955, 535],
      [1765, 468],
      [1860, 565],
      [1945, 468],
    ],
  },
  {
    species: 'chrysalimon',
    displayName: 'Chrysalimon',
    habitatName: 'Caverna dos Cristais Roxos',
    zoneId: 'dm-purple-cave',
    levelMin: 26,
    levelMax: 27,
    baseHp: 5560,
    hpPerLevel: 380,
    baseExp: 1090,
    expPerLevel: 76,
    bodyColor: '#7c3aed',
    accentColor: '#e879f9',
    eyeColor: '#f43f5e',
    spawns: [
      [1875, 710],
      [1955, 675],
      [2035, 735],
      [2115, 695],
      [2130, 775],
      [1945, 795],
      [2045, 815],
    ],
  },
  {
    species: 'veedramon',
    displayName: 'Veedramon',
    habitatName: 'Fortaleza Tecnológica Central',
    zoneId: 'dm-fortress',
    levelMin: 28,
    levelMax: 30,
    baseHp: 6650,
    hpPerLevel: 460,
    baseExp: 1280,
    expPerLevel: 88,
    bodyColor: '#0284c7',
    accentColor: '#f8fafc',
    eyeColor: '#dc2626',
    spawns: [
      [1035, 448],
      [1115, 478],
      [1200, 455],
      [1295, 478],
      [1365, 445],
      [1105, 422],
      [1295, 422],
    ],
  },
] as const;

const DIGI_MOUNTAIN_TEMPLATES: readonly EnemyMonsterTemplate[] =
  DIGI_MOUNTAIN_HABITAT_PACKS.flatMap((pack) => {
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

export function createInitialDigiMountainMonsters(): EnemyMonsterInstance[] {
  return DIGI_MOUNTAIN_TEMPLATES.map((tpl, idx) => ({
    ...tpl,
    id: `dm-${idx}-${tpl.species}`,
    disposition: 'enemy',
    x: tpl.homeX,
    y: tpl.homeY,
    hp: tpl.maxHp,
    alive: true,
    respawnTimer: 0,
    hitFlashTimer: 0,
    attackAnimTimer: 0,
    facingRight: idx % 2 === 0,
    patrolAngle: (idx * 1.17) % (Math.PI * 2),
    patrolTimer: 0,
    aggroed: false,
    aggroTimer: 0,
    counterCooldown: 0,
  }));
}

/**
 * Crisp static vector accents layered gently onto the decoded Montanha Digi artwork:
 * - Luminous DATS sanctuary ring around the West Technological Platform safe zone
 * - Subtle atmospheric sunlight wash over the snow-capped peaks
 * ZERO text or labels painted on the ground!
 */
function paintDigiMountainStaticEnhancements(ctx: CanvasRenderingContext2D): void {
  ctx.save();

  // Subtle crystalline alpine sky wash
  const skyWash = ctx.createRadialGradient(1200, 180, 90, 1200, 560, 1380);
  skyWash.addColorStop(0, 'rgba(224, 249, 255, 0.11)');
  skyWash.addColorStop(0.55, 'rgba(56, 189, 248, 0.04)');
  skyWash.addColorStop(1, 'rgba(15, 23, 42, 0.14)');
  ctx.fillStyle = skyWash;
  ctx.fillRect(0, 0, DIGI_MOUNTAIN_WORLD_W, DIGI_MOUNTAIN_WORLD_H);

  // West Technological Platform Safe Zone sanctuary ring
  ctx.save();
  ctx.translate(DIGI_MOUNTAIN_SAFE_ZONE.x, DIGI_MOUNTAIN_SAFE_ZONE.y);
  const safeAura = ctx.createRadialGradient(
    0,
    0,
    24,
    0,
    0,
    DIGI_MOUNTAIN_SAFE_ZONE.radius
  );
  safeAura.addColorStop(0, 'rgba(56, 232, 255, 0.16)');
  safeAura.addColorStop(0.75, 'rgba(56, 232, 255, 0.05)');
  safeAura.addColorStop(1, 'rgba(56, 232, 255, 0)');
  ctx.fillStyle = safeAura;
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    DIGI_MOUNTAIN_SAFE_ZONE.radius,
    DIGI_MOUNTAIN_SAFE_ZONE.radius * 0.48,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.strokeStyle = 'rgba(125, 243, 255, 0.46)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    DIGI_MOUNTAIN_SAFE_ZONE.radius - 6,
    (DIGI_MOUNTAIN_SAFE_ZONE.radius - 6) * 0.46,
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
 * Builds the high-DPI offscreen terrain canvas for Montanha Digi,
 * using the exact same ultra-crisp pipeline as Planície Digital & Floresta de Dados.
 */
export function buildDigiMountainStaticLayer(): HTMLCanvasElement {
  const pixelW = Math.round(DIGI_MOUNTAIN_WORLD_W * MAP_HIDPI_SCALE);
  const pixelH = Math.round(DIGI_MOUNTAIN_WORLD_H * MAP_HIDPI_SCALE);
  const canvas = document.createElement('canvas');
  canvas.width = pixelW;
  canvas.height = pixelH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Sky-alpine fallback painted instantly for frame 0 before image decode resolves
  const fallbackGrad = ctx.createLinearGradient(0, 0, 0, pixelH);
  fallbackGrad.addColorStop(0, '#0ea5e9');
  fallbackGrad.addColorStop(0.45, '#1d4ed8');
  fallbackGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = fallbackGrad;
  ctx.fillRect(0, 0, pixelW, pixelH);

  const img = new Image();
  img.decoding = 'async';
  img.src = DIGI_MOUNTAIN_IMAGE_URL;
  img.onload = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pixelW, pixelH);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = 'contrast(1.06) saturate(1.10) brightness(1.02)';
    ctx.drawImage(img, 0, 0, pixelW, pixelH);
    ctx.restore();

    applyContrastAdaptiveSharpen(ctx, pixelW, pixelH, 1.08);

    ctx.save();
    ctx.scale(MAP_HIDPI_SCALE, MAP_HIDPI_SCALE);
    paintDigiMountainStaticEnhancements(ctx);
    ctx.restore();
  };

  return canvas;
}

/**
 * Living 2.5D environmental FX layered directly over the Montanha Digi artwork:
 * - Radiant digital light beams above the Snow-Capped Mountain & Central Fortress
 * - Pulsing cyan West Technological Platform portal & rising data motes
 * - Shimmering cyan glow on the Fortress Gate, Central Platform & blue ice crystals
 * - Pulsing purple amethyst aura & wisps at the Purple Crystal Cave
 * - Animated foaming waterfalls across all 4 turquoise cascades
 * - Gentle drifting alpine snow & crystal sparkles
 */
export function drawDigiMountainGroundAnimations(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  nearPortal: boolean
): void {
  const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  ctx.save();

  // 1. Radiant alpine light beam descending onto the Central Fortress spire
  const beamShift = Math.sin(safeElapsed * 0.38) * 20;
  const beamGrad = ctx.createLinearGradient(
    1140 + beamShift,
    0,
    1290 + beamShift,
    540
  );
  beamGrad.addColorStop(0, 'rgba(186, 246, 255, 0.16)');
  beamGrad.addColorStop(0.55, 'rgba(125, 211, 252, 0.08)');
  beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(1080 + beamShift, 0);
  ctx.lineTo(1325 + beamShift, 0);
  ctx.lineTo(1455 + beamShift, 520);
  ctx.lineTo(975 + beamShift, 520);
  ctx.closePath();
  ctx.fill();

  // 2. West Technological Platform Return Portal glow + rising digital motes
  const pulse = 1 + Math.sin(safeElapsed * 3.4) * 0.08;
  const portalGlow = ctx.createRadialGradient(
    DIGI_MOUNTAIN_RETURN_PORTAL.x,
    DIGI_MOUNTAIN_RETURN_PORTAL.y - 6,
    10,
    DIGI_MOUNTAIN_RETURN_PORTAL.x,
    DIGI_MOUNTAIN_RETURN_PORTAL.y - 6,
    112 * pulse
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
    DIGI_MOUNTAIN_RETURN_PORTAL.x,
    DIGI_MOUNTAIN_RETURN_PORTAL.y,
    104 * pulse,
    42 * pulse,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  if (nearPortal) {
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.90)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(
      DIGI_MOUNTAIN_RETURN_PORTAL.x,
      DIGI_MOUNTAIN_RETURN_PORTAL.y,
      72 * pulse,
      28 * pulse,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  for (let i = 0; i < 8; i++) {
    const phase = (safeElapsed * 0.52 + i * 0.125) % 1;
    const mx =
      DIGI_MOUNTAIN_RETURN_PORTAL.x + Math.sin(safeElapsed * 2.1 + i * 1.4) * 44;
    const my = DIGI_MOUNTAIN_RETURN_PORTAL.y + 8 - phase * 165;
    const alpha = Math.sin(phase * Math.PI) * 0.68;
    ctx.fillStyle = `rgba(165, 243, 252, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Central Fortress Portal & Central Tech Platform subtle pulsing cyan energy
  const fortAlpha = 0.24 + Math.sin(safeElapsed * 2.8) * 0.11;
  ctx.fillStyle = `rgba(56, 232, 255, ${fortAlpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(1202, 345, 34, 52, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(125, 243, 255, ${(0.22 + Math.sin(safeElapsed * 2.4) * 0.1).toFixed(3)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(1205, 602, 68 * (0.98 + Math.sin(safeElapsed * 2.2) * 0.03), 26, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Purple Crystal Cave mystical amethyst glow & floating void wisps
  const cavePulse = 1 + Math.sin(safeElapsed * 3.1) * 0.12;
  const caveGlow = ctx.createRadialGradient(
    2095,
    635,
    8,
    2095,
    635,
    92 * cavePulse
  );
  caveGlow.addColorStop(0, 'rgba(192, 132, 252, 0.44)');
  caveGlow.addColorStop(0.55, 'rgba(147, 51, 234, 0.18)');
  caveGlow.addColorStop(1, 'rgba(147, 51, 234, 0)');
  ctx.fillStyle = caveGlow;
  ctx.beginPath();
  ctx.ellipse(2095, 635, 86 * cavePulse, 52 * cavePulse, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 6; i++) {
    const phase = (safeElapsed * 0.44 + i * 0.17) % 1;
    const wx = 2070 + Math.sin(safeElapsed * 1.7 + i * 2.1) * 42;
    const wy = 675 - phase * 110;
    const alpha = Math.sin(phase * Math.PI) * 0.62;
    ctx.fillStyle = `rgba(216, 180, 254, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(wx, wy, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Animated Waterfall Foam & Ripples across all 4 turquoise cascades
  const waterfalls = [
    { x: 1335, y: 1205, rx: 56, ry: 20 }, // South Waterfall Bridge drop
    { x: 1495, y: 575, rx: 42, ry: 15 }, // Upper Viaduct waterfall
    { x: 1848, y: 668, rx: 38, ry: 14 }, // East Waterfall above river
    { x: 1690, y: 785, rx: 46, ry: 16 }, // Mid-East turquoise rapids
  ];
  for (let f = 0; f < waterfalls.length; f++) {
    const wf = waterfalls[f];
    const wave = (safeElapsed * 1.5 + f * 0.27) % 1;
    const mistAlpha = 0.22 + Math.sin(safeElapsed * 3.6 + f * 1.3) * 0.08;
    ctx.fillStyle = `rgba(224, 249, 255, ${mistAlpha.toFixed(3)})`;
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

    ctx.strokeStyle = `rgba(235, 252, 255, ${((1 - wave) * 0.42).toFixed(3)})`;
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

  // 6. Pulsing Blue & Purple Crystal Shimmers
  const crystalGlints: ReadonlyArray<readonly [number, number, string]> = [
    [912, 405, '56, 232, 255'],
    [1445, 315, '56, 232, 255'],
    [1818, 425, '96, 165, 250'],
    [2262, 565, '192, 132, 252'],
    [2095, 868, '192, 132, 252'],
  ];
  for (let i = 0; i < crystalGlints.length; i++) {
    const [cx, cy, rgb] = crystalGlints[i];
    const glow = 0.22 + Math.sin(safeElapsed * 3.1 + i * 1.5) * 0.14;
    ctx.fillStyle = `rgba(${rgb}, ${glow.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Gentle Drifting Alpine Motes & Meadow Sparkles
  const motes: ReadonlyArray<readonly [number, number, string]> = [
    [820, 920, '254, 215, 170'],
    [980, 995, '253, 186, 116'],
    [1680, 1020, '254, 240, 138'],
    [1860, 1060, '167, 243, 208'],
    [1180, 445, '186, 230, 253'],
    [1310, 425, '224, 242, 254'],
    [1840, 500, '147, 197, 253'],
    [1980, 740, '232, 121, 249'],
  ];
  for (let i = 0; i < motes.length; i++) {
    const [fx, fy, rgb] = motes[i];
    const dx = Math.sin(safeElapsed * 1.15 + i * 2.1) * 26;
    const dy = Math.cos(safeElapsed * 0.9 + i * 1.6) * 14 - ((safeElapsed * 7 + i * 11) % 24);
    const alpha = 0.26 + Math.sin(safeElapsed * 2.6 + i) * 0.2;
    ctx.fillStyle = `rgba(${rgb}, ${Math.max(0.08, alpha).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(fx + dx, fy + dy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Depth-sorted dynamic actors on Montanha Digi (only entities with real sprites render in-world).
 */
export function buildDigiMountainDepthProps(): HuntingDepthDrawable[] {
  return [];
}
