import { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { playDigitalTone } from '../utils/soundFx';

interface PWAInstallButtonProps {
  variant?: 'banner' | 'compact';
  soundEnabled?: boolean;
  showInstalledState?: boolean;
}

export function PWAInstallButton({
  variant = 'banner',
  soundEnabled = true,
  showInstalledState = false,
}: PWAInstallButtonProps) {
  const { canInstall, isInstalled, isIOS, installing, install } =
    usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    if (!showInstalledState) return null;
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/35 bg-emerald-950/40 px-3.5 py-2.5 text-xs text-emerald-100">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
        <span>App instalado na tela inicial (modo tela cheia ativo).</span>
      </div>
    );
  }

  if (!canInstall && !isIOS) {
    return null;
  }

  async function handleAction() {
    playDigitalTone('click', soundEnabled);
    if (canInstall) {
      const result = await install();
      if (result === 'accepted') {
        playDigitalTone('confirm', soundEnabled);
      }
      return;
    }
    if (isIOS) {
      setShowIOSGuide(true);
    }
  }

  return (
    <>
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={() => {
            void handleAction();
          }}
          disabled={installing}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-cyan-300/50 bg-gradient-to-r from-[#08306b] via-[#0a4b9e] to-[#08306b] px-3.5 py-2 text-xs font-extrabold tracking-wide text-cyan-50 shadow-[0_0_16px_rgba(0,195,255,0.28)] transition-transform hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
        >
          {canInstall ? (
            <Download className="h-4 w-4 shrink-0 text-cyan-200" />
          ) : (
            <Smartphone className="h-4 w-4 shrink-0 text-cyan-200" />
          )}
          <span>
            {installing
              ? 'INSTALANDO APP...'
              : canInstall
                ? 'INSTALAR APP NO DISPOSITIVO'
                : 'ADICIONAR À TELA DE INÍCIO (iOS)'}
          </span>
        </button>
      ) : (
        <div className="mx-3 mt-2.5 overflow-hidden rounded-xl border border-cyan-400/45 bg-gradient-to-r from-[#071f4d]/95 via-[#092b69]/95 to-[#06193e]/95 p-3 shadow-[0_0_20px_rgba(0,174,255,0.24)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-300/40 bg-[#04122e] text-cyan-200">
                {canInstall ? (
                  <Download className="h-5 w-5" />
                ) : (
                  <Smartphone className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold tracking-wide text-white">
                  Instalar DigiLegends no Celular
                </p>
                <p className="text-[11px] leading-snug text-sky-100/80">
                  Jogue em tela cheia com acesso rápido pela tela inicial.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                void handleAction();
              }}
              disabled={installing}
              className="flex min-h-[44px] shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-[#ffe259] to-[#e66f00] px-3.5 text-xs font-extrabold tracking-wide text-[#081226] shadow-[0_0_12px_rgba(255,174,0,0.4)] transition-transform active:scale-[0.97] disabled:opacity-70"
            >
              {installing ? '...' : canInstall ? 'INSTALAR' : 'COMO INSTALAR'}
            </button>
          </div>
        </div>
      )}

      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          className="fixed inset-0 z-[70] flex items-end justify-center bg-[#020714]/85 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-[400px] rounded-t-2xl border border-cyan-400/50 bg-gradient-to-b from-[#09204f] via-[#051435] to-[#030c22] p-4 shadow-[0_0_32px_rgba(0,180,255,0.45)] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-sky-400/20 pb-3">
              <div className="flex items-center gap-2">
                <Share className="h-4 w-4 text-cyan-300" />
                <h3
                  id="ios-install-title"
                  className="text-sm font-extrabold tracking-wide text-white"
                >
                  Instalar no iPhone / iPad
                </h3>
              </div>
              <button
                type="button"
                aria-label="Fechar instruções"
                onClick={() => setShowIOSGuide(false)}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-sky-500/15 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ol className="mt-3 space-y-2.5 text-xs leading-relaxed text-sky-100/90">
              <li className="flex items-start gap-2.5 rounded-lg border border-sky-400/20 bg-[#040e24]/85 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cyan-500/25 font-extrabold text-cyan-200">
                  1
                </span>
                <span>
                  Toque no botão <strong>Compartilhar</strong> na barra inferior
                  do Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5 rounded-lg border border-sky-400/20 bg-[#040e24]/85 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cyan-500/25 font-extrabold text-cyan-200">
                  2
                </span>
                <span>
                  Role as opções e toque em{' '}
                  <strong>Adicionar à Tela de Início</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5 rounded-lg border border-sky-400/20 bg-[#040e24]/85 p-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cyan-500/25 font-extrabold text-cyan-200">
                  3
                </span>
                <span>
                  Toque em <strong>Adicionar</strong> no canto superior direito
                  para abrir o DigiLegends em tela cheia.
                </span>
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-b from-[#21a8ff] to-[#0055d4] text-xs font-extrabold tracking-wide text-white"
            >
              ENTENDI
            </button>
          </div>
        </div>
      )}
    </>
  );
}
