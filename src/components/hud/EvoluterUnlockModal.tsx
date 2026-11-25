import { CheckCircle2, Lock, Sparkles, X } from 'lucide-react';
import { EVOLUTER_ICON_URL } from '../../data/itemsCatalog';
import {
  getFormEvoluterCost,
  isEvolutionSlotUnlockedByEvoluter,
} from '../../services/hudGameService';
import {
  getDigimonFormProfile,
  type DigimonFormId,
  type StarterDigimonId,
} from '../../types/digimon';
import type { DigimonRuntimeStats } from '../../types/hud';

interface EvoluterUnlockModalProps {
  starterId: StarterDigimonId;
  targetFormId: DigimonFormId;
  digimonStats: DigimonRuntimeStats;
  ownedEvoluters: number;
  onConfirmUnlock: (targetFormId: DigimonFormId, evolveImmediately: boolean) => void;
  onEvolveNow: (targetFormId: DigimonFormId) => void;
  onClose: () => void;
}

export function EvoluterUnlockModal({
  starterId,
  targetFormId,
  digimonStats,
  ownedEvoluters,
  onConfirmUnlock,
  onEvolveNow,
  onClose,
}: EvoluterUnlockModalProps) {
  const targetForm = getDigimonFormProfile(targetFormId);
  const evoluterCost = getFormEvoluterCost(starterId, targetFormId);
  const alreadyUnlocked = isEvolutionSlotUnlockedByEvoluter(
    starterId,
    targetFormId,
    digimonStats
  );
  const levelMet = digimonStats.level >= targetForm.unlockLevel;
  const hasEnoughEvoluters = ownedEvoluters >= evoluterCost;
  const canUnlock = !alreadyUnlocked && levelMet && hasEnoughEvoluters;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Desbloquear ${targetForm.name} com Evoluter`}
      className="pointer-events-auto fixed inset-0 z-[65] flex items-center justify-center bg-[#02081a]/82 p-3 backdrop-blur-sm select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window relative w-full max-w-[400px] overflow-hidden rounded-2xl border-2 border-fuchsia-300/85 bg-gradient-to-b from-[#0a2f82] via-[#06184a] to-[#030b24] shadow-[0_0_42px_rgba(232,121,249,0.45),0_0_24px_rgba(56,232,255,0.4)]"
      >
        {/* Top Luminous Accent Bar */}
        <div
          aria-hidden="true"
          className="h-1 w-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-400"
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-300/35 bg-gradient-to-r from-[#07266e] via-[#132c7c] to-[#07266e] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <img
              src={EVOLUTER_ICON_URL}
              alt="Evoluter"
              referrerPolicy="no-referrer"
              className="h-6 w-6 rounded-md border border-fuchsia-300/80 object-cover shadow-[0_0_10px_rgba(232,121,249,0.7)]"
            />
            <div>
              <h2 className="text-sm font-black tracking-wide text-white">
                Desbloqueio de Evolução
              </h2>
              <p className="text-[10px] font-bold text-cyan-200/85">
                Sistema Oficial · Evoluter
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela de Evoluter"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-200/75 bg-[#051d52] text-cyan-100 hover:bg-sky-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 p-4">
          {/* Evolution Target + Evoluter Visual Showcase */}
          <div className="relative flex items-center justify-between gap-3 overflow-hidden rounded-xl border border-cyan-300/40 bg-[radial-gradient(circle_at_50%_0%,rgba(232,121,249,0.22),rgba(3,12,38,0.96)_72%)] p-3">
            {/* Target Digimon Portrait */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className="relative flex h-18 w-18 shrink-0 items-center justify-center rounded-xl border-2 bg-[radial-gradient(circle_at_center,rgba(56,232,255,0.26),rgba(2,10,30,0.95))] p-1.5"
                style={{
                  borderColor: targetForm.theme.accentHex,
                  boxShadow: `0 0 18px ${targetForm.theme.glowRgba}`,
                }}
              >
                <img
                  src={targetForm.portraitUrl}
                  alt={targetForm.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]"
                />
              </div>

              <div className="min-w-0">
                <span className="inline-block rounded border border-fuchsia-300/65 bg-fuchsia-950/75 px-1.5 py-[1px] text-[9px] font-black uppercase tracking-wider text-fuchsia-200">
                  {targetForm.stage}
                </span>
                <h3
                  className="mt-0.5 truncate text-lg font-black italic leading-tight drop-shadow"
                  style={{ color: targetForm.theme.accentHex }}
                >
                  {targetForm.name}
                </h3>
                <p className="text-[10.5px] font-bold text-cyan-100/85">
                  Requer Nível {targetForm.unlockLevel}
                </p>
              </div>
            </div>

            {/* Official Evoluter Relic Pedestal */}
            {evoluterCost > 0 && (
              <div className="flex shrink-0 flex-col items-center rounded-xl border border-fuchsia-300/60 bg-[#040d28]/90 px-2.5 py-2 shadow-[0_0_20px_rgba(232,121,249,0.32)]">
                <div className="relative flex h-12 w-12 items-center justify-center">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 animate-pulse rounded-lg bg-fuchsia-500/35 blur-md"
                  />
                  <img
                    src={EVOLUTER_ICON_URL}
                    alt="Evoluter"
                    referrerPolicy="no-referrer"
                    className="relative z-10 h-12 w-12 rounded-lg border border-cyan-300/75 object-cover shadow-[0_0_16px_rgba(56,232,255,0.65)]"
                  />
                </div>
                <span className="mt-1 text-[11px] font-black tabular-nums text-fuchsia-200">
                  ×{evoluterCost} Evoluter{evoluterCost > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Requirements Checklist */}
          <div className="space-y-1.5 rounded-xl border border-cyan-400/30 bg-[#030f2e]/95 p-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-sky-100">
                {levelMet ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <Lock className="h-4 w-4 shrink-0 text-amber-300" />
                )}
                <span>Nível do Digimon</span>
              </span>
              <span
                className={`font-black tabular-nums ${
                  levelMet ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                Nv. {digimonStats.level} / {targetForm.unlockLevel}
              </span>
            </div>

            {evoluterCost > 0 && (
              <div className="flex items-center justify-between border-t border-cyan-400/15 pt-1.5">
                <span className="flex items-center gap-1.5 font-bold text-sky-100">
                  <img
                    src={EVOLUTER_ICON_URL}
                    alt=""
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 rounded-[3px] object-cover"
                  />
                  <span>Evoluters no Inventário</span>
                </span>
                <span
                  className={`font-black tabular-nums ${
                    alreadyUnlocked || hasEnoughEvoluters
                      ? 'text-emerald-300'
                      : 'text-rose-300'
                  }`}
                >
                  {alreadyUnlocked
                    ? 'Já Desbloqueado'
                    : `${ownedEvoluters} / ${evoluterCost}`}
                </span>
              </div>
            )}
          </div>

          {/* Helpful Hint */}
          {!alreadyUnlocked && !hasEnoughEvoluters && evoluterCost > 0 && (
            <p className="rounded-lg border border-amber-400/35 bg-amber-950/35 px-2.5 py-2 text-[10.5px] leading-snug text-amber-100">
              Você precisa de mais{' '}
              <strong className="text-amber-300">
                {evoluterCost - ownedEvoluters} Evoluter
                {evoluterCost - ownedEvoluters > 1 ? 's' : ''}
              </strong>
              . Evoluters dropam no{' '}
              <strong className="text-cyan-200">
                Boss Raid Kuwagamon (10% · Top 5 de dano)
              </strong>{' '}
              ou em{' '}
              <strong className="text-cyan-200">Digimons selvagens (0,1%)</strong>.
            </p>
          )}

          {!alreadyUnlocked && hasEnoughEvoluters && levelMet && (
            <p className="text-center text-[10.5px] leading-snug text-cyan-100/85">
              Desbloqueio <strong className="text-white">permanente</strong> para
              este Digimon! Depois de liberar, evoluir e reverter é totalmente
              gratuito.
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] flex-1 rounded-xl border border-cyan-400/45 bg-[#061d52] px-3 text-xs font-extrabold text-cyan-100 transition hover:bg-sky-800 active:scale-[0.98]"
            >
              Cancelar
            </button>

            {alreadyUnlocked ? (
              <button
                type="button"
                disabled={!levelMet}
                onClick={() => {
                  onClose();
                  onEvolveNow(targetFormId);
                }}
                className="flex min-h-[40px] flex-[1.5] items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-3 text-xs font-black uppercase text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.55)] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>Evoluir Agora</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={!canUnlock}
                onClick={() => onConfirmUnlock(targetFormId, true)}
                className="flex min-h-[40px] flex-[1.6] items-center justify-center gap-1.5 rounded-xl border border-fuchsia-200/90 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 px-3 text-xs font-black uppercase tracking-wide text-white shadow-[0_0_20px_rgba(232,121,249,0.55)] transition hover:brightness-115 active:scale-[0.98] disabled:cursor-not-allowed disabled:border-slate-600 disabled:bg-slate-800 disabled:bg-none disabled:text-slate-400 disabled:shadow-none"
              >
                <img
                  src={EVOLUTER_ICON_URL}
                  alt=""
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 rounded-[3px] object-cover"
                />
                <span>
                  {!levelMet
                    ? `Requer Nv. ${targetForm.unlockLevel}`
                    : !hasEnoughEvoluters
                      ? `Faltam ${evoluterCost - ownedEvoluters}`
                      : `Desbloquear (-${evoluterCost})`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
