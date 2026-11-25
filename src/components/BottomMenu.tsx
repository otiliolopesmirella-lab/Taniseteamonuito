import { Gift, Headset, Settings, Trophy } from 'lucide-react';
import type { ModalSection } from '../types/auth';
import { playDigitalTone } from '../utils/soundFx';

interface BottomMenuProps {
  soundEnabled: boolean;
  onSelect: (section: ModalSection) => void;
}

const MENU_ITEMS: Array<{
  id: ModalSection;
  label: string;
  icon: typeof Settings;
  iconColorClass: string;
}> = [
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    iconColorClass: 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]',
  },
  {
    id: 'ranking',
    label: 'Ranking',
    icon: Trophy,
    iconColorClass: 'text-[#ffd43b] drop-shadow-[0_0_8px_rgba(255,212,59,0.65)]',
  },
  {
    id: 'events',
    label: 'Eventos',
    icon: Gift,
    iconColorClass: 'text-[#ffd43b] drop-shadow-[0_0_8px_rgba(255,212,59,0.65)]',
  },
  {
    id: 'support',
    label: 'Suporte',
    icon: Headset,
    iconColorClass: 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]',
  },
];

export function BottomMenu({ soundEnabled, onSelect }: BottomMenuProps) {
  return (
    <nav
      aria-label="Menu inferior"
      className="relative z-10 mx-auto w-full max-w-[392px] px-3.5 pt-3 sm:px-4"
    >
      <div className="grid grid-cols-4 gap-1.5 xs:gap-2">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="clip-cyber-hex bg-gradient-to-b from-[#33e6ff] via-[#008cff] to-[#33e6ff] p-[1.5px] shadow-[0_0_14px_rgba(0,166,255,0.4)] transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97]"
            >
              <button
                type="button"
                onClick={() => {
                  playDigitalTone('click', soundEnabled);
                  onSelect(item.id);
                }}
                className="clip-cyber-hex flex min-h-[66px] w-full flex-col items-center justify-center gap-1 bg-gradient-to-b from-[#0b2a66] via-[#061840] to-[#040f2b] px-1 py-2 text-center transition-colors hover:from-[#103882] hover:to-[#071a47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <Icon
                  className={`h-5 w-5 shrink-0 sm:h-[22px] sm:w-[22px] ${item.iconColorClass}`}
                  aria-hidden="true"
                />
                <span className="w-full truncate text-[10px] font-bold tracking-tight text-white xs:text-[10.5px] sm:text-[11px]">
                  {item.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
