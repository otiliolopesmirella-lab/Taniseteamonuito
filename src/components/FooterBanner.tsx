export function FooterBanner() {
  return (
    <footer className="relative z-10 mt-auto flex justify-center px-4 pt-4">
      <div className="relative flex w-full max-w-[330px] items-center justify-center">
        {/* Left diagonal neon accent stripes */}
        <div aria-hidden="true" className="mr-1.5 flex gap-1">
          <span className="h-6 w-2 -skew-x-[24deg] bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" />
          <span className="h-6 w-1.5 -skew-x-[24deg] bg-[#1aa3ff]/75" />
        </div>

        {/* Center chamfered tagline ribbon */}
        <div className="clip-footer-ribbon flex-1 bg-gradient-to-r from-[#00bfff] via-[#4de6ff] to-[#00bfff] p-[1.5px] pb-0 shadow-[0_0_16px_rgba(0,185,255,0.45)]">
          <div className="clip-footer-ribbon bg-gradient-to-b from-[#08245a] via-[#05163c] to-[#030b21] px-4 py-2 text-center">
            <p className="text-xs font-extrabold leading-tight tracking-wide text-white sm:text-[13px]">
              Uma Nova Jornada
            </p>
            <p className="text-xs font-extrabold leading-tight tracking-wide text-white sm:text-[13px]">
              no{' '}
              <span className="italic text-[#ffd43b] drop-shadow-[0_1px_4px_rgba(255,190,0,0.45)]">
                Mundo Digital!
              </span>
            </p>
          </div>
        </div>

        {/* Right diagonal neon accent stripes */}
        <div aria-hidden="true" className="ml-1.5 flex gap-1">
          <span className="h-6 w-1.5 skew-x-[24deg] bg-[#1aa3ff]/75" />
          <span className="h-6 w-2 skew-x-[24deg] bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]" />
        </div>
      </div>
    </footer>
  );
}
