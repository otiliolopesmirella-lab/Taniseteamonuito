import { getDmoSkillSpec } from '../../data/dmoSkillCatalog';
import type { DigimonFormProfile } from '../../types/digimon';
import type { DigimonRuntimeStats, LiveWorldHudSnapshot } from '../../types/hud';
import {
  getDigimonSkillFallbackUrl,
  getDigimonSkillIconUrl,
  getDigimonSkillTheme,
} from '../../utils/skillIcons';
import { DigimonClassificationBadges } from './DigimonClassificationBadges';

interface F1F2SkillBarProps {
  digimon: DigimonFormProfile;
  digimonStats: DigimonRuntimeStats;
  snapshot: LiveWorldHudSnapshot;
  onTriggerSkill: (kind: 'special1' | 'special2') => void;
}

export function F1F2SkillBar({
  digimon,
  digimonStats,
  snapshot,
  onTriggerSkill,
}: F1F2SkillBarProps) {
  const inCombatArea =
    snapshot.mapId !== 'dats-center' && !snapshot.inSafeZone;

  const skillTheme = getDigimonSkillTheme(digimon.id);
  const f1Spec = getDmoSkillSpec(digimon.id, 'f1');
  const f2Spec = getDmoSkillSpec(digimon.id, 'f2');

  const s1Cd = snapshot.special1Cooldown;
  const s1Max = Math.max(0.1, snapshot.special1MaxCooldown);
  const s1Pct = Math.min(100, Math.max(0, (s1Cd / s1Max) * 100));
  const s1LowDs = digimonStats.ds < f1Spec.dsCost;
  const s1Disabled = !inCombatArea || s1Cd > 0 || s1LowDs;

  const s2Cd = snapshot.special2Cooldown;
  const s2Max = Math.max(0.1, snapshot.special2MaxCooldown);
  const s2Pct = Math.min(100, Math.max(0, (s2Cd / s2Max) * 100));
  const s2LowDs = digimonStats.ds < f2Spec.dsCost;
  const s2Disabled = !inCombatArea || s2Cd > 0 || s2LowDs;

  const slots = [
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

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto flex items-end select-none"
    >
      {/* Left Taller F1 / F2 MMORPG Skill Frame */}
      <div className="dmo-frame relative z-10 flex items-center gap-1.5 rounded-xl rounded-br-none p-1.5 sm:gap-2">
        {slots.map((slot) => {
          const isReady = !slot.disabled;
          const isCooling = slot.cdRemaining > 0;
          return (
            <div key={slot.slotKey} className="group/slot relative">
              {/* Hover / Focus Skill Tooltip (Desktop) */}
              <div
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-cyan-300/70 bg-[#041130]/96 px-2.5 py-1.5 text-center shadow-[0_6px_20px_rgba(0,0,0,0.85),0_0_12px_rgba(56,214,255,0.4)] opacity-0 transition-opacity duration-150 group-hover/slot:opacity-100 group-focus-within/slot:opacity-100 sm:block"
              >
                <p className="text-[11px] font-black tracking-wide text-white">
                  {slot.name}
                </p>
                <p className="mt-0.5 text-[9.5px] font-bold tabular-nums text-cyan-200/90">
                  Tecla {slot.keyLabel} · {slot.dsCost} DS · {slot.cooldownSec.toFixed(1)}s
                </p>
              </div>

              <button
                type="button"
                onClick={() => onTriggerSkill(slot.kind)}
                title={`${slot.name} (${slot.keyLabel}) · Custo ${slot.dsCost} DS · Recarga ${slot.cooldownSec.toFixed(1)}s`}
                aria-label={`Usar golpe ${slot.name} (${slot.keyLabel})`}
                className={`relative flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-[10px] border bg-[#030b22] transition-all duration-150 ease-out active:scale-95 sm:h-[58px] sm:w-[58px] ${
                  isReady
                    ? `${skillTheme.readyBorder} ${skillTheme.readyShadow} hover:-translate-y-0.5 hover:brightness-110`
                    : isCooling || slot.lowDs
                      ? 'border-slate-500/70 brightness-75'
                      : `${skillTheme.readyBorder} opacity-95 hover:-translate-y-0.5 hover:brightness-105`
                }`}
              >
                {/* High-Resolution Beveled MMORPG Skill Artwork */}
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
                  className={`h-full w-full object-cover transition-transform duration-200 ease-out ${
                    isCooling
                      ? 'scale-100 saturate-50'
                      : 'group-hover/slot:scale-105'
                  }`}
                />

                {/* Subtle Top Specular Glass Glint */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent"
                />

                {/* Cooldown Sweep Mask + Tabular Countdown */}
                {isCooling && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 z-10 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(to top, rgba(2,6,18,0.86) ${slot.cdPct}%, rgba(2,6,18,0.34) ${slot.cdPct}%)`,
                    }}
                  >
                    <span className="text-[12px] font-black tabular-nums text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,1)]">
                      {slot.cdRemaining >= 10
                        ? `${Math.ceil(slot.cdRemaining)}s`
                        : `${slot.cdRemaining.toFixed(1)}s`}
                    </span>
                  </div>
                )}

                {/* Bottom-Left Keybind Badge (F1 / F2) */}
                <span
                  className={`pointer-events-none absolute bottom-0.5 left-0.5 z-20 rounded border ${skillTheme.keycapBorder} bg-[#02081a]/92 px-1 py-[1px] font-display text-[8.5px] font-bold leading-none tracking-wide ${skillTheme.keycapText} shadow-[0_1px_3px_rgba(0,0,0,0.95)] sm:text-[9px]`}
                >
                  {slot.keyLabel}
                </span>

                {/* Top-Right DS Cost Indicator */}
                <span
                  className={`pointer-events-none absolute right-0.5 top-0.5 z-20 rounded bg-[#02081a]/88 px-1 py-[1px] text-[7.5px] font-black leading-none tabular-nums shadow-[0_1px_2px_rgba(0,0,0,0.95)] sm:text-[8px] ${
                    slot.lowDs ? 'text-rose-400' : 'text-cyan-200'
                  }`}
                >
                  {slot.dsCost}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Connected Shorter Stepped Right Bar (Enemy Target Status & Classification Icons) */}
      <div className="dmo-frame -ml-1 hidden min-h-[48px] w-[182px] items-center rounded-r-xl border-l-0 p-1 sm:flex">
        <div className="dmo-well flex h-full w-full flex-col justify-center rounded-md px-2 py-1">
          {snapshot.targetEnemy ? (
            <>
              <div className="flex items-center justify-between gap-1 text-[8.5px] font-extrabold">
                <span className="truncate text-rose-300">
                  {snapshot.targetEnemy.name}
                </span>
                <span className="shrink-0 tabular-nums text-amber-300">
                  Lv.{snapshot.targetEnemy.level}
                </span>
              </div>
              <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-[#020612]">
                <div
                  className="dmo-hp-fill h-full transition-[width] duration-150"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        (snapshot.targetEnemy.hp /
                          Math.max(1, snapshot.targetEnemy.maxHp)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between gap-1">
                <DigimonClassificationBadges
                  classification={snapshot.targetEnemy.classification}
                  variant="target"
                />
                <span className="shrink-0 text-[7.5px] font-bold tabular-nums text-rose-200/85">
                  {Math.max(0, Math.round(snapshot.targetEnemy.hp))}/{snapshot.targetEnemy.maxHp}
                </span>
              </div>
            </>
          ) : (
            <p className="truncate text-[9px] font-bold text-cyan-200/80">
              {inCombatArea ? 'Pronto · F1 / F2' : 'Zona Segura'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
