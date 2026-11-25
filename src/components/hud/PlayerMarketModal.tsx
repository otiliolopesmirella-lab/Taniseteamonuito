import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Coins,
  Eye,
  Lock,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Store,
  Tag,
  Undo2,
  X,
} from 'lucide-react';
import {
  ITEM_RARITY_META,
  isItemNonSellable,
} from '../../data/itemsCatalog';
import {
  ensureProcessedNpcPortraitUrl,
  getProcessedNpcPortraitUrl,
  MIKI_MARKET_NPC,
} from '../../sprites/npcSprites';
import {
  formatMarketCountdown,
  getMarketRemainingMs,
  MARKET_PRELIST_DELAY_MS,
  MAX_MARKET_PRICE_BITS,
  type PlayerMarketListingRecord,
} from '../../services/playerMarketService';
import type { InventoryCategory, InventoryItem } from '../../types/hud';
import {
  BITS_PER_MEGA,
  BITS_PER_TERA,
  formatDigitalCurrency,
  splitDigitalCurrency,
} from '../../utils/currency';
import { TmbCurrencyBar } from './CurrencyDisplay';

export interface MarketActionResult {
  ok: boolean;
  message: string;
}

interface PlayerMarketModalProps {
  open: boolean;
  currentUid: string;
  bits: number;
  inventory: InventoryItem[];
  unlockedSlots: number;
  globalListings: PlayerMarketListingRecord[];
  sellerListings: PlayerMarketListingRecord[];
  onClose: () => void;
  onCreateListing: (
    item: InventoryItem,
    quantity: number,
    priceBits: number
  ) => Promise<MarketActionResult>;
  onBuyListing: (
    listing: PlayerMarketListingRecord
  ) => Promise<MarketActionResult>;
  onCancelListing: (
    listing: PlayerMarketListingRecord
  ) => Promise<MarketActionResult>;
  onClaimPayout: (
    listing: PlayerMarketListingRecord
  ) => Promise<MarketActionResult>;
}

type MarketTab = 'browse' | 'sell' | 'mine';
type MarketFilter = 'all' | 'upcoming' | Exclude<InventoryCategory, 'all'>;

const CATEGORY_LABELS: Record<Exclude<InventoryCategory, 'all'>, string> = {
  digiegg: 'DigiEgg',
  data: 'DATA',
  consumable: 'Consumível',
  equip: 'Equip.',
  other: 'Especial',
};

const FILTER_OPTIONS: ReadonlyArray<{ id: MarketFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'upcoming', label: 'Vitrine 2m' },
  { id: 'digiegg', label: 'DigiEggs' },
  { id: 'data', label: 'DATA' },
  { id: 'consumable', label: 'Consumíveis' },
  { id: 'other', label: 'Especiais' },
  { id: 'equip', label: 'Equip.' },
];

