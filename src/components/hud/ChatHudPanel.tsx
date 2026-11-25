import { memo, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  CornerDownLeft,
  MessageSquare,
  Settings,
  X,
} from 'lucide-react';
import type { ChatChannel, ChatMessage } from '../../types/hud';

interface ChatHudPanelProps {
  messages: ChatMessage[];
  activeChannel: ChatChannel;
  onChangeChannel: (channel: ChatChannel) => void;
  onSendMessage: (text: string) => void;
  onChatFocusChange: (focused: boolean) => void;
}

const CHANNELS: ReadonlyArray<{ id: ChatChannel; label: string }> = [
  { id: 'all', label: 'Tudo' },
  { id: 'party', label: 'Party' },
  { id: 'guild', label: 'Guild' },
  { id: 'whisper', label: 'Sussurro' },
  { id: 'system', label: 'Sistema' },
] as const;

export const ChatHudPanel = memo(function ChatHudPanel({
  messages,
  activeChannel,
  onChangeChannel,
  onSendMessage,
  onChatFocusChange,
}: ChatHudPanelProps) {
  const [draft, setDraft] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopMinimized, setDesktopMinimized] = useState(false);
  const mobileListRef = useRef<HTMLDivElement | null>(null);
  const desktopListRef = useRef<HTMLDivElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);

  const visibleMessages = messages.filter((m) =>
    activeChannel === 'all' ? m.channel !== 'system' : m.channel === activeChannel
  );

  useEffect(() => {
    if (mobileListRef.current) {
      mobileListRef.current.scrollTop = mobileListRef.current.scrollHeight;
    }
    if (desktopListRef.current) {
      desktopListRef.current.scrollTop = desktopListRef.current.scrollHeight;
    }
  }, [visibleMessages.length, activeChannel, mobileOpen, desktopMinimized]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    onSendMessage(clean);
    setDraft('');
  }

  function getMessageColor(msg: ChatMessage): string {
    if (msg.tone === 'level') return 'text-amber-300';
    if (msg.tone === 'loot') return 'text-emerald-300';
    if (msg.tone === 'combat') return 'text-orange-200';
    if (msg.tone === 'warning') return 'text-rose-300';
    if (msg.channel === 'system') return 'text-cyan-300';
    if (msg.channel === 'party') return 'text-sky-300';
    if (msg.channel === 'guild') return 'text-emerald-300';
    if (msg.channel === 'whisper') return 'text-fuchsia-300';
    return 'text-white';
  }

  function renderChatBox(isMobile: boolean) {
    const activeInputRef = isMobile ? mobileInputRef : desktopInputRef;
    const activeListRef = isMobile ? mobileListRef : desktopListRef;

    return (
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="pointer-events-auto flex w-full flex-col"
      >
        {/* Top 5 Glossy Pill Tabs + Close/Minimize Button */}
        <div className="flex items-end justify-between px-1 select-none">
          <div className="flex min-w-0 items-end gap-0.5 overflow-x-auto">
            {CHANNELS.map((tab) => {
              const active = activeChannel === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onChangeChannel(tab.id)}
                  className={`shrink-0 rounded-t-xl border-x border-t px-2 py-1 text-[10px] font-extrabold transition-all sm:px-2.5 ${
                    active
                      ? 'border-[#7eeeff] bg-gradient-to-b from-[#25a8ff] to-[#0a5be0] text-white shadow-[0_-2px_10px_rgba(56,232,255,0.45)]'
                      : 'border-cyan-400/55 bg-gradient-to-b from-[#0b44a8] to-[#052161] text-cyan-100/90 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              if (isMobile) {
                mobileInputRef.current?.blur();
                onChatFocusChange(false);
                setMobileOpen(false);
              } else {
                setDesktopMinimized((v) => !v);
              }
            }}
            title={isMobile ? 'Fechar chat' : 'Minimizar chat'}
            aria-label={isMobile ? 'Fechar chat' : 'Minimizar chat'}
            className="dmo-frame mb-0.5 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white hover:brightness-110 md:h-6 md:w-6"
          >
            {isMobile ? (
              <X className="h-4 w-4" />
            ) : (
              <Settings className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Main Chat Container */}
        <div className="dmo-frame overflow-hidden rounded-xl rounded-tl-none shadow-[0_8px_28px_rgba(2,10,32,0.88)]">
          {/* Checkered Translucent Message Box */}
          <div
            ref={activeListRef}
            className="dmo-chat-bg h-[112px] space-y-1 overflow-y-auto px-2.5 py-2 text-[11.5px] leading-snug sm:h-[120px] sm:text-[11px]"
          >
            {visibleMessages.length === 0 ? (
              <p className="py-2 text-[10.5px] italic text-cyan-200/70">
                {activeChannel === 'guild'
                  ? 'Chat da Guilda — participe ou crie uma Guilda no Menu para conversar aqui.'
                  : activeChannel === 'party'
                    ? 'Chat da Party — clique em um Tamer no mapa ou digite /invite+Nome para montar uma Party de até 4 jogadores!'
                    : activeChannel === 'whisper'
                      ? 'Canal Sussurro — use a aba Amigos ou "Tudo" para conversar com os jogadores.'
                      : activeChannel === 'system'
                        ? 'Nenhum aviso importante registrado.'
                        : 'Nenhuma mensagem no chat ainda. Use /invite+Nome para convidar para Party!'}
              </p>
            ) : (
              visibleMessages.map((msg) => (
                <div key={msg.id} className={`break-words ${getMessageColor(msg)}`}>
                  <span className="mr-1 text-[9.5px] font-bold text-cyan-300/75">
                    [{msg.timestamp}]
                  </span>
                  {msg.mapTag ? (
                    <span className="mr-1 rounded bg-cyan-500/20 px-1 py-0.5 text-[8.5px] font-extrabold text-cyan-200">
                      {msg.mapTag}
                    </span>
                  ) : null}
                  {msg.isGmSender ? (
                    <span className="mr-1 rounded bg-amber-400/25 px-1 py-0.5 text-[8.5px] font-black text-amber-300">
                      GM
                    </span>
                  ) : null}
                  {msg.sender ? (
                    <span
                      className={`mr-1 font-extrabold ${
                        msg.isGmSender ? 'text-amber-300' : 'text-amber-200'
                      }`}
                    >
                      {msg.sender}:
                    </span>
                  ) : null}
                  <span className="font-medium">{msg.text}</span>
                </div>
              ))
            )}
          </div>

          {/* Bottom Input Row — Mobile-optimized 16px input font (prevents iOS zoom) + touch-safe */}
          <form
            onSubmit={handleSubmit}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 border-t border-cyan-400/50 bg-gradient-to-b from-[#072a78] to-[#03133d] px-2 py-1.5"
          >
            {/* Yellow Smiley Circle */}
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-gradient-to-b from-[#fff176] to-[#f59e0b] shadow select-none"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <circle cx="9" cy="10" r="1.6" fill="#291400" />
                <circle cx="15" cy="10" r="1.6" fill="#291400" />
                <path
                  d="M8 14.2c1.2 1.8 6.8 1.8 8 0"
                  fill="none"
                  stroke="#291400"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <input
              ref={activeInputRef}
              type="text"
              inputMode="text"
              enterKeyHint="send"
              autoComplete="off"
              autoCorrect="on"
              value={draft}
              maxLength={140}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => onChatFocusChange(true)}
              onBlur={() => onChatFocusChange(false)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Escape') {
                  activeInputRef.current?.blur();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="dmo-well h-9 min-w-0 flex-1 select-text rounded-md px-2.5 text-[16px] font-medium text-white placeholder:text-sky-200/65 focus:border-cyan-300 focus:outline-none md:h-7 md:text-[11px]"
            />

            <button
              type="submit"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              aria-label="Enviar mensagem"
              className="flex h-9 w-11 shrink-0 items-center justify-center rounded-md border border-cyan-200 bg-gradient-to-b from-[#38c4ff] to-[#0662d6] text-white shadow hover:brightness-110 active:scale-95 md:h-7 md:w-10"
            >
              <CornerDownLeft className="h-4 w-4 stroke-[2.5] md:h-3.5 md:w-3.5" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Chat: anchored slightly above the virtual joystick in the bottom-left corner */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="pointer-events-auto relative z-40 h-8 w-24 md:hidden"
      >
        {!mobileOpen ? (
          <button
            type="button"
            onClick={() => {
              setMobileOpen(true);
              requestAnimationFrame(() => {
                mobileInputRef.current?.focus();
              });
            }}
            className="dmo-frame flex h-8 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1 text-[11px] font-extrabold text-cyan-100 shadow-[0_0_14px_rgba(56,232,255,0.3)] active:scale-95"
          >
            <MessageSquare className="h-3.5 w-3.5 text-cyan-300" />
            <span>Chat ({visibleMessages.length})</span>
          </button>
        ) : (
          <div className="absolute bottom-0 left-0 z-50 w-[min(324px,calc(100vw-1rem))]">
            {renderChatBox(true)}
          </div>
        )}
      </div>

      {/* Desktop Chat: bottom-left corner */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="pointer-events-auto hidden md:block"
      >
        {desktopMinimized ? (
          <button
            type="button"
            onClick={() => setDesktopMinimized(false)}
            className="dmo-frame flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-extrabold text-cyan-100"
          >
            <MessageSquare className="h-3.5 w-3.5 text-cyan-300" />
            <span>Abrir Chat</span>
          </button>
        ) : (
          <div className="w-[336px] lg:w-[366px]">{renderChatBox(false)}</div>
        )}
      </div>
    </>
  );
});
