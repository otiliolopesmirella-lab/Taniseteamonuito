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

export const DATA_SEA_MAP_ID = 'data-sea' as const;

/**
 * Exact 16:9 world dimensions matching the Mar de Dados crystalline archipelago artwork,
 * keeping identical scale, HiDPI sharpness, and 2.5D navigation to all other maps.
 */
export const DATA_SEA_WORLD_W = 2400;
export const DATA_SEA_WORLD_H = 1350;

export const DATA_SEA_IMAGE_URL =
  '/assets/aistudio/file_0000000017f0820ea6d41eb04b618c35_ff9c0e73.webp';
export const DATA_SEA_BANNER_URL = DATA_SEA_IMAGE_URL;

/**
 * Player arrives directly on the glowing Southeast Circular Teleport Platform,
 * facing north toward the stone staircase, East Bridge, and Central Rune Plaza.
 */
export const DATA_SEA_SPAWN_POINT = {
  x: 1745,
  y: 920,
  facingDir: 'N' as const,
};

/**
 * Luminous cyan portal ring on the Southeast Teleport Platform returning to DATS Center.
 */
export const DATA_SEA_RETURN_PORTAL = {
  x: 1745,
  y: 912,
  radius: 92,
} as const;

/**
 * Safe Sanctuary around the Southeast Teleport Platform:
 * Partner never initiates combat here and HP/DS recover naturally.
 */
export const DATA_SEA_SAFE_ZONE = {
  x: 1745,
  y: 915,
  radius: 195,
  label: 'Plataforma de Teleporte Sudeste',
} as const;

export const DATA_SEA_EXPLORATION_ZONES: readonly HuntingExplorationZone[] = [
  {
    id: 'sea-se-platform',
    name: 'Plataforma de Teleporte Sudeste',
    subtitle: 'Zona Segura · Portal de Retorno DATS',
    x: 1745,
    y: 915,
    radius: 205,
  },
  {
    id: 'sea-south-beach',
    name: 'Praia das Palmeiras Sul',
    subtitle: 'Território dos MetalGreymon (Nv. 40–41)',
    x: 945,
    y: 1055,
    radius: 255,
    speciesLabel: 'MetalGreymon',
  },
  {
    id: 'sea-central-courtyard',
    name: 'Praça Rúnica Central',
    subtitle: 'Território dos Giromon (Nv. 42–43)',
    x: 1145,
    y: 655,
    radius: 235,
    speciesLabel: 'Giromon',
  },
  {
    id: 'sea-west-spire',
    name: 'Espiral da Cachoeira Oeste',
    subtitle: 'Território dos Garudamon (Nv. 44–45)',
    x: 410,
    y: 525,
    radius: 245,
    speciesLabel: 'Garudamon',
  },
  {
    id: 'sea-east-purple-cave',
    name: 'Caverna Cristalina Roxa Leste',
    subtitle: 'Território dos SkullSatamon (Nv. 46–47)',
    x: 1875,
    y: 555,
    radius: 235,
    speciesLabel: 'SkullSatamon',
  },
  {
    id: 'sea-north-castle',
    name: 'Pátio do Castelo Cristalino',
    subtitle: 'Território dos Okuwamon (Nv. 48–50)',
    x: 1175,
    y: 440,
    radius: 255,
    speciesLabel: 'Okuwamon',
  },
] as const;

