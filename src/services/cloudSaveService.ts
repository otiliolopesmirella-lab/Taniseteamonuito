import type { User } from 'firebase/auth';
import {
  deleteField,
  doc,
  getDoc,
  getDocFromServer,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { getTamerSprites } from '../sprites/tamerSprites';
import type { SavedCharacterSelection, TamerId } from '../types/character';
import type { SavedStarterDigimon, StarterDigimonElement, StarterDigimonId } from '../types/digimon';
import type { AccountHudPersistence, EquipmentSlotId, InventoryItem } from '../types/hud';
import {
  isValidAvatarPhotoDataUrl,
  isValidCoverPhotoDataUrl,
} from '../utils/avatarPhoto';
import { isRemovedLegacyItemKey } from '../data/itemsCatalog';

export interface CloudTamerSelection {
  characterId: TamerId;
  tamerName: string;
  updatedAt: string;
}

export interface CloudStarterDigimon {
  digimonId: StarterDigimonId;
  digimonName: string;
  element: StarterDigimonElement;
  chosenAt: string;
}

export interface CloudAdventureProgress {
  mapId: 'dats-center' | 'hunting-plains' | 'data-forest' | 'digi-mountain' | 'digital-desert' | 'data-sea' | 'digimon-island' | 'dark-area' | 'virtual-world';
  worldX: number;
  worldY: number;
  facingDir: 'N' | 'S' | 'E' | 'W';
  stepsCount: number;
  discoveredZones: string[];
  updatedAt: string;
}

export interface CloudHudState {
  tamer: {
    level: number;
    exp: number;
    expToNext: number;
    hp: number;
    maxHp: number;
    ds: number;
    maxDs: number;
  };
  digimon: {
    level: number;
    exp: number;
    expToNext: number;
    hp: number;
    maxHp: number;
    ds: number;
    maxDs: number;
    activeFormId?: string;
    unlockedFormIds?: string[];
  };
  bits: number;
  dCoin: number;
  inventory: InventoryItem[];
  equippedItems: Partial<Record<EquipmentSlotId, InventoryItem>>;
  guildName: string | null;
  tamerPhotoUrl?: string | null;
  tamerCoverUrl?: string | null;
  xpBoostUntilMs?: number | null;
  autoFarmVipUnlocked?: boolean;
  defeatedEnemiesTotal: number;
  updatedAt: string;
}

export interface PlayerCloudSnapshot {
  ownerUid: string;
  username: string;
  usernameLower: string;
  tamerSelection: CloudTamerSelection | null;
  starterDigimon: CloudStarterDigimon | null;
  adventureProgress: CloudAdventureProgress | null;
  hudState: CloudHudState | null;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

/**
 * Ensures any player handle strictly satisfies firebase-blueprint.json:
 * length 3..24, pattern ^[a-zA-Z0-9._-]+$
 */
export function sanitizePlayerUsername(raw: string, fallbackUid?: string): string {
  const cleaned = raw
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 24);
  if (cleaned.length >= 3 && USERNAME_PATTERN.test(cleaned)) {
    return cleaned;
  }
  const suffix = (fallbackUid ?? 'tamer').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || '001';
  return `Tamer_${suffix}`.slice(0, 24);
}

function getVerifiedCurrentUser(): User | null {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return null;
  return user;
}

const utf8Encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

function utf8ByteLength(value: string): number {
  if (!utf8Encoder) return value.length;
  return utf8Encoder.encode(value).length;
}

function clampUtf8Bytes(value: string, maxBytes: number): string {
  if (utf8ByteLength(value) <= maxBytes) return value;
  let end = value.length;
  while (end > 0 && utf8ByteLength(value.slice(0, end)) > maxBytes) {
    end -= 1;
  }
  return value.slice(0, end);
}

function clampIso(value?: unknown): string {
  const iso = (
    typeof value === 'string' && value.length >= 10
      ? value
      : new Date().toISOString()
  ).slice(0, 40);
  return iso;
}

function stripUndefined<T>(obj: T): T {
  if (typeof obj === 'number') {
    return (Number.isFinite(obj) ? obj : 0) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => stripUndefined(item)) as unknown as T;
  }
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return obj;
}

function safeInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
}

function safeCoord(value: unknown, max: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(max, Math.round(num * 10) / 10));
}

function safeCardinalDir(value: unknown): 'N' | 'S' | 'E' | 'W' {
  const raw = String(value ?? 'S').toUpperCase();
  if (raw === 'N' || raw === 'NE' || raw === 'NW') return 'N';
  if (raw === 'E') return 'E';
  if (raw === 'W') return 'W';
  return 'S';
}

function sanitizeTamerSelectionForCloud(
  raw: unknown
): CloudTamerSelection | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const rawChar = String(obj.characterId ?? '');
  const characterId: TamerId =
    rawChar === 'kai' || rawChar === 'ren' || rawChar === 'hina' || rawChar === 'yuna'
      ? rawChar
      : 'kai';
  const rawName = typeof obj.tamerName === 'string' ? obj.tamerName : '';
  const trimmedName = clampUtf8Bytes(rawName.trim(), 24);
  const safeTamerName =
    utf8ByteLength(rawName) >= 1 && utf8ByteLength(rawName) <= 24
      ? rawName
      : trimmedName || 'Tamer';
  return {
    characterId,
    tamerName: safeTamerName,
    updatedAt: clampIso(obj.updatedAt),
  };
}

