import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Ban,
  Check,
  Copy,
  Crown,
  Gift,
  Link2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  ShieldOff,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  acceptFriendRequest,
  blockPlayer,
  loadFriendsState,
  rejectOrCancelFriendRequest,
  removeFriend,
  sendFriendRequest,
  unblockPlayer,
  type FriendsState,
} from '../../services/friendsService';
import {
  buildInviteLink,
  fetchMyReferralDashboard,
  formatReferralCodeDisplay,
  redeemReferralCode,
  type ReferralDashboardData,
} from '../../services/referralService';
import type { RemoteWorldPlayer } from '../../services/worldPresenceService';
import type { TamerId } from '../../types/character';
import { getDigimonFormProfile } from '../../types/digimon';

type FriendsTabId = 'friends' | 'requests' | 'blocked' | 'invites';

const FRIENDS_REF_BG_URL =
  '/assets/aistudio/file_00000000743c820ebc356241970946c4_b3573210.png';

interface FriendsModalProps {
  accountKey: string;
  selfTamerName: string;
  selfCharacterId?: TamerId;
  selfTamerPhotoUrl?: string | null;
  selfTamerCoverUrl?: string | null;
  selfIsGm?: boolean;
  remotePlayers: readonly RemoteWorldPlayer[];
  onStartWhisper: (friendName: string) => void;
  onNotifyImportantEvent?: (title: string, detail: string) => void;
  onPlayTone: (tone: 'click' | 'confirm' | 'error') => void;
  onClose: () => void;
}