export const DATA_SEA_INTERACTION_POINTS: readonly DatsInteractionPoint[] = [
  {
    id: 'sea-crystal-castle-gate',
    kind: 'main-entrance',
    title: 'Portão do Castelo Cristalino',
    badge: 'Castelo',
    description:
      'Cidadela de cristais safira erguida no topo norte do arquipélago. Seu pátio elevado é dominado por Okuwamon (Nv. 48–50), a temida evolução Ultimate voadora do Kunemon.',
    futureModule: 'Santuário Interno do Castelo e Desafios Mega',
    x: 1180,
    y: 405,
    radius: 92,
    accentColor: '#38e8ff',
  },
  {
    id: 'sea-west-beacon-spire',
    kind: 'tamer-terminal',
    title: 'Torre Farol da Cachoeira Oeste',
    badge: 'Farol',
    description:
      'Santuário insular conectado pela ponte em arco oeste, cercado por cascatas turquesa e patrulhado nos céus por Garudamon (Nv. 44–45).',
    futureModule: 'Balizas Oceânicas e Rotas Aéreas do Mar de Dados',
    x: 345,
    y: 485,
    radius: 88,
    accentColor: '#60a5fa',
  },
  {
    id: 'sea-purple-crystal-cavern',
    kind: 'tamer-terminal',
    title: 'Gruta dos Cristais Ametista',
    badge: 'Caverna',
    description:
      'Fenda rochosa energizada por cristais violeta no penhasco leste. SkullSatamon (Nv. 46–47) rondam a entrada com golpes de trevas intensos.',
    futureModule: 'Câmara Abissal de Dados Sombrios',
    x: 1875,
    y: 495,
    radius: 90,
    accentColor: '#c084fc',
  },
  {
    id: 'sea-central-rune-plaza',
    kind: 'info-npc',
    title: 'Altar Rúnico do Arquipélago',
    badge: 'Praça',
    description:
      'Círculo rúnico central que interliga as praias do sul, as pontes laterais e a escadaria do castelo. Giromon (Nv. 42–43) flutuam em guarda constante pela arena.',
    futureModule: 'Convergência Rúnica e Eventos Cooperativos',
    x: 1140,
    y: 645,
    radius: 88,
    accentColor: '#34d399',
  },
] as const;

export const DATA_SEA_FRIENDLY_NPCS: readonly FriendlyFieldNpc[] = [] as const;

/**
 * Snag-free collision geometry aligned to the 2400x1350 Mar de Dados island archipelago:
 * - Keeps the SE Teleport Platform, SE stairs, East Bridge, Central Rune Courtyard,
 *   SW Beach Stairs, South Palm Beach, West Arch Bridge, West Spire Cliff,
 *   East Purple Cave Mesa, and North Crystal Castle Forecourt 100% open and smooth!
 * - Blocks outer deep oceans and narrow waterfall gorges strictly between walkways.
 */
export const DATA_SEA_COLLIDERS: readonly DatsCollider[] = [
  // 1. Northern Sky, Ocean Horizon, Crystal Castle Keep Back & NE Mountains
  { id: 'ds2-north-west-ocean', x: 0, y: 0, w: 720, h: 380, kind: 'wall' },
  { id: 'ds2-castle-fortress-back', x: 720, y: 0, w: 960, h: 365, kind: 'building' },
  { id: 'ds2-north-east-peaks', x: 1680, y: 0, w: 720, h: 420, kind: 'wall' },

  // 2. Outer Deep Ocean Edges (West, East & South)
  { id: 'ds2-west-ocean-upper', x: 0, y: 380, w: 225, h: 310, kind: 'wall' },
  { id: 'ds2-west-ocean-lower', x: 0, y: 690, w: 590, h: 660, kind: 'wall' },
  { id: 'ds2-east-ocean', x: 2135, y: 420, w: 265, h: 930, kind: 'wall' },
  { id: 'ds2-south-beach-ocean', x: 590, y: 1215, w: 775, h: 135, kind: 'wall' },
  { id: 'ds2-south-bay-cove', x: 1365, y: 805, w: 235, h: 545, kind: 'wall' },
  { id: 'ds2-se-pad-ocean-bottom', x: 1600, y: 1055, w: 535, h: 295, kind: 'wall' },

  // 3. Waterfall Chasms strictly BETWEEN crossable bridges & plateaus
  { id: 'ds2-west-waterfall-gorge', x: 505, y: 515, w: 105, h: 175, kind: 'wall' },
  { id: 'ds2-east-waterfall-gorge', x: 1475, y: 365, w: 195, h: 290, kind: 'wall' },
  { id: 'ds2-east-bridge-upper-pool', x: 1405, y: 585, w: 70, h: 90, kind: 'wall' },
] as const;

