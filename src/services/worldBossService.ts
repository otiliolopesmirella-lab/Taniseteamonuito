import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { ensurePlayerDocBootstrapped } from './cloudSaveService';

export const KUWAGAMON_BOSS_ID = 'data-forest-kuwagamon' as const;
// Calibrado para ~12 jogadores Nv. 20 (~5.500 DPS combinados -> ~90s de Raid Boss)
export const KUWAGAMON_MAX_HP = 500_000;
export const KUWAGAMON_RESPAWN_MS = 3_600_000; // 1 hour respawn cycle

export {
  BOSS_AGGRO_DETECT_RADIUS_PX,
  BOSS_AOE_SKILL_COOLDOWN_SEC,
  BOSS_AOE_SKILL_RADIUS_PX,
  BOSS_TARGET_ROTATION_MS,
  selectRaidBossPrimaryTarget,
  type RaidBossAttackerCandidate,
  type RaidBossTargetSelection,
} from './worldBossRotation';

export interface WorldBossContributor {
  tamerName: string;
  damage: number;
}

export interface WorldBossLiveState {
  bossId: string;
  mapId: 'data-forest';
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  respawnAtMs: number;
  lastAttackerName: string;
  lastHitAtMs: number;
  contributors: Record<string, WorldBossContributor>;
  defeatedCount: number;
}

function createDefaultKuwagamonState(defeatedCount = 0): WorldBossLiveState {
  return {
    bossId: KUWAGAMON_BOSS_ID,
    mapId: 'data-forest',
    name: 'Kuwagamon',
    level: 20,
    hp: KUWAGAMON_MAX_HP,
    maxHp: KUWAGAMON_MAX_HP,
    alive: true,
    respawnAtMs: 0,
    lastAttackerName: '',
    lastHitAtMs: 0,
    contributors: {},
    defeatedCount,
  };
}

// ============================================================================
// Reactive Local/Fallback Boss State (powers Quick Test / offline mode AND
// guarantees instant defeat/respawn transitions if Firestore is offline)
// ============================================================================

const localBossStates = new Map<string, WorldBossLiveState>();
const localSubscribers = new Map<string, Set<(state: WorldBossLiveState) => void>>();

function getOrInitLocalBossState(bossId: string): WorldBossLiveState {
  const existing = localBossStates.get(bossId);
  if (existing) {
    if (!existing.alive && existing.respawnAtMs > 0 && Date.now() >= existing.respawnAtMs) {
      const respawned = createDefaultKuwagamonState(existing.defeatedCount);
      localBossStates.set(bossId, respawned);
      return respawned;
    }
    return existing;
  }
  const initial = createDefaultKuwagamonState();
  localBossStates.set(bossId, initial);
  return initial;
}

function emitBossStateToSubscribers(bossId: string, state: WorldBossLiveState): void {
  localBossStates.set(bossId, state);
  const subs = localSubscribers.get(bossId);
  if (!subs) return;
  for (const cb of subs) {
    cb(state);
  }
}

function applyLocalBossDamage(
  bossId: string,
  tamerName: string,
  damage: number
): void {
  const current = getOrInitLocalBossState(bossId);
  if (!current.alive || current.hp <= 0) return;

  const dmg = Math.max(1, Math.round(damage));
  const cleanName = tamerName.trim().slice(0, 24) || 'Tamer';
  const nextHp = Math.max(0, current.hp - dmg);
  const killed = nextHp <= 0;
  const nowMs = Date.now();

  const prevContrib = current.contributors.local;
  const nextState: WorldBossLiveState = {
    ...current,
    hp: nextHp,
    alive: !killed,
    respawnAtMs: killed ? nowMs + KUWAGAMON_RESPAWN_MS : 0,
    lastAttackerName: cleanName,
    lastHitAtMs: nowMs,
    contributors: {
      ...current.contributors,
      local: {
        tamerName: cleanName,
        damage: Math.min(10_000_000, (prevContrib?.damage ?? 0) + dmg),
      },
    },
    defeatedCount: killed ? current.defeatedCount + 1 : current.defeatedCount,
  };

  emitBossStateToSubscribers(bossId, nextState);
}

