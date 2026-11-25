import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import type { CardinalDirection, TamerMovementState } from '../sprites/tamerRealSheets';
import type { TamerId } from '../types/character';
import type { DigimonFormId } from '../types/digimon';
import { ensurePlayerDocBootstrapped } from './cloudSaveService';

export type SharedWorldMapId =
  | 'dats-center'
  | 'hunting-plains'
  | 'data-forest'
  | 'digi-mountain'
  | 'digital-desert'
  | 'data-sea'
  | 'digimon-island'
  | 'dark-area'
  | 'virtual-world';

export type WorldSyncStatus = 'connecting' | 'connected' | 'error';

export interface RemoteWorldPlayer {
  uid: string;
  tamerName: string;
  characterId: TamerId;
  tamerLevel: number;
  digimonFormId: DigimonFormId;
  digimonLevel: number;
  mapId: SharedWorldMapId;
  worldX: number;
  worldY: number;
  facingDir: CardinalDirection;
  moveState: TamerMovementState;
  partnerX: number;
  partnerY: number;
  partnerDir: CardinalDirection;
  partnerMoving: boolean;
  isGm: boolean;
  guildName: string | null;
  chatText: string;
  chatSeq: number;
  updatedAtMs: number;
}

export interface LocalPresenceState {
  tamerName: string;
  characterId: TamerId;
  tamerLevel: number;
  digimonFormId: DigimonFormId;
  digimonLevel: number;
  mapId: SharedWorldMapId;
  worldX: number;
  worldY: number;
  facingDir: CardinalDirection;
  moveState: TamerMovementState;
  partnerX: number;
  partnerY: number;
  partnerDir: CardinalDirection;
  partnerMoving: boolean;
  isGm: boolean;
  guildName: string | null;
}

const VALID_TAMERS = new Set<TamerId>(['kai', 'ren', 'hina', 'yuna']);
const VALID_FORMS = new Set<DigimonFormId>([
  'agumon',
  'geogreymon',
  'rizegreymon',
  'shinegreymon',
  'agumon_classic',
  'greymon',
  'metalgreymon',
  'wargreymon',
  'gaomon',
  'gaogamon',
  'machgaogamon',
  'miragegaogamon',
  'lalamon',
  'sunflowmon',
  'lilamon',
  'rosemon',
  'guilmon',
  'growlmon',
  'megalogrowlmon',
  'dukemon',
  'gabumon',
  'garurumon',
  'weregarurumon',
  'metalgarurumon',
  'impmon',
  'icedevimon',
  'skullsatamon',
  'beelzemon',
  'veemon',
  'veedramon',
  'aeroveedramon',
  'ulforceveedramon',
  'keramon',
  'chrysalimon',
  'infermon',
  'diaboromon',
  'demimeramon',
  'meramon',
  'skullmeramon',
  'boltmon',
  'hawkmon',
  'aquilamon',
  'silphymon',
  'gryphonmon',
  'tentomon',
  'kabuterimon',
  'megakabuterimon',
  'herculeskabuterimon',
  'drimogemon',
  'digmon',
  'giromon',
  'hiandromon',
  'kiwimon',
  'deramon',
  'blossomon',
  'griffomon',
  'gotsumon',
  'icemon',
  'insekimon',
  'metaletemon',
  'elecmon',
  'leomon',
  'iceleomon',
  'saberleomon',
  'renamon',
  'kyubimon',
  'taomon',
  'sakuyamon',
  'monodramon',
  'strikedramon',
  'cyberdramon',
  'justimon',
  'biyomon',
  'birdramon',
  'garudamon',
  'phoenixmon',
  'kunemon',
  'flymon',
  'okuwamon',
  'grankuwagamon',
]);

/**
 * Players whose server-clock heartbeat is older than 120s (compared against
 * Google Firestore's own server timestamp, never raw device Date.now()) are pruned.
 */
export const PRESENCE_STALE_MS = 120_000;

function safeDir(dir: unknown): CardinalDirection {
  const s = String(dir ?? 'S').toUpperCase();
  if (s === 'N' || s === 'E' || s === 'W' || s === 'S') return s;
  return 'S';
}

function safeCoord(val: unknown): number {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(20000, Math.round(n * 10) / 10));
}

function safeLevel(val: unknown): number {
  const n = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(200, Math.round(n)));
}

function safeTamerName(raw: unknown): string {
  const trimmed = String(raw ?? '').trim().slice(0, 16);
  return trimmed.length >= 3 ? trimmed : 'Tamer';
}