export const FriendsModal = memo(function FriendsModal({
  accountKey,
  selfTamerName,
  selfCharacterId = 'kai',
  selfTamerPhotoUrl = null,
  selfTamerCoverUrl = null,
  selfIsGm = false,
  remotePlayers,
  onStartWhisper,
  onNotifyImportantEvent,
  onPlayTone,
  onClose,
}: FriendsModalProps) {
  const [state, setState] = useState<FriendsState>(() =>
    loadFriendsState(accountKey)
  );
  const [activeTab, setActiveTab] = useState<FriendsTabId>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [addInputOpen, setAddInputOpen] = useState(false);
  const [addTargetName, setAddTargetName] = useState('');
  const [feedback, setFeedback] = useState<{
    kind: 'ok' | 'err';
    text: string;
  } | null>(null);

  // Referral / Invite Code state
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralData, setReferralData] =
    useState<ReferralDashboardData | null>(null);
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [redeemSubmitting, setRedeemSubmitting] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState<'code' | 'link' | null>(
    null
  );

  const addInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const loadReferralDashboard = useCallback(async () => {
    setReferralLoading(true);
    try {
      const data = await fetchMyReferralDashboard({
        tamerName: selfTamerName,
        characterId: selfCharacterId,
        tamerPhotoUrl: selfTamerPhotoUrl,
        tamerCoverUrl: selfTamerCoverUrl,
        isGm: selfIsGm,
      });
      setReferralData(data);
    } finally {
      setReferralLoading(false);
    }
  }, [
    selfCharacterId,
    selfIsGm,
    selfTamerCoverUrl,
    selfTamerName,
    selfTamerPhotoUrl,
  ]);

  useEffect(() => {
    if (activeTab === 'invites') {
      void loadReferralDashboard();
    }
  }, [activeTab, loadReferralDashboard]);

  const myInviteCodeRaw = referralData?.profile?.inviteCode ?? '';
  const myInviteCodeDisplay = myInviteCodeRaw
    ? formatReferralCodeDisplay(myInviteCodeRaw)
    : '';
  const myInviteLink = myInviteCodeRaw ? buildInviteLink(myInviteCodeRaw) : '';

  async function handleCopyText(kind: 'code' | 'link', text: string) {
    if (!text) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedTarget(kind);
      onPlayTone('confirm');
      showFeedback(
        true,
        kind === 'code'
          ? `Código ${myInviteCodeDisplay} copiado!`
          : 'Link de convite copiado! Compartilhe com seus amigos.'
      );
      window.setTimeout(() => {
        setCopiedTarget((cur) => (cur === kind ? null : cur));
      }, 2200);
    } catch {
      onPlayTone('error');
      showFeedback(false, 'Não foi possível copiar automaticamente.');
    }
  }

  async function handleRedeemInviteCode() {
    if (redeemSubmitting) return;
    const raw = redeemCodeInput.trim();
    if (!raw) {
      onPlayTone('error');
      showFeedback(false, 'Digite o código de convite de um amigo.');
      return;
    }
    setRedeemSubmitting(true);
    try {
      const res = await redeemReferralCode(raw, selfTamerName);
      onPlayTone(res.ok ? 'confirm' : 'error');
      showFeedback(res.ok, res.message);
      if (res.ok) {
        setRedeemCodeInput('');
        if (res.claim) {
          onNotifyImportantEvent?.(
            'Código de Convite Aplicado',
            `Você foi vinculado ao código de ${res.claim.referrerName} (${formatReferralCodeDisplay(res.claim.inviteCode)}).`
          );
        }
        await loadReferralDashboard();
      }
    } finally {
      setRedeemSubmitting(false);
    }
  }

  // Map online world players by normalized Tamer name and UID for real-time Online/Offline status
  const onlineLookup = useMemo(() => {
    const byName = new Map<string, RemoteWorldPlayer>();
    const byUid = new Map<string, RemoteWorldPlayer>();
    for (const p of remotePlayers) {
      byName.set(p.tamerName.trim().toLowerCase(), p);
      byUid.set(p.uid, p);
    }
    return { byName, byUid };
  }, [remotePlayers]);

  const enrichedFriends = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.friends
      .map((f) => {
        const live =
          (f.uid ? onlineLookup.byUid.get(f.uid) : undefined) ??
          onlineLookup.byName.get(f.tamerName.trim().toLowerCase());
        return {
          ...f,
          isOnline: Boolean(live),
          liveLevel: live ? live.tamerLevel : f.level,
          liveDigimonFormId: live ? live.digimonFormId : f.digimonFormId,
        };
      })
      .filter((f) => !q || f.tamerName.toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        return b.liveLevel - a.liveLevel;
      });
  }, [state.friends, onlineLookup, searchQuery]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.requests.filter(
      (r) => !q || r.tamerName.toLowerCase().includes(q)
    );
  }, [state.requests, searchQuery]);

  const filteredBlocked = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.blocked.filter(
      (b) => !q || b.tamerName.toLowerCase().includes(q)
    );
  }, [state.blocked, searchQuery]);

  // Online players not yet friends or blocked (quick-add suggestions!)
  const quickAddOnlineSuggestions = useMemo(() => {
    const friendNames = new Set(
      state.friends.map((f) => f.tamerName.trim().toLowerCase())
    );
    const blockedNames = new Set(
      state.blocked.map((b) => b.tamerName.trim().toLowerCase())
    );
    const selfKey = selfTamerName.trim().toLowerCase();
    return remotePlayers.filter((p) => {
      const k = p.tamerName.trim().toLowerCase();
      return k !== selfKey && !friendNames.has(k) && !blockedNames.has(k);
    });
  }, [remotePlayers, state.friends, state.blocked, selfTamerName]);

  function showFeedback(ok: boolean, text: string) {
    setFeedback({ kind: ok ? 'ok' : 'err', text });
  }

  function handleSendRequest(customName?: string) {
    const candidate = (
      customName ??
      (addInputOpen && addTargetName.trim()
        ? addTargetName
        : searchQuery)
    ).trim();

    if (!candidate) {
      setAddInputOpen(true);
      onPlayTone('click');
      requestAnimationFrame(() => addInputRef.current?.focus());
      showFeedback(false, 'Digite o nome do Tamer para enviar o pedido.');
      return;
    }

    const res = sendFriendRequest(
      accountKey,
      state,
      candidate,
      selfTamerName,
      remotePlayers
    );
    setState(res.next);
    onPlayTone(res.ok ? 'confirm' : 'error');
    showFeedback(res.ok, res.message);
    if (res.ok) {
      setAddTargetName('');
      setAddInputOpen(false);
    }
  }

  function handleRemoveFriend(friendId: string) {
    const res = removeFriend(accountKey, state, friendId);
    setState(res.next);
    onPlayTone(res.ok ? 'click' : 'error');
    showFeedback(res.ok, res.message);
  }

  function handleBlockFromFriend(
    tamerName: string,
    level: number,
    digimonFormId: typeof state.friends[number]['digimonFormId'],
    uid?: string
  ) {
    const res = blockPlayer(accountKey, state, {
      uid,
      tamerName,
      level,
      digimonFormId,
    });
    setState(res.next);
    onPlayTone(res.ok ? 'click' : 'error');
    showFeedback(res.ok, res.message);
  }

  function handleAcceptRequest(requestId: string) {
    const res = acceptFriendRequest(accountKey, state, requestId);
    setState(res.next);
    onPlayTone(res.ok ? 'confirm' : 'error');
    showFeedback(res.ok, res.message);
  }

  function handleRejectRequest(requestId: string) {
    const res = rejectOrCancelFriendRequest(accountKey, state, requestId);
    setState(res.next);
    onPlayTone(res.ok ? 'click' : 'error');
    showFeedback(res.ok, res.message);
  }

  function handleUnblock(blockedId: string) {
    const res = unblockPlayer(accountKey, state, blockedId);
    setState(res.next);
    onPlayTone(res.ok ? 'confirm' : 'error');
    showFeedback(res.ok, res.message);
  }

  const pendingCount = state.requests.length;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Lista de Amigos"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#01071a]/82 p-2 sm:p-4 select-none"
    >
      {/* Outer Electric-Blue Cyber Frame */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-dmo-window relative flex max-h-[90dvh] w-[min(97vw,556px)] flex-col overflow-hidden rounded-2xl border-2 border-[#38d6ff] bg-[#041645] shadow-[0_0_40px_rgba(0,168,255,0.6),inset_0_0_24px_rgba(32,160,255,0.28)]"
      >
        {/* Subtle Reference Circuit Backdrop Texture (preserves authentic electric-blue visual identity) */}
        <img
          src={FRIENDS_REF_BG_URL}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.14] mix-blend-screen"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#072a7d]/80 via-[#04174a]/92 to-[#020c2b]/96"
        />

        {/* Top Header: Chamfered "Amigos" Banner + Chamfered Close X */}
        <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 px-3 pb-2 pt-3 sm:px-4">
          {/* Glowing Chamfered Title Pill */}
          <div className="clip-cyber-btn bg-gradient-to-r from-[#38e8ff] via-[#60d8ff] to-[#1e88ff] p-[2px] shadow-[0_0_20px_rgba(56,214,255,0.58)]">
            <div className="clip-cyber-btn flex items-center gap-2.5 bg-gradient-to-b from-[#0f4dc7] via-[#072b7d] to-[#04174a] px-6 py-1.5 sm:px-8">
              <Users className="h-5 w-5 shrink-0 text-cyan-100 drop-shadow-[0_0_8px_rgba(125,232,255,0.85)] sm:h-6 sm:w-6" />
              <h2 className="font-[family-name:var(--font-display)] text-lg italic tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] sm:text-xl">
                Amigos
              </h2>
            </div>
          </div>

          {/* Chamfered Electric-Blue Close Button */}
          <button
            type="button"
            onClick={() => {
              onPlayTone('click');
              onClose();
            }}
            aria-label="Fechar Lista de Amigos"
            className="clip-cyber-slot bg-gradient-to-b from-[#6be8ff] to-[#1366e8] p-[2px] shadow-[0_0_14px_rgba(56,214,255,0.6)] transition-transform hover:brightness-110 active:scale-95"
          >
            <span className="clip-cyber-slot flex h-9 w-9 items-center justify-center bg-gradient-to-b from-[#1768e8] to-[#082c80] text-white sm:h-10 sm:w-10">
              <X className="h-5 w-5 stroke-[3]" />
            </span>
          </button>
        </div>

        {/* 4 Cyber Chamfered Tabs (Amigos / Solicitações / Bloqueados / Convites) */}
        <div className="relative z-10 grid shrink-0 grid-cols-4 gap-1 px-3 pb-2 sm:gap-1.5 sm:px-4">
          {/* Tab 1: Lista de Amigos */}
          <button
            type="button"
            onClick={() => {
              onPlayTone('click');
              setActiveTab('friends');
            }}
            className={`clip-cyber-input p-[2px] transition-all active:scale-[0.98] ${
              activeTab === 'friends'
                ? 'bg-gradient-to-b from-[#fff59d] via-[#fbbf24] to-[#b45309] shadow-[0_0_18px_rgba(251,191,36,0.65)]'
                : 'bg-gradient-to-b from-[#5ce6ff] to-[#0f5ed6] opacity-90 hover:opacity-100'
            }`}
          >
            <div
              className={`clip-cyber-input flex min-h-[38px] items-center justify-center gap-1 px-1 py-1.5 text-[10px] font-black italic tracking-tight sm:text-[11px] ${
                activeTab === 'friends'
                  ? 'bg-gradient-to-b from-[#ffe44d] via-[#f5b400] to-[#d97706] text-[#170b00]'
                  : 'bg-gradient-to-b from-[#0e4bc4] via-[#072978] to-[#041442] text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Amigos</span>
            </div>
          </button>

          {/* Tab 2: Solicitações (with Red Badge) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                onPlayTone('click');
                setActiveTab('requests');
              }}
              className={`clip-cyber-input w-full p-[2px] transition-all active:scale-[0.98] ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-b from-[#fff59d] via-[#fbbf24] to-[#b45309] shadow-[0_0_18px_rgba(251,191,36,0.65)]'
                  : 'bg-gradient-to-b from-[#5ce6ff] to-[#0f5ed6] opacity-90 hover:opacity-100'
              }`}
            >
              <div
                className={`clip-cyber-input flex min-h-[38px] items-center justify-center gap-1 px-1 py-1.5 text-[10px] font-black italic tracking-tight sm:text-[11px] ${
                  activeTab === 'requests'
                    ? 'bg-gradient-to-b from-[#ffe44d] via-[#f5b400] to-[#d97706] text-[#170b00]'
                    : 'bg-gradient-to-b from-[#0e4bc4] via-[#072978] to-[#041442] text-white'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Pedidos</span>
              </div>
            </button>
            {pendingCount > 0 && (
              <span
                aria-label={`${pendingCount} solicitações pendentes`}
                className="pointer-events-none absolute -right-1 -top-1.5 z-20 flex h-5 min-w-[20px] items-center justify-center rounded-md border border-rose-200 bg-gradient-to-b from-[#ff3b3b] to-[#b80000] px-1 text-[10px] font-black tabular-nums text-white shadow-[0_0_10px_rgba(239,68,68,0.85)]"
              >
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </div>

          {/* Tab 3: Bloqueados */}
          <button
            type="button"
            onClick={() => {
              onPlayTone('click');
              setActiveTab('blocked');
            }}
            className={`clip-cyber-input p-[2px] transition-all active:scale-[0.98] ${
              activeTab === 'blocked'
                ? 'bg-gradient-to-b from-[#fff59d] via-[#fbbf24] to-[#b45309] shadow-[0_0_18px_rgba(251,191,36,0.65)]'
                : 'bg-gradient-to-b from-[#5ce6ff] to-[#0f5ed6] opacity-90 hover:opacity-100'
            }`}
          >
            <div
              className={`clip-cyber-input flex min-h-[38px] items-center justify-center gap-1 px-1 py-1.5 text-[10px] font-black italic tracking-tight sm:text-[11px] ${
                activeTab === 'blocked'
                  ? 'bg-gradient-to-b from-[#ffe44d] via-[#f5b400] to-[#d97706] text-[#170b00]'
                  : 'bg-gradient-to-b from-[#0e4bc4] via-[#072978] to-[#041442] text-white'
              }`}
            >
              <Ban className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Bloq.</span>
            </div>
          </button>

          {/* Tab 4: Convites (Código + Link + 10% DL Din) */}
          <button
            type="button"
            onClick={() => {
              onPlayTone('click');
              setActiveTab('invites');
            }}
            className={`clip-cyber-input p-[2px] transition-all active:scale-[0.98] ${
              activeTab === 'invites'
                ? 'bg-gradient-to-b from-[#fff59d] via-[#fbbf24] to-[#b45309] shadow-[0_0_18px_rgba(251,191,36,0.65)]'
                : 'bg-gradient-to-b from-[#fde047] via-[#38e8ff] to-[#0f5ed6] opacity-95 hover:opacity-100'
            }`}
          >
            <div
              className={`clip-cyber-input flex min-h-[38px] items-center justify-center gap-1 px-1 py-1.5 text-[10px] font-black italic tracking-tight sm:text-[11px] ${
                activeTab === 'invites'
                  ? 'bg-gradient-to-b from-[#ffe44d] via-[#f5b400] to-[#d97706] text-[#170b00]'
                  : 'bg-gradient-to-b from-[#1150cc] via-[#082c82] to-[#041442] text-amber-200'
              }`}
            >
              <Gift className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Convites</span>
            </div>
          </button>
        </div>

        {/* Search Bar + Golden "Buscar" Button (hidden on Convites tab) */}
        {activeTab !== 'invites' && (
          <div className="relative z-10 flex shrink-0 items-center gap-2 px-3 pb-2.5 sm:px-4">
            <div className="clip-cyber-input flex-1 bg-gradient-to-r from-[#38e8ff] via-[#1c8cff] to-[#38e8ff] p-[1.5px] shadow-[0_0_12px_rgba(56,214,255,0.3)]">
              <div className="clip-cyber-input flex items-center gap-2 bg-[#031036] px-3 py-1.5">
                <Search className="h-4 w-4 shrink-0 text-cyan-200" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Buscar amigo pelo nome..."
                  className="w-full min-w-0 select-text bg-transparent text-xs font-semibold italic text-white placeholder:text-sky-200/65 focus:outline-none sm:text-[13px]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpar busca"
                    className="text-cyan-300/80 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onPlayTone('click');
                searchInputRef.current?.focus();
              }}
              className="clip-cyber-input shrink-0 bg-gradient-to-b from-[#fff59d] via-[#fbbf24] to-[#b45309] p-[2px] shadow-[0_0_14px_rgba(251,191,36,0.5)] transition hover:brightness-110 active:scale-95"
            >
              <span className="clip-cyber-input flex min-h-[34px] items-center justify-center bg-gradient-to-b from-[#ffe44d] via-[#f5b400] to-[#d97706] px-4 text-xs font-black italic text-[#170b00] sm:px-5">
                Buscar
              </span>
            </button>
          </div>
        )}

        {/* Inline Add Friend Drawer (opens when tapping "Adicionar Amigo") */}
        {addInputOpen && (
          <div className="relative z-10 mx-3 mb-2 rounded-xl border border-cyan-300/70 bg-[#04143e]/96 p-2.5 shadow-[0_0_16px_rgba(56,214,255,0.3)] sm:mx-4">
            <div className="flex items-center justify-between gap-2 pb-1.5">
              <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-cyan-200">
                <UserPlus className="h-3.5 w-3.5 text-amber-300" />
                <span>Adicionar novo Tamer pelo nome</span>
              </span>
              <button
                type="button"
                onClick={() => setAddInputOpen(false)}
                className="text-cyan-300/80 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                ref={addInputRef}
                type="text"
                maxLength={24}
                value={addTargetName}
                onChange={(e) => setAddTargetName(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') handleSendRequest(addTargetName);
                }}
                placeholder="Digite o nome exato do Tamer..."
                className="h-8 min-w-0 flex-1 select-text rounded-lg border border-cyan-400/50 bg-[#020a24] px-2.5 text-xs font-semibold text-white placeholder:text-sky-300/55 focus:border-amber-300 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleSendRequest(addTargetName)}
                className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-amber-200 bg-gradient-to-b from-[#ffe44d] to-[#d97706] px-3 text-[11px] font-black text-[#170b00] hover:brightness-110 active:scale-95"
              >
                <Send className="h-3 w-3" />
                <span>Enviar</span>
              </button>
            </div>

            {quickAddOnlineSuggestions.length > 0 && (
              <div className="mt-2 border-t border-cyan-400/20 pt-1.5">
                <p className="mb-1 text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-300">
                  Tamers Online Agora ({quickAddOnlineSuggestions.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {quickAddOnlineSuggestions.slice(0, 6).map((p) => (
                    <button
                      key={p.uid}
                      type="button"
                      onClick={() => handleSendRequest(p.tamerName)}
                      className="flex items-center gap-1 rounded-lg border border-emerald-400/50 bg-emerald-950/60 px-2 py-1 text-[10px] font-bold text-emerald-100 hover:bg-emerald-800/70 active:scale-95"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{p.tamerName}</span>
                      <span className="text-[9px] text-amber-200">
                        Lv.{p.tamerLevel}
                      </span>
                      <UserPlus className="h-2.5 w-2.5 text-cyan-200" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inline Status Feedback Banner */}
        {feedback && (
          <div
            className={`relative z-10 mx-3 mb-2 flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold sm:mx-4 ${
              feedback.kind === 'ok'
                ? 'border-emerald-400/60 bg-emerald-950/80 text-emerald-200'
                : 'border-rose-400/60 bg-rose-950/80 text-rose-200'
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="opacity-75 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Main Scrollable Rows List */}
        <div className="world-map-scroll relative z-10 min-h-[240px] flex-1 space-y-2 overflow-y-auto px-3 pb-2 sm:px-4">
          {/* TAB 1: LISTA DE AMIGOS */}
          {activeTab === 'friends' && (
            <>
              {enrichedFriends.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-cyan-400/35 bg-[#031036]/90 px-4 py-10 text-center">
                  <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-300/60 bg-[#08266d] text-cyan-200 shadow-[0_0_16px_rgba(56,214,255,0.3)]">
                    <Users className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-black italic text-white">
                    {searchQuery
                      ? 'Nenhum amigo encontrado na busca'
                      : 'Sua Lista de Amigos está vazia'}
                  </p>
                  <p className="mt-1 max-w-[300px] text-[11px] leading-relaxed text-sky-200/80">
                    {searchQuery
                      ? `Nenhum Tamer correspondente a "${searchQuery}".`
                      : 'Clique em "Adicionar Amigo" abaixo para conectar com outros Tamers do Mundo Digital.'}
                  </p>
                </div>
              ) : (
                enrichedFriends.map((friend) => {
                  const form = getDigimonFormProfile(friend.liveDigimonFormId);
                  return (
                    <div
                      key={friend.id}
                      className="clip-cyber-input bg-gradient-to-r from-[#38e8ff] via-[#1c8cff] to-[#38e8ff] p-[1.5px] shadow-[0_0_14px_rgba(24,144,255,0.35)]"
                    >
                      <div className="clip-cyber-input flex items-center justify-between gap-2 bg-gradient-to-r from-[#062163] via-[#041645] to-[#06205e] px-2 py-2 sm:gap-3 sm:px-3">
                        {/* Left: Glowing Square Digimon Avatar + Name & Gold Crown Level */}
                        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border-2 border-[#5ce6ff] bg-gradient-to-b from-[#0e42a8] to-[#04143a] p-0.5 shadow-[0_0_10px_rgba(56,232,255,0.5)] sm:h-12 sm:w-12">
                            <img
                              src={form.portraitUrl}
                              alt={form.name}
                              draggable={false}
                              className="h-full w-full object-contain"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-black italic leading-tight text-white drop-shadow sm:text-[15px]">
                              {friend.tamerName}
                            </p>
                            <div className="mt-0.5 flex items-center gap-1">
                              <Crown className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-300" />
                              <span className="text-[11px] font-black italic tabular-nums text-amber-300 sm:text-xs">
                                Lv. {friend.liveLevel}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Middle: Status Indicator (Green Online / Blue Offline) + Vertical Divider */}
                        <div className="flex shrink-0 items-center gap-1.5 border-r border-cyan-400/35 pr-2 sm:pr-3">
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full border ${
                              friend.isOnline
                                ? 'border-lime-200 bg-lime-400 shadow-[0_0_8px_#84cc16]'
                                : 'border-sky-200/70 bg-sky-500/80 shadow-[0_0_6px_rgba(56,189,248,0.45)]'
                            }`}
                          />
                          <span
                            className={`text-[10.5px] font-extrabold italic sm:text-xs ${
                              friend.isOnline ? 'text-lime-400' : 'text-sky-200/85'
                            }`}
                          >
                            {friend.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>

                        {/* Right: Chamfered Blue "Conversar" + Red "Remover" Buttons */}
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onPlayTone('click');
                              onStartWhisper(friend.tamerName);
                            }}
                            title={`Conversar com ${friend.tamerName}`}
                            className="clip-cyber-input bg-gradient-to-b from-[#6be8ff] to-[#0c56d0] p-[1.5px] shadow-[0_0_10px_rgba(56,214,255,0.45)] transition hover:brightness-110 active:scale-95"
                          >
                            <span className="clip-cyber-input flex h-8 items-center gap-1 bg-gradient-to-b from-[#1a78f2] to-[#083899] px-2 text-[10px] font-black italic text-white sm:px-2.5 sm:text-[11px]">
                              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                              <span className="hidden xs:inline">Conversar</span>
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveFriend(friend.id)}
                            title={`Remover ${friend.tamerName}`}
                            className="clip-cyber-input bg-gradient-to-b from-[#ff7a7a] to-[#991b1b] p-[1.5px] shadow-[0_0_10px_rgba(239,68,68,0.45)] transition hover:brightness-110 active:scale-95"
                          >
                            <span className="clip-cyber-input flex h-8 items-center gap-1 bg-gradient-to-b from-[#dc2626] to-[#7f1d1d] px-2 text-[10px] font-black italic text-white sm:px-2.5 sm:text-[11px]">
                              <Trash2 className="h-3.5 w-3.5 shrink-0" />
                              <span className="hidden sm:inline">Remover</span>
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleBlockFromFriend(
                                friend.tamerName,
                                friend.liveLevel,
                                friend.liveDigimonFormId,
                                friend.uid
                              )
                            }
                            title={`Bloquear ${friend.tamerName}`}
                            aria-label={`Bloquear ${friend.tamerName}`}
                            className="flex h-8 w-7 items-center justify-center rounded-md border border-slate-500/60 bg-[#051538] text-slate-300 transition hover:border-rose-400 hover:text-rose-300 active:scale-95"
                          >
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* TAB 2: SOLICITAÇÕES */}
          {activeTab === 'requests' && (
            <>
              {filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-cyan-400/35 bg-[#031036]/90 px-4 py-10 text-center">
                  <UserPlus className="mb-2 h-8 w-8 text-cyan-300/75" />
                  <p className="text-sm font-black italic text-white">
                    Nenhuma solicitação pendente
                  </p>
                  <p className="mt-1 text-[11px] text-sky-200/80">
                    Pedidos de amizade enviados ou recebidos aparecerão aqui.
                  </p>
                </div>
              ) : (
                filteredRequests.map((req) => {
                  const form = getDigimonFormProfile(req.digimonFormId);
                  return (
                    <div
                      key={req.id}
                      className="clip-cyber-input bg-gradient-to-r from-[#38e8ff] via-[#1c8cff] to-[#38e8ff] p-[1.5px]"
                    >
                      <div className="clip-cyber-input flex items-center justify-between gap-2 bg-gradient-to-r from-[#062163] via-[#041645] to-[#06205e] px-2.5 py-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border-2 border-[#5ce6ff] bg-[#04143a] p-0.5">
                            <img
                              src={form.portraitUrl}
                              alt={form.name}
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black italic text-white">
                              {req.tamerName}
                            </p>
                            <p className="text-[10.5px] font-bold text-cyan-200">
                              {req.direction === 'incoming'
                                ? 'Pedido recebido'
                                : 'Aguardando resposta'}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {req.direction === 'incoming' && (
                            <button
                              type="button"
                              onClick={() => handleAcceptRequest(req.id)}
                              className="clip-cyber-input bg-gradient-to-b from-[#6ee7b7] to-[#059669] p-[1.5px]"
                            >
                              <span className="clip-cyber-input flex h-8 items-center gap-1 bg-gradient-to-b from-[#10b981] to-[#047857] px-2.5 text-[11px] font-black text-white">
                                <Check className="h-3.5 w-3.5" />
                                <span>Aceitar</span>
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(req.id)}
                            className="clip-cyber-input bg-gradient-to-b from-[#ff7a7a] to-[#991b1b] p-[1.5px]"
                          >
                            <span className="clip-cyber-input flex h-8 items-center gap-1 bg-gradient-to-b from-[#dc2626] to-[#7f1d1d] px-2.5 text-[11px] font-black text-white">
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>
                                {req.direction === 'outgoing'
                                  ? 'Cancelar'
                                  : 'Recusar'}
                              </span>
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* TAB 3: BLOQUEADOS */}
          {activeTab === 'blocked' && (
            <>
              {filteredBlocked.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-cyan-400/35 bg-[#031036]/90 px-4 py-10 text-center">
                  <Ban className="mb-2 h-8 w-8 text-cyan-300/75" />
                  <p className="text-sm font-black italic text-white">
                    Nenhum jogador bloqueado
                  </p>
                  <p className="mt-1 text-[11px] text-sky-200/80">
                    Jogadores bloqueados não poderão enviar mensagens ou convites para você.
                  </p>
                </div>
              ) : (
                filteredBlocked.map((blk) => {
                  const form = getDigimonFormProfile(blk.digimonFormId);
                  return (
                    <div
                      key={blk.id}
                      className="clip-cyber-input bg-gradient-to-r from-[#64748b] via-[#38bdf8] to-[#64748b] p-[1.5px]"
                    >
                      <div className="clip-cyber-input flex items-center justify-between gap-2 bg-[#041236] px-2.5 py-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-500 bg-[#02081a] p-0.5 opacity-80">
                            <img
                              src={form.portraitUrl}
                              alt={form.name}
                              className="h-full w-full object-contain grayscale"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black italic text-slate-200">
                              {blk.tamerName}
                            </p>
                            <p className="text-[10px] font-bold text-rose-300">
                              Bloqueado
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUnblock(blk.id)}
                          className="clip-cyber-input bg-gradient-to-b from-[#6be8ff] to-[#0c56d0] p-[1.5px]"
                        >
                          <span className="clip-cyber-input flex h-8 items-center gap-1 bg-gradient-to-b from-[#1a78f2] to-[#083899] px-3 text-[11px] font-black text-white">
                            <ShieldOff className="h-3.5 w-3.5" />
                            <span>Desbloquear</span>
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
          {/* TAB 4: CONVITES & INDICAÇÕES (10% DL Din + Rank Mensal) */}
          {activeTab === 'invites' && (
            <div className="space-y-2.5">
              {referralLoading && !referralData ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-cyan-400/35 bg-[#031036]/90 py-10 text-cyan-200">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-xs font-bold">
                    Carregando seu código e convidados...
                  </span>
                </div>
              ) : (
                <>
                  {/* Reward Rule Banner */}
                  <div className="rounded-xl border border-amber-300/60 bg-gradient-to-r from-[#2c1a04]/90 via-[#071f54]/95 to-[#061842]/95 p-3 shadow-[0_0_16px_rgba(251,191,36,0.2)]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-300/70 bg-amber-500/20 text-amber-300">
                          <Gift className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black tracking-wide text-amber-200">
                            Convide Amigos e Ganhe 10% em DL Din!
                          </p>
                          <p className="mt-0.5 text-[10.5px] leading-snug text-sky-100/90">
                            Quem criar conta pelo seu link ou usar seu código já
                            conta na hora para seus indicados e no{' '}
                            <strong className="text-amber-200">
                              Rank Mensal de Convites
                            </strong>
                            . Toda vez que seu indicado recarregar{' '}
                            <strong className="text-amber-300">DL Din</strong>,
                            você ganha{' '}
                            <strong className="text-emerald-300">
                              10% automaticamente
                            </strong>
                            !
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onPlayTone('click');
                          void loadReferralDashboard();
                        }}
                        aria-label="Atualizar convites"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-400/40 bg-[#051845] text-cyan-200 hover:bg-sky-700 active:scale-95"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${referralLoading ? 'animate-spin' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Stats Summary Row (Total / Mensal / DL Din Ganhos) */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="rounded-xl border border-cyan-400/40 bg-[#04143c]/95 px-2 py-2 text-center">
                      <p className="text-[9.5px] font-bold uppercase tracking-wide text-cyan-200/80">
                        Total Convidados
                      </p>
                      <p className="mt-0.5 text-lg font-black tabular-nums text-white">
                        {(referralData?.profile?.totalInvites ?? 0).toLocaleString(
                          'pt-BR'
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-300/50 bg-[#071a4a]/95 px-2 py-2 text-center">
                      <p className="truncate text-[9.5px] font-bold uppercase tracking-wide text-amber-200">
                        {referralData?.currentMonthLabel ?? 'Mês Atual'}
                      </p>
                      <p className="mt-0.5 text-lg font-black tabular-nums text-amber-300">
                        {(
                          referralData?.profile?.effectiveMonthlyInvites ?? 0
                        ).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-400/45 bg-[#042430]/90 px-2 py-2 text-center">
                      <p className="text-[9.5px] font-bold uppercase tracking-wide text-emerald-200">
                        DL Din (10%)
                      </p>
                      <p className="mt-0.5 text-lg font-black tabular-nums text-emerald-300">
                        +
                        {(
                          referralData?.profile?.totalCommissionEarned ?? 0
                        ).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Own Invite Code & Shareable Link Card */}
                  <div className="rounded-xl border border-cyan-300/60 bg-[#04143e]/95 p-3 space-y-2.5">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-200">
                        Seu Código de Convite
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex h-10 flex-1 items-center justify-center rounded-lg border border-amber-300/65 bg-[#020c28] px-3 font-mono text-base font-black tracking-[0.2em] text-amber-200 select-all">
                          {myInviteCodeDisplay || 'GERANDO...'}
                        </div>
                        <button
                          type="button"
                          disabled={!myInviteCodeRaw}
                          onClick={() =>
                            void handleCopyText('code', myInviteCodeDisplay)
                          }
                          className="clip-cyber-input shrink-0 bg-gradient-to-b from-[#fff59d] via-[#fbbf24] to-[#b45309] p-[2px] transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                        >
                          <span className="clip-cyber-input flex h-9 items-center gap-1.5 bg-gradient-to-b from-[#ffe44d] via-[#f5b400] to-[#d97706] px-3 text-[11px] font-black text-[#170b00]">
                            {copiedTarget === 'code' ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            <span>
                              {copiedTarget === 'code'
                                ? 'Copiado!'
                                : 'Copiar Código'}
                            </span>
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-cyan-200">
                        <Link2 className="h-3 w-3 text-cyan-300" />
                        <span>Seu Link de Convite Direto</span>
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex h-9 min-w-0 flex-1 items-center rounded-lg border border-cyan-400/45 bg-[#020c28] px-2.5 text-[11px] font-semibold text-sky-100 select-all">
                          <span className="truncate">
                            {myInviteLink || 'Gerando link...'}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={!myInviteLink}
                          onClick={() =>
                            void handleCopyText('link', myInviteLink)
                          }
                          className="clip-cyber-input shrink-0 bg-gradient-to-b from-[#6be8ff] to-[#0d5be0] p-[2px] transition hover:brightness-110 active:scale-95 disabled:opacity-50"
                        >
                          <span className="clip-cyber-input flex h-8 items-center gap-1.5 bg-gradient-to-b from-[#1772f0] via-[#0b47bd] to-[#062875] px-3 text-[11px] font-black text-white">
                            {copiedTarget === 'link' ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Link2 className="h-3.5 w-3.5" />
                            )}
                            <span>
                              {copiedTarget === 'link'
                                ? 'Copiado!'
                                : 'Copiar Link'}
                            </span>
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Redeem Friend's Invite Code Box */}
                  <div className="rounded-xl border border-cyan-400/45 bg-[#031136]/95 p-3">
                    {referralData?.myClaim ? (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-400/60 bg-emerald-500/20 text-emerald-300">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-emerald-200">
                            Código de convite vinculado!
                          </p>
                          <p className="truncate text-[11px] text-sky-100/90">
                            Você entrou pelo convite de{' '}
                            <strong className="text-white">
                              {referralData.myClaim.referrerName}
                            </strong>{' '}
                            (
                            <span className="font-mono text-amber-200">
                              {formatReferralCodeDisplay(
                                referralData.myClaim.inviteCode
                              )}
                            </span>
                            ).
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[11px] font-black text-white">
                          Recebeu um código de convite de um amigo?
                        </p>
                        <p className="mt-0.5 text-[10px] text-sky-200/80">
                          Informe abaixo para contabilizar a indicação na hora
                          (válido uma vez por conta).
                        </p>
                        <div className="mt-2 flex items-center gap-1.5">
                          <input
                            type="text"
                            maxLength={64}
                            value={redeemCodeInput}
                            onChange={(e) =>
                              setRedeemCodeInput(e.target.value.toUpperCase())
                            }
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter') {
                                void handleRedeemInviteCode();
                              }
                            }}
                            placeholder="Ex.: DL-7X9K2P ou cole o link"
                            className="h-9 flex-1 select-text rounded-lg border border-amber-300/50 bg-[#020a24] px-2.5 text-xs font-bold tracking-wider text-amber-100 placeholder:font-normal placeholder:tracking-normal placeholder:text-sky-300/60 focus:border-amber-300 focus:outline-none"
                          />
                          <button
                            type="button"
                            disabled={redeemSubmitting}
                            onClick={() => void handleRedeemInviteCode()}
                            className="clip-cyber-input shrink-0 bg-gradient-to-b from-[#fff59d] via-[#fbbf24] to-[#b45309] p-[1.5px] transition hover:brightness-110 active:scale-95 disabled:opacity-60"
                          >
                            <span className="clip-cyber-input flex h-9 items-center gap-1 bg-gradient-to-b from-[#ffe44d] via-[#f5b400] to-[#d97706] px-3 text-[11px] font-black text-[#170b00]">
                              {redeemSubmitting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              <span>Aplicar</span>
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Invited Players History */}
                  <div className="rounded-xl border border-cyan-400/35 bg-[#031036]/90 p-3">
                    <div className="flex items-center justify-between pb-2">
                      <p className="text-[11px] font-black uppercase tracking-wide text-cyan-200">
                        Seus Indicados ({referralData?.invitedPlayers.length ?? 0})
                      </p>
                      <span className="text-[10px] font-bold text-amber-200/85">
                        10% em DL Din por recarga
                      </span>
                    </div>
                    {!referralData ||
                    referralData.invitedPlayers.length === 0 ? (
                      <p className="py-3 text-center text-[11px] text-sky-200/75">
                        Nenhum amigo entrou pelo seu código ainda. Copie seu
                        link acima e convide novos Tamers!
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {referralData.invitedPlayers.map((inv) => {
                          const dateStr = new Date(
                            inv.createdAtMs
                          ).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          });
                          return (
                            <div
                              key={inv.referredUid}
                              className="flex items-center justify-between gap-2 rounded-lg border border-cyan-400/25 bg-[#051845]/90 px-2.5 py-1.5"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-amber-300/50 bg-amber-500/20 text-[10px] font-black text-amber-200">
                                  <UserPlus className="h-3 w-3" />
                                </span>
                                <span className="truncate text-xs font-extrabold text-white">
                                  {inv.referredName}
                                </span>
                              </div>
                              <span className="shrink-0 text-[10px] font-bold tabular-nums text-cyan-200/80">
                                {dateStr}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom Action Bar */}
        {activeTab === 'invites' ? (
          <div className="relative z-10 flex shrink-0 items-center justify-between gap-2 border-t border-cyan-400/40 bg-[#031036]/95 px-3 py-2.5 sm:px-4">
            <div className="text-[11px] font-bold text-cyan-100">
              Convidados:{' '}
              <strong className="font-black tabular-nums text-amber-300">
                {referralData?.profile?.totalInvites ?? 0}
              </strong>{' '}
              <span className="text-cyan-300/80">
                ({referralData?.profile?.effectiveMonthlyInvites ?? 0} no mês)
              </span>
            </div>
            <button
              type="button"
              disabled={!myInviteLink}
              onClick={() => void handleCopyText('link', myInviteLink)}
              className="clip-cyber-input bg-gradient-to-b from-[#fff59d] via-[#fbbf24] to-[#b45309] p-[2px] shadow-[0_0_16px_rgba(251,191,36,0.5)] transition hover:brightness-110 active:scale-95 disabled:opacity-50"
            >
              <span className="clip-cyber-input flex min-h-[34px] items-center justify-center gap-1.5 bg-gradient-to-b from-[#ffe44d] via-[#f5b400] to-[#d97706] px-4 text-[11px] font-black italic text-[#170b00]">
                <Link2 className="h-3.5 w-3.5" />
                <span>Copiar Link de Convite</span>
              </span>
            </button>
          </div>
        ) : (
          <div className="relative z-10 grid shrink-0 grid-cols-3 items-center gap-1.5 border-t border-cyan-400/40 bg-[#031036]/95 px-3 py-2.5 sm:gap-2.5 sm:px-4">
            {/* Friends Counter Pill */}
            <div className="clip-cyber-input bg-gradient-to-b from-[#38e8ff] to-[#0c56d0] p-[1.5px]">
              <div className="clip-cyber-input flex min-h-[38px] items-center justify-center gap-1.5 bg-[#041540] px-2 text-[10.5px] font-black italic tabular-nums text-white sm:text-xs">
                <Users className="h-3.5 w-3.5 shrink-0 text-cyan-200 sm:h-4 sm:w-4" />
                <span className="truncate">
                  Amigos: {state.friends.length} (∞)
                </span>
              </div>
            </div>

            {/* Electric-Blue "Adicionar Amigo" Button */}
            <button
              type="button"
              onClick={() => {
                onPlayTone('click');
                setAddInputOpen((prev) => {
                  const next = !prev;
                  if (next) {
                    requestAnimationFrame(() => addInputRef.current?.focus());
                  }
                  return next;
                });
              }}
              className="clip-cyber-input bg-gradient-to-b from-[#6be8ff] to-[#0d5be0] p-[2px] shadow-[0_0_16px_rgba(56,214,255,0.5)] transition hover:brightness-110 active:scale-95"
            >
              <span className="clip-cyber-input flex min-h-[38px] items-center justify-center gap-1.5 bg-gradient-to-b from-[#1772f0] via-[#0b47bd] to-[#062875] px-2 text-[10.5px] font-black italic text-white sm:text-xs">
                <UserPlus className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate">Adicionar Amigo</span>
              </span>
            </button>

            {/* Golden "Enviar Pedido" Button */}
            <button
              type="button"
              onClick={() => handleSendRequest()}
              className="clip-cyber-input bg-gradient-to-b from-[#fff59d] via-[#fbbf24] to-[#b45309] p-[2px] shadow-[0_0_18px_rgba(251,191,36,0.6)] transition hover:brightness-110 active:scale-95"
            >
              <span className="clip-cyber-input flex min-h-[38px] items-center justify-center gap-1.5 bg-gradient-to-b from-[#ffe44d] via-[#f5b400] to-[#d97706] px-2 text-[10.5px] font-black italic text-[#170b00] sm:text-xs">
                <Send className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span className="truncate">Enviar Pedido</span>
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
