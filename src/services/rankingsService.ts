import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import type { TamerId } from '../types/character';
import type { DigimonFormId } from '../types/digimon';
import type { HatchQualityGrade } from '../types/hud';
import {
  fetchRecruitingGuilds,
  getEffectiveGuildDailyKills,
  getEffectiveGuildTotalKills,
  getGuildMaxMembersForLevel,
  getServerDayKey,
  sanitizeGuildPhotoUrl,
  type GuildEmblemColor,
  type GuildRecord,
} from './guildService';
import type { RemoteWorldPlayer } from './worldPresenceService';
import { ensurePlayerDocBootstrapped } from './cloudSaveService';
import { isValidCoverPhotoDataUrl } from '../utils/avatarPhoto';

export interface PlayerRankingRecord {
  userId: string;
  tamerName: string;
  characterId: TamerId;
  tamerLevel: number;
  tamerExp: number;
  digimonFormId: DigimonFormId;
  digimonName: string;
  digimonLevel: number;
  digimonExp?: number;
  digimonCombatPower: number;
  hatchGrade: HatchQualityGrade;
  hatchSizePct: number;
  defeatedEnemiesTotal: number;
  guildName: string | null;
  isGm: boolean;
  tamerPhotoUrl?: string | null;
  tamerCoverUrl?: string | null;
}

export interface GuildRankingRecord {
  guildId: string;
  name: string;
  tag: string;
  emblemColor: GuildEmblemColor;
  emblemPhotoUrl?: string | null;
  masterName: string;
  level: number;
  exp: number;
  memberCount: number;
  maxMembers: number;
  totalKills: number;
  dailyKills: number;
  dailyHuntDate: string | null;
}

const VALID_TAMERS = new Set<TamerId>(['kai', 'ren', 'hina', 'yuna']);
const LOCAL_PLAYER_RANKS_KEY = 'dw_local_player_rankings_v1';
const LOCAL_GUILD_RANKS_KEY = 'dw_local_guild_rankings_v1';

function isFirestoreVerified(): boolean {
  const user = auth.currentUser;
  return Boolean(user && user.emailVerified);
}

function safeInt(raw: unknown, min: number, max: number, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function safeCharacterId(raw: unknown): TamerId {
  return VALID_TAMERS.has(raw as TamerId) ? (raw as TamerId) : 'kai';
}

function safeHatchGrade(raw: unknown): HatchQualityGrade {
  return raw === 5 ? 5 : raw === 4 ? 4 : 3;
}

function safeColor(raw: unknown): GuildEmblemColor {
  if (
    raw === 'amber' ||
    raw === 'crimson' ||
    raw === 'emerald' ||
    raw === 'violet'
  ) {
    return raw;
  }
  return 'cyan';
}

function readLocalMap<T>(key: string): Record<string, T> {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, T>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalMap<T>(key: string, map: Record<string, T>): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

export interface PlayerRankingBackup {
  tamerLevel: number;
  tamerExp: number;
  digimonLevel: number;
  digimonExp: number;
  digimonFormId: DigimonFormId | null;
  defeatedEnemiesTotal: number;
}

export async function fetchOwnPlayerRankingBackup(
  uid: string
): Promise<PlayerRankingBackup | null> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified || user.uid !== uid) return null;
  try {
    const snap = await getDoc(doc(db, 'playerRankings', uid));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    const tamerLevel = safeInt(data.tamerLevel, 1, 200, 1);
    const tamerExp = safeInt(data.tamerExp, 0, 100_000_000, 0);
    const digimonLevel = safeInt(data.digimonLevel, 1, 200, 1);
    const digimonExp = safeInt(data.digimonExp, 0, 100_000_000, 0);
    const defeatedEnemiesTotal = safeInt(data.defeatedEnemiesTotal, 0, 100_000_000, 0);
    if (tamerLevel <= 1 && digimonLevel <= 1 && defeatedEnemiesTotal === 0) {
      return null;
    }
    return {
      tamerLevel,
      tamerExp,
      digimonLevel,
      digimonExp,
      digimonFormId:
        typeof data.digimonFormId === 'string' && data.digimonFormId.length > 0
          ? (data.digimonFormId as DigimonFormId)
          : null,
      defeatedEnemiesTotal,
    };
  } catch {
    return null;
  }
}

