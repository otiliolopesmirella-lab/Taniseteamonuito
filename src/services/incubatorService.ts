import {
  type DataInjectionStepConfig,
  enrichInventoryItem,
  getCatalogItemByKey,
  getDataItemDefinition,
  getHatchQualityProfile,
  getNextInjectionStepInfo,
  HATCH_BACKUP_ITEM_KEY,
  type HatchQualityProfile,
  isRemovedLegacyItemKey,
  MAX_HATCHABLE_LEVEL,
  MIN_HATCHABLE_LEVEL,
  rollHatchSizePct,
} from '../data/itemsCatalog';
import type { DigimonFormId } from '../types/digimon';
import type {
  AccountHudPersistence,
  DataElementType,
  HatchQualityGrade,
  InventoryItem,
} from '../types/hud';
import {
  findFirstFreeArchiveSlot,
  getUnlockedArchiveSlots,
  sanitizeDigimonArchive,
  storeHatchedDigimonInArchive,
} from './archiveService';
import { getUnlockedInventorySlots } from './hudGameService';

export const INCUBATOR_VISIBLE_EGG_SLOTS = 4;
export const INCUBATOR_TOTAL_TRAY_SLOTS = 5;

export interface DigiEggDisplayInfo {
  item: InventoryItem;
  speciesName: string;
  rarity: string;
  dataType?: DataElementType;
  iconUrl?: string;
  hatchLevel: number;
  maxHatchLevel: number;
  accentColor: string;
  usageRequirements?: string;
  requiredData?: {
    itemKey: string;
    name: string;
    iconUrl?: string;
    quantity: number;
    owned: number;
  };
  requiredMaterials: Array<{
    itemKey: string;
    name: string;
    iconUrl?: string;
    quantity: number;
    owned: number;
  }>;
  hasAllMaterials: boolean;
  canHatch: boolean;
  canInjectData: boolean;
  nextInjection: DataInjectionStepConfig | null;
  currentQualityProfile: HatchQualityProfile | null;
}

export interface IncubatorActionResult {
  ok: boolean;
  next: AccountHudPersistence;
  message: string;
  hatchedSpecies?: string;
  hatchedFormId?: DigimonFormId;
  hatchedArchiveSlotIndex?: number;
  eggIconUrl?: string;
  eggAccentColor?: string;
  hatchedGrade?: HatchQualityGrade;
  hatchedSizePct?: number;
  qualityProfile?: HatchQualityProfile;
  newReinforceLevel?: number;
  updatedEggId?: string;
}

export interface DataInjectionResult {
  ok: boolean;
  outcome: 'success' | 'fail' | 'broken' | 'error';
  next: AccountHudPersistence;
  message: string;
  newLevel?: number;
  brokeEgg?: boolean;
  usedHatchBackup?: boolean;
  preventedBreak?: boolean;
  updatedEggId?: string;
}

export interface ExecuteDataInjectionOptions {
  rng?: () => number;
  useHatchBackup?: boolean;
}

export function isDigiEggInventoryItem(item: InventoryItem): boolean {
  return (
    item.category === 'digiegg' ||
    Boolean(item.eggData) ||
    item.itemKey.startsWith('digiegg_')
  );
}

export function isEggReinforceInventoryItem(item: InventoryItem): boolean {
  return (
    item.reinforceMeta?.kind === 'egg-reinforce' ||
    item.itemKey.startsWith('egg_reinforce_')
  );
}

export function getInventoryDigiEggs(
  inventory: readonly InventoryItem[]
): InventoryItem[] {
  return inventory
    .filter(
      (item) =>
        item.quantity > 0 &&
        !isRemovedLegacyItemKey(item.itemKey) &&
        isDigiEggInventoryItem(item)
    )
    .map(enrichInventoryItem);
}

export function getInventoryReinforceMaterials(
  inventory: readonly InventoryItem[]
): InventoryItem[] {
  return inventory
    .filter((item) => item.quantity > 0 && isEggReinforceInventoryItem(item))
    .map(enrichInventoryItem);
}

