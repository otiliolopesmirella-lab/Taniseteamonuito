import { memo } from 'react';
import { Lock } from 'lucide-react';
import { getDmoSkillSpec } from '../../data/dmoSkillCatalog';
import { EVOLUTER_ICON_URL } from '../../data/itemsCatalog';
import {
  DIGIMON_EVOLUTION_CHAINS,
  isEvolutionSlotUnlockedByEvoluter,
} from '../../services/hudGameService';
import {
  getDigimonFormProfile,
  type DigimonFormId,
  type DigimonFormProfile,
} from '../../types/digimon';
import type {
  DigimonRuntimeStats,
  LiveWorldHudSnapshot,
} from '../../types/hud';
import {
  getDigimonSkillFallbackUrl,
  getDigimonSkillIconUrl,
  getDigimonSkillTheme,
} from '../../utils/skillIcons';

interface DigimonBottomActionDockProps {
  digimon: DigimonFormProfile;
  stats: DigimonRuntimeStats;
  snapshot: LiveWorldHudSnapshot;
  ownedEvoluters?: number;
  onTriggerSkill: (kind: 'special1' | 'special2') => void;
  onEvolveForm: (targetFormId: DigimonFormId) => void;
  onRequestUnlockForm?: (targetFormId: DigimonFormId) => void;
}

const STAGE_SHORT_TAG: Record<string, string> = {
  Rookie: 'R',
  Champion: 'C',
  Ultimate: 'U',
  Mega: 'M',
};

/**
 * Bottom-center Digimon action cluster anchored cleanly between the virtual joystick and MENU:
 * - Top row: F1 & F2 skill squares centered pixel-perfectly above Champion & Ultimate
 * - Bottom row: 4 direct click-to-evolve squares (Rookie, Champion, Ultimate, Mega)
 */
