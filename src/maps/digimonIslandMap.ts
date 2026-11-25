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

export const DIGIMON_ISLAND_MAP_ID = 'digimon-island' as const;

/**
 * Exact 16:9 world dimensions matching the Ilha dos Digimons artwork,
 * keeping identical scale, HiDPI sharpness, and 2.5D navigation to all other maps.
 */
export const DIGIMON_ISLAND_WORLD_W = 2400;
export const DIGIMON_ISLAND_WORLD_H = 1350;

export const DIGIMON_ISLAND_IMAGE_URL =
  '/assets/aistudio/file_00000000997c820e92195443c144e5a0_eb0c1c18.webp';
export const DIGIMON_ISLAND_BANNER_URL = DIGIMON_ISLAND_IMAGE_URL;

/**
 * Player arrives directly on the South Harbor Promenade in front of the glowing blue archway,
 * facing north toward the Angel Statue Sanctuary, volcanic canyons, and Crystal Citadel.
 */
export const DIGIMON_ISLAND_SPAWN_POINT = {
  x: 1245,
  y: 1185,
  facingDir: 'N' as const,
};

/**
 * Luminous cyan harbor platform ring at the south pier returning to DATS Center.
 */
export const DIGIMON_ISLAND_RETURN_PORTAL = {
  x: 1245,
  y: 1250,
  radius: 90,
} as const;

/**
 * Safe Sanctuary around the South Blue Portal Pier:
 * Partner never initiates combat here and HP/DS recover naturally.
 */
export const DIGIMON_ISLAND_SAFE_ZONE = {
  x: 1245,
  y: 1205,
  radius: 190,
  label: 'Cais do Portal Azul',
} as const;

export const DIGIMON_ISLAND_EXPLORATION_ZONES: readonly HuntingExplorationZone[] = [
  {
    id: 'island-south-pier',
    name: 'Cais do Portal Azul',
    subtitle: 'Zona Segura · Portal de Retorno DATS',
    x: 1245,
    y: 1205,
    radius: 200,
  },
  {
    id: 'island-south-coast',
    name: 'Costa das Palmeiras Sul',
    subtitle: 'Território dos MetalGarurumon (Nv. 50–51)',
    x: 840,
    y: 1045,
    radius: 265,
    speciesLabel: 'MetalGarurumon',
  },
  {
    id: 'island-angel-plaza',
    name: 'Santuário da Estátua Angelical',
    subtitle: 'Território das Sakuyamon (Nv. 52–53)',
    x: 1190,
    y: 705,
    radius: 245,
    speciesLabel: 'Sakuyamon',
  },
  {
    id: 'island-purple-crater',
    name: 'Platô dos Cristais Violeta',
    subtitle: 'Território dos Gryphonmon (Nv. 54–55)',
    x: 430,
    y: 705,
    radius: 245,
    speciesLabel: 'Gryphonmon',
  },
  {
    id: 'island-magma-gate',
    name: 'Portão Ígneo do Desfiladeiro',
    subtitle: 'Território dos Dukemon (Nv. 56–57)',
    x: 1815,
    y: 725,
    radius: 255,
    speciesLabel: 'Dukemon',
  },
  {
    id: 'island-crystal-citadel',
    name: 'Terraço da Cidadela Cristalina',
    subtitle: 'Território dos Griffomon (Nv. 58–60)',
    x: 1160,
    y: 480,
    radius: 280,
    speciesLabel: 'Griffomon',
  },
] as const;

