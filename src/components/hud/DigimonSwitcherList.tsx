import { memo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  getDigimonFormProfile,
  type DigimonFormProfile,
} from '../../types/digimon';
import type { ArchivedDigimonEntry, DigimonRuntimeStats } from '../../types/hud';

interface DigimonSwitcherListProps {
  activeDigimon: DigimonFormProfile;
  stats: DigimonRuntimeStats;
  partyDigimons?: readonly ArchivedDigimonEntry[];
  onSelectPartyReserve?: (reserveIndex: 0 | 1) => void;
  onSelectEmptySlot: (slotIndex: number) => void;
  onSelectActiveDigimon: () => void;
}

export const DigimonSwitcherList = memo(function DigimonSwitcherList({
  activeDigimon,
  stats,
  partyDigimons = [],
  onSelectPartyReserve,
  onSelectEmptySlot,
  onSelectActiveDigimon,
}: DigimonSwitcherListProps) {
  const [collapsed, setCollapsed] = useState(false);

  const hpPct = Math.max(
    0,
    Math.min(100, (stats.hp / Math.max(1, stats.maxHp)) * 100)
  );

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto hidden flex-col items-start select-none sm:flex"
    >
      {!collapsed && (
        <div className="flex flex-col gap-1">
          {/* Slot 1: Active Partner Digimon */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onSelectActiveDigimon}
              className="group relative flex items-center text-left transition-transform active:scale-95"
            >
              <div className="dmo-ring relative z-20 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full p-0.5">
                <img
                  src={activeDigimon.portraitUrl}
                  alt={activeDigimon.name}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="dmo-frame -ml-3 flex w-[104px] flex-col justify-center rounded-r-full py-1 pl-4 pr-2.5 sm:w-[116px]">
                <div className="flex items-center justify-between text-[9.5px] font-black text-white">
                  <span className="tabular-nums">Lv. {stats.level}</span>
                  <span
                    className="truncate text-[8.5px] font-extrabold"
                    style={{ color: activeDigimon.theme.accentHex }}
                  >
                    {stats.nickname ?? activeDigimon.name}
                  </span>
                </div>
                <div className="dmo-well relative mt-0.5 h-2.5 w-full overflow-hidden rounded-full">
                  <div
                    className="dmo-hp-fill h-full transition-[width] duration-200"
                    style={{ width: `${hpPct}%` }}
                  />
                  <span className="absolute inset-0 flex items-center pl-1.5 text-[7px] font-black text-white/95 drop-shadow">
                    HP
                  </span>
                </div>
              </div>
            </button>

            <svg
              aria-label="Parceiro ativo"
              viewBox="0 0 18 22"
              className="h-5 w-4 shrink-0 drop-shadow-[0_0_6px_rgba(74,222,128,0.85)]"
            >
              <polygon
                points="2,2 16,11 2,20"
                fill="#4ade80"
                stroke="#052e16"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Slots 2 & 3: Reserve Party Digimons (synced with 2 HUD circles) */}
          {([0, 1] as const).map((reserveIdx) => {
            const slotNum = reserveIdx + 2;
            const entry =
              partyDigimons.find((p) => p.slotIndex === reserveIdx) ?? null;
            const form = entry
              ? getDigimonFormProfile(entry.activeFormId)
              : null;

            if (entry && form) {
              const resHpPct = Math.max(
                0,
                Math.min(100, (entry.hp / Math.max(1, entry.maxHp)) * 100)
              );
              return (
                <button
                  key={`switcher-slot-${slotNum}`}
                  type="button"
                  onClick={() => onSelectPartyReserve?.(reserveIdx)}
                  title={`Clique para ativar ${entry.nickname ?? form.name} (Nv.${entry.level})`}
                  className="hidden items-center text-left transition-transform hover:brightness-110 active:scale-95 sm:flex"
                >
                  <div
                    className="dmo-ring relative z-20 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full p-0.5"
                    style={{
                      boxShadow: `0 0 8px ${form.theme.glowRgba}`,
                    }}
                  >
                    <img
                      src={form.portraitUrl}
                      alt={entry.nickname ?? form.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="dmo-frame -ml-3 flex w-[104px] flex-col justify-center rounded-r-full py-1 pl-4 pr-2.5 sm:w-[116px]">
                    <div className="flex items-center justify-between text-[9.5px] font-black text-white">
                      <span className="tabular-nums">Lv. {entry.level}</span>
                      <span
                        className="truncate text-[8.5px] font-extrabold"
                        style={{ color: form.theme.accentHex }}
                      >
                        {entry.nickname ?? form.name}
                      </span>
                    </div>
                    <div className="dmo-well relative mt-0.5 h-2.5 w-full overflow-hidden rounded-full">
                      <div
                        className="dmo-hp-fill h-full transition-[width] duration-200"
                        style={{ width: `${resHpPct}%` }}
                      />
                      <span className="absolute inset-0 flex items-center pl-1.5 text-[7px] font-black text-white/95 drop-shadow">
                        HP
                      </span>
                    </div>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={`switcher-slot-${slotNum}`}
                type="button"
                onClick={() => onSelectEmptySlot(slotNum)}
                title={`Slot ${slotNum} vago — traga Digimons do Digimon Archive para andar com até 3 parceiros`}
                className="hidden items-center text-left opacity-75 transition-opacity hover:opacity-100 sm:flex"
              >
                <div className="dmo-ring relative z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                  <span className="text-[10px] font-black text-cyan-300/55">
                    {slotNum}
                  </span>
                </div>
                <div className="dmo-frame -ml-3 flex w-[104px] flex-col justify-center rounded-r-full py-1 pl-4 pr-2.5 sm:w-[116px]">
                  <div className="flex items-center justify-between text-[9.5px] font-black text-sky-200/75">
                    <span>Lv. --</span>
                    <span className="text-[8px] font-bold text-cyan-300/60">
                      Vago
                    </span>
                  </div>
                  <div className="dmo-well mt-0.5 h-2.5 w-full rounded-full" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Beveled Collapse Chevron Tab */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={
          collapsed ? 'Expandir lista de Digimons' : 'Recolher lista de Digimons'
        }
        className="dmo-frame ml-11 mt-0.5 flex h-4 w-9 items-center justify-center rounded-b-lg text-cyan-100 hover:brightness-110"
      >
        {collapsed ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
});
