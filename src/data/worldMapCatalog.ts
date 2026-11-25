import {
  DATA_FOREST_BOSS_TEMPLATE,
  DATA_FOREST_FRIENDLY_NPCS,
  DATA_FOREST_HABITAT_PACKS,
  DATA_FOREST_IMAGE_URL,
  DATA_FOREST_MAP_ID,
} from '../maps/dataForestMap';
import {
  DATS_INTERACTION_POINTS,
  DATS_MAP_ID,
} from '../maps/datsCenterMap';
import {
  D_TERMINAL_BANNER_URL,
  D_TERMINAL_CONDUCTOR_NPC,
  D_TERMINAL_MAP_ID,
} from '../maps/dTerminalMap';
import {
  DIGI_MOUNTAIN_BANNER_URL,
  DIGI_MOUNTAIN_FRIENDLY_NPCS,
  DIGI_MOUNTAIN_HABITAT_PACKS,
  DIGI_MOUNTAIN_MAP_ID,
} from '../maps/digiMountainMap';
import {
  DIGITAL_DESERT_BANNER_URL,
  DIGITAL_DESERT_FRIENDLY_NPCS,
  DIGITAL_DESERT_HABITAT_PACKS,
  DIGITAL_DESERT_MAP_ID,
} from '../maps/digitalDesertMap';
import {
  DATA_SEA_BANNER_URL,
  DATA_SEA_FRIENDLY_NPCS,
  DATA_SEA_HABITAT_PACKS,
  DATA_SEA_MAP_ID,
} from '../maps/dataSeaMap';
import {
  DIGIMON_ISLAND_BANNER_URL,
  DIGIMON_ISLAND_FRIENDLY_NPCS,
  DIGIMON_ISLAND_HABITAT_PACKS,
  DIGIMON_ISLAND_MAP_ID,
} from '../maps/digimonIslandMap';
import {
  DARK_AREA_BANNER_URL,
  DARK_AREA_FRIENDLY_NPCS,
  DARK_AREA_HABITAT_PACKS,
  DARK_AREA_MAP_ID,
} from '../maps/darkAreaMap';
import {
  VIRTUAL_WORLD_BANNER_URL,
  VIRTUAL_WORLD_FRIENDLY_NPCS,
  VIRTUAL_WORLD_HABITAT_PACKS,
  VIRTUAL_WORLD_MAP_ID,
} from '../maps/virtualWorldMap';
import {
  FRIENDLY_FIELD_NPCS,
  HUNTING_HABITAT_PACKS,
  HUNTING_MAP_ID,
  type WildMonsterSpecies,
} from '../maps/huntingFieldMap';
import {
  MUDFRIGIMON_NPC,
  RICHARD_SAMPSON_NPC,
} from '../sprites/npcSprites';

export type PlayableMapId =
  | typeof DATS_MAP_ID
  | typeof D_TERMINAL_MAP_ID
  | typeof HUNTING_MAP_ID
  | typeof DATA_FOREST_MAP_ID
  | typeof DIGI_MOUNTAIN_MAP_ID
  | typeof DIGITAL_DESERT_MAP_ID
  | typeof DATA_SEA_MAP_ID
  | typeof DIGIMON_ISLAND_MAP_ID
  | typeof DARK_AREA_MAP_ID
  | typeof VIRTUAL_WORLD_MAP_ID;

export type WorldMapCategory = 'mundo' | 'eventos' | 'dungeon';

export type RewardIconKind = 'bits' | 'exp' | 'item' | 'crystal';

export interface WorldMapReward {
  id: string;
  label: string;
  detail: string;
  kind: RewardIconKind;
  iconUrl: string;
}

export interface WorldMapNpcInfo {
  name: string;
  role: string;
}

export interface WorldMapEnemyInfo {
  name: string;
  levelLabel: string;
  species?: WildMonsterSpecies;
  habitat?: string;
  packSize?: number;
}

export interface WorldMapMissionSummary {
  id: string;
  title: string;
  summary: string;
  progressText?: string;
  completed?: boolean;
}

export interface WorldMapRegion {
  id: string;
  /** Present only for real maps currently playable in the game */
  playableMapId: PlayableMapId | null;
  implemented: boolean;
  bannerUrl: string;
  thumbUrl: string;
  name: string;
  subtitle: string;
  zoneType:
    | 'Zona Segura'
    | 'Área de Caça'
    | 'Região Futura'
    | 'Evento Especial'
    | 'Dungeon';
  minLevel: number;
  maxLevel: number;
  /** Empty for non-combat safe hubs like DATS Center */
  recommendedLevel: string;
  description: string;
  categories: readonly WorldMapCategory[];
  /** Exact percentage coordinates (0-100) aligned to /assets/map/world_map_base.png landmarks */
  mapCoords: { x: number; y: number };
  npcs: readonly WorldMapNpcInfo[];
  enemies: readonly WorldMapEnemyInfo[];
  rewards: readonly WorldMapReward[];
  staticMissions: readonly WorldMapMissionSummary[];
}

export type RegionAccessState =
  | 'current'
  | 'available'
  | 'level-locked'
  | 'upcoming';

