import crypto from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ServerDwCoinPack {
  id: string;
  dwCoinAmount: number;
  priceCents: number;
  priceBrl: number;
  priceBrlLabel: string;
  title: string;
}

export const SERVER_DWCOIN_PACKS: Readonly<Record<string, ServerDwCoinPack>> = {
  pack_10: {
    id: 'pack_10',
    dwCoinAmount: 10,
    priceCents: 1000,
    priceBrl: 10.0,
    priceBrlLabel: 'R$ 10,00',
    title: 'DigiLegends Idle - 10 DL Din',
  },
  pack_30: {
    id: 'pack_30',
    dwCoinAmount: 30,
    priceCents: 2850,
    priceBrl: 28.5,
    priceBrlLabel: 'R$ 28,50',
    title: 'DigiLegends Idle - 30 DL Din',
  },
  pack_60: {
    id: 'pack_60',
    dwCoinAmount: 60,
    priceCents: 5400,
    priceBrl: 54.0,
    priceBrlLabel: 'R$ 54,00',
    title: 'DigiLegends Idle - 60 DL Din',
  },
  pack_100: {
    id: 'pack_100',
    dwCoinAmount: 100,
    priceCents: 8500,
    priceBrl: 85.0,
    priceBrlLabel: 'R$ 85,00',
    title: 'DigiLegends Idle - 100 DL Din',
  },
  pack_200: {
    id: 'pack_200',
    dwCoinAmount: 200,
    priceCents: 16000,
    priceBrl: 160.0,
    priceBrlLabel: 'R$ 160,00',
    title: 'DigiLegends Idle - 200 DL Din',
  },
};

export const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID?.trim() ||
  process.env.VITE_FIREBASE_PROJECT_ID?.trim() ||
  'digilegends-8bc7d';

export const FIREBASE_DATABASE_ID =
  process.env.FIREBASE_DATABASE_ID?.trim() ||
  process.env.VITE_FIREBASE_DATABASE_ID?.trim() ||
  '(default)';

export interface MpPaymentRecord {
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

const GM_EMAILS = new Set([
  'opiadoalvorada@gmail.com',
  'otiliolopesmirella@gmail.com',
]);

const ALLOWED_EXACT_ORIGINS = new Set([
  'https://digilegends.com.br',
  'https://taniseteamonuito.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

export interface VercelApiRequest extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export type VercelApiResponse = ServerResponse;

export interface VerifiedFirebaseUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  isGm: boolean;
}

interface CertCacheState {
  certs: Record<string, string>;
  expiresAtMs: number;
}

let certCache: CertCacheState | null = null;

export function isGmEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return GM_EMAILS.has(email.trim().toLowerCase());
}

export function isValidOrderId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 8 &&
    value.length <= 128 &&
    /^[a-zA-Z0-9_-]+$/.test(value)
  );
}

export function isValidPaymentId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9]{5,24}$/.test(value);
}

export function isSafeMercadoPagoUrl(url: unknown): url is string {
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

export function getPublicSiteOrigin(): string {
  const configured = process.env.APP_PUBLIC_URL?.trim();
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol === 'https:') {
        return parsed.origin;
      }
    } catch {
      // Fall back to canonical production domain
    }
  }
  return 'https://digilegends.com.br';
}

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_EXACT_ORIGINS.has(origin)) return true;
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    if (
      parsed.protocol === 'https:' &&
      ((host.startsWith('taniseteamonuito-') && host.endsWith('.vercel.app')) ||
        (host.startsWith('ais-') && host.endsWith('.run.app')))
    ) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function applyCorsHeaders(
  req: VercelApiRequest,
  res: VercelApiResponse,
  methods = 'GET,POST,OPTIONS'
): void {
  const rawOrigin = req.headers.origin;
  const origin = Array.isArray(rawOrigin) ? rawOrigin[0] : rawOrigin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

export function sendJson(
  res: VercelApiResponse,
  statusCode: number,
  payload: Record<string, unknown>
): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export async function readJsonBody(
  req: VercelApiRequest
): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string' && req.body.trim().length > 0) {
    const parsed = JSON.parse(req.body);
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : {};
  }

  const MAX_BYTES = 64 * 1024;
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    total += buf.length;
    if (total > MAX_BYTES) {
      throw new Error('PAYLOAD_TOO_LARGE');
    }
    chunks.push(buf);
  }

  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === 'object'
    ? (parsed as Record<string, unknown>)
    : {};
}