export function getInventoryHatchBackupCount(
  inventory: readonly InventoryItem[]
): number {
  return inventory
    .filter((item) => item.itemKey === HATCH_BACKUP_ITEM_KEY && item.quantity > 0)
    .reduce((acc, item) => acc + item.quantity, 0);
}

export function getDigiEggDisplayInfo(
  rawItem: InventoryItem,
  inventory: readonly InventoryItem[]
): DigiEggDisplayInfo {
  const item = enrichInventoryItem(rawItem);
  const meta = item.eggData;
  const dataType = meta?.dataType ?? item.dataType;
  const inferredDataDef = dataType ? getDataItemDefinition(dataType) : undefined;

  const baseMaterials =
    meta?.requiredMaterials && meta.requiredMaterials.length > 0
      ? meta.requiredMaterials
      : meta?.requiredDataKey || inferredDataDef
        ? [
            {
              itemKey: meta?.requiredDataKey ?? inferredDataDef!.itemKey,
              name:
                getCatalogItemByKey(meta?.requiredDataKey ?? '')?.name ??
                inferredDataDef?.name ??
                'DATA',
              quantity: Math.max(1, meta?.requiredDataQuantity ?? 5),
            },
          ]
        : [];

  const requiredMaterials = baseMaterials.map((req) => {
    const owned = inventory
      .filter((inv) => inv.itemKey === req.itemKey)
      .reduce((acc, inv) => acc + inv.quantity, 0);
    const catalogDef = getCatalogItemByKey(req.itemKey);
    return {
      itemKey: req.itemKey,
      name: catalogDef?.name ?? req.name,
      iconUrl: catalogDef?.iconUrl,
      quantity: Math.max(1, req.quantity),
      owned,
    };
  });

  const requiredData =
    requiredMaterials.find((m) => m.itemKey.startsWith('data_')) ??
    requiredMaterials[0];

  const hatchLevel = Math.max(
    0,
    Math.min(MAX_HATCHABLE_LEVEL, meta?.hatchLevel ?? 0)
  );
  const maxHatchLevel = Math.max(
    MIN_HATCHABLE_LEVEL,
    meta?.maxHatchLevel ?? MAX_HATCHABLE_LEVEL
  );

  const hasAllMaterials = requiredMaterials.every((m) => m.owned >= m.quantity);
  const rawNextInjection =
    hatchLevel < maxHatchLevel ? getNextInjectionStepInfo(hatchLevel) : null;
  const guaranteedUpTo = meta?.guaranteedUpToLevel ?? 0;
  const nextInjection: DataInjectionStepConfig | null =
    rawNextInjection && guaranteedUpTo > 0 && hatchLevel < guaranteedUpTo
      ? {
          ...rawNextInjection,
          successChance: 1.0,
          breakChanceOnFail: 0.0,
        }
      : rawNextInjection;
  const canHatch = hatchLevel >= MIN_HATCHABLE_LEVEL;
  const canInjectData = Boolean(nextInjection && hasAllMaterials);
  const currentQualityProfile = canHatch
    ? getHatchQualityProfile(hatchLevel)
    : null;

  return {
    item,
    speciesName: meta?.speciesName ?? item.name,
    rarity: meta?.rarity ?? 'Padrão',
    dataType,
    iconUrl: item.iconUrl,
    hatchLevel,
    maxHatchLevel,
    accentColor: meta?.accentColor ?? '#38e8ff',
    usageRequirements: meta?.usageRequirements ?? item.usageInfo,
    requiredData,
    requiredMaterials,
    hasAllMaterials,
    canHatch,
    canInjectData,
    nextInjection,
    currentQualityProfile,
  };
}

