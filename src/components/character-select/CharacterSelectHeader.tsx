import { useEffect, useRef } from 'react';
import { ChevronsLeft, ChevronsRight, Volume2, VolumeX } from 'lucide-react';
import { loadCharacterSelectReferenceImage } from './TamerOriginalArtworkCanvas';

interface CharacterSelectHeaderProps {
  soundEnabled: boolean;
  animationsEnabled?: boolean;
  onToggleSound?: () => void;
}

/**
 * Exact original DIGILEGENDS IDLE logo slice from the user's reference artwork
 * (`1199 x 1312`), preserving every gold letter, orbital arc, and crest intact,
 * framed over slowly rotating holographic silver/blue tech rings with metallic sheen.
 */
function PreservedDigiLegendsLogo({
  animationsEnabled,
}: {
  animationsEnabled: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let mounted = true;
    const W = 640;
    const H = 292;
    canvas.width = W;
    canvas.height = H;

    void loadCharacterSelectReferenceImage().then((img) => {
      if (!mounted || !img || !img.complete || img.naturalWidth === 0) return;

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw exact original DIGILEGENDS Idle logo + crest from reference image (x: 280..920, y: 4..294)
      ctx.drawImage(img, 280, 4, 640, 290, 0, 0, W, H);

      // Soft radial feathered edge mask so the dark cyber sky around the logo melts invisibly
      // into the live animated backdrop & rotating tech rings
      ctx.globalCompositeOperation = 'destination-in';
      const maskGrad = ctx.createRadialGradient(
        W * 0.5,
        H * 0.49,
        H * 0.34,
        W * 0.5,
        H * 0.5,
        W * 0.5
      );
      maskGrad.addColorStop(0, 'rgba(255,255,255,1)');
      maskGrad.addColorStop(0.76, 'rgba(255,255,255,0.98)');
      maskGrad.addColorStop(0.91, 'rgba(255,255,255,0.45)');
      maskGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = maskGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="relative mx-auto flex w-full max-w-[295px] items-center justify-center sm:max-w-[385px] md:max-w-[430px]">
      {/* Slowly Rotating Metallic-Silver & Electric-Blue Holographic Tech Rings Behind Logo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <svg
          viewBox="0 0 320 320"
          className={`h-[122%] w-auto opacity-70 drop-shadow-[0_0_16px_rgba(56,224,255,0.65)] ${
            animationsEnabled ? 'animate-tamer-ring-slow' : ''
          }`}
        >
          <circle
            cx="160"
            cy="160"
            r="142"
            fill="none"
            stroke="#38e8ff"
            strokeWidth="2"
            strokeDasharray="24 12 8 10"
            strokeOpacity="0.7"
          />
          <circle
            cx="160"
            cy="160"
            r="128"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1.5"
            strokeDasharray="6 14"
            strokeOpacity="0.65"
          />
          <circle
            cx="160"
            cy="160"
            r="152"
            fill="none"
            stroke="#ffd43b"
            strokeWidth="1.2"
            strokeDasharray="44 56"
            strokeOpacity="0.55"
          />
        </svg>

        <svg
          viewBox="0 0 260 260"
          className={`absolute h-[94%] w-auto opacity-65 ${
            animationsEnabled ? 'animate-tamer-ring-reverse' : ''
          }`}
        >
          <circle
            cx="130"
            cy="130"
            r="112"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2.5"
            strokeDasharray="16 10 4 10"
          />
          <circle
            cx="130"
            cy="130"
            r="98"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1"
            strokeDasharray="3 9"
            strokeOpacity="0.55"
          />
        </svg>
      </div>

      {/* Exact Preserved DIGILEGENDS IDLE Logo Canvas + Soft Metallic Sheen Overlay */}
      <div className="relative z-10 w-full overflow-hidden rounded-[44%]">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="DIGILEGENDS Idle"
          className="block h-auto w-full drop-shadow-[0_4px_18px_rgba(0,185,255,0.55)]"
        />

        {animationsEnabled && (
          <div
            aria-hidden="true"
            className="animate-tamer-logo-sheen pointer-events-none absolute inset-y-0 left-0 w-[34%] mix-blend-screen"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,248,196,0.55) 45%, rgba(255,255,255,0.8) 52%, rgba(56,232,255,0.45) 62%, transparent 100%)',
            }}
          />
        )}
      </div>
    </div>
  );
}

