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

export const DIGITAL_DESERT_MAP_ID = 'digital-desert' as const;

/**
 * Exact 16:9 world dimensions matching the Deserto Digital illustrated artwork,
 * identical in style, sharpness, and smooth 2.5D exploration feel to Planície Digital,
 * Floresta de Dados, and Montanha Digi.
 */
export const DIGITAL_DESERT_WORLD_W = 2400;
export const DIGITAL_DESERT_WORLD_H = 1350;

export const DIGITAL_DESERT_IMAGE_URL =
  '/assets/aistudio/file_0000000087c0820ea1a011efff06df5a_eb4f06a1.webp';
export const DIGITAL_DESERT_BANNER_URL = DIGITAL_DESERT_IMAGE_URL;

/**
 * Player spawns cleanly on the glowing South Circular Technological Teleport Platform,
 * facing north toward the bridges, central oasis fountain, and Great Digital Pyramid.
 */
export const DIGITAL_DESERT_SPAWN_POINT = {
  x: 1160,
  y: 1228,
  facingDir: 'N' as const,
};

/**
 * Glowing cyan portal ring inside the South Technological Platform returning to DATS Center.
 */
export const DIGITAL_DESERT_RETURN_PORTAL = {
  x: 1160,
  y: 1235,
  radius: 88,
} as const;

/**
 * Safe Sanctuary around the South Technological Platform:
 * Partner never initiates combat here and HP/DS recover naturally.
 */
export const DIGITAL_DESERT_SAFE_ZONE = {
  x: 1160,
  y: 1228,
  radius: 190,
  label: 'Plataforma Tecnológica Sul',
} as const;

export const DIGITAL_DESERT_EXPLORATION_ZONES: readonly HuntingExplorationZone[] = [
  {
    id: 'ds-south-platform',
    name: 'Plataforma Tecnológica Sul',
    subtitle: 'Zona Segura · Portal de Retorno DATS',
    x: 1160,
    y: 1228,
    radius: 205,
  },
  {
    id: 'ds-sw-crystals',
    name: 'Platô dos Cristais Safira',
    subtitle: 'Território dos IceLeomon (Nv. 30–31)',
    x: 545,
    y: 955,
    radius: 235,
    speciesLabel: 'IceLeomon',
  },
  {
    id: 'ds-se-dunes',
    name: 'Dunas da Torre Antiga',
    subtitle: 'Território dos Insekimon (Nv. 32–33)',
    x: 1795,
    y: 1110,
    radius: 245,
    speciesLabel: 'Insekimon',
  },
  {
    id: 'ds-west-cavern',
    name: 'Caverna Violeta e Platô Oeste',
    subtitle: 'Território dos SkullMeramon (Nv. 34–35)',
    x: 625,
    y: 640,
    radius: 225,
    speciesLabel: 'SkullMeramon',
  },
  {
    id: 'ds-oasis-fountain',
    name: 'Fonte do Oásis Central',
    subtitle: 'Coração Cristalino do Deserto Digital',
    x: 1225,
    y: 695,
    radius: 155,
  },
  {
    id: 'ds-east-fossil',
    name: 'Cânion do Fóssil Ancestral',
    subtitle: 'Território dos Cyberdramon (Nv. 36–37)',
    x: 1965,
    y: 745,
    radius: 235,
    speciesLabel: 'Cyberdramon',
  },
  {
    id: 'ds-pyramid-plaza',
    name: 'Praça da Grande Pirâmide',
    subtitle: 'Território dos WarGrowlmon (Nv. 38–40)',
    x: 1200,
    y: 540,
    radius: 240,
    speciesLabel: 'WarGrowlmon',
  },
] as const;

