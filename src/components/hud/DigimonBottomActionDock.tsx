import { memo, useEffect, useMemo, useState } from 'react';
import { Heart, Lock, Plus, RefreshCw, Trash2, X, Zap } from 'lucide-react';
import { getDmoSkillSpec } from '../../data/dmoSkillCatalog';
import {
  EVOLUTER_ICON_URL,
  getCatalogItemByKey,
} from '../../data/itemsCatalog';
import {
  DIGIMON_EVOLUTION_CHAINS,
  isEvolutionSlotUnlockedByEvoluter,
} from '../../services/hudGameService';
import {
  getDigimonFormProfile,
  resolveStarterIdForForm,
  type DigimonFormId,
  type DigimonFormProfile,
  type StarterDigimonId,
} from '../../types/digimon';
import type {
  DigimonRuntimeStats,
  InventoryItem,
  LiveWorldHudSnapshot,
} from '../../types/hud';
import {
  getDigimonSkillFallbackUrl,
  getDigimonSkillIconUrl,
  getDigimonSkillTheme,
} from '../../utils/skillIcons';

interface DigimonBottomActionDockProps {
  digimon: DigimonFormProfile;
  starterId?: StarterDigimonId;
  stats: DigimonRuntimeStats;
  snapshot: LiveWorldHudSnapshot;
  ownedEvoluters?: number;
  inventory?: readonly InventoryItem[];
  foodSlotItemKey?: string | null;
  vitaminSlotItemKey?: string | null;
  onTriggerSkill: (kind: 'special1' | 'special2') => void;
  onEvolveForm: (targetFormId: DigimonFormId) => void;
  onRequestUnlockForm?: (targetFormId: DigimonFormId) => void;
  onUseQuickSlot?: (slot: 'food' | 'vitamin') => void;
  onAssignQuickSlot?: (
    slot: 'food' | 'vitamin',
    itemKey: string | null
  ) => void;
}

const STAGE_SHORT_TAG: Record<string, string> = {
  Rookie: 'R',
  Champion: 'C',
  Ultimate: 'U',
  Mega: 'M',
};

/**
 * Bottom-center Digimon action cluster anchored cleanly between the virtual joystick and MENU:
 * - Top row (4 aligned squares):
 *     [F1] above Rookie · [F2] above Champion · [Comida HP] above Ultimate · [Vitamina DS] above Mega
 * - Bottom row (4 aligned squares):
 *     [Rookie] [Champion] [Ultimate] [Mega]
 */