function parseContributors(raw: unknown): Record<string, WorldBossContributor> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, WorldBossContributor> = {};
  const entries = Object.entries(raw as Record<string, unknown>).slice(0, 32);
  for (const [uid, val] of entries) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) continue;
    const obj = val as Record<string, unknown>;
    const tamerName = String(obj.tamerName ?? 'Tamer').trim().slice(0, 24) || 'Tamer';
    const damage =
      typeof obj.damage === 'number' && Number.isFinite(obj.damage)
        ? Math.max(0, Math.min(10_000_000, Math.round(obj.damage)))
        : 0;
    out[uid] = { tamerName, damage };
  }
  return out;
}

function parseBossDoc(
  bossId: string,
  raw: Record<string, unknown>
): WorldBossLiveState {
  const targetMaxHp = bossId === KUWAGAMON_BOSS_ID ? KUWAGAMON_MAX_HP : null;
  const rawMaxHp =
    typeof raw.maxHp === 'number' && Number.isFinite(raw.maxHp) && raw.maxHp >= 100
      ? Math.round(raw.maxHp)
      : KUWAGAMON_MAX_HP;
  const rawHp =
    typeof raw.hp === 'number' && Number.isFinite(raw.hp)
      ? Math.max(0, Math.min(rawMaxHp, Math.round(raw.hp)))
      : rawMaxHp;
  const maxHp = targetMaxHp ?? rawMaxHp;
  const hp =
    targetMaxHp !== null && rawMaxHp !== targetMaxHp
      ? rawHp <= 0
        ? 0
        : Math.max(1, Math.min(maxHp, Math.round((rawHp / rawMaxHp) * maxHp)))
      : rawHp;
  const alive = typeof raw.alive === 'boolean' ? raw.alive && hp > 0 : hp > 0;
  return {
    bossId,
    mapId: 'data-forest',
    name:
      typeof raw.name === 'string' && raw.name.trim().length > 0
        ? raw.name.trim().slice(0, 32)
        : 'Kuwagamon',
    level:
      typeof raw.level === 'number' && Number.isFinite(raw.level)
        ? Math.max(1, Math.min(200, Math.round(raw.level)))
        : 20,
    hp: alive ? Math.max(1, hp) : 0,
    maxHp,
    alive,
    respawnAtMs:
      typeof raw.respawnAtMs === 'number' && Number.isFinite(raw.respawnAtMs)
        ? Math.max(0, Math.round(raw.respawnAtMs))
        : 0,
    lastAttackerName:
      typeof raw.lastAttackerName === 'string'
        ? raw.lastAttackerName.trim().slice(0, 24)
        : '',
    lastHitAtMs:
      typeof raw.lastHitAtMs === 'number' && Number.isFinite(raw.lastHitAtMs)
        ? Math.max(0, Math.round(raw.lastHitAtMs))
        : 0,
    contributors: parseContributors(raw.contributors),
    defeatedCount:
      typeof raw.defeatedCount === 'number' && Number.isFinite(raw.defeatedCount)
        ? Math.max(0, Math.round(raw.defeatedCount))
        : 0,
  };
}