const REWARD_ICONS: Record<RewardIconKind, string> = {
  bits: '/assets/map/reward_bits.png',
  exp: '/assets/map/reward_exp.png',
  item: '/assets/map/reward_item.png',
  crystal: '/assets/map/reward_crystal.png',
};

/**
 * Derives all 5 wild Digimon habitat packs (8 mobs each) directly from huntingFieldMap.ts
 */
function buildRealHuntingEnemies(): WorldMapEnemyInfo[] {
  return HUNTING_HABITAT_PACKS.map((pack) => ({
    name: pack.displayName,
    species: pack.species,
    habitat: pack.habitatName,
    packSize: pack.spawns.length,
    levelLabel:
      pack.levelMin === pack.levelMax
        ? `Lv. ${pack.levelMin}`
        : `Lv. ${pack.levelMin}–${pack.levelMax}`,
  }));
}

const REAL_DATS_NPCS: WorldMapNpcInfo[] = [
  { name: RICHARD_SAMPSON_NPC.name, role: RICHARD_SAMPSON_NPC.title },
  { name: MUDFRIGIMON_NPC.name, role: MUDFRIGIMON_NPC.title },
  { name: 'Posto de Missões DATS', role: 'Oficiais de Missão' },
  { name: 'Balcão de Informações', role: 'Guia Digital' },
  { name: 'Terminal dos Tamers', role: 'Gestão e Registros' },
];

const REAL_HUNTING_NPCS: WorldMapNpcInfo[] = FRIENDLY_FIELD_NPCS.map((npc) => ({
  name: npc.name,
  role: npc.role,
}));

const REAL_HUNTING_ENEMIES: WorldMapEnemyInfo[] = buildRealHuntingEnemies();

const REAL_DATA_FOREST_NPCS: WorldMapNpcInfo[] = DATA_FOREST_FRIENDLY_NPCS.map(
  (npc) => ({
    name: npc.name,
    role: npc.role,
  })
);

const REAL_DATA_FOREST_ENEMIES: WorldMapEnemyInfo[] = [
  ...DATA_FOREST_HABITAT_PACKS.map((pack) => ({
    name: pack.displayName,
    species: pack.species,
    habitat: pack.habitatName,
    packSize: pack.spawns.length,
    levelLabel:
      pack.levelMin === pack.levelMax
        ? `Lv. ${pack.levelMin}`
        : `Lv. ${pack.levelMin}–${pack.levelMax}`,
  })),
  {
    name: `${DATA_FOREST_BOSS_TEMPLATE.name} (Boss de Raid)`,
    species: DATA_FOREST_BOSS_TEMPLATE.species,
    habitat: 'Altar da Grande Árvore · Cooperativo',
    packSize: 1,
    levelLabel: `BOSS Lv. ${DATA_FOREST_BOSS_TEMPLATE.level}`,
  },
];

const REAL_DIGI_MOUNTAIN_NPCS: WorldMapNpcInfo[] = DIGI_MOUNTAIN_FRIENDLY_NPCS.map(
  (npc) => ({
    name: npc.name,
    role: npc.role,
  })
);

const REAL_DIGI_MOUNTAIN_ENEMIES: WorldMapEnemyInfo[] =
  DIGI_MOUNTAIN_HABITAT_PACKS.map((pack) => ({
    name: pack.displayName,
    species: pack.species,
    habitat: pack.habitatName,
    packSize: pack.spawns.length,
    levelLabel:
      pack.levelMin === pack.levelMax
        ? `Lv. ${pack.levelMin}`
        : `Lv. ${pack.levelMin}–${pack.levelMax}`,
  }));

const REAL_DIGITAL_DESERT_NPCS: WorldMapNpcInfo[] =
  DIGITAL_DESERT_FRIENDLY_NPCS.map((npc) => ({
    name: npc.name,
    role: npc.role,
  }));

const REAL_DIGITAL_DESERT_ENEMIES: WorldMapEnemyInfo[] =
  DIGITAL_DESERT_HABITAT_PACKS.map((pack) => ({
    name: pack.displayName,
    species: pack.species,
    habitat: pack.habitatName,
    packSize: pack.spawns.length,
    levelLabel:
      pack.levelMin === pack.levelMax
        ? `Lv. ${pack.levelMin}`
        : `Lv. ${pack.levelMin}–${pack.levelMax}`,
  }));

const REAL_DATA_SEA_NPCS: WorldMapNpcInfo[] =
  DATA_SEA_FRIENDLY_NPCS.map((npc) => ({
    name: npc.name,
    role: npc.role,
  }));

const REAL_DATA_SEA_ENEMIES: WorldMapEnemyInfo[] =
  DATA_SEA_HABITAT_PACKS.map((pack) => ({
    name: pack.displayName,
    species: pack.species,
    habitat: pack.habitatName,
    packSize: pack.spawns.length,
    levelLabel:
      pack.levelMin === pack.levelMax
        ? `Lv. ${pack.levelMin}`
        : `Lv. ${pack.levelMin}–${pack.levelMax}`,
  }));

const REAL_DIGIMON_ISLAND_NPCS: WorldMapNpcInfo[] =
  DIGIMON_ISLAND_FRIENDLY_NPCS.map((npc) => ({
    name: npc.name,
    role: npc.role,
  }));

