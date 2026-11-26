import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Flame,
  Globe,
  ImagePlus,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Shield,
  Star,
  Swords,
  Trash2,
  Trophy,
  Upload,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import {
  DAILY_GUILD_EVENT_TIERS,
  GUILD_CREATION_COST_BITS,
  GUILD_MAX_LEVEL,
  computeDailyGuildEventStandings,
  createNewGuild,
  disbandGuildAsMaster,
  fetchLeaderTamerProfileFallback,
  fetchRecruitingGuilds,
  getDailyResetCountdown,
  getEffectiveGuildTotalKills,
  getEffectiveMemberDailyKills,
  getEffectiveMemberTotalKills,
  getGuildExpRequiredForLevel,
  getGuildMaxMembersForLevel,
  joinRecruitingGuild,
  leaveOrDisbandGuild,
  manageGuildMemberRoleOrKick,
  processGuildPhotoUpload,
  sendGuildChatMessage,
  updateGuildEmblemPhoto,
  updateGuildLeaderPhoto,
  updateGuildNoticeAndRecruiting,
  type GuildEmblemColor,
  type GuildMemberRecord,
  type GuildRecord,
  type GuildRole,
} from '../../services/guildService';
import type { TamerId } from '../../types/character';
import { getDigimonFormProfile, type DigimonFormId } from '../../types/digimon';
import { isValidCoverPhotoDataUrl } from '../../utils/avatarPhoto';
import { TamerPortraitAvatar } from './TamerPortraitAvatar';

interface GuildSystemModalProps {
  guild: GuildRecord | null;
  actorUid: string;
  tamerName: string;
  tamerLevel: number;
  tamerId?: TamerId;
  tamerPhotoUrl?: string | null;
  activeDigimonFormId?: DigimonFormId;
  onlinePlayerUids?: string[];
  onlineDigimonByUid?: Record<string, DigimonFormId>;
  onlineCharacterByUid?: Record<string, TamerId>;
  bits: number;
  isGM: boolean;
  onDeductCreationBits: (costBits: number) => boolean;
  onNotifyEvent: (title: string, detail: string) => void;
  onPlayTone: (tone: 'click' | 'confirm' | 'error') => void;
  onClose: () => void;
}

type InsideTab = 'members' | 'contribution' | 'events' | 'settings';
type ContributionViewMode = 'daily' | 'general';
type EventsSubView = 'live' | 'prizes' | 'chat';
type SearchMode = 'browse' | 'create';

const EMBLEM_PALETTE: Record<
  GuildEmblemColor,
  {
    label: string;
    outerStroke: string;
    innerBgStart: string;
    innerBgEnd: string;
    wingColor: string;
    glow: string;
    swatch: string;
  }
> = {
  cyan: {
    label: 'Azul Digital',
    outerStroke: '#38bdf8',
    innerBgStart: '#0b3c9c',
    innerBgEnd: '#041232',
    wingColor: '#facc15',
    glow: 'drop-shadow-[0_0_10px_rgba(56,189,248,0.6)]',
    swatch: 'from-cyan-400 to-blue-700',
  },
  amber: {
    label: 'Ouro Real',
    outerStroke: '#facc15',
    innerBgStart: '#854d0e',
    innerBgEnd: '#1c1205',
    wingColor: '#fde047',
    glow: 'drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]',
    swatch: 'from-amber-300 to-orange-600',
  },
  crimson: {
    label: 'Rubi Fogo',
    outerStroke: '#f43f5e',
    innerBgStart: '#881337',
    innerBgEnd: '#20050d',
    wingColor: '#fb7185',
    glow: 'drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]',
    swatch: 'from-rose-400 to-red-700',
  },
  emerald: {
    label: 'Esmeralda',
    outerStroke: '#34d399',
    innerBgStart: '#065f46',
    innerBgEnd: '#031d16',
    wingColor: '#6ee7b7',
    glow: 'drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]',
    swatch: 'from-emerald-400 to-green-700',
  },
  violet: {
    label: 'Violeta X',
    outerStroke: '#c084fc',
    innerBgStart: '#581c87',
    innerBgEnd: '#160626',
    wingColor: '#e879f9',
    glow: 'drop-shadow-[0_0_10px_rgba(192,132,252,0.6)]',
    swatch: 'from-fuchsia-400 to-purple-800',
  },
};

const ROLE_PRIORITY: Record<GuildRole, number> = {
  master: 0,
  submaster: 1,
  officer: 2,
  member: 3,
};

const GUILDS_PER_PAGE = 5;
const MEMBERS_PER_PAGE = 6;

const CHAMFER_FRAME =
  '[clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]';
const CHAMFER_BTN =
  '[clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]';
const CHAMFER_SM =
  '[clip-path:polygon(7px_0,calc(100%-7px)_0,100%_7px,100%_calc(100%-7px),calc(100%-7px)_100%,7px_100%,0_calc(100%-7px),0_7px)]';

function formatNumberPt(n: number): string {
  return Math.max(0, Math.round(n)).toLocaleString('pt-BR');
}

function resolveMemberPortraitUrl(
  member: GuildMemberRecord | undefined,
  onlineDigimonByUid: Record<string, DigimonFormId>,
  fallbackFormId?: DigimonFormId
): string {
  const candidate =
    (member ? onlineDigimonByUid[member.uid] : undefined) ||
    (member?.digimonFormId as DigimonFormId | undefined) ||
    fallbackFormId ||
    'agumon';
  return getDigimonFormProfile(candidate).portraitUrl;
}

interface GuildShieldEmblemProps {
  tag: string;
  emblemColor: GuildEmblemColor;
  emblemPhotoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showCrown?: boolean;
  onEditPhotoClick?: () => void;
}

