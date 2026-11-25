import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Gem,
  Infinity as InfinityIcon,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  UserCheck,
  XCircle,
} from 'lucide-react';
import type {
  GmDwCoinOrderEntry,
  GmServerSnapshot,
} from '../../../services/gmControlService';
import {
  batchCheckMercadoPagoOrdersForGm,
  type MercadoPagoStatusResult,
} from '../../../services/mercadoPagoService';

const GM_INFINITE_DCOIN_CAP = 999_999_999;

interface GmEconomyTabProps {
  snapshot: GmServerSnapshot | null;
  loading: boolean;
  gmDCoin: number;
  gmInfiniteDCoin: boolean;
  onToggleGmInfiniteDCoin?: (enabled: boolean) => void;
  onGrantSelfDCoin: (amount: number) => void;
  onAdjustPlayerCurrency: (input: {
    targetUid: string;
    bitsDelta: number;
    dCoinDelta: number;
    reason: string;
  }) => Promise<void>;
  onApproveOrder: (orderId: string) => Promise<void>;
  onCancelOrder: (order: GmDwCoinOrderEntry) => Promise<void>;
  onRefreshSnapshot: () => Promise<void>;
}

function formatBrlFromCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

const TX_TYPE_LABEL: Record<string, { label: string; colorClass: string }> = {
  spend: {
    label: 'COMPRA LOJA',
    colorClass: 'border-amber-400/40 bg-amber-950/60 text-amber-200',
  },
  recharge: {
    label: 'RECARGA',
    colorClass: 'border-emerald-400/40 bg-emerald-950/60 text-emerald-200',
  },
  gm_grant: {
    label: 'CRÉDITO GM',
    colorClass: 'border-cyan-400/40 bg-cyan-950/60 text-cyan-200',
  },
  gm_deduct: {
    label: 'REMOÇÃO GM',
    colorClass: 'border-rose-400/40 bg-rose-950/60 text-rose-200',
  },
};