const REAL_DIGIMON_ISLAND_ENEMIES: WorldMapEnemyInfo[] =
  DIGIMON_ISLAND_HABITAT_PACKS.map((pack) => ({
    name: pack.displayName,
    species: pack.species,
    habitat: pack.habitatName,
    packSize: pack.spawns.length,
    levelLabel:
      pack.levelMin === pack.levelMax
        ? `Lv. ${pack.levelMin}`
        : `Lv. ${pack.levelMin}–${pack.levelMax}`,
  }));

const REAL_DARK_AREA_NPCS: WorldMapNpcInfo[] =
  DARK_AREA_FRIENDLY_NPCS.map((npc) => ({
    name: npc.name,
    role: npc.role,
  }));

const REAL_DARK_AREA_ENEMIES: WorldMapEnemyInfo[] =
  DARK_AREA_HABITAT_PACKS.map((pack) => ({
    name: pack.displayName,
    species: pack.species,
    habitat: pack.habitatName,
    packSize: pack.spawns.length,
    levelLabel:
      pack.levelMin === pack.levelMax
        ? `Lv. ${pack.levelMin}`
        : `Lv. ${pack.levelMin}–${pack.levelMax}`,
  }));

const REAL_VIRTUAL_WORLD_NPCS: WorldMapNpcInfo[] =
  VIRTUAL_WORLD_FRIENDLY_NPCS.map((npc) => ({
    name: npc.name,
    role: npc.role,
  }));

const REAL_VIRTUAL_WORLD_ENEMIES: WorldMapEnemyInfo[] =
  VIRTUAL_WORLD_HABITAT_PACKS.map((pack) => ({
    name: pack.displayName,
    species: pack.species,
    habitat: pack.habitatName,
    packSize: pack.spawns.length,
    levelLabel:
      pack.levelMin === pack.levelMax
        ? `Lv. ${pack.levelMin}`
        : `Lv. ${pack.levelMin}–${pack.levelMax}`,
  }));