export const DIGIMON_ISLAND_INTERACTION_POINTS: readonly DatsInteractionPoint[] = [
  {
    id: 'island-crystal-citadel-gate',
    kind: 'main-entrance',
    title: 'Portão da Cidadela Cristalina',
    badge: 'Cidadela',
    description:
      'Fortaleza suprema erguida acima das grandes cachoeiras da Ilha dos Digimons. Griffomon (Nv. 58–60) dominam os terraços superiores protegendo a coroa de cristal.',
    futureModule: 'Santuário da Cidadela e Desafios Mega Extremos',
    x: 1200,
    y: 430,
    radius: 92,
    accentColor: '#38e8ff',
  },
  {
    id: 'island-angel-sanctuary',
    kind: 'info-npc',
    title: 'Santuário da Estátua Angelical',
    badge: 'Santuário',
    description:
      'Praça sagrada no coração da ilha, adornada pela grande estátua alada. Sakuyamon (Nv. 52–53) patrulham os círculos rúnicos com poder místico.',
    futureModule: 'Convergência Rúnica e Bênçãos da Ilha',
    x: 1190,
    y: 690,
    radius: 92,
    accentColor: '#fde047',
  },
  {
    id: 'island-purple-crater-altar',
    kind: 'tamer-terminal',
    title: 'Cratera dos Cristais Violeta',
    badge: 'Cristais',
    description:
      'Platô ocidental marcado por um portal dimensional ametista e rochas energizadas. Gryphonmon (Nv. 54–55) sobrevoam a cratera com rajadas supersônicas.',
    futureModule: 'Fenda Dimensional Ametista',
    x: 420,
    y: 690,
    radius: 90,
    accentColor: '#c084fc',
  },
  {
    id: 'island-magma-gate-shrine',
    kind: 'tamer-terminal',
    title: 'Portal Ígneo do Desfiladeiro',
    badge: 'Magma',
    description:
      'Penhasco oriental esculpido em rocha vulcânica ao redor de um portal flamejante. Dukemon (Nv. 56–57) guardam o altar prontos para duelos de nível Mega.',
    futureModule: 'Forja Vulcânica dos Cavaleiros Reais',
    x: 1835,
    y: 710,
    radius: 90,
    accentColor: '#fb923c',
  },
  {
    id: 'island-se-beacon-harbor',
    kind: 'tamer-terminal',
    title: 'Cais do Farol Tecnológico',
    badge: 'Porto',
    description:
      'Plataforma oceânica avançada a sudeste da Ilha dos Digimons conectada por pontes sobre a lagoa turquesa.',
    futureModule: 'Rotas Marítimas de Expansão',
    x: 1985,
    y: 1085,
    radius: 88,
    accentColor: '#60a5fa',
  },
] as const;

export const DIGIMON_ISLAND_FRIENDLY_NPCS: readonly FriendlyFieldNpc[] = [] as const;

/**
 * Snag-free collision geometry aligned to the 2400x1350 Ilha dos Digimons artwork:
 * - Keeps the South Portal Pier, SW Palm Coast & Village, SE Beacon Harbor,
 *   Central Angel Statue Sanctuary, West Purple Crystal Crater, East Magma Gate,
 *   and Upper Waterfall Terraces / Citadel Forecourt 100% open and connected!
 * - Bounds outer deep oceans, sky horizon, and citadel summit back cleanly.
 */
export const DIGIMON_ISLAND_COLLIDERS: readonly DatsCollider[] = [
  // 1. Northern Sky Horizon & Crystal Citadel Back
  { id: 'di-north-sky-nw', x: 0, y: 0, w: 720, h: 400, kind: 'wall' },
  { id: 'di-north-citadel-back', x: 720, y: 0, w: 960, h: 375, kind: 'building' },
  { id: 'di-north-sky-ne', x: 1680, y: 0, w: 720, h: 415, kind: 'wall' },

  // 2. Outer Deep Ocean Borders (West, East & South)
  { id: 'di-west-ocean-top', x: 0, y: 400, w: 185, h: 420, kind: 'wall' },
  { id: 'di-west-ocean-bot', x: 0, y: 820, w: 320, h: 530, kind: 'wall' },
  { id: 'di-east-ocean-top', x: 2155, y: 415, w: 245, h: 495, kind: 'wall' },
  { id: 'di-east-ocean-bot', x: 2210, y: 910, w: 190, h: 440, kind: 'wall' },
  { id: 'di-south-ocean-left', x: 320, y: 1205, w: 805, h: 145, kind: 'wall' },
  { id: 'di-south-ocean-right', x: 1365, y: 1205, w: 845, h: 145, kind: 'wall' },
  { id: 'di-south-pier-tip', x: 1125, y: 1315, w: 240, h: 35, kind: 'wall' },
] as const;

