import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { ensurePlayerDocBootstrapped } from './cloudSaveService';
import type { SharedWorldMapId } from './worldPresenceService';

export interface GlobalChatMessageRecord {
  messageId: string;
  senderUid: string;
  senderName: string;
  isGmSender: boolean;
  mapId: SharedWorldMapId;
  text: string;
  createdAtMs: number;
  timestampLabel: string;
}

const VALID_MAPS = new Set<SharedWorldMapId>([
  'dats-center',
  'hunting-plains',
  'data-forest',
  'digi-mountain',
  'digital-desert',
  'data-sea',
  'digimon-island',
  'dark-area',
  'virtual-world',
]);

function safeMapId(raw: unknown): SharedWorldMapId {
  return VALID_MAPS.has(raw as SharedWorldMapId)
    ? (raw as SharedWorldMapId)
    : 'dats-center';
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

function formatClockLabel(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
}

function isFirestoreVerified(): boolean {
  const user = auth.currentUser;
  return Boolean(user && user.emailVerified);
}

// Local storage fallback for offline / Quick Test mode
const LOCAL_GLOBAL_CHAT_KEY = 'digilegends_local_global_chat_v1';
const localGlobalListeners = new Set<() => void>();

function readLocalGlobalChat(): GlobalChatMessageRecord[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_GLOBAL_CHAT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GlobalChatMessageRecord[];
    return Array.isArray(parsed) ? parsed.slice(-30) : [];
  } catch {
    return [];
  }
}

function writeLocalGlobalChat(list: GlobalChatMessageRecord[]): void {
  try {
    window.localStorage.setItem(
      LOCAL_GLOBAL_CHAT_KEY,
      JSON.stringify(list.slice(-30))
    );
  } catch {
    // Ignore storage quota errors
  }
  for (const fn of localGlobalListeners) fn();
}

/**
 * Subscribes in real time to server-wide Global Chat messages across ALL maps.
 */
export function subscribeGlobalChat(
  onMessage: (msg: GlobalChatMessageRecord) => void
): () => void {
  const seenIds = new Set<string>();

  if (!isFirestoreVerified()) {
    const emitLocal = () => {
      for (const m of readLocalGlobalChat()) {
        if (seenIds.has(m.messageId)) continue;
        seenIds.add(m.messageId);
        onMessage(m);
      }
    };
    localGlobalListeners.add(emitLocal);
    emitLocal();
    return () => {
      localGlobalListeners.delete(emitLocal);
    };
  }

  const q = query(
    collection(db, 'globalChat'),
    orderBy('createdAt', 'desc'),
    limit(35)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const ordered = [...snapshot.docs].reverse();
      for (const d of ordered) {
        if (seenIds.has(d.id)) continue;
        seenIds.add(d.id);
        const raw = (d.data() ?? {}) as Record<string, unknown>;
        const createdMs = parseTimestampMs(raw.createdAt) ?? Date.now();
        onMessage({
          messageId: String(raw.messageId ?? d.id),
          senderUid: String(raw.senderUid ?? ''),
          senderName: String(raw.senderName ?? 'Tamer').slice(0, 24),
          isGmSender: Boolean(raw.isGmSender),
          mapId: safeMapId(raw.mapId),
          text: String(raw.text ?? '').slice(0, 140),
          createdAtMs: createdMs,
          timestampLabel: formatClockLabel(createdMs),
        });
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'globalChat');
      } catch {
        // Non-fatal
      }
    }
  );
}

/**
 * Sends a server-wide Global Chat message visible to every online player regardless of map.
 */
export async function sendGlobalChatMessage(params: {
  senderUid: string;
  senderName: string;
  isGmSender: boolean;
  mapId: SharedWorldMapId;
  text: string;
}): Promise<boolean> {
  const clean = params.text.trim().slice(0, 140);
  if (!clean) return false;
  const cleanName = params.senderName.trim().slice(0, 24) || 'Tamer';
  const safeMap = safeMapId(params.mapId);
  const messageId = `gmsg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  if (!isFirestoreVerified()) {
    const now = Date.now();
    const list = readLocalGlobalChat();
    list.push({
      messageId,
      senderUid: params.senderUid,
      senderName: cleanName,
      isGmSender: Boolean(params.isGmSender),
      mapId: safeMap,
      text: clean,
      createdAtMs: now,
      timestampLabel: formatClockLabel(now),
    });
    writeLocalGlobalChat(list);
    return true;
  }

  const user = auth.currentUser;
  if (!user || !user.emailVerified || user.uid !== params.senderUid) {
    return false;
  }

  await ensurePlayerDocBootstrapped(user);
  const path = `globalChat/${messageId}`;
  try {
    await setDoc(doc(db, 'globalChat', messageId), {
      messageId,
      senderUid: user.uid,
      senderName: cleanName,
      isGmSender: Boolean(params.isGmSender),
      mapId: safeMap,
      text: clean,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.CREATE, path);
    } catch {
      // Non-fatal
    }
    return false;
  }
}