export const DigimonBottomActionDock = memo(function DigimonBottomActionDock({
  digimon,
  stats,
  snapshot,
  ownedEvoluters = 0,
  onTriggerSkill,
  onEvolveForm,
  onRequestUnlockForm,
}: DigimonBottomActionDockProps) {
  const inCombatArea =
    snapshot.mapId !== 'dats-center' && !snapshot.inSafeZone;
  const skillTheme = getDigimonSkillTheme(digimon.id);
  const f1Spec = getDmoSkillSpec(digimon.id, 'f1');
  const f2Spec = getDmoSkillSpec(digimon.id, 'f2');

  const s1Cd = snapshot.special1Cooldown;
  const s1Max = Math.max(0.1, snapshot.special1MaxCooldown);
  const s1Pct = Math.min(100, Math.max(0, (s1Cd / s1Max) * 100));
  const s1LowDs = stats.ds < f1Spec.dsCost;
  const s1Disabled = !inCombatArea || s1Cd > 0 || s1LowDs;

  const s2Cd = snapshot.special2Cooldown;
  const s2Max = Math.max(0.1, snapshot.special2MaxCooldown);
  const s2Pct = Math.min(100, Math.max(0, (s2Cd / s2Max) * 100));
  const s2LowDs = stats.ds < f2Spec.dsCost;
  const s2Disabled = !inCombatArea || s2Cd > 0 || s2LowDs;

  const skillSlots = [
    {
      slotKey: 'f1' as const,
      keyLabel: 'F1',
      kind: 'special1' as const,
      name: f1Spec.name,
      dsCost: f1Spec.dsCost,
      cooldownSec: f1Spec.cooldownSec,
      cdRemaining: s1Cd,
      cdPct: s1Pct,
      lowDs: s1LowDs,
      disabled: s1Disabled,
      iconUrl: getDigimonSkillIconUrl(digimon.id, 'f1'),
      fallbackUrl: getDigimonSkillFallbackUrl(digimon.id, 'f1'),
    },
    {
      slotKey: 'f2' as const,
      keyLabel: 'F2',
      kind: 'special2' as const,
      name: f2Spec.name,
      dsCost: f2Spec.dsCost,
      cooldownSec: f2Spec.cooldownSec,
      cdRemaining: s2Cd,
      cdPct: s2Pct,
      lowDs: s2LowDs,
      disabled: s2Disabled,
      iconUrl: getDigimonSkillIconUrl(digimon.id, 'f2'),
      fallbackUrl: getDigimonSkillFallbackUrl(digimon.id, 'f2'),
    },
  ];

  const evoChain = DIGIMON_EVOLUTION_CHAINS[digimon.starterId] ?? [];

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className="pointer-events-auto flex flex-col items-center gap-1 select-none sm:gap-1.5"
    >
      {/* Top Row: F1 & F2 Skill Squares (centered directly above Champion & Ultimate) */}
      <div
        aria-label="Habilidades do Digimon"
        className="dmo-frame flex items-center gap-[3px] rounded-lg p-[3px] shadow-[0_6px_18px_rgba(0,10,40,0.75)] sm:gap-1.5 sm:rounded-xl sm:p-1"
      >
        {skillSlots.map((slot) => {
          const isReady = !slot.disabled;
          const isCooling = slot.cdRemaining > 0;
          return (
            <div key={slot.slotKey} className="group/slot relative">
              {/* Upward Hover Tooltip */}
              <div
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-cyan-300/75 bg-[#041130]/96 px-2.5 py-1 text-center opacity-0 shadow-[0_6px_18px_rgba(0,0,0,0.88),0_0_10px_rgba(56,214,255,0.45)] transition-opacity duration-150 group-hover/slot:opacity-100 group-focus-within/slot:opacity-100 sm:block"
              >
                <p className="text-[10.5px] font-black tracking-wide text-white">
                  {slot.name}
                </p>
                <p className="mt-0.5 text-[9px] font-bold tabular-nums text-cyan-200/90">
                  {slot.keyLabel} · {slot.dsCost} DS · {slot.cooldownSec.toFixed(1)}s
                </p>
              </div>

              <button
                type="button"
                onClick={() => onTriggerSkill(slot.kind)}
                title={`${slot.name} (${slot.keyLabel}) · ${slot.dsCost} DS`}
                aria-label={`Usar golpe ${slot.name} (${slot.keyLabel})`}
                className={`relative flex h-[31px] w-[31px] items-center justify-center overflow-hidden rounded-[6px] border bg-[#030b22] transition-all duration-150 active:scale-95 sm:h-10 sm:w-10 sm:rounded-lg ${
                  isReady
                    ? `${skillTheme.readyBorder} ${skillTheme.readyShadow} hover:brightness-110`
                    : isCooling || slot.lowDs
                      ? 'border-slate-500/70 brightness-75'
                      : `${skillTheme.readyBorder} opacity-95 hover:brightness-105`
                }`}
              >
                <img
                  src={slot.iconUrl}
                  alt={slot.name}
                  draggable={false}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.dataset.fallbackApplied) {
                      img.dataset.fallbackApplied = '1';
                      img.src = slot.fallbackUrl;
                    }
                  }}
                  className={`h-full w-full object-cover ${
                    isCooling ? 'saturate-50' : ''
                  }`}
                />

                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent"
                />

                {isCooling && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 z-10 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(to top, rgba(2,6,18,0.86) ${slot.cdPct}%, rgba(2,6,18,0.34) ${slot.cdPct}%)`,
                    }}
                  >
                    <span className="text-[9px] font-black tabular-nums text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] sm:text-[10.5px]">
                      {slot.cdRemaining >= 10
                        ? `${Math.ceil(slot.cdRemaining)}s`
                        : `${slot.cdRemaining.toFixed(1)}s`}
                    </span>
                  </div>
                )}

                <span
                  className={`pointer-events-none absolute bottom-[1px] left-[1px] z-20 rounded-[3px] border ${skillTheme.keycapBorder} bg-[#02081a]/92 px-[3px] py-[0.5px] font-display text-[6.5px] font-bold leading-none ${skillTheme.keycapText} shadow-[0_1px_2px_rgba(0,0,0,0.95)] sm:text-[7.5px]`}
                >
                  {slot.keyLabel}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Row: 4 Direct Click-to-Evolve Squares (Rookie, Champion, Ultimate, Mega) */}
      {evoChain.length > 0 && (
        <div
          aria-label="Evoluções do Digimon"
          className="dmo-frame flex items-center gap-[3px] rounded-lg p-[3px] shadow-[0_6px_20px_rgba(0,10,40,0.82)] sm:gap-1.5 sm:rounded-xl sm:p-1"
        >
          {evoChain.slice(0, 4).map((step) => {
            const stepFormId = step.formId;
            const isActive = stepFormId === digimon.id;
            const levelMet = Boolean(
              step.playable && stepFormId && stats.level >= step.unlockLevel
            );
            const evoluterUnlocked = stepFormId
              ? isEvolutionSlotUnlockedByEvoluter(
                  digimon.starterId,
                  stepFormId,
                  stats
                )
              : false;
            const needsEvoluter = step.evoluterCost > 0 && !evoluterUnlocked;
            const isFullyUnlocked = levelMet && !needsEvoluter;
            const canEvolveClick = Boolean(
              isFullyUnlocked && !isActive && stepFormId
            );
            const canInspectUnlock = Boolean(
              needsEvoluter && stepFormId && onRequestUnlockForm
            );
            const isClickable = canEvolveClick || canInspectUnlock;
            const stageTag = STAGE_SHORT_TAG[step.stage] ?? step.stage.charAt(0);
            const thumbUrl = stepFormId
              ? getDigimonFormProfile(stepFormId).portraitUrl
              : null;
            const actionHint = isActive
              ? 'Forma Ativa'
              : needsEvoluter
                ? levelMet
                  ? `Desbloquear: ${step.evoluterCost} Evoluters (tem ${ownedEvoluters})`
                  : `Nv. ${step.unlockLevel} + ${step.evoluterCost} Evoluters`
                : levelMet
                  ? 'Clique para evoluir'
                  : `Requer Nv. ${step.unlockLevel}`;

            return (
              <div key={step.name} className="group/evo relative">
                {/* Upward Hover Tooltip */}
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-cyan-300/75 bg-[#041130]/96 px-2.5 py-1 text-center opacity-0 shadow-[0_6px_18px_rgba(0,0,0,0.88),0_0_10px_rgba(56,214,255,0.45)] transition-opacity duration-150 group-hover/evo:opacity-100 group-focus-within/evo:opacity-100 sm:block"
                >
                  <p className="text-[10.5px] font-black tracking-wide text-white">
                    {step.name}
                  </p>
                  <p
                    className={`mt-0.5 text-[9px] font-bold ${
                      isActive
                        ? 'text-amber-300'
                        : isFullyUnlocked
                          ? 'text-emerald-300'
                          : needsEvoluter && levelMet
                            ? 'text-fuchsia-300'
                            : 'text-slate-300'
                    }`}
                  >
                    {step.stage} · {actionHint}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => {
                    if (!stepFormId) return;
                    if (canEvolveClick) {
                      onEvolveForm(stepFormId);
                    } else if (canInspectUnlock && onRequestUnlockForm) {
                      onRequestUnlockForm(stepFormId);
                    }
                  }}
                  title={`${step.name} (${step.stage}) · ${actionHint}`}
                  aria-label={
                    canEvolveClick
                      ? `Evoluir para ${step.name} (${step.stage})`
                      : `${step.name} (${step.stage}) — ${actionHint}`
                  }
                  className={`relative flex h-[31px] w-[31px] items-center justify-center overflow-hidden rounded-[6px] border transition-all duration-150 sm:h-10 sm:w-10 sm:rounded-lg ${
                    isActive
                      ? 'border-amber-300 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.34)_0%,rgba(8,29,82,0.96)_100%)] shadow-[0_0_10px_rgba(251,191,36,0.78)]'
                      : canEvolveClick
                        ? 'cursor-pointer border-cyan-300/85 bg-[radial-gradient(circle_at_center,rgba(56,232,255,0.28)_0%,rgba(5,20,56,0.96)_100%)] shadow-[0_0_8px_rgba(56,232,255,0.4)] hover:scale-105 hover:border-amber-300 hover:brightness-110 active:scale-95'
                        : needsEvoluter && levelMet
                          ? 'cursor-pointer border-fuchsia-300 bg-[radial-gradient(circle_at_center,rgba(232,121,249,0.32)_0%,rgba(34,11,76,0.96)_100%)] shadow-[0_0_10px_rgba(232,121,249,0.68)] hover:scale-105 hover:brightness-110 active:scale-95'
                          : canInspectUnlock
                            ? 'cursor-pointer border-fuchsia-400/50 bg-[#030b20]/90 opacity-85 hover:border-fuchsia-300'
                            : 'cursor-not-allowed border-slate-600/65 bg-[#030b20]/90 opacity-75'
                  }`}
                >
                  {thumbUrl && (
                    <img
                      src={thumbUrl}
                      alt={step.name}
                      draggable={false}
                      className={`h-full w-full object-contain p-[1.5px] ${
                        !isFullyUnlocked ? 'brightness-50 saturate-50' : ''
                      }`}
                    />
                  )}

                  {/* Top glossy rim */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent"
                  />

                  {/* Stage letter tag (R / C / U / M) */}
                  <span
                    className={`pointer-events-none absolute bottom-[1px] left-[1px] z-20 rounded-[3px] border px-[2.5px] py-[0.5px] font-display text-[6.5px] font-extrabold leading-none shadow-[0_1px_2px_rgba(0,0,0,0.95)] sm:text-[7.5px] ${
                      isActive
                        ? 'border-amber-300/90 bg-amber-950/95 text-amber-200'
                        : isFullyUnlocked
                          ? 'border-cyan-300/70 bg-[#02081a]/92 text-cyan-200'
                          : needsEvoluter && levelMet
                            ? 'border-fuchsia-300/85 bg-[#29094e]/95 text-fuchsia-200'
                            : 'border-slate-500/60 bg-[#02081a]/92 text-slate-400'
                    }`}
                  >
                    {stageTag}
                  </span>

                  {/* Locked by Evoluter (Level already reached!) */}
                  {needsEvoluter && levelMet && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#180533]/52"
                    >
                      <img
                        src={EVOLUTER_ICON_URL}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-3.5 w-3.5 rounded-[3px] border border-fuchsia-300/85 object-cover shadow-[0_0_8px_rgba(232,121,249,0.85)] sm:h-4.5 sm:w-4.5"
                      />
                      <span className="mt-[1px] text-[6.5px] font-black leading-none tabular-nums text-fuchsia-100 drop-shadow-[0_1px_2px_rgba(0,0,0,1)] sm:text-[7.5px]">
                        ×{step.evoluterCost}
                      </span>
                    </span>
                  )}

                  {/* Locked by Level (also shows tiny Evoluter badge top-right if Mercenary) */}
                  {!levelMet && (
                    <>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#020718]/45"
                      >
                        <Lock className="h-2.5 w-2.5 text-amber-300/90 drop-shadow sm:h-3 sm:w-3" />
                        <span className="mt-[1px] text-[6.5px] font-black leading-none tabular-nums text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)] sm:text-[7.5px]">
                          {step.unlockLevel}
                        </span>
                      </span>
                      {needsEvoluter && (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute right-[1px] top-[1px] z-20 flex items-center gap-[1px] rounded-[3px] bg-[#2a0952]/95 px-[2px] py-[0.5px] text-[6px] font-black leading-none tabular-nums text-fuchsia-200 sm:text-[6.5px]"
                        >
                          <img
                            src={EVOLUTER_ICON_URL}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-2 w-2 rounded-[1px] object-cover sm:h-2.5 sm:w-2.5"
                          />
                          {step.evoluterCost}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
