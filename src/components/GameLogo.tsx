interface GameLogoProps {
  variant?: 'overlap' | 'standalone';
}

export function GameLogo({ variant = 'overlap' }: GameLogoProps) {
  const marginClass =
    variant === 'standalone' ? 'mt-0 pt-1' : '-mt-12 sm:-mt-14';

  return (
    <header
      className={`relative z-10 ${marginClass} flex flex-col items-center px-3 pb-2 text-center select-none`}
    >
      {/* Glowing Cyan Orbital Energy Ring behind the logo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 flex -translate-y-1/2 justify-center"
      >
        <svg
          viewBox="0 0 420 110"
          className="h-24 w-[94%] max-w-[390px] overflow-visible drop-shadow-[0_0_14px_rgba(0,220,255,0.85)]"
        >
          <defs>
            <linearGradient id="cyberRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#80f4ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#009dff" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <ellipse
            cx="210"
            cy="56"
            rx="196"
            ry="34"
            fill="none"
            stroke="url(#cyberRingGrad)"
            strokeWidth="4.5"
            strokeDasharray="480 45"
            transform="rotate(-2 210 56)"
          />
          <ellipse
            cx="210"
            cy="56"
            rx="184"
            ry="27"
            fill="none"
            stroke="#38bdf8"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            transform="rotate(-2 210 56)"
          />
        </svg>
      </div>

      {/* Main Title: DIGIMON WORLD */}
      <h1 className="relative flex flex-col items-center leading-none">
        <span className="relative inline-block -skew-x-6 font-[family-name:var(--font-display)] text-[28px] tracking-tight sm:text-[34px]">
          {/* Outer dark outline layer */}
          <span
            aria-hidden="true"
            className="absolute inset-0 text-[#041434] [-webkit-text-stroke:6px_#041434] drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]"
          >
            DIGIMON WORLD
          </span>
          {/* Metallic gold gradient layer */}
          <span className="relative bg-gradient-to-b from-[#fff8c9] via-[#ffd028] to-[#e66a00] bg-clip-text text-transparent drop-shadow-[0_2px_0_rgba(120,45,0,0.9)]">
            DIGIMON WORLD
          </span>
        </span>

        {/* Subtitle: DIGITAL WAR */}
        <span className="relative -mt-1 inline-flex items-center gap-2 -skew-x-6 font-[family-name:var(--font-display)] text-[21px] tracking-[0.06em] sm:text-[25px]">
          <span
            aria-hidden="true"
            className="hidden h-[3px] w-5 bg-gradient-to-r from-transparent to-[#00e5ff] xs:inline-block"
          />
          <span className="relative">
            <span
              aria-hidden="true"
              className="absolute inset-0 text-[#04163a] [-webkit-text-stroke:5px_#04163a] drop-shadow-[0_3px_8px_rgba(0,180,255,0.65)]"
            >
              DIGITAL WAR
            </span>
            <span className="relative bg-gradient-to-b from-[#ffffff] via-[#d7efff] to-[#6eb8ff] bg-clip-text text-transparent">
              DIGITAL WAR
            </span>
          </span>
          <span
            aria-hidden="true"
            className="hidden h-[3px] w-5 bg-gradient-to-l from-transparent to-[#00e5ff] xs:inline-block"
          />
        </span>
      </h1>
    </header>
  );
}
