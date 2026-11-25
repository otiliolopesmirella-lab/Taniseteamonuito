import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import type { TamerId } from '../types/character';
import {
  isValidAvatarPhotoDataUrl,
  isValidCoverPhotoDataUrl,
} from '../utils/avatarPhoto';
import { ensurePlayerDocBootstrapped } from './cloudSaveService';
import { isCurrentAuthUserBootstrappedGm } from './gmRoleService';

export const REFERRAL_COMMISSION_RATE = 0.1;
const PENDING_REFERRAL_STORAGE_KEY = 'digilegends_pending_ref_code_v1';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const REFERRAL_CODE_REGEX = /^[A-Z0-9]{6,12}$/;
const MONTH_KEY_REGEX = /^[0-9]{4}-[0-9]{2}$/;

const PT_BR_MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export interface ReferralProfileRecord {
  ownerUid: string;
  inviteCode: string;
  tamerName: string;
  characterId: TamerId;
  tamerPhotoUrl: string | null;
  tamerCoverUrl: string | null;
  isGm: boolean;
  totalInvites: number;
  monthKey: string;
  monthlyInvites: number;
  effectiveMonthlyInvites: number;
  totalCommissionEarned: number;
  monthlyCommissionEarned: number;
  effectiveMonthlyCommission: number;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface ReferralClaimRecord {
  referredUid: string;
  referredName: string;
  referrerUid: string;
  referrerName: string;
  inviteCode: string;
  monthKey: string;
  createdAtMs: number;
}

export interface ReferralDashboardData {
  profile: ReferralProfileRecord | null;
  myClaim: ReferralClaimRecord | null;
  invitedPlayers: ReferralClaimRecord[];
  currentMonthKey: string;
  currentMonthLabel: string;
  errorMessage?: string;
}

export interface ReferralRankingResult {
  monthKey: string;
  monthLabel: string;
  monthlyRanking: ReferralProfileRecord[];
  totalRanking: ReferralProfileRecord[];
}

export interface EnsureReferralProfileInput {
  tamerName: string;
  characterId?: TamerId;
  tamerPhotoUrl?: string | null;
  tamerCoverUrl?: string | null;
  isGm?: boolean;
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

function sanitizeTamerId(raw: unknown): TamerId {
  return raw === 'ren' || raw === 'hina' || raw === 'yuna' ? raw : 'kai';
}

function sanitizeTamerDisplayName(raw: unknown, fallback = 'Tamer'): string {
  const cleaned = String(raw ?? '')
    .trim()
    .slice(0, 24);
  return cleaned.length >= 1 ? cleaned : fallback;
}

function safeNonNegativeInt(raw: unknown, max = 1_000_000_000): number {
  const num = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(max, Math.round(num)));
}

/**
 * Computes the current referral ranking month key (YYYY-MM) in America/Sao_Paulo timezone.
 */
export function getCurrentReferralMonthKey(date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(date);
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    if (year && month && MONTH_KEY_REGEX.test(`${year}-${month}`)) {
      return `${year}-${month}`;
    }
  } catch {
    // Fallback to UTC below
  }
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatReferralMonthLabel(monthKey: string): string {
  if (!MONTH_KEY_REGEX.test(monthKey)) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const idx = Number(monthStr) - 1;
  const monthName =
    idx >= 0 && idx < PT_BR_MONTHS.length ? PT_BR_MONTHS[idx] : monthStr;
  return `${monthName} ${yearStr}`;
}

/**
 * Normalizes any user-entered invite code or referral URL into a strict uppercase alphanumeric key.
 */
export function normalizeReferralCode(raw: string): string {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return '';

  // Allow pasting a full invite URL (e.g. https://.../?ref=DL7X9K2P) directly in the code input
  if (trimmed.includes('ref=') || trimmed.includes('convite=')) {
    try {
      const url = new URL(trimmed);
      const fromUrl =
        url.searchParams.get('ref') ??
        url.searchParams.get('convite') ??
        url.searchParams.get('invite') ??
        '';
      if (fromUrl) {
        return fromUrl
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 12);
      }
    } catch {
      // Fall through to plain code extraction
    }
  }

  return trimmed
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
}

export function isValidReferralCodeFormat(code: string): boolean {
  return REFERRAL_CODE_REGEX.test(code);
}

export function formatReferralCodeDisplay(code: string): string {
  const clean = normalizeReferralCode(code);
  if (clean.length === 8 && clean.startsWith('DL')) {
    return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  }
  return clean;
}

