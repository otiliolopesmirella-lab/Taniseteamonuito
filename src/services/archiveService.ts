import {
  clampHatchSizePct,
  getHatchQualityProfile,
  rollHatchSizePct,
} from '../data/itemsCatalog';
import {
  getDigimonFormProfile,
  resolveActiveFormProfile,
  type DigimonFormId,
  type StarterDigimonId,
} from '../types/digimon';
import type {
  AccountHudPersistence,
  ArchivedDigimonEntry,
  HatchQualityGrade,
} from '../types/hud';
import {
  calcDigimonExpToNext,
  calcDigimonMaxDs,
  calcDigimonMaxHp,
  DIGIMON_EVOLUTION_CHAINS,
  sanitizeUnlockedFormIdsForDigimon,
} from './hudGameService';

export const ARCHIVE_TOTAL_SLOTS = 50;
export const ARCHIVE_DEFAULT_UNLOCKED_SLOTS = 4;
export const PARTY_RESERVE_SLOTS = 2;

export function getUnlockedArchiveSlots(
  source?: Pick<AccountHudPersistence, 'unlockedArchiveSlots'> | number | null
): number {
  const raw =
    typeof source === 'number' ? source : source?.unlockedArchiveSlots;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return ARCHIVE_DEFAULT_UNLOCKED_SLOTS;
  }
  return Math.max(
    ARCHIVE_DEFAULT_UNLOCKED_SLOTS,
    Math.min(ARCHIVE_TOTAL_SLOTS, Math.floor(raw))
  );
}

function sanitizeDigimonEntryList(
  rawEntries: unknown,
  slotLimit: number,
  idPrefix: string
): ArchivedDigimonEntry[] {
  if (!Array.isArray(rawEntries)) return [];
  const usedSlots = new Set<number>();
  const cleaned: ArchivedDigimonEntry[] = [];

  for (const item of rawEntries) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as Partial<ArchivedDigimonEntry>;
    const slotIndex =
      typeof raw.slotIndex === 'number' && Number.isInteger(raw.slotIndex)
        ? raw.slotIndex
        : -1;
    if (slotIndex < 0 || slotIndex >= slotLimit || usedSlots.has(slotIndex)) {
      continue;
    }

    const form = getDigimonFormProfile(
      raw.activeFormId ?? raw.starterId ?? 'agumon'
    );
    const level =
      typeof raw.level === 'number' && Number.isFinite(raw.level)
        ? Math.max(1, Math.min(99, Math.floor(raw.level)))
        : 1;
    const qualityProfile = getHatchQualityProfile(raw.hatchGrade);
    const sizePct = clampHatchSizePct(qualityProfile.grade, raw.hatchSizePct);
    const maxHp = calcDigimonMaxHp(level, form.id, qualityProfile.grade, sizePct);
    const maxDs = calcDigimonMaxDs(level, form.id, qualityProfile.grade, sizePct);
    const expToNext = calcDigimonExpToNext(level);
    const exp =
      typeof raw.exp === 'number' && Number.isFinite(raw.exp)
        ? Math.max(0, Math.min(expToNext - 1, Math.floor(raw.exp)))
        : 0;
    const hp =
      typeof raw.hp === 'number' && Number.isFinite(raw.hp)
        ? Math.max(1, Math.min(maxHp, Math.floor(raw.hp)))
        : maxHp;
    const ds =
      typeof raw.ds === 'number' && Number.isFinite(raw.ds)
        ? Math.max(0, Math.min(maxDs, Math.floor(raw.ds)))
        : maxDs;

    usedSlots.add(slotIndex);
    cleaned.push({
      id:
        typeof raw.id === 'string' && raw.id.trim()
          ? raw.id
          : `${idPrefix}_${form.id}_${slotIndex}_${Date.now()}`,
      slotIndex,
      starterId: form.starterId,
      activeFormId: form.id,
      nickname:
        typeof raw.nickname === 'string' && raw.nickname.trim()
          ? raw.nickname.trim().slice(0, 16)
          : undefined,
      level,
      exp,
      expToNext,
      hp,
      maxHp,
      ds,
      maxDs,
      unlockedFormIds: sanitizeUnlockedFormIdsForDigimon(
        form.starterId,
        level,
        raw.unlockedFormIds,
        form.id
      ),
      hatchGrade: qualityProfile.grade,
      hatchSizePct: sizePct,
      archivedAt:
        typeof raw.archivedAt === 'string' && raw.archivedAt
          ? raw.archivedAt
          : new Date().toISOString(),
    });
  }

  return cleaned.sort((a, b) => a.slotIndex - b.slotIndex);
}

