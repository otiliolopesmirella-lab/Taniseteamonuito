import {
  DATA_FOREST_BOSS_TEMPLATE,
  DATA_FOREST_HABITAT_PACKS,
  DATA_FOREST_MAP_ID,
} from '../maps/dataForestMap';
import {
  DIGI_MOUNTAIN_HABITAT_PACKS,
  DIGI_MOUNTAIN_MAP_ID,
} from '../maps/digiMountainMap';
import {
  DIGITAL_DESERT_HABITAT_PACKS,
  DIGITAL_DESERT_MAP_ID,
} from '../maps/digitalDesertMap';
import {
  DATA_SEA_HABITAT_PACKS,
  DATA_SEA_MAP_ID,
} from '../maps/dataSeaMap';
import {
  DIGIMON_ISLAND_HABITAT_PACKS,
  DIGIMON_ISLAND_MAP_ID,
} from '../maps/digimonIslandMap';
import {
  DARK_AREA_HABITAT_PACKS,
  DARK_AREA_MAP_ID,
} from '../maps/darkAreaMap';
import {
  VIRTUAL_WORLD_HABITAT_PACKS,
  VIRTUAL_WORLD_MAP_ID,
} from '../maps/virtualWorldMap';
import {
  HUNTING_HABITAT_PACKS,
  HUNTING_MAP_ID,
  type WildMonsterSpecies,
} from '../maps/huntingFieldMap';
import { getWildDigimonPortraitUrl } from '../sprites/wildDigimonSprites';
import type { InventoryItem } from '../types/hud';

export interface AutoHuntConfig {
  enabled: boolean;
  targetSpecies: WildMonsterSpecies[];
  autoHpEnabled: boolean;
  hpThresholdPct: number;
  autoDsEnabled: boolean;
  dsThresholdPct: number;
}

export interface AutoHuntMobCatalogEntry {
  species: WildMonsterSpecies;
  displayName: string;
  levelLabel: string;
  habitatName: string;
  portraitUrl: string;
  isBoss?: boolean;
}

export interface AutoHuntMapGroup {
  mapId:
    | typeof HUNTING_MAP_ID
    | typeof DATA_FOREST_MAP_ID
    | typeof DIGI_MOUNTAIN_MAP_ID
    | typeof DIGITAL_DESERT_MAP_ID
    | typeof DATA_SEA_MAP_ID
    | typeof DIGIMON_ISLAND_MAP_ID
    | typeof DARK_AREA_MAP_ID
    | typeof VIRTUAL_WORLD_MAP_ID;
  mapName: string;
  levelRangeLabel: string;
  mobs: readonly AutoHuntMobCatalogEntry[];
}

export const AUTO_HUNT_THRESHOLD_PRESETS = [20, 35, 50, 70, 85] as const;

export const DEFAULT_AUTO_HUNT_CONFIG: AutoHuntConfig = {
  enabled: false,
  targetSpecies: [],
  autoHpEnabled: true,
  hpThresholdPct: 70,
  autoDsEnabled: true,
  dsThresholdPct: 35,
};

function formatLevelRange(minLv: number, maxLv: number): string {
  return minLv === maxLv ? `Nv. ${minLv}` : `Nv. ${minLv}–${maxLv}`;
}

