import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { ensurePlayerDocBootstrapped } from './cloudSaveService';
import {
  safeChannelId,
  type SharedWorldMapId,
  type WorldChannelId,
} from './worldPresenceService';
import type { TamerId } from '../types/character';
import type { DigimonFormId } from '../types/digimon';
import { isValidAvatarPhotoDataUrl } from '../utils/avatarPhoto';

export const MAX_PARTY_MEMBERS = 4; // Líder + até 3 jogadores convidados

export interface PartyMemberRecord {
  uid: string;
  tamerName: string;
  characterId: TamerId;
  tamerLevel: number;
  tamerPhotoUrl: string | null;
  digimonFormId: DigimonFormId;
  digimonName: string;
  digimonLevel: number;
  hp: number;
  maxHp: number;
  mapId: SharedWorldMapId;
  channelId: WorldChannelId;
}

export interface PartyRecord {
  partyId: string;
  leaderUid: string;
  leaderName: string;
  memberUids: string[];
  members: Record<string, PartyMemberRecord>;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface PartyInviteRecord {
  inviteId: string;
  partyId: string;
  fromUid: string;
  fromName: string;
  fromTamerLevel: number;
  fromCharacterId: TamerId;
  fromPhotoUrl: string | null;
  fromDigimonFormId: DigimonFormId;
  toUid: string;
  toName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAtMs: number;
}

export interface PartyXpEventRecord {
  eventId: string;
  killerUid: string;
  killerName: string;
  mapId: SharedWorldMapId;
  channelId?: WorldChannelId;
  mobName: string;
  mobLevel: number;
  baseExp: number;
  createdAtMs: number;
}

export interface PartyChatMessageRecord {
  messageId: string;
  senderUid: string;
  senderName: string;
  isGmSender: boolean;
  text: string;
  createdAtMs: number;
  timestampLabel: string;
}

export interface PartyActorProfile {
  uid: string;
  tamerName: string;
  characterId: TamerId;
  tamerLevel: number;
  tamerPhotoUrl: string | null;
  digimonFormId: DigimonFormId;
  digimonName: string;
  digimonLevel: number;
  hp: number;
  maxHp: number;
  mapId: SharedWorldMapId;
  channelId?: WorldChannelId;
}

const VALID_TAMERS = new Set<TamerId>(['kai', 'ren', 'hina', 'yuna']);
const VALID_MAPS = new Set<SharedWorldMapId>([
  'dats-center',
  'd-terminal',
  'hunting-plains',
  'data-forest',
  'digi-mountain',
  'digital-desert',
  'data-sea',
  'digimon-island',
  'dark-area',
  'virtual-world',
]);

const LOCAL_PARTIES_KEY = 'dw_local_parties_v1';
const LOCAL_INVITES_KEY = 'dw_local_party_invites_v1';
const LOCAL_PARTY_BUS_EVENT = 'dw_local_party_sync';

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

function safeMapId(raw: unknown): SharedWorldMapId {
  return VALID_MAPS.has(raw as SharedWorldMapId)
    ? (raw as SharedWorldMapId)
    : 'dats-center';
}

function safeFormId(raw: unknown): DigimonFormId {
  if (typeof raw === 'string' && /^[a-z0-9_]{1,32}$/.test(raw)) {
    return raw as DigimonFormId;
  }
  return 'agumon';
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
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  return null;
}

function formatClockLabel(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function sanitizePartyMember(
  profile: PartyActorProfile
): PartyMemberRecord {
  const maxHp = safeInt(profile.maxHp, 1, 1_000_000, 100);
  const hp = safeInt(profile.hp, 0, maxHp, maxHp);
  return {
    uid: String(profile.uid).slice(0, 128),
    tamerName: String(profile.tamerName).trim().slice(0, 24) || 'Tamer',
    characterId: safeCharacterId(profile.characterId),
    tamerLevel: safeInt(profile.tamerLevel, 1, 200, 1),
    tamerPhotoUrl: isValidAvatarPhotoDataUrl(profile.tamerPhotoUrl)
      ? profile.tamerPhotoUrl
      : null,
    digimonFormId: safeFormId(profile.digimonFormId),
    digimonName: String(profile.digimonName).trim().slice(0, 32) || 'Digimon',
    digimonLevel: safeInt(profile.digimonLevel, 1, 200, 1),
    hp,
    maxHp,
    mapId: safeMapId(profile.mapId),
    channelId: safeChannelId(profile.channelId),
  };
}

function parsePartyMember(raw: unknown, fallbackUid: string): PartyMemberRecord {
  const m = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const maxHp = safeInt(m.maxHp, 1, 1_000_000, 100);
  return {
    uid: String(m.uid ?? fallbackUid).slice(0, 128),
    tamerName: String(m.tamerName ?? 'Tamer').trim().slice(0, 24) || 'Tamer',
    characterId: safeCharacterId(m.characterId),
    tamerLevel: safeInt(m.tamerLevel, 1, 200, 1),
    tamerPhotoUrl: isValidAvatarPhotoDataUrl(m.tamerPhotoUrl)
      ? m.tamerPhotoUrl
      : null,
    digimonFormId: safeFormId(m.digimonFormId),
    digimonName: String(m.digimonName ?? 'Digimon').trim().slice(0, 32) || 'Digimon',
    digimonLevel: safeInt(m.digimonLevel, 1, 200, 1),
    hp: safeInt(m.hp, 0, maxHp, maxHp),
    maxHp,
    mapId: safeMapId(m.mapId),
    channelId: safeChannelId(m.channelId),
  };
}

function parsePartyDoc(
  partyId: string,
  raw: Record<string, unknown>
): PartyRecord {
  const memberUids = Array.isArray(raw.memberUids)
    ? raw.memberUids
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
        .slice(0, MAX_PARTY_MEMBERS)
    : [];
  const rawMembers =
    raw.members && typeof raw.members === 'object'
      ? (raw.members as Record<string, unknown>)
      : {};
  const members: Record<string, PartyMemberRecord> = {};
  for (const uid of memberUids) {
    members[uid] = parsePartyMember(rawMembers[uid], uid);
  }
  return {
    partyId: String(raw.partyId ?? partyId),
    leaderUid: String(raw.leaderUid ?? memberUids[0] ?? ''),
    leaderName: String(raw.leaderName ?? 'Líder').slice(0, 24),
    memberUids,
    members,
    createdAtMs: parseTimestampMs(raw.createdAt) ?? Date.now(),
    updatedAtMs: parseTimestampMs(raw.updatedAt) ?? Date.now(),
  };
}

/**
 * Authentic Digimon Masters Online (DMO) Party EXP sharing percentages
 * for up to 4 players in the SAME Map and SAME Channel (CH):
 * - 1 jogador (Solo / sem aliados no mesmo mapa e canal): 100%
 * - 2 jogadores no mesmo mapa e canal (Duo): 90% por membro (180% total)
 * - 3 jogadores no mesmo mapa e canal (Trio): 85% por membro (255% total)
 * - 4 jogadores no mesmo mapa e canal (Full Party): 80% por membro (320% total)
 * Each member's personal EXP boosters, Guild buffs, and Server EXP rate stack individually.
 */
export function calcPartyShareFactor(sameMapChannelPartyCount: number): number {
  if (sameMapChannelPartyCount <= 1) return 1.0;
  if (sameMapChannelPartyCount === 2) return 0.9;
  if (sameMapChannelPartyCount === 3) return 0.85;
  return 0.8;
}

export function getPartySharePercent(sameMapChannelPartyCount: number): number {
  return Math.round(calcPartyShareFactor(sameMapChannelPartyCount) * 100);
}

function readLocalRecord<T>(key: string): Record<string, T> {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, T>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalRecord<T>(key: string, data: Record<string, T>): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(LOCAL_PARTY_BUS_EVENT));
  } catch {
    // Ignore quota errors
  }
}