export async function syncPlayerRankingSnapshot(
  entry: PlayerRankingRecord
): Promise<void> {
  const safeName = entry.tamerName.trim().slice(0, 24) || 'Tamer';
  const safeDigimonName = entry.digimonName.trim().slice(0, 32) || 'Digimon';
  const cleanPhoto = sanitizeGuildPhotoUrl(entry.tamerPhotoUrl ?? null);
  const cleanCover = isValidCoverPhotoDataUrl(entry.tamerCoverUrl)
    ? entry.tamerCoverUrl
    : null;
  const sanitized: PlayerRankingRecord = {
    userId: entry.userId,
    tamerName: safeName,
    characterId: safeCharacterId(entry.characterId),
    tamerLevel: safeInt(entry.tamerLevel, 1, 200, 1),
    tamerExp: safeInt(entry.tamerExp, 0, 100_000_000, 0),
    digimonFormId: entry.digimonFormId,
    digimonName: safeDigimonName,
    digimonLevel: safeInt(entry.digimonLevel, 1, 200, 1),
    digimonExp: safeInt(entry.digimonExp ?? 0, 0, 100_000_000, 0),
    digimonCombatPower: safeInt(entry.digimonCombatPower, 0, 10_000_000, 300),
    hatchGrade: safeHatchGrade(entry.hatchGrade),
    hatchSizePct: safeInt(entry.hatchSizePct, 80, 140, 100),
    defeatedEnemiesTotal: safeInt(entry.defeatedEnemiesTotal, 0, 100_000_000, 0),
    guildName:
      typeof entry.guildName === 'string' && entry.guildName.trim().length > 0
        ? entry.guildName.trim().slice(0, 32)
        : null,
    isGm: Boolean(entry.isGm),
    tamerPhotoUrl: cleanPhoto,
    tamerCoverUrl: cleanCover,
  };

  // Strip heavy base64 images before persisting local ranking cache so mobile localStorage never hits QuotaExceededError
  const localMap = readLocalMap<PlayerRankingRecord>(LOCAL_PLAYER_RANKS_KEY);
  const slimLocalEntry: PlayerRankingRecord = {
    ...sanitized,
    tamerPhotoUrl: null,
    tamerCoverUrl: null,
  };
  localMap[sanitized.userId] = slimLocalEntry;
  const localKeys = Object.keys(localMap);
  if (localKeys.length > 60) {
    const trimmedMap: Record<string, PlayerRankingRecord> = {};
    for (const k of localKeys.slice(-60)) {
      const item = localMap[k];
      if (item) {
        trimmedMap[k] = { ...item, tamerPhotoUrl: null, tamerCoverUrl: null };
      }
    }
    trimmedMap[sanitized.userId] = slimLocalEntry;
    writeLocalMap(LOCAL_PLAYER_RANKS_KEY, trimmedMap);
  } else {
    writeLocalMap(LOCAL_PLAYER_RANKS_KEY, localMap);
  }

  const user = auth.currentUser;
  if (!user || !user.emailVerified || sanitized.userId !== user.uid) return;

  const ready = await ensurePlayerDocBootstrapped(user);
  if (!ready) return;

  const path = `playerRankings/${user.uid}`;
  try {
    // Anti-regression guard: never overwrite an existing progressed playerRanking document with blank Lv.1 data
    if (
      sanitized.tamerLevel <= 1 &&
      sanitized.digimonLevel <= 1 &&
      sanitized.defeatedEnemiesTotal === 0
    ) {
      const existingSnap = await getDoc(doc(db, 'playerRankings', user.uid));
      if (existingSnap.exists()) {
        const existingData = existingSnap.data() as Record<string, unknown>;
        const existingTamerLv = safeInt(existingData.tamerLevel, 1, 200, 1);
        const existingDigiLv = safeInt(existingData.digimonLevel, 1, 200, 1);
        const existingKills = safeInt(existingData.defeatedEnemiesTotal, 0, 100_000_000, 0);
        if (existingTamerLv > 1 || existingDigiLv > 1 || existingKills > 0) {
          return;
        }
      }
    }

    await setDoc(doc(db, 'playerRankings', user.uid), {
      ownerUid: user.uid,
      tamerName: sanitized.tamerName,
      characterId: sanitized.characterId,
      tamerLevel: sanitized.tamerLevel,
      tamerExp: sanitized.tamerExp,
      digimonFormId: sanitized.digimonFormId,
      digimonName: sanitized.digimonName,
      digimonLevel: sanitized.digimonLevel,
      digimonExp: sanitized.digimonExp ?? 0,
      digimonCombatPower: sanitized.digimonCombatPower,
      digimonGrade: sanitized.hatchGrade,
      digimonSizePct: sanitized.hatchSizePct,
      defeatedEnemiesTotal: sanitized.defeatedEnemiesTotal,
      guildName: sanitized.guildName,
      isGm: sanitized.isGm,
      tamerPhotoUrl: sanitized.tamerPhotoUrl,
      tamerCoverUrl: sanitized.tamerCoverUrl,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Non-fatal background ranking sync
    }
  }
}

export async function syncGuildRankingSnapshot(guild: GuildRecord): Promise<void> {
  const todayKey = getServerDayKey();
  const clampedLevel = safeInt(guild.level, 1, 10, 1);
  const firestorePayload = {
    guildId: guild.guildId,
    name: guild.name.trim().slice(0, 24) || 'Guilda DATS',
    tag: guild.tag.trim().toUpperCase().slice(0, 4) || 'DATS',
    emblemColor: safeColor(guild.emblemColor),
    emblemPhotoUrl: sanitizeGuildPhotoUrl(guild.emblemPhotoUrl ?? null),
    masterName: guild.masterName.trim().slice(0, 24) || 'Mestre',
    level: clampedLevel,
    exp: safeInt(guild.exp, 0, 100_000_000, 0),
    memberCount: Math.max(1, Math.min(50, guild.memberUids.length)),
    totalKills: getEffectiveGuildTotalKills(guild),
    dailyKills: getEffectiveGuildDailyKills(guild, todayKey),
    dailyHuntDate: todayKey,
    recruiting: Boolean(guild.recruiting),
  };

  const localRecord: GuildRankingRecord = {
    ...firestorePayload,
    emblemPhotoUrl: null,
    maxMembers: getGuildMaxMembersForLevel(clampedLevel),
  };

  const localMap = readLocalMap<GuildRankingRecord>(LOCAL_GUILD_RANKS_KEY);
  localMap[localRecord.guildId] = localRecord;
  writeLocalMap(LOCAL_GUILD_RANKS_KEY, localMap);

  const user = auth.currentUser;
  if (!user || !user.emailVerified || !guild.memberUids.includes(user.uid)) return;

  const path = `guildRankings/${guild.guildId}`;
  try {
    await setDoc(doc(db, 'guildRankings', guild.guildId), {
      ...firestorePayload,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Non-fatal background ranking sync
    }
  }
}

export async function removeGuildRankingSnapshot(guildId: string): Promise<void> {
  const localMap = readLocalMap<GuildRankingRecord>(LOCAL_GUILD_RANKS_KEY);
  delete localMap[guildId];
  writeLocalMap(LOCAL_GUILD_RANKS_KEY, localMap);

  if (!isFirestoreVerified()) return;
  const path = `guildRankings/${guildId}`;
  try {
    await deleteDoc(doc(db, 'guildRankings', guildId));
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, path);
    } catch {
      // Non-fatal cleanup
    }
  }
}