export const DIGITAL_DESERT_INTERACTION_POINTS: readonly DatsInteractionPoint[] = [
  {
    id: 'ds-pyramid-gate',
    kind: 'main-entrance',
    title: 'Portão da Grande Pirâmide Digital',
    badge: 'Pirâmide',
    description:
      'Monumento dourado cujo feixe ciano perfura os céus do Deserto Digital. A praça frontal é protegida por WarGrowlmon (Nv. 38–40), a poderosa forma Ultimate de Guilmon.',
    futureModule: 'Câmara Interna da Pirâmide e Expedições Ultimate',
    x: 1198,
    y: 495,
    radius: 92,
    accentColor: '#38e8ff',
  },
  {
    id: 'ds-purple-cavern-gate',
    kind: 'tamer-terminal',
    title: 'Caverna dos Cristais Violeta',
    badge: 'Caverna',
    description:
      'Gruta repleta de energia violeta sob a fortaleza rubra da escarpa oeste. SkullMeramon (Nv. 34–35) rondam o platô arenoso com chamas metálicas intensas.',
    futureModule: 'Expedição Subterrânea de Dados Térmicos',
    x: 445,
    y: 585,
    radius: 88,
    accentColor: '#c084fc',
  },
  {
    id: 'ds-fossil-monument',
    kind: 'info-npc',
    title: 'Crânio Fóssil Ancestral',
    badge: 'Fóssil',
    description:
      'Esqueleto colossal de um dragão ancestral com mandíbulas energizadas por código roxo. Cyberdramon (Nv. 36–37) patrulham todo o cânion leste ao redor dos ossos.',
    futureModule: 'Registros Fósseis do Mundo Digital',
    x: 2010,
    y: 745,
    radius: 92,
    accentColor: '#f43f5e',
  },
  {
    id: 'ds-stargate-ruins',
    kind: 'tamer-terminal',
    title: 'Portal Anelar das Ruínas',
    badge: 'Ruínas',
    description:
      'Antiga estrutura circular energética erguida no topo das falésias nordeste, interligada ao platô central pelo viaduto azul tecnológico.',
    futureModule: 'Conexão Dimensional das Ruínas Antigas',
    x: 2015,
    y: 445,
    radius: 92,
    accentColor: '#fbbf24',
  },
] as const;

export const DIGITAL_DESERT_FRIENDLY_NPCS: readonly FriendlyFieldNpc[] = [] as const;

/**
 * Precise, snag-free collision geometry mapped directly onto the 2400x1350 Deserto Digital artwork:
 * - Keeps the South Tech Platform, all bridges (SW monumental bridge, SE bridge, West bridge,
 *   NE viaduct), the Central Oasis terrace, Pyramid Plaza, Stargate Courtyard, Cavern terrace,
 *   Fossil canyon, and all 5 Ultimate hunting grounds 100% open & effortless to walk!
 * - Seals northern sky/floating islands, outer cliff abysses, lagoon pools strictly between bridges,
 *   and compact monument cores.
 */
export const DIGITAL_DESERT_COLLIDERS: readonly DatsCollider[] = [
  // 1. Northern Sky, Floating Islands, Crimson Fortress Mesa & Upper Pyramid Peak
  { id: 'ds-north-west-sky', x: 0, y: 0, w: 690, h: 372, kind: 'wall' },
  { id: 'ds-pyramid-peak-back', x: 690, y: 0, w: 1030, h: 458, kind: 'building' },
  { id: 'ds-north-east-sky', x: 1720, y: 0, w: 680, h: 382, kind: 'wall' },

  // 2. Outer Cliff Edges (West, East & South)
  { id: 'ds-west-mesa-cliff', x: 0, y: 372, w: 235, h: 365, kind: 'wall' },
  { id: 'ds-sw-crystal-cluster', x: 0, y: 737, w: 345, h: 195, kind: 'pillar' },
  { id: 'ds-west-abyss', x: 0, y: 932, w: 205, h: 418, kind: 'wall' },
  { id: 'ds-east-cliff-edge', x: 2215, y: 382, w: 185, h: 968, kind: 'wall' },
  { id: 'ds-south-west-dunes-edge', x: 205, y: 1235, w: 735, h: 115, kind: 'wall' },
  { id: 'ds-south-east-abyss', x: 1410, y: 1245, w: 805, h: 105, kind: 'wall' },

  // 3. Central Oasis Fountain & Lagoon Water Pools (strictly BETWEEN crossable bridges!)
  { id: 'ds-fountain-basin-core', x: 1165, y: 670, w: 125, h: 95, kind: 'pillar' },
  { id: 'ds-lagoon-water-west', x: 855, y: 865, w: 265, h: 185, kind: 'wall' },
  { id: 'ds-lagoon-water-center', x: 1120, y: 895, w: 350, h: 140, kind: 'wall' },
  { id: 'ds-lagoon-water-east', x: 1470, y: 810, w: 245, h: 195, kind: 'wall' },
  { id: 'ds-ne-viaduct-river', x: 1525, y: 635, w: 215, h: 145, kind: 'wall' },

  // 4. Compact Landmark Footprints (Fossil Skull Back & SE Sandstone Watchtower)
  { id: 'ds-fossil-spine', x: 1900, y: 595, w: 265, h: 68, kind: 'pillar' },
  { id: 'ds-se-watchtower', x: 2010, y: 985, w: 135, h: 90, kind: 'building' },
] as const;

