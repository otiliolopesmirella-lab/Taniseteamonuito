import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Gift,
  Headset,
  KeyRound,
  Loader2,
  Mail,
  Music2,
  RotateCcw,
  Settings,
  Trophy,
  UserPlus,
  X,
} from 'lucide-react';
import { authService } from '../services/authService';
import {
  DEFAULT_APP_PREFERENCES,
  type AppPreferences,
  type AuthUserSummary,
  type ModalSection,
} from '../types/auth';
import { playDigitalTone } from '../utils/soundFx';
import { PWAInstallButton } from './PWAInstallButton';

interface UtilityModalProps {
  section: ModalSection | null;
  preferences: AppPreferences;
  onUpdatePreferences: (next: AppPreferences) => void;
  onAccountCreated?: (user: AuthUserSummary) => void;
  onClose: () => void;
}

const TOP_TAMERS = [
  { rank: 1, name: 'TaiKamiya', partner: 'WarGreymon', points: 14820 },
  { rank: 2, name: 'MattIshida', partner: 'MetalGarurumon', points: 14290 },
  { rank: 3, name: 'TakaishiTK', partner: 'MagnaAngemon', points: 13640 },
  { rank: 4, name: 'IzzyKoushiro', partner: 'MegaKabuterimon', points: 12910 },
  { rank: 5, name: 'SoraTakenouchi', partner: 'Garudamon', points: 12450 },
];

const ACTIVE_EVENTS = [
  {
    title: 'Portal de Abertura do Mundo Digital',
    period: 'Ativo esta semana',
    summary:
      'Domadores que vincularem sua conta recebem emblema comemorativo na entrada do servidor.',
  },
  {
    title: 'Expedição Ilha Arquivo',
    period: 'Fim de semana',
    summary:
      'Experiência em dobro para evoluções iniciais de Agumon, Gabumon e Patamon.',
  },
];