export async function fetchServerRankings(params?: {
  currentSelfPlayer?: PlayerRankingRecord;
  currentPlayerGuild?: GuildRecord | null;
  remotePlayers?: readonly RemoteWorldPlayer[];
}): Promise<{
  players: PlayerRankingRecord[];
  guilds: GuildRankingRecord[];
}> {
  const todayKey = getServerDayKey();
  const playerMap = new Map<string, PlayerRankingRecord>();
  const guildMap = new Map<string, GuildRankingRecord>();

  // 1. Seed from local cache
  const localPlayers = readLocalMap<PlayerRankingRecord>(LOCAL_PLAYER_RANKS_KEY);
  for (const p of Object.values(localPlayers)) {
    if (p && p.userId) playerMap.set(p.userId, p);
  }
  const localGuilds = readLocalMap<GuildRankingRecord>(LOCAL_GUILD_RANKS_KEY);
  for (const g of Object.values(localGuilds)) {
    if (g && g.guildId) {
      guildMap.set(g.guildId, {
        ...g,
        dailyKills: g.dailyHuntDate === todayKey ? g.dailyKills : 0,
      });
    }
  }

  // 2. Fetch Firestore public leaderboards when verified
  if (isFirestoreVerified()) {
    try {
      const pq = query(
        collection(db, 'playerRankings'),
        where('tamerLevel', '>=', 1),
        orderBy('tamerLevel', 'desc'),
        limit(100)
      );
      const pSnap = await getDocs(pq);
      pSnap.forEach((d) => {
        const raw = (d.data() ?? {}) as Record<string, unknown>;
        const userId = String(raw.ownerUid ?? raw.userId ?? d.id);
        playerMap.set(userId, {
          userId,
          tamerName: String(raw.tamerName ?? 'Tamer').slice(0, 24),
          characterId: safeCharacterId(raw.characterId),
          tamerLevel: safeInt(raw.tamerLevel, 1, 200, 1),
          tamerExp: safeInt(raw.tamerExp, 0, 100_000_000, 0),
          digimonFormId: String(raw.digimonFormId ?? 'agumon') as DigimonFormId,
          digimonName: String(raw.digimonName ?? 'Agumon').slice(0, 32),
          digimonLevel: safeInt(raw.digimonLevel, 1, 200, 1),
          digimonExp: safeInt(raw.digimonExp ?? 0, 0, 100_000_000, 0),
          digimonCombatPower: safeInt(raw.digimonCombatPower, 0, 10_000_000, 300),
          hatchGrade: safeHatchGrade(raw.digimonGrade ?? raw.hatchGrade),
          hatchSizePct: safeInt(raw.digimonSizePct ?? raw.hatchSizePct, 80, 140, 100),
          defeatedEnemiesTotal: safeInt(raw.defeatedEnemiesTotal, 0, 100_000_000, 0),
          guildName:
            typeof raw.guildName === 'string' && raw.guildName.trim().length > 0
              ? raw.guildName.trim().slice(0, 32)
              : null,
          isGm: Boolean(raw.isGm),
          tamerPhotoUrl: sanitizeGuildPhotoUrl(raw.tamerPhotoUrl),
          tamerCoverUrl: isValidCoverPhotoDataUrl(raw.tamerCoverUrl)
            ? raw.tamerCoverUrl
            : null,
        });
      });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, 'playerRankings');
      } catch {
        // Fallback to local/presence entries
      }
    }

    try {
      const gq = query(
        collection(db, 'guildRankings'),
        where('level', '>=', 1),
        orderBy('level', 'desc'),
        limit(100)
      );
      const gSnap = await getDocs(gq);
      gSnap.forEach((d) => {
        const raw = (d.data() ?? {}) as Record<string, unknown>;
        const guildId = String(raw.guildId ?? d.id);
        const dailyHuntDate =
          typeof raw.dailyHuntDate === 'string' ? raw.dailyHuntDate : null;
        const parsedLevel = safeInt(raw.level, 1, 10, 1);
        guildMap.set(guildId, {
          guildId,
          name: String(raw.name ?? 'Guilda DATS').slice(0, 24),
          tag: String(raw.tag ?? 'DATS').toUpperCase().slice(0, 4),
          emblemColor: safeColor(raw.emblemColor),
          emblemPhotoUrl: sanitizeGuildPhotoUrl(raw.emblemPhotoUrl),
          masterName: String(raw.masterName ?? 'Mestre').slice(0, 24),
          level: parsedLevel,
          exp: safeInt(raw.exp, 0, 100_000_000, 0),
          memberCount: safeInt(raw.memberCount, 1, 50, 1),
          maxMembers: getGuildMaxMembersForLevel(parsedLevel),
          totalKills: safeInt(raw.totalKills, 0, 100_000_000, 0),
          dailyKills:
            dailyHuntDate === todayKey ? safeInt(raw.dailyKills, 0, 100_000_000, 0) : 0,
          dailyHuntDate,
        });
      });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, 'guildRankings');
      } catch {
        // Fallback to recruiting guilds
      }
    }
  }

  // 3. Merge recruiting guilds so newly created guilds appear right away
  try {
    const recruitingGuilds = await fetchRecruitingGuilds();
    for (const g of recruitingGuilds) {
      if (!guildMap.has(g.guildId)) {
        guildMap.set(g.guildId, {
          guildId: g.guildId,
          name: g.name,
          tag: g.tag,
          emblemColor: g.emblemColor,
          emblemPhotoUrl: g.emblemPhotoUrl ?? null,
          masterName: g.masterName,
          level: g.level,
          exp: g.exp,
          memberCount: g.memberUids.length,
          maxMembers: getGuildMaxMembersForLevel(g.level),
          totalKills: getEffectiveGuildTotalKills(g),
          dailyKills: getEffectiveGuildDailyKills(g, todayKey),
          dailyHuntDate: todayKey,
        });
      }
    }
  } catch {
    // Ignore optional guild fallback
  }

  // 4. Merge any currently online players who haven't written a playerRankings doc yet
  for (const rp of params?.remotePlayers ?? []) {
    if (!playerMap.has(rp.uid)) {
      playerMap.set(rp.uid, {
        userId: rp.uid,
        tamerName: rp.tamerName,
        characterId: rp.characterId,
        tamerLevel: rp.tamerLevel,
        tamerExp: 0,
        digimonFormId: rp.digimonFormId,
        digimonName: rp.digimonFormId,
        digimonLevel: rp.digimonLevel,
        digimonCombatPower: 280 + (rp.digimonLevel - 1) * 45,
        hatchGrade: 3,
        hatchSizePct: 100,
        defeatedEnemiesTotal: 0,
        guildName: rp.guildName,
        isGm: rp.isGm,
        tamerPhotoUrl: null,
        tamerCoverUrl: null,
      });
    }
  }

  // 5. Overlay latest live self & self-guild snapshots so player sees instant updates
  if (params?.currentSelfPlayer) {
    playerMap.set(params.currentSelfPlayer.userId, params.currentSelfPlayer);
  }
  if (params?.currentPlayerGuild) {
    const g = params.currentPlayerGuild;
    guildMap.set(g.guildId, {
      guildId: g.guildId,
      name: g.name,
      tag: g.tag,
      emblemColor: g.emblemColor,
      emblemPhotoUrl: g.emblemPhotoUrl ?? null,
      masterName: g.masterName,
      level: g.level,
      exp: g.exp,
      memberCount: g.memberUids.length,
      maxMembers: getGuildMaxMembersForLevel(g.level),
      totalKills: getEffectiveGuildTotalKills(g),
      dailyKills: getEffectiveGuildDailyKills(g, todayKey),
      dailyHuntDate: todayKey,
    });
  }

  return {
    players: Array.from(playerMap.values()),
    guilds: Array.from(guildMap.values()),
  };
}
