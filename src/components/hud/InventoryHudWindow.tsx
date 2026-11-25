import { memo, useMemo, useState } from 'react';
import {
  Backpack,
  Cpu,
  Hand,
  HeartPulse,
  Lock,
  Package,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import {
  EVOLUTER_ITEM_KEY,
  getDataItemDefinition,
  getDigiEggDefinition,
  getHatchQualityProfile,
  getXpBoostSpecByKey,
  HATCH_BACKUP_ITEM_KEY,
  isXpBoostIconUrl,
  ITEM_RARITY_META,
  MIN_HATCHABLE_LEVEL,
  sanitizeInventoryItems,
} from '../../data/itemsCatalog';
import {
  getUnlockedInventorySlots,
  INVENTORY_DEFAULT_UNLOCKED_SLOTS,
  INVENTORY_TOTAL_SLOTS,
} from '../../services/hudGameService';
import type { InventoryCategory, InventoryItem } from '../../types/hud';
import { splitDigitalCurrency } from '../../utils/currency';

const INVENTORY_REF_BG_URL =
  '/assets/aistudio/file_00000000c7dc820ea088fafec5d88aa6_7da53de8.png';

interface InventoryHudWindowProps {
  open: boolean;
  items: InventoryItem[];
  unlockedSlots?: number;
  bits: number;
  dCoin: number;
  onClose: () => void;
  onUseItem: (item: InventoryItem) => void;
  onEquipItem: (item: InventoryItem) => void;
  onDiscardItem: (item: InventoryItem) => void;
  onSortInventory?: () => void;
}

const CATEGORY_LABELS: Record<Exclude<InventoryCategory, 'all'>, string> = {
  data: 'DATA',
  digiegg: 'DigiEgg',
  other: 'Material',
  consumable: 'Consumível',
  equip: 'Equipamento',
};

function renderItemIcon(item: InventoryItem, large = false) {
  if (item.iconUrl) {
    const isEvoluter = item.itemKey === EVOLUTER_ITEM_KEY;
    const isHatchBackup = item.itemKey === HATCH_BACKUP_ITEM_KEY;
    const isXpBoost = isXpBoostIconUrl(item.iconUrl);
    const isSquareArt = isEvoluter || isHatchBackup || isXpBoost;
    return (
      <img
        src={item.iconUrl}
        alt={item.name}
        draggable={false}
        referrerPolicy="no-referrer"
        className={`${
          isSquareArt
            ? large
              ? `h-16 w-16 rounded-xl object-cover sm:h-20 sm:w-20 ${
                  isHatchBackup
                    ? 'drop-shadow-[0_0_16px_rgba(56,232,255,0.85)]'
                    : 'drop-shadow-[0_0_16px_rgba(232,121,249,0.85)]'
                }`
              : `h-[86%] w-[86%] rounded-[5px] object-cover ${
                  isHatchBackup
                    ? 'drop-shadow-[0_0_6px_rgba(56,232,255,0.65)]'
                    : 'drop-shadow-[0_0_6px_rgba(232,121,249,0.65)]'
                }`
            : `${
                large ? 'h-16 w-16 sm:h-20 sm:w-20' : 'h-[82%] w-[82%]'
              } object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.75)]`
        }`}
      />
    );
  }
  const iconSize = large ? 'h-12 w-12 sm:h-14 sm:w-14' : 'h-6 w-6';
  if (item.hpRestore) return <HeartPulse className={`${iconSize} text-emerald-300`} />;
  if (item.dsRestore) return <Zap className={`${iconSize} text-cyan-300`} />;
  if (item.category === 'equip') return <Cpu className={`${iconSize} text-amber-300`} />;
  return <Package className={`${iconSize} text-sky-300`} />;
}

