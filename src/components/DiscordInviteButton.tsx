import { ExternalLink } from 'lucide-react';
import { playDigitalTone } from '../utils/soundFx';

export const DISCORD_INVITE_URL = 'https://discord.gg/RjEmD9ytx';

function DiscordMark({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

interface DiscordInviteButtonProps {
  variant: 'login' | 'settings';
  soundEnabled?: boolean;
}

export function DiscordInviteButton({
  variant,
  soundEnabled = true,
}: DiscordInviteButtonProps) {
  if (variant === 'login') {
    return (
      <div className="absolute left-[14.2%] top-[81.4%] flex h-[6.8%] min-h-[44px] w-[71.6%] rounded-2xl border border-indigo-300/55 bg-[linear-gradient(180deg,rgba(26,28,74,0.96)_0%,rgba(12,14,42,0.98)_100%)] p-1 shadow-[0_0_20px_rgba(88,101,242,0.38)]">
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => playDigitalTone('click', soundEnabled)}
          aria-label="Entrar na comunidade oficial do Discord"
          className="flex h-full w-full items-center justify-center gap-2 rounded-xl border border-indigo-200/75 bg-[linear-gradient(180deg,#6c78ff_0%,#5865F2_55%,#3f49c4_100%)] px-3 text-xs font-extrabold tracking-wide text-white shadow-[0_0_14px_rgba(88,101,242,0.42)] transition-all duration-150 hover:border-amber-200/90 hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 sm:text-sm"
        >
          <DiscordMark className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
          <span className="truncate whitespace-nowrap drop-shadow">
            Comunidade no Discord
          </span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <div className="pt-1 border-t border-indigo-400/20">
      <a
        href={DISCORD_INVITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => playDigitalTone('click', soundEnabled)}
        aria-label="Entrar na comunidade oficial do jogo no Discord"
        className="flex min-h-[46px] w-full items-center justify-between gap-2.5 rounded-xl border border-indigo-300/55 bg-[linear-gradient(180deg,#5865F2_0%,#4752C4_100%)] px-3.5 py-2.5 text-white shadow-[0_6px_18px_rgba(88,101,242,0.3)] transition-all duration-150 hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <DiscordMark className="h-4.5 w-4.5 text-white" />
          </span>
          <span className="min-w-0 text-left">
            <span className="block truncate text-xs font-extrabold leading-tight text-white">
              Entrar no Discord Oficial
            </span>
            <span className="block truncate text-[10.5px] font-medium text-indigo-100/85">
              Avisos, eventos, trocas e suporte da comunidade
            </span>
          </span>
        </span>
        <ExternalLink className="h-4 w-4 shrink-0 text-indigo-100" aria-hidden="true" />
      </a>
    </div>
  );
}