function decrementInventoryEntries(
  inventory: readonly InventoryItem[],
  consumptions: Array<{ id?: string; itemKey?: string; quantity: number }>
): { ok: boolean; next: InventoryItem[]; error?: string } {
  const working = inventory.map((entry) => ({ ...entry }));

  for (const c of consumptions) {
    let remaining = Math.max(1, c.quantity);
    for (let i = 0; i < working.length && remaining > 0; i++) {
      const matches = c.id
        ? working[i].id === c.id
        : working[i].itemKey === c.itemKey;
      if (!matches || working[i].quantity <= 0) continue;

      const take = Math.min(working[i].quantity, remaining);
      working[i] = {
        ...working[i],
        quantity: working[i].quantity - take,
      };
      remaining -= take;
    }
    if (remaining > 0) {
      return {
        ok: false,
        next: [...inventory],
        error: 'Quantidade insuficiente de itens no inventário.',
      };
    }
  }

  return {
    ok: true,
    next: working.filter((entry) => entry.quantity > 0),
  };
}

function promoteOneEggLevel(
  inventory: readonly InventoryItem[],
  sourceEggId: string,
  nextLevel: number,
  maxHatchLevel: number
): { nextInventory: InventoryItem[]; targetEggId: string } {
  const sourceItem = inventory.find((i) => i.id === sourceEggId);
  if (!sourceItem) {
    return { nextInventory: [...inventory], targetEggId: sourceEggId };
  }

  // Try merging into an existing stack of the same itemKey at nextLevel first (keeping tutorial gift eggs separate)
  const sourceTutorialGift = Boolean(sourceItem.eggData?.isTutorialGift);
  const mergeTarget = inventory.find(
    (i) =>
      i.id !== sourceEggId &&
      i.itemKey === sourceItem.itemKey &&
      (i.eggData?.hatchLevel ?? 0) === nextLevel &&
      Boolean(i.eggData?.isTutorialGift) === sourceTutorialGift
  );

  if (mergeTarget && sourceItem.quantity > 1) {
    const nextInventory = inventory.map((inv) => {
      if (inv.id === sourceEggId) {
        return { ...inv, quantity: inv.quantity - 1 };
      }
      if (inv.id === mergeTarget.id) {
        return { ...inv, quantity: inv.quantity + 1 };
      }
      return inv;
    });
    return { nextInventory, targetEggId: mergeTarget.id };
  }

  if (mergeTarget && sourceItem.quantity === 1) {
    const nextInventory = inventory
      .filter((inv) => inv.id !== sourceEggId)
      .map((inv) =>
        inv.id === mergeTarget.id
          ? { ...inv, quantity: inv.quantity + 1 }
          : inv
      );
    return { nextInventory, targetEggId: mergeTarget.id };
  }

  const baseMeta = sourceItem.eggData ?? {
    speciesName: sourceItem.name,
    rarity: 'Padrão',
    hatchLevel: 0,
    maxHatchLevel,
  };

  if (sourceItem.quantity === 1) {
    const nextInventory = inventory.map((inv) =>
      inv.id === sourceEggId
        ? {
            ...inv,
            eggData: {
              ...baseMeta,
              hatchLevel: nextLevel,
              maxHatchLevel,
            },
          }
        : inv
    );
    return { nextInventory, targetEggId: sourceEggId };
  }

  const splitId = `${sourceItem.itemKey}_lv${nextLevel}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 5)}`;
  const nextInventory: InventoryItem[] = [];
  for (const inv of inventory) {
    if (inv.id !== sourceEggId) {
      nextInventory.push(inv);
      continue;
    }
    nextInventory.push({
      ...inv,
      quantity: inv.quantity - 1,
    });
    nextInventory.push({
      ...inv,
      id: splitId,
      quantity: 1,
      eggData: {
        ...baseMeta,
        hatchLevel: nextLevel,
        maxHatchLevel,
      },
    });
  }
  return { nextInventory, targetEggId: splitId };
}

/**
 * Valida se o jogador pode inserir DATA neste DigiEgg para tentar avancar o estagio (0/5 -> 5/5).
 */