export function sanitizeDigimonArchive(
  rawEntries: unknown,
  unlockedSlots: number = ARCHIVE_DEFAULT_UNLOCKED_SLOTS
): ArchivedDigimonEntry[] {
  return sanitizeDigimonEntryList(
    rawEntries,
    getUnlockedArchiveSlots(unlockedSlots),
    'arch'
  );
}

export function sanitizePartyDigimons(
  rawEntries: unknown
): ArchivedDigimonEntry[] {
  return sanitizeDigimonEntryList(rawEntries, PARTY_RESERVE_SLOTS, 'party');
}

export function findFirstFreeArchiveSlot(
  entries: ArchivedDigimonEntry[],
  unlockedSlots: number = ARCHIVE_DEFAULT_UNLOCKED_SLOTS
): number {
  const limit = getUnlockedArchiveSlots(unlockedSlots);
  const occupied = new Set(entries.map((e) => e.slotIndex));
  for (let i = 0; i < limit; i++) {
    if (!occupied.has(i)) return i;
  }
  return -1;
}

export function findFirstFreePartyReserveSlot(
  entries: ArchivedDigimonEntry[]
): number {
  const occupied = new Set(entries.map((e) => e.slotIndex));
  for (let i = 0; i < PARTY_RESERVE_SLOTS; i++) {
    if (!occupied.has(i)) return i;
  }
  return -1;
}

