import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  CheckCircle2,
  Database,
  Lock,
  LogOut,
  Trash2,
  X,
} from 'lucide-react';
import { getHatchQualityProfile } from '../../data/itemsCatalog';
import {
  ARCHIVE_TOTAL_SLOTS,
  getUnlockedArchiveSlots,
  sanitizeDigimonArchive,
  sanitizePartyDigimons,
} from '../../services/archiveService';
import {
  computeDerivedDigimonAttributes,
  computeTamerAttributes,
} from '../../services/hudGameService';
import {
  getDigimonFormProfile,
  type DigimonFormProfile,
} from '../../types/digimon';
import type {
  AccountHudPersistence,
  ArchivedDigimonEntry,
  DigimonRuntimeStats,
} from '../../types/hud';

interface DigimonArchiveModalProps {
  hudAccount: AccountHudPersistence;
  activeDigimon: DigimonFormProfile;
  activeDigimonStats: DigimonRuntimeStats;
  onSwapWithSlot: (slotIndex: number) => {
    ok: boolean;
    message: string;
  };
  onMoveArchiveToParty?: (slotIndex: number) => {
    ok: boolean;
    message: string;
  };
  onMovePartyToArchive?: (reserveIndex: 0 | 1) => {
    ok: boolean;
    message: string;
  };
  onReleaseSlot: (slotIndex: number) => {
    ok: boolean;
    message: string;
  };
  onPlayTone: (tone: 'click' | 'confirm' | 'error') => void;
  onClose: () => void;
}

const ARCHIVE_MACHINE_ART = '/assets/dats/digimon_archive_machine.png';

function formatSlotCode(indexZeroBased: number): string {
  return String(indexZeroBased + 1).padStart(2, '0');
}

function getGradeBadgeClasses(grade: 3 | 4 | 5): string {
  if (grade === 5) {
    return 'border-amber-300/80 bg-amber-950/85 text-amber-200';
  }
  if (grade === 4) {
    return 'border-purple-300/80 bg-purple-950/85 text-purple-200';
  }
  return 'border-cyan-300/75 bg-cyan-950/85 text-cyan-200';
}

