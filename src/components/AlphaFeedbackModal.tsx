import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Bug,
  CheckCircle2,
  Lightbulb,
  Loader2,
  MessageSquarePlus,
  Scale,
  Send,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import { auth } from '../firebase';
import {
  deleteMyAlphaFeedback,
  listAllAlphaFeedbackForGm,
  listMyAlphaFeedback,
  submitAlphaFeedback,
  type AlphaFeedbackCategory,
  type AlphaFeedbackItem,
} from '../services/feedbackService';
import { playDigitalTone } from '../utils/soundFx';

interface AlphaFeedbackModalProps {
  open: boolean;
  username?: string;
  tamerName?: string;
  screenContext: string;
  soundEnabled: boolean;
  isGM?: boolean;
  onClose: () => void;
}

const CATEGORY_OPTIONS: {
  id: AlphaFeedbackCategory;
  label: string;
  icon: typeof Bug;
}[] = [
  { id: 'bug', label: 'Bug / Erro', icon: Bug },
  { id: 'suggestion', label: 'Sugestão', icon: Lightbulb },
  { id: 'balance', label: 'Balanceamento', icon: Scale },
  { id: 'other', label: 'Outro', icon: MessageSquarePlus },
];

const CATEGORY_LABELS: Record<AlphaFeedbackCategory, string> = {
  bug: 'Bug / Erro',
  suggestion: 'Sugestão',
  balance: 'Balanceamento',
  other: 'Outro',
};

function formatDateTime(ms: number): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ms));
  } catch {
    return '';
  }
}