export const InventoryHudWindow = memo(function InventoryHudWindow({
  open,
  items,
  unlockedSlots = INVENTORY_DEFAULT_UNLOCKED_SLOTS,
  bits,
  dCoin,
  onClose,
  onUseItem,
  onEquipItem,
  onDiscardItem,
  onSortInventory,
}: InventoryHudWindowProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLockedSlot, setSelectedLockedSlot] = useState<number | null>(null);

  const safeUnlockedSlots = getUnlockedInventorySlots(unlockedSlots);
  const lockedSlotsCount = Math.max(0, INVENTORY_TOTAL_SLOTS - safeUnlockedSlots);

  const enrichedItems = useMemo(() => sanitizeInventoryItems(items), [items]);
  const currency = useMemo(() => splitDigitalCurrency(bits), [bits]);

  if (!open) return null;

  const unlockedSlotItems = Array.from({ length: safeUnlockedSlots }, (_, idx) => {
    return enrichedItems[idx] ?? null;
  });

  const lockedSlotIndices = Array.from(
    { length: lockedSlotsCount },
    (_, offset) => safeUnlockedSlots + offset
  );

  const selectedItem =
    selectedLockedSlot !== null
      ? null
      : enrichedItems.find((i) => i.id === selectedId) ?? enrichedItems[0] ?? null;

  const selectedRarity = selectedItem
    ? ITEM_RARITY_META[selectedItem.rarity ?? 'comum']
    : null;

  const selectedMatchingData =
    selectedItem?.category === 'digiegg' && selectedItem.dataType
      ? getDataItemDefinition(selectedItem.dataType)
      : null;

  const selectedMatchingEgg =
    selectedItem?.category === 'data' && selectedItem.dataType
      ? getDigiEggDefinition(selectedItem.dataType)
      : null;

  const ownedMatchingDataQty = selectedMatchingData
    ? enrichedItems
        .filter((i) => i.itemKey === selectedMatchingData.itemKey)
        .reduce((acc, i) => acc + i.quantity, 0)
    : 0;

  const canUseSelected = Boolean(
    selectedItem &&
      (selectedItem.hpRestore ||
        selectedItem.dsRestore ||
        getXpBoostSpecByKey(selectedItem.itemKey))
  );
  const canEquipSelected = Boolean(
    selectedItem && selectedItem.category === 'equip' && selectedItem.equipSlot
  );

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Inventário do Tamer"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#01071a]/82 p-2 sm:p-4 select-none"
    >
      {/* Main Cyber Electric-Blue Inventory Shell matching Reference Attachment 2 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window relative flex max-h-[92dvh] w-[min(98vw,580px)] flex-col overflow-hidden rounded-2xl border-2 border-[#38d6ff] bg-[#041645] shadow-[0_0_42px_rgba(0,168,255,0.62),inset_0_0_24px_rgba(32,160,255,0.28)]"
      >
        {/* Reference Visual Circuit Backdrop Texture */}
        <img
          src={INVENTORY_REF_BG_URL}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.14] mix-blend-screen"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#072a7d]/82 via-[#04174a]/92 to-[#020c2b]/96"
        />

        {/* TOP BAR: Chamfered "Inventário" Title + Chamfered "DWcoin" Pill + Chamfered "X" */}
        <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 px-2.5 pb-2 pt-2.5 sm:px-3.5 sm:pt-3">
          {/* Left: Chamfered "Inventário" Banner */}
          <div className="clip-cyber-btn min-w-0 bg-gradient-to-r from-[#5ce6ff] via-[#38d6ff] to-[#1a78f2] p-[2px] shadow-[0_0_18px_rgba(56,214,255,0.55)]">
            <div className="clip-cyber-btn flex items-center gap-2 bg-gradient-to-b from-[#0f4dc7] via-[#072b7d] to-[#04174a] px-4 py-1.5 sm:px-6">
              <Backpack className="h-5 w-5 shrink-0 text-cyan-100 drop-shadow-[0_0_8px_rgba(125,232,255,0.8)] sm:h-6 sm:w-6" />
              <h2 className="font-[family-name:var(--font-display)] text-base italic tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] sm:text-xl">
                Inventário
              </h2>
              <span
                title={`${enrichedItems.length} ocupados de ${safeUnlockedSlots} slots liberados (${INVENTORY_TOTAL_SLOTS} máximo)`}
                className="hidden rounded bg-[#020a24]/80 px-1.5 py-0.5 text-[9.5px] font-black tabular-nums text-cyan-200 xs:inline-block"
              >
                {enrichedItems.length}/{safeUnlockedSlots}
              </span>
            </div>
          </div>

          {/* Right: DWcoin Pill + Close Button */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* DL Din Chamfered Pill */}
            <div
              title="DL Din: moeda premium da Loja Digital"
              className="clip-cyber-input bg-gradient-to-r from-[#5ce6ff] to-[#1d7ff2] p-[1.5px] shadow-[0_0_12px_rgba(56,214,255,0.45)]"
            >
              <div className="clip-cyber-input flex items-center gap-1.5 bg-gradient-to-b from-[#072973] to-[#031036] px-2.5 py-1 sm:px-3">
                <svg
                  viewBox="0 0 32 32"
                  className="h-5 w-5 shrink-0 drop-shadow-[0_0_6px_rgba(250,204,21,0.75)] sm:h-6 sm:w-6"
                  aria-hidden="true"
                >
                  <circle
                    cx="16"
                    cy="16"
                    r="14.5"
                    fill="#f59e0b"
                    stroke="#fef08a"
                    strokeWidth="1.8"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="10.8"
                    fill="#d97706"
                    stroke="#fde047"
                    strokeWidth="1.2"
                  />
                  <text
                    x="16"
                    y="19.8"
                    textAnchor="middle"
                    fill="#fef9c3"
                    fontSize="10.5"
                    fontWeight="900"
                    fontFamily="system-ui, sans-serif"
                  >
                    DL
                  </text>
                </svg>
                <span className="hidden text-[10.5px] font-black italic text-amber-300 sm:inline">
                  DL Din:
                </span>
                <span className="text-xs font-black italic tabular-nums text-white sm:text-sm">
                  {dCoin.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Chamfered X Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar inventário"
              className="clip-cyber-slot bg-gradient-to-b from-[#6be8ff] to-[#1366e8] p-[2px] shadow-[0_0_14px_rgba(56,214,255,0.6)] transition-transform hover:brightness-110 active:scale-95"
            >
              <span className="clip-cyber-slot flex h-8 w-8 items-center justify-center bg-gradient-to-b from-[#1768e8] to-[#082c80] text-white sm:h-9 sm:w-9">
                <X className="h-4.5 w-4.5 stroke-[3]" />
              </span>
            </button>
          </div>
        </div>

        {/* MAIN 2-COLUMN BODY: Left 4-Column Item Grid + Right Item Details Inspector */}
        <div className="relative z-10 grid min-h-0 flex-1 grid-cols-[1.12fr_0.88fr] gap-2 px-2.5 pb-2 sm:grid-cols-[1.18fr_0.82fr] sm:gap-2.5 sm:px-3.5">
          {/* LEFT PANEL: Neon-Framed 4-Column Chamfered Item Slot Grid */}
          <div className="clip-cyber-input flex min-h-[290px] max-h-[58dvh] flex-col bg-gradient-to-b from-[#5ce6ff] via-[#1c8cff] to-[#38e8ff] p-[2px] shadow-[0_0_20px_rgba(32,168,255,0.45)] sm:min-h-[340px]">
            <div className="clip-cyber-input flex min-h-0 flex-1 flex-col bg-gradient-to-b from-[#04184a] via-[#031036] to-[#020a24] p-2">
              <div className="world-map-scroll min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {unlockedSlotItems.map((item, idx) => {
                    const isSelected = Boolean(
                      item &&
                        selectedLockedSlot === null &&
                        selectedItem?.id === item.id
                    );
                    const isEgg = item?.category === 'digiegg';
                    const isEvoluter = item?.itemKey === EVOLUTER_ITEM_KEY;
                    const rarityMeta =
                      item && !isEgg
                        ? ITEM_RARITY_META[item.rarity ?? 'comum']
                        : null;
                    const outerBg = isSelected
                      ? 'bg-gradient-to-b from-[#fff59d] via-[#fbbf24] to-[#d97706] shadow-[0_0_14px_rgba(251,191,36,0.85)]'
                      : isEvoluter
                        ? 'bg-gradient-to-b from-[#f0abfc] to-[#a21caf]'
                        : item
                          ? 'bg-gradient-to-b from-[#6be8ff] via-[#2594ff] to-[#0a4ec4]'
                          : 'bg-gradient-to-b from-[#2b74c9]/65 to-[#0b2f73]/75';

                    return (
                      <button
                        key={item ? item.id : `open-slot-${idx}`}
                        type="button"
                        onClick={() => {
                          if (!item) return;
                          setSelectedLockedSlot(null);
                          setSelectedId(item.id);
                        }}
                        disabled={!item}
                        title={
                          item
                            ? `${item.name} (x${item.quantity})`
                            : `Slot liberado #${idx + 1} (vazio)`
                        }
                        className={`clip-cyber-slot relative aspect-square p-[1.5px] transition-transform ${outerBg} ${
                          item ? 'hover:brightness-110 active:scale-95' : 'opacity-75'
                        }`}
                      >
                        <div
                          style={
                            item && !isSelected && rarityMeta && !isEvoluter
                              ? {
                                  boxShadow: `inset 0 0 10px ${rarityMeta.glowRgba}`,
                                }
                              : undefined
                          }
                          className={`clip-cyber-slot relative flex h-full w-full items-center justify-center overflow-hidden ${
                            isSelected
                              ? 'bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.32)_0%,rgba(5,22,68,0.98)_100%)]'
                              : 'bg-gradient-to-b from-[#062163] via-[#04143e] to-[#020a24]'
                          }`}
                        >
                          {item ? (
                            <>
                              {renderItemIcon(item)}
                              {isEgg && (
                                <span
                                  className={`absolute left-0.5 top-0.5 rounded px-1 text-[7.5px] font-black leading-tight tabular-nums ${
                                    (item.eggData?.hatchLevel ?? 0) >= 5
                                      ? 'bg-amber-950/95 text-amber-200'
                                      : (item.eggData?.hatchLevel ?? 0) === 4
                                        ? 'bg-purple-950/95 text-purple-200'
                                        : (item.eggData?.hatchLevel ?? 0) === 3
                                          ? 'bg-emerald-950/95 text-emerald-200'
                                          : 'bg-[#020816]/95 text-slate-300'
                                  }`}
                                >
                                  {item.eggData?.hatchLevel ?? 0}/5
                                </span>
                              )}
                              <span className="absolute bottom-0.5 right-1 text-[9.5px] font-black italic leading-none tabular-nums text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)] sm:text-[10.5px]">
                                x{item.quantity}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}

                  {/* Locked Slots Section Divider */}
                  {lockedSlotsCount > 0 && (
                    <div className="col-span-4 my-1 flex items-center justify-between gap-1 rounded-md border border-amber-400/35 bg-[#041338] px-2 py-1 text-[9px] font-extrabold text-amber-200">
                      <span className="flex items-center gap-1 truncate">
                        <Lock className="h-3 w-3 shrink-0 text-amber-300" />
                        <span className="truncate">
                          Trancados ({safeUnlockedSlots + 1}–{INVENTORY_TOTAL_SLOTS})
                        </span>
                      </span>
                      <span className="shrink-0 text-[8.5px] text-cyan-200/80">
                        Loja DL
                      </span>
                    </div>
                  )}

                  {/* Locked Expansion Slots */}
                  {lockedSlotIndices.map((slotIdx) => {
                    const slotNumber = slotIdx + 1;
                    const isLockedSelected = selectedLockedSlot === slotNumber;
                    return (
                      <button
                        key={`locked-slot-${slotNumber}`}
                        type="button"
                        onClick={() => setSelectedLockedSlot(slotNumber)}
                        title={`Slot #${slotNumber} trancado — Use Expansor de Inventário na Loja DL Din`}
                        className={`clip-cyber-slot aspect-square p-[1.5px] transition-all ${
                          isLockedSelected
                            ? 'bg-amber-300'
                            : 'bg-slate-700/75 hover:bg-amber-400/60'
                        }`}
                      >
                        <div className="clip-cyber-slot relative flex h-full w-full items-center justify-center bg-[#02081a]">
                          <Lock className="h-3.5 w-3.5 text-slate-500" />
                          <span className="absolute bottom-0.5 right-1 text-[7.5px] font-bold tabular-nums text-slate-500">
                            {slotNumber}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Side Item Inspector (shows exactly what the selected item does!) */}
          <div className="clip-cyber-input flex min-h-[290px] max-h-[58dvh] flex-col bg-gradient-to-b from-[#5ce6ff] via-[#1c8cff] to-[#38e8ff] p-[2px] shadow-[0_0_20px_rgba(32,168,255,0.45)] sm:min-h-[340px]">
            <div className="clip-cyber-input flex min-h-0 flex-1 flex-col bg-gradient-to-b from-[#07266b] via-[#04143e] to-[#020a24] p-2">
              {selectedLockedSlot !== null ? (
                <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
                  <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-amber-400/60 bg-amber-950/50 text-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.3)]">
                    <Lock className="h-7 w-7" />
                  </div>
                  <p className="text-xs font-black italic text-amber-200 sm:text-sm">
                    Slot Trancado #{selectedLockedSlot}
                  </p>
                  <p className="mt-1.5 text-[10.5px] leading-relaxed text-sky-100/90">
                    Você possui{' '}
                    <span className="font-black text-cyan-200">
                      {safeUnlockedSlots}/{INVENTORY_TOTAL_SLOTS}
                    </span>{' '}
                    slots liberados. Use um{' '}
                    <span className="font-bold text-amber-200">
                      Expansor de Inventário
                    </span>{' '}
                    na Loja DL Din para liberar mais espaço.
                  </p>
                </div>
              ) : selectedItem ? (
                <>
                  {/* Radiant Stage Preview */}
                  <div className="relative flex h-[92px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[radial-gradient(circle_at_center,rgba(56,232,255,0.45)_0%,rgba(14,82,212,0.28)_45%,rgba(2,10,36,0.1)_78%)] sm:h-[112px]">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-[repeating-conic-gradient(from_0deg,rgba(107,232,255,0.14)_0deg_12deg,transparent_12deg_24deg)] opacity-75"
                    />
                    <div className="relative z-10 flex items-center justify-center">
                      {renderItemIcon(selectedItem, true)}
                    </div>
                  </div>

                  {/* Chamfered Item Name Ribbon */}
                  <div className="clip-cyber-input mt-1.5 shrink-0 bg-gradient-to-r from-[#5ce6ff] via-[#38d6ff] to-[#1a78f2] p-[1.5px]">
                    <div className="clip-cyber-input bg-gradient-to-b from-[#0d42ab] to-[#04184a] px-2 py-1 text-center">
                      <p className="truncate text-[11px] font-black italic leading-tight text-white drop-shadow sm:text-xs">
                        {selectedItem.name}
                      </p>
                    </div>
                  </div>

                  {/* Category + Rarity Micro-Row */}
                  <div className="mt-1 flex shrink-0 flex-wrap items-center justify-center gap-1 text-[9px] font-extrabold">
                    <span className="rounded bg-[#061f5c] px-1.5 py-0.5 text-cyan-200">
                      {CATEGORY_LABELS[selectedItem.category]}
                    </span>
                    {selectedRarity && selectedItem.category !== 'digiegg' && (
                      <span
                        className={`rounded border px-1.5 py-0.2 text-[8.5px] font-black uppercase ${selectedRarity.badgeClass}`}
                      >
                        {selectedRarity.label}
                      </span>
                    )}
                    {selectedItem.category === 'digiegg' && (
                      <span className="rounded bg-amber-950/90 px-1.5 py-0.5 text-amber-200">
                        {selectedItem.eggData?.hatchLevel ?? 0}/5
                        {(selectedItem.eggData?.hatchLevel ?? 0) >= MIN_HATCHABLE_LEVEL
                          ? ` · ${getHatchQualityProfile(selectedItem.eggData?.hatchLevel).qualityName}`
                          : ' · Choca ≥ 3/5'}
                      </span>
                    )}
                  </div>

                  {/* Recessed Description Box ("mostrando o que tal item faz") */}
                  <div className="world-map-scroll mt-1.5 min-h-0 flex-1 overflow-y-auto rounded-lg border border-cyan-400/45 bg-[#020c29]/95 p-2 text-[10px] leading-relaxed text-sky-100 sm:text-[11px]">
                    <p className="font-semibold italic text-white/95">
                      {selectedItem.description}
                    </p>

                    {selectedItem.category === 'digiegg' &&
                    (selectedItem.eggData?.hatchLevel ?? 0) >= 5 ? (
                      <div className="mt-1.5 rounded border border-amber-300/60 bg-amber-950/50 px-2 py-1.5 text-[9.5px] font-bold text-amber-200">
                        5/5 · Não precisa de DATA! Coloque na Incubadora DATS e choque seu Digimon Nv. 1 para jogar na hora.
                      </div>
                    ) : (
                      <>
                        {(selectedItem.usageInfo ||
                          selectedItem.eggData?.usageRequirements) && (
                          <p className="mt-1.5 border-t border-cyan-400/20 pt-1.5 text-[9.5px] leading-snug text-cyan-200/95 sm:text-[10px]">
                            <span className="font-black text-amber-300">
                              Efeito / Uso:{' '}
                            </span>
                            {selectedItem.eggData?.usageRequirements ??
                              selectedItem.usageInfo}
                          </p>
                        )}

                        {selectedMatchingData &&
                          selectedItem.eggData?.requiredDataQuantity && (
                            <div className="mt-1.5 flex items-center justify-between gap-1 rounded border border-cyan-400/30 bg-[#051a4a] px-1.5 py-1 text-[9.5px]">
                              <div className="flex min-w-0 items-center gap-1">
                                <img
                                  src={selectedMatchingData.iconUrl}
                                  alt={selectedMatchingData.name}
                                  className="h-3.5 w-3.5 shrink-0 object-contain"
                                />
                                <span className="truncate font-bold text-cyan-100">
                                  {selectedMatchingData.name}
                                </span>
                              </div>
                              <span
                                className={`shrink-0 font-black tabular-nums ${
                                  ownedMatchingDataQty >=
                                  selectedItem.eggData.requiredDataQuantity
                                    ? 'text-emerald-300'
                                    : 'text-rose-300'
                                }`}
                              >
                                {ownedMatchingDataQty}/
                                {selectedItem.eggData.requiredDataQuantity}
                              </span>
                            </div>
                          )}
                      </>
                    )}

                    {selectedMatchingEgg && (
                      <div className="mt-1.5 flex items-center gap-1 rounded border border-cyan-400/30 bg-[#051a4a] px-1.5 py-1 text-[9.5px]">
                        <img
                          src={selectedMatchingEgg.iconUrl}
                          alt={selectedMatchingEgg.name}
                          className="h-3.5 w-3.5 shrink-0 object-contain"
                        />
                        <span className="truncate font-bold text-amber-200">
                          Compatível: {selectedMatchingEgg.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Chamfered "Quantidade: xN" Counter Box */}
                  <div className="clip-cyber-input mt-1.5 shrink-0 bg-gradient-to-r from-[#38e8ff] to-[#1a78f2] p-[1.5px]">
                    <div className="clip-cyber-input flex items-center justify-center gap-1.5 bg-[#031036] px-2 py-1 text-center">
                      <span className="text-[10px] font-bold italic text-sky-100 sm:text-[11px]">
                        Quantidade:
                      </span>
                      <span className="font-[family-name:var(--font-display)] text-sm italic tabular-nums text-[#ffe047] drop-shadow-[0_0_8px_rgba(255,212,59,0.5)] sm:text-base">
                        x{selectedItem.quantity}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Buttons Row: Blue "Usar/Equipar" + Red "Descartar" */}
                  <div className="mt-1.5 grid shrink-0 grid-cols-2 gap-1.5">
                    {canUseSelected ? (
                      <button
                        type="button"
                        onClick={() => onUseItem(selectedItem)}
                        className="clip-cyber-slot bg-gradient-to-b from-[#6be8ff] to-[#0c56d0] p-[1.5px] shadow-[0_0_12px_rgba(56,214,255,0.45)] transition hover:brightness-110 active:scale-95"
                      >
                        <span className="clip-cyber-slot flex flex-col items-center justify-center bg-gradient-to-b from-[#1a78f2] to-[#083899] py-1.5 text-white">
                          <Hand className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                          <span className="mt-0.5 text-[10px] font-black italic leading-none">
                            Usar
                          </span>
                        </span>
                      </button>
                    ) : canEquipSelected ? (
                      <button
                        type="button"
                        onClick={() => onEquipItem(selectedItem)}
                        className="clip-cyber-slot bg-gradient-to-b from-[#6be8ff] to-[#0c56d0] p-[1.5px] shadow-[0_0_12px_rgba(56,214,255,0.45)] transition hover:brightness-110 active:scale-95"
                      >
                        <span className="clip-cyber-slot flex flex-col items-center justify-center bg-gradient-to-b from-[#1a78f2] to-[#083899] py-1.5 text-white">
                          <Cpu className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                          <span className="mt-0.5 text-[10px] font-black italic leading-none">
                            Equipar
                          </span>
                        </span>
                      </button>
                    ) : (
                      <div
                        title="Use este item na Incubadora ou sistema correspondente"
                        className="clip-cyber-slot bg-slate-600/60 p-[1.5px] opacity-60"
                      >
                        <span className="clip-cyber-slot flex flex-col items-center justify-center bg-[#061842] py-1.5 text-sky-200/80">
                          <Hand className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                          <span className="mt-0.5 text-[10px] font-black italic leading-none">
                            Usar
                          </span>
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => onDiscardItem(selectedItem)}
                      title="Descartar 1 unidade"
                      className="clip-cyber-slot bg-gradient-to-b from-[#ff7a7a] to-[#991b1b] p-[1.5px] shadow-[0_0_12px_rgba(239,68,68,0.45)] transition hover:brightness-110 active:scale-95"
                    >
                      <span className="clip-cyber-slot flex flex-col items-center justify-center bg-gradient-to-b from-[#dc2626] to-[#7f1d1d] py-1.5 text-white">
                        <Trash2 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        <span className="mt-0.5 text-[10px] font-black italic leading-none">
                          Descartar
                        </span>
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
                  <Package className="mb-2 h-9 w-9 text-cyan-300/65" />
                  <p className="text-xs font-black italic text-white">
                    Mochila Vazia
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-sky-200/80">
                    Derrote Digimons ou visite o DATS Center para coletar itens, DATAs e DigiEggs.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM CURRENCY + ORGANIZE BAR: T (Gold) / M (Green) / B (Blue) + Gold "Organizar" */}
        <div className="relative z-10 grid shrink-0 grid-cols-4 items-center gap-1.5 border-t border-cyan-400/40 bg-[#031036]/96 px-2.5 py-2 sm:gap-2 sm:px-3.5 sm:py-2.5">
          {/* Tera (T) */}
          <div
            title={`${currency.tera.toLocaleString('pt-BR')} Tera`}
            className="clip-cyber-input bg-gradient-to-b from-[#5ce6ff] to-[#0f5ed6] p-[1.5px]"
          >
            <div className="clip-cyber-input flex min-h-[34px] items-center justify-between gap-1 bg-[#041540] px-1.5 sm:px-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 text-[10px] font-black text-[#3b1c00] shadow-[0_0_6px_rgba(250,204,21,0.65)]">
                T
              </span>
              <span className="truncate text-[10.5px] font-black italic tabular-nums text-white sm:text-xs">
                {currency.tera.toLocaleString('pt-BR')} T
              </span>
            </div>
          </div>

          {/* Mega (M) */}
          <div
            title={`${currency.mega} Mega`}
            className="clip-cyber-input bg-gradient-to-b from-[#5ce6ff] to-[#0f5ed6] p-[1.5px]"
          >
            <div className="clip-cyber-input flex min-h-[34px] items-center justify-between gap-1 bg-[#041540] px-1.5 sm:px-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-lime-200 bg-gradient-to-b from-lime-300 via-emerald-500 to-green-700 text-[10px] font-black text-white shadow-[0_0_6px_rgba(74,222,128,0.65)]">
                M
              </span>
              <span className="truncate text-[10.5px] font-black italic tabular-nums text-white sm:text-xs">
                {currency.mega} M
              </span>
            </div>
          </div>

          {/* Bit (B) */}
          <div
            title={`${currency.bit} Bits`}
            className="clip-cyber-input bg-gradient-to-b from-[#5ce6ff] to-[#0f5ed6] p-[1.5px]"
          >
            <div className="clip-cyber-input flex min-h-[34px] items-center justify-between gap-1 bg-[#041540] px-1.5 sm:px-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan-100 bg-gradient-to-b from-sky-300 via-blue-500 to-blue-800 text-[10px] font-black text-white shadow-[0_0_6px_rgba(56,189,248,0.65)]">
                B
              </span>
              <span className="truncate text-[10.5px] font-black italic tabular-nums text-white sm:text-xs">
                {currency.bit} B
              </span>
            </div>
          </div>

          {/* Golden "Organizar" Button */}
          <button
            type="button"
            onClick={() => onSortInventory?.()}
            title="Organizar itens automaticamente por categoria e raridade"
            className="clip-cyber-input bg-gradient-to-b from-[#fff59d] via-[#fbbf24] to-[#b45309] p-[2px] shadow-[0_0_16px_rgba(251,191,36,0.58)] transition hover:brightness-110 active:scale-95"
          >
            <span className="clip-cyber-input flex min-h-[34px] items-center justify-center gap-1 bg-gradient-to-b from-[#ffe44d] via-[#f5b400] to-[#d97706] px-2 text-[10.5px] font-black italic text-[#170b00] sm:text-xs">
              <Backpack className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Organizar</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
});
