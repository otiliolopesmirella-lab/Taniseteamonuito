import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  Backpack,
  Ban,
  Check,
  Coins,
  Egg,
  Gem,
  Heart,
  Info,
  Lock,
  Shield,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import {
  getCatalogItemByKey,
  getXpBoostSpecByKey,
  isItemNonSellable,
} from '../../data/itemsCatalog';
import {
  getUnlockedInventorySlots,
  INVENTORY_DEFAULT_UNLOCKED_SLOTS,
  INVENTORY_TOTAL_SLOTS,
} from '../../services/hudGameService';
import type {
  InventoryCategory,
  InventoryItem,
  ItemRarity,
} from '../../types/hud';
import { formatDigitalCurrency } from '../../utils/currency';
import { TmbCurrencyBar } from './CurrencyDisplay';

interface InventoryHudWindowProps {
  open: boolean;
  items: InventoryItem[];
  unlockedSlots?: number;
  bits: number;
  dCoin: number;
  onClose: () => void;
  onUseItem: (item: InventoryItem) => void;
  onEquipItem: (item: InventoryItem) => void;
  onDiscardItem: (item: InventoryItem, quantity?: number) => void;
  onDiscardItems?: (requests: Array<{ itemId: string; quantity: number }>) => void;
  onSortInventory: () => void;
  foodSlotItemKey?: string | null;
  vitaminSlotItemKey?: string | null;
  onAssignQuickSlot?: (slot: 'food' | 'vitamin', itemKey: string) => void;
}

const FILTER_TABS: Array<{ id: InventoryCategory; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'digiegg', label: 'Ovos' },
  { id: 'data', label: 'DATA' },
  { id: 'consumable', label: 'Itens' },
  { id: 'equip', label: 'Equip.' },
];

const RARITY_STYLES: Record<
  ItemRarity,
  { border: string; bg: string; label: string; text: string }
> = {
  comum: {
    border: 'border-cyan-400/35',
    bg: 'bg-[#071b42]/92',
    label: 'Comum',
    text: 'text-sky-200',
  },
  incomum: {
    border: 'border-emerald-400/65',
    bg: 'bg-[#072638]/92',
    label: 'Incomum',
    text: 'text-emerald-300',
  },
  raro: {
    border: 'border-sky-300/80',
    bg: 'bg-[#0a2a5e]/94',
    label: 'Raro',
    text: 'text-cyan-200',
  },
  epico: {
    border: 'border-violet-400/85',
    bg: 'bg-[#1e154a]/94',
    label: 'Épico',
    text: 'text-violet-200',
  },
  lendario: {
    border: 'border-amber-300/90',
    bg: 'bg-[#33200a]/94',
    label: 'Lendário',
    text: 'text-amber-200',
  },
};

const CATEGORY_LABELS: Record<Exclude<InventoryCategory, 'all'>, string> = {
  digiegg: 'DigiEgg',
  data: 'DATA de Chocagem',
  consumable: 'Consumível',
  equip: 'Equipamento',
  other: 'Item Especial',
};

function renderItemArtwork(item: InventoryItem, sizeClass = 'h-9 w-9') {
  if (item.iconUrl) {
    return (
      <img
        src={item.iconUrl}
        alt={item.name}
        draggable={false}
        className={`${sizeClass} object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)]`}
      />
    );
  }
  if (item.category === 'digiegg') {
    return <Egg className="h-6 w-6 text-amber-300" />;
  }
  if (item.category === 'data') {
    return <Sparkles className="h-6 w-6 text-cyan-300" />;
  }
  if (item.category === 'equip') {
    return <Shield className="h-6 w-6 text-amber-200" />;
  }
  if (item.dsRestore) {
    return <Zap className="h-6 w-6 text-sky-300" />;
  }
  return <Heart className="h-6 w-6 text-emerald-300" />;
}

type PendingTrashConfirm = {
  mode: 'single-one' | 'selected-all';
  items: InventoryItem[];
};

