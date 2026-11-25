import {
  applyCorsHeaders,
  getQueryParam,
  isValidOrderId,
  isValidPaymentId,
  readJsonBody,
  sendJson,
  SERVER_DWCOIN_PACKS,
  verifyFirebaseRequest,
  type VercelApiRequest,
  type VercelApiResponse,
} from '../_lib/mpShared.js';

interface MpPaymentRecord {
  id?: number | string;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  date_approved?: string | null;
  date_created?: string | null;
  payment_method_id?: string;
  metadata?: {
    order_id?: string;
    owner_uid?: string;
    pack_id?: string;
    dw_coin_amount?: number;
    price_cents?: number;
  };
}

interface MpCheckResult {
  found: boolean;
  approved: boolean;
  orderId: string;
  mpPaymentId: string | null;
  mpStatus: string;
  mpStatusDetail: string | null;
  amountPaid: number | null;
  paidAt: string | null;
  paymentMethodId: string | null;
}

function evaluatePaymentRecord(
  payment: MpPaymentRecord | null,
  expectedOrderId: string,
  requesterUid: string,
  requesterIsGm: boolean
): MpCheckResult {
  if (!payment || !payment.id) {
    return {
      found: false,
      approved: false,
      orderId: expectedOrderId,
      mpPaymentId: null,
      mpStatus: 'not_found',
      mpStatusDetail: null,
      amountPaid: null,
      paidAt: null,
      paymentMethodId: null,
    };
  }

  if (payment.external_reference !== expectedOrderId) {
    return {
      found: false,
      approved: false,
      orderId: expectedOrderId,
      mpPaymentId: null,
      mpStatus: 'mismatch',
      mpStatusDetail: null,
      amountPaid: null,
      paidAt: null,
      paymentMethodId: null,
    };
  }

  const ownerUid = payment.metadata?.owner_uid;
  if (!requesterIsGm && ownerUid !== requesterUid) {
    return {
      found: false,
      approved: false,
      orderId: expectedOrderId,
      mpPaymentId: null,
      mpStatus: 'forbidden',
      mpStatusDetail: null,
      amountPaid: null,
      paidAt: null,
      paymentMethodId: null,
    };
  }

  const packId = payment.metadata?.pack_id;
  const officialPack =
    typeof packId === 'string' ? SERVER_DWCOIN_PACKS[packId] : undefined;
  const amountPaid =
    typeof payment.transaction_amount === 'number'
      ? payment.transaction_amount
      : null;

  const amountValid =
    officialPack !== undefined &&
    amountPaid !== null &&
    amountPaid + 0.01 >= officialPack.priceBrl;

  const mpStatus = typeof payment.status === 'string' ? payment.status : 'unknown';
  const approved = mpStatus === 'approved' && amountValid;

  return {
    found: true,
    approved,
    orderId: expectedOrderId,
    mpPaymentId: String(payment.id),
    mpStatus,
    mpStatusDetail:
      typeof payment.status_detail === 'string' ? payment.status_detail : null,
    amountPaid,
    paidAt:
      typeof payment.date_approved === 'string' ? payment.date_approved : null,
    paymentMethodId:
      typeof payment.payment_method_id === 'string'
        ? payment.payment_method_id
        : null,
  };
}

async function fetchPaymentByOrderOrId(
  accessToken: string,
  orderId: string,
  paymentId: string | null
): Promise<MpPaymentRecord | null> {
  if (paymentId && isValidPaymentId(paymentId)) {
    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (res.ok) {
      return (await res.json()) as MpPaymentRecord;
    }
  }

  const searchRes = await fetch(
    `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(
      orderId
    )}&sort=date_created&criteria=desc&limit=5`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!searchRes.ok) return null;
  const payload = (await searchRes.json()) as { results?: MpPaymentRecord[] };
  const list = Array.isArray(payload.results) ? payload.results : [];
  if (list.length === 0) return null;

  // Prioritize an approved payment if multiple attempts exist for the same order
  const approved = list.find((p) => p.status === 'approved');
  return approved ?? list[0];
}

export default async function handler(
  req: VercelApiRequest,
  res: VercelApiResponse
): Promise<void> {
  applyCorsHeaders(req, res, 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Método não permitido.' });
    return;
  }

  let user;
  try {
    user = await verifyFirebaseRequest(req);
  } catch {
    sendJson(res, 401, {
      ok: false,
      error: 'Sessão inválida. Faça login novamente.',
    });
    return;
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    sendJson(res, 503, {
      ok: false,
      code: 'MP_NOT_CONFIGURED',
      error: 'MERCADOPAGO_ACCESS_TOKEN não configurado na Vercel.',
    });
    return;
  }

  // GM Batch Check: POST { orderIds: string[] }
  if (req.method === 'POST') {
    if (!user.isGm) {
      sendJson(res, 403, {
        ok: false,
        error: 'Acesso restrito aos GMs autorizados.',
      });
      return;
    }

    let body: Record<string, unknown>;
    try {
      body = await readJsonBody(req);
    } catch {
      sendJson(res, 400, { ok: false, error: 'Corpo inválido.' });
      return;
    }

    const rawIds = Array.isArray(body.orderIds) ? body.orderIds : [];
    const validIds = rawIds
      .filter((id): id is string => isValidOrderId(id))
      .slice(0, 25);

    const results: Record<string, MpCheckResult> = {};
    await Promise.all(
      validIds.map(async (orderId) => {
        try {
          const payment = await fetchPaymentByOrderOrId(accessToken, orderId, null);
          results[orderId] = evaluatePaymentRecord(
            payment,
            orderId,
            user.uid,
            true
          );
        } catch {
          results[orderId] = {
            found: false,
            approved: false,
            orderId,
            mpPaymentId: null,
            mpStatus: 'error',
            mpStatusDetail: null,
            amountPaid: null,
            paidAt: null,
            paymentMethodId: null,
          };
        }
      })
    );

    sendJson(res, 200, { ok: true, results });
    return;
  }

  // Single Order Status Check: GET ?orderId=...&paymentId=...
  const orderId = getQueryParam(req, 'orderId');
  const paymentId = getQueryParam(req, 'paymentId');

  if (!isValidOrderId(orderId)) {
    sendJson(res, 400, { ok: false, error: 'orderId inválido.' });
    return;
  }

  try {
    const payment = await fetchPaymentByOrderOrId(
      accessToken,
      orderId,
      paymentId
    );
    const evaluated = evaluatePaymentRecord(
      payment,
      orderId,
      user.uid,
      user.isGm
    );
    sendJson(res, 200, { ok: true, ...evaluated });
  } catch {
    sendJson(res, 502, {
      ok: false,
      error: 'Erro ao consultar o status do pagamento no Mercado Pago.',
    });
  }
}
