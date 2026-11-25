import crypto from 'node:crypto';
import {
  FIREBASE_DATABASE_ID,
  FIREBASE_PROJECT_ID,
  isValidOrderId,
  isValidPaymentId,
  SERVER_DWCOIN_PACKS,
  type MpPaymentRecord,
} from './mpShared.js';

interface ServiceAccountCredentials {
  project_id?: string;
  client_email: string;
  private_key: string;
}

interface CachedAccessToken {
  accessToken: string;
  expiresAtMs: number;
}

export interface AutoCreditResult {
  ok: boolean;
  autoCreditConfigured: boolean;
  credited: boolean;
  alreadyCredited: boolean;
  dwCoinAmount: number;
  nextBalance: number | null;
  errorCode?: string;
}

let cachedServiceAccount: ServiceAccountCredentials | null | undefined;
let cachedOAuthToken: CachedAccessToken | null = null;

function parseServiceAccountFromEnv(): ServiceAccountCredentials | null {
  if (cachedServiceAccount !== undefined) {
    return cachedServiceAccount;
  }

  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    const candidates = [rawJson];
    if (!rawJson.startsWith('{')) {
      try {
        candidates.push(Buffer.from(rawJson, 'base64').toString('utf8').trim());
      } catch {
        // Ignore invalid base64
      }
    }
    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as Partial<ServiceAccountCredentials>;
        if (
          typeof parsed.client_email === 'string' &&
          parsed.client_email.includes('@') &&
          typeof parsed.private_key === 'string' &&
          parsed.private_key.includes('PRIVATE KEY')
        ) {
          cachedServiceAccount = {
            project_id:
              typeof parsed.project_id === 'string'
                ? parsed.project_id.trim()
                : undefined,
            client_email: parsed.client_email.trim(),
            private_key: parsed.private_key.replace(/\\n/g, '\n'),
          };
          return cachedServiceAccount;
        }
      } catch {
        // Try next candidate
      }
    }
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
  if (clientEmail && privateKey) {
    cachedServiceAccount = {
      project_id:
        process.env.FIREBASE_PROJECT_ID?.trim() ||
        process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
        undefined,
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    };
    return cachedServiceAccount;
  }

  cachedServiceAccount = null;
  return null;
}

export function isFirestoreAutoCreditConfigured(): boolean {
  return parseServiceAccountFromEnv() !== null;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function getGoogleDatastoreAccessToken(
  creds: ServiceAccountCredentials
): Promise<string> {
  const nowMs = Date.now();
  if (cachedOAuthToken && cachedOAuthToken.expiresAtMs > nowMs + 60_000) {
    return cachedOAuthToken.accessToken;
  }

  const nowSec = Math.floor(nowMs / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: creds.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      iat: nowSec,
      exp: nowSec + 3600,
    })
  );

  const unsignedJwt = `${header}.${claimSet}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  signer.end();
  const signature = base64UrlEncode(signer.sign(creds.private_key));
  const assertion = `${unsignedJwt}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`OAUTH_TOKEN_FAILED_${tokenRes.status}`);
  }

  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!tokenData.access_token) {
    throw new Error('OAUTH_TOKEN_MISSING');
  }

  const expiresInSec =
    typeof tokenData.expires_in === 'number' && tokenData.expires_in > 120
      ? tokenData.expires_in
      : 3600;
  cachedOAuthToken = {
    accessToken: tokenData.access_token,
    expiresAtMs: nowMs + expiresInSec * 1000,
  };
  return tokenData.access_token;
}

type FirestoreRestValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { stringValue: string }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreRestValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreRestValue> } };

interface FirestoreRestDoc {
  name?: string;
  fields?: Record<string, FirestoreRestValue>;
}

function readStringField(
  fields: Record<string, FirestoreRestValue> | undefined,
  key: string
): string | null {
  const v = fields?.[key];
  if (v && 'stringValue' in v && typeof v.stringValue === 'string') {
    return v.stringValue;
  }
  return null;
}

function readNumberField(
  fields: Record<string, FirestoreRestValue> | undefined,
  key: string
): number | null {
  const v = fields?.[key];
  if (!v) return null;
  if ('integerValue' in v) {
    const n = Number(v.integerValue);
    return Number.isFinite(n) ? n : null;
  }
  if ('doubleValue' in v && typeof v.doubleValue === 'number') {
    return Number.isFinite(v.doubleValue) ? v.doubleValue : null;
  }
  return null;
}