export function CharacterSelectHeader({
  soundEnabled,
  animationsEnabled = true,
  onToggleSound,
}: CharacterSelectHeaderProps) {
  return (
    <header className="relative z-10 flex w-full flex-col items-center px-2 pt-2 sm:px-4 sm:pt-3">
      {/* Top Row: Reference Symmetrical Neon Ribbons + Sound Toggle */}
      <div className="flex w-full max-w-4xl items-start justify-between gap-1.5 sm:gap-2">
        {/* Left Cyber Ribbon: "Escolha seu Tamer! >>" */}
        <div
          className="clip-tamer-ribbon shrink-0 p-[1.5px] drop-shadow-[0_0_14px_rgba(0,204,255,0.62)]"
          style={{
            background:
              'linear-gradient(90deg, #7ef4ff 0%, #00b8ff 45%, #e2e8f0 72%, #00d4ff 100%)',
          }}
        >
          <div className="clip-tamer-ribbon flex items-center gap-1 bg-gradient-to-br from-[#062362] via-[#04133a] to-[#082c74] px-3 py-1.5 sm:gap-2 sm:px-5 sm:py-2">
            <div className="leading-[1.12]">
              <p className="text-[10px] font-extrabold italic tracking-wide text-white sm:text-xs">
                Escolha seu
              </p>
              <p className="font-[family-name:var(--font-display)] text-xs italic tracking-wide text-[#ffd84a] drop-shadow-[0_1px_6px_rgba(255,196,0,0.65)] sm:text-sm">
                Tamer!
              </p>
            </div>
            <ChevronsRight
              aria-hidden="true"
              className={`h-4 w-4 text-[#38e8ff] sm:h-5 sm:w-5 ${
                animationsEnabled ? 'animate-digiselect-chevron-l' : ''
              }`}
            />
          </div>
        </div>

        {/* Right Side: Sound Control + "Sua Jornada Começa Agora!" Ribbon */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Silenciar áudio' : 'Ativar áudio'}
              title={soundEnabled ? 'Silenciar áudio' : 'Ativar áudio'}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/65 bg-[#051a48]/92 text-cyan-200 shadow-[0_0_12px_rgba(0,195,255,0.38)] transition-all hover:border-cyan-100 hover:bg-[#0b2f78] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4 text-cyan-300" />
              ) : (
                <VolumeX className="h-4 w-4 text-slate-400" />
              )}
            </button>
          )}

          <div
            className="clip-tamer-ribbon shrink-0 p-[1.5px] drop-shadow-[0_0_14px_rgba(0,204,255,0.62)]"
            style={{
              background:
                'linear-gradient(90deg, #00d4ff 0%, #e2e8f0 28%, #00b8ff 65%, #7ef4ff 100%)',
            }}
          >
            <div className="clip-tamer-ribbon flex items-center gap-1 bg-gradient-to-bl from-[#062362] via-[#04133a] to-[#082c74] px-3 py-1.5 text-right sm:gap-2 sm:px-5 sm:py-2">
              <ChevronsLeft
                aria-hidden="true"
                className={`h-4 w-4 text-[#38e8ff] sm:h-5 sm:w-5 ${
                  animationsEnabled ? 'animate-digiselect-chevron-r' : ''
                }`}
              />
              <div className="leading-[1.12]">
                <p className="text-[10px] font-extrabold italic tracking-wide text-white sm:text-xs">
                  Sua Jornada
                </p>
                <p className="text-[10px] font-extrabold italic tracking-wide text-white sm:text-xs">
                  Começa{' '}
                  <span className="font-[family-name:var(--font-display)] italic text-[#ffd84a] drop-shadow-[0_1px_6px_rgba(255,196,0,0.65)]">
                    Agora!
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exact Preserved DIGILEGENDS IDLE Logo + Rotating Holographic Tech Rings */}
      <div className="-mt-1 w-full sm:-mt-8">
        <PreservedDigiLegendsLogo animationsEnabled={animationsEnabled} />
      </div>

      {/* Sub-Header Neon Chamfered Ribbon: "Selecione seu Personagem" */}
      <div className="-mt-1 flex w-full justify-center px-3 sm:-mt-2">
        <div
          className="clip-tamer-ribbon p-[1.5px] drop-shadow-[0_0_18px_rgba(0,196,255,0.75)]"
          style={{
            background:
              'linear-gradient(90deg, #00e5ff 0%, #e2e8f0 24%, #60a5fa 50%, #e2e8f0 76%, #00e5ff 100%)',
          }}
        >
          <div className="clip-tamer-ribbon bg-gradient-to-b from-[#082972] via-[#041748] to-[#020c2b] px-6 py-1.5 sm:px-12 sm:py-2">
            <h1 className="font-[family-name:var(--font-sans)] text-sm font-black italic tracking-wide text-white drop-shadow-[0_1px_8px_rgba(56,232,255,0.75)] sm:text-base md:text-lg">
              Selecione seu Personagem
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