export const DigimonBottomActionDock = memo(function DigimonBottomActionDock({
  digimon,
  starterId,
  stats,
  snapshot,
  ownedEvoluters = 0,
  inventory = [],
  foodSlotItemKey = null,
  vitaminSlotItemKey = null,
  onTriggerSkill,
  onEvolveForm,
  onRequestUnlockForm,
  onUseQuickSlot,
  onAssignQuickSlot,
}: DigimonBottomActionDockProps) {
  const [openPickerSlot, setOpenPickerSlot] = useState<
    'food' | 'vitamin' | null
  >(null);

  useEffect(() => {
    if (!openPickerSlot) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenPickerSlot(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [openPickerSlot]);

  const foodOptions = useMemo(
    () =>
      inventory.filter(
        (it) =>
          it.category === 'consumable' &&
          (it.hpRestore ?? 0) > 0 &&
          it.quantity > 0
      ),
    [inventory]
  );

  const vitaminOptions = useMemo(
    () =>
      inventory.filter(
        (it) =>
          it.category === 'consumable' &&
          (it.dsRestore ?? 0) > 0 &&
          it.quantity > 0
      ),
    [inventory]
  );

  const assignedFoodItem = useMemo(
    () =>
      foodSlotItemKey
        ? inventory.find((it) => it.itemKey === foodSlotItemKey) ?? null
        : null,
    [inventory, foodSlotItemKey]
  );

  const assignedVitaminItem = useMemo(
    () =>
      vitaminSlotItemKey
        ? inventory.find((it) => it.itemKey === vitaminSlotItemKey) ?? null
        : null,
    [inventory, vitaminSlotItemKey]
  );

  const assignedFoodCatalog = useMemo(
    () => (foodSlotItemKey ? getCatalogItemByKey(foodSlotItemKey) : null),
    [foodSlotItemKey]
  );

  const assignedVitaminCatalog = useMemo(
    () =>
      vitaminSlotItemKey ? getCatalogItemByKey(vitaminSlotItemKey) : null,
    [vitaminSlotItemKey]
  );

  const inCombatArea =
    snapshot.mapId !== 'dats-center' && !snapshot.inSafeZone;
  const skillTheme = getDigimonSkillTheme(digimon.id);
  const f1Spec = getDmoSkillSpec(digimon.id, 'f1');
  const f2Spec = getDmoSkillSpec(digimon.id, 'f2');

  const s1Cd = snapshot.special1Cooldown;
  const s1Max = Math.max(0.1, snapshot.special1MaxCooldown);
  const s1Pct = Math.min(100, Math.max(0, (s1Cd / s1Max) * 100));
  const s1LowDs = stats.ds < f1Spec.dsCost;
  const s1Disabled = !inCombatArea || s1Cd > 0 || s1LowDs;

  const s2Cd = snapshot.special2Cooldown;
  const s2Max = Math.max(0.1, snapshot.special2MaxCooldown);
  const s2Pct = Math.min(100, Math.max(0, (s2Cd / s2Max) * 100));
  const s2LowDs = stats.ds < f2Spec.dsCost;
  const s2Disabled = !inCombatArea || s2Cd > 0 || s2LowDs;

  const skillSlots = [
    {
      slotKey: 'f1' as const,
      keyLabel: 'F1',
      kind: 'special1' as const,
      name: f1Spec.name,
      dsCost: f1Spec.dsCost,
      cooldownSec: f1Spec.cooldownSec,
      cdRemaining: s1Cd,
      cdPct: s1Pct,
      lowDs: s1LowDs,
      disabled: s1Disabled,
      iconUrl: getDigimonSkillIconUrl(digimon.id, 'f1'),
      fallbackUrl: getDigimonSkillFallbackUrl(digimon.id, 'f1'),
    },
    {
      slotKey: 'f2' as const,
      keyLabel: 'F2',
      kind: 'special2' as const,
      name: f2Spec.name,
      dsCost: f2Spec.dsCost,
      cooldownSec: f2Spec.cooldownSec,
      cdRemaining: s2Cd,
      cdPct: s2Pct,
      lowDs: s2LowDs,
      disabled: s2Disabled,
      iconUrl: getDigimonSkillIconUrl(digimon.id, 'f2'),
      fallbackUrl: getDigimonSkillFallbackUrl(digimon.id, 'f2'),
    },
  ];

  const effectiveStarterId = resolveStarterIdForForm(starterId, digimon.id);
  const evoChain = DIGIMON_EVOLUTION_CHAINS[effectiveStarterId] ?? [];

  const consumableQuickSlots = [
    {
      slot: 'food' as const,
      keyLabel: '1',
      title: 'Comida (HP)',
      emptyHint: 'Clique para colocar Comida (HP)',
      itemKey: foodSlotItemKey,
      invItem: assignedFoodItem,
      catalogItem: assignedFoodCatalog,
      options: foodOptions,
      isFood: true,
    },
    {
      slot: 'vitamin' as const,
      keyLabel: '2',
      title: 'Vitamina (DS)',
      emptyHint: 'Clique para colocar Vitamina (DS)',
      itemKey: vitaminSlotItemKey,
      invItem: assignedVitaminItem,
      catalogItem: assignedVitaminCatalog,
      options: vitaminOptions,
      isFood: false,
    },
  ];

  const activePickerMeta =
    openPickerSlot === 'food'
      ? consumableQuickSlots[0]
      : openPickerSlot === 'vitamin'
        ? consumableQuickSlots[1]
        : null;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className="pointer-events-auto relative flex flex-col items-center gap-1 select-none sm:gap-1.5"
    >
      {/* Upward Consumable Picker Popover (Food HP / Vitamin DS) */}
      {activePickerMeta && (
        <div
          role="dialog"
          aria-label={`Selecionar ${activePickerMeta.title}`}
          className="animate-dmo-window absolute bottom-full left-1/2 z-50 mb-2 w-[min(90vw,268px)] -translate-x-1/2 overflow-hidden rounded-2xl border-2 border-cyan-300/80 bg-gradient-to-b from-[#0b3588]/98 via-[#061d52]/98 to-[#030e2b]/98 p-2.5 shadow-[0_14px_36px_rgba(0,8,34,0.92),0_0_20px_rgba(56,214,255,0.35)]"
        >
          <div className="flex items-center justify-between border-b border-cyan-400/25 pb-1.5">
            <div className="flex items-center gap-1.5">
              {activePickerMeta.isFood ? (
                <Heart className="h-3.5 w-3.5 text-emerald-300" />
              ) : (
                <Zap className="h-3.5 w-3.5 text-cyan-300" />
              )}
              <span className="text-[11px] font-black tracking-wide text-white">
                {activePickerMeta.isFood
                  ? 'Escolher Comida (HP)'
                  : 'Escolher Vitamina (DS)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpenPickerSlot(null)}
              aria-label="Fechar seletor"
              className="flex h-6 w-6 items-center justify-center rounded-md border border-cyan-400/35 bg-[#051a48] text-cyan-200 hover:bg-sky-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {activePickerMeta.options.length > 0 ? (
            <div className="mt-2 max-h-[188px] space-y-1 overflow-y-auto pr-0.5">
              {activePickerMeta.options.map((item) => {
                const isSelected = activePickerMeta.itemKey === item.itemKey;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onAssignQuickSlot?.(activePickerMeta.slot, item.itemKey);
                      setOpenPickerSlot(null);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl border px-2 py-1.5 text-left transition active:scale-[0.98] ${
                      isSelected
                        ? 'border-amber-300/90 bg-amber-500/20'
                        : 'border-cyan-400/25 bg-[#041438]/90 hover:border-cyan-200/80 hover:bg-[#082461]/95'
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-cyan-400/35 bg-[#020b22]">
                      {item.iconUrl ? (
                        <img
                          src={item.iconUrl}
                          alt={item.name}
                          draggable={false}
                          className="h-7 w-7 object-contain"
                        />
                      ) : activePickerMeta.isFood ? (
                        <Heart className="h-4 w-4 text-emerald-300" />
                      ) : (
                        <Zap className="h-4 w-4 text-cyan-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10.5px] font-black text-white">
                        {item.name}
                      </p>
                      <p
                        className={`text-[9.5px] font-bold tabular-nums ${
                          activePickerMeta.isFood
                            ? 'text-emerald-300'
                            : 'text-cyan-300'
                        }`}
                      >
                        {activePickerMeta.isFood
                          ? `+${item.hpRestore} HP`
                          : `+${item.dsRestore} DS`}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md border border-cyan-300/35 bg-[#020a1f] px-1.5 py-0.5 text-[10px] font-black tabular-nums text-amber-200">
                      ×{item.quantity}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 rounded-xl border border-cyan-400/20 bg-[#03102e] px-2.5 py-2.5 text-center text-[10px] font-semibold leading-relaxed text-sky-200/85">
              {activePickerMeta.isFood
                ? 'Você não tem nenhuma Comida (HP) no inventário. Compre na Loja da MudFrigimon no DATS Center.'
                : 'Você não tem nenhuma Vitamina (DS) no inventário. Compre na Loja da MudFrigimon no DATS Center.'}
            </p>
          )}

          {activePickerMeta.itemKey && onAssignQuickSlot && (
            <button
              type="button"
              onClick={() => {
                onAssignQuickSlot(activePickerMeta.slot, null);
                setOpenPickerSlot(null);
              }}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-400/50 bg-rose-950/75 px-2.5 py-1.5 text-[10px] font-black text-rose-200 transition hover:bg-rose-900/90 active:scale-95"
            >
              <Trash2 className="h-3 w-3" />
              <span>Remover do quadrado</span>
            </button>
          )}
        </div>
      )}

      {/* Top Row: [F1] above Rookie · [F2] above Champion · [Food HP] above Ultimate · [Vitamin DS] above Mega */}
      <div
        aria-label="Habilidades e Consumíveis Rápidos"
        className="dmo-frame flex items-center gap-[3px] rounded-lg p-[3px] shadow-[0_6px_18px_rgba(0,10,40,0.75)] sm:gap-1.5 sm:rounded-xl sm:p-1"
      >
        {skillSlots.map((slot) => {
          const isReady = !slot.disabled;
          const isCooling = slot.cdRemaining > 0;
          return (
            <div key={slot.slotKey} className="group/slot relative">
              {/* Upward Hover Tooltip */}
              <div
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-cyan-300/75 bg-[#041130]/96 px-2.5 py-1 text-center opacity-0 shadow-[0_6px_18px_rgba(0,0,0,0.88),0_0_10px_rgba(56,214,255,0.45)] transition-opacity duration-150 group-hover/slot:opacity-100 group-focus-within/slot:opacity-100 sm:block"
              >
                <p className="text-[10.5px] font-black tracking-wide text-white">
                  {slot.name}
                </p>
                <p className="mt-0.5 text-[9px] font-bold tabular-nums text-cyan-200/90">
                  {slot.keyLabel} · {slot.dsCost} DS · {slot.cooldownSec.toFixed(1)}s
                </p>
              </div>

              <button
                type="button"
                onClick={() => onTriggerSkill(slot.kind)}
                title={`${slot.name} (${slot.keyLabel}) · ${slot.dsCost} DS`}
                aria-label={`Usar golpe ${slot.name} (${slot.keyLabel})`}
                className={`relative flex h-[31px] w-[31px] items-center justify-center overflow-hidden rounded-[6px] border bg-[#030b22] transition-all duration-150 active:scale-95 sm:h-10 sm:w-10 sm:rounded-lg ${
                  isReady
                    ? `${skillTheme.readyBorder} ${skillTheme.readyShadow} hover:brightness-110`
                    : isCooling || slot.lowDs
                      ? 'border-slate-500/70 brightness-75'
                      : `${skillTheme.readyBorder} opacity-95 hover:brightness-105`
                }`}
              >
                <img
                  src={slot.iconUrl}
                  alt={slot.name}
                  draggable={false}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.dataset.fallbackApplied) {
                      img.dataset.fallbackApplied = '1';
                      img.src = slot.fallbackUrl;
                    }
                  }}
                  className={`h-full w-full object-cover ${
                    isCooling ? 'saturate-50' : ''
                  }`}
                />

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent"
                />

                {isCooling && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 z-10 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(to top, rgba(2,6,18,0.86) ${slot.cdPct}%, rgba(2,6,18,0.34) ${slot.cdPct}%)`,
                    }}
                  >
                    <span className="text-[9px] font-black tabular-nums text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] sm:text-[10.5px]">
                      {slot.cdRemaining >= 10
                        ? `${Math.ceil(slot.cdRemaining)}s`
                        : `${slot.cdRemaining.toFixed(1)}s`}
                    </span>
                  </div>
                )}

                <span
                  className={`pointer-events-none absolute bottom-[1px] left-[1px] z-20 rounded-[3px] border ${skillTheme.keycapBorder} bg-[#02081a]/92 px-[3px] py-[0.5px] font-display text-[6.5px] font-bold leading-none ${skillTheme.keycapText} shadow-[0_1px_2px_rgba(0,0,0,0.95)] sm:text-[7.5px]`}
                >
                  {slot.keyLabel}
                </span>
              </button>
            </div>
          );
        })}

        {/* Manual Consumable Quick-Slots: [Food HP] above Ultimate, [Vitamin DS] above Mega */}
        {consumableQuickSlots.map((qs) => {
          const qty = qs.invItem?.quantity ?? 0;
          const displayName =
            qs.invItem?.name ?? qs.catalogItem?.name ?? qs.title;
          const displayIcon = qs.invItem?.iconUrl ?? qs.catalogItem?.iconUrl;
          const restoreVal = qs.isFood
            ? qs.invItem?.hpRestore ?? qs.catalogItem?.hpRestore ?? 0
            : qs.invItem?.dsRestore ?? qs.catalogItem?.dsRestore ?? 0;
          const hasAssigned = Boolean(qs.itemKey);
          const hasStock = hasAssigned && qty > 0;
          const isPickerOpen = openPickerSlot === qs.slot;

          return (
            <div key={qs.slot} className="group/qslot relative">
              {/* Upward Hover Tooltip */}
              {!isPickerOpen && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-cyan-300/75 bg-[#041130]/96 px-2.5 py-1 text-center opacity-0 shadow-[0_6px_18px_rgba(0,0,0,0.88),0_0_10px_rgba(56,214,255,0.45)] transition-opacity duration-150 group-hover/qslot:opacity-100 group-focus-within/qslot:opacity-100 sm:block"
                >
                  <p className="text-[10.5px] font-black tracking-wide text-white">
                    {hasAssigned ? displayName : qs.title}
                  </p>
                  <p
                    className={`mt-0.5 text-[9px] font-bold ${
                      qs.isFood ? 'text-emerald-300' : 'text-cyan-300'
                    }`}
                  >
                    {hasStock
                      ? `Tecla ${qs.keyLabel} · +${restoreVal} ${qs.isFood ? 'HP' : 'DS'} · Estoque: ${qty}`
                      : hasAssigned
                        ? 'Sem estoque · Clique para trocar'
                        : qs.emptyHint}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (hasStock && onUseQuickSlot) {
                    setOpenPickerSlot(null);
                    onUseQuickSlot(qs.slot);
                  } else {
                    setOpenPickerSlot((prev) =>
                      prev === qs.slot ? null : qs.slot
                    );
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setOpenPickerSlot((prev) =>
                    prev === qs.slot ? null : qs.slot
                  );
                }}
                title={
                  hasStock
                    ? `Usar ${displayName} (+${restoreVal} ${qs.isFood ? 'HP' : 'DS'}) · Tecla ${qs.keyLabel}`
                    : qs.emptyHint
                }
                aria-label={
                  hasStock
                    ? `Usar ${displayName} (${qs.title})`
                    : `Configurar quadrado de ${qs.title}`
                }
                className={`relative flex h-[31px] w-[31px] items-center justify-center overflow-hidden rounded-[6px] border bg-[#030b22] transition-all duration-150 active:scale-95 sm:h-10 sm:w-10 sm:rounded-lg ${
                  isPickerOpen
                    ? 'border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.7)]'
                    : hasStock
                      ? qs.isFood
                        ? 'border-emerald-400/90 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22)_0%,rgba(3,11,34,0.96)_100%)] shadow-[0_0_8px_rgba(16,185,129,0.4)] hover:brightness-110'
                        : 'border-cyan-300/90 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.24)_0%,rgba(3,11,34,0.96)_100%)] shadow-[0_0_8px_rgba(56,189,248,0.42)] hover:brightness-110'
                      : hasAssigned
                        ? 'border-rose-400/55 bg-[#120714]/90 opacity-80 hover:border-amber-300'
                        : qs.isFood
                          ? 'border-dashed border-emerald-400/60 bg-[#041a24]/85 hover:border-emerald-300'
                          : 'border-dashed border-cyan-400/60 bg-[#041432]/85 hover:border-cyan-300'
                }`}
              >
                {displayIcon ? (
                  <img
                    src={displayIcon}
                    alt={displayName}
                    draggable={false}
                    className={`h-full w-full object-contain p-[2px] ${
                      !hasStock ? 'opacity-45 grayscale' : ''
                    }`}
                  />
                ) : (
                  <span className="flex flex-col items-center justify-center leading-none">
                    {qs.isFood ? (
                      <Heart className="h-3.5 w-3.5 text-emerald-300/85 sm:h-4 sm:w-4" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 text-cyan-300/85 sm:h-4 sm:w-4" />
                    )}
                    <Plus className="mt-[1px] h-2 w-2 text-white/75 sm:h-2.5 sm:w-2.5" />
                  </span>
                )}

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent"
                />

                {/* Keybind badge (1 = Comida, 2 = Vitamina) */}
                <span
                  className={`pointer-events-none absolute bottom-[1px] left-[1px] z-20 rounded-[3px] border bg-[#02081a]/92 px-[2.5px] py-[0.5px] font-display text-[6.5px] font-bold leading-none shadow-[0_1px_2px_rgba(0,0,0,0.95)] sm:text-[7.5px] ${
                    qs.isFood
                      ? 'border-emerald-300/80 text-emerald-200'
                      : 'border-cyan-300/80 text-cyan-200'
                  }`}
                >
                  {qs.keyLabel}
                </span>

                {/* Quantity Counter Badge */}
                {hasAssigned && (
                  <span
                    className={`pointer-events-none absolute bottom-[1px] right-[1px] z-20 rounded-[3px] bg-[#02081a]/95 px-[2px] py-[0.5px] text-[6.5px] font-black leading-none tabular-nums shadow-[0_1px_2px_rgba(0,0,0,1)] sm:text-[7.5px] ${
                      hasStock ? 'text-amber-200' : 'text-rose-300'
                    }`}
                  >
                    {qty > 99 ? '99+' : qty}
                  </span>
                )}
              </button>

              {/* Tiny touch-friendly swap pip on top-right when an item is assigned */}
              {hasAssigned && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPickerSlot((prev) =>
                      prev === qs.slot ? null : qs.slot
                    );
                  }}
                  title={`Trocar ${qs.title}`}
                  aria-label={`Trocar ${qs.title}`}
                  className="absolute -right-[2px] -top-[2px] z-30 flex h-[12px] w-[12px] items-center justify-center rounded-full border border-cyan-300/80 bg-[#051842] text-cyan-200 shadow hover:border-amber-300 hover:text-amber-200 sm:h-[14px] sm:w-[14px]"
                >
                  <RefreshCw className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Row: 4 Direct Click-to-Evolve Squares (Rookie, Champion, Ultimate, Mega) */}
      {evoChain.length > 0 && (
        <div
          aria-label="Evoluções do Digimon"
          className="dmo-frame flex items-center gap-[3px] rounded-lg p-[3px] shadow-[0_6px_20px_rgba(0,10,40,0.82)] sm:gap-1.5 sm:rounded-xl sm:p-1"
        >
          {evoChain.slice(0, 4).map((step) => {
            const stepFormId = step.formId;
            const isActive = stepFormId === digimon.id;
            const levelMet = Boolean(
              step.playable && stepFormId && stats.level >= step.unlockLevel
            );
            const evoluterUnlocked = stepFormId
              ? isEvolutionSlotUnlockedByEvoluter(
                  effectiveStarterId,
                  stepFormId,
                  stats
                )
              : false;
            const needsEvoluter = step.evoluterCost > 0 && !evoluterUnlocked;
            const isFullyUnlocked = levelMet && !needsEvoluter;
            const canEvolveClick = Boolean(
              isFullyUnlocked && !isActive && stepFormId
            );
            const canInspectUnlock = Boolean(
              needsEvoluter && stepFormId && onRequestUnlockForm
            );
            const isClickable = canEvolveClick || canInspectUnlock;
            const stageTag = STAGE_SHORT_TAG[step.stage] ?? step.stage.charAt(0);
            const thumbUrl = stepFormId
              ? getDigimonFormProfile(stepFormId).portraitUrl
              : null;
            const actionHint = isActive
              ? 'Forma Ativa'
              : needsEvoluter
                ? levelMet
                  ? `Desbloquear: ${step.evoluterCost} Evoluters (tem ${ownedEvoluters})`
                  : `Nv. ${step.unlockLevel} + ${step.evoluterCost} Evoluters`
                : levelMet
                  ? 'Clique para evoluir'
                  : `Requer Nv. ${step.unlockLevel}`;

            return (
              <div key={step.name} className="group/evo relative">
                {/* Upward Hover Tooltip */}
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-cyan-300/75 bg-[#041130]/96 px-2.5 py-1 text-center opacity-0 shadow-[0_6px_18px_rgba(0,0,0,0.88),0_0_10px_rgba(56,214,255,0.45)] transition-opacity duration-150 group-hover/evo:opacity-100 group-focus-within/evo:opacity-100 sm:block"
                >
                  <p className="text-[10.5px] font-black tracking-wide text-white">
                    {step.name}
                  </p>
                  <p
                    className={`mt-0.5 text-[9px] font-bold ${
                      isActive
                        ? 'text-amber-300'
                        : isFullyUnlocked
                          ? 'text-emerald-300'
                          : needsEvoluter && levelMet
                            ? 'text-fuchsia-300'
                            : 'text-slate-300'
                    }`}
                  >
                    {step.stage} · {actionHint}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => {
                    if (!stepFormId) return;
                    if (canEvolveClick) {
                      onEvolveForm(stepFormId);
                    } else if (canInspectUnlock && onRequestUnlockForm) {
                      onRequestUnlockForm(stepFormId);
                    }
                  }}
                  title={`${step.name} (${step.stage}) · ${actionHint}`}
                  aria-label={
                    canEvolveClick
                      ? `Evoluir para ${step.name} (${step.stage})`
                      : `${step.name} (${step.stage}) — ${actionHint}`
                  }
                  className={`relative flex h-[31px] w-[31px] items-center justify-center overflow-hidden rounded-[6px] border transition-all duration-150 sm:h-10 sm:w-10 sm:rounded-lg ${
                    isActive
                      ? 'border-amber-300 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.34)_0%,rgba(8,29,82,0.96)_100%)] shadow-[0_0_10px_rgba(251,191,36,0.78)]'
                      : canEvolveClick
                        ? 'cursor-pointer border-cyan-300/85 bg-[radial-gradient(circle_at_center,rgba(56,232,255,0.28)_0%,rgba(5,20,56,0.96)_100%)] shadow-[0_0_8px_rgba(56,232,255,0.4)] hover:scale-105 hover:border-amber-300 hover:brightness-110 active:scale-95'
                        : needsEvoluter && levelMet
                          ? 'cursor-pointer border-fuchsia-300 bg-[radial-gradient(circle_at_center,rgba(232,121,249,0.32)_0%,rgba(34,11,76,0.96)_100%)] shadow-[0_0_10px_rgba(232,121,249,0.68)] hover:scale-105 hover:brightness-110 active:scale-95'
                          : canInspectUnlock
                            ? 'cursor-pointer border-fuchsia-400/50 bg-[#030b20]/90 opacity-85 hover:border-fuchsia-300'
                            : 'cursor-not-allowed border-slate-600/65 bg-[#030b20]/90 opacity-75'
                  }`}
                >
                  {thumbUrl && (
                    <img
                      src={thumbUrl}
                      alt={step.name}
                      draggable={false}
                      className={`h-full w-full object-contain p-[1.5px] ${
                        !isFullyUnlocked ? 'brightness-50 saturate-50' : ''
                      }`}
                    />
                  )}

                  {/* Top glossy rim */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent"
                  />

                  {/* Stage letter tag (R / C / U / M) */}
                  <span
                    className={`pointer-events-none absolute bottom-[1px] left-[1px] z-20 rounded-[3px] border px-[2.5px] py-[0.5px] font-display text-[6.5px] font-extrabold leading-none shadow-[0_1px_2px_rgba(0,0,0,0.95)] sm:text-[7.5px] ${
                      isActive
                        ? 'border-amber-300/90 bg-amber-950/95 text-amber-200'
                        : isFullyUnlocked
                          ? 'border-cyan-300/70 bg-[#02081a]/92 text-cyan-200'
                          : needsEvoluter && levelMet
                            ? 'border-fuchsia-300/85 bg-[#29094e]/95 text-fuchsia-200'
                            : 'border-slate-500/60 bg-[#02081a]/92 text-slate-400'
                    }`}
                  >
                    {stageTag}
                  </span>

                  {/* Locked by Evoluter (Level already reached!) */}
                  {needsEvoluter && levelMet && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#180533]/52"
                    >
                      <img
                        src={EVOLUTER_ICON_URL}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-3.5 w-3.5 rounded-[3px] border border-fuchsia-300/85 object-cover shadow-[0_0_8px_rgba(232,121,249,0.85)] sm:h-4.5 sm:w-4.5"
                      />
                      <span className="mt-[1px] text-[6.5px] font-black leading-none tabular-nums text-fuchsia-100 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] sm:text-[7.5px]">
                        ×{step.evoluterCost}
                      </span>
                    </span>
                  )}

                  {/* Locked by Level (also shows tiny Evoluter badge top-right if Mercenary) */}
                  {!levelMet && (
                    <>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#020718]/45"
                      >
                        <Lock className="h-2.5 w-2.5 text-amber-300/90 drop-shadow sm:h-3 sm:w-3" />
                        <span className="mt-[1px] text-[6.5px] font-black leading-none tabular-nums text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)] sm:text-[7.5px]">
                          {step.unlockLevel}
                        </span>
                      </span>
                      {needsEvoluter && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute right-[1px] top-[1px] z-20 flex items-center gap-[1px] rounded-[3px] bg-[#2a0952]/95 px-[2px] py-[0.5px] text-[6px] font-black leading-none tabular-nums text-fuchsia-200 sm:text-[6.5px]"
                        >
                          <img
                            src={EVOLUTER_ICON_URL}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-2 w-2 rounded-[1px] object-cover sm:h-2.5 sm:w-2.5"
                          />
                          {step.evoluterCost}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