function readMapFields(
  fields: Record<string, FirestoreRestValue> | undefined,
  key: string
): Record<string, FirestoreRestValue> | null {
  const v = fields?.[key];
  if (v && 'mapValue' in v && v.mapValue && typeof v.mapValue === 'object') {
    return v.mapValue.fields ?? {};
  }
  return null;
}

function isValidUid(uid: unknown): uid is string {
  return (
    typeof uid === 'string' &&
    uid.length >= 4 &&
    uid.length <= 128 &&
    /^[a-zA-Z0-9_-]+$/.test(uid)
  );
}

function buildDefaultHudStateRestValue(
  dCoinAmount: number,
  nowIso: string
): FirestoreRestValue {
  const defaultStats: FirestoreRestValue = {
    mapValue: {
      fields: {
        level: { integerValue: '1' },
        exp: { integerValue: '0' },
        expToNext: { integerValue: '100' },
        hp: { integerValue: '100' },
        maxHp: { integerValue: '100' },
        ds: { integerValue: '50' },
        maxDs: { integerValue: '50' },
      },
    },
  };

  return {
    mapValue: {
      fields: {
        tamer: defaultStats,
        digimon: defaultStats,
        bits: { integerValue: '0' },
        dCoin: { integerValue: String(dCoinAmount) },
        inventory: { arrayValue: { values: [] } },
        equippedItems: { mapValue: { fields: {} } },
        guildName: { nullValue: null },
        defeatedEnemiesTotal: { integerValue: '0' },
        updatedAt: { stringValue: nowIso },
      },
    },
  };
}

function sanitizeUsername(raw: string | null, uid: string): string {
  const cleaned = (raw ?? '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 24);
  if (cleaned.length >= 3) return cleaned;
  const suffix = uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || '001';
  return `Tamer_${suffix}`.slice(0, 24);
}

async function rollbackTransaction(
  baseDbUrl: string,
  accessToken: string,
  transaction: string
): Promise<void> {
  await fetch(`${baseDbUrl}/documents:rollback`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transaction }),
  }).catch(() => {});
}

/**
 * Atomically and idempotently credits an approved Mercado Pago payment to the
 * player's Firestore account (`/players/{uid}`), marks `/dwCoinOrders/{orderId}`
 * as `'approved'`, and writes a unique `/dwCoinTransactions/mp_{paymentId}`
 * ledger entry with a database-level `exists: false` precondition.
 */