/**
 * Ensures any saved coordinate sits cleanly inside walkable Deserto Digital terrain.
 */
export function ensureSafeDigitalDesertSpawn(
  x: number,
  y: number
): { x: number; y: number } {
  if (
    x < 220 ||
    x > DIGITAL_DESERT_WORLD_W - 210 ||
    y < 390 ||
    y > DIGITAL_DESERT_WORLD_H - 95
  ) {
    return { x: DIGITAL_DESERT_SPAWN_POINT.x, y: DIGITAL_DESERT_SPAWN_POINT.y };
  }
  for (const col of DIGITAL_DESERT_COLLIDERS) {
    if (
      x >= col.x - 18 &&
      x <= col.x + col.w + 18 &&
      y >= col.y - 18 &&
      y <= col.y + col.h + 18
    ) {
      return { x: DIGITAL_DESERT_SPAWN_POINT.x, y: DIGITAL_DESERT_SPAWN_POINT.y };
    }
  }
  return { x, y };
}

/**
 * 2.5D perspective depth scaling calibrated for Deserto Digital,
 * matching Planície Digital, Floresta de Dados & Montanha Digi.
 */
export function getDigitalDesertPerspectiveScale(worldY: number): number {
  const t = Math.max(0, Math.min(1, (worldY - 390) / (1230 - 390)));
  return 0.84 + t * 0.22;
}

export function isPointInDigitalDesertSafeZone(x: number, y: number): boolean {
  return (
    Math.hypot(x - DIGITAL_DESERT_SAFE_ZONE.x, y - DIGITAL_DESERT_SAFE_ZONE.y) <=
    DIGITAL_DESERT_SAFE_ZONE.radius
  );
}

export function getDigitalDesertZoneAtPoint(
  x: number,
  y: number
): HuntingExplorationZone | null {
  let closest: HuntingExplorationZone | null = null;
  let bestDist = Infinity;
  for (const zone of DIGITAL_DESERT_EXPLORATION_ZONES) {
    const d = Math.hypot(x - zone.x, y - zone.y);
    if (d <= zone.radius && d < bestDist) {
      bestDist = d;
      closest = zone;
    }
  }
  return closest;
}

// ============================================================================
// 5 ULTIMATE WILD DIGIMON TERRITORIES (LV. 30–40 · 35 MOBS TOTAL)
// IceLeomon (Leomon), Insekimon (Gotsumon), SkullMeramon (DemiMeramon),
// Cyberdramon (Monodramon) & WarGrowlmon (Guilmon)
// Every single spawn coordinate is verified clear of all colliders!
// ============================================================================