export function buildInviteLink(code: string): string {
  const clean = normalizeReferralCode(code);
  if (!clean) return '';
  if (typeof window === 'undefined' || !window.location?.origin) {
    return `/?ref=${encodeURIComponent(clean)}`;
  }
  return `${window.location.origin}/?ref=${encodeURIComponent(clean)}`;
}

export function getPendingReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PENDING_REFERRAL_STORAGE_KEY);
    if (!raw) return null;
    const clean = normalizeReferralCode(raw);
    return isValidReferralCodeFormat(clean) ? clean : null;
  } catch {
    return null;
  }
}

export function savePendingReferralCode(raw: string): string | null {
  const clean = normalizeReferralCode(raw);
  if (!isValidReferralCodeFormat(clean)) return null;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PENDING_REFERRAL_STORAGE_KEY, clean);
    } catch {
      // Ignore storage quota errors
    }
  }
  return clean;
}

export function clearPendingReferralCode(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PENDING_REFERRAL_STORAGE_KEY);
  } catch {
    // Ignore storage restrictions
  }
}

/**
 * Captures `?ref=CODE` (or `?convite=` / `?invite=`) from the current page URL
 * and stores it in localStorage so account registration applies it automatically.
 */
export function captureReferralCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const raw =
      params.get('ref') ?? params.get('convite') ?? params.get('invite') ?? '';
    if (!raw) return null;
    const saved = savePendingReferralCode(raw);
    if (saved) {
      // Clean only referral query params from address bar without reload
      params.delete('ref');
      params.delete('convite');
      params.delete('invite');
      const nextSearch = params.toString();
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
      window.history.replaceState(null, '', nextUrl);
    }
    return saved;
  } catch {
    return null;
  }
}

function generateCandidateReferralCode(uid: string, attempt: number): string {
  let hash = 2166136261 ^ (attempt * 2654435761);
  const seed = `${uid}|digilegends_ref|${attempt}`;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  let suffix = '';
  let state = hash >>> 0;
  for (let i = 0; i < 6; i += 1) {
    if (attempt > 0 && i >= 3) {
      const randIdx = Math.floor(Math.random() * CODE_ALPHABET.length);
      suffix += CODE_ALPHABET[randIdx];
    } else {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      suffix += CODE_ALPHABET[state % CODE_ALPHABET.length];
    }
  }
  return `DL${suffix}`;
}

function parseReferralProfileDoc(
  docId: string,
  raw: Record<string, unknown>,
  currentMonthKey: string
): ReferralProfileRecord {
  const monthKey =
    typeof raw.monthKey === 'string' && MONTH_KEY_REGEX.test(raw.monthKey)
      ? raw.monthKey
      : currentMonthKey;
  const totalInvites = safeNonNegativeInt(raw.totalInvites, 1_000_000);
  const monthlyInvites = safeNonNegativeInt(raw.monthlyInvites, 1_000_000);
  const totalCommissionEarned = safeNonNegativeInt(
    raw.totalCommissionEarned,
    1_000_000_000
  );
  const monthlyCommissionEarned = safeNonNegativeInt(
    raw.monthlyCommissionEarned,
    1_000_000_000
  );
  const isCurrentMonth = monthKey === currentMonthKey;

  return {
    ownerUid: String(raw.ownerUid ?? docId),
    inviteCode: normalizeReferralCode(String(raw.inviteCode ?? '')),
    tamerName: sanitizeTamerDisplayName(raw.tamerName, 'Tamer'),
    characterId: sanitizeTamerId(raw.characterId),
    tamerPhotoUrl: isValidAvatarPhotoDataUrl(raw.tamerPhotoUrl)
      ? raw.tamerPhotoUrl
      : null,
    tamerCoverUrl: isValidCoverPhotoDataUrl(raw.tamerCoverUrl)
      ? raw.tamerCoverUrl
      : null,
    isGm: raw.isGm === true,
    totalInvites,
    monthKey,
    monthlyInvites,
    effectiveMonthlyInvites: isCurrentMonth ? monthlyInvites : 0,
    totalCommissionEarned,
    monthlyCommissionEarned,
    effectiveMonthlyCommission: isCurrentMonth ? monthlyCommissionEarned : 0,
    createdAtMs: parseTimestampMs(raw.createdAt),
    updatedAtMs: parseTimestampMs(raw.updatedAt),
  };
}