function sanitizeStarterDigimonForCloud(
  raw: unknown
): CloudStarterDigimon | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const rawId = String(obj.digimonId ?? '');
  if (
    rawId !== 'agumon' &&
    rawId !== 'agumon_classic' &&
    rawId !== 'gabumon' &&
    rawId !== 'impmon' &&
    rawId !== 'veemon' &&
    rawId !== 'keramon' &&
    rawId !== 'gaomon' &&
    rawId !== 'lalamon' &&
    rawId !== 'guilmon' &&
    rawId !== 'demimeramon' &&
    rawId !== 'hawkmon' &&
    rawId !== 'tentomon' &&
    rawId !== 'drimogemon' &&
    rawId !== 'kiwimon' &&
    rawId !== 'gotsumon' &&
    rawId !== 'elecmon' &&
    rawId !== 'renamon' &&
    rawId !== 'monodramon' &&
    rawId !== 'biyomon' &&
    rawId !== 'kunemon'
  ) {
    return null;
  }
  const digimonId: StarterDigimonId = rawId;
  const defaultElementByStarter: Record<StarterDigimonId, StarterDigimonElement> = {
    agumon: 'Fogo',
    agumon_classic: 'Fogo',
    gabumon: 'Gelo',
    impmon: 'Trevas',
    veemon: 'Velocidade',
    keramon: 'Trevas',
    gaomon: 'Velocidade',
    lalamon: 'Natureza',
    guilmon: 'Fogo',
    demimeramon: 'Fogo',
    hawkmon: 'Velocidade',
    tentomon: 'Velocidade',
    drimogemon: 'Fogo',
    kiwimon: 'Natureza',
    gotsumon: 'Gelo',
    elecmon: 'Velocidade',
    renamon: 'Velocidade',
    monodramon: 'Fogo',
    biyomon: 'Velocidade',
    kunemon: 'Velocidade',
  };
  const rawEl = String(obj.element ?? '');
  const element: StarterDigimonElement =
    rawEl === 'Fogo' ||
    rawEl === 'Gelo' ||
    rawEl === 'Trevas' ||
    rawEl === 'Velocidade' ||
    rawEl === 'Natureza'
      ? rawEl
      : defaultElementByStarter[digimonId];
  const rawName = clampUtf8Bytes(String(obj.digimonName ?? '').trim(), 32);
  return {
    digimonId,
    digimonName: rawName.length >= 1 ? rawName : digimonId,
    element,
    chosenAt: clampIso(typeof obj.chosenAt === 'string' ? obj.chosenAt : undefined),
  };
}

function sanitizeHudStateForCloud(state: AccountHudPersistence): CloudHudState {
  const cleanInventory = (Array.isArray(state.inventory) ? state.inventory : [])
    .filter(
      (item): item is InventoryItem =>
        Boolean(
          item &&
            typeof item === 'object' &&
            !Array.isArray(item) &&
            !isRemovedLegacyItemKey(item.itemKey)
        )
    )
    .slice(0, 48)
    .map((item) => stripUndefined(item));

  const cleanEquipped: Partial<Record<EquipmentSlotId, InventoryItem>> = {};
  const entries = Object.entries(state.equippedItems ?? {}).slice(0, 16);
  for (const [slot, item] of entries) {
    if (
      item &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      !isRemovedLegacyItemKey(item.itemKey) &&
      item.category !== 'equip'
    ) {
      cleanEquipped[slot as EquipmentSlotId] = stripUndefined(item);
    }
  }

  const digimonPayload: CloudHudState['digimon'] = {
    level: safeInt(state.digimon?.level, 1, 200, 1),
    exp: safeInt(state.digimon?.exp, 0, 100000000, 0),
    expToNext: safeInt(state.digimon?.expToNext, 1, 100000000, 100),
    hp: safeInt(state.digimon?.hp, 0, 1000000, 100),
    maxHp: safeInt(state.digimon?.maxHp, 1, 1000000, 100),
    ds: safeInt(state.digimon?.ds, 0, 1000000, 50),
    maxDs: safeInt(state.digimon?.maxDs, 1, 1000000, 50),
  };
  if (
    typeof state.digimon?.activeFormId === 'string' &&
    state.digimon.activeFormId.trim().length >= 1
  ) {
    digimonPayload.activeFormId = clampUtf8Bytes(state.digimon.activeFormId.trim(), 32);
  }
  if (Array.isArray(state.digimon?.unlockedFormIds)) {
    digimonPayload.unlockedFormIds = state.digimon.unlockedFormIds
      .filter((id) => typeof id === 'string' && id.trim().length > 0)
      .slice(0, 24)
      .map((id) => clampUtf8Bytes(String(id).trim(), 32))
      .filter((id) => id.length > 0);
  }

  const hudPayload: CloudHudState = {
    tamer: {
      level: safeInt(state.tamer?.level, 1, 200, 1),
      exp: safeInt(state.tamer?.exp, 0, 100000000, 0),
      expToNext: safeInt(state.tamer?.expToNext, 1, 100000000, 100),
      hp: safeInt(state.tamer?.hp, 0, 1000000, 100),
      maxHp: safeInt(state.tamer?.maxHp, 1, 1000000, 100),
      ds: safeInt(state.tamer?.ds, 0, 1000000, 50),
      maxDs: safeInt(state.tamer?.maxDs, 1, 1000000, 50),
    },
    digimon: digimonPayload,
    bits: safeInt(state.bits, 0, 1000000000, 0),
    dCoin: safeInt(state.dCoin, 0, 1000000000, 0),
    inventory: cleanInventory,
    equippedItems: cleanEquipped,
    guildName:
      typeof state.guildName === 'string' && state.guildName.trim().length > 0
        ? clampUtf8Bytes(state.guildName.trim(), 32)
        : null,
    defeatedEnemiesTotal: safeInt(state.defeatedEnemiesTotal, 0, 100000000, 0),
    updatedAt: clampIso(state.updatedAt),
  };

  if (isValidAvatarPhotoDataUrl(state.tamerPhotoUrl)) {
    hudPayload.tamerPhotoUrl = state.tamerPhotoUrl;
  }
  if (isValidCoverPhotoDataUrl(state.tamerCoverUrl)) {
    hudPayload.tamerCoverUrl = state.tamerCoverUrl;
  }
  if (
    typeof state.xpBoostUntilMs === 'number' &&
    Number.isFinite(state.xpBoostUntilMs) &&
    state.xpBoostUntilMs > 0
  ) {
    hudPayload.xpBoostUntilMs = Math.min(
      4000000000000,
      Math.round(state.xpBoostUntilMs)
    );
  }
  if (state.autoFarmVipUnlocked === true) {
    hudPayload.autoFarmVipUnlocked = true;
  }

  return hudPayload;
}

