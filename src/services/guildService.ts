import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { processSquarePhotoUpload } from '../utils/avatarPhoto';

export type GuildRole = 'master' | 'submaster' | 'officer' | 'member';
export type GuildEmblemColor = 'cyan' | 'amber' | 'crimson' | 'emerald' | 'violet';

export interface GuildMemberRecord {
  uid: string;
  tamerName: string;
  role: GuildRole;
  tamerLevel: number;
  contributionExp: number;
  joinedAtIso: string;
  digimonFormId?: string;
  /** Mobs defeated today (resets at 23:59 -> 00:00 Brasília time). */
  dailyKills?: number;
  /** Server day key (YYYY-MM-DD) for dailyKills. */
  dailyKillsDate?: string;
  /** Cumulative all-time mobs defeated by this member (NEVER resets). */
  totalKills?: number;
}

export interface GuildSkillsState {
  expBoost: number; // 0..3 -> +5% / +10% / +15% EXP
  attackBoost: number; // 0..3 -> +4% / +8% / +12% AT
  bitsBoost: number; // 0..3 -> +8% / +16% / +24% Bits
}

export interface GuildChatEntry {
  id: string;
  senderName: string;
  role: GuildRole;
  text: string;
  timestamp: string;
}

export interface GuildRecord {
  guildId: string;
  name: string;
  tag: string;
  emblemColor: GuildEmblemColor;
  emblemPhotoUrl?: string | null;
  notice: string;
  masterUid: string;
  masterName: string;
  level: number;
  exp: number;
  skillPoints: number;
  skills: GuildSkillsState;
  recruiting: boolean;
  memberUids: string[];
  members: Record<string, GuildMemberRecord>;
  chatMessages: GuildChatEntry[];
  /** Server day key (YYYY-MM-DD, America/Sao_Paulo) for dailyKills. */
  dailyHuntDate?: string;
  /** Sum of mobs defeated by all guild members on dailyHuntDate. */
  dailyKills?: number;
  /** Previous server day key (YYYY-MM-DD) whose final score determines today's Event XP reward. */
  prevDayDate?: string;
  /** Locked total mobs defeated by all guild members on prevDayDate. */
  prevDayKills?: number;
  /** Cumulative all-time mobs defeated by all guild members (NEVER resets). */
  totalKills?: number;
}

export const GUILD_CREATION_COST_BITS: number = 0; // Gratuito para todos os Tamers
export const GUILD_MAX_LEVEL = 10;

export const GUILD_ROLE_LABELS: Record<GuildRole, string> = {
  master: 'Mestre da Guilda',
  submaster: 'Sub-Mestre',
  officer: 'Oficial DATS',
  member: 'Membro',
};

export const GUILD_SKILL_SPECS = [
  {
    key: 'expBoost' as const,
    name: 'Treinamento DATS',
    maxLevel: 3,
    perLevelPct: 5,
    description: 'Aumenta a EXP obtida em batalha para todos os membros da Guilda.',
    formatBonus: (lv: number) => `+${lv * 5}% EXP`,
  },
  {
    key: 'attackBoost' as const,
    name: 'Fúria Digital',
    maxLevel: 3,
    perLevelPct: 4,
    description: 'Fortalece o poder de ataque dos Digimons de toda a Guilda.',
    formatBonus: (lv: number) => `+${lv * 4}% AT`,
  },
  {
    key: 'bitsBoost' as const,
    name: 'Coleta de Dados',
    maxLevel: 3,
    perLevelPct: 8,
    description: 'Aumenta os Bits recebidos ao derrotar Digimons selvagens.',
    formatBonus: (lv: number) => `+${lv * 8}% Bits`,
  },
] as const;

export function getGuildExpRequiredForLevel(level: number): number {
  const safeLv = Math.max(1, Math.min(GUILD_MAX_LEVEL, level));
  return Math.round(1200 * Math.pow(safeLv, 1.55));
}

export function getGuildMaxMembersForLevel(level: number): number {
  return Math.min(50, 30 + Math.max(0, level - 1) * 2);
}

const VALID_PHOTO_DATA_URL_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_GUILD_PHOTO_DATA_URL_LEN = 44_000;

export function sanitizeGuildPhotoUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 48_000) return null;
  return VALID_PHOTO_DATA_URL_RE.test(trimmed) ? trimmed : null;
}

/**
 * Center-crops any uploaded phone/desktop image into a crisp 128x128 square
 * and compresses it below Firestore's 48KB guild emblem limit.
 */
export async function processGuildPhotoUpload(
  file: File
): Promise<{ ok: boolean; dataUrl?: string; error?: string }> {
  return processSquarePhotoUpload(file, {
    maxBytes: MAX_GUILD_PHOTO_DATA_URL_LEN,
    fillBackground: '#071b4a',
    errorTooLargeCompression:
      'Não foi possível comprimir esta foto para o escudo da Guilda. Tente outra imagem.',
  });
}

export function getGuildPassiveBonuses(guild: GuildRecord | null): {
  expBonusPct: number;
  attackBonusPct: number;
  bitsBonusPct: number;
} {
  if (!guild) {
    return { expBonusPct: 0, attackBonusPct: 0, bitsBonusPct: 0 };
  }
  return {
    expBonusPct: Math.max(0, Math.min(3, guild.skills.expBoost)) * 5,
    attackBonusPct: Math.max(0, Math.min(3, guild.skills.attackBoost)) * 4,
    bitsBonusPct: Math.max(0, Math.min(3, guild.skills.bitsBoost)) * 8,
  };
}

// ============================================================================
// Daily Guild Mob Hunt Event (Resets every day at 23:59 -> 00:00 Brasília time)
// Top 1: +10% XP | Top 2: +9% | Top 3: +8% | Top 4: +7% | Top 5: +6% | 6º+: +5%
// ============================================================================
const SERVER_TIMEZONE = 'America/Sao_Paulo';
const DAY_KEY_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

