import type { DatsCollider, DatsInteractionPoint } from './datsCenterMap';
import type { FixedWorldNpc } from '../sprites/npcSprites';
import { drawWildDigimonSprite } from '../sprites/wildDigimonSprites';
import {
  applyContrastAdaptiveSharpen,
  MAP_HIDPI_SCALE,
} from '../utils/canvasSharpen';

export const HUNTING_MAP_ID = 'hunting-plains' as const;

/**
 * Exact 16:9 world dimensions matching the 1672x941 Planície Digital reference artwork.
 * Gives spacious MMORPG exploration with smooth camera tracking on desktop & mobile.
 */
export const HUNTING_WORLD_W = 2400;
export const HUNTING_WORLD_H = 1350;

export const HUNTING_MAP_IMAGE_URL = '/assets/map/planicie_digital_world.webp';
export const HUNTING_MAP_BANNER_URL = '/assets/map/planicie_digital_banner.webp';

/**
 * Player spawns cleanly at the foot of the Central Digital Spire white staircase.
 */
export const HUNTING_SPAWN_POINT = {
  x: 1200,
  y: 525,
  facingDir: 'S' as const,
};

/**
 * Central Digital Portal returning to DATS Center (top of the central spire stairs).
 */
export const HUNTING_RETURN_PORTAL = {
  x: 1200,
  y: 458,
  radius: 76,
} as const;

/**
 * Safe Sanctuary around the Central Digital Spire & stairs:
 * Partner NEVER initiates combat inside this protected zone and HP/DS recover naturally.
 */
export const HUNTING_SAFE_ZONE = {
  x: 1200,
  y: 495,
  radius: 165,
  label: 'Área Central Digital',
} as const;

export interface HuntingExplorationZone {
  id: string;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  radius: number;
  speciesLabel?: string;
}

/**
 * Explorable sub-regions of Planície Digital matching every iconic landmark
 * and each dedicated Rookie wild Digimon territory (dropable Mercenary DigiEggs).
 */
export const HUNTING_EXPLORATION_ZONES: readonly HuntingExplorationZone[] = [
  {
    id: 'zone-central',
    name: 'Área Central Digital',
    subtitle: 'Zona Segura · Torre do Portal',
    x: 1200,
    y: 495,
    radius: 175,
  },
  {
    id: 'zone-forest',
    name: 'Floresta Digital',
    subtitle: 'Território dos Drimogemon (Nv. 1–2)',
    x: 565,
    y: 525,
    radius: 215,
    speciesLabel: 'Drimogemon',
  },
  {
    id: 'zone-meadow',
    name: 'Pradaria Leste',
    subtitle: 'Território dos Gotsumon (Nv. 3–4)',
    x: 1515,
    y: 565,
    radius: 175,
    speciesLabel: 'Gotsumon',
  },
  {
    id: 'zone-ruins',
    name: 'Ruínas Antigas',
    subtitle: 'Território dos Hawkmon (Nv. 7–8)',
    x: 475,
    y: 830,
    radius: 205,
    speciesLabel: 'Hawkmon',
  },
  {
    id: 'zone-waterfall',
    name: 'Cachoeira e Ponte',
    subtitle: 'Travessia do Rio Digital',
    x: 1190,
    y: 925,
    radius: 150,
  },
  {
    id: 'zone-lake',
    name: 'Margem do Lago Digital',
    subtitle: 'Território dos Kiwimon (Nv. 5–6)',
    x: 1720,
    y: 885,
    radius: 245,
    speciesLabel: 'Kiwimon',
  },
  {
    id: 'zone-cave',
    name: 'Caverna Digital',
    subtitle: 'Território dos Monodramon (Nv. 9–10)',
    x: 1875,
    y: 465,
    radius: 235,
    speciesLabel: 'Monodramon',
  },
] as const;

/**
 * Interactive landmarks across Planície Digital (no text painted on the ground —
 * surfaced cleanly through the HUD proximity button when the player approaches).
 */
export const HUNTING_INTERACTION_POINTS: readonly DatsInteractionPoint[] = [
  {
    id: 'plains-ruins-altar',
    kind: 'tamer-terminal',
    title: 'Altar das Ruínas Antigas',
    badge: 'Ruínas',
    description:
      'Um círculo de monólitos digitais antigos que pulsa com dados residuais. O bando de Hawkmon vigia todo o pátio ao redor e dropa DigiEgg de Hawkmon.',
    futureModule: 'Missões de Exploração das Ruínas e Eventos Regionais',
    x: 445,
    y: 785,
    radius: 78,
    accentColor: '#38e8ff',
  },
  {
    id: 'plains-cave-entrance',
    kind: 'main-entrance',
    title: 'Entrada da Caverna Digital',
    badge: 'Caverna',
    description:
      'Passagem esculpida na montanha nordeste irradiando energia azul intensa. Guardada por um bando de Monodramon ferozes.',
    futureModule: 'Instância da Caverna Digital e Desafios de Chefe',
    x: 1815,
    y: 375,
    radius: 80,
    accentColor: '#60a5fa',
  },
  {
    id: 'plains-lake-pavilion',
    kind: 'info-npc',
    title: 'Píer e Pavilhão do Lago',
    badge: 'Lago',
    description:
      'Mirante às margens do Lago Digital com vista para a pequena ilha central e o território dos Kiwimon na beira da água.',
    futureModule: 'Missões Secundárias e Coleta de Dados no Lago',
    x: 1995,
    y: 780,
    radius: 86,
    accentColor: '#34d399',
  },
] as const;