export function InventoryHudWindow({
  open,
  items,
  unlockedSlots = INVENTORY_DEFAULT_UNLOCKED_SLOTS,
  bits,
  dCoin,
  onClose,
  onUseItem,
  onEquipItem,
  onDiscardItem,
  onDiscardItems,
  onSortInventory,
  foodSlotItemKey = null,
  vitaminSlotItemKey = null,
  onAssignQuickSlot,
}: InventoryHudWindowProps) {
  const safeUnlockedSlots = getUnlockedInventorySlots(unlockedSlots);
  const [filter, setFilter] = useState<InventoryCategory>('all');
  const [inspectedItemId, setInspectedItemId] = useState<string | null>(null);
  const [trashMode, setTrashMode] = useState(false);
  const [trashSelectedIds, setTrashSelectedIds] = useState<string[]>([]);
  const [pendingTrashConfirm, setPendingTrashConfirm] =
    useState<PendingTrashConfirm | null>(null);
  const [lockedHint, setLockedHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setInspectedItemId(null);
      setTrashMode(false);
      setTrashSelectedIds([]);
      setPendingTrashConfirm(null);
      setLockedHint(null);
    }
  }, [open]);

  // Keep trash selections synced if inventory changes
  useEffect(() => {
    setTrashSelectedIds((prev) =>
      prev.filter((id) => items.some((it) => it.id === id))
    );
    if (inspectedItemId && !items.some((it) => it.id === inspectedItemId)) {
      setInspectedItemId(null);
    }
  }, [items, inspectedItemId]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((it) => it.category === filter);
  }, [items, filter]);

  const inspectedItem = useMemo(() => {
    if (!inspectedItemId) return null;
    return items.find((it) => it.id === inspectedItemId) ?? null;
  }, [items, inspectedItemId]);

  const selectedTrashItems = useMemo(() => {
    if (trashSelectedIds.length === 0) return [];
    const set = new Set(trashSelectedIds);
    return items.filter((it) => set.has(it.id));
  }, [items, trashSelectedIds]);

  const inspectedMatchingDataCount = useMemo(() => {
    if (!inspectedItem || inspectedItem.category !== 'digiegg') return 0;
    const reqKey = inspectedItem.eggData?.requiredDataKey;
    if (!reqKey) return 0;
    return items
      .filter((it) => it.itemKey === reqKey)
      .reduce((acc, it) => acc + it.quantity, 0);
  }, [inspectedItem, items]);

  if (!open) return null;

  const isFiltering = filter !== 'all';
  const visibleUnlockedSlots = isFiltering
    ? Math.max(filteredItems.length, 10)
    : safeUnlockedSlots;
  const lockedSlotsCount = isFiltering
    ? 0
    : Math.max(0, INVENTORY_TOTAL_SLOTS - safeUnlockedSlots);

  const toggleTrashMode = () => {
    setLockedHint(null);
    setPendingTrashConfirm(null);
    setInspectedItemId(null);
    setTrashMode((prev) => {
      if (prev) {
        setTrashSelectedIds([]);
      }
      return !prev;
    });
  };

  const handleSlotTap = (item: InventoryItem) => {
    setLockedHint(null);
    if (trashMode) {
      setTrashSelectedIds((prev) =>
        prev.includes(item.id)
          ? prev.filter((id) => id !== item.id)
          : [...prev, item.id]
      );
      return;
    }
    setInspectedItemId(item.id);
  };

  const executeConfirmedTrash = () => {
    if (!pendingTrashConfirm) return;
    if (
      pendingTrashConfirm.mode === 'single-one' &&
      pendingTrashConfirm.items.length === 1
    ) {
      onDiscardItem(pendingTrashConfirm.items[0], 1);
    } else if (onDiscardItems) {
      onDiscardItems(
        pendingTrashConfirm.items.map((it) => ({
          itemId: it.id,
          quantity: it.quantity,
        }))
      );
    } else {
      for (const it of pendingTrashConfirm.items) {
        onDiscardItem(it, it.quantity);
      }
    }
    setPendingTrashConfirm(null);
    setTrashSelectedIds([]);
  };

  const singleSelectedTrashItem =
    selectedTrashItems.length === 1 ? selectedTrashItems[0] : null;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Inventário do Tamer"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#020816]/72 p-2 backdrop-blur-[2px] sm:p-4"
    >
      {/* Wrapper: Main Inventory Window + Dedicated Trash Can Button Right Beside It */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window relative flex max-h-[88dvh] w-full max-w-[540px] items-start justify-center gap-1.5 sm:gap-2.5"
      >
        {/* MAIN INVENTORY FRAME */}
        <div
          className={`flex max-h-[88dvh] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border-2 bg-gradient-to-b from-[#082c78] via-[#051a4a] to-[#030e2b] shadow-[0_14px_48px_rgba(0,12,42,0.85)] transition-colors ${
            trashMode
              ? 'border-rose-400/90 shadow-[0_0_32px_rgba(244,63,94,0.38)]'
              : 'border-cyan-300/75 shadow-[0_0_36px_rgba(0,174,255,0.42)]'
          }`}
        >
          {/* Compact Top Header */}
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-cyan-400/30 bg-[#06215c] px-3 py-2.5 sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-300/50 bg-[#0a368a] text-cyan-200">
                <Backpack className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-[family-name:var(--font-display)] text-sm font-black tracking-wide text-white sm:text-base">
                  Inventário
                </h2>
                <p className="text-[11px] font-bold text-cyan-200/85 tabular-nums">
                  {items.length} / {safeUnlockedSlots} slots usados
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={onSortInventory}
                title="Organizar inventário"
                aria-label="Organizar inventário"
                className="flex min-h-[38px] items-center gap-1 rounded-xl border border-cyan-300/45 bg-[#092c75] px-2.5 text-xs font-extrabold text-cyan-100 transition hover:bg-[#0d3c9c] active:scale-95"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Organizar</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar inventário"
                className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-rose-300/60 bg-gradient-to-b from-rose-500 to-rose-700 text-white transition hover:brightness-110 active:scale-95"
              >
                <X className="h-4.5 w-4.5 stroke-[3]" />
              </button>
            </div>
          </header>

          {/* Compact Currency Bar */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-cyan-400/20 bg-[#041438] px-3 py-2 sm:px-4">
            <div
              title={`Saldo total: ${formatDigitalCurrency(bits)}`}
              className="flex items-center gap-1.5"
            >
              <Coins className="h-3.5 w-3.5 shrink-0 text-amber-300" />
              <TmbCurrencyBar bits={bits} compact />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-black tabular-nums text-cyan-200">
              <Gem className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
              <span>{dCoin.toLocaleString('pt-BR')} DL Din</span>
            </div>
          </div>

          {/* Single-Row Category Filter Tabs */}
          <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-cyan-400/20 bg-[#041230] px-3 py-2 sm:px-4">
            {FILTER_TABS.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[34px] shrink-0 rounded-lg border px-3 text-xs font-extrabold whitespace-nowrap transition active:scale-95 ${
                    active
                      ? 'border-cyan-300 bg-cyan-500/22 text-white shadow-[0_0_12px_rgba(34,211,238,0.22)]'
                      : 'border-cyan-400/20 bg-[#071b45] text-sky-200/80 hover:border-cyan-300/45 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Trash Mode Banner */}
          {trashMode && (
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-rose-400/45 bg-rose-950/85 px-3 py-2 sm:px-4">
              <div className="flex min-w-0 items-center gap-2 text-xs font-extrabold text-rose-100">
                <Trash2 className="h-4 w-4 shrink-0 text-rose-300" />
                <span className="truncate">
                  Modo Lixeira: toque nos itens para excluir
                </span>
              </div>
              <button
                type="button"
                onClick={toggleTrashMode}
                className="shrink-0 rounded-lg border border-rose-300/50 bg-rose-900/80 px-2.5 py-1 text-[11px] font-black text-white hover:bg-rose-800"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* FULL-WIDTH CLEAN ITEM GRID (No cramped side description box!) */}
          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-6 sm:gap-2.5">
              {Array.from({ length: visibleUnlockedSlots }).map((_, idx) => {
                const item = filteredItems[idx];

                if (!item) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="aspect-square rounded-xl border border-cyan-500/20 bg-[#030f2b]/75 shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)]"
                    />
                  );
                }

                const rarity = RARITY_STYLES[item.rarity ?? 'comum'];
                const isSelectedForTrash =
                  trashMode && trashSelectedIds.includes(item.id);
                const eggLevel =
                  item.category === 'digiegg' && item.eggData
                    ? item.eggData.hatchLevel ?? 0
                    : null;
                const nonSellable = isItemNonSellable(item);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSlotTap(item)}
                    aria-label={item.name}
                    aria-pressed={isSelectedForTrash}
                    className={`group relative flex aspect-square items-center justify-center rounded-xl border-2 p-1.5 transition active:scale-95 ${
                      isSelectedForTrash
                        ? 'border-rose-400 bg-rose-950/85 ring-2 ring-rose-400/70'
                        : trashMode
                          ? `${rarity.border} ${rarity.bg} hover:border-rose-300/80`
                          : `${rarity.border} ${rarity.bg} hover:border-cyan-200 hover:brightness-110`
                    }`}
                  >
                    {renderItemArtwork(item, 'h-[76%] w-[76%]')}

                    {/* Trash selection checkmark */}
                    {isSelectedForTrash && (
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-rose-600 text-white shadow">
                        <Check className="h-3 w-3 stroke-[3.5]" />
                      </span>
                    )}

                    {/* Egg stage indicator (compact) */}
                    {eggLevel !== null && !isSelectedForTrash && (
                      <span className="absolute left-1 top-1 rounded bg-[#030d26]/92 px-1 py-[1px] text-[9px] font-black leading-none text-amber-300 tabular-nums">
                        {eggLevel}/5
                      </span>
                    )}

                    {/* Non-sellable micro lock dot for DemiMeramon / Tutorial Egg */}
                    {nonSellable && !isSelectedForTrash && (
                      <span
                        title="Não vendável"
                        className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950/90 text-amber-300"
                      >
                        <Ban className="h-2.5 w-2.5" />
                      </span>
                    )}

                    {/* Quantity badge */}
                    {item.quantity > 1 && (
                      <span className="absolute bottom-1 right-1 rounded bg-[#020a1f]/92 px-1 py-[1px] text-[10px] font-black leading-none text-white tabular-nums">
                        {item.quantity > 999 ? '999+' : `x${item.quantity}`}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Locked Slots */}
              {Array.from({ length: lockedSlotsCount }).map((_, idx) => {
                const slotNumber = safeUnlockedSlots + idx + 1;
                return (
                  <button
                    key={`locked-${slotNumber}`}
                    type="button"
                    onClick={() =>
                      setLockedHint(
                        `Slot #${slotNumber} bloqueado. Use Expansor de Inventário na Loja DL Din para liberar mais espaço.`
                      )
                    }
                    aria-label={`Slot ${slotNumber} bloqueado`}
                    className="flex aspect-square flex-col items-center justify-center rounded-xl border border-slate-700/60 bg-[#030b1f]/80 text-slate-500 transition hover:border-amber-300/45 hover:text-amber-300"
                  >
                    <Lock className="h-4 w-4" />
                  </button>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <p className="mt-4 text-center text-xs font-semibold text-sky-200/75">
                Nenhum item nesta categoria.
              </p>
            )}
          </div>

          {/* Bottom Bar: Trash Action Bar (when in Trash Mode) OR clean tap hint */}
          {trashMode ? (
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-rose-400/40 bg-[#1c0713]/95 px-3 py-2.5 sm:px-4">
              <span className="text-xs font-extrabold text-rose-100 tabular-nums">
                {selectedTrashItems.length === 0
                  ? 'Nenhum item marcado'
                  : `${selectedTrashItems.length} item(ns) marcado(s)`}
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {singleSelectedTrashItem && singleSelectedTrashItem.quantity > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPendingTrashConfirm({
                        mode: 'single-one',
                        items: [singleSelectedTrashItem],
                      })
                    }
                    className="min-h-[40px] rounded-xl border border-amber-300/70 bg-amber-600/90 px-3 text-xs font-black text-slate-950 transition hover:brightness-110 active:scale-95"
                  >
                    Excluir 1
                  </button>
                )}

                <button
                  type="button"
                  disabled={selectedTrashItems.length === 0}
                  onClick={() =>
                    setPendingTrashConfirm({
                      mode: 'selected-all',
                      items: selectedTrashItems,
                    })
                  }
                  className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-rose-300 bg-gradient-to-b from-rose-500 to-rose-700 px-3.5 text-xs font-black text-white transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>
                    {singleSelectedTrashItem && singleSelectedTrashItem.quantity > 1
                      ? `Excluir Tudo (x${singleSelectedTrashItem.quantity})`
                      : 'Excluir'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-cyan-400/20 bg-[#030f2b]/95 px-3 py-2 text-[11.5px] font-semibold text-sky-200/90 sm:px-4">
              <div className="flex min-w-0 items-center gap-1.5">
                <Info className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                <span className="truncate">
                  {lockedHint ?? 'Toque em qualquer item para ver o que ele faz e usar.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* DEDICATED TRASH CAN BUTTON RIGHT NEXT TO THE INVENTORY ("um lixinho do lado do inventário") */}
        <button
          type="button"
          onClick={toggleTrashMode}
          aria-pressed={trashMode}
          aria-label={
            trashMode
              ? 'Sair do modo lixeira'
              : 'Lixeira: escolher itens para excluir do inventário'
          }
          title={
            trashMode
              ? 'Sair do modo lixeira'
              : 'Clique para escolher itens do inventário para jogar fora'
          }
          className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-3 shadow-lg transition active:scale-95 sm:w-14 sm:px-2.5 sm:py-3.5 ${
            trashMode
              ? 'w-12 border-rose-300 bg-gradient-to-b from-rose-500 via-rose-600 to-rose-800 text-white shadow-[0_0_24px_rgba(244,63,94,0.65)]'
              : 'w-12 border-cyan-300/60 bg-gradient-to-b from-[#0b337f] to-[#041438] text-rose-300 hover:border-rose-400/85 hover:bg-rose-950/90 hover:text-rose-200'
          }`}
        >
          <Trash2 className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
          <span className="text-[10px] font-black tracking-wide uppercase">
            {trashMode ? 'Sair' : 'Lixo'}
          </span>
        </button>
      </div>

      {/* =====================================================================
          TAP-TO-INSPECT ITEM DETAILS SHEET (ONLY OPENS WHEN CLICKING AN ITEM!)
         ===================================================================== */}
      {inspectedItem && !trashMode && (() => {
        const rarity = RARITY_STYLES[inspectedItem.rarity ?? 'comum'];
        const nonSellable = isItemNonSellable(inspectedItem);
        const reqDataKey = inspectedItem.eggData?.requiredDataKey;
        const reqDataDef = reqDataKey ? getCatalogItemByKey(reqDataKey) : undefined;
        const eggReq =
          inspectedItem.category === 'digiegg' && reqDataKey
            ? {
                dataName: reqDataDef?.name ?? reqDataKey.toUpperCase(),
                requiredQuantity: inspectedItem.eggData?.requiredDataQuantity ?? 7,
              }
            : null;
        const canUse =
          inspectedItem.category === 'consumable' ||
          inspectedItem.itemKey === 'bag_expander_6' ||
          inspectedItem.itemKey === 'archive_expander_6' ||
          Boolean(getXpBoostSpecByKey(inspectedItem.itemKey));
        const canEquip = inspectedItem.category === 'equip';

        return (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setInspectedItemId(null);
            }}
            role="dialog"
            aria-modal="true"
            aria-label={`Detalhes de ${inspectedItem.name}`}
            className="fixed inset-0 z-50 flex items-end justify-center bg-[#010612]/65 p-2.5 backdrop-blur-[1px] sm:items-center sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="animate-dmo-window w-full max-w-[400px] overflow-hidden rounded-2xl border-2 border-cyan-300/80 bg-gradient-to-b from-[#0a307a] via-[#061c4f] to-[#030e2b] shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_32px_rgba(56,189,248,0.35)]"
            >
              {/* Item Header */}
              <div className="flex items-start justify-between gap-3 border-b border-cyan-400/25 bg-[#06215c] p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 p-2 ${rarity.border} ${rarity.bg}`}
                  >
                    {renderItemArtwork(inspectedItem, 'h-12 w-12')}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black leading-snug text-white">
                      {inspectedItem.name}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold">
                      <span className={rarity.text}>{rarity.label}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-sky-200">
                        {CATEGORY_LABELS[inspectedItem.category]}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-black text-amber-300 tabular-nums">
                        Qtd: {inspectedItem.quantity}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectedItemId(null)}
                  aria-label="Fechar detalhes"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/40 bg-[#041438] text-cyan-100 hover:bg-sky-800 active:scale-95"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Readable Item Explanation Body */}
              <div className="max-h-[52dvh] space-y-3 overflow-y-auto p-4 text-sm text-sky-50">
                {/* Main Effect / What It Does */}
                <div className="rounded-xl border border-cyan-400/25 bg-[#041232] p-3.5">
                  <p className="text-[11px] font-black tracking-wide text-cyan-300 uppercase">
                    O que este item faz
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-sky-50">
                    {inspectedItem.description}
                  </p>
                  {inspectedItem.usageInfo &&
                    inspectedItem.usageInfo !== inspectedItem.description && (
                      <p className="mt-2 border-t border-cyan-400/15 pt-2 text-xs leading-relaxed text-cyan-200">
                        {inspectedItem.usageInfo}
                      </p>
                    )}
                </div>

                {/* Consumable HP/DS Recovery Stats */}
                {(inspectedItem.hpRestore || inspectedItem.dsRestore) && (
                  <div className="flex flex-wrap gap-2">
                    {inspectedItem.hpRestore ? (
                      <div className="flex flex-1 items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-950/45 px-3 py-2.5 text-xs font-black text-emerald-200">
                        <Heart className="h-4 w-4 shrink-0 fill-emerald-400 text-emerald-300" />
                        <span>
                          Recupera +{inspectedItem.hpRestore.toLocaleString('pt-BR')} HP
                        </span>
                      </div>
                    ) : null}
                    {inspectedItem.dsRestore ? (
                      <div className="flex flex-1 items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-950/45 px-3 py-2.5 text-xs font-black text-cyan-200">
                        <Zap className="h-4 w-4 shrink-0 text-cyan-300" />
                        <span>
                          Recupera +{inspectedItem.dsRestore.toLocaleString('pt-BR')} DS
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* DigiEgg Hatch Info */}
                {inspectedItem.category === 'digiegg' && inspectedItem.eggData && (
                  <div className="space-y-1.5 rounded-xl border border-amber-300/35 bg-amber-950/25 p-3.5 text-xs">
                    <div className="flex items-center justify-between gap-2 font-black text-amber-200">
                      <span>Progresso de Chocagem</span>
                      <span className="tabular-nums">
                        {inspectedItem.eggData.hatchLevel ?? 0} /{' '}
                        {inspectedItem.eggData.maxHatchLevel ?? 5}
                      </span>
                    </div>
                    {eggReq && (
                      <p className="text-sky-100">
                        DATA necessária:{' '}
                        <strong className="text-cyan-200">
                          {eggReq.requiredQuantity}× {eggReq.dataName}
                        </strong>{' '}
                        por injeção{' '}
                        <span className="text-sky-300/85 tabular-nums">
                          (você tem {inspectedMatchingDataCount})
                        </span>
                      </p>
                    )}
                    {inspectedItem.eggData.guaranteedUpToLevel && (
                      <p className="font-bold text-emerald-300">
                        100% garantido até {inspectedItem.eggData.guaranteedUpToLevel}/5 (sem risco de quebrar).
                      </p>
                    )}
                    {inspectedItem.eggData.preUnlockedFormIds &&
                      inspectedItem.eggData.preUnlockedFormIds.length > 2 && (
                        <p className="font-bold text-emerald-300">
                          Ultimate e Mega já vêm desbloqueadas ao chocar!
                        </p>
                      )}
                  </div>
                )}

                {/* Non-Sellable Notice (e.g. DemiMeramon Egg) */}
                {nonSellable && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-400/45 bg-amber-950/40 px-3 py-2.5 text-xs font-extrabold text-amber-200">
                    <Ban className="h-4 w-4 shrink-0 text-amber-300" />
                    <span>Item exclusivo: não pode ser vendido.</span>
                  </div>
                )}

                {/* Equipment Stat Bonuses */}
                {inspectedItem.statBonuses && (
                  <div className="rounded-xl border border-cyan-400/25 bg-[#041232] p-3 text-xs text-emerald-200">
                    <p className="mb-1 text-[11px] font-black text-cyan-300 uppercase">
                      Bônus ao Equipar
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-bold">
                      {inspectedItem.statBonuses.attack ? (
                        <span>AT +{inspectedItem.statBonuses.attack}</span>
                      ) : null}
                      {inspectedItem.statBonuses.defense ? (
                        <span>DE +{inspectedItem.statBonuses.defense}</span>
                      ) : null}
                      {inspectedItem.statBonuses.hp ? (
                        <span>HP +{inspectedItem.statBonuses.hp}</span>
                      ) : null}
                      {inspectedItem.statBonuses.ds ? (
                        <span>DS +{inspectedItem.statBonuses.ds}</span>
                      ) : null}
                      {inspectedItem.statBonuses.speed ? (
                        <span>VEL +{inspectedItem.statBonuses.speed}</span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              {/* Clean Action Footer */}
              <div className="flex flex-wrap items-center gap-2 border-t border-cyan-400/25 bg-[#041230] p-3.5">
                {canUse && (
                  <button
                    type="button"
                    onClick={() => {
                      onUseItem(inspectedItem);
                      if (inspectedItem.quantity <= 1) {
                        setInspectedItemId(null);
                      }
                    }}
                    className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-300/80 bg-gradient-to-b from-emerald-500 to-teal-700 px-4 text-sm font-black text-white shadow-[0_0_16px_rgba(16,185,129,0.35)] transition hover:brightness-110 active:scale-95"
                  >
                    <span>Usar Item</span>
                  </button>
                )}

                {onAssignQuickSlot &&
                  inspectedItem.category === 'consumable' &&
                  ((inspectedItem.hpRestore ?? 0) > 0 ||
                    (inspectedItem.dsRestore ?? 0) > 0) &&
                  (() => {
                    const targetSlot: 'food' | 'vitamin' =
                      (inspectedItem.hpRestore ?? 0) > 0 ? 'food' : 'vitamin';
                    const isPinned =
                      targetSlot === 'food'
                        ? foodSlotItemKey === inspectedItem.itemKey
                        : vitaminSlotItemKey === inspectedItem.itemKey;
                    return (
                      <button
                        type="button"
                        onClick={() =>
                          onAssignQuickSlot(targetSlot, inspectedItem.itemKey)
                        }
                        className={`flex min-h-[46px] shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-black transition active:scale-95 ${
                          isPinned
                            ? 'border-amber-300/85 bg-amber-500/25 text-amber-100'
                            : targetSlot === 'food'
                              ? 'border-emerald-300/75 bg-emerald-950/75 text-emerald-200 hover:bg-emerald-900/80'
                              : 'border-cyan-300/75 bg-cyan-950/75 text-cyan-200 hover:bg-cyan-900/80'
                        }`}
                      >
                        {isPinned ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : targetSlot === 'food' ? (
                          <Heart className="h-3.5 w-3.5" />
                        ) : (
                          <Zap className="h-3.5 w-3.5" />
                        )}
                        <span>{isPinned ? 'Na Barra' : 'Colocar na Barra'}</span>
                      </button>
                    );
                  })()}

                {canEquip && (
                  <button
                    type="button"
                    onClick={() => {
                      onEquipItem(inspectedItem);
                      setInspectedItemId(null);
                    }}
                    className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-300/80 bg-gradient-to-b from-sky-500 to-blue-700 px-4 text-sm font-black text-white transition hover:brightness-110 active:scale-95"
                  >
                    <span>Equipar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setInspectedItemId(null)}
                  className={`min-h-[46px] rounded-xl border border-cyan-400/40 bg-[#082259] px-4 text-sm font-extrabold text-cyan-100 transition hover:bg-[#0d317a] active:scale-95 ${
                    canUse || canEquip ? 'shrink-0' : 'flex-1'
                  }`}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =====================================================================
          TRASH CONFIRMATION MODAL
         ===================================================================== */}
      {pendingTrashConfirm && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setPendingTrashConfirm(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar exclusão de itens"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#010612]/75 p-3 backdrop-blur-[2px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-dmo-window w-full max-w-[380px] overflow-hidden rounded-2xl border-2 border-rose-400/85 bg-gradient-to-b from-[#2b0c1c] via-[#170917] to-[#090814] shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-center gap-2.5 border-b border-rose-400/30 bg-rose-950/75 px-4 py-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-300" />
              <h3 className="text-sm font-black text-white">
                Confirmar exclusão
              </h3>
            </div>

            <div className="space-y-3 p-4 text-xs text-rose-50">
              <p className="text-[13px] leading-relaxed">
                {pendingTrashConfirm.mode === 'single-one'
                  ? `Deseja jogar fora 1 unidade de "${pendingTrashConfirm.items[0]?.name}"?`
                  : `Deseja excluir permanentemente ${pendingTrashConfirm.items.length} item(ns) selecionado(s)? Esta ação não pode ser desfeita.`}
              </p>

              <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-rose-400/25 bg-black/35 p-2.5">
                {pendingTrashConfirm.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between gap-2 text-xs font-bold"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {renderItemArtwork(it, 'h-6 w-6 shrink-0')}
                      <span className="truncate text-white">{it.name}</span>
                    </div>
                    <span className="shrink-0 font-black text-rose-300 tabular-nums">
                      {pendingTrashConfirm.mode === 'single-one'
                        ? '-1'
                        : `x${it.quantity}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-rose-400/25 bg-black/30 p-3">
              <button
                type="button"
                onClick={() => setPendingTrashConfirm(null)}
                className="min-h-[44px] rounded-xl border border-slate-600 bg-slate-800/90 text-xs font-extrabold text-slate-200 hover:bg-slate-700 active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeConfirmedTrash}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-rose-300 bg-gradient-to-b from-rose-500 to-rose-700 text-xs font-black text-white hover:brightness-110 active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
                <span>Excluir Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