export function GmEconomyTab({
  snapshot,
  loading,
  gmDCoin,
  gmInfiniteDCoin,
  onToggleGmInfiniteDCoin,
  onGrantSelfDCoin,
  onAdjustPlayerCurrency,
  onApproveOrder,
  onCancelOrder,
  onRefreshSnapshot,
}: GmEconomyTabProps) {
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'approved'>(
    'all'
  );
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [mpCheckingAll, setMpCheckingAll] = useState(false);
  const [mpCreditingAll, setMpCreditingAll] = useState(false);
  const [mpNotice, setMpNotice] = useState<string | null>(null);
  const [mpAutoCreditMissing, setMpAutoCreditMissing] = useState(false);
  const [mpStatuses, setMpStatuses] = useState<
    Record<string, MercadoPagoStatusResult>
  >({});

  // GM Own Account custom DL Din generator
  const [selfCustomAmount, setSelfCustomAmount] = useState('10000');

  // Direct Player DL Din Support Tool
  const [playerSearch, setPlayerSearch] = useState('');
  const [selectedTargetUid, setSelectedTargetUid] = useState<string | null>(null);
  const [playerCustomAmount, setPlayerCustomAmount] = useState('10');
  const [playerCreditReason, setPlayerCreditReason] = useState(
    'Compensação recarga DL Din'
  );
  const [playerBusy, setPlayerBusy] = useState(false);

  const orders = snapshot?.orders ?? [];
  const players = snapshot?.players ?? [];
  const transactions = snapshot?.transactions ?? [];
  const analytics = snapshot?.spendAnalytics;
  const metrics = snapshot?.metrics;

  const filteredPlayersForCredit = useMemo(() => {
    const q = playerSearch.trim().toLowerCase();
    const list = q
      ? players.filter(
          (p) =>
            p.tamerName.toLowerCase().includes(q) ||
            p.username.toLowerCase().includes(q) ||
            p.uid.toLowerCase().includes(q)
        )
      : players;
    return list.slice(0, 8);
  }, [players, playerSearch]);

  const selectedTargetPlayer = useMemo(
    () => players.find((p) => p.uid === selectedTargetUid) ?? null,
    [players, selectedTargetUid]
  );

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'pending'),
    [orders]
  );

  const mpApprovedPendingOrders = useMemo(
    () =>
      pendingOrders.filter(
        (o) =>
          mpStatuses[o.orderId]?.approved === true &&
          !mpStatuses[o.orderId]?.credited &&
          !mpStatuses[o.orderId]?.alreadyCredited
      ),
    [pendingOrders, mpStatuses]
  );

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  const maxItemSpend = Math.max(
    1,
    analytics?.topItems[0]?.totalDwCoin ?? 1
  );

  const handleGenerateSelfCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number.parseInt(selfCustomAmount, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onGrantSelfDCoin(Math.min(GM_INFINITE_DCOIN_CAP, parsed));
  };

  const handleDirectPlayerDCoin = async (delta: number, customReason?: string) => {
    if (!selectedTargetPlayer || delta === 0 || playerBusy) return;
    setPlayerBusy(true);
    try {
      await onAdjustPlayerCurrency({
        targetUid: selectedTargetPlayer.uid,
        bitsDelta: 0,
        dCoinDelta: delta,
        reason:
          customReason ||
          playerCreditReason.trim() ||
          (delta > 0 ? 'Crédito manual GM' : 'Remoção manual GM'),
      });
    } finally {
      setPlayerBusy(false);
    }
  };

  const handleCheckMercadoPagoPending = async () => {
    if (pendingOrders.length === 0) {
      setMpNotice('Não há pedidos pendentes para consultar no Mercado Pago.');
      return;
    }
    setMpCheckingAll(true);
    setMpNotice(null);
    try {
      const res = await batchCheckMercadoPagoOrdersForGm(
        pendingOrders.map((o) => o.orderId)
      );
      if (!res.ok) {
        setMpNotice(res.error ?? 'Falha ao consultar Mercado Pago.');
        return;
      }
      setMpStatuses(res.results);
      setMpAutoCreditMissing(!res.autoCreditConfigured);
      const values = Object.values(res.results);
      const autoCreditedCount = values.filter((r) => r.credited).length;
      const awaitingManualCount = values.filter(
        (r) => r.approved && !r.credited && !r.alreadyCredited
      ).length;

      if (autoCreditedCount > 0) {
        await onRefreshSnapshot();
      }

      if (autoCreditedCount > 0 && awaitingManualCount === 0) {
        setMpNotice(
          `${autoCreditedCount} pedido(s) confirmado(s) no Mercado Pago e creditado(s) AUTOMATICAMENTE nas contas dos jogadores!`
        );
      } else if (awaitingManualCount > 0) {
        const firstErr = values.find(
          (r) => r.approved && !r.credited && !r.alreadyCredited && r.creditErrorCode
        )?.creditErrorCode;
        setMpNotice(
          `${awaitingManualCount} pedido(s) confirmado(s) como PAGO no Mercado Pago! Clique em "Creditar ${awaitingManualCount} Pago(s) no MP" abaixo para entregar agora.${firstErr ? ` (Diagnóstico: ${firstErr})` : ''}`
        );
      } else {
        setMpNotice(
          'Nenhum pedido pendente consta como pago no Mercado Pago ainda.'
        );
      }
    } finally {
      setMpCheckingAll(false);
    }
  };

  const handleCreditAllMpApproved = async () => {
    if (mpApprovedPendingOrders.length === 0) return;
    setMpCreditingAll(true);
    setMpNotice(null);
    let credited = 0;
    try {
      for (const ord of mpApprovedPendingOrders) {
        setBusyOrderId(ord.orderId);
        await onApproveOrder(ord.orderId);
        credited += 1;
      }
      setMpNotice(
        `${credited} recarga(s) confirmada(s) no Mercado Pago creditada(s) com sucesso!`
      );
    } finally {
      setBusyOrderId(null);
      setMpCreditingAll(false);
    }
  };

  const handleApprove = async (orderId: string) => {
    setBusyOrderId(orderId);
    try {
      await onApproveOrder(orderId);
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleCancel = async (order: GmDwCoinOrderEntry) => {
    setBusyOrderId(order.orderId);
    try {
      await onCancelOrder(order);
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* GM Quick DL-DIN Tools: Infinite Self Generator + Direct Player Credit */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Card 1: GM Own Account Infinite DL Din */}
        <div className="rounded-xl border border-amber-300/60 bg-gradient-to-b from-[#0b2764] to-[#041232] p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-amber-200">
                <InfinityIcon className="h-4 w-4 text-amber-300" />
                <span>DL Din Infinito · Sua Conta GM</span>
              </p>
              <p className="mt-0.5 text-[10px] text-cyan-200/85">
                Saldo atual:{' '}
                <strong className="tabular-nums text-white">
                  {gmDCoin.toLocaleString('pt-BR')} DL Din
                </strong>
              </p>
            </div>

            {onToggleGmInfiniteDCoin && (
              <button
                type="button"
                onClick={() => onToggleGmInfiniteDCoin(!gmInfiniteDCoin)}
                className={`flex min-h-[34px] items-center gap-1.5 rounded-lg border px-2.5 text-[10.5px] font-black transition active:scale-95 ${
                  gmInfiniteDCoin
                    ? 'border-emerald-300 bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.45)]'
                    : 'border-amber-300/70 bg-amber-500/20 text-amber-100 hover:bg-amber-500/35'
                }`}
              >
                <InfinityIcon className="h-3.5 w-3.5" />
                <span>{gmInfiniteDCoin ? 'Infinito: ATIVO' : 'Ativar Infinito'}</span>
              </button>
            )}
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {[
              { label: '+1.000', amount: 1_000 },
              { label: '+10.000', amount: 10_000 },
              { label: '+100.000', amount: 100_000 },
              { label: '+1.000.000', amount: 1_000_000 },
              { label: '∞ Máximo (999M)', amount: GM_INFINITE_DCOIN_CAP },
            ].map((btn) => (
              <button
                key={btn.label}
                type="button"
                onClick={() => onGrantSelfDCoin(btn.amount)}
                className={`min-h-[34px] rounded-lg border px-2 text-[10.5px] font-black transition active:scale-95 ${
                  btn.amount === GM_INFINITE_DCOIN_CAP
                    ? 'col-span-2 border-amber-300 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:brightness-110 sm:col-span-2'
                    : 'border-cyan-300/50 bg-[#082c74] text-white hover:bg-sky-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleGenerateSelfCustom} className="mt-2 flex gap-1.5">
            <input
              type="number"
              min={1}
              max={GM_INFINITE_DCOIN_CAP}
              value={selfCustomAmount}
              onChange={(e) => setSelfCustomAmount(e.target.value)}
              placeholder="Quantidade personalizada"
              className="h-9 flex-1 rounded-lg border border-cyan-400/40 bg-[#020b22] px-2.5 text-xs font-bold tabular-nums text-white outline-none focus:border-amber-300"
            />
            <button
              type="submit"
              className="flex h-9 items-center gap-1 rounded-lg border border-amber-300/75 bg-amber-500 px-3 text-[11px] font-black text-slate-950 hover:brightness-110 active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Gerar</span>
            </button>
          </form>
        </div>

        {/* Card 2: Add / Remove DL Din on ANY Player Account */}
        <div className="rounded-xl border border-cyan-300/55 bg-gradient-to-b from-[#08225a] to-[#041232] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-cyan-200">
              <UserCheck className="h-4 w-4 text-emerald-300" />
              <span>Adicionar DL Din na Conta de um Jogador</span>
            </span>
            <span className="text-[10px] font-bold text-slate-300">
              {players.length} contas
            </span>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cyan-300/70" />
            <input
              type="text"
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              placeholder="Buscar jogador por Nome, @usuário ou UID..."
              className="h-9 w-full rounded-lg border border-cyan-400/40 bg-[#020b22] pl-8 pr-2.5 text-xs text-white outline-none focus:border-amber-300"
            />
          </div>

          {/* Clickable Player Selector List */}
          <div className="mt-2 max-h-[112px] space-y-1 overflow-y-auto pr-0.5">
            {filteredPlayersForCredit.length === 0 ? (
              <p className="py-2 text-center text-[10.5px] text-slate-400">
                Nenhum jogador encontrado.
              </p>
            ) : (
              filteredPlayersForCredit.map((p) => {
                const isSelected = p.uid === selectedTargetUid;
                return (
                  <button
                    key={p.uid}
                    type="button"
                    onClick={() => setSelectedTargetUid(p.uid)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition ${
                      isSelected
                        ? 'border-amber-300 bg-amber-500/20 text-white'
                        : 'border-white/10 bg-[#061844] text-slate-200 hover:border-cyan-300/50'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-black text-white">{p.tamerName}</span>{' '}
                      <span className="text-[10px] text-cyan-300">@{p.username}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="font-black tabular-nums text-cyan-300">
                        {p.dCoin.toLocaleString('pt-BR')} DL
                      </span>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          p.online ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {selectedTargetPlayer ? (
            <div className="mt-2 space-y-2 rounded-lg border border-emerald-400/35 bg-[#03102d] p-2.5">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate font-black text-emerald-200">
                  Selecionado: {selectedTargetPlayer.tamerName} (@{selectedTargetPlayer.username})
                </span>
                <span className="shrink-0 font-black tabular-nums text-amber-300">
                  {selectedTargetPlayer.dCoin.toLocaleString('pt-BR')} DL Din
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
                {[10, 30, 60, 100, 200, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={playerBusy}
                    onClick={() =>
                      void handleDirectPlayerDCoin(
                        amt,
                        `Crédito rápido +${amt} DL Din`
                      )
                    }
                    className="min-h-[30px] rounded-md border border-emerald-400/60 bg-emerald-800/70 px-1.5 text-[10px] font-black text-white hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                  >
                    +{amt}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={100_000_000}
                  value={playerCustomAmount}
                  onChange={(e) => setPlayerCustomAmount(e.target.value)}
                  className="h-8 w-24 rounded-lg border border-cyan-400/40 bg-[#020b22] px-2 text-xs font-bold tabular-nums text-white outline-none focus:border-amber-300"
                />
                <input
                  type="text"
                  maxLength={64}
                  value={playerCreditReason}
                  onChange={(e) => setPlayerCreditReason(e.target.value)}
                  placeholder="Motivo (ex: PIX 10 DL Din)"
                  className="h-8 min-w-[120px] flex-1 rounded-lg border border-cyan-400/40 bg-[#020b22] px-2 text-[11px] text-white outline-none focus:border-amber-300"
                />
                <button
                  type="button"
                  disabled={playerBusy}
                  onClick={() => {
                    const amt = Math.abs(Number.parseInt(playerCustomAmount, 10) || 0);
                    if (amt > 0) void handleDirectPlayerDCoin(amt);
                  }}
                  className="flex h-8 items-center gap-1 rounded-lg border border-emerald-300/80 bg-emerald-600 px-2.5 text-[10.5px] font-black text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Adicionar</span>
                </button>
                <button
                  type="button"
                  disabled={playerBusy}
                  onClick={() => {
                    const amt = Math.abs(Number.parseInt(playerCustomAmount, 10) || 0);
                    if (amt > 0) void handleDirectPlayerDCoin(-amt);
                  }}
                  className="flex h-8 items-center gap-1 rounded-lg border border-rose-400/60 bg-rose-900/75 px-2 text-[10.5px] font-black text-rose-100 hover:bg-rose-800 disabled:opacity-50"
                >
                  <MinusCircle className="h-3.5 w-3.5" />
                  <span>Remover</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[10.5px] text-cyan-200/75">
              Clique em um jogador acima para adicionar ou remover DL Din na conta dele na hora.
            </p>
          )}
        </div>
      </div>

      {mpAutoCreditMissing && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300/70 bg-amber-950/75 px-3 py-2.5 text-[11px] font-bold text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <span>
            Entrega automática no servidor aguardando a variável{' '}
            <code className="rounded bg-black/40 px-1 text-amber-200">
              FIREBASE_SERVICE_ACCOUNT_JSON
            </code>{' '}
            na Vercel. Enquanto isso, você pode creditar os pedidos pagos em 1 clique abaixo.
          </span>
        </div>
      )}

      {/* Economy KPIs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-emerald-400/30 bg-[#041232] p-2.5">
          <p className="text-[10px] font-bold text-slate-300">
            Recargas Aprovadas
          </p>
          <p className="mt-1 text-base font-black tabular-nums text-emerald-300">
            {formatBrlFromCents(metrics?.approvedOrdersBrlCents ?? 0)}
          </p>
          <p className="text-[10px] font-semibold tabular-nums text-slate-400">
            {metrics?.approvedDwCoinSold ?? 0} DL Din ({metrics?.approvedOrdersCount ?? 0} pedidos)
          </p>
        </div>

        <div className="rounded-xl border border-amber-400/30 bg-[#041232] p-2.5">
          <p className="text-[10px] font-bold text-slate-300">
            Pedidos Pendentes
          </p>
          <p className="mt-1 text-base font-black tabular-nums text-amber-300">
            {formatBrlFromCents(metrics?.pendingOrdersBrlCents ?? 0)}
          </p>
          <p className="text-[10px] font-semibold tabular-nums text-slate-400">
            {metrics?.pendingOrdersCount ?? 0} aguardando ação
          </p>
        </div>

        <div className="rounded-xl border border-cyan-400/30 bg-[#041232] p-2.5">
          <p className="text-[10px] font-bold text-slate-300">
            DL Din Gasto na Loja
          </p>
          <p className="mt-1 text-base font-black tabular-nums text-cyan-300">
            {(analytics?.totalSpent ?? 0).toLocaleString('pt-BR')} DL Din
          </p>
          <p className="text-[10px] font-semibold tabular-nums text-slate-400">
            {analytics?.spendCount ?? 0} compras registradas
          </p>
        </div>

        <div className="rounded-xl border border-sky-400/25 bg-[#041232] p-2.5">
          <p className="text-[10px] font-bold text-slate-300">
            Créditos GM / Ajustes
          </p>
          <p className="mt-1 text-base font-black tabular-nums text-white">
            +{(analytics?.totalGmGranted ?? 0).toLocaleString('pt-BR')}
          </p>
          <p className="text-[10px] font-semibold tabular-nums text-slate-400">
            Deduções: -{(analytics?.totalGmDeducted ?? 0).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Top Spent Items & Categories Breakdown */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-cyan-400/25 bg-[#041232] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-200">
              <TrendingUp className="h-4 w-4 text-amber-300" />
              <span>No que os Players Mais Gastam DL Din</span>
            </span>
            <span className="text-[10px] text-slate-400">Ranking</span>
          </div>

          {!analytics || analytics.topItems.length === 0 ? (
            <p className="py-5 text-center text-xs text-slate-400">
              Nenhuma compra com DL Din registrada na loja ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {analytics.topItems.slice(0, 8).map((item) => {
                const pct = Math.max(
                  6,
                  Math.round((item.totalDwCoin / maxItemSpend) * 100)
                );
                return (
                  <div key={item.itemKey} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="truncate font-bold text-white">
                        {item.itemName}
                      </span>
                      <span className="shrink-0 font-black tabular-nums text-cyan-300">
                        {item.totalDwCoin.toLocaleString('pt-BR')} DL Din ·{' '}
                        {item.purchases}×
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#020b22]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Totals */}
        <div className="rounded-xl border border-cyan-400/25 bg-[#041232] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
              <ShoppingBag className="h-4 w-4 text-cyan-300" />
              <span>Gasto por Categoria da Loja</span>
            </span>
          </div>

          {!analytics || analytics.byCategory.length === 0 ? (
            <p className="py-5 text-center text-xs text-slate-400">
              As categorias aparecem automaticamente após compras na Loja DL Din.
            </p>
          ) : (
            <div className="space-y-1.5">
              {analytics.byCategory.map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-[#061844] px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-black uppercase text-white">
                      {cat.category}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {cat.purchases} compras realizadas
                    </p>
                  </div>
                  <span className="font-black tabular-nums text-amber-300">
                    {cat.totalDwCoin.toLocaleString('pt-BR')} DL Din
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recharge Orders Table (/dwCoinOrders) */}
      <div className="rounded-xl border border-cyan-400/25 bg-[#041232] p-3">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
            <CreditCard className="h-4 w-4 text-emerald-300" />
            <span>Pedidos de Recarga de DL Din ({orders.length})</span>
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={mpCheckingAll || mpCreditingAll}
              onClick={() => void handleCheckMercadoPagoPending()}
              className="flex min-h-[32px] items-center gap-1 rounded-lg border border-sky-400/60 bg-sky-900/70 px-2.5 text-[10.5px] font-black text-sky-100 hover:bg-sky-800 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${mpCheckingAll ? 'animate-spin' : ''}`}
              />
              <span>
                {mpCheckingAll ? 'Consultando MP...' : 'Verificar Mercado Pago'}
              </span>
            </button>

            {mpApprovedPendingOrders.length > 0 && (
              <button
                type="button"
                disabled={mpCreditingAll}
                onClick={() => void handleCreditAllMpApproved()}
                className="flex min-h-[32px] items-center gap-1 rounded-lg border border-emerald-300/80 bg-emerald-600 px-2.5 text-[10.5px] font-black text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>
                  {mpCreditingAll
                    ? 'Creditando...'
                    : `Creditar ${mpApprovedPendingOrders.length} Pago(s) no MP`}
                </span>
              </button>
            )}

            <div className="flex gap-1">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  {
                    id: 'pending',
                    label: `Pendentes (${metrics?.pendingOrdersCount ?? 0})`,
                  },
                  { id: 'approved', label: 'Aprovados' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOrderFilter(f.id)}
                  className={`min-h-[32px] rounded-lg border px-2.5 text-[10.5px] font-black ${
                    orderFilter === f.id
                      ? 'border-amber-300 bg-amber-500/20 text-amber-100'
                      : 'border-white/15 bg-[#061844] text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {mpNotice && (
          <div className="mb-2.5 rounded-lg border border-cyan-400/40 bg-sky-950/70 px-3 py-2 text-[11px] font-bold text-cyan-100">
            {mpNotice}
          </div>
        )}

        {loading && orders.length === 0 ? (
          <p className="py-5 text-center text-xs text-slate-300">
            Carregando pedidos de recarga...
          </p>
        ) : filteredOrders.length === 0 ? (
          <p className="py-5 text-center text-xs text-slate-400">
            Nenhum pedido de recarga encontrado nesta visão.
          </p>
        ) : (
          <div className="space-y-1.5">
            {filteredOrders.map((ord) => {
              const busy = busyOrderId === ord.orderId;
              const mpInfo = mpStatuses[ord.orderId];
              return (
                <div
                  key={ord.orderId}
                  className="flex flex-col justify-between gap-2 rounded-lg border border-white/10 bg-[#061844] p-2.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-black text-white">
                        {ord.tamerName}
                      </span>
                      <span className="text-[10.5px] text-cyan-300">
                        @{ord.username}
                      </span>
                      <span
                        className={`rounded border px-1.5 py-[1px] text-[9px] font-black uppercase ${
                          ord.status === 'approved'
                            ? 'border-emerald-400/50 bg-emerald-950/70 text-emerald-200'
                            : ord.status === 'pending'
                              ? 'border-amber-400/50 bg-amber-950/70 text-amber-200'
                              : 'border-slate-500/50 bg-slate-900 text-slate-300'
                        }`}
                      >
                        {ord.status === 'approved'
                          ? 'APROVADO'
                          : ord.status === 'pending'
                            ? 'PENDENTE'
                            : ord.status.toUpperCase()}
                      </span>
                      {mpInfo?.approved && (
                        <span className="rounded border border-emerald-300/80 bg-emerald-600/35 px-1.5 py-[1px] text-[9px] font-black uppercase text-emerald-200">
                          PAGO NO MP #{mpInfo.mpPaymentId}
                        </span>
                      )}
                      {mpInfo && !mpInfo.approved && mpInfo.found && (
                        <span className="rounded border border-sky-400/50 bg-sky-950/70 px-1.5 py-[1px] text-[9px] font-black uppercase text-sky-200">
                          MP: {mpInfo.mpStatus}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[10.5px] tabular-nums text-slate-300">
                      <strong className="text-cyan-200">
                        +{ord.dwCoinAmount} DL Din
                      </strong>{' '}
                      · {ord.priceBrlLabel} · {ord.paymentMethod.toUpperCase()} ·{' '}
                      {formatDateTime(ord.createdAtMs)}
                    </p>
                  </div>

                  {ord.status === 'pending' && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleApprove(ord.orderId)}
                        className="flex min-h-[34px] items-center gap-1 rounded-lg border border-emerald-400/70 bg-emerald-700 px-2.5 text-[10.5px] font-black text-white hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Aprovar & Creditar</span>
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void handleCancel(ord)}
                        className="flex min-h-[34px] items-center gap-1 rounded-lg border border-rose-400/55 bg-rose-950/70 px-2.5 text-[10.5px] font-bold text-rose-200 hover:bg-rose-900 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-Time DWcoin Transactions Feed (/dwCoinTransactions) */}
      <div className="rounded-xl border border-cyan-400/25 bg-[#041232] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
            <Clock className="h-4 w-4 text-cyan-300" />
            <span>Histórico Detalhado de Gastos & Créditos ({transactions.length})</span>
          </span>
        </div>

        {transactions.length === 0 ? (
          <p className="py-5 text-center text-xs text-slate-400">
            Nenhuma movimentação registrada no ledger ainda.
          </p>
        ) : (
          <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
            {transactions.map((tx) => {
              const badge = TX_TYPE_LABEL[tx.type] ?? TX_TYPE_LABEL.spend;
              const isDebit = tx.type === 'spend' || tx.type === 'gm_deduct';
              return (
                <div
                  key={tx.txId}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-[#061844] px-2.5 py-2 text-[11px]"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded border px-1.5 py-[1px] text-[9px] font-black ${badge.colorClass}`}
                      >
                        {badge.label}
                      </span>
                      <span className="truncate font-bold text-white">
                        {tx.tamerName || tx.username}
                      </span>
                      <span className="truncate text-cyan-200">
                        · {tx.itemName}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {formatDateTime(tx.createdAtMs)} · Saldo após:{' '}
                      <span className="tabular-nums text-slate-200">
                        {tx.balanceAfter.toLocaleString('pt-BR')} DL Din
                      </span>
                    </p>
                  </div>

                  <span
                    className={`shrink-0 font-black tabular-nums ${
                      isDebit ? 'text-amber-300' : 'text-emerald-300'
                    }`}
                  >
                    {isDebit ? '-' : '+'}
                    {tx.dwCoinAmount.toLocaleString('pt-BR')}{' '}
                    <Gem className="inline h-3 w-3" />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
