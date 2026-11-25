import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { ensurePlayerDocBootstrapped } from './cloudSaveService';
import {
  createInventoryPayloadFromCatalog,
  isItemNonSellable,
} from '../data/itemsCatalog';
import type {
  InventoryCategory,
  InventoryItem,
  ItemRarity,
} from '../types/hud';

/**
 * Tempo público obrigatório (2 minutos = 120s) em que qualquer item anunciado
 * fica visível para toda a comunidade antes de liberar a compra.
 * Também validado diretamente no servidor pelas Firestore Security Rules.
 */
export const MARKET_PRELIST_DELAY_SEC = 120;
export const MARKET_PRELIST_DELAY_MS = MARKET_PRELIST_DELAY_SEC * 1000;
export const MAX_MARKET_PRICE_BITS = 1_000_000_000;

export type MarketListingStatus = 'active' | 'sold' | 'cancelled';

export interface PlayerMarketListingRecord {
  listingId: string;
  sellerUid: string;
  sellerName: string;
  itemKey: string;
  itemName: string;
  itemCategory: Exclude<InventoryCategory, 'all'>;
  itemRarity: ItemRarity;
  itemIconUrl: string;
  itemDescription: string;
  quantity: number;
  eggHatchLevel: number;
  priceBits: number;
  status: MarketListingStatus;
  buyerUid: string | null;
  buyerName: string | null;
  payoutClaimed: boolean;
  createdAtMs: number;
  soldAtMs: number | null;
  updatedAtMs: number;
}

const VALID_CATEGORIES = new Set<Exclude<InventoryCategory, 'all'>>([
  'digiegg',
  'data',
  'consumable',
  'equip',
  'other',
]);

const VALID_RARITIES = new Set<ItemRarity>([
  'comum',
  'incomum',
  'raro',
  'epico',
  'lendario',
]);