export type WildMonsterSpecies =
  | 'drimogemon'
  | 'gotsumon'
  | 'kiwimon'
  | 'hawkmon'
  | 'monodramon'
  | 'impmon'
  | 'renamon'
  | 'guilmon'
  | 'garurumon'
  | 'greymon'
  | 'kuwagamon'
  | 'meramon'
  | 'digmon'
  | 'kabuterimon'
  | 'chrysalimon'
  | 'veedramon'
  | 'iceleomon'
  | 'insekimon'
  | 'skullmeramon'
  | 'cyberdramon'
  | 'megalogrowlmon'
  | 'metalgreymon'
  | 'giromon'
  | 'garudamon'
  | 'skullsatamon'
  | 'okuwamon'
  | 'metalgarurumon'
  | 'gryphonmon'
  | 'dukemon'
  | 'griffomon'
  | 'sakuyamon'
  | 'metaletemon'
  | 'boltmon'
  | 'grankuwagamon'
  | 'beelzemon'
  | 'diaboromon'
  | 'hiandromon'
  | 'saberleomon'
  | 'herculeskabuterimon'
  | 'wargreymon';

export interface EnemyMonsterTemplate {
  species: WildMonsterSpecies;
  name: string;
  level: number;
  maxHp: number;
  expReward: number;
  bodyColor: string;
  accentColor: string;
  eyeColor: string;
  homeX: number;
  homeY: number;
  zoneId: string;
  isBoss?: boolean;
  bossId?: string;
}

export interface EnemyMonsterInstance extends EnemyMonsterTemplate {
  id: string;
  disposition: 'enemy';
  x: number;
  y: number;
  hp: number;
  alive: boolean;
  respawnTimer: number;
  hitFlashTimer: number;
  attackAnimTimer: number;
  facingRight: boolean;
  patrolAngle: number;
  patrolTimer: number;
  aggroed?: boolean;
  aggroTimer?: number;
  counterCooldown?: number;
  bossAoeCooldown?: number;
  bossTargetUid?: string;
  bossTargetName?: string;
  bossTargetX?: number;
  bossTargetY?: number;
  bossTargetSwapRemainingSec?: number;
}

export interface FriendlyFieldNpc {
  id: string;
  disposition: 'friendly';
  name: string;
  role: string;
  x: number;
  y: number;
  dialogue: string;
  accentColor?: string;
}

export const FRIENDLY_FIELD_NPCS: readonly FriendlyFieldNpc[] = [] as const;

/**
 * Helper to open dialogue with a FriendlyFieldNpc in NpcDialogueModal cleanly.
 */
export function fieldNpcToDialogueModel(npc: FriendlyFieldNpc): FixedWorldNpc {
  return {
    id: npc.id,
    name: npc.name,
    title: npc.role,
    spriteUrl: '/assets/aistudio/file_0000000053c8820eae813279e80351a1_7e409ad6.webp',
    x: npc.x,
    y: npc.y,
    targetHeight: 104,
    collisionRadius: 22,
    hitBox: {
      halfWidth: 32,
      height: 82,
    },
    initialDialogue: npc.dialogue,
  };
}

/**
 * Precise collision geometry mapped directly onto the 2400x1350 Planície Digital reference artwork:
 * - Keeps the entire floating island perimeter sealed so players never walk into sky or ocean.
 * - Seals the central waterfall gorge above & below the Wooden Bridge while keeping the bridge deck (y: 888..968) walkable!
 * - Seals the Eastern Lake water while keeping its western/southern trails & lakeside pier accessible.
 * - Seals the Central Spire pillars, Mountain rock walls, Ruins outer monoliths, and dense tree clusters.
 */
export const HUNTING_COLLIDERS: readonly DatsCollider[] = [
  // 1. Northern Sky, Horizon & Upper Cliffs (above y=345)
  { id: 'north-sky-west', x: 0, y: 0, w: 1715, h: 350, kind: 'wall' },
  { id: 'north-sky-east', x: 1895, y: 0, w: 505, h: 375, kind: 'wall' },
  { id: 'cave-arch-back', x: 1715, y: 0, w: 180, h: 332, kind: 'wall' },

  // 2. Central Digital Spire raised platform & flanking towers (leaves front stairs & approach open)
  { id: 'spire-core', x: 1030, y: 340, w: 340, h: 102, kind: 'building' },
  { id: 'spire-wing-west', x: 925, y: 350, w: 115, h: 98, kind: 'pillar' },
  { id: 'spire-wing-east', x: 1360, y: 350, w: 115, h: 98, kind: 'pillar' },

  // 3. Western Island Cliff & Ocean Perimeter
  { id: 'west-ocean-upper', x: 0, y: 350, w: 285, h: 175, kind: 'wall' },
  { id: 'west-ocean-mid', x: 0, y: 525, w: 195, h: 345, kind: 'wall' },
  { id: 'west-ocean-lower', x: 0, y: 870, w: 365, h: 480, kind: 'wall' },

  // 4. Southern Cliff, Ocean & Waterfall Drop-offs
  { id: 'south-ocean-sw', x: 365, y: 1035, w: 660, h: 315, kind: 'wall' },
  { id: 'south-ocean-center', x: 1025, y: 974, w: 415, h: 376, kind: 'wall' },
  { id: 'south-ocean-se', x: 1440, y: 1090, w: 960, h: 260, kind: 'wall' },

  // 5. Eastern Cliff & Ocean Perimeter
  { id: 'east-ocean-upper', x: 2155, y: 375, w: 245, h: 255, kind: 'wall' },
  { id: 'east-ocean-mid', x: 2195, y: 630, w: 205, h: 325, kind: 'wall' },
  { id: 'east-ocean-lower', x: 2085, y: 955, w: 315, h: 165, kind: 'wall' },

  // 6. Central Waterfall Chasm & Upper River (strictly ABOVE the walkable wooden bridge at y=888..968)
  { id: 'waterfall-gorge-west', x: 785, y: 575, w: 365, h: 306, kind: 'wall' },
  { id: 'waterfall-gorge-east', x: 1150, y: 625, w: 220, h: 256, kind: 'wall' },
  // Bridge guard rails flanking the crossing subtly
  { id: 'bridge-north-gap', x: 965, y: 860, w: 455, h: 24, kind: 'wall' },

  // 7. Eastern Sapphire Lake Water (keeps western dirt trail x<1635 & southern trail y>790 open!)
  { id: 'lake-water-main', x: 1645, y: 590, w: 465, h: 148, kind: 'wall' },
  { id: 'lake-water-south', x: 1715, y: 730, w: 270, h: 48, kind: 'wall' },

  // 8. Mountain Rock Formations framing Caverna Digital
  { id: 'cave-rock-west', x: 1585, y: 325, w: 120, h: 72, kind: 'planter' },
  { id: 'cave-rock-east', x: 1935, y: 350, w: 220, h: 95, kind: 'planter' },

  // 9. Dense Forest Tree Clusters (Northwest Floresta)
  { id: 'forest-trees-nw', x: 315, y: 365, w: 235, h: 78, kind: 'tree' },
  { id: 'forest-trees-mid', x: 240, y: 495, w: 115, h: 85, kind: 'tree' },

  // 10. Ancient Ruins Monolith Pillars (Southwest — leaves courtyard interior & approaches walkable)
  { id: 'ruins-pillar-west', x: 205, y: 695, w: 85, h: 145, kind: 'pillar' },
  { id: 'ruins-pillar-north', x: 325, y: 655, w: 92, h: 52, kind: 'pillar' },
  { id: 'ruins-pillar-east', x: 585, y: 685, w: 68, h: 108, kind: 'pillar' },

  // 11. Southern Cliff Trees & Southeast Ruins Boulders
  { id: 'south-cliff-trees', x: 645, y: 970, w: 195, h: 68, kind: 'tree' },
  { id: 'se-ruins-monolith', x: 2005, y: 875, w: 110, h: 88, kind: 'pillar' },
] as const;

