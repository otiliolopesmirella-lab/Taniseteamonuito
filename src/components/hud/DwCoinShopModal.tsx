import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Backpack,
  CheckCircle2,
  CreditCard,
  Crown,
  Flame,
  Info,
  Package,
  QrCode,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import {
  DWCOIN_PROMO_OFFER,
  DWCOIN_PURCHASE_TERMS_ITEMS,
  DWCOIN_PURCHASE_TERMS_VERSION,
  DWCOIN_RECHARGE_PACKS,
  DWCOIN_SHOP_ARTWORK_URL,
  DWCOIN_SHOP_OFFERS,
  type DwCoinRechargePack,
  type DwCoinShopCategory,
  type DwCoinShopOffer,
} from '../../data/dwCoinShopCatalog';
import {
  EVOLUTER_ICON_URL,
  HATCH_BACKUP_ICON_URL,
  isXpBoostIconUrl,
} from '../../data/itemsCatalog';
import { ARCHIVE_TOTAL_SLOTS } from '../../services/archiveService';
import {
  cancelDwCoinPurchaseOrder,
  createDwCoinPurchaseOrder,
  DWCOIN_PAYMENT_MESSAGES,
  type DwCoinPaymentMethod,
  type DwCoinPurchaseOrder,
} from '../../services/dwCoinOrderService';
import { INVENTORY_TOTAL_SLOTS } from '../../services/hudGameService';

interface DwCoinShopModalProps {
  dCoin: number;
  playerId?: string;
  unlockedInventorySlots: number;
  unlockedArchiveSlots: number;
  isGM: boolean;
  onBuyOffer: (offer: DwCoinShopOffer) => { ok: boolean; message: string };
  onGmTestRechargePack?: (dwCoinAmount: number) => void;
  onPlayTone: (tone: 'click' | 'confirm' | 'error') => void;
  onClose: () => void;
}

type ShopMainTab = 'promo' | 'recharge' | 'catalog';
type CategoryFilter = 'all' | DwCoinShopCategory;
type RechargeFlowStep = 'select_method' | 'terms' | 'checkout';

const CATEGORY_TABS: ReadonlyArray<{ id: CategoryFilter; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'boosts', label: 'Boosts XP' },
  { id: 'promocoes', label: 'Promoções' },
  { id: 'incubacao', label: 'Incubação' },
  { id: 'evolucao', label: 'Evolução' },
  { id: 'expansao', label: 'Expansão' },
  { id: 'digieggs', label: 'DigiEggs' },
  { id: 'kits', label: 'Kits' },
];

export function DwCoinEmblem({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="dwcoin-ring" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <radialGradient id="dwcoin-core" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="65%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#082f49" />
        </radialGradient>
      </defs>
      <circle
        cx="16"
        cy="16"
        r="14.5"
        fill="url(#dwcoin-ring)"
        stroke="#fef9c3"
        strokeWidth="1.4"
      />
      <circle
        cx="16"
        cy="16"
        r="10.8"
        fill="url(#dwcoin-core)"
        stroke="#7dd3fc"
        strokeWidth="1.1"
      />
      <text
        x="16"
        y="19.6"
        textAnchor="middle"
        fill="#fef9c3"
        fontSize="9.5"
        fontWeight="900"
        fontFamily="system-ui, sans-serif"
      >
        DW
      </text>
    </svg>
  );
}