export function AlphaFeedbackModal({
  open,
  username,
  tamerName,
  screenContext,
  soundEnabled,
  isGM = false,
  onClose,
}: AlphaFeedbackModalProps) {
  const [category, setCategory] = useState<AlphaFeedbackCategory>('bug');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [history, setHistory] = useState<AlphaFeedbackItem[]>([]);
  const [gmViewMode, setGmViewMode] = useState<'all' | 'mine'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const isAuthenticated = Boolean(
    auth.currentUser && auth.currentUser.emailVerified
  );
  const showingAllReports = isGM && gmViewMode === 'all';

  useEffect(() => {
    if (!open) return;
    setStatusMsg(null);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    if (isAuthenticated) {
      let active = true;
      setLoadingHistory(true);
      const loader = showingAllReports
        ? listAllAlphaFeedbackForGm
        : listMyAlphaFeedback;
      loader()
        .then((items) => {
          if (active) setHistory(items);
        })
        .catch((err) => {
          console.error('Could not load alpha feedback history:', err);
        })
        .finally(() => {
          if (active) setLoadingHistory(false);
        });
      return () => {
        active = false;
        window.removeEventListener('keydown', onKeyDown);
      };
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, isAuthenticated, showingAllReports, onClose]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatusMsg(null);

    if (!isAuthenticated) {
      playDigitalTone('error', soundEnabled);
      setStatusMsg({
        type: 'error',
        text: 'Entre na sua conta verificada primeiro para enviar um relato da versão Alfa.',
      });
      return;
    }

    const trimmed = message.trim();
    if (trimmed.length < 5) {
      playDigitalTone('error', soundEnabled);
      setStatusMsg({
        type: 'error',
        text: 'Escreva pelo menos 5 caracteres explicando o bug ou sugestão.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const created = await submitAlphaFeedback({
        username: username || auth.currentUser?.displayName || 'DomadorAlfa',
        tamerName: tamerName || '',
        category,
        screenContext,
        message: trimmed,
      });
      playDigitalTone('confirm', soundEnabled);
      setMessage('');
      setHistory((prev) => [created, ...prev].slice(0, 20));
      setStatusMsg({
        type: 'success',
        text: 'Relato enviado para o servidor Alfa com sucesso! Obrigado por testar.',
      });
    } catch (error) {
      playDigitalTone('error', soundEnabled);
      const raw =
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar o relato agora. Tente novamente.';
      const friendly = raw.startsWith('{')
        ? 'Sem permissão ou conexão para salvar no servidor agora. Tente novamente.'
        : raw;
      setStatusMsg({ type: 'error', text: friendly });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(reportId: string) {
    setDeletingId(reportId);
    try {
      await deleteMyAlphaFeedback(reportId);
      playDigitalTone('click', soundEnabled);
      setHistory((prev) => prev.filter((item) => item.id !== reportId));
    } catch (error) {
      console.error('Failed to delete report:', error);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="alpha-feedback-title"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      className="fixed inset-0 z-[65] flex items-end justify-center bg-[#020714]/82 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] overflow-hidden rounded-t-2xl border border-cyan-400/55 bg-gradient-to-b from-[#092356] via-[#051435] to-[#030b20] shadow-[0_0_36px_rgba(0,180,255,0.45)] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-400/25 bg-[#082b72]/85 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Bug className="h-5 w-5 text-[#ffd43b]" aria-hidden="true" />
            <div>
              <h2
                id="alpha-feedback-title"
                className="text-sm font-extrabold tracking-wide text-white"
              >
                Feedback &amp; Bugs — Versão Alfa
              </h2>
              <p className="text-[11px] text-cyan-200/80">
                Salvo direto na nuvem para análise da equipe
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              playDigitalTone('click', soundEnabled);
              onClose();
            }}
            aria-label="Fechar janela de feedback"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-sky-500/15 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[78dvh] overflow-y-auto px-4 py-4">
          {!isAuthenticated ? (
            <div className="rounded-xl border border-amber-400/40 bg-amber-950/35 p-3.5 text-xs leading-relaxed text-amber-100">
              <p className="font-extrabold text-amber-200">
                Faça login para enviar relatos
              </p>
              <p className="mt-1 text-amber-100/85">
                Para evitar spam na versão Alfa, os relatos de bugs e sugestões
                ficam vinculados à sua conta de Domador verificada. Entre no
                jogo e abra <strong>Configurações &rarr; Reportar Bug</strong> a
                qualquer momento.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <p className="mb-1.5 text-xs font-bold text-sky-100">
                  Tipo de relato
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const active = category === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          playDigitalTone('click', soundEnabled);
                          setCategory(opt.id);
                        }}
                        className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2.5 text-xs font-extrabold transition-colors ${
                          active
                            ? 'border-[#ffd43b] bg-amber-500/20 text-[#ffd43b]'
                            : 'border-sky-400/25 bg-[#040e24] text-slate-200 hover:border-cyan-300/50'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="alpha-feedback-message"
                    className="text-xs font-bold text-sky-100"
                  >
                    Descreva o que aconteceu
                  </label>
                  <span className="text-[11px] tabular-nums text-sky-200/75">
                    {message.trim().length}/600
                  </span>
                </div>
                <textarea
                  id="alpha-feedback-message"
                  rows={4}
                  maxLength={600}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex.: Na Planície Digital perto da cachoeira, o Digimon travou ao cruzar a ponte..."
                  className="w-full resize-none rounded-xl border border-sky-400/35 bg-[#040e24] p-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none"
                />
              </div>

              {statusMsg && (
                <div
                  role="status"
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                    statusMsg.type === 'success'
                      ? 'border-emerald-400/50 bg-emerald-950/60 text-emerald-100'
                      : 'border-rose-400/50 bg-rose-950/60 text-rose-100'
                  }`}
                >
                  {statusMsg.type === 'success' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                  )}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#ffe259] to-[#e66f00] px-4 py-2.5 text-sm font-extrabold tracking-wide text-[#081226] shadow-[0_0_16px_rgba(255,174,0,0.45)] transition-transform active:scale-[0.98] disabled:opacity-70"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{submitting ? 'ENVIANDO...' : 'ENVIAR RELATO ALFA'}</span>
              </button>
            </form>
          )}

          {/* Recent submissions (normal players: own only; GM: all players or own) */}
          {isAuthenticated && (
            <div className="mt-4 border-t border-sky-400/20 pt-3.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-cyan-200">
                  {showingAllReports && (
                    <Shield className="h-3.5 w-3.5 text-[#ffd43b]" />
                  )}
                  <span>
                    {showingAllReports
                      ? `Relatos dos Jogadores (${history.length})`
                      : `Meus envios recentes (${history.length})`}
                  </span>
                </h3>
                {loadingHistory && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />
                )}
              </div>

              {isGM && (
                <div className="mb-2.5 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      playDigitalTone('click', soundEnabled);
                      setGmViewMode('all');
                    }}
                    className={`min-h-[36px] rounded-lg border text-[11px] font-extrabold transition-colors ${
                      gmViewMode === 'all'
                        ? 'border-[#ffd43b] bg-amber-500/20 text-[#ffd43b]'
                        : 'border-sky-400/25 bg-[#040e24] text-slate-300'
                    }`}
                  >
                    Todos os Relatos (GM)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playDigitalTone('click', soundEnabled);
                      setGmViewMode('mine');
                    }}
                    className={`min-h-[36px] rounded-lg border text-[11px] font-extrabold transition-colors ${
                      gmViewMode === 'mine'
                        ? 'border-cyan-300 bg-cyan-500/20 text-cyan-100'
                        : 'border-sky-400/25 bg-[#040e24] text-slate-300'
                    }`}
                  >
                    Meus Relatos
                  </button>
                </div>
              )}

              {!loadingHistory && history.length === 0 ? (
                <p className="rounded-lg border border-sky-400/15 bg-[#040e24]/70 px-3 py-2.5 text-[11px] text-slate-300">
                  {showingAllReports
                    ? 'Nenhum relato de jogadores enviado ainda.'
                    : 'Você ainda não enviou relatos nesta conta.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-sky-400/20 bg-[#040e24]/85 p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-[#ffd43b]">
                          {CATEGORY_LABELS[item.category]}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10.5px] tabular-nums text-slate-400">
                            {formatDateTime(item.createdAtMs)}
                          </span>
                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => {
                              void handleDelete(item.id);
                            }}
                            aria-label="Remover relato"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-500/20 hover:text-rose-200 disabled:opacity-50"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      {showingAllReports && (
                        <p className="mt-0.5 text-[10.5px] font-semibold text-cyan-200/80">
                          {item.username}
                          {item.tamerName ? ` (${item.tamerName})` : ''} ·{' '}
                          {item.screenContext} · {item.deviceInfo}
                        </p>
                      )}
                      <p className="mt-1 whitespace-pre-wrap break-words text-[11.5px] leading-relaxed text-sky-100/90">
                        {item.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