function safeCharacterId(raw: unknown): TamerId {
  return VALID_TAMERS.has(raw as TamerId) ? (raw as TamerId) : 'kai';
}

function safeFormId(raw: unknown): DigimonFormId {
  return VALID_FORMS.has(raw as DigimonFormId) ? (raw as DigimonFormId) : 'agumon';
}

function safeMapId(raw: unknown): SharedWorldMapId {
  if (raw === 'hunting-plains') return 'hunting-plains';
  if (raw === 'data-forest') return 'data-forest';
  if (raw === 'digi-mountain') return 'digi-mountain';
  if (raw === 'digital-desert') return 'digital-desert';
  if (raw === 'data-sea') return 'data-sea';
  if (raw === 'digimon-island') return 'digimon-island';
  if (raw === 'dark-area') return 'dark-area';
  if (raw === 'virtual-world') return 'virtual-world';
  return 'dats-center';
}

function safeGuildName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().slice(0, 32);
  return trimmed.length > 0 ? trimmed : null;
}

function parseTimestampMs(raw: unknown): number | null {
  if (raw instanceof Timestamp) return raw.toMillis();
  if (
    raw &&
    typeof raw === 'object' &&
    'toMillis' in raw &&
    typeof (raw as Timestamp).toMillis === 'function'
  ) {
    return (raw as Timestamp).toMillis();
  }
  return null;
}

let activeChatSeq = Math.floor(Date.now() / 1000) % 900_000;
let hasInitializedPresenceDocForUid: string | null = null;
let presenceEpoch = 0;

export function bumpPresenceSessionEpoch(): number {
  presenceEpoch += 1;
  return presenceEpoch;
}

/**
 * Publishes or updates the verified player's live avatar presence in `/worldPresence/{uid}`.
 * Guarantees `/players/{uid}` exists before first write and prevents offline cleanup races.
 */
export async function publishLocalWorldPresence(
  state: LocalPresenceState,
  opts?: { forceFullWrite?: boolean; chatMessage?: string }
): Promise<{ ok: boolean; chatSeq: number | null; errorMessage?: string }> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return { ok: false, chatSeq: null, errorMessage: 'Conta não verificada' };
  }

  const ready = await ensurePlayerDocBootstrapped(user);
  if (!ready) {
    return { ok: false, chatSeq: null, errorMessage: 'Perfil na nuvem ainda sincronizando' };
  }

  const path = `worldPresence/${user.uid}`;
  const ref = doc(db, 'worldPresence', user.uid);

  const sanitizedBase = {
    tamerName: safeTamerName(state.tamerName),
    characterId: safeCharacterId(state.characterId),
    tamerLevel: safeLevel(state.tamerLevel),
    digimonFormId: safeFormId(state.digimonFormId),
    digimonLevel: safeLevel(state.digimonLevel),
    mapId: safeMapId(state.mapId),
    worldX: safeCoord(state.worldX),
    worldY: safeCoord(state.worldY),
    facingDir: safeDir(state.facingDir),
    moveState: (state.moveState === 'walk' ? 'walk' : 'idle') as TamerMovementState,
    partnerX: safeCoord(state.partnerX),
    partnerY: safeCoord(state.partnerY),
    partnerDir: safeDir(state.partnerDir),
    partnerMoving: Boolean(state.partnerMoving),
    isGm: Boolean(state.isGm),
    guildName: safeGuildName(state.guildName),
    online: true,
    updatedAt: serverTimestamp(),
  };

  let sentChatSeq: number | null = null;
  const needsFullWrite =
    opts?.forceFullWrite || hasInitializedPresenceDocForUid !== user.uid;

  try {
    if (needsFullWrite) {
      let chatText = '';
      if (opts?.chatMessage) {
        activeChatSeq = Math.min(999_999, activeChatSeq + 1);
        chatText = opts.chatMessage.trim().slice(0, 140);
        sentChatSeq = activeChatSeq;
      }
      await setDoc(ref, {
        ownerUid: user.uid,
        ...sanitizedBase,
        chatText,
        chatSeq: activeChatSeq,
      });
      hasInitializedPresenceDocForUid = user.uid;
      return { ok: true, chatSeq: sentChatSeq };
    }

    if (opts?.chatMessage) {
      activeChatSeq = Math.min(999_999, activeChatSeq + 1);
      sentChatSeq = activeChatSeq;
      await updateDoc(ref, {
        ...sanitizedBase,
        chatText: opts.chatMessage.trim().slice(0, 140),
        chatSeq: activeChatSeq,
      });
      return { ok: true, chatSeq: sentChatSeq };
    }

    await updateDoc(ref, sanitizedBase);
    return { ok: true, chatSeq: null };
  } catch (error) {
    // If updateDoc hit a missing doc or stale state, retry once with full setDoc
    if (!needsFullWrite) {
      try {
        hasInitializedPresenceDocForUid = null;
        await setDoc(ref, {
          ownerUid: user.uid,
          ...sanitizedBase,
          chatText: opts?.chatMessage ? opts.chatMessage.trim().slice(0, 140) : '',
          chatSeq: activeChatSeq,
        });
        hasInitializedPresenceDocForUid = user.uid;
        return { ok: true, chatSeq: sentChatSeq };
      } catch (retryErr) {
        const msg = retryErr instanceof Error ? retryErr.message : String(retryErr);
        try {
          handleFirestoreError(retryErr, OperationType.WRITE, path);
        } catch {
          // Structured error logged without crashing gameplay loop
        }
        return { ok: false, chatSeq: null, errorMessage: msg };
      }
    }
    const msg = error instanceof Error ? error.message : String(error);
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Structured error logged without crashing gameplay loop
    }
    return { ok: false, chatSeq: null, errorMessage: msg };
  }
}