function parseReferralClaimDoc(
  docId: string,
  raw: Record<string, unknown>
): ReferralClaimRecord {
  return {
    referredUid: String(raw.referredUid ?? docId),
    referredName: sanitizeTamerDisplayName(raw.referredName, 'Tamer'),
    referrerUid: String(raw.referrerUid ?? ''),
    referrerName: sanitizeTamerDisplayName(raw.referrerName, 'Tamer'),
    inviteCode: normalizeReferralCode(String(raw.inviteCode ?? '')),
    monthKey:
      typeof raw.monthKey === 'string' && MONTH_KEY_REGEX.test(raw.monthKey)
        ? raw.monthKey
        : getCurrentReferralMonthKey(),
    createdAtMs: parseTimestampMs(raw.createdAt),
  };
}

const inFlightEnsureByUid = new Map<
  string,
  Promise<ReferralProfileRecord | null>
>();

/**
 * Ensures the currently authenticated verified player has a unique invite code
 * in `/referralCodes/{code}` and an associated profile in `/referralProfiles/{uid}`.
 * Also keeps display metadata (tamerName, avatar, cover) synced safely.
 */
export async function ensureOwnReferralProfile(
  input: EnsureReferralProfileInput
): Promise<ReferralProfileRecord | null> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return null;

  const existingInFlight = inFlightEnsureByUid.get(user.uid);
  if (existingInFlight) return existingInFlight;

  const task = runEnsureOwnReferralProfile(user.uid, input).finally(() => {
    inFlightEnsureByUid.delete(user.uid);
  });
  inFlightEnsureByUid.set(user.uid, task);
  return task;
}

async function runEnsureOwnReferralProfile(
  uid: string,
  input: EnsureReferralProfileInput
): Promise<ReferralProfileRecord | null> {
  const user = auth.currentUser;
  if (!user || user.uid !== uid || !user.emailVerified) return null;

  await ensurePlayerDocBootstrapped(user);

  const currentMonthKey = getCurrentReferralMonthKey();
  const profileRef = doc(db, 'referralProfiles', uid);
  const safeName = sanitizeTamerDisplayName(input.tamerName, 'Tamer');
  const safeCharId = sanitizeTamerId(input.characterId);
  const safePhotoUrl = isValidAvatarPhotoDataUrl(input.tamerPhotoUrl)
    ? input.tamerPhotoUrl
    : null;
  const safeCoverUrl = isValidCoverPhotoDataUrl(input.tamerCoverUrl)
    ? input.tamerCoverUrl
    : null;
  const safeIsGm = Boolean(input.isGm === true && isCurrentAuthUserBootstrappedGm());

  try {
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      const parsed = parseReferralProfileDoc(
        uid,
        snap.data() as Record<string, unknown>,
        currentMonthKey
      );
      const needsSync =
        parsed.tamerName !== safeName ||
        parsed.characterId !== safeCharId ||
        parsed.tamerPhotoUrl !== safePhotoUrl ||
        parsed.tamerCoverUrl !== safeCoverUrl ||
        parsed.isGm !== safeIsGm;

      if (needsSync) {
        try {
          await updateDoc(profileRef, {
            tamerName: safeName,
            characterId: safeCharId,
            tamerPhotoUrl: safePhotoUrl,
            tamerCoverUrl: safeCoverUrl,
            isGm: safeIsGm,
            updatedAt: serverTimestamp(),
          });
          return {
            ...parsed,
            tamerName: safeName,
            characterId: safeCharId,
            tamerPhotoUrl: safePhotoUrl,
            tamerCoverUrl: safeCoverUrl,
            isGm: safeIsGm,
            updatedAtMs: Date.now(),
          };
        } catch {
          // Return existing profile cleanly if cosmetic sync races
          return parsed;
        }
      }
      return parsed;
    }
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.GET, `referralProfiles/${uid}`);
    } catch {
      return null;
    }
  }

  // Create new referral profile + unique referral code atomically
  const MAX_CODE_ATTEMPTS = 6;
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const candidateCode = generateCandidateReferralCode(uid, attempt);
    const codeRef = doc(db, 'referralCodes', candidateCode);

    try {
      const created = await runTransaction(db, async (tx) => {
        const existingProfileSnap = await tx.get(profileRef);
        if (existingProfileSnap.exists()) {
          return parseReferralProfileDoc(
            uid,
            existingProfileSnap.data() as Record<string, unknown>,
            currentMonthKey
          );
        }

        const existingCodeSnap = await tx.get(codeRef);
        if (existingCodeSnap.exists()) {
          const codeOwner = String(existingCodeSnap.data()?.ownerUid ?? '');
          if (codeOwner !== uid) {
            throw new Error('REFERRAL_CODE_COLLISION');
          }
        }

        const ts = serverTimestamp();
        if (!existingCodeSnap.exists()) {
          tx.set(codeRef, {
            code: candidateCode,
            ownerUid: uid,
            tamerName: safeName,
            createdAt: ts,
          });
        }

        tx.set(profileRef, {
          ownerUid: uid,
          inviteCode: candidateCode,
          tamerName: safeName,
          characterId: safeCharId,
          tamerPhotoUrl: safePhotoUrl,
          tamerCoverUrl: safeCoverUrl,
          isGm: safeIsGm,
          totalInvites: 0,
          monthKey: currentMonthKey,
          monthlyInvites: 0,
          totalCommissionEarned: 0,
          monthlyCommissionEarned: 0,
          createdAt: ts,
          updatedAt: ts,
        });

        const nowMs = Date.now();
        return {
          ownerUid: uid,
          inviteCode: candidateCode,
          tamerName: safeName,
          characterId: safeCharId,
          tamerPhotoUrl: safePhotoUrl,
          tamerCoverUrl: safeCoverUrl,
          isGm: safeIsGm,
          totalInvites: 0,
          monthKey: currentMonthKey,
          monthlyInvites: 0,
          effectiveMonthlyInvites: 0,
          totalCommissionEarned: 0,
          monthlyCommissionEarned: 0,
          effectiveMonthlyCommission: 0,
          createdAtMs: nowMs,
          updatedAtMs: nowMs,
        } satisfies ReferralProfileRecord;
      });

      return created;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'REFERRAL_CODE_COLLISION' &&
        attempt < MAX_CODE_ATTEMPTS - 1
      ) {
        continue;
      }
      try {
        handleFirestoreError(
          error,
          OperationType.CREATE,
          `referralProfiles/${uid}`
        );
      } catch {
        return null;
      }
    }
  }

  return null;
}