export async function creditApprovedMercadoPagoPayment(
  payment: MpPaymentRecord | null
): Promise<AutoCreditResult> {
  const creds = parseServiceAccountFromEnv();
  if (!creds) {
    return {
      ok: false,
      autoCreditConfigured: false,
      credited: false,
      alreadyCredited: false,
      dwCoinAmount: 0,
      nextBalance: null,
      errorCode: 'FIREBASE_SERVICE_ACCOUNT_NOT_CONFIGURED',
    };
  }

  if (!payment || payment.status !== 'approved' || !payment.id) {
    return {
      ok: false,
      autoCreditConfigured: true,
      credited: false,
      alreadyCredited: false,
      dwCoinAmount: 0,
      nextBalance: null,
      errorCode: 'PAYMENT_NOT_APPROVED',
    };
  }

  const mpPaymentId = String(payment.id).trim();
  const orderId =
    typeof payment.external_reference === 'string'
      ? payment.external_reference.trim()
      : '';
  const ownerUid = payment.metadata?.owner_uid?.trim();
  const packId = payment.metadata?.pack_id?.trim();

  if (!isValidPaymentId(mpPaymentId) || !isValidOrderId(orderId) || !isValidUid(ownerUid)) {
    return {
      ok: false,
      autoCreditConfigured: true,
      credited: false,
      alreadyCredited: false,
      dwCoinAmount: 0,
      nextBalance: null,
      errorCode: 'INVALID_PAYMENT_METADATA',
    };
  }

  const officialPack = packId ? SERVER_DWCOIN_PACKS[packId] : undefined;
  const amountPaid =
    typeof payment.transaction_amount === 'number'
      ? payment.transaction_amount
      : null;

  if (!officialPack || amountPaid === null || amountPaid + 0.01 < officialPack.priceBrl) {
    return {
      ok: false,
      autoCreditConfigured: true,
      credited: false,
      alreadyCredited: false,
      dwCoinAmount: 0,
      nextBalance: null,
      errorCode: 'AMOUNT_OR_PACK_MISMATCH',
    };
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
    creds.project_id ||
    FIREBASE_PROJECT_ID;
  const databaseId = FIREBASE_DATABASE_ID || '(default)';
  const baseDbPath = `projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(databaseId)}`;
  const baseDbUrl = `https://firestore.googleapis.com/v1/${baseDbPath}`;

  const docRoot = `projects/${projectId}/databases/${databaseId}/documents`;
  const orderDocName = `${docRoot}/dwCoinOrders/${orderId}`;
  const playerDocName = `${docRoot}/players/${ownerUid}`;
  const txId = `mp_${mpPaymentId}`;
  const txDocName = `${docRoot}/dwCoinTransactions/${txId}`;

  const accessToken = await getGoogleDatastoreAccessToken(creds);

  const MAX_ATTEMPTS = 4;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const beginRes = await fetch(`${baseDbUrl}/documents:beginTransaction`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        options: { readWrite: {} },
      }),
    });

    if (!beginRes.ok) {
      throw new Error(`FIRESTORE_BEGIN_TX_FAILED_${beginRes.status}`);
    }

    const beginData = (await beginRes.json()) as { transaction?: string };
    const transaction = beginData.transaction;
    if (!transaction) {
      throw new Error('FIRESTORE_TX_TOKEN_MISSING');
    }

    try {
      const batchGetRes = await fetch(`${baseDbUrl}/documents:batchGet`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documents: [orderDocName, playerDocName, txDocName],
          transaction,
        }),
      });

      if (!batchGetRes.ok) {
        await rollbackTransaction(baseDbUrl, accessToken, transaction);
        throw new Error(`FIRESTORE_BATCH_GET_FAILED_${batchGetRes.status}`);
      }

      const rows = (await batchGetRes.json()) as Array<{
        found?: FirestoreRestDoc;
        missing?: string;
      }>;

      const foundByName = new Map<string, FirestoreRestDoc>();
      for (const row of rows) {
        if (row.found?.name) {
          foundByName.set(row.found.name, row.found);
        }
      }

      const orderDoc = foundByName.get(orderDocName) ?? null;
      const playerDoc = foundByName.get(playerDocName) ?? null;
      const existingTxDoc = foundByName.get(txDocName) ?? null;

      // Strict idempotency: if ledger tx already exists OR order is already approved, never double-credit
      const existingOrderStatus = readStringField(orderDoc?.fields, 'status');
      if (existingTxDoc || existingOrderStatus === 'approved') {
        await rollbackTransaction(baseDbUrl, accessToken, transaction);
        const hudFields = readMapFields(playerDoc?.fields, 'hudState');
        const currentBalance = readNumberField(hudFields ?? undefined, 'dCoin');
        return {
          ok: true,
          autoCreditConfigured: true,
          credited: false,
          alreadyCredited: true,
          dwCoinAmount: officialPack.dwCoinAmount,
          nextBalance: currentBalance,
        };
      }

      if (orderDoc) {
        const orderOwnerUid = readStringField(orderDoc.fields, 'ownerUid');
        if (orderOwnerUid && orderOwnerUid !== ownerUid) {
          await rollbackTransaction(baseDbUrl, accessToken, transaction);
          return {
            ok: false,
            autoCreditConfigured: true,
            credited: false,
            alreadyCredited: false,
            dwCoinAmount: 0,
            nextBalance: null,
            errorCode: 'ORDER_OWNER_MISMATCH',
          };
        }
      }

      if (!playerDoc) {
        await rollbackTransaction(baseDbUrl, accessToken, transaction);
        return {
          ok: false,
          autoCreditConfigured: true,
          credited: false,
          alreadyCredited: false,
          dwCoinAmount: 0,
          nextBalance: null,
          errorCode: 'PLAYER_NOT_FOUND',
        };
      }

      const existingHudFields = readMapFields(playerDoc.fields, 'hudState');
      const prevDCoin = Math.max(
        0,
        Math.round(readNumberField(existingHudFields ?? undefined, 'dCoin') ?? 0)
      );
      const nextDCoin = Math.min(
        1_000_000_000,
        prevDCoin + officialPack.dwCoinAmount
      );

      const username = sanitizeUsername(
        readStringField(playerDoc.fields, 'username'),
        ownerUid
      );
      const tamerSelFields = readMapFields(playerDoc.fields, 'tamerSelection');
      const rawTamerName =
        readStringField(tamerSelFields ?? undefined, 'tamerName') ?? username;
      const tamerName = rawTamerName.trim().slice(0, 24) || username;

      const nowIso = new Date().toISOString();
      const methodUsed =
        payment.payment_method_id === 'pix' ? 'pix' : 'card';

      const writes: Array<Record<string, unknown>> = [];

      // 1. Update (or create if missing) dwCoinOrders/{orderId} -> status: 'approved'
      if (orderDoc) {
        writes.push({
          update: {
            name: orderDocName,
            fields: {
              status: { stringValue: 'approved' },
            },
          },
          updateMask: {
            fieldPaths: ['status'],
          },
          updateTransforms: [
            { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
          ],
          currentDocument: { exists: true },
        });
      } else {
        writes.push({
          update: {
            name: orderDocName,
            fields: {
              orderId: { stringValue: orderId },
              ownerUid: { stringValue: ownerUid },
              packId: { stringValue: officialPack.id },
              dwCoinAmount: { integerValue: String(officialPack.dwCoinAmount) },
              priceCents: { integerValue: String(officialPack.priceCents) },
              priceBrlLabel: { stringValue: officialPack.priceBrlLabel },
              paymentMethod: { stringValue: methodUsed },
              termsAccepted: { booleanValue: true },
              termsVersion: { stringValue: 'v1.0' },
              termsAcceptedAtIso: { stringValue: nowIso },
              status: { stringValue: 'approved' },
            },
          },
          updateTransforms: [
            { fieldPath: 'termsAcceptedAt', setToServerValue: 'REQUEST_TIME' },
            { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
            { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
          ],
          currentDocument: { exists: false },
        });
      }

      // 2. Credit players/{ownerUid} without clobbering any other HUD / inventory / level fields
      if (existingHudFields) {
        writes.push({
          update: {
            name: playerDocName,
            fields: {
              hudState: {
                mapValue: {
                  fields: {
                    dCoin: { integerValue: String(nextDCoin) },
                    updatedAt: { stringValue: nowIso },
                  },
                },
              },
            },
          },
          updateMask: {
            fieldPaths: ['hudState.dCoin', 'hudState.updatedAt'],
          },
          updateTransforms: [
            { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
          ],
          currentDocument: { exists: true },
        });
      } else {
        writes.push({
          update: {
            name: playerDocName,
            fields: {
              hudState: buildDefaultHudStateRestValue(nextDCoin, nowIso),
            },
          },
          updateMask: {
            fieldPaths: ['hudState'],
          },
          updateTransforms: [
            { fieldPath: 'updatedAt', setToServerValue: 'REQUEST_TIME' },
          ],
          currentDocument: { exists: true },
        });
      }

      // 3. Create deterministic ledger transaction dwCoinTransactions/mp_{mpPaymentId} (exists: false guard!)
      const itemLabel = `Recarga MP ${officialPack.dwCoinAmount} DL Din (#${mpPaymentId})`.slice(
        0,
        64
      );
      writes.push({
        update: {
          name: txDocName,
          fields: {
            txId: { stringValue: txId },
            ownerUid: { stringValue: ownerUid },
            username: { stringValue: username },
            tamerName: { stringValue: tamerName },
            type: { stringValue: 'recharge' },
            dwCoinAmount: { integerValue: String(officialPack.dwCoinAmount) },
            itemKey: { stringValue: officialPack.id },
            itemName: { stringValue: itemLabel },
            category: { stringValue: 'recarga' },
            balanceAfter: { integerValue: String(nextDCoin) },
          },
        },
        updateTransforms: [
          { fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' },
        ],
        currentDocument: { exists: false },
      });

      const commitRes = await fetch(`${baseDbUrl}/documents:commit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          writes,
          transaction,
        }),
      });

      if (commitRes.ok) {
        return {
          ok: true,
          autoCreditConfigured: true,
          credited: true,
          alreadyCredited: false,
          dwCoinAmount: officialPack.dwCoinAmount,
          nextBalance: nextDCoin,
        };
      }

      // 409 ABORTED = concurrent write collision (e.g. player auto-save or concurrent webhook); retry cleanly
      if (commitRes.status === 409 && attempt < MAX_ATTEMPTS - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, 120 * (attempt + 1) + Math.floor(Math.random() * 80))
        );
        continue;
      }

      // 400 FAILED_PRECONDITION on exists:false can happen if another worker just created mp_{mpPaymentId}
      if (commitRes.status === 400 && attempt < MAX_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, 120));
        continue;
      }

      throw new Error(`FIRESTORE_COMMIT_FAILED_${commitRes.status}`);
    } catch (err) {
      await rollbackTransaction(baseDbUrl, accessToken, transaction);
      if (attempt === MAX_ATTEMPTS - 1) {
        throw err;
      }
    }
  }

  return {
    ok: false,
    autoCreditConfigured: true,
    credited: false,
    alreadyCredited: false,
    dwCoinAmount: 0,
    nextBalance: null,
    errorCode: 'RETRY_EXHAUSTED',
  };
}