async function ensureBossDocumentExists(bossId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const ready = await ensurePlayerDocBootstrapped(user);
  if (!ready) return;

  const ref = doc(db, 'worldBosses', bossId);
  const def = createDefaultKuwagamonState();
  try {
    await setDoc(ref, {
      ...def,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Another player may have initialized it milliseconds earlier — ignore cleanly
  }
}

async function syncWorldBossMaxHpIfOutdated(bossId: string): Promise<void> {
  if (bossId !== KUWAGAMON_BOSS_ID) return;
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const ready = await ensurePlayerDocBootstrapped(user);
  if (!ready) return;

  const ref = doc(db, 'worldBosses', bossId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const rawData = (snap.data() ?? {}) as Record<string, unknown>;
      const rawMaxHp =
        typeof rawData.maxHp === 'number' && Number.isFinite(rawData.maxHp)
          ? Math.round(rawData.maxHp)
          : 0;
      if (rawMaxHp === KUWAGAMON_MAX_HP) return;
      const scaled = parseBossDoc(bossId, rawData);
      tx.update(ref, {
        hp: scaled.alive ? scaled.hp : 0,
        maxHp: KUWAGAMON_MAX_HP,
        updatedAt: serverTimestamp(),
      });
    });
  } catch {
    // Another client or rule check already handled it — ignore cleanly
  }
}

/**
 * Subscribes in real time to a shared multiplayer Raid World Boss document
 * (`/worldBosses/{bossId}`). Falls back seamlessly to the reactive local boss
 * state in Quick Test / unauthenticated sessions so boss kills & respawns
 * always execute cleanly.
 */
export function subscribeWorldBoss(
  bossId: string,
  onUpdate: (state: WorldBossLiveState) => void
): Unsubscribe {
  let subs = localSubscribers.get(bossId);
  if (!subs) {
    subs = new Set();
    localSubscribers.set(bossId, subs);
  }
  subs.add(onUpdate);

  const cleanupLocalSub = () => {
    subs?.delete(onUpdate);
  };

  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    onUpdate(getOrInitLocalBossState(bossId));
    return cleanupLocalSub;
  }

  let attemptedCreate = false;
  let attemptedMaxHpSync = false;
  const ref = doc(db, 'worldBosses', bossId);

  const unsubSnapshot = onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        const def = getOrInitLocalBossState(bossId);
        onUpdate(def);
        if (!attemptedCreate) {
          attemptedCreate = true;
          void ensureBossDocumentExists(bossId);
        }
        return;
      }
      const rawData = (snap.data() ?? {}) as Record<string, unknown>;
      if (
        !attemptedMaxHpSync &&
        bossId === KUWAGAMON_BOSS_ID &&
        typeof rawData.maxHp === 'number' &&
        Math.round(rawData.maxHp) !== KUWAGAMON_MAX_HP
      ) {
        attemptedMaxHpSync = true;
        void syncWorldBossMaxHpIfOutdated(bossId);
      }
      const parsed = parseBossDoc(bossId, rawData);
      localBossStates.set(bossId, parsed);
      onUpdate(parsed);
    },
    (error) => {
      onUpdate(getOrInitLocalBossState(bossId));
      try {
        handleFirestoreError(error, OperationType.GET, `worldBosses/${bossId}`);
      } catch {
        // Log structured error without crashing the game canvas
      }
    }
  );

  return () => {
    cleanupLocalSub();
    unsubSnapshot();
  };
}

// ============================================================================
// Batched Transactional Raid Damage Submission (prevents Firestore spam while
// keeping multi-player boss HP 100% accurate and synchronized)
// ============================================================================

interface PendingDamageBatch {
  damage: number;
  tamerName: string;
  timer: number | null;
  inFlight: boolean;
  urgentFlush: boolean;
}

const pendingDamageByBoss = new Map<string, PendingDamageBatch>();