export interface RedeemReferralResult {
  ok: boolean;
  code:
    | 'redeemed'
    | 'unauthenticated'
    | 'invalid_format'
    | 'already_claimed'
    | 'not_found'
    | 'self_referral'
    | 'error';
  message: string;
  claim?: ReferralClaimRecord;
}

/**
 * Atomically binds the signed-in verified user to an inviter's code and immediately
 * increments the inviter's total & monthly invite counters in a single Firestore transaction.
 */
export async function redeemReferralCode(
  rawCode: string,
  referredDisplayName: string
): Promise<RedeemReferralResult> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return {
      ok: false,
      code: 'unauthenticated',
      message: 'Entre com uma conta verificada para aplicar um código de convite.',
    };
  }

  const normalized = normalizeReferralCode(rawCode);
  if (!isValidReferralCodeFormat(normalized)) {
    return {
      ok: false,
      code: 'invalid_format',
      message: 'Código inválido. Digite um código no formato DL-XXXXXX.',
    };
  }

  const safeReferredName = sanitizeTamerDisplayName(
    referredDisplayName || user.displayName,
    'Tamer'
  );
  const currentMonthKey = getCurrentReferralMonthKey();
  const claimRef = doc(db, 'referralClaims', user.uid);
  const codeRef = doc(db, 'referralCodes', normalized);

  try {
    const claim = await runTransaction(db, async (tx) => {
      const existingClaimSnap = await tx.get(claimRef);
      if (existingClaimSnap.exists()) {
        throw new Error('REF_ALREADY_CLAIMED');
      }

      const codeSnap = await tx.get(codeRef);
      if (!codeSnap.exists()) {
        throw new Error('REF_CODE_NOT_FOUND');
      }

      const codeData = codeSnap.data() ?? {};
      const referrerUid = String(codeData.ownerUid ?? '');
      if (!referrerUid) {
        throw new Error('REF_CODE_NOT_FOUND');
      }
      if (referrerUid === user.uid) {
        throw new Error('REF_SELF_REFERRAL');
      }

      const referrerProfileRef = doc(db, 'referralProfiles', referrerUid);
      const referrerProfileSnap = await tx.get(referrerProfileRef);
      if (!referrerProfileSnap.exists()) {
        throw new Error('REF_CODE_NOT_FOUND');
      }

      const profData = referrerProfileSnap.data() ?? {};
      const referrerName = sanitizeTamerDisplayName(
        profData.tamerName ?? codeData.tamerName,
        'Tamer'
      );
      const oldTotalInvites = safeNonNegativeInt(
        profData.totalInvites,
        1_000_000
      );
      const oldMonthKey =
        typeof profData.monthKey === 'string' &&
        MONTH_KEY_REGEX.test(profData.monthKey)
          ? profData.monthKey
          : currentMonthKey;
      const oldMonthlyInvites = safeNonNegativeInt(
        profData.monthlyInvites,
        1_000_000
      );
      const oldMonthlyCommission = safeNonNegativeInt(
        profData.monthlyCommissionEarned,
        1_000_000_000
      );

      // Guard against client clock slightly behind existing server monthKey
      const nextMonthKey =
        currentMonthKey >= oldMonthKey ? currentMonthKey : oldMonthKey;
      const isNewMonth = nextMonthKey > oldMonthKey;
      const nextTotalInvites = Math.min(1_000_000, oldTotalInvites + 1);
      const nextMonthlyInvites = isNewMonth
        ? 1
        : Math.min(1_000_000, oldMonthlyInvites + 1);
      const nextMonthlyCommission = isNewMonth ? 0 : oldMonthlyCommission;

      const ts = serverTimestamp();

      tx.set(claimRef, {
        referredUid: user.uid,
        referredName: safeReferredName,
        referrerUid,
        referrerName,
        inviteCode: normalized,
        monthKey: nextMonthKey,
        createdAt: ts,
      });

      tx.update(referrerProfileRef, {
        totalInvites: nextTotalInvites,
        monthKey: nextMonthKey,
        monthlyInvites: nextMonthlyInvites,
        monthlyCommissionEarned: nextMonthlyCommission,
        updatedAt: ts,
      });

      return {
        referredUid: user.uid,
        referredName: safeReferredName,
        referrerUid,
        referrerName,
        inviteCode: normalized,
        monthKey: nextMonthKey,
        createdAtMs: Date.now(),
      } satisfies ReferralClaimRecord;
    });

    clearPendingReferralCode();
    return {
      ok: true,
      code: 'redeemed',
      message: `Código aplicado! Você agora faz parte dos convidados de ${claim.referrerName}.`,
      claim,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'REF_ALREADY_CLAIMED') {
        clearPendingReferralCode();
        return {
          ok: false,
          code: 'already_claimed',
          message: 'Esta conta já utilizou um código de convite anteriormente.',
        };
      }
      if (error.message === 'REF_CODE_NOT_FOUND') {
        return {
          ok: false,
          code: 'not_found',
          message:
            'Código de convite não encontrado. Confira as letras e números e tente novamente.',
        };
      }
      if (error.message === 'REF_SELF_REFERRAL') {
        clearPendingReferralCode();
        return {
          ok: false,
          code: 'self_referral',
          message: 'Você não pode usar o seu próprio código de convite.',
        };
      }
    }
    try {
      handleFirestoreError(
        error,
        OperationType.CREATE,
        `referralClaims/${user.uid}`
      );
    } catch {
      // Structured audit log without crashing modal
    }
    return {
      ok: false,
      code: 'error',
      message:
        'Não foi possível aplicar o código agora. Tente novamente em instantes.',
    };
  }
}

