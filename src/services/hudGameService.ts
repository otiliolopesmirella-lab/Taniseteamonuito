import {
  getDigimonFormProfile,
  getEvolutionChainForStarter,
  resolveActiveFormProfile,
  resolveStarterIdForForm,
  type DigimonEvolutionStage,
  type DigimonFormId,
  type DigimonFormProfile,
  type StarterDigimonId,
} from '../types/digimon';
import type {
  AccountHudPersistence,
  ComputedDigimonAttributes,
  ComputedTamerAttributes,
  DigimonRuntimeStats,
  EquipmentSlotId,
  HatchQualityGrade,
  InventoryItem,
  TamerRuntimeStats,
} from '../types/hud';
import {
  clampHatchSizePct,
  computeHatchPowerMultiplier,
  enrichInventoryItem,
  EVOLUTER_ITEM_KEY,
  getHatchQualityProfile,
  isRemovedLegacyItemKey,
  rollHatchSizePct,
  sanitizeInventoryItems,
} from '../data/itemsCatalog';
import { computeDmoSkillDamageBreakdown } from '../data/dmoSkillCatalog';
import {
  ARCHIVE_DEFAULT_UNLOCKED_SLOTS,
  getUnlockedArchiveSlots,
  sanitizeDigimonArchive,
  sanitizePartyDigimons,
} from './archiveService';
import {
  getCachedCloudHudStateForAccount,
  scheduleHudStateSync,
} from './cloudSaveService';
import {
  isValidAvatarPhotoDataUrl,
  isValidCoverPhotoDataUrl,
} from '../utils/avatarPhoto';

const HUD_PERSISTENCE_PREFIX = 'dw_digital_war_hud_v1_';

let pendingLocalHudSaveKey: string | null = null;
let pendingLocalHudSaveState: AccountHudPersistence | null = null;
let localHudSaveTimer: number | null = null;
let localHudFlushListenersRegistered = false;

export function flushPendingLocalHudSave(): void {
  if (localHudSaveTimer !== null) {
    window.clearTimeout(localHudSaveTimer);
    localHudSaveTimer = null;
  }
  if (!pendingLocalHudSaveKey || !pendingLocalHudSaveState) return;
  const key = pendingLocalHudSaveKey;
  const stateToWrite = pendingLocalHudSaveState;
  pendingLocalHudSaveKey = null;
  pendingLocalHudSaveState = null;
  try {
    window.localStorage.setItem(key, JSON.stringify(stateToWrite));
  } catch {
    // Ignore private storage quota errors cleanly
  }
}

function ensureLocalHudFlushListeners(): void {
  if (localHudFlushListenersRegistered || typeof window === 'undefined') return;
  localHudFlushListenersRegistered = true;
  window.addEventListener('pagehide', flushPendingLocalHudSave);
  window.addEventListener('beforeunload', flushPendingLocalHudSave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushPendingLocalHudSave();
    }
  });
}

export const INVENTORY_TOTAL_SLOTS = 100;
export const INVENTORY_DEFAULT_UNLOCKED_SLOTS = 25;
export const INVENTORY_MAX_SLOTS = INVENTORY_DEFAULT_UNLOCKED_SLOTS;

export function getUnlockedInventorySlots(
  source?: Pick<AccountHudPersistence, 'unlockedInventorySlots'> | number | null
): number {
  const raw =
    typeof source === 'number' ? source : source?.unlockedInventorySlots;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return INVENTORY_DEFAULT_UNLOCKED_SLOTS;
  }
  return Math.max(
    INVENTORY_DEFAULT_UNLOCKED_SLOTS,
    Math.min(INVENTORY_TOTAL_SLOTS, Math.floor(raw))
  );
}

export const SKILL_F1_DS_COST = 12;
export const SKILL_F2_DS_COST = 20;
export const SKILL_F1_COOLDOWN_SEC = 4.5;
export const SKILL_F2_COOLDOWN_SEC = 9.0;

export const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlotId, string> = {
  head: 'Chapéu / Boné',
  top: 'Jaqueta / Camisa',
  gloves: 'Luvas',
  bottom: 'Calça / Bermudas',
  shoes: 'Botas / Tênis',
  necklace: 'Colar',
  ring: 'Anel',
  digivice: 'Digivice',
  cape: 'Capa',
  crest: 'Brasão',
};

export const MAX_GAME_LEVEL = 200;

/**
 * Curva DMO Hardcore (difícil, porém justa e sem estourar limites do servidor):
 * - Nv. 1–10: dezenas de abates para dominar a Planície Digital.
 * - Nv. 15–40: progressão firme entre Floresta, Montanha e Deserto.
 * - Nv. 85 → 90: ~19M EXP acumulada (~7 a 9 horas de hunt intensa em Party de 4 jogadores).
 * - Nv. 200: ~59.3M EXP (Tamer) / ~76.6M EXP (Digimon), seguro dentro de <= 100M no Firestore.
 */
export function calcTamerExpToNext(level: number): number {
  const x = Math.max(0, Math.min(MAX_GAME_LEVEL, level) - 1);
  return Math.round(420 + 36 * Math.pow(x, 2.35) + 0.032 * Math.pow(x, 4));
}

export function calcDigimonExpToNext(level: number): number {
  const x = Math.max(0, Math.min(MAX_GAME_LEVEL, level) - 1);
  return Math.round(300 + 42 * Math.pow(x, 2.35) + 0.042 * Math.pow(x, 4));
}

/**
 * Authentic Digimon Masters Online (DMO) level-difference EXP scaling:
 * - Hunting stronger mobs (+1 to +3+ Lv) grants a modest bonus (1.06x - 1.20x).
 * - Hunting mobs at your level (-1 to 0) gives 100% base EXP.
 * - Hunting weaker mobs suffers steep diminishing returns so players advance across maps,
 *   while high-tier endgame mobs (Lv 35+ in Deserto Digital) retain a 25% minimum floor
 *   so high-level grinding (Lv 50-90+) remains viable without breaking progression.
 */
export function calcDmoKillExp(
  baseExp: number,
  actorLevel: number,
  mobLevel: number
): number {
  const diff = mobLevel - actorLevel;
  let multiplier = 1.0;
  if (diff >= 3) multiplier = 1.2;
  else if (diff === 2) multiplier = 1.12;
  else if (diff === 1) multiplier = 1.06;
  else if (diff >= -1) multiplier = 1.0;
  else if (diff === -2) multiplier = 0.8;
  else if (diff === -3) multiplier = 0.55;
  else if (diff === -4) multiplier = 0.34;
  else if (diff === -5) multiplier = 0.2;
  else multiplier = mobLevel >= 35 ? 0.25 : 0.08;

  return Math.max(1, Math.round(baseExp * multiplier));
}

export function calcTamerMaxHp(level: number): number {
  return 160 + (level - 1) * 14;
}

export function calcTamerMaxDs(level: number): number {
  return 100 + (level - 1) * 10;
}

export function calcDigimonMaxHp(
  level: number,
  formId: DigimonFormId = 'agumon',
  hatchGrade: HatchQualityGrade = 3,
  hatchSizePct?: number
): number {
  const s = getDigimonFormProfile(formId).baseStats;
  const lvOffset = Math.max(0, level - 1);
  const mult = computeHatchPowerMultiplier(hatchGrade, hatchSizePct);
  return Math.round((s.hpBase + lvOffset * s.hpPerLv) * mult);
}

export function calcDigimonMaxDs(
  level: number,
  formId: DigimonFormId = 'agumon',
  hatchGrade: HatchQualityGrade = 3,
  hatchSizePct?: number
): number {
  const s = getDigimonFormProfile(formId).baseStats;
  const lvOffset = Math.max(0, level - 1);
  const mult = computeHatchPowerMultiplier(hatchGrade, hatchSizePct);
  return Math.round((s.dsBase + lvOffset * s.dsPerLv) * mult);
}

/**
 * Computes real unified Tamer attributes from Tamer level + equipped gear in `equippedItems`.
 * Grounded early-launch progression leaving clean room for future accessories and upgrades.
 */
export function computeTamerAttributes(
  tamer: TamerRuntimeStats,
  equippedItems: Partial<Record<EquipmentSlotId, InventoryItem>>
): ComputedTamerAttributes {
  let bonusHp = 0;
  let bonusDs = 0;
  let bonusAtk = 0;
  let bonusDef = 0;
  let bonusSpd = 0;
  let bonusCrit = 0;
  let bonusAcc = 0;
  let bonusEva = 0;

  for (const item of Object.values(equippedItems)) {
    if (!item?.statBonuses) continue;
    bonusHp += item.statBonuses.hp ?? 0;
    bonusDs += item.statBonuses.ds ?? 0;
    bonusAtk += item.statBonuses.attack ?? 0;
    bonusDef += item.statBonuses.defense ?? 0;
    bonusSpd += item.statBonuses.speed ?? 0;
    bonusCrit += item.statBonuses.critRate ?? 0;
    bonusAcc += item.statBonuses.accuracy ?? 0;
    bonusEva += item.statBonuses.evasion ?? 0;
  }

  const lvOffset = Math.max(0, tamer.level - 1);
  const maxHp = calcTamerMaxHp(tamer.level) + bonusHp;
  const maxDs = calcTamerMaxDs(tamer.level) + bonusDs;

  return {
    hp: Math.min(maxHp, tamer.hp),
    maxHp,
    ds: Math.min(maxDs, tamer.ds),
    maxDs,
    attack: Math.round(12 + lvOffset * 2 + bonusAtk),
    defense: Math.round(8 + lvOffset * 1.5 + bonusDef),
    speed: Math.round(165 + lvOffset * 1 + bonusSpd),
    critRate: Number(Math.min(45, 2.0 + lvOffset * 0.05 + bonusCrit).toFixed(1)),
    accuracy: Math.round(65 + lvOffset * 2.5 + bonusAcc),
    evasion: Number(Math.min(40, 2.0 + lvOffset * 0.05 + bonusEva).toFixed(1)),
  };
}

