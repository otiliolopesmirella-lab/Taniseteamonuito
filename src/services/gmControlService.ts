import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import type { EquipmentSlotId, InventoryItem } from '../types/hud';
import {
  banPlayerAccount,
  isBanCurrentlyActive,
  unbanPlayerAccount,
  type AccountBanRecord,
  type BanDurationPreset,
} from './banService';
import {
  recordDwCoinAdminTransaction,
  summarizeDwCoinTransactions,
  type DwCoinSpendAnalytics,
  type DwCoinTransactionRecord,
} from './dwCoinLedgerService';
import type { DwCoinOrderStatus, DwCoinPaymentMethod } from './dwCoinOrderService';
import type { AlphaFeedbackCategory, AlphaFeedbackItem } from './feedbackService';
import { isCurrentAuthUserBootstrappedGm } from './gmRoleService';
import type { ServerAnnouncementState, ServerExpRateState } from './serverConfigService';
import { KUWAGAMON_BOSS_ID, KUWAGAMON_MAX_HP, type WorldBossLiveState } from './worldBossService';
import { PRESENCE_STALE_MS, type SharedWorldMapId } from './worldPresenceService';

export type GmAuditAction =
  | 'ban'
  | 'unban'
  | 'kick'
  | 'currency_adjust'
  | 'order_approve'
  | 'order_cancel'
  | 'exp_rate'
  | 'announcement'
  | 'boss_respawn'
  | 'feedback_delete'
  | 'item_grant';

export interface GmAuditLogEntry {
  logId: string;
  actorUid: string;
  actorName: string;
  action: GmAuditAction;
  targetUid: string;
  targetName: string;
  summary: string;
  createdAtMs: number;
}

export interface GmPlayerEntry {
  uid: string;
  username: string;
  tamerName: string;
  characterId: string;
  starterDigimonId: string | null;
  starterDigimonName: string | null;
  activeFormId: string | null;
  tamerLevel: number;
  digimonLevel: number;
  bits: number;
  dCoin: number;
  defeatedEnemiesTotal: number;
  guildName: string | null;
  mapId: SharedWorldMapId;
  inventoryCount: number;
  inventoryPreview: Array<{ name: string; quantity: number; category: string }>;
  xpBoostUntilMs: number | null;
  online: boolean;
  isGm: boolean;
  lastSeenMs: number | null;
  createdAtMs: number | null;
  banRecord: AccountBanRecord | null;
  isBanned: boolean;
}