/**
 * Ensures any point (such as a previously saved coordinate from an older map layout)
 * sits cleanly inside walkable Planície Digital terrain.
 */
export function ensureSafeHuntingSpawn(x: number, y: number): { x: number; y: number } {
  if (
    x < 220 ||
    x > HUNTING_WORLD_W - 220 ||
    y < 365 ||
    y > HUNTING_WORLD_H - 250
  ) {
    return { x: HUNTING_SPAWN_POINT.x, y: HUNTING_SPAWN_POINT.y };
  }
  for (const col of HUNTING_COLLIDERS) {
    if (
      x >= col.x - 18 &&
      x <= col.x + col.w + 18 &&
      y >= col.y - 18 &&
      y <= col.y + col.h + 18
    ) {
      return { x: HUNTING_SPAWN_POINT.x, y: HUNTING_SPAWN_POINT.y };
    }
  }
  return { x, y };
}

/**
 * Subtle 2.5D perspective depth scale based on world Y coordinate:
 * Characters walking deeper toward the northern Digital Spire & Cave scale down gently,
 * while characters approaching the southern foreground bridge & ruins scale up slightly.
 */
export function getHuntingPerspectiveScale(worldY: number): number {
  const t = Math.max(0, Math.min(1, (worldY - 350) / (1080 - 350)));
  return 0.85 + t * 0.21;
}

/**
 * Returns the active exploration sub-region containing (x, y), if any.
 */
export function getHuntingZoneAtPoint(
  x: number,
  y: number
): HuntingExplorationZone | null {
  let closest: HuntingExplorationZone | null = null;
  let closestDist = Infinity;
  for (const z of HUNTING_EXPLORATION_ZONES) {
    const d = Math.hypot(x - z.x, y - z.y);
    if (d <= z.radius && d < closestDist) {
      closest = z;
      closestDist = d;
    }
  }
  return closest;
}

export interface HuntingHabitatPackSpec {
  species: WildMonsterSpecies;
  displayName: string;
  habitatName: string;
  zoneId: string;
  levelMin: number;
  levelMax: number;
  baseHp: number;
  hpPerLevel: number;
  baseExp: number;
  expPerLevel: number;
  bodyColor: string;
  accentColor: string;
  eyeColor: string;
  spawns: readonly (readonly [number, number])[];
}

/**
 * Five dedicated Rookie hunting territories across Planície Digital — 7 mobs per species (35 total).
 * Each pack drops its corresponding DATA & Mercenary DigiEgg and stays cleanly clear of colliders.
 */