export function ensureSafeDataSeaSpawn(
  x: number,
  y: number
): { x: number; y: number } {
  if (
    x < 235 ||
    x > DATA_SEA_WORLD_W - 275 ||
    y < 375 ||
    y > DATA_SEA_WORLD_H - 145
  ) {
    return { x: DATA_SEA_SPAWN_POINT.x, y: DATA_SEA_SPAWN_POINT.y };
  }
  for (const col of DATA_SEA_COLLIDERS) {
    if (
      x >= col.x - 18 &&
      x <= col.x + col.w + 18 &&
      y >= col.y - 18 &&
      y <= col.y + col.h + 18
    ) {
      return { x: DATA_SEA_SPAWN_POINT.x, y: DATA_SEA_SPAWN_POINT.y };
    }
  }
  return { x, y };
}

/**
 * 2.5D perspective depth scaling calibrated for Mar de Dados.
 */
export function getDataSeaPerspectiveScale(worldY: number): number {
  const t = Math.max(0, Math.min(1, (worldY - 380) / (1210 - 380)));
  return 0.84 + t * 0.22;
}

export function isPointInDataSeaSafeZone(x: number, y: number): boolean {
  return (
    Math.hypot(x - DATA_SEA_SAFE_ZONE.x, y - DATA_SEA_SAFE_ZONE.y) <=
    DATA_SEA_SAFE_ZONE.radius
  );
}

export function getDataSeaZoneAtPoint(
  x: number,
  y: number
): HuntingExplorationZone | null {
  let closest: HuntingExplorationZone | null = null;
  let bestDist = Infinity;
  for (const zone of DATA_SEA_EXPLORATION_ZONES) {
    const d = Math.hypot(x - zone.x, y - zone.y);
    if (d <= zone.radius && d < bestDist) {
      bestDist = d;
      closest = zone;
    }
  }
  return closest;
}

// ============================================================================
// 5 ULTIMATE WILD DIGIMON TERRITORIES (LV. 40–50 · 35 MOBS TOTAL)
// MetalGreymon (Agumon Clássico), Giromon (Drimogemon), Garudamon (Biyomon),
// SkullSatamon (Impmon) & Okuwamon (Kunemon)
// Every single spawn coordinate sits cleanly clear of all colliders!
// ============================================================================

export const DATA_SEA_HABITAT_PACKS: readonly HuntingHabitatPackSpec[] = [
  {
    species: 'metalgreymon',
    displayName: 'MetalGreymon',
    habitatName: 'Praia das Palmeiras Sul',
    zoneId: 'sea-south-beach',
    levelMin: 40,
    levelMax: 41,
    baseHp: 17400,
    hpPerLevel: 1100,
    baseExp: 3420,
    expPerLevel: 225,
    bodyColor: '#f97316',
    accentColor: '#94a3b8',
    eyeColor: '#38bdf8',
    spawns: [
      [725, 1020],
      [815, 975],
      [895, 1065],
      [990, 1015],
      [1085, 1085],
      [1185, 1045],
      [945, 1145],
    ],
  },
  {
    species: 'giromon',
    displayName: 'Giromon',
    habitatName: 'Praça Rúnica Central',
    zoneId: 'sea-central-courtyard',
    levelMin: 42,
    levelMax: 43,
    baseHp: 19900,
    hpPerLevel: 1220,
    baseExp: 3920,
    expPerLevel: 250,
    bodyColor: '#a855f7',
    accentColor: '#fde047',
    eyeColor: '#ef4444',
    spawns: [
      [945, 625],
      [1045, 585],
      [1235, 585],
      [1335, 635],
      [985, 725],
      [1145, 745],
      [1285, 720],
    ],
  },
  {
    species: 'garudamon',
    displayName: 'Garudamon',
    habitatName: 'Espiral da Cachoeira Oeste',
    zoneId: 'sea-west-spire',
    levelMin: 44,
    levelMax: 45,
    baseHp: 22600,
    hpPerLevel: 1350,
    baseExp: 4460,
    expPerLevel: 280,
    bodyColor: '#ef4444',
    accentColor: '#fde047',
    eyeColor: '#38bdf8',
    spawns: [
      [295, 515],
      [365, 470],
      [435, 520],
      [335, 590],
      [425, 610],
      [665, 455],
      [755, 520],
    ],
  },
  {
    species: 'skullsatamon',
    displayName: 'SkullSatamon',
    habitatName: 'Caverna Cristalina Roxa Leste',
    zoneId: 'sea-east-purple-cave',
    levelMin: 46,
    levelMax: 47,
    baseHp: 25600,
    hpPerLevel: 1480,
    baseExp: 5060,
    expPerLevel: 315,
    bodyColor: '#7c3aed',
    accentColor: '#facc15',
    eyeColor: '#ef4444',
    spawns: [
      [1735, 520],
      [1825, 495],
      [1915, 535],
      [2015, 515],
      [1780, 615],
      [1900, 620],
      [2025, 600],
    ],
  },
  {
    species: 'okuwamon',
    displayName: 'Okuwamon',
    habitatName: 'Pátio do Castelo Cristalino',
    zoneId: 'sea-north-castle',
    levelMin: 48,
    levelMax: 50,
    baseHp: 28800,
    hpPerLevel: 1650,
    baseExp: 5740,
    expPerLevel: 360,
    bodyColor: '#84cc16',
    accentColor: '#34d399',
    eyeColor: '#ef4444',
    spawns: [
      [925, 430],
      [1025, 410],
      [1125, 455],
      [1235, 450],
      [1335, 415],
      [1425, 460],
      [1185, 395],
    ],
  },
] as const;

