import { memo } from 'react';
import {
  getDigimonFormProfile,
  PARTNER_AI_STATE_LABELS,
  type DigimonFormProfile,
  type PartnerAIState,
} from '../../types/digimon';
import type { ArchivedDigimonEntry, DigimonRuntimeStats } from '../../types/hud';

interface ActiveDigimonHudPanelProps {
  digimon: DigimonFormProfile;
  stats: DigimonRuntimeStats;
  partnerState: PartnerAIState;
  activeSkillBanner: string | null;
  levelUpPulse?: boolean;
  partyDigimons?: readonly ArchivedDigimonEntry[];
  onOpenDigimon: () => void;
  onSelectPartyReserve?: (reserveIndex: 0 | 1) => void;
}

export const ActiveDigimonHudPanel = memo(function ActiveDigimonHudPanel({
  digimon,
  stats,
  partnerState,
  activeSkillBanner,
  levelUpPulse = false,
  partyDigimons = [],
  onOpenDigimon,
  onSelectPartyReserve,
}: ActiveDigimonHudPanelProps) {
  const hpPct = Math.max(
    0,
    Math.min(100, (stats.hp / Math.max(1, stats.maxHp)) * 100)
  );
  const dsPct = Math.max(
    0,
    Math.min(100, (stats.ds / Math.max(1, stats.maxDs)) * 100)
  );
  const expPct = Math.max(
    0,
    Math.min(100, (stats.exp / Math.max(1, stats.expToNext)) * 100)
  );

  const statusText = activeSkillBanner ?? PARTNER_AI_STATE_LABELS[partnerState];
  const showStatus =
    Boolean(activeSkillBanner) ||
    partnerState === 'ATTACK' ||
    partnerState === 'CHASE';

  const displayName = stats.nickname ?? digimon.name;
  const reserveSlots: ReadonlyArray<0 | 1> = [0, 1];

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto flex flex-col items-start gap-1 select-none"
    >
      <button
        type="button"
        onClick={onOpenDigimon}
        title={`Abrir detalhes de ${displayName} (${digimon.stage}) · EXP ${stats.exp}/${stats.expToNext}`}
        className={`group relative flex items-center text-left transition-transform active:scale-[0.99] ${
          levelUpPulse ? 'drop-shadow-[0_0_16px_rgba(255,212,59,0.9)]' : ''
        }`}
      >
        {/* Overlapping Circular Portrait Ring */}
        <div
          className="dmo-ring relative z-20 flex h-14 w-14 shrink-0 items-center justify-center rounded-full p-0.5 sm:h-16 sm:w-16"
          style={{
            boxShadow: `0 0 14px ${digimon.theme.glowRgba}, inset 0 0 8px rgba(0,110,255,0.85)`,
          }}
        >
          <div className="h-full w-full overflow-hidden rounded-full bg-gradient-to-b from-[#0b2f78] to-[#04102b] p-0.5">
            <img
              src={digimon.portraitUrl}
              alt={digimon.name}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Bottom-left Circular Level Badge */}
          <span
            title={`Nível de ${digimon.name}: ${stats.level}`}
            className="dmo-frame absolute -bottom-1 -left-1 z-30 flex h-6 min-w-[24px] items-center justify-center rounded-full px-1 text-[10.5px] font-black tabular-nums text-white"
          >
            {stats.level}
          </span>
        </div>

        {/* Right Extending Beveled Capsule + Bottom EXP Lip (mirrors Tamer HUD) */}
        <div className="-ml-4 flex flex-col">
          {/* Main HP/DS Capsule */}
          <div className="dmo-frame relative flex w-[142px] flex-col justify-center rounded-r-2xl py-1.5 pl-5 pr-2.5 sm:w-[172px] sm:pl-6">
            {/* HP Bar */}
            <div className="dmo-well relative h-4 w-full overflow-hidden rounded-full">
              <div
                className="dmo-hp-fill h-full transition-[width] duration-200"
                style={{ width: `${hpPct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-between px-2 text-[9.5px] font-black tracking-wide text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                <span>HP</span>
                <span className="tabular-nums text-[8.5px]">
                  {Math.round(stats.hp)}/{stats.maxHp}
                </span>
              </span>
            </div>

            {/* DS Bar */}
            <div className="dmo-well relative mt-1 h-4 w-full overflow-hidden rounded-full">
              <div
                className="dmo-ds-fill h-full transition-[width] duration-200"
                style={{ width: `${dsPct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-between px-2 text-[9.5px] font-black tracking-wide text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">
                <span>DS</span>
                <span className="tabular-nums text-[8.5px]">
                  {Math.round(stats.ds)}/{stats.maxDs}
                </span>
              </span>
            </div>
          </div>

          {/* Tucked EXP Lip directly below photo/bars matching Tamer HUD */}
          <div
            title={`EXP de ${displayName}: ${stats.exp} / ${stats.expToNext} (${expPct.toFixed(2)}%)`}
            className="dmo-frame -mt-0.5 ml-2 flex h-4 w-[128px] items-center justify-between rounded-b-lg px-2 sm:w-[154px]"
          >
            <span
              className="max-w-[54px] truncate text-[8.5px] font-extrabold sm:max-w-[66px]"
              style={{ color: digimon.theme.accentHex }}
            >
              {displayName}
            </span>
            <div className="mx-1.5 h-1.5 flex-1 overflow-hidden rounded-full bg-[#020922]">
              <div
                className="h-full bg-gradient-to-r from-amber-300 via-yellow-300 to-cyan-300 transition-[width] duration-300"
                style={{ width: `${expPct}%` }}
              />
            </div>
            <span className="shrink-0 text-[9px] font-black tabular-nums text-white drop-shadow">
              {expPct.toFixed(3)}%
            </span>
          </div>
        </div>
      </button>

      {/* 2 Compact Circular Reserve Digimon Slots directly below the Digimon portrait (up to 3 Digimons in party) */}
      <div
        aria-label="Slots reserva da equipe Digimon"
        className="ml-0.5 mt-0.5 flex items-center gap-1.5"
      >
        {reserveSlots.map((slotIdx) => {
          const entry = partyDigimons.find((p) => p.slotIndex === slotIdx) ?? null;
          const form = entry ? getDigimonFormProfile(entry.activeFormId) : null;
          const partyNumber = slotIdx + 2;

          return (
            <button
              key={`reserve-circle-${slotIdx}`}
              type="button"
              onClick={() => onSelectPartyReserve?.(slotIdx)}
              title={
                entry && form
                  ? `Trocar para ${entry.nickname ?? form.name} (Nv.${entry.level} · ${entry.hatchGrade}/5)`
                  : `Slot reserva ${partyNumber} vago — carregue até 3 Digimons com você`
              }
              aria-label={
                entry && form
                  ? `Trocar para ${entry.nickname ?? form.name} no slot ${partyNumber}`
                  : `Slot reserva ${partyNumber} vago`
              }
              style={
                entry && form
                  ? {
                      boxShadow: `0 0 10px ${form.theme.glowRgba}, inset 0 0 6px rgba(0,110,255,0.75)`,
                    }
                  : undefined
              }
              className={`group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 sm:h-10 sm:w-10 ${
                entry && form
                  ? 'dmo-ring p-[2px] hover:scale-105'
                  : 'border border-cyan-300/45 bg-[#03102d]/82 shadow-[inset_0_0_8px_rgba(14,165,233,0.28)] hover:border-cyan-200/75 hover:bg-[#051a48]/90'
              }`}
            >
              {entry && form ? (
                <>
                  <div className="h-full w-full overflow-hidden rounded-full bg-gradient-to-b from-[#0b2f78] to-[#04102b] p-0.5">
                    <img
                      src={form.portraitUrl}
                      alt={entry.nickname ?? form.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span className="dmo-frame absolute -bottom-1 -right-1 z-20 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[8px] font-black tabular-nums text-white">
                    {entry.level}
                  </span>
                </>
              ) : (
                <div className="flex h-[74%] w-[74%] items-center justify-center rounded-full border border-dashed border-cyan-300/35 bg-[#02091f]/75">
                  <span className="text-[9px] font-black tabular-nums text-cyan-300/45 group-hover:text-cyan-200/80">
                    {partyNumber}
                  </span>
                </div>
              )}
            </button>
          );
        })}

        {/* Quiet contextual AI / active skill status line beside circles if active */}
        {showStatus && (
          <span className="ml-1 max-w-[126px] truncate text-[9px] font-bold tracking-wide text-cyan-100/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] sm:max-w-[144px]">
            {statusText}
          </span>
        )}
      </div>
    </div>
  );
});
