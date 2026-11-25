import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-[80] flex w-[calc(100%-1.5rem)] max-w-[420px] -translate-x-1/2 items-center gap-2.5 rounded-xl border border-amber-400/55 bg-[#1b1204]/95 px-3.5 py-2.5 text-xs font-semibold text-amber-100 shadow-[0_8px_28px_rgba(0,0,0,0.65)] backdrop-blur-md"
    >
      <WifiOff className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
      <span>
        Sem conexão com a internet — operando em cache local até reconectar.
      </span>
    </div>
  );
}
