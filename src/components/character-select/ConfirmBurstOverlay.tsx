import { Sparkles } from 'lucide-react';
import type { CharacterSelectCardProfile } from './characterSelectModel';

interface ConfirmBurstOverlayProps {
  active: boolean;
  profile: CharacterSelectCardProfile | null;
  tamerName: string;
  animationsEnabled: boolean;
}

export function ConfirmBurstOverlay({
  active,
  profile,
  tamerName,
  animationsEnabled,
}: ConfirmBurstOverlayProps) {
  if (!active || !profile) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      data-testid="character-confirm-burst"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#020a24]/82 backdrop-blur-md"
    >
      {/* Expanding Neon Energy Shockwave Rings */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          className={`h-56 w-56 rounded-full border-4 ${
            animationsEnabled ? 'animate-tamer-confirm-ring' : ''
          }`}
          style={{
            borderColor: profile.palette.neonLight,
            boxShadow: `0 0 42px ${profile.palette.glowRgba}, inset 0 0 32px ${profile.palette.glowRgba}`,
          }}
        />
        <div
          className={`absolute h-40 w-40 rounded-full border-2 border-amber-300 ${
            animationsEnabled ? 'animate-tamer-confirm-ring' : ''
          }`}
          style={{
            animationDelay: '120ms',
            boxShadow: '0 0 36px rgba(251, 191, 36, 0.85)',
          }}
        />
      </div>

      {/* Digital Link Confirmation Banner */}
      <div
        className="clip-cyber-panel relative z-10 mx-4 max-w-sm p-[2px]"
        style={{
          background: `linear-gradient(135deg, ${profile.palette.neonLight}, #ffd43b, ${profile.palette.neonBorder})`,
          boxShadow: `0 0 36px ${profile.palette.glowRgba}`,
        }}
      >
        <div className="clip-cyber-panel flex flex-col items-center gap-2 bg-gradient-to-b from-[#071f56] via-[#041338] to-[#020a22] px-7 py-6 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full border-2"
            style={{
              borderColor: profile.palette.neonLight,
              background: profile.palette.badgeBg,
              boxShadow: `0 0 18px ${profile.palette.glowRgba}`,
            }}
          >
            <Sparkles className="h-6 w-6 text-amber-300" />
          </div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-200">
            Conexão Digital Confirmada
          </p>
          <p
            className="font-[family-name:var(--font-display)] text-xl tracking-wide text-white"
            style={{
              textShadow: `0 0 14px ${profile.palette.glowRgba}`,
            }}
          >
            {tamerName.trim()}
          </p>
          <p className="text-xs font-semibold text-sky-100/90">
            {profile.displayName} · {profile.description}
          </p>
        </div>
      </div>
    </div>
  );
}