function isFirestoreVerified(): boolean {
  const user = auth.currentUser;
  return Boolean(user && user.emailVerified);
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

function parseListingDoc(
  id: string,
  raw: Record<string, unknown>
): PlayerMarketListingRecord {
  const cat = VALID_CATEGORIES.has(
    raw.itemCategory as Exclude<InventoryCategory, 'all'>
  )
    ? (raw.itemCategory as Exclude<InventoryCategory, 'all'>)
    : 'other';
  const rar = VALID_RARITIES.has(raw.itemRarity as ItemRarity)
    ? (raw.itemRarity as ItemRarity)
    : 'comum';
  const st: MarketListingStatus =
    raw.status === 'sold' || raw.status === 'cancelled' ? raw.status : 'active';
  const now = Date.now();
  const createdAtMs = parseTimestampMs(raw.createdAt) ?? now;
  const soldAtMs = parseTimestampMs(raw.soldAt);
  const updatedAtMs = parseTimestampMs(raw.updatedAt) ?? createdAtMs;

  return {
    listingId: String(raw.listingId ?? id),
    sellerUid: String(raw.sellerUid ?? ''),
    sellerName: String(raw.sellerName ?? 'Tamer').slice(0, 24),
    itemKey: String(raw.itemKey ?? '').slice(0, 64),
    itemName: String(raw.itemName ?? 'Item').slice(0, 80),
    itemCategory: cat,
    itemRarity: rar,
    itemIconUrl: String(raw.itemIconUrl ?? '').slice(0, 240),
    itemDescription: String(raw.itemDescription ?? '').slice(0, 240),
    quantity: Math.max(1, Math.min(9999, Math.round(Number(raw.quantity ?? 1)))),
    eggHatchLevel: Math.max(
      0,
      Math.min(5, Math.round(Number(raw.eggHatchLevel ?? 0)))
    ),
    priceBits: Math.max(
      1,
      Math.min(MAX_MARKET_PRICE_BITS, Math.round(Number(raw.priceBits ?? 1)))
    ),
    status: st,
    buyerUid: typeof raw.buyerUid === 'string' ? raw.buyerUid : null,
    buyerName: typeof raw.buyerName === 'string' ? raw.buyerName : null,
    payoutClaimed: Boolean(raw.payoutClaimed),
    createdAtMs,
    soldAtMs,
    updatedAtMs,
  };
}

export function getMarketRemainingMs(
  listing: Pick<PlayerMarketListingRecord, 'createdAtMs'>,
  nowMs: number = Date.now()
): number {
  const unlockAt = listing.createdAtMs + MARKET_PRELIST_DELAY_MS;
  return Math.max(0, unlockAt - nowMs);
}

export function formatMarketCountdown(remainingMs: number): string {
  const totalSec = Math.max(0, Math.ceil(remainingMs / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function buildInventoryPayloadFromMarketListing(
  listing: Pick<
    PlayerMarketListingRecord,
    | 'itemKey'
    | 'itemName'
    | 'itemCategory'
    | 'itemRarity'
    | 'itemIconUrl'
    | 'itemDescription'
    | 'quantity'
    | 'eggHatchLevel'
  >
): Omit<InventoryItem, 'id'> {
  const fromCatalog = createInventoryPayloadFromCatalog(
    listing.itemKey,
    listing.quantity
  );
  if (fromCatalog) {
    if (fromCatalog.eggData) {
      return {
        ...fromCatalog,
        eggData: {
          ...fromCatalog.eggData,
          hatchLevel: Math.max(
            0,
            Math.min(
              fromCatalog.eggData.maxHatchLevel ?? 5,
              listing.eggHatchLevel
            )
          ),
        },
      };
    }
    return fromCatalog;
  }

  return {
    itemKey: listing.itemKey,
    name: listing.itemName,
    category: listing.itemCategory,
    quantity: Math.max(1, Math.round(listing.quantity)),
    description: listing.itemDescription || 'Item negociado no Mercado da DATS.',
    iconUrl: listing.itemIconUrl || undefined,
    rarity: listing.itemRarity,
  };
}

// =========================================================================
// Local fallback storage (for Quick Test / offline preview accounts)
// =========================================================================
const LOCAL_MARKET_KEY = 'digilegends_local_player_market_v1';
const localMarketListeners = new Set<() => void>();

function readLocalMarketListings(): PlayerMarketListingRecord[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_MARKET_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlayerMarketListingRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalMarketListings(list: PlayerMarketListingRecord[]): void {
  try {
    window.localStorage.setItem(LOCAL_MARKET_KEY, JSON.stringify(list.slice(0, 80)));
  } catch {
    // Ignore storage quota errors
  }
  for (const fn of localMarketListeners) fn();
}

/**
 * Subscribes in real time to global Player Market listings across the server.
 */
export function subscribeGlobalPlayerMarket(
  onUpdate: (listings: PlayerMarketListingRecord[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!isFirestoreVerified()) {
    const emit = () => {
      const sorted = [...readLocalMarketListings()].sort(
        (a, b) => b.createdAtMs - a.createdAtMs
      );
      onUpdate(sorted);
    };
    localMarketListeners.add(emit);
    emit();
    return () => {
      localMarketListeners.delete(emit);
    };
  }

  const q = query(
    collection(db, 'playerMarketListings'),
    orderBy('createdAt', 'desc'),
    limit(80)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((d) =>
        parseListingDoc(d.id, (d.data() ?? {}) as Record<string, unknown>)
      );
      onUpdate(rows);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'playerMarketListings');
      } catch {
        // Non-fatal
      }
      onError?.(error);
    }
  );
}

/**
 * Subscribes specifically to a seller's own listings so sold unclaimed payouts
 * remain reachable even if older than the 80 most recent global listings.
 */
export function subscribeSellerMarketListings(
  sellerUid: string,
  onUpdate: (listings: PlayerMarketListingRecord[]) => void
): () => void {
  if (!sellerUid) {
    onUpdate([]);
    return () => {};
  }

  if (!isFirestoreVerified()) {
    const emit = () => {
      const own = readLocalMarketListings()
        .filter((l) => l.sellerUid === sellerUid)
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      onUpdate(own);
    };
    localMarketListeners.add(emit);
    emit();
    return () => {
      localMarketListeners.delete(emit);
    };
  }

  const q = query(
    collection(db, 'playerMarketListings'),
    where('sellerUid', '==', sellerUid),
    limit(40)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs
        .map((d) =>
          parseListingDoc(d.id, (d.data() ?? {}) as Record<string, unknown>)
        )
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
      onUpdate(rows);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'playerMarketListings');
      } catch {
        // Non-fatal
      }
    }
  );
}

export interface CreateMarketListingResult {
  ok: boolean;
  message: string;
  listing?: PlayerMarketListingRecord;
}

/**
 * Creates a new public listing in the DATS Player Market.
 * Enforces non-sellable item protection and starts the 2-minute public countdown.
 */
