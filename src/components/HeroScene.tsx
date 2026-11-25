import { useState } from 'react';
import { TopBanners } from './TopBanners';

interface HeroSceneProps {
  animationsEnabled: boolean;
}

const REFERENCE_ART_SRC =
  '/assets/aistudio/file_000000003960820eb93a26d80190fd74_633cd46f.webp';

export function HeroScene({ animationsEnabled }: HeroSceneProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section
      aria-label="Cenário e personagens de DigiLegends Idle"
      className="relative w-full overflow-hidden bg-[#04102b]"
    >
      <TopBanners />

      {/* Artwork frame showing the upper character, Digimon & Digital Spire showcase */}
      <div className="relative aspect-[1024/608] w-full select-none overflow-hidden">
        {!imageFailed ? (
          <img
            src={REFERENCE_ART_SRC}
            alt="Domador e Digimons no Mundo Digital diante da torre luminosa"
            referrerPolicy="no-referrer"
            loading="eager"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#0a2f73] via-[#061c4a] to-[#04102b]">
            <div className="h-28 w-28 rounded-full border-2 border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_40px_rgba(0,212,255,0.35)]" />
          </div>
        )}

        {/* Subtle luminous digital aura & data motes over the sky */}
        {animationsEnabled && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <span className="animate-float-particle absolute left-[18%] top-[28%] h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
            <span
              className="animate-float-particle absolute right-[20%] top-[22%] h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_10px_#fcd34d]"
              style={{ animationDelay: '1.2s' }}
            />
            <span
              className="animate-float-particle absolute left-[48%] top-[14%] h-1.5 w-1.5 rounded-full bg-sky-200 shadow-[0_0_8px_#bae6fd]"
              style={{ animationDelay: '2.1s' }}
            />
          </div>
        )}

        {/* Smooth bottom gradient dissolve into the lower Digital World backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#04102b] via-[#04102b]/80 to-transparent"
        />
      </div>
    </section>
  );
}
