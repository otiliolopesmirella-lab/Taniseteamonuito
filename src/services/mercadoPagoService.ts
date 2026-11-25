import { auth } from '../firebase';
import {
  listMyPendingDwCoinOrders,
  type DwCoinPaymentMethod,
} from './dwCoinOrderService';

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
  dwCoinAmount: number | null;
  credited: boolean;
  alreadyCredited: boolean;
  nextBalance: number | null;
  autoCreditConfigured: boolean;
  creditErrorCode?: string;
  error?: string;
  code?: string;
}

export interface ReconcilePendingOrdersSummary {
  checkedCount: number;
  creditedCount: number;
  totalDwCoinCredited: number;
  approvedAwaitingServerConfig: number;
  latestBalance: number | null;
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

function buildFallbackStatusResult(
  orderId: string,
  mpStatus: string,
  code?: string
): MercadoPagoStatusResult {
  return {
    ok: false,
    found: false,
    approved: false,
    orderId,
    mpPaymentId: null,
    mpStatus,
    mpStatusDetail: null,
    amountPaid: null,
    paidAt: null,
    paymentMethodId: null,
    dwCoinAmount: null,
    credited: false,
    alreadyCredited: false,
    nextBalance: null,
    autoCreditConfigured: true,
    code,
  };
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
      return buildFallbackStatusResult(
        input.orderId,
        'unavailable',
        'BACKEND_UNAVAILABLE'
      );
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
      dwCoinAmount:
        typeof data.dwCoinAmount === 'number' ? data.dwCoinAmount : null,
      credited: data.credited === true,
      alreadyCredited: data.alreadyCredited === true,
      nextBalance:
        typeof data.nextBalance === 'number' ? data.nextBalance : null,
      autoCreditConfigured: data.autoCreditConfigured !== false,
      creditErrorCode:
        typeof data.creditErrorCode === 'string'
          ? data.creditErrorCode
          : undefined,
      error: typeof data.error === 'string' ? data.error : undefined,
      code: typeof data.code === 'string' ? data.code : undefined,
    };
  } catch {
    return buildFallbackStatusResult(input.orderId, 'error');
  }
}

/**
 * Reconcilia automaticamente pedidos pendentes da conta logada (incluindo retorno
 * de Checkout Pro via ?order_id=... ou retomada após trocar para o app do banco).
 */
export async function reconcilePendingMercadoPagoOrders(): Promise<ReconcilePendingOrdersSummary> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return {
      checkedCount: 0,
      creditedCount: 0,
      totalDwCoinCredited: 0,
      approvedAwaitingServerConfig: 0,
      latestBalance: null,
    };
  }

  const orderIdsToCheck = new Set<string>();
  let urlPaymentId: string | null = null;
  let hadMpQueryParams = false;

  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href);
      const qOrderId = url.searchParams.get('order_id')?.trim() ?? '';
      const qPaymentId =
        url.searchParams.get('payment_id')?.trim() ||
        url.searchParams.get('collection_id')?.trim() ||
        '';
      const qStatus = url.searchParams.get('mp_status');
      if (qOrderId && /^[a-zA-Z0-9_-]{8,128}$/.test(qOrderId)) {
        orderIdsToCheck.add(qOrderId);
        hadMpQueryParams = true;
      }
      if (qPaymentId && /^[0-9]{5,24}$/.test(qPaymentId)) {
        urlPaymentId = qPaymentId;
        hadMpQueryParams = true;
      }
      if (qStatus) {
        hadMpQueryParams = true;
      }
    } catch {
      // Ignore URL parsing issues
    }
  }

  const pendingOrders = await listMyPendingDwCoinOrders();
  for (const ord of pendingOrders.slice(0, 5)) {
    orderIdsToCheck.add(ord.orderId);
  }

  if (orderIdsToCheck.size === 0) {
    return {
      checkedCount: 0,
      creditedCount: 0,
      totalDwCoinCredited: 0,
      approvedAwaitingServerConfig: 0,
      latestBalance: null,
    };
  }

  let checkedCount = 0;
  let creditedCount = 0;
  let totalDwCoinCredited = 0;
  let approvedAwaitingServerConfig = 0;
  let latestBalance: number | null = null;

  for (const orderId of Array.from(orderIdsToCheck).slice(0, 5)) {
    const res = await checkMercadoPagoOrderStatus({
      orderId,
      paymentId: urlPaymentId,
    });
    if (!res.ok) {
      if (res.code === 'BACKEND_UNAVAILABLE' || res.code === 'MP_NOT_CONFIGURED') {
        break;
      }
      continue;
    }
    checkedCount += 1;
    if (res.approved) {
      if (res.credited) {
        creditedCount += 1;
        totalDwCoinCredited += res.dwCoinAmount ?? 0;
        if (typeof res.nextBalance === 'number') {
          latestBalance = res.nextBalance;
        }
      } else if (!res.alreadyCredited && !res.autoCreditConfigured) {
        approvedAwaitingServerConfig += 1;
      }
    }
  }

  if (hadMpQueryParams && typeof window !== 'undefined') {
    try {
      const cleanUrl = new URL(window.location.href);
      for (const key of [
        'mp_status',
        'order_id',
        'payment_id',
        'collection_id',
        'collection_status',
        'status',
        'external_reference',
        'payment_type',
        'merchant_order_id',
        'preference_id',
        'site_id',
        'processing_mode',
        'merchant_account_id',
      ]) {
        cleanUrl.searchParams.delete(key);
      }
      window.history.replaceState({}, '', cleanUrl.toString());
    } catch {
      // Ignore history replace errors
    }
  }

  return {
    checkedCount,
    creditedCount,
    totalDwCoinCredited,
    approvedAwaitingServerConfig,
    latestBalance,
  };
}

export async function batchCheckMercadoPagoOrdersForGm(
  orderIds: string[]
): Promise<{
  ok: boolean;
  autoCreditConfigured: boolean;
  results: Record<string, MercadoPagoStatusResult>;
  error?: string;
}> {
  if (orderIds.length === 0) {
    return { ok: true, autoCreditConfigured: true, results: {} };
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
        autoCreditConfigured: false,
        results: {},
        error:
          'Verificação ao vivo do Mercado Pago disponível no site publicado (digilegends.com.br).',
      };
    }

    const data = (await res.json()) as {
      ok?: boolean;
      autoCreditConfigured?: boolean;
      results?: Record<string, MercadoPagoStatusResult>;
      error?: string;
    };

    if (!res.ok || !data.ok) {
      return {
        ok: false,
        autoCreditConfigured: data.autoCreditConfigured !== false,
        results: {},
        error:
          data.error ||
          'Não foi possível consultar os pedidos no Mercado Pago.',
      };
    }

    return {
      ok: true,
      autoCreditConfigured: data.autoCreditConfigured !== false,
      results: data.results ?? {},
    };
  } catch {
    return {
      ok: false,
      autoCreditConfigured: false,
      results: {},
      error: 'Erro de rede ao consultar o Mercado Pago.',
    };
  }
}