async function flushBossDamageBatch(bossId: string): Promise<void> {
  const entry = pendingDamageByBoss.get(bossId);
  if (!entry || entry.inFlight || entry.damage <= 0) return;

  const dmgToApply = Math.min(100_000, Math.max(1, Math.round(entry.damage)));
  const cleanName = entry.tamerName.trim().slice(0, 24) || 'Tamer';
  entry.damage = 0;
  entry.urgentFlush = false;

  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    applyLocalBossDamage(bossId, cleanName, dmgToApply);
    return;
  }

  const ready = await ensurePlayerDocBootstrapped(user);
  if (!ready) {
    applyLocalBossDamage(bossId, cleanName, dmgToApply);
    return;
  }

  entry.inFlight = true;

  const ref = doc(db, 'worldBosses', bossId);
  const path = `worldBosses/${bossId}`;

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const nowMs = Date.now();

      if (!snap.exists()) {
        const def = createDefaultKuwagamonState();
        const nextHp = Math.max(0, def.maxHp - dmgToApply);
        const killed = nextHp <= 0;
        tx.set(ref, {
          ...def,
          hp: nextHp,
          alive: !killed,
          respawnAtMs: killed ? nowMs + KUWAGAMON_RESPAWN_MS : 0,
          lastAttackerName: cleanName,
          lastHitAtMs: nowMs,
          contributors: {
            [user.uid]: { tamerName: cleanName, damage: dmgToApply },
          },
          defeatedCount: killed ? 1 : 0,
          updatedAt: serverTimestamp(),
        });
        return;
      }

      const rawData = (snap.data() ?? {}) as Record<string, unknown>;
      const current = parseBossDoc(bossId, rawData);
      if (!current.alive || current.hp <= 0) {
        if (rawData.alive === true) {
          tx.update(ref, {
            hp: 0,
            maxHp: current.maxHp,
            alive: false,
            respawnAtMs:
              current.respawnAtMs > nowMs
                ? current.respawnAtMs
                : nowMs + KUWAGAMON_RESPAWN_MS,
            defeatedCount: current.defeatedCount + 1,
            updatedAt: serverTimestamp(),
          });
        }
        return;
      }

      const nextHp = Math.max(0, current.hp - dmgToApply);
      const killed = nextHp <= 0;
      const nextContributors: Record<string, WorldBossContributor> = {
        ...current.contributors,
      };
      const prevContrib = nextContributors[user.uid];
      if (prevContrib || Object.keys(nextContributors).length < 32) {
        nextContributors[user.uid] = {
          tamerName: cleanName,
          damage: Math.min(10_000_000, (prevContrib?.damage ?? 0) + dmgToApply),
        };
      }

      tx.update(ref, {
        hp: nextHp,
        maxHp: current.maxHp,
        alive: !killed,
        respawnAtMs: killed ? nowMs + KUWAGAMON_RESPAWN_MS : 0,
        lastAttackerName: cleanName,
        lastHitAtMs: nowMs,
        contributors: nextContributors,
        defeatedCount: killed ? current.defeatedCount + 1 : current.defeatedCount,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    // Fallback to local boss damage so boss defeat still completes if Firestore write fails
    applyLocalBossDamage(bossId, cleanName, dmgToApply);
    try {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } catch {
      // Structured log without interrupting combat loop
    }
  } finally {
    entry.inFlight = false;
    if (entry.damage > 0 && entry.timer === null) {
      if (entry.urgentFlush) {
        void flushBossDamageBatch(bossId);
      } else {
        entry.timer = window.setTimeout(() => {
          if (entry) entry.timer = null;
          void flushBossDamageBatch(bossId);
        }, 280);
      }
    }
  }
}

export function enqueueWorldBossDamage(
  bossId: string,
  tamerName: string,
  damage: number,
  remainingHpAfterHit = Number.POSITIVE_INFINITY
): void {
  if (damage <= 0) return;

  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    applyLocalBossDamage(bossId, tamerName, damage);
    return;
  }

  let entry = pendingDamageByBoss.get(bossId);
  if (!entry) {
    entry = {
      damage: 0,
      tamerName,
      timer: null,
      inFlight: false,
      urgentFlush: false,
    };
    pendingDamageByBoss.set(bossId, entry);
  }
  entry.damage += Math.round(damage);
  entry.tamerName = tamerName;

  // Flush immediately on lethal blow so Boss dies without waiting for batch debounce
  if (remainingHpAfterHit <= 0) {
    entry.urgentFlush = true;
    if (!entry.inFlight) {
      if (entry.timer !== null) {
        window.clearTimeout(entry.timer);
        entry.timer = null;
      }
      void flushBossDamageBatch(bossId);
    }
    return;
  }

  if (entry.timer === null && !entry.inFlight) {
    entry.timer = window.setTimeout(() => {
      if (entry) entry.timer = null;
      void flushBossDamageBatch(bossId);
    }, 320);
  }
}

