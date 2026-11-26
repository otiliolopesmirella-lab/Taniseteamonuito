import { createInventoryPayloadFromCatalog } from '../data/itemsCatalog';
import {
  addInventoryItem,
  BASIC_BITS_SHOP_ITEMS,
  INVENTORY_DEFAULT_UNLOCKED_SLOTS,
} from './hudGameService';
import type { InventoryItem, ItemRarity } from '../types/hud';

export interface DigimonDropEntry {
  /** Identificador unico do item (DATA, DigiEgg ou item existente do jogo) */
  itemKey: string;
  /** Chance individual entre 0.0 e 1.0 (ex: 0.05 = 5%) */
  chance: number;
  minQuantity: number;
  maxQuantity: number;
  /** Grupo opcional para evitar drops simultaneos redundantes */
  rollGroup?: 'consumable' | 'data' | 'egg' | 'evoluter';
  /** Se definido (ex: 5), o drop so pode ser rolado por jogadores no Top N do ranking de dano da Raid */
  maxRaidRank?: number;
  /** Permite manter o drop do DigiEgg mapeado para quando o Digimon se tornar jogavel */
  enabled?: boolean;
}

export interface RollDropsOptions {
  /** Posicao 1-indexada do jogador no ranking de dano da Raid (1 = 1o lugar) */
  raidDamageRank?: number | null;
}

export interface DigimonDropTableConfig {
  species: string;
  displayName: string;
  /** Quantidade maxima de entradas diferentes que podem cair em um unico abate */
  maxDropsPerKill?: number;
  entries: DigimonDropEntry[];
}

export interface RolledDropReward {
  itemKey: string;
  name: string;
  quantity: number;
  iconUrl?: string;
  rarity: ItemRarity;
  category: InventoryItem['category'];
  payload: Omit<InventoryItem, 'id'>;
}

export interface ApplyDropsResult {
  nextInventory: InventoryItem[];
  grantedDrops: RolledDropReward[];
  skippedFullDrops: RolledDropReward[];
}

/**
 * Configuracao individual e editavel das tabelas de drop de cada Digimon.
 *
 * Estimativa de farm (com HP/DE/ATK reajustados — ~330 a ~450 abates/hora por mapa):
 * - Evoluter: 0,1% a 0,15% em monstros comuns · 10% no Boss Raid Kuwagamon (apenas Top 5 de dano).
 * - DATA: 17,5% a 24,5% em monstros comuns (~80 DATAs por ~1h de farm) · 65% (2–4x) no Boss Raid Kuwagamon.
 * - DigiEggs Mercenarios: 0,66% a 0,92% combinados por abate (~3 DigiEggs a partir de ~1h de farm) · 9%/6% no Boss Raid.
 * - Consumiveis: comidas de HP e vitaminas de DS da MudFrigimon em taxas raras,
 *   incentivando o comercio na loja do DATS Center.
 */