export function buildPartyInviteId(partyId: string, toUid: string): string {
  return `pinv_${partyId}_${toUid}`;
}

export function subscribeMyParty(
  actorUid: string,
  onUpdate: (party: PartyRecord | null) => void
): () => void {
  if (!actorUid) {
    onUpdate(null);
    return () => undefined;
  }

  if (!isFirestoreVerified()) {
    const emitLocal = () => {
      const parties = Object.values(readLocalRecord<PartyRecord>(LOCAL_PARTIES_KEY));
      const mine = parties.find((p) => p.memberUids.includes(actorUid)) ?? null;
      onUpdate(mine);
    };
    emitLocal();
    window.addEventListener(LOCAL_PARTY_BUS_EVENT, emitLocal);
    return () => window.removeEventListener(LOCAL_PARTY_BUS_EVENT, emitLocal);
  }

  const q = query(
    collection(db, 'parties'),
    where('memberUids', 'array-contains', actorUid),
    limit(1)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(null);
        return;
      }
      const docSnap = snapshot.docs[0];
      onUpdate(parsePartyDoc(docSnap.id, docSnap.data() as Record<string, unknown>));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'parties');
      } catch {
        // Non-fatal
      }
    }
  );
}

export function subscribeIncomingPartyInvites(
  actorUid: string,
  onUpdate: (invites: PartyInviteRecord[]) => void
): () => void {
  if (!actorUid) {
    onUpdate([]);
    return () => undefined;
  }

  if (!isFirestoreVerified()) {
    const emitLocal = () => {
      const all = Object.values(
        readLocalRecord<PartyInviteRecord>(LOCAL_INVITES_KEY)
      );
      onUpdate(
        all
          .filter((inv) => inv.toUid === actorUid && inv.status === 'pending')
          .sort((a, b) => b.createdAtMs - a.createdAtMs)
      );
    };
    emitLocal();
    window.addEventListener(LOCAL_PARTY_BUS_EVENT, emitLocal);
    return () => window.removeEventListener(LOCAL_PARTY_BUS_EVENT, emitLocal);
  }

  const q = query(
    collection(db, 'partyInvites'),
    where('toUid', '==', actorUid),
    limit(20)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: PartyInviteRecord[] = [];
      snapshot.forEach((d) => {
        const raw = (d.data() ?? {}) as Record<string, unknown>;
        if (raw.status !== 'pending') return;
        list.push({
          inviteId: String(raw.inviteId ?? d.id),
          partyId: String(raw.partyId ?? ''),
          fromUid: String(raw.fromUid ?? ''),
          fromName: String(raw.fromName ?? 'Tamer').slice(0, 24),
          fromTamerLevel: safeInt(raw.fromTamerLevel, 1, 200, 1),
          fromCharacterId: safeCharacterId(raw.fromCharacterId),
          fromPhotoUrl: isValidAvatarPhotoDataUrl(raw.fromPhotoUrl)
            ? raw.fromPhotoUrl
            : null,
          fromDigimonFormId: safeFormId(raw.fromDigimonFormId),
          toUid: String(raw.toUid ?? actorUid),
          toName: String(raw.toName ?? 'Tamer').slice(0, 24),
          status: 'pending',
          createdAtMs: parseTimestampMs(raw.createdAt) ?? Date.now(),
        });
      });
      list.sort((a, b) => b.createdAtMs - a.createdAtMs);
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'partyInvites');
      } catch {
        // Non-fatal
      }
    }
  );
}