export const WORLD_MAP_REGIONS: readonly WorldMapRegion[] = [
  // =========================================================================
  // REAL PLAYABLE MAPS REGISTERED IN THE GAME
  // =========================================================================
  {
    id: DATS_MAP_ID,
    playableMapId: DATS_MAP_ID,
    implemented: true,
    bannerUrl: '/assets/map/region_dats_center.png',
    thumbUrl: '/assets/map/region_dats_center.png',
    name: 'DATS Center',
    subtitle: 'Cidade Segura · Base dos Tamers',
    zoneType: 'Zona Segura',
    minLevel: 1,
    maxLevel: 1,
    recommendedLevel: '',
    description:
      'A base central dos Tamers. Cidade segura sem combates, com recuperação natural de HP e DS, oficiais da DATS, loja de suprimentos, Incubadora e portal sul direto para a estação D-Terminal.',
    categories: ['mundo'],
    mapCoords: { x: 50.0, y: 40.2 },
    npcs: REAL_DATS_NPCS,
    enemies: [],
    rewards: [
      {
        id: 'dats-bits',
        label: 'Loja por Bits',
        detail: 'Comidas HP e vitaminas DS disponíveis na loja do MudFrigimon',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'dats-exp',
        label: 'Orientação',
        detail: 'Treinamento inicial e preparo para evolução',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'dats-missions',
        label: 'Missões DATS',
        detail: `${DATS_INTERACTION_POINTS.length} pontos de reconhecimento na praça`,
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'dats-heal',
        label: 'Cura HP/DS',
        detail: 'Recuperação automática de HP e DS na zona segura',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [],
  },
  {
    id: D_TERMINAL_MAP_ID,
    playableMapId: D_TERMINAL_MAP_ID,
    implemented: true,
    bannerUrl: D_TERMINAL_BANNER_URL,
    thumbUrl: D_TERMINAL_BANNER_URL,
    name: 'D-Terminal',
    subtitle: 'Zona Segura · Estação Trailmon Central',
    zoneType: 'Zona Segura',
    minLevel: 1,
    maxLevel: 80,
    recommendedLevel: '',
    description:
      'Estação ferroviária central do Mundo Digital acessada pelo portal sul do DATS Center. Converse com o Condutor PawnChessmon (Black) em frente ao trem Trailmon para escolher seu destino entre todas as áreas liberadas.',
    categories: ['mundo'],
    mapCoords: { x: 56.5, y: 47.5 },
    npcs: [
      {
        name: D_TERMINAL_CONDUCTOR_NPC.name,
        role: `${D_TERMINAL_CONDUCTOR_NPC.title} · Viagens entre Mapas`,
      },
    ],
    enemies: [],
    rewards: [
      {
        id: 'dt-travel',
        label: 'Estação Trailmon',
        detail: 'Embarque com PawnChessmon (Black) para qualquer mapa desbloqueado',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
      {
        id: 'dt-safe',
        label: 'Zona Segura',
        detail: 'Sem monstros selvagens e recuperação natural de HP e DS',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'dt-return',
        label: 'Portal DATS',
        detail: 'Retorno rápido ao DATS Center pelo portal sul da estação',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
    ],
    staticMissions: [],
  },
  {
    id: HUNTING_MAP_ID,
    playableMapId: HUNTING_MAP_ID,
    implemented: true,
    bannerUrl: '/assets/map/planicie_digital_banner.webp',
    thumbUrl: '/assets/map/planicie_digital_banner.webp',
    name: 'Planície Digital',
    subtitle: 'Início de Up · Nv. 1 ~ 10 · 5 Bandos Rookie (35 Mobs)',
    zoneType: 'Área de Caça',
    minLevel: 1,
    maxLevel: 10,
    recommendedLevel: 'Lv. 1 ~ 10',
    description:
      'Onde começa a sua jornada de caça! Ilha digital com Área Segura central e 5 territórios progressivos de Digimons Rookie com drop de DigiEggs Mercenários: Drimogemon (Nv. 1–2), Gotsumon (Nv. 3–4), Kiwimon (Nv. 5–6), Hawkmon (Nv. 7–8) e Monodramon (Nv. 9–10).',
    categories: ['mundo'],
    mapCoords: { x: 64.5, y: 55.8 },
    npcs: REAL_HUNTING_NPCS,
    enemies: REAL_HUNTING_ENEMIES,
    rewards: [
      {
        id: 'hunt-bits',
        label: 'Bits',
        detail: '15 a 60 Bits por Digimon derrotado',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'hunt-exp',
        label: 'EXP por Nível',
        detail: '24 a 166 EXP base (escala conforme diferença de nível)',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'hunt-items',
        label: 'DigiEggs & DATA',
        detail: 'Drop de DigiEggs Mercenários, DATA e Chips de HP/DS',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'hunt-safe',
        label: 'Portal Seguro',
        detail: 'Círculo de proteção com regeneração próximo ao portal',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [],
  },

  // =========================================================================
  // PLAYABLE REGION 3: FLORESTA DE DADOS (Lv. 10 ~ 20 + RAID BOSS)
  // =========================================================================
  {
    id: DATA_FOREST_MAP_ID,
    playableMapId: DATA_FOREST_MAP_ID,
    implemented: true,
    bannerUrl: DATA_FOREST_IMAGE_URL,
    thumbUrl: DATA_FOREST_IMAGE_URL,
    name: 'Floresta de Dados',
    subtitle: 'Nv. 10 ~ 20 · 5 Bandos + Raid Boss Kuwagamon',
    zoneType: 'Área de Caça',
    minLevel: 10,
    maxLevel: 20,
    recommendedLevel: 'Lv. 10 ~ 20',
    description:
      'Floresta antiga repleta de pontes de madeira, cachoeiras e cristais de dados. Possui 5 territórios com DigiEggs dropáveis (Impmon, Renamon, Guilmon, Garurumon e Greymon) e o temível Raid Boss Kuwagamon (Nv. 20) na Grande Árvore Sagrada — reúna outros jogadores para derrotá-lo!',
    categories: ['mundo'],
    mapCoords: { x: 8.8, y: 43.2 },
    npcs: REAL_DATA_FOREST_NPCS,
    enemies: REAL_DATA_FOREST_ENEMIES,
    rewards: [
      {
        id: 'forest-bits',
        label: 'Bits Elevados',
        detail: '65 a 450 Bits por Digimon e bônus de Raid Boss',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'forest-exp',
        label: 'EXP Lv. 10–20',
        detail: '175 a 630 EXP por mob + 1.500 EXP no Boss Kuwagamon',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'forest-item',
        label: 'DigiEggs & DATA',
        detail: 'Drop de DigiEggs Mercenários, DATA e suprimentos de combate',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'forest-crystal',
        label: 'Raid Boss',
        detail: 'Kuwagamon (Nv. 20) com HP compartilhado e drop de DigiEgg',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [],
  },
  {
    id: DIGI_MOUNTAIN_MAP_ID,
    playableMapId: DIGI_MOUNTAIN_MAP_ID,
    implemented: true,
    bannerUrl: DIGI_MOUNTAIN_BANNER_URL,
    thumbUrl: DIGI_MOUNTAIN_BANNER_URL,
    name: 'Montanha Digi',
    subtitle: 'Nv. 20 ~ 30 · 5 Bandos Champion (35 Mobs)',
    zoneType: 'Área de Caça',
    minLevel: 20,
    maxLevel: 30,
    recommendedLevel: 'Lv. 20 ~ 30',
    description:
      'Região montanhosa com fortaleza tecnológica no pico nevado, caverna de cristais roxos luminosos, rios, cachoeiras, pontes, observatório de cristal e ilhas flutuantes. Enfrente 5 territórios Champion com drop de DigiEggs Mercenários: Meramon (Nv. 20–21), Digmon (Nv. 22–23), Kabuterimon (Nv. 24–25), Chrysalimon (Nv. 26–27) e Veedramon (Nv. 28–30).',
    categories: ['mundo'],
    mapCoords: { x: 71.5, y: 15.2 },
    npcs: REAL_DIGI_MOUNTAIN_NPCS,
    enemies: REAL_DIGI_MOUNTAIN_ENEMIES,
    rewards: [
      {
        id: 'mtn-bits',
        label: 'Bits Elevados',
        detail: '165 a 345 Bits por Digimon Champion derrotado',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'mtn-exp',
        label: 'EXP Lv. 20–30',
        detail: '720 a 1.680 EXP base ideal para evoluir rumo ao Ultimate',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'mtn-item',
        label: 'DigiEggs & DATA',
        detail: 'Drop de DigiEggs (DemiMeramon, Drimogemon, Tentomon, Keramon e Veemon) + DATA',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'mtn-crystal',
        label: 'Exploração 3D',
        detail: 'Fortaleza Central, Caverna de Cristais Roxos, Pontes e Áreas Secretas',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [],
  },
  {
    id: DIGITAL_DESERT_MAP_ID,
    playableMapId: DIGITAL_DESERT_MAP_ID,
    implemented: true,
    bannerUrl: DIGITAL_DESERT_BANNER_URL,
    thumbUrl: DIGITAL_DESERT_BANNER_URL,
    name: 'Deserto Digital',
    subtitle: 'Nv. 30 ~ 40 · 5 Bandos Ultimate (35 Mobs)',
    zoneType: 'Área de Caça',
    minLevel: 30,
    maxLevel: 40,
    recommendedLevel: 'Lv. 30 ~ 40',
    description:
      'Região desértica dominada pela Grande Pirâmide Digital, Fonte do Oásis Central, Caverna Violeta, Cânion do Fóssil Ancestral e ruínas Stargate. Enfrente 5 territórios Ultimate com drop de DigiEggs Mercenários e DATA: IceLeomon (Nv. 30–31), Insekimon (Nv. 32–33), SkullMeramon (Nv. 34–35), Cyberdramon (Nv. 36–37) e WarGrowlmon (Nv. 38–40).',
    categories: ['mundo'],
    mapCoords: { x: 20.5, y: 60.5 },
    npcs: REAL_DIGITAL_DESERT_NPCS,
    enemies: REAL_DIGITAL_DESERT_ENEMIES,
    rewards: [
      {
        id: 'des-bits',
        label: 'Bits Ultimate',
        detail: '160 a 210+ Bits por Digimon Ultimate derrotado',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'des-exp',
        label: 'EXP Lv. 30–40',
        detail: '1.620 a 3.330 EXP base ideal para alcançar o estágio Mega',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'des-item',
        label: 'DigiEggs & Evoluter',
        detail: 'Drop de DigiEggs (Elecmon, Gotsumon, DemiMeramon, Monodramon, Guilmon), DATA e Evoluter',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'des-crystal',
        label: 'Ruínas & Pirâmide',
        detail: 'Grande Pirâmide Digital, Fonte do Oásis, Caverna Violeta e Fóssil Ancestral',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [],
  },
  {
    id: DATA_SEA_MAP_ID,
    playableMapId: DATA_SEA_MAP_ID,
    implemented: true,
    bannerUrl: DATA_SEA_BANNER_URL,
    thumbUrl: DATA_SEA_BANNER_URL,
    name: 'Mar de Dados',
    subtitle: 'Nv. 40 ~ 50 · 5 Bandos Ultimate (35 Mobs)',
    zoneType: 'Área de Caça',
    minLevel: 40,
    maxLevel: 50,
    recommendedLevel: 'Lv. 40 ~ 50',
    description:
      'Arquipélago cristalino cercado por águas turquesa, castelo de safira, farol oeste e gruta roxa. Enfrente 5 territórios Ultimate de alto nível com drop de DigiEggs e DATA: MetalGreymon (Nv. 40–41), Giromon (Nv. 42–43), Garudamon (Nv. 44–45), SkullSatamon (Nv. 46–47) e Okuwamon (Nv. 48–50).',
    categories: ['mundo'],
    mapCoords: { x: 87.5, y: 29.8 },
    npcs: REAL_DATA_SEA_NPCS,
    enemies: REAL_DATA_SEA_ENEMIES,
    rewards: [
      {
        id: 'sea-bits',
        label: 'Bits Ultimate+',
        detail: '215 a 280+ Bits por Digimon Ultimate derrotado',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'sea-exp',
        label: 'EXP Lv. 40–50',
        detail: '3.420 a 6.460 EXP base ideal para consolidar evoluções Mega',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'sea-item',
        label: 'DigiEggs & Evoluter',
        detail: 'Drop de DigiEggs (Agumon Clássico, Drimogemon, Biyomon, Impmon, Kunemon), DATA e Evoluter',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'sea-crystal',
        label: 'Castelo & Gruta Roxa',
        detail: 'Castelo Cristalino, Torre Farol, Praça Rúnica e Gruta Ametista',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [],
  },
  {
    id: DIGIMON_ISLAND_MAP_ID,
    playableMapId: DIGIMON_ISLAND_MAP_ID,
    implemented: true,
    bannerUrl: DIGIMON_ISLAND_BANNER_URL,
    thumbUrl: DIGIMON_ISLAND_BANNER_URL,
    name: 'Ilha dos Digimons',
    subtitle: 'Nv. 50 ~ 60 · 5 Bandos Mega (35 Mobs)',
    zoneType: 'Área de Caça',
    minLevel: 50,
    maxLevel: 60,
    recommendedLevel: 'Lv. 50 ~ 60',
    description:
      'Santuário insular ancestral com Cidadela Cristalina, Estátua Angelical, Cratera dos Cristais Violeta e Portão Ígneo. Enfrente 5 territórios de nível Mega com drop de DigiEggs e DATA: MetalGarurumon (Nv. 50–51), Sakuyamon (Nv. 52–53), Gryphonmon (Nv. 54–55), Dukemon (Nv. 56–57) e Griffomon (Nv. 58–60).',
    categories: ['mundo'],
    mapCoords: { x: 36.8, y: 75.2 },
    npcs: REAL_DIGIMON_ISLAND_NPCS,
    enemies: REAL_DIGIMON_ISLAND_ENEMIES,
    rewards: [
      {
        id: 'island-bits',
        label: 'Bits Mega',
        detail: '290 a 410+ Bits por Digimon Mega derrotado',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'island-exp',
        label: 'EXP Lv. 50–60',
        detail: '6.900 a 12.480 EXP base para o topo do estágio Mega',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'island-item',
        label: 'DigiEggs & Evoluter',
        detail: 'Drop de DigiEggs (Gabumon, Renamon, Hawkmon, Guilmon, Biyomon), DATA e Evoluter',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'island-crystal',
        label: 'Cidadela & Santuário',
        detail: 'Cidadela Cristalina, Estátua Angelical, Cratera Violeta e Portão Ígneo',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [],
  },
  {
    id: DARK_AREA_MAP_ID,
    playableMapId: DARK_AREA_MAP_ID,
    implemented: true,
    bannerUrl: DARK_AREA_BANNER_URL,
    thumbUrl: DARK_AREA_BANNER_URL,
    name: 'Área Sombria',
    subtitle: 'Nv. 60 ~ 70 · 5 Bandos Mega (35 Mobs)',
    zoneType: 'Área de Caça',
    minLevel: 60,
    maxLevel: 70,
    recommendedLevel: 'Lv. 60 ~ 70',
    description:
      'Domínio crepuscular cercado pela Torre Acorrentada, Ponte Abissal, Cascatas Violeta e Cidadela Sombria. Enfrente 5 territórios de nível Mega com drop de DigiEggs e DATA: MetalEtemon (Nv. 60–61), Boltmon (Nv. 62–63), GranKuwagamon (Nv. 64–65), Beelzemon (Nv. 66–67) e Diaboromon (Nv. 68–70).',
    categories: ['mundo'],
    mapCoords: { x: 20.8, y: 21.8 },
    npcs: REAL_DARK_AREA_NPCS,
    enemies: REAL_DARK_AREA_ENEMIES,
    rewards: [
      {
        id: 'dark-bits',
        label: 'Bits Mega+',
        detail: '430 a 620+ Bits por Digimon Mega derrotado',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'dark-exp',
        label: 'EXP Lv. 60–70',
        detail: '12.900 a 22.300 EXP base para o endgame Mega',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'dark-item',
        label: 'DigiEggs & Evoluter',
        detail: 'Drop de DigiEggs (Gotsumon, DemiMeramon, Kunemon, Impmon, Keramon), DATA e Evoluter',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'dark-crystal',
        label: 'Cidadela & Torres',
        detail: 'Torre Acorrentada, Cascatas Violetas, Penhasco Flutuante e Cidadela Sombria',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [],
  },
  {
    id: VIRTUAL_WORLD_MAP_ID,
    playableMapId: VIRTUAL_WORLD_MAP_ID,
    implemented: true,
    bannerUrl: VIRTUAL_WORLD_BANNER_URL,
    thumbUrl: VIRTUAL_WORLD_BANNER_URL,
    name: 'Mundo Virtual',
    subtitle: 'Nv. 70 ~ 80 · 5 Bandos Mega (35 Mobs)',
    zoneType: 'Área de Caça',
    minLevel: 70,
    maxLevel: 80,
    recommendedLevel: 'Lv. 70 ~ 80',
    description:
      'O ápice do Mundo Digital: arquipélago cibernético de ilhas flutuantes ligadas ao Núcleo da Cidadela Virtual. Enfrente os 5 Megas lendários com drop de DigiEggs, DATA e Evoluter: HiAndromon (Nv. 70–71), SaberLeomon (Nv. 72–73), HerculesKabuterimon (Nv. 74–75), MetalGarurumon (Nv. 76–77) e WarGreymon (Nv. 78–80).',
    categories: ['mundo'],
    mapCoords: { x: 55.6, y: 79.5 },
    npcs: REAL_VIRTUAL_WORLD_NPCS,
    enemies: REAL_VIRTUAL_WORLD_ENEMIES,
    rewards: [
      {
        id: 'vw-bits',
        label: 'Bits Supremos',
        detail: '560 a 820+ Bits por Digimon Mega derrotado',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'vw-exp',
        label: 'EXP Lv. 70–80',
        detail: '23.500 a 40.000 EXP base para o endgame supremo',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'vw-item',
        label: 'DigiEggs & Evoluter',
        detail:
          'Drop de DigiEggs (Drimogemon, Elecmon, Tentomon, Gabumon, Agumon Clássico), DATA e Evoluter',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'vw-crystal',
        label: 'Núcleo Virtual',
        detail:
          'Bosque Violeta, Circuito Oeste, Cascata de Dados, Portal Cristalino e Cidadela Central',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [],
  },

  // =========================================================================
  // EVENTS TAB (HONESTLY MARKED AS SCHEDULED / LOCKED)
  // =========================================================================
  {
    id: 'plains-invasion',
    playableMapId: null,
    implemented: false,
    bannerUrl: '/assets/map/region_dark_area.png',
    thumbUrl: '/assets/map/region_dark_area.png',
    name: 'Cratera de Invasão',
    subtitle: 'Evento Sazonal · Em breve',
    zoneType: 'Evento Especial',
    minLevel: 15,
    maxLevel: 30,
    recommendedLevel: 'Lv. 15 ~ 30',
    description:
      'Zona vulcânica reservada para futuros eventos temporários e invasões de chefes. Nenhum evento está ativo no momento.',
    categories: ['eventos'],
    mapCoords: { x: 82.0, y: 66.5 },
    npcs: [],
    enemies: [],
    rewards: [
      {
        id: 'evt-bits',
        label: 'Bits Bônus',
        detail: 'Recompensa prevista durante eventos ativos',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'evt-exp',
        label: 'EXP Bônus',
        detail: 'Bônus de experiência previsto em eventos',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'evt-item',
        label: 'Caixas',
        detail: 'Itens comemorativos planejados',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'evt-crystal',
        label: 'Cristais',
        detail: 'Prêmios especiais de invasão',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [
      {
        id: 'evt-none',
        title: 'Nenhum evento ativo no momento',
        summary: 'Novos eventos sazonais aparecerão aqui quando ativados.',
      },
    ],
  },

  // =========================================================================
  // DUNGEON TAB (PLANNED INSTANCED DUNGEONS · HONESTLY MARKED AS UPCOMING)
  // =========================================================================
  {
    id: 'dungeon-data-cavern',
    playableMapId: null,
    implemented: false,
    bannerUrl: '/assets/map/region_virtual_world.png',
    thumbUrl: '/assets/map/region_virtual_world.png',
    name: 'Caverna de Dados',
    subtitle: 'Dungeon · Em desenvolvimento',
    zoneType: 'Dungeon',
    minLevel: 20,
    maxLevel: 35,
    recommendedLevel: 'Lv. 20 ~ 35',
    description:
      'Masmorra instanciada em desenvolvimento para grupos de Tamers. Enfrente ondas de Digimons corrompidos e um chefe final para conquistar recompensas especiais.',
    categories: ['dungeon'],
    mapCoords: { x: 35.5, y: 31.0 },
    npcs: [],
    enemies: [],
    rewards: [
      {
        id: 'dg1-bits',
        label: 'Bits de Dungeon',
        detail: 'Recompensa prevista ao concluir a masmorra',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'dg1-exp',
        label: 'EXP de Masmorra',
        detail: 'Bônus de experiência previsto para Lv. 20 ~ 35',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'dg1-item',
        label: 'Baú de Chefe',
        detail: 'Itens e materiais raros previstos em futuras atualizações',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'dg1-crystal',
        label: 'Cristais de Dados',
        detail: 'Recursos especiais de Dungeon planejados',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [
      {
        id: 'dg1-soon',
        title: 'Dungeon em preparação',
        summary: 'Esta masmorra ainda não foi liberada nesta versão do jogo.',
      },
    ],
  },
  {
    id: 'dungeon-chaos-fortress',
    playableMapId: null,
    implemented: false,
    bannerUrl: '/assets/map/region_dark_area.png',
    thumbUrl: '/assets/map/region_dark_area.png',
    name: 'Fortaleza do Caos',
    subtitle: 'Dungeon Avançada · Em desenvolvimento',
    zoneType: 'Dungeon',
    minLevel: 40,
    maxLevel: 60,
    recommendedLevel: 'Lv. 40 ~ 60',
    description:
      'Masmorra de alta dificuldade reservada para Digimons Ultimate e Mega. Será liberada em futuras atualizações com chefes cooperativos.',
    categories: ['dungeon'],
    mapCoords: { x: 24.0, y: 24.5 },
    npcs: [],
    enemies: [],
    rewards: [
      {
        id: 'dg2-bits',
        label: 'Bits Elevados',
        detail: 'Recompensas previstas para Dungeon avançada',
        kind: 'bits',
        iconUrl: REWARD_ICONS.bits,
      },
      {
        id: 'dg2-exp',
        label: 'EXP Avançada',
        detail: 'Treinamento previsto para Lv. 40 ~ 60',
        kind: 'exp',
        iconUrl: REWARD_ICONS.exp,
      },
      {
        id: 'dg2-item',
        label: 'Relíquias',
        detail: 'Equipamentos e selos planejados para masmorras',
        kind: 'item',
        iconUrl: REWARD_ICONS.item,
      },
      {
        id: 'dg2-crystal',
        label: 'Núcleos Raros',
        detail: 'Prêmios especiais de chefe de Dungeon',
        kind: 'crystal',
        iconUrl: REWARD_ICONS.crystal,
      },
    ],
    staticMissions: [
      {
        id: 'dg2-soon',
        title: 'Dungeon em preparação',
        summary: 'Esta masmorra ainda não foi liberada nesta versão do jogo.',
      },
    ],
  },
] as const;

export function getRegionAccessState(
  region: WorldMapRegion,
  currentMapId: PlayableMapId,
  playerLevel: number,
  isGM = false
): RegionAccessState {
  if (region.implemented && region.playableMapId === currentMapId) {
    return 'current';
  }
  if (!region.implemented || !region.playableMapId) {
    return 'upcoming';
  }
  if (playerLevel < region.minLevel && !isGM) {
    return 'level-locked';
  }
  return 'available';
}

export function getRegionLiveMissions(
  region: WorldMapRegion,
  discoveredZoneCount: number,
  defeatedTotal: number
): WorldMapMissionSummary[] {
  if (region.playableMapId === DATS_MAP_ID) {
    const total = DATS_INTERACTION_POINTS.length;
    const completed = discoveredZoneCount >= total;
    return [
      {
        id: 'dats-recon',
        title: 'Reconhecimento do DATS Center',
        summary: 'Visite os pontos luminosos da praça para registrá-los.',
        progressText: `${discoveredZoneCount}/${total} pontos`,
        completed,
      },
    ];
  }

  if (region.playableMapId === D_TERMINAL_MAP_ID) {
    return [
      {
        id: 'd-terminal-hub',
        title: 'Estação Central D-Terminal',
        summary:
          'Fale com o Condutor PawnChessmon (Black) na frente do trem Trailmon para escolher sua próxima área de caça.',
        progressText: 'Zona Segura',
        completed: true,
      },
    ];
  }

  if (region.playableMapId === HUNTING_MAP_ID) {
    return [
      {
        id: 'plains-patrol',
        title: 'Patrulha na Planície Digital',
        summary: 'Derrote Digimons selvagens fora da Área Segura.',
        progressText: `${defeatedTotal} abates`,
        completed: defeatedTotal >= 10,
      },
    ];
  }

  if (region.playableMapId === DATA_FOREST_MAP_ID) {
    return [
      {
        id: 'forest-raid',
        title: 'Cerco à Grande Árvore · Boss Kuwagamon',
        summary:
          'Upe nos 5 bandos da Floresta (Nv. 10–20) e junte-se a outros Tamers para derrotar o Raid Boss Kuwagamon.',
        progressText: 'Raid Aberta',
        completed: false,
      },
    ];
  }

  if (region.playableMapId === DIGI_MOUNTAIN_MAP_ID) {
    return [
      {
        id: 'digi-mountain-ascent',
        title: 'Ascensão à Fortaleza da Montanha Digi',
        summary:
          'Explore as pontes, a Caverna de Cristais Roxos e derrote Meramon, Digmon, Kabuterimon, Chrysalimon e Veedramon.',
        progressText: `${defeatedTotal} abates`,
        completed: defeatedTotal >= 25,
      },
    ];
  }

  if (region.playableMapId === DIGITAL_DESERT_MAP_ID) {
    return [
      {
        id: 'digital-desert-expedition',
        title: 'Expedição à Pirâmide do Deserto Digital',
        summary:
          'Explore o Oásis Central, Caverna Violeta, Fóssil Ancestral e enfrente os Ultimates IceLeomon, Insekimon, SkullMeramon, Cyberdramon e WarGrowlmon.',
        progressText: `${defeatedTotal} abates`,
        completed: defeatedTotal >= 35,
      },
    ];
  }

  if (region.playableMapId === DATA_SEA_MAP_ID) {
    return [
      {
        id: 'data-sea-expedition',
        title: 'Conquista do Arquipélago Mar de Dados',
        summary:
          'Atravesse as pontes do arquipélago até o Castelo Cristalino e derrote MetalGreymon, Giromon, Garudamon, SkullSatamon e Okuwamon.',
        progressText: `${defeatedTotal} abates`,
        completed: defeatedTotal >= 35,
      },
    ];
  }

  if (region.playableMapId === DIGIMON_ISLAND_MAP_ID) {
    return [
      {
        id: 'digimon-island-expedition',
        title: 'Domínio da Ilha dos Digimons',
        summary:
          'Explore o Santuário Angelical, a Cratera Violeta, o Portão Ígneo e a Cidadela Cristalina enfrentando MetalGarurumon, Sakuyamon, Gryphonmon, Dukemon e Griffomon.',
        progressText: `${defeatedTotal} abates`,
        completed: defeatedTotal >= 35,
      },
    ];
  }

  if (region.playableMapId === DARK_AREA_MAP_ID) {
    return [
      {
        id: 'dark-area-expedition',
        title: 'Incursão na Área Sombria',
        summary:
          'Atravesse a Ponte Abissal, a Torre Acorrentada e a Cidadela Sombria derrotando MetalEtemon, Boltmon, GranKuwagamon, Beelzemon e Diaboromon.',
        progressText: `${defeatedTotal} abates`,
        completed: defeatedTotal >= 35,
      },
    ];
  }

  if (region.playableMapId === VIRTUAL_WORLD_MAP_ID) {
    return [
      {
        id: 'virtual-world-expedition',
        title: 'Conquista do Mundo Virtual',
        summary:
          'Domine o Bosque Violeta, o Circuito Oeste, o Santuário da Cascata, o Portal Cristalino e o Núcleo Central derrotando HiAndromon, SaberLeomon, HerculesKabuterimon, MetalGarurumon e WarGreymon.',
        progressText: `${defeatedTotal} abates`,
        completed: defeatedTotal >= 35,
      },
    ];
  }

  return [...region.staticMissions];
}