function buildNewDigimonEntry(
  formId: DigimonFormId,
  slotIndex: number,
  grade: HatchQualityGrade,
  sizePct: number,
  levelOverride?: number,
  idPrefix = 'arch'
): ArchivedDigimonEntry {
  const form = getDigimonFormProfile(formId);
  const qualityProfile = getHatchQualityProfile(grade);
  const safeSizePct = clampHatchSizePct(qualityProfile.grade, sizePct);
  const level = Math.max(
    1,
    Math.min(99, Math.floor(levelOverride ?? Math.max(1, form.unlockLevel)))
  );
  const maxHp = calcDigimonMaxHp(level, form.id, qualityProfile.grade, safeSizePct);
  const maxDs = calcDigimonMaxDs(level, form.id, qualityProfile.grade, safeSizePct);

  return {
    id: `${idPrefix}_${form.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    slotIndex,
    starterId: form.starterId,
    activeFormId: form.id,
    level,
    exp: 0,
    expToNext: calcDigimonExpToNext(level),
    hp: maxHp,
    maxHp,
    ds: maxDs,
    maxDs,
    unlockedFormIds: (() => {
      const chainSpecs = DIGIMON_EVOLUTION_CHAINS[form.starterId] ?? [];
      const targetIdx = chainSpecs.findIndex((s) => s.formId === form.id);
      const initialIds = chainSpecs
        .slice(0, Math.max(0, targetIdx) + 1)
        .map((s) => s.formId)
        .filter((id): id is DigimonFormId => Boolean(id));
      return sanitizeUnlockedFormIdsForDigimon(
        form.starterId,
        level,
        initialIds,
        form.id
      );
    })(),
    hatchGrade: qualityProfile.grade,
    hatchSizePct: safeSizePct,
    archivedAt: new Date().toISOString(),
  };
}

export function storeHatchedDigimonInArchive(
  state: AccountHudPersistence,
  formId: DigimonFormId,
  grade: HatchQualityGrade,
  sizePct: number
): {
  ok: boolean;
  next: AccountHudPersistence;
  entry?: ArchivedDigimonEntry;
  error?: string;
} {
  const unlockedSlots = getUnlockedArchiveSlots(state);
  const currentArchive = sanitizeDigimonArchive(
    state.digimonArchive,
    unlockedSlots
  );
  const freeSlot = findFirstFreeArchiveSlot(currentArchive, unlockedSlots);
  if (freeSlot < 0) {
    return {
      ok: false,
      next: state,
      error: `Digimon Archive cheio (${unlockedSlots}/${unlockedSlots} slots liberados). Libere um espaço ou expanda o Archive para chocar outro Digimon.`,
    };
  }

  const entry = buildNewDigimonEntry(formId, freeSlot, grade, sizePct, 1, 'arch');
  const nextArchive = [...currentArchive, entry].sort(
    (a, b) => a.slotIndex - b.slotIndex
  );

  return {
    ok: true,
    entry,
    next: {
      ...state,
      digimonArchive: nextArchive,
      unlockedArchiveSlots: unlockedSlots,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function addDigimonToPartyReserve(
  state: AccountHudPersistence,
  formId: DigimonFormId,
  grade: HatchQualityGrade,
  levelOverride?: number
): {
  ok: boolean;
  next: AccountHudPersistence;
  entry?: ArchivedDigimonEntry;
  error?: string;
} {
  const currentParty = sanitizePartyDigimons(state.partyDigimons);
  const freeSlot = findFirstFreePartyReserveSlot(currentParty);
  if (freeSlot < 0) {
    return {
      ok: false,
      next: state,
      error:
        'Os 2 slots reserva da equipe estão ocupados (máximo de 3 Digimons com o Tamer). Envie um ao Archive ou substitua o ativo.',
    };
  }

  const form = getDigimonFormProfile(formId);
  const qualityProfile = getHatchQualityProfile(grade);
  const rolledSize = rollHatchSizePct(qualityProfile.grade);
  const targetLevel = Math.max(
    1,
    levelOverride ?? Math.max(1, form.unlockLevel)
  );
  const entry = buildNewDigimonEntry(
    form.id,
    freeSlot,
    qualityProfile.grade,
    rolledSize,
    targetLevel,
    'party'
  );
  const nextParty = [...currentParty, entry].sort(
    (a, b) => a.slotIndex - b.slotIndex
  );

  return {
    ok: true,
    entry,
    next: {
      ...state,
      partyDigimons: nextParty,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function addDigimonToArchiveForAdmin(
  state: AccountHudPersistence,
  formId: DigimonFormId,
  grade: HatchQualityGrade,
  levelOverride?: number
): {
  ok: boolean;
  next: AccountHudPersistence;
  entry?: ArchivedDigimonEntry;
  error?: string;
} {
  const unlockedSlots = getUnlockedArchiveSlots(state);
  const currentArchive = sanitizeDigimonArchive(
    state.digimonArchive,
    unlockedSlots
  );
  const freeSlot = findFirstFreeArchiveSlot(currentArchive, unlockedSlots);
  if (freeSlot < 0) {
    return {
      ok: false,
      next: state,
      error: `Digimon Archive cheio (${unlockedSlots}/${unlockedSlots} slots liberados). Expanda seus slots na Loja de DWcoin.`,
    };
  }

  const form = getDigimonFormProfile(formId);
  const qualityProfile = getHatchQualityProfile(grade);
  const rolledSize = rollHatchSizePct(qualityProfile.grade);
  const targetLevel = Math.max(
    1,
    levelOverride ?? Math.max(1, form.unlockLevel)
  );
  const entry = buildNewDigimonEntry(
    form.id,
    freeSlot,
    qualityProfile.grade,
    rolledSize,
    targetLevel,
    'arch'
  );
  const nextArchive = [...currentArchive, entry].sort(
    (a, b) => a.slotIndex - b.slotIndex
  );

  return {
    ok: true,
    entry,
    next: {
      ...state,
      digimonArchive: nextArchive,
      unlockedArchiveSlots: unlockedSlots,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function unlockArchiveSlotsForAdmin(
  state: AccountHudPersistence,
  targetUnlockedSlots: number
): {
  next: AccountHudPersistence;
  unlockedSlots: number;
} {
  const clamped = Math.max(
    ARCHIVE_DEFAULT_UNLOCKED_SLOTS,
    Math.min(ARCHIVE_TOTAL_SLOTS, Math.floor(targetUnlockedSlots))
  );
  return {
    unlockedSlots: clamped,
    next: {
      ...state,
      unlockedArchiveSlots: clamped,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function swapActiveDigimonWithPartyReserve(
  state: AccountHudPersistence,
  currentStarterId: StarterDigimonId,
  reserveSlotIndex: 0 | 1
): {
  ok: boolean;
  next: AccountHudPersistence;
  newStarterId?: StarterDigimonId;
  activatedName?: string;
  storedName?: string;
  error?: string;
} {
  const party = sanitizePartyDigimons(state.partyDigimons);
  const target = party.find((e) => e.slotIndex === reserveSlotIndex);
  if (!target) {
    return {
      ok: false,
      next: state,
      error: `Círculo reserva ${reserveSlotIndex + 2} está vago. Traga um Digimon do Digimon Archive para andar com até 3 parceiros.`,
    };
  }

  const currentForm = resolveActiveFormProfile(
    currentStarterId,
    state.digimon.activeFormId
  );
  const currentGrade = getHatchQualityProfile(state.digimon.hatchGrade).grade;
  const currentSizePct = clampHatchSizePct(
    currentGrade,
    state.digimon.hatchSizePct
  );

  const outgoingToReserve: ArchivedDigimonEntry = {
    id: `party_${currentForm.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    slotIndex: reserveSlotIndex,
    starterId: currentForm.starterId,
    activeFormId: currentForm.id,
    nickname: state.digimon.nickname,
    level: state.digimon.level,
    exp: state.digimon.exp,
    expToNext: calcDigimonExpToNext(state.digimon.level),
    hp: Math.max(1, Math.min(state.digimon.maxHp, state.digimon.hp)),
    maxHp: state.digimon.maxHp,
    ds: Math.max(0, Math.min(state.digimon.maxDs, state.digimon.ds)),
    maxDs: state.digimon.maxDs,
    unlockedFormIds: sanitizeUnlockedFormIdsForDigimon(
      currentForm.starterId,
      state.digimon.level,
      state.digimon.unlockedFormIds,
      currentForm.id
    ),
    hatchGrade: currentGrade,
    hatchSizePct: currentSizePct,
    archivedAt: new Date().toISOString(),
  };

  const incomingForm = getDigimonFormProfile(target.activeFormId);
  const incomingGrade = getHatchQualityProfile(target.hatchGrade).grade;
  const incomingSizePct = clampHatchSizePct(incomingGrade, target.hatchSizePct);
  const incomingMaxHp = calcDigimonMaxHp(
    target.level,
    incomingForm.id,
    incomingGrade,
    incomingSizePct
  );
  const incomingMaxDs = calcDigimonMaxDs(
    target.level,
    incomingForm.id,
    incomingGrade,
    incomingSizePct
  );
  const incomingExpToNext = calcDigimonExpToNext(target.level);

  const nextParty = party
    .filter((e) => e.slotIndex !== reserveSlotIndex)
    .concat(outgoingToReserve)
    .sort((a, b) => a.slotIndex - b.slotIndex);

  return {
    ok: true,
    newStarterId: incomingForm.starterId,
    activatedName: target.nickname ?? incomingForm.name,
    storedName: state.digimon.nickname ?? currentForm.name,
    next: {
      ...state,
      digimon: {
        level: target.level,
        exp: Math.max(0, Math.min(incomingExpToNext - 1, target.exp)),
        expToNext: incomingExpToNext,
        hp: Math.max(1, Math.min(incomingMaxHp, target.hp)),
        maxHp: incomingMaxHp,
        ds: Math.max(0, Math.min(incomingMaxDs, target.ds)),
        maxDs: incomingMaxDs,
        activeFormId: incomingForm.id,
        nickname: target.nickname,
        unlockedFormIds: sanitizeUnlockedFormIdsForDigimon(
          incomingForm.starterId,
          target.level,
          target.unlockedFormIds,
          incomingForm.id
        ),
        hatchGrade: incomingGrade,
        hatchSizePct: incomingSizePct,
      },
      partyDigimons: nextParty,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function moveArchiveSlotToPartyReserve(
  state: AccountHudPersistence,
  archiveSlotIndex: number
): {
  ok: boolean;
  next: AccountHudPersistence;
  movedName?: string;
  partySlotNumber?: number;
  error?: string;
} {
  const unlockedSlots = getUnlockedArchiveSlots(state);
  const archive = sanitizeDigimonArchive(state.digimonArchive, unlockedSlots);
  const target = archive.find((e) => e.slotIndex === archiveSlotIndex);
  if (!target) {
    return {
      ok: false,
      next: state,
      error: `Slot #${archiveSlotIndex + 1} do Archive está vazio.`,
    };
  }

  const party = sanitizePartyDigimons(state.partyDigimons);
  const freeReserve = findFirstFreePartyReserveSlot(party);
  if (freeReserve < 0) {
    return {
      ok: false,
      next: state,
      error:
        'Os 2 círculos reserva da sua equipe já estão ocupados. Guarde um deles no Archive primeiro.',
    };
  }

  const form = getDigimonFormProfile(target.activeFormId);
  const movedEntry: ArchivedDigimonEntry = {
    ...target,
    slotIndex: freeReserve,
  };

  return {
    ok: true,
    movedName: target.nickname ?? form.name,
    partySlotNumber: freeReserve + 2,
    next: {
      ...state,
      digimonArchive: archive.filter((e) => e.slotIndex !== archiveSlotIndex),
      partyDigimons: [...party, movedEntry].sort(
        (a, b) => a.slotIndex - b.slotIndex
      ),
      unlockedArchiveSlots: unlockedSlots,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function movePartyReserveToArchive(
  state: AccountHudPersistence,
  reserveSlotIndex: 0 | 1
): {
  ok: boolean;
  next: AccountHudPersistence;
  movedName?: string;
  archiveSlotNumber?: number;
  error?: string;
} {
  const party = sanitizePartyDigimons(state.partyDigimons);
  const target = party.find((e) => e.slotIndex === reserveSlotIndex);
  if (!target) {
    return {
      ok: false,
      next: state,
      error: `Círculo reserva ${reserveSlotIndex + 2} já está vago.`,
    };
  }

  const unlockedSlots = getUnlockedArchiveSlots(state);
  const archive = sanitizeDigimonArchive(state.digimonArchive, unlockedSlots);
  const freeArchiveSlot = findFirstFreeArchiveSlot(archive, unlockedSlots);
  if (freeArchiveSlot < 0) {
    return {
      ok: false,
      next: state,
      error: `Digimon Archive cheio (${unlockedSlots}/${unlockedSlots} slots liberados).`,
    };
  }

  const form = getDigimonFormProfile(target.activeFormId);
  const storedEntry: ArchivedDigimonEntry = {
    ...target,
    slotIndex: freeArchiveSlot,
    archivedAt: new Date().toISOString(),
  };

  return {
    ok: true,
    movedName: target.nickname ?? form.name,
    archiveSlotNumber: freeArchiveSlot + 1,
    next: {
      ...state,
      partyDigimons: party.filter((e) => e.slotIndex !== reserveSlotIndex),
      digimonArchive: [...archive, storedEntry].sort(
        (a, b) => a.slotIndex - b.slotIndex
      ),
      unlockedArchiveSlots: unlockedSlots,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function swapActiveDigimonWithArchiveSlot(
  state: AccountHudPersistence,
  currentStarterId: StarterDigimonId,
  slotIndex: number
): {
  ok: boolean;
  next: AccountHudPersistence;
  newStarterId?: StarterDigimonId;
  activatedName?: string;
  storedName?: string;
  error?: string;
} {
  const unlockedSlots = getUnlockedArchiveSlots(state);
  if (slotIndex < 0 || slotIndex >= unlockedSlots) {
    return {
      ok: false,
      next: state,
      error: `Slot #${slotIndex + 1} está trancado. Use um Expansor de Archive (Cash) para liberar.`,
    };
  }

  const archive = sanitizeDigimonArchive(state.digimonArchive, unlockedSlots);
  const target = archive.find((e) => e.slotIndex === slotIndex);
  if (!target) {
    return {
      ok: false,
      next: state,
      error: `O Slot #${slotIndex + 1} do Digimon Archive está vazio.`,
    };
  }

  const currentForm = resolveActiveFormProfile(
    currentStarterId,
    state.digimon.activeFormId
  );
  const currentGrade = getHatchQualityProfile(state.digimon.hatchGrade).grade;
  const currentSizePct = clampHatchSizePct(
    currentGrade,
    state.digimon.hatchSizePct
  );

  const archivedOutgoing: ArchivedDigimonEntry = {
    id: `arch_${currentForm.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    slotIndex,
    starterId: currentForm.starterId,
    activeFormId: currentForm.id,
    nickname: state.digimon.nickname,
    level: state.digimon.level,
    exp: state.digimon.exp,
    expToNext: calcDigimonExpToNext(state.digimon.level),
    hp: Math.max(1, Math.min(state.digimon.maxHp, state.digimon.hp)),
    maxHp: state.digimon.maxHp,
    ds: Math.max(0, Math.min(state.digimon.maxDs, state.digimon.ds)),
    maxDs: state.digimon.maxDs,
    unlockedFormIds: sanitizeUnlockedFormIdsForDigimon(
      currentForm.starterId,
      state.digimon.level,
      state.digimon.unlockedFormIds,
      currentForm.id
    ),
    hatchGrade: currentGrade,
    hatchSizePct: currentSizePct,
    archivedAt: new Date().toISOString(),
  };

  const incomingForm = getDigimonFormProfile(target.activeFormId);
  const incomingGrade = getHatchQualityProfile(target.hatchGrade).grade;
  const incomingSizePct = clampHatchSizePct(incomingGrade, target.hatchSizePct);
  const incomingMaxHp = calcDigimonMaxHp(
    target.level,
    incomingForm.id,
    incomingGrade,
    incomingSizePct
  );
  const incomingMaxDs = calcDigimonMaxDs(
    target.level,
    incomingForm.id,
    incomingGrade,
    incomingSizePct
  );
  const incomingExpToNext = calcDigimonExpToNext(target.level);

  const nextArchive = archive
    .filter((e) => e.slotIndex !== slotIndex)
    .concat(archivedOutgoing)
    .sort((a, b) => a.slotIndex - b.slotIndex);

  return {
    ok: true,
    newStarterId: incomingForm.starterId,
    activatedName: target.nickname ?? incomingForm.name,
    storedName: state.digimon.nickname ?? currentForm.name,
    next: {
      ...state,
      digimon: {
        level: target.level,
        exp: Math.max(0, Math.min(incomingExpToNext - 1, target.exp)),
        expToNext: incomingExpToNext,
        hp: Math.max(1, Math.min(incomingMaxHp, target.hp)),
        maxHp: incomingMaxHp,
        ds: Math.max(0, Math.min(incomingMaxDs, target.ds)),
        maxDs: incomingMaxDs,
        activeFormId: incomingForm.id,
        nickname: target.nickname,
        unlockedFormIds: sanitizeUnlockedFormIdsForDigimon(
          incomingForm.starterId,
          target.level,
          target.unlockedFormIds,
          incomingForm.id
        ),
        hatchGrade: incomingGrade,
        hatchSizePct: incomingSizePct,
      },
      digimonArchive: nextArchive,
      unlockedArchiveSlots: unlockedSlots,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function renameArchivedDigimon(
  state: AccountHudPersistence,
  slotIndex: number,
  rawNickname: string
): { ok: boolean; next: AccountHudPersistence; error?: string } {
  const unlockedSlots = getUnlockedArchiveSlots(state);
  const archive = sanitizeDigimonArchive(state.digimonArchive, unlockedSlots);
  const idx = archive.findIndex((e) => e.slotIndex === slotIndex);
  if (idx < 0) {
    return {
      ok: false,
      next: state,
      error: 'Digimon não encontrado neste slot.',
    };
  }
  const clean = rawNickname.trim().slice(0, 16);
  const updated = [...archive];
  updated[idx] = {
    ...updated[idx],
    nickname: clean || undefined,
  };
  return {
    ok: true,
    next: {
      ...state,
      digimonArchive: updated,
      unlockedArchiveSlots: unlockedSlots,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function releaseArchivedDigimon(
  state: AccountHudPersistence,
  slotIndex: number
): {
  ok: boolean;
  next: AccountHudPersistence;
  releasedName?: string;
  error?: string;
} {
  const unlockedSlots = getUnlockedArchiveSlots(state);
  const archive = sanitizeDigimonArchive(state.digimonArchive, unlockedSlots);
  const target = archive.find((e) => e.slotIndex === slotIndex);
  if (!target) {
    return { ok: false, next: state, error: 'Slot já está vazio.' };
  }
  const form = getDigimonFormProfile(target.activeFormId);
  const nextArchive = archive.filter((e) => e.slotIndex !== slotIndex);
  return {
    ok: true,
    releasedName: target.nickname ?? form.name,
    next: {
      ...state,
      digimonArchive: nextArchive,
      unlockedArchiveSlots: unlockedSlots,
      updatedAt: new Date().toISOString(),
    },
  };
}