export const HUNTING_HABITAT_PACKS: readonly HuntingHabitatPackSpec[] = [
  {
    species: 'drimogemon',
    displayName: 'Drimogemon',
    habitatName: 'Floresta Digital (Noroeste)',
    zoneId: 'zone-forest',
    levelMin: 1,
    levelMax: 2,
    baseHp: 190,
    hpPerLevel: 45,
    baseExp: 24,
    expPerLevel: 8,
    bodyColor: '#2563eb',
    accentColor: '#facc15',
    eyeColor: '#ef4444',
    spawns: [
      [415, 488],
      [512, 474],
      [608, 486],
      [698, 478],
      [458, 566],
      [562, 558],
      [668, 562],
    ],
  },
  {
    species: 'gotsumon',
    displayName: 'Gotsumon',
    habitatName: 'Pradaria Leste (Centro-Leste)',
    zoneId: 'zone-meadow',
    levelMin: 3,
    levelMax: 4,
    baseHp: 310,
    hpPerLevel: 55,
    baseExp: 44,
    expPerLevel: 10,
    bodyColor: '#64748b',
    accentColor: '#cbd5e1',
    eyeColor: '#f59e0b',
    spawns: [
      [1428, 488],
      [1518, 474],
      [1594, 496],
      [1446, 568],
      [1536, 558],
      [1462, 654],
      [1556, 664],
    ],
  },
  {
    species: 'kiwimon',
    displayName: 'Kiwimon',
    habitatName: 'Margem do Lago (Sudeste)',
    zoneId: 'zone-lake',
    levelMin: 5,
    levelMax: 6,
    baseHp: 460,
    hpPerLevel: 70,
    baseExp: 68,
    expPerLevel: 14,
    bodyColor: '#15803d',
    accentColor: '#a3e635',
    eyeColor: '#f59e0b',
    spawns: [
      [1522, 838],
      [1636, 826],
      [1752, 834],
      [1864, 830],
      [1586, 944],
      [1718, 938],
      [1860, 938],
    ],
  },
  {
    species: 'hawkmon',
    displayName: 'Hawkmon',
    habitatName: 'Ruínas Antigas (Sudoeste)',
    zoneId: 'zone-ruins',
    levelMin: 7,
    levelMax: 8,
    baseHp: 640,
    hpPerLevel: 85,
    baseExp: 100,
    expPerLevel: 18,
    bodyColor: '#dc2626',
    accentColor: '#fef08a',
    eyeColor: '#38bdf8',
    spawns: [
      [348, 756],
      [448, 746],
      [536, 764],
      [396, 840],
      [496, 848],
      [602, 846],
      [476, 922],
    ],
  },
  {
    species: 'monodramon',
    displayName: 'Monodramon',
    habitatName: 'Caverna Digital (Nordeste)',
    zoneId: 'zone-cave',
    levelMin: 9,
    levelMax: 10,
    baseHp: 860,
    hpPerLevel: 100,
    baseExp: 142,
    expPerLevel: 24,
    bodyColor: '#7e22ce',
    accentColor: '#c084fc',
    eyeColor: '#fde047',
    spawns: [
      [1748, 412],
      [1832, 396],
      [1912, 418],
      [1716, 494],
      [1820, 486],
      [1932, 498],
      [2054, 510],
    ],
  },
] as const;