export function DigimonArchiveModal({
  hudAccount,
  activeDigimon,
  activeDigimonStats,
  onSwapWithSlot,
  onMoveArchiveToParty,
  onMovePartyToArchive,
  onReleaseSlot,
  onPlayTone,
  onClose,
}: DigimonArchiveModalProps) {
  const unlockedSlots = getUnlockedArchiveSlots(hudAccount);
  const lockedSlotsCount = Math.max(0, ARCHIVE_TOTAL_SLOTS - unlockedSlots);

  const archiveEntries = useMemo(
    () => sanitizeDigimonArchive(hudAccount.digimonArchive, unlockedSlots),
    [hudAccount.digimonArchive, unlockedSlots]
  );

  const partyEntries = useMemo(
    () => sanitizePartyDigimons(hudAccount.partyDigimons),
    [hudAccount.partyDigimons]
  );

  const entryBySlot = useMemo(() => {
    const map = new Map<number, ArchivedDigimonEntry>();
    for (const entry of archiveEntries) {
      map.set(entry.slotIndex, entry);
    }
    return map;
  }, [archiveEntries]);

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(() => {
    return archiveEntries[0]?.slotIndex ?? 0;
  });
  const [confirmingReleaseSlot, setConfirmingReleaseSlot] = useState<
    number | null
  >(null);
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const isSelectedLocked = selectedSlotIndex >= unlockedSlots;
  const selectedEntry = isSelectedLocked
    ? null
    : entryBySlot.get(selectedSlotIndex) ?? null;

  const selectedForm = selectedEntry
    ? getDigimonFormProfile(selectedEntry.activeFormId)
    : null;
  const selectedQuality = selectedEntry
    ? getHatchQualityProfile(selectedEntry.hatchGrade)
    : null;

  const selectedComputed = useMemo(() => {
    if (!selectedEntry || !selectedForm) return null;
    const tamerAttrs = computeTamerAttributes(
      hudAccount.tamer,
      hudAccount.equippedItems
    );
    return computeDerivedDigimonAttributes(
      tamerAttrs,
      {
        level: selectedEntry.level,
        exp: selectedEntry.exp,
        expToNext: selectedEntry.expToNext,
        hp: selectedEntry.hp,
        maxHp: selectedEntry.maxHp,
        ds: selectedEntry.ds,
        maxDs: selectedEntry.maxDs,
        activeFormId: selectedEntry.activeFormId,
        unlockedFormIds: selectedEntry.unlockedFormIds,
        hatchGrade: selectedEntry.hatchGrade,
        hatchSizePct: selectedEntry.hatchSizePct,
      },
      hudAccount.defeatedEnemiesTotal,
      selectedForm.id
    );
  }, [
    hudAccount.defeatedEnemiesTotal,
    hudAccount.equippedItems,
    hudAccount.tamer,
    selectedEntry,
    selectedForm,
  ]);

  const activeQuality = getHatchQualityProfile(activeDigimonStats.hatchGrade);
  const activeHpPct = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (activeDigimonStats.hp / Math.max(1, activeDigimonStats.maxHp)) * 100
      )
    )
  );
  const activeDsPct = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (activeDigimonStats.ds / Math.max(1, activeDigimonStats.maxDs)) * 100
      )
    )
  );

  function handleSelectSlot(slotIdx: number) {
    onPlayTone('click');
    setSelectedSlotIndex(slotIdx);
    setConfirmingReleaseSlot(null);
  }

  function handleSwapPartner() {
    if (!selectedEntry) return;
    const res = onSwapWithSlot(selectedEntry.slotIndex);
    setConfirmingReleaseSlot(null);
    setFeedback({
      tone: res.ok ? 'success' : 'error',
      text: res.message,
    });
  }

  function handleMoveToParty() {
    if (!selectedEntry || !onMoveArchiveToParty) return;
    const res = onMoveArchiveToParty(selectedEntry.slotIndex);
    setConfirmingReleaseSlot(null);
    setFeedback({
      tone: res.ok ? 'success' : 'error',
      text: res.message,
    });
  }

  function handleStoreReserveToArchive(reserveIdx: 0 | 1) {
    if (!onMovePartyToArchive) return;
    const res = onMovePartyToArchive(reserveIdx);
    setFeedback({
      tone: res.ok ? 'info' : 'error',
      text: res.message,
    });
  }

  function handleConfirmRelease() {
    if (!selectedEntry) return;
    const res = onReleaseSlot(selectedEntry.slotIndex);
    setConfirmingReleaseSlot(null);
    setFeedback({
      tone: res.ok ? 'info' : 'error',
      text: res.message,
    });
  }

  const unlockedIndices = Array.from({ length: unlockedSlots }, (_, i) => i);
  const lockedIndices = Array.from(
    { length: lockedSlotsCount },
    (_, offset) => unlockedSlots + offset
  );

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label="Digimon Archive DATS"
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-950/72 p-2 backdrop-blur-[3px] sm:p-4 select-none"
    >
      <div className="clip-cyber-panel flex h-[min(calc(100dvh-20px),680px)] w-full max-w-[960px] flex-col bg-gradient-to-b from-[#7af2ff] via-[#38bdf8] to-[#e879f9] p-[2px] shadow-[0_0_46px_rgba(56,232,255,0.42)]">
        <div className="clip-cyber-panel dmo-cyber-matrix-bg flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* ================= HEADER BAR ================= */}
          <div className="relative flex h-11 shrink-0 items-center justify-between border-b border-[#3ad5ff]/75 bg-gradient-to-r from-[#062468] via-[#1248b5] to-[#2e1065] px-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-fuchsia-300/70 bg-[#051845] shadow-[0_0_12px_rgba(232,121,249,0.4)]">
                <Database className="h-4 w-4 text-fuchsia-300" />
              </div>
              <h2 className="truncate text-sm font-black italic tracking-wide text-white drop-shadow sm:text-base">
                Digimon Archive
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-1.5 text-[11px] font-bold tabular-nums text-cyan-100/90 sm:flex">
                <span>
                  Liberados: {archiveEntries.length}/{unlockedSlots}
                </span>
                <span aria-hidden="true" className="text-cyan-400/70">
                  ·
                </span>
                <span className="text-fuchsia-200/90">
                  Capacidade: {ARCHIVE_TOTAL_SLOTS} slots
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onPlayTone('click');
                  onClose();
                }}
                aria-label="Fechar Digimon Archive"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-200 bg-gradient-to-b from-[#23b6ff] to-[#0447b0] text-white shadow hover:brightness-110 active:scale-95"
              >
                <X className="h-4 w-4 stroke-[2.8]" />
              </button>
            </div>
          </div>

          {/* ================= MAIN TWO-COLUMN WORKSPACE ================= */}
          {/* Mobile (< md): single smooth scroll container reaching Slot #50; Desktop (md+): locked row height [minmax(0,1fr)] with dedicated scrollable right column */}
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto overscroll-contain touch-pan-y p-3 md:grid-cols-[316px_1fr] md:grid-rows-[minmax(0,1fr)] md:overflow-hidden sm:p-4">
            {/* LEFT COLUMN: ACTIVE PARTNER + 2 RESERVE CIRCLES + SELECTED SLOT INSPECTOR */}
            <div className="flex flex-col gap-2.5 md:min-h-0 md:overflow-y-auto md:overscroll-contain md:pr-0.5">
              {/* Active Partner in Field */}
              <div className="shrink-0 rounded-xl border border-cyan-400/50 bg-gradient-to-b from-[#07235e]/95 to-[#031030]/95 p-2.5 shadow-[inset_0_1px_0_rgba(125,211,252,0.2)]">
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-extrabold text-cyan-300">
                  <span>Parceiro Ativo no Campo</span>
                  <span className="tabular-nums text-amber-200">
                    Nv.{activeDigimonStats.level} · {activeQuality.label} (
                    {activeDigimonStats.hatchSizePct ?? 100}%)
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cyan-300/65 bg-[#030d26] p-1 shadow-[0_0_14px_rgba(56,232,255,0.25)]">
                    <img
                      src={activeDigimon.portraitUrl}
                      alt={activeDigimon.name}
                      referrerPolicy="no-referrer"
                      className="h-10 w-10 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-white">
                      {activeDigimonStats.nickname ?? activeDigimon.name}
                    </p>
                    <p className="text-[10px] font-semibold text-sky-200/85">
                      {activeDigimon.stage} · {activeDigimon.element}
                    </p>
                    <div className="mt-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-[8.5px] font-black text-emerald-300">
                          HP
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-900/90">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-lime-400"
                            style={{ width: `${activeHpPct}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-[8.5px] font-bold tabular-nums text-emerald-100">
                          {activeDigimonStats.hp}/{activeDigimonStats.maxHp}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 text-[8.5px] font-black text-cyan-300">
                          DS
                        </span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-900/90">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-cyan-300"
                            style={{ width: `${activeDsPct}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-[8.5px] font-bold tabular-nums text-cyan-100">
                          {activeDigimonStats.ds}/{activeDigimonStats.maxDs}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact 2 Reserve Party Circles Strip (Up to 3 Digimons with Tamer) */}
                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-cyan-400/25 pt-2">
                  <div className="min-w-0">
                    <p className="text-[9.5px] font-extrabold text-cyan-200">
                      Equipe Reserva ({partyEntries.length}/2)
                    </p>
                    <p className="text-[8.5px] text-slate-300">
                      Círculos abaixo do HUD · clique para guardar
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {([0, 1] as const).map((reserveIdx) => {
                      const resEntry =
                        partyEntries.find((p) => p.slotIndex === reserveIdx) ??
                        null;
                      const resForm = resEntry
                        ? getDigimonFormProfile(resEntry.activeFormId)
                        : null;
                      return (
                        <button
                          key={`arch-reserve-${reserveIdx}`}
                          type="button"
                          onClick={() => {
                            if (resEntry) {
                              handleStoreReserveToArchive(reserveIdx);
                            } else {
                              onPlayTone('click');
                              setFeedback({
                                tone: 'info',
                                text: `Círculo reserva ${reserveIdx + 2} vago. Selecione um Digimon no Archive e clique em "Enviar p/ Equipe".`,
                              });
                            }
                          }}
                          title={
                            resEntry && resForm
                              ? `Guardar ${resEntry.nickname ?? resForm.name} (Nv.${resEntry.level}) no Digimon Archive`
                              : `Círculo reserva ${reserveIdx + 2} vago`
                          }
                          className={`relative flex h-10 w-10 items-center justify-center rounded-full border transition active:scale-95 ${
                            resEntry && resForm
                              ? 'border-cyan-300 bg-[#07235e] p-0.5 shadow-[0_0_10px_rgba(56,232,255,0.35)] hover:border-amber-300'
                              : 'border-dashed border-cyan-400/40 bg-[#030d26] text-cyan-300/45 hover:border-cyan-200/70'
                          }`}
                        >
                          {resEntry && resForm ? (
                            <>
                              <img
                                src={resForm.portraitUrl}
                                alt={resEntry.nickname ?? resForm.name}
                                referrerPolicy="no-referrer"
                                className="h-8 w-8 rounded-full object-contain"
                              />
                              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-cyan-300/70 bg-[#04143b] text-cyan-200">
                                <ArrowDownToLine className="h-2.5 w-2.5" />
                              </span>
                            </>
                          ) : (
                            <span className="text-[9.5px] font-black">
                              {reserveIdx + 2}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Selected Slot Inspector / Holographic Terminal Chamber */}
              <div className="flex min-h-[250px] flex-1 flex-col rounded-xl border border-fuchsia-400/45 bg-gradient-to-b from-[#061844]/95 via-[#041030]/95 to-[#02081c]/98 p-3 shadow-[inset_0_0_24px_rgba(14,165,233,0.14)]">
                <div className="flex shrink-0 items-center justify-between border-b border-cyan-400/25 pb-1.5 text-[10.5px] font-extrabold">
                  <span className="text-fuchsia-200">
                    Slot #{formatSlotCode(selectedSlotIndex)} /{' '}
                    {ARCHIVE_TOTAL_SLOTS}
                  </span>
                  <span className="text-cyan-200/85">
                    {isSelectedLocked
                      ? 'Trancado'
                      : selectedEntry
                        ? 'Ocupado'
                        : 'Disponível'}
                  </span>
                </div>

                {isSelectedLocked ? (
                  <div className="my-auto flex flex-col items-center justify-center px-2 py-3 text-center">
                    <div className="relative mb-2 flex h-24 w-24 items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-fuchsia-500/15 blur-xl" />
                      <img
                        src={ARCHIVE_MACHINE_ART}
                        alt="Terminal Digimon Archive"
                        referrerPolicy="no-referrer"
                        className="relative h-24 w-auto object-contain opacity-65 drop-shadow-[0_4px_14px_rgba(232,121,249,0.35)]"
                      />
                      <div className="absolute flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300/80 bg-[#04102e]/95 text-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.4)]">
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-xs font-black text-amber-200">
                      Espaço Bloqueado (#{formatSlotCode(selectedSlotIndex)})
                    </p>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-slate-200/90">
                      Você possui{' '}
                      <span className="font-extrabold text-cyan-200">
                        {unlockedSlots} de {ARCHIVE_TOTAL_SLOTS}
                      </span>{' '}
                      slots liberados no Digimon Archive.
                    </p>
                    <p className="mt-1 text-[10px] leading-relaxed text-fuchsia-200/85">
                      Os slots trancados poderão ser desbloqueados futuramente
                      com o item{' '}
                      <span className="font-extrabold text-amber-200">
                        Expansor de Archive (Cash)
                      </span>
                      .
                    </p>
                  </div>
                ) : selectedEntry && selectedForm && selectedQuality ? (
                  <div className="flex flex-1 flex-col pt-2">
                    {/* Holographic Digimon Pedestal Preview */}
                    <div className="relative flex flex-col items-center justify-center rounded-xl border border-cyan-400/25 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.22)_0%,rgba(2,10,32,0.92)_72%)] px-3 py-2">
                      <img
                        src={selectedForm.portraitUrl}
                        alt={selectedEntry.nickname ?? selectedForm.name}
                        referrerPolicy="no-referrer"
                        className="h-16 w-16 object-contain drop-shadow-[0_4px_14px_rgba(56,232,255,0.48)]"
                      />
                      <div className="mt-1 h-1.5 w-20 rounded-full border border-cyan-300/60 bg-cyan-400/25 shadow-[0_0_14px_rgba(56,232,255,0.5)]" />

                      <div className="mt-1 flex items-center justify-center">
                        <p className="truncate text-sm font-black text-white">
                          {selectedEntry.nickname ?? selectedForm.name}
                        </p>
                      </div>

                      <p className="mt-0.5 text-[10px] font-bold tabular-nums text-cyan-200">
                        {selectedForm.stage} · Nv.{selectedEntry.level} ·{' '}
                        <span className="text-amber-200">
                          {selectedQuality.label} ({selectedEntry.hatchSizePct}
                          %)
                        </span>
                      </p>
                    </div>

                    {selectedComputed && (
                      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-[#041236] px-2 py-1">
                          <span className="font-bold text-emerald-300">HP</span>
                          <span className="font-black tabular-nums text-white">
                            {selectedEntry.maxHp.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-[#041236] px-2 py-1">
                          <span className="font-bold text-cyan-300">DS</span>
                          <span className="font-black tabular-nums text-white">
                            {selectedEntry.maxDs.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-[#041236] px-2 py-1">
                          <span className="font-bold text-amber-300">AT</span>
                          <span className="font-black tabular-nums text-white">
                            {selectedComputed.attack.toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-cyan-400/20 bg-[#041236] px-2 py-1">
                          <span className="font-bold text-sky-300">DE</span>
                          <span className="font-black tabular-nums text-white">
                            {selectedComputed.defense.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Controls */}
                    <div className="mt-auto flex flex-col gap-1.5 pt-2">
                      <button
                        type="button"
                        onClick={handleSwapPartner}
                        className="clip-cyber-tab flex min-h-[36px] w-full items-center justify-center bg-gradient-to-b from-[#fff59d] via-[#fbbf24] to-[#b45309] p-[1.5px] shadow-[0_0_16px_rgba(245,158,11,0.35)] transition hover:brightness-110 active:scale-[0.98]"
                      >
                        <span className="clip-cyber-tab flex h-full w-full items-center justify-center gap-1.5 bg-gradient-to-b from-[#f59e0b] via-[#d97706] to-[#92400e] px-3 py-1 text-xs font-black tracking-wide text-white whitespace-nowrap">
                          <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
                          <span>Ativar Parceiro (Trocar)</span>
                        </span>
                      </button>

                      {onMoveArchiveToParty && (
                        <button
                          type="button"
                          onClick={handleMoveToParty}
                          className="flex min-h-[32px] w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-300/65 bg-cyan-950/75 px-3 py-1 text-[10.5px] font-extrabold text-cyan-100 transition hover:bg-cyan-900/80 active:scale-[0.98]"
                        >
                          <ArrowUpFromLine className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                          <span>Enviar p/ Equipe (2 Círculos)</span>
                        </button>
                      )}

                      {confirmingReleaseSlot === selectedEntry.slotIndex ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={handleConfirmRelease}
                            className="rounded-lg border border-rose-300/80 bg-rose-700 py-1.5 text-[10.5px] font-black text-white hover:bg-rose-600"
                          >
                            Confirmar Liberação
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingReleaseSlot(null)}
                            className="rounded-lg border border-slate-500 bg-slate-800 py-1.5 text-[10.5px] font-bold text-slate-200 hover:bg-slate-700"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onPlayTone('click');
                            setConfirmingReleaseSlot(selectedEntry.slotIndex);
                          }}
                          className="flex min-h-[30px] w-full items-center justify-center gap-1.5 rounded-lg border border-rose-400/50 bg-rose-950/65 px-3 py-1 text-[10.5px] font-extrabold text-rose-200 transition hover:bg-rose-900/80"
                        >
                          <Trash2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Liberar Digimon</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="my-auto flex flex-col items-center justify-center px-2 py-2 text-center">
                    <div className="relative mb-2 flex h-28 w-28 items-center justify-center">
                      <div className="absolute inset-2 rounded-full bg-cyan-400/18 blur-xl" />
                      <img
                        src={ARCHIVE_MACHINE_ART}
                        alt="Terminal Digimon Archive DATS"
                        referrerPolicy="no-referrer"
                        className="relative h-28 w-auto object-contain drop-shadow-[0_6px_16px_rgba(56,232,255,0.45)]"
                      />
                    </div>
                    <p className="text-xs font-black text-cyan-100">
                      Slot #{formatSlotCode(selectedSlotIndex)} Disponível
                    </p>
                    <p className="mt-1 text-[10.5px] leading-relaxed text-sky-100/80">
                      Choque um DigiEgg na{' '}
                      <span className="font-extrabold text-amber-200">
                        Incubadora de Digimon
                      </span>{' '}
                      ao lado para armazenar seu novo parceiro automaticamente
                      neste espaço.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: FULL 50-SLOT DIGIMON ARCHIVE GRID (SMOOTH SCROLL ALL THE WAY TO #50) */}
            <div className="flex flex-col rounded-xl border border-cyan-400/45 bg-[#031031]/90 p-3 md:h-full md:min-h-0 md:overflow-hidden">
              {/* Fixed Top Section Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-cyan-400/25 pb-2">
                <span className="text-xs font-black tracking-wide text-white">
                  Slots Liberados (1–{unlockedSlots})
                </span>
                <span className="text-[10.5px] font-bold tabular-nums text-cyan-200">
                  {archiveEntries.length}/{unlockedSlots} em uso ·{' '}
                  {ARCHIVE_TOTAL_SLOTS} total
                </span>
              </div>

              {/* Single Unified Scroll Area for ALL 50 Slots (#01 through #50) */}
              <div className="mt-2.5 pb-6 md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain md:pr-1.5">
                {/* Unlocked Slots Grid */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {unlockedIndices.map((slotIdx) => {
                    const entry = entryBySlot.get(slotIdx) ?? null;
                    const form = entry
                      ? getDigimonFormProfile(entry.activeFormId)
                      : null;
                    const isSelected = selectedSlotIndex === slotIdx;

                    return (
                      <button
                        key={`archive-open-${slotIdx}`}
                        type="button"
                        onClick={() => handleSelectSlot(slotIdx)}
                        className={`relative flex min-h-[104px] flex-col items-center justify-between rounded-xl border p-2 text-center transition ${
                          isSelected
                            ? 'border-amber-300 bg-gradient-to-b from-[#103d9c] to-[#051847] shadow-[0_0_16px_rgba(251,191,36,0.45)]'
                            : entry
                              ? 'border-cyan-400/65 bg-gradient-to-b from-[#08266b] to-[#031033] hover:border-cyan-200'
                              : 'border-cyan-500/35 bg-gradient-to-b from-[#04163d] to-[#020a21] hover:border-cyan-300/70'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between text-[8.5px] font-black tabular-nums">
                          <span className="text-cyan-300/85">
                            #{formatSlotCode(slotIdx)}
                          </span>
                          {entry ? (
                            <span
                              className={`rounded border px-1 py-[1px] text-[8px] font-black ${getGradeBadgeClasses(entry.hatchGrade)}`}
                            >
                              {entry.hatchGrade}/5
                            </span>
                          ) : (
                            <span className="text-cyan-200/45">Livre</span>
                          )}
                        </div>

                        {entry && form ? (
                          <>
                            <img
                              src={form.portraitUrl}
                              alt={entry.nickname ?? form.name}
                              referrerPolicy="no-referrer"
                              className="h-11 w-11 object-contain drop-shadow-[0_2px_8px_rgba(56,232,255,0.45)]"
                            />
                            <div className="w-full">
                              <p className="truncate text-[10px] font-black text-white">
                                {entry.nickname ?? form.name}
                              </p>
                              <p className="text-[8.5px] font-bold tabular-nums text-cyan-200/85">
                                Nv.{entry.level} · {entry.hatchSizePct}%
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="my-auto flex flex-col items-center justify-center gap-1.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-cyan-400/35 bg-cyan-500/5 text-cyan-300/45">
                              <Database className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[9px] font-bold text-cyan-200/50">
                              Espaço Livre
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Locked Slots Divider & Grid (#unlocked+1 .. #50) */}
                {lockedSlotsCount > 0 && (
                  <>
                    <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-fuchsia-400/25 pt-2.5 text-[10.5px]">
                      <span className="flex items-center gap-1.5 font-extrabold text-amber-200">
                        <Lock className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                        <span>
                          Slots Trancados ({unlockedSlots + 1}–
                          {ARCHIVE_TOTAL_SLOTS})
                        </span>
                      </span>
                      <span className="text-[10px] font-semibold text-fuchsia-200/85">
                        Expansor Cash em breve
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-5 gap-1.5 sm:grid-cols-6">
                      {lockedIndices.map((slotIdx) => {
                        const isSelected = selectedSlotIndex === slotIdx;
                        return (
                          <button
                            key={`archive-locked-${slotIdx}`}
                            type="button"
                            onClick={() => handleSelectSlot(slotIdx)}
                            title={`Slot #${formatSlotCode(slotIdx)} trancado — Liberado com item Cash futuramente`}
                            className={`relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-lg border transition ${
                              isSelected
                                ? 'border-amber-300/90 bg-[#0e1e47] shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                                : 'border-slate-700/75 bg-[#02081b]/90 hover:border-fuchsia-400/55'
                            }`}
                          >
                            <Lock
                              className={`h-3.5 w-3.5 ${
                                isSelected ? 'text-amber-300' : 'text-slate-500'
                              }`}
                            />
                            <span
                              className={`text-[8.5px] font-bold tabular-nums ${
                                isSelected ? 'text-amber-200' : 'text-slate-500'
                              }`}
                            >
                              #{formatSlotCode(slotIdx)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ================= FOOTER BAR ================= */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-cyan-400/35 bg-[#04143b]/95 px-3 py-2 sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-[11px] font-bold">
              {feedback ? (
                <>
                  {feedback.tone === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                  ) : feedback.tone === 'error' ? (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-300" />
                  ) : (
                    <Database className="h-4 w-4 shrink-0 text-cyan-300" />
                  )}
                  <span
                    className={`truncate ${
                      feedback.tone === 'success'
                        ? 'text-emerald-200'
                        : feedback.tone === 'error'
                          ? 'text-rose-200'
                          : 'text-cyan-100'
                    }`}
                  >
                    {feedback.text}
                  </span>
                </>
              ) : (
                <span className="truncate text-cyan-100/80">
                  Armazene, leve até 3 Digimons na equipe e role até o Slot #50.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                onPlayTone('click');
                onClose();
              }}
              className="clip-cyber-tab flex min-h-[34px] shrink-0 items-center justify-center bg-gradient-to-b from-[#fda4af] via-[#e11d48] to-[#881337] p-[1.5px] shadow-[0_0_12px_rgba(225,29,72,0.35)] transition hover:brightness-115 active:scale-[0.98]"
            >
              <span className="clip-cyber-tab flex h-full w-full items-center justify-center gap-1.5 bg-gradient-to-b from-[#be123c] to-[#6e0922] px-4 py-1 text-xs font-extrabold tracking-wide text-white whitespace-nowrap">
                <LogOut className="h-3.5 w-3.5 text-rose-100" />
                <span>Sair</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