const DATA_SEA_TEMPLATES: readonly EnemyMonsterTemplate[] =
  DATA_SEA_HABITAT_PACKS.flatMap((pack) => {
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

export function createInitialDataSeaMonsters(): EnemyMonsterInstance[] {
  return DATA_SEA_TEMPLATES.map((tpl, idx) => ({
    ...tpl,
    id: `sea-${idx}-${tpl.species}`,
    disposition: 'enemy',
    x: tpl.homeX,
    y: tpl.homeY,
    hp: tpl.maxHp,
    alive: true,
    respawnTimer: 0,
    hitFlashTimer: 0,
    attackAnimTimer: 0,
    facingRight: idx % 2 === 0,
    patrolAngle: (idx * 1.19) % (Math.PI * 2),
    patrolTimer: 0,
    aggroed: false,
    aggroTimer: 0,
    counterCooldown: 0,
  }));
}

/**
 * Static subtle vector accents layered cleanly over the decoded Mar de Dados artwork:
 * - Soft oceanic atmospheric sky & turquoise reflection wash
 * - Luminous cyan sanctuary aura ring around the Southeast Teleport Platform
 * ZERO text or labels painted on the ground!
 */
function paintDataSeaStaticEnhancements(ctx: CanvasRenderingContext2D): void {
  ctx.save();

  const seaWash = ctx.createRadialGradient(1180, 260, 120, 1200, 680, 1450);
  seaWash.addColorStop(0, 'rgba(186, 230, 253, 0.11)');
  seaWash.addColorStop(0.55, 'rgba(14, 165, 233, 0.05)');
  seaWash.addColorStop(1, 'rgba(3, 21, 48, 0.16)');
  ctx.fillStyle = seaWash;
  ctx.fillRect(0, 0, DATA_SEA_WORLD_W, DATA_SEA_WORLD_H);

  // Southeast Teleport Platform Safe Zone sanctuary ring
  ctx.save();
  ctx.translate(DATA_SEA_SAFE_ZONE.x, DATA_SEA_SAFE_ZONE.y);
  const safeAura = ctx.createRadialGradient(
    0,
    0,
    24,
    0,
    0,
    DATA_SEA_SAFE_ZONE.radius
  );
  safeAura.addColorStop(0, 'rgba(56, 232, 255, 0.16)');
  safeAura.addColorStop(0.75, 'rgba(56, 232, 255, 0.05)');
  safeAura.addColorStop(1, 'rgba(56, 232, 255, 0)');
  ctx.fillStyle = safeAura;
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    DATA_SEA_SAFE_ZONE.radius,
    DATA_SEA_SAFE_ZONE.radius * 0.44,
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
    DATA_SEA_SAFE_ZONE.radius - 6,
    (DATA_SEA_SAFE_ZONE.radius - 6) * 0.42,
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
 * High-DPI offscreen terrain layer for Mar de Dados with contrast-adaptive sharpening.
 */
export function buildDataSeaStaticLayer(): HTMLCanvasElement {
  const pixelW = Math.round(DATA_SEA_WORLD_W * MAP_HIDPI_SCALE);
  const pixelH = Math.round(DATA_SEA_WORLD_H * MAP_HIDPI_SCALE);
  const canvas = document.createElement('canvas');
  canvas.width = pixelW;
  canvas.height = pixelH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const fallbackGrad = ctx.createLinearGradient(0, 0, 0, pixelH);
  fallbackGrad.addColorStop(0, '#0284c7');
  fallbackGrad.addColorStop(0.45, '#0369a1');
  fallbackGrad.addColorStop(1, '#082f49');
  ctx.fillStyle = fallbackGrad;
  ctx.fillRect(0, 0, pixelW, pixelH);

  const img = new Image();
  img.decoding = 'async';
  img.src = DATA_SEA_IMAGE_URL;
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
    paintDataSeaStaticEnhancements(ctx);
    ctx.restore();
  };

  return canvas;
}

/**
 * Living 2.5D environmental animations layered smoothly over Mar de Dados:
 * - Luminous cyan aura & rising data motes on the Southeast Teleport Platform
 * - Crystal Spire beacon & Crystal Castle sapphire pulse
 * - Purple Crystal Cavern amethyst aura & drifting wisps
 * - Central Rune Plaza harmonic energy ring
 * - Animated foam & ripples at all 4 turquoise waterfalls + oceanic sunlight sparkles
 */
export function drawDataSeaGroundAnimations(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  nearPortal: boolean
): void {
  const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  ctx.save();

  // 1. North Crystal Castle beacon shimmer & gate pulse
  const castlePulse = 0.24 + Math.sin(safeElapsed * 2.7) * 0.11;
  ctx.fillStyle = `rgba(56, 232, 255, ${castlePulse.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(1178, 305, 34, 52, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Southeast Return Portal glow + rising cyan motes
  const pulse = 1 + Math.sin(safeElapsed * 3.4) * 0.08;
  const portalGlow = ctx.createRadialGradient(
    DATA_SEA_RETURN_PORTAL.x,
    DATA_SEA_RETURN_PORTAL.y - 6,
    10,
    DATA_SEA_RETURN_PORTAL.x,
    DATA_SEA_RETURN_PORTAL.y - 6,
    118 * pulse
  );
  portalGlow.addColorStop(
    0,
    nearPortal ? 'rgba(254, 240, 138, 0.5)' : 'rgba(56, 232, 255, 0.45)'
  );
  portalGlow.addColorStop(0.55, 'rgba(14, 165, 233, 0.18)');
  portalGlow.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = portalGlow;
  ctx.beginPath();
  ctx.ellipse(
    DATA_SEA_RETURN_PORTAL.x,
    DATA_SEA_RETURN_PORTAL.y,
    110 * pulse,
    44 * pulse,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  if (nearPortal) {
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.94)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(
      DATA_SEA_RETURN_PORTAL.x,
      DATA_SEA_RETURN_PORTAL.y,
      78 * pulse,
      30 * pulse,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  for (let i = 0; i < 8; i++) {
    const phase = (safeElapsed * 0.54 + i * 0.125) % 1;
    const mx =
      DATA_SEA_RETURN_PORTAL.x + Math.sin(safeElapsed * 2.1 + i * 1.4) * 44;
    const my = DATA_SEA_RETURN_PORTAL.y + 8 - phase * 168;
    const alpha = Math.sin(phase * Math.PI) * 0.7;
    ctx.fillStyle = `rgba(165, 243, 252, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Central Rune Courtyard harmonic ring
  const plazaPulse = 0.96 + Math.sin(safeElapsed * 2.3) * 0.04;
  ctx.strokeStyle = `rgba(125, 243, 255, ${(0.28 + Math.sin(safeElapsed * 2.4) * 0.1).toFixed(3)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(1135, 622, 92 * plazaPulse, 34 * plazaPulse, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 4. West Sky-Spire Beacon aura
  const spireGlowAlpha = 0.25 + Math.sin(safeElapsed * 3.0) * 0.11;
  ctx.fillStyle = `rgba(56, 232, 255, ${spireGlowAlpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(340, 462, 52, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // 5. East Purple Crystal Cavern amethyst aura & drifting wisps
  const cavePulse = 1 + Math.sin(safeElapsed * 3.1) * 0.12;
  const caveGlow = ctx.createRadialGradient(1875, 470, 8, 1875, 470, 92 * cavePulse);
  caveGlow.addColorStop(0, 'rgba(192, 132, 252, 0.44)');
  caveGlow.addColorStop(0.55, 'rgba(147, 51, 234, 0.18)');
  caveGlow.addColorStop(1, 'rgba(147, 51, 234, 0)');
  ctx.fillStyle = caveGlow;
  ctx.beginPath();
  ctx.ellipse(1875, 470, 86 * cavePulse, 52 * cavePulse, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 6; i++) {
    const phase = (safeElapsed * 0.45 + i * 0.17) % 1;
    const wx = 1875 + Math.sin(safeElapsed * 1.7 + i * 2.1) * 42;
    const wy = 515 - phase * 105;
    const alpha = Math.sin(phase * Math.PI) * 0.62;
    ctx.fillStyle = `rgba(216, 180, 254, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(wx, wy, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Animated Waterfall Mist & Ripples across all coastal & cliff cascades
  const waterfalls = [
    { x: 472, y: 665, rx: 46, ry: 16 }, // West spire cascade
    { x: 678, y: 805, rx: 40, ry: 14 }, // SW cliff cascade
    { x: 1445, y: 585, rx: 52, ry: 18 }, // Central-east main waterfall plunge
    { x: 1385, y: 795, rx: 38, ry: 14 }, // East bridge lower trickle
    { x: 2125, y: 690, rx: 38, ry: 14 }, // Far-east cliff waterfall
  ];
  for (let f = 0; f < waterfalls.length; f++) {
    const wf = waterfalls[f];
    const wave = (safeElapsed * 1.55 + f * 0.23) % 1;
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

  // 7. Sparkling turquoise ocean sunlight glints & coastal sea breeze motes
  const oceanGlints: ReadonlyArray<readonly [number, number, string]> = [
    [665, 1185, '165, 243, 252'],
    [1015, 1225, '224, 249, 255'],
    [1465, 965, '125, 211, 252'],
    [2035, 995, '186, 230, 253'],
    [225, 945, '125, 211, 252'],
    [1885, 555, '216, 180, 254'],
    [1180, 445, '165, 243, 252'],
    [395, 515, '165, 243, 252'],
  ];
  for (let i = 0; i < oceanGlints.length; i++) {
    const [fx, fy, rgb] = oceanGlints[i];
    const dx = Math.sin(safeElapsed * 1.15 + i * 2.1) * 26;
    const dy = Math.cos(safeElapsed * 0.85 + i * 1.6) * 10 - ((safeElapsed * 5 + i * 11) % 20);
    const alpha = 0.26 + Math.sin(safeElapsed * 2.8 + i * 1.3) * 0.18;
    ctx.fillStyle = `rgba(${rgb}, ${Math.max(0.08, alpha).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(fx + dx, fy + dy, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Depth-sorted dynamic actors on Mar de Dados (only entities with real sprites render in-world).
 */
export function buildDataSeaDepthProps(): HuntingDepthDrawable[] {
  return [];
}
