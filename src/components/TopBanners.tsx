export function TopBanners() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between">
      {/* Top-left corner atmospheric scrim to ensure crisp readability over background art */}
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 h-24 w-44 bg-[radial-gradient(ellipse_at_top_left,rgba(3,14,43,0.92)_35%,transparent_78%)]"
      />
      {/* Top-right corner atmospheric scrim */}
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 h-24 w-44 bg-[radial-gradient(ellipse_at_top_right,rgba(3,14,43,0.92)_35%,transparent_78%)]"
      />

      {/* Left Cyber Banner */}
      <div className="relative drop-shadow-[0_4px_12px_rgba(0,180,255,0.45)]">
        <div className="clip-banner-left bg-gradient-to-r from-[#00d4ff] via-[#1aa3ff] to-[#0077ff] pb-[1.5px] pr-[1.5px]">
          <div className="clip-banner-left bg-gradient-to-br from-[#061e4d] via-[#041438] to-[#082c6b] px-2.5 py-1 pr-5 sm:px-4 sm:py-2 sm:pr-7">
            <p className="text-[9.5px] font-bold leading-tight tracking-wide text-white sm:text-xs">
              Bem-vindo ao
            </p>
            <p className="text-[10.5px] font-extrabold leading-tight tracking-wide text-sky-100 sm:text-[12.5px]">
              DigiLegends
            </p>
            <p className="text-[11px] font-extrabold italic leading-tight tracking-wide text-[#ffd43b] drop-shadow-[0_1px_4px_rgba(255,190,0,0.45)] sm:text-[13.5px]">
              Idle!
            </p>
          </div>
        </div>
      </div>

      {/* Right Cyber Banner */}
      <div className="relative drop-shadow-[0_4px_12px_rgba(0,180,255,0.45)]">
        <div className="clip-banner-right bg-gradient-to-l from-[#00d4ff] via-[#1aa3ff] to-[#0077ff] pb-[1.5px] pl-[1.5px]">
          <div className="clip-banner-right bg-gradient-to-bl from-[#061e4d] via-[#041438] to-[#082c6b] px-2.5 py-1 pl-5 text-right sm:px-4 sm:py-2 sm:pl-7">
            <p className="text-[9.5px] font-bold leading-tight tracking-wide text-white sm:text-xs">
              Jogue, Evolua,
            </p>
            <p className="text-[10.5px] font-extrabold leading-tight tracking-wide text-white sm:text-[12.5px]">
              Faça{' '}
              <span className="italic text-[#ffd43b] drop-shadow-[0_1px_4px_rgba(255,190,0,0.45)]">
                Novos Amigos!
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
