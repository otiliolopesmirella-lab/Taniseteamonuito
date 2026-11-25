import { memo, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  CornerDownLeft,
  Globe,
  MapPin,
  MessageSquare,
  Minus,
  Shield,
  Users,
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

const CHANNELS: ReadonlyArray<{
  id: ChatChannel;
  label: string;
  activeClass: string;
  dotClass: string;
}> = [
  {
    id: 'global',
    label: 'Global',
    activeClass:
      'border-[#7eeeff] bg-gradient-to-b from-[#25a8ff] to-[#0a5be0] text-white shadow-[0_-2px_10px_rgba(56,232,255,0.45)]',
    dotClass: 'bg-cyan-300',
  },
  {
    id: 'map',
    label: 'Mapa',
    activeClass:
      'border-emerald-300 bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-[0_-2px_10px_rgba(16,185,129,0.45)]',
    dotClass: 'bg-emerald-300',
  },
  {
    id: 'guild',
    label: 'Guilda',
    activeClass:
      'border-indigo-300 bg-gradient-to-b from-indigo-500 to-indigo-700 text-white shadow-[0_-2px_10px_rgba(129,140,248,0.45)]',
    dotClass: 'bg-indigo-300',
  },
  {
    id: 'party',
    label: 'Party',
    activeClass:
      'border-amber-300 bg-gradient-to-b from-amber-500 to-orange-600 text-slate-950 shadow-[0_-2px_10px_rgba(251,191,36,0.45)]',
    dotClass: 'bg-amber-300',
  },
  {
    id: 'system',
    label: 'Sistema',
    activeClass:
      'border-sky-300 bg-gradient-to-b from-sky-600 to-slate-800 text-white shadow-[0_-2px_10px_rgba(56,189,248,0.35)]',
    dotClass: 'bg-sky-300',
  },
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
  const [mobileInputFocused, setMobileInputFocused] = useState(false);
  const [desktopMinimized, setDesktopMinimized] = useState(false);
  const [unreadByChannel, setUnreadByChannel] = useState<
    Record<ChatChannel, number>
  >({
    global: 0,
    map: 0,
    guild: 0,
    party: 0,
    system: 0,
  });

  const draftRef = useRef('');
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const mobileListRef = useRef<HTMLDivElement | null>(null);
  const desktopListRef = useRef<HTMLDivElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);

  // Strict per-channel isolation: each tab shows ONLY its own channel messages
  const visibleMessages = useMemo(
    () => messages.filter((m) => m.channel === activeChannel),
    [messages, activeChannel]
  );

  // Track unread badge counts for inactive channels (or while mobile chat is closed)
  useEffect(() => {
    if (!initializedRef.current) {
      for (const m of messages) seenIdsRef.current.add(m.id);
      initializedRef.current = true;
      return;
    }

    const deltas: Partial<Record<ChatChannel, number>> = {};
    let hasNew = false;

    for (const m of messages) {
      if (seenIdsRef.current.has(m.id)) continue;
      seenIdsRef.current.add(m.id);
      if (m.channel !== activeChannel) {
        deltas[m.channel] = (deltas[m.channel] ?? 0) + 1;
        hasNew = true;
      }
    }

    if (hasNew) {
      setUnreadByChannel((prev) => ({
        global: Math.min(99, prev.global + (deltas.global ?? 0)),
        map: Math.min(99, prev.map + (deltas.map ?? 0)),
        guild: Math.min(99, prev.guild + (deltas.guild ?? 0)),
        party: Math.min(99, prev.party + (deltas.party ?? 0)),
        system: Math.min(99, prev.system + (deltas.system ?? 0)),
      }));
    }
  }, [messages, activeChannel]);

  // Clear unread indicator when opening a channel
  useEffect(() => {
    setUnreadByChannel((prev) =>
      prev[activeChannel] === 0 ? prev : { ...prev, [activeChannel]: 0 }
    );
  }, [activeChannel]);

  useEffect(() => {
    if (mobileListRef.current) {
      mobileListRef.current.scrollTop = mobileListRef.current.scrollHeight;
    }
    if (desktopListRef.current) {
      desktopListRef.current.scrollTop = desktopListRef.current.scrollHeight;
    }
  }, [
    visibleMessages.length,
    activeChannel,
    mobileOpen,
    mobileInputFocused,
    desktopMinimized,
  ]);

  const totalUnread =
    unreadByChannel.global +
    unreadByChannel.map +
    unreadByChannel.guild +
    unreadByChannel.party;

  function updateDraftValue(next: string) {
    draftRef.current = next;
    setDraft(next);
  }

  function submitDraft() {
    const clean = draftRef.current.trim();
    if (!clean) return;
    draftRef.current = '';
    setDraft('');
    onSendMessage(clean);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submitDraft();
  }

  function getMessageColor(msg: ChatMessage): string {
    if (msg.tone === 'level') return 'text-amber-300';
    if (msg.tone === 'loot') return 'text-emerald-300';
    if (msg.tone === 'combat') return 'text-orange-200';
    if (msg.tone === 'warning') return 'text-rose-300';
    if (msg.channel === 'system') return 'text-cyan-200';
    if (msg.channel === 'party') return 'text-amber-200';
    if (msg.channel === 'guild') return 'text-indigo-200';
    if (msg.channel === 'map') return 'text-emerald-100';
    return 'text-white';
  }

  function getPlaceholder(): string {
    if (activeChannel === 'global') {
      return 'Falar no Global (todos os mapas) ou /invite Nome...';
    }
    if (activeChannel === 'map') {
      return 'Falar só com quem está perto neste mapa...';
    }
    if (activeChannel === 'guild') {
      return 'Mensagem exclusiva para sua Guilda...';
    }
    if (activeChannel === 'party') {
      return 'Mensagem exclusiva para sua Party...';
    }
    return 'Digite aqui para enviar no Global...';
  }

  function getEmptyStateText(): string {
    if (activeChannel === 'global') {
      return 'Chat Global — todos os jogadores online em qualquer mapa podem conversar aqui. Dica: use /invite Nome para convidar para Party.';
    }
    if (activeChannel === 'map') {
      return 'Chat do Mapa — apenas jogadores próximos a você neste mesmo mapa recebem suas mensagens.';
    }
    if (activeChannel === 'guild') {
      return 'Chat exclusivo da Guilda — somente membros da sua Guilda leem e enviam mensagens aqui.';
    }
    if (activeChannel === 'party') {
      return 'Chat exclusivo da Party — somente membros da sua Party conversam aqui. Clique em um player ou digite /invite Nome para convidar.';
    }
    return 'Nenhum aviso do sistema registrado ainda.';
  }

  function renderChannelBadgeIcon() {
    if (activeChannel === 'global') {
      return <Globe className="h-3.5 w-3.5 shrink-0 text-cyan-300" />;
    }
    if (activeChannel === 'map') {
      return <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-300" />;
    }
    if (activeChannel === 'guild') {
      return <Shield className="h-3.5 w-3.5 shrink-0 text-indigo-300" />;
    }
    if (activeChannel === 'party') {
      return <Users className="h-3.5 w-3.5 shrink-0 text-amber-300" />;
    }
    return <MessageSquare className="h-3.5 w-3.5 shrink-0 text-sky-300" />;
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
        {/* Channel Tabs Row */}
        <div className="flex items-end justify-between px-0.5 select-none">
          <div className="flex min-w-0 items-end gap-0.5 overflow-x-auto">
            {CHANNELS.map((tab) => {
              const active = activeChannel === tab.id;
              const unread = unreadByChannel[tab.id];
              return (
                <button
                  key={tab.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => onChangeChannel(tab.id)}
                  className={`relative flex shrink-0 items-center gap-1 rounded-t-xl border-x border-t px-2 py-1 text-[10px] font-extrabold transition-all sm:px-2.5 ${
                    active
                      ? tab.activeClass
                      : 'border-cyan-400/50 bg-gradient-to-b from-[#0b44a8] to-[#052161] text-cyan-100/90 hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {!active && unread > 0 && (
                    <span
                      className={`inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full px-1 text-[8.5px] font-black text-slate-950 ${tab.dotClass}`}
                    >
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              if (isMobile) {
                mobileInputRef.current?.blur();
                setMobileInputFocused(false);
                onChatFocusChange(false);
                setMobileOpen(false);
              } else {
                setDesktopMinimized(true);
              }
            }}
            title={isMobile ? 'Fechar chat' : 'Minimizar chat'}
            aria-label={isMobile ? 'Fechar chat' : 'Minimizar chat'}
            className="dmo-frame mb-0.5 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white hover:brightness-110 md:h-6 md:w-6"
          >
            {isMobile ? (
              <X className="h-4 w-4" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Main Chat Container */}
        <div className="dmo-frame overflow-hidden rounded-xl rounded-tl-none shadow-[0_8px_28px_rgba(2,10,32,0.88)]">
          {/* Message Feed */}
          <div
            ref={activeListRef}
            className="dmo-chat-bg h-[84px] space-y-1 overflow-y-auto px-2.5 py-1.5 text-[11px] leading-snug md:h-[136px] md:py-2"
          >
            {visibleMessages.length === 0 ? (
              <p className="py-2 text-[10.5px] leading-relaxed text-cyan-200/75">
                {getEmptyStateText()}
              </p>
            ) : (
              visibleMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`break-words ${getMessageColor(msg)}`}
                >
                  <span className="mr-1 text-[9.5px] font-bold text-cyan-300/70">
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
                        msg.isGmSender
                          ? 'text-amber-300'
                          : msg.channel === 'guild'
                            ? 'text-indigo-300'
                            : msg.channel === 'party'
                              ? 'text-amber-300'
                              : msg.channel === 'map'
                                ? 'text-emerald-300'
                                : 'text-cyan-200'
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

          {/* Input Row */}
          <form
            onSubmit={handleSubmit}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 border-t border-cyan-400/45 bg-gradient-to-b from-[#072a78] to-[#03133d] px-2 py-1.5"
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-cyan-400/40 bg-[#04143a] select-none"
            >
              {renderChannelBadgeIcon()}
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
              onChange={(e) => updateDraftValue(e.target.value)}
              onFocus={() => {
                if (isMobile) setMobileInputFocused(true);
                onChatFocusChange(true);
              }}
              onBlur={() => {
                if (isMobile) setMobileInputFocused(false);
                onChatFocusChange(false);
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Escape') {
                  activeInputRef.current?.blur();
                  return;
                }
                if (
                  (e.key === 'Enter' || e.keyCode === 13) &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  submitDraft();
                }
              }}
              onKeyUp={(e) => e.stopPropagation()}
              placeholder={getPlaceholder()}
              className="dmo-well h-9 min-w-0 flex-1 touch-manipulation select-text rounded-md px-2.5 text-[16px] font-medium text-white placeholder:text-sky-200/60 focus:border-cyan-300 focus:outline-none md:h-7 md:text-[11px]"
            />

            <button
              type="submit"
              onMouseDown={(e) => {
                // Keep input focused so mobile keyboard does not collapse mid-tap before send registers
                e.preventDefault();
                e.stopPropagation();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                submitDraft();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                submitDraft();
              }}
              aria-label="Enviar mensagem"
              className="flex h-9 w-11 shrink-0 touch-manipulation items-center justify-center rounded-md border border-cyan-200 bg-gradient-to-b from-[#38c4ff] to-[#0662d6] text-white shadow hover:brightness-110 active:scale-95 md:h-7 md:w-10"
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
      {/* Mobile Chat Button / Drawer */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="pointer-events-auto relative z-40 h-8 w-28 md:hidden"
      >
        {!mobileOpen ? (
          <button
            type="button"
            onClick={() => {
              if (activeChannel === 'system') {
                onChangeChannel('global');
              }
              setMobileOpen(true);
            }}
            className="dmo-frame flex h-8 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1 text-[11px] font-extrabold text-cyan-100 shadow-[0_0_14px_rgba(56,232,255,0.3)] active:scale-95"
          >
            <MessageSquare className="h-3.5 w-3.5 text-cyan-300" />
            <span>Chat</span>
            {totalUnread > 0 && (
              <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-black text-slate-950">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>
        ) : (
          <div
            className={
              mobileInputFocused
                ? 'fixed inset-x-2 bottom-2 z-[90]'
                : 'absolute bottom-0 left-0 z-[65] w-[min(312px,calc(100vw-1rem))]'
            }
          >
            {renderChatBox(true)}
          </div>
        )}
      </div>

      {/* Desktop Chat Panel */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="pointer-events-auto hidden md:block"
      >
        {desktopMinimized ? (
          <button
            type="button"
            onClick={() => setDesktopMinimized(false)}
            className="dmo-frame flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-extrabold text-cyan-100 hover:brightness-110"
          >
            <MessageSquare className="h-3.5 w-3.5 text-cyan-300" />
            <span>Abrir Chat</span>
            {totalUnread > 0 && (
              <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-black text-slate-950">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>
        ) : (
          <div className="w-[356px] lg:w-[392px]">{renderChatBox(false)}</div>
        )}
      </div>
    </>
  );
});
