import { Check } from 'lucide-react';
import type { CharacterSelectCardProfile } from './characterSelectModel';
import { TamerOriginalArtworkCanvas } from './TamerOriginalArtworkCanvas';

interface TamerSelectionCardProps {
  profile: CharacterSelectCardProfile;
  index: number;
  isSelected: boolean;
  hasAnySelection: boolean;
  selectionTimestamp: number;
  animationsEnabled: boolean;
  onSelect: () => void;
}

export function TamerSelectionCard({
  profile,
  index,
  isSelected,
  hasAnySelection,
  selectionTimestamp,
  animationsEnabled,
  onSelect,
}: TamerSelectionCardProps) {
  const { palette } = profile;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${profile.displayName} (${profile.colorName}) — ${profile.gender}, ${profile.description}`}
      data-testid={`tamer-card-${profile.id}`}
      data-selected={isSelected ? 'true' : 'false'}
      onClick={onSelect}
      style={{
        animationDelay: animationsEnabled ? `${index * 80}ms` : '0ms',
        boxShadow: isSelected
          ? `0 0 20px ${palette.glowRgba}, 0 0 8px ${palette.neonLight}`
          : `0 6px 14px rgba(0, 6, 24, 0.72), 0 0 6px ${palette.softGlowRgba}`,
      }}
      className={`group relative flex w-full min-w-0 flex-col rounded-xl text-left transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030c28] ${
        animationsEnabled ? 'animate-tamer-card-enter' : ''
      } ${
        isSelected
          ? 'z-10 -translate-y-1 scale-[1.035] opacity-100'
          : hasAnySelection
            ? 'opacity-82 hover:-translate-y-0.5 hover:opacity-100 active:scale-[0.98]'
            : 'opacity-96 hover:-translate-y-0.5 hover:opacity-100 active:scale-[0.98]'
      }`}
    >
      {/* Outer Chamfered Animated Neon Border Shell */}
      <div
        className="clip-tamer-card relative flex h-full w-full flex-col overflow-hidden p-[2.5px] sm:p-[3px]"
        style={{
          background: isSelected
            ? `linear-gradient(180deg, #ffffff 0%, ${palette.neonLight} 20%, ${palette.neonBorder} 52%, ${palette.neonLight} 85%, #ffffff 100%)`
            : `linear-gradient(180deg, ${palette.neonLight}dd 0%, ${palette.neonBorder}cc 52%, ${palette.neonDeep}ee 100%)`,
        }}
      >
        {/* Orbiting Animated Neon Energy Border Sweep (active card only) */}
        {isSelected && animationsEnabled && (
          <div
            aria-hidden="true"
            className="animate-tamer-neon-orbit pointer-events-none absolute -inset-[75%] z-0 opacity-95"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, transparent 65deg, ${palette.neonLight} 110deg, #ffffff 132deg, ${palette.neonBorder} 160deg, transparent 210deg, transparent 295deg, ${palette.neonLight} 335deg, transparent 360deg)`,
            }}
          />
        )}

        {/* Inner Futuristic Card Surface */}
        <div
          className="clip-tamer-card relative z-10 flex h-full w-full flex-col overflow-hidden bg-[#020a24]"
          style={{
            background: palette.cardGradient,
          }}
        >
          {/* Selected Specular Holographic Sheen Sweep */}
          {isSelected && animationsEnabled && (
            <div
              aria-hidden="true"
              className="animate-tamer-glow-sweep pointer-events-none absolute inset-y-0 left-0 z-30 w-1/2"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${palette.neonLight}42 48%, rgba(255,255,255,0.45) 54%, transparent 100%)`,
              }}
            />
          )}

          {/* Top Gender Header Bar matching Reference Image (♂ Menino / ♀ Menina) */}
          <div
            className="relative z-20 flex items-center justify-center gap-1.5 border-b px-2 py-1.5 sm:py-2"
            style={{
              background: palette.badgeBg,
              borderColor: `${palette.neonLight}75`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 10px ${palette.softGlowRgba}`,
            }}
          >
            <span
              aria-hidden="true"
              className="text-xs font-black leading-none sm:text-sm"
              style={{
                color: palette.neonLight,
                textShadow: `0 0 8px ${palette.glowRgba}`,
              }}
            >
              {profile.genderSymbol}
            </span>
            <span className="truncate font-[family-name:var(--font-sans)] text-xs font-extrabold italic tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] sm:text-sm">
              {profile.gender}
            </span>
          </div>

          {/* Exact Original Character Artwork Stage with 60 FPS Idle, Breathing & Eye Blinks */}
          <div className="relative z-10 aspect-[274/412] w-full overflow-hidden bg-[#030b24]">
            {isSelected && (
              <span
                aria-hidden="true"
                className="absolute right-2 top-2 z-30 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gradient-to-b from-[#fff59d] via-[#ffd43b] to-[#d97706] text-[#1a0d00] shadow-[0_0_14px_rgba(255,216,74,0.95)]"
              >
                <Check className="h-3.5 w-3.5 stroke-[3.4]" />
              </span>
            )}

            {/* Inner Neon Edge Highlight */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 ${
                isSelected ? 'opacity-100' : 'opacity-45 group-hover:opacity-75'
              }`}
              style={{
                boxShadow: isSelected
                  ? `inset 0 0 18px ${palette.glowRgba}, inset 0 0 4px #ffffff`
                  : `inset 0 0 10px ${palette.softGlowRgba}`,
              }}
            />

            <TamerOriginalArtworkCanvas
              profile={profile}
              isSelected={isSelected}
              selectionTimestamp={selectionTimestamp}
              animationsEnabled={animationsEnabled}
            />
          </div>

          {/* Bottom Personality Description Plate matching Reference Image */}
          <div
            className="relative z-20 flex min-h-[54px] flex-col items-center justify-center border-t px-1.5 py-1.5 text-center sm:min-h-[60px] sm:px-2 sm:py-2"
            style={{
              background: palette.nameplateBg,
              borderColor: isSelected
                ? `${palette.neonLight}cc`
                : `${palette.neonLight}60`,
              boxShadow: isSelected
                ? `inset 0 1px 0 rgba(255,255,255,0.45), inset 0 0 14px ${palette.softGlowRgba}`
                : 'inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <p
              className="text-[11px] font-extrabold italic leading-[1.2] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] sm:text-xs"
              style={
                isSelected
                  ? {
                      textShadow: `0 0 10px ${palette.glowRgba}, 0 1px 2px rgba(0,0,0,0.95)`,
                    }
                  : undefined
              }
            >
              {profile.description}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
