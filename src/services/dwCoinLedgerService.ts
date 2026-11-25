import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { isCurrentAuthUserBootstrappedGm } from './gmRoleService';

export type DwCoinTransactionType =
  | 'spend'
  | 'recharge'
  | 'gm_grant'
  | 'gm_deduct';

export interface DwCoinTransactionRecord {
  txId: string;
  ownerUid: string;
  username: string;
  tamerName: string;
  type: DwCoinTransactionType;
  dwCoinAmount: number;
  itemKey: string;
  itemName: string;
  category: string;
  balanceAfter: number;
  createdAtMs: number;
}

export interface DwCoinSpendAnalytics {
  totalSpent: number;
  totalRecharged: number;
  totalGmGranted: number;
  totalGmDeducted: number;
  spendCount: number;
  topItems: Array<{
    itemKey: string;
    itemName: string;
    category: string;
    purchases: number;
    totalDwCoin: number;
  }>;
  byCategory: Array<{
    category: string;
    purchases: number;
    totalDwCoin: number;
  }>;
}

function generateTxId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `tx_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

function sanitizeLedgerUsername(raw: string, uid: string): string {
  const clean = raw.trim().replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 24);
  if (clean.length >= 3) return clean;
  const suffix = uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || '001';
  return `Tamer_${suffix}`.slice(0, 24);
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

/**
 * Records a verified player's DWcoin shop purchase in `/dwCoinTransactions/{txId}`.
 * Runs best-effort after purchase so offline/test sessions never break gameplay.
 */
export async function recordDwCoinSpendTransaction(input: {
  username: string;
  tamerName: string;
  itemKey: string;
  itemName: string;
  category: string;
  dwCoinAmount: number;
  balanceAfter: number;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const amount = Math.max(1, Math.min(100_000_000, Math.round(input.dwCoinAmount)));
  const balanceAfter = Math.max(
    0,
    Math.min(1_000_000_000, Math.round(input.balanceAfter))
  );
  const txId = generateTxId();
  const path = `dwCoinTransactions/${txId}`;

  try {
    await setDoc(doc(db, 'dwCoinTransactions', txId), {
      txId,
      ownerUid: user.uid,
      username: sanitizeLedgerUsername(input.username, user.uid),
      tamerName: (input.tamerName || 'Tamer').trim().slice(0, 24),
      type: 'spend',
      dwCoinAmount: amount,
      itemKey: (input.itemKey || 'shop_item').trim().slice(0, 64) || 'shop_item',
      itemName: (input.itemName || 'Item Loja').trim().slice(0, 64) || 'Item Loja',
      category: (input.category || 'loja').trim().slice(0, 32) || 'loja',
      balanceAfter,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.CREATE, path);
    } catch {
      // Structured audit log without disrupting player purchase UI
    }
  }
}

/**
 * Records a GM-authorized DWcoin recharge approval or balance adjustment in `/dwCoinTransactions/{txId}`.
 */
export async function recordDwCoinAdminTransaction(input: {
  targetUid: string;
  username: string;
  tamerName: string;
  type: 'recharge' | 'gm_grant' | 'gm_deduct';
  dwCoinAmount: number;
  itemKey: string;
  itemName: string;
  category: string;
  balanceAfter: number;
}): Promise<void> {
  if (!isCurrentAuthUserBootstrappedGm()) {
    throw new Error('Apenas GMs autorizados podem registrar transações administrativas.');
  }
  const amount = Math.max(1, Math.min(100_000_000, Math.round(input.dwCoinAmount)));
  const balanceAfter = Math.max(
    0,
    Math.min(1_000_000_000, Math.round(input.balanceAfter))
  );
  const txId = generateTxId();
  const path = `dwCoinTransactions/${txId}`;

  try {
    await setDoc(doc(db, 'dwCoinTransactions', txId), {
      txId,
      ownerUid: input.targetUid,
      username: sanitizeLedgerUsername(input.username, input.targetUid),
      tamerName: (input.tamerName || input.username || 'Tamer').trim().slice(0, 24),
      type: input.type,
      dwCoinAmount: amount,
      itemKey: (input.itemKey || input.type).trim().slice(0, 64) || input.type,
      itemName: (input.itemName || 'Ajuste GM').trim().slice(0, 64) || 'Ajuste GM',
      category: (input.category || 'gm').trim().slice(0, 32) || 'gm',
      balanceAfter,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function listDwCoinTransactionsForGm(
  maxRows = 120
): Promise<DwCoinTransactionRecord[]> {
  if (!isCurrentAuthUserBootstrappedGm()) {
    return [];
  }

  try {
    const q = query(
      collection(db, 'dwCoinTransactions'),
      orderBy('createdAt', 'desc'),
      limit(Math.max(10, Math.min(250, maxRows)))
    );
    const snap = await getDocs(q);
    const out: DwCoinTransactionRecord[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const rawType = String(d.type ?? 'spend');
      const type: DwCoinTransactionType =
        rawType === 'recharge' ||
        rawType === 'gm_grant' ||
        rawType === 'gm_deduct'
          ? rawType
          : 'spend';

      out.push({
        txId: String(d.txId ?? docSnap.id),
        ownerUid: String(d.ownerUid ?? ''),
        username: String(d.username ?? 'Tamer'),
        tamerName: String(d.tamerName ?? ''),
        type,
        dwCoinAmount:
          typeof d.dwCoinAmount === 'number' && Number.isFinite(d.dwCoinAmount)
            ? d.dwCoinAmount
            : 0,
        itemKey: String(d.itemKey ?? ''),
        itemName: String(d.itemName ?? 'Item'),
        category: String(d.category ?? 'outros'),
        balanceAfter:
          typeof d.balanceAfter === 'number' && Number.isFinite(d.balanceAfter)
            ? d.balanceAfter
            : 0,
        createdAtMs: parseTimestampMs(d.createdAt),
      });
    });
    return out;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'dwCoinTransactions');
  }
}

export function summarizeDwCoinTransactions(
  txs: readonly DwCoinTransactionRecord[]
): DwCoinSpendAnalytics {
  let totalSpent = 0;
  let totalRecharged = 0;
  let totalGmGranted = 0;
  let totalGmDeducted = 0;
  let spendCount = 0;

  const itemMap = new Map<
    string,
    {
      itemKey: string;
      itemName: string;
      category: string;
      purchases: number;
      totalDwCoin: number;
    }
  >();
  const catMap = new Map<
    string,
    { category: string; purchases: number; totalDwCoin: number }
  >();

  for (const tx of txs) {
    if (tx.type === 'spend') {
      totalSpent += tx.dwCoinAmount;
      spendCount += 1;

      const existingItem = itemMap.get(tx.itemKey);
      if (existingItem) {
        existingItem.purchases += 1;
        existingItem.totalDwCoin += tx.dwCoinAmount;
      } else {
        itemMap.set(tx.itemKey, {
          itemKey: tx.itemKey,
          itemName: tx.itemName,
          category: tx.category,
          purchases: 1,
          totalDwCoin: tx.dwCoinAmount,
        });
      }

      const existingCat = catMap.get(tx.category);
      if (existingCat) {
        existingCat.purchases += 1;
        existingCat.totalDwCoin += tx.dwCoinAmount;
      } else {
        catMap.set(tx.category, {
          category: tx.category,
          purchases: 1,
          totalDwCoin: tx.dwCoinAmount,
        });
      }
    } else if (tx.type === 'recharge') {
      totalRecharged += tx.dwCoinAmount;
    } else if (tx.type === 'gm_grant') {
      totalGmGranted += tx.dwCoinAmount;
    } else if (tx.type === 'gm_deduct') {
      totalGmDeducted += tx.dwCoinAmount;
    }
  }

  return {
    totalSpent,
    totalRecharged,
    totalGmGranted,
    totalGmDeducted,
    spendCount,
    topItems: Array.from(itemMap.values()).sort(
      (a, b) => b.totalDwCoin - a.totalDwCoin
    ),
    byCategory: Array.from(catMap.values()).sort(
      (a, b) => b.totalDwCoin - a.totalDwCoin
    ),
  };
}