export function subscribePartyXpEvents(
  partyId: string | null,
  selfUid: string,
  _joinedAtMs: number,
  onXpEvent: (evt: PartyXpEventRecord) => void
): () => void {
  if (!partyId || !isFirestoreVerified()) {
    return () => undefined;
  }

  const processedIds = new Set<string>();
  let initialized = false;
  const q = query(
    collection(db, 'parties', partyId, 'xpEvents'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      // Seed pre-existing kills on initial snapshot so we never replay old EXP
      // AND never drop new live kills due to client-vs-server clock drift.
      if (!initialized) {
        initialized = true;
        snapshot.docs.forEach((d) => {
          processedIds.add(d.id);
        });
        return;
      }

      const effectiveSelfUid = auth.currentUser?.uid ?? selfUid;

      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added' && change.type !== 'modified') return;
        const d = change.doc;
        if (processedIds.has(d.id)) return;
        const raw = (d.data() ?? {}) as Record<string, unknown>;
        const serverMs = parseTimestampMs(raw.createdAt);
        // Wait for serverTimestamp resolution on local pending writes
        if (serverMs === null && d.metadata.hasPendingWrites) return;
        processedIds.add(d.id);

        const killerUid = String(raw.killerUid ?? '');
        if (!killerUid || killerUid === effectiveSelfUid) return;

        onXpEvent({
          eventId: String(raw.eventId ?? d.id),
          killerUid,
          killerName: String(raw.killerName ?? 'Aliado').slice(0, 24),
          mapId: safeMapId(raw.mapId),
          channelId:
            raw.channelId !== undefined
              ? safeChannelId(raw.channelId)
              : undefined,
          mobName: String(raw.mobName ?? 'Digimon').slice(0, 32),
          mobLevel: safeInt(raw.mobLevel, 1, 200, 1),
          baseExp: safeInt(raw.baseExp, 1, 50_000_000, 10),
          createdAtMs: serverMs ?? Date.now(),
        });
      });
    },
    (error) => {
      try {
        handleFirestoreError(
          error,
          OperationType.LIST,
          `parties/${partyId}/xpEvents`
        );
      } catch {
        // Non-fatal
      }
    }
  );
}

