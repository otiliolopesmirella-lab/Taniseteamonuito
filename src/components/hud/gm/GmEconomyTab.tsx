import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Gem,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
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

interface GmEconomyTabProps {
  snapshot: GmServerSnapshot | null;
  loading: boolean;
  onApproveOrder: (orderId: string) => Promise<void>;
  onCancelOrder: (order: GmDwCoinOrderEntry) => Promise<void>;
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
  onApproveOrder,
  onCancelOrder,
}: GmEconomyTabProps) {
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'approved'>(
    'all'
  );
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [mpCheckingAll, setMpCheckingAll] = useState(false);
  const [mpCreditingAll, setMpCreditingAll] = useState(false);
  const [mpNotice, setMpNotice] = useState<string | null>(null);
  const [mpStatuses, setMpStatuses] = useState<
    Record<string, MercadoPagoStatusResult>
  >({});

  const orders = snapshot?.orders ?? [];
  const transactions = snapshot?.transactions ?? [];
  const analytics = snapshot?.spendAnalytics;
  const metrics = snapshot?.metrics;

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'pending'),
    [orders]
  );

  const mpApprovedPendingOrders = useMemo(
    () => pendingOrders.filter((o) => mpStatuses[o.orderId]?.approved === true),
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
      const approvedCount = Object.values(res.results).filter(
        (r) => r.approved
      ).length;
      setMpNotice(
        approvedCount > 0
          ? `${approvedCount} pedido(s) confirmado(s) como PAGO no Mercado Pago!`
          : 'Nenhum pedido pendente consta como pago no Mercado Pago ainda.'
      );
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
