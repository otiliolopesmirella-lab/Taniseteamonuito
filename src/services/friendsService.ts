import type { DigimonFormId } from '../types/digimon';
import type { RemoteWorldPlayer } from './worldPresenceService';

// Unlimited friends supported per player account.

export interface FriendRecord {
  id: string;
  uid?: string;
  tamerName: string;
  level: number;
  digimonFormId: DigimonFormId;
  addedAt: number;
}

export interface FriendRequestRecord {
  id: string;
  uid?: string;
  tamerName: string;
  level: number;
  digimonFormId: DigimonFormId;
  direction: 'incoming' | 'outgoing';
  createdAt: number;
}

export interface BlockedPlayerRecord {
  id: string;
  uid?: string;
  tamerName: string;
  level: number;
  digimonFormId: DigimonFormId;
  blockedAt: number;
}

export interface FriendsState {
  friends: FriendRecord[];
  requests: FriendRequestRecord[];
  blocked: BlockedPlayerRecord[];
}

const STORAGE_PREFIX = 'dw_friends_v1_';

function normalizeKey(accountKey: string): string {
  const clean = accountKey.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `${STORAGE_PREFIX}${clean || 'guest'}`;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function createEmptyFriendsState(): FriendsState {
  return {
    friends: [],
    requests: [],
    blocked: [],
  };
}

export function loadFriendsState(accountKey: string): FriendsState {
  try {
    const raw = window.localStorage.getItem(normalizeKey(accountKey));
    if (!raw) return createEmptyFriendsState();
    const parsed = JSON.parse(raw) as Partial<FriendsState>;
    return {
      friends: Array.isArray(parsed.friends) ? parsed.friends : [],
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
      blocked: Array.isArray(parsed.blocked) ? parsed.blocked : [],
    };
  } catch {
    return createEmptyFriendsState();
  }
}

export function saveFriendsState(accountKey: string, state: FriendsState): void {
  try {
    window.localStorage.setItem(normalizeKey(accountKey), JSON.stringify(state));
  } catch {
    // Ignore storage quota restrictions
  }
}

export function sendFriendRequest(
  accountKey: string,
  state: FriendsState,
  targetName: string,
  selfTamerName: string,
  onlinePlayers: readonly RemoteWorldPlayer[]
): { ok: boolean; message: string; next: FriendsState } {
  const clean = targetName.trim();
  if (clean.length < 2) {
    return {
      ok: false,
      message: 'Digite o nome de um Tamer (mínimo 2 caracteres).',
      next: state,
    };
  }
  if (normalizeName(clean) === normalizeName(selfTamerName)) {
    return {
      ok: false,
      message: 'Você não pode adicionar a si mesmo como amigo.',
      next: state,
    };
  }

  const key = normalizeName(clean);
  if (state.friends.some((f) => normalizeName(f.tamerName) === key)) {
    return {
      ok: false,
      message: `${clean} já está na sua Lista de Amigos.`,
      next: state,
    };
  }
  if (state.blocked.some((b) => normalizeName(b.tamerName) === key)) {
    return {
      ok: false,
      message: `${clean} está bloqueado. Desbloqueie antes de enviar pedido.`,
      next: state,
    };
  }

  const livePlayer = onlinePlayers.find(
    (p) => normalizeName(p.tamerName) === key
  );

  // If there is already an incoming request from this player, accept directly!
  const existingIncoming = state.requests.find(
    (r) => normalizeName(r.tamerName) === key && r.direction === 'incoming'
  );
  if (existingIncoming) {
    return acceptFriendRequest(accountKey, state, existingIncoming.id);
  }

  if (state.requests.some((r) => normalizeName(r.tamerName) === key)) {
    return {
      ok: false,
      message: `Já existe uma solicitação pendente para ${clean}.`,
      next: state,
    };
  }

  // If the Tamer is online right now in the shared world, add directly as friend
  // and also keep outgoing/pending flow clear for offline Tamers
  if (livePlayer) {
    const added: FriendRecord = {
      id: `fr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      uid: livePlayer.uid,
      tamerName: livePlayer.tamerName,
      level: livePlayer.tamerLevel,
      digimonFormId: livePlayer.digimonFormId,
      addedAt: Date.now(),
    };
    const next: FriendsState = {
      ...state,
      friends: [added, ...state.friends],
    };
    saveFriendsState(accountKey, next);
    return {
      ok: true,
      message: `${livePlayer.tamerName} (Online) adicionado à sua Lista de Amigos!`,
      next,
    };
  }

  const newReq: FriendRequestRecord = {
    id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    tamerName: clean,
    level: 1,
    digimonFormId: 'agumon',
    direction: 'outgoing',
    createdAt: Date.now(),
  };

  const next: FriendsState = {
    ...state,
    requests: [newReq, ...state.requests],
  };
  saveFriendsState(accountKey, next);
  return {
    ok: true,
    message: `Pedido de amizade enviado para ${clean}!`,
    next,
  };
}

export function acceptFriendRequest(
  accountKey: string,
  state: FriendsState,
  requestId: string
): { ok: boolean; message: string; next: FriendsState } {
  const req = state.requests.find((r) => r.id === requestId);
  if (!req) {
    return { ok: false, message: 'Solicitação não encontrada.', next: state };
  }
  const friend: FriendRecord = {
    id: `fr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    uid: req.uid,
    tamerName: req.tamerName,
    level: req.level,
    digimonFormId: req.digimonFormId,
    addedAt: Date.now(),
  };
  const next: FriendsState = {
    ...state,
    friends: [friend, ...state.friends],
    requests: state.requests.filter((r) => r.id !== requestId),
  };
  saveFriendsState(accountKey, next);
  return {
    ok: true,
    message: `${req.tamerName} agora faz parte da sua Lista de Amigos!`,
    next,
  };
}

export function rejectOrCancelFriendRequest(
  accountKey: string,
  state: FriendsState,
  requestId: string
): { ok: boolean; message: string; next: FriendsState } {
  const req = state.requests.find((r) => r.id === requestId);
  if (!req) return { ok: false, message: 'Solicitação não encontrada.', next: state };
  const next: FriendsState = {
    ...state,
    requests: state.requests.filter((r) => r.id !== requestId),
  };
  saveFriendsState(accountKey, next);
  return {
    ok: true,
    message:
      req.direction === 'outgoing'
        ? `Pedido para ${req.tamerName} cancelado.`
        : `Solicitação de ${req.tamerName} recusada.`,
    next,
  };
}

export function removeFriend(
  accountKey: string,
  state: FriendsState,
  friendId: string
): { ok: boolean; message: string; next: FriendsState } {
  const target = state.friends.find((f) => f.id === friendId);
  if (!target) return { ok: false, message: 'Amigo não encontrado.', next: state };
  const next: FriendsState = {
    ...state,
    friends: state.friends.filter((f) => f.id !== friendId),
  };
  saveFriendsState(accountKey, next);
  return {
    ok: true,
    message: `${target.tamerName} removido da Lista de Amigos.`,
    next,
  };
}

export function blockPlayer(
  accountKey: string,
  state: FriendsState,
  target: {
    uid?: string;
    tamerName: string;
    level?: number;
    digimonFormId?: DigimonFormId;
  }
): { ok: boolean; message: string; next: FriendsState } {
  const clean = target.tamerName.trim();
  if (!clean) return { ok: false, message: 'Nome inválido.', next: state };
  const key = normalizeName(clean);
  if (state.blocked.some((b) => normalizeName(b.tamerName) === key)) {
    return { ok: false, message: `${clean} já está bloqueado.`, next: state };
  }
  const entry: BlockedPlayerRecord = {
    id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    uid: target.uid,
    tamerName: clean,
    level: target.level ?? 1,
    digimonFormId: target.digimonFormId ?? 'agumon',
    blockedAt: Date.now(),
  };
  const next: FriendsState = {
    friends: state.friends.filter((f) => normalizeName(f.tamerName) !== key),
    requests: state.requests.filter((r) => normalizeName(r.tamerName) !== key),
    blocked: [entry, ...state.blocked],
  };
  saveFriendsState(accountKey, next);
  return {
    ok: true,
    message: `${clean} foi bloqueado.`,
    next,
  };
}

export function unblockPlayer(
  accountKey: string,
  state: FriendsState,
  blockedId: string
): { ok: boolean; message: string; next: FriendsState } {
  const target = state.blocked.find((b) => b.id === blockedId);
  if (!target) return { ok: false, message: 'Jogador não encontrado.', next: state };
  const next: FriendsState = {
    ...state,
    blocked: state.blocked.filter((b) => b.id !== blockedId),
  };
  saveFriendsState(accountKey, next);
  return {
    ok: true,
    message: `${target.tamerName} foi desbloqueado.`,
    next,
  };
}