export function getQueryParam(
  req: VercelApiRequest,
  name: string
): string | null {
  if (req.query && name in req.query) {
    const val = req.query[name];
    if (Array.isArray(val)) return val[0] ?? null;
    if (typeof val === 'string') return val;
  }
  if (req.url) {
    try {
      const parsed = new URL(req.url, 'https://digilegends.com.br');
      return parsed.searchParams.get(name);
    } catch {
      return null;
    }
  }
  return null;
}

function decodeBase64UrlJson<T>(segment: string): T {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLen);
  const text = Buffer.from(base64, 'base64').toString('utf8');
  return JSON.parse(text) as T;
}

async function getGoogleFirebaseCerts(
  forceRefresh = false
): Promise<Record<string, string>> {
  const now = Date.now();
  if (!forceRefresh && certCache && certCache.expiresAtMs > now) {
    return certCache.certs;
  }

  const response = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  if (!response.ok) {
    throw new Error('Unable to fetch Firebase public certificates.');
  }
  const certs = (await response.json()) as Record<string, string>;
  const cacheControl = response.headers.get('cache-control') ?? '';
  const maxAgeMatch = /max-age=(\d+)/i.exec(cacheControl);
  const maxAgeSec = maxAgeMatch ? Number.parseInt(maxAgeMatch[1], 10) : 3600;
  certCache = {
    certs,
    expiresAtMs: now + Math.max(60, Math.min(maxAgeSec, 86400)) * 1000,
  };
  return certs;
}

/**
 * Verifies a Firebase Auth ID Token cryptographically (RS256) against Google's
 * official public X.509 certificates without requiring any service account key.
 */
export async function verifyFirebaseRequest(
  req: VercelApiRequest
): Promise<VerifiedFirebaseUser> {
  const rawAuth = req.headers.authorization;
  const authHeader = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED');
  }
  const token = authHeader.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('UNAUTHORIZED');
  }

  const [headerSeg, payloadSeg, sigSeg] = parts;
  let header: { alg?: string; kid?: string };
  let payload: {
    aud?: string;
    iss?: string;
    sub?: string;
    exp?: number;
    iat?: number;
    email?: string;
    email_verified?: boolean;
  };

  try {
    header = decodeBase64UrlJson(headerSeg);
    payload = decodeBase64UrlJson(payloadSeg);
  } catch {
    throw new Error('UNAUTHORIZED');
  }

  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    throw new Error('UNAUTHORIZED');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
  if (
    payload.aud !== FIREBASE_PROJECT_ID ||
    payload.iss !== expectedIssuer ||
    typeof payload.sub !== 'string' ||
    payload.sub.length < 4 ||
    payload.sub.length > 128 ||
    typeof payload.exp !== 'number' ||
    payload.exp <= nowSec ||
    typeof payload.iat !== 'number' ||
    payload.iat > nowSec + 300
  ) {
    throw new Error('UNAUTHORIZED');
  }

  let certs = await getGoogleFirebaseCerts(false);
  let pem = certs[header.kid];
  if (!pem) {
    certs = await getGoogleFirebaseCerts(true);
    pem = certs[header.kid];
  }
  if (!pem) {
    throw new Error('UNAUTHORIZED');
  }

  const signature = Buffer.from(
    sigSeg.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  );
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerSeg}.${payloadSeg}`);
  verifier.end();
  const validSig = verifier.verify(pem, signature);
  if (!validSig) {
    throw new Error('UNAUTHORIZED');
  }

  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const emailVerified = payload.email_verified === true;
  if (!email || !emailVerified) {
    throw new Error('EMAIL_NOT_VERIFIED');
  }

  return {
    uid: payload.sub,
    email,
    emailVerified,
    isGm: isGmEmail(email),
  };
}