function sanitizeAdventureForCloud(progress: {
  mapId?: 'dats-center' | 'hunting-plains' | 'data-forest' | 'digi-mountain' | 'digital-desert' | 'data-sea' | 'digimon-island' | 'dark-area' | 'virtual-world';
  worldX: number;
  worldY: number;
  facingDir: 'N' | 'S' | 'E' | 'W';
  stepsCount: number;
  discoveredZones: string[];
  updatedAt?: string;
}): CloudAdventureProgress {
  const mapId =
    progress.mapId === 'hunting-plains'
      ? 'hunting-plains'
      : progress.mapId === 'data-forest'
        ? 'data-forest'
        : progress.mapId === 'digi-mountain'
          ? 'digi-mountain'
          : progress.mapId === 'digital-desert'
            ? 'digital-desert'
            : progress.mapId === 'data-sea'
              ? 'data-sea'
              : progress.mapId === 'digimon-island'
                ? 'digimon-island'
                : progress.mapId === 'dark-area'
                  ? 'dark-area'
                  : progress.mapId === 'virtual-world'
                    ? 'virtual-world'
                    : 'dats-center';
  return {
    mapId,
    worldX: safeCoord(progress.worldX, 20000),
    worldY: safeCoord(progress.worldY, 20000),
    facingDir: safeCardinalDir(progress.facingDir),
    stepsCount: safeInt(progress.stepsCount, 0, 100000000, 0),
    discoveredZones: (Array.isArray(progress.discoveredZones)
      ? progress.discoveredZones
      : []
    )
      .filter((z): z is string => typeof z === 'string' && z.trim().length > 0)
      .slice(0, 40)
      .map((z) => z.slice(0, 64)),
    updatedAt: clampIso(progress.updatedAt),
  };
}

const ALLOWED_PLAYER_TOP_LEVEL_KEYS = new Set([
  'ownerUid',
  'username',
  'usernameLower',
  'tamerSelection',
  'starterDigimon',
  'adventureProgress',
  'hudState',
  'createdAt',
  'updatedAt',
]);

const inFlightBootstrapByUid = new Map<string, Promise<PlayerCloudSnapshot>>();
const bootstrappedUids = new Set<string>();
const writeQueueByUid = new Map<string, Promise<void>>();

function enqueuePlayerWrite<T>(uid: string, task: () => Promise<T>): Promise<T> {
  const previous = writeQueueByUid.get(uid) ?? Promise.resolve();
  const next = previous.then(task, task);
  const tracked = next.then(
    () => undefined,
    () => undefined
  );
  writeQueueByUid.set(uid, tracked);
  void tracked.finally(() => {
    if (writeQueueByUid.get(uid) === tracked) {
      writeQueueByUid.delete(uid);
    }
  });
  return next;
}

async function getAuthoritativePlayerSnap(userId: string) {
  const playerRef = doc(db, 'players', userId);
  try {
    return await getDocFromServer(playerRef);
  } catch (err) {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    if (msg.includes('offline') || msg.includes('unavailable')) {
      return getDoc(playerRef);
    }
    throw err;
  }
}

export function clearCloudSaveSessionCache(): void {
  bootstrappedUids.clear();
  inFlightBootstrapByUid.clear();
  writeQueueByUid.clear();
}

function snapshotFromPlayerDoc(
  uid: string,
  data: Partial<PlayerCloudSnapshot>
): PlayerCloudSnapshot {
  const username = sanitizePlayerUsername(data.username ?? '', uid);
  return {
    ownerUid: data.ownerUid ?? uid,
    username,
    usernameLower: data.usernameLower ?? username.toLowerCase(),
    tamerSelection: data.tamerSelection ?? null,
    starterDigimon: data.starterDigimon ?? null,
    adventureProgress: data.adventureProgress ?? null,
    hudState: data.hudState ?? null,
  };
}