export function ensureSafeDigimonIslandSpawn(
  x: number,
  y: number
): { x: number; y: number } {
  if (
    x < 195 ||
    x > DIGIMON_ISLAND_WORLD_W - 255 ||
    y < 385 ||
    y > DIGIMON_ISLAND_WORLD_H - 45
  ) {
    return { x: DIGIMON_ISLAND_SPAWN_POINT.x, y: DIGIMON_ISLAND_SPAWN_POINT.y };
  }
  for (const col of DIGIMON_ISLAND_COLLIDERS) {
    if (
      x >= col.x - 18 &&
      x <= col.x + col.w + 18 &&
      y >= col.y - 18 &&
      y <= col.y + col.h + 18
    ) {
      return { x: DIGIMON_ISLAND_SPAWN_POINT.x, y: DIGIMON_ISLAND_SPAWN_POINT.y };
    }
  }
  return { x, y };
}

/**
 * 2.5D perspective depth scaling calibrated for Ilha dos Digimons.
 */
export function getDigimonIslandPerspectiveScale(worldY: number): number {
  const t = Math.max(0, Math.min(1, (worldY - 380) / (1240 - 380)));
  return 0.84 + t * 0.22;
}

export function isPointInDigimonIslandSafeZone(x: number, y: number): boolean {
  return (
    Math.hypot(x - DIGIMON_ISLAND_SAFE_ZONE.x, y - DIGIMON_ISLAND_SAFE_ZONE.y) <=
    DIGIMON_ISLAND_SAFE_ZONE.radius
  );
}

export function getDigimonIslandZoneAtPoint(
  x: number,
  y: number
): HuntingExplorationZone | null {
  let closest: HuntingExplorationZone | null = null;
  let bestDist = Infinity;
  for (const zone of DIGIMON_ISLAND_EXPLORATION_ZONES) {
    const d = Math.hypot(x - zone.x, y - zone.y);
    if (d <= zone.radius && d < bestDist) {
      bestDist = d;
      closest = zone;
    }
  }
  return closest;
}

// ============================================================================
// 5 MEGA WILD DIGIMON TERRITORIES (LV. 50–60 · 35 MOBS TOTAL)
// MetalGarurumon (Gabumon), Sakuyamon (Renamon), Gryphonmon (Hawkmon),
// Dukemon (Guilmon) & Griffomon (Kiwimon)
// Every single spawn coordinate sits cleanly clear of all colliders!
// ============================================================================