export const AUTO_HUNT_MAP_GROUPS: readonly AutoHuntMapGroup[] = [
  {
    mapId: HUNTING_MAP_ID,
    mapName: 'Planície Digital',
    levelRangeLabel: 'Nv. 1–10',
    mobs: HUNTING_HABITAT_PACKS.map((pack) => ({
      species: pack.species,
      displayName: pack.displayName,
      levelLabel: formatLevelRange(pack.levelMin, pack.levelMax),
      habitatName: pack.habitatName,
      portraitUrl:
        getWildDigimonPortraitUrl(pack.species) ?? `/assets/digimon/${pack.species}.png`,
    })),
  },
  {
    mapId: DATA_FOREST_MAP_ID,
    mapName: 'Floresta de Dados',
    levelRangeLabel: 'Nv. 10–20 + Raid',
    mobs: [
      ...DATA_FOREST_HABITAT_PACKS.map((pack) => ({
        species: pack.species,
        displayName: pack.displayName,
        levelLabel: formatLevelRange(pack.levelMin, pack.levelMax),
        habitatName: pack.habitatName,
        portraitUrl:
          getWildDigimonPortraitUrl(pack.species) ?? `/assets/digimon/${pack.species}.png`,
      })),
      {
        species: DATA_FOREST_BOSS_TEMPLATE.species,
        displayName: `${DATA_FOREST_BOSS_TEMPLATE.name} (Boss)`,
        levelLabel: `Boss Nv. ${DATA_FOREST_BOSS_TEMPLATE.level}`,
        habitatName: 'Altar da Grande Árvore',
        portraitUrl:
          getWildDigimonPortraitUrl(DATA_FOREST_BOSS_TEMPLATE.species) ??
          '/assets/sprites/mobs/kuwagamon.png?v=hd2',
        isBoss: true,
      },
    ],
  },
  {
    mapId: DIGI_MOUNTAIN_MAP_ID,
    mapName: 'Montanha Digi',
    levelRangeLabel: 'Nv. 20–30',
    mobs: DIGI_MOUNTAIN_HABITAT_PACKS.map((pack) => ({
      species: pack.species,
      displayName: pack.displayName,
      levelLabel: formatLevelRange(pack.levelMin, pack.levelMax),
      habitatName: pack.habitatName,
      portraitUrl:
        getWildDigimonPortraitUrl(pack.species) ?? `/assets/digimon/${pack.species}.png`,
    })),
  },
  {
    mapId: DIGITAL_DESERT_MAP_ID,
    mapName: 'Deserto Digital',
    levelRangeLabel: 'Nv. 30–40',
    mobs: DIGITAL_DESERT_HABITAT_PACKS.map((pack) => ({
      species: pack.species,
      displayName: pack.displayName,
      levelLabel: formatLevelRange(pack.levelMin, pack.levelMax),
      habitatName: pack.habitatName,
      portraitUrl:
        getWildDigimonPortraitUrl(pack.species) ?? `/assets/digimon/${pack.species}.png`,
    })),
  },
  {
    mapId: DATA_SEA_MAP_ID,
    mapName: 'Mar de Dados',
    levelRangeLabel: 'Nv. 40–50',
    mobs: DATA_SEA_HABITAT_PACKS.map((pack) => ({
      species: pack.species,
      displayName: pack.displayName,
      levelLabel: formatLevelRange(pack.levelMin, pack.levelMax),
      habitatName: pack.habitatName,
      portraitUrl:
        getWildDigimonPortraitUrl(pack.species) ?? `/assets/digimon/${pack.species}.png`,
    })),
  },
  {
    mapId: DIGIMON_ISLAND_MAP_ID,
    mapName: 'Ilha dos Digimons',
    levelRangeLabel: 'Nv. 50–60',
    mobs: DIGIMON_ISLAND_HABITAT_PACKS.map((pack) => ({
      species: pack.species,
      displayName: pack.displayName,
      levelLabel: formatLevelRange(pack.levelMin, pack.levelMax),
      habitatName: pack.habitatName,
      portraitUrl:
        getWildDigimonPortraitUrl(pack.species) ?? `/assets/digimon/${pack.species}.png`,
    })),
  },
  {
    mapId: DARK_AREA_MAP_ID,
    mapName: 'Área Sombria',
    levelRangeLabel: 'Nv. 60–70',
    mobs: DARK_AREA_HABITAT_PACKS.map((pack) => ({
      species: pack.species,
      displayName: pack.displayName,
      levelLabel: formatLevelRange(pack.levelMin, pack.levelMax),
      habitatName: pack.habitatName,
      portraitUrl:
        getWildDigimonPortraitUrl(pack.species) ?? `/assets/digimon/${pack.species}.png`,
    })),
  },
  {
    mapId: VIRTUAL_WORLD_MAP_ID,
    mapName: 'Mundo Virtual',
    levelRangeLabel: 'Nv. 70–80',
    mobs: VIRTUAL_WORLD_HABITAT_PACKS.map((pack) => ({
      species: pack.species,
      displayName: pack.displayName,
      levelLabel: formatLevelRange(pack.levelMin, pack.levelMax),
      habitatName: pack.habitatName,
      portraitUrl:
        getWildDigimonPortraitUrl(pack.species) ?? `/assets/digimon/${pack.species}.png`,
    })),
  },
] as const;