async function runBootstrapPlayerCloudProfile(
  user: User,
  preferredUsername?: string,
  authProvider: 'password' | 'google' = 'password'
): Promise<PlayerCloudSnapshot> {
  const playerPath = `players/${user.uid}`;
  const playerRef = doc(db, 'players', user.uid);

  let snap;
  try {
    snap = await getAuthoritativePlayerSnap(user.uid);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, playerPath);
  }

  if (snap.exists()) {
    bootstrappedUids.add(user.uid);
    return snapshotFromPlayerDoc(user.uid, snap.data() as PlayerCloudSnapshot);
  }

  // First-time verified sign-in: pick an unclaimed username cleanly
  const emailPrefix = user.email ? user.email.split('@')[0] : '';
  let candidate = sanitizePlayerUsername(
    preferredUsername || user.displayName || emailPrefix,
    user.uid
  );
  let candidateLower = candidate.toLowerCase();
  let shouldClaimUsername = true;

  try {
    const claimSnap = await getDoc(doc(db, 'usernames', candidateLower));
    if (claimSnap.exists()) {
      if (claimSnap.data()?.ownerUid === user.uid) {
        // Already claimed by this user; do not attempt to update immutable /usernames doc
        shouldClaimUsername = false;
      } else {
        const uidSuffix = user.uid
          .replace(/[^a-zA-Z0-9]/g, '')
          .slice(0, 4)
          .toLowerCase();
        candidate = `${candidate.slice(0, 19)}_${uidSuffix}`;
        candidateLower = candidate.toLowerCase();
        const retrySnap = await getDoc(doc(db, 'usernames', candidateLower));
        if (retrySnap.exists() && retrySnap.data()?.ownerUid === user.uid) {
          shouldClaimUsername = false;
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `usernames/${candidateLower}`);
  }

  const privateRef = doc(db, 'players', user.uid, 'private', 'account');

  const batch = writeBatch(db);
  const ts = serverTimestamp();

  batch.set(playerRef, {
    ownerUid: user.uid,
    username: candidate,
    usernameLower: candidateLower,
    tamerSelection: null,
    starterDigimon: null,
    adventureProgress: null,
    hudState: null,
    createdAt: ts,
    updatedAt: ts,
  });

  batch.set(privateRef, {
    ownerUid: user.uid,
    email: (user.email ?? `${candidateLower}@verified.local`).slice(0, 254),
    authProvider,
    createdAt: ts,
    updatedAt: ts,
  });

  if (shouldClaimUsername) {
    batch.set(doc(db, 'usernames', candidateLower), {
      ownerUid: user.uid,
      username: candidate,
      createdAt: ts,
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    // Recover gracefully if a concurrent tab or listener created the player profile milliseconds earlier
    try {
      const recoverySnap = await getDoc(playerRef);
      if (recoverySnap.exists()) {
        bootstrappedUids.add(user.uid);
        return snapshotFromPlayerDoc(
          user.uid,
          recoverySnap.data() as PlayerCloudSnapshot
        );
      }
    } catch {
      // Fall through to structured error handler below
    }
    handleFirestoreError(error, OperationType.CREATE, playerPath);
  }

  bootstrappedUids.add(user.uid);

  return {
    ownerUid: user.uid,
    username: candidate,
    usernameLower: candidateLower,
    tamerSelection: null,
    starterDigimon: null,
    adventureProgress: null,
    hudState: null,
  };
}

/**
 * Loads the player's cloud profile from `/players/{uid}`, or atomically creates
 * `/players/{uid}`, `/players/{uid}/private/account`, and `/usernames/{usernameLower}`
 * if this is their first verified sign-in. Concurrent callers for the same UID
 * share a single in-flight promise so duplicate creates never race.
 */
export async function bootstrapPlayerCloudProfile(
  user: User,
  preferredUsername?: string,
  authProvider: 'password' | 'google' = 'password'
): Promise<PlayerCloudSnapshot> {
  const existingPromise = inFlightBootstrapByUid.get(user.uid);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = runBootstrapPlayerCloudProfile(
    user,
    preferredUsername,
    authProvider
  ).finally(() => {
    inFlightBootstrapByUid.delete(user.uid);
  });

  inFlightBootstrapByUid.set(user.uid, promise);
  return promise;
}

export async function ensurePlayerDocBootstrapped(user: User): Promise<boolean> {
  if (!user.emailVerified) return false;
  if (bootstrappedUids.has(user.uid)) return true;
  try {
    await bootstrapPlayerCloudProfile(
      user,
      user.displayName || undefined,
      'password'
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Hydrates the fast localStorage keys from the authoritative Firestore cloud save
 * so all game screens and TamerWorldCanvas immediately reflect the player's cloud state.
 */
export function hydrateLocalCacheFromCloud(
  accountUsername: string,
  cloud: PlayerCloudSnapshot
): void {
  const cleanKey = accountUsername.trim().toLowerCase();
  if (!cleanKey) return;

  try {
    if (cloud.tamerSelection) {
      const sprites = getTamerSprites(cloud.tamerSelection.characterId);
      const savedChar: SavedCharacterSelection = {
        accountUsername,
        characterId: cloud.tamerSelection.characterId,
        tamerName: cloud.tamerSelection.tamerName,
        spritesheetMeta: {
          frameWidth: sprites.frameWidth,
          frameHeight: sprites.frameHeight,
          columns: sprites.columns,
          rows: sprites.rows,
          directions: sprites.directions,
        },
        updatedAt: cloud.tamerSelection.updatedAt,
      };
      window.localStorage.setItem(
        `dw_digital_war_tamer_${cleanKey}`,
        JSON.stringify(savedChar)
      );
    } else {
      window.localStorage.removeItem(`dw_digital_war_tamer_${cleanKey}`);
    }

    if (cloud.starterDigimon) {
      const savedStarter: SavedStarterDigimon = {
        accountUsername,
        digimonId: cloud.starterDigimon.digimonId,
        digimonName: cloud.starterDigimon.digimonName,
        element: cloud.starterDigimon.element,
        chosenAt: cloud.starterDigimon.chosenAt,
      };
      window.localStorage.setItem(
        `dw_digital_war_starter_${cleanKey}`,
        JSON.stringify(savedStarter)
      );
    } else {
      window.localStorage.removeItem(`dw_digital_war_starter_${cleanKey}`);
    }

    if (cloud.adventureProgress) {
      window.localStorage.setItem(
        `dw_digital_war_progress_${cleanKey}`,
        JSON.stringify({
          accountUsername,
          characterId: cloud.tamerSelection?.characterId ?? 'kai',
          tamerName: cloud.tamerSelection?.tamerName ?? accountUsername,
          ...cloud.adventureProgress,
        })
      );
    } else {
      window.localStorage.removeItem(`dw_digital_war_progress_${cleanKey}`);
    }

    if (cloud.hudState) {
      window.localStorage.setItem(
        `dw_digital_war_hud_v1_${cleanKey}`,
        JSON.stringify({
          accountUsername,
          ...cloud.hudState,
        })
      );
    } else {
      window.localStorage.removeItem(`dw_digital_war_hud_v1_${cleanKey}`);
    }
  } catch {
    // Ignore private browsing localStorage quota errors gracefully
  }
}

interface PlayerPatchOverrides {
  tamerSelection?: CloudTamerSelection;
  starterDigimon?: CloudStarterDigimon;
  adventureProgress?: CloudAdventureProgress;
  hudState?: CloudHudState;
  syncDCoin?: boolean;
}

function isFirestoreTimestampLike(value: unknown): value is Timestamp {
  if (value instanceof Timestamp) return true;
  if (!value || typeof value !== 'object') return false;
  const candidate = value as {
    seconds?: unknown;
    nanoseconds?: unknown;
    toMillis?: unknown;
  };
  return (
    typeof candidate.seconds === 'number' &&
    typeof candidate.nanoseconds === 'number' &&
    typeof candidate.toMillis === 'function'
  );
}

function diagnosePlayerSaveMismatch(
  raw: Record<string, unknown> | null,
  normalized: Record<string, unknown>,
  uid: string
): string {
  const issues: string[] = [];
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) issues.push('uid');
  if (normalized.ownerUid !== uid) issues.push('norm.ownerUid');

  const uname = String(normalized.username ?? '');
  const ulower = String(normalized.usernameLower ?? '');
  if (!/^[a-zA-Z0-9._-]{3,24}$/.test(uname)) issues.push(`uname(${uname.length})`);
  if (!/^[a-z0-9._-]{3,24}$/.test(ulower) || uname.toLowerCase() !== ulower) {
    issues.push('ulower');
  }

  const tam = normalized.tamerSelection as CloudTamerSelection | null;
  if (tam !== null) {
    if (!['kai', 'ren', 'hina', 'yuna'].includes(tam.characterId)) issues.push('tam.char');
    if (typeof tam.tamerName !== 'string' || utf8ByteLength(tam.tamerName) < 1 || utf8ByteLength(tam.tamerName) > 24) {
      issues.push('tam.name');
    }
    if (typeof tam.updatedAt !== 'string' || tam.updatedAt.length < 10 || tam.updatedAt.length > 40) {
      issues.push('tam.upd');
    }
  }

  const st = normalized.starterDigimon as CloudStarterDigimon | null;
  if (st !== null) {
    if (![
      'agumon', 'agumon_classic', 'gabumon', 'impmon', 'veemon', 'keramon',
      'gaomon', 'lalamon', 'guilmon', 'demimeramon', 'hawkmon', 'tentomon',
      'drimogemon', 'kiwimon', 'gotsumon', 'elecmon', 'renamon', 'monodramon',
      'biyomon', 'kunemon',
    ].includes(st.digimonId)) {
      issues.push(`st.id(${String(st.digimonId)})`);
    }
    if (typeof st.digimonName !== 'string' || utf8ByteLength(st.digimonName) < 1 || utf8ByteLength(st.digimonName) > 32) {
      issues.push('st.name');
    }
    if (!['Fogo', 'Velocidade', 'Natureza', 'Gelo', 'Trevas'].includes(st.element)) {
      issues.push(`st.el(${String(st.element)})`);
    }
    if (typeof st.chosenAt !== 'string' || st.chosenAt.length < 10 || st.chosenAt.length > 40) {
      issues.push('st.at');
    }
  }

  const adv = normalized.adventureProgress as CloudAdventureProgress | null;
  if (adv) {
    if (!['dats-center', 'hunting-plains', 'data-forest', 'digi-mountain', 'digital-desert', 'data-sea', 'digimon-island', 'dark-area', 'virtual-world'].includes(adv.mapId)) {
      issues.push(`adv.map(${String(adv.mapId)})`);
    }
    if (!Number.isFinite(adv.worldX) || adv.worldX < 0 || adv.worldX > 20000) issues.push('adv.x');
    if (!Number.isFinite(adv.worldY) || adv.worldY < 0 || adv.worldY > 20000) issues.push('adv.y');
    if (!['N', 'S', 'E', 'W'].includes(adv.facingDir)) issues.push('adv.dir');
    if (!Number.isFinite(adv.stepsCount) || adv.stepsCount < 0 || adv.stepsCount > 100000000) issues.push('adv.steps');
    if (!Array.isArray(adv.discoveredZones) || adv.discoveredZones.length > 40) issues.push('adv.zones');
    else if (adv.discoveredZones.length > 0 && typeof adv.discoveredZones[0] !== 'string') issues.push('adv.zone0');
    if (adv.updatedAt.length < 10 || adv.updatedAt.length > 40) issues.push('adv.upd');
  }

  const hud = normalized.hudState as CloudHudState | null;
  if (hud) {
    const allowedHudKeys = new Set([
      'tamer', 'digimon', 'bits', 'dCoin', 'inventory', 'equippedItems',
      'guildName', 'tamerPhotoUrl', 'tamerCoverUrl', 'xpBoostUntilMs',
      'autoFarmVipUnlocked', 'defeatedEnemiesTotal', 'updatedAt',
    ]);
    const extraHudKeys = Object.keys(hud).filter((k) => !allowedHudKeys.has(k));
    if (extraHudKeys.length > 0) issues.push(`hud.extra(${extraHudKeys.join(',')})`);
    const allowedStatsKeys = new Set([
      'level', 'exp', 'expToNext', 'hp', 'maxHp', 'ds', 'maxDs',
      'activeFormId', 'unlockedFormIds',
    ]);
    for (const role of ['tamer', 'digimon'] as const) {
      const s = hud[role];
      const extraStatKeys = Object.keys(s).filter((k) => !allowedStatsKeys.has(k));
      if (extraStatKeys.length > 0) issues.push(`${role}.extra(${extraStatKeys.join(',')})`);
      if (!Number.isFinite(s.level) || s.level < 1 || s.level > 200) issues.push(`${role}.lv(${s.level})`);
      if (!Number.isFinite(s.exp) || s.exp < 0 || s.exp > 100000000) issues.push(`${role}.exp(${s.exp})`);
      if (!Number.isFinite(s.expToNext) || s.expToNext < 1 || s.expToNext > 100000000) issues.push(`${role}.next(${s.expToNext})`);
      if (!Number.isFinite(s.hp) || s.hp < 0 || s.hp > 1000000 || !Number.isFinite(s.maxHp) || s.maxHp < 1 || s.maxHp > 1000000) issues.push(`${role}.hp`);
      if (!Number.isFinite(s.ds) || s.ds < 0 || s.ds > 1000000 || !Number.isFinite(s.maxDs) || s.maxDs < 1 || s.maxDs > 1000000) issues.push(`${role}.ds`);
    }
    if (hud.digimon.activeFormId != null && (typeof hud.digimon.activeFormId !== 'string' || utf8ByteLength(hud.digimon.activeFormId) < 1 || utf8ByteLength(hud.digimon.activeFormId) > 32)) {
      issues.push('digi.formId');
    }
    if (hud.digimon.unlockedFormIds != null && (!Array.isArray(hud.digimon.unlockedFormIds) || hud.digimon.unlockedFormIds.length > 24 || (hud.digimon.unlockedFormIds.length > 0 && typeof hud.digimon.unlockedFormIds[0] !== 'string'))) {
      issues.push('digi.forms');
    }
    if (!Number.isFinite(hud.bits) || hud.bits < 0 || hud.bits > 1000000000) issues.push('hud.bits');
    if (!Number.isFinite(hud.dCoin) || hud.dCoin < 0 || hud.dCoin > 1000000000) issues.push('hud.dCoin');
    if (hud.inventory.length > 48) issues.push('hud.inv');
    if (hud.inventory.length > 0 && (typeof hud.inventory[0] !== 'object' || hud.inventory[0] === null || Array.isArray(hud.inventory[0]))) {
      issues.push('hud.inv0');
    }
    if (Object.keys(hud.equippedItems).length > 16) issues.push('hud.eq');
    if (hud.guildName !== null && (typeof hud.guildName !== 'string' || utf8ByteLength(hud.guildName) > 32)) {
      issues.push('hud.guild');
    }
    if (hud.tamerPhotoUrl != null && !isValidAvatarPhotoDataUrl(hud.tamerPhotoUrl)) issues.push('hud.photo');
    if (hud.tamerCoverUrl != null && !isValidCoverPhotoDataUrl(hud.tamerCoverUrl)) issues.push('hud.cover');
    if (hud.xpBoostUntilMs != null && (!Number.isFinite(hud.xpBoostUntilMs) || hud.xpBoostUntilMs < 0 || hud.xpBoostUntilMs > 4000000000000)) {
      issues.push('hud.boost');
    }
    if (hud.autoFarmVipUnlocked !== undefined && typeof hud.autoFarmVipUnlocked !== 'boolean') {
      issues.push('hud.vip');
    }
    if (!Number.isFinite(hud.defeatedEnemiesTotal) || hud.defeatedEnemiesTotal < 0 || hud.defeatedEnemiesTotal > 100000000) issues.push('hud.kills');
    if (hud.updatedAt.length < 10 || hud.updatedAt.length > 40) issues.push('hud.upd');
  }

  if (raw) {
    const rawMissing = Array.from(ALLOWED_PLAYER_TOP_LEVEL_KEYS).filter((k) => !(k in raw));
    if (rawMissing.length > 0) issues.push(`rawMissing:${rawMissing.join(',')}`);
    if (raw.ownerUid !== uid) issues.push('raw.ownerUid');
    if (typeof raw.username !== 'string' || !/^[a-zA-Z0-9._-]{3,24}$/.test(raw.username)) {
      issues.push('raw.uname');
    }
    if (
      typeof raw.usernameLower !== 'string' ||
      !/^[a-z0-9._-]{3,24}$/.test(raw.usernameLower) ||
      (typeof raw.username === 'string' && raw.username.toLowerCase() !== raw.usernameLower)
    ) {
      issues.push('raw.ulower');
    }
    if (raw.tamerSelection != null && typeof raw.tamerSelection === 'object') {
      const rt = raw.tamerSelection as Record<string, unknown>;
      const nt = normalized.tamerSelection as CloudTamerSelection | null;
      if (!nt || rt.characterId !== nt.characterId || rt.tamerName !== nt.tamerName) {
        issues.push('raw.tamerMismatch');
      }
      if (Object.keys(rt).length !== 3) {
        issues.push(`raw.tamerKeys(${Object.keys(rt).length})`);
      }
      if (typeof rt.updatedAt !== 'string' || rt.updatedAt.length < 10 || rt.updatedAt.length > 40) {
        issues.push('raw.tamerUpd');
      }
    }
    if (raw.starterDigimon != null && typeof raw.starterDigimon === 'object') {
      const rs = raw.starterDigimon as Record<string, unknown>;
      const ns = normalized.starterDigimon as CloudStarterDigimon | null;
      if (!ns || rs.digimonId !== ns.digimonId) {
        issues.push('raw.starterMismatch');
      }
      if (Object.keys(rs).length !== 4) {
        issues.push(`raw.starterKeys(${Object.keys(rs).length})`);
      }
      if (typeof rs.chosenAt !== 'string' || rs.chosenAt.length < 10 || rs.chosenAt.length > 40) {
        issues.push('raw.starterAt');
      }
    }
  }
  return issues.length > 0 ? issues.join(',') : 'rulesMatchOk';
}

/**
 * Performs a fast partial updateDoc on `/players/{uid}`. If Firestore rejects the partial
 * update because an untouched legacy field on the existing document violates the current
 * hardened schema (or the doc disappeared), it reloads the authoritative server document,
 * sanitizes every field into a 100% schema-valid PlayerSave payload (preserving immutable
 * ownerUid, createdAt, tamerSelection, and starterDigimon), and heals it cleanly.
 */
async function updatePlayerDocWithSelfHeal(
  user: User,
  patch: PlayerPatchOverrides,
  swallowError: boolean
): Promise<void> {
  return enqueuePlayerWrite(user.uid, async () => {
    if (auth.currentUser?.uid !== user.uid || !auth.currentUser.emailVerified) return;
    const ready = await ensurePlayerDocBootstrapped(user);
    if (!ready) return;

    const path = `players/${user.uid}`;
    const playerRef = doc(db, 'players', user.uid);
    const updatePayload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    if (patch.tamerSelection !== undefined) {
      updatePayload.tamerSelection = patch.tamerSelection;
    }
    if (patch.starterDigimon !== undefined) {
      updatePayload.starterDigimon = patch.starterDigimon;
    }
    if (patch.adventureProgress !== undefined) {
      updatePayload.adventureProgress = patch.adventureProgress;
    }
    if (patch.hudState !== undefined) {
      if (patch.syncDCoin === true) {
        updatePayload.hudState = patch.hudState;
      } else {
        // Dotted HUD fields omit hudState.dCoin so gameplay auto-saves (XP, kills, drops)
        // can never overwrite a concurrent Mercado Pago or GM DL-DIN credit with a stale local balance.
        const h = patch.hudState;
        updatePayload['hudState.tamer'] = h.tamer;
        updatePayload['hudState.digimon'] = h.digimon;
        updatePayload['hudState.bits'] = h.bits;
        updatePayload['hudState.inventory'] = h.inventory;
        updatePayload['hudState.equippedItems'] = h.equippedItems;
        updatePayload['hudState.guildName'] = h.guildName;
        updatePayload['hudState.defeatedEnemiesTotal'] = h.defeatedEnemiesTotal;
        updatePayload['hudState.updatedAt'] = h.updatedAt;
        if (h.tamerPhotoUrl !== undefined) {
          updatePayload['hudState.tamerPhotoUrl'] = h.tamerPhotoUrl;
        } else {
          updatePayload['hudState.tamerPhotoUrl'] = deleteField();
        }
        if (h.tamerCoverUrl !== undefined) {
          updatePayload['hudState.tamerCoverUrl'] = h.tamerCoverUrl;
        } else {
          updatePayload['hudState.tamerCoverUrl'] = deleteField();
        }
        if (h.xpBoostUntilMs !== undefined) {
          updatePayload['hudState.xpBoostUntilMs'] = h.xpBoostUntilMs;
        }
        if (h.autoFarmVipUnlocked === true) {
          updatePayload['hudState.autoFarmVipUnlocked'] = true;
        }
      }
    }

    try {
      await updateDoc(playerRef, updatePayload);
      return;
    } catch (firstErr) {
      // Ignore expected aborts if the user signed out while the request was in flight
      if (auth.currentUser?.uid !== user.uid) return;

      let stage = 'get-server';
      let hasValidTimestampCreatedAt = false;
      let createdAtKind = 'unknown';
      let extraKeysCount = 0;
      let docExisted = false;
      let healUpdateErrorMsg = '';
      let ruleMismatchDiag = '';
      let shapeSummary = '';

      // Attempt authoritative server-side schema self-heal before reporting permission error
      try {
        // Force-refresh ID token so recently verified claims are guaranteed fresh on retry
        await user.getIdToken(true).catch(() => {});
        const snap = await getAuthoritativePlayerSnap(user.uid);
        if (auth.currentUser?.uid !== user.uid) return;
        docExisted = snap.exists();

        if (!snap.exists()) {
          stage = 'recreate-missing';
          bootstrappedUids.delete(user.uid);
          const safeUsername = sanitizePlayerUsername(
            user.displayName || user.email?.split('@')[0] || '',
            user.uid
          );
          const ts = serverTimestamp();
          await setDoc(playerRef, {
            ownerUid: user.uid,
            username: safeUsername,
            usernameLower: safeUsername.toLowerCase(),
            tamerSelection: patch.tamerSelection ?? null,
            starterDigimon: patch.starterDigimon ?? null,
            adventureProgress: patch.adventureProgress ?? null,
            hudState: patch.hudState ?? null,
            createdAt: ts,
            updatedAt: ts,
          });
          bootstrappedUids.add(user.uid);
          return;
        }

        const raw = (snap.data() ?? {}) as Record<string, unknown>;
        const safeUsername = sanitizePlayerUsername(
          typeof raw.username === 'string' && raw.username.trim().length >= 3
            ? raw.username
            : user.displayName || user.email?.split('@')[0] || '',
          user.uid
        );
        const existingTamer = sanitizeTamerSelectionForCloud(raw.tamerSelection);
        const existingStarter = sanitizeStarterDigimonForCloud(raw.starterDigimon);
        const existingAdv =
          raw.adventureProgress &&
          typeof raw.adventureProgress === 'object' &&
          !Array.isArray(raw.adventureProgress)
            ? sanitizeAdventureForCloud(
                raw.adventureProgress as Parameters<typeof sanitizeAdventureForCloud>[0]
              )
            : null;
        const existingHud =
          raw.hudState &&
          typeof raw.hudState === 'object' &&
          !Array.isArray(raw.hudState)
            ? sanitizeHudStateForCloud(raw.hudState as AccountHudPersistence)
            : null;

        hasValidTimestampCreatedAt = isFirestoreTimestampLike(raw.createdAt);
        createdAtKind =
          raw.createdAt === undefined
            ? 'missing'
            : raw.createdAt === null
              ? 'null'
              : hasValidTimestampCreatedAt
                ? 'timestamp'
                : typeof raw.createdAt;

        const extraTopLevelKeys = Object.keys(raw).filter(
          (k) => !ALLOWED_PLAYER_TOP_LEVEL_KEYS.has(k)
        );
        extraKeysCount = extraTopLevelKeys.length;
        const hasDottedExtraKey = extraTopLevelKeys.some((k) => k.includes('.'));

        const mergedHudState: CloudHudState | null = patch.hudState
          ? patch.syncDCoin === true || !existingHud
            ? patch.hudState
            : {
                ...patch.hudState,
                dCoin: existingHud.dCoin,
                autoFarmVipUnlocked:
                  patch.hudState.autoFarmVipUnlocked === true ||
                  existingHud.autoFarmVipUnlocked === true
                    ? true
                    : undefined,
              }
          : existingHud;

        const normalizedFields: Record<string, unknown> = {
          ownerUid: user.uid,
          username: safeUsername,
          usernameLower: safeUsername.toLowerCase(),
          tamerSelection: existingTamer ?? patch.tamerSelection ?? null,
          starterDigimon: existingStarter ?? patch.starterDigimon ?? null,
          adventureProgress: patch.adventureProgress ?? existingAdv,
          hudState: mergedHudState ? stripUndefined(mergedHudState) : null,
          updatedAt: serverTimestamp(),
        };
        ruleMismatchDiag = diagnosePlayerSaveMismatch(raw, normalizedFields, user.uid);
        const diagAdv = normalizedFields.adventureProgress as CloudAdventureProgress | null;
        const diagHud = normalizedFields.hudState as CloudHudState | null;
        shapeSummary = [
          normalizedFields.tamerSelection ? 'tam:1' : 'tam:0',
          normalizedFields.starterDigimon ? 'st:1' : 'st:0',
          diagAdv ? `adv:${diagAdv.mapId}:z${diagAdv.discoveredZones.length}` : 'adv:null',
          diagHud
            ? `hud:lv${diagHud.tamer.level}/${diagHud.digimon.level}:dc${diagHud.dCoin}:inv${diagHud.inventory.length}:eq${Object.keys(diagHud.equippedItems).length}:p${diagHud.tamerPhotoUrl?.length ?? 0}:c${diagHud.tamerCoverUrl?.length ?? 0}:f${diagHud.digimon.activeFormId ?? '-'}`
            : 'hud:null',
        ].join('|');

        if (hasValidTimestampCreatedAt) {
          // Tier A: update all normalized fields and delete clean extra keys via deleteField()
          // without touching createdAt at all.
          if (!hasDottedExtraKey) {
            stage = 'heal-updateDoc';
            const healPatch: Record<string, unknown> = { ...normalizedFields };
            for (const extraKey of extraTopLevelKeys) {
              healPatch[extraKey] = deleteField();
            }
            try {
              await updateDoc(playerRef, healPatch);
              return;
            } catch (tierAErr) {
              healUpdateErrorMsg =
                tierAErr instanceof Error ? tierAErr.message : String(tierAErr);
              // Fall through to Tier B full-document rewrite preserving exact Timestamp
            }
          }

          // Tier B: full-document setDoc replacing all keys cleanly while preserving
          // the exact server Timestamp (handles dotted legacy keys cleanly).
          stage = 'heal-setDoc-preserveCreatedAt';
          await setDoc(playerRef, {
            ...normalizedFields,
            createdAt: raw.createdAt,
          });
        } else {
          // Full rewrite required to initialize missing/non-Timestamp createdAt cleanly
          stage = 'heal-setDoc-initCreatedAt';
          await setDoc(playerRef, {
            ...normalizedFields,
            createdAt: serverTimestamp(),
          });
        }
        return;
      } catch (healError) {
        if (auth.currentUser?.uid !== user.uid) return;

        const diag = [
          `stage=${stage}`,
          `docExisted=${docExisted}`,
          `createdAt=${createdAtKind}`,
          `extraKeys=${extraKeysCount}`,
          `patchKeys=${Object.keys(patch).join(',') || 'none'}`,
          shapeSummary ? `shape=${shapeSummary}` : '',
          ruleMismatchDiag ? `check=${ruleMismatchDiag}` : '',
          healUpdateErrorMsg ? `tierA=${healUpdateErrorMsg}` : '',
          `first=${firstErr instanceof Error ? firstErr.message : String(firstErr)}`,
        ]
          .filter(Boolean)
          .join(' | ');
        const baseMsg =
          healError instanceof Error ? healError.message : String(healError);
        const enrichedError = new Error(`${baseMsg} [${diag}]`);

        if (swallowError) {
          try {
            handleFirestoreError(enrichedError, OperationType.UPDATE, path);
          } catch {
            // Structured error already logged to console
          }
          return;
        }
        handleFirestoreError(enrichedError, OperationType.UPDATE, path);
      }
    }
  });
}

export async function syncTamerSelectionToCloud(
  selection: SavedCharacterSelection
): Promise<void> {
  const user = getVerifiedCurrentUser();
  if (!user) return;
  const ready = await ensurePlayerDocBootstrapped(user);
  if (!ready) return;

  const cleanSelection = sanitizeTamerSelectionForCloud({
    characterId: selection.characterId,
    tamerName: selection.tamerName,
    updatedAt: selection.updatedAt,
  });
  if (!cleanSelection) return;

  try {
    const existingSnap = await getAuthoritativePlayerSnap(user.uid);
    if (existingSnap.exists() && existingSnap.data()?.tamerSelection != null) {
      return;
    }
  } catch {
    // Continue to update helper which handles error reporting
  }

  await updatePlayerDocWithSelfHeal(user, { tamerSelection: cleanSelection }, false);
}

export async function syncStarterDigimonToCloud(
  starter: SavedStarterDigimon
): Promise<void> {
  const user = getVerifiedCurrentUser();
  if (!user) return;
  const ready = await ensurePlayerDocBootstrapped(user);
  if (!ready) return;

  const cleanStarter = sanitizeStarterDigimonForCloud(starter);
  if (!cleanStarter) return;

  try {
    const existingSnap = await getAuthoritativePlayerSnap(user.uid);
    if (existingSnap.exists() && existingSnap.data()?.starterDigimon != null) {
      return;
    }
  } catch {
    // Continue to update helper which handles error reporting
  }

  await updatePlayerDocWithSelfHeal(user, { starterDigimon: cleanStarter }, false);
}

// ============================================================================
// Debounced Auto-Save Queue for Exploration & RPG HUD State (saves Firestore writes)
// ============================================================================

let pendingAdventure: CloudAdventureProgress | null = null;
let pendingHud: CloudHudState | null = null;
let pendingHudSyncsDCoin = false;
let syncTimer: number | null = null;
let inFlightCommitPromise: Promise<void> | null = null;

async function commitPendingCloudSaves(): Promise<void> {
  if (syncTimer !== null) {
    window.clearTimeout(syncTimer);
    syncTimer = null;
  }

  if (inFlightCommitPromise) {
    await inFlightCommitPromise;
    if (!pendingAdventure && !pendingHud) return;
  }

  const user = getVerifiedCurrentUser();
  if (!user) {
    pendingAdventure = null;
    pendingHud = null;
    pendingHudSyncsDCoin = false;
    return;
  }

  const adv = pendingAdventure;
  const hud = pendingHud;
  const syncDCoin = pendingHudSyncsDCoin;
  pendingAdventure = null;
  pendingHud = null;
  pendingHudSyncsDCoin = false;

  if (!adv && !hud) return;

  const patch: PlayerPatchOverrides = {};
  if (adv) patch.adventureProgress = adv;
  if (hud) {
    patch.hudState = hud;
    patch.syncDCoin = syncDCoin;
  }

  const commitPromise = (async () => {
    await updatePlayerDocWithSelfHeal(user, patch, true);
  })();
  inFlightCommitPromise = commitPromise;

  try {
    await commitPromise;
  } finally {
    if (inFlightCommitPromise === commitPromise) {
      inFlightCommitPromise = null;
    }
    // If newer saves arrived while the previous commit was in flight, schedule cleanly
    if ((pendingAdventure || pendingHud) && syncTimer === null) {
      syncTimer = window.setTimeout(() => {
        void commitPendingCloudSaves();
      }, 1500);
    }
  }
}

export function scheduleAdventureProgressSync(progress: {
  mapId?: 'dats-center' | 'hunting-plains' | 'data-forest' | 'digi-mountain' | 'digital-desert' | 'data-sea' | 'digimon-island' | 'dark-area' | 'virtual-world';
  worldX: number;
  worldY: number;
  facingDir: 'N' | 'S' | 'E' | 'W';
  stepsCount: number;
  discoveredZones: string[];
  updatedAt?: string;
}): void {
  if (!getVerifiedCurrentUser()) return;
  pendingAdventure = sanitizeAdventureForCloud(progress);
  if (syncTimer === null) {
    syncTimer = window.setTimeout(() => {
      void commitPendingCloudSaves();
    }, 2200);
  }
}

export function scheduleHudStateSync(
  state: AccountHudPersistence,
  syncDCoin = false
): void {
  if (!getVerifiedCurrentUser()) return;
  pendingHud = sanitizeHudStateForCloud(state);
  if (syncDCoin) {
    pendingHudSyncsDCoin = true;
  }
  if (syncTimer === null) {
    syncTimer = window.setTimeout(() => {
      void commitPendingCloudSaves();
    }, syncDCoin ? 350 : 1800);
  }
}

export async function flushPendingCloudSaves(): Promise<void> {
  await commitPendingCloudSaves();
  if (inFlightCommitPromise) {
    await inFlightCommitPromise;
  }
  if (pendingAdventure || pendingHud) {
    await commitPendingCloudSaves();
  }
}
