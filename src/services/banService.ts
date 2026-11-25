import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { isCurrentAuthUserBootstrappedGm } from './gmRoleService';

export type BanDurationPreset = '24h' | '7d' | '30d' | 'permanent';

export interface AccountBanRecord {
  targetUid: string;
  username: string;
  tamerName: string;
  reason: string;
  bannedByUid: string;
  bannedByName: string;
  permanent: boolean;
  expiresAtMs: number;
  active: boolean;
  createdAtMs: number;
  updatedAtMs: number;
}

function parseTimestampMs(raw: unknown): number {
  if (raw instanceof Timestamp) return raw.toMillis();
  if (
    raw &&
    typeof raw === 'object' &&
    'toMillis' in raw &&
    typeof (raw as Timestamp).toMillis === 'function'
  ) {
    return (raw as Timestamp).toMillis();
  }
  return Date.now();
}

function parseBanRecord(uid: string, raw: Record<string, unknown>): AccountBanRecord {
  return {
    targetUid: String(raw.targetUid ?? uid),
    username: String(raw.username ?? 'Tamer'),
    tamerName: String(raw.tamerName ?? ''),
    reason: String(raw.reason ?? 'Violação das regras do servidor.'),
    bannedByUid: String(raw.bannedByUid ?? ''),
    bannedByName: String(raw.bannedByName ?? 'GM'),
    permanent: Boolean(raw.permanent),
    expiresAtMs:
      typeof raw.expiresAtMs === 'number' && Number.isFinite(raw.expiresAtMs)
        ? raw.expiresAtMs
        : 0,
    active: Boolean(raw.active),
    createdAtMs: parseTimestampMs(raw.createdAt),
    updatedAtMs: parseTimestampMs(raw.updatedAt),
  };
}

export function isBanCurrentlyActive(
  record: AccountBanRecord | null | undefined
): boolean {
  if (!record || !record.active) return false;
  if (record.permanent) return true;
  return record.expiresAtMs > Date.now();
}

export function formatBanNoticeMessage(record: AccountBanRecord): string {
  const untilLabel = record.permanent
    ? 'Permanente'
    : `até ${new Date(record.expiresAtMs).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })}`;
  return `Conta suspensa (${untilLabel}). Motivo: ${record.reason}`;
}

export function computeBanExpiresAtMs(preset: BanDurationPreset): {
  permanent: boolean;
  expiresAtMs: number;
} {
  const now = Date.now();
  switch (preset) {
    case '24h':
      return { permanent: false, expiresAtMs: now + 24 * 60 * 60 * 1000 };
    case '7d':
      return { permanent: false, expiresAtMs: now + 7 * 24 * 60 * 60 * 1000 };
    case '30d':
      return { permanent: false, expiresAtMs: now + 30 * 24 * 60 * 60 * 1000 };
    case 'permanent':
    default:
      return { permanent: true, expiresAtMs: 0 };
  }
}

/**
 * Checks whether a user UID currently has an active ban in `/bannedAccounts/{uid}`.
 * Used at sign-in to block banned accounts before entering the Digital World.
 */
export async function checkAccountBanStatus(uid: string): Promise<{
  banned: boolean;
  record: AccountBanRecord | null;
  message?: string;
}> {
  if (!uid || !/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) {
    return { banned: false, record: null };
  }

  const ref = doc(db, 'bannedAccounts', uid);
  try {
    let snap;
    try {
      snap = await getDocFromServer(ref);
    } catch {
      snap = await getDoc(ref);
    }
    if (!snap.exists()) {
      return { banned: false, record: null };
    }
    const record = parseBanRecord(uid, (snap.data() ?? {}) as Record<string, unknown>);
    if (!isBanCurrentlyActive(record)) {
      return { banned: false, record };
    }
    return {
      banned: true,
      record,
      message: formatBanNoticeMessage(record),
    };
  } catch {
    return { banned: false, record: null };
  }
}

/**
 * Live listener on `/bannedAccounts/{uid}` while inside the world.
 * Disconnects the player immediately if a GM applies a ban mid-session.
 */