/**
 * Automatically applies any referral code captured from `?ref=` or the registration form
 * once the player is signed in with a verified account.
 */
export async function applyPendingReferralCodeIfAny(
  referredDisplayName: string
): Promise<RedeemReferralResult | null> {
  const pending = getPendingReferralCode();
  if (!pending) return null;
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return null;

  const res = await redeemReferralCode(pending, referredDisplayName);
  if (
    res.ok ||
    res.code === 'already_claimed' ||
    res.code === 'self_referral' ||
    res.code === 'not_found'
  ) {
    clearPendingReferralCode();
  }
  return res;
}

/**
 * Loads the player's own invite profile, their inviter (if any), and the list of players they invited.
 */
export async function fetchMyReferralDashboard(
  profileInput: EnsureReferralProfileInput
): Promise<ReferralDashboardData> {
  const currentMonthKey = getCurrentReferralMonthKey();
  const currentMonthLabel = formatReferralMonthLabel(currentMonthKey);
  const user = auth.currentUser;

  if (!user || !user.emailVerified) {
    return {
      profile: null,
      myClaim: null,
      invitedPlayers: [],
      currentMonthKey,
      currentMonthLabel,
    };
  }

  const profile = await ensureOwnReferralProfile(profileInput);

  if (!profile) {
    return {
      profile: null,
      myClaim: null,
      invitedPlayers: [],
      currentMonthKey,
      currentMonthLabel,
      errorMessage:
        'Não foi possível gerar seu código de convite no servidor agora. Toque em "Tentar Novamente" ou verifique se as regras do banco estão atualizadas.',
    };
  }

  let myClaim: ReferralClaimRecord | null = null;
  let invitedPlayers: ReferralClaimRecord[] = [];

  const [myClaimRes, invitedRes] = await Promise.allSettled([
    getDoc(doc(db, 'referralClaims', user.uid)),
    getDocs(
      query(
        collection(db, 'referralClaims'),
        where('referrerUid', '==', user.uid),
        limit(50)
      )
    ),
  ]);

  if (myClaimRes.status === 'fulfilled' && myClaimRes.value.exists()) {
    myClaim = parseReferralClaimDoc(
      myClaimRes.value.id,
      myClaimRes.value.data() as Record<string, unknown>
    );
  }

  if (invitedRes.status === 'fulfilled') {
    const list: ReferralClaimRecord[] = [];
    invitedRes.value.forEach((docSnap) => {
      list.push(
        parseReferralClaimDoc(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        )
      );
    });
    list.sort((a, b) => b.createdAtMs - a.createdAtMs);
    invitedPlayers = list;
  }

  return {
    profile,
    myClaim,
    invitedPlayers,
    currentMonthKey,
    currentMonthLabel,
  };
}

