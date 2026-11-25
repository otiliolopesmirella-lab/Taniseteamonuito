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

export const VIRTUAL_WORLD_MAP_ID = 'virtual-world' as const;

/**
 * Exact 16:9 world dimensions matching the Mundo Virtual artwork,
 * keeping identical scale, HiDPI sharpness, and 2.5D navigation to all other maps.
 */
export const VIRTUAL_WORLD_WORLD_W = 2400;
export const VIRTUAL_WORLD_WORLD_H = 1350;

export const VIRTUAL_WORLD_IMAGE_URL =
  '/assets/aistudio/file_000000006760820eae35d3a903524384_35690c7a.webp';
export const VIRTUAL_WORLD_BANNER_URL = VIRTUAL_WORLD_IMAGE_URL;

/**
 * Player arrives on the South-Center Holographic Circular Platform facing north
 * along the luminous main bridge toward the Central Virtual Citadel.
 */
export const VIRTUAL_WORLD_SPAWN_POINT = {
  x: 1195,
  y: 1045,
  facingDir: 'N' as const,
};

/**
 * Luminous cyan holographic circle at the South Platform returning to DATS Center.
 */
export const VIRTUAL_WORLD_RETURN_PORTAL = {
  x: 1195,
  y: 1085,
  radius: 92,
} as const;

/**
 * Safe Sanctuary around the South Holographic Teleport Pad:
 * Partner never initiates combat here and HP/DS recover naturally.
 */
export const VIRTUAL_WORLD_SAFE_ZONE = {
  x: 1195,
  y: 1075,
  radius: 175,
  label: 'Plataforma do Portal Virtual',
} as const;

export const VIRTUAL_WORLD_EXPLORATION_ZONES: readonly HuntingExplorationZone[] =
  [
    {
      id: 'vw-south-platform',
      name: 'Plataforma do Portal Virtual',
      subtitle: 'Zona Segura · Portal de Retorno DATS',
      x: 1195,
      y: 1075,
      radius: 190,
    },
    {
      id: 'vw-violet-grove',
      name: 'Bosque Violeta de Dados',
      subtitle: 'Território dos HiAndromon (Nv. 70–71)',
      x: 660,
      y: 940,
      radius: 260,
      speciesLabel: 'HiAndromon',
    },
    {
      id: 'vw-west-circuit',
      name: 'Terraço do Circuito Oeste',
      subtitle: 'Território dos SaberLeomon (Nv. 72–73)',
      x: 395,
      y: 745,
      radius: 255,
      speciesLabel: 'SaberLeomon',
    },
    {
      id: 'vw-east-sanctuary',
      name: 'Santuário da Cascata de Dados',
      subtitle: 'Território dos HerculesKabuterimon (Nv. 74–75)',
      x: 1945,
      y: 650,
      radius: 270,
      speciesLabel: 'HerculesKabuterimon',
    },
    {
      id: 'vw-crystal-gate',
      name: 'Ilha do Portal Cristalino',
      subtitle: 'Território dos MetalGarurumon (Nv. 76–77)',
      x: 1850,
      y: 950,
      radius: 280,
      speciesLabel: 'MetalGarurumon',
    },
    {
      id: 'vw-central-core',
      name: 'Núcleo da Cidadela Virtual',
      subtitle: 'Território dos WarGreymon (Nv. 78–80)',
      x: 1200,
      y: 610,
      radius: 340,
      speciesLabel: 'WarGreymon',
    },
  ] as const;

