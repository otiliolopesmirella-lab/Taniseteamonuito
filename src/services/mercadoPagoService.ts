import { auth } from '../firebase';
import type { DwCoinPaymentMethod } from './dwCoinOrderService';

export type MercadoPagoCheckoutResult =
  | {
      ok: true;
      mode: 'pix';
      orderId: string;
      paymentId: string;
      status: string;
      qrCode: string;
      qrCodeBase64: string;
      ticketUrl: string | null;
      expiresAt: string;
    }
  | {
      ok: true;
      mode: 'checkout_pro';
      orderId: string;
      preferenceId: string;
      checkoutUrl: string;
      isSandbox: boolean;
    }
  | {
      ok: false;
      code?: string;
      error: string;
    };

export interface MercadoPagoStatusResult {
  ok: boolean;
  found: boolean;
  approved: boolean;
  orderId: string;
  mpPaymentId: string | null;
  mpStatus: string;
  mpStatusDetail: string | null;
  amountPaid: number | null;
  paidAt: string | null;
  paymentMethodId: string | null;
  error?: string;
  code?: string;
}

function isSafeMercadoPagoUrl(url: unknown): url is string {
  if (typeof url !== 'string' || url.length < 12 || url.length > 2048) {
    return false;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'mercadopago.com' ||
      host.endsWith('.mercadopago.com') ||
      host === 'mercadopago.com.br' ||
      host.endsWith('.mercadopago.com.br')
    );
  } catch {
    return false;
  }
}

function isValidBase64Png(raw: unknown): raw is string {
  return (
    typeof raw === 'string' &&
    raw.length > 40 &&
    raw.length < 500_000 &&
    /^[A-Za-z0-9+/=\r\n]+$/.test(raw)
  );
}

async function getVerifiedBearerToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    throw new Error('Faça login com uma conta verificada para comprar DL Din.');
  }
  return user.getIdToken();
}

export async function createMercadoPagoCheckout(input: {
  orderId: string;
  packId: string;
  paymentMethod: DwCoinPaymentMethod;
}): Promise<MercadoPagoCheckoutResult> {
  let token: string;
  try {
    token = await getVerifiedBearerToken();
  } catch (error) {
    return {
      ok: false,
      code: 'UNAUTHORIZED',
      error:
        error instanceof Error
          ? error.message
          : 'Sessão inválida. Faça login novamente.',
    };
  }

  try {
    const res = await fetch('/api/mercadopago/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orderId: input.orderId,
        packId: input.packId,
        paymentMethod: input.paymentMethod,
      }),
    });

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        code: 'BACKEND_UNAVAILABLE',
        error:
          'O checkout do Mercado Pago funciona no domínio publicado (digilegends.com.br) com a chave configurada na Vercel.',
      };
    }

    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok || data.ok !== true) {
      return {
        ok: false,
        code: typeof data.code === 'string' ? data.code : 'MP_ERROR',
        error:
          typeof data.error === 'string'
            ? data.error
            : 'Não foi possível iniciar o pagamento no Mercado Pago.',
      };
    }

    if (data.mode === 'pix') {
      const qrCode = typeof data.qrCode === 'string' ? data.qrCode : '';
      const qrCodeBase64 = isValidBase64Png(data.qrCodeBase64)
        ? data.qrCodeBase64.replace(/\s+/g, '')
        : '';
      const ticketUrl = isSafeMercadoPagoUrl(data.ticketUrl)
        ? data.ticketUrl
        : null;

      return {
        ok: true,
        mode: 'pix',
        orderId: String(data.orderId ?? input.orderId),
        paymentId: String(data.paymentId ?? ''),
        status: String(data.status ?? 'pending'),
        qrCode,
        qrCodeBase64,
        ticketUrl,
        expiresAt:
          typeof data.expiresAt === 'string'
            ? data.expiresAt
            : new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
    }

    if (data.mode === 'checkout_pro' && isSafeMercadoPagoUrl(data.checkoutUrl)) {
      return {
        ok: true,
        mode: 'checkout_pro',
        orderId: String(data.orderId ?? input.orderId),
        preferenceId: String(data.preferenceId ?? ''),
        checkoutUrl: data.checkoutUrl,
        isSandbox: data.isSandbox === true,
      };
    }

    return {
      ok: false,
      code: 'INVALID_RESPONSE',
      error: 'Resposta inesperada do servidor de pagamentos.',
    };
  } catch {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      error:
        'Não foi possível conectar ao servidor do Mercado Pago. Verifique sua internet e tente novamente.',
    };
  }
}

export async function checkMercadoPagoOrderStatus(input: {
  orderId: string;
  paymentId?: string | null;
}): Promise<MercadoPagoStatusResult> {
  try {
    const token = await getVerifiedBearerToken();
    const params = new URLSearchParams({ orderId: input.orderId });
    if (input.paymentId) {
      params.set('paymentId', input.paymentId);
    }

    const res = await fetch(`/api/mercadopago/check-payment?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        found: false,
        approved: false,
        orderId: input.orderId,
        mpPaymentId: null,
        mpStatus: 'unavailable',
        mpStatusDetail: null,
        amountPaid: null,
        paidAt: null,
        paymentMethodId: null,
        code: 'BACKEND_UNAVAILABLE',
      };
    }

    const data = (await res.json()) as Partial<MercadoPagoStatusResult>;
    return {
      ok: res.ok && data.ok === true,
      found: data.found === true,
      approved: data.approved === true,
      orderId: input.orderId,
      mpPaymentId: typeof data.mpPaymentId === 'string' ? data.mpPaymentId : null,
      mpStatus: typeof data.mpStatus === 'string' ? data.mpStatus : 'unknown',
      mpStatusDetail:
        typeof data.mpStatusDetail === 'string' ? data.mpStatusDetail : null,
      amountPaid: typeof data.amountPaid === 'number' ? data.amountPaid : null,
      paidAt: typeof data.paidAt === 'string' ? data.paidAt : null,
      paymentMethodId:
        typeof data.paymentMethodId === 'string' ? data.paymentMethodId : null,
      error: typeof data.error === 'string' ? data.error : undefined,
      code: typeof data.code === 'string' ? data.code : undefined,
    };
  } catch {
    return {
      ok: false,
      found: false,
      approved: false,
      orderId: input.orderId,
      mpPaymentId: null,
      mpStatus: 'error',
      mpStatusDetail: null,
      amountPaid: null,
      paidAt: null,
      paymentMethodId: null,
    };
  }
}

export async function batchCheckMercadoPagoOrdersForGm(
  orderIds: string[]
): Promise<{
  ok: boolean;
  results: Record<string, MercadoPagoStatusResult>;
  error?: string;
}> {
  if (orderIds.length === 0) {
    return { ok: true, results: {} };
  }

  try {
    const token = await getVerifiedBearerToken();
    const res = await fetch('/api/mercadopago/check-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderIds: orderIds.slice(0, 25) }),
    });

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        results: {},
        error:
          'Verificação ao vivo do Mercado Pago disponível no site publicado (digilegends.com.br).',
      };
    }

    const data = (await res.json()) as {
      ok?: boolean;
      results?: Record<string, MercadoPagoStatusResult>;
      error?: string;
    };

    if (!res.ok || !data.ok) {
      return {
        ok: false,
        results: {},
        error:
          data.error ||
          'Não foi possível consultar os pedidos no Mercado Pago.',
      };
    }

    return {
      ok: true,
      results: data.results ?? {},
    };
  } catch {
    return {
      ok: false,
      results: {},
      error: 'Erro de rede ao consultar o Mercado Pago.',
    };
  }
}
