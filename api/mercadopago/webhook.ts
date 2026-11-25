import crypto from 'node:crypto';
import {
  creditApprovedMercadoPagoPayment,
  getResolvedFirestoreTarget,
  isFirestoreAutoCreditConfigured,
} from '../_lib/mpFirestoreCredit.js';
import {
  getQueryParam,
  isValidPaymentId,
  readJsonBody,
  sendJson,
  type MpPaymentRecord,
  type VercelApiRequest,
  type VercelApiResponse,
} from '../_lib/mpShared.js';

function verifyMercadoPagoSignature(params: {
  signatureHeader: string | undefined;
  requestIdHeader: string | undefined;
  dataId: string;
  secret: string;
}): boolean {
  const { signatureHeader, requestIdHeader, dataId, secret } = params;
  if (!signatureHeader) return false;

  let ts = '';
  let v1 = '';
  for (const part of signatureHeader.split(',')) {
    const [rawKey, rawVal] = part.split('=');
    const key = rawKey?.trim();
    const val = rawVal?.trim();
    if (key === 'ts' && val) ts = val;
    if (key === 'v1' && val) v1 = val;
  }

  if (!ts || !v1 || !/^[a-f0-9]{64}$/i.test(v1)) {
    return false;
  }

  const manifestParts: string[] = [];
  if (dataId) manifestParts.push(`id:${dataId.toLowerCase()};`);
  if (requestIdHeader) manifestParts.push(`request-id:${requestIdHeader};`);
  manifestParts.push(`ts:${ts};`);
  const manifest = manifestParts.join('');

  const expectedHex = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');

  const a = Buffer.from(expectedHex, 'hex');
  const b = Buffer.from(v1.toLowerCase(), 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export default async function handler(
  req: VercelApiRequest,
  res: VercelApiResponse
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'GET') {
    const target = getResolvedFirestoreTarget();
    sendJson(res, 200, {
      ok: true,
      service: 'mercadopago-webhook',
      autoCreditConfigured: isFirestoreAutoCreditConfigured(),
      projectId: target.projectId,
      databaseId: target.databaseId,
    });
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Método não permitido.' });
    return;
  }

  let body: Record<string, unknown> = {};
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { ok: false, error: 'Payload inválido.' });
    return;
  }

  const queryDataId =
    getQueryParam(req, 'data.id') ?? getQueryParam(req, 'id') ?? '';
  const bodyData =
    body.data && typeof body.data === 'object'
      ? (body.data as Record<string, unknown>)
      : null;
  const bodyDataId =
    bodyData &&
    (typeof bodyData.id === 'string' || typeof bodyData.id === 'number')
      ? String(bodyData.id)
      : '';
  const dataId = queryDataId || bodyDataId;

  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (webhookSecret) {
    const rawSig = req.headers['x-signature'];
    const rawReqId = req.headers['x-request-id'];
    const signatureHeader = Array.isArray(rawSig) ? rawSig[0] : rawSig;
    const requestIdHeader = Array.isArray(rawReqId) ? rawReqId[0] : rawReqId;

    const valid = verifyMercadoPagoSignature({
      signatureHeader,
      requestIdHeader,
      dataId,
      secret: webhookSecret,
    });
    if (!valid) {
      sendJson(res, 401, { ok: false, error: 'Assinatura webhook inválida.' });
      return;
    }
  }

  let credited = false;
  let alreadyCredited = false;
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (accessToken && isValidPaymentId(dataId)) {
    try {
      // Never trust webhook body alone — always re-verify directly with Mercado Pago API
      const mpRes = await fetch(
        `https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (mpRes.ok) {
        const payment = (await mpRes.json()) as MpPaymentRecord;
        if (payment && payment.status === 'approved') {
          const creditRes = await creditApprovedMercadoPagoPayment(payment);
          credited = creditRes.credited;
          alreadyCredited = creditRes.alreadyCredited;
        }
      }
    } catch {
      // Acknowledge receipt cleanly; client polling & login reconciliation provide automatic retry
    }
  }

  sendJson(res, 200, { received: true, credited, alreadyCredited });
}