export const VIRTUAL_WORLD_INTERACTION_POINTS: readonly DatsInteractionPoint[] =
  [
    {
      id: 'vw-central-spire',
      kind: 'main-entrance',
      title: 'Torre do Núcleo Virtual',
      badge: 'Núcleo',
      description:
        'A torre central que sustenta o feixe de energia orbital do Mundo Virtual. WarGreymon (Nv. 78–80) guardam o anel superior da cidadela.',
      futureModule: 'Núcleo Central do Mundo Virtual e Raids Supremos',
      x: 1200,
      y: 555,
      radius: 96,
      accentColor: '#38bdf8',
    },
    {
      id: 'vw-violet-tree-shrine',
      kind: 'tamer-terminal',
      title: 'Árvore Holográfica Violeta',
      badge: 'Bosque',
      description:
        'Árvore cristalina alimentada por fluxos de dados no setor sudoeste. HiAndromon (Nv. 70–71) patrulham as pontes ao redor da plataforma.',
      futureModule: 'Terminal do Bosque de Dados',
      x: 635,
      y: 895,
      radius: 90,
      accentColor: '#e879f9',
    },
    {
      id: 'vw-west-relay-pad',
      kind: 'tamer-terminal',
      title: 'Relé do Circuito Oeste',
      badge: 'Circuito',
      description:
        'Anel de transmissão elevado sob pilares cibernéticos no flanco oeste. SaberLeomon (Nv. 72–73) vigiam a ilha em alta velocidade.',
      futureModule: 'Estação de Relé Cibernético',
      x: 365,
      y: 785,
      radius: 88,
      accentColor: '#22d3ee',
    },
    {
      id: 'vw-east-data-falls',
      kind: 'info-npc',
      title: 'Santuário da Cascata de Dados',
      badge: 'Santuário',
      description:
        'Câmara oriental suspensa sobre cascatas luminosas de código puro. HerculesKabuterimon (Nv. 74–75) sobrevoam o círculo de energia.',
      futureModule: 'Câmara das Cascatas Virtuais',
      x: 1995,
      y: 645,
      radius: 90,
      accentColor: '#60a5fa',
    },
    {
      id: 'vw-se-crystal-monolith',
      kind: 'tamer-terminal',
      title: 'Monólito do Portal Cristalino',
      badge: 'Portal',
      description:
        'Arco de cristal azul-ciano no arquipélago sudeste ao lado da árvore de safira. MetalGarurumon (Nv. 76–77) dominam esta ilha flutuante.',
      futureModule: 'Portal Dimensional do Arquipélago',
      x: 1710,
      y: 965,
      radius: 92,
      accentColor: '#38bdf8',
    },
  ] as const;

export const VIRTUAL_WORLD_FRIENDLY_NPCS: readonly FriendlyFieldNpc[] =
  [] as const;

/**
 * Snag-free collision geometry aligned to the 2400x1350 Mundo Virtual artwork:
 * - Keeps the South Holographic Pad, all glowing bridges, SW Violet Tree Island,
 *   Mid-West Circuit Terrace, Central Core Citadel Ring, Mid-East Data Waterfall Sanctuary,
 *   and SE Crystal Portal Island 100% open and walkable!
 * - Bounds the upper orbital sky horizon, distant floating spires, and outer data abyss cleanly.
 */
export const VIRTUAL_WORLD_COLLIDERS: readonly DatsCollider[] = [
  // 1. Northern Orbital Sky Horizon & Distant Floating Spires
  { id: 'vw-north-sky-nw', x: 0, y: 0, w: 860, h: 455, kind: 'wall' },
  { id: 'vw-north-citadel-spire', x: 860, y: 0, w: 680, h: 445, kind: 'building' },
  { id: 'vw-north-sky-ne', x: 1540, y: 0, w: 860, h: 465, kind: 'wall' },

  // 2. Outer Data Abyss Borders (West, East & South)
  { id: 'vw-west-abyss-mid', x: 0, y: 455, w: 145, h: 465, kind: 'wall' },
  { id: 'vw-west-abyss-bot', x: 0, y: 920, w: 280, h: 430, kind: 'wall' },
  { id: 'vw-east-abyss-mid', x: 2255, y: 465, w: 145, h: 465, kind: 'wall' },
  { id: 'vw-east-abyss-bot', x: 2210, y: 930, w: 190, h: 420, kind: 'wall' },
  { id: 'vw-south-abyss-left', x: 280, y: 1135, w: 680, h: 215, kind: 'wall' },
  { id: 'vw-south-abyss-right', x: 1440, y: 1145, w: 770, h: 205, kind: 'wall' },
  { id: 'vw-south-pad-tip', x: 960, y: 1270, w: 480, h: 80, kind: 'wall' },
] as const;