export const DIGIMON_ISLAND_HABITAT_PACKS: readonly HuntingHabitatPackSpec[] = [
  {
    species: 'metalgarurumon',
    displayName: 'MetalGarurumon',
    habitatName: 'Costa das Palmeiras Sul',
    zoneId: 'island-south-coast',
    levelMin: 50,
    levelMax: 51,
    baseHp: 34200,
    hpPerLevel: 1850,
    baseExp: 6900,
    expPerLevel: 420,
    bodyColor: '#38bdf8',
    accentColor: '#e2e8f0',
    eyeColor: '#ef4444',
    spawns: [
      [640, 1040],
      [735, 995],
      [815, 1085],
      [905, 1015],
      [995, 1090],
      [1070, 1020],
      [760, 1120],
    ],
  },
  {
    species: 'sakuyamon',
    displayName: 'Sakuyamon',
    habitatName: 'Santuário da Estátua Angelical',
    zoneId: 'island-angel-plaza',
    levelMin: 52,
    levelMax: 53,
    baseHp: 38200,
    hpPerLevel: 2050,
    baseExp: 7800,
    expPerLevel: 460,
    bodyColor: '#facc15',
    accentColor: '#a855f7',
    eyeColor: '#38bdf8',
    spawns: [
      [995, 715],
      [1085, 655],
      [1195, 765],
      [1295, 655],
      [1385, 725],
      [1095, 815],
      [1285, 810],
    ],
  },
  {
    species: 'gryphonmon',
    displayName: 'Gryphonmon',
    habitatName: 'Platô dos Cristais Violeta',
    zoneId: 'island-purple-crater',
    levelMin: 54,
    levelMax: 55,
    baseHp: 42800,
    hpPerLevel: 2250,
    baseExp: 8850,
    expPerLevel: 510,
    bodyColor: '#eab308',
    accentColor: '#34d399',
    eyeColor: '#ef4444',
    spawns: [
      [265, 680],
      [355, 635],
      [445, 700],
      [535, 645],
      [335, 765],
      [455, 785],
      [565, 745],
    ],
  },
  {
    species: 'dukemon',
    displayName: 'Dukemon',
    habitatName: 'Portão Ígneo do Desfiladeiro',
    zoneId: 'island-magma-gate',
    levelMin: 56,
    levelMax: 57,
    baseHp: 47800,
    hpPerLevel: 2450,
    baseExp: 9980,
    expPerLevel: 560,
    bodyColor: '#ef4444',
    accentColor: '#f8fafc',
    eyeColor: '#fbbf24',
    spawns: [
      [1610, 735],
      [1705, 675],
      [1795, 745],
      [1895, 685],
      [1985, 745],
      [1735, 825],
      [1885, 815],
    ],
  },
  {
    species: 'griffomon',
    displayName: 'Griffomon',
    habitatName: 'Terraço da Cidadela Cristalina',
    zoneId: 'island-crystal-citadel',
    levelMin: 58,
    levelMax: 60,
    baseHp: 53400,
    hpPerLevel: 2700,
    baseExp: 11200,
    expPerLevel: 640,
    bodyColor: '#84cc16',
    accentColor: '#f59e0b',
    eyeColor: '#ef4444',
    spawns: [
      [740, 465],
      [855, 450],
      [985, 495],
      [1145, 455],
      [1285, 455],
      [1415, 490],
      [1535, 465],
    ],
  },
] as const;