export const DIGIMON_DROP_TABLES: Record<string, DigimonDropTableConfig> = {
  // === PLANICIE DIGITAL (Nv. 1-10 — ~440 abates/h -> ~80 DATA/h · ~3 Eggs/h) ===
  drimogemon: {
    species: 'drimogemon',
    displayName: 'Drimogemon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.001, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_rock', chance: 0.175, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_drimogemon', chance: 0.0066, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_stick_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_small_a', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  gotsumon: {
    species: 'gotsumon',
    displayName: 'Gotsumon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.001, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_rock', chance: 0.178, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_gotsumon', chance: 0.0066, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_stick_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_small_a', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  kiwimon: {
    species: 'kiwimon',
    displayName: 'Kiwimon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.001, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_bird', chance: 0.18, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_biyomon', chance: 0.0068, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_stick_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_small_a', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  hawkmon: {
    species: 'hawkmon',
    displayName: 'Hawkmon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.001, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_bird', chance: 0.184, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_hawkmon', chance: 0.0046, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'digiegg_biyomon', chance: 0.0022, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'digiegg_patamon', chance: 0.0028, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_stick_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_small_a', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  monodramon: {
    species: 'monodramon',
    displayName: 'Monodramon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.001, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_dragon', chance: 0.188, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_monodramon', chance: 0.007, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_red_bean_bread', chance: 0.04, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_small_a', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },

  // === FLORESTA DE DADOS (Nv. 10-20 — ~395 abates/h -> ~80 DATA/h · ~3 Eggs/h) ===
  impmon: {
    species: 'impmon',
    displayName: 'Impmon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.001, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_devil', chance: 0.195, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_impmon', chance: 0.0074, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_red_bean_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_small_b', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  renamon: {
    species: 'renamon',
    displayName: 'Renamon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.001, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_beast', chance: 0.198, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_renamon', chance: 0.0046, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'digiegg_elecmon', chance: 0.0029, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'digiegg_salamon', chance: 0.0028, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_red_bean_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_small_b', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  guilmon: {
    species: 'guilmon',
    displayName: 'Guilmon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.001, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_dragon', chance: 0.2, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_guilmon', chance: 0.0076, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_red_bean_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_small_b', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  garurumon: {
    species: 'garurumon',
    displayName: 'Garurumon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.001, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_beast', chance: 0.204, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_gabumon', chance: 0.0047, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'digiegg_elecmon', chance: 0.003, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_cream_bread', chance: 0.04, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_small_b', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  greymon: {
    species: 'greymon',
    displayName: 'Greymon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.001, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_fire', chance: 0.208, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_agumon_classic', chance: 0.0078, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_cream_bread', chance: 0.04, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_small_b', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },

  // === RAID BOSS: KUWAGAMON (Nv. 20 · Respawn 1h · Evoluter 10% apenas Top 5 do Ranking) ===
  kuwagamon: {
    species: 'kuwagamon',
    displayName: 'Kuwagamon (Boss Raid)',
    maxDropsPerKill: 4,
    entries: [
      { itemKey: 'evoluter', chance: 0.1, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', maxRaidRank: 5, enabled: true },
      { itemKey: 'data_insect', chance: 0.65, minQuantity: 2, maxQuantity: 4, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_tentomon', chance: 0.09, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'digiegg_kunemon', chance: 0.06, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'digiegg_patamon', chance: 0.06, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_butter_bread', chance: 0.5, minQuantity: 1, maxQuantity: 2, enabled: true },
      { itemKey: 'vitamin_small_c', chance: 0.5, minQuantity: 1, maxQuantity: 2, enabled: true },
    ],
  },

  // === MONTANHA DIGI (Nv. 20–30 — ~360 abates/h -> ~80 DATA/h · ~3 Eggs/h) ===
  meramon: {
    species: 'meramon',
    displayName: 'Meramon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.001, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_fire', chance: 0.215, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_demimeramon', chance: 0.0081, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_cream_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_small_c', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  digmon: {
    species: 'digmon',
    displayName: 'Digmon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.001, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_rock', chance: 0.218, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_drimogemon', chance: 0.0082, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_cream_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_small_c', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  kabuterimon: {
    species: 'kabuterimon',
    displayName: 'Kabuterimon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.001, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_insect', chance: 0.222, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_tentomon', chance: 0.0043, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'digiegg_kunemon', chance: 0.004, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_cream_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_small_c', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  chrysalimon: {
    species: 'chrysalimon',
    displayName: 'Chrysalimon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.001, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_devil', chance: 0.225, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_keramon', chance: 0.0045, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'digiegg_kunemon', chance: 0.0039, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_butter_bread', chance: 0.04, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_medium_a', chance: 0.03, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  veedramon: {
    species: 'veedramon',
    displayName: 'Veedramon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.001, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_dragon', chance: 0.228, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_veemon', chance: 0.0085, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_butter_bread', chance: 0.04, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_medium_a', chance: 0.03, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },

  // === DESERTO DIGITAL (Nv. 30–40 — ~330 abates/h -> ~80 DATA/h · ~3 Eggs/h) ===
  iceleomon: {
    species: 'iceleomon',
    displayName: 'IceLeomon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0012, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_beast', chance: 0.232, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_elecmon', chance: 0.0087, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_milk_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_medium_a', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  insekimon: {
    species: 'insekimon',
    displayName: 'Insekimon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0012, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_rock', chance: 0.236, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_gotsumon', chance: 0.0088, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'digiegg_starmon', chance: 0.0034, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_milk_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_medium_a', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  skullmeramon: {
    species: 'skullmeramon',
    displayName: 'SkullMeramon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0012, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_fire', chance: 0.24, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_demimeramon', chance: 0.0089, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_toasted_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_medium_b', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  cyberdramon: {
    species: 'cyberdramon',
    displayName: 'Cyberdramon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0014, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_dragon', chance: 0.242, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_monodramon', chance: 0.009, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_toasted_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_medium_b', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  megalogrowlmon: {
    species: 'megalogrowlmon',
    displayName: 'WarGrowlmon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0015, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_dragon', chance: 0.245, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_guilmon', chance: 0.0092, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_corn_bread', chance: 0.04, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_medium_c', chance: 0.03, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },

  // === MAR DE DADOS (Nv. 40–50 — ~310 abates/h -> ~80 DATA/h · ~3 Eggs/h) ===
  metalgreymon: {
    species: 'metalgreymon',
    displayName: 'MetalGreymon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0016, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_dragon', chance: 0.25, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_agumon_classic', chance: 0.0094, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_corn_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_medium_c', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  giromon: {
    species: 'giromon',
    displayName: 'Giromon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0016, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_rock', chance: 0.254, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_drimogemon', chance: 0.0096, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'digiegg_starmon', chance: 0.0038, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_multi_grain_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_a', chance: 0.03, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  garudamon: {
    species: 'garudamon',
    displayName: 'Garudamon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0017, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_bird', chance: 0.258, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_biyomon', chance: 0.0098, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_multi_grain_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_a', chance: 0.032, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  skullsatamon: {
    species: 'skullsatamon',
    displayName: 'SkullSatamon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0018, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_devil', chance: 0.262, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_impmon', chance: 0.01, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_premium_bread', chance: 0.04, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_b', chance: 0.03, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  okuwamon: {
    species: 'okuwamon',
    displayName: 'Okuwamon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.002, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_insect', chance: 0.266, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_kunemon', chance: 0.0102, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_premium_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_b', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },

  // === ILHA DOS DIGIMONS (Nv. 50–60 — ~290 abates/h -> ~80 DATA/h · ~3 Eggs/h) ===
  metalgarurumon: {
    species: 'metalgarurumon',
    displayName: 'MetalGarurumon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0022, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_beast', chance: 0.272, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_gabumon', chance: 0.0104, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_multi_grain_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_a', chance: 0.035, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  sakuyamon: {
    species: 'sakuyamon',
    displayName: 'Sakuyamon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0024, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_beast', chance: 0.276, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_renamon', chance: 0.0106, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'digiegg_salamon', chance: 0.0048, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_multi_grain_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_a', chance: 0.038, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  gryphonmon: {
    species: 'gryphonmon',
    displayName: 'Gryphonmon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0025, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_bird', chance: 0.28, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_hawkmon', chance: 0.0108, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'digiegg_patamon', chance: 0.0048, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_premium_bread', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_b', chance: 0.036, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  dukemon: {
    species: 'dukemon',
    displayName: 'Dukemon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0026, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_dragon', chance: 0.284, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_guilmon', chance: 0.011, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_premium_bread', chance: 0.048, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_b', chance: 0.038, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  griffomon: {
    species: 'griffomon',
    displayName: 'Griffomon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0028, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_bird', chance: 0.288, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_biyomon', chance: 0.0112, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_premium_bread', chance: 0.05, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_b', chance: 0.04, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },

  // === ÁREA SOMBRIA (Nv. 60–70 — ~270 abates/h -> ~80 DATA/h · ~3 Eggs/h) ===
  metaletemon: {
    species: 'metaletemon',
    displayName: 'MetalEtemon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.003, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_rock', chance: 0.292, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_gotsumon', chance: 0.0114, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_multi_grain_bread', chance: 0.048, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_a', chance: 0.038, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  boltmon: {
    species: 'boltmon',
    displayName: 'Boltmon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0032, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_fire', chance: 0.296, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_demimeramon', chance: 0.0116, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_premium_bread', chance: 0.046, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_b', chance: 0.038, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  grankuwagamon: {
    species: 'grankuwagamon',
    displayName: 'GranKuwagamon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0034, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_insect', chance: 0.3, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_kunemon', chance: 0.0118, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_premium_bread', chance: 0.048, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_b', chance: 0.04, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  beelzemon: {
    species: 'beelzemon',
    displayName: 'Beelzemon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0036, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_devil', chance: 0.304, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_impmon', chance: 0.012, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_premium_bread', chance: 0.05, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_b', chance: 0.042, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  diaboromon: {
    species: 'diaboromon',
    displayName: 'Diaboromon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.004, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_devil', chance: 0.308, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_keramon', chance: 0.0124, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_premium_bread', chance: 0.052, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_b', chance: 0.045, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  // === Mundo Virtual (Lv. 70–80 · Megas Finais) ===
  hiandromon: {
    species: 'hiandromon',
    displayName: 'HiAndromon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0042, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_rock', chance: 0.312, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_drimogemon', chance: 0.0128, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'digiegg_starmon', chance: 0.0052, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_premium_bread', chance: 0.054, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_b', chance: 0.046, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  saberleomon: {
    species: 'saberleomon',
    displayName: 'SaberLeomon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0044, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_beast', chance: 0.316, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_elecmon', chance: 0.013, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_premium_bread', chance: 0.056, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_b', chance: 0.048, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  herculeskabuterimon: {
    species: 'herculeskabuterimon',
    displayName: 'HerculesKabuterimon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.0046, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_insect', chance: 0.32, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_tentomon', chance: 0.0132, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_premium_bread', chance: 0.058, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_b', chance: 0.05, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
  wargreymon: {
    species: 'wargreymon',
    displayName: 'WarGreymon',
    maxDropsPerKill: 3,
    entries: [
      { itemKey: 'evoluter', chance: 0.005, minQuantity: 1, maxQuantity: 1, rollGroup: 'evoluter', enabled: true },
      { itemKey: 'data_dragon', chance: 0.328, minQuantity: 1, maxQuantity: 1, rollGroup: 'data', enabled: true },
      { itemKey: 'digiegg_agumon_classic', chance: 0.0138, minQuantity: 1, maxQuantity: 1, rollGroup: 'egg', enabled: true },
      { itemKey: 'food_premium_bread', chance: 0.062, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
      { itemKey: 'vitamin_high_b', chance: 0.054, minQuantity: 1, maxQuantity: 1, rollGroup: 'consumable', enabled: true },
    ],
  },
};

export function registerDigimonDropTable(config: DigimonDropTableConfig): void {
  DIGIMON_DROP_TABLES[config.species.toLowerCase()] = config;
}

export function getDigimonDropTable(species: string): DigimonDropTableConfig | null {
  return DIGIMON_DROP_TABLES[species.toLowerCase()] ?? null;
}

function buildPayloadForDropKey(
  itemKey: string,
  quantity: number
): Omit<InventoryItem, 'id'> | null {
  const catalogPayload = createInventoryPayloadFromCatalog(itemKey, quantity);
  if (catalogPayload) return catalogPayload;

  const shopTpl = BASIC_BITS_SHOP_ITEMS.find((i) => i.itemKey === itemKey);
  if (shopTpl) {
    return {
      itemKey: shopTpl.itemKey,
      name: shopTpl.name,
      category: shopTpl.category,
      quantity,
      description: shopTpl.description,
      rarity: shopTpl.category === 'equip' ? 'incomum' : 'comum',
      hpRestore: shopTpl.hpRestore,
      dsRestore: shopTpl.dsRestore,
      equipSlot: shopTpl.equipSlot,
      statBonuses: shopTpl.statBonuses,
    };
  }

  return null;
}

function rollInt(min: number, max: number, rng: () => number): number {
  const lo = Math.max(1, Math.round(min));
  const hi = Math.max(lo, Math.round(max));
  if (lo === hi) return lo;
  return lo + Math.floor(rng() * (hi - lo + 1));
}

/**
 * Executa uma rolagem unica e livre de duplicacoes para a tabela de drop de um Digimon.
 */
export function rollDropsForSpecies(
  species: string,
  rng: () => number = Math.random,
  options?: RollDropsOptions
): RolledDropReward[] {
  const table = getDigimonDropTable(species);
  if (!table) return [];

  const maxDrops = table.maxDropsPerKill ?? table.entries.length;
  const usedGroups = new Set<string>();
  const rewardsByKey = new Map<string, RolledDropReward>();

  for (const entry of table.entries) {
    if (entry.enabled === false) continue;
    if (rewardsByKey.size >= maxDrops) break;
    if (entry.rollGroup && usedGroups.has(entry.rollGroup)) continue;

    // Restricao de ranking da Raid (ex: Evoluter 10% apenas para o Top 5 de dano no Kuwagamon)
    if (entry.maxRaidRank !== undefined) {
      const rank = options?.raidDamageRank;
      if (typeof rank !== 'number' || rank < 1 || rank > entry.maxRaidRank) {
        continue;
      }
    }

    const clampedChance = Math.max(0, Math.min(1, entry.chance));
    if (clampedChance <= 0 || rng() >= clampedChance) continue;

    const qty = rollInt(entry.minQuantity, entry.maxQuantity, rng);
    const payload = buildPayloadForDropKey(entry.itemKey, qty);
    if (!payload) continue;

    if (entry.rollGroup) {
      usedGroups.add(entry.rollGroup);
    }

    const existing = rewardsByKey.get(entry.itemKey);
    if (existing) {
      existing.quantity += qty;
      existing.payload = {
        ...existing.payload,
        quantity: existing.quantity,
      };
    } else {
      rewardsByKey.set(entry.itemKey, {
        itemKey: payload.itemKey,
        name: payload.name,
        quantity: qty,
        iconUrl: payload.iconUrl,
        rarity: payload.rarity ?? 'comum',
        category: payload.category,
        payload,
      });
    }
  }

  return Array.from(rewardsByKey.values());
}

/**
 * Rola e aplica os drops de um Digimon derrotado diretamente no inventario do jogador.
 */
export function rollAndApplyDigimonDrops(
  currentInventory: InventoryItem[],
  species: string,
  rng: () => number = Math.random,
  maxUnlockedSlots: number = INVENTORY_DEFAULT_UNLOCKED_SLOTS,
  options?: RollDropsOptions
): ApplyDropsResult {
  const rolled = rollDropsForSpecies(species, rng, options);
  let nextInventory = currentInventory;
  const grantedDrops: RolledDropReward[] = [];
  const skippedFullDrops: RolledDropReward[] = [];

  for (const drop of rolled) {
    const res = addInventoryItem(nextInventory, drop.payload, maxUnlockedSlots);
    if (res.added) {
      nextInventory = res.next;
      grantedDrops.push(drop);
    } else {
      skippedFullDrops.push(drop);
    }
  }

  return {
    nextInventory,
    grantedDrops,
    skippedFullDrops,
  };
}