export interface DigimonEvolutionStageSpec {
  formId?: DigimonFormId;
  stage: DigimonEvolutionStage;
  name: string;
  unlockLevel: number;
  /** Official DMO Wiki Evoluter cost to unlock this stage (0 = free by level). */
  evoluterCost: number;
  playable: boolean;
}

/**
 * Savers Starter Digimon lines (Agumon, Gaomon, Lalamon) unlock all stages for 0 Evoluters,
 * matching official Digimon Masters Online (DMO Wiki) rules.
 */
export const STARTER_FREE_EVOLUTION_IDS: ReadonlySet<StarterDigimonId> = new Set([
  'agumon',
  'gaomon',
  'lalamon',
]);

export function isStarterFreeEvolutionLine(starterId: StarterDigimonId): boolean {
  return STARTER_FREE_EVOLUTION_IDS.has(starterId);
}

/**
 * Official DMO Wiki Evoluter requirements for all 18 playable Digimon lines:
 * - Savers Starters (Agumon, Gaomon, Lalamon): 0 / 0 / 0 / 0 (free by level)
 * - Iconic / High-Tier Mercenaries (Agumon Classic, Gabumon, Guilmon, Impmon, Veemon, Keramon, Renamon, Monodramon):
 *   Rookie 0 · Champion 0 · Ultimate 3 · Mega 8
 * - Standard Mercenaries (Tentomon, DemiMeramon, Hawkmon, Drimogemon, Kiwimon, Gotsumon, Elecmon):
 *   Rookie 0 · Champion 0 · Ultimate 3 · Mega 6
 */
export const DIGIMON_EVOLUTION_CHAINS: Record<
  StarterDigimonId,
  readonly DigimonEvolutionStageSpec[]