/**
 * Broadcasts a live chat message via the player's `/worldPresence/{uid}` document
 * so all players on the map immediately see the speech bubble and chat line.
 */
export async function broadcastWorldChatBubble(
  message: string,
  fallbackState?: LocalPresenceState
): Promise<number | null> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return null;
  const clean = message.trim().slice(0, 140);
  if (!clean) return null;

  if (hasInitializedPresenceDocForUid !== user.uid && fallbackState) {
    const res = await publishLocalWorldPresence(fallbackState, {
      forceFullWrite: true,
      chatMessage: clean,
    });
    return res.chatSeq;
  }

  activeChatSeq = Math.min(999_999, activeChatSeq + 1);
  const seq = activeChatSeq;
  const path = `worldPresence/${user.uid}`;
  try {
    await updateDoc(doc(db, 'worldPresence', user.uid), {
      chatText: clean,
      chatSeq: seq,
      online: true,
      updatedAt: serverTimestamp(),
    });
    return seq;
  } catch (error) {
    if (fallbackState) {
      const res = await publishLocalWorldPresence(fallbackState, {
        forceFullWrite: true,
        chatMessage: clean,
      });
      return res.chatSeq;
    }
    try {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } catch {
      // Structured error logged cleanly
    }
    return null;
  }
}

/**
 * Marks the current user's world presence offline cleanly on exit, sign-out, or page hide.
 * Optional `expectedEpoch` guards against stale React cleanup marking a freshly mounted session offline.
 */