export function subscribePartyChat(
  partyId: string | null,
  onMessage: (msg: PartyChatMessageRecord) => void
): () => void {
  if (!partyId || !isFirestoreVerified()) {
    return () => undefined;
  }

  const seenIds = new Set<string>();
  let initialized = false;
  const q = query(
    collection(db, 'parties', partyId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(25)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const ordered = [...snapshot.docs].reverse();
      if (!initialized) {
        initialized = true;
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
            text: String(raw.text ?? '').slice(0, 140),
            createdAtMs: createdMs,
            timestampLabel: formatClockLabel(createdMs),
          });
        }
        return;
      }

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
          text: String(raw.text ?? '').slice(0, 140),
          createdAtMs: createdMs,
          timestampLabel: formatClockLabel(createdMs),
        });
      }
    },
    (error) => {
      try {
        handleFirestoreError(
          error,
          OperationType.LIST,
          `parties/${partyId}/messages`
        );
      } catch {
        // Non-fatal
      }
    }
  );
}

export async function sendPartyInvite(params: {
  senderProfile: PartyActorProfile;
  currentParty: PartyRecord | null;
  targetUid: string;
  targetName: string;
}): Promise<{ ok: boolean; message: string; partyId?: string }> {
  const { senderProfile, currentParty, targetUid, targetName } = params;
  if (!targetUid || targetUid === senderProfile.uid) {
    return {
      ok: false,
      message: 'Você não pode convidar a si mesmo para a Party.',
    };
  }

  if (currentParty) {
    if (currentParty.leaderUid !== senderProfile.uid) {
      return {
        ok: false,
        message: 'Apenas o líder da Party pode convidar novos jogadores.',
      };
    }
    if (currentParty.memberUids.includes(targetUid)) {
      return {
        ok: false,
        message: `${targetName} já está na sua Party.`,
      };
    }
    if (currentParty.memberUids.length >= MAX_PARTY_MEMBERS) {
      return {
        ok: false,
        message: `Party cheia (${MAX_PARTY_MEMBERS}/${MAX_PARTY_MEMBERS} jogadores).`,
      };
    }
  }

  const sanitizedSender = sanitizePartyMember(senderProfile);

  if (!isFirestoreVerified()) {
    const parties = readLocalRecord<PartyRecord>(LOCAL_PARTIES_KEY);
    let partyId = currentParty?.partyId;
    if (!partyId || !parties[partyId]) {
      partyId = `party_${senderProfile.uid.slice(0, 10)}_${Date.now().toString(36)}`;
      parties[partyId] = {
        partyId,
        leaderUid: sanitizedSender.uid,
        leaderName: sanitizedSender.tamerName,
        memberUids: [sanitizedSender.uid],
        members: { [sanitizedSender.uid]: sanitizedSender },
        createdAtMs: Date.now(),
        updatedAtMs: Date.now(),
      };
      writeLocalRecord(LOCAL_PARTIES_KEY, parties);
    }

    const inviteId = buildPartyInviteId(partyId, targetUid);
    const invites = readLocalRecord<PartyInviteRecord>(LOCAL_INVITES_KEY);
    invites[inviteId] = {
      inviteId,
      partyId,
      fromUid: sanitizedSender.uid,
      fromName: sanitizedSender.tamerName,
      fromTamerLevel: sanitizedSender.tamerLevel,
      fromCharacterId: sanitizedSender.characterId,
      fromPhotoUrl: sanitizedSender.tamerPhotoUrl,
      fromDigimonFormId: sanitizedSender.digimonFormId,
      toUid: targetUid,
      toName: targetName.trim().slice(0, 24) || 'Tamer',
      status: 'pending',
      createdAtMs: Date.now(),
    };
    writeLocalRecord(LOCAL_INVITES_KEY, invites);
    return {
      ok: true,
      partyId,
      message: `Convite de Party enviado para ${targetName}!`,
    };
  }

  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return { ok: false, message: 'Conta não verificada para Party online.' };
  }
  await ensurePlayerDocBootstrapped(user);
  const authSender: PartyMemberRecord = { ...sanitizedSender, uid: user.uid };

  if (targetUid === user.uid) {
    return {
      ok: false,
      message: 'Você não pode convidar a si mesmo para a Party.',
    };
  }

  let partyId = currentParty?.partyId;
  if (!partyId) {
    // Check if the sender already has an active party in Firestore (prevents duplicate/orphan parties on rapid clicks)
    try {
      const existingSnap = await getDocs(
        query(
          collection(db, 'parties'),
          where('memberUids', 'array-contains', user.uid),
          limit(1)
        )
      );
      if (!existingSnap.empty) {
        const existingDoc = existingSnap.docs[0];
        const existingParty = parsePartyDoc(
          existingDoc.id,
          existingDoc.data() as Record<string, unknown>
        );
        if (existingParty.leaderUid !== user.uid) {
          return {
            ok: false,
            message: 'Apenas o líder da Party pode convidar novos jogadores.',
          };
        }
        if (existingParty.memberUids.includes(targetUid)) {
          return {
            ok: false,
            message: `${targetName} já está na sua Party.`,
          };
        }
        if (existingParty.memberUids.length >= MAX_PARTY_MEMBERS) {
          return {
            ok: false,
            message: `Party cheia (${MAX_PARTY_MEMBERS}/${MAX_PARTY_MEMBERS} jogadores).`,
          };
        }
        partyId = existingParty.partyId;
      }
    } catch {
      // Proceed to create a new party if lookup fails
    }
  }

  if (!partyId) {
    partyId = `party_${user.uid.slice(0, 12)}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const partyRef = doc(db, 'parties', partyId);
    try {
      await setDoc(partyRef, {
        partyId,
        leaderUid: authSender.uid,
        leaderName: authSender.tamerName,
        memberUids: [authSender.uid],
        members: {
          [authSender.uid]: authSender,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.CREATE, `parties/${partyId}`);
      } catch {
        // Logged
      }
      return {
        ok: false,
        message: 'Não foi possível criar a Party no servidor.',
      };
    }
  }

  const inviteId = buildPartyInviteId(partyId, targetUid);
  const inviteRef = doc(db, 'partyInvites', inviteId);
  const invitePayload = {
    inviteId,
    partyId,
    fromUid: authSender.uid,
    fromName: authSender.tamerName,
    fromTamerLevel: authSender.tamerLevel,
    fromCharacterId: authSender.characterId,
    fromPhotoUrl: authSender.tamerPhotoUrl,
    fromDigimonFormId: authSender.digimonFormId,
    toUid: targetUid,
    toName: targetName.trim().slice(0, 24) || 'Tamer',
    status: 'pending' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  try {
    try {
      await setDoc(inviteRef, invitePayload);
    } catch {
      // Stale invite with same deterministic ID may exist; delete and recreate once
      await deleteDoc(inviteRef);
      await setDoc(inviteRef, invitePayload);
    }
    return {
      ok: true,
      partyId,
      message: `Convite de Party enviado para ${targetName}!`,
    };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, `partyInvites/${inviteId}`);
    } catch {
      // Logged
    }
    return {
      ok: false,
      message: `Não foi possível enviar convite para ${targetName}.`,
    };
  }
}

export async function acceptPartyInvite(params: {
  invite: PartyInviteRecord;
  joinerProfile: PartyActorProfile;
  currentParty: PartyRecord | null;
}): Promise<{ ok: boolean; message: string }> {
  const { invite, joinerProfile, currentParty } = params;
  const sanitizedJoiner = sanitizePartyMember(joinerProfile);

  if (currentParty && currentParty.partyId !== invite.partyId) {
    if (currentParty.memberUids.length > 1) {
      return {
        ok: false,
        message: 'Saia da sua Party atual antes de aceitar outro convite.',
      };
    }
    // Solo party -> leave/delete it automatically before joining the new party
    await leaveOrKickParty({
      party: currentParty,
      actorUid: joinerProfile.uid,
      targetUid: joinerProfile.uid,
    });
  }

  if (!isFirestoreVerified()) {
    const parties = readLocalRecord<PartyRecord>(LOCAL_PARTIES_KEY);
    const targetParty = parties[invite.partyId];
    if (!targetParty) {
      return { ok: false, message: 'Esta Party não existe mais.' };
    }
    if (targetParty.memberUids.length >= MAX_PARTY_MEMBERS) {
      return {
        ok: false,
        message: `A Party já está lotada (${MAX_PARTY_MEMBERS}/${MAX_PARTY_MEMBERS}).`,
      };
    }
    if (!targetParty.memberUids.includes(sanitizedJoiner.uid)) {
      targetParty.memberUids = [...targetParty.memberUids, sanitizedJoiner.uid];
    }
    targetParty.members[sanitizedJoiner.uid] = sanitizedJoiner;
    targetParty.updatedAtMs = Date.now();
    parties[invite.partyId] = targetParty;
    writeLocalRecord(LOCAL_PARTIES_KEY, parties);

    const invites = readLocalRecord<PartyInviteRecord>(LOCAL_INVITES_KEY);
    delete invites[invite.inviteId];
    writeLocalRecord(LOCAL_INVITES_KEY, invites);
    return {
      ok: true,
      message: `Você entrou na Party de ${targetParty.leaderName}!`,
    };
  }

  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return { ok: false, message: 'Sessão não verificada.' };
  }
  await ensurePlayerDocBootstrapped(user);
  const authJoiner: PartyMemberRecord = { ...sanitizedJoiner, uid: user.uid };

  // Also ensure any stale solo party on Firestore is cleaned up before joining the new party
  if (!currentParty) {
    try {
      const existingSnap = await getDocs(
        query(
          collection(db, 'parties'),
          where('memberUids', 'array-contains', user.uid),
          limit(1)
        )
      );
      if (!existingSnap.empty) {
        const existingDoc = existingSnap.docs[0];
        if (existingDoc.id !== invite.partyId) {
          const existingParty = parsePartyDoc(
            existingDoc.id,
            existingDoc.data() as Record<string, unknown>
          );
          if (existingParty.memberUids.length > 1) {
            return {
              ok: false,
              message: 'Saia da sua Party atual antes de aceitar outro convite.',
            };
          }
          await deleteDoc(doc(db, 'parties', existingDoc.id)).catch(() => undefined);
        }
      }
    } catch {
      // Non-fatal pre-check
    }
  }

  const partyRef = doc(db, 'parties', invite.partyId);
  const inviteRef = doc(db, 'partyInvites', invite.inviteId);

  try {
    const txRes = await runTransaction(db, async (tx) => {
      const partySnap = await tx.get(partyRef);
      if (!partySnap.exists()) {
        return { ok: false, reason: 'Esta Party já foi encerrada.' };
      }
      const data = partySnap.data() as Record<string, unknown>;
      const existingUids = Array.isArray(data.memberUids)
        ? Array.from(
            new Set(
              (data.memberUids as unknown[]).filter(
                (id): id is string => typeof id === 'string' && id.length > 0
              )
            )
          )
        : [];
      if (existingUids.includes(authJoiner.uid)) {
        return { ok: true, reason: 'Já na Party.' };
      }
      if (existingUids.length >= MAX_PARTY_MEMBERS) {
        return {
          ok: false,
          reason: `Party cheia (${MAX_PARTY_MEMBERS}/${MAX_PARTY_MEMBERS} jogadores).`,
        };
      }
      const prevMembers =
        data.members && typeof data.members === 'object'
          ? (data.members as Record<string, unknown>)
          : {};
      tx.update(partyRef, {
        memberUids: [...existingUids, authJoiner.uid],
        members: {
          ...prevMembers,
          [authJoiner.uid]: authJoiner,
        },
        updatedAt: serverTimestamp(),
      });
      return { ok: true, reason: 'joined' };
    });

    if (!txRes.ok) {
      await deleteDoc(inviteRef).catch(() => undefined);
      return { ok: false, message: txRes.reason };
    }

    await deleteDoc(inviteRef).catch(async () => {
      await updateDoc(inviteRef, {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      }).catch(() => undefined);
    });

    return {
      ok: true,
      message: `Você entrou na Party de ${invite.fromName}!`,
    };
  } catch (error) {
    const rawMsg = error instanceof Error ? error.message : String(error);
    try {
      handleFirestoreError(error, OperationType.WRITE, `parties/${invite.partyId}`);
    } catch {
      // Logged
    }
    if (/permission|denied/i.test(rawMsg)) {
      return {
        ok: false,
        message:
          'O banco recusou a entrada na Party. Publique o novo firestore.rules no Firebase Console.',
      };
    }
    return {
      ok: false,
      message: 'Não foi possível entrar na Party. O convite pode ter expirado.',
    };
  }
}

export async function declinePartyInvite(inviteId: string): Promise<void> {
  if (!inviteId) return;
  if (!isFirestoreVerified()) {
    const invites = readLocalRecord<PartyInviteRecord>(LOCAL_INVITES_KEY);
    delete invites[inviteId];
    writeLocalRecord(LOCAL_INVITES_KEY, invites);
    return;
  }

  try {
    await deleteDoc(doc(db, 'partyInvites', inviteId));
  } catch {
    try {
      await updateDoc(doc(db, 'partyInvites', inviteId), {
        status: 'declined',
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Ignore cleanup failure
    }
  }
}

export async function leaveOrKickParty(params: {
  party: PartyRecord;
  actorUid: string;
  targetUid: string;
}): Promise<{ ok: boolean; message: string }> {
  const { party, actorUid, targetUid } = params;
  const isSelfLeave = actorUid === targetUid;
  const isLeader = party.leaderUid === actorUid;

  if (!isSelfLeave && !isLeader) {
    return { ok: false, message: 'Apenas o líder pode remover membros.' };
  }

  const remainingUids = party.memberUids.filter((u) => u !== targetUid);
  const nextMembers: Record<string, PartyMemberRecord> = {};
  for (const uid of remainingUids) {
    if (party.members[uid]) nextMembers[uid] = party.members[uid];
  }

  if (!isFirestoreVerified()) {
    const parties = readLocalRecord<PartyRecord>(LOCAL_PARTIES_KEY);
    if (remainingUids.length === 0) {
      delete parties[party.partyId];
    } else {
      const nextLeaderUid =
        targetUid === party.leaderUid ? remainingUids[0] : party.leaderUid;
      const nextLeaderName =
        nextMembers[nextLeaderUid]?.tamerName ?? party.leaderName;
      parties[party.partyId] = {
        ...party,
        leaderUid: nextLeaderUid,
        leaderName: nextLeaderName,
        memberUids: remainingUids,
        members: nextMembers,
        updatedAtMs: Date.now(),
      };
    }
    writeLocalRecord(LOCAL_PARTIES_KEY, parties);
    return {
      ok: true,
      message: isSelfLeave
        ? 'Você saiu da Party.'
        : `${party.members[targetUid]?.tamerName ?? 'Jogador'} foi removido da Party.`,
    };
  }

  const partyRef = doc(db, 'parties', party.partyId);
  try {
    if (remainingUids.length === 0) {
      await deleteDoc(partyRef);
      return { ok: true, message: 'Party encerrada.' };
    }

    if (targetUid === party.leaderUid) {
      const nextLeaderUid = remainingUids[0];
      const nextLeaderName =
        nextMembers[nextLeaderUid]?.tamerName ?? party.leaderName;
      await updateDoc(partyRef, {
        leaderUid: nextLeaderUid,
        leaderName: nextLeaderName,
        memberUids: remainingUids,
        members: nextMembers,
        updatedAt: serverTimestamp(),
      });
      return { ok: true, message: 'Você saiu da Party e transferiu a liderança.' };
    }

    await updateDoc(partyRef, {
      memberUids: remainingUids,
      members: nextMembers,
      updatedAt: serverTimestamp(),
    });
    return {
      ok: true,
      message: isSelfLeave
        ? 'Você saiu da Party.'
        : `${party.members[targetUid]?.tamerName ?? 'Jogador'} foi removido da Party.`,
    };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, `parties/${party.partyId}`);
    } catch {
      // Logged
    }
    return { ok: false, message: 'Erro ao atualizar membros da Party.' };
  }
}

export async function syncLocalMemberInParty(
  partyId: string,
  profile: PartyActorProfile
): Promise<void> {
  if (!partyId || !profile.uid) return;
  const sanitized = sanitizePartyMember(profile);

  if (!isFirestoreVerified()) {
    const parties = readLocalRecord<PartyRecord>(LOCAL_PARTIES_KEY);
    const cur = parties[partyId];
    if (!cur || !cur.memberUids.includes(sanitized.uid)) return;
    cur.members[sanitized.uid] = sanitized;
    cur.updatedAtMs = Date.now();
    writeLocalRecord(LOCAL_PARTIES_KEY, parties);
    return;
  }

  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const authMember: PartyMemberRecord = { ...sanitized, uid: user.uid };

  try {
    await updateDoc(doc(db, 'parties', partyId), {
      [`members.${user.uid}`]: authMember,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Non-fatal periodic member vitals sync
  }
}

export async function publishPartyXpEvent(params: {
  partyId: string;
  killerUid: string;
  killerName: string;
  mapId: SharedWorldMapId;
  channelId: WorldChannelId;
  mobName: string;
  mobLevel: number;
  baseExp: number;
}): Promise<void> {
  if (!params.partyId || !isFirestoreVerified()) return;
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const eventId = `pxp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `parties/${params.partyId}/xpEvents/${eventId}`;
  const eventRef = doc(db, 'parties', params.partyId, 'xpEvents', eventId);
  const basePayload = {
    eventId,
    killerUid: user.uid,
    killerName: params.killerName.trim().slice(0, 24) || 'Aliado',
    mapId: safeMapId(params.mapId),
    mobName: params.mobName.trim().slice(0, 32) || 'Digimon',
    mobLevel: safeInt(params.mobLevel, 1, 200, 1),
    baseExp: safeInt(params.baseExp, 1, 50_000_000, 10),
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(eventRef, {
      ...basePayload,
      channelId: safeChannelId(params.channelId),
    });
  } catch (error) {
    const rawMsg = error instanceof Error ? error.message : String(error);
    // Graceful fallback if production firestore.rules hasn't been republished with channelId yet
    if (/permission|denied/i.test(rawMsg)) {
      try {
        await setDoc(eventRef, basePayload);
        return;
      } catch {
        // Fall through to structured error logging
      }
    }
    try {
      handleFirestoreError(error, OperationType.CREATE, path);
    } catch {
      // Non-fatal
    }
  }
}

export async function sendPartyChatMessage(params: {
  partyId: string;
  senderUid: string;
  senderName: string;
  isGmSender: boolean;
  text: string;
}): Promise<boolean> {
  const clean = params.text.trim().slice(0, 140);
  if (!clean || !params.partyId) return false;
  if (!isFirestoreVerified()) return true;

  const user = auth.currentUser;
  if (!user || !user.emailVerified) return false;

  const messageId = `pmsg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `parties/${params.partyId}/messages/${messageId}`;
  try {
    await setDoc(doc(db, 'parties', params.partyId, 'messages', messageId), {
      messageId,
      senderUid: user.uid,
      senderName: params.senderName.trim().slice(0, 24) || 'Tamer',
      isGmSender: Boolean(params.isGmSender),
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

/**
 * Helper to fetch a party snapshot directly once if needed.
 */
export async function fetchPartyById(
  partyId: string
): Promise<PartyRecord | null> {
  if (!partyId || !isFirestoreVerified()) return null;
  try {
    const snap = await getDoc(doc(db, 'parties', partyId));
    if (!snap.exists()) return null;
    return parsePartyDoc(snap.id, snap.data() as Record<string, unknown>);
  } catch {
    return null;
  }
}
