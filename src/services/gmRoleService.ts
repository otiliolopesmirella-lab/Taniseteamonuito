import type { User } from 'firebase/auth';
import { auth } from '../firebase';

/**
 * Exclusive Game Master (GM) account emails.
 * Must always match the bootstrapped GM allowlist in firestore.rules and requires
 * a verified Firebase Authentication session (emailVerified === true).
 */
export const PRIMARY_GM_EMAIL = 'opiadoalvorada@gmail.com';
export const AUTHORIZED_GM_EMAILS: readonly string[] = [
  'opiadoalvorada@gmail.com',
  'otiliolopesmirella@gmail.com',
];

/**
 * Synchronous check verifying if a Firebase Auth user is one of the authorized GMs.
 * Never trusts localStorage or unverified email claims.
 */
export function isBootstrappedGmUser(user: User | null | undefined): boolean {
  if (!user || !user.emailVerified || !user.email) {
    return false;
  }
  return AUTHORIZED_GM_EMAILS.includes(user.email.trim().toLowerCase());
}

/**
 * Authoritative async check resolving whether the verified Firebase user holds GM powers.
 * Strictly restricted to verified emails in AUTHORIZED_GM_EMAILS.
 */
export async function resolveIsGmAccount(
  user: User | null | undefined
): Promise<boolean> {
  return isBootstrappedGmUser(user);
}

/**
 * Fast runtime check against the active Firebase Auth session.
 */
export function isCurrentAuthUserBootstrappedGm(): boolean {
  return isBootstrappedGmUser(auth.currentUser);
}