export function ensureSafeVirtualWorldSpawn(
  x: number,
  y: number
): { x: number; y: number } {
  if (
    x < 165 ||
    x > VIRTUAL_WORLD_WORLD_W - 165 ||
    y < 465 ||
    y > VIRTUAL_WORLD_WORLD_H - 95
  ) {
    return {
      x: VIRTUAL_WORLD_SPAWN_POINT.x,
      y: VIRTUAL_WORLD_SPAWN_POINT.y,
    };
  }
  for (const col of VIRTUAL_WORLD_COLLIDERS) {
    if (
      x >= col.x - 18 &&
      x <= col.x + col.w + 18 &&
      y >= col.y - 18 &&
      y <= col.y + col.h + 18
    ) {
      return {
        x: VIRTUAL_WORLD_SPAWN_POINT.x,
        y: VIRTUAL_WORLD_SPAWN_POINT.y,
      };
    }
  }
  return { x, y };
}

/**
 * 2.5D perspective depth scaling calibrated for Mundo Virtual.
 */
export function getVirtualWorldPerspectiveScale(worldY: number): number {
  const t = Math.max(0, Math.min(1, (worldY - 455) / (1220 - 455)));
  return 0.84 + t * 0.22;
}

export function isPointInVirtualWorldSafeZone(x: number, y: number): boolean {
  return (
    Math.hypot(x - VIRTUAL_WORLD_SAFE_ZONE.x, y - VIRTUAL_WORLD_SAFE_ZONE.y) <=
    VIRTUAL_WORLD_SAFE_ZONE.radius
  );
}

export function getVirtualWorldZoneAtPoint(
  x: number,
  y: number
): HuntingExplorationZone | null {
  let closest: HuntingExplorationZone | null = null;
  let bestDist = Infinity;
  for (const zone of VIRTUAL_WORLD_EXPLORATION_ZONES) {
    const d = Math.hypot(x - zone.x, y - zone.y);
    if (d <= zone.radius && d < bestDist) {
      bestDist = d;
      closest = zone;
    }
  }
  return closest;
}

// ============================================================================
// 5 VIRTUAL WORLD MEGA WILD DIGIMON TERRITORIES (LV. 70–80 · 35 MOBS TOTAL)
// HiAndromon (Drimogemon), SaberLeomon (Elecmon), HerculesKabuterimon (Tentomon),
// MetalGarurumon (Gabumon) & WarGreymon (Agumon Clássico)
// Every single spawn coordinate sits cleanly clear of all colliders and safe zone!
// ============================================================================

