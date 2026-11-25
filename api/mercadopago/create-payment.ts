import {
  applyCorsHeaders,
  getPublicSiteOrigin,
  isSafeMercadoPagoUrl,
  isValidOrderId,
  readJsonBody,
  sendJson,
  SERVER_DWCOIN_PACKS,
  verifyFirebaseRequest,
  type VercelApiRequest,
  type VercelApiResponse,
} from '../_lib/mpShared.js';

interface MpPixResponse {
  id?: number | string;
  status?: string;
  status_detail?: string;
  date_of_expiration?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
  message?: string;
}

interface MpPreferenceResponse {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  message?: string;
}

export default async function handler(
  req: VercelApiRequest,
  res: VercelApiResponse
): Promise<void> {
  applyCorsHeaders(req, res, 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Método não permitido.' });
    return;
  }

  let user;
  try {
    user = await verifyFirebaseRequest(req);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'UNAUTHORIZED';
    sendJson(res, 401, {
      ok: false,
      code,
      error:
        code === 'EMAIL_NOT_VERIFIED'
          ? 'Verifique seu e-mail antes de comprar DL Din.'
          : 'Sessão inválida. Faça login novamente para continuar.',
    });
    return;
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    sendJson(res, 503, {
      ok: false,
      code: 'MP_NOT_CONFIGURED',
      error:
        'Checkout Mercado Pago aguardando configuração da variável MERCADOPAGO_ACCESS_TOKEN na Vercel.',
    });
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { ok: false, error: 'Corpo da requisição inválido.' });
    return;
  }

  const orderId = body.orderId;
  const packId = body.packId;
  const paymentMethod = body.paymentMethod;

  if (!isValidOrderId(orderId)) {
    sendJson(res, 400, { ok: false, error: 'Código do pedido inválido.' });
    return;
  }

  if (typeof packId !== 'string' || !(packId in SERVER_DWCOIN_PACKS)) {
    sendJson(res, 400, { ok: false, error: 'Pacote de DL Din inválido.' });
    return;
  }

  if (paymentMethod !== 'pix' && paymentMethod !== 'card') {
    sendJson(res, 400, { ok: false, error: 'Forma de pagamento inválida.' });
    return;
  }

  const pack = SERVER_DWCOIN_PACKS[packId];
  const publicOrigin = getPublicSiteOrigin();
  const notificationUrl = `${publicOrigin}/api/mercadopago/webhook`;

  if (paymentMethod === 'pix') {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    try {
      const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': orderId,
        },
        body: JSON.stringify({
          transaction_amount: pack.priceBrl,
          description: pack.title,
          payment_method_id: 'pix',
          external_reference: orderId,
          notification_url: notificationUrl,
          date_of_expiration: expiresAt,
          payer: {
            email: user.email,
          },
          metadata: {
            order_id: orderId,
            owner_uid: user.uid,
            pack_id: pack.id,
            dw_coin_amount: pack.dwCoinAmount,
            price_cents: pack.priceCents,
          },
        }),
      });

      const data = (await mpRes.json()) as MpPixResponse;
      if (!mpRes.ok || !data.id) {
        sendJson(res, 502, {
          ok: false,
          code: 'MP_PIX_CREATE_FAILED',
          error:
            'Não foi possível gerar o QR Code PIX no Mercado Pago. Tente novamente em instantes.',
        });
        return;
      }

      const txData = data.point_of_interaction?.transaction_data;
      const qrCode = typeof txData?.qr_code === 'string' ? txData.qr_code : '';
      const qrCodeBase64 =
        typeof txData?.qr_code_base64 === 'string' ? txData.qr_code_base64 : '';
      const ticketUrl = isSafeMercadoPagoUrl(txData?.ticket_url)
        ? txData.ticket_url
        : null;

      sendJson(res, 200, {
        ok: true,
        mode: 'pix',
        orderId,
        paymentId: String(data.id),
        status: data.status ?? 'pending',
        qrCode,
        qrCodeBase64,
        ticketUrl,
        expiresAt: data.date_of_expiration ?? expiresAt,
      });
      return;
    } catch {
      sendJson(res, 502, {
        ok: false,
        code: 'MP_NETWORK_ERROR',
        error: 'Erro de comunicação com o Mercado Pago ao gerar o PIX.',
      });
      return;
    }
  }

  // Cartão / Checkout Pro flow (PCI-compliant hosted page — zero card data touches the game)
  try {
    const mpRes = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              id: pack.id,
              title: pack.title,
              description: `Recarga oficial de ${pack.dwCoinAmount} DL Din · DigiLegends Idle`,
              quantity: 1,
              currency_id: 'BRL',
              unit_price: pack.priceBrl,
            },
          ],
          payer: {
            email: user.email,
          },
          external_reference: orderId,
          notification_url: notificationUrl,
          statement_descriptor: 'DIGILEGENDS',
          back_urls: {
            success: `${publicOrigin}/?mp_status=approved&order_id=${encodeURIComponent(orderId)}`,
            pending: `${publicOrigin}/?mp_status=pending&order_id=${encodeURIComponent(orderId)}`,
            failure: `${publicOrigin}/?mp_status=failure&order_id=${encodeURIComponent(orderId)}`,
          },
          auto_return: 'approved',
          metadata: {
            order_id: orderId,
            owner_uid: user.uid,
            pack_id: pack.id,
            dw_coin_amount: pack.dwCoinAmount,
            price_cents: pack.priceCents,
          },
        }),
      }
    );

    const data = (await mpRes.json()) as MpPreferenceResponse;
    const isTestToken = accessToken.startsWith('TEST-');
    const chosenUrl = isTestToken
      ? data.sandbox_init_point || data.init_point
      : data.init_point;

    if (!mpRes.ok || !data.id || !isSafeMercadoPagoUrl(chosenUrl)) {
      sendJson(res, 502, {
        ok: false,
        code: 'MP_PREFERENCE_CREATE_FAILED',
        error:
          'Não foi possível criar o link de pagamento no Mercado Pago. Tente novamente em instantes.',
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      mode: 'checkout_pro',
      orderId,
      preferenceId: data.id,
      checkoutUrl: chosenUrl,
      isSandbox: isTestToken,
    });
  } catch {
    sendJson(res, 502, {
      ok: false,
      code: 'MP_NETWORK_ERROR',
      error: 'Erro de comunicação com o Mercado Pago ao iniciar o checkout.',
    });
  }
}