/**
 * Atomically respawns the World Boss once its synchronized respawn timer expires.
 * Works seamlessly in both Firestore multiplayer mode and local/test mode.
 */
export async function tryRespawnWorldBoss(bossId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    const current = localBossStates.get(bossId);
    if (
      current &&
      !current.alive &&
      current.respawnAtMs > 0 &&
      Date.now() + 500 >= current.respawnAtMs
    ) {
      emitBossStateToSubscribers(
        bossId,
        createDefaultKuwagamonState(current.defeatedCount)
      );
    }
    return;
  }

  const ready = await ensurePlayerDocBootstrapped(user);
  if (!ready) {
    const current = localBossStates.get(bossId);
    if (
      current &&
      !current.alive &&
      current.respawnAtMs > 0 &&
      Date.now() + 500 >= current.respawnAtMs
    ) {
      emitBossStateToSubscribers(
        bossId,
        createDefaultKuwagamonState(current.defeatedCount)
      );
    }
    return;
  }

  const ref = doc(db, 'worldBosses', bossId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const current = parseBossDoc(
        bossId,
        (snap.data() ?? {}) as Record<string, unknown>
      );
      if (current.alive) return;
      if (Date.now() + 500 < current.respawnAtMs) return;

      const nextMaxHp =
        bossId === KUWAGAMON_BOSS_ID ? KUWAGAMON_MAX_HP : current.maxHp;
      tx.update(ref, {
        hp: nextMaxHp,
        maxHp: nextMaxHp,
        alive: true,
        respawnAtMs: 0,
        lastAttackerName: '',
        lastHitAtMs: 0,
        contributors: {},
        updatedAt: serverTimestamp(),
      });
    });
  } catch {
    const current = localBossStates.get(bossId);
    if (
      current &&
      !current.alive &&
      current.respawnAtMs > 0 &&
      Date.now() + 500 >= current.respawnAtMs
    ) {
      emitBossStateToSubscribers(
        bossId,
        createDefaultKuwagamonState(current.defeatedCount)
      );
    }
  }
}

/**
 * Allows an authorized GM to immediately revive/respawn a Raid World Boss.
 */
export async function forceRespawnWorldBossForGm(
  bossId: string = KUWAGAMON_BOSS_ID
): Promise<{ ok: boolean; error?: string }> {
  const currentLocal = localBossStates.get(bossId);
  const nextLocal = createDefaultKuwagamonState(currentLocal?.defeatedCount ?? 0);
  emitBossStateToSubscribers(bossId, nextLocal);

  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return { ok: true };
  }

  const ref = doc(db, 'worldBosses', bossId);
  const path = `worldBosses/${bossId}`;
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        tx.set(ref, {
          ...createDefaultKuwagamonState(0),
          updatedAt: serverTimestamp(),
        });
        return;
      }
      const parsed = parseBossDoc(
        bossId,
        (snap.data() ?? {}) as Record<string, unknown>
      );
      const nextMaxHp =
        bossId === KUWAGAMON_BOSS_ID ? KUWAGAMON_MAX_HP : parsed.maxHp;
      tx.update(ref, {
        hp: nextMaxHp,
        maxHp: nextMaxHp,
        alive: true,
        respawnAtMs: 0,
        lastAttackerName: '',
        lastHitAtMs: 0,
        contributors: {},
        updatedAt: serverTimestamp(),
      });
    });
    return { ok: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } catch {
      // Structured log only
    }
    return { ok: false, error: 'Sem permissão para reviver o Boss Raid.' };
  }
}

