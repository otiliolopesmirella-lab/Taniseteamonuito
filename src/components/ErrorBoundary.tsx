import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = 'Ocorreu um erro inesperado ao sincronizar seus dados.';
    try {
      const parsed = JSON.parse(error.message) as {
        error?: string;
        operationType?: string;
      };
      if (parsed?.error) {
        if (parsed.error.includes('Quota exceeded')) {
          message =
            'Limite diário de leituras do banco atingido. Tente novamente amanhã.';
        } else if (parsed.error.includes('Missing or insufficient permissions')) {
          message =
            'Permissão recusada ao acessar seu progresso na nuvem. Verifique se seu e-mail foi confirmado e entre novamente.';
        } else {
          message = parsed.error;
        }
      }
    } catch {
      if (error.message) {
        message = error.message;
      }
    }
    return { hasError: true, message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh w-full items-center justify-center bg-gradient-to-b from-[#04102b] via-[#061a42] to-[#020816] p-4 text-white">
          <div className="w-full max-w-[420px] rounded-2xl border border-rose-400/50 bg-[#07193f]/95 p-6 text-center shadow-[0_0_32px_rgba(244,63,94,0.28)]">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-300" />
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-lg tracking-wide text-white">
              FALHA DE SINCRONIZAÇÃO
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-sky-100/90">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-cyan-300/70 bg-cyan-500/25 px-5 py-2.5 text-xs font-extrabold tracking-wide text-white transition-colors hover:bg-cyan-500/35"
            >
              <RotateCcw className="h-4 w-4" />
              <span>RECARREGAR JOGO</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
