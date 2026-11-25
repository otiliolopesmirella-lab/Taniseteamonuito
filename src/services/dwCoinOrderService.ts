import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  DWCOIN_PURCHASE_TERMS_VERSION,
  getDwCoinRechargePackById,
} from '../data/dwCoinShopCatalog';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

export type DwCoinPaymentMethod = 'pix' | 'card';
export type DwCoinOrderStatus = 'pending' | 'cancelled' | 'approved' | 'error';

export const DWCOIN_PAYMENT_MESSAGES = {
  cancelled: 'Pagamento cancelado. Nenhum DL Din foi adicionado.',
  pending: 'Pagamento pendente. Aguarde a confirmação.',
  approved: 'Pagamento aprovado! Seus DL Din foram adicionados à sua conta.',
  error:
    'Não foi possível processar o pagamento. Tente novamente ou entre em contato com o suporte.',
} as const;

export interface DwCoinPurchaseOrder {
  orderId: string;
  ownerUid: string;
  packId: string;
  dwCoinAmount: number;
  priceCents: number;
  priceBrlLabel: string;
  paymentMethod: DwCoinPaymentMethod;
  termsAccepted: true;
  termsVersion: typeof DWCOIN_PURCHASE_TERMS_VERSION;
  termsAcceptedAtIso: string;
  status: DwCoinOrderStatus;
  persistedInCloud: boolean;
}

export interface CreateDwCoinOrderInput {
  playerId: string;
  packId: string;
  paymentMethod: DwCoinPaymentMethod;
  termsAccepted: boolean;
  termsVersion?: string;
}

function generateOrderId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `ord_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Cria e registra um pedido pendente de compra de DWcoin somente após aceite explícito dos termos.
 * - Resolve quantidade de DWcoins e valor exclusivamente pelo catálogo oficial (nunca aceita valores alterados).
 * - Nunca marca o pedido como 'approved' nem credita DWcoins no cliente.
 * - Nunca armazena dados sensíveis de cartão.
 */
export async function createDwCoinPurchaseOrder(
  input: CreateDwCoinOrderInput
): Promise<DwCoinPurchaseOrder> {
  if (!input.termsAccepted) {
    throw new Error(
      'Aceite os termos da compra antes de continuar para o pagamento.'
    );
  }
  const version = input.termsVersion ?? DWCOIN_PURCHASE_TERMS_VERSION;
  if (version !== DWCOIN_PURCHASE_TERMS_VERSION) {
    throw new Error(DWCOIN_PAYMENT_MESSAGES.error);
  }
  if (input.paymentMethod !== 'pix' && input.paymentMethod !== 'card') {
    throw new Error(DWCOIN_PAYMENT_MESSAGES.error);
  }

  const officialPack = getDwCoinRechargePackById(input.packId);
  if (!officialPack) {
    throw new Error(DWCOIN_PAYMENT_MESSAGES.error);
  }

  const user = auth.currentUser;
  const resolvedOwnerUid =
    user && user.emailVerified
      ? user.uid
      : (input.playerId || 'local_player').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) ||
        'local_player';

  const orderId = generateOrderId();
  const termsAcceptedAtIso = new Date().toISOString();

  const order: DwCoinPurchaseOrder = {
    orderId,
    ownerUid: resolvedOwnerUid,
    packId: officialPack.id,
    dwCoinAmount: officialPack.dwCoinAmount,
    priceCents: officialPack.priceCents,
    priceBrlLabel: officialPack.priceBrlLabel,
    paymentMethod: input.paymentMethod,
    termsAccepted: true,
    termsVersion: DWCOIN_PURCHASE_TERMS_VERSION,
    termsAcceptedAtIso,
    status: 'pending',
    persistedInCloud: false,
  };

  if (user && user.emailVerified) {
    const path = `dwCoinOrders/${orderId}`;
    try {
      await setDoc(doc(db, 'dwCoinOrders', orderId), {
        orderId: order.orderId,
        ownerUid: user.uid,
        packId: order.packId,
        dwCoinAmount: order.dwCoinAmount,
        priceCents: order.priceCents,
        priceBrlLabel: order.priceBrlLabel,
        paymentMethod: order.paymentMethod,
        termsAccepted: true,
        termsVersion: order.termsVersion,
        termsAcceptedAt: serverTimestamp(),
        termsAcceptedAtIso: order.termsAcceptedAtIso,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      order.persistedInCloud = true;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  return order;
}

export interface PendingPlayerOrderSummary {
  orderId: string;
  packId: string;
  dwCoinAmount: number;
  priceBrlLabel: string;
  paymentMethod: DwCoinPaymentMethod;
  createdAtMs: number;
}

/**
 * Lista os pedidos pendentes recentes da própria conta autenticada para verificação
 * automática no Mercado Pago (ex.: ao voltar do app do banco ou reabrir o jogo).
 */
export async function listMyPendingDwCoinOrders(
  maxAgeMs = 72 * 60 * 60 * 1000
): Promise<PendingPlayerOrderSummary[]> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return [];

  try {
    const snap = await getDocs(
      query(collection(db, 'dwCoinOrders'), where('ownerUid', '==', user.uid))
    );
    const cutoff = Date.now() - maxAgeMs;
    const rows: PendingPlayerOrderSummary[] = [];

    snap.forEach((docSnap) => {
      const d = docSnap.data() ?? {};
      if (d.status !== 'pending') return;
      const rawCreated = d.createdAt;
      const createdAtMs =
        rawCreated instanceof Timestamp
          ? rawCreated.toMillis()
          : rawCreated &&
              typeof rawCreated === 'object' &&
              'toMillis' in rawCreated &&
              typeof (rawCreated as Timestamp).toMillis === 'function'
            ? (rawCreated as Timestamp).toMillis()
            : Date.now();
      if (createdAtMs < cutoff) return;
      rows.push({
        orderId: String(d.orderId ?? docSnap.id),
        packId: String(d.packId ?? 'pack_10'),
        dwCoinAmount: typeof d.dwCoinAmount === 'number' ? d.dwCoinAmount : 0,
        priceBrlLabel: String(d.priceBrlLabel ?? ''),
        paymentMethod: d.paymentMethod === 'card' ? 'card' : 'pix',
        createdAtMs,
      });
    });

    rows.sort((a, b) => b.createdAtMs - a.createdAtMs);
    return rows.slice(0, 8);
  } catch {
    return [];
  }
}

/**
 * Cancela um pedido pendente sem creditar nenhum DWcoin.
 */
export async function cancelDwCoinPurchaseOrder(
  order: DwCoinPurchaseOrder | null
): Promise<DwCoinPurchaseOrder | null> {
  if (!order) return null;

  const updated: DwCoinPurchaseOrder = {
    ...order,
    status: 'cancelled',
  };

  const user = auth.currentUser;
  if (order.persistedInCloud && user && user.emailVerified && order.status === 'pending') {
    const path = `dwCoinOrders/${order.orderId}`;
    try {
      await updateDoc(doc(db, 'dwCoinOrders', order.orderId), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  return updated;
}