/**
 * Fetches the official server Inviters Leaderboard for both the Current Month (Mensal)
 * and All-Time (Geral). Monthly counts automatically reset to 0 when the server month rolls over.
 */
export async function fetchReferralRankings(
  selfFallback?: EnsureReferralProfileInput
): Promise<ReferralRankingResult> {
  const currentMonthKey = getCurrentReferralMonthKey();
  const monthLabel = formatReferralMonthLabel(currentMonthKey);
  const user = auth.currentUser;

  const byUid = new Map<string, ReferralProfileRecord>();

  if (user && user.emailVerified) {
    try {
      const snap = await getDocs(
        query(
          collection(db, 'referralProfiles'),
          where('totalInvites', '>=', 0),
          limit(100)
        )
      );
      snap.forEach((docSnap) => {
        const parsed = parseReferralProfileDoc(
          docSnap.id,
          docSnap.data() as Record<string, unknown>,
          currentMonthKey
        );
        byUid.set(parsed.ownerUid, parsed);
      });
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.LIST, 'referralProfiles');
      } catch {
        // Fallback cleanly to self profile if offline
      }
    }

    if (!byUid.has(user.uid) && selfFallback) {
      const ensured = await ensureOwnReferralProfile(selfFallback);
      if (ensured) {
        byUid.set(ensured.ownerUid, ensured);
      }
    }
  }

  const allProfiles = Array.from(byUid.values());

  const monthlyRanking = [...allProfiles]
    .filter((p) => p.effectiveMonthlyInvites > 0 || p.ownerUid === user?.uid)
    .sort((a, b) => {
      if (b.effectiveMonthlyInvites !== a.effectiveMonthlyInvites) {
        return b.effectiveMonthlyInvites - a.effectiveMonthlyInvites;
      }
      if (b.totalInvites !== a.totalInvites) {
        return b.totalInvites - a.totalInvites;
      }
      return b.effectiveMonthlyCommission - a.effectiveMonthlyCommission;
    });

  const totalRanking = [...allProfiles]
    .filter((p) => p.totalInvites > 0 || p.ownerUid === user?.uid)
    .sort((a, b) => {
      if (b.totalInvites !== a.totalInvites) {
        return b.totalInvites - a.totalInvites;
      }
      if (b.effectiveMonthlyInvites !== a.effectiveMonthlyInvites) {
        return b.effectiveMonthlyInvites - a.effectiveMonthlyInvites;
      }
      return b.totalCommissionEarned - a.totalCommissionEarned;
    });

  return {
    monthKey: currentMonthKey,
    monthLabel,
    monthlyRanking,
    totalRanking,
  };
}