const DIGIMON_ISLAND_TEMPLATES: readonly EnemyMonsterTemplate[] =
  DIGIMON_ISLAND_HABITAT_PACKS.flatMap((pack) => {
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

export function createInitialDigimonIslandMonsters(): EnemyMonsterInstance[] {
  return DIGIMON_ISLAND_TEMPLATES.map((tpl, idx) => ({
    ...tpl,
    id: `island-${idx}-${tpl.species}`,
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
 * Static subtle vector accents layered cleanly over the decoded Ilha dos Digimons artwork:
 * - Soft atmospheric sky & turquoise reflection wash
 * - Luminous cyan sanctuary aura ring around the South Blue Portal Pier
 * ZERO text or labels painted on the ground!
 */
function paintDigimonIslandStaticEnhancements(ctx: CanvasRenderingContext2D): void {
  ctx.save();

  const skyWash = ctx.createRadialGradient(1200, 240, 140, 1200, 680, 1480);
  skyWash.addColorStop(0, 'rgba(186, 230, 253, 0.11)');
  skyWash.addColorStop(0.55, 'rgba(14, 165, 233, 0.05)');
  skyWash.addColorStop(1, 'rgba(3, 21, 48, 0.16)');
  ctx.fillStyle = skyWash;
  ctx.fillRect(0, 0, DIGIMON_ISLAND_WORLD_W, DIGIMON_ISLAND_WORLD_H);

  // South Blue Portal Pier Safe Zone sanctuary ring
  ctx.save();
  ctx.translate(DIGIMON_ISLAND_SAFE_ZONE.x, DIGIMON_ISLAND_SAFE_ZONE.y);
  const safeAura = ctx.createRadialGradient(
    0,
    0,
    24,
    0,
    0,
    DIGIMON_ISLAND_SAFE_ZONE.radius
  );
  safeAura.addColorStop(0, 'rgba(56, 232, 255, 0.16)');
  safeAura.addColorStop(0.75, 'rgba(56, 232, 255, 0.05)');
  safeAura.addColorStop(1, 'rgba(56, 232, 255, 0)');
  ctx.fillStyle = safeAura;
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    DIGIMON_ISLAND_SAFE_ZONE.radius,
    DIGIMON_ISLAND_SAFE_ZONE.radius * 0.44,
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
    DIGIMON_ISLAND_SAFE_ZONE.radius - 6,
    (DIGIMON_ISLAND_SAFE_ZONE.radius - 6) * 0.42,
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
 * High-DPI offscreen terrain layer for Ilha dos Digimons with contrast-adaptive sharpening.
 */
export function buildDigimonIslandStaticLayer(): HTMLCanvasElement {
  const pixelW = Math.round(DIGIMON_ISLAND_WORLD_W * MAP_HIDPI_SCALE);
  const pixelH = Math.round(DIGIMON_ISLAND_WORLD_H * MAP_HIDPI_SCALE);
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
  img.src = DIGIMON_ISLAND_IMAGE_URL;
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
    paintDigimonIslandStaticEnhancements(ctx);
    ctx.restore();
  };

  return canvas;
}

/**
 * Living 2.5D environmental animations layered smoothly over Ilha dos Digimons:
 * - North Crystal Citadel sapphire beacon pulse
 * - South Blue Portal Pier glow, highlight ring & rising data motes
 * - Central Angel Statue golden-cyan harmonic aura
 * - West Purple Crystal Crater amethyst glow & rising wisps
 * - East Magma Gate fiery embers & pulsing heat glow
 * - SE Tech Beacon Harbor pulse + cascading waterfall mist & coastal glints
 */
export function drawDigimonIslandGroundAnimations(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  nearPortal: boolean
): void {
  const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  ctx.save();

  // 1. North Crystal Citadel spire pulse
  const citadelPulse = 0.22 + Math.sin(safeElapsed * 2.6) * 0.1;
  ctx.fillStyle = `rgba(56, 232, 255, ${citadelPulse.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(1202, 240, 38, 62, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. South Blue Portal Pier glow + rising cyan motes
  const pulse = 1 + Math.sin(safeElapsed * 3.4) * 0.08;
  const portalGlow = ctx.createRadialGradient(
    DIGIMON_ISLAND_RETURN_PORTAL.x,
    DIGIMON_ISLAND_RETURN_PORTAL.y - 6,
    10,
    DIGIMON_ISLAND_RETURN_PORTAL.x,
    DIGIMON_ISLAND_RETURN_PORTAL.y - 6,
    114 * pulse
  );
  portalGlow.addColorStop(
    0,
    nearPortal ? 'rgba(254, 240, 138, 0.52)' : 'rgba(56, 232, 255, 0.46)'
  );
  portalGlow.addColorStop(0.55, 'rgba(14, 165, 233, 0.18)');
  portalGlow.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = portalGlow;
  ctx.beginPath();
  ctx.ellipse(
    DIGIMON_ISLAND_RETURN_PORTAL.x,
    DIGIMON_ISLAND_RETURN_PORTAL.y,
    106 * pulse,
    42 * pulse,
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
      DIGIMON_ISLAND_RETURN_PORTAL.x,
      DIGIMON_ISLAND_RETURN_PORTAL.y,
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
      DIGIMON_ISLAND_RETURN_PORTAL.x + Math.sin(safeElapsed * 2.1 + i * 1.4) * 42;
    const my = DIGIMON_ISLAND_RETURN_PORTAL.y + 8 - phase * 165;
    const alpha = Math.sin(phase * Math.PI) * 0.72;
    ctx.fillStyle = `rgba(165, 243, 252, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Central Angel Statue Sanctuary harmonic ring
  const plazaPulse = 0.96 + Math.sin(safeElapsed * 2.2) * 0.04;
  ctx.strokeStyle = `rgba(253, 224, 71, ${(0.24 + Math.sin(safeElapsed * 2.4) * 0.1).toFixed(3)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(1192, 682, 98 * plazaPulse, 36 * plazaPulse, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 4. West Purple Crystal Crater amethyst aura & wisps
  const cavePulse = 1 + Math.sin(safeElapsed * 3.1) * 0.12;
  const caveGlow = ctx.createRadialGradient(418, 665, 8, 418, 665, 90 * cavePulse);
  caveGlow.addColorStop(0, 'rgba(192, 132, 252, 0.44)');
  caveGlow.addColorStop(0.55, 'rgba(147, 51, 234, 0.18)');
  caveGlow.addColorStop(1, 'rgba(147, 51, 234, 0)');
  ctx.fillStyle = caveGlow;
  ctx.beginPath();
  ctx.ellipse(418, 665, 84 * cavePulse, 48 * cavePulse, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 6; i++) {
    const phase = (safeElapsed * 0.44 + i * 0.17) % 1;
    const wx = 418 + Math.sin(safeElapsed * 1.7 + i * 2.1) * 40;
    const wy = 700 - phase * 105;
    const alpha = Math.sin(phase * Math.PI) * 0.62;
    ctx.fillStyle = `rgba(216, 180, 254, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(wx, wy, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. East Magma Gate fiery glow & rising embers
  const magmaPulse = 1 + Math.sin(safeElapsed * 3.4) * 0.11;
  const magmaGlow = ctx.createRadialGradient(1835, 675, 10, 1835, 675, 96 * magmaPulse);
  magmaGlow.addColorStop(0, 'rgba(251, 146, 60, 0.42)');
  magmaGlow.addColorStop(0.55, 'rgba(239, 68, 68, 0.18)');
  magmaGlow.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = magmaGlow;
  ctx.beginPath();
  ctx.ellipse(1835, 675, 88 * magmaPulse, 52 * magmaPulse, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 6; i++) {
    const phase = (safeElapsed * 0.5 + i * 0.165) % 1;
    const ex = 1835 + Math.sin(safeElapsed * 2.2 + i * 1.9) * 46;
    const ey = 715 - phase * 115;
    const alpha = Math.sin(phase * Math.PI) * 0.68;
    ctx.fillStyle = `rgba(253, 186, 116, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. SE Tech Harbor beacon shimmer
  const seGlowAlpha = 0.24 + Math.sin(safeElapsed * 2.9) * 0.1;
  ctx.fillStyle = `rgba(56, 232, 255, ${seGlowAlpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(1985, 1070, 56, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // 7. Animated Waterfall Mist & Ripples across the island's grand cascades
  const waterfalls = [
    { x: 785, y: 695, rx: 44, ry: 16 }, // West-central upper cascade
    { x: 1175, y: 565, rx: 56, ry: 18 }, // Citadel grand twin waterfall plunge
    { x: 1515, y: 660, rx: 38, ry: 14 }, // East-central cascade
    { x: 645, y: 890, rx: 36, ry: 13 }, // SW village cascade
  ];
  for (let f = 0; f < waterfalls.length; f++) {
    const wf = waterfalls[f];
    const wave = (safeElapsed * 1.55 + f * 0.24) % 1;
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

  // 8. Sparkling turquoise ocean sunlight glints & sky-island motes
  const oceanGlints: ReadonlyArray<readonly [number, number, string]> = [
    [680, 1225, '165, 243, 252'],
    [1020, 1265, '224, 249, 255'],
    [1520, 1245, '125, 211, 252'],
    [2060, 1135, '186, 230, 253'],
    [245, 965, '125, 211, 252'],
    [430, 685, '216, 180, 254'],
    [1835, 705, '253, 186, 116'],
    [1190, 465, '165, 243, 252'],
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
 * Depth-sorted dynamic actors on Ilha dos Digimons (only entities with real sprites render in-world).
 */
export function buildDigimonIslandDepthProps(): HuntingDepthDrawable[] {
  return [];
}