function GuildShieldEmblem({
  tag,
  emblemColor,
  emblemPhotoUrl,
  size = 'md',
  showCrown = true,
  onEditPhotoClick,
}: GuildShieldEmblemProps) {
  const uid = useId().replace(/:/g, '');
  const palette = EMBLEM_PALETTE[emblemColor] ?? EMBLEM_PALETTE.cyan;

  const dims =
    size === 'lg'
      ? 'h-[86px] w-[86px] sm:h-[96px] sm:w-[96px]'
      : size === 'sm'
      ? 'h-12 w-12'
      : 'h-[62px] w-[62px] sm:h-[68px] sm:w-[68px]';

  return (
    <div className={`relative shrink-0 select-none ${dims}`}>
      <svg
        viewBox="0 0 120 128"
        className={`h-full w-full overflow-visible ${palette.glow}`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.innerBgStart} />
            <stop offset="100%" stopColor={palette.innerBgEnd} />
          </linearGradient>
          <linearGradient id={`gold-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id={`gloss-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.0)" />
          </linearGradient>
          <clipPath id={`shield-clip-${uid}`}>
            <path d="M60 22 L95 32 L92 75 C90 95 75 109 60 116 C45 109 30 95 28 75 L25 32 Z" />
          </clipPath>
        </defs>

        {/* Golden Side Laurel Wings */}
        <path
          d="M23 44 C10 50 9 72 18 89 C23 99 35 109 49 114 C38 103 31 92 27 78 C24 66 23 54 23 44 Z"
          fill={`url(#gold-${uid})`}
          opacity="0.92"
        />
        <path
          d="M97 44 C110 50 111 72 102 89 C97 99 85 109 71 114 C82 103 89 92 93 78 C96 66 97 54 97 44 Z"
          fill={`url(#gold-${uid})`}
          opacity="0.92"
        />

        {/* Top Crown */}
        {showCrown && (
          <path
            d="M41 24 L45 9 L54 17 L60 5 L66 17 L75 9 L79 24 Z"
            fill={`url(#gold-${uid})`}
            stroke="#78350f"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}

        {/* Outer Metallic Shield Frame */}
        <path
          d="M60 17 L101 29 L98 76 C95 99 78 114 60 122 C42 114 25 99 22 76 L19 29 Z"
          fill="#081430"
          stroke={palette.outerStroke}
          strokeWidth="3.2"
          strokeLinejoin="round"
        />

        {/* Inner Shield Background */}
        <path
          d="M60 22 L95 32 L92 75 C90 95 75 109 60 116 C45 109 30 95 28 75 L25 32 Z"
          fill={`url(#bg-${uid})`}
          stroke={`url(#gold-${uid})`}
          strokeWidth="2.5"
        />

        {/* Custom Uploaded Guild Photo OR Crisp Vector Emblem */}
        {isValidCoverPhotoDataUrl(emblemPhotoUrl) ? (
          <image
            href={emblemPhotoUrl}
            x="22"
            y="20"
            width="76"
            height="98"
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#shield-clip-${uid})`}
          />
        ) : (
          <g clipPath={`url(#shield-clip-${uid})`}>
            <path
              d="M60 32 L78 46 L72 78 L60 94 L48 78 L42 46 Z"
              fill={palette.outerStroke}
              opacity="0.22"
            />
            <text
              x="60"
              y="74"
              textAnchor="middle"
              fill="#ffffff"
              fontSize={tag.length >= 4 ? '21' : '25'}
              fontWeight="900"
              fontStyle="italic"
              letterSpacing="1"
            >
              {tag || 'DATS'}
            </text>
          </g>
        )}

        {/* Top Specular Gloss */}
        <path
          d="M60 22 L95 32 L93 56 C76 62 44 62 27 56 L25 32 Z"
          fill={`url(#gloss-${uid})`}
          clipPath={`url(#shield-clip-${uid})`}
        />
      </svg>

      {onEditPhotoClick && (
        <button
          type="button"
          onClick={onEditPhotoClick}
          title="Alterar foto da Guilda"
          aria-label="Alterar foto da Guilda"
          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-cyan-200 bg-[#07266b] text-amber-300 shadow-[0_0_12px_rgba(0,212,255,0.75)] transition-transform hover:scale-110 hover:bg-sky-700"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function RoleChamferBadge({ role }: { role: GuildRole }) {
  if (role === 'master') {
    return (
      <span
        className={`inline-flex min-w-[82px] items-center justify-center gap-1 border border-amber-300/90 bg-gradient-to-b from-[#4d3408] to-[#261904] px-2.5 py-0.5 text-[11px] font-black italic text-amber-200 shadow-[0_0_10px_rgba(250,204,21,0.3)] ${CHAMFER_SM}`}
      >
        <Crown className="h-3 w-3 text-amber-300" />
        <span>Líder</span>
      </span>
    );
  }
  if (role === 'submaster') {
    return (
      <span
        className={`inline-flex min-w-[82px] items-center justify-center gap-1 border border-cyan-300/90 bg-gradient-to-b from-[#0b4b7a] to-[#052344] px-2.5 py-0.5 text-[11px] font-extrabold italic text-cyan-100 ${CHAMFER_SM}`}
      >
        <Shield className="h-3 w-3 text-amber-300" />
        <span>Sub-Líder</span>
      </span>
    );
  }
  if (role === 'officer') {
    return (
      <span
        className={`inline-flex min-w-[82px] items-center justify-center gap-1 border border-sky-300/80 bg-gradient-to-b from-[#0a3c7c] to-[#041d46] px-2.5 py-0.5 text-[11px] font-extrabold italic text-sky-100 ${CHAMFER_SM}`}
      >
        <Shield className="h-3 w-3 text-cyan-300" />
        <span>Oficial</span>
      </span>
    );
  }
  return (
    <span
      className={`inline-flex min-w-[82px] items-center justify-center gap-1 border border-blue-400/65 bg-gradient-to-b from-[#0a2c6b] to-[#04163d] px-2.5 py-0.5 text-[11px] font-bold italic text-blue-100 ${CHAMFER_SM}`}
    >
      <Users className="h-3 w-3 text-sky-300" />
      <span>Membro</span>
    </span>
  );
}

export function GuildSystemModal({
  guild,
  actorUid,
  tamerName,
  tamerLevel,
  tamerId = 'kai',
  tamerPhotoUrl = null,
  activeDigimonFormId = 'agumon',
  onlinePlayerUids = [],
  onlineDigimonByUid = {},
  onlineCharacterByUid = {},
  bits,
  isGM,
  onDeductCreationBits,
  onNotifyEvent,
  onPlayTone,
  onClose,
}: GuildSystemModalProps) {
  // Search / Create state (when player has no guild)
  const [searchMode, setSearchMode] = useState<SearchMode>('browse');
  const [searchDraft, setSearchDraft] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [searchPage, setSearchPage] = useState(1);
  const [allServerGuilds, setAllServerGuilds] = useState<GuildRecord[]>([]);
  const [loadingGuilds, setLoadingGuilds] = useState(false);

  // Create Guild Form state
  const [createName, setCreateName] = useState('');
  const [createTag, setCreateTag] = useState('');
  const [createColor, setCreateColor] = useState<GuildEmblemColor>('cyan');
  const [createNotice, setCreateNotice] = useState('');
  const [createPhotoUrl, setCreatePhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Inside Guild state
  const [insideTab, setInsideTab] = useState<InsideTab>('members');
  const [contribMode, setContribMode] = useState<ContributionViewMode>('daily');
  const [eventsSubView, setEventsSubView] = useState<EventsSubView>('live');
  const [membersPage, setMembersPage] = useState(1);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [noticeDraft, setNoticeDraft] = useState(guild?.notice ?? '');
  const [editingLeaderPhrase, setEditingLeaderPhrase] = useState(false);
  const [leaderPhraseDraft, setLeaderPhraseDraft] = useState(guild?.notice ?? '');
  const [legacyLeaderProfile, setLegacyLeaderProfile] = useState<{
    characterId?: TamerId;
    tamerPhotoUrl?: string | null;
  } | null>(null);
  const [recruitingDraft, setRecruitingDraft] = useState(guild?.recruiting ?? true);
  const [colorDraft, setColorDraft] = useState<GuildEmblemColor>(guild?.emblemColor ?? 'cyan');
  const [photoDraft, setPhotoDraft] = useState<string | null>(guild?.emblemPhotoUrl ?? null);
  const [confirmLeaveStep, setConfirmLeaveStep] = useState<'none' | 'leave' | 'disband'>('none');
  const [countdown, setCountdown] = useState(() => getDailyResetCountdown());

  // Feedback banner
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const createFileInputRef = useRef<HTMLInputElement | null>(null);
  const settingsFileInputRef = useRef<HTMLInputElement | null>(null);
  const quickHeaderFileInputRef = useRef<HTMLInputElement | null>(null);
  const leaderFileInputRef = useRef<HTMLInputElement | null>(null);

  const onlineSet = useMemo(() => {
    const s = new Set<string>(onlinePlayerUids);
    if (actorUid) s.add(actorUid);
    return s;
  }, [onlinePlayerUids, actorUid]);

  // Keep draft settings synchronized with live guild updates
  useEffect(() => {
    if (guild) {
      setNoticeDraft(guild.notice);
      setRecruitingDraft(guild.recruiting);
      setColorDraft(guild.emblemColor);
      setPhotoDraft(guild.emblemPhotoUrl ?? null);
    }
  }, [guild]);

  useEffect(() => {
    setEditingLeaderPhrase(false);
    setLeaderPhraseDraft(guild?.notice ?? '');
  }, [guild?.guildId]);

  useEffect(() => {
    if (!editingLeaderPhrase) {
      setLeaderPhraseDraft(guild?.notice ?? '');
    }
  }, [guild?.notice, editingLeaderPhrase]);

  useEffect(() => {
    if (!guild || guild.masterUid === actorUid) {
      setLegacyLeaderProfile(null);
      return;
    }
    const member = guild.members[guild.masterUid];
    if (member?.characterId && member?.tamerPhotoUrl) {
      setLegacyLeaderProfile(null);
      return;
    }
    let cancelled = false;
    void fetchLeaderTamerProfileFallback(guild.masterUid).then((res) => {
      if (!cancelled) setLegacyLeaderProfile(res);
    });
    return () => {
      cancelled = true;
    };
  }, [guild?.guildId, guild?.masterUid, actorUid, guild?.members[guild?.masterUid ?? '']?.characterId, guild?.members[guild?.masterUid ?? '']?.tamerPhotoUrl]);

  // Load recruiting/server guilds for Search & Daily Event Ranking calculations
  const reloadServerGuilds = async () => {
    setLoadingGuilds(true);
    const list = await fetchRecruitingGuilds();
    setAllServerGuilds(list);
    setLoadingGuilds(false);
  };

  useEffect(() => {
    void reloadServerGuilds();
  }, [guild?.guildId]);

  // Live 1-second Brasília midnight reset clock (23:59 -> 00:00)
  useEffect(() => {
    let prevDay = getDailyResetCountdown().todayKey;
    const timer = window.setInterval(() => {
      const next = getDailyResetCountdown();
      setCountdown(next);
      if (next.todayKey !== prevDay) {
        prevDay = next.todayKey;
        void reloadServerGuilds();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const myMember = guild ? guild.members[actorUid] : undefined;
  const myRole: GuildRole = myMember?.role ?? 'member';
  const isMaster = Boolean(guild && guild.masterUid === actorUid);
  const canManage = isMaster || myRole === 'submaster';

  const eventSummary = useMemo(
    () => computeDailyGuildEventStandings(allServerGuilds, guild, new Date()),
    [allServerGuilds, guild, countdown.todayKey]
  );

  const sortedMembers = useMemo(() => {
    if (!guild) return [];
    return Object.values(guild.members).sort((a, b) => {
      const pDiff = ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];
      if (pDiff !== 0) return pDiff;
      const kb = getEffectiveMemberDailyKills(b, guild, countdown.todayKey);
      const ka = getEffectiveMemberDailyKills(a, guild, countdown.todayKey);
      if (kb !== ka) return kb - ka;
      return getEffectiveMemberTotalKills(b) - getEffectiveMemberTotalKills(a);
    });
  }, [guild, countdown.todayKey]);

  const sortedMembersByContrib = useMemo(() => {
    if (!guild) return [];
    const list = Object.values(guild.members);
    if (contribMode === 'daily') {
      return [...list].sort((a, b) => {
        const kb = getEffectiveMemberDailyKills(b, guild, countdown.todayKey);
        const ka = getEffectiveMemberDailyKills(a, guild, countdown.todayKey);
        if (kb !== ka) return kb - ka;
        return getEffectiveMemberTotalKills(b) - getEffectiveMemberTotalKills(a);
      });
    }
    return [...list].sort((a, b) => {
      const tb = getEffectiveMemberTotalKills(b);
      const ta = getEffectiveMemberTotalKills(a);
      if (tb !== ta) return tb - ta;
      return b.contributionExp - a.contributionExp;
    });
  }, [guild, contribMode, countdown.todayKey]);

  const rankedGuilds = useMemo(() => {
    const map = new Map<string, GuildRecord>();
    for (const g of allServerGuilds) map.set(g.guildId, g);
    if (guild) map.set(guild.guildId, guild);
    return Array.from(map.values()).sort(
      (a, b) => b.level - a.level || b.exp - a.exp || b.memberUids.length - a.memberUids.length
    );
  }, [allServerGuilds, guild]);

  const myGuildRank = useMemo(() => {
    if (!guild) return 1;
    const idx = rankedGuilds.findIndex((g) => g.guildId === guild.guildId);
    return idx >= 0 ? idx + 1 : 1;
  }, [guild, rankedGuilds]);

  // Filtered guilds for Buscar Guilda
  const filteredGuilds = useMemo(() => {
    const term = appliedSearch.trim().toLowerCase();
    if (!term) return allServerGuilds;
    return allServerGuilds.filter(
      (g) =>
        g.name.toLowerCase().includes(term) ||
        g.tag.toLowerCase().includes(term) ||
        g.masterName.toLowerCase().includes(term) ||
        g.notice.toLowerCase().includes(term)
    );
  }, [allServerGuilds, appliedSearch]);

  const totalSearchPages = Math.max(1, Math.ceil(filteredGuilds.length / GUILDS_PER_PAGE));
  const safeSearchPage = Math.min(searchPage, totalSearchPages);
  const visibleSearchGuilds = filteredGuilds.slice(
    (safeSearchPage - 1) * GUILDS_PER_PAGE,
    safeSearchPage * GUILDS_PER_PAGE
  );

  const totalMemberPages = Math.max(1, Math.ceil(sortedMembers.length / MEMBERS_PER_PAGE));
  const safeMemberPage = Math.min(membersPage, totalMemberPages);
  const visibleMembers = sortedMembers.slice(
    (safeMemberPage - 1) * MEMBERS_PER_PAGE,
    safeMemberPage * MEMBERS_PER_PAGE
  );

  const expNeeded = guild ? getGuildExpRequiredForLevel(guild.level) : 1200;
  const expPct = guild
    ? guild.level >= GUILD_MAX_LEVEL
      ? 100
      : Math.min(100, Math.round((guild.exp / Math.max(1, expNeeded)) * 100))
    : 0;
  const maxMembers = guild ? getGuildMaxMembersForLevel(guild.level) : 30;

  const countOnlineMembers = (g: GuildRecord): number => {
    let count = 0;
    for (const uid of g.memberUids) {
      if (onlineSet.has(uid)) count += 1;
    }
    return count;
  };

  const handlePhotoFileSelected = async (
    file: File | null | undefined,
    target: 'create' | 'settings' | 'quick-header',
    inputEl?: HTMLInputElement | null
  ) => {
    if (!file) {
      if (inputEl) inputEl.value = '';
      return;
    }
    setFeedback(null);
    setUploadingPhoto(true);
    try {
      const res = await processGuildPhotoUpload(file);

      if (!res.ok || !res.dataUrl) {
        onPlayTone('error');
        setFeedback({ type: 'err', text: res.error ?? 'Não foi possível carregar esta foto.' });
        return;
      }

      if (target === 'create') {
        setCreatePhotoUrl(res.dataUrl);
        onPlayTone('confirm');
        setFeedback({ type: 'ok', text: 'Foto da Guilda anexada e otimizada para o escudo!' });
        return;
      }

      if (target === 'settings') {
        setPhotoDraft(res.dataUrl);
        onPlayTone('confirm');
        setFeedback({
          type: 'ok',
          text: 'Prévia atualizada! Clique em "Salvar Configurações" para aplicar na Guilda.',
        });
        return;
      }

      // quick-header: save immediately to the guild
      if (guild && canManage) {
        setBusy(true);
        try {
          const saveRes = await updateGuildEmblemPhoto({
            guildId: guild.guildId,
            emblemPhotoUrl: res.dataUrl,
          });
          if (saveRes.ok) {
            onPlayTone('confirm');
            setFeedback({ type: 'ok', text: 'Foto oficial da Guilda atualizada com sucesso!' });
            onNotifyEvent('Foto da Guilda Atualizada', `O escudo da guilda ${guild.name} recebeu uma nova foto.`);
          } else {
            onPlayTone('error');
            setFeedback({ type: 'err', text: saveRes.error ?? 'Erro ao salvar foto.' });
          }
        } finally {
          setBusy(false);
        }
      }
    } catch {
      onPlayTone('error');
      setFeedback({ type: 'err', text: 'Não foi possível processar esta foto.' });
    } finally {
      setUploadingPhoto(false);
      if (inputEl) {
        try {
          inputEl.value = '';
        } catch {
          // Ignore reset errors
        }
      }
    }
  };

  const handleLeaderPhotoFileSelected = async (
    file: File | null | undefined,
    inputEl?: HTMLInputElement | null
  ) => {
    if (!file || !guild || !isMaster) {
      if (inputEl) inputEl.value = '';
      return;
    }
    setFeedback(null);
    setUploadingPhoto(true);
    try {
      const res = await processGuildPhotoUpload(file);
      if (!res.ok || !res.dataUrl) {
        onPlayTone('error');
        setFeedback({ type: 'err', text: res.error ?? 'Não foi possível carregar esta foto.' });
        return;
      }
      setBusy(true);
      try {
        const saveRes = await updateGuildLeaderPhoto({
          guildId: guild.guildId,
          leaderUid: actorUid,
          characterId: tamerId,
          tamerPhotoUrl: res.dataUrl,
        });
        if (saveRes.ok) {
          onPlayTone('confirm');
          setFeedback({ type: 'ok', text: 'Foto do Líder atualizada com sucesso!' });
        } else {
          onPlayTone('error');
          setFeedback({ type: 'err', text: saveRes.error ?? 'Erro ao salvar foto do Líder.' });
        }
      } finally {
        setBusy(false);
      }
    } catch {
      onPlayTone('error');
      setFeedback({ type: 'err', text: 'Não foi possível processar esta foto.' });
    } finally {
      setUploadingPhoto(false);
      if (inputEl) {
        try {
          inputEl.value = '';
        } catch {
          // Ignore reset errors
        }
      }
    }
  };

  const handleResetLeaderPhoto = async () => {
    if (!guild || !isMaster) return;
    setFeedback(null);
    setBusy(true);
    const res = await updateGuildLeaderPhoto({
      guildId: guild.guildId,
      leaderUid: actorUid,
      characterId: tamerId,
      tamerPhotoUrl: null,
    });
    setBusy(false);
    if (!res.ok) {
      onPlayTone('error');
      setFeedback({ type: 'err', text: res.error ?? 'Não foi possível remover a foto.' });
      return;
    }
    onPlayTone('confirm');
    setFeedback({ type: 'ok', text: 'Foto do Líder restaurada para o Tamer padrão.' });
  };

  const handleSaveLeaderPhrase = async () => {
    if (!guild || !isMaster) return;
    setFeedback(null);
    setBusy(true);
    const res = await updateGuildNoticeAndRecruiting({
      guildId: guild.guildId,
      notice: leaderPhraseDraft,
      recruiting: guild.recruiting,
    });
    setBusy(false);
    if (!res.ok) {
      onPlayTone('error');
      setFeedback({ type: 'err', text: res.error ?? 'Sem permissão para salvar a frase.' });
      return;
    }
    setEditingLeaderPhrase(false);
    onPlayTone('confirm');
    setFeedback({ type: 'ok', text: 'Frase do Líder atualizada!' });
  };

  const handleCreateGuild = async () => {
    setFeedback(null);
    if (GUILD_CREATION_COST_BITS > 0 && !isGM && bits < GUILD_CREATION_COST_BITS) {
      onPlayTone('error');
      setFeedback({
        type: 'err',
        text: `Você precisa de ${GUILD_CREATION_COST_BITS.toLocaleString('pt-BR')} Bits para fundar uma Guilda.`,
      });
      return;
    }

    setBusy(true);
    const res = await createNewGuild({
      actorUid,
      tamerName,
      tamerLevel,
      characterId: tamerId,
      tamerPhotoUrl,
      digimonFormId: activeDigimonFormId,
      name: createName,
      tag: createTag,
      emblemColor: createColor,
      emblemPhotoUrl: createPhotoUrl,
      notice: createNotice,
    });
    setBusy(false);

    if (!res.ok || !res.guild) {
      onPlayTone('error');
      setFeedback({ type: 'err', text: res.error ?? 'Erro ao criar a Guilda.' });
      return;
    }

    if (!isGM && GUILD_CREATION_COST_BITS > 0) {
      onDeductCreationBits(GUILD_CREATION_COST_BITS);
    }
    onPlayTone('confirm');
    onNotifyEvent(
      'Guilda Fundada!',
      `Você fundou a guilda [${res.guild.tag}] ${res.guild.name} na DATS!`
    );
    setInsideTab('members');
  };

  const handleJoinGuild = async (targetGuild: GuildRecord) => {
    setFeedback(null);
    setBusy(true);
    const res = await joinRecruitingGuild({
      guildId: targetGuild.guildId,
      actorUid,
      tamerName,
      tamerLevel,
      characterId: tamerId,
      tamerPhotoUrl,
      digimonFormId: activeDigimonFormId,
    });
    setBusy(false);

    if (!res.ok) {
      onPlayTone('error');
      setFeedback({ type: 'err', text: res.error ?? 'Não foi possível entrar na Guilda.' });
      return;
    }
    onPlayTone('confirm');
    onNotifyEvent('Bem-vindo à Guilda!', `Você ingressou na guilda ${targetGuild.name}.`);
    setInsideTab('members');
  };

  const handleSendChat = async () => {
    if (!guild || !chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    onPlayTone('click');
    const res = await sendGuildChatMessage({
      guildId: guild.guildId,
      actorUid,
      tamerName,
      text,
    });
    if (!res.ok && res.error) {
      setFeedback({ type: 'err', text: res.error });
    }
  };

  const handleSaveSettings = async () => {
    if (!guild || !canManage) return;
    setFeedback(null);
    setBusy(true);
    const res = await updateGuildNoticeAndRecruiting({
      guildId: guild.guildId,
      notice: noticeDraft,
      recruiting: recruitingDraft,
      emblemColor: colorDraft,
      emblemPhotoUrl: photoDraft,
    });
    setBusy(false);
    if (!res.ok) {
      onPlayTone('error');
      setFeedback({ type: 'err', text: res.error ?? 'Sem permissão para salvar.' });
      return;
    }
    onPlayTone('confirm');
    setFeedback({ type: 'ok', text: 'Configurações e emblema da Guilda atualizados!' });
  };

  const handleMemberAction = async (
    targetUid: string,
    action: 'promote' | 'demote' | 'kick' | 'transfer_master'
  ) => {
    if (!guild || !canManage) return;
    setFeedback(null);
    setBusy(true);
    const res = await manageGuildMemberRoleOrKick({
      guildId: guild.guildId,
      targetUid,
      action,
    });
    setBusy(false);
    if (!res.ok) {
      onPlayTone('error');
      setFeedback({ type: 'err', text: res.error ?? 'Ação não permitida.' });
      return;
    }
    onPlayTone('confirm');
    setFeedback({ type: 'ok', text: 'Hierarquia da Guilda atualizada.' });
  };

  const handleLeaveOrDisband = async (forceDisband: boolean) => {
    if (!guild) return;
    setFeedback(null);
    setBusy(true);
    const res = forceDisband
      ? await disbandGuildAsMaster(guild.guildId)
      : await leaveOrDisbandGuild({
          guildId: guild.guildId,
          actorUid,
          tamerName,
        });
    setBusy(false);
    setConfirmLeaveStep('none');

    if (!res.ok) {
      onPlayTone('error');
      setFeedback({ type: 'err', text: res.error ?? 'Erro ao sair da Guilda.' });
      return;
    }
    onPlayTone('confirm');
    onNotifyEvent(
      forceDisband ? 'Guilda Dissolvida' : 'Você Saiu da Guilda',
      forceDisband
        ? `A guilda ${guild.name} foi dissolvida.`
        : `Você deixou a guilda ${guild.name}.`
    );
  };

  // =========================================================================
  // VIEW 1 — "BUSCAR GUILDA" (Player is NOT in a guild yet)
  // Matches Mockup #1: Cyber-blue chamfered list + Search Bar + Criar Guilda
  // =========================================================================
  if (!guild) {
    return (
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar Guilda"
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#010718]/85 p-2 sm:p-4 backdrop-blur-[2px]"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative flex max-h-[92dvh] w-full max-w-[740px] flex-col overflow-hidden rounded-2xl border-2 border-cyan-400/90 bg-gradient-to-b from-[#07266f] via-[#041540] to-[#020b24] shadow-[0_0_45px_rgba(0,185,255,0.55),inset_0_0_28px_rgba(14,165,233,0.22)]"
        >
          {/* Subtle Digital Grid Overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:18px_18px]"
          />

          {/* Top Bar — Chamfered "Buscar Guilda" Banner + Create Button + Close X */}
          <div className="relative z-10 flex items-center justify-between gap-2 border-b border-cyan-400/45 bg-gradient-to-r from-[#082f88] via-[#06205e] to-[#04143c] px-3 py-2.5 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`flex items-center gap-2 border border-cyan-300/90 bg-gradient-to-b from-[#0b47b3] to-[#052063] px-3.5 py-1.5 shadow-[0_0_16px_rgba(56,189,248,0.45)] ${CHAMFER_BTN}`}
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow" />
                <h2 className="text-base sm:text-xl font-black italic tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                  {searchMode === 'browse' ? 'Buscar Guilda' : 'Criar Nova Guilda'}
                </h2>
              </div>

              {searchMode === 'browse' ? (
                <button
                  type="button"
                  onClick={() => {
                    onPlayTone('click');
                    setFeedback(null);
                    setSearchMode('create');
                  }}
                  className={`flex min-h-[38px] items-center gap-1.5 border border-amber-300/90 bg-gradient-to-b from-[#ffe259] via-[#f5b400] to-[#d97706] px-3 text-xs font-black italic text-[#081226] shadow-[0_0_14px_rgba(250,204,21,0.4)] transition-transform active:scale-95 ${CHAMFER_BTN}`}
                >
                  <Plus className="h-4 w-4 stroke-[2.6]" />
                  <span>Criar Guilda</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onPlayTone('click');
                    setFeedback(null);
                    setSearchMode('browse');
                  }}
                  className={`flex min-h-[38px] items-center gap-1.5 border border-cyan-300/80 bg-[#072a73] px-3 text-xs font-extrabold italic text-cyan-100 hover:bg-[#0b3a96] ${CHAMFER_BTN}`}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Voltar à Busca</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar janela de Guilda"
              className={`flex h-9 w-9 shrink-0 items-center justify-center border border-cyan-300/90 bg-gradient-to-b from-[#0b42ad] to-[#051c52] text-white shadow-[0_0_12px_rgba(56,189,248,0.45)] hover:brightness-115 ${CHAMFER_SM}`}
            >
              <X className="h-5 w-5 stroke-[2.8]" />
            </button>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`relative z-10 mx-3 mt-2.5 rounded-lg border px-3 py-2 text-xs font-bold sm:mx-4 ${
                feedback.type === 'ok'
                  ? 'border-emerald-400/65 bg-emerald-950/75 text-emerald-100'
                  : 'border-rose-400/70 bg-rose-950/80 text-rose-100'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* MODE A: BUSCAR GUILDA (Mockup #1) */}
          {searchMode === 'browse' && (
            <div className="relative z-10 flex flex-1 flex-col overflow-hidden p-3 sm:p-4">
              {/* Search Bar + Golden Buscar Button */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onPlayTone('click');
                  setAppliedSearch(searchDraft);
                  setSearchPage(1);
                }}
                className="mb-3 flex items-stretch gap-2"
              >
                <div
                  className={`flex flex-1 items-center gap-2 border-2 border-cyan-400/85 bg-[#031238]/95 px-3 shadow-[inset_0_0_14px_rgba(0,180,255,0.22)] ${CHAMFER_BTN}`}
                >
                  <Search className="h-4 w-4 shrink-0 text-cyan-200" />
                  <input
                    type="text"
                    value={searchDraft}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchDraft(val);
                      setAppliedSearch(val);
                      setSearchPage(1);
                    }}
                    placeholder="Digite o nome da Guilda..."
                    className="h-10 w-full bg-transparent text-xs sm:text-sm font-semibold italic text-white placeholder:text-sky-300/60 focus:outline-none"
                  />
                  {searchDraft && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchDraft('');
                        setAppliedSearch('');
                        setSearchPage(1);
                      }}
                      aria-label="Limpar busca"
                      className="text-sky-300/75 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className={`min-h-[42px] min-w-[96px] sm:min-w-[126px] border-2 border-amber-200/95 bg-gradient-to-b from-[#ffe96b] via-[#f6b800] to-[#d97706] px-4 text-sm font-black italic tracking-wide text-[#081226] shadow-[0_0_18px_rgba(250,204,21,0.45)] transition-transform active:scale-95 ${CHAMFER_BTN}`}
                >
                  Buscar
                </button>
              </form>

              {/* Guild List */}
              <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
                {loadingGuilds ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-cyan-400/35 bg-[#031236]/80 py-10 text-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-cyan-300" />
                    <p className="mt-2 text-xs font-bold text-cyan-200">
                      Carregando Guildas do servidor...
                    </p>
                  </div>
                ) : visibleSearchGuilds.length === 0 ? (
                  <div
                    className={`flex flex-col items-center justify-center border border-cyan-400/50 bg-[#041540]/90 p-6 text-center ${CHAMFER_FRAME}`}
                  >
                    <Shield className="h-10 w-10 text-cyan-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
                    <p className="mt-2.5 text-base font-black italic text-white">
                      {appliedSearch
                        ? `Nenhuma Guilda encontrada para "${appliedSearch}"`
                        : 'Nenhuma Guilda recrutando no servidor ainda'}
                    </p>
                    <p className="mt-1 max-w-md text-xs text-sky-200/80">
                      Funde a sua própria Guilda agora mesmo, personalize com uma foto do seu celular ou computador e convide outros Tamers!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onPlayTone('click');
                        setSearchMode('create');
                      }}
                      className={`mt-4 flex min-h-[42px] items-center gap-2 border-2 border-amber-200 bg-gradient-to-b from-[#ffe55c] via-[#f5b400] to-[#d97706] px-5 text-sm font-black italic text-[#081226] shadow-[0_0_16px_rgba(250,204,21,0.45)] ${CHAMFER_BTN}`}
                    >
                      <Plus className="h-4 w-4 stroke-[2.8]" />
                      <span>Criar Minha Guilda</span>
                    </button>
                  </div>
                ) : (
                  visibleSearchGuilds.map((g) => {
                    const gMax = getGuildMaxMembersForLevel(g.level);
                    const gCount = g.memberUids.length;
                    const isFull = gCount >= gMax;
                    const onlineCount = countOnlineMembers(g);

                    return (
                      <div
                        key={g.guildId}
                        className={`flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3.5 border-2 border-cyan-400/80 bg-gradient-to-r from-[#062266] via-[#072a7a] to-[#041748] px-3 py-2.5 shadow-[inset_0_0_18px_rgba(0,190,255,0.2)] transition-colors hover:border-cyan-200 ${CHAMFER_FRAME}`}
                      >
                        {/* Shield Emblem (Custom Photo or Crest) */}
                        <GuildShieldEmblem
                          tag={g.tag}
                          emblemColor={g.emblemColor}
                          emblemPhotoUrl={g.emblemPhotoUrl}
                          size="md"
                        />

                        {/* Guild Title, Members, Level & Slogan */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-base sm:text-lg font-black italic tracking-wide text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                              {g.name}
                            </p>
                            <span className="shrink-0 rounded border border-cyan-300/45 bg-[#041540] px-1.5 py-0.5 text-[10px] font-extrabold text-cyan-200">
                              [{g.tag}]
                            </span>
                          </div>

                          <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs sm:text-sm font-extrabold">
                            <span className="inline-flex items-center gap-1.5 text-white tabular-nums">
                              <Users className="h-3.5 w-3.5 text-cyan-300" />
                              {gCount} / {gMax}
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-black italic text-amber-300 tabular-nums">
                              <Trophy className="h-3.5 w-3.5 text-amber-400" />
                              Lv. {g.level}
                            </span>
                          </div>

                          <p className="mt-0.5 truncate text-[11px] sm:text-xs italic text-sky-100/85">
                            {g.notice || 'Juntos somos mais fortes!'}
                          </p>
                        </div>

                        {/* Leader & Online Inset Box */}
                        <div
                          className={`hidden md:flex min-w-[158px] shrink-0 flex-col justify-center border border-cyan-400/55 bg-[#03133b]/90 px-3 py-1.5 ${CHAMFER_SM}`}
                        >
                          <p className="truncate text-[11px] font-extrabold italic text-white">
                            Líder: <span className="text-sky-100">{g.masterName}</span>
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-extrabold italic text-emerald-300 tabular-nums">
                            <Globe className="h-3.5 w-3.5 text-cyan-300" />
                            <span>Online: {onlineCount}</span>
                          </p>
                        </div>

                        {/* Right Action Button: Entrar (Gold) or Cheia (Grey) */}
                        <div className="ml-auto flex shrink-0 items-center gap-2">
                          <div className="flex flex-col items-end text-[10px] md:hidden">
                            <span className="font-bold text-sky-200">
                              Líder: {g.masterName}
                            </span>
                            <span className="font-extrabold text-emerald-300">
                              Online: {onlineCount}
                            </span>
                          </div>

                          {isFull ? (
                            <button
                              type="button"
                              disabled
                              className={`min-h-[42px] min-w-[92px] sm:min-w-[114px] cursor-not-allowed border-2 border-slate-300/60 bg-gradient-to-b from-slate-500 via-slate-600 to-slate-700 px-4 text-sm font-black italic text-slate-200 shadow-inner ${CHAMFER_BTN}`}
                            >
                              Cheia
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleJoinGuild(g)}
                              className={`min-h-[42px] min-w-[92px] sm:min-w-[114px] border-2 border-amber-200/95 bg-gradient-to-b from-[#ffe96b] via-[#f6b800] to-[#d97706] px-4 text-sm font-black italic text-[#081226] shadow-[0_0_16px_rgba(250,204,21,0.42)] transition-transform hover:brightness-105 active:scale-95 disabled:opacity-60 ${CHAMFER_BTN}`}
                            >
                              Entrar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Pagination Bar (<  1 / N  >) */}
              <div className="mt-3 flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={safeSearchPage <= 1}
                  onClick={() => {
                    onPlayTone('click');
                    setSearchPage((p) => Math.max(1, p - 1));
                  }}
                  aria-label="Página anterior"
                  className={`flex h-9 w-11 items-center justify-center border border-cyan-300/90 bg-gradient-to-b from-[#0b47b3] to-[#051e59] text-white shadow-[0_0_12px_rgba(56,189,248,0.4)] hover:brightness-115 disabled:opacity-40 ${CHAMFER_SM}`}
                >
                  <ChevronLeft className="h-5 w-5 stroke-[2.8]" />
                </button>

                <div className="flex h-9 min-w-[96px] items-center justify-center rounded border border-cyan-400/45 bg-[#020d29]/95 px-4 text-sm font-black tabular-nums text-white">
                  {safeSearchPage} / {totalSearchPages}
                </div>

                <button
                  type="button"
                  disabled={safeSearchPage >= totalSearchPages}
                  onClick={() => {
                    onPlayTone('click');
                    setSearchPage((p) => Math.min(totalSearchPages, p + 1));
                  }}
                  aria-label="Próxima página"
                  className={`flex h-9 w-11 items-center justify-center border border-cyan-300/90 bg-gradient-to-b from-[#0b47b3] to-[#051e59] text-white shadow-[0_0_12px_rgba(56,189,248,0.4)] hover:brightness-115 disabled:opacity-40 ${CHAMFER_SM}`}
                >
                  <ChevronRight className="h-5 w-5 stroke-[2.8]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onPlayTone('click');
                    void reloadServerGuilds();
                  }}
                  title="Atualizar lista de Guildas"
                  aria-label="Atualizar lista de Guildas"
                  className={`ml-2 flex h-9 w-9 items-center justify-center border border-cyan-400/60 bg-[#051e59] text-cyan-200 hover:bg-[#083085] ${CHAMFER_SM}`}
                >
                  <RefreshCw className={`h-4 w-4 ${loadingGuilds ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {/* MODE B: CRIAR GUILDA (with Custom Photo Upload from Phone or PC) */}
          {searchMode === 'create' && (
            <div className="relative z-10 flex-1 overflow-y-auto p-3 sm:p-4">
              <div className="grid gap-3.5 md:grid-cols-[220px_1fr]">
                {/* Left Column: Shield Preview + Phone/PC Photo Upload */}
                <div
                  className={`flex flex-col items-center justify-between border-2 border-cyan-400/75 bg-gradient-to-b from-[#062266] to-[#031136] p-4 text-center ${CHAMFER_FRAME}`}
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-cyan-200">
                      Escudo & Foto da Guilda
                    </p>
                    <p className="mt-0.5 text-[11px] text-sky-200/80">
                      Escolha uma foto do seu celular ou computador
                    </p>
                  </div>

                  <div className="my-3">
                    <GuildShieldEmblem
                      tag={createTag.trim().toUpperCase() || 'DATS'}
                      emblemColor={createColor}
                      emblemPhotoUrl={createPhotoUrl}
                      size="lg"
                      onEditPhotoClick={() => createFileInputRef.current?.click()}
                    />
                  </div>

                  <input
                    ref={createFileInputRef}
                    type="file"
                    accept="image/*"
                    tabIndex={-1}
                    className="sr-only"
                    onChange={(e) => {
                      const inputEl = e.currentTarget;
                      void handlePhotoFileSelected(inputEl.files?.[0], 'create', inputEl);
                    }}
                  />

                  <div className="w-full space-y-2">
                    <button
                      type="button"
                      disabled={uploadingPhoto}
                      onClick={() => createFileInputRef.current?.click()}
                      className={`flex min-h-[40px] w-full items-center justify-center gap-1.5 border border-cyan-300/90 bg-gradient-to-b from-[#0b4ab8] to-[#05236b] px-3 text-xs font-extrabold text-white shadow-[0_0_12px_rgba(56,189,248,0.35)] hover:brightness-110 ${CHAMFER_BTN}`}
                    >
                      <ImagePlus className="h-4 w-4 text-amber-300" />
                      <span>
                        {uploadingPhoto
                          ? 'Processando...'
                          : createPhotoUrl
                          ? 'Trocar Foto'
                          : 'Anexar Foto'}
                      </span>
                    </button>

                    {createPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          onPlayTone('click');
                          setCreatePhotoUrl(null);
                        }}
                        className="flex min-h-[34px] w-full items-center justify-center gap-1 rounded-lg border border-rose-400/50 bg-rose-950/60 text-[11px] font-bold text-rose-200 hover:bg-rose-900/75"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Usar Brasão Padrão</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Column: Name, TAG, Slogan, Border Theme & Submit */}
                <div
                  className={`space-y-3 border-2 border-cyan-400/75 bg-[#04143e]/95 p-4 ${CHAMFER_FRAME}`}
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_115px]">
                    <label className="block">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200">
                        Nome da Guilda
                      </span>
                      <input
                        type="text"
                        maxLength={24}
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        placeholder="Ex: Digital Force"
                        className="mt-1 h-10 w-full rounded-lg border border-cyan-400/60 bg-[#020d29] px-3 text-xs font-bold text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200">
                        TAG (2–4)
                      </span>
                      <input
                        type="text"
                        maxLength={4}
                        value={createTag}
                        onChange={(e) =>
                          setCreateTag(
                            e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                          )
                        }
                        placeholder="DF"
                        className="mt-1 h-10 w-full rounded-lg border border-cyan-400/60 bg-[#020d29] px-3 text-center text-xs font-black uppercase tracking-widest text-amber-200 placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200">
                      Frase / Lema da Guilda
                    </span>
                    <input
                      type="text"
                      maxLength={160}
                      value={createNotice}
                      onChange={(e) => setCreateNotice(e.target.value)}
                      placeholder="Juntos somos mais fortes!"
                      className="mt-1 h-10 w-full rounded-lg border border-cyan-400/60 bg-[#020d29] px-3 text-xs text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
                    />
                  </label>

                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200">
                      Cor da Moldura do Escudo
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {(Object.keys(EMBLEM_PALETTE) as GuildEmblemColor[]).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            onPlayTone('click');
                            setCreateColor(color);
                          }}
                          className={`flex min-h-[34px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-extrabold transition-all ${
                            createColor === color
                              ? 'border-amber-300 bg-amber-500/20 text-amber-100 ring-1 ring-amber-300/60'
                              : 'border-cyan-400/35 bg-[#061e57] text-sky-200 hover:bg-[#082c78]'
                          }`}
                        >
                          <span
                            className={`h-3 w-3 rounded-full bg-gradient-to-br ${EMBLEM_PALETTE[color].swatch}`}
                          />
                          <span>{EMBLEM_PALETTE[color].label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-400/35 bg-[#020d29] px-3 py-2 text-xs">
                    <span className="text-sky-200">
                      Taxa de Registro DATS:{' '}
                      <strong className="text-emerald-300">
                        {GUILD_CREATION_COST_BITS === 0
                          ? 'GRATUITO (0 Bits)'
                          : isGM
                            ? 'GRÁTIS (GM)'
                            : `${formatNumberPt(GUILD_CREATION_COST_BITS)} Bits`}
                      </strong>
                    </span>
                    <span className="font-bold text-cyan-200 tabular-nums">
                      Seus Bits: {formatNumberPt(bits)}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={busy || uploadingPhoto}
                    onClick={() => void handleCreateGuild()}
                    className={`flex min-h-[44px] w-full items-center justify-center gap-2 border-2 border-amber-200/95 bg-gradient-to-b from-[#ffe96b] via-[#f6b800] to-[#d97706] text-sm font-black italic tracking-wide text-[#081226] shadow-[0_0_18px_rgba(250,204,21,0.45)] transition-transform active:scale-[0.98] disabled:opacity-50 ${CHAMFER_BTN}`}
                  >
                    <Crown className="h-4 w-4" />
                    <span>{busy ? 'FUNDANDO GUILDA...' : 'FUNDAR GUILDA OFICIAL'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2 — INSIDE GUILD DASHBOARD (Player IS in a guild)
  // Matches Mockup #2: Top Split Banner + 4 Chamfered Tabs + Members/Info Split + Footer
  // =========================================================================
  const masterMember = guild.members[guild.masterUid];
  const masterOnline = onlineSet.has(guild.masterUid);
  const resolvedMasterTamerId: TamerId =
    (guild.masterUid === actorUid ? tamerId : undefined) ||
    masterMember?.characterId ||
    onlineCharacterByUid[guild.masterUid] ||
    legacyLeaderProfile?.characterId ||
    'kai';
  const resolvedMasterPhotoUrl: string | null =
    masterMember?.tamerPhotoUrl ||
    (guild.masterUid === actorUid ? tamerPhotoUrl : null) ||
    legacyLeaderProfile?.tamerPhotoUrl ||
    null;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Guilda ${guild.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#010718]/85 p-1.5 sm:p-3 backdrop-blur-[2px]"
    >
      {/* Hidden Quick Header Photo Input */}
      <input
        ref={quickHeaderFileInputRef}
        type="file"
        accept="image/*"
        tabIndex={-1}
        className="sr-only"
        onChange={(e) => {
          const inputEl = e.currentTarget;
          void handlePhotoFileSelected(inputEl.files?.[0], 'quick-header', inputEl);
        }}
      />

      {/* Hidden Leader Photo Input */}
      <input
        ref={leaderFileInputRef}
        type="file"
        accept="image/*"
        tabIndex={-1}
        className="sr-only"
        onChange={(e) => {
          const inputEl = e.currentTarget;
          void handleLeaderPhotoFileSelected(inputEl.files?.[0], inputEl);
        }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[94dvh] w-full max-w-[820px] flex-col overflow-hidden rounded-2xl border-2 border-cyan-400/90 bg-gradient-to-b from-[#07266f] via-[#041540] to-[#020b24] shadow-[0_0_48px_rgba(0,185,255,0.55),inset_0_0_30px_rgba(14,165,233,0.22)]"
      >
        {/* Subtle Digital Hex/Dot Texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:18px_18px]"
        />

        {/* Scrollable Content Shell */}
        <div className="relative z-10 flex flex-1 flex-col gap-2.5 overflow-y-auto p-2.5 sm:p-3.5">
          {/* TOP SPLIT BANNER (Mockup #2 Header) */}
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-[1.45fr_1fr]">
            {/* Top-Left: Shield Emblem + Guild Name + Lv/EXP Bar + Stats */}
            <div
              className={`flex items-center gap-3 border-2 border-cyan-400/85 bg-gradient-to-r from-[#062266] via-[#072d84] to-[#041748] p-3 shadow-[inset_0_0_20px_rgba(0,190,255,0.25)] ${CHAMFER_FRAME}`}
            >
              <GuildShieldEmblem
                tag={guild.tag}
                emblemColor={guild.emblemColor}
                emblemPhotoUrl={guild.emblemPhotoUrl}
                size="lg"
                onEditPhotoClick={
                  canManage ? () => quickHeaderFileInputRef.current?.click() : undefined
                }
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="truncate text-xl sm:text-2xl font-black italic tracking-wide text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)]">
                    {guild.name}
                  </h2>
                  <span className="shrink-0 rounded border border-cyan-300/60 bg-[#031238] px-1.5 py-0.5 text-[10px] font-black text-cyan-200">
                    [{guild.tag}]
                  </span>
                </div>

                {/* Lv. X + Golden Progress Bar + EXP fraction */}
                <div className="mt-1 flex items-center gap-2 rounded-md border border-cyan-400/60 bg-[#021033]/90 px-2.5 py-1">
                  <span className="shrink-0 text-sm sm:text-base font-black italic text-amber-300 tabular-nums">
                    Lv. {guild.level}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full border border-cyan-300/40 bg-[#041845]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#fbbf24] via-[#fde047] to-[#f59e0b] shadow-[0_0_8px_rgba(250,204,21,0.8)] transition-all duration-300"
                      style={{ width: `${expPct}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[11px] font-extrabold tabular-nums text-white">
                    {guild.level >= GUILD_MAX_LEVEL
                      ? 'MÁX'
                      : `${formatNumberPt(guild.exp)} / ${formatNumberPt(expNeeded)}`}
                  </span>
                </div>

                {/* 3 Metadata Rows */}
                <div className="mt-1.5 space-y-0.5 text-xs font-bold text-white">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-cyan-300" />
                    <span className="text-sky-200">Membros:</span>
                    <span className="font-black tabular-nums">
                      {guild.memberUids.length} / {maxMembers}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-sky-200">Ranking:</span>
                    <span className="font-black text-amber-200 tabular-nums">
                      Top {myGuildRank}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-cyan-300" />
                    <span className="text-sky-200">Idioma:</span>
                    <span className="font-extrabold">Todos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top-Right: Líder da Guild Card */}
            <div
              className={`flex flex-col justify-between border-2 border-cyan-400/85 bg-gradient-to-b from-[#062266] to-[#03133b] p-2.5 shadow-[inset_0_0_18px_rgba(0,190,255,0.2)] ${CHAMFER_FRAME}`}
            >
              <div className="flex items-center justify-center gap-1.5 border-b border-cyan-400/45 pb-1.5">
                <Crown className="h-4 w-4 text-amber-300" />
                <span className="text-xs sm:text-sm font-black italic tracking-wide text-white">
                  Líder da Guild
                </span>
              </div>

              <div className="my-2 flex items-center gap-3 px-1">
                <div className="relative shrink-0">
                  <div className="h-14 w-14 overflow-hidden rounded-lg border-2 border-cyan-300/90 bg-gradient-to-b from-[#0c3f9e] to-[#04143c] shadow-[0_0_12px_rgba(56,189,248,0.45)]">
                    <TamerPortraitAvatar
                      tamerId={resolvedMasterTamerId}
                      tamerName={guild.masterName}
                      customPhotoUrl={resolvedMasterPhotoUrl}
                      sizeClass="h-full w-full !rounded-none"
                    />
                  </div>
                  {isMaster && (
                    <>
                      <button
                        type="button"
                        disabled={busy || uploadingPhoto}
                        onClick={() => leaderFileInputRef.current?.click()}
                        title="Trocar foto do Líder"
                        aria-label="Trocar foto do Líder"
                        className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-cyan-200 bg-[#07266b] text-amber-300 shadow-[0_0_10px_rgba(0,212,255,0.7)] transition-transform hover:scale-110 hover:bg-sky-700 disabled:opacity-50"
                      >
                        <Camera className="h-3 w-3" />
                      </button>
                      {Boolean(masterMember?.tamerPhotoUrl) && (
                        <button
                          type="button"
                          disabled={busy || uploadingPhoto}
                          onClick={() => void handleResetLeaderPhoto()}
                          title="Usar foto padrão do Tamer"
                          aria-label="Usar foto padrão do Tamer"
                          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-rose-300 bg-rose-900/95 text-rose-100 shadow transition-transform hover:scale-110 hover:bg-rose-700 disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-black italic text-white">
                    {guild.masterName}
                  </p>
                  <p
                    className={`mt-0.5 inline-flex items-center gap-1.5 text-xs font-extrabold ${
                      masterOnline ? 'text-emerald-300' : 'text-slate-300'
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        masterOnline
                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span>{masterOnline ? 'Online' : 'Offline'}</span>
                  </p>
                </div>
              </div>

              {isMaster && editingLeaderPhrase ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSaveLeaderPhrase();
                  }}
                  className="flex flex-col gap-1.5 rounded-lg border border-amber-300/60 bg-[#020e2e]/95 p-1.5"
                >
                  <input
                    type="text"
                    maxLength={160}
                    autoFocus
                    value={leaderPhraseDraft}
                    onChange={(e) => setLeaderPhraseDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setEditingLeaderPhrase(false);
                        setLeaderPhraseDraft(guild.notice);
                      }
                    }}
                    placeholder="Escreva a frase do Líder..."
                    className="h-8 w-full rounded-md border border-cyan-400/60 bg-[#04143e] px-2.5 text-center text-[11px] sm:text-xs font-bold text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        onPlayTone('click');
                        setEditingLeaderPhrase(false);
                        setLeaderPhraseDraft(guild.notice);
                      }}
                      className="min-h-[28px] rounded-md border border-cyan-400/50 bg-[#061e57] px-2.5 text-[10px] font-bold text-sky-200 hover:bg-[#082c78]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex min-h-[28px] items-center gap-1 rounded-md border border-amber-200 bg-gradient-to-b from-[#ffe55c] to-[#d97706] px-2.5 text-[10px] font-black text-[#081226] hover:brightness-105 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      <span>{busy ? 'Salvando...' : 'Salvar'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-cyan-400/45 bg-[#020e2e]/90 px-2.5 py-1.5">
                  <p className="min-w-0 flex-1 break-words text-center text-[11px] sm:text-xs font-bold italic text-sky-100">
                    {guild.notice || 'Juntos somos mais fortes!'}
                  </p>
                  {isMaster && (
                    <button
                      type="button"
                      onClick={() => {
                        onPlayTone('click');
                        setLeaderPhraseDraft(guild.notice);
                        setEditingLeaderPhrase(true);
                      }}
                      title="Editar frase do Líder"
                      aria-label="Editar frase do Líder"
                      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-amber-300/65 bg-[#082463] px-2 text-[10px] font-extrabold text-amber-200 transition-colors hover:border-amber-200 hover:bg-[#0c348c]"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Editar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 4 CHAMFERED NAVIGATION TABS (Membros | Contribuição | Eventos | Configurações) */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                { id: 'members', label: 'Membros', icon: Users },
                { id: 'contribution', label: 'Contribuição', icon: Swords },
                { id: 'events', label: 'Eventos', icon: Calendar },
                { id: 'settings', label: 'Configurações', icon: Settings },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = insideTab === tab.id && !rankingOpen;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onPlayTone('click');
                    setRankingOpen(false);
                    setInsideTab(tab.id);
                    setFeedback(null);
                  }}
                  className={`flex min-h-[42px] items-center justify-center gap-2 border-2 px-3 text-xs sm:text-sm font-black italic tracking-wide transition-all ${CHAMFER_BTN} ${
                    active
                      ? 'border-amber-200 bg-gradient-to-b from-[#ffe96b] via-[#f6b800] to-[#d97706] text-[#081226] shadow-[0_0_16px_rgba(250,204,21,0.5)]'
                      : 'border-cyan-400/80 bg-gradient-to-b from-[#0b43ad] via-[#072a78] to-[#04184a] text-white hover:border-cyan-200 hover:brightness-110'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                  {tab.id === 'events' && (
                    <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-black not-italic text-white">
                      +{eventSummary.myActiveXpBonusPct}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                feedback.type === 'ok'
                  ? 'border-emerald-400/65 bg-emerald-950/75 text-emerald-100'
                  : 'border-rose-400/70 bg-rose-950/80 text-rose-100'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* INLINE SERVER RANKING OVERLAY (Triggered by bottom Ranking button) */}
          {rankingOpen ? (
            <div
              className={`flex-1 border-2 border-cyan-400/85 bg-[#03133b]/95 p-3 sm:p-4 ${CHAMFER_FRAME}`}
            >
              <div className="mb-3 flex items-center justify-between border-b border-cyan-400/40 pb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-300" />
                  <h3 className="text-base font-black italic text-white">
                    Ranking de Guildas do Servidor
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onPlayTone('click');
                    setRankingOpen(false);
                  }}
                  className="rounded-lg border border-cyan-300/60 bg-[#072a78] px-3 py-1 text-xs font-extrabold text-white hover:bg-[#0b3c9c]"
                >
                  Fechar Ranking
                </button>
              </div>

              <div className="space-y-2">
                {rankedGuilds.map((rg, index) => {
                  const isMine = rg.guildId === guild.guildId;
                  return (
                    <div
                      key={rg.guildId}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                        isMine
                          ? 'border-amber-300/90 bg-amber-500/15'
                          : 'border-cyan-400/40 bg-[#051a4c]/90'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black italic ${
                          index === 0
                            ? 'bg-amber-400 text-[#081226]'
                            : index === 1
                            ? 'bg-slate-300 text-[#081226]'
                            : index === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-[#082c78] text-cyan-200'
                        }`}
                      >
                        #{index + 1}
                      </span>

                      <GuildShieldEmblem
                        tag={rg.tag}
                        emblemColor={rg.emblemColor}
                        emblemPhotoUrl={rg.emblemPhotoUrl}
                        size="sm"
                        showCrown={index === 0}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black italic text-white">
                          {rg.name}{' '}
                          {isMine && (
                            <span className="text-[10px] not-italic text-amber-300">
                              (Sua Guilda)
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-sky-200/80">
                          Líder: {rg.masterName} · {rg.memberUids.length} /{' '}
                          {getGuildMaxMembersForLevel(rg.level)} membros
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-black italic text-amber-300">
                          Lv. {rg.level}
                        </p>
                        <p className="text-[10px] font-bold text-cyan-200 tabular-nums">
                          {formatNumberPt(rg.exp)} EXP
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* MAIN SPLIT BODY: Left Panel (~68%) + Right "Informações da Guild" Sidebar (~32%) */
            <div className="grid flex-1 grid-cols-1 gap-2.5 md:grid-cols-[1.95fr_1fr]">
              {/* LEFT PANEL */}
              <div
                className={`flex flex-col border-2 border-cyan-400/85 bg-[#03133b]/95 p-2.5 sm:p-3 shadow-[inset_0_0_20px_rgba(0,180,255,0.18)] ${CHAMFER_FRAME}`}
              >
                {/* TAB 1: MEMBROS (Exact Mockup #2 Table) */}
                {insideTab === 'members' && (
                  <div className="flex flex-1 flex-col">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1.5fr_0.95fr_0.95fr_0.75fr] items-center gap-1 border-b border-cyan-400/45 px-2 pb-2 text-[11px] sm:text-xs font-extrabold italic text-sky-200">
                      <span>Nome</span>
                      <span className="text-center">Cargo</span>
                      <span className="text-center">Contribuição</span>
                      <span className="text-right">Status</span>
                    </div>

                    {/* Member Rows */}
                    <div className="mt-1.5 flex-1 divide-y divide-cyan-400/20">
                      {visibleMembers.map((m) => {
                        const isSelf = m.uid === actorUid;
                        const isOnline = onlineSet.has(m.uid);
                        const portraitUrl = resolveMemberPortraitUrl(
                          m,
                          onlineDigimonByUid,
                          isSelf ? activeDigimonFormId : undefined
                        );
                        const canEditTarget =
                          canManage &&
                          !isSelf &&
                          m.uid !== guild.masterUid &&
                          (isMaster || m.role !== 'submaster');

                        return (
                          <div
                            key={m.uid}
                            className="group py-1.5 transition-colors hover:bg-sky-500/10"
                          >
                            <div className="grid grid-cols-[1.5fr_0.95fr_0.95fr_0.75fr] items-center gap-1 px-1">
                              {/* Digimon Avatar + Tamer Name */}
                              <div className="flex min-w-0 items-center gap-2">
                                <div className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 overflow-hidden rounded-md border border-cyan-300/80 bg-gradient-to-b from-[#0b3e99] to-[#04143c] p-0.5">
                                  <img
                                    src={portraitUrl}
                                    alt={m.tamerName}
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-xs sm:text-sm font-black italic text-white">
                                    {m.tamerName}
                                  </p>
                                  <p className="text-[10px] font-bold text-cyan-300/80">
                                    Lv.{m.tamerLevel} {isSelf ? '· Você' : ''}
                                  </p>
                                </div>
                              </div>

                              {/* Role Badge */}
                              <div className="flex justify-center">
                                <RoleChamferBadge role={m.role} />
                              </div>

                              {/* Contribution (Mobs Abatidos Hoje + Geral) */}
                              <div className="flex flex-col items-center justify-center text-xs sm:text-sm font-extrabold tabular-nums text-white">
                                <div className="flex items-center gap-1.5">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-200 bg-gradient-to-b from-[#fde047] to-[#d97706] text-[#422006] shadow-[0_0_8px_rgba(250,204,21,0.5)]">
                                    <Swords className="h-3 w-3" />
                                  </span>
                                  <span>
                                    {formatNumberPt(
                                      getEffectiveMemberDailyKills(
                                        m,
                                        guild,
                                        countdown.todayKey
                                      )
                                    )}
                                  </span>
                                </div>
                                <span className="text-[9.5px] font-bold text-cyan-300/80">
                                  Geral: {formatNumberPt(getEffectiveMemberTotalKills(m))}
                                </span>
                              </div>

                              {/* Online / Offline Status */}
                              <div className="flex items-center justify-end gap-1.5 text-[11px] sm:text-xs font-extrabold italic">
                                <span
                                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                    isOnline
                                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                                      : 'bg-slate-400/80'
                                  }`}
                                />
                                <span
                                  className={
                                    isOnline ? 'text-emerald-300' : 'text-slate-300'
                                  }
                                >
                                  {isOnline ? 'Online' : 'Offline'}
                                </span>
                              </div>
                            </div>

                            {/* Inline Leadership Controls (for Master / Sub-master) */}
                            {canEditTarget && (
                              <div className="mt-1 flex flex-wrap items-center justify-end gap-1.5 px-2">
                                {m.role !== 'submaster' && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleMemberAction(m.uid, 'promote')}
                                    className="inline-flex items-center gap-0.5 rounded border border-emerald-400/50 bg-emerald-950/70 px-2 py-0.5 text-[10px] font-bold text-emerald-200 hover:bg-emerald-900"
                                  >
                                    <ArrowUp className="h-3 w-3" /> Promover
                                  </button>
                                )}
                                {m.role !== 'member' && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleMemberAction(m.uid, 'demote')}
                                    className="inline-flex items-center gap-0.5 rounded border border-sky-400/50 bg-sky-950/70 px-2 py-0.5 text-[10px] font-bold text-sky-200 hover:bg-sky-900"
                                  >
                                    <ArrowDown className="h-3 w-3" /> Rebaixar
                                  </button>
                                )}
                                {isMaster && (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() =>
                                      void handleMemberAction(m.uid, 'transfer_master')
                                    }
                                    className="inline-flex items-center gap-0.5 rounded border border-amber-400/50 bg-amber-950/70 px-2 py-0.5 text-[10px] font-bold text-amber-200 hover:bg-amber-900"
                                  >
                                    <Crown className="h-3 w-3" /> Passar Líder
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void handleMemberAction(m.uid, 'kick')}
                                  className="inline-flex items-center gap-0.5 rounded border border-rose-400/50 bg-rose-950/70 px-2 py-0.5 text-[10px] font-bold text-rose-200 hover:bg-rose-900"
                                >
                                  <UserMinus className="h-3 w-3" /> Expulsar
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Member Table Pagination (< 1 / N >) */}
                    <div className="mt-2.5 flex items-center justify-center gap-2 border-t border-cyan-400/30 pt-2">
                      <button
                        type="button"
                        disabled={safeMemberPage <= 1}
                        onClick={() => {
                          onPlayTone('click');
                          setMembersPage((p) => Math.max(1, p - 1));
                        }}
                        aria-label="Página anterior de membros"
                        className={`flex h-7 w-9 items-center justify-center border border-cyan-300/85 bg-[#083896] text-white hover:brightness-115 disabled:opacity-40 ${CHAMFER_SM}`}
                      >
                        <ChevronLeft className="h-4 w-4 stroke-[2.6]" />
                      </button>
                      <span className="min-w-[64px] text-center text-xs font-black tabular-nums text-white">
                        {safeMemberPage} / {totalMemberPages}
                      </span>
                      <button
                        type="button"
                        disabled={safeMemberPage >= totalMemberPages}
                        onClick={() => {
                          onPlayTone('click');
                          setMembersPage((p) => Math.min(totalMemberPages, p + 1));
                        }}
                        aria-label="Próxima página de membros"
                        className={`flex h-7 w-9 items-center justify-center border border-cyan-300/85 bg-[#083896] text-white hover:brightness-115 disabled:opacity-40 ${CHAMFER_SM}`}
                      >
                        <ChevronRight className="h-4 w-4 stroke-[2.6]" />
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: CONTRIBUIÇÃO (Diária — Zera 23:59 | Geral — Nunca Zera) */}
                {insideTab === 'contribution' && (
                  <div className="flex flex-1 flex-col space-y-2.5">
                    {/* Summary Banner */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-amber-300/60 bg-gradient-to-r from-[#07266b] to-[#04143c] px-3 py-2">
                        <p className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-amber-200">
                          <Flame className="h-3.5 w-3.5 text-amber-300" />
                          <span>Mobs da Guilda Hoje</span>
                        </p>
                        <p className="mt-0.5 text-lg font-black italic text-white tabular-nums">
                          {formatNumberPt(eventSummary.myTodayKills)}{' '}
                          <span className="text-xs font-bold not-italic text-cyan-200">
                            mobs
                          </span>
                        </p>
                        <p className="text-[10px] font-bold text-sky-200/80 tabular-nums">
                          Zera às 23:59 · Reset em {countdown.label}
                        </p>
                      </div>

                      <div className="rounded-xl border border-cyan-300/60 bg-gradient-to-r from-[#062266] to-[#031238] px-3 py-2">
                        <p className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-cyan-200">
                          <Trophy className="h-3.5 w-3.5 text-amber-300" />
                          <span>Total Geral da Guilda</span>
                        </p>
                        <p className="mt-0.5 text-lg font-black italic text-amber-300 tabular-nums">
                          {formatNumberPt(getEffectiveGuildTotalKills(guild))}{' '}
                          <span className="text-xs font-bold not-italic text-sky-200">
                            mobs
                          </span>
                        </p>
                        <p className="text-[10px] font-bold text-emerald-300">
                          Acumulativo — Nunca zera!
                        </p>
                      </div>
                    </div>

                    {/* Sub-Tabs: Diária (Hoje) vs Geral (Nunca Zera) */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onPlayTone('click');
                          setContribMode('daily');
                        }}
                        className={`flex min-h-[38px] items-center justify-center gap-1.5 border-2 px-2.5 text-xs font-black italic transition-all ${CHAMFER_SM} ${
                          contribMode === 'daily'
                            ? 'border-amber-200 bg-gradient-to-b from-[#ffe96b] via-[#f6b800] to-[#d97706] text-[#081226]'
                            : 'border-cyan-400/70 bg-[#06205a] text-cyan-100 hover:bg-[#082d7a]'
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>Contribuição Diária (Hoje)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onPlayTone('click');
                          setContribMode('general');
                        }}
                        className={`flex min-h-[38px] items-center justify-center gap-1.5 border-2 px-2.5 text-xs font-black italic transition-all ${CHAMFER_SM} ${
                          contribMode === 'general'
                            ? 'border-amber-200 bg-gradient-to-b from-[#ffe96b] via-[#f6b800] to-[#d97706] text-[#081226]'
                            : 'border-cyan-400/70 bg-[#06205a] text-cyan-100 hover:bg-[#082d7a]'
                        }`}
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        <span>Contribuição Geral (Total)</span>
                      </button>
                    </div>

                    {/* Explanatory Strip */}
                    <div className="rounded-lg border border-cyan-400/35 bg-[#020e2e]/90 px-3 py-1.5 text-[11px] text-sky-200">
                      {contribMode === 'daily' ? (
                        <span>
                          Conta todos os <strong className="text-amber-300">mobs abatidos hoje</strong> por cada membro para o Evento Diário.{' '}
                          <strong className="text-white">Zera automaticamente às 23:59</strong> para a disputa do dia seguinte.
                        </span>
                      ) : (
                        <span>
                          Guarda o <strong className="text-amber-300">histórico total de mobs abatidos</strong> por cada membro desde que entrou na Guilda.{' '}
                          <strong className="text-emerald-300">Nunca zera — só soma!</strong>
                        </span>
                      )}
                    </div>

                    {/* Member Contribution Ranking List */}
                    <div className="max-h-[255px] flex-1 space-y-1.5 overflow-y-auto pr-0.5">
                      {sortedMembersByContrib.map((m, idx) => {
                        const isSelf = m.uid === actorUid;
                        const dailyCount = getEffectiveMemberDailyKills(
                          m,
                          guild,
                          countdown.todayKey
                        );
                        const totalCount = getEffectiveMemberTotalKills(m);
                        const displayCount = contribMode === 'daily' ? dailyCount : totalCount;
                        const portraitUrl = resolveMemberPortraitUrl(
                          m,
                          onlineDigimonByUid,
                          isSelf ? activeDigimonFormId : undefined
                        );

                        return (
                          <div
                            key={m.uid}
                            className={`flex items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 ${
                              isSelf
                                ? 'border-amber-300/80 bg-amber-500/15'
                                : 'border-cyan-400/35 bg-[#051a4c]/85'
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-black italic ${
                                  idx === 0
                                    ? 'bg-amber-400 text-[#081226]'
                                    : idx === 1
                                    ? 'bg-slate-300 text-[#081226]'
                                    : idx === 2
                                    ? 'bg-amber-700 text-white'
                                    : 'bg-[#082c78] text-cyan-200'
                                }`}
                              >
                                #{idx + 1}
                              </span>
                              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md border border-cyan-300/75 bg-[#04143c] p-0.5">
                                <img
                                  src={portraitUrl}
                                  alt={m.tamerName}
                                  className="h-full w-full object-contain"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-black italic text-white">
                                  {m.tamerName}{' '}
                                  {isSelf && (
                                    <span className="text-[10px] not-italic text-amber-300">
                                      (Você)
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] font-bold text-sky-200/80">
                                  {contribMode === 'daily'
                                    ? `Geral acumulado: ${formatNumberPt(totalCount)} mobs`
                                    : `Hoje: ${formatNumberPt(dailyCount)} mobs`}
                                </p>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300/60 bg-[#020d29] px-2.5 py-1">
                              <Swords className="h-3.5 w-3.5 text-amber-300" />
                              <span className="text-xs font-black tabular-nums text-amber-200">
                                {formatNumberPt(displayCount)}
                              </span>
                              <span className="text-[10px] font-bold text-sky-200/80">
                                mobs
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 3: EVENTO DIÁRIO DE GUILDAS (+5% a +10% XP) & CHAT */}
                {insideTab === 'events' && (
                  <div className="flex flex-1 flex-col space-y-2.5">
                    {/* Hero Event Card: Active Today XP Bonus + Live Countdown to 00:00 */}
                    <div className="rounded-xl border-2 border-amber-300/80 bg-gradient-to-r from-[#092e7e] via-[#06205c] to-[#04143c] p-2.5 shadow-[0_0_16px_rgba(250,204,21,0.22)]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Flame className="h-4 w-4 text-amber-300" />
                            <h3 className="text-xs sm:text-sm font-black italic tracking-wide text-white">
                              Evento Diário de Caça da Guilda (Todos os Dias)
                            </h3>
                          </div>
                          <p className="mt-0.5 text-[10.5px] text-sky-100/90">
                            Abata mobs com sua Guilda! Após <strong className="text-amber-300">00:00</strong>, as melhores Guildas ganham até <strong className="text-amber-300">+10% XP</strong> no dia seguinte.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="rounded-lg border border-emerald-300/80 bg-emerald-950/80 px-2.5 py-1 text-center">
                            <p className="text-[9px] font-extrabold uppercase text-emerald-200">
                              Bônus Ativo Hoje
                            </p>
                            <p className="text-sm font-black italic text-emerald-300">
                              +{eventSummary.myActiveXpBonusPct}% XP
                            </p>
                          </div>

                          <div className="rounded-lg border border-cyan-300/75 bg-[#020d29] px-2.5 py-1 text-center">
                            <p className="text-[9px] font-extrabold uppercase text-cyan-200">
                              Reset 23:59 → 00:00
                            </p>
                            <p className="text-sm font-black tabular-nums text-amber-300">
                              {countdown.label}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3 Clean Sub-View Buttons inside Eventos */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: 'live', label: 'Placar de Hoje', icon: Flame },
                          { id: 'prizes', label: 'Prêmios & Ontem', icon: Trophy },
                          { id: 'chat', label: 'Chat da Guild', icon: MessageSquare },
                        ] as const
                      ).map((sub) => {
                        const SubIcon = sub.icon;
                        const active = eventsSubView === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              onPlayTone('click');
                              setEventsSubView(sub.id);
                              if (sub.id !== 'chat') void reloadServerGuilds();
                            }}
                            className={`flex min-h-[34px] items-center justify-center gap-1.5 border px-2 text-[11px] font-black italic transition-all ${CHAMFER_SM} ${
                              active
                                ? 'border-amber-200 bg-gradient-to-b from-[#ffe259] to-[#d97706] text-[#081226]'
                                : 'border-cyan-400/60 bg-[#051a4c] text-cyan-100 hover:bg-[#082c78]'
                            }`}
                          >
                            <SubIcon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* SUB-VIEW 1: PLACAR DE HOJE (AO VIVO — MOBS ABATIDOS HOJE) */}
                    {eventsSubView === 'live' && (
                      <div className="flex flex-1 flex-col space-y-1.5">
                        <div className="flex items-center justify-between px-1 text-[10.5px] font-bold text-sky-200">
                          <span>
                            Sua Guilda hoje:{' '}
                            <strong className="text-amber-300">
                              #{eventSummary.myTodayRank ?? 1} ·{' '}
                              {formatNumberPt(eventSummary.myTodayKills)} mobs
                            </strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onPlayTone('click');
                              void reloadServerGuilds();
                            }}
                            className="inline-flex items-center gap-1 text-cyan-300 hover:text-white"
                          >
                            <RefreshCw
                              className={`h-3 w-3 ${loadingGuilds ? 'animate-spin' : ''}`}
                            />
                            <span>Atualizar</span>
                          </button>
                        </div>

                        <div className="max-h-[215px] flex-1 space-y-1.5 overflow-y-auto pr-0.5">
                          {eventSummary.todayStandings.map((entry) => {
                            const isMine = entry.guild.guildId === guild.guildId;
                            return (
                              <div
                                key={entry.guild.guildId}
                                className={`flex items-center gap-2.5 rounded-xl border px-2.5 py-1.5 ${
                                  isMine
                                    ? 'border-amber-300/90 bg-amber-500/15'
                                    : 'border-cyan-400/35 bg-[#051a4c]/85'
                                }`}
                              >
                                <span
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black italic ${
                                    entry.rank === 1
                                      ? 'bg-amber-400 text-[#081226]'
                                      : entry.rank === 2
                                      ? 'bg-slate-300 text-[#081226]'
                                      : entry.rank === 3
                                      ? 'bg-amber-700 text-white'
                                      : entry.rank <= 5
                                      ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-300/60'
                                      : 'bg-[#082c78] text-sky-200'
                                  }`}
                                >
                                  #{entry.rank}
                                </span>

                                <GuildShieldEmblem
                                  tag={entry.guild.tag}
                                  emblemColor={entry.guild.emblemColor}
                                  emblemPhotoUrl={entry.guild.emblemPhotoUrl}
                                  size="sm"
                                  showCrown={entry.rank === 1}
                                />

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-black italic text-white">
                                    {entry.guild.name}{' '}
                                    {isMine && (
                                      <span className="text-[10px] not-italic text-amber-300">
                                        (Sua Guilda)
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[10px] font-bold text-sky-200/80 tabular-nums">
                                    Mobs abatidos hoje:{' '}
                                    <strong className="text-white">
                                      {formatNumberPt(entry.kills)}
                                    </strong>
                                  </p>
                                </div>

                                <div className="shrink-0 rounded-lg border border-emerald-400/55 bg-emerald-950/75 px-2 py-1 text-right">
                                  <p className="text-[9px] font-bold text-emerald-200/80">
                                    Prêmio 00:00
                                  </p>
                                  <p className="text-xs font-black italic text-emerald-300">
                                    +{entry.xpBonusPct}% XP
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* SUB-VIEW 2: TABELA DE PREMIAÇÃO OFICIAL + VENCEDORES DE ONTEM */}
                    {eventsSubView === 'prizes' && (
                      <div className="max-h-[245px] flex-1 space-y-2.5 overflow-y-auto pr-0.5">
                        {/* Official Reward Tiers */}
                        <div className="rounded-xl border border-cyan-400/45 bg-[#020e2e]/90 p-2.5">
                          <p className="mb-2 text-xs font-black italic text-amber-300">
                            Tabela Oficial de Premiação Diária (Todos os Dias às 00:00)
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                            {DAILY_GUILD_EVENT_TIERS.map((tier) => (
                              <div
                                key={tier.rankLabel}
                                className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[11px] font-black ${tier.accent}`}
                              >
                                <span className="truncate">{tier.rankLabel}</span>
                                <span className="ml-1 shrink-0 italic">+{tier.xpPct}% XP</span>
                              </div>
                            ))}
                          </div>
                          <p className="mt-2 text-[10.5px] leading-relaxed text-sky-200/85">
                            A disputa soma todos os mobs abatidos pelos membros da Guilda no dia. Às <strong className="text-white">23:59</strong> a contagem diária zera e às <strong className="text-amber-300">00:00</strong> o bônus de XP é liberado para todos os membros das guildas vencedoras durante o dia inteiro!
                          </p>
                        </div>

                        {/* Yesterday's Winners (Active Today) */}
                        <div className="rounded-xl border border-emerald-400/45 bg-[#051a4c]/85 p-2.5">
                          <p className="mb-1.5 text-xs font-black italic text-emerald-300">
                            Vencedores de Ontem (Bônus Ativo Hoje)
                          </p>
                          {eventSummary.yesterdayWinners.length === 0 ? (
                            <p className="text-[11px] text-sky-200/80">
                              Ainda não houve encerramento diário anterior — hoje todas as Guildas já recebem o bônus base de <strong className="text-emerald-300">+5% XP</strong>. Derrote mobs hoje para conquistar o <strong className="text-amber-300">Top 1 (+10% XP)</strong> à meia-noite!
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {eventSummary.yesterdayWinners.slice(0, 6).map((w) => (
                                <div
                                  key={w.guild.guildId}
                                  className="flex items-center justify-between rounded-lg bg-[#031238] px-2.5 py-1 text-xs"
                                >
                                  <span className="font-black italic text-white">
                                    #{w.rank} {w.guild.name}
                                  </span>
                                  <span className="font-bold text-sky-200 tabular-nums">
                                    {formatNumberPt(w.kills)} mobs ·{' '}
                                    <strong className="text-emerald-300">
                                      +{w.xpBonusPct}% XP
                                    </strong>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SUB-VIEW 3: LIVE GUILD CHAT */}
                    {eventsSubView === 'chat' && (
                      <div className="flex flex-1 flex-col space-y-2">
                        <div className="max-h-[170px] min-h-[140px] flex-1 space-y-1.5 overflow-y-auto rounded-xl border border-cyan-400/35 bg-[#020d29]/95 p-2.5">
                          {guild.chatMessages.length === 0 ? (
                            <p className="py-6 text-center text-xs text-slate-400">
                              Nenhuma mensagem na Guilda ainda. Combine a caça diária com seus membros!
                            </p>
                          ) : (
                            guild.chatMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className="rounded-lg bg-[#061c4f]/75 px-2.5 py-1.5 text-xs"
                              >
                                <span className="mr-1.5 text-[10px] text-cyan-300/70">
                                  [{msg.timestamp}]
                                </span>
                                <span className="mr-1.5 font-extrabold text-amber-300">
                                  {msg.senderName}:
                                </span>
                                <span className="text-white">{msg.text}</span>
                              </div>
                            ))
                          )}
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            void handleSendChat();
                          }}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            maxLength={140}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Escreva para sua Guilda..."
                            className="h-9 flex-1 rounded-lg border border-cyan-400/60 bg-[#020d29] px-3 text-xs text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!chatInput.trim()}
                            className={`flex min-h-[36px] items-center gap-1.5 border border-amber-200 bg-gradient-to-b from-[#ffe259] to-[#d97706] px-3.5 text-xs font-black italic text-[#081226] disabled:opacity-45 ${CHAMFER_SM}`}
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Enviar</span>
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: CONFIGURAÇÕES (Photo Upload from Phone/PC, Notice, Recruiting, Color) */}
                {insideTab === 'settings' && (
                  <div className="space-y-3">
                    {canManage ? (
                      <>
                        {/* Custom Guild Photo Uploader */}
                        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cyan-400/55 bg-[#051a4c]/90 p-3">
                          <GuildShieldEmblem
                            tag={guild.tag}
                            emblemColor={colorDraft}
                            emblemPhotoUrl={photoDraft}
                            size="md"
                            onEditPhotoClick={() => settingsFileInputRef.current?.click()}
                          />

                          <input
                            ref={settingsFileInputRef}
                            type="file"
                            accept="image/*"
                            tabIndex={-1}
                            className="sr-only"
                            onChange={(e) => {
                              const inputEl = e.currentTarget;
                              void handlePhotoFileSelected(inputEl.files?.[0], 'settings', inputEl);
                            }}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black italic text-white">
                              Foto da Guilda (Celular ou Computador)
                            </p>
                            <p className="mt-0.5 text-[11px] text-sky-200/80">
                              Anexe qualquer foto da galeria ou do PC — ela será ajustada automaticamente dentro do escudo!
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={uploadingPhoto}
                                onClick={() => settingsFileInputRef.current?.click()}
                                className={`inline-flex min-h-[34px] items-center gap-1.5 border border-cyan-300/90 bg-gradient-to-b from-[#0b4ab8] to-[#05236b] px-3 text-[11px] font-extrabold text-white hover:brightness-110 ${CHAMFER_SM}`}
                              >
                                <Upload className="h-3.5 w-3.5 text-amber-300" />
                                <span>
                                  {uploadingPhoto ? 'Processando...' : 'Escolher Foto'}
                                </span>
                              </button>
                              {photoDraft && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onPlayTone('click');
                                    setPhotoDraft(null);
                                  }}
                                  className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-rose-400/55 bg-rose-950/65 px-2.5 text-[11px] font-bold text-rose-200 hover:bg-rose-900"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Remover Foto</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Notice & Recruiting */}
                        <label className="block">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200">
                            Aviso / Lema da Guilda
                          </span>
                          <textarea
                            rows={2}
                            maxLength={160}
                            value={noticeDraft}
                            onChange={(e) => setNoticeDraft(e.target.value)}
                            className="mt-1 w-full resize-none rounded-lg border border-cyan-400/55 bg-[#020d29] p-2.5 text-xs text-white focus:border-amber-300 focus:outline-none"
                          />
                        </label>

                        {/* Emblem Border Theme */}
                        <div>
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-200">
                            Moldura do Escudo
                          </span>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {(Object.keys(EMBLEM_PALETTE) as GuildEmblemColor[]).map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  onPlayTone('click');
                                  setColorDraft(c);
                                }}
                                className={`flex min-h-[32px] items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold ${
                                  colorDraft === c
                                    ? 'border-amber-300 bg-amber-500/20 text-amber-100'
                                    : 'border-cyan-400/35 bg-[#051a4c] text-sky-200'
                                }`}
                              >
                                <span
                                  className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${EMBLEM_PALETTE[c].swatch}`}
                                />
                                <span>{EMBLEM_PALETTE[c].label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-white">
                            <input
                              type="checkbox"
                              checked={recruitingDraft}
                              onChange={(e) => setRecruitingDraft(e.target.checked)}
                              className="h-4 w-4 accent-amber-400"
                            />
                            <span>Recrutamento Aberto na Busca</span>
                          </label>

                          <button
                            type="button"
                            disabled={busy || uploadingPhoto}
                            onClick={() => void handleSaveSettings()}
                            className={`min-h-[38px] border-2 border-amber-200 bg-gradient-to-b from-[#ffe55c] via-[#f5b400] to-[#d97706] px-4 text-xs font-black italic text-[#081226] shadow-[0_0_14px_rgba(250,204,21,0.38)] disabled:opacity-50 ${CHAMFER_SM}`}
                          >
                            {busy ? 'Salvando...' : 'Salvar Configurações'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl border border-cyan-400/40 bg-[#051a4c]/85 p-4 text-center">
                        <Settings className="mx-auto h-7 w-7 text-cyan-300" />
                        <p className="mt-2 text-sm font-black italic text-white">
                          Configurações de Liderança
                        </p>
                        <p className="mt-1 text-xs text-sky-200/80">
                          Apenas o Líder ({guild.masterName}) e Sub-Líderes podem alterar a foto do escudo, lema ou recrutamento da Guilda.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT SIDEBAR: "Informações da Guild" + "Benefícios da Guild" (Mockup #2) */}
              <div
                className={`flex flex-col justify-between gap-2.5 border-2 border-cyan-400/85 bg-gradient-to-b from-[#062266] via-[#041748] to-[#020d29] p-3 shadow-[inset_0_0_20px_rgba(0,190,255,0.2)] ${CHAMFER_FRAME}`}
              >
                <div>
                  <div className="border-b border-cyan-400/45 pb-1.5 text-center">
                    <h3 className="text-sm font-black italic tracking-wide text-white">
                      Informações da Guild
                    </h3>
                  </div>

                  {/* Mini Shield + Name + Level */}
                  <div className="mt-3 flex items-center gap-2.5">
                    <GuildShieldEmblem
                      tag={guild.tag}
                      emblemColor={guild.emblemColor}
                      emblemPhotoUrl={guild.emblemPhotoUrl}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black italic text-white">
                        {guild.name}
                      </p>
                      <p className="text-xl font-black italic text-amber-300 drop-shadow">
                        Lv. {guild.level}
                      </p>
                    </div>
                  </div>

                  {/* Inset Notice Box */}
                  <div className="mt-2.5 rounded-lg border border-cyan-400/45 bg-[#020d29]/90 px-2.5 py-2 text-center text-[11px] font-bold italic text-sky-100">
                    {guild.notice || 'Juntos somos mais fortes!'}
                  </div>
                </div>

                {/* Benefícios da Guild Box */}
                <div className="rounded-xl border border-cyan-400/55 bg-[#03133b]/90 p-2.5">
                  <div className="border-b border-cyan-400/35 pb-1 text-center">
                    <span className="text-xs font-black italic text-white">
                      Benefícios da Guild
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1.5 text-[11px] font-bold text-sky-100">
                    <li className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-300" />
                      <span>
                        <strong className="text-emerald-300">
                          +{eventSummary.myActiveXpBonusPct}% XP
                        </strong>{' '}
                        Evento Diário
                        {eventSummary.myActiveWinnerRank
                          ? ` (Top ${eventSummary.myActiveWinnerRank})`
                          : ''}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Swords className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                      <span>
                        Mobs Hoje:{' '}
                        <strong className="text-white tabular-nums">
                          {formatNumberPt(eventSummary.myTodayKills)}
                        </strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Trophy className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                      <span>
                        Geral:{' '}
                        <strong className="text-amber-200 tabular-nums">
                          {formatNumberPt(getEffectiveGuildTotalKills(guild))} mobs
                        </strong>
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 2-Step Inline Confirm Banner for Leaving / Disbanding Guild */}
          {confirmLeaveStep !== 'none' && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-rose-400/80 bg-rose-950/90 px-3.5 py-2.5 text-xs">
              <span className="font-extrabold text-rose-100">
                {confirmLeaveStep === 'disband'
                  ? `Tem certeza que deseja dissolver a guilda ${guild.name} permanentemente?`
                  : `Deseja realmente sair da guilda ${guild.name}?`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmLeaveStep('none')}
                  className="min-h-[34px] rounded-lg border border-cyan-300/60 bg-[#07266b] px-3 font-bold text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void handleLeaveOrDisband(confirmLeaveStep === 'disband')
                  }
                  className="min-h-[34px] rounded-lg border border-rose-300 bg-rose-600 px-3 font-black text-white hover:bg-rose-500"
                >
                  {confirmLeaveStep === 'disband'
                    ? 'Confirmar Dissolução'
                    : 'Confirmar Saída'}
                </button>
              </div>
            </div>
          )}

          {/* BOTTOM 3 CHAMFERED ACTION BUTTONS (Voltar | Ranking | Sair da Guild) */}
          <div className="grid grid-cols-3 gap-2 pt-0.5 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                onPlayTone('click');
                onClose();
              }}
              className={`flex min-h-[44px] items-center justify-center gap-2 border-2 border-cyan-300/90 bg-gradient-to-b from-[#0b47b3] via-[#062978] to-[#04184a] px-3 text-xs sm:text-base font-black italic text-white shadow-[0_0_16px_rgba(56,189,248,0.4)] transition-transform hover:brightness-110 active:scale-95 ${CHAMFER_BTN}`}
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.8]" />
              <span>Voltar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onPlayTone('click');
                setRankingOpen((prev) => !prev);
                void reloadServerGuilds();
              }}
              className={`flex min-h-[44px] items-center justify-center gap-2 border-2 px-3 text-xs sm:text-base font-black italic shadow-[0_0_16px_rgba(56,189,248,0.4)] transition-transform hover:brightness-110 active:scale-95 ${CHAMFER_BTN} ${
                rankingOpen
                  ? 'border-amber-200 bg-gradient-to-b from-[#0d5be0] to-[#062b7c] text-amber-200'
                  : 'border-cyan-300/90 bg-gradient-to-b from-[#0b47b3] via-[#062978] to-[#04184a] text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Ranking</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onPlayTone('click');
                setConfirmLeaveStep(
                  isMaster && guild.memberUids.length === 1 ? 'disband' : 'leave'
                );
              }}
              className={`flex min-h-[44px] items-center justify-center gap-2 border-2 border-amber-200/95 bg-gradient-to-b from-[#ffe96b] via-[#f6b800] to-[#d97706] px-3 text-xs sm:text-base font-black italic text-[#081226] shadow-[0_0_18px_rgba(250,204,21,0.45)] transition-transform hover:brightness-105 active:scale-95 ${CHAMFER_BTN}`}
            >
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">
                {isMaster && guild.memberUids.length === 1
                  ? 'Dissolver'
                  : 'Sair da Guild'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