export const DIGITAL_DESERT_HABITAT_PACKS: readonly HuntingHabitatPackSpec[] = [
  {
    species: 'iceleomon',
    displayName: 'IceLeomon',
    habitatName: 'Platô dos Cristais Safira (Sudoeste)',
    zoneId: 'ds-sw-crystals',
    levelMin: 30,
    levelMax: 31,
    baseHp: 8200,
    hpPerLevel: 560,
    baseExp: 1620,
    expPerLevel: 110,
    bodyColor: '#38bdf8',
    accentColor: '#e0f2fe',
    eyeColor: '#67e8f9',
    spawns: [
      [410, 955],
      [485, 905],
      [555, 975],
      [645, 920],
      [505, 1045],
      [615, 1025],
      [715, 965],
    ],
  },
  {
    species: 'insekimon',
    displayName: 'Insekimon',
    habitatName: 'Dunas da Torre Antiga (Sudeste)',
    zoneId: 'ds-se-dunes',
    levelMin: 32,
    levelMax: 33,
    baseHp: 9600,
    hpPerLevel: 640,
    baseExp: 1890,
    expPerLevel: 125,
    bodyColor: '#a8a29e',
    accentColor: '#fde047',
    eyeColor: '#facc15',
    spawns: [
      [1595, 1095],
      [1675, 1045],
      [1755, 1135],
      [1845, 1065],
      [1925, 1130],
      [1705, 1190],
      [1875, 1195],
    ],
  },
  {
    species: 'skullmeramon',
    displayName: 'SkullMeramon',
    habitatName: 'Caverna Violeta e Platô Oeste',
    zoneId: 'ds-west-cavern',
    levelMin: 34,
    levelMax: 35,
    baseHp: 11200,
    hpPerLevel: 730,
    baseExp: 2180,
    expPerLevel: 145,
    bodyColor: '#3b82f6',
    accentColor: '#f97316',
    eyeColor: '#fb713b',
    spawns: [
      [455, 635],
      [535, 590],
      [625, 650],
      [715, 595],
      [565, 705],
      [675, 710],
      [775, 655],
    ],
  },
  {
    species: 'cyberdramon',
    displayName: 'Cyberdramon',
    habitatName: 'Cânion do Fóssil Ancestral (Leste)',
    zoneId: 'ds-east-fossil',
    levelMin: 36,
    levelMax: 37,
    baseHp: 13000,
    hpPerLevel: 840,
    baseExp: 2520,
    expPerLevel: 165,
    bodyColor: '#334155',
    accentColor: '#ef4444',
    eyeColor: '#f43f5e',
    spawns: [
      [1815, 720],
      [1905, 755],
      [1995, 705],
      [2085, 765],
      [1865, 825],
      [1985, 835],
      [2115, 835],
    ],
  },
  {
    species: 'megalogrowlmon',
    displayName: 'WarGrowlmon',
    habitatName: 'Praça da Grande Pirâmide Digital',
    zoneId: 'ds-pyramid-plaza',
    levelMin: 38,
    levelMax: 40,
    baseHp: 15100,
    hpPerLevel: 980,
    baseExp: 2940,
    expPerLevel: 195,
    bodyColor: '#dc2626',
    accentColor: '#cbd5e1',
    eyeColor: '#facc15',
    spawns: [
      [965, 545],
      [1055, 515],
      [1145, 560],
      [1255, 555],
      [1345, 515],
      [1435, 550],
      [1200, 505],
    ],
  },
] as const;