export interface GmDwCoinOrderEntry {
  orderId: string;
  ownerUid: string;
  username: string;
  tamerName: string;
  packId: string;
  dwCoinAmount: number;
  priceCents: number;
  priceBrlLabel: string;
  paymentMethod: DwCoinPaymentMethod;
  status: DwCoinOrderStatus;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface GmServerMetrics {
  totalPlayers: number;
  onlinePlayers: number;
  offlinePlayers: number;
  bannedPlayers: number;
  totalBits: number;
  totalDwCoin: number;
  totalKills: number;
  pendingOrdersCount: number;
  pendingOrdersBrlCents: number;
  approvedOrdersCount: number;
  approvedOrdersBrlCents: number;
  approvedDwCoinSold: number;
  totalDwCoinSpent: number;
}

export interface GmServerSnapshot {
  players: GmPlayerEntry[];
  orders: GmDwCoinOrderEntry[];
  transactions: DwCoinTransactionRecord[];
  spendAnalytics: DwCoinSpendAnalytics;
  bans: AccountBanRecord[];
  feedbacks: AlphaFeedbackItem[];
  auditLogs: GmAuditLogEntry[];
  worldBoss: WorldBossLiveState | null;
  serverRates: ServerExpRateState | null;
  serverAnnouncement: ServerAnnouncementState | null;
  metrics: GmServerMetrics;
  fetchedAtMs: number;
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

function generateLogId(): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `gm_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function logGmAction(input: {
  action: GmAuditAction;
  targetUid: string;
  targetName: string;
  summary: string;
  gmName: string;
}): Promise<void> {
  const actor = auth.currentUser;
  if (!actor || !isCurrentAuthUserBootstrappedGm()) return;

  const logId = generateLogId();
  try {
    await setDoc(doc(db, 'gmAuditLogs', logId), {
      logId,
      actorUid: actor.uid,
      actorName: (input.gmName || 'GM').trim().slice(0, 24) || 'GM',
      action: input.action,
      targetUid: (input.targetUid || 'server').trim().slice(0, 128),
      targetName: (input.targetName || 'Servidor').trim().slice(0, 32),
      summary: (input.summary || input.action).trim().slice(0, 240) || 'Ação GM',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.CREATE, `gmAuditLogs/${logId}`);
    } catch {
      // Non-fatal structured audit log
    }
  }
}

export async function fetchServerSnapshotForGm(): Promise<GmServerSnapshot> {
  const actor = auth.currentUser;
  if (!actor || !isCurrentAuthUserBootstrappedGm()) {
    throw new Error('Acesso negado: painel exclusivo para GMs verificados.');
  }

  const [
    playersRes,
    presenceRes,
    bansRes,
    ordersRes,
    txsRes,
    feedbackRes,
    logsRes,
    bossRes,
    ratesRes,
    annRes,
  ] = await Promise.allSettled([
    getDocs(collection(db, 'players')),
    getDocs(collection(db, 'worldPresence')),
    getDocs(collection(db, 'bannedAccounts')),
    getDocs(
      query(collection(db, 'dwCoinOrders'), orderBy('createdAt', 'desc'), limit(150))
    ),
    getDocs(
      query(
        collection(db, 'dwCoinTransactions'),
        orderBy('createdAt', 'desc'),
        limit(200)
      )
    ),
    getDocs(collection(db, 'alphaFeedback')),
    getDocs(
      query(collection(db, 'gmAuditLogs'), orderBy('createdAt', 'desc'), limit(100))
    ),
    getDoc(doc(db, 'worldBosses', KUWAGAMON_BOSS_ID)),
    getDoc(doc(db, 'serverConfig', 'rates')),
    getDoc(doc(db, 'serverConfig', 'announcement')),
  ]);

  // 1. Parse World Presence + estimate server clock from active presence writes
  interface RawPresenceRow {
    uid: string;
    online: boolean;
    isGm: boolean;
    mapId: SharedWorldMapId;
    tamerName: string;
    tamerLevel: number;
    digimonLevel: number;
    digimonFormId: string;
    guildName: string | null;
    updatedAtMs: number | null;
  }

  const presenceMap = new Map<string, RawPresenceRow>();
  let newestOnlineServerTs = 0;

  if (presenceRes.status === 'fulfilled') {
    presenceRes.value.forEach((docSnap) => {
      const d = docSnap.data() ?? {};
      const uid = String(d.ownerUid ?? docSnap.id);
      const updatedAtMs = parseTimestampMs(d.updatedAt);
      const online = d.online === true;
      if (online && updatedAtMs && updatedAtMs > newestOnlineServerTs) {
        newestOnlineServerTs = updatedAtMs;
      }
      const rawMap = String(d.mapId ?? 'dats-center');
      const mapId: SharedWorldMapId =
        rawMap === 'd-terminal' ||
        rawMap === 'hunting-plains' ||
        rawMap === 'data-forest' ||
        rawMap === 'digi-mountain' ||
        rawMap === 'digital-desert' ||
        rawMap === 'data-sea' ||
        rawMap === 'digimon-island' ||
        rawMap === 'dark-area' ||
        rawMap === 'virtual-world'
          ? rawMap
          : 'dats-center';

      presenceMap.set(uid, {
        uid,
        online,
        isGm: Boolean(d.isGm),
        mapId,
        tamerName: String(d.tamerName ?? ''),
        tamerLevel: typeof d.tamerLevel === 'number' ? d.tamerLevel : 1,
        digimonLevel: typeof d.digimonLevel === 'number' ? d.digimonLevel : 1,
        digimonFormId: String(d.digimonFormId ?? ''),
        guildName: typeof d.guildName === 'string' ? d.guildName : null,
        updatedAtMs,
      });
    });
  }

  const clockRefMs =
    newestOnlineServerTs > 0 ? newestOnlineServerTs : Date.now();

  // 2. Parse Bans
  const banMap = new Map<string, AccountBanRecord>();
  const bans: AccountBanRecord[] = [];
  if (bansRes.status === 'fulfilled') {
    bansRes.value.forEach((docSnap) => {
      const d = docSnap.data() ?? {};
      const rec: AccountBanRecord = {
        targetUid: String(d.targetUid ?? docSnap.id),
        username: String(d.username ?? 'Tamer'),
        tamerName: String(d.tamerName ?? ''),
        reason: String(d.reason ?? 'Sem motivo informado.'),
        bannedByUid: String(d.bannedByUid ?? ''),
        bannedByName: String(d.bannedByName ?? 'GM'),
        permanent: Boolean(d.permanent),
        expiresAtMs: typeof d.expiresAtMs === 'number' ? d.expiresAtMs : 0,
        active: Boolean(d.active),
        createdAtMs: parseTimestampMs(d.createdAt) ?? Date.now(),
        updatedAtMs: parseTimestampMs(d.updatedAt) ?? Date.now(),
      };
      banMap.set(rec.targetUid, rec);
      bans.push(rec);
    });
    bans.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  }

  // 3. Parse Players joined with Presence + Bans
  const players: GmPlayerEntry[] = [];
  const playerLookup = new Map<string, GmPlayerEntry>();
  let totalBits = 0;
  let totalDwCoin = 0;
  let totalKills = 0;

  if (playersRes.status === 'fulfilled') {
    playersRes.value.forEach((docSnap) => {
      const d = docSnap.data() ?? {};
      const uid = String(d.ownerUid ?? docSnap.id);
      const username = String(d.username ?? 'Tamer');
      const tam =
        d.tamerSelection && typeof d.tamerSelection === 'object'
          ? (d.tamerSelection as Record<string, unknown>)
          : null;
      const starter =
        d.starterDigimon && typeof d.starterDigimon === 'object'
          ? (d.starterDigimon as Record<string, unknown>)
          : null;
      const adv =
        d.adventureProgress && typeof d.adventureProgress === 'object'
          ? (d.adventureProgress as Record<string, unknown>)
          : null;
      const hud =
        d.hudState && typeof d.hudState === 'object'
          ? (d.hudState as Record<string, unknown>)
          : null;

      const tamerStats =
        hud?.tamer && typeof hud.tamer === 'object'
          ? (hud.tamer as Record<string, unknown>)
          : null;
      const digiStats =
        hud?.digimon && typeof hud.digimon === 'object'
          ? (hud.digimon as Record<string, unknown>)
          : null;

      const bits =
        typeof hud?.bits === 'number' && Number.isFinite(hud.bits)
          ? Math.max(0, Math.round(hud.bits))
          : 0;
      const dCoin =
        typeof hud?.dCoin === 'number' && Number.isFinite(hud.dCoin)
          ? Math.max(0, Math.round(hud.dCoin))
          : 0;
      const defeated =
        typeof hud?.defeatedEnemiesTotal === 'number' &&
        Number.isFinite(hud.defeatedEnemiesTotal)
          ? Math.max(0, Math.round(hud.defeatedEnemiesTotal))
          : 0;

      const rawInventory = Array.isArray(hud?.inventory) ? hud.inventory : [];
      const inventoryPreview = rawInventory
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .slice(0, 12)
        .map((item) => ({
          name: String(item.name ?? item.itemKey ?? 'Item'),
          quantity: typeof item.quantity === 'number' ? item.quantity : 1,
          category: String(item.category ?? 'misc'),
        }));

      const pres = presenceMap.get(uid);
      const banRec = banMap.get(uid) ?? null;
      const banned = isBanCurrentlyActive(banRec);
      const isOnline =
        !banned &&
        Boolean(
          pres &&
            pres.online &&
            (uid === actor.uid ||
              pres.updatedAtMs === null ||
              Math.abs(clockRefMs - pres.updatedAtMs) <= PRESENCE_STALE_MS)
        );

      const rawMap = String(pres?.mapId ?? adv?.mapId ?? 'dats-center');
      const mapId: SharedWorldMapId =
        rawMap === 'd-terminal' ||
        rawMap === 'hunting-plains' ||
        rawMap === 'data-forest' ||
        rawMap === 'digi-mountain' ||
        rawMap === 'digital-desert' ||
        rawMap === 'data-sea' ||
        rawMap === 'digimon-island' ||
        rawMap === 'dark-area' ||
        rawMap === 'virtual-world'
          ? rawMap
          : 'dats-center';

      const entry: GmPlayerEntry = {
        uid,
        username,
        tamerName: String(tam?.tamerName ?? pres?.tamerName ?? username),
        characterId: String(tam?.characterId ?? 'kai'),
        starterDigimonId: starter ? String(starter.digimonId ?? '') : null,
        starterDigimonName: starter ? String(starter.digimonName ?? '') : null,
        activeFormId:
          typeof digiStats?.activeFormId === 'string'
            ? digiStats.activeFormId
            : pres?.digimonFormId || (starter ? String(starter.digimonId ?? '') : null),
        tamerLevel:
          typeof tamerStats?.level === 'number'
            ? tamerStats.level
            : pres?.tamerLevel ?? 1,
        digimonLevel:
          typeof digiStats?.level === 'number'
            ? digiStats.level
            : pres?.digimonLevel ?? 1,
        bits,
        dCoin,
        defeatedEnemiesTotal: defeated,
        guildName:
          typeof hud?.guildName === 'string'
            ? hud.guildName
            : pres?.guildName ?? null,
        mapId,
        inventoryCount: rawInventory.length,
        inventoryPreview,
        xpBoostUntilMs:
          typeof hud?.xpBoostUntilMs === 'number' ? hud.xpBoostUntilMs : null,
        online: isOnline,
        isGm: Boolean(pres?.isGm),
        lastSeenMs:
          pres?.updatedAtMs ?? parseTimestampMs(d.updatedAt) ?? null,
        createdAtMs: parseTimestampMs(d.createdAt),
        banRecord: banRec,
        isBanned: banned,
      };

      totalBits += bits;
      totalDwCoin += dCoin;
      totalKills += defeated;
      players.push(entry);
      playerLookup.set(uid, entry);
    });

    players.sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      return (b.lastSeenMs ?? 0) - (a.lastSeenMs ?? 0);
    });
  }

  // 4. Parse DWcoin Orders
  const orders: GmDwCoinOrderEntry[] = [];
  let pendingOrdersCount = 0;
  let pendingOrdersBrlCents = 0;
  let approvedOrdersCount = 0;
  let approvedOrdersBrlCents = 0;
  let approvedDwCoinSold = 0;

  if (ordersRes.status === 'fulfilled') {
    ordersRes.value.forEach((docSnap) => {
      const d = docSnap.data() ?? {};
      const ownerUid = String(d.ownerUid ?? '');
      const owner = playerLookup.get(ownerUid);
      const rawStatus = String(d.status ?? 'pending');
      const status: DwCoinOrderStatus =
        rawStatus === 'approved' ||
        rawStatus === 'cancelled' ||
        rawStatus === 'error'
          ? rawStatus
          : 'pending';
      const dwCoinAmount =
        typeof d.dwCoinAmount === 'number' ? d.dwCoinAmount : 0;
      const priceCents = typeof d.priceCents === 'number' ? d.priceCents : 0;

      if (status === 'pending') {
        pendingOrdersCount += 1;
        pendingOrdersBrlCents += priceCents;
      } else if (status === 'approved') {
        approvedOrdersCount += 1;
        approvedOrdersBrlCents += priceCents;
        approvedDwCoinSold += dwCoinAmount;
      }

      orders.push({
        orderId: String(d.orderId ?? docSnap.id),
        ownerUid,
        username: owner?.username ?? ownerUid.slice(0, 8),
        tamerName: owner?.tamerName ?? owner?.username ?? 'Tamer',
        packId: String(d.packId ?? 'pack_10'),
        dwCoinAmount,
        priceCents,
        priceBrlLabel: String(d.priceBrlLabel ?? ''),
        paymentMethod: d.paymentMethod === 'card' ? 'card' : 'pix',
        status,
        createdAtMs: parseTimestampMs(d.createdAt) ?? Date.now(),
        updatedAtMs: parseTimestampMs(d.updatedAt) ?? Date.now(),
      });
    });
  }

  // 5. Parse DWcoin Transactions Ledger
  const transactions: DwCoinTransactionRecord[] = [];
  if (txsRes.status === 'fulfilled') {
    txsRes.value.forEach((docSnap) => {
      const d = docSnap.data() ?? {};
      const rawType = String(d.type ?? 'spend');
      const type =
        rawType === 'recharge' ||
        rawType === 'gm_grant' ||
        rawType === 'gm_deduct'
          ? rawType
          : 'spend';
      transactions.push({
        txId: String(d.txId ?? docSnap.id),
        ownerUid: String(d.ownerUid ?? ''),
        username: String(d.username ?? 'Tamer'),
        tamerName: String(d.tamerName ?? ''),
        type,
        dwCoinAmount: typeof d.dwCoinAmount === 'number' ? d.dwCoinAmount : 0,
        itemKey: String(d.itemKey ?? ''),
        itemName: String(d.itemName ?? 'Item'),
        category: String(d.category ?? 'loja'),
        balanceAfter: typeof d.balanceAfter === 'number' ? d.balanceAfter : 0,
        createdAtMs: parseTimestampMs(d.createdAt) ?? Date.now(),
      });
    });
  }
  const spendAnalytics = summarizeDwCoinTransactions(transactions);

  // 6. Parse Alpha Feedback Reports
  const feedbacks: AlphaFeedbackItem[] = [];
  if (feedbackRes.status === 'fulfilled') {
    feedbackRes.value.forEach((docSnap) => {
      const d = docSnap.data() ?? {};
      feedbacks.push({
        id: docSnap.id,
        ownerUid: String(d.ownerUid ?? ''),
        username: String(d.username ?? ''),
        tamerName: String(d.tamerName ?? ''),
        category: (d.category as AlphaFeedbackCategory) ?? 'bug',
        screenContext: String(d.screenContext ?? 'world'),
        message: String(d.message ?? ''),
        deviceInfo: String(d.deviceInfo ?? ''),
        status: 'open',
        createdAtMs: parseTimestampMs(d.createdAt) ?? Date.now(),
      });
    });
    feedbacks.sort((a, b) => b.createdAtMs - a.createdAtMs);
  }

  // 7. Parse GM Audit Logs
  const auditLogs: GmAuditLogEntry[] = [];
  if (logsRes.status === 'fulfilled') {
    logsRes.value.forEach((docSnap) => {
      const d = docSnap.data() ?? {};
      auditLogs.push({
        logId: String(d.logId ?? docSnap.id),
        actorUid: String(d.actorUid ?? ''),
        actorName: String(d.actorName ?? 'GM'),
        action: (d.action as GmAuditAction) ?? 'currency_adjust',
        targetUid: String(d.targetUid ?? ''),
        targetName: String(d.targetName ?? ''),
        summary: String(d.summary ?? ''),
        createdAtMs: parseTimestampMs(d.createdAt) ?? Date.now(),
      });
    });
  }

  // 8. Parse World Boss
  let worldBoss: WorldBossLiveState | null = null;
  if (bossRes.status === 'fulfilled' && bossRes.value.exists()) {
    const d = bossRes.value.data() ?? {};
    const maxHp = typeof d.maxHp === 'number' ? d.maxHp : KUWAGAMON_MAX_HP;
    const hp = typeof d.hp === 'number' ? d.hp : maxHp;
    worldBoss = {
      bossId: KUWAGAMON_BOSS_ID,
      mapId: 'data-forest',
      name: String(d.name ?? 'Kuwagamon'),
      level: typeof d.level === 'number' ? d.level : 20,
      hp,
      maxHp,
      alive: Boolean(d.alive) && hp > 0,
      respawnAtMs: typeof d.respawnAtMs === 'number' ? d.respawnAtMs : 0,
      lastAttackerName: String(d.lastAttackerName ?? ''),
      lastHitAtMs: typeof d.lastHitAtMs === 'number' ? d.lastHitAtMs : 0,
      contributors: (d.contributors as WorldBossLiveState['contributors']) ?? {},
      defeatedCount: typeof d.defeatedCount === 'number' ? d.defeatedCount : 0,
    };
  }

  // 9. Parse Server Rates & Announcement
  let serverRates: ServerExpRateState | null = null;
  if (ratesRes.status === 'fulfilled' && ratesRes.value.exists()) {
    const d = ratesRes.value.data() ?? {};
    const pct =
      d.expRatePct === 150 || d.expRatePct === 200 || d.expRatePct === 250
        ? d.expRatePct
        : 100;
    serverRates = {
      expRatePct: pct,
      updatedBy: String(d.updatedBy ?? 'GM'),
    };
  }

  let serverAnnouncement: ServerAnnouncementState | null = null;
  if (annRes.status === 'fulfilled' && annRes.value.exists()) {
    const d = annRes.value.data() ?? {};
    serverAnnouncement = {
      announcementId: String(d.announcementId ?? ''),
      title: String(d.title ?? 'Aviso'),
      message: String(d.message ?? ''),
      severity:
        d.severity === 'event' ||
        d.severity === 'warning' ||
        d.severity === 'maintenance'
          ? d.severity
          : 'info',
      maintenanceMode: Boolean(d.maintenanceMode),
      active: Boolean(d.active),
      updatedBy: String(d.updatedBy ?? 'GM'),
    };
  }

  const onlinePlayers = players.filter((p) => p.online).length;
  const bannedPlayers = players.filter((p) => p.isBanned).length;

  return {
    players,
    orders,
    transactions,
    spendAnalytics,
    bans,
    feedbacks,
    auditLogs,
    worldBoss,
    serverRates,
    serverAnnouncement,
    metrics: {
      totalPlayers: players.length,
      onlinePlayers,
      offlinePlayers: Math.max(0, players.length - onlinePlayers),
      bannedPlayers,
      totalBits,
      totalDwCoin,
      totalKills,
      pendingOrdersCount,
      pendingOrdersBrlCents,
      approvedOrdersCount,
      approvedOrdersBrlCents,
      approvedDwCoinSold,
      totalDwCoinSpent: spendAnalytics.totalSpent,
    },
    fetchedAtMs: Date.now(),
  };
}

function buildValidHudStatePatch(
  rawHud: unknown,
  bitsDelta: number,
  dCoinDelta: number
): {
  nextHudState: Record<string, unknown>;
  nextBits: number;
  nextDCoin: number;
  prevBits: number;
  prevDCoin: number;
} {
  const hud =
    rawHud && typeof rawHud === 'object' && !Array.isArray(rawHud)
      ? ({ ...(rawHud as Record<string, unknown>) } as Record<string, unknown>)
      : {};

  const defaultStats = {
    level: 1,
    exp: 0,
    expToNext: 100,
    hp: 100,
    maxHp: 100,
    ds: 50,
    maxDs: 50,
  };

  const tamer =
    hud.tamer && typeof hud.tamer === 'object' ? hud.tamer : { ...defaultStats };
  const digimon =
    hud.digimon && typeof hud.digimon === 'object'
      ? hud.digimon
      : { ...defaultStats };

  const prevBits =
    typeof hud.bits === 'number' && Number.isFinite(hud.bits)
      ? Math.max(0, Math.round(hud.bits))
      : 0;
  const prevDCoin =
    typeof hud.dCoin === 'number' && Number.isFinite(hud.dCoin)
      ? Math.max(0, Math.round(hud.dCoin))
      : 0;

  const nextBits = Math.max(
    0,
    Math.min(1_000_000_000, prevBits + Math.round(bitsDelta))
  );
  const nextDCoin = Math.max(
    0,
    Math.min(1_000_000_000, prevDCoin + Math.round(dCoinDelta))
  );

  const inventory = Array.isArray(hud.inventory)
    ? (hud.inventory as InventoryItem[]).slice(0, 48)
    : [];
  const equippedItems =
    hud.equippedItems && typeof hud.equippedItems === 'object'
      ? (hud.equippedItems as Partial<Record<EquipmentSlotId, InventoryItem>>)
      : {};

  const nextHudState: Record<string, unknown> = {
    tamer,
    digimon,
    bits: nextBits,
    dCoin: nextDCoin,
    inventory,
    equippedItems,
    guildName: typeof hud.guildName === 'string' ? hud.guildName.slice(0, 32) : null,
    defeatedEnemiesTotal:
      typeof hud.defeatedEnemiesTotal === 'number' &&
      Number.isFinite(hud.defeatedEnemiesTotal)
        ? Math.max(0, Math.round(hud.defeatedEnemiesTotal))
        : 0,
    updatedAt: new Date().toISOString(),
  };

  if (typeof hud.tamerPhotoUrl === 'string' && hud.tamerPhotoUrl.length > 0) {
    nextHudState.tamerPhotoUrl = hud.tamerPhotoUrl;
  }
  if (typeof hud.tamerCoverUrl === 'string' && hud.tamerCoverUrl.length > 0) {
    nextHudState.tamerCoverUrl = hud.tamerCoverUrl;
  }
  if (typeof hud.xpBoostUntilMs === 'number' && Number.isFinite(hud.xpBoostUntilMs)) {
    nextHudState.xpBoostUntilMs = hud.xpBoostUntilMs;
  }
  if (hud.autoFarmVipUnlocked === true) {
    nextHudState.autoFarmVipUnlocked = true;
  }
  if (
    typeof hud.autoFarmVipUntilMs === 'number' &&
    Number.isFinite(hud.autoFarmVipUntilMs) &&
    hud.autoFarmVipUntilMs > 0
  ) {
    nextHudState.autoFarmVipUntilMs = hud.autoFarmVipUntilMs;
  }

  return {
    nextHudState,
    nextBits,
    nextDCoin,
    prevBits,
    prevDCoin,
  };
}

export async function adjustPlayerCurrencyForGm(input: {
  targetUid: string;
  bitsDelta: number;
  dCoinDelta: number;
  reason?: string;
  gmName: string;
}): Promise<{ nextBits: number; nextDCoin: number }> {
  if (!isCurrentAuthUserBootstrappedGm()) {
    throw new Error('Acesso negado: apenas GMs autorizados.');
  }

  const playerRef = doc(db, 'players', input.targetUid);
  let username = 'Tamer';
  let tamerName = 'Tamer';
  let prevDCoin = 0;
  let nextBits = 0;
  let nextDCoin = 0;

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(playerRef);
      if (!snap.exists()) {
        throw new Error('Conta do jogador não encontrada no Firestore.');
      }

      const data = snap.data() ?? {};
      username = String(data.username ?? 'Tamer');
      const tam =
        data.tamerSelection && typeof data.tamerSelection === 'object'
          ? (data.tamerSelection as Record<string, unknown>)
          : null;
      tamerName = String(tam?.tamerName ?? username);

      const built = buildValidHudStatePatch(
        data.hudState,
        input.bitsDelta,
        input.dCoinDelta
      );
      prevDCoin = built.prevDCoin;
      nextBits = built.nextBits;
      nextDCoin = built.nextDCoin;

      tx.update(playerRef, {
        hudState: built.nextHudState,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('não encontrada')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, `players/${input.targetUid}`);
  }

  if (input.dCoinDelta !== 0) {
    const actualDelta = nextDCoin - prevDCoin;
    if (actualDelta !== 0) {
      await recordDwCoinAdminTransaction({
        targetUid: input.targetUid,
        username,
        tamerName,
        type: actualDelta > 0 ? 'gm_grant' : 'gm_deduct',
        dwCoinAmount: Math.min(100_000_000, Math.abs(actualDelta)),
        itemKey: actualDelta > 0 ? 'gm_grant' : 'gm_deduct',
        itemName:
          input.reason?.trim().slice(0, 64) ||
          (actualDelta > 0 ? 'Crédito Manual GM' : 'Remoção Manual GM'),
        category: 'gm',
        balanceAfter: nextDCoin,
      });
    }
  }

  const summaryParts: string[] = [];
  if (input.bitsDelta !== 0) {
    summaryParts.push(
      `Bits ${input.bitsDelta > 0 ? '+' : ''}${input.bitsDelta} (saldo ${nextBits})`
    );
  }
  if (input.dCoinDelta !== 0) {
    summaryParts.push(
      `DL Din ${input.dCoinDelta > 0 ? '+' : ''}${input.dCoinDelta} (saldo ${nextDCoin})`
    );
  }
  if (input.reason?.trim()) {
    summaryParts.push(`Motivo: ${input.reason.trim()}`);
  }

  await logGmAction({
    action: 'currency_adjust',
    targetUid: input.targetUid,
    targetName: tamerName,
    summary: summaryParts.join(' · ') || 'Ajuste de saldo',
    gmName: input.gmName,
  });

  return {
    nextBits,
    nextDCoin,
  };
}

export async function kickOnlinePlayerForGm(input: {
  targetUid: string;
  targetName: string;
  gmName: string;
}): Promise<void> {
  const actor = auth.currentUser;
  if (!actor || !isCurrentAuthUserBootstrappedGm()) {
    throw new Error('Apenas GMs autorizados podem desconectar jogadores.');
  }
  if (actor.uid === input.targetUid) {
    throw new Error('Você não pode desconectar a si mesmo pelo painel.');
  }

  const ref = doc(db, 'worldPresence', input.targetUid);
  try {
    await updateDoc(ref, {
      online: false,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `worldPresence/${input.targetUid}`
    );
  }

  await logGmAction({
    action: 'kick',
    targetUid: input.targetUid,
    targetName: input.targetName,
    summary: `Desconectou ${input.targetName} do mapa compartilhado.`,
    gmName: input.gmName,
  });
}

export async function approveDwCoinOrderForGm(input: {
  orderId: string;
  gmName: string;
}): Promise<{ dwCoinCredited: number; nextBalance: number }> {
  if (!isCurrentAuthUserBootstrappedGm()) {
    throw new Error('Apenas GMs autorizados podem aprovar recargas.');
  }

  const orderRef = doc(db, 'dwCoinOrders', input.orderId);
  const orderPath = `dwCoinOrders/${input.orderId}`;

  let ownerUid = '';
  let dwCoinAmount = 0;
  let packId = '';
  let priceBrlLabel = '';
  let username = 'Tamer';
  let tamerName = 'Tamer';
  let nextDCoin = 0;

  try {
    await runTransaction(db, async (tx) => {
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists()) {
        throw new Error('Pedido não encontrado.');
      }
      const d = orderSnap.data() ?? {};
      if (d.status !== 'pending') {
        throw new Error('Este pedido não está mais pendente.');
      }
      ownerUid = String(d.ownerUid ?? '');
      dwCoinAmount = typeof d.dwCoinAmount === 'number' ? d.dwCoinAmount : 0;
      packId = String(d.packId ?? '');
      priceBrlLabel = String(d.priceBrlLabel ?? '');

      const playerRef = doc(db, 'players', ownerUid);
      const playerSnap = await tx.get(playerRef);
      if (!playerSnap.exists()) {
        throw new Error('A conta do jogador não foi encontrada no Firestore.');
      }

      const playerData = playerSnap.data() ?? {};
      username = String(playerData.username ?? 'Tamer');
      const tam =
        playerData.tamerSelection && typeof playerData.tamerSelection === 'object'
          ? (playerData.tamerSelection as Record<string, unknown>)
          : null;
      tamerName = String(tam?.tamerName ?? username);

      const built = buildValidHudStatePatch(playerData.hudState, 0, dwCoinAmount);
      nextDCoin = built.nextDCoin;

      tx.update(orderRef, {
        status: 'approved',
        updatedAt: serverTimestamp(),
      });
      tx.update(playerRef, {
        hudState: built.nextHudState,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('não encontrado') ||
        error.message.includes('não encontrada') ||
        error.message.includes('não está mais pendente'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, orderPath);
  }

  await recordDwCoinAdminTransaction({
    targetUid: ownerUid,
    username,
    tamerName,
    type: 'recharge',
    dwCoinAmount,
    itemKey: packId || 'recharge',
    itemName: `Recarga ${dwCoinAmount} DL Din (${priceBrlLabel || packId})`,
    category: 'recarga',
    balanceAfter: nextDCoin,
  });

  await logGmAction({
    action: 'order_approve',
    targetUid: ownerUid,
    targetName: tamerName,
    summary: `Aprovou pedido ${input.orderId} (+${dwCoinAmount} DL Din · ${priceBrlLabel}).`,
    gmName: input.gmName,
  });

  return {
    dwCoinCredited: dwCoinAmount,
    nextBalance: nextDCoin,
  };
}

export async function cancelDwCoinOrderForGm(input: {
  orderId: string;
  targetUid: string;
  targetName: string;
  gmName: string;
}): Promise<void> {
  if (!isCurrentAuthUserBootstrappedGm()) {
    throw new Error('Apenas GMs autorizados podem cancelar pedidos.');
  }
  const orderRef = doc(db, 'dwCoinOrders', input.orderId);
  try {
    await updateDoc(orderRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.UPDATE,
      `dwCoinOrders/${input.orderId}`
    );
  }

  await logGmAction({
    action: 'order_cancel',
    targetUid: input.targetUid,
    targetName: input.targetName,
    summary: `Cancelou pedido ${input.orderId}.`,
    gmName: input.gmName,
  });
}

export async function banPlayerWithAuditForGm(input: {
  targetUid: string;
  username: string;
  tamerName: string;
  reason: string;
  durationPreset: BanDurationPreset;
  gmName: string;
}): Promise<AccountBanRecord> {
  const rec = await banPlayerAccount(input);
  const label =
    input.durationPreset === 'permanent' ? 'Permanente' : input.durationPreset;
  await logGmAction({
    action: 'ban',
    targetUid: input.targetUid,
    targetName: input.tamerName || input.username,
    summary: `Baniu (${label}): ${input.reason.trim()}`,
    gmName: input.gmName,
  });
  return rec;
}

export async function unbanPlayerWithAuditForGm(input: {
  targetUid: string;
  targetName: string;
  gmName: string;
}): Promise<void> {
  await unbanPlayerAccount({
    targetUid: input.targetUid,
    gmName: input.gmName,
  });
  await logGmAction({
    action: 'unban',
    targetUid: input.targetUid,
    targetName: input.targetName,
    summary: `Removeu suspensão da conta ${input.targetName}.`,
    gmName: input.gmName,
  });
}

export async function deleteAlphaFeedbackForGm(input: {
  reportId: string;
  targetName: string;
  gmName: string;
}): Promise<void> {
  if (!isCurrentAuthUserBootstrappedGm()) {
    throw new Error('Apenas GMs autorizados podem gerenciar relatos.');
  }
  const path = `alphaFeedback/${input.reportId}`;
  try {
    await deleteDoc(doc(db, 'alphaFeedback', input.reportId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }

  await logGmAction({
    action: 'feedback_delete',
    targetUid: input.reportId,
    targetName: input.targetName || 'Feedback',
    summary: `Marcou como resolvido/removeu relato ${input.reportId}.`,
    gmName: input.gmName,
  });
}