const ENEMY_TEMPLATES: readonly EnemyMonsterTemplate[] = HUNTING_HABITAT_PACKS.flatMap(
  (pack) =>
    pack.spawns.map(([homeX, homeY], memberIdx) => {
      const level = memberIdx < Math.ceil(pack.spawns.length / 2) ? pack.levelMin : pack.levelMax;
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
);

export function createInitialWildMonsters(): EnemyMonsterInstance[] {
  return ENEMY_TEMPLATES.map((tpl, idx) => ({
    ...tpl,
    id: `enemy-${idx}-${tpl.species}`,
    disposition: 'enemy',
    x: tpl.homeX,
    y: tpl.homeY,
    hp: tpl.maxHp,
    alive: true,
    respawnTimer: 0,
    hitFlashTimer: 0,
    attackAnimTimer: 0,
    facingRight: idx % 2 === 0,
    patrolAngle: idx * 0.93,
    patrolTimer: 0,
    aggroed: false,
    aggroTimer: 0,
    counterCooldown: 0,
  }));
}

export function isPointInHuntingSafeZone(x: number, y: number): boolean {
  return (
    Math.hypot(x - HUNTING_SAFE_ZONE.x, y - HUNTING_SAFE_ZONE.y) <=
    HUNTING_SAFE_ZONE.radius
  );
}

/**
 * Draws crisp high-DPI vector terrain accents on top of the decoded Planície Digital
 * artwork so mobile screens look razor-sharp and rich just like DATS Center:
 * - Luminous DATS-style sanctuary ring around the Central Safe Zone
 * - Sunlit stepping stones guiding players to each of the 5 wild Digimon habitats
 * - Crisp wildflowers, clover clusters & swaying-ready grass tufts
 * - Carved cyan rune seal inside the Ancient Ruins & subtle habitat ground ambience
 */
function paintCrispMobileTerrainDetails(ctx: CanvasRenderingContext2D): void {
  ctx.save();

  // 1. Subtle warm sunlit atmospheric depth & sky richness
  const sunWash = ctx.createRadialGradient(1200, 220, 80, 1200, 620, 1380);
  sunWash.addColorStop(0, 'rgba(255, 250, 214, 0.14)');
  sunWash.addColorStop(0.55, 'rgba(56, 189, 248, 0.04)');
  sunWash.addColorStop(1, 'rgba(7, 26, 68, 0.16)');
  ctx.fillStyle = sunWash;
  ctx.fillRect(0, 0, HUNTING_WORLD_W, HUNTING_WORLD_H);

  // 2. Central Safe Zone crisp DATS-style luminous sanctuary boundary ring
  ctx.save();
  ctx.translate(HUNTING_SAFE_ZONE.x, HUNTING_SAFE_ZONE.y);
  const safeAura = ctx.createRadialGradient(0, 0, 24, 0, 0, HUNTING_SAFE_ZONE.radius);
  safeAura.addColorStop(0, 'rgba(56, 232, 255, 0.14)');
  safeAura.addColorStop(0.76, 'rgba(56, 232, 255, 0.06)');
  safeAura.addColorStop(1, 'rgba(56, 232, 255, 0)');
  ctx.fillStyle = safeAura;
  ctx.beginPath();
  ctx.ellipse(0, 0, HUNTING_SAFE_ZONE.radius, HUNTING_SAFE_ZONE.radius * 0.52, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(125, 243, 255, 0.44)';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.ellipse(0, 0, HUNTING_SAFE_ZONE.radius - 4, (HUNTING_SAFE_ZONE.radius - 4) * 0.50, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Crisp inner geometric sanctuary circuit accents
  ctx.strokeStyle = 'rgba(224, 249, 255, 0.34)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(0, -10, 74, 34, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 3. Ancient Ruins crisp carved stone rune ring (Southwest - Goblimon territory)
  ctx.save();
  ctx.translate(445, 785);
  ctx.strokeStyle = 'rgba(56, 232, 255, 0.34)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 76, 36, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(186, 246, 255, 0.28)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.ellipse(0, 0, 56, 26, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 4. Subtle sunlit trail stepping stones connecting Safe Zone to the 5 habitats
  const steppingStones: ReadonlyArray<readonly [number, number, number]> = [
    // West trail -> Koromon Forest
    [1018, 498, 9], [966, 502, 8], [912, 504, 9], [856, 506, 8], [800, 505, 9], [748, 508, 8],
    // East trail -> Tsunomon Meadow
    [1362, 504, 9], [1406, 510, 8], [1458, 520, 8], [1508, 526, 8],
    // Northeast path -> DemiDevimon Cave
    [1578, 466, 8], [1632, 454, 9], [1686, 448, 8], [1748, 444, 8],
    // South-East path -> Gizamon Lake
    [1482, 718, 8], [1518, 762, 9], [1565, 804, 8], [1626, 845, 8], [1690, 868, 8],
    // Southwest path -> Goblimon Ruins
    [662, 616, 8], [620, 662, 8], [568, 706, 9], [516, 742, 8],
  ];
  for (const [sx, sy, sr] of steppingStones) {
    ctx.fillStyle = 'rgba(20, 42, 34, 0.24)';
    ctx.beginPath();
    ctx.ellipse(sx + 1.5, sy + 2.5, sr * 1.15, sr * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(241, 245, 228, 0.42)';
    ctx.beginPath();
    ctx.ellipse(sx, sy, sr, sr * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 5. Crisp high-DPI grass tufts & wildflowers across all 5 hunting grounds
  // (Deterministic coordinates so every frame has zero jitter and looks crystal-clear on mobile Retina!)
  const floraSpots: ReadonlyArray<readonly [number, number, string]> = [
    // Floresta Digital (Koromon)
    [392, 522, '#c4b5fd'], [478, 456, '#fde047'], [566, 514, '#e9d5ff'], [664, 518, '#a7f3d0'],
    [742, 488, '#fef08a'], [422, 594, '#c4b5fd'], [590, 596, '#86efac'], [696, 588, '#e9d5ff'],
    // Pradaria Leste (Tsunomon)
    [1408, 526, '#fde047'], [1484, 512, '#fed7aa'], [1562, 528, '#fef08a'], [1474, 610, '#bbf7d0'],
    [1548, 616, '#fde047'], [1422, 628, '#fdba74'], [1586, 634, '#fef08a'], [1496, 694, '#bbf7d0'],
    // Margem do Lago (Gizamon)
    [1498, 888, '#67e8f9'], [1594, 882, '#a7f3d0'], [1690, 886, '#67e8f9'], [1798, 888, '#fef08a'],
    [1896, 876, '#67e8f9'], [1642, 984, '#a7f3d0'], [1760, 992, '#67e8f9'], [1876, 986, '#a7f3d0'],
    // Ruínas Antigas (Goblimon)
    [372, 796, '#bef264'], [492, 794, '#fde047'], [560, 814, '#bef264'], [356, 878, '#86efac'],
    [438, 882, '#fef08a'], [538, 886, '#bef264'], [628, 888, '#86efac'], [504, 950, '#fde047'],
    // Caverna Digital (DemiDevimon)
    [1726, 452, '#a78bfa'], [1852, 444, '#93c5fd'], [1954, 466, '#c4b5fd'], [2042, 474, '#93c5fd'],
    [1762, 536, '#a78bfa'], [1866, 534, '#93c5fd'], [1966, 542, '#c4b5fd'], [2056, 548, '#a78bfa'],
    // Central plaza borders
    [1042, 472, '#fef08a'], [1058, 558, '#bae6fd'], [1346, 478, '#fef08a'], [1338, 562, '#bae6fd'],
  ];

  for (let i = 0; i < floraSpots.length; i++) {
    const [fx, fy, flowerColor] = floraSpots[i];
    // Crisp 3-blade grass tuft
    ctx.strokeStyle = 'rgba(22, 101, 52, 0.72)';
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

    // Bright sunlit grass highlight blade
    ctx.strokeStyle = 'rgba(134, 239, 172, 0.76)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(fx + 0.5, fy - 1);
    ctx.lineTo(fx + 1.5, fy - 8.5);
    ctx.stroke();

    // Small wildflower blossom every alternating tuft
    if (i % 2 === 0) {
      ctx.fillStyle = flowerColor;
      ctx.beginPath();
      ctx.arc(fx - 3.5, fy - 7.5, 2.2, 0, Math.PI * 2);
      ctx.arc(fx + 4.5, fy - 6, 1.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. Subtle biome atmospheric ground tints (pure visual polish — zero text!)
  // Mystic violet shadow mist near Caverna Digital (DemiDevimon)
  const caveMist = ctx.createRadialGradient(1865, 455, 24, 1865, 455, 240);
  caveMist.addColorStop(0, 'rgba(99, 102, 241, 0.16)');
  caveMist.addColorStop(0.65, 'rgba(59, 130, 246, 0.08)');
  caveMist.addColorStop(1, 'rgba(59, 130, 246, 0)');
  ctx.fillStyle = caveMist;
  ctx.beginPath();
  ctx.ellipse(1865, 455, 240, 125, 0, 0, Math.PI * 2);
  ctx.fill();

  // Soft sunlit emerald glow in Floresta Digital (Koromon)
  const forestGlow = ctx.createRadialGradient(565, 520, 24, 565, 520, 220);
  forestGlow.addColorStop(0, 'rgba(134, 239, 172, 0.13)');
  forestGlow.addColorStop(1, 'rgba(134, 239, 172, 0)');
  ctx.fillStyle = forestGlow;
  ctx.beginPath();
  ctx.ellipse(565, 520, 220, 120, 0, 0, Math.PI * 2);
  ctx.fill();

  // Warm golden sunlit glow in Pradaria Leste (Tsunomon)
  const meadowGlow = ctx.createRadialGradient(1510, 560, 20, 1510, 560, 180);
  meadowGlow.addColorStop(0, 'rgba(254, 240, 138, 0.12)');
  meadowGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
  ctx.fillStyle = meadowGlow;
  ctx.beginPath();
  ctx.ellipse(1510, 560, 180, 115, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Builds the offscreen terrain canvas for Planície Digital.
 * Enhances the reference artwork with vibrant color clarity plus crisp high-DPI
 * vector details so mobile screens look sharp and alive just like DATS Center.
 */
export function buildHuntingFieldStaticLayer(): HTMLCanvasElement {
  const pixelW = Math.round(HUNTING_WORLD_W * MAP_HIDPI_SCALE);
  const pixelH = Math.round(HUNTING_WORLD_H * MAP_HIDPI_SCALE);
  const canvas = document.createElement('canvas');
  canvas.width = pixelW;
  canvas.height = pixelH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Deep sky-ocean fallback painted instantly for frame 0 before image decode resolves
  const fallbackGrad = ctx.createLinearGradient(0, 0, 0, pixelH);
  fallbackGrad.addColorStop(0, '#0745b8');
  fallbackGrad.addColorStop(0.5, '#0c63d4');
  fallbackGrad.addColorStop(1, '#04328c');
  ctx.fillStyle = fallbackGrad;
  ctx.fillRect(0, 0, pixelW, pixelH);

  const img = new Image();
  img.decoding = 'async';
  img.src = HUNTING_MAP_IMAGE_URL;
  img.onload = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pixelW, pixelH);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // Crisp vibrant clarity on OLED / Retina mobile displays
    ctx.filter = 'contrast(1.07) saturate(1.13) brightness(1.02)';
    ctx.drawImage(img, 0, 0, pixelW, pixelH);
    ctx.restore();

    applyContrastAdaptiveSharpen(ctx, pixelW, pixelH, 1.08);

    ctx.save();
    ctx.scale(MAP_HIDPI_SCALE, MAP_HIDPI_SCALE);
    paintCrispMobileTerrainDetails(ctx);
    ctx.restore();
  };

  return canvas;
}

/**
 * Living 2.5D environmental animations layered directly over Planície Digital:
 * - Soft golden-hour sunlit rays across the Central Spire & waterfalls
 * - Pulsing blue-gold sanctuary portal & rising digital light motes
 * - Animated waterfall streams, foam ripples & crystalline Eastern Lake glints
 * - Subtle drifting biome particles (meadow pollen, emerald fireflies, cave wisps)
 * ZERO text, ZERO labels, ZERO signs drawn on the terrain!
 */
export function drawHuntingGroundAnimations(
  ctx: CanvasRenderingContext2D,
  elapsed: number,
  nearPortal: boolean
): void {
  const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
  ctx.save();

  // 1. Soft sunlit diagonal rays sweeping gently across the island
  const rayShift = Math.sin(safeElapsed * 0.45) * 26;
  const rayGrad = ctx.createLinearGradient(960 + rayShift, 120, 1340 + rayShift, 760);
  rayGrad.addColorStop(0, 'rgba(255, 250, 210, 0.10)');
  rayGrad.addColorStop(0.55, 'rgba(186, 246, 255, 0.05)');
  rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = rayGrad;
  ctx.beginPath();
  ctx.moveTo(990 + rayShift, 0);
  ctx.lineTo(1235 + rayShift, 0);
  ctx.lineTo(1485 + rayShift, 740);
  ctx.lineTo(1180 + rayShift, 740);
  ctx.closePath();
  ctx.fill();

  // 2. Central Digital Portal luminous ring & rising cyan energy shimmer
  const pulse = 1 + Math.sin(elapsed * 3.4) * 0.08;
  const portalGlow = ctx.createRadialGradient(
    HUNTING_RETURN_PORTAL.x,
    HUNTING_RETURN_PORTAL.y - 30,
    8,
    HUNTING_RETURN_PORTAL.x,
    HUNTING_RETURN_PORTAL.y - 30,
    98 * pulse
  );
  portalGlow.addColorStop(
    0,
    nearPortal ? 'rgba(254, 240, 138, 0.44)' : 'rgba(56, 232, 255, 0.38)'
  );
  portalGlow.addColorStop(0.55, 'rgba(14, 165, 233, 0.16)');
  portalGlow.addColorStop(1, 'rgba(14, 165, 233, 0)');
  ctx.fillStyle = portalGlow;
  ctx.beginPath();
  ctx.ellipse(
    HUNTING_RETURN_PORTAL.x,
    HUNTING_RETURN_PORTAL.y - 18,
    92 * pulse,
    36 * pulse,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Subtle rotating cyan orbit dots on Safe Sanctuary border
  for (let i = 0; i < 6; i++) {
    const a = elapsed * 0.42 + (i * Math.PI) / 3;
    const ox = HUNTING_SAFE_ZONE.x + Math.cos(a) * (HUNTING_SAFE_ZONE.radius - 6);
    const oy = HUNTING_SAFE_ZONE.y + Math.sin(a) * ((HUNTING_SAFE_ZONE.radius - 6) * 0.5);
    const alpha = 0.32 + Math.sin(elapsed * 3 + i) * 0.16;
    ctx.fillStyle = `rgba(125, 243, 255, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (nearPortal) {
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.84)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(
      HUNTING_RETURN_PORTAL.x,
      HUNTING_RETURN_PORTAL.y,
      56 * pulse,
      19 * pulse,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  // Rising digital light motes around the central energy column
  for (let i = 0; i < 10; i++) {
    const phase = (elapsed * 0.48 + i * 0.1) % 1;
    const mx = 1200 + Math.sin(elapsed * 1.6 + i * 1.4) * 38;
    const my = 448 - phase * 270;
    const alpha = Math.sin(phase * Math.PI) * 0.64;
    ctx.fillStyle = `rgba(186, 246, 255, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(mx, my, 2 + (i % 2) * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Animated Waterfall Foam Rings & Cascading Mist
  const falls = [
    { x: 965, y: 690, rx: 48, ry: 18 },
    { x: 1085, y: 695, rx: 34, ry: 14 },
    { x: 1455, y: 1020, rx: 42, ry: 15 },
    { x: 510, y: 1210, rx: 40, ry: 15 },
    { x: 1175, y: 1170, rx: 38, ry: 14 },
  ];
  for (let f = 0; f < falls.length; f++) {
    const wf = falls[f];
    const rawWave = (safeElapsed * 1.4 + f * 0.35) % 1;
    const wave = rawWave < 0 ? rawWave + 1 : rawWave;
    const mistAlpha = 0.2 + Math.sin(safeElapsed * 3.4 + f * 1.3) * 0.08;
    const drift = Math.sin(safeElapsed * 2.1 + f) * 4;
    ctx.fillStyle = `rgba(224, 249, 255, ${mistAlpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(
      wf.x + drift,
      wf.y,
      Math.max(0.5, wf.rx),
      Math.max(0.5, wf.ry),
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Expanding crisp white-aqua ripple ring
    ctx.strokeStyle = `rgba(235, 252, 255, ${((1 - wave) * 0.38).toFixed(3)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(
      wf.x,
      wf.y + 4,
      Math.max(0.5, wf.rx * (0.55 + wave * 0.65)),
      Math.max(0.5, wf.ry * (0.55 + wave * 0.65)),
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  // 4. Eastern Sapphire Lake crystalline sunlight glints & gentle wave lines
  for (let i = 0; i < 9; i++) {
    const lx = 1685 + i * 48 + Math.sin(elapsed * 1.3 + i) * 7;
    const ly = 626 + ((i * 31) % 102);
    const shimmer = Math.max(0, Math.sin(elapsed * 2.9 + i * 1.6));
    if (shimmer > 0.22) {
      ctx.fillStyle = `rgba(224, 248, 255, ${(shimmer * 0.48).toFixed(3)})`;
      ctx.fillRect(lx, ly, 13, 2.2);
    }
  }

  // 5. Caverna Digital inner mystic blue-violet pulse + drifting shadow sparks
  const caveGlow = 0.22 + Math.sin(elapsed * 2.6) * 0.09;
  ctx.fillStyle = `rgba(96, 165, 250, ${caveGlow.toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(1822, 338, 52, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // 6. Ancient Ruins circular core pulsing cyan energy ring
  const ruinsGlow = 0.22 + Math.sin(elapsed * 2.4 + 0.8) * 0.09;
  ctx.strokeStyle = `rgba(56, 232, 255, ${ruinsGlow.toFixed(3)})`;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(445, 785, 62, 28, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 7. Ambient floating sunlit pollen & biome fireflies across all 5 hunting grounds
  const ambientMotes: ReadonlyArray<readonly [number, number, string]> = [
    [480, 510, '167, 243, 208'],   // Forest emerald
    [625, 535, '216, 180, 254'],   // Forest violet
    [1475, 525, '254, 240, 138'],  // Meadow gold
    [1560, 610, '254, 215, 170'],  // Meadow warm
    [1640, 865, '103, 232, 249'],  // Lake aqua
    [1835, 895, '167, 243, 208'],  // Lake mint
    [420, 825, '190, 242, 100'],   // Ruins lime
    [545, 865, '56, 232, 255'],    // Ruins cyan
    [1810, 445, '167, 139, 250'],  // Cave violet
    [1965, 485, '147, 197, 253'],  // Cave ice-blue
  ];
  for (let i = 0; i < ambientMotes.length; i++) {
    const [bx, by, rgb] = ambientMotes[i];
    const dx = Math.sin(elapsed * 1.15 + i * 2.1) * 24;
    const dy = Math.cos(elapsed * 0.95 + i * 1.7) * 14 - ((elapsed * 9 + i * 13) % 24);
    const alpha = 0.25 + Math.sin(elapsed * 2.6 + i * 1.3) * 0.22;
    ctx.fillStyle = `rgba(${rgb}, ${Math.max(0.08, alpha).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(bx + dx, by + dy, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export interface HuntingDepthDrawable {
  sortY: number;
  draw: (ctx: CanvasRenderingContext2D, elapsed: number) => void;
}

/**
 * Depth-sorted dynamic actors on Planície Digital (only entities with real sprites render in-world).
 */
export function buildHuntingDepthProps(): HuntingDepthDrawable[] {
  return [];
}

/**
 * Draws an Enemy Wild Digimon monster with 2.5D perspective scaling, real
 * 3D sprites, attack/hit poses, and a clean HP bar + nameplate anchored above
 * the monster's head.
 */
export function drawEnemyMonster(
  ctx: CanvasRenderingContext2D,
  enemy: EnemyMonsterInstance,
  elapsed: number,
  isTargeted: boolean
): void {
  if (!enemy.alive) return;
  const pScale = getHuntingPerspectiveScale(enemy.y);
  const flash = enemy.hitFlashTimer > 0;
  const attackDuration = 0.48;
  const isAttacking = enemy.attackAnimTimer > 0;
  const attackProgress = isAttacking
    ? 1 - Math.max(0, Math.min(1, enemy.attackAnimTimer / attackDuration))
    : 0;

  ctx.save();
  ctx.translate(enemy.x, enemy.y);

  const spriteResult = drawWildDigimonSprite(ctx, enemy.species, {
    elapsed,
    phaseOffset: enemy.patrolAngle,
    facingRight: enemy.facingRight,
    isAttacking,
    attackProgress,
    isHitFlash: flash,
    perspectiveScale: pScale,
    isTargeted,
  });

  if (spriteResult.drawn) {
    // Enemy HP Bar + crisp Name Tag anchored cleanly above the real sprite's top edge
    if (enemy.isBoss) {
      const barW = Math.round(164 * Math.max(0.95, pScale));
      const barX = -barW / 2;
      const barY = -spriteResult.topOffsetPx - 10;
      const pct = Math.max(0, Math.min(1, enemy.hp / Math.max(1, enemy.maxHp)));

      ctx.fillStyle = 'rgba(15, 4, 8, 0.95)';
      ctx.beginPath();
      ctx.roundRect(barX - 3, barY - 3, barW + 6, 13, 5);
      ctx.fill();
      ctx.strokeStyle = isTargeted ? '#fde047' : '#f59e0b';
      ctx.lineWidth = isTargeted ? 1.8 : 1.4;
      ctx.stroke();

      const hpGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
      hpGrad.addColorStop(0, '#b91c1c');
      hpGrad.addColorStop(0.5, '#ef4444');
      hpGrad.addColorStop(1, '#f97316');
      ctx.fillStyle = hpGrad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, Math.max(0, barW * pct), 7, 3);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(barX + 1, barY + 0.5, Math.max(0, barW * pct - 2), 2);

      ctx.font = '800 12.5px "Exo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(10, 3, 6, 0.96)';
      const bossLabel = `★ BOSS DE RAID · ${enemy.name} Nv.${enemy.level}`;
      ctx.strokeText(bossLabel, 0, barY - 7);
      ctx.fillStyle = isTargeted ? '#fef08a' : '#fca5a5';
      ctx.fillText(bossLabel, 0, barY - 7);

      if (enemy.aggroed && enemy.bossTargetName) {
        const swapSec = Math.max(1, Math.ceil(enemy.bossTargetSwapRemainingSec ?? 7));
        const targetInfo = `Alvo: ${enemy.bossTargetName} · ${swapSec}s`;
        ctx.font = '700 10px "Exo 2", sans-serif';
        ctx.lineWidth = 2.8;
        ctx.strokeStyle = 'rgba(10, 3, 6, 0.96)';
        ctx.strokeText(targetInfo, 0, barY - 22);
        ctx.fillStyle = '#fde047';
        ctx.fillText(targetInfo, 0, barY - 22);
      }

      ctx.restore();
      return;
    }

    const barW = Math.round((isTargeted ? 56 : 48) * Math.max(0.92, pScale));
    const barX = -barW / 2;
    const barY = -spriteResult.topOffsetPx - 5;
    const pct = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));

    ctx.fillStyle = 'rgba(10, 6, 20, 0.9)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, 6);
    ctx.fillStyle = pct > 0.45 ? '#ef4444' : '#f97316';
    ctx.fillRect(barX, barY, barW * pct, 4);

    ctx.font = isTargeted
      ? '800 11px "Exo 2", sans-serif'
      : '700 10px "Exo 2", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 2.8;
    ctx.strokeStyle = 'rgba(6, 4, 16, 0.94)';
    const label = `${enemy.name} Nv.${enemy.level}`;
    ctx.strokeText(label, 0, barY - 4.5);
    ctx.fillStyle = isTargeted ? '#fde047' : '#ffe4e6';
    ctx.fillText(label, 0, barY - 4.5);

    ctx.restore();
    return;
  }

  // Fallback procedural silhouette (used briefly only on frame 0 before spritesheet decodes)
  const speciesScale =
    enemy.species === 'greymon' || enemy.species === 'garurumon'
      ? 1.28
      : enemy.species === 'kuwagamon'
        ? 1.65
        : 1.0;
  const scale = pScale * speciesScale;
  const bob = Math.sin(elapsed * 4.5 + enemy.patrolAngle) * 2;
  ctx.scale(scale, scale);

  if (isTargeted) {
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 2, 24, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 18, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = flash ? '#ffffff' : enemy.bodyColor;
  ctx.strokeStyle = '#1e0b2b';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(0, -18 + bob, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (!flash) {
    ctx.fillStyle = enemy.accentColor;
    ctx.beginPath();
    ctx.arc(0, -13 + bob, 8, 0, Math.PI);
    ctx.fill();
  }

  ctx.fillStyle = enemy.eyeColor;
  ctx.fillRect(-7, -23 + bob, 4, 4);
  ctx.fillRect(3, -23 + bob, 4, 4);

  const barW = 48;
  const barX = -barW / 2;
  const barY = -48 + bob;
  const pct = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));

  ctx.fillStyle = 'rgba(15, 6, 24, 0.88)';
  ctx.fillRect(barX - 1, barY - 1, barW + 2, 6);
  ctx.fillStyle = pct > 0.45 ? '#ef4444' : '#f97316';
  ctx.fillRect(barX, barY, barW * pct, 4);

  ctx.font = '700 10px "Exo 2", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fecdd3';
  ctx.fillText(`${enemy.name} Nv.${enemy.level}`, 0, barY - 4);
  ctx.restore();
}