export const DAILY_GUILD_EVENT_TIERS = [
  { rankLabel: 'Top 1', xpPct: 10, accent: 'text-amber-300 border-amber-300/80 bg-amber-500/20' },
  { rankLabel: 'Top 2', xpPct: 9, accent: 'text-slate-100 border-slate-300/75 bg-slate-400/20' },
  { rankLabel: 'Top 3', xpPct: 8, accent: 'text-orange-200 border-orange-400/75 bg-orange-500/20' },
  { rankLabel: 'Top 4', xpPct: 7, accent: 'text-cyan-200 border-cyan-300/70 bg-cyan-500/15' },
  { rankLabel: 'Top 5', xpPct: 6, accent: 'text-sky-200 border-sky-400/70 bg-sky-500/15' },
  { rankLabel: 'Demais Guildas (6º+)', xpPct: 5, accent: 'text-emerald-200 border-emerald-400/60 bg-emerald-500/15' },
] as const;

export function getEventXpBonusForRank(rank: number | null): number {
  if (rank === 1) return 10;
  if (rank === 2) return 9;
  if (rank === 3) return 8;
  if (rank === 4) return 7;
  if (rank === 5) return 6;
  return 5;
}

function getBrasiliaDateParts(now: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: SERVER_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const map: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = Number(p.value);
    }
    const hour = map.hour === 24 ? 0 : map.hour || 0;
    return {
      year: map.year || now.getFullYear(),
      month: map.month || now.getMonth() + 1,
      day: map.day || now.getDate(),
      hour,
      minute: map.minute || 0,
      second: map.second || 0,
    };
  } catch {
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
    };
  }
}

export function getServerDayKey(now: Date = new Date()): string {
  const p = getBrasiliaDateParts(now);
  return `${String(p.year).padStart(4, '0')}-${String(p.month).padStart(2, '0')}-${String(
    p.day
  ).padStart(2, '0')}`;
}

export function getPreviousServerDayKey(now: Date = new Date()): string {
  const today = getServerDayKey(now);
  const [y, m, d] = today.split('-').map(Number);
  const utcPrev = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) - 1));
  return `${String(utcPrev.getUTCFullYear()).padStart(4, '0')}-${String(
    utcPrev.getUTCMonth() + 1
  ).padStart(2, '0')}-${String(utcPrev.getUTCDate()).padStart(2, '0')}`;
}

