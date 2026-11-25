import { useEffect, useState } from 'react';
import {
  Activity,
  Ban,
  Coins,
  Crown,
  Gem,
  Megaphone,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';
import type { GmServerSnapshot } from '../../../services/gmControlService';
import {
  ALLOWED_SERVER_EXP_RATES,
  type ServerAnnouncementSeverity,
  type ServerExpRatePct,
} from '../../../services/serverConfigService';
import { formatDigitalCurrency } from '../../../utils/currency';

interface GmOverviewTabProps {
  snapshot: GmServerSnapshot | null;
  loading: boolean;
  serverExpRatePct: ServerExpRatePct;
  onSetServerExpRate?: (rate: ServerExpRatePct) => void;
  onPublishAnnouncement: (input: {
    title: string;
    message: string;
    severity: ServerAnnouncementSeverity;
    maintenanceMode: boolean;
    active: boolean;
  }) => Promise<void>;
  onForceRespawnBoss: () => Promise<void>;
  onRefresh: () => void;
}

function formatBrlFromCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function GmOverviewTab({
  snapshot,
  loading,
  serverExpRatePct,
  onSetServerExpRate,
  onPublishAnnouncement,
  onForceRespawnBoss,
  onRefresh,
}: GmOverviewTabProps) {
  const existingAnn = snapshot?.serverAnnouncement;
  const [annTitle, setAnnTitle] = useState(
    existingAnn?.title ?? 'Aviso do Servidor'
  );
  const [annMessage, setAnnMessage] = useState(existingAnn?.message ?? '');
  const [annSeverity, setAnnSeverity] = useState<ServerAnnouncementSeverity>(
    existingAnn?.severity ?? 'info'
  );
  const [annMaintenance, setAnnMaintenance] = useState(
    existingAnn?.maintenanceMode ?? false
  );
  const [busyAnn, setBusyAnn] = useState(false);
  const [busyBoss, setBusyBoss] = useState(false);

  useEffect(() => {
    if (!existingAnn) return;
    setAnnTitle(existingAnn.title);
    setAnnMessage(existingAnn.message);
    setAnnSeverity(existingAnn.severity);
    setAnnMaintenance(existingAnn.maintenanceMode);
  }, [
    existingAnn?.announcementId,
    existingAnn?.title,
    existingAnn?.message,
    existingAnn?.severity,
    existingAnn?.maintenanceMode,
  ]);

  const m = snapshot?.metrics;
  const boss = snapshot?.worldBoss;

  const handleSubmitAnnouncement = async (
    e: React.FormEvent,
    active: boolean
  ) => {
    e.preventDefault();
    setBusyAnn(true);
    try {
      await onPublishAnnouncement({
        title: annTitle,
        message: annMessage || 'Comunicado oficial da equipe GM.',
        severity: annSeverity,
        maintenanceMode: annMaintenance,
        active,
      });
    } finally {
      setBusyAnn(false);
    }
  };

  const handleRespawnBoss = async () => {
    setBusyBoss(true);
    try {
      await onForceRespawnBoss();
    } finally {
      setBusyBoss(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-emerald-400/30 bg-[#041232] p-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
            <span>Online Agora</span>
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <p className="mt-1 text-lg font-black tabular-nums text-emerald-300">
            {loading && !m ? '—' : m?.onlinePlayers ?? 0}
          </p>
          <p className="text-[10px] font-semibold tabular-nums text-slate-400">
            Offline: {m?.offlinePlayers ?? 0}
          </p>
        </div>

        <div className="rounded-xl border border-cyan-400/25 bg-[#041232] p-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
            <span>Contas Totais</span>
            <Users className="h-3.5 w-3.5 text-cyan-300" />
          </div>
          <p className="mt-1 text-lg font-black tabular-nums text-white">
            {loading && !m ? '—' : m?.totalPlayers ?? 0}
          </p>
          <p className="text-[10px] font-semibold tabular-nums text-slate-400">
            Kills: {(m?.totalKills ?? 0).toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="rounded-xl border border-amber-400/25 bg-[#041232] p-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
            <span>Bits Circulação</span>
            <Coins className="h-3.5 w-3.5 text-amber-300" />
          </div>
          <p className="mt-1 truncate text-base font-black tabular-nums text-amber-300">
            {loading && !m ? '—' : formatDigitalCurrency(m?.totalBits ?? 0)}
          </p>
          <p className="text-[10px] font-semibold text-slate-400">
            Soma dos Tamers
          </p>
        </div>

        <div className="rounded-xl border border-sky-400/25 bg-[#041232] p-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
            <span>DWcoin em Contas</span>
            <Gem className="h-3.5 w-3.5 text-cyan-300" />
          </div>
          <p className="mt-1 text-lg font-black tabular-nums text-cyan-300">
            {loading && !m ? '—' : (m?.totalDwCoin ?? 0).toLocaleString('pt-BR')}
          </p>
          <p className="text-[10px] font-semibold tabular-nums text-slate-400">
            Gasto Loja: {(m?.totalDwCoinSpent ?? 0).toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-400/25 bg-[#041232] p-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
            <span>Recargas R$</span>
            <Gem className="h-3.5 w-3.5 text-emerald-300" />
          </div>
          <p className="mt-1 text-base font-black tabular-nums text-emerald-200">
            {loading && !m
              ? '—'
              : formatBrlFromCents(m?.approvedOrdersBrlCents ?? 0)}
          </p>
          <p className="text-[10px] font-semibold tabular-nums text-amber-200">
            Pendentes: {m?.pendingOrdersCount ?? 0}
          </p>
        </div>

        <div className="rounded-xl border border-rose-400/25 bg-[#041232] p-2.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
            <span>Contas Banidas</span>
            <Ban className="h-3.5 w-3.5 text-rose-400" />
          </div>
          <p className="mt-1 text-lg font-black tabular-nums text-rose-300">
            {loading && !m ? '—' : m?.bannedPlayers ?? 0}
          </p>
          <p className="text-[10px] font-semibold tabular-nums text-slate-400">
            Relatos: {snapshot?.feedbacks.length ?? 0}
          </p>
        </div>
      </div>

      {/* EXP Rate + World Boss Grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Global Server EXP Rate */}
        {onSetServerExpRate && (
          <div className="rounded-xl border border-cyan-400/25 bg-[#041232] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-200">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Taxa de EXP Global</span>
              </span>
              <span className="text-xs font-black tabular-nums text-cyan-200">
                Ativo: {serverExpRatePct}%
              </span>
            </div>
            <p className="mb-2.5 text-[10.5px] text-slate-300">
              Sincroniza em tempo real para todos os jogadores online nos mapas de caça.
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {ALLOWED_SERVER_EXP_RATES.map((rate) => {
                const active = serverExpRatePct === rate;
                return (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => onSetServerExpRate(rate)}
                    className={`flex min-h-[42px] flex-col items-center justify-center rounded-xl border px-1.5 text-[11px] font-black transition active:scale-95 ${
                      active
                        ? 'border-amber-300 bg-amber-400/20 text-amber-100'
                        : 'border-cyan-400/30 bg-[#061844] text-cyan-100 hover:border-cyan-300'
                    }`}
                  >
                    <span className="tabular-nums">{rate}%</span>
                    <span className="text-[8.5px] font-bold opacity-80">
                      {rate === 100 ? 'Normal' : `+${rate - 100}%`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* World Boss Raid Status & GM Respawn */}
        <div className="rounded-xl border border-cyan-400/25 bg-[#041232] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
              <Crown className="h-4 w-4 text-amber-300" />
              <span>Boss Raid · Kuwagamon (Floresta)</span>
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-black ${
                boss?.alive
                  ? 'border-emerald-400/50 bg-emerald-950/60 text-emerald-200'
                  : 'border-rose-400/50 bg-rose-950/60 text-rose-200'
              }`}
            >
              {boss ? (boss.alive ? 'VIVO' : 'DERROTADO') : 'NÃO INICIALIZADO'}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-[#061844] p-2 text-[10.5px] tabular-nums">
            <div>
              <p className="text-slate-400">HP Atual</p>
              <p className="font-black text-white">
                {boss
                  ? `${boss.hp.toLocaleString('pt-BR')}/${boss.maxHp.toLocaleString('pt-BR')}`
                  : '18.000/18.000'}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Derrotado</p>
              <p className="font-black text-amber-200">
                {boss?.defeatedCount ?? 0}×
              </p>
            </div>
            <div>
              <p className="text-slate-400">Último Hit</p>
              <p className="truncate font-bold text-cyan-200">
                {boss?.lastAttackerName || '—'}
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              disabled={busyBoss}
              onClick={() => void handleRespawnBoss()}
              className="flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-300/70 bg-amber-500/20 px-3 text-[11px] font-black text-amber-100 hover:bg-amber-500/30 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${busyBoss ? 'animate-spin' : ''}`}
              />
              <span>Reviver Kuwagamon Agora</span>
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="flex min-h-[38px] items-center justify-center gap-1 rounded-xl border border-cyan-400/40 bg-[#061844] px-3 text-[11px] font-bold text-cyan-100 hover:bg-[#0b2a6b]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Server Broadcast / Maintenance Banner Publisher */}
      <form
        onSubmit={(e) => void handleSubmitAnnouncement(e, true)}
        className="rounded-xl border border-cyan-400/25 bg-[#041232] p-3"
      >
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
            <Megaphone className="h-4 w-4 text-amber-300" />
            <span>Aviso Global & Manutenção em Tempo Real</span>
          </span>
          {existingAnn?.active ? (
            <span className="rounded-md border border-amber-300/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-black text-amber-200">
              Banner Ativo no Servidor
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-slate-400">
              Nenhum banner ativo
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            type="text"
            maxLength={48}
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
            placeholder="Título do comunicado"
            className="h-10 rounded-lg border border-cyan-400/35 bg-[#020b22] px-3 text-xs font-bold text-white outline-none focus:border-amber-300 sm:col-span-2"
          />
          <select
            value={annSeverity}
            onChange={(e) =>
              setAnnSeverity(e.target.value as ServerAnnouncementSeverity)
            }
            className="h-10 rounded-lg border border-cyan-400/35 bg-[#020b22] px-2.5 text-xs font-bold text-cyan-100 outline-none focus:border-amber-300"
          >
            <option value="info">Informativo</option>
            <option value="event">Evento / Bônus</option>
            <option value="warning">Alerta</option>
            <option value="maintenance">Manutenção</option>
          </select>
        </div>

        <textarea
          rows={2}
          maxLength={240}
          value={annMessage}
          onChange={(e) => setAnnMessage(e.target.value)}
          placeholder="Mensagem exibida no topo da tela e no chat de todos os jogadores..."
          className="mt-2 w-full rounded-lg border border-cyan-400/35 bg-[#020b22] px-3 py-2 text-xs text-white outline-none focus:border-amber-300"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-[11px] font-bold text-slate-200">
            <input
              type="checkbox"
              checked={annMaintenance}
              onChange={(e) => setAnnMaintenance(e.target.checked)}
              className="h-4 w-4 accent-amber-400"
            />
            <ShieldAlert className="h-3.5 w-3.5 text-amber-300" />
            <span>Marcar como Manutenção Programada</span>
          </label>

          <div className="flex items-center gap-2">
            {existingAnn?.active && (
              <button
                type="button"
                disabled={busyAnn}
                onClick={(e) => void handleSubmitAnnouncement(e, false)}
                className="min-h-[38px] rounded-xl border border-rose-400/50 bg-rose-950/60 px-3 text-[11px] font-extrabold text-rose-200 hover:bg-rose-900 disabled:opacity-60"
              >
                Remover Banner
              </button>
            )}
            <button
              type="submit"
              disabled={busyAnn}
              className="min-h-[38px] rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-500 to-orange-500 px-4 text-[11px] font-black uppercase text-slate-950 hover:brightness-110 disabled:opacity-60"
            >
              {busyAnn ? 'Enviando...' : 'Publicar p/ Todos'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