export async function markLocalWorldPresenceOffline(
  expectedEpoch?: number
): Promise<void> {
  if (expectedEpoch !== undefined && expectedEpoch !== presenceEpoch) {
    return;
  }
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    hasInitializedPresenceDocForUid = null;
    return;
  }
  if (hasInitializedPresenceDocForUid !== user.uid) return;

  hasInitializedPresenceDocForUid = null;
  try {
    await updateDoc(doc(db, 'worldPresence', user.uid), {
      online: false,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Best-effort offline signal on tab close or sign-out
  }
}

interface ParsedPresenceDoc extends RemoteWorldPlayer {
  serverUpdatedAtMs: number | null;
}

/**
 * Subscribes in real time to all currently online players across the Digital World.
 * Uses server-clock alignment (immune to device clock skew!) so players on phones/PCs
 * with different clocks ALWAYS see each other reliably.
 */
export function subscribeOnlineWorldPlayers(
  onUpdate: (
    remotePlayers: RemoteWorldPlayer[],
    totalOnlineIncludingSelf: number,
    meta: { status: WorldSyncStatus; errorMessage?: string }
  ) => void
): () => void {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    onUpdate([], 1, { status: 'error', errorMessage: 'Sessão não verificada' });
    return () => undefined;
  }

  const selfUid = user.uid;
  let latestRawDocs: ParsedPresenceDoc[] = [];
  let estimatedClockOffsetMs = 0;
  let hasClockOffset = false;
  const lastObservedServerTsByUid = new Map<string, number>();
  const lastObservedLocalArrivalByUid = new Map<string, number>();

  const emitFiltered = () => {
    const localNow = Date.now();
    // Estimate Google server clock using our own presence doc or newest remote server timestamp
    let newestServerMs: number | null = null;
    for (const p of latestRawDocs) {
      if (p.serverUpdatedAtMs !== null) {
        if (newestServerMs === null || p.serverUpdatedAtMs > newestServerMs) {
          newestServerMs = p.serverUpdatedAtMs;
        }
      }
    }
    const selfDoc = latestRawDocs.find((p) => p.uid === selfUid);
    if (selfDoc?.serverUpdatedAtMs) {
      estimatedClockOffsetMs = selfDoc.serverUpdatedAtMs - localNow;
      hasClockOffset = true;
    } else if (!hasClockOffset && newestServerMs !== null) {
      estimatedClockOffsetMs = newestServerMs - localNow;
      hasClockOffset = true;
    }

    const estimatedServerNow = hasClockOffset
      ? localNow + estimatedClockOffsetMs
      : newestServerMs ?? localNow;

    const freshRemote = latestRawDocs
      .filter((p) => {
        if (p.uid === selfUid) return false;
        // Pending local/server write with null timestamp is brand new
        if (p.serverUpdatedAtMs === null) return true;
        // Check server-aligned age (zero device clock skew!)
        const serverAge = estimatedServerNow - p.serverUpdatedAtMs;
        if (serverAge <= PRESENCE_STALE_MS) return true;
        // Also allow if we observed a live change for this player within the stale window
        const localArrival = lastObservedLocalArrivalByUid.get(p.uid);
        if (localArrival !== undefined && localNow - localArrival <= PRESENCE_STALE_MS) {
          return true;
        }
        return false;
      })
      .sort((a, b) => {
        if (a.isGm !== b.isGm) return a.isGm ? -1 : 1;
        return b.tamerLevel - a.tamerLevel;
      });

    onUpdate(freshRemote, freshRemote.length + 1, { status: 'connected' });
  };

  const q = query(
    collection(db, 'worldPresence'),
    where('online', '==', true),
    limit(50)
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const localNow = Date.now();
      const next: ParsedPresenceDoc[] = [];

      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (!d || d.online !== true) return;
        const uid = String(d.ownerUid ?? docSnap.id);
        const serverMs = parseTimestampMs(d.updatedAt);

        const prevServerMs = lastObservedServerTsByUid.get(uid);
        if (serverMs !== null && serverMs !== prevServerMs) {
          lastObservedServerTsByUid.set(uid, serverMs);
          lastObservedLocalArrivalByUid.set(uid, localNow);
        }

        next.push({
          uid,
          tamerName: safeTamerName(d.tamerName),
          characterId: safeCharacterId(d.characterId),
          tamerLevel: safeLevel(d.tamerLevel),
          digimonFormId: safeFormId(d.digimonFormId),
          digimonLevel: safeLevel(d.digimonLevel),
          mapId: safeMapId(d.mapId),
          worldX: safeCoord(d.worldX),
          worldY: safeCoord(d.worldY),
          facingDir: safeDir(d.facingDir),
          moveState: d.moveState === 'walk' ? 'walk' : 'idle',
          partnerX: safeCoord(d.partnerX),
          partnerY: safeCoord(d.partnerY),
          partnerDir: safeDir(d.partnerDir),
          partnerMoving: Boolean(d.partnerMoving),
          isGm: Boolean(d.isGm),
          guildName: safeGuildName(d.guildName),
          chatText: typeof d.chatText === 'string' ? d.chatText.slice(0, 140) : '',
          chatSeq:
            typeof d.chatSeq === 'number' && Number.isFinite(d.chatSeq)
              ? d.chatSeq
              : 0,
          updatedAtMs: serverMs ?? localNow,
          serverUpdatedAtMs: serverMs,
        });
      });

      latestRawDocs = next;
      emitFiltered();
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      onUpdate([], 1, { status: 'error', errorMessage: msg });
      try {
        handleFirestoreError(error, OperationType.LIST, 'worldPresence');
      } catch {
        // Logged structured Firestore error without crashing game canvas
      }
    }
  );

  // Periodically prune stale players even if no new snapshot events arrive
  const pruneTimer = window.setInterval(emitFiltered, 15_000);

  return () => {
    window.clearInterval(pruneTimer);
    unsubscribe();
  };
}