export function PlayerMarketModal({
  open,
  currentUid,
  bits,
  inventory,
  unlockedSlots,
  globalListings,
  sellerListings,
  onClose,
  onCreateListing,
  onBuyListing,
  onCancelListing,
  onClaimPayout,
}: PlayerMarketModalProps) {
  const [tab, setTab] = useState<MarketTab>('browse');
  const [filter, setFilter] = useState<MarketFilter>('all');
  const [searchText, setSearchText] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [portraitUrl, setPortraitUrl] = useState(() =>
    getProcessedNpcPortraitUrl(MIKI_MARKET_NPC)
  );
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmBuyId, setConfirmBuyId] = useState<string | null>(null);

  // Sell form state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [sellQty, setSellQty] = useState(1);
  const [priceTera, setPriceTera] = useState(0);
  const [priceMega, setPriceMega] = useState(50);
  const [priceBit, setPriceBit] = useState(0);
  const [submittingSale, setSubmittingSale] = useState(false);

  // Load transparent portrait for Miki
  useEffect(() => {
    if (!open) return;
    let active = true;
    void ensureProcessedNpcPortraitUrl(MIKI_MARKET_NPC).then((url) => {
      if (active) setPortraitUrl(url);
    });
    return () => {
      active = false;
    };
  }, [open]);

  // 1-second live countdown ticker while modal is open
  useEffect(() => {
    if (!open) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [open]);

  // Clear transient confirmation / feedback when switching tabs or closing
  useEffect(() => {
    if (!open) {
      setConfirmBuyId(null);
      setFeedback(null);
    }
  }, [open]);

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(null), 5000);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const activeGlobalListings = useMemo(
    () => globalListings.filter((l) => l.status === 'active'),
    [globalListings]
  );

  const upcomingCount = useMemo(
    () =>
      activeGlobalListings.filter((l) => getMarketRemainingMs(l, nowMs) > 0)
        .length,
    [activeGlobalListings, nowMs]
  );

  // Merge seller's own listings from both subscriptions (deduped by listingId)
  const myListings = useMemo(() => {
    const map = new Map<string, PlayerMarketListingRecord>();
    for (const l of sellerListings) {
      if (l.sellerUid === currentUid) map.set(l.listingId, l);
    }
    for (const l of globalListings) {
      if (l.sellerUid === currentUid && !map.has(l.listingId)) {
        map.set(l.listingId, l);
      }
    }
    return [...map.values()].sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [sellerListings, globalListings, currentUid]);

  const myUnclaimedSales = useMemo(
    () => myListings.filter((l) => l.status === 'sold' && !l.payoutClaimed),
    [myListings]
  );

  const myActiveListings = useMemo(
    () => myListings.filter((l) => l.status === 'active'),
    [myListings]
  );

  const myRecentClaimedSales = useMemo(
    () =>
      myListings
        .filter((l) => l.status === 'sold' && l.payoutClaimed)
        .slice(0, 8),
    [myListings]
  );

  const totalUnclaimedBits = useMemo(
    () => myUnclaimedSales.reduce((acc, l) => acc + l.priceBits, 0),
    [myUnclaimedSales]
  );

  const filteredBrowseListings = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const list = activeGlobalListings.filter((l) => {
      const rem = getMarketRemainingMs(l, nowMs);
      if (filter === 'upcoming' && rem <= 0) return false;
      if (filter !== 'all' && filter !== 'upcoming' && l.itemCategory !== filter) {
        return false;
      }
      if (q) {
        const hay = `${l.itemName} ${l.sellerName} ${CATEGORY_LABELS[l.itemCategory]}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // Show upcoming (2-min public showcase) items first so the community immediately spots newly posted listings,
    // then newest available items.
    return [...list].sort((a, b) => {
      const remA = getMarketRemainingMs(a, nowMs) > 0 ? 1 : 0;
      const remB = getMarketRemainingMs(b, nowMs) > 0 ? 1 : 0;
      if (remA !== remB) return remB - remA;
      return b.createdAtMs - a.createdAtMs;
    });
  }, [activeGlobalListings, filter, searchText, nowMs]);

  const selectedSellItem = useMemo(
    () => inventory.find((item) => item.id === selectedItemId) ?? null,
    [inventory, selectedItemId]
  );

  useEffect(() => {
    if (!selectedSellItem) return;
    setSellQty((prev) => Math.max(1, Math.min(selectedSellItem.quantity, prev)));
  }, [selectedSellItem]);

  const computedTotalPriceBits = useMemo(() => {
    const raw =
      Math.max(0, Math.floor(priceTera)) * BITS_PER_TERA +
      Math.max(0, Math.floor(priceMega)) * BITS_PER_MEGA +
      Math.max(0, Math.floor(priceBit));
    return Math.min(MAX_MARKET_PRICE_BITS, raw);
  }, [priceTera, priceMega, priceBit]);

  if (!open) return null;

  function applyQuickPriceDelta(deltaBits: number) {
    const next = Math.max(
      0,
      Math.min(MAX_MARKET_PRICE_BITS, computedTotalPriceBits + deltaBits)
    );
    const parts = splitDigitalCurrency(next);
    setPriceTera(parts.tera);
    setPriceMega(parts.mega);
    setPriceBit(parts.bit);
  }

  function resetPrice() {
    setPriceTera(0);
    setPriceMega(0);
    setPriceBit(0);
  }

  function handleSelectInventoryItem(item: InventoryItem) {
    if (isItemNonSellable(item)) {
      setFeedback({
        ok: false,
        message: `${item.name} é vinculado à conta e não pode ser anunciado.`,
      });
      return;
    }
    setSelectedItemId(item.id);
    setSellQty(1);
    setFeedback(null);
  }

  async function handlePublishSale() {
    if (!selectedSellItem || submittingSale) return;
    if (computedTotalPriceBits < 1) {
      setFeedback({
        ok: false,
        message: 'Defina um preço de pelo menos 1 Bit para anunciar.',
      });
      return;
    }
    setSubmittingSale(true);
    try {
      const res = await onCreateListing(
        selectedSellItem,
        sellQty,
        computedTotalPriceBits
      );
      setFeedback(res);
      if (res.ok) {
        setSelectedItemId(null);
        setSellQty(1);
        setTab('browse');
        setFilter('all');
      }
    } finally {
      setSubmittingSale(false);
    }
  }

  async function handleConfirmPurchase(listing: PlayerMarketListingRecord) {
    if (busyId) return;
    setBusyId(listing.listingId);
    setConfirmBuyId(null);
    try {
      const res = await onBuyListing(listing);
      setFeedback(res);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancelOwn(listing: PlayerMarketListingRecord) {
    if (busyId) return;
    setBusyId(listing.listingId);
    try {
      const res = await onCancelListing(listing);
      setFeedback(res);
    } finally {
      setBusyId(null);
    }
  }

  async function handleClaimSingle(listing: PlayerMarketListingRecord) {
    if (busyId) return;
    setBusyId(listing.listingId);
    try {
      const res = await onClaimPayout(listing);
      setFeedback(res);
    } finally {
      setBusyId(null);
    }
  }

  const sellableInventoryCount = inventory.filter(
    (item) => !isItemNonSellable(item)
  ).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full sm:max-w-2xl h-[92dvh] sm:h-auto sm:max-h-[88dvh] rounded-t-2xl sm:rounded-2xl border border-purple-400/35 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Miki NPC Portrait & Bits Balance */}
        <div className="shrink-0 border-b border-purple-400/20 bg-gradient-to-r from-indigo-950/90 via-slate-900/95 to-purple-950/80 px-3.5 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl border border-purple-300/40 bg-gradient-to-b from-purple-900/50 to-slate-950/90 overflow-hidden flex items-center justify-center shadow-inner">
              <img
                src={portraitUrl}
                alt="Miki — Mercado de Jogadores"
                className="h-full w-full object-contain object-top pt-0.5 select-none"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Store className="h-4 w-4 text-purple-300 shrink-0" />
                <h2 className="truncate text-sm sm:text-base font-black tracking-wide text-white uppercase">
                  Miki · Mercado de Jogadores
                </h2>
              </div>
              <p className="mt-0.5 text-[11px] sm:text-xs text-purple-200/80 leading-snug">
                Compre e venda DATA, DigiEggs e itens entre Tamers. Todo anúncio
                fica 2:00 na vitrine pública antes de liberar a compra.
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-slate-950/80 px-2.5 py-1">
                  <Coins className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                  <TmbCurrencyBar bits={bits} compact />
                </div>
                <span className="text-[11px] font-semibold text-slate-300">
                  Mochila: {inventory.length}/{unlockedSlots}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar Mercado"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/90 text-slate-300 hover:border-purple-400/60 hover:text-white active:scale-95 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Tabs (Mobile-First >= 44px touch height) */}
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setTab('browse')}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 text-xs sm:text-sm font-bold transition ${
                tab === 'browse'
                  ? 'border-cyan-400/70 bg-cyan-500/20 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.2)]'
                  : 'border-slate-700/70 bg-slate-900/70 text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span>Mercado</span>
              <span className="rounded-md bg-slate-950/70 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">
                {activeGlobalListings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTab('sell')}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 text-xs sm:text-sm font-bold transition ${
                tab === 'sell'
                  ? 'border-purple-400/75 bg-purple-500/25 text-purple-100 shadow-[0_0_16px_rgba(192,132,252,0.22)]'
                  : 'border-slate-700/70 bg-slate-900/70 text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <Tag className="h-4 w-4 shrink-0" />
              <span>Vender</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('mine')}
              className={`relative flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 text-xs sm:text-sm font-bold transition ${
                tab === 'mine'
                  ? 'border-emerald-400/75 bg-emerald-500/20 text-emerald-100 shadow-[0_0_16px_rgba(52,211,153,0.2)]'
                  : 'border-slate-700/70 bg-slate-900/70 text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <Package className="h-4 w-4 shrink-0" />
              <span className="truncate">Anúncios</span>
              {myUnclaimedSales.length > 0 && (
                <span className="rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-slate-950 animate-pulse">
                  +{myUnclaimedSales.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Inline Feedback Toast */}
        {feedback && (
          <div
            className={`shrink-0 mx-3.5 mt-2.5 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
              feedback.ok
                ? 'border-emerald-400/45 bg-emerald-950/75 text-emerald-200'
                : 'border-rose-400/45 bg-rose-950/75 text-rose-200'
            }`}
          >
            {feedback.ok ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-300" />
            )}
            <span className="flex-1 leading-snug">{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-1 text-slate-300 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* TAB 1: BROWSE MARKET */}
        {tab === 'browse' && (
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Search & Category Filters */}
            <div className="shrink-0 px-3.5 pt-3 pb-2 space-y-2 border-b border-slate-800/80">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Buscar DigiEgg, DATA, item ou vendedor..."
                  className="h-11 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-9 pr-9 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/70 focus:outline-none"
                />
                {searchText && (
                  <button
                    type="button"
                    onClick={() => setSearchText('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {FILTER_OPTIONS.map((opt) => {
                  const active = filter === opt.id;
                  const showUpcomingBadge =
                    opt.id === 'upcoming' && upcomingCount > 0;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFilter(opt.id)}
                      className={`shrink-0 inline-flex items-center gap-1.5 min-h-[36px] rounded-lg border px-3 text-xs font-bold transition ${
                        active
                          ? opt.id === 'upcoming'
                            ? 'border-amber-400/80 bg-amber-500/20 text-amber-200'
                            : 'border-cyan-400/75 bg-cyan-500/20 text-cyan-100'
                          : 'border-slate-700/70 bg-slate-900/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {opt.id === 'upcoming' && (
                        <Clock className="h-3.5 w-3.5 text-amber-300" />
                      )}
                      <span>{opt.label}</span>
                      {showUpcomingBadge && (
                        <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
                          {upcomingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Listings Feed */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-2.5">
              {upcomingCount > 0 && filter !== 'upcoming' && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-400/35 bg-amber-950/35 px-3 py-2 text-[11px] text-amber-100">
                  <Eye className="h-4 w-4 shrink-0 text-amber-300" />
                  <span>
                    <strong className="text-amber-300">
                      {upcomingCount} {upcomingCount === 1 ? 'item' : 'itens'}
                    </strong>{' '}
                    na vitrine pública de 2 minutos! Fique de olho no cronômetro
                    para comprar assim que liberar.
                  </span>
                </div>
              )}

              {filteredBrowseListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/40 px-4 py-10 text-center">
                  <Store className="h-9 w-9 text-slate-500 mb-2" />
                  <p className="text-sm font-bold text-slate-200">
                    Nenhum anúncio encontrado
                  </p>
                  <p className="mt-1 text-xs text-slate-400 max-w-xs">
                    {activeGlobalListings.length === 0
                      ? 'Seja o primeiro a anunciar DATA, DigiEggs ou itens na aba Vender!'
                      : 'Tente limpar a busca ou escolher outra categoria.'}
                  </p>
                </div>
              ) : (
                filteredBrowseListings.map((listing) => {
                  const remainingMs = getMarketRemainingMs(listing, nowMs);
                  const isPrelisting = remainingMs > 0;
                  const progressPct = isPrelisting
                    ? Math.max(
                        0,
                        Math.min(
                          100,
                          ((MARKET_PRELIST_DELAY_MS - remainingMs) /
                            MARKET_PRELIST_DELAY_MS) *
                            100
                        )
                      )
                    : 100;
                  const isOwn = listing.sellerUid === currentUid;
                  const canAfford = bits >= listing.priceBits;
                  const rarityMeta =
                    ITEM_RARITY_META[listing.itemRarity] ??
                    ITEM_RARITY_META.comum;
                  const isConfirming = confirmBuyId === listing.listingId;
                  const isBusy = busyId === listing.listingId;

                  return (
                    <div
                      key={listing.listingId}
                      className={`rounded-xl border p-3 transition ${
                        isPrelisting
                          ? 'border-amber-400/50 bg-gradient-to-br from-amber-950/30 via-slate-900/95 to-slate-950'
                          : 'border-slate-700/75 bg-slate-900/85'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Item Icon */}
                        <div
                          className="relative h-14 w-14 shrink-0 rounded-xl border bg-slate-950/90 flex items-center justify-center p-1.5"
                          style={{ borderColor: rarityMeta.borderHex }}
                        >
                          {listing.itemIconUrl ? (
                            <img
                              src={listing.itemIconUrl}
                              alt={listing.itemName}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-slate-400" />
                          )}
                          {listing.quantity > 1 && (
                            <span className="absolute -bottom-1 -right-1 rounded-md border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">
                              ×{listing.quantity}
                            </span>
                          )}
                          {listing.itemCategory === 'digiegg' &&
                            listing.eggHatchLevel > 0 && (
                              <span className="absolute -top-1 -left-1 rounded-md border border-amber-300/60 bg-amber-950 px-1 py-0.5 text-[9px] font-black text-amber-200">
                                {listing.eggHatchLevel}/5
                              </span>
                            )}
                        </div>

                        {/* Item Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-sm font-black text-white">
                              {listing.itemName}
                            </span>
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                              {CATEGORY_LABELS[listing.itemCategory]}
                            </span>
                            {isPrelisting && (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-400/20 border border-amber-400/50 px-1.5 py-0.5 text-[10px] font-black text-amber-200">
                                <Clock className="h-3 w-3" />
                                VITRINE · {formatMarketCountdown(remainingMs)}
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                            <span>
                              Vendedor:{' '}
                              <strong className="text-slate-200">
                                {listing.sellerName}
                              </strong>
                            </span>
                            {listing.quantity > 1 && (
                              <span>
                                Unitário:{' '}
                                <strong className="text-slate-300">
                                  {formatDigitalCurrency(
                                    Math.round(
                                      listing.priceBits / listing.quantity
                                    )
                                  )}
                                </strong>
                              </span>
                            )}
                          </div>

                          {/* Price + Action Row */}
                          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-slate-950/90 px-2.5 py-1.5">
                              <Coins className="h-3.5 w-3.5 text-amber-300" />
                              <span className="text-xs sm:text-sm font-black text-amber-200">
                                {formatDigitalCurrency(listing.priceBits)}
                              </span>
                            </div>

                            {isOwn ? (
                              <span className="inline-flex min-h-[40px] items-center rounded-xl border border-purple-400/40 bg-purple-950/50 px-3 text-xs font-bold text-purple-200">
                                Seu Anúncio
                              </span>
                            ) : isPrelisting ? (
                              <button
                                type="button"
                                disabled
                                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-950/50 px-3.5 text-xs font-black text-amber-200 opacity-90 cursor-not-allowed"
                              >
                                <Clock className="h-3.5 w-3.5" />
                                <span>
                                  Libera em {formatMarketCountdown(remainingMs)}
                                </span>
                              </button>
                            ) : isConfirming ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleConfirmPurchase(listing)}
                                  className="min-h-[42px] rounded-xl bg-emerald-500 px-3.5 text-xs font-black text-slate-950 hover:bg-emerald-400 active:scale-95 transition"
                                >
                                  {isBusy ? 'Comprando...' : 'Confirmar'}
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => setConfirmBuyId(null)}
                                  className="min-h-[42px] rounded-xl border border-slate-600 bg-slate-800 px-3 text-xs font-bold text-slate-200 hover:bg-slate-700"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={!canAfford || isBusy}
                                onClick={() => setConfirmBuyId(listing.listingId)}
                                className={`min-h-[42px] rounded-xl px-4 text-xs font-black transition active:scale-95 ${
                                  canAfford
                                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:brightness-110 shadow-[0_0_14px_rgba(16,185,129,0.28)]'
                                    : 'border border-slate-700 bg-slate-800/80 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                {canAfford ? 'Comprar' : 'Bits insuficientes'}
                              </button>
                            )}
                          </div>

                          {/* Visual 2-minute countdown progress bar */}
                          {isPrelisting && (
                            <div className="mt-2.5">
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 transition-all duration-500"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                              <p className="mt-1 text-[10px] text-amber-200/80">
                                Vitrine anti-fake: toda a comunidade vê o preço
                                antes de abrir para compra.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SELL ITEM */}
        {tab === 'sell' && (
          <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-3">
            {/* Anti-alt 2-minute notice */}
            <div className="flex items-start gap-2 rounded-xl border border-purple-400/35 bg-purple-950/35 px-3 py-2.5 text-xs text-purple-100">
              <Clock className="h-4 w-4 shrink-0 text-purple-300 mt-0.5" />
              <p className="leading-snug">
                <strong className="text-purple-200">Vitrine de 2 minutos:</strong>{' '}
                ao postar um item, toda a comunidade visualiza o anúncio por 2
                minutos antes da compra liberar. Assim ninguém burla passando
                itens baratos para conta fake!
              </p>
            </div>

            {/* Selected Item Listing Form */}
            {selectedSellItem && (
              <div className="rounded-2xl border border-cyan-400/45 bg-slate-900/95 p-3.5 space-y-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-xl border border-cyan-400/50 bg-slate-950 p-1.5 flex items-center justify-center">
                    {selectedSellItem.iconUrl ? (
                      <img
                        src={selectedSellItem.iconUrl}
                        alt={selectedSellItem.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-cyan-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-black text-white">
                        {selectedSellItem.name}
                      </p>
                      {selectedSellItem.category === 'digiegg' &&
                        (selectedSellItem.eggData?.hatchLevel ?? 0) > 0 && (
                          <span className="rounded bg-amber-500/20 border border-amber-400/50 px-1.5 py-0.5 text-[10px] font-black text-amber-200">
                            {selectedSellItem.eggData?.hatchLevel}/5
                          </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Você possui:{' '}
                      <strong className="text-cyan-200">
                        ×{selectedSellItem.quantity}
                      </strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedItemId(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Quantity Selector (if stack > 1) */}
                {selectedSellItem.quantity > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wide text-slate-300">
                      Quantidade para vender
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSellQty((q) => Math.max(1, q - 1))}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-white active:scale-95"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={selectedSellItem.quantity}
                        value={sellQty}
                        onChange={(e) => {
                          const v = parseInt(e.target.value || '1', 10);
                          setSellQty(
                            Math.max(
                              1,
                              Math.min(
                                selectedSellItem.quantity,
                                Number.isFinite(v) ? v : 1
                              )
                            )
                          );
                        }}
                        className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-950 text-center text-sm font-black text-white focus:border-cyan-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSellQty((q) =>
                            Math.min(selectedSellItem.quantity, q + 1)
                          )
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-white active:scale-95"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSellQty(selectedSellItem.quantity)}
                        className="h-11 rounded-xl border border-cyan-400/40 bg-cyan-950/60 px-3 text-xs font-black text-cyan-200 active:scale-95"
                      >
                        Máx
                      </button>
                    </div>
                  </div>
                )}

                {/* T / M / B Price Builder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wide text-slate-300">
                      Preço Total (T / M / B)
                    </label>
                    <span className="text-xs font-black text-amber-300">
                      {formatDigitalCurrency(computedTotalPriceBits)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-amber-400/35 bg-slate-950 px-2.5 py-1.5">
                      <span className="block text-[10px] font-black text-amber-300">
                        TERA (T)
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={priceTera}
                        onChange={(e) =>
                          setPriceTera(
                            Math.max(
                              0,
                              Math.min(999, parseInt(e.target.value || '0', 10) || 0)
                            )
                          )
                        }
                        className="w-full bg-transparent text-base font-black text-white focus:outline-none"
                      />
                    </div>
                    <div className="rounded-xl border border-cyan-400/35 bg-slate-950 px-2.5 py-1.5">
                      <span className="block text-[10px] font-black text-cyan-300">
                        MEGA (M)
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={priceMega}
                        onChange={(e) =>
                          setPriceMega(
                            Math.max(
                              0,
                              Math.min(999, parseInt(e.target.value || '0', 10) || 0)
                            )
                          )
                        }
                        className="w-full bg-transparent text-base font-black text-white focus:outline-none"
                      />
                    </div>
                    <div className="rounded-xl border border-slate-600/60 bg-slate-950 px-2.5 py-1.5">
                      <span className="block text-[10px] font-black text-slate-300">
                        BIT (B)
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={priceBit}
                        onChange={(e) =>
                          setPriceBit(
                            Math.max(
                              0,
                              Math.min(999, parseInt(e.target.value || '0', 10) || 0)
                            )
                          )
                        }
                        className="w-full bg-transparent text-base font-black text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Quick-Add Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyQuickPriceDelta(10 * BITS_PER_MEGA)}
                      className="min-h-[34px] rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 text-[11px] font-bold text-cyan-200 hover:bg-slate-700"
                    >
                      +10M
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickPriceDelta(100 * BITS_PER_MEGA)}
                      className="min-h-[34px] rounded-lg border border-slate-700 bg-slate-800/90 px-2.5 text-[11px] font-bold text-cyan-200 hover:bg-slate-700"
                    >
                      +100M
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickPriceDelta(1 * BITS_PER_TERA)}
                      className="min-h-[34px] rounded-lg border border-amber-500/40 bg-amber-950/50 px-2.5 text-[11px] font-bold text-amber-200 hover:bg-amber-900/50"
                    >
                      +1T
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickPriceDelta(10 * BITS_PER_TERA)}
                      className="min-h-[34px] rounded-lg border border-amber-500/40 bg-amber-950/50 px-2.5 text-[11px] font-bold text-amber-200 hover:bg-amber-900/50"
                    >
                      +10T
                    </button>
                    <button
                      type="button"
                      onClick={resetPrice}
                      className="min-h-[34px] rounded-lg border border-slate-700 bg-slate-900 px-2.5 text-[11px] font-bold text-slate-400 hover:text-white"
                    >
                      Zerar
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={submittingSale || computedTotalPriceBits < 1}
                  onClick={handlePublishSale}
                  className="w-full min-h-[46px] rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 px-4 text-sm font-black text-white shadow-[0_0_20px_rgba(192,132,252,0.35)] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition"
                >
                  {submittingSale
                    ? 'Publicando na Vitrine...'
                    : `Anunciar ×${sellQty} por ${formatDigitalCurrency(computedTotalPriceBits)}`}
                </button>
              </div>
            )}

            {/* Player's Bag Grid to Pick Item */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Toque em um item da sua mochila ({sellableInventoryCount}{' '}
                  vendáveis)
                </h3>
              </div>

              {inventory.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-xs text-slate-400">
                  Sua mochila está vazia no momento.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {inventory.map((item) => {
                    const locked = isItemNonSellable(item);
                    const isSelected = selectedItemId === item.id;
                    const rarityMeta =
                      ITEM_RARITY_META[item.rarity ?? 'comum'] ??
                      ITEM_RARITY_META.comum;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectInventoryItem(item)}
                        className={`relative flex flex-col items-center rounded-xl border p-2 text-center transition active:scale-95 ${
                          locked
                            ? 'border-slate-800 bg-slate-950/60 opacity-55'
                            : isSelected
                              ? 'border-cyan-400 bg-cyan-950/45 shadow-[0_0_16px_rgba(34,211,238,0.25)]'
                              : 'border-slate-700/80 bg-slate-900/80 hover:border-purple-400/60'
                        }`}
                      >
                        <div
                          className="relative h-12 w-12 rounded-lg border bg-slate-950 p-1 flex items-center justify-center"
                          style={{
                            borderColor: locked
                              ? '#334155'
                              : rarityMeta.borderHex,
                          }}
                        >
                          {item.iconUrl ? (
                            <img
                              src={item.iconUrl}
                              alt={item.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-slate-400" />
                          )}
                          {item.quantity > 1 && (
                            <span className="absolute -bottom-1 -right-1 rounded bg-slate-950 border border-slate-700 px-1 text-[9px] font-black text-cyan-200">
                              ×{item.quantity}
                            </span>
                          )}
                          {locked && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-950 border border-rose-400/60">
                              <Lock className="h-3 w-3 text-rose-300" />
                            </span>
                          )}
                        </div>
                        <span className="mt-1.5 line-clamp-2 text-[11px] font-bold leading-tight text-slate-100">
                          {item.name}
                        </span>
                        {locked && (
                          <span className="mt-0.5 text-[9px] font-bold text-rose-300">
                            Não vendável
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MY LISTINGS & CLAIM BITS */}
        {tab === 'mine' && (
          <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-4">
            {/* Unclaimed Sold Payouts */}
            {myUnclaimedSales.length > 0 && (
              <div className="rounded-2xl border border-emerald-400/50 bg-emerald-950/30 p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wide text-emerald-300">
                      Vendas Concluídas — Resgate seus Bits!
                    </h3>
                    <p className="text-[11px] text-emerald-100/80">
                      Total disponível:{' '}
                      <strong className="text-amber-300">
                        {formatDigitalCurrency(totalUnclaimedBits)}
                      </strong>
                    </p>
                  </div>
                </div>

                {myUnclaimedSales.map((sale) => {
                  const isBusy = busyId === sale.listingId;
                  return (
                    <div
                      key={sale.listingId}
                      className="flex items-center justify-between gap-2 rounded-xl border border-emerald-400/30 bg-slate-950/80 p-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-white">
                          {sale.itemName}
                          {sale.quantity > 1 ? ` ×${sale.quantity}` : ''}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Comprado por{' '}
                          <strong className="text-emerald-200">
                            {sale.buyerName ?? 'Tamer'}
                          </strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleClaimSingle(sale)}
                        className="shrink-0 min-h-[42px] rounded-xl bg-emerald-500 px-3.5 text-xs font-black text-slate-950 hover:bg-emerald-400 active:scale-95 transition"
                      >
                        {isBusy
                          ? 'Resgatando...'
                          : `Resgatar +${formatDigitalCurrency(sale.priceBits)}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Active Listings */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Meus Anúncios Ativos ({myActiveListings.length})
              </h3>
              {myActiveListings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-5 text-center text-xs text-slate-400">
                  Você não tem nenhum item anunciado no momento.
                </div>
              ) : (
                myActiveListings.map((listing) => {
                  const rem = getMarketRemainingMs(listing, nowMs);
                  const isBusy = busyId === listing.listingId;
                  return (
                    <div
                      key={listing.listingId}
                      className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/85 p-3"
                    >
                      <div className="h-12 w-12 shrink-0 rounded-lg border border-slate-700 bg-slate-950 p-1 flex items-center justify-center">
                        {listing.itemIconUrl ? (
                          <img
                            src={listing.itemIconUrl}
                            alt={listing.itemName}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-white">
                          {listing.itemName}
                          {listing.quantity > 1 ? ` ×${listing.quantity}` : ''}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-bold text-amber-300">
                            {formatDigitalCurrency(listing.priceBits)}
                          </span>
                          {rem > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black text-amber-200">
                              <Clock className="h-3 w-3" />
                              Vitrine {formatMarketCountdown(rem)}
                            </span>
                          ) : (
                            <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-black text-cyan-200">
                              À Venda
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleCancelOwn(listing)}
                        className="inline-flex min-h-[42px] shrink-0 items-center gap-1.5 rounded-xl border border-rose-400/45 bg-rose-950/50 px-3 text-xs font-bold text-rose-200 hover:bg-rose-900/60 active:scale-95 transition"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        <span>{isBusy ? '...' : 'Retirar'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Recent Completed Sales History */}
            {myRecentClaimedSales.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Histórico Recente de Vendas
                </h3>
                {myRecentClaimedSales.map((sale) => (
                  <div
                    key={sale.listingId}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs"
                  >
                    <span className="truncate text-slate-300">
                      {sale.itemName}
                      {sale.quantity > 1 ? ` ×${sale.quantity}` : ''} →{' '}
                      <strong className="text-slate-200">
                        {sale.buyerName ?? 'Tamer'}
                      </strong>
                    </span>
                    <span className="shrink-0 font-bold text-emerald-300">
                      +{formatDigitalCurrency(sale.priceBits)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
