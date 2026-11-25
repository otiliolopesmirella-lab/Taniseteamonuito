import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
} from 'lucide-react';
import {
  authService,
  getStoredRememberPreference,
  persistRememberPreference,
} from '../services/authService';
import type { AuthUserSummary, ModalSection } from '../types/auth';
import { playDigitalTone } from '../utils/soundFx';

const LOGIN_ART_SRC =
  '/assets/aistudio/file_00000000643c820e8e22410567e57bde_d41ede40.webp';

interface LoginCardProps {
  soundEnabled: boolean;
  onOpenModal: (section: ModalSection) => void;
  onLoginSuccess?: (user: AuthUserSummary) => void;
}

export function LoginCard({
  soundEnabled,
  onOpenModal,
  onLoginSuccess,
}: LoginCardProps) {
  const initialStored = getStoredRememberPreference();

  const [username, setUsername] = useState(initialStored.username);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState<boolean>(
    initialStored.username ? initialStored.rememberMe : true
  );
  const [imageFailed, setImageFailed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const busy = isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    playDigitalTone('click', soundEnabled);
    setIsSubmitting(true);
    setNeedsVerification(false);
    setStatusFeedback(null);

    try {
      const result = await authService.signInWithCredentials({
        username,
        password,
        rememberMe,
      });

      if (!result.success) {
        playDigitalTone('error', soundEnabled);
        setNeedsVerification(Boolean(result.requiresEmailVerification));
        setStatusFeedback({ type: 'error', text: result.message });
      } else {
        persistRememberPreference(
          rememberMe,
          result.user?.username ?? username
        );
        playDigitalTone('confirm', soundEnabled);
        setStatusFeedback({ type: 'success', text: result.message });
        if (result.user && onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      }
    } catch {
      playDigitalTone('error', soundEnabled);
      setStatusFeedback({
        type: 'error',
        text: 'Não foi possível entrar agora. Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirmVerifiedEmail() {
    if (busy) return;
    playDigitalTone('click', soundEnabled);
    setIsSubmitting(true);
    const result = await authService.reloadVerifiedUser(username);
    setIsSubmitting(false);

    if (!result.success) {
      playDigitalTone('error', soundEnabled);
      setStatusFeedback({ type: 'error', text: result.message });
      return;
    }

    setNeedsVerification(false);
    persistRememberPreference(rememberMe, result.user?.username ?? username);
    playDigitalTone('confirm', soundEnabled);
    setStatusFeedback({ type: 'success', text: result.message });
    if (result.user && onLoginSuccess) {
      onLoginSuccess(result.user);
    }
  }

  async function handleResendVerification() {
    if (busy) return;
    playDigitalTone('click', soundEnabled);
    setIsSubmitting(true);
    const result = await authService.resendVerificationEmail();
    setIsSubmitting(false);
    playDigitalTone(result.success ? 'confirm' : 'error', soundEnabled);
    setStatusFeedback({
      type: result.success ? 'info' : 'error',
      text: result.message,
    });
  }

  return (
    <section
      aria-label="Tela de login DigiLegends Idle"
      className="relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden overflow-y-auto bg-[#020a24] sm:py-3"
    >
      {/* Full-bleed blurred ambient backdrop so ultra-tall phones and desktop have zero harsh bars */}
      {!imageFailed && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden"
        >
          <img
            src={LOGIN_ART_SRC}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full scale-110 object-cover object-center opacity-55 blur-2xl"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(4,28,88,0.35),rgba(2,8,28,0.82)_80%)]" />
        </div>
      )}

      {/* Exact 941x1672 portrait mobile stage — full width on phones, viewport-fitted on desktop */}
      <div className="relative z-10 aspect-[941/1672] w-full max-w-[460px] shrink-0 overflow-hidden bg-[#030e2c] shadow-[0_0_55px_rgba(0,174,255,0.35)] sm:h-[calc(100svh-1.5rem)] sm:max-h-[860px] sm:w-auto sm:max-w-none sm:rounded-[28px] sm:border sm:border-cyan-300/35">
        {!imageFailed ? (
          <img
            src={LOGIN_ART_SRC}
            alt="DigiLegends Idle — Sua Jornada no Mundo Digital Começa Aqui"
            referrerPolicy="no-referrer"
            loading="eager"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="pointer-events-none h-full w-full select-none object-fill"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-between bg-gradient-to-b from-[#07266e] via-[#041542] to-[#020922] px-6 py-12 text-center">
            <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-wider text-amber-300">
              DIGILEGENDS IDLE
            </h1>
            <p className="text-sm font-semibold text-cyan-200">
              Sua Jornada no Mundo Digital Começa Aqui!
            </p>
          </div>
        )}

        {/* Top-Right Configurações interactive trigger aligned to artwork */}
        <button
          type="button"
          onClick={() => {
            playDigitalTone('click', soundEnabled);
            onOpenModal('settings');
          }}
          aria-label="Abrir configurações"
          className="absolute right-[2.2%] top-[0.9%] z-20 flex h-[5.4%] min-h-[44px] w-[33.2%] cursor-pointer items-center justify-center rounded-xl transition-all duration-150 hover:bg-cyan-300/12 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <span className="sr-only">Configurações</span>
        </button>

        {/* Login Form aligned to artwork + Criar Conta button */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="absolute inset-0 z-10"
        >
          {/* 1. Campo Usuário ou E-mail */}
          <label htmlFor="login-identifier" className="sr-only">
            Usuário ou E-mail
          </label>
          <input
            id="login-identifier"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Digite seu usuário ou e-mail"
            className="absolute left-[25.5%] top-[41.0%] h-[5.0%] w-[61.5%] rounded-md bg-[linear-gradient(180deg,#051a54_0%,#031038_100%)] px-2 text-sm font-medium text-white placeholder:text-sky-200/70 focus:outline-none focus:ring-2 focus:ring-cyan-300/80"
          />

          {/* 2. Campo Senha + Botão Mostrar/Ocultar */}
          <label htmlFor="login-password" className="sr-only">
            Senha
          </label>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua senha"
            className="absolute left-[25.5%] top-[48.2%] h-[5.0%] w-[50.5%] rounded-md bg-[linear-gradient(180deg,#051a54_0%,#031038_100%)] px-2 text-sm font-medium text-white placeholder:text-sky-200/70 focus:outline-none focus:ring-2 focus:ring-cyan-300/80"
          />
          <button
            type="button"
            onClick={() => {
              playDigitalTone('click', soundEnabled);
              setShowPassword((prev) => !prev);
            }}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute left-[76.2%] top-[48.2%] flex h-[5.0%] w-[9.5%] cursor-pointer items-center justify-center rounded-md bg-[linear-gradient(180deg,#051a54_0%,#031038_100%)] text-sky-100 transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            {showPassword ? (
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            ) : (
              <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            )}
          </button>

          {/* 3. Checkbox Lembrar-me */}
          <button
            type="button"
            role="checkbox"
            aria-checked={rememberMe}
            aria-label="Lembrar-me"
            onClick={() => {
              playDigitalTone('click', soundEnabled);
              setRememberMe((prev) => !prev);
            }}
            className="absolute left-[11.5%] top-[54.8%] flex h-[4.0%] w-[36%] cursor-pointer items-center rounded-md transition-colors hover:bg-cyan-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <span
              aria-hidden="true"
              className={`ml-[1.6%] flex aspect-square h-[74%] items-center justify-center rounded-[5px] border transition-colors ${
                rememberMe
                  ? 'border-cyan-300 bg-[#072a7a] text-[#3cecff] shadow-[0_0_8px_rgba(56,232,255,0.45)]'
                  : 'border-cyan-400/60 bg-[#031036]'
              }`}
            >
              {rememberMe && <Check className="h-3.5 w-3.5 stroke-[3.2]" />}
            </span>
            <span className="sr-only">Lembrar-me</span>
          </button>

          {/* 4. Link Esqueceu sua senha? */}
          <button
            type="button"
            onClick={() => {
              playDigitalTone('click', soundEnabled);
              onOpenModal('forgot-password');
            }}
            aria-label="Esqueceu sua senha?"
            className="absolute right-[10.8%] top-[54.8%] h-[4.0%] w-[33.5%] cursor-pointer rounded-md transition-colors hover:bg-cyan-300/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <span className="sr-only">Esqueceu sua senha?</span>
          </button>

          {/* 5. Botão Dourado ENTRAR */}
          <button
            type="submit"
            disabled={busy}
            aria-label="Entrar no jogo"
            className="clip-cyber-btn absolute left-[14.2%] top-[60.2%] flex h-[9.0%] w-[71.6%] cursor-pointer items-center justify-center transition-all duration-150 hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:cursor-wait"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2 rounded-full bg-[#091a3d]/92 px-4 py-1.5 text-sm font-extrabold tracking-wider text-amber-200 shadow-lg">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ENTRANDO...
              </span>
            ) : (
              <span className="sr-only">Entrar</span>
            )}
          </button>

          {/* 6. Botão CRIAR CONTA */}
          <div className="absolute left-[14.2%] top-[72.2%] flex h-[7.8%] min-h-[48px] w-[71.6%] rounded-2xl border border-cyan-300/45 bg-[linear-gradient(180deg,rgba(4,20,66,0.98)_0%,rgba(2,10,36,0.98)_100%)] p-1 shadow-[0_0_22px_rgba(0,174,255,0.34)]">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                playDigitalTone('click', soundEnabled);
                onOpenModal('register');
              }}
              aria-label="Criar Conta"
              className="flex h-full w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-cyan-200/80 bg-[linear-gradient(180deg,#0f62d6_0%,#07368e_55%,#041a52_100%)] px-3 text-xs font-extrabold tracking-wide text-white shadow-[0_0_14px_rgba(0,185,255,0.38)] transition-all duration-150 hover:border-amber-300/90 hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-wait disabled:opacity-75 sm:text-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyan-200/60 bg-cyan-400/20 text-cyan-100 shadow-sm">
                <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="truncate drop-shadow">Criar Conta</span>
            </button>
          </div>

          {/* Inline floating status / validation feedback banner (only appears when needed) */}
          {statusFeedback && (
            <div
              role="status"
              aria-live="polite"
              className={`absolute left-[7%] right-[7%] top-[80.8%] z-30 flex flex-col gap-2 rounded-xl border px-3 py-2 text-xs font-semibold leading-snug shadow-[0_8px_24px_rgba(0,0,0,0.82)] backdrop-blur-md ${
                statusFeedback.type === 'success'
                  ? 'border-emerald-300/70 bg-emerald-950/92 text-emerald-100'
                  : statusFeedback.type === 'info'
                    ? 'border-cyan-300/70 bg-[#051a48]/95 text-cyan-100'
                    : 'border-rose-400/80 bg-rose-950/92 text-rose-100'
              }`}
            >
              <div className="flex items-start gap-2">
                {statusFeedback.type === 'success' ? (
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertCircle
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      statusFeedback.type === 'info'
                        ? 'text-cyan-300'
                        : 'text-rose-300'
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span>{statusFeedback.text}</span>
              </div>

              {needsVerification && (
                <div className="flex flex-wrap gap-2 pl-6">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      void handleConfirmVerifiedEmail();
                    }}
                    className="rounded-lg bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold text-[#081226] transition-transform active:scale-95"
                  >
                    Já confirmei — Entrar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      void handleResendVerification();
                    }}
                    className="rounded-lg border border-cyan-300/60 bg-[#061c48] px-2.5 py-1 text-[11px] font-bold text-cyan-100 transition-colors hover:bg-[#0b2a68]"
                  >
                    Reenviar e-mail
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