export function validateDataInjection(
  state: AccountHudPersistence,
  eggItemId: string | null
): { ok: boolean; info?: DigiEggDisplayInfo; error?: string } {
  if (!eggItemId) {
    return {
      ok: false,
      error: 'Selecione um DigiEgg disponível no inventário para inserir DATA.',
    };
  }

  const eggItem = state.inventory.find(
    (item) =>
      item.id === eggItemId && item.quantity > 0 && isDigiEggInventoryItem(item)
  );
  if (!eggItem) {
    return {
      ok: false,
      error: 'Este DigiEgg não está mais disponível no inventário.',
    };
  }

  const info = getDigiEggDisplayInfo(eggItem, state.inventory);
  if (!info.nextInjection || info.hatchLevel >= info.maxHatchLevel) {
    return {
      ok: false,
      info,
      error: `${eggItem.name} já atingiu o estágio máximo ${info.maxHatchLevel}/${info.maxHatchLevel} (Muito Forte)!`,
    };
  }

  if (!info.hasAllMaterials) {
    const missing = info.requiredMaterials
      .filter((m) => m.owned < m.quantity)
      .map((m) => `${m.name} (${m.owned}/${m.quantity})`)
      .join(', ');
    return {
      ok: false,
      info,
      error: `DATA insuficiente para tentar ${info.nextInjection.toLevel}/5: ${missing}.`,
    };
  }

  // If stacked > 1 and no matching next-level stack exists yet, verify inventory slot limit
  if (eggItem.quantity > 1) {
    const nextLevel = info.nextInjection.toLevel;
    const sourceTutorialGift = Boolean(eggItem.eggData?.isTutorialGift);
    const hasMergeTarget = state.inventory.some(
      (i) =>
        i.id !== eggItem.id &&
        i.itemKey === eggItem.itemKey &&
        (i.eggData?.hatchLevel ?? 0) === nextLevel &&
        Boolean(i.eggData?.isTutorialGift) === sourceTutorialGift
    );
    const unlockedSlots = getUnlockedInventorySlots(state);
    if (!hasMergeTarget && state.inventory.length >= unlockedSlots) {
      return {
        ok: false,
        info,
        error: `Inventário cheio (${unlockedSlots}/${unlockedSlots} slots liberados) para separar este DigiEgg.`,
      };
    }
  }

  return { ok: true, info };
}

/**
 * Executa uma tentativa estilo DMO de inserir DATA no DigiEgg selecionado.
 * Consome os materiais configurados e aplica as chances reais de sucesso e quebra.
 */