export function getDailyResetCountdown(now: Date = new Date()): {
  label: string;
  secondsRemaining: number;
  todayKey: string;
  yesterdayKey: string;
} {
  const p = getBrasiliaDateParts(now);
  const elapsed = p.hour * 3600 + p.minute * 60 + p.second;
  const remaining = Math.max(0, 86400 - elapsed);
  const hh = Math.floor(remaining / 3600);
  const mm = Math.floor((remaining % 3600) / 60);
  const ss = remaining % 60;
  return {
    label: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(
      2,
      '0'
    )}`,
    secondsRemaining: remaining,
    todayKey: getServerDayKey(now),
    yesterdayKey: getPreviousServerDayKey(now),
  };
}

export function getEffectiveGuildDailyKills(
  guild: GuildRecord,
  todayKey: string = getServerDayKey()
): number {
  return guild.dailyHuntDate === todayKey ? Math.max(0, Math.round(guild.dailyKills ?? 0)) : 0;
}

export function getEffectiveGuildPrevDayKills(
  guild: GuildRecord,
  yesterdayKey: string = getPreviousServerDayKey()
): number {
  if (guild.dailyHuntDate === yesterdayKey) {
    return Math.max(0, Math.round(guild.dailyKills ?? 0));
  }
  if (guild.prevDayDate === yesterdayKey) {
    return Math.max(0, Math.round(guild.prevDayKills ?? 0));
  }
  return 0;
}

export function getEffectiveGuildTotalKills(guild: GuildRecord): number {
  const stored = Math.max(0, Math.round(guild.totalKills ?? 0));
  if (stored > 0) return stored;
  return Object.values(guild.members).reduce(
    (sum, m) => sum + getEffectiveMemberTotalKills(m),
    0
  );
}

export function getEffectiveMemberDailyKills(
  member: GuildMemberRecord,
  guild: GuildRecord,
  todayKey: string = getServerDayKey()
): number {
  if (member.dailyKillsDate === todayKey) {
    return Math.max(0, Math.round(member.dailyKills ?? 0));
  }
  if (!member.dailyKillsDate && guild.dailyHuntDate === todayKey) {
    return Math.max(0, Math.round(member.dailyKills ?? 0));
  }
  return 0;
}

export function getEffectiveMemberTotalKills(member: GuildMemberRecord): number {
  return Math.max(0, Math.round(member.totalKills ?? 0));
}

export interface DailyGuildEventStanding {
  guild: GuildRecord;
  rank: number;
  kills: number;
  xpBonusPct: number;
}

export interface DailyGuildEventSummary {
  todayKey: string;
  yesterdayKey: string;
  todayStandings: DailyGuildEventStanding[];
  yesterdayWinners: DailyGuildEventStanding[];
  myActiveXpBonusPct: number;
  myActiveWinnerRank: number | null;
  myTodayRank: number | null;
  myTodayKills: number;
  myYesterdayKills: number;
}

export function computeDailyGuildEventStandings(
  serverGuilds: GuildRecord[],
  myGuild: GuildRecord | null,
  now: Date = new Date()
): DailyGuildEventSummary {
  const todayKey = getServerDayKey(now);
  const yesterdayKey = getPreviousServerDayKey(now);

  const uniqueMap = new Map<string, GuildRecord>();
  for (const g of serverGuilds) uniqueMap.set(g.guildId, g);
  if (myGuild) uniqueMap.set(myGuild.guildId, myGuild);
  const allGuilds = Array.from(uniqueMap.values());

  // Today's live race (ranked by mobs defeated today, tiebreak totalKills -> level -> guildId)
  const todaySorted = [...allGuilds].sort((a, b) => {
    const ka = getEffectiveGuildDailyKills(a, todayKey);
    const kb = getEffectiveGuildDailyKills(b, todayKey);
    if (kb !== ka) return kb - ka;
    const ta = getEffectiveGuildTotalKills(a);
    const tb = getEffectiveGuildTotalKills(b);
    if (tb !== ta) return tb - ta;
    if (b.level !== a.level) return b.level - a.level;
    return a.guildId.localeCompare(b.guildId);
  });

  const todayStandings: DailyGuildEventStanding[] = todaySorted.map((g, idx) => {
    const rank = idx + 1;
    const kills = getEffectiveGuildDailyKills(g, todayKey);
    return {
      guild: g,
      rank,
      kills,
      xpBonusPct: kills > 0 ? getEventXpBonusForRank(rank) : 5,
    };
  });

  // Yesterday's closed winners (locked at 00:00 — determines today's active Event XP bonus!)
  const yesterdayCandidates = allGuilds
    .map((g) => ({ guild: g, kills: getEffectiveGuildPrevDayKills(g, yesterdayKey) }))
    .filter((item) => item.kills > 0)
    .sort((a, b) => {
      if (b.kills !== a.kills) return b.kills - a.kills;
      const ta = getEffectiveGuildTotalKills(a.guild);
      const tb = getEffectiveGuildTotalKills(b.guild);
      if (tb !== ta) return tb - ta;
      return b.guild.level - a.guild.level || a.guild.guildId.localeCompare(b.guild.guildId);
    });

  const yesterdayWinners: DailyGuildEventStanding[] = yesterdayCandidates.map((item, idx) => {
    const rank = idx + 1;
    return {
      guild: item.guild,
      rank,
      kills: item.kills,
      xpBonusPct: getEventXpBonusForRank(rank),
    };
  });

  if (!myGuild) {
    return {
      todayKey,
      yesterdayKey,
      todayStandings,
      yesterdayWinners,
      myActiveXpBonusPct: 0,
      myActiveWinnerRank: null,
      myTodayRank: null,
      myTodayKills: 0,
      myYesterdayKills: 0,
    };
  }

  const myWinEntry = yesterdayWinners.find((w) => w.guild.guildId === myGuild.guildId) ?? null;
  const myTodayEntry = todayStandings.find((s) => s.guild.guildId === myGuild.guildId) ?? null;

  return {
    todayKey,
    yesterdayKey,
    todayStandings,
    yesterdayWinners,
    myActiveXpBonusPct: myWinEntry ? myWinEntry.xpBonusPct : 5,
    myActiveWinnerRank: myWinEntry ? myWinEntry.rank : null,
    myTodayRank: myTodayEntry ? myTodayEntry.rank : null,
    myTodayKills: getEffectiveGuildDailyKills(myGuild, todayKey),
    myYesterdayKills: getEffectiveGuildPrevDayKills(myGuild, yesterdayKey),
  };
}

function nowTimeLabel(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ============================================================================
// Local Storage Fallback Registry (enables instant offline / Quick Test mode)
// ============================================================================
const LOCAL_GUILDS_KEY = 'dmo_guilds_registry_v1';
const localGuildListeners = new Set<() => void>();

function notifyLocalGuildListeners(): void {
  for (const fn of localGuildListeners) {
    fn();
  }
}

function readLocalGuilds(): Record<string, GuildRecord> {
  try {
    const raw = window.localStorage.getItem(LOCAL_GUILDS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, GuildRecord>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalGuilds(map: Record<string, GuildRecord>): void {
  try {
    window.localStorage.setItem(LOCAL_GUILDS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
  notifyLocalGuildListeners();
}

export function getCurrentActorUid(fallbackUsername: string): string {
  const user = auth.currentUser;
  if (user && user.emailVerified) return user.uid;
  const clean = fallbackUsername
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  return `local_${clean || 'tamer'}`;
}

function slugifyGuildId(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `g-${base || 'dats'}-${suffix}`;
}

function parseGuildDoc(raw: Record<string, unknown>, fallbackId: string): GuildRecord {
  const skillsRaw = (raw.skills ?? {}) as Record<string, unknown>;
  const membersRaw = (raw.members ?? {}) as Record<string, Record<string, unknown>>;
  const members: Record<string, GuildMemberRecord> = {};
  for (const [uid, m] of Object.entries(membersRaw)) {
    if (!m || typeof m !== 'object') continue;
    const roleVal = m.role;
    const role: GuildRole =
      roleVal === 'master' ||
      roleVal === 'submaster' ||
      roleVal === 'officer' ||
      roleVal === 'member'
        ? roleVal
        : 'member';
    members[uid] = {
      uid,
      tamerName: String(m.tamerName ?? 'Tamer').slice(0, 24),
      role,
      tamerLevel: Math.max(1, Math.round(Number(m.tamerLevel) || 1)),
      contributionExp: Math.max(0, Math.round(Number(m.contributionExp) || 0)),
      joinedAtIso:
        typeof m.joinedAtIso === 'string' ? m.joinedAtIso : new Date().toISOString(),
      digimonFormId:
        typeof m.digimonFormId === 'string' && m.digimonFormId.length <= 32
          ? m.digimonFormId
          : undefined,
      dailyKills: Math.max(0, Math.round(Number(m.dailyKills) || 0)),
      dailyKillsDate:
        typeof m.dailyKillsDate === 'string' && DAY_KEY_RE.test(m.dailyKillsDate)
          ? m.dailyKillsDate
          : undefined,
      totalKills: Math.max(0, Math.round(Number(m.totalKills) || 0)),
    };
  }
  const memberUids = Array.isArray(raw.memberUids)
    ? raw.memberUids.filter((u): u is string => typeof u === 'string').slice(0, 50)
    : Object.keys(members);

  const chatMessages: GuildChatEntry[] = Array.isArray(raw.chatMessages)
    ? raw.chatMessages
        .filter((c): c is Record<string, unknown> => Boolean(c && typeof c === 'object'))
        .slice(-25)
        .map((c, idx) => ({
          id: String(c.id ?? `gc-${idx}`),
          senderName: String(c.senderName ?? 'Sistema').slice(0, 24),
          role:
            c.role === 'master' ||
            c.role === 'submaster' ||
            c.role === 'officer' ||
            c.role === 'member'
              ? c.role
              : 'member',
          text: String(c.text ?? '').slice(0, 140),
          timestamp: String(c.timestamp ?? '00:00').slice(0, 8),
        }))
    : [];

  const colorRaw = raw.emblemColor;
  const emblemColor: GuildEmblemColor =
    colorRaw === 'amber' ||
    colorRaw === 'crimson' ||
    colorRaw === 'emerald' ||
    colorRaw === 'violet'
      ? colorRaw
      : 'cyan';

  const dailyHuntDate =
    typeof raw.dailyHuntDate === 'string' && DAY_KEY_RE.test(raw.dailyHuntDate)
      ? raw.dailyHuntDate
      : undefined;
  const prevDayDate =
    typeof raw.prevDayDate === 'string' && DAY_KEY_RE.test(raw.prevDayDate)
      ? raw.prevDayDate
      : undefined;

  return {
    guildId: String(raw.guildId ?? fallbackId),
    name: String(raw.name ?? 'Guilda DATS').slice(0, 24),
    tag: String(raw.tag ?? 'DATS').toUpperCase().slice(0, 4),
    emblemColor,
    emblemPhotoUrl: sanitizeGuildPhotoUrl(raw.emblemPhotoUrl),
    notice: String(raw.notice ?? '').slice(0, 160),
    masterUid: String(raw.masterUid ?? ''),
    masterName: String(raw.masterName ?? 'Mestre').slice(0, 24),
    level: Math.max(1, Math.min(GUILD_MAX_LEVEL, Math.round(Number(raw.level) || 1))),
    exp: Math.max(0, Math.round(Number(raw.exp) || 0)),
    skillPoints: Math.max(0, Math.min(20, Math.round(Number(raw.skillPoints) || 0))),
    skills: {
      expBoost: Math.max(0, Math.min(3, Math.round(Number(skillsRaw.expBoost) || 0))),
      attackBoost: Math.max(
        0,
        Math.min(3, Math.round(Number(skillsRaw.attackBoost) || 0))
      ),
      bitsBoost: Math.max(0, Math.min(3, Math.round(Number(skillsRaw.bitsBoost) || 0))),
    },
    recruiting: typeof raw.recruiting === 'boolean' ? raw.recruiting : true,
    memberUids,
    members,
    chatMessages,
    dailyHuntDate,
    dailyKills: Math.max(0, Math.round(Number(raw.dailyKills) || 0)),
    prevDayDate,
    prevDayKills: Math.max(0, Math.round(Number(raw.prevDayKills) || 0)),
    totalKills: Math.max(0, Math.round(Number(raw.totalKills) || 0)),
  };
}

function isFirestoreReady(): boolean {
  const user = auth.currentUser;
  return Boolean(user && user.emailVerified);
}

/**
 * Subscribes in real time to the current player's Guild (if any).
 */
export function subscribePlayerGuild(
  actorUid: string,
  onUpdate: (guild: GuildRecord | null) => void
): Unsubscribe {
  const emitLocal = () => {
    const all = Object.values(readLocalGuilds());
    const mine = all.find((g) => g.memberUids.includes(actorUid)) ?? null;
    onUpdate(mine);
  };

  localGuildListeners.add(emitLocal);
  emitLocal();

  if (!isFirestoreReady()) {
    return () => {
      localGuildListeners.delete(emitLocal);
    };
  }

  const q = query(
    collection(db, 'guilds'),
    where('memberUids', 'array-contains', actorUid)
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        onUpdate(null);
        return;
      }
      const firstDoc = snap.docs[0];
      const parsed = parseGuildDoc(
        (firstDoc.data() ?? {}) as Record<string, unknown>,
        firstDoc.id
      );
      const localMap = readLocalGuilds();
      localMap[parsed.guildId] = parsed;
      writeLocalGuilds(localMap);
      onUpdate(parsed);
    },
    (error) => {
      emitLocal();
      try {
        handleFirestoreError(error, OperationType.LIST, 'guilds');
      } catch {
        // Keep local fallback running
      }
    }
  );

  return () => {
    localGuildListeners.delete(emitLocal);
    unsub();
  };
}

/**
 * Fetches all currently recruiting guilds in the server so players without a guild can join.
 */
export async function fetchRecruitingGuilds(): Promise<GuildRecord[]> {
  if (!isFirestoreReady()) {
    return Object.values(readLocalGuilds())
      .filter((g) => g.recruiting)
      .sort((a, b) => b.level - a.level || b.memberUids.length - a.memberUids.length);
  }

  try {
    const q = query(collection(db, 'guilds'), where('recruiting', '==', true));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => parseGuildDoc((d.data() ?? {}) as Record<string, unknown>, d.id))
      .sort((a, b) => b.level - a.level || b.memberUids.length - a.memberUids.length);
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, 'guilds');
    } catch {
      // Fallback to local list
    }
    return Object.values(readLocalGuilds()).filter((g) => g.recruiting);
  }
}

export async function createNewGuild(params: {
  actorUid: string;
  tamerName: string;
  tamerLevel: number;
  digimonFormId?: string;
  name: string;
  tag: string;
  emblemColor: GuildEmblemColor;
  emblemPhotoUrl?: string | null;
  notice: string;
}): Promise<{ ok: boolean; guild?: GuildRecord; error?: string }> {
  const cleanName = params.name.trim().slice(0, 24);
  const cleanTag = params.tag
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4);
  const cleanNotice =
    params.notice.trim().slice(0, 160) ||
    `Juntos somos mais fortes! Bem-vindos à guilda ${cleanName}.`;
  const safePhoto = sanitizeGuildPhotoUrl(params.emblemPhotoUrl);

  if (cleanName.length < 3) {
    return { ok: false, error: 'O nome da Guilda precisa ter pelo menos 3 caracteres.' };
  }
  if (cleanTag.length < 2) {
    return { ok: false, error: 'A sigla (TAG) da Guilda precisa ter 2 a 4 letras ou números.' };
  }

  const guildId = slugifyGuildId(cleanName);
  const nowIso = new Date().toISOString();
  const todayKey = getServerDayKey();
  const cleanTamer = params.tamerName.trim().slice(0, 24) || 'Tamer';

  const newGuild: GuildRecord = {
    guildId,
    name: cleanName,
    tag: cleanTag,
    emblemColor: params.emblemColor,
    emblemPhotoUrl: safePhoto,
    notice: cleanNotice,
    masterUid: params.actorUid,
    masterName: cleanTamer,
    level: 1,
    exp: 0,
    skillPoints: 1,
    skills: {
      expBoost: 0,
      attackBoost: 0,
      bitsBoost: 0,
    },
    recruiting: true,
    memberUids: [params.actorUid],
    members: {
      [params.actorUid]: {
        uid: params.actorUid,
        tamerName: cleanTamer,
        role: 'master',
        tamerLevel: Math.max(1, params.tamerLevel),
        contributionExp: 0,
        joinedAtIso: nowIso,
        digimonFormId: params.digimonFormId || 'agumon',
        dailyKills: 0,
        dailyKillsDate: todayKey,
        totalKills: 0,
      },
    },
    chatMessages: [
      {
        id: `gc-found-${Date.now()}`,
        senderName: cleanTamer,
        role: 'master',
        text: `Guilda [${cleanTag}] ${cleanName} fundada oficialmente na DATS!`,
        timestamp: nowTimeLabel(),
      },
    ],
    dailyHuntDate: todayKey,
    dailyKills: 0,
    prevDayDate: getPreviousServerDayKey(),
    prevDayKills: 0,
    totalKills: 0,
  };

  if (!isFirestoreReady()) {
    const map = readLocalGuilds();
    map[guildId] = newGuild;
    writeLocalGuilds(map);
    return { ok: true, guild: newGuild };
  }

  const ref = doc(db, 'guilds', guildId);
  try {
    await setDoc(ref, {
      ...newGuild,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const map = readLocalGuilds();
    map[guildId] = newGuild;
    writeLocalGuilds(map);
    return { ok: true, guild: newGuild };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.CREATE, `guilds/${guildId}`);
    } catch {
      // Structured log
    }
    return { ok: false, error: 'Não foi possível criar a Guilda no servidor agora.' };
  }
}

export async function joinRecruitingGuild(params: {
  guildId: string;
  actorUid: string;
  tamerName: string;
  tamerLevel: number;
  digimonFormId?: string;
}): Promise<{ ok: boolean; guildName?: string; error?: string }> {
  const cleanTamer = params.tamerName.trim().slice(0, 24) || 'Tamer';
  const nowIso = new Date().toISOString();
  const formId = params.digimonFormId || 'agumon';

  if (!isFirestoreReady()) {
    const map = readLocalGuilds();
    const g = map[params.guildId];
    if (!g) return { ok: false, error: 'Guilda não encontrada.' };
    if (!g.recruiting) return { ok: false, error: 'Esta Guilda está com recrutamento fechado.' };
    if (g.memberUids.includes(params.actorUid)) {
      return { ok: true, guildName: g.name };
    }
    if (g.memberUids.length >= getGuildMaxMembersForLevel(g.level)) {
      return { ok: false, error: 'Esta Guilda atingiu o limite máximo de membros.' };
    }
    map[params.guildId] = {
      ...g,
      memberUids: [...g.memberUids, params.actorUid],
      members: {
        ...g.members,
        [params.actorUid]: {
          uid: params.actorUid,
          tamerName: cleanTamer,
          role: 'member',
          tamerLevel: Math.max(1, params.tamerLevel),
          contributionExp: 0,
          joinedAtIso: nowIso,
          digimonFormId: formId,
        },
      },
      chatMessages: [
        ...g.chatMessages.slice(-24),
        {
          id: `gc-join-${Date.now()}`,
          senderName: cleanTamer,
          role: 'member',
          text: `${cleanTamer} entrou para a Guilda!`,
          timestamp: nowTimeLabel(),
        },
      ],
    };
    writeLocalGuilds(map);
    return { ok: true, guildName: g.name };
  }

  const ref = doc(db, 'guilds', params.guildId);
  try {
    let joinedName = '';
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('Guilda não encontrada.');
      const g = parseGuildDoc((snap.data() ?? {}) as Record<string, unknown>, snap.id);
      if (!g.recruiting) throw new Error('Esta Guilda está com recrutamento fechado.');
      if (g.memberUids.includes(params.actorUid)) {
        joinedName = g.name;
        return;
      }
      if (g.memberUids.length >= getGuildMaxMembersForLevel(g.level)) {
        throw new Error('Esta Guilda atingiu o limite máximo de membros.');
      }
      joinedName = g.name;
      const nextMembers = {
        ...g.members,
        [params.actorUid]: {
          uid: params.actorUid,
          tamerName: cleanTamer,
          role: 'member' as GuildRole,
          tamerLevel: Math.max(1, params.tamerLevel),
          contributionExp: 0,
          joinedAtIso: nowIso,
          digimonFormId: formId,
        },
      };
      const nextChat: GuildChatEntry[] = [
        ...g.chatMessages.slice(-24),
        {
          id: `gc-join-${Date.now()}`,
          senderName: cleanTamer,
          role: 'member',
          text: `${cleanTamer} entrou para a Guilda!`,
          timestamp: nowTimeLabel(),
        },
      ];
      tx.update(ref, {
        memberUids: [...g.memberUids, params.actorUid],
        members: nextMembers,
        chatMessages: nextChat,
        updatedAt: serverTimestamp(),
      });
    });
    return { ok: true, guildName: joinedName };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao entrar na Guilda.';
    return { ok: false, error: msg };
  }
}

export async function leaveOrDisbandGuild(params: {
  guildId: string;
  actorUid: string;
  tamerName: string;
}): Promise<{ ok: boolean; disbanded?: boolean; error?: string }> {
  const cleanTamer = params.tamerName.trim().slice(0, 24) || 'Tamer';

  if (!isFirestoreReady()) {
    const map = readLocalGuilds();
    const g = map[params.guildId];
    if (!g) return { ok: true };
    if (g.masterUid === params.actorUid) {
      delete map[params.guildId];
      writeLocalGuilds(map);
      return { ok: true, disbanded: true };
    }
    const nextMembers = { ...g.members };
    delete nextMembers[params.actorUid];
    map[params.guildId] = {
      ...g,
      memberUids: g.memberUids.filter((u) => u !== params.actorUid),
      members: nextMembers,
      chatMessages: [
        ...g.chatMessages.slice(-24),
        {
          id: `gc-leave-${Date.now()}`,
          senderName: cleanTamer,
          role: 'member',
          text: `${cleanTamer} saiu da Guilda.`,
          timestamp: nowTimeLabel(),
        },
      ],
    };
    writeLocalGuilds(map);
    return { ok: true, disbanded: false };
  }

  const ref = doc(db, 'guilds', params.guildId);
  try {
    let disbanded = false;
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const g = parseGuildDoc((snap.data() ?? {}) as Record<string, unknown>, snap.id);
      if (g.masterUid === params.actorUid) {
        if (g.memberUids.length > 1) {
          throw new Error(
            'Transfira a liderança para outro membro ou expulse os membros antes de dissolver a Guilda.'
          );
        }
        tx.delete(ref);
        disbanded = true;
        return;
      }
      const nextMembers = { ...g.members };
      delete nextMembers[params.actorUid];
      tx.update(ref, {
        memberUids: g.memberUids.filter((u) => u !== params.actorUid),
        members: nextMembers,
        chatMessages: [
          ...g.chatMessages.slice(-24),
          {
            id: `gc-leave-${Date.now()}`,
            senderName: cleanTamer,
            role: 'member',
            text: `${cleanTamer} saiu da Guilda.`,
            timestamp: nowTimeLabel(),
          },
        ],
        updatedAt: serverTimestamp(),
      });
    });

    if (disbanded) {
      const map = readLocalGuilds();
      delete map[params.guildId];
      writeLocalGuilds(map);
      try {
        await deleteDoc(doc(db, 'guildRankings', params.guildId));
      } catch {
        // Non-fatal cleanup
      }
    }
    return { ok: true, disbanded };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao sair da Guilda.';
    return { ok: false, error: msg };
  }
}

export async function disbandGuildAsMaster(
  guildId: string
): Promise<{ ok: boolean; error?: string }> {
  const map = readLocalGuilds();
  delete map[guildId];
  writeLocalGuilds(map);

  if (!isFirestoreReady()) return { ok: true };

  try {
    await deleteDoc(doc(db, 'guilds', guildId));
    try {
      await deleteDoc(doc(db, 'guildRankings', guildId));
    } catch {
      // Non-fatal cleanup
    }
    return { ok: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, `guilds/${guildId}`);
    } catch {
      // Structured log
    }
    return { ok: false, error: 'Apenas o Mestre da Guilda pode dissolvê-la.' };
  }
}

export async function updateGuildNoticeAndRecruiting(params: {
  guildId: string;
  notice: string;
  recruiting: boolean;
  emblemColor?: GuildEmblemColor;
  emblemPhotoUrl?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const cleanNotice = params.notice.trim().slice(0, 160);
  const hasPhotoUpdate = params.emblemPhotoUrl !== undefined;
  const safePhoto = hasPhotoUpdate ? sanitizeGuildPhotoUrl(params.emblemPhotoUrl) : undefined;

  if (!isFirestoreReady()) {
    const map = readLocalGuilds();
    const g = map[params.guildId];
    if (!g) return { ok: false, error: 'Guilda não encontrada.' };
    map[params.guildId] = {
      ...g,
      notice: cleanNotice,
      recruiting: params.recruiting,
      emblemColor: params.emblemColor ?? g.emblemColor,
      emblemPhotoUrl: hasPhotoUpdate ? safePhoto : g.emblemPhotoUrl,
    };
    writeLocalGuilds(map);
    return { ok: true };
  }

  const ref = doc(db, 'guilds', params.guildId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('Guilda não encontrada.');
      const payload: Record<string, unknown> = {
        notice: cleanNotice,
        recruiting: params.recruiting,
        updatedAt: serverTimestamp(),
      };
      if (params.emblemColor) {
        payload.emblemColor = params.emblemColor;
      }
      if (hasPhotoUpdate) {
        payload.emblemPhotoUrl = safePhoto ?? null;
      }
      tx.update(ref, payload);
    });
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Sem permissão para editar a Guilda.';
    return { ok: false, error: msg };
  }
}

export async function updateGuildEmblemPhoto(params: {
  guildId: string;
  emblemPhotoUrl: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const safePhoto = sanitizeGuildPhotoUrl(params.emblemPhotoUrl);

  if (!isFirestoreReady()) {
    const map = readLocalGuilds();
    const g = map[params.guildId];
    if (!g) return { ok: false, error: 'Guilda não encontrada.' };
    map[params.guildId] = { ...g, emblemPhotoUrl: safePhoto };
    writeLocalGuilds(map);
    return { ok: true };
  }

  const ref = doc(db, 'guilds', params.guildId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('Guilda não encontrada.');
      tx.update(ref, {
        emblemPhotoUrl: safePhoto ?? null,
        updatedAt: serverTimestamp(),
      });
    });
    return { ok: true };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : 'Sem permissão para atualizar a foto da Guilda.';
    return { ok: false, error: msg };
  }
}

export async function upgradeGuildSkill(params: {
  guildId: string;
  skillKey: keyof GuildSkillsState;
}): Promise<{ ok: boolean; error?: string }> {
  const applyUpgrade = (g: GuildRecord): GuildRecord => {
    const currentLv = g.skills[params.skillKey];
    if (currentLv >= 3) throw new Error('Esta skill da Guilda já está no nível máximo (3/3).');
    if (g.skillPoints <= 0) {
      throw new Error('Sem Pontos de Guilda disponíveis. Ganhe EXP de Guilda para subir de nível!');
    }
    return {
      ...g,
      skillPoints: g.skillPoints - 1,
      skills: {
        ...g.skills,
        [params.skillKey]: currentLv + 1,
      },
    };
  };

  if (!isFirestoreReady()) {
    const map = readLocalGuilds();
    const g = map[params.guildId];
    if (!g) return { ok: false, error: 'Guilda não encontrada.' };
    try {
      map[params.guildId] = applyUpgrade(g);
      writeLocalGuilds(map);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Erro ao evoluir skill.' };
    }
  }

  const ref = doc(db, 'guilds', params.guildId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('Guilda não encontrada.');
      const g = parseGuildDoc((snap.data() ?? {}) as Record<string, unknown>, snap.id);
      const next = applyUpgrade(g);
      tx.update(ref, {
        skillPoints: next.skillPoints,
        skills: next.skills,
        updatedAt: serverTimestamp(),
      });
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Erro ao evoluir skill da Guilda.',
    };
  }
}

export async function manageGuildMemberRoleOrKick(params: {
  guildId: string;
  targetUid: string;
  action: 'promote' | 'demote' | 'kick' | 'transfer_master';
}): Promise<{ ok: boolean; error?: string }> {
  const applyAction = (g: GuildRecord): GuildRecord => {
    const target = g.members[params.targetUid];
    if (!target) throw new Error('Membro não encontrado na Guilda.');
    if (params.targetUid === g.masterUid) {
      throw new Error('Não é possível alterar o cargo do Mestre diretamente.');
    }

    if (params.action === 'kick') {
      const nextMembers = { ...g.members };
      delete nextMembers[params.targetUid];
      return {
        ...g,
        memberUids: g.memberUids.filter((u) => u !== params.targetUid),
        members: nextMembers,
        chatMessages: [
          ...g.chatMessages.slice(-24),
          {
            id: `gc-kick-${Date.now()}`,
            senderName: g.masterName,
            role: 'master',
            text: `${target.tamerName} foi removido da Guilda.`,
            timestamp: nowTimeLabel(),
          },
        ],
      };
    }

    if (params.action === 'transfer_master') {
      const oldMaster = g.members[g.masterUid];
      return {
        ...g,
        masterUid: target.uid,
        masterName: target.tamerName,
        members: {
          ...g.members,
          [g.masterUid]: oldMaster
            ? { ...oldMaster, role: 'submaster' }
            : {
                uid: g.masterUid,
                tamerName: g.masterName,
                role: 'submaster',
                tamerLevel: 1,
                contributionExp: 0,
                joinedAtIso: new Date().toISOString(),
              },
          [target.uid]: { ...target, role: 'master' },
        },
        chatMessages: [
          ...g.chatMessages.slice(-24),
          {
            id: `gc-master-${Date.now()}`,
            senderName: target.tamerName,
            role: 'master',
            text: `${target.tamerName} assumiu a liderança como Mestre da Guilda!`,
            timestamp: nowTimeLabel(),
          },
        ],
      };
    }

    const order: GuildRole[] = ['member', 'officer', 'submaster'];
    const idx = Math.max(0, order.indexOf(target.role));
    const nextIdx =
      params.action === 'promote'
        ? Math.min(order.length - 1, idx + 1)
        : Math.max(0, idx - 1);
    const nextRole = order[nextIdx];
    return {
      ...g,
      members: {
        ...g.members,
        [target.uid]: { ...target, role: nextRole },
      },
    };
  };

  if (!isFirestoreReady()) {
    const map = readLocalGuilds();
    const g = map[params.guildId];
    if (!g) return { ok: false, error: 'Guilda não encontrada.' };
    try {
      map[params.guildId] = applyAction(g);
      writeLocalGuilds(map);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Erro na ação.' };
    }
  }

  const ref = doc(db, 'guilds', params.guildId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('Guilda não encontrada.');
      const g = parseGuildDoc((snap.data() ?? {}) as Record<string, unknown>, snap.id);
      const next = applyAction(g);
      tx.update(ref, {
        masterUid: next.masterUid,
        masterName: next.masterName,
        memberUids: next.memberUids,
        members: next.members,
        chatMessages: next.chatMessages,
        updatedAt: serverTimestamp(),
      });
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar membro.',
    };
  }
}

export async function sendGuildChatMessage(params: {
  guildId: string;
  actorUid: string;
  tamerName: string;
  text: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cleanText = params.text.trim().slice(0, 140);
  if (!cleanText) return { ok: false };
  const cleanTamer = params.tamerName.trim().slice(0, 24) || 'Tamer';

  if (!isFirestoreReady()) {
    const map = readLocalGuilds();
    const g = map[params.guildId];
    if (!g) return { ok: false, error: 'Guilda não encontrada.' };
    const role = g.members[params.actorUid]?.role ?? 'member';
    map[params.guildId] = {
      ...g,
      chatMessages: [
        ...g.chatMessages.slice(-24),
        {
          id: `gc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          senderName: cleanTamer,
          role,
          text: cleanText,
          timestamp: nowTimeLabel(),
        },
      ],
    };
    writeLocalGuilds(map);
    return { ok: true };
  }

  const ref = doc(db, 'guilds', params.guildId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const g = parseGuildDoc((snap.data() ?? {}) as Record<string, unknown>, snap.id);
      if (!g.memberUids.includes(params.actorUid)) return;
      const role = g.members[params.actorUid]?.role ?? 'member';
      tx.update(ref, {
        chatMessages: [
          ...g.chatMessages.slice(-24),
          {
            id: `gc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            senderName: cleanTamer,
            role,
            text: cleanText,
            timestamp: nowTimeLabel(),
          },
        ],
        updatedAt: serverTimestamp(),
      });
    });
    return { ok: true };
  } catch {
    return { ok: false, error: 'Não foi possível enviar mensagem para a Guilda.' };
  }
}

/**
 * Contributes Guild EXP & Daily/General mob kill counts silently when a guild
 * member defeats wild Digimons or Raid Bosses. Handles automatic 23:59 -> 00:00
 * Brasília daily reset while preserving cumulative all-time kills forever.
 */
export async function contributeGuildExp(params: {
  guildId: string;
  actorUid: string;
  tamerName: string;
  tamerLevel: number;
  digimonFormId?: string;
  expGain: number;
  mobsKilled?: number;
}): Promise<{ leveledUp: boolean; newLevel?: number }> {
  const gain = Math.max(1, Math.round(params.expGain));
  const killsAdded = Math.max(0, Math.round(params.mobsKilled ?? 1));
  const todayKey = getServerDayKey();
  const yesterdayKey = getPreviousServerDayKey();

  const applyExp = (g: GuildRecord): { next: GuildRecord; leveledUp: boolean } => {
    let level = g.level;
    let exp = g.exp + gain;
    let skillPoints = g.skillPoints;
    let leveledUp = false;

    while (level < GUILD_MAX_LEVEL) {
      const needed = getGuildExpRequiredForLevel(level);
      if (exp < needed) break;
      exp -= needed;
      level += 1;
      skillPoints = Math.min(20, skillPoints + 1);
      leveledUp = true;
    }

    // Automatic 23:59 -> 00:00 Daily Rollover
    let dailyHuntDate = g.dailyHuntDate;
    let dailyKills = Math.max(0, Math.round(g.dailyKills ?? 0));
    let prevDayDate = g.prevDayDate ?? yesterdayKey;
    let prevDayKills = Math.max(0, Math.round(g.prevDayKills ?? 0));
    let totalKills = getEffectiveGuildTotalKills(g);

    const rolledOver = dailyHuntDate !== todayKey;
    if (rolledOver) {
      if (dailyHuntDate === yesterdayKey) {
        prevDayDate = yesterdayKey;
        prevDayKills = dailyKills;
      } else if (prevDayDate !== yesterdayKey) {
        prevDayDate = yesterdayKey;
        prevDayKills = 0;
      }
      dailyHuntDate = todayKey;
      dailyKills = 0;
    }

    dailyKills += killsAdded;
    totalKills += killsAdded;

    // Reset dailyKills on all members if day rolled over, NEVER reset totalKills
    const nextMembers: Record<string, GuildMemberRecord> = {};
    for (const [uid, m] of Object.entries(g.members)) {
      const memberDailyBefore =
        !rolledOver && m.dailyKillsDate === todayKey
          ? Math.max(0, Math.round(m.dailyKills ?? 0))
          : 0;
      const memberTotalBefore = Math.max(0, Math.round(m.totalKills ?? 0));

      if (uid === params.actorUid) {
        nextMembers[uid] = {
          ...m,
          tamerName: params.tamerName.trim().slice(0, 24) || m.tamerName,
          tamerLevel: Math.max(1, params.tamerLevel),
          contributionExp: m.contributionExp + gain,
          digimonFormId: params.digimonFormId || m.digimonFormId || 'agumon',
          dailyKills: memberDailyBefore + killsAdded,
          dailyKillsDate: todayKey,
          totalKills: memberTotalBefore + killsAdded,
        };
      } else {
        nextMembers[uid] = {
          ...m,
          dailyKills: memberDailyBefore,
          dailyKillsDate: todayKey,
          totalKills: memberTotalBefore,
        };
      }
    }

    return {
      leveledUp,
      next: {
        ...g,
        level,
        exp,
        skillPoints,
        members: nextMembers,
        dailyHuntDate,
        dailyKills,
        prevDayDate,
        prevDayKills,
        totalKills,
      },
    };
  };

  if (!isFirestoreReady()) {
    const map = readLocalGuilds();
    const g = map[params.guildId];
    if (!g) return { leveledUp: false };
    const { next, leveledUp } = applyExp(g);
    map[params.guildId] = next;
    writeLocalGuilds(map);
    return { leveledUp, newLevel: next.level };
  }

  const ref = doc(db, 'guilds', params.guildId);
  try {
    let leveledUp = false;
    let newLevel = 1;
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const g = parseGuildDoc((snap.data() ?? {}) as Record<string, unknown>, snap.id);
      if (!g.memberUids.includes(params.actorUid)) return;
      const res = applyExp(g);
      leveledUp = res.leveledUp;
      newLevel = res.next.level;
      tx.update(ref, {
        level: res.next.level,
        exp: res.next.exp,
        skillPoints: res.next.skillPoints,
        members: res.next.members,
        dailyHuntDate: res.next.dailyHuntDate,
        dailyKills: res.next.dailyKills,
        prevDayDate: res.next.prevDayDate,
        prevDayKills: res.next.prevDayKills,
        totalKills: res.next.totalKills,
        updatedAt: serverTimestamp(),
      });
    });
    return { leveledUp, newLevel };
  } catch {
    return { leveledUp: false };
  }
}
