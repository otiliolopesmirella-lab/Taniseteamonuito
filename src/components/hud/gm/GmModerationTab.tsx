import { useState } from 'react';
import {
  Ban,
  Bug,
  ClipboardList,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { isBanCurrentlyActive } from '../../../services/banService';
import type { GmServerSnapshot } from '../../../services/gmControlService';

interface GmModerationTabProps {
  snapshot: GmServerSnapshot | null;
  onUnbanPlayer: (targetUid: string, targetName: string) => Promise<void>;
  onDeleteFeedback: (reportId: string, targetName: string) => Promise<void>;
}

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function GmModerationTab({
  snapshot,
  onUnbanPlayer,
  onDeleteFeedback,
}: GmModerationTabProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const bans = snapshot?.bans ?? [];
  const feedbacks = snapshot?.feedbacks ?? [];
  const logs = snapshot?.auditLogs ?? [];

  return (
    <div className="space-y-3">
      {/* Banned Accounts List */}
      <div className="rounded-xl border border-rose-400/25 bg-[#041232] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-rose-200">
            <Ban className="h-4 w-4 text-rose-400" />
            <span>Registro de Banimentos ({bans.length})</span>
          </span>
        </div>

        {bans.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">
            Nenhuma suspensão registrada até o momento.
          </p>
        ) : (
          <div className="space-y-1.5">
            {bans.map((b) => {
              const active = isBanCurrentlyActive(b);
              const busy = busyId === `ban-${b.targetUid}`;
              return (
                <div
                  key={b.targetUid}
                  className="flex flex-col justify-between gap-2 rounded-lg border border-white/10 bg-[#061844] p-2.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-black text-white">
                        {b.tamerName || b.username}
                      </span>
                      <span className="text-[10.5px] text-cyan-300">
                        @{b.username}
                      </span>
                      <span
                        className={`rounded border px-1.5 py-[1px] text-[9px] font-black ${
                          active
                            ? 'border-rose-400/60 bg-rose-950/70 text-rose-200'
                            : 'border-slate-500/50 bg-slate-900 text-slate-300'
                        }`}
                      >
                        {active ? 'ATIVO' : 'ENCERRADO'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-200">
                      Motivo: {b.reason}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Por {b.bannedByName} ·{' '}
                      {b.permanent
                        ? 'Permanente'
                        : `Expira em ${formatDateTime(b.expiresAtMs)}`}
                    </p>
                  </div>

                  {active && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setBusyId(`ban-${b.targetUid}`);
                        try {
                          await onUnbanPlayer(
                            b.targetUid,
                            b.tamerName || b.username
                          );
                        } finally {
                          setBusyId(null);
                        }
                      }}
                      className="flex min-h-[34px] shrink-0 items-center gap-1 rounded-lg border border-emerald-400/65 bg-emerald-700 px-3 text-[10.5px] font-black text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Desbanir</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alpha Feedback & Bug Reports */}
      <div className="rounded-xl border border-amber-400/25 bg-[#041232] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-200">
            <Bug className="h-4 w-4 text-amber-300" />
            <span>Relatos de Bugs & Feedbacks ({feedbacks.length})</span>
          </span>
        </div>

        {feedbacks.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">
            Nenhum relato pendente enviado pelos jogadores.
          </p>
        ) : (
          <div className="space-y-1.5">
            {feedbacks.map((fb) => {
              const busy = busyId === `fb-${fb.id}`;
              return (
                <div
                  key={fb.id}
                  className="flex flex-col justify-between gap-2 rounded-lg border border-white/10 bg-[#061844] p-2.5 sm:flex-row sm:items-start"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="rounded border border-amber-300/45 bg-amber-500/15 px-1.5 py-[1px] font-black uppercase text-amber-200">
                        {fb.category}
                      </span>
                      <span className="font-black text-white">
                        {fb.tamerName || fb.username}
                      </span>
                      <span className="text-slate-400">
                        · {fb.screenContext} · {formatDateTime(fb.createdAtMs)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-slate-100">
                      {fb.message}
                    </p>
                    <p className="mt-0.5 text-[9.5px] text-slate-400">
                      {fb.deviceInfo}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      setBusyId(`fb-${fb.id}`);
                      try {
                        await onDeleteFeedback(
                          fb.id,
                          fb.tamerName || fb.username
                        );
                      } finally {
                        setBusyId(null);
                      }
                    }}
                    className="flex min-h-[32px] shrink-0 items-center gap-1 rounded-lg border border-rose-400/50 bg-rose-950/60 px-2.5 text-[10px] font-bold text-rose-200 hover:bg-rose-900 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Resolver / Excluir</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GM Audit Logs */}
      <div className="rounded-xl border border-cyan-400/25 bg-[#041232] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-cyan-200">
            <ClipboardList className="h-4 w-4 text-cyan-300" />
            <span>Auditoria de Ações GM ({logs.length})</span>
          </span>
        </div>

        {logs.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">
            As ações administrativas dos GMs são registradas aqui automaticamente.
          </p>
        ) : (
          <div className="max-h-[240px] space-y-1.5 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.logId}
                className="rounded-lg border border-white/10 bg-[#061844] px-2.5 py-2 text-[11px]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded border border-cyan-400/35 bg-cyan-950/60 px-1.5 py-[1px] text-[9px] font-black uppercase text-cyan-200">
                      {log.action}
                    </span>
                    <span className="font-black text-amber-200">
                      {log.actorName}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="font-bold text-white">
                      {log.targetName}
                    </span>
                  </div>
                  <span className="text-[9.5px] tabular-nums text-slate-400">
                    {formatDateTime(log.createdAtMs)}
                  </span>
                </div>
                <p className="mt-0.5 text-[10.5px] text-slate-200">
                  {log.summary}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
