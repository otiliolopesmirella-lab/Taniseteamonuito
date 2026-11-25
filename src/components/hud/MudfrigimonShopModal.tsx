import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Droplet,
  Heart,
  Info,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  X,
} from 'lucide-react';
import {
  MUDFRIGIMON_DS_VITAMINS,
  MUDFRIGIMON_HP_FOODS,
  type MudfrigimonConsumableItem,
  type MudfrigimonShopCategory,
} from '../../data/mudfrigimonShopCatalog';
import {
  getUnlockedInventorySlots,
  INVENTORY_DEFAULT_UNLOCKED_SLOTS,
} from '../../services/hudGameService';
import { MUDFRIGIMON_NPC } from '../../sprites/npcSprites';
import type { InventoryItem } from '../../types/hud';
import { formatDigitalCurrency } from '../../utils/currency';
import { TmbCurrencyBar } from './CurrencyDisplay';

export interface MudfrigimonPurchaseResult {
  ok: boolean;
  message: string;
}

interface MudfrigimonShopModalProps {
  open: boolean;
  bits: number;
  inventory: InventoryItem[];
  unlockedSlots?: number;
  onClose: () => void;
  onBuyConsumable: (
    itemKey: string,
    quantity: number
  ) => MudfrigimonPurchaseResult;
}

const MAX_BUY_QUANTITY = 999;