export function executeDataInjection(
  state: AccountHudPersistence,
  eggItemId: string | null,
  optionsOrRng: (() => number) | ExecuteDataInjectionOptions = {}
): DataInjectionResult {
  const rng =
    typeof optionsOrRng === 'function'
      ? optionsOrRng
      : (optionsOrRng.rng ?? Math.random);
  const useHatchBackup =
    typeof optionsOrRng === 'function'
      ? false
      : Boolean(optionsOrRng.useHatchBackup);

  const check = validateDataInjection(state, eggItemId);
  if (!check.ok || !check.info || !check.info.nextInjection) {
    return {
      ok: false,
      outcome: 'error',
      next: state,
      message: check.error ?? 'Não foi possível inserir DATA neste DigiEgg.',
    };
  }

  const { info } = check;
  const step = info.nextInjection!;
  const consumptions = info.requiredMaterials.map((m) => ({
    itemKey: m.itemKey,
    quantity: m.quantity,
  }));

  const afterData = decrementInventoryEntries(state.inventory, consumptions);
  if (!afterData.ok) {
    return {
      ok: false,
      outcome: 'error',
      next: state,
      message: afterData.error ?? 'DATA insuficiente no inventário.',
    };
  }

  const rollSuccess = rng();
  if (rollSuccess < step.successChance) {
    const promoted = promoteOneEggLevel(
      afterData.next,
      info.item.id,
      step.toLevel,
      info.maxHatchLevel
    );
    const qualityNote =
      step.toLevel >= MIN_HATCHABLE_LEVEL
        ? ` · ${getHatchQualityProfile(step.toLevel).label} (${getHatchQualityProfile(step.toLevel).qualityName}) liberado!`
        : ' (continue até 3/5 para liberar chocagem)';

    return {
      ok: true,
      outcome: 'success',
      next: {
        ...state,
        inventory: promoted.nextInventory,
        updatedAt: new Date().toISOString(),
      },
      newLevel: step.toLevel,
      updatedEggId: promoted.targetEggId,
      message: `Sucesso! ${info.item.name} avançou para ${step.toLevel}/${info.maxHatchLevel}${qualityNote}`,
    };
  }

  // Failed attempt — if step has break risk and Hatch Backup is active, consume 1 Hatch Backup and guarantee egg survival
  const rollBreak = rng();
  const wouldBreak = step.breakChanceOnFail > 0 && rollBreak < step.breakChanceOnFail;
  if (step.breakChanceOnFail > 0 && useHatchBackup) {
    const afterBackup = decrementInventoryEntries(afterData.next, [
      { itemKey: HATCH_BACKUP_ITEM_KEY, quantity: 1 },
    ]);
    if (afterBackup.ok) {
      return {
        ok: true,
        outcome: 'fail',
        brokeEgg: false,
        usedHatchBackup: true,
        preventedBreak: wouldBreak,
        updatedEggId: info.item.id,
        next: {
          ...state,
          inventory: afterBackup.next,
          updatedAt: new Date().toISOString(),
        },
        newLevel: info.hatchLevel,
        message: wouldBreak
          ? `A inserção de DATA falhou, mas 1 Hatch Backup impediu a quebra de ${info.item.name} (${info.hatchLevel}/${info.maxHatchLevel})!`
          : `A inserção de DATA falhou e 1 Hatch Backup protegeu ${info.item.name} em ${info.hatchLevel}/${info.maxHatchLevel}.`,
      };
    }
  }

  // Unprotected failed attempt — roll break risk if applicable (steps >= 1/5 -> 2/5+)
  if (wouldBreak) {
    const afterBreak = decrementInventoryEntries(afterData.next, [
      { id: info.item.id, quantity: 1 },
    ]);
    return {
      ok: true,
      outcome: 'broken',
      brokeEgg: true,
      next: {
        ...state,
        inventory: afterBreak.ok ? afterBreak.next : afterData.next,
        updatedAt: new Date().toISOString(),
      },
      message: `Falha crítica! O ${info.item.name} (${info.hatchLevel}/${info.maxHatchLevel}) quebrou ao tentar ${step.toLevel}/5.`,
    };
  }

  return {
    ok: true,
    outcome: 'fail',
    brokeEgg: false,
    updatedEggId: info.item.id,
    next: {
      ...state,
      inventory: afterData.next,
      updatedAt: new Date().toISOString(),
    },
    newLevel: info.hatchLevel,
    message: `A inserção de DATA falhou (${Math.round(step.successChance * 100)}% de chance), mas ${info.item.name} resistiu em ${info.hatchLevel}/${info.maxHatchLevel}.`,
  };
}