export const VIRTUAL_WORLD_HABITAT_PACKS: readonly HuntingHabitatPackSpec[] = [
  {
    species: 'hiandromon',
    displayName: 'HiAndromon',
    habitatName: 'Bosque Violeta de Dados',
    zoneId: 'vw-violet-grove',
    levelMin: 70,
    levelMax: 71,
    baseHp: 102000,
    hpPerLevel: 4800,
    baseExp: 23500,
    expPerLevel: 1250,
    bodyColor: '#475569',
    accentColor: '#38bdf8',
    eyeColor: '#ef4444',
    spawns: [
      [455, 920],
      [555, 865],
      [645, 955],
      [735, 880],
      [815, 950],
      [560, 1015],
      [725, 1020],
    ],
  },
  {
    species: 'saberleomon',
    displayName: 'SaberLeomon',
    habitatName: 'Terraço do Circuito Oeste',
    zoneId: 'vw-west-circuit',
    levelMin: 72,
    levelMax: 73,
    baseHp: 112500,
    hpPerLevel: 5200,
    baseExp: 26200,
    expPerLevel: 1380,
    bodyColor: '#d97706',
    accentColor: '#fde047',
    eyeColor: '#22c55e',
    spawns: [
      [235, 760],
      [315, 695],
      [395, 785],
      [485, 720],
      [575, 675],
      [345, 845],
      [510, 795],
    ],
  },
  {
    species: 'herculeskabuterimon',
    displayName: 'HerculesKabuterimon',
    habitatName: 'Santuário da Cascata de Dados',
    zoneId: 'vw-east-sanctuary',
    levelMin: 74,
    levelMax: 75,
    baseHp: 124000,
    hpPerLevel: 5600,
    baseExp: 29200,
    expPerLevel: 1520,
    bodyColor: '#eab308',
    accentColor: '#fef08a',
    eyeColor: '#38bdf8',
    spawns: [
      [1745, 635],
      [1845, 585],
      [1945, 665],
      [2045, 595],
      [2145, 645],
      [1865, 725],
      [2065, 720],
    ],
  },
  {
    species: 'metalgarurumon',
    displayName: 'MetalGarurumon',
    habitatName: 'Ilha do Portal Cristalino',
    zoneId: 'vw-crystal-gate',
    levelMin: 76,
    levelMax: 77,
    baseHp: 136500,
    hpPerLevel: 6100,
    baseExp: 32500,
    expPerLevel: 1680,
    bodyColor: '#2563eb',
    accentColor: '#38bdf8',
    eyeColor: '#facc15',
    spawns: [
      [1565, 920],
      [1665, 865],
      [1765, 965],
      [1875, 880],
      [1985, 945],
      [2085, 895],
      [1845, 1045],
    ],
  },
  {
    species: 'wargreymon',
    displayName: 'WarGreymon',
    habitatName: 'Núcleo da Cidadela Virtual',
    zoneId: 'vw-central-core',
    levelMin: 78,
    levelMax: 80,
    baseHp: 150000,
    hpPerLevel: 6800,
    baseExp: 36200,
    expPerLevel: 1900,
    bodyColor: '#f97316',
    accentColor: '#facc15',
    eyeColor: '#22c55e',
    spawns: [
      [885, 595],
      [985, 540],
      [1085, 665],
      [1200, 625],
      [1325, 665],
      [1425, 545],
      [1525, 600],
    ],
  },
] as const;