export function DwCoinShopModal({
  dCoin,
  playerId = 'local_player',
  unlockedInventorySlots,
  unlockedArchiveSlots,
  isGM,
  onBuyOffer,
  onGmTestRechargePack,
  onPlayTone,
  onClose,
}: DwCoinShopModalProps) {
  const [mainTab, setMainTab] = useState<ShopMainTab>('promo');
  const [returnTabAfterRecharge, setReturnTabAfterRecharge] =
    useState<ShopMainTab | null>(null);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [selectedPack, setSelectedPack] = useState<DwCoinRechargePack | null>(null);
  const [selectedPromoOffer, setSelectedPromoOffer] =
    useState<DwCoinShopOffer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<DwCoinPaymentMethod>('pix');
  const [rechargeStep, setRechargeStep] =
    useState<RechargeFlowStep>('select_method');
  const [termsChecked, setTermsChecked] = useState(false);
  const [activeCheckoutOrder, setActiveCheckoutOrder] =
    useState<DwCoinPurchaseOrder | null>(null);
  const [isSubmittingTermsOrder, setIsSubmittingTermsOrder] = useState(false);
  const [highlightPacksPulse, setHighlightPacksPulse] = useState(false);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);
  const [checkoutNoticeTone, setCheckoutNoticeTone] = useState<
    'pending' | 'cancelled' | 'approved' | 'error' | null
  >(null);
  const [feedback, setFeedback] = useState<{
    tone: 'ok' | 'error' | 'info';
    text: string;
  } | null>(null);

  function resetPackCheckoutFlow() {
    setSelectedPack(null);
    setRechargeStep('select_method');
    setTermsChecked(false);
    setActiveCheckoutOrder(null);
    setCheckoutNotice(null);
    setCheckoutNoticeTone(null);
    setIsSubmittingTermsOrder(false);
  }

  function openPackCheckoutModal(pack: DwCoinRechargePack) {
    setSelectedPack(pack);
    setRechargeStep('select_method');
    setTermsChecked(false);
    setActiveCheckoutOrder(null);
    setCheckoutNotice(null);
    setCheckoutNoticeTone(null);
    setIsSubmittingTermsOrder(false);
  }

  function handleSelectPaymentMethod(method: DwCoinPaymentMethod) {
    if (!selectedPack) return;
    onPlayTone('click');
    setPaymentMethod(method);
    setCheckoutNotice(null);
    setCheckoutNoticeTone(null);

    // Avoid showing duplicate terms popup if player is already inside checkout for this same purchase
    if (
      activeCheckoutOrder &&
      activeCheckoutOrder.packId === selectedPack.id &&
      activeCheckoutOrder.paymentMethod === method &&
      activeCheckoutOrder.status === 'pending'
    ) {
      setRechargeStep('checkout');
      return;
    }

    setTermsChecked(false);
    setRechargeStep('terms');
  }

  function handleBackFromTerms() {
    if (isSubmittingTermsOrder) return;
    onPlayTone('click');
    setTermsChecked(false);
    setRechargeStep('select_method');
  }

  function startExistingPackCheckout(
    pack: DwCoinRechargePack,
    method: DwCoinPaymentMethod,
    order: DwCoinPurchaseOrder
  ) {
    setActiveCheckoutOrder(order);
    setRechargeStep('checkout');
    setCheckoutNoticeTone('pending');
    setCheckoutNotice(
      `Pacote ${pack.dwCoinAmount} DWcoin (${pack.priceBrlLabel} via ${
        method === 'pix' ? 'PIX' : 'Cartão'
      }): o checkout real está em ativação final para o lançamento oficial. Nenhuma cobrança foi realizada.`
    );
  }

  async function handleConfirmTermsAndStartCheckout() {
    if (!selectedPack || !termsChecked || isSubmittingTermsOrder) return;
    setIsSubmittingTermsOrder(true);
    setCheckoutNotice(null);
    setCheckoutNoticeTone(null);

    try {
      const order = await createDwCoinPurchaseOrder({
        playerId,
        packId: selectedPack.id,
        paymentMethod,
        termsAccepted: true,
        termsVersion: DWCOIN_PURCHASE_TERMS_VERSION,
      });
      onPlayTone('confirm');
      startExistingPackCheckout(selectedPack, paymentMethod, order);
    } catch {
      onPlayTone('error');
      setCheckoutNoticeTone('error');
      setCheckoutNotice(DWCOIN_PAYMENT_MESSAGES.error);
      setRechargeStep('select_method');
    } finally {
      setIsSubmittingTermsOrder(false);
    }
  }

  async function handleCancelActiveCheckout() {
    onPlayTone('click');
    const currentOrder = activeCheckoutOrder;
    setActiveCheckoutOrder(null);
    setTermsChecked(false);
    setRechargeStep('select_method');
    setCheckoutNoticeTone('cancelled');
    setCheckoutNotice(DWCOIN_PAYMENT_MESSAGES.cancelled);
    if (currentOrder) {
      try {
        await cancelDwCoinPurchaseOrder(currentOrder);
      } catch {
        // Non-blocking cleanup; order remains pending/cancelled without crediting DCoins
      }
    }
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedPromoOffer) {
          setSelectedPromoOffer(null);
        } else if (selectedPack) {
          if (rechargeStep === 'terms') {
            handleBackFromTerms();
          } else {
            resetPackCheckoutFlow();
          }
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, rechargeStep, selectedPack, selectedPromoOffer, isSubmittingTermsOrder]);

  const visibleOffers = useMemo(() => {
    if (category === 'all') return DWCOIN_SHOP_OFFERS;
    return DWCOIN_SHOP_OFFERS.filter((o) => o.category === category);
  }, [category]);

  function handlePurchaseOffer(offer: DwCoinShopOffer): boolean {
    const result = onBuyOffer(offer);
    if (result.ok) {
      onPlayTone('confirm');
      setFeedback({ tone: 'ok', text: result.message });
      return true;
    }
    onPlayTone('error');
    setFeedback({ tone: 'error', text: result.message });
    return false;
  }

  function handleBackFromRecharge() {
    onPlayTone('click');
    if (returnTabAfterRecharge) {
      const target = returnTabAfterRecharge;
      setReturnTabAfterRecharge(null);
      setMainTab(target);
      return;
    }
    onClose();
  }

  function handlePlusButtonClick() {
    onPlayTone('click');
    setHighlightPacksPulse(true);
    window.setTimeout(() => setHighlightPacksPulse(false), 950);
  }

  function renderOfferIcon(offer: DwCoinShopOffer) {
    if (offer.iconUrl) {
      const isFullBleedIcon =
        offer.iconUrl === HATCH_BACKUP_ICON_URL ||
        offer.iconUrl === EVOLUTER_ICON_URL ||
        isXpBoostIconUrl(offer.iconUrl);
      return (
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-300/60 bg-[#020b22] shadow-[0_0_12px_rgba(56,232,255,0.28)] ${
            isFullBleedIcon ? 'p-0' : 'p-1'
          }`}
        >
          <img
            src={offer.iconUrl}
            alt={offer.name}
            className={`h-full w-full ${
              isFullBleedIcon ? 'object-cover' : 'object-contain'
            } drop-shadow-[0_2px_6px_rgba(56,232,255,0.45)]`}
          />
        </div>
      );
    }
    if (offer.reward.kind === 'expand_inventory') {
      return (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-sky-300/45 bg-sky-950/80 text-sky-300">
          <Backpack className="h-6 w-6" />
        </div>
      );
    }
    if (offer.reward.kind === 'expand_archive') {
      return (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-300/45 bg-violet-950/80 text-violet-300">
          <Archive className="h-6 w-6" />
        </div>
      );
    }
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-300/45 bg-amber-950/70 text-amber-300">
        <Package className="h-6 w-6" />
      </div>
    );
  }

  const formattedBalance = dCoin.toLocaleString('pt-BR');
  const balanceFontSizeClass =
    formattedBalance.length >= 7
      ? 'text-[clamp(11px,2.2vw,16px)]'
      : formattedBalance.length >= 5
        ? 'text-[clamp(13px,2.7vw,20px)]'
        : 'text-[clamp(16px,3.4vw,24px)]';

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Loja DWcoin"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#010716]/86 p-2 backdrop-blur-[2px] sm:p-3"
    >
      {/* Top Mode Switcher Strip */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="mb-2 flex w-full max-w-[560px] items-center justify-between gap-1.5 rounded-2xl border border-cyan-300/65 bg-gradient-to-b from-[#0b3c9c]/95 to-[#041848]/95 px-2 py-1.5 shadow-[0_0_24px_rgba(0,174,255,0.38)]"
      >
        <div className="grid flex-1 grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => {
              onPlayTone('click');
              setReturnTabAfterRecharge(null);
              resetPackCheckoutFlow();
              setMainTab('promo');
            }}
            className={`relative flex min-h-[38px] items-center justify-center gap-1 rounded-xl border px-1.5 text-[10.5px] font-black transition sm:gap-1.5 sm:px-2 sm:text-xs ${
              mainTab === 'promo'
                ? 'border-fuchsia-300 bg-gradient-to-b from-fuchsia-500/35 via-purple-600/30 to-indigo-800/40 text-white shadow-[0_0_14px_rgba(232,121,249,0.4)]'
                : 'border-cyan-400/25 bg-[#041232]/85 text-amber-200 hover:text-white'
            }`}
          >
            <Flame className="h-3.5 w-3.5 shrink-0 text-amber-300" />
            <span className="truncate">Promoções</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onPlayTone('click');
              setSelectedPromoOffer(null);
              setMainTab('recharge');
            }}
            className={`flex min-h-[38px] items-center justify-center gap-1 rounded-xl border px-1.5 text-[10.5px] font-black transition sm:gap-1.5 sm:px-2 sm:text-xs ${
              mainTab === 'recharge'
                ? 'border-amber-300 bg-gradient-to-b from-amber-400/30 to-amber-600/25 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                : 'border-cyan-400/25 bg-[#041232]/85 text-sky-200 hover:text-white'
            }`}
          >
            <DwCoinEmblem className="h-4 w-4 shrink-0" />
            <span className="truncate">DWcoin (R$)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onPlayTone('click');
              setReturnTabAfterRecharge(null);
              resetPackCheckoutFlow();
              setSelectedPromoOffer(null);
              setMainTab('catalog');
            }}
            className={`flex min-h-[38px] items-center justify-center gap-1 rounded-xl border px-1.5 text-[10.5px] font-black transition sm:gap-1.5 sm:px-2 sm:text-xs ${
              mainTab === 'catalog'
                ? 'border-cyan-300 bg-gradient-to-b from-cyan-400/30 to-blue-700/35 text-white shadow-[0_0_12px_rgba(56,232,255,0.3)]'
                : 'border-cyan-400/25 bg-[#041232]/85 text-sky-200 hover:text-white'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Itens</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onPlayTone('click');
            onClose();
          }}
          aria-label="Fechar Loja DWcoin"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-200/70 bg-[#051d52] text-cyan-100 transition hover:bg-sky-700 active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* MAIN VIEW 0: Aba de Promoções com Imagem Clicável */}
      {mainTab === 'promo' ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative flex max-h-[84dvh] w-full max-w-[540px] flex-col overflow-hidden rounded-2xl border-2 border-cyan-300/80 bg-gradient-to-b from-[#0b3c9c] via-[#061e56] to-[#030e2c] shadow-[0_0_46px_rgba(0,180,255,0.45)]"
        >
          {/* Promo Header */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-cyan-400/40 bg-[#082d7a] px-3.5 py-2.5 sm:px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/80 bg-gradient-to-b from-fuchsia-500/35 to-indigo-900/80 shadow-[0_0_12px_rgba(232,121,249,0.45)]">
                <Sparkles className="h-4 w-4 text-amber-300" />
              </div>
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-sm font-black tracking-wide text-white">
                  PROMOÇÕES ESPECIAIS
                </h2>
                <p className="text-[10.5px] font-semibold text-cyan-200/90">
                  Toque na imagem para adquirir o Pack promocional
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onPlayTone('click');
                setReturnTabAfterRecharge('promo');
                setMainTab('recharge');
              }}
              title="Comprar mais DWcoin"
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-amber-300/75 bg-[#041336] px-2.5 py-1.5 transition hover:border-amber-200 hover:bg-[#072059] active:scale-95"
            >
              <DwCoinEmblem className="h-4.5 w-4.5 shrink-0" />
              <span className="text-xs font-black tabular-nums text-amber-200">
                {formattedBalance}
              </span>
              <span className="rounded bg-amber-400 px-1 text-[10px] font-black text-[#081226]">
                +
              </span>
            </button>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`flex shrink-0 items-center gap-2 border-b px-4 py-2 text-[11px] font-bold ${
                feedback.tone === 'ok'
                  ? 'border-emerald-400/45 bg-emerald-950/85 text-emerald-200'
                  : feedback.tone === 'error'
                    ? 'border-rose-400/45 bg-rose-950/85 text-rose-200'
                    : 'border-cyan-400/45 bg-sky-950/85 text-cyan-100'
              }`}
            >
              {feedback.tone === 'ok' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
              ) : (
                <Info className="h-4 w-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Clickable Promo Banner Container */}
          <div className="flex flex-1 flex-col items-center justify-center gap-2.5 overflow-y-auto p-3 sm:p-4">
            <button
              type="button"
              onClick={() => {
                onPlayTone('click');
                setFeedback(null);
                setSelectedPromoOffer(DWCOIN_PROMO_OFFER);
              }}
              aria-label="Comprar Pack Comece na Frente: Egg do Veemon 5/5 + 12 Evoluters por 50 DWcoin"
              className="group relative aspect-square w-full max-w-[min(430px,56dvh)] cursor-pointer overflow-hidden rounded-2xl border-2 border-amber-300/85 bg-[#020b24] shadow-[0_0_32px_rgba(56,189,248,0.42),0_12px_28px_rgba(0,0,0,0.7)] transition-transform duration-150 hover:scale-[1.015] hover:border-amber-200 hover:shadow-[0_0_40px_rgba(251,191,36,0.5)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <img
                src={DWCOIN_PROMO_OFFER.bannerImageUrl}
                alt="Comece na Frente: Egg do Veemon 5/5 + 12 Evoluters por apenas 50 DWcoins"
                draggable={false}
                className="block h-full w-full object-contain"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20 transition group-hover:bg-amber-300/5"
              />
            </button>

            <div className="flex w-full max-w-[min(430px,92vw)] flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-400/35 bg-[#041232]/90 px-3 py-2 text-[11px]">
              <div className="flex items-center gap-2 text-cyan-100">
                <img
                  src="/assets/items/digieggs/egg_veemon.png"
                  alt=""
                  className="h-6 w-6 shrink-0 object-contain"
                />
                <span className="font-bold">
                  Veemon <span className="text-amber-300">5/5</span> +{' '}
                  <span className="text-fuchsia-300">12 Evoluters</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onPlayTone('click');
                  setFeedback(null);
                  setSelectedPromoOffer(DWCOIN_PROMO_OFFER);
                }}
                className="flex min-h-[34px] items-center gap-1.5 rounded-lg border border-amber-200 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 px-3 text-[11px] font-black text-[#081226] shadow transition hover:brightness-110 active:scale-95"
              >
                <DwCoinEmblem className="h-3.5 w-3.5 shrink-0" />
                <span>Comprar · 50 DWcoin</span>
              </button>
            </div>
          </div>

          {/* Confirmation Overlay for Clickable Promo Image */}
          {selectedPromoOffer && (
            <div
              onClick={() => setSelectedPromoOffer(null)}
              className="absolute inset-0 z-20 flex items-center justify-center bg-[#02091d]/84 p-3 backdrop-blur-[2px]"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="animate-dmo-window w-full max-w-[360px] overflow-hidden rounded-2xl border-2 border-amber-300/90 bg-gradient-to-b from-[#0b3d9e] via-[#061f58] to-[#030e2c] text-white shadow-[0_0_40px_rgba(251,191,36,0.45)]"
              >
                <div className="flex items-center justify-between border-b border-cyan-400/35 bg-[#082d7a] px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 shrink-0 text-amber-300" />
                    <div>
                      <p className="text-xs font-black tracking-wide text-white">
                        Confirmar Promoção
                      </p>
                      <p className="text-[10px] font-bold text-cyan-200/85">
                        Entrega imediata no Inventário
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onPlayTone('click');
                      setSelectedPromoOffer(null);
                    }}
                    aria-label="Fechar confirmação da promoção"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-200/60 bg-[#051d52] text-cyan-100 hover:bg-sky-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5 p-3.5 text-xs">
                  {/* Reward 1: Veemon 5/5 Egg */}
                  <div className="flex items-center gap-2.5 rounded-xl border border-cyan-300/45 bg-[#041232] px-3 py-2">
                    <img
                      src="/assets/items/digieggs/egg_veemon.png"
                      alt="DigiEgg Veemon 5/5"
                      className="h-9 w-9 shrink-0 object-contain drop-shadow-[0_2px_8px_rgba(56,232,255,0.55)]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-white">
                        1x DigiEgg: Veemon{' '}
                        <span className="rounded border border-amber-300/80 bg-amber-500/20 px-1 py-0.5 text-[10px] text-amber-200">
                          5/5
                        </span>
                      </p>
                      <p className="mt-0.5 text-[10.5px] leading-snug text-cyan-200/90">
                        Pronto! Só colocar na Incubadora DATS e chocar.
                      </p>
                    </div>
                  </div>

                  {/* Reward 2: 12 Evoluters */}
                  <div className="flex items-center gap-2.5 rounded-xl border border-fuchsia-300/45 bg-[#041232] px-3 py-2">
                    <img
                      src={EVOLUTER_ICON_URL}
                      alt="Evoluter"
                      className="h-9 w-9 shrink-0 object-contain drop-shadow-[0_2px_8px_rgba(232,121,249,0.55)]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-white">12x Evoluters</p>
                      <p className="mt-0.5 text-[10.5px] leading-snug text-fuchsia-200/85">
                        Para desbloquear evoluções Ultimate e Mega.
                      </p>
                    </div>
                  </div>

                  {/* Price & Balance */}
                  <div className="flex items-center justify-between rounded-xl border border-amber-300/45 bg-[#041232] px-3 py-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200/80">
                        Preço do Pack
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <DwCoinEmblem className="h-4.5 w-4.5 shrink-0" />
                        <span className="text-base font-black tabular-nums text-amber-300">
                          {selectedPromoOffer.priceDwCoin} DWcoin
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200/80">
                        Seu Saldo
                      </p>
                      <p
                        className={`mt-0.5 text-sm font-black tabular-nums ${
                          dCoin >= selectedPromoOffer.priceDwCoin
                            ? 'text-emerald-300'
                            : 'text-rose-300'
                        }`}
                      >
                        {formattedBalance} DWcoin
                      </p>
                    </div>
                  </div>

                  {dCoin >= selectedPromoOffer.priceDwCoin ? (
                    <button
                      type="button"
                      onClick={() => {
                        const ok = handlePurchaseOffer(selectedPromoOffer);
                        if (ok) {
                          setSelectedPromoOffer(null);
                        }
                      }}
                      className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 px-4 text-xs font-black text-[#081226] shadow-[0_0_18px_rgba(251,191,36,0.45)] transition hover:brightness-110 active:scale-95"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        Confirmar Compra · {selectedPromoOffer.priceDwCoin} DWcoin
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="rounded-lg border border-rose-400/50 bg-rose-950/65 px-3 py-1.5 text-center text-[11px] font-bold text-rose-200">
                        Saldo insuficiente! Faltam{' '}
                        {(selectedPromoOffer.priceDwCoin - dCoin).toLocaleString('pt-BR')}{' '}
                        DWcoin.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          onPlayTone('click');
                          setSelectedPromoOffer(null);
                          setReturnTabAfterRecharge('promo');
                          setMainTab('recharge');
                        }}
                        className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 px-4 text-xs font-black text-[#081226] transition hover:brightness-110 active:scale-95"
                      >
                        <DwCoinEmblem className="h-4 w-4 shrink-0" />
                        <span>Recarregar DWcoin (R$)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : mainTab === 'recharge' ? (
        /* MAIN VIEW 1: Official Interactive DWcoin Store Artwork (Exact 2:3 Frame) */
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative aspect-[2/3] h-[min(84dvh,780px)] max-w-[96vw] overflow-hidden rounded-2xl border-2 border-cyan-300/85 bg-[#020c28] shadow-[0_0_48px_rgba(0,180,255,0.52),0_18px_50px_rgba(0,0,0,0.85)] select-none"
        >
          {/* Official Artwork Layer */}
          <img
            src={DWCOIN_SHOP_ARTWORK_URL}
            alt="Loja oficial de DWcoin"
            draggable={false}
            className="pointer-events-none block h-full w-full object-fill"
          />

          {/* Live Dynamic DWcoin Balance Overlay */}
          <div
            aria-label={`Saldo atual: ${formattedBalance} DWcoin`}
            style={{
              left: '17.2%',
              top: '2.1%',
              width: '21.0%',
              height: '4.4%',
            }}
            className="pointer-events-none absolute flex items-center justify-center rounded-md bg-[#010c2b] px-1"
          >
            <span
              className={`font-black italic leading-none tracking-tight text-white tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${balanceFontSizeClass}`}
            >
              {formattedBalance}
            </span>
          </div>

          {/* Clickable Top-Left '+' Button */}
          <button
            type="button"
            onClick={handlePlusButtonClick}
            aria-label="Recarregar DWcoin"
            title="Escolha um pacote de DWcoin abaixo"
            style={{
              left: '39.2%',
              top: '0.8%',
              width: '11.8%',
              height: '7.0%',
            }}
            className="absolute cursor-pointer rounded-xl transition-all hover:bg-amber-300/18 hover:ring-2 hover:ring-amber-300/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          />

          {/* 5 Clickable Official DWcoin Recharge Pack Hotspots */}
          {DWCOIN_RECHARGE_PACKS.map((pack) => {
            const isSelected = selectedPack?.id === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => {
                  onPlayTone('click');
                  openPackCheckoutModal(pack);
                }}
                aria-label={`Comprar ${pack.dwCoinAmount} DWcoin por ${pack.priceBrlLabel}${
                  pack.discountLabel ? ` (${pack.discountLabel})` : ''
                }`}
                style={{
                  left: `${pack.hotspot.leftPct}%`,
                  top: `${pack.hotspot.topPct}%`,
                  width: `${pack.hotspot.widthPct}%`,
                  height: `${pack.hotspot.heightPct}%`,
                }}
                className={`group absolute cursor-pointer rounded-[14px] transition-all duration-150 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                  isSelected
                    ? 'bg-amber-300/15 ring-2 ring-amber-300 shadow-[inset_0_0_26px_rgba(251,191,36,0.36)]'
                    : highlightPacksPulse
                      ? 'bg-cyan-300/14 ring-2 ring-amber-300/90 shadow-[inset_0_0_24px_rgba(56,232,255,0.35)]'
                      : 'hover:bg-cyan-300/10 hover:ring-2 hover:ring-amber-300/85 hover:shadow-[inset_0_0_24px_rgba(251,191,36,0.25)]'
                }`}
              >
                <span className="sr-only">
                  {pack.dwCoinAmount} DWcoin — {pack.priceBrlLabel}
                </span>
              </button>
            );
          })}

          {/* Clickable Bottom-Left '<< Voltar' Button */}
          <button
            type="button"
            onClick={handleBackFromRecharge}
            aria-label="Voltar"
            title="Voltar"
            style={{
              left: '1.2%',
              top: '89.6%',
              width: '34.4%',
              height: '8.8%',
            }}
            className="absolute cursor-pointer rounded-2xl transition-all hover:bg-cyan-300/16 hover:ring-2 hover:ring-cyan-200/90 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          />

          {/* Interactive Pack Purchase Confirmation Overlay (Select Method / Mandatory Terms / Existing Checkout) */}
          {selectedPack && rechargeStep === 'terms' && (
            <div
              onClick={handleBackFromTerms}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#010716]/86 p-2.5 backdrop-blur-[3px] sm:p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Antes de pagar, leia"
                className="animate-dmo-window flex max-h-[88dvh] w-full max-w-[440px] flex-col overflow-hidden rounded-2xl border-2 border-cyan-300/85 bg-gradient-to-b from-[#0b3d9e] via-[#061f58] to-[#030e2c] text-white shadow-[0_0_46px_rgba(0,180,255,0.48)]"
              >
                {/* Exact Top Header: [ ← ]   🛍️ COMPRAR DCOIN   [ X ] */}
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-cyan-400/40 bg-[#082d7a] px-3 py-2.5 sm:px-4">
                  <button
                    type="button"
                    disabled={isSubmittingTermsOrder}
                    onClick={handleBackFromTerms}
                    aria-label="Voltar para escolha de pagamento"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-200/60 bg-[#051d52] text-cyan-100 transition hover:bg-sky-700 active:scale-95 disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1.5 text-center">
                    <ShoppingBag className="h-4 w-4 shrink-0 text-amber-300" />
                    <h3 className="font-[family-name:var(--font-display)] text-xs font-black tracking-wide text-white sm:text-sm">
                      COMPRAR DCOIN
                    </h3>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmittingTermsOrder}
                    onClick={() => {
                      onPlayTone('click');
                      resetPackCheckoutFlow();
                    }}
                    aria-label="Fechar aviso de compra"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-200/60 bg-[#051d52] text-cyan-100 transition hover:bg-sky-700 active:scale-95 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Scrollable Body for Android / iOS / Desktop */}
                <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3 text-xs sm:p-4">
                  {/* Prominent Warning Heading + Selected Order Summary */}
                  <div className="rounded-xl border border-amber-300/65 bg-gradient-to-r from-amber-500/18 via-[#072264] to-[#041232] p-3 shadow-[0_0_16px_rgba(251,191,36,0.18)]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-300/80 bg-amber-400/20 text-amber-300">
                        <AlertTriangle className="h-4.5 w-4.5" />
                      </div>
                      <h4 className="text-sm font-black tracking-wide text-amber-200 sm:text-base">
                        ⚠️ ANTES DE PAGAR, LEIA
                      </h4>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-400/30 bg-[#041232]/90 px-2.5 py-2">
                      <div className="flex items-center gap-2">
                        <DwCoinEmblem className="h-5 w-5 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-white">
                            {selectedPack.dwCoinAmount} DWcoin
                          </p>
                          <p className="text-[10.5px] font-bold text-amber-300">
                            {selectedPack.priceBrlLabel}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10.5px] font-black ${
                          paymentMethod === 'pix'
                            ? 'border-emerald-300/75 bg-emerald-500/20 text-emerald-200'
                            : 'border-cyan-300/75 bg-cyan-500/20 text-cyan-100'
                        }`}
                      >
                        {paymentMethod === 'pix' ? (
                          <QrCode className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <CreditCard className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span>
                          {paymentMethod === 'pix'
                            ? 'Pagamento via PIX'
                            : 'Pagamento via Cartão'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* 5 Mandatory Warning Cards */}
                  <div className="space-y-2">
                    {DWCOIN_PURCHASE_TERMS_ITEMS.map((noticeText, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 rounded-xl border border-cyan-400/30 bg-[#041232]/95 px-3 py-2.5 shadow-sm"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-300/70 bg-amber-400/15 text-amber-300"
                        >
                          <AlertTriangle className="h-3 w-3" />
                        </span>
                        <p className="text-[11.5px] font-medium leading-relaxed text-sky-100 sm:text-xs">
                          {noticeText}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accessible Sticky Bottom Footer: Checkbox + Confirm CTA + ‹ Voltar */}
                <div className="shrink-0 space-y-2.5 border-t border-cyan-400/40 bg-[#041438] p-3 sm:p-4">
                  <label className="flex min-h-[44px] cursor-pointer items-start gap-2.5 rounded-xl border border-cyan-400/35 bg-[#061c52] px-3 py-2 text-[11.5px] leading-snug text-sky-100 transition hover:border-cyan-300/70">
                    <input
                      type="checkbox"
                      checked={termsChecked}
                      disabled={isSubmittingTermsOrder}
                      onChange={(e) => {
                        onPlayTone('click');
                        setTermsChecked(e.target.checked);
                      }}
                      className="mt-0.5 h-4.5 w-4.5 shrink-0 cursor-pointer accent-amber-400"
                    />
                    <span className="font-bold select-none">
                      Declaro que li e concordo com as Regras do Servidor, os Termos de Uso e os termos desta compra.
                    </span>
                  </label>

                  <button
                    type="button"
                    disabled={!termsChecked || isSubmittingTermsOrder}
                    onClick={handleConfirmTermsAndStartCheckout}
                    className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 px-4 text-xs font-black tracking-wide text-[#081226] shadow-[0_0_20px_rgba(251,191,36,0.45)] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-none disabled:bg-slate-800 disabled:text-slate-400 disabled:shadow-none"
                  >
                    <span>
                      {isSubmittingTermsOrder
                        ? 'REGISTRANDO PEDIDO...'
                        : 'CONTINUAR PARA PAGAMENTO'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittingTermsOrder}
                    onClick={handleBackFromTerms}
                    className="flex min-h-[38px] w-full items-center justify-center rounded-xl border border-cyan-400/30 bg-[#051844] px-3 text-xs font-extrabold text-cyan-200 transition hover:bg-[#082464] hover:text-white active:scale-[0.98] disabled:opacity-50"
                  >
                    ‹ Voltar
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedPack && rechargeStep !== 'terms' && (
            <div
              onClick={resetPackCheckoutFlow}
              className="absolute inset-0 z-20 flex items-center justify-center bg-[#02091d]/82 p-3 backdrop-blur-[2px]"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="animate-dmo-window w-full max-w-[340px] overflow-hidden rounded-2xl border-2 border-amber-300/85 bg-gradient-to-b from-[#0b3d9e] via-[#061f58] to-[#030e2c] text-white shadow-[0_0_38px_rgba(251,191,36,0.42)]"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-cyan-400/35 bg-[#082d7a] px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <DwCoinEmblem className="h-6 w-6 shrink-0" />
                    <div>
                      <p className="text-xs font-black tracking-wide text-white">
                        {selectedPack.dwCoinAmount} DWcoin
                      </p>
                      <p className="text-[10px] font-bold text-cyan-200/85">
                        {rechargeStep === 'checkout'
                          ? `Checkout · ${paymentMethod === 'pix' ? 'PIX' : 'Cartão'}`
                          : 'Recarga Oficial · Conta DATS'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onPlayTone('click');
                      resetPackCheckoutFlow();
                    }}
                    aria-label="Fechar confirmação"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-200/60 bg-[#051d52] text-cyan-100 hover:bg-sky-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="space-y-3 p-3.5 text-xs">
                  {/* Price Summary */}
                  <div className="flex items-center justify-between rounded-xl border border-amber-300/45 bg-[#041232] px-3 py-2.5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200/85">
                        Valor do Pacote
                      </p>
                      <div className="mt-0.5 flex items-baseline gap-2">
                        {selectedPack.originalPriceBrlLabel && (
                          <span className="text-xs font-bold text-rose-300/85 line-through">
                            {selectedPack.originalPriceBrlLabel}
                          </span>
                        )}
                        <span className="text-lg font-black tabular-nums text-amber-300">
                          {selectedPack.priceBrlLabel}
                        </span>
                      </div>
                    </div>
                    {selectedPack.discountLabel && (
                      <span className="rounded-lg border border-rose-300/75 bg-gradient-to-b from-rose-500 to-red-700 px-2 py-1 text-[10.5px] font-black text-white shadow">
                        {selectedPack.discountLabel}
                      </span>
                    )}
                  </div>

                  {rechargeStep === 'checkout' && activeCheckoutOrder ? (
                    <>
                      {/* Recorded Order & Terms Acceptance Audit Summary */}
                      <div className="space-y-1.5 rounded-xl border border-emerald-400/40 bg-[#041232] p-2.5 text-[10.5px]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-cyan-200/85">
                            Pedido registrado
                          </span>
                          <span className="font-black tabular-nums text-white">
                            #{activeCheckoutOrder.orderId.slice(-8).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-cyan-200/85">
                            Método escolhido
                          </span>
                          <span className="font-black text-emerald-300">
                            {activeCheckoutOrder.paymentMethod === 'pix'
                              ? 'PIX'
                              : 'Cartão'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-cyan-200/85">
                            Termos aceitos
                          </span>
                          <span className="font-black text-amber-200">
                            {activeCheckoutOrder.termsVersion} ·{' '}
                            {new Date(
                              activeCheckoutOrder.termsAcceptedAtIso
                            ).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Pending Payment Confirmation Banner (Zero client-side DCoin credit) */}
                      <div className="flex items-start gap-2 rounded-xl border border-amber-300/55 bg-amber-950/60 p-2.5 text-[11px] leading-snug text-amber-100">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                        <div className="space-y-1">
                          <p className="font-black text-amber-200">
                            {DWCOIN_PAYMENT_MESSAGES.pending}
                          </p>
                          {checkoutNotice && <p>{checkoutNotice}</p>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCancelActiveCheckout}
                        className="flex min-h-[40px] w-full items-center justify-center rounded-xl border border-rose-300/60 bg-rose-950/65 px-3 text-[11px] font-black text-rose-100 transition hover:bg-rose-900/75 active:scale-95"
                      >
                        Cancelar Pagamento
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Payment Method Selector — clicking PIX or Cartão opens Mandatory Warning BEFORE checkout */}
                      <div>
                        <p className="mb-1.5 text-[10.5px] font-extrabold uppercase tracking-wide text-cyan-200">
                          Escolha a Forma de Pagamento
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSelectPaymentMethod('pix')}
                            className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border text-[11px] font-black transition active:scale-95 ${
                              paymentMethod === 'pix'
                                ? 'border-emerald-300 bg-emerald-500/20 text-emerald-200'
                                : 'border-cyan-400/30 bg-[#041232] text-slate-300 hover:border-emerald-300/60 hover:text-white'
                            }`}
                          >
                            <QrCode className="h-4 w-4" />
                            <span>PIX</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPaymentMethod('card')}
                            className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border text-[11px] font-black transition active:scale-95 ${
                              paymentMethod === 'card'
                                ? 'border-cyan-300 bg-cyan-500/20 text-cyan-100'
                                : 'border-cyan-400/30 bg-[#041232] text-slate-300 hover:border-cyan-300/60 hover:text-white'
                            }`}
                          >
                            <CreditCard className="h-4 w-4" />
                            <span>Cartão</span>
                          </button>
                        </div>
                      </div>

                      {/* Status Notice (Cancelled / Error) */}
                      {checkoutNotice && (
                        <div
                          className={`flex items-start gap-2 rounded-xl border p-2.5 text-[11px] leading-snug ${
                            checkoutNoticeTone === 'error'
                              ? 'border-rose-400/55 bg-rose-950/65 text-rose-100'
                              : checkoutNoticeTone === 'cancelled'
                                ? 'border-amber-300/50 bg-amber-950/60 text-amber-100'
                                : 'border-cyan-300/50 bg-sky-950/60 text-cyan-100'
                          }`}
                        >
                          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                          <span>{checkoutNotice}</span>
                        </div>
                      )}

                      {/* Primary Action Button — routes through mandatory terms screen */}
                      <button
                        type="button"
                        onClick={() => handleSelectPaymentMethod(paymentMethod)}
                        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 px-4 text-xs font-black text-[#081226] shadow-[0_0_16px_rgba(251,191,36,0.4)] transition hover:brightness-110 active:scale-95"
                      >
                        <span>
                          Confirmar {selectedPack.dwCoinAmount} DWcoin ·{' '}
                          {selectedPack.priceBrlLabel}
                        </span>
                      </button>
                    </>
                  )}

                  {/* GM Live Test Recharge Button */}
                  {isGM && onGmTestRechargePack && (
                    <button
                      type="button"
                      onClick={() => {
                        onGmTestRechargePack(selectedPack.dwCoinAmount);
                        onPlayTone('confirm');
                        resetPackCheckoutFlow();
                      }}
                      className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-300/70 bg-cyan-500/20 px-3 text-[11px] font-black text-cyan-100 transition hover:bg-cyan-500/35 active:scale-95"
                    >
                      <Crown className="h-3.5 w-3.5 text-amber-300" />
                      <span>
                        Testar Recarga (GM · +{selectedPack.dwCoinAmount} DWcoin)
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MAIN VIEW 2: DWcoin Items Catalog */
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[82dvh] w-full max-w-[540px] flex-col overflow-hidden rounded-2xl border border-amber-300/75 bg-gradient-to-b from-[#0b3c9c] via-[#061e56] to-[#030e2c] shadow-[0_0_44px_rgba(251,191,36,0.34)]"
        >
          {/* Catalog Header */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-cyan-400/40 bg-[#082d7a] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <DwCoinEmblem className="h-7 w-7 shrink-0" />
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-sm font-black tracking-wide text-white">
                  ITENS PREMIUM (DWCOIN)
                </h2>
                <p className="text-[10.5px] font-semibold text-amber-200/90">
                  Troque seus DWcoin por itens exclusivos
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onPlayTone('click');
                setReturnTabAfterRecharge('catalog');
                setMainTab('recharge');
              }}
              title="Comprar mais DWcoin"
              className="flex items-center gap-1.5 rounded-xl border border-amber-300/70 bg-[#041336] px-2.5 py-1.5 transition hover:border-amber-200 hover:bg-[#072059] active:scale-95"
            >
              <DwCoinEmblem className="h-4.5 w-4.5 shrink-0" />
              <span className="text-xs font-black tabular-nums text-amber-200">
                {formattedBalance}
              </span>
              <span className="rounded bg-amber-400 px-1 text-[10px] font-black text-[#081226]">
                +
              </span>
            </button>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`flex shrink-0 items-center gap-2 border-b px-4 py-2 text-[11px] font-bold ${
                feedback.tone === 'ok'
                  ? 'border-emerald-400/45 bg-emerald-950/85 text-emerald-200'
                  : feedback.tone === 'error'
                    ? 'border-rose-400/45 bg-rose-950/85 text-rose-200'
                    : 'border-cyan-400/45 bg-sky-950/85 text-cyan-100'
              }`}
            >
              {feedback.tone === 'ok' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
              ) : (
                <Info className="h-4 w-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Catalog Body */}
          <div className="flex-1 space-y-3 overflow-y-auto p-3.5 text-xs text-sky-100 sm:p-4">
            {DWCOIN_SHOP_OFFERS.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {CATEGORY_TABS.map((cat) => {
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        onPlayTone('click');
                        setCategory(cat.id);
                      }}
                      className={`min-h-[34px] rounded-lg border px-2.5 text-[11px] font-extrabold transition ${
                        active
                          ? 'border-cyan-300 bg-cyan-500/25 text-white'
                          : 'border-cyan-400/25 bg-[#041232] text-slate-300 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            )}

            {visibleOffers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-cyan-400/30 bg-[#041232] px-5 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/45 bg-amber-500/15 text-amber-300">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-black text-white">
                  Nenhuma oferta nesta categoria ainda
                </p>
                <p className="mt-1 max-w-[340px] text-[11px] leading-relaxed text-slate-300">
                  Confira a aba Promoções ou selecione &quot;Todos&quot; para ver as ofertas ativas.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onPlayTone('click');
                    setMainTab('promo');
                  }}
                  className="mt-4 flex min-h-[40px] items-center gap-2 rounded-xl border border-amber-300/80 bg-gradient-to-b from-amber-400 to-amber-600 px-4 text-xs font-black text-[#081226] transition hover:brightness-110 active:scale-95"
                >
                  <Flame className="h-4 w-4 shrink-0" />
                  <span>Ir para Promoções</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {visibleOffers.map((offer) => {
                  const canAfford = dCoin >= offer.priceDwCoin;
                  const alreadyMaxed =
                    (offer.reward.kind === 'expand_inventory' &&
                      unlockedInventorySlots >= INVENTORY_TOTAL_SLOTS) ||
                    (offer.reward.kind === 'expand_archive' &&
                      unlockedArchiveSlots >= ARCHIVE_TOTAL_SLOTS);

                  return (
                    <div
                      key={offer.id}
                      className="flex flex-col justify-between gap-2.5 rounded-xl border border-cyan-400/30 bg-[#041232] p-3"
                    >
                      <div className="flex items-start gap-2.5">
                        {renderOfferIcon(offer)}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <p className="text-xs font-black leading-tight text-white">
                              {offer.name}
                            </p>
                            {offer.highlight && (
                              <span className="shrink-0 rounded border border-cyan-300/60 bg-cyan-500/20 px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-cyan-200">
                                {offer.highlight}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[10px] font-bold text-amber-300/95">
                            {offer.subtitle}
                          </p>
                          <p className="mt-1 text-[10.5px] leading-snug text-slate-300">
                            {offer.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-cyan-400/15 pt-2">
                        <div className="flex items-center gap-1">
                          <DwCoinEmblem className="h-4 w-4 shrink-0" />
                          <span className="text-xs font-black tabular-nums text-amber-200">
                            {offer.priceDwCoin.toLocaleString('pt-BR')} DWcoin
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={alreadyMaxed || !canAfford}
                          onClick={() => handlePurchaseOffer(offer)}
                          className="min-h-[38px] shrink-0 rounded-xl border border-amber-300/80 bg-gradient-to-b from-amber-400 to-amber-600 px-3.5 text-[11px] font-black text-[#081226] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-400"
                        >
                          {alreadyMaxed
                            ? 'Limite Máx.'
                            : !canAfford
                              ? 'Saldo Baixo'
                              : 'Comprar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="rounded-xl border border-cyan-400/20 bg-[#041232]/75 px-3 py-2 text-center text-[10.5px] text-slate-300">
              Itens de recuperação HP/DS e equipamentos por Bits continuam disponíveis na loja do{' '}
              <span className="font-bold text-cyan-200">MudFrigimon</span> no DATS Center.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