export function validateDigiEggHatch(
  state: AccountHudPersistence,
  eggItemId: string | null
): { ok: boolean; info?: DigiEggDisplayInfo; error?: string } {
  if (!eggItemId) {
    return {
      ok: false,
      error: 'Selecione um DigiEgg disponível no inventário para chocar.',
    };
  }

  const eggItem = state.inventory.find(
    (item) =>
      item.id === eggItemId && item.quantity > 0 && isDigiEggInventoryItem(item)
  );
  if (!eggItem) {
    return {
      ok: false,
      error: 'Este DigiEgg não está mais disponível no seu inventário.',
    };
  }

  const info = getDigiEggDisplayInfo(eggItem, state.inventory);

  if (info.hatchLevel < MIN_HATCHABLE_LEVEL) {
    return {
      ok: false,
      info,
      error: `Chocagem bloqueada em ${info.hatchLevel}/5! No DATS, DigiEggs só podem ser chocados a partir de 3/5 (Normal), 4/5 (Forte) ou 5/5 (Muito Forte).`,
    };
  }

  const hatchedFormId = info.item.eggData?.hatchedFormId;
  if (hatchedFormId) {
    const unlockedArchiveSlots = getUnlockedArchiveSlots(state);
    const archive = sanitizeDigimonArchive(
      state.digimonArchive,
      unlockedArchiveSlots
    );
    if (findFirstFreeArchiveSlot(archive, unlockedArchiveSlots) < 0) {
      return {
        ok: false,
        info,
        error: `Digimon Archive cheio (${unlockedArchiveSlots}/${unlockedArchiveSlots} slots liberados)! Libere um espaço no Digimon Archive ao lado antes de chocar.`,
      };
    }
  }

  return { ok: true, info };
}

export function executeDigiEggHatch(
  state: AccountHudPersistence,
  eggItemId: string | null,
  rng: () => number = Math.random
): IncubatorActionResult {
  const check = validateDigiEggHatch(state, eggItemId);
  if (!check.ok || !check.info) {
    return {
      ok: false,
      next: state,
      message: check.error ?? 'Ação inválida para chocagem.',
    };
  }

  // DATA was already consumed during the 0/5 -> 3/5..5/5 phase injections; final hatch consumes 1 prepared DigiEgg
  const consumed = decrementInventoryEntries(state.inventory, [
    { id: check.info.item.id, quantity: 1 },
  ]);
  if (!consumed.ok) {
    return {
      ok: false,
      next: state,
      message: consumed.error ?? 'Falha ao processar o DigiEgg selecionado.',
    };
  }

  const grade: HatchQualityGrade =
    check.info.hatchLevel >= 5 ? 5 : check.info.hatchLevel >= 4 ? 4 : 3;
  const qualityProfile = getHatchQualityProfile(grade);
  const hatchedSizePct = rollHatchSizePct(grade, rng);
  const hatchedSpecies = check.info.speciesName;
  const powerBonusText =
    qualityProfile.powerBonusPct > 0
      ? ` · +${qualityProfile.powerBonusPct}% poder`
      : ' · Normal';

  let nextState: AccountHudPersistence = {
    ...state,
    inventory: consumed.next,
    updatedAt: new Date().toISOString(),
  };

  let archiveNotice = '';
  let hatchedArchiveSlotIndex: number | undefined;
  const hatchedFormId = check.info.item.eggData?.hatchedFormId;
  const preUnlockedFormIds = check.info.item.eggData?.preUnlockedFormIds;
  const hasPreUnlockedEvoBonus = Boolean(
    preUnlockedFormIds && preUnlockedFormIds.length > 2
  );
  if (hatchedFormId) {
    const stored = storeHatchedDigimonInArchive(
      nextState,
      hatchedFormId,
      grade,
      hatchedSizePct,
      preUnlockedFormIds
    );
    if (stored.ok && stored.entry) {
      nextState = stored.next;
      hatchedArchiveSlotIndex = stored.entry.slotIndex;
      archiveNotice = ` Guardado no Digimon Archive (Slot #${stored.entry.slotIndex + 1})!`;
    }
  }
  const unlockedEvoNotice = hasPreUnlockedEvoBonus
    ? ' Evoluções Ultimate e Mega já vêm desbloqueadas permanentemente!'
    : '';

  return {
    ok: true,
    next: nextState,
    hatchedSpecies,
    hatchedFormId,
    hatchedArchiveSlotIndex,
    eggIconUrl: check.info.iconUrl,
    eggAccentColor: check.info.accentColor,
    hatchedGrade: grade,
    hatchedSizePct,
    qualityProfile,
    message: `Chocagem ${qualityProfile.label} (${qualityProfile.qualityName}${powerBonusText} · Qualidade ${hatchedSizePct}%) concluída! ${hatchedSpecies} nasceu na Incubadora DATS.${unlockedEvoNotice}${archiveNotice}`,
  };
}