> = {
  // === SAVERS STARTERS (0 Evoluters — Gratuito por Nível) ===
  agumon: [
    { formId: 'agumon', stage: 'Rookie', name: 'Agumon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'geogreymon', stage: 'Champion', name: 'GeoGreymon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'rizegreymon', stage: 'Ultimate', name: 'RizeGreymon', unlockLevel: 30, evoluterCost: 0, playable: true },
    { formId: 'shinegreymon', stage: 'Mega', name: 'ShineGreymon', unlockLevel: 50, evoluterCost: 0, playable: true },
  ],
  gaomon: [
    { formId: 'gaomon', stage: 'Rookie', name: 'Gaomon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'gaogamon', stage: 'Champion', name: 'Gaogamon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'machgaogamon', stage: 'Ultimate', name: 'MachGaogamon', unlockLevel: 30, evoluterCost: 0, playable: true },
    { formId: 'miragegaogamon', stage: 'Mega', name: 'MirageGaogamon', unlockLevel: 50, evoluterCost: 0, playable: true },
  ],
  lalamon: [
    { formId: 'lalamon', stage: 'Rookie', name: 'Lalamon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'sunflowmon', stage: 'Champion', name: 'Sunflowmon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'lilamon', stage: 'Ultimate', name: 'Lilamon', unlockLevel: 30, evoluterCost: 0, playable: true },
    { formId: 'rosemon', stage: 'Mega', name: 'Rosemon', unlockLevel: 50, evoluterCost: 0, playable: true },
  ],

  // === MERCENÁRIOS (Ultimate: 3 Evoluters · Mega: 8 Evoluters — DMO Wiki) ===
  agumon_classic: [
    { formId: 'agumon_classic', stage: 'Rookie', name: 'Agumon (Clássico)', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'greymon', stage: 'Champion', name: 'Greymon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'metalgreymon', stage: 'Ultimate', name: 'MetalGreymon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'wargreymon', stage: 'Mega', name: 'WarGreymon', unlockLevel: 50, evoluterCost: 8, playable: true },
  ],
  gabumon: [
    { formId: 'gabumon', stage: 'Rookie', name: 'Gabumon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'garurumon', stage: 'Champion', name: 'Garurumon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'weregarurumon', stage: 'Ultimate', name: 'WereGarurumon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'metalgarurumon', stage: 'Mega', name: 'MetalGarurumon', unlockLevel: 50, evoluterCost: 8, playable: true },
  ],
  guilmon: [
    { formId: 'guilmon', stage: 'Rookie', name: 'Guilmon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'growlmon', stage: 'Champion', name: 'Growlmon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'megalogrowlmon', stage: 'Ultimate', name: 'WarGrowlmon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'dukemon', stage: 'Mega', name: 'Dukemon', unlockLevel: 50, evoluterCost: 8, playable: true },
  ],
  impmon: [
    { formId: 'impmon', stage: 'Rookie', name: 'Impmon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'icedevimon', stage: 'Champion', name: 'IceDevimon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'skullsatamon', stage: 'Ultimate', name: 'SkullSatamon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'beelzemon', stage: 'Mega', name: 'Beelzemon', unlockLevel: 50, evoluterCost: 8, playable: true },
  ],
  veemon: [
    { formId: 'veemon', stage: 'Rookie', name: 'Veemon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'veedramon', stage: 'Champion', name: 'Veedramon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'aeroveedramon', stage: 'Ultimate', name: 'AeroVeedramon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'ulforceveedramon', stage: 'Mega', name: 'UlforceVeedramon', unlockLevel: 50, evoluterCost: 8, playable: true },
  ],
  keramon: [
    { formId: 'keramon', stage: 'Rookie', name: 'Keramon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'chrysalimon', stage: 'Champion', name: 'Chrysalimon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'infermon', stage: 'Ultimate', name: 'Infermon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'diaboromon', stage: 'Mega', name: 'Diaboromon', unlockLevel: 50, evoluterCost: 8, playable: true },
  ],
  renamon: [
    { formId: 'renamon', stage: 'Rookie', name: 'Renamon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'kyubimon', stage: 'Champion', name: 'Kyubimon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'taomon', stage: 'Ultimate', name: 'Taomon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'sakuyamon', stage: 'Mega', name: 'Sakuyamon', unlockLevel: 50, evoluterCost: 8, playable: true },
  ],
  monodramon: [
    { formId: 'monodramon', stage: 'Rookie', name: 'Monodramon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'strikedramon', stage: 'Champion', name: 'Strikedramon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'cyberdramon', stage: 'Ultimate', name: 'Cyberdramon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'justimon', stage: 'Mega', name: 'Justimon', unlockLevel: 50, evoluterCost: 8, playable: true },
  ],

  // === MERCENÁRIOS (Ultimate: 3 Evoluters · Mega: 6 Evoluters — DMO Wiki) ===
  tentomon: [
    { formId: 'tentomon', stage: 'Rookie', name: 'Tentomon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'kabuterimon', stage: 'Champion', name: 'Kabuterimon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'megakabuterimon', stage: 'Ultimate', name: 'MegaKabuterimon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'herculeskabuterimon', stage: 'Mega', name: 'HerculesKabuterimon', unlockLevel: 50, evoluterCost: 6, playable: true },
  ],
  demimeramon: [
    { formId: 'demimeramon', stage: 'Rookie', name: 'DemiMeramon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'meramon', stage: 'Champion', name: 'Meramon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'skullmeramon', stage: 'Ultimate', name: 'SkullMeramon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'boltmon', stage: 'Mega', name: 'Boltmon', unlockLevel: 50, evoluterCost: 6, playable: true },
  ],
  hawkmon: [
    { formId: 'hawkmon', stage: 'Rookie', name: 'Hawkmon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'aquilamon', stage: 'Champion', name: 'Aquilamon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'silphymon', stage: 'Ultimate', name: 'Silphymon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'gryphonmon', stage: 'Mega', name: 'Gryphonmon', unlockLevel: 50, evoluterCost: 6, playable: true },
  ],
  drimogemon: [
    { formId: 'drimogemon', stage: 'Rookie', name: 'Drimogemon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'digmon', stage: 'Champion', name: 'Digmon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'giromon', stage: 'Ultimate', name: 'Giromon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'hiandromon', stage: 'Mega', name: 'HiAndromon', unlockLevel: 50, evoluterCost: 6, playable: true },
  ],
  kiwimon: [
    { formId: 'kiwimon', stage: 'Rookie', name: 'Kiwimon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'deramon', stage: 'Champion', name: 'Deramon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'blossomon', stage: 'Ultimate', name: 'Blossomon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'griffomon', stage: 'Mega', name: 'Griffomon', unlockLevel: 50, evoluterCost: 6, playable: true },
  ],
  gotsumon: [
    { formId: 'gotsumon', stage: 'Rookie', name: 'Gotsumon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'icemon', stage: 'Champion', name: 'Icemon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'insekimon', stage: 'Ultimate', name: 'Insekimon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'metaletemon', stage: 'Mega', name: 'MetalEtemon', unlockLevel: 50, evoluterCost: 6, playable: true },
  ],
  elecmon: [
    { formId: 'elecmon', stage: 'Rookie', name: 'Elecmon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'leomon', stage: 'Champion', name: 'Leomon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'iceleomon', stage: 'Ultimate', name: 'IceLeomon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'saberleomon', stage: 'Mega', name: 'SaberLeomon', unlockLevel: 50, evoluterCost: 6, playable: true },
  ],
  biyomon: [
    { formId: 'biyomon', stage: 'Rookie', name: 'Biyomon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'birdramon', stage: 'Champion', name: 'Birdramon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'garudamon', stage: 'Ultimate', name: 'Garudamon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'phoenixmon', stage: 'Mega', name: 'Phoenixmon', unlockLevel: 50, evoluterCost: 6, playable: true },
  ],
  kunemon: [
    { formId: 'kunemon', stage: 'Rookie', name: 'Kunemon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'flymon', stage: 'Champion', name: 'Flymon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'okuwamon', stage: 'Ultimate', name: 'Okuwamon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'grankuwagamon', stage: 'Mega', name: 'GranKuwagamon', unlockLevel: 50, evoluterCost: 6, playable: true },
  ],
  salamon: [
    { formId: 'salamon', stage: 'Rookie', name: 'Salamon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'gatomon', stage: 'Champion', name: 'Gatomon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'angewomon', stage: 'Ultimate', name: 'Angewomon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'magnadramon', stage: 'Mega', name: 'Magnadramon', unlockLevel: 50, evoluterCost: 8, playable: true },
  ],
  patamon: [
    { formId: 'patamon', stage: 'Rookie', name: 'Patamon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'angemon', stage: 'Champion', name: 'Angemon', unlockLevel: 15, evoluterCost: 0, playable: true },
    { formId: 'magnaangemon', stage: 'Ultimate', name: 'MagnaAngemon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'seraphimon', stage: 'Mega', name: 'Seraphimon', unlockLevel: 50, evoluterCost: 8, playable: true },
  ],
  starmon: [
    { formId: 'starmon', stage: 'Rookie', name: 'Starmon', unlockLevel: 1, evoluterCost: 0, playable: true },
    { formId: 'superstarmon', stage: 'Ultimate', name: 'SuperStarmon', unlockLevel: 30, evoluterCost: 3, playable: true },
    { formId: 'justimon', stage: 'Mega', name: 'Justimon', unlockLevel: 50, evoluterCost: 8, playable: true },
  ],
};

/**
 * Derives balanced Digimon Masters-inspired base attributes directly from the active species curve,
 * Digimon level, modest Tamer synergy, and defeated enemies bond.
 * Intentionally grounded for a freshly launched RPG (Rookie Lv.1 ~300 CP -> Mega Lv.50 ~5,200 CP)
 * so future Accessories, Clones, Seals, and Chips have meaningful progression room.
 */
export function computeDerivedDigimonAttributes(
  tamerAttrs: ComputedTamerAttributes,
  digimon: DigimonRuntimeStats,
  defeatedEnemiesTotal = 0,
  formId?: DigimonFormId
): ComputedDigimonAttributes {
  const effectiveForm = getDigimonFormProfile(
    formId ?? digimon.activeFormId ?? 'agumon'
  );
  const s = effectiveForm.baseStats;
  const digiLvOffset = Math.max(0, digimon.level - 1);
  const qualityProfile = getHatchQualityProfile(digimon.hatchGrade);
  const effectiveSizePct = clampHatchSizePct(qualityProfile.grade, digimon.hatchSizePct);
  const qualityMult = computeHatchPowerMultiplier(qualityProfile.grade, effectiveSizePct);

  // Modest Tamer synergy (25% of Tamer AT/DE + Tamer gear bonuses above base)
  const attackBonusFromTamer = Math.round(tamerAttrs.attack * 0.25);
  const defenseBonusFromTamer = Math.round(tamerAttrs.defense * 0.25);
  const tamerGearCritBonus = Math.max(0, tamerAttrs.critRate - 2.0);
  const tamerGearEvaBonus = Math.max(0, tamerAttrs.evasion - 2.0);
  const tamerGearHitBonus = Math.max(0, tamerAttrs.accuracy - 65);

  const attack = Math.round(
    (s.atBase + digiLvOffset * s.atPerLv) * qualityMult + attackBonusFromTamer
  );
  const defense = Math.round(
    (s.deBase + digiLvOffset * s.dePerLv) * qualityMult + defenseBonusFromTamer
  );
  const speed = Math.round(
    (168 + digiLvOffset * 1.2 + Math.max(0, tamerAttrs.speed - 165) * 0.4) *
      effectiveForm.spdMult *
      qualityMult
  );
  const attackSpeed = Number(s.asSec.toFixed(2));

  const critRateTotal = Number(
    Math.min(
      60,
      (s.ctBase + digiLvOffset * s.ctPerLv) * qualityMult + tamerGearCritBonus * 0.65
    ).toFixed(2)
  );
  const accuracy = Math.round(
    (s.htBase + digiLvOffset * s.htPerLv) * qualityMult + tamerGearHitBonus * 0.6
  );
  const evasion = Number(
    Math.min(
      50,
      (s.evBase + digiLvOffset * s.evPerLv) * qualityMult + tamerGearEvaBonus * 0.65
    ).toFixed(2)
  );
  const blockRate = Number(
    Math.min(45, (s.blBase + digiLvOffset * s.blPerLv) * qualityMult).toFixed(2)
  );

  // Unified DMO skill damage formula matching the Digimon Tab Skill Inspector & live combat
  const totalBasicDamage = Math.max(16, Math.round(attack * 1.0));
  const f1Breakdown = computeDmoSkillDamageBreakdown(
    effectiveForm.id,
    'f1',
    attack,
    digimon.level,
    qualityProfile.grade,
    effectiveSizePct
  );
  const f2Breakdown = computeDmoSkillDamageBreakdown(
    effectiveForm.id,
    'f2',
    attack,
    digimon.level,
    qualityProfile.grade,
    effectiveSizePct
  );
  const totalSpecial1Damage = f1Breakdown.neutral;
  const totalSpecial2Damage = f2Breakdown.neutral;

  // Grounded Combat Power (Rookie Lv.1 ~310 · Champion Lv.15 ~1,120 · Ultimate Lv.30 ~2,480 · Mega Lv.50 ~5,250)
  const expectedMaxHp = calcDigimonMaxHp(
    digimon.level,
    effectiveForm.id,
    qualityProfile.grade,
    effectiveSizePct
  );
  const expectedMaxDs = calcDigimonMaxDs(
    digimon.level,
    effectiveForm.id,
    qualityProfile.grade,
    effectiveSizePct
  );
  const combatPower = Math.round(
    expectedMaxHp * 0.45 +
      expectedMaxDs * 0.25 +
      attack * 3.8 +
      defense * 2.8 +
      accuracy * 0.45 +
      critRateTotal * 4.5 +
      evasion * 3.5 +
      blockRate * 3.0
  );

  // Bond scales organically from real partner level & battles won together
  const bondPct = Math.min(100, 10 + digiLvOffset * 6 + defeatedEnemiesTotal * 4);
  const bondLabel =
    bondPct >= 100
      ? 'Afinidade Máxima!'
      : bondPct >= 65
        ? 'Forte Conexão!'
        : bondPct >= 35
          ? 'Parceiros em Sintonia'
          : 'Vínculo Inicial';
  const starRank = Math.max(1, Math.min(5, Math.ceil(bondPct / 20)));

  return {
    attack,
    defense,
    speed,
    attackSpeed,
    accuracy,
    evasion,
    blockRate,
    attackBonusFromTamer,
    defenseBonusFromTamer,
    critRateTotal,
    totalBasicDamage,
    totalSpecial1Damage,
    totalSpecial2Damage,
    combatPower,
    bondPct,
    bondLabel,
    starRank,
  };
}

export function getEvolutionStageSpec(
  starterId: StarterDigimonId,
  formId: DigimonFormId
): DigimonEvolutionStageSpec | undefined {
  return (DIGIMON_EVOLUTION_CHAINS[starterId] ?? []).find(
    (step) => step.formId === formId
  );
}

export function getFormEvoluterCost(
  starterId: StarterDigimonId,
  formId: DigimonFormId
): number {
  return getEvolutionStageSpec(starterId, formId)?.evoluterCost ?? 0;
}

export function getOwnedEvoluterCount(
  inventory: readonly InventoryItem[]
): number {
  let total = 0;
  for (const item of inventory) {
    if (item.itemKey === EVOLUTER_ITEM_KEY && item.quantity > 0) {
      total += item.quantity;
    }
  }
  return total;
}

/**
 * Computes the sanitized list of permanently unlocked evolution form IDs for a Digimon:
 * - Always unlocks free stages (evoluterCost === 0) once `level >= unlockLevel`.
 * - Preserves any paid Evoluter stages already present in `rawUnlockedFormIds` (so unlocks persist forever!).
 * - If `activeFormId` is already equipped on a legacy/GM save, keeps it unlocked so the partner is never broken.
 */
export function sanitizeUnlockedFormIdsForDigimon(
  starterId: StarterDigimonId,
  level: number,
  rawUnlockedFormIds?: readonly DigimonFormId[] | readonly string[] | null,
  activeFormId?: DigimonFormId
): DigimonFormId[] {
  const specs = DIGIMON_EVOLUTION_CHAINS[starterId] ?? [];
  const rawSet = new Set<string>(
    Array.isArray(rawUnlockedFormIds) ? rawUnlockedFormIds : []
  );
  const result: DigimonFormId[] = [];
  for (const step of specs) {
    if (!step.formId) continue;
    const isFreeAtLevel = step.evoluterCost === 0 && level >= step.unlockLevel;
    const wasUnlocked = rawSet.has(step.formId);
    const isCurrentActive =
      activeFormId === step.formId && level >= step.unlockLevel;
    if (isFreeAtLevel || wasUnlocked || isCurrentActive) {
      result.push(step.formId);
    }
  }
  if (result.length === 0 && specs[0]?.formId) {
    result.push(specs[0].formId);
  }
  return result;
}

export function isEvolutionSlotUnlockedByEvoluter(
  starterId: StarterDigimonId,
  formId: DigimonFormId,
  digimon: Pick<DigimonRuntimeStats, 'unlockedFormIds' | 'activeFormId'>
): boolean {
  const cost = getFormEvoluterCost(starterId, formId);
  if (cost <= 0) return true;
  if (digimon.activeFormId === formId) return true;
  return Boolean(digimon.unlockedFormIds?.includes(formId));
}

export function getUnlockedEvolutionForms(
  starterId: StarterDigimonId,
  level: number,
  rawUnlockedFormIds?: readonly DigimonFormId[] | readonly string[] | null,
  activeFormId?: DigimonFormId
): DigimonFormProfile[] {
  const unlockedIds = new Set(
    sanitizeUnlockedFormIdsForDigimon(
      starterId,
      level,
      rawUnlockedFormIds,
      activeFormId
    )
  );
  return getEvolutionChainForStarter(starterId).filter(
    (form) => level >= form.unlockLevel && unlockedIds.has(form.id)
  );
}

/**
 * Returns the next locked/ready evolution target relative to the Digimon's current active form.
 */
export function getNextEvolutionInfo(
  starterId: StarterDigimonId,
  digimon: DigimonRuntimeStats
): {
  activeForm: DigimonFormProfile;
  nextForm: DigimonFormProfile | null;
  readyToEvolve: DigimonFormProfile | null;
  readyToUnlockWithEvoluters: DigimonFormProfile | null;
  nextEvoluterCost: number;
} {
  const activeForm = resolveActiveFormProfile(starterId, digimon.activeFormId);
  const effectiveStarterId = resolveStarterIdForForm(starterId, activeForm.id);
  const chain = getEvolutionChainForStarter(effectiveStarterId);
  const activeIdx = chain.findIndex((f) => f.id === activeForm.id);
  const nextForm =
    activeIdx >= 0 && activeIdx + 1 < chain.length ? chain[activeIdx + 1] : null;
  const nextEvoluterCost = nextForm
    ? getFormEvoluterCost(effectiveStarterId, nextForm.id)
    : 0;
  const nextLevelMet = Boolean(nextForm && digimon.level >= nextForm.unlockLevel);
  const nextSlotUnlocked = Boolean(
    nextForm &&
      isEvolutionSlotUnlockedByEvoluter(effectiveStarterId, nextForm.id, digimon)
  );
  const readyToEvolve =
    nextForm && nextLevelMet && nextSlotUnlocked ? nextForm : null;
  const readyToUnlockWithEvoluters =
    nextForm && nextLevelMet && !nextSlotUnlocked && nextEvoluterCost > 0
      ? nextForm
      : null;
  return {
    activeForm,
    nextForm,
    readyToEvolve,
    readyToUnlockWithEvoluters,
    nextEvoluterCost,
  };
}

export function unlockDigimonEvolutionWithEvoluters(
  state: AccountHudPersistence,
  starterId: StarterDigimonId,
  targetFormId: DigimonFormId
): {
  ok: boolean;
  next: AccountHudPersistence;
  unlockedForm?: DigimonFormProfile;
  spentEvoluters: number;
  error?: string;
} {
  const activeForm = resolveActiveFormProfile(
    starterId,
    state.digimon.activeFormId
  );
  const effectiveStarterId = resolveStarterIdForForm(starterId, activeForm.id);
  const chain = getEvolutionChainForStarter(effectiveStarterId);
  const targetForm = chain.find((f) => f.id === targetFormId);
  if (!targetForm) {
    return {
      ok: false,
      next: state,
      spentEvoluters: 0,
      error: 'Esta forma evolutiva não pertence ao seu Digimon parceiro.',
    };
  }

  if (state.digimon.level < targetForm.unlockLevel) {
    return {
      ok: false,
      next: state,
      spentEvoluters: 0,
      error: `Nível insuficiente! ${targetForm.name} requer Nível ${targetForm.unlockLevel} para ser desbloqueado.`,
    };
  }

  const cost = getFormEvoluterCost(effectiveStarterId, targetForm.id);
  if (
    cost <= 0 ||
    isEvolutionSlotUnlockedByEvoluter(
      effectiveStarterId,
      targetForm.id,
      state.digimon
    )
  ) {
    const synced = sanitizeUnlockedFormIdsForDigimon(
      effectiveStarterId,
      state.digimon.level,
      [...(state.digimon.unlockedFormIds ?? []), targetForm.id],
      state.digimon.activeFormId
    );
    return {
      ok: true,
      next: {
        ...state,
        digimon: {
          ...state.digimon,
          unlockedFormIds: synced,
        },
        updatedAt: new Date().toISOString(),
      },
      unlockedForm: targetForm,
      spentEvoluters: 0,
    };
  }

  const owned = getOwnedEvoluterCount(state.inventory);
  if (owned < cost) {
    return {
      ok: false,
      next: state,
      spentEvoluters: 0,
      error: `Evoluters insuficientes! ${targetForm.name} precisa de ${cost} Evoluters (você tem ${owned}).`,
    };
  }

  let remaining = cost;
  const nextInventory: InventoryItem[] = [];
  for (const item of state.inventory) {
    if (item.itemKey === EVOLUTER_ITEM_KEY && remaining > 0) {
      const take = Math.min(item.quantity, remaining);
      remaining -= take;
      const left = item.quantity - take;
      if (left > 0) {
        nextInventory.push({ ...item, quantity: left });
      }
    } else {
      nextInventory.push(item);
    }
  }

  const nextUnlockedIds = sanitizeUnlockedFormIdsForDigimon(
    effectiveStarterId,
    state.digimon.level,
    [...(state.digimon.unlockedFormIds ?? []), targetForm.id],
    state.digimon.activeFormId
  );

  return {
    ok: true,
    next: {
      ...state,
      inventory: nextInventory,
      digimon: {
        ...state.digimon,
        unlockedFormIds: nextUnlockedIds,
      },
      updatedAt: new Date().toISOString(),
    },
    unlockedForm: targetForm,
    spentEvoluters: cost,
  };
}

export function evolveDigimonAccountState(
  state: AccountHudPersistence,
  starterId: StarterDigimonId,
  targetFormId: DigimonFormId
): {
  next: AccountHudPersistence;
  evolvedForm?: DigimonFormProfile;
  needsEvoluter?: boolean;
  evoluterCost?: number;
  error?: string;
} {
  const currentForm = resolveActiveFormProfile(
    starterId,
    state.digimon.activeFormId
  );
  const effectiveStarterId = resolveStarterIdForForm(starterId, currentForm.id);
  const chain = getEvolutionChainForStarter(effectiveStarterId);
  const targetForm = chain.find((f) => f.id === targetFormId);
  if (!targetForm) {
    return {
      next: state,
      error: 'Esta forma evolutiva não pertence ao seu Digimon parceiro.',
    };
  }
  if (state.digimon.level < targetForm.unlockLevel) {
    return {
      next: state,
      error: `Nível insuficiente! ${targetForm.name} é desbloqueado no Nível ${targetForm.unlockLevel}.`,
    };
  }
  const evoluterCost = getFormEvoluterCost(effectiveStarterId, targetForm.id);
  if (
    evoluterCost > 0 &&
    !isEvolutionSlotUnlockedByEvoluter(
      effectiveStarterId,
      targetForm.id,
      state.digimon
    )
  ) {
    return {
      next: state,
      needsEvoluter: true,
      evoluterCost,
      error: `Evolução bloqueada! ${targetForm.name} precisa de ${evoluterCost} Evoluters para ser desbloqueado.`,
    };
  }
  if (currentForm.id === targetForm.id) {
    return { next: state, evolvedForm: targetForm };
  }

  const qualityGrade = getHatchQualityProfile(state.digimon.hatchGrade).grade;
  const qualitySizePct = clampHatchSizePct(qualityGrade, state.digimon.hatchSizePct);
  const nextMaxHp = calcDigimonMaxHp(state.digimon.level, targetForm.id, qualityGrade, qualitySizePct);
  const nextMaxDs = calcDigimonMaxDs(state.digimon.level, targetForm.id, qualityGrade, qualitySizePct);
  const prevMaxHp = Math.max(1, state.digimon.maxHp || nextMaxHp);
  const prevMaxDs = Math.max(1, state.digimon.maxDs || nextMaxDs);
  const currentHp = Math.max(0, Math.round(state.digimon.hp));
  const currentDs = Math.max(0, Math.round(state.digimon.ds));
  const preservedHp =
    currentHp <= 0
      ? 0
      : Math.max(
          1,
          Math.min(nextMaxHp, Math.round((currentHp / prevMaxHp) * nextMaxHp))
        );
  const preservedDs =
    currentDs <= 0
      ? 0
      : Math.max(
          1,
          Math.min(nextMaxDs, Math.round((currentDs / prevMaxDs) * nextMaxDs))
        );
  const unlockedIds = sanitizeUnlockedFormIdsForDigimon(
    effectiveStarterId,
    state.digimon.level,
    state.digimon.unlockedFormIds,
    targetForm.id
  );

  return {
    next: {
      ...state,
      digimon: {
        ...state.digimon,
        activeFormId: targetForm.id,
        unlockedFormIds: unlockedIds,
        maxHp: nextMaxHp,
        maxDs: nextMaxDs,
        // Preserve existing vitality percentage so evolving or reverting never restores HP/DS
        hp: preservedHp,
        ds: preservedDs,
      },
      updatedAt: new Date().toISOString(),
    },
    evolvedForm: targetForm,
  };
}

export function createDefaultAccountHudState(
  accountUsername: string,
  starterId: StarterDigimonId = 'agumon'
): AccountHudPersistence {
  const tamerLevel = 1;
  const digimonLevel = 1;
  const starterGrade: HatchQualityGrade = 3;
  const initialForm = getEvolutionChainForStarter(starterId)[0];
  const digiMaxHp = calcDigimonMaxHp(digimonLevel, initialForm.id, starterGrade, 100);
  const digiMaxDs = calcDigimonMaxDs(digimonLevel, initialForm.id, starterGrade, 100);
  return {
    accountUsername: accountUsername.trim() || 'tamer_local',
    tamer: {
      level: tamerLevel,
      exp: 0,
      expToNext: calcTamerExpToNext(tamerLevel),
      hp: calcTamerMaxHp(tamerLevel),
      maxHp: calcTamerMaxHp(tamerLevel),
      ds: calcTamerMaxDs(tamerLevel),
      maxDs: calcTamerMaxDs(tamerLevel),
    },
    digimon: {
      level: digimonLevel,
      exp: 0,
      expToNext: calcDigimonExpToNext(digimonLevel),
      hp: digiMaxHp,
      maxHp: digiMaxHp,
      ds: digiMaxDs,
      maxDs: digiMaxDs,
      activeFormId: initialForm.id,
      unlockedFormIds: [initialForm.id],
      hatchGrade: starterGrade,
      hatchSizePct: 100,
    },
    bits: 0,
    dCoin: 0,
    inventory: [],
    unlockedInventorySlots: INVENTORY_DEFAULT_UNLOCKED_SLOTS,
    partyDigimons: [],
    digimonArchive: [],
    unlockedArchiveSlots: ARCHIVE_DEFAULT_UNLOCKED_SLOTS,
    equippedItems: {},
    guildName: null,
    tamerPhotoUrl: null,
    tamerCoverUrl: null,
    xpBoostUntilMs: null,
    autoFarmVipUnlocked: false,
    autoFarmVipUntilMs: null,
    tutorialRewardsClaimed: { supplies: false, eggPack: false },
    defeatedEnemiesTotal: 0,
    updatedAt: new Date().toISOString(),
  };
}

function parseSafeNumericInt(
  raw: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function scoreHudProgressionCandidate(
  candidate: Partial<AccountHudPersistence> | null | undefined
): number {
  if (!candidate || typeof candidate !== 'object') return -1;
  const tamerLevel = parseSafeNumericInt(candidate.tamer?.level, 1, MAX_GAME_LEVEL, 1);
  const digimonLevel = parseSafeNumericInt(candidate.digimon?.level, 1, MAX_GAME_LEVEL, 1);
  const tamerExp = parseSafeNumericInt(candidate.tamer?.exp, 0, 1_000_000_000, 0);
  const digimonExp = parseSafeNumericInt(candidate.digimon?.exp, 0, 1_000_000_000, 0);
  const kills = parseSafeNumericInt(candidate.defeatedEnemiesTotal, 0, 1_000_000_000, 0);
  const bits = parseSafeNumericInt(candidate.bits, 0, 1_000_000_000, 0);
  const dCoin = parseSafeNumericInt(candidate.dCoin, 0, 1_000_000_000, 0);
  const invList = Array.isArray(candidate.inventory) ? candidate.inventory : [];
  const invLen = invList.length;
  const invQty = invList.reduce(
    (sum, item) => sum + (item && typeof item.quantity === 'number' && Number.isFinite(item.quantity) ? Math.max(0, Math.floor(item.quantity)) : 0),
    0
  );
  const equippedLen =
    candidate.equippedItems && typeof candidate.equippedItems === 'object'
      ? Object.values(candidate.equippedItems).filter(Boolean).length
      : 0;
  const partyLen = Array.isArray(candidate.partyDigimons) ? candidate.partyDigimons.length : 0;
  const archiveLen = Array.isArray(candidate.digimonArchive) ? candidate.digimonArchive.length : 0;
  const bagBonus = Math.max(
    0,
    getUnlockedInventorySlots(candidate.unlockedInventorySlots) - INVENTORY_DEFAULT_UNLOCKED_SLOTS
  );
  const archBonus = Math.max(
    0,
    getUnlockedArchiveSlots(candidate.unlockedArchiveSlots) - ARCHIVE_DEFAULT_UNLOCKED_SLOTS
  );
  return (
    (tamerLevel - 1) * 1_000_000 +
    (digimonLevel - 1) * 1_000_000 +
    kills * 1_000 +
    Math.min(500, Math.floor((tamerExp + digimonExp) / 10)) +
    invLen * 25 +
    Math.min(500, invQty) +
    equippedLen * 40 +
    (partyLen + archiveLen) * 60 +
    bagBonus * 5 +
    archBonus * 10 +
    (bits > 0 ? 50 : 0) +
    (dCoin > 0 ? 50 : 0)
  );
}

function parseTimestampMs(raw: unknown): number {
  if (typeof raw !== 'string' || raw.trim().length < 10) return 0;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function loadAccountHudState(
  accountUsername: string,
  starterId: StarterDigimonId = 'agumon',
  options?: { restoreFullVitalsOnSpawn?: boolean }
): AccountHudPersistence {
  const cleanUser = (accountUsername.trim() || 'tamer_local').toLowerCase();
  const restoreFullVitals = options?.restoreFullVitalsOnSpawn === true;
  try {
    let localParsed: Partial<AccountHudPersistence> | null = null;
    try {
      const raw = window.localStorage.getItem(`${HUD_PERSISTENCE_PREFIX}${cleanUser}`);
      if (raw) {
        const candidate = JSON.parse(raw) as Partial<AccountHudPersistence>;
        if (candidate && typeof candidate === 'object') {
          localParsed = candidate;
        }
      }
    } catch {
      localParsed = null;
    }

    const cloudCached = getCachedCloudHudStateForAccount(accountUsername) as
      | Partial<AccountHudPersistence>
      | null;

    if (!localParsed && !cloudCached) {
      return createDefaultAccountHudState(accountUsername, starterId);
    }

    let parsed: Partial<AccountHudPersistence>;
    if (localParsed && cloudCached) {
      const localScore = scoreHudProgressionCandidate(localParsed);
      const cloudScore = scoreHudProgressionCandidate(cloudCached);
      const localTs = parseTimestampMs(localParsed.updatedAt);
      const cloudTs = parseTimestampMs(cloudCached.updatedAt);
      const localTamerLv = parseSafeNumericInt(localParsed.tamer?.level, 1, MAX_GAME_LEVEL, 1);
      const cloudTamerLv = parseSafeNumericInt(cloudCached.tamer?.level, 1, MAX_GAME_LEVEL, 1);
      const localDigiLv = parseSafeNumericInt(localParsed.digimon?.level, 1, MAX_GAME_LEVEL, 1);
      const cloudDigiLv = parseSafeNumericInt(cloudCached.digimon?.level, 1, MAX_GAME_LEVEL, 1);
      const localKills = parseSafeNumericInt(localParsed.defeatedEnemiesTotal, 0, 1_000_000_000, 0);
      const cloudKills = parseSafeNumericInt(cloudCached.defeatedEnemiesTotal, 0, 1_000_000_000, 0);
      const localIsNewerAndNonRegressing =
        localTs > cloudTs &&
        localTamerLv >= cloudTamerLv &&
        localDigiLv >= cloudDigiLv &&
        localKills >= cloudKills;
      const cloudShouldLead =
        !localIsNewerAndNonRegressing &&
        (cloudScore > localScore || (cloudScore === localScore && cloudTs >= localTs));

      if (cloudShouldLead) {
        parsed = {
          ...localParsed,
          ...cloudCached,
          tamer: {
            ...(localParsed.tamer ?? {}),
            ...(cloudCached.tamer ?? {}),
          } as TamerRuntimeStats,
          digimon: {
            ...(localParsed.digimon ?? {}),
            ...(cloudCached.digimon ?? {}),
          } as DigimonRuntimeStats,
          partyDigimons:
            cloudCached.partyDigimons !== undefined
              ? cloudCached.partyDigimons
              : localParsed.partyDigimons,
          digimonArchive:
            cloudCached.digimonArchive !== undefined
              ? cloudCached.digimonArchive
              : localParsed.digimonArchive,
          unlockedArchiveSlots:
            cloudCached.unlockedArchiveSlots !== undefined
              ? cloudCached.unlockedArchiveSlots
              : localParsed.unlockedArchiveSlots,
          unlockedInventorySlots:
            cloudCached.unlockedInventorySlots !== undefined
              ? cloudCached.unlockedInventorySlots
              : localParsed.unlockedInventorySlots,
          tutorialRewardsClaimed:
            cloudCached.tutorialRewardsClaimed !== undefined
              ? {
                  supplies:
                    cloudCached.tutorialRewardsClaimed.supplies === true ||
                    localParsed.tutorialRewardsClaimed?.supplies === true,
                  eggPack:
                    cloudCached.tutorialRewardsClaimed.eggPack === true ||
                    localParsed.tutorialRewardsClaimed?.eggPack === true,
                }
              : localParsed.tutorialRewardsClaimed,
        };
      } else {
        parsed = {
          ...localParsed,
          dCoin:
            typeof cloudCached.dCoin === 'number' && Number.isFinite(cloudCached.dCoin)
              ? cloudCached.dCoin
              : localParsed.dCoin,
          autoFarmVipUnlocked:
            localParsed.autoFarmVipUnlocked === true ||
            cloudCached.autoFarmVipUnlocked === true,
          autoFarmVipUntilMs:
            Math.max(
              typeof localParsed.autoFarmVipUntilMs === 'number'
                ? localParsed.autoFarmVipUntilMs
                : 0,
              typeof cloudCached.autoFarmVipUntilMs === 'number'
                ? cloudCached.autoFarmVipUntilMs
                : 0
            ) || null,
          xpBoostUntilMs:
            Math.max(
              typeof localParsed.xpBoostUntilMs === 'number'
                ? localParsed.xpBoostUntilMs
                : 0,
              typeof cloudCached.xpBoostUntilMs === 'number'
                ? cloudCached.xpBoostUntilMs
                : 0
            ) || null,
        };
      }
    } else {
      parsed = (cloudCached ?? localParsed) as Partial<AccountHudPersistence>;
    }

    const fallback = createDefaultAccountHudState(accountUsername, starterId);
    const equippedItems: Partial<Record<EquipmentSlotId, InventoryItem>> = {};
    if (parsed.equippedItems && typeof parsed.equippedItems === 'object') {
      for (const [slot, item] of Object.entries(parsed.equippedItems)) {
        if (
          item &&
          typeof item === 'object' &&
          !isRemovedLegacyItemKey(item.itemKey) &&
          item.category === 'equip'
        ) {
          equippedItems[slot as EquipmentSlotId] = enrichInventoryItem(item);
        }
      }
    }
    const mergedTamer: TamerRuntimeStats = {
      ...fallback.tamer,
      ...(parsed.tamer ?? {}),
    };
    mergedTamer.level = parseSafeNumericInt(mergedTamer.level, 1, MAX_GAME_LEVEL, 1);
    const computed = computeTamerAttributes(mergedTamer, equippedItems);
    mergedTamer.expToNext = calcTamerExpToNext(mergedTamer.level);
    mergedTamer.exp = parseSafeNumericInt(
      mergedTamer.exp,
      0,
      Math.max(0, mergedTamer.expToNext - 1),
      0
    );
    mergedTamer.maxHp = computed.maxHp;
    mergedTamer.maxDs = computed.maxDs;
    const rawTamerHp = Number(parsed.tamer?.hp);
    const rawTamerDs = Number(parsed.tamer?.ds);
    if (restoreFullVitals || !Number.isFinite(rawTamerHp) || rawTamerHp <= 0) {
      mergedTamer.hp = computed.maxHp;
    } else {
      mergedTamer.hp = Math.max(1, Math.min(computed.maxHp, Math.round(rawTamerHp)));
    }
    if (restoreFullVitals || !Number.isFinite(rawTamerDs) || rawTamerDs <= 0) {
      mergedTamer.ds = computed.maxDs;
    } else {
      mergedTamer.ds = Math.max(1, Math.min(computed.maxDs, Math.round(rawTamerDs)));
    }

    const mergedDigi: DigimonRuntimeStats = {
      ...fallback.digimon,
      ...(parsed.digimon ?? {}),
    };
    mergedDigi.level = parseSafeNumericInt(mergedDigi.level, 1, MAX_GAME_LEVEL, 1);
    const qualityProfile = getHatchQualityProfile(mergedDigi.hatchGrade);
    mergedDigi.hatchGrade = qualityProfile.grade;
    mergedDigi.hatchSizePct = clampHatchSizePct(
      qualityProfile.grade,
      mergedDigi.hatchSizePct
    );

    const activeForm = resolveActiveFormProfile(starterId, mergedDigi.activeFormId);
    const effectiveStarterId = resolveStarterIdForForm(starterId, activeForm.id);
    // Strict safety check: never allow a higher form if account level is below unlock requirement
    const safeForm =
      mergedDigi.level >= activeForm.unlockLevel
        ? activeForm
        : getEvolutionChainForStarter(effectiveStarterId)[0];
    const digiMaxHp = calcDigimonMaxHp(
      mergedDigi.level,
      safeForm.id,
      qualityProfile.grade,
      mergedDigi.hatchSizePct
    );
    const digiMaxDs = calcDigimonMaxDs(
      mergedDigi.level,
      safeForm.id,
      qualityProfile.grade,
      mergedDigi.hatchSizePct
    );
    mergedDigi.activeFormId = safeForm.id;
    mergedDigi.unlockedFormIds = sanitizeUnlockedFormIdsForDigimon(
      effectiveStarterId,
      mergedDigi.level,
      parsed.digimon?.unlockedFormIds,
      safeForm.id
    );
    mergedDigi.expToNext = calcDigimonExpToNext(mergedDigi.level);
    mergedDigi.exp = parseSafeNumericInt(
      mergedDigi.exp,
      0,
      Math.max(0, mergedDigi.expToNext - 1),
      0
    );
    mergedDigi.maxHp = digiMaxHp;
    mergedDigi.maxDs = digiMaxDs;
    const rawDigiHp = Number(parsed.digimon?.hp);
    const rawDigiDs = Number(parsed.digimon?.ds);
    const bothDrainedOrMissing =
      (!Number.isFinite(rawDigiHp) || rawDigiHp <= 0) &&
      (!Number.isFinite(rawDigiDs) || rawDigiDs <= 0);
    if (
      restoreFullVitals ||
      bothDrainedOrMissing ||
      !Number.isFinite(rawDigiHp) ||
      rawDigiHp <= 0
    ) {
      mergedDigi.hp = digiMaxHp;
    } else {
      mergedDigi.hp = Math.max(1, Math.min(digiMaxHp, Math.round(rawDigiHp)));
    }
    if (
      restoreFullVitals ||
      bothDrainedOrMissing ||
      !Number.isFinite(rawDigiDs) ||
      rawDigiDs < 0
    ) {
      mergedDigi.ds = digiMaxDs;
    } else {
      mergedDigi.ds = Math.max(0, Math.min(digiMaxDs, Math.round(rawDigiDs)));
    }

    let sanitizedParty: ReturnType<typeof sanitizePartyDigimons> = [];
    try {
      sanitizedParty = sanitizePartyDigimons(parsed.partyDigimons);
    } catch {
      sanitizedParty = [];
    }
    const partyDigimons = restoreFullVitals
      ? sanitizedParty.map((entry) => ({
          ...entry,
          hp: entry.maxHp,
          ds: entry.maxDs,
        }))
      : sanitizedParty;

    let safeInventory: InventoryItem[] = [];
    try {
      safeInventory = Array.isArray(parsed.inventory)
        ? sanitizeInventoryItems(parsed.inventory)
        : [];
    } catch {
      safeInventory = [];
    }

    let safeArchive: ReturnType<typeof sanitizeDigimonArchive> = [];
    try {
      safeArchive = sanitizeDigimonArchive(
        parsed.digimonArchive,
        getUnlockedArchiveSlots(parsed.unlockedArchiveSlots)
      );
    } catch {
      safeArchive = [];
    }

    return {
      accountUsername: parsed.accountUsername ?? fallback.accountUsername,
      tamer: mergedTamer,
      digimon: mergedDigi,
      bits: parseSafeNumericInt(parsed.bits, 0, 1_000_000_000, 0),
      dCoin: parseSafeNumericInt(parsed.dCoin, 0, 1_000_000_000, 0),
      inventory: safeInventory,
      unlockedInventorySlots: getUnlockedInventorySlots(
        parsed.unlockedInventorySlots
      ),
      partyDigimons,
      digimonArchive: safeArchive,
      unlockedArchiveSlots: getUnlockedArchiveSlots(
        parsed.unlockedArchiveSlots
      ),
      equippedItems,
      guildName: typeof parsed.guildName === 'string' ? parsed.guildName : null,
      tamerPhotoUrl: isValidAvatarPhotoDataUrl(parsed.tamerPhotoUrl)
        ? parsed.tamerPhotoUrl
        : null,
      tamerCoverUrl: isValidCoverPhotoDataUrl(parsed.tamerCoverUrl)
        ? parsed.tamerCoverUrl
        : null,
      xpBoostUntilMs:
        typeof parsed.xpBoostUntilMs === 'number' &&
        Number.isFinite(parsed.xpBoostUntilMs) &&
        parsed.xpBoostUntilMs > 0
          ? Math.round(parsed.xpBoostUntilMs)
          : null,
      autoFarmVipUnlocked: parsed.autoFarmVipUnlocked === true,
      autoFarmVipUntilMs:
        typeof parsed.autoFarmVipUntilMs === 'number' &&
        Number.isFinite(parsed.autoFarmVipUntilMs) &&
        parsed.autoFarmVipUntilMs > 0
          ? Math.round(parsed.autoFarmVipUntilMs)
          : null,
      tutorialRewardsClaimed: parsed.tutorialRewardsClaimed
        ? {
            supplies: parsed.tutorialRewardsClaimed.supplies === true,
            eggPack: parsed.tutorialRewardsClaimed.eggPack === true,
          }
        : undefined,
      defeatedEnemiesTotal: parseSafeNumericInt(
        parsed.defeatedEnemiesTotal,
        0,
        1_000_000_000,
        0
      ),
      updatedAt: parsed.updatedAt ?? fallback.updatedAt,
    };
  } catch {
    return createDefaultAccountHudState(accountUsername, starterId);
  }
}

export function saveAccountHudState(
  state: AccountHudPersistence,
  immediate = false,
  options?: { syncDCoinToCloud?: boolean; skipCloudSync?: boolean }
): void {
  const stamped: AccountHudPersistence = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  const cleanUser = (state.accountUsername.trim() || 'tamer_local').toLowerCase();
  const storageKey = `${HUD_PERSISTENCE_PREFIX}${cleanUser}`;

  ensureLocalHudFlushListeners();
  pendingLocalHudSaveKey = storageKey;
  pendingLocalHudSaveState = stamped;

  if (immediate) {
    flushPendingLocalHudSave();
  } else if (localHudSaveTimer === null) {
    // Debounce synchronous JSON.stringify + localStorage disk IPC so combat kills never hitch frames
    localHudSaveTimer = window.setTimeout(() => {
      flushPendingLocalHudSave();
    }, 450);
  }

  if (!options?.skipCloudSync) {
    scheduleHudStateSync(stamped, options?.syncDCoinToCloud === true, immediate);
  }
}

export function applyExpToTamer(
  stats: TamerRuntimeStats,
  gainedExp: number,
  equippedItems: Partial<Record<EquipmentSlotId, InventoryItem>> = {}
): { next: TamerRuntimeStats; leveledUp: boolean } {
  let { level, exp, expToNext, hp, maxHp, ds, maxDs } = stats;
  if (level >= MAX_GAME_LEVEL) {
    return {
      next: { level: MAX_GAME_LEVEL, exp: 0, expToNext, hp, maxHp, ds, maxDs },
      leveledUp: false,
    };
  }
  exp += gainedExp;
  let leveledUp = false;
  while (exp >= expToNext && level < MAX_GAME_LEVEL) {
    exp -= expToNext;
    level += 1;
    leveledUp = true;
    expToNext = calcTamerExpToNext(level);
    const recomputed = computeTamerAttributes(
      { level, exp, expToNext, hp, maxHp, ds, maxDs },
      equippedItems
    );
    maxHp = recomputed.maxHp;
    maxDs = recomputed.maxDs;
    hp = maxHp;
    ds = maxDs;
  }
  if (level >= MAX_GAME_LEVEL) {
    exp = 0;
  }
  return {
    next: { level, exp, expToNext, hp, maxHp, ds, maxDs },
    leveledUp,
  };
}

export function applyExpToDigimon(
  stats: DigimonRuntimeStats,
  gainedExp: number,
  starterId: StarterDigimonId = 'agumon'
): {
  next: DigimonRuntimeStats;
  leveledUp: boolean;
  newlyUnlockedForms: DigimonFormProfile[];
} {
  let { level, exp, expToNext, hp, maxHp, ds, maxDs } = stats;
  const qualityProfile = getHatchQualityProfile(stats.hatchGrade);
  const effectiveSizePct = clampHatchSizePct(qualityProfile.grade, stats.hatchSizePct);
  const activeForm = resolveActiveFormProfile(starterId, stats.activeFormId);
  const effectiveStarterId = resolveStarterIdForForm(starterId, activeForm.id);
  const prevLevel = level;
  if (level < MAX_GAME_LEVEL) {
    exp += gainedExp;
  }
  let leveledUp = false;
  while (exp >= expToNext && level < MAX_GAME_LEVEL) {
    exp -= expToNext;
    level += 1;
    leveledUp = true;
    expToNext = calcDigimonExpToNext(level);
    maxHp = calcDigimonMaxHp(level, activeForm.id, qualityProfile.grade, effectiveSizePct);
    maxDs = calcDigimonMaxDs(level, activeForm.id, qualityProfile.grade, effectiveSizePct);
    hp = maxHp;
    ds = maxDs;
  }
  if (level >= MAX_GAME_LEVEL) {
    exp = 0;
  }
  const chain = getEvolutionChainForStarter(effectiveStarterId);
  const syncedUnlockedIds = sanitizeUnlockedFormIdsForDigimon(
    effectiveStarterId,
    level,
    stats.unlockedFormIds,
    activeForm.id
  );
  const newlyUnlockedForms = chain.filter(
    (f) => f.unlockLevel > prevLevel && f.unlockLevel <= level
  );

  return {
    next: {
      level,
      exp,
      expToNext,
      hp,
      maxHp,
      ds,
      maxDs,
      activeFormId: activeForm.id,
      nickname: stats.nickname,
      unlockedFormIds: syncedUnlockedIds,
      hatchGrade: qualityProfile.grade,
      hatchSizePct: effectiveSizePct,
    },
    leveledUp,
    newlyUnlockedForms,
  };
}

export function setDigimonLevelForTesting(
  stats: DigimonRuntimeStats,
  starterId: StarterDigimonId,
  targetLevel: number
): {
  next: DigimonRuntimeStats;
  newlyUnlockedForms: DigimonFormProfile[];
  revertedForm: boolean;
} {
  const clampedLevel = Math.max(1, Math.min(99, Math.round(targetLevel)));
  const prevLevel = stats.level;
  const qualityProfile = getHatchQualityProfile(stats.hatchGrade);
  const effectiveSizePct = clampHatchSizePct(qualityProfile.grade, stats.hatchSizePct);
  const currentForm = resolveActiveFormProfile(starterId, stats.activeFormId);
  const effectiveStarterId = resolveStarterIdForForm(starterId, currentForm.id);
  const chain = getEvolutionChainForStarter(effectiveStarterId);

  const validCurrent = clampedLevel >= currentForm.unlockLevel;
  const syncedUnlockedIds = sanitizeUnlockedFormIdsForDigimon(
    effectiveStarterId,
    clampedLevel,
    stats.unlockedFormIds,
    validCurrent ? currentForm.id : undefined
  );
  const unlockedIdSet = new Set(syncedUnlockedIds);
  const unlockedForms = chain.filter(
    (f) => clampedLevel >= f.unlockLevel && unlockedIdSet.has(f.id)
  );
  const effectiveForm = validCurrent
    ? currentForm
    : unlockedForms[unlockedForms.length - 1] ?? chain[0];

  const maxHp = calcDigimonMaxHp(clampedLevel, effectiveForm.id, qualityProfile.grade, effectiveSizePct);
  const maxDs = calcDigimonMaxDs(clampedLevel, effectiveForm.id, qualityProfile.grade, effectiveSizePct);
  const newlyUnlockedForms =
    clampedLevel > prevLevel
      ? chain.filter(
          (f) => f.unlockLevel > prevLevel && f.unlockLevel <= clampedLevel
        )
      : [];

  return {
    next: {
      level: clampedLevel,
      exp: 0,
      expToNext: calcDigimonExpToNext(clampedLevel),
      hp: maxHp,
      maxHp,
      ds: maxDs,
      maxDs,
      activeFormId: effectiveForm.id,
      nickname: stats.nickname,
      unlockedFormIds: syncedUnlockedIds,
      hatchGrade: qualityProfile.grade,
      hatchSizePct: effectiveSizePct,
    },
    newlyUnlockedForms,
    revertedForm: !validCurrent,
  };
}

export function switchActiveDigimonForAdmin(
  state: AccountHudPersistence,
  targetFormId: DigimonFormId,
  targetGrade?: HatchQualityGrade,
  explicitLevel?: number,
  explicitSizePct?: number,
  preferredStarterId?: StarterDigimonId
): { next: AccountHudPersistence; form: DigimonFormProfile; grade: HatchQualityGrade; sizePct: number } {
  const form = getDigimonFormProfile(targetFormId);
  const effectiveStarterId = resolveStarterIdForForm(preferredStarterId, form.id);
  const qualityProfile = getHatchQualityProfile(targetGrade ?? state.digimon.hatchGrade);
  const nextSizePct =
    explicitSizePct !== undefined
      ? clampHatchSizePct(qualityProfile.grade, explicitSizePct)
      : rollHatchSizePct(qualityProfile.grade);
  const nextLevel = Math.max(
    1,
    Math.min(99, Math.round(explicitLevel ?? Math.max(state.digimon.level, form.unlockLevel)))
  );
  const maxHp = calcDigimonMaxHp(nextLevel, form.id, qualityProfile.grade, nextSizePct);
  const maxDs = calcDigimonMaxDs(nextLevel, form.id, qualityProfile.grade, nextSizePct);
  // Unlock forms up to the explicitly pulled form (if pulling a Rookie, Ultimate/Mega stay locked for testing Evoluters!)
  const chainSpecs = DIGIMON_EVOLUTION_CHAINS[effectiveStarterId] ?? [];
  const targetIdx = chainSpecs.findIndex((s) => s.formId === form.id);
  const pulledUpToIds = chainSpecs
    .slice(0, Math.max(0, targetIdx) + 1)
    .map((s) => s.formId)
    .filter((id): id is DigimonFormId => Boolean(id));
  const unlockedFormIds = sanitizeUnlockedFormIdsForDigimon(
    effectiveStarterId,
    nextLevel,
    pulledUpToIds,
    form.id
  );

  return {
    next: {
      ...state,
      digimon: {
        level: nextLevel,
        exp: 0,
        expToNext: calcDigimonExpToNext(nextLevel),
        hp: maxHp,
        maxHp,
        ds: maxDs,
        maxDs,
        activeFormId: form.id,
        unlockedFormIds,
        hatchGrade: qualityProfile.grade,
        hatchSizePct: nextSizePct,
      },
      updatedAt: new Date().toISOString(),
    },
    form,
    grade: qualityProfile.grade,
    sizePct: nextSizePct,
  };
}

export function addInventoryItem(
  current: InventoryItem[],
  item: Omit<InventoryItem, 'id'>,
  maxUnlockedSlots: number = INVENTORY_DEFAULT_UNLOCKED_SLOTS
): { next: InventoryItem[]; added: boolean } {
  if (isRemovedLegacyItemKey(item.itemKey)) {
    return { next: current, added: false };
  }
  const slotLimit = getUnlockedInventorySlots(maxUnlockedSlots);
  const enriched = enrichInventoryItem({
    ...item,
    id: `inv_${item.itemKey}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
  });

  const incomingEggLevel = enriched.eggData?.hatchLevel ?? 0;
  const incomingTutorialGift = Boolean(enriched.eggData?.isTutorialGift);
  // Stack items with matching itemKey (keeping reinforced and tutorial-gift eggs separate from regular eggs)
  const existingIdx = current.findIndex(
    (i) =>
      i.itemKey === enriched.itemKey &&
      (i.eggData?.hatchLevel ?? 0) === incomingEggLevel &&
      Boolean(i.eggData?.isTutorialGift) === incomingTutorialGift
  );
  if (existingIdx >= 0) {
    const updated = [...current];
    updated[existingIdx] = {
      ...enrichInventoryItem(updated[existingIdx]),
      quantity: updated[existingIdx].quantity + enriched.quantity,
    };
    return { next: updated, added: true };
  }
  if (current.length >= slotLimit) {
    return { next: current, added: false };
  }
  return {
    next: [...current, enriched],
    added: true,
  };
}

export function equipInventoryItem(
  state: AccountHudPersistence,
  inventoryItemId: string
): { next: AccountHudPersistence; equippedItem?: InventoryItem; error?: string } {
  const idx = state.inventory.findIndex((i) => i.id === inventoryItemId);
  if (idx < 0) return { next: state, error: 'Item não encontrado no inventário.' };

  const target = state.inventory[idx];
  if (target.category !== 'equip' || !target.equipSlot) {
    return { next: state, error: 'Este item não é um equipamento.' };
  }

  const slot = target.equipSlot;
  const previouslyEquipped = state.equippedItems[slot];

  const updatedInv = [...state.inventory];
  if (target.quantity > 1) {
    updatedInv[idx] = { ...target, quantity: target.quantity - 1 };
  } else {
    updatedInv.splice(idx, 1);
  }

  const unlockedSlots = getUnlockedInventorySlots(state);
  let nextInv = updatedInv;
  if (previouslyEquipped) {
    const returnRes = addInventoryItem(
      updatedInv,
      {
        itemKey: previouslyEquipped.itemKey,
        name: previouslyEquipped.name,
        category: previouslyEquipped.category,
        quantity: 1,
        description: previouslyEquipped.description,
        equipSlot: previouslyEquipped.equipSlot,
        statBonuses: previouslyEquipped.statBonuses,
      },
      unlockedSlots
    );
    if (!returnRes.added) {
      return {
        next: state,
        error: `Inventário cheio (${unlockedSlots}/${unlockedSlots} slots liberados) para trocar de equipamento.`,
      };
    }
    nextInv = returnRes.next;
  }

  const equippedSingle: InventoryItem = {
    ...target,
    quantity: 1,
    id: `eq_${slot}_${target.itemKey}_${Date.now()}`,
  };
  const nextEquipped = {
    ...state.equippedItems,
    [slot]: equippedSingle,
  };

  const recomputed = computeTamerAttributes(state.tamer, nextEquipped);

  return {
    next: {
      ...state,
      inventory: nextInv,
      equippedItems: nextEquipped,
      tamer: {
        ...state.tamer,
        maxHp: recomputed.maxHp,
        maxDs: recomputed.maxDs,
        hp: Math.min(recomputed.maxHp, state.tamer.hp),
        ds: Math.min(recomputed.maxDs, state.tamer.ds),
      },
      updatedAt: new Date().toISOString(),
    },
    equippedItem: equippedSingle,
  };
}

export function unequipSlotItem(
  state: AccountHudPersistence,
  slot: EquipmentSlotId
): { next: AccountHudPersistence; unequippedItem?: InventoryItem; error?: string } {
  const item = state.equippedItems[slot];
  if (!item) return { next: state };

  const unlockedSlots = getUnlockedInventorySlots(state);
  const addRes = addInventoryItem(
    state.inventory,
    {
      itemKey: item.itemKey,
      name: item.name,
      category: 'equip',
      quantity: 1,
      description: item.description,
      equipSlot: slot,
      statBonuses: item.statBonuses,
    },
    unlockedSlots
  );

  if (!addRes.added) {
    return {
      next: state,
      error: `Inventário cheio (${unlockedSlots}/${unlockedSlots} slots liberados). Libere espaço antes de remover.`,
    };
  }

  const nextEquipped = { ...state.equippedItems };
  delete nextEquipped[slot];

  const recomputed = computeTamerAttributes(state.tamer, nextEquipped);

  return {
    next: {
      ...state,
      inventory: addRes.next,
      equippedItems: nextEquipped,
      tamer: {
        ...state.tamer,
        maxHp: recomputed.maxHp,
        maxDs: recomputed.maxDs,
        hp: Math.min(recomputed.maxHp, state.tamer.hp),
        ds: Math.min(recomputed.maxDs, state.tamer.ds),
      },
      updatedAt: new Date().toISOString(),
    },
    unequippedItem: item,
  };
}

export const BASIC_BITS_SHOP_ITEMS: ReadonlyArray<{
  itemKey: string;
  name: string;
  category: 'consumable' | 'other' | 'equip';
  priceBits: number;
  description: string;
  hpRestore?: number;
  dsRestore?: number;
  equipSlot?: EquipmentSlotId;
  statBonuses?: InventoryItem['statBonuses'];
}> = [];