export function subscribeMyBanStatus(
  uid: string,
  onActiveBan: (record: AccountBanRecord, message: string) => void
): Unsubscribe {
  const user = auth.currentUser;
  if (!user || !uid || user.uid !== uid) {
    return () => undefined;
  }

  const ref = doc(db, 'bannedAccounts', uid);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) return;
      const record = parseBanRecord(uid, (snap.data() ?? {}) as Record<string, unknown>);
      if (isBanCurrentlyActive(record)) {
        onActiveBan(record, formatBanNoticeMessage(record));
      }
    },
    () => {
      // Non-fatal if user signs out cleanly
    }
  );
}

export async function listBannedAccountsForGm(): Promise<AccountBanRecord[]> {
  if (!isCurrentAuthUserBootstrappedGm()) {
    return [];
  }

  try {
    const snap = await getDocs(collection(db, 'bannedAccounts'));
    const list: AccountBanRecord[] = [];
    snap.forEach((docSnap) => {
      list.push(
        parseBanRecord(docSnap.id, (docSnap.data() ?? {}) as Record<string, unknown>)
      );
    });
    list.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'bannedAccounts');
  }
}

export async function banPlayerAccount(input: {
  targetUid: string;
  username: string;
  tamerName: string;
  reason: string;
  durationPreset: BanDurationPreset;
  gmName: string;
}): Promise<AccountBanRecord> {
  const actor = auth.currentUser;
  if (!actor || !isCurrentAuthUserBootstrappedGm()) {
    throw new Error('Apenas GMs autorizados podem banir contas.');
  }
  if (!input.targetUid || input.targetUid === actor.uid) {
    throw new Error('Não é possível banir a sua própria conta GM.');
  }

  const cleanReason = input.reason.trim().slice(0, 240);
  if (cleanReason.length < 3) {
    throw new Error('Informe um motivo com pelo menos 3 caracteres.');
  }

  const cleanUsername =
    (input.username || input.tamerName || 'Tamer').trim().slice(0, 24) || 'Tamer';
  const cleanTamerName = (input.tamerName || '').trim().slice(0, 24);
  const cleanGmName = (input.gmName || 'GM').trim().slice(0, 24) || 'GM';
  const { permanent, expiresAtMs } = computeBanExpiresAtMs(input.durationPreset);

  const ref = doc(db, 'bannedAccounts', input.targetUid);
  const path = `bannedAccounts/${input.targetUid}`;

  let existingCreatedAt: unknown = null;
  try {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      existingCreatedAt = existingSnap.data()?.createdAt ?? null;
    }
  } catch {
    // Ignore read error before create/set
  }

  try {
    if (existingCreatedAt) {
      await updateDoc(ref, {
        targetUid: input.targetUid,
        username: cleanUsername,
        tamerName: cleanTamerName,
        reason: cleanReason,
        bannedByUid: actor.uid,
        bannedByName: cleanGmName,
        permanent,
        expiresAtMs,
        active: true,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        targetUid: input.targetUid,
        username: cleanUsername,
        tamerName: cleanTamerName,
        reason: cleanReason,
        bannedByUid: actor.uid,
        bannedByName: cleanGmName,
        permanent,
        expiresAtMs,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }

  // Best-effort offline kick on /worldPresence/{targetUid}
  try {
    await updateDoc(doc(db, 'worldPresence', input.targetUid), {
      online: false,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Player might not have an active presence document yet
  }

  const now = Date.now();
  return {
    targetUid: input.targetUid,
    username: cleanUsername,
    tamerName: cleanTamerName,
    reason: cleanReason,
    bannedByUid: actor.uid,
    bannedByName: cleanGmName,
    permanent,
    expiresAtMs,
    active: true,
    createdAtMs: now,
    updatedAtMs: now,
  };
}

export async function unbanPlayerAccount(input: {
  targetUid: string;
  gmName: string;
}): Promise<void> {
  const actor = auth.currentUser;
  if (!actor || !isCurrentAuthUserBootstrappedGm()) {
    throw new Error('Apenas GMs autorizados podem desbanir contas.');
  }

  const ref = doc(db, 'bannedAccounts', input.targetUid);
  const path = `bannedAccounts/${input.targetUid}`;
  const cleanGmName = (input.gmName || 'GM').trim().slice(0, 24) || 'GM';

  try {
    await updateDoc(ref, {
      active: false,
      bannedByUid: actor.uid,
      bannedByName: cleanGmName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