export function validateEggReinforce(
  state: AccountHudPersistence,
  eggItemId: string | null,
  materialItemId: string | null
): {
  ok: boolean;
  eggInfo?: DigiEggDisplayInfo;
  material?: InventoryItem;
  error?: string;
} {
  if (!eggItemId) {
    return {
      ok: false,
      error: 'Selecione um DigiEgg do seu inventário antes de aplicar reforço.',
    };
  }

  const eggItem = state.inventory.find(
    (item) =>
      item.id === eggItemId && item.quantity > 0 && isDigiEggInventoryItem(item)
  );
  if (!eggItem) {
    return {
      ok: false,
      error: 'O DigiEgg selecionado não está disponível no inventário.',
    };
  }

  const eggInfo = getDigiEggDisplayInfo(eggItem, state.inventory);
  if (eggInfo.hatchLevel >= eggInfo.maxHatchLevel) {
    return {
      ok: false,
      eggInfo,
      error: `${eggItem.name} já atingiu o nível máximo (${eggInfo.maxHatchLevel}/${eggInfo.maxHatchLevel}).`,
    };
  }

  const reinforceMaterials = getInventoryReinforceMaterials(state.inventory);
  if (reinforceMaterials.length === 0) {
    return {
      ok: false,
      eggInfo,
      error: 'Nenhum item de reforço disponível no inventário no momento.',
    };
  }

  const material = materialItemId
    ? reinforceMaterials.find((m) => m.id === materialItemId)
    : reinforceMaterials[0];
  if (!material || material.quantity <= 0) {
    return {
      ok: false,
      eggInfo,
      error: 'Selecione um item de reforço válido do inventário.',
    };
  }

  if (
    material.reinforceMeta?.targetEggKey &&
    material.reinforceMeta.targetEggKey !== eggItem.itemKey
  ) {
    return {
      ok: false,
      eggInfo,
      material,
      error: `${material.name} não é compatível com ${eggItem.name}.`,
    };
  }

  return { ok: true, eggInfo, material };
}

export function executeEggReinforce(
  state: AccountHudPersistence,
  eggItemId: string | null,
  materialItemId: string | null
): IncubatorActionResult {
  const check = validateEggReinforce(state, eggItemId, materialItemId);
  if (!check.ok || !check.eggInfo || !check.material) {
    return {
      ok: false,
      next: state,
      message: check.error ?? 'Não foi possível reforçar este DigiEgg.',
    };
  }

  const consumed = decrementInventoryEntries(state.inventory, [
    { id: check.material.id, quantity: 1 },
  ]);
  if (!consumed.ok) {
    return {
      ok: false,
      next: state,
      message: consumed.error ?? 'Item de reforço insuficiente no inventário.',
    };
  }

  const step = Math.max(1, check.material.reinforceMeta?.levelStep ?? 1);
  const nextLevel = Math.min(
    check.eggInfo.maxHatchLevel,
    check.eggInfo.hatchLevel + step
  );

  const promoted = promoteOneEggLevel(
    consumed.next,
    check.eggInfo.item.id,
    nextLevel,
    check.eggInfo.maxHatchLevel
  );

  return {
    ok: true,
    next: {
      ...state,
      inventory: promoted.nextInventory,
      updatedAt: new Date().toISOString(),
    },
    newReinforceLevel: nextLevel,
    updatedEggId: promoted.targetEggId,
    message: `Reforço concluído! ${check.eggInfo.item.name} avançou para ${nextLevel}/${check.eggInfo.maxHatchLevel}.`,
  };
}