function GoldBitCoin() {
  return (
    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-yellow-200 bg-gradient-to-b from-yellow-300 via-amber-400 to-amber-600 text-[8.5px] font-black text-[#422006] shadow-[0_0_6px_rgba(250,204,21,0.55)]">
      B
    </span>
  );
}

export function MudfrigimonShopModal({
  open,
  bits,
  inventory,
  unlockedSlots = INVENTORY_DEFAULT_UNLOCKED_SLOTS,
  onClose,
  onBuyConsumable,
}: MudfrigimonShopModalProps) {
  const safeUnlockedSlots = getUnlockedInventorySlots(unlockedSlots);
  const [activeTab, setActiveTab] = useState<MudfrigimonShopCategory>('hp-food');
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
    ts: number;
  } | null>(null);

  useEffect(() => {
    if (!open) {
      setFeedback(null);
      setQtyInputs({});
      setActiveTab('hp-food');
    }
  }, [open]);

  if (!open) return null;

  const ownedByKey = new Map<string, number>();
  for (const inv of inventory) {
    ownedByKey.set(inv.itemKey, (ownedByKey.get(inv.itemKey) ?? 0) + inv.quantity);
  }

  function getRawQtyString(itemKey: string): string {
    return qtyInputs[itemKey] ?? '1';
  }

  function getParsedQty(itemKey: string): number {
    const raw = getRawQtyString(itemKey).trim();
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 1) return 1;
    return Math.min(MAX_BUY_QUANTITY, parsed);
  }

  function setItemQty(itemKey: string, nextValue: string) {
    // Allow empty string while typing, otherwise digits only capped at MAX_BUY_QUANTITY
    const digitsOnly = nextValue.replace(/\D+/g, '');
    if (digitsOnly === '') {
      setQtyInputs((prev) => ({ ...prev, [itemKey]: '' }));
      return;
    }
    const clamped = Math.min(
      MAX_BUY_QUANTITY,
      Math.max(1, Number.parseInt(digitsOnly, 10) || 1)
    );
    setQtyInputs((prev) => ({ ...prev, [itemKey]: String(clamped) }));
  }

  function stepItemQty(itemKey: string, delta: number) {
    const current = getParsedQty(itemKey);
    const next = Math.min(MAX_BUY_QUANTITY, Math.max(1, current + delta));
    setQtyInputs((prev) => ({ ...prev, [itemKey]: String(next) }));
  }

  function handleBuyClick(item: MudfrigimonConsumableItem) {
    const qty = getParsedQty(item.itemKey);
    setQtyInputs((prev) => ({ ...prev, [item.itemKey]: String(qty) }));
    const res = onBuyConsumable(item.itemKey, qty);
    setFeedback({
      ok: res.ok,
      message: res.message,
      ts: Date.now(),
    });
  }

  const visibleItems =
    activeTab === 'hp-food' ? MUDFRIGIMON_HP_FOODS : MUDFRIGIMON_DS_VITAMINS;

  function renderCard(item: MudfrigimonConsumableItem) {
    const isHp = item.shopCategory === 'hp-food';
    const rawQty = getRawQtyString(item.itemKey);
    const qty = getParsedQty(item.itemKey);
    const totalPrice = item.priceBits * qty;
    const canAfford = bits >= totalPrice;
    const ownedQty = ownedByKey.get(item.itemKey) ?? 0;

    return (
      <div
        key={item.itemKey}
        className="group relative flex flex-col justify-between rounded-xl border border-[#38c4ff]/80 bg-gradient-to-b from-[#0a368a]/95 via-[#072364]/95 to-[#041540]/98 p-2.5 shadow-[inset_0_1px_0_rgba(165,243,252,0.35),0_4px_12px_rgba(0,12,42,0.65)] transition hover:border-[#7ef2ff] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_0_16px_rgba(56,232,255,0.4)]"
      >
        {/* Owned Quantity Badge (when already in bag) */}
        {ownedQty > 0 && (
          <span
            title={`Você possui ${ownedQty} na mochila`}
            className="absolute right-2 top-2 z-10 rounded border border-cyan-300/60 bg-[#021030]/90 px-1.5 py-0.5 text-[9px] font-black leading-none tabular-nums text-cyan-200"
          >
            x{ownedQty}
          </span>
        )}

        {/* Item Name */}
        <p className="min-h-[28px] px-3 text-center text-xs font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          {item.name}
        </p>

        {/* Extracted Icon Artwork with Signature Radial Glow */}
        <div className="relative mx-auto my-1.5 flex h-[84px] w-[84px] items-center justify-center sm:h-[92px] sm:w-[92px]">
          <div
            className={`pointer-events-none absolute inset-1 rounded-full blur-md ${
              isHp
                ? 'bg-[radial-gradient(circle,rgba(56,232,255,0.52)_0%,rgba(250,204,21,0.28)_48%,rgba(14,165,233,0)_78%)]'
                : 'bg-[radial-gradient(circle,rgba(56,232,255,0.6)_0%,rgba(59,130,246,0.28)_50%,rgba(14,165,233,0)_80%)]'
            }`}
          />
          <img
            src={item.iconUrl}
            alt={item.name}
            draggable={false}
            className="relative z-10 h-[76px] w-[76px] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.75)] transition-transform duration-150 group-hover:scale-105 sm:h-[84px] sm:w-[84px]"
          />
        </div>

        {/* Recovery Value, Price & Free Player Quantity Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1 text-xs font-black tabular-nums">
            {isHp ? (
              <>
                <Heart className="h-3.5 w-3.5 shrink-0 fill-rose-500 text-rose-300 drop-shadow-[0_0_5px_rgba(244,63,94,0.65)]" />
                <span className="text-white">
                  HP: {(item.hpRestore ?? 0).toLocaleString('pt-BR')}
                </span>
              </>
            ) : (
              <>
                <Droplet className="h-3.5 w-3.5 shrink-0 fill-cyan-400 text-sky-200 drop-shadow-[0_0_5px_rgba(56,232,255,0.7)]" />
                <span className="text-white">
                  DS: {(item.dsRestore ?? 0).toLocaleString('pt-BR')}
                </span>
              </>
            )}
          </div>

          {/* Unit & Live Total Price */}
          <div
            title={`Preço unitário: ${item.priceBits.toLocaleString('pt-BR')} Bits · Total (${qty}x): ${formatDigitalCurrency(totalPrice)}`}
            className="flex flex-col items-center leading-tight"
          >
            <div className="flex items-center justify-center gap-1 text-xs font-black tabular-nums text-amber-200">
              <GoldBitCoin />
              <span>
                {qty > 1
                  ? formatDigitalCurrency(totalPrice)
                  : `${item.priceBits.toLocaleString('pt-BR')} B`}
              </span>
            </div>
            {qty > 1 && (
              <span className="mt-0.5 text-[9.5px] font-bold tabular-nums text-cyan-200/80">
                ({item.priceBits.toLocaleString('pt-BR')} B / un.)
              </span>
            )}
          </div>

          {/* Player-Controlled Quantity Input (- [qty] +) */}
          <div className="flex items-center justify-between gap-1 rounded-lg border border-cyan-400/50 bg-[#031133]/95 p-0.5">
            <button
              type="button"
              onClick={() => stepItemQty(item.itemKey, -1)}
              aria-label={`Diminuir quantidade de ${item.name}`}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0a2a72] text-cyan-100 transition hover:bg-[#1342a8] active:scale-95"
            >
              <Minus className="h-3 w-3 stroke-[3]" />
            </button>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={rawQty}
              aria-label={`Quantidade de ${item.name}`}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && canAfford) {
                  handleBuyClick(item);
                }
              }}
              onChange={(e) => setItemQty(item.itemKey, e.target.value)}
              onBlur={() => {
                if (rawQty.trim() === '') {
                  setQtyInputs((prev) => ({ ...prev, [item.itemKey]: '1' }));
                }
              }}
              className="h-6 w-full min-w-0 bg-transparent text-center text-xs font-black tabular-nums text-white outline-none selection:bg-cyan-400/40"
            />

            <button
              type="button"
              onClick={() => stepItemQty(item.itemKey, 1)}
              aria-label={`Aumentar quantidade de ${item.name}`}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#0a2a72] text-cyan-100 transition hover:bg-[#1342a8] active:scale-95"
            >
              <Plus className="h-3 w-3 stroke-[3]" />
            </button>
          </div>

          <button
            type="button"
            disabled={!canAfford}
            onClick={() => handleBuyClick(item)}
            className={`flex min-h-[32px] w-full items-center justify-center rounded-lg border px-2 py-1 text-xs font-black tracking-wide transition active:scale-95 ${
              canAfford
                ? 'border-yellow-200 bg-gradient-to-b from-[#ffe26a] via-[#f59e0b] to-[#b45309] text-[#291000] shadow-[0_2px_8px_rgba(245,158,11,0.45),inset_0_1px_0_rgba(255,255,255,0.75)] hover:brightness-110'
                : 'cursor-not-allowed border-slate-600/80 bg-slate-800/85 text-slate-400'
            }`}
          >
            {qty > 1 ? `Comprar (${qty}x)` : 'Comprar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Loja de Consumíveis — MudFrigimon"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020816]/72 p-1.5 backdrop-blur-[2px] sm:p-3"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window relative flex max-h-[94dvh] w-full max-w-[980px] flex-col"
      >
        {/* Top-Right Extruded Red Metallic Close X Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar Loja de Consumíveis"
          className="absolute -right-1 -top-1 z-30 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#8ef2ff] bg-gradient-to-b from-[#ef4444] via-[#b91c1c] to-[#7f1d1d] text-white shadow-[0_0_18px_rgba(56,232,255,0.75),inset_0_1px_0_rgba(255,255,255,0.75)] transition hover:brightness-115 active:scale-95 sm:h-10 sm:w-10"
        >
          <X className="h-5 w-5 stroke-[3.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]" />
        </button>

        {/* Chamfered Neon Outer Rim + Deep Futuristic Blue Frame */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-2 border-[#5be8ff] bg-gradient-to-b from-[#083082] via-[#051d56] to-[#031238] shadow-[0_0_42px_rgba(0,174,255,0.62),inset_0_1px_0_rgba(165,243,252,0.5)]">
          {/* Futuristic Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#38d5ff] bg-gradient-to-r from-[#062875] via-[#0c53d4] to-[#062875] px-3 py-2 pr-11 shadow-[0_3px_16px_rgba(0,145,255,0.45)] sm:px-4 sm:py-2.5 sm:pr-14">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-yellow-200/90 bg-gradient-to-b from-[#1a6eff] to-[#06256e] shadow-[0_0_12px_rgba(56,232,255,0.55)]">
                <ShoppingCart className="h-5 w-5 text-yellow-300 drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]" />
              </div>
              <div className="leading-tight">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-black tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)] sm:text-lg">
                    Loja de Consumíveis
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-md border border-cyan-300/55 bg-[#04143e]/90 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                    <img
                      src={MUDFRIGIMON_NPC.spriteUrl}
                      alt={MUDFRIGIMON_NPC.name}
                      className="h-4 w-4 object-contain"
                    />
                    <span>MudFrigimon · DATS Center</span>
                  </span>
                </div>
                <p className="text-[10.5px] font-semibold text-cyan-100/95 sm:text-xs">
                  Escolha a aba, digite a quantidade desejada e clique em Comprar!
                </p>
              </div>
            </div>
          </div>

          {/* Dedicated Category Tabs: Comidas de HP vs Vitaminas de DS */}
          <div
            role="tablist"
            aria-label="Categorias da Loja de Consumíveis"
            className="grid grid-cols-2 gap-2 border-b border-cyan-400/40 bg-[#041744] px-3 py-2 sm:px-4"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'hp-food'}
              onClick={() => setActiveTab('hp-food')}
              className={`flex min-h-[42px] items-center justify-center gap-2 rounded-xl border-2 px-3 py-1.5 text-xs font-black uppercase tracking-wider transition active:scale-[0.98] sm:text-sm ${
                activeTab === 'hp-food'
                  ? 'border-rose-300 bg-gradient-to-r from-[#9f1239] via-[#be123c] to-[#881337] text-white shadow-[0_0_18px_rgba(244,63,94,0.5),inset_0_1px_0_rgba(255,255,255,0.4)]'
                  : 'border-cyan-400/35 bg-[#061e57]/85 text-cyan-100/85 hover:border-rose-300/60 hover:bg-[#1a1848]'
              }`}
            >
              <Heart
                className={`h-4 w-4 shrink-0 ${
                  activeTab === 'hp-food'
                    ? 'fill-rose-200 text-white'
                    : 'fill-rose-500/80 text-rose-300'
                }`}
              />
              <span>Comidas de HP</span>
              <span className="rounded-md bg-black/35 px-1.5 py-0.5 text-[10px] font-extrabold">
                9
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ds-vitamin'}
              onClick={() => setActiveTab('ds-vitamin')}
              className={`flex min-h-[42px] items-center justify-center gap-2 rounded-xl border-2 px-3 py-1.5 text-xs font-black uppercase tracking-wider transition active:scale-[0.98] sm:text-sm ${
                activeTab === 'ds-vitamin'
                  ? 'border-cyan-200 bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#075985] text-white shadow-[0_0_18px_rgba(56,232,255,0.55),inset_0_1px_0_rgba(255,255,255,0.4)]'
                  : 'border-cyan-400/35 bg-[#061e57]/85 text-cyan-100/85 hover:border-cyan-300/70 hover:bg-[#0a2f73]'
              }`}
            >
              <Droplet
                className={`h-4 w-4 shrink-0 ${
                  activeTab === 'ds-vitamin'
                    ? 'fill-cyan-100 text-white'
                    : 'fill-cyan-400/85 text-sky-200'
                }`}
              />
              <span>Vitaminas de DS</span>
              <span className="rounded-md bg-black/35 px-1.5 py-0.5 text-[10px] font-extrabold">
                8
              </span>
            </button>
          </div>

          {/* Active Category Items Grid */}
          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="mb-2.5 flex items-center justify-between gap-2 text-[11px] font-bold text-cyan-200/90">
              <span>
                {activeTab === 'hp-food'
                  ? 'Alimentos que restauram o HP (Vida) do seu Digimon ativo.'
                  : 'Vitaminas que restauram o DS (Energia) para usar habilidades F1 e F2.'}
              </span>
              <span className="hidden text-[10.5px] text-cyan-300/80 sm:inline">
                Digite a quantidade (1 a {MAX_BUY_QUANTITY}) em cada item
              </span>
            </div>

            <div
              className={`grid gap-2.5 ${
                activeTab === 'hp-food'
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
                  : 'grid-cols-2 sm:grid-cols-4'
              }`}
            >
              {visibleItems.map(renderCard)}
            </div>
          </div>

          {/* Bottom Info + Live Balance Footer */}
          <div className="flex flex-col gap-2 border-t-2 border-[#38d5ff]/75 bg-gradient-to-r from-[#031236] via-[#062260] to-[#031236] px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            {/* Info / Purchase Confirmation Banner */}
            <div
              key={feedback?.ts ?? 'default'}
              className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-3 py-1.5 text-[11px] font-bold sm:text-xs ${
                feedback
                  ? feedback.ok
                    ? 'border-emerald-400/75 bg-emerald-950/75 text-emerald-200'
                    : 'border-rose-400/75 bg-rose-950/75 text-rose-200'
                  : 'border-cyan-400/45 bg-[#04143a]/90 text-cyan-100'
              }`}
            >
              {feedback ? (
                feedback.ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-300" />
                )
              ) : (
                <Info className="h-4 w-4 shrink-0 text-cyan-300" />
              )}
              <span className="truncate">
                {feedback
                  ? feedback.message
                  : 'Itens que recuperam seu HP e DS para continuar sua jornada!'}
              </span>
            </div>

            {/* Backpack Slots + Live T/M/B Balance */}
            <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
              <div className="flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-[#041236] px-2.5 py-1 text-[10.5px] font-extrabold text-cyan-200">
                <Package className="h-3.5 w-3.5 text-cyan-300" />
                <span className="tabular-nums">
                  {inventory.length}/{safeUnlockedSlots}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-amber-300/55 bg-[#04143c] px-2.5 py-1 shadow-[0_0_12px_rgba(250,204,21,0.18)]">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wide text-cyan-100">
                  Seu Saldo:
                </span>
                <TmbCurrencyBar bits={bits} compact />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