const DIGITAL_DESERT_TEMPLATES: readonly EnemyMonsterTemplate[] =
  DIGITAL_DESERT_HABITAT_PACKS.flatMap((pack) => {
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

export function createInitialDigitalDesertMonsters(): EnemyMonsterInstance[] {
  return DIGITAL_DESERT_TEMPLATES.map((tpl, idx) => ({
    ...tpl,
    id: `ds-${idx}-${tpl.species}`,
    disposition: 'enemy',
    x: tpl.homeX,
    y: tpl.homeY,
    hp: tpl.maxHp,
    alive: true,
    respawnTimer: 0,
    hitFlashTimer: 0,
    attackAnimTimer: 0,
    facingRight: idx % 2 === 0,
    patrolAngle: (idx * 1.13) % (Math.PI * 2),
    patrolTimer: 0,
    aggroed: false,
    aggroTimer: 0,
    counterCooldown: 0,
  }));
}

/**
 * Crisp static vector accents layered gently onto the decoded Deserto Digital artwork:
 * - Luminous DATS sanctuary ring around the South Technological Platform safe zone
 * - Subtle golden-sun & cyan digital sky wash
 * ZERO text or labels painted on the ground!
 */
function paintDigitalDesertStaticEnhancements(ctx: CanvasRenderingContext2D): void {
  ctx.save();

  // Subtle desert solar-cyan atmospheric wash
  const skyWash = ctx.createRadialGradient(1200, 140, 110, 1200, 560, 1420);
  skyWash.addColorStop(0, 'rgba(254, 243, 199, 0.12)');
  skyWash.addColorStop(0.5, 'rgba(56, 189, 248, 0.05)');
  skyWash.addColorStop(1, 'rgba(24, 15, 10, 0.14)');
  ctx.fillStyle = skyWash;
  ctx.fillRect(0, 0, DIGITAL_DESERT_WORLD_W, DIGITAL_DESERT_WORLD_H);

  // South Technological Platform Safe Zone sanctuary ring
  ctx.save();
  ctx.translate(DIGITAL_DESERT_SAFE_ZONE.x, DIGITAL_DESERT_SAFE_ZONE.y);
  const safeAura = ctx.createRadialGradient(
    0,
    0,
    24,
    0,
    0,
    DIGITAL_DESERT_SAFE_ZONE.radius
  );
  safeAura.addColorStop(0, 'rgba(56, 232, 255, 0.16)');
  safeAura.addColorStop(0.75, 'rgba(56, 232, 255, 0.05)');
  safeAura.addColorStop(1, 'rgba(56, 232, 255, 0)');
  ctx.fillStyle = safeAura;
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    DIGITAL_DESERT_SAFE_ZONE.radius,
    DIGITAL_DESERT_SAFE_ZONE.radius * 0.44,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.strokeStyle = 'rgba(125, 243, 255, 0.48)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    DIGITAL_DESERT_SAFE_ZONE.radius - 6,
    (DIGITAL_DESERT_SAFE_ZONE.radius - 6) * 0.42,
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
 * Builds the high-DPI offscreen terrain canvas for Deserto Digital,
 * using the exact same ultra-crisp pipeline as Planície Digital, Floresta de Dados & Montanha Digi.
 */
export function buildDigitalDesertStaticLayer(): HTMLCanvasElement {
  const pixelW = Math.round(DIGITAL_DESERT_WORLD_W * MAP_HIDPI_SCALE);
  const pixelH = Math.round(DIGITAL_DESERT_WORLD_H * MAP_HIDPI_SCALE);
  const canvas = document.createElement('canvas');
  canvas.width = pixelW;
  canvas.height = pixelH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Desert-sky fallback painted instantly for frame 0 before image decode resolves
  const fallbackGrad = ctx.createLinearGradient(0, 0, 0, pixelH);
  fallbackGrad.addColorStop(0, '#0284c7');
  fallbackGrad.addColorStop(0.45, '#b45309');
  fallbackGrad.addColorStop(1, '#451a03');
  ctx.fillStyle = fallbackGrad;
  ctx.fillRect(0, 0, pixelW, pixelH);

  const img = new Image();
  img.decoding = 'async';
  img.src = DIGITAL_DESERT_IMAGE_URL;
  img.onload = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pixelW, pixelH);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = 'contrast(1.06) saturate(1.09) brightness(1.02)';
    ctx.drawImage(img, 0, 0, pixelW, pixelH);
    ctx.restore();

    applyContrastAdaptiveSharpen(ctx, pixelW, pixelH, 1.08);

    ctx.save();
    ctx.scale(MAP_HIDPI_SCALE, MAP_HIDPI_SCALE);
    paintDigitalDesertStaticEnhancements(ctx);
    ctx.restore();
  };

  return canvas;
}

/**
 * Living 2.5D environmental FX layered directly over the Deserto Digital artwork:
 * - Radiant vertical cyan skybeam & apex shimmer above the Great Digital Pyramid
 * - Pulsing cyan South Technological Platform return portal & rising data motes
 * - Shimmering cyan energy at the Oasis Central Fountain & animated foam across all 4 turquoise waterfalls
 * - Pulsing purple amethyst aura at the Purple Crystal Cavern & glowing Fossil Dragon maw
 * - Radiant crimson aura on the NW Fortress, golden pulse on the NE Stargate Ring & sapphire crystal glints
 * - Warm drifting desert sand & golden sunlight motes
 */
export function drawDigitalDesertGroundAnimations(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  nearPortal: boolean
): void {
  const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  ctx.save();

  // 1. Radiant skybeam descending from the Great Digital Pyramid apex
  const beamShift = Math.sin(safeElapsed * 0.42) * 14;
  const beamGrad = ctx.createLinearGradient(
    1140 + beamShift,
    0,
    1265 + beamShift,
    380
  );
  beamGrad.addColorStop(0, 'rgba(186, 246, 255, 0.24)');
  beamGrad.addColorStop(0.55, 'rgba(56, 232, 255, 0.11)');
  beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(1140 + beamShift, 0);
  ctx.lineTo(1265 + beamShift, 0);
  ctx.lineTo(1320 + beamShift, 320);
  ctx.lineTo(1085 + beamShift, 320);
  ctx.closePath();
  ctx.fill();

  // Pyramid entrance portal pulse
  const pyrAlpha = 0.26 + Math.sin(safeElapsed * 2.9) * 0.12;
  ctx.fillStyle = `rgba(56, 232, 255, ${pyrAlpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(1200, 448, 32, 46, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. South Technological Platform Return Portal glow + rising digital motes
  const pulse = 1 + Math.sin(safeElapsed * 3.4) * 0.08;
  const portalGlow = ctx.createRadialGradient(
    DIGITAL_DESERT_RETURN_PORTAL.x,
    DIGITAL_DESERT_RETURN_PORTAL.y - 6,
    10,
    DIGITAL_DESERT_RETURN_PORTAL.x,
    DIGITAL_DESERT_RETURN_PORTAL.y - 6,
    114 * pulse
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
    DIGITAL_DESERT_RETURN_PORTAL.x,
    DIGITAL_DESERT_RETURN_PORTAL.y,
    108 * pulse,
    42 * pulse,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  if (nearPortal) {
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.92)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(
      DIGITAL_DESERT_RETURN_PORTAL.x,
      DIGITAL_DESERT_RETURN_PORTAL.y,
      74 * pulse,
      28 * pulse,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  for (let i = 0; i < 8; i++) {
    const phase = (safeElapsed * 0.54 + i * 0.125) % 1;
    const mx =
      DIGITAL_DESERT_RETURN_PORTAL.x + Math.sin(safeElapsed * 2.1 + i * 1.4) * 44;
    const my = DIGITAL_DESERT_RETURN_PORTAL.y + 8 - phase * 165;
    const alpha = Math.sin(phase * Math.PI) * 0.68;
    ctx.fillStyle = `rgba(165, 243, 252, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Central Oasis Fountain pulsing energy ring
  const fountainPulse = 0.96 + Math.sin(safeElapsed * 2.4) * 0.04;
  ctx.strokeStyle = `rgba(125, 243, 255, ${(0.25 + Math.sin(safeElapsed * 2.5) * 0.1).toFixed(3)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(1228, 712, 82 * fountainPulse, 30 * fountainPulse, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 4. Purple Crystal Cavern mystical amethyst glow & floating wisps
  const cavePulse = 1 + Math.sin(safeElapsed * 3.1) * 0.12;
  const caveGlow = ctx.createRadialGradient(445, 545, 8, 445, 545, 88 * cavePulse);
  caveGlow.addColorStop(0, 'rgba(192, 132, 252, 0.42)');
  caveGlow.addColorStop(0.55, 'rgba(147, 51, 234, 0.17)');
  caveGlow.addColorStop(1, 'rgba(147, 51, 234, 0)');
  ctx.fillStyle = caveGlow;
  ctx.beginPath();
  ctx.ellipse(445, 545, 82 * cavePulse, 48 * cavePulse, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 6; i++) {
    const phase = (safeElapsed * 0.45 + i * 0.17) % 1;
    const wx = 440 + Math.sin(safeElapsed * 1.7 + i * 2.1) * 40;
    const wy = 585 - phase * 105;
    const alpha = Math.sin(phase * Math.PI) * 0.6;
    ctx.fillStyle = `rgba(216, 180, 254, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(wx, wy, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Giant Dinosaur Fossil glowing violet maw & eyes shimmer
  const fossilGlowAlpha = 0.24 + Math.sin(safeElapsed * 3.0) * 0.11;
  ctx.fillStyle = `rgba(192, 132, 252, ${fossilGlowAlpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(1915, 725, 42, 22, -0.18, 0, Math.PI * 2);
  ctx.fill();

  // 6. NE Stargate Core & NW Crimson Fortress Core glow
  const stargateAlpha = 0.22 + Math.sin(safeElapsed * 2.6) * 0.1;
  ctx.fillStyle = `rgba(56, 232, 255, ${stargateAlpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(2042, 265, 34, 0, Math.PI * 2);
  ctx.fill();

  const crimsonAlpha = 0.22 + Math.sin(safeElapsed * 3.2) * 0.1;
  ctx.fillStyle = `rgba(244, 63, 94, ${crimsonAlpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(542, 222, 28, 0, Math.PI * 2);
  ctx.fill();

  // 7. Animated Oasis Waterfall Foam & Ripples across all 4 turquoise cascades
  const waterfalls = [
    { x: 942, y: 895, rx: 48, ry: 17 }, // West lagoon cascade
    { x: 1082, y: 925, rx: 46, ry: 16 }, // Central fountain left drop
    { x: 1618, y: 875, rx: 44, ry: 16 }, // East lagoon drop
    { x: 1412, y: 958, rx: 32, ry: 12 }, // Central island trickle
  ];
  for (let f = 0; f < waterfalls.length; f++) {
    const wf = waterfalls[f];
    const wave = (safeElapsed * 1.55 + f * 0.27) % 1;
    const mistAlpha = 0.24 + Math.sin(safeElapsed * 3.5 + f * 1.3) * 0.08;
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

    ctx.strokeStyle = `rgba(235, 252, 255, ${((1 - wave) * 0.44).toFixed(3)})`;
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

  // 8. Pulsing Sapphire & Cyan Crystal Shimmers
  const crystalGlints: ReadonlyArray<readonly [number, number, string]> = [
    [225, 835, '56, 232, 255'],
    [325, 815, '96, 165, 250'],
    [315, 615, '192, 132, 252'],
    [1955, 1185, '56, 232, 255'],
    [875, 420, '56, 232, 255'],
    [1515, 415, '56, 232, 255'],
  ];
  for (let i = 0; i < crystalGlints.length; i++) {
    const [cx, cy, rgb] = crystalGlints[i];
    const glow = 0.22 + Math.sin(safeElapsed * 3.1 + i * 1.5) * 0.14;
    ctx.fillStyle = `rgba(${rgb}, ${glow.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // 9. Warm Drifting Desert Sand & Solar Motes
  const motes: ReadonlyArray<readonly [number, number, string]> = [
    [520, 955, '165, 243, 252'],
    [665, 995, '186, 230, 253'],
    [1735, 1115, '253, 230, 138'],
    [1880, 1155, '251, 191, 36'],
    [615, 645, '216, 180, 254'],
    [1960, 755, '252, 165, 165'],
    [1185, 535, '254, 240, 138'],
    [1315, 525, '165, 243, 252'],
  ];
  for (let i = 0; i < motes.length; i++) {
    const [fx, fy, rgb] = motes[i];
    const dx = Math.sin(safeElapsed * 1.15 + i * 2.1) * 28;
    const dy = Math.cos(safeElapsed * 0.85 + i * 1.6) * 12 - ((safeElapsed * 6 + i * 11) % 22);
    const alpha = 0.26 + Math.sin(safeElapsed * 2.6 + i) * 0.18;
    ctx.fillStyle = `rgba(${rgb}, ${Math.max(0.08, alpha).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(fx + dx, fy + dy, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Depth-sorted dynamic actors on Deserto Digital (only entities with real sprites render in-world).
 */
export function buildDigitalDesertDepthProps(): HuntingDepthDrawable[] {
  return [];
}