export async function createPlayerMarketListing(params: {
  sellerUid: string;
  sellerName: string;
  item: InventoryItem;
  quantity: number;
  priceBits: number;
}): Promise<CreateMarketListingResult> {
  if (isItemNonSellable(params.item)) {
    return {
      ok: false,
      message: 'Este item é vinculado à sua conta e não pode ser vendido no Mercado.',
    };
  }

  const safeQty = Math.max(
    1,
    Math.min(params.item.quantity, Math.min(9999, Math.floor(params.quantity)))
  );
  const safePrice = Math.floor(params.priceBits);
  if (!Number.isFinite(safePrice) || safePrice < 1 || safePrice > MAX_MARKET_PRICE_BITS) {
    return {
      ok: false,
      message: `Informe um preço válido entre 1 Bit e ${MAX_MARKET_PRICE_BITS.toLocaleString('pt-BR')} Bits.`,
    };
  }

  const cleanSellerName = params.sellerName.trim().slice(0, 24) || 'Tamer';
  const eggHatchLevel =
    params.item.category === 'digiegg'
      ? Math.max(0, Math.min(5, Math.floor(params.item.eggData?.hatchLevel ?? 0)))
      : 0;
  const safeCategory: Exclude<InventoryCategory, 'all'> = VALID_CATEGORIES.has(
    params.item.category
  )
    ? params.item.category
    : 'other';
  const safeRarity: ItemRarity =
    params.item.rarity && VALID_RARITIES.has(params.item.rarity)
      ? params.item.rarity
      : 'comum';

  const listingId = `mkt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const nowMs = Date.now();

  const localRecord: PlayerMarketListingRecord = {
    listingId,
    sellerUid: params.sellerUid,
    sellerName: cleanSellerName,
    itemKey: params.item.itemKey.slice(0, 64),
    itemName: params.item.name.slice(0, 80),
    itemCategory: safeCategory,
    itemRarity: safeRarity,
    itemIconUrl: (params.item.iconUrl ?? '').slice(0, 240),
    itemDescription: (params.item.description ?? '').slice(0, 240),
    quantity: safeQty,
    eggHatchLevel,
    priceBits: safePrice,
    status: 'active',
    buyerUid: null,
    buyerName: null,
    payoutClaimed: false,
    createdAtMs: nowMs,
    soldAtMs: null,
    updatedAtMs: nowMs,
  };

  if (!isFirestoreVerified()) {
    const cur = readLocalMarketListings();
    writeLocalMarketListings([localRecord, ...cur]);
    return {
      ok: true,
      message: 'Anúncio enviado para a vitrine pública de 2 minutos!',
      listing: localRecord,
    };
  }

  const user = auth.currentUser;
  if (!user || !user.emailVerified || user.uid !== params.sellerUid) {
    return {
      ok: false,
      message: 'Faça login com conta verificada para anunciar no Mercado.',
    };
  }

  await ensurePlayerDocBootstrapped(user);
  const path = `playerMarketListings/${listingId}`;
  try {
    await setDoc(doc(db, 'playerMarketListings', listingId), {
      listingId,
      sellerUid: user.uid,
      sellerName: cleanSellerName,
      itemKey: localRecord.itemKey,
      itemName: localRecord.itemName,
      itemCategory: localRecord.itemCategory,
      itemRarity: localRecord.itemRarity,
      itemIconUrl: localRecord.itemIconUrl,
      itemDescription: localRecord.itemDescription,
      quantity: safeQty,
      eggHatchLevel,
      priceBits: safePrice,
      status: 'active',
      buyerUid: null,
      buyerName: null,
      payoutClaimed: false,
      createdAt: serverTimestamp(),
      soldAt: null,
      updatedAt: serverTimestamp(),
    });
    return {
      ok: true,
      message: 'Anúncio publicado! Toda a comunidade verá na vitrine pelos próximos 2 minutos antes de liberar a compra.',
      listing: localRecord,
    };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.CREATE, path);
    } catch {
      // Non-fatal
    }
    return {
      ok: false,
      message: 'Não foi possível publicar o anúncio agora. Tente novamente.',
    };
  }
}

export interface PurchaseMarketListingResult {
  ok: boolean;
  message: string;
  purchasedListing?: PlayerMarketListingRecord;
}

/**
 * Atomically purchases a listing once its 2-minute public pre-listing countdown has elapsed.
 * Uses a Firestore Transaction so two players can NEVER buy the same item simultaneously.
 */
export async function purchasePlayerMarketListing(params: {
  listingId: string;
  buyerUid: string;
  buyerName: string;
}): Promise<PurchaseMarketListingResult> {
  const cleanBuyerName = params.buyerName.trim().slice(0, 24) || 'Tamer';

  if (!isFirestoreVerified()) {
    const list = readLocalMarketListings();
    const idx = list.findIndex((l) => l.listingId === params.listingId);
    if (idx < 0) {
      return { ok: false, message: 'Este anúncio não foi encontrado.' };
    }
    const target = list[idx];
    if (target.status !== 'active') {
      return { ok: false, message: 'Este item já foi comprado ou cancelado.' };
    }
    if (target.sellerUid === params.buyerUid) {
      return { ok: false, message: 'Você não pode comprar o seu próprio anúncio.' };
    }
    const rem = getMarketRemainingMs(target, Date.now());
    if (rem > 0) {
      return {
        ok: false,
        message: `Aguarde o fim da vitrine pública (${formatMarketCountdown(rem)}) para comprar.`,
      };
    }
    const now = Date.now();
    const sold: PlayerMarketListingRecord = {
      ...target,
      status: 'sold',
      buyerUid: params.buyerUid,
      buyerName: cleanBuyerName,
      soldAtMs: now,
      updatedAtMs: now,
    };
    list[idx] = sold;
    writeLocalMarketListings(list);
    return { ok: true, message: 'Compra concluída!', purchasedListing: sold };
  }

  const user = auth.currentUser;
  if (!user || !user.emailVerified || user.uid !== params.buyerUid) {
    return {
      ok: false,
      message: 'Faça login com conta verificada para comprar no Mercado.',
    };
  }

  await ensurePlayerDocBootstrapped(user);
  const listingRef = doc(db, 'playerMarketListings', params.listingId);

  try {
    const purchased = await runTransaction(db, async (tx) => {
      const snap = await tx.get(listingRef);
      if (!snap.exists()) {
        throw new Error('NOT_FOUND');
      }
      const parsed = parseListingDoc(
        snap.id,
        (snap.data() ?? {}) as Record<string, unknown>
      );
      if (parsed.status !== 'active') {
        throw new Error('ALREADY_SOLD');
      }
      if (parsed.sellerUid === user.uid) {
        throw new Error('OWN_LISTING');
      }
      const rem = getMarketRemainingMs(parsed, Date.now());
      if (rem > 0) {
        throw new Error(`LOCKED:${formatMarketCountdown(rem)}`);
      }

      tx.update(listingRef, {
        status: 'sold',
        buyerUid: user.uid,
        buyerName: cleanBuyerName,
        soldAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        ...parsed,
        status: 'sold' as const,
        buyerUid: user.uid,
        buyerName: cleanBuyerName,
        soldAtMs: Date.now(),
        updatedAtMs: Date.now(),
      };
    });

    return {
      ok: true,
      message: `Comprou ${purchased.itemName} com sucesso!`,
      purchasedListing: purchased,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'NOT_FOUND') {
      return { ok: false, message: 'Este anúncio não existe mais.' };
    }
    if (msg === 'ALREADY_SOLD') {
      return {
        ok: false,
        message: 'Outro jogador foi mais rápido e já comprou este item!',
      };
    }
    if (msg === 'OWN_LISTING') {
      return { ok: false, message: 'Você não pode comprar o seu próprio anúncio.' };
    }
    if (msg.startsWith('LOCKED:')) {
      return {
        ok: false,
        message: `Vitrine pública ativa: aguarde ${msg.slice(7)} para liberar a compra.`,
      };
    }
    // Permission denied can happen if client clock is slightly ahead of Firestore server time (120s rule)
    if (msg.toLowerCase().includes('permission')) {
      return {
        ok: false,
        message: 'Aguarde mais alguns segundos até o servidor liberar a vitrine de 2 minutos.',
      };
    }
    return {
      ok: false,
      message: 'Não foi possível concluir a compra agora. Tente novamente.',
    };
  }
}

export interface CancelMarketListingResult {
  ok: boolean;
  message: string;
  cancelledListing?: PlayerMarketListingRecord;
}

/**
 * Atomically cancels the seller's own active listing so the item is returned to their inventory.
 */
export async function cancelPlayerMarketListing(params: {
  listingId: string;
  sellerUid: string;
}): Promise<CancelMarketListingResult> {
  if (!isFirestoreVerified()) {
    const list = readLocalMarketListings();
    const idx = list.findIndex((l) => l.listingId === params.listingId);
    if (idx < 0) return { ok: false, message: 'Anúncio não encontrado.' };
    const target = list[idx];
    if (target.sellerUid !== params.sellerUid) {
      return { ok: false, message: 'Você só pode cancelar seus próprios anúncios.' };
    }
    if (target.status !== 'active') {
      return {
        ok: false,
        message: 'Este anúncio já foi vendido ou cancelado.',
      };
    }
    const cancelled: PlayerMarketListingRecord = {
      ...target,
      status: 'cancelled',
      updatedAtMs: Date.now(),
    };
    list[idx] = cancelled;
    writeLocalMarketListings(list);
    return {
      ok: true,
      message: 'Anúncio cancelado e item devolvido ao inventário.',
      cancelledListing: cancelled,
    };
  }

  const user = auth.currentUser;
  if (!user || !user.emailVerified || user.uid !== params.sellerUid) {
    return { ok: false, message: 'Sessão inválida.' };
  }

  const listingRef = doc(db, 'playerMarketListings', params.listingId);
  try {
    const cancelled = await runTransaction(db, async (tx) => {
      const snap = await tx.get(listingRef);
      if (!snap.exists()) throw new Error('NOT_FOUND');
      const parsed = parseListingDoc(
        snap.id,
        (snap.data() ?? {}) as Record<string, unknown>
      );
      if (parsed.sellerUid !== user.uid) throw new Error('NOT_OWNER');
      if (parsed.status !== 'active') throw new Error('NOT_ACTIVE');

      tx.update(listingRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      return {
        ...parsed,
        status: 'cancelled' as const,
        updatedAtMs: Date.now(),
      };
    });
    return {
      ok: true,
      message: 'Anúncio cancelado! O item voltou para o seu inventário.',
      cancelledListing: cancelled,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'NOT_ACTIVE') {
      return {
        ok: false,
        message: 'Este item acabou de ser vendido! Resgate seus Bits na aba Meus Anúncios.',
      };
    }
    return {
      ok: false,
      message: 'Não foi possível cancelar o anúncio agora.',
    };
  }
}

export interface ClaimPayoutResult {
  ok: boolean;
  message: string;
  priceBits?: number;
  listing?: PlayerMarketListingRecord;
}

/**
 * Atomically marks a sold listing's payout as claimed so the seller receives Bits exactly once.
 */
export async function claimMarketListingPayout(params: {
  listingId: string;
  sellerUid: string;
}): Promise<ClaimPayoutResult> {
  if (!isFirestoreVerified()) {
    const list = readLocalMarketListings();
    const idx = list.findIndex((l) => l.listingId === params.listingId);
    if (idx < 0) return { ok: false, message: 'Venda não encontrada.' };
    const target = list[idx];
    if (target.sellerUid !== params.sellerUid || target.status !== 'sold') {
      return { ok: false, message: 'Esta venda não está disponível para resgate.' };
    }
    if (target.payoutClaimed) {
      return { ok: false, message: 'Os Bits desta venda já foram resgatados.' };
    }
    const updated: PlayerMarketListingRecord = {
      ...target,
      payoutClaimed: true,
      updatedAtMs: Date.now(),
    };
    list[idx] = updated;
    writeLocalMarketListings(list);
    return {
      ok: true,
      message: 'Bits resgatados com sucesso!',
      priceBits: target.priceBits,
      listing: updated,
    };
  }

  const user = auth.currentUser;
  if (!user || !user.emailVerified || user.uid !== params.sellerUid) {
    return { ok: false, message: 'Sessão inválida.' };
  }

  const listingRef = doc(db, 'playerMarketListings', params.listingId);
  try {
    const claimed = await runTransaction(db, async (tx) => {
      const snap = await tx.get(listingRef);
      if (!snap.exists()) throw new Error('NOT_FOUND');
      const parsed = parseListingDoc(
        snap.id,
        (snap.data() ?? {}) as Record<string, unknown>
      );
      if (parsed.sellerUid !== user.uid) throw new Error('NOT_OWNER');
      if (parsed.status !== 'sold') throw new Error('NOT_SOLD');
      if (parsed.payoutClaimed) throw new Error('ALREADY_CLAIMED');

      tx.update(listingRef, {
        payoutClaimed: true,
        updatedAt: serverTimestamp(),
      });
      return {
        ...parsed,
        payoutClaimed: true,
        updatedAtMs: Date.now(),
      };
    });

    return {
      ok: true,
      message: 'Bits da venda creditados na sua conta!',
      priceBits: claimed.priceBits,
      listing: claimed,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'ALREADY_CLAIMED') {
      return { ok: false, message: 'Os Bits desta venda já foram resgatados.' };
    }
    return {
      ok: false,
      message: 'Não foi possível resgatar os Bits agora. Tente novamente.',
    };
  }
}