export function UtilityModal({
  section,
  preferences,
  onUpdatePreferences,
  onAccountCreated,
  onClose,
}: UtilityModalProps) {
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [resetIdentifier, setResetIdentifier] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    setFeedback(null);
    setSubmitting(false);
    setAwaitingVerification(false);
  }, [section]);

  useEffect(() => {
    if (!section) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [section, onClose]);

  if (!section) return null;

  async function handleRegisterSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    const res = await authService.createAccount({
      username: regUsername,
      email: regEmail,
      password: regPassword,
      confirmPassword: regConfirm,
    });
    setSubmitting(false);
    playDigitalTone(
      res.success ? 'confirm' : 'error',
      preferences.soundEnabled
    );
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.requiresEmailVerification) {
      setAwaitingVerification(true);
      return;
    }
    if (res.success && res.user && onAccountCreated) {
      onAccountCreated(res.user);
    }
  }

  async function handleVerifyAndEnter() {
    setSubmitting(true);
    setFeedback(null);
    const res = await authService.reloadVerifiedUser(regUsername);
    setSubmitting(false);
    playDigitalTone(
      res.success ? 'confirm' : 'error',
      preferences.soundEnabled
    );
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.success && res.user && onAccountCreated) {
      setAwaitingVerification(false);
      onAccountCreated(res.user);
    }
  }

  async function handleResendVerify() {
    setSubmitting(true);
    const res = await authService.resendVerificationEmail();
    setSubmitting(false);
    playDigitalTone(
      res.success ? 'confirm' : 'error',
      preferences.soundEnabled
    );
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  }

  async function handleResetSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    const res = await authService.sendPasswordReset(resetIdentifier);
    setSubmitting(false);
    playDigitalTone(
      res.success ? 'confirm' : 'error',
      preferences.soundEnabled
    );
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  }

  const headerMeta: Record<
    ModalSection,
    { title: string; icon: typeof Settings; accent: string }
  > = {
    register: {
      title: 'Criar Conta de Domador',
      icon: UserPlus,
      accent: 'text-cyan-300',
    },
    'forgot-password': {
      title: 'Recuperar Senha',
      icon: KeyRound,
      accent: 'text-cyan-300',
    },
    settings: {
      title: 'Configurações',
      icon: Settings,
      accent: 'text-white',
    },
    ranking: {
      title: 'Ranking de Domadores',
      icon: Trophy,
      accent: 'text-[#ffd43b]',
    },
    events: {
      title: 'Eventos Digitais',
      icon: Gift,
      accent: 'text-[#ffd43b]',
    },
    support: {
      title: 'Suporte ao Jogador',
      icon: Headset,
      accent: 'text-cyan-300',
    },
  };

  const current = headerMeta[section];
  const HeaderIcon = current.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#020714]/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] rounded-t-2xl border border-cyan-400/50 bg-gradient-to-b from-[#09204f] via-[#051435] to-[#030c22] shadow-[0_0_32px_rgba(0,180,255,0.4)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-400/20 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <HeaderIcon className={`h-5 w-5 ${current.accent}`} aria-hidden="true" />
            <h2
              id="modal-title"
              className="text-base font-extrabold tracking-wide text-white"
            >
              {current.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              playDigitalTone('click', preferences.soundEnabled);
              onClose();
            }}
            aria-label="Fechar janela"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-sky-500/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[75dvh] overflow-y-auto px-4 py-4">
          {section === 'register' && (
            <form onSubmit={handleRegisterSubmit} noValidate className="space-y-3">
              <p className="text-xs leading-relaxed text-sky-100/80">
                Crie sua conta com usuário, e-mail e senha. Todo o progresso do
                seu Tamer, Digimon, níveis e itens ficará salvo automaticamente
                na nuvem.
              </p>

              {!awaitingVerification ? (
                <>
                  <div>
                    <label
                      htmlFor="reg-username"
                      className="mb-1 block text-xs font-semibold text-sky-100"
                    >
                      Usuário
                    </label>
                    <input
                      id="reg-username"
                      type="text"
                      maxLength={24}
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Ex.: TaiKamiya"
                      className="h-11 w-full rounded-lg border border-sky-400/35 bg-[#040e24] px-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reg-email"
                      className="mb-1 block text-xs font-semibold text-sky-100"
                    >
                      E-mail
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="domador@exemplo.com"
                      className="h-11 w-full rounded-lg border border-sky-400/35 bg-[#040e24] px-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="reg-password"
                        className="mb-1 block text-xs font-semibold text-sky-100"
                      >
                        Senha
                      </label>
                      <input
                        id="reg-password"
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mín. 6 caracteres"
                        className="h-11 w-full rounded-lg border border-sky-400/35 bg-[#040e24] px-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="reg-confirm"
                        className="mb-1 block text-xs font-semibold text-sky-100"
                      >
                        Confirmar senha
                      </label>
                      <input
                        id="reg-confirm"
                        type="password"
                        value={regConfirm}
                        onChange={(e) => setRegConfirm(e.target.value)}
                        placeholder="Repita a senha"
                        className="h-11 w-full rounded-lg border border-sky-400/35 bg-[#040e24] px-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-cyan-400/40 bg-[#04112e]/95 p-3.5 text-xs leading-relaxed text-sky-100">
                  <p className="font-extrabold text-cyan-200">
                    Confirme seu e-mail para ativar o salvamento na nuvem
                  </p>
                  <p className="mt-1 text-sky-100/85">
                    Abra o link enviado para{' '}
                    <strong className="text-white">{regEmail}</strong> e depois
                    clique em <strong>Já confirmei — Entrar</strong>.
                  </p>
                </div>
              )}

              {feedback && (
                <div
                  role="status"
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                    feedback.type === 'success'
                      ? 'border-emerald-400/50 bg-emerald-950/60 text-emerald-100'
                      : 'border-rose-400/50 bg-rose-950/60 text-rose-100'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}

              {!awaitingVerification ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#21a8ff] to-[#0055d4] px-4 py-2.5 text-sm font-extrabold tracking-wide text-white shadow-[0_0_16px_rgba(0,174,255,0.4)] transition-transform active:scale-[0.98] disabled:opacity-75"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>
                    {submitting ? 'CRIANDO CONTA...' : 'CONCLUIR CADASTRO'}
                  </span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleVerifyAndEnter}
                    className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#ffe259] to-[#e66f00] px-4 py-2.5 text-sm font-extrabold tracking-wide text-[#081226] shadow-[0_0_16px_rgba(255,174,0,0.45)] transition-transform active:scale-[0.98] disabled:opacity-75"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>JÁ CONFIRMEI — ENTRAR</span>
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleResendVerify}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/45 bg-[#061c48] px-4 py-2 text-xs font-extrabold tracking-wide text-cyan-100 transition-colors hover:bg-[#0b2a68] disabled:opacity-75"
                  >
                    REENVIAR E-MAIL DE VERIFICAÇÃO
                  </button>
                </div>
              )}
            </form>
          )}

          {section === 'forgot-password' && (
            <form onSubmit={handleResetSubmit} noValidate className="space-y-3">
              <p className="text-xs leading-relaxed text-sky-100/80">
                Informe seu e-mail ou nome de usuário para preparar o envio do
                link de redefinição de senha.
              </p>

              <div className="relative">
                <label
                  htmlFor="reset-identifier"
                  className="mb-1 block text-xs font-semibold text-sky-100"
                >
                  E-mail ou Usuário
                </label>
                <div className="flex items-center rounded-lg border border-sky-400/35 bg-[#040e24] px-3 focus-within:border-cyan-300">
                  <Mail className="mr-2 h-4 w-4 text-sky-300" aria-hidden="true" />
                  <input
                    id="reset-identifier"
                    type="text"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    placeholder="domador@exemplo.com"
                    className="h-11 w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {feedback && (
                <div
                  role="status"
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                    feedback.type === 'success'
                      ? 'border-emerald-400/50 bg-emerald-950/60 text-emerald-100'
                      : 'border-rose-400/50 bg-rose-950/60 text-rose-100'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#ffe259] to-[#e66f00] px-4 py-2.5 text-sm font-extrabold tracking-wide text-[#081226] shadow-[0_0_16px_rgba(255,174,0,0.45)] transition-transform active:scale-[0.98] disabled:opacity-75"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>
                  {submitting ? 'ENVIANDO...' : 'ENVIAR REDEFINIÇÃO'}
                </span>
              </button>
            </form>
          )}

          {section === 'settings' && (
            <div className="space-y-3">
              {/* Audio & Music */}
              <div className="flex items-center justify-between rounded-xl border border-sky-400/20 bg-[#040e24]/80 px-3.5 py-2.5">
                <div>
                  <p className="text-sm font-bold text-white">
                    Efeitos sonoros
                  </p>
                  <p className="text-xs text-slate-300">
                    Cliques, ações, combate e notificações
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.soundEnabled}
                  onClick={() => {
                    const next = !preferences.soundEnabled;
                    onUpdatePreferences({ ...preferences, soundEnabled: next });
                    if (next) playDigitalTone('confirm', true);
                  }}
                  className={`min-h-[40px] min-w-[74px] rounded-lg border px-3 text-xs font-extrabold transition-colors ${
                    preferences.soundEnabled
                      ? 'border-cyan-300 bg-cyan-500/25 text-cyan-200'
                      : 'border-slate-600 bg-slate-800/70 text-slate-300'
                  }`}
                >
                  {preferences.soundEnabled ? 'ATIVO' : 'MUDO'}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-sky-400/20 bg-[#040e24]/80 px-3.5 py-2.5">
                <div>
                  <p className="text-sm font-bold text-white">
                    Música de fundo
                  </p>
                  <p className="text-xs text-slate-300">
                    Trilha sonora do DATS Center e seleção
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.musicEnabled}
                  onClick={() => {
                    playDigitalTone('click', preferences.soundEnabled);
                    onUpdatePreferences({
                      ...preferences,
                      musicEnabled: !preferences.musicEnabled,
                    });
                  }}
                  className={`min-h-[40px] min-w-[74px] rounded-lg border px-3 text-xs font-extrabold transition-colors ${
                    preferences.musicEnabled
                      ? 'border-cyan-300 bg-cyan-500/25 text-cyan-200'
                      : 'border-slate-600 bg-slate-800/70 text-slate-300'
                  }`}
                >
                  {preferences.musicEnabled ? 'ATIVO' : 'MUDO'}
                </button>
              </div>

              <div className="rounded-xl border border-sky-400/20 bg-[#040e24]/80 px-3.5 py-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                    <Music2 className="h-4 w-4 text-cyan-300" />
                    <span>Volume da música</span>
                  </span>
                  <span className="text-xs font-extrabold tabular-nums text-[#ffd43b]">
                    {preferences.musicEnabled
                      ? `${preferences.musicVolume}%`
                      : 'Mudo'}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  disabled={!preferences.musicEnabled}
                  value={preferences.musicVolume}
                  onChange={(e) =>
                    onUpdatePreferences({
                      ...preferences,
                      musicVolume: Number(e.target.value),
                    })
                  }
                  aria-label="Volume da música"
                  className="h-2 w-full cursor-pointer accent-cyan-400 disabled:cursor-not-allowed disabled:opacity-45"
                />
              </div>

              {/* Graphics & Interface */}
              <div className="flex items-center justify-between rounded-xl border border-sky-400/20 bg-[#040e24]/80 px-3.5 py-2.5">
                <div>
                  <p className="text-sm font-bold text-white">
                    Animações e partículas
                  </p>
                  <p className="text-xs text-slate-300">
                    Efeitos luminosos sutis no cenário
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.animationsEnabled}
                  onClick={() => {
                    playDigitalTone('click', preferences.soundEnabled);
                    onUpdatePreferences({
                      ...preferences,
                      animationsEnabled: !preferences.animationsEnabled,
                    });
                  }}
                  className={`min-h-[40px] min-w-[74px] rounded-lg border px-3 text-xs font-extrabold transition-colors ${
                    preferences.animationsEnabled
                      ? 'border-cyan-300 bg-cyan-500/25 text-cyan-200'
                      : 'border-slate-600 bg-slate-800/70 text-slate-300'
                  }`}
                >
                  {preferences.animationsEnabled ? 'ATIVO' : 'DESL.'}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-sky-400/20 bg-[#040e24]/80 px-3.5 py-2.5">
                <div>
                  <p className="text-sm font-bold text-white">
                    Números de dano e EXP
                  </p>
                  <p className="text-xs text-slate-300">
                    Mostrar dano flutuante durante batalhas
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences.showFloatingDamage}
                  onClick={() => {
                    playDigitalTone('click', preferences.soundEnabled);
                    onUpdatePreferences({
                      ...preferences,
                      showFloatingDamage: !preferences.showFloatingDamage,
                    });
                  }}
                  className={`min-h-[40px] min-w-[74px] rounded-lg border px-3 text-xs font-extrabold transition-colors ${
                    preferences.showFloatingDamage
                      ? 'border-cyan-300 bg-cyan-500/25 text-cyan-200'
                      : 'border-slate-600 bg-slate-800/70 text-slate-300'
                  }`}
                >
                  {preferences.showFloatingDamage ? 'ATIVO' : 'DESL.'}
                </button>
              </div>

              <div className="rounded-xl border border-sky-400/20 bg-[#040e24]/80 px-3.5 py-3">
                <p className="mb-2 text-sm font-bold text-white">
                  Desempenho gráfico
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(['alta', 'equilibrada'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        playDigitalTone('click', preferences.soundEnabled);
                        onUpdatePreferences({
                          ...preferences,
                          graphicsQuality: mode,
                        });
                      }}
                      className={`min-h-[42px] rounded-lg border text-xs font-bold transition-colors ${
                        preferences.graphicsQuality === mode
                          ? 'border-[#ffd43b] bg-amber-500/20 text-[#ffd43b]'
                          : 'border-sky-400/25 bg-[#061534] text-slate-300'
                      }`}
                    >
                      {mode === 'alta' ? 'Alta Fidelidade' : 'Econômica'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-sky-400/20 bg-[#040e24]/80 px-3.5 py-3">
                <p className="mb-2 text-sm font-bold text-white">
                  Tamanho do minimapa
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'compacto', label: 'Compacto' },
                      { id: 'padrao', label: 'Padrão' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        playDigitalTone('click', preferences.soundEnabled);
                        onUpdatePreferences({
                          ...preferences,
                          minimapSize: opt.id,
                        });
                      }}
                      className={`min-h-[40px] rounded-lg border text-xs font-bold transition-colors ${
                        preferences.minimapSize === opt.id
                          ? 'border-cyan-300 bg-cyan-500/25 text-cyan-100'
                          : 'border-sky-400/25 bg-[#061534] text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playDigitalTone('confirm', true);
                  onUpdatePreferences({ ...DEFAULT_APP_PREFERENCES });
                }}
                className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-amber-300/45 bg-amber-500/15 px-3 text-xs font-extrabold text-amber-200 hover:bg-amber-500/25 active:scale-[0.98]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restaurar Configurações Padrão</span>
              </button>

              <PWAInstallButton
                variant="compact"
                soundEnabled={preferences.soundEnabled}
                showInstalledState
              />
            </div>
          )}

          {section === 'ranking' && (
            <div className="space-y-2">
              <p className="pb-1 text-xs text-sky-100/80">
                Classificação atual dos principais domadores do servidor.
              </p>
              {TOP_TAMERS.map((entry) => (
                <div
                  key={entry.rank}
                  className="flex items-center justify-between rounded-xl border border-sky-400/20 bg-[#040e24]/85 px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-extrabold tabular-nums ${
                        entry.rank === 1
                          ? 'bg-amber-400/20 text-[#ffd43b]'
                          : 'bg-sky-500/15 text-sky-200'
                      }`}
                    >
                      {entry.rank}º
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {entry.name}
                      </p>
                      <p className="text-xs text-sky-200/75">{entry.partner}</p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold tabular-nums text-[#ffd43b]">
                    {entry.points.toLocaleString('pt-BR')} pts
                  </span>
                </div>
              ))}
            </div>
          )}

          {section === 'events' && (
            <div className="space-y-3">
              {ACTIVE_EVENTS.map((ev) => (
                <article
                  key={ev.title}
                  className="rounded-xl border border-sky-400/25 bg-[#040e24]/85 p-3.5"
                >
                  <p className="text-xs font-semibold text-[#ffd43b]">
                    {ev.period}
                  </p>
                  <h3 className="mt-0.5 text-sm font-extrabold text-white">
                    {ev.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    {ev.summary}
                  </p>
                </article>
              ))}
            </div>
          )}

          {section === 'support' && (
            <div className="space-y-3 text-xs leading-relaxed text-slate-200">
              <div className="rounded-xl border border-sky-400/25 bg-[#040e24]/85 p-3.5">
                <p className="text-sm font-bold text-white">
                  Problemas ao acessar sua conta?
                </p>
                <p className="mt-1 text-slate-300">
                  Você pode criar uma conta própria tocando em{' '}
                  <strong>Criar Conta</strong> ou usar o acesso rápido de GM na
                  tela inicial. Se criar uma conta por e-mail, lembre-se de
                  confirmar o link enviado para sua caixa de entrada ou spam.
                </p>
              </div>
              <div className="rounded-xl border border-sky-400/25 bg-[#040e24]/85 p-3.5">
                <p className="text-sm font-bold text-white">
                  Compatibilidade Android
                </p>
                <p className="mt-1 text-slate-300">
                  Interface otimizada para Chrome Mobile e navegadores Android
                  em modo retrato. Caso perceba lentidão, ative o modo
                  Econômico em Configurações.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