const VIRTUAL_WORLD_TEMPLATES: readonly EnemyMonsterTemplate[] =
  VIRTUAL_WORLD_HABITAT_PACKS.flatMap((pack) => {
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

export function createInitialVirtualWorldMonsters(): EnemyMonsterInstance[] {
  return VIRTUAL_WORLD_TEMPLATES.map((tpl, idx) => ({
    ...tpl,
    id: `vw-${idx}-${tpl.species}`,
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
 * Static subtle vector accents layered cleanly over the decoded Mundo Virtual artwork:
 * - Luminous cyan-cobalt cyber atmosphere wash
 * - Holographic cyan sanctuary ring around the South Return Platform
 * ZERO text or labels painted on the ground!
 */
function paintVirtualWorldStaticEnhancements(
  ctx: CanvasRenderingContext2D
): void {
  ctx.save();

  const cyberWash = ctx.createRadialGradient(1200, 320, 140, 1200, 680, 1520);
  cyberWash.addColorStop(0, 'rgba(56, 189, 248, 0.11)');
  cyberWash.addColorStop(0.55, 'rgba(37, 99, 235, 0.05)');
  cyberWash.addColorStop(1, 'rgba(4, 12, 36, 0.16)');
  ctx.fillStyle = cyberWash;
  ctx.fillRect(0, 0, VIRTUAL_WORLD_WORLD_W, VIRTUAL_WORLD_WORLD_H);

  // South Holographic Platform Safe Zone sanctuary ring
  ctx.save();
  ctx.translate(VIRTUAL_WORLD_SAFE_ZONE.x, VIRTUAL_WORLD_SAFE_ZONE.y);
  const safeAura = ctx.createRadialGradient(
    0,
    0,
    24,
    0,
    0,
    VIRTUAL_WORLD_SAFE_ZONE.radius
  );
  safeAura.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
  safeAura.addColorStop(0.75, 'rgba(14, 165, 233, 0.07)');
  safeAura.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = safeAura;
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    VIRTUAL_WORLD_SAFE_ZONE.radius,
    VIRTUAL_WORLD_SAFE_ZONE.radius * 0.44,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.strokeStyle = 'rgba(125, 211, 252, 0.58)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    VIRTUAL_WORLD_SAFE_ZONE.radius - 6,
    (VIRTUAL_WORLD_SAFE_ZONE.radius - 6) * 0.42,
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
 * High-DPI offscreen terrain layer for Mundo Virtual with contrast-adaptive sharpening.
 */
export function buildVirtualWorldStaticLayer(): HTMLCanvasElement {
  const pixelW = Math.round(VIRTUAL_WORLD_WORLD_W * MAP_HIDPI_SCALE);
  const pixelH = Math.round(VIRTUAL_WORLD_WORLD_H * MAP_HIDPI_SCALE);
  const canvas = document.createElement('canvas');
  canvas.width = pixelW;
  canvas.height = pixelH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const fallbackGrad = ctx.createLinearGradient(0, 0, 0, pixelH);
  fallbackGrad.addColorStop(0, '#071b48');
  fallbackGrad.addColorStop(0.45, '#0c2f6e');
  fallbackGrad.addColorStop(1, '#04102b');
  ctx.fillStyle = fallbackGrad;
  ctx.fillRect(0, 0, pixelW, pixelH);

  const img = new Image();
  img.decoding = 'async';
  img.src = VIRTUAL_WORLD_IMAGE_URL;
  img.onload = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pixelW, pixelH);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = 'contrast(1.06) saturate(1.08) brightness(1.02)';
    ctx.drawImage(img, 0, 0, pixelW, pixelH);
    ctx.restore();

    applyContrastAdaptiveSharpen(ctx, pixelW, pixelH, 1.08);

    ctx.save();
    ctx.scale(MAP_HIDPI_SCALE, MAP_HIDPI_SCALE);
    paintVirtualWorldStaticEnhancements(ctx);
    ctx.restore();
  };

  return canvas;
}

/**
 * Living 2.5D environmental animations layered smoothly over Mundo Virtual:
 * - Central Virtual Citadel orbital sky beam & core energy pulse
 * - South Holographic Return Portal glow, highlight ring & rising cyan data motes
 * - West Circuit Relay & SE Crystal Gate holographic rings
 * - Cascading cyan data waterfalls mist & floating holographic pixel glints
 */
export function drawVirtualWorldGroundAnimations(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  nearPortal: boolean
): void {
  const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  ctx.save();

  // 1. Central Virtual Citadel orbital sky beam & core pulse
  const corePulse = 0.22 + Math.sin(safeElapsed * 2.6) * 0.1;
  const beamGrad = ctx.createLinearGradient(1200, 0, 1200, 560);
  beamGrad.addColorStop(0, `rgba(125, 211, 252, ${(corePulse * 0.85).toFixed(3)})`);
  beamGrad.addColorStop(0.55, `rgba(56, 189, 248, ${(corePulse * 0.55).toFixed(3)})`);
  beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = beamGrad;
  ctx.fillRect(1182, 0, 36, 560);

  ctx.fillStyle = `rgba(125, 211, 252, ${(corePulse * 0.9).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(1200, 555, 68, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. South Holographic Return Portal glow + rising cyber motes
  const pulse = 1 + Math.sin(safeElapsed * 3.4) * 0.08;
  const portalGlow = ctx.createRadialGradient(
    VIRTUAL_WORLD_RETURN_PORTAL.x,
    VIRTUAL_WORLD_RETURN_PORTAL.y - 6,
    10,
    VIRTUAL_WORLD_RETURN_PORTAL.x,
    VIRTUAL_WORLD_RETURN_PORTAL.y - 6,
    118 * pulse
  );
  portalGlow.addColorStop(
    0,
    nearPortal ? 'rgba(254, 240, 138, 0.56)' : 'rgba(125, 211, 252, 0.5)'
  );
  portalGlow.addColorStop(0.55, 'rgba(14, 165, 233, 0.22)');
  portalGlow.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = portalGlow;
  ctx.beginPath();
  ctx.ellipse(
    VIRTUAL_WORLD_RETURN_PORTAL.x,
    VIRTUAL_WORLD_RETURN_PORTAL.y,
    108 * pulse,
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
      VIRTUAL_WORLD_RETURN_PORTAL.x,
      VIRTUAL_WORLD_RETURN_PORTAL.y,
      74 * pulse,
      28 * pulse,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  for (let i = 0; i < 8; i++) {
    const phase = (safeElapsed * 0.56 + i * 0.125) % 1;
    const mx =
      VIRTUAL_WORLD_RETURN_PORTAL.x +
      Math.sin(safeElapsed * 2.2 + i * 1.4) * 44;
    const my = VIRTUAL_WORLD_RETURN_PORTAL.y + 8 - phase * 168;
    const alpha = Math.sin(phase * Math.PI) * 0.78;
    ctx.fillStyle = `rgba(186, 230, 253, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. West Circuit Relay Pad & SE Crystal Portal shimmer rings
  const relayPads: ReadonlyArray<{ x: number; y: number; rgb: string }> = [
    { x: 365, y: 790, rgb: '56, 189, 248' },
    { x: 1710, y: 970, rgb: '34, 211, 238' },
    { x: 2015, y: 895, rgb: '96, 165, 250' },
    { x: 1995, y: 645, rgb: '56, 189, 248' },
    { x: 640, y: 910, rgb: '232, 121, 249' },
  ];
  for (let p = 0; p < relayPads.length; p++) {
    const pad = relayPads[p];
    const pPulse = 1 + Math.sin(safeElapsed * 3.0 + p * 1.1) * 0.09;
    const padGrad = ctx.createRadialGradient(
      pad.x,
      pad.y,
      6,
      pad.x,
      pad.y,
      74 * pPulse
    );
    padGrad.addColorStop(0, `rgba(${pad.rgb}, 0.36)`);
    padGrad.addColorStop(0.6, `rgba(${pad.rgb}, 0.12)`);
    padGrad.addColorStop(1, `rgba(${pad.rgb}, 0)`);
    ctx.fillStyle = padGrad;
    ctx.beginPath();
    ctx.ellipse(pad.x, pad.y, 70 * pPulse, 30 * pPulse, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Animated Cyan Data Waterfall Mist across floating islands
  const waterfalls = [
    { x: 545, y: 1120, rx: 46, ry: 15 },
    { x: 1890, y: 745, rx: 44, ry: 15 },
    { x: 1625, y: 1130, rx: 40, ry: 14 },
  ];
  for (let f = 0; f < waterfalls.length; f++) {
    const wf = waterfalls[f];
    const wave = (safeElapsed * 1.6 + f * 0.28) % 1;
    const mistAlpha = 0.24 + Math.sin(safeElapsed * 3.5 + f * 1.3) * 0.08;
    ctx.fillStyle = `rgba(186, 230, 253, ${mistAlpha.toFixed(3)})`;
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

    ctx.strokeStyle = `rgba(125, 211, 252, ${((1 - wave) * 0.44).toFixed(3)})`;
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

  // 5. Floating cyber data motes & neon cube glints across the archipelago
  const cyberGlints: ReadonlyArray<readonly [number, number, string]> = [
    [590, 860, '232, 121, 249'],
    [390, 740, '56, 189, 248'],
    [1060, 620, '125, 211, 252'],
    [1360, 615, '56, 189, 248'],
    [1955, 635, '96, 165, 250'],
    [1770, 955, '34, 211, 238'],
    [2035, 890, '129, 140, 248'],
  ];
  for (let i = 0; i < cyberGlints.length; i++) {
    const [fx, fy, rgb] = cyberGlints[i];
    const dx = Math.sin(safeElapsed * 1.18 + i * 2.1) * 26;
    const dy =
      Math.cos(safeElapsed * 0.88 + i * 1.6) * 10 -
      ((safeElapsed * 6 + i * 11) % 22);
    const alpha = 0.3 + Math.sin(safeElapsed * 2.9 + i * 1.3) * 0.18;
    ctx.fillStyle = `rgba(${rgb}, ${Math.max(0.08, alpha).toFixed(3)})`;
    ctx.fillRect(fx + dx - 2.2, fy + dy - 2.2, 4.4, 4.4);
  }

  ctx.restore();
}

/**
 * Depth-sorted dynamic actors on Mundo Virtual (only entities with real sprites render in-world).
 */
export function buildVirtualWorldDepthProps(): HuntingDepthDrawable[] {
  return [];
}