const VALID_SPECIES_SET = new Set<WildMonsterSpecies>(
  AUTO_HUNT_MAP_GROUPS.flatMap((group) => group.mobs.map((m) => m.species))
);

const AUTO_HUNT_STORAGE_PREFIX = 'dw_auto_hunt_config_v1_';

function getStorageKey(accountKey: string): string {
  const safe = accountKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `${AUTO_HUNT_STORAGE_PREFIX}${safe || 'default'}`;
}

export function clampThresholdPct(raw: unknown, fallback: number): number {
  const num = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(num)) return fallback;
  const snapped = Math.round(num / 5) * 5;
  return Math.max(10, Math.min(90, snapped));
}

export function sanitizeAutoHuntConfig(raw: unknown): AutoHuntConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_AUTO_HUNT_CONFIG };
  }
  const obj = raw as Record<string, unknown>;
  const rawTargets = Array.isArray(obj.targetSpecies) ? obj.targetSpecies : [];
  const dedupedTargets: WildMonsterSpecies[] = [];
  for (const s of rawTargets) {
    if (
      typeof s === 'string' &&
      VALID_SPECIES_SET.has(s as WildMonsterSpecies) &&
      !dedupedTargets.includes(s as WildMonsterSpecies)
    ) {
      dedupedTargets.push(s as WildMonsterSpecies);
    }
  }
  return {
    enabled: Boolean(obj.enabled),
    targetSpecies: dedupedTargets,
    autoHpEnabled:
      typeof obj.autoHpEnabled === 'boolean'
        ? obj.autoHpEnabled
        : DEFAULT_AUTO_HUNT_CONFIG.autoHpEnabled,
    hpThresholdPct: clampThresholdPct(
      obj.hpThresholdPct,
      DEFAULT_AUTO_HUNT_CONFIG.hpThresholdPct
    ),
    autoDsEnabled:
      typeof obj.autoDsEnabled === 'boolean'
        ? obj.autoDsEnabled
        : DEFAULT_AUTO_HUNT_CONFIG.autoDsEnabled,
    dsThresholdPct: clampThresholdPct(
      obj.dsThresholdPct,
      DEFAULT_AUTO_HUNT_CONFIG.dsThresholdPct
    ),
  };
}

export function loadAutoHuntConfig(accountKey: string): AutoHuntConfig {
  try {
    const raw = window.localStorage.getItem(getStorageKey(accountKey));
    if (!raw) return { ...DEFAULT_AUTO_HUNT_CONFIG };
    return sanitizeAutoHuntConfig(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_AUTO_HUNT_CONFIG };
  }
}

export function saveAutoHuntConfig(accountKey: string, config: AutoHuntConfig): void {
  try {
    const clean = sanitizeAutoHuntConfig(config);
    window.localStorage.setItem(getStorageKey(accountKey), JSON.stringify(clean));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Picks the best matching consumable for the missing HP or DS:
 * prefers the smallest potion/food that covers most of the deficit (avoiding wasting Premium Bread for a tiny scratch),
 * falling back to the strongest available item when deficit is large.
 */
export function pickBestRecoveryItem(
  inventory: readonly InventoryItem[],
  kind: 'hp' | 'ds',
  missingAmount: number
): InventoryItem | null {
  const candidates = inventory.filter((item) => {
    if (item.quantity <= 0) return false;
    return kind === 'hp' ? (item.hpRestore ?? 0) > 0 : (item.dsRestore ?? 0) > 0;
  });
  if (candidates.length === 0) return null;

  const getValue = (item: InventoryItem) =>
    kind === 'hp' ? item.hpRestore ?? 0 : item.dsRestore ?? 0;

  const sorted = [...candidates].sort((a, b) => getValue(a) - getValue(b));
  const covering = sorted.find((item) => getValue(item) >= Math.max(1, missingAmount * 0.75));
  return covering ?? sorted[sorted.length - 1];
}

export function countRecoveryItems(
  inventory: readonly InventoryItem[],
  kind: 'hp' | 'ds'
): number {
  return inventory.reduce((sum, item) => {
    if (item.quantity <= 0) return sum;
    const match = kind === 'hp' ? (item.hpRestore ?? 0) > 0 : (item.dsRestore ?? 0) > 0;
    return match ? sum + item.quantity : sum;
  }, 0);
}
