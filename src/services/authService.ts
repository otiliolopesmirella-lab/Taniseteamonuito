import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import { getTamerSprites } from '../sprites/tamerSprites';
import type {
  AuthAdapter,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from '../types/auth';
import type { SavedCharacterSelection, TamerId } from '../types/character';
import {
  getStarterDigimonById,
  type SavedStarterDigimon,
  type StarterDigimonId,
} from '../types/digimon';
import {
  bootstrapPlayerCloudProfile,
  clearCloudSaveSessionCache,
  flushPendingCloudSaves,
  hydrateLocalCacheFromCloud,
  sanitizePlayerUsername,
  scheduleAdventureProgressSync,
  syncStarterDigimonToCloud,
  syncTamerSelectionToCloud,
} from './cloudSaveService';
import { checkAccountBanStatus } from './banService';
import {
  isBootstrappedGmUser,
  isCurrentAuthUserBootstrappedGm,
  resolveIsGmAccount,
} from './gmRoleService';
import {
  applyPendingReferralCodeIfAny,
  ensureOwnReferralProfile,
  savePendingReferralCode,
} from './referralService';
import { markLocalWorldPresenceOffline } from './worldPresenceService';

const REMEMBERED_USER_KEY = 'dw_digital_war_remembered_user';
const REMEMBER_FLAG_KEY = 'dw_digital_war_remember_flag';
const USER_EMAIL_ALIAS_KEY = 'dw_digital_war_user_aliases_v1';
const CHARACTER_SELECTION_PREFIX = 'dw_digital_war_tamer_';
const STARTER_SELECTION_PREFIX = 'dw_digital_war_starter_';
const ADVENTURE_PROGRESS_PREFIX = 'dw_digital_war_progress_';

export interface AdventureProgress {
  accountUsername: string;
  characterId: TamerId;
  tamerName: string;
  mapId?: 'dats-center' | 'd-terminal' | 'hunting-plains' | 'data-forest' | 'digi-mountain' | 'digital-desert' | 'data-sea' | 'digimon-island' | 'dark-area' | 'virtual-world';
  worldX: number;
  worldY: number;
  facingDir: 'N' | 'S' | 'E' | 'W';
  stepsCount: number;
  discoveredZones: string[];
  updatedAt: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_STRICT_REGEX = /^[a-zA-Z0-9._-]+$/;

/**
 * Validates either a login username OR a valid email address.
 */
export function validateLoginIdentifier(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Informe seu nome de usuário ou e-mail.';
  }
  if (trimmed.includes('@')) {
    if (!EMAIL_REGEX.test(trimmed)) {
      return 'Informe um endereço de e-mail válido.';
    }
    return null;
  }
  if (trimmed.length < 3) {
    return 'O usuário deve ter pelo menos 3 caracteres.';
  }
  if (trimmed.length > 24) {
    return 'O usuário pode ter no máximo 24 caracteres.';
  }
  if (!USERNAME_STRICT_REGEX.test(trimmed)) {
    return 'Use apenas letras, números ou . _ - (ou informe seu e-mail completo).';
  }
  return null;
}

/**
 * Validates registration username (matches firebase-blueprint.json: 3..24 chars, ^[a-zA-Z0-9._-]+$).
 */
export function validateUsername(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Informe seu nome de usuário.';
  }
  if (trimmed.length < 3) {
    return 'O usuário deve ter pelo menos 3 caracteres.';
  }
  if (trimmed.length > 24) {
    return 'O usuário pode ter no máximo 24 caracteres.';
  }
  if (!USERNAME_STRICT_REGEX.test(trimmed)) {
    return 'Use apenas letras, números ou . _ -';
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) {
    return 'Informe sua senha de acesso.';
  }
  if (value.length < 6) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (value.length > 128) {
    return 'A senha pode ter no máximo 128 caracteres.';
  }
  return null;
}

export function validateTamerName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Digite o nome do seu Tamer antes de confirmar.';
  }
  if (trimmed.length < 3) {
    return 'O nome do Tamer deve ter pelo menos 3 caracteres.';
  }
  if (trimmed.length > 16) {
    return 'O nome do Tamer pode ter no máximo 16 caracteres.';
  }
  if (!/^[a-zA-Z0-9À-ÿ _-]+$/.test(trimmed)) {
    return 'Use apenas letras, números, espaços, _ ou -';
  }
  return null;
}

// ============================================================================
// Device-local Username <-> Email Alias Cache (Zero PII in public Firestore)
// ============================================================================

function loadUsernameAliasMap(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(USER_EMAIL_ALIAS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

export function rememberUsernameEmailAlias(
  username: string,
  email?: string | null
): void {
  const key = username.trim().toLowerCase();
  const cleanEmail = (email ?? '').trim().toLowerCase();
  if (!key || !cleanEmail || !cleanEmail.includes('@')) return;
  try {
    const current = loadUsernameAliasMap();
    current[key] = cleanEmail;
    window.localStorage.setItem(USER_EMAIL_ALIAS_KEY, JSON.stringify(current));
  } catch {
    // Ignore private browsing storage restrictions
  }
}

function resolveRememberedEmailForUsername(username: string): string | null {
  const key = username.trim().toLowerCase();
  if (!key) return null;
  const map = loadUsernameAliasMap();
  return map[key] ?? null;
}

export function getStoredRememberPreference(): {
  rememberMe: boolean;
  username: string;
} {
  try {
    const rememberFlag = window.localStorage.getItem(REMEMBER_FLAG_KEY) === 'true';
    const username = rememberFlag
      ? window.localStorage.getItem(REMEMBERED_USER_KEY) ?? ''
      : '';
    return { rememberMe: rememberFlag, username };
  } catch {
    return { rememberMe: false, username: '' };
  }
}

export function persistRememberPreference(
  rememberMe: boolean,
  username: string
): void {
  try {
    if (rememberMe && username.trim()) {
      window.localStorage.setItem(REMEMBER_FLAG_KEY, 'true');
      window.localStorage.setItem(REMEMBERED_USER_KEY, username.trim());
    } else {
      window.localStorage.removeItem(REMEMBER_FLAG_KEY);
      window.localStorage.removeItem(REMEMBERED_USER_KEY);
    }
  } catch {
    // Ignore storage quota or private browsing errors cleanly
  }
}

export function getSavedCharacterForAccount(
  accountUsername: string
): SavedCharacterSelection | null {
  try {
    const key = `${CHARACTER_SELECTION_PREFIX}${accountUsername.trim().toLowerCase()}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as SavedCharacterSelection;
  } catch {
    return null;
  }
}

export async function saveCharacterForAccount(params: {
  accountUsername: string;
  characterId: TamerId;
  tamerName: string;
}): Promise<{ success: boolean; message: string; saved?: SavedCharacterSelection }> {
  const cleanAccount = params.accountUsername.trim() || 'tamer_local';
  const existing = getSavedCharacterForAccount(cleanAccount);

  // Permanent Tamer rule: once confirmed, the player cannot overwrite or switch to another Tamer.
  if (existing) {
    return {
      success: true,
      message: `Seu Tamer "${existing.tamerName}" já está vinculado definitivamente a esta conta.`,
      saved: existing,
    };
  }

  const nameErr = validateTamerName(params.tamerName);
  if (nameErr) {
    return { success: false, message: nameErr };
  }

  const sprites = getTamerSprites(params.characterId);
  const record: SavedCharacterSelection = {
    accountUsername: cleanAccount,
    characterId: params.characterId,
    tamerName: params.tamerName.trim(),
    spritesheetMeta: {
      frameWidth: sprites.frameWidth,
      frameHeight: sprites.frameHeight,
      columns: sprites.columns,
      rows: sprites.rows,
      directions: sprites.directions,
    },
    updatedAt: new Date().toISOString(),
  };

  try {
    const key = `${CHARACTER_SELECTION_PREFIX}${record.accountUsername.toLowerCase()}`;
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch {
    // Graceful fallback even if storage is unavailable
  }

  // Sync to Cloud Firestore immediately when signed in with a verified account
  await syncTamerSelectionToCloud(record);

  return {
    success: true,
    message: `Personagem "${record.tamerName}" salvo definitivamente na conta "${record.accountUsername}"!`,
    saved: record,
  };
}

export function getAdventureProgressForAccount(
  accountUsername: string
): AdventureProgress | null {
  try {
    const cleanUser = (accountUsername.trim() || 'tamer_local').toLowerCase();
    const raw = window.localStorage.getItem(`${ADVENTURE_PROGRESS_PREFIX}${cleanUser}`);
    if (!raw) return null;
    return JSON.parse(raw) as AdventureProgress;
  } catch {
    return null;
  }
}

export function saveAdventureProgressForAccount(progress: AdventureProgress): void {
  try {
    const cleanUser = (progress.accountUsername.trim() || 'tamer_local').toLowerCase();
    window.localStorage.setItem(
      `${ADVENTURE_PROGRESS_PREFIX}${cleanUser}`,
      JSON.stringify(progress)
    );
  } catch {
    // Graceful fallback if storage is unavailable
  }
  scheduleAdventureProgressSync(progress);
}

export function getSavedStarterDigimonForAccount(
  accountUsername: string
): SavedStarterDigimon | null {
  try {
    const cleanUser = (accountUsername.trim() || 'tamer_local').toLowerCase();
    const raw = window.localStorage.getItem(`${STARTER_SELECTION_PREFIX}${cleanUser}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedStarterDigimon;
    if (
      parsed.digimonId === 'agumon' ||
      parsed.digimonId === 'agumon_classic' ||
      parsed.digimonId === 'gabumon' ||
      parsed.digimonId === 'impmon' ||
      parsed.digimonId === 'veemon' ||
      parsed.digimonId === 'keramon' ||
      parsed.digimonId === 'gaomon' ||
      parsed.digimonId === 'lalamon' ||
      parsed.digimonId === 'guilmon' ||
      parsed.digimonId === 'demimeramon' ||
      parsed.digimonId === 'hawkmon' ||
      parsed.digimonId === 'tentomon' ||
      parsed.digimonId === 'drimogemon' ||
      parsed.digimonId === 'kiwimon' ||
      parsed.digimonId === 'gotsumon' ||
      parsed.digimonId === 'elecmon' ||
      parsed.digimonId === 'renamon' ||
      parsed.digimonId === 'monodramon' ||
      parsed.digimonId === 'biyomon' ||
      parsed.digimonId === 'kunemon' ||
      parsed.digimonId === 'salamon' ||
      parsed.digimonId === 'patamon' ||
      parsed.digimonId === 'starmon'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveStarterDigimonForAccount(params: {
  accountUsername: string;
  digimonId: StarterDigimonId;
}): Promise<{ success: boolean; message: string; saved: SavedStarterDigimon }> {
  const cleanAccount = params.accountUsername.trim() || 'tamer_local';
  const existing = getSavedStarterDigimonForAccount(cleanAccount);

  // Permanent bond rule: once confirmed, the player cannot overwrite or switch to another starter.
  if (existing) {
    return {
      success: true,
      message: `Seu parceiro inicial ${existing.digimonName} já está vinculado à conta.`,
      saved: existing,
    };
  }

  const profile = getStarterDigimonById(params.digimonId);
  const record: SavedStarterDigimon = {
    accountUsername: cleanAccount,
    digimonId: profile.id,
    digimonName: profile.name,
    element: profile.element,
    chosenAt: new Date().toISOString(),
  };

  try {
    const key = `${STARTER_SELECTION_PREFIX}${cleanAccount.toLowerCase()}`;
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch {
    // Ignore storage unavailability cleanly
  }

  // Persist permanent starter bond to Cloud Firestore
  await syncStarterDigimonToCloud(record);

  return {
    success: true,
    message: `${profile.name} agora é seu parceiro oficial no Mundo Digital!`,
    saved: record,
  };
}

export function overrideCharacterForGm(params: {
  accountUsername: string;
  characterId: TamerId;
  tamerName?: string;
}): SavedCharacterSelection {
  if (!isCurrentAuthUserBootstrappedGm()) {
    throw new Error('Acesso negado: ação exclusiva para GMs verificados.');
  }
  const cleanAccount = params.accountUsername.trim() || 'TamerTeste';
  const existing = getSavedCharacterForAccount(cleanAccount);
  const sprites = getTamerSprites(params.characterId);
  const record: SavedCharacterSelection = {
    accountUsername: cleanAccount,
    characterId: params.characterId,
    tamerName: (params.tamerName ?? existing?.tamerName ?? cleanAccount).trim() || cleanAccount,
    spritesheetMeta: {
      frameWidth: sprites.frameWidth,
      frameHeight: sprites.frameHeight,
      columns: sprites.columns,
      rows: sprites.rows,
      directions: sprites.directions,
    },
    updatedAt: new Date().toISOString(),
  };

  try {
    const key = `${CHARACTER_SELECTION_PREFIX}${cleanAccount.toLowerCase()}`;
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch {
    // Ignore storage unavailability cleanly
  }

  return record;
}

export function overrideStarterDigimonForGm(params: {
  accountUsername: string;
  digimonId: StarterDigimonId;
}): SavedStarterDigimon {
  if (!isCurrentAuthUserBootstrappedGm()) {
    throw new Error('Acesso negado: ação exclusiva para GMs verificados.');
  }
  const cleanAccount = params.accountUsername.trim() || 'TamerTeste';
  const profile = getStarterDigimonById(params.digimonId);
  const record: SavedStarterDigimon = {
    accountUsername: cleanAccount,
    digimonId: profile.id,
    digimonName: profile.name,
    element: profile.element,
    chosenAt: new Date().toISOString(),
  };

  try {
    const key = `${STARTER_SELECTION_PREFIX}${cleanAccount.toLowerCase()}`;
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch {
    // Ignore storage unavailability cleanly
  }

  return record;
}

function mapFirebaseAuthError(error: unknown): {
  message: string;
  errorField?: AuthResponse['errorField'];
  emailProviderDisabled?: boolean;
} {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return {
        message: 'Usuário/e-mail ou senha incorretos. Verifique seus dados e tente novamente.',
        errorField: 'password',
      };
    case 'auth/invalid-email':
      return {
        message: 'Endereço de e-mail inválido.',
        errorField: 'email',
      };
    case 'auth/email-already-in-use':
      return {
        message: 'Este e-mail já está cadastrado. Faça login ou use "Esqueci minha senha".',
        errorField: 'email',
      };
    case 'auth/weak-password':
      return {
        message: 'Senha muito fraca. Utilize pelo menos 6 caracteres.',
        errorField: 'password',
      };
    case 'auth/too-many-requests':
      return {
        message: 'Muitas tentativas seguidas. Aguarde alguns instantes antes de tentar novamente.',
        errorField: 'general',
      };
    case 'auth/operation-not-allowed':
      return {
        message:
          'O login por E-mail/Senha ainda precisa ser ativado no Firebase Console (Authentication → Sign-in method → E-mail/senha).',
        errorField: 'general',
        emailProviderDisabled: true,
      };
    case 'auth/unauthorized-domain': {
      const host =
        typeof window !== 'undefined' && window.location.hostname
          ? window.location.hostname
          : 'este domínio';
      return {
        message: `Domínio "${host}" ainda não autorizado no Firebase Console (Authentication → Settings → Authorized domains).`,
        errorField: 'general',
      };
    }
    case 'auth/account-exists-with-different-credential':
      return {
        message: 'Já existe uma conta cadastrada com esse e-mail usando outro método de login.',
        errorField: 'general',
      };
    case 'auth/network-request-failed':
      return {
        message: 'Sem conexão com o servidor de autenticação. Verifique sua internet.',
        errorField: 'general',
      };
    default:
      return {
        message: code
          ? `Não foi possível concluir a autenticação (${code}). Tente novamente.`
          : 'Não foi possível concluir a autenticação. Tente novamente.',
        errorField: 'general',
      };
  }
}

/**
 * Production Firebase Authentication & Firestore Cloud Save adapter.
 * Supports login via Email or remembered Username + Password,
 * email verification, password reset, and cloud sync.
 * GM privileges are exclusively granted to verified accounts in AUTHORIZED_GM_EMAILS.
 */
class FirebaseDigitalWarAuthService implements AuthAdapter {
  async signInWithCredentials(
    credentials: LoginCredentials
  ): Promise<AuthResponse> {
    const identifierError = validateLoginIdentifier(credentials.username);
    if (identifierError) {
      return {
        success: false,
        message: identifierError,
        errorField: 'username',
      };
    }

    const passwordError = validatePassword(credentials.password);
    if (passwordError) {
      return {
        success: false,
        message: passwordError,
        errorField: 'password',
      };
    }

    const trimmedIdentifier = credentials.username.trim();
    const loginEmail = trimmedIdentifier.includes('@')
      ? trimmedIdentifier.toLowerCase()
      : resolveRememberedEmailForUsername(trimmedIdentifier);

    if (!loginEmail || !EMAIL_REGEX.test(loginEmail)) {
      return {
        success: false,
        message:
          'Informe o e-mail completo cadastrado na sua conta (ex.: domador@gmail.com).',
        errorField: 'username',
      };
    }

    try {
      await setPersistence(
        auth,
        credentials.rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
      const cred = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        credentials.password
      );
      const fbUser = cred.user;

      if (!fbUser.emailVerified) {
        return {
          success: false,
          requiresEmailVerification: true,
          message:
            'Seu e-mail ainda não foi confirmado. Abra o link enviado para sua caixa de entrada e clique em "Já confirmei — Entrar".',
          errorField: 'general',
        };
      }

      await fbUser.getIdToken(true).catch(() => {});

      if (!isBootstrappedGmUser(fbUser)) {
        const banStatus = await checkAccountBanStatus(fbUser.uid);
        if (banStatus.banned) {
          await signOut(auth).catch(() => {});
          return {
            success: false,
            message:
              banStatus.message ??
              'Esta conta foi suspensa pela administração do servidor.',
            errorField: 'general',
          };
        }
      }

      const preferredHandle = sanitizePlayerUsername(
        fbUser.displayName ||
          (!trimmedIdentifier.includes('@')
            ? trimmedIdentifier
            : loginEmail.split('@')[0]) ||
          'Tamer',
        fbUser.uid
      );
      const cloud = await bootstrapPlayerCloudProfile(
        fbUser,
        preferredHandle,
        'password'
      );

      rememberUsernameEmailAlias(cloud.username, fbUser.email);
      hydrateLocalCacheFromCloud(cloud.username, cloud);
      const isGM = await resolveIsGmAccount(fbUser);

      // Ensure account invite code exists and redeem any pending referral link/code
      const tamerLabel = cloud.tamerSelection?.tamerName || cloud.username;
      void ensureOwnReferralProfile({
        tamerName: tamerLabel,
        characterId: cloud.tamerSelection?.characterId,
        tamerPhotoUrl: cloud.hudState?.tamerPhotoUrl ?? null,
        tamerCoverUrl: cloud.hudState?.tamerCoverUrl ?? null,
        isGm: isGM,
      });
      void applyPendingReferralCodeIfAny(tamerLabel);

      return {
        success: true,
        message: `Bem-vindo de volta, ${cloud.username}! Progresso carregado da nuvem.`,
        user: {
          uid: fbUser.uid,
          username: cloud.username,
          email: fbUser.email ?? undefined,
          persistence: credentials.rememberMe ? 'local' : 'session',
          authProvider: 'password',
          isGM,
        },
      };
    } catch (error) {
      const mapped = mapFirebaseAuthError(error);
      return {
        success: false,
        message: mapped.message,
        errorField: mapped.errorField,
        emailProviderDisabled: mapped.emailProviderDisabled,
      };
    }
  }

  async createAccount(payload: RegisterCredentials): Promise<AuthResponse> {
    const usernameError = validateUsername(payload.username);
    if (usernameError) {
      return { success: false, message: usernameError, errorField: 'username' };
    }

    const emailTrimmed = payload.email.trim().toLowerCase();
    if (!emailTrimmed || !EMAIL_REGEX.test(emailTrimmed)) {
      return {
        success: false,
        message: 'Informe um e-mail válido para vincular sua conta.',
        errorField: 'email',
      };
    }

    const passwordError = validatePassword(payload.password);
    if (passwordError) {
      return { success: false, message: passwordError, errorField: 'password' };
    }

    if (payload.password !== payload.confirmPassword) {
      return {
        success: false,
        message: 'As senhas digitadas não coincidem.',
        errorField: 'confirmPassword',
      };
    }

    const cleanUsername = sanitizePlayerUsername(payload.username);

    try {
      await setPersistence(auth, browserLocalPersistence);
      const cred = await createUserWithEmailAndPassword(
        auth,
        emailTrimmed,
        payload.password
      );
      await updateProfile(cred.user, { displayName: cleanUsername });
      rememberUsernameEmailAlias(cleanUsername, emailTrimmed);
      persistRememberPreference(true, cleanUsername);
      if (payload.referralCode) {
        savePendingReferralCode(payload.referralCode);
      }

      await sendEmailVerification(cred.user);

      return {
        success: true,
        requiresEmailVerification: true,
        message: `Conta "${cleanUsername}" criada! Enviamos um link de confirmação para ${emailTrimmed}. Clique no link e depois toque em "Já confirmei — Entrar".`,
      };
    } catch (error) {
      const mapped = mapFirebaseAuthError(error);
      return {
        success: false,
        message: mapped.message,
        errorField: mapped.errorField,
        emailProviderDisabled: mapped.emailProviderDisabled,
      };
    }
  }

  async reloadVerifiedUser(preferredUsername?: string): Promise<AuthResponse> {
    const current = auth.currentUser;
    if (!current) {
      return {
        success: false,
        message: 'Nenhuma sessão ativa encontrada. Faça login novamente.',
        errorField: 'general',
      };
    }

    try {
      await current.reload();
      await current.getIdToken(true);
      if (!current.emailVerified) {
        return {
          success: false,
          requiresEmailVerification: true,
          message:
            'Seu e-mail ainda não consta como confirmado. Verifique sua caixa de entrada ou spam e tente novamente.',
          errorField: 'general',
        };
      }

      if (!isBootstrappedGmUser(current)) {
        const banStatus = await checkAccountBanStatus(current.uid);
        if (banStatus.banned) {
          await signOut(auth).catch(() => {});
          return {
            success: false,
            message:
              banStatus.message ??
              'Esta conta foi suspensa pela administração do servidor.',
            errorField: 'general',
          };
        }
      }

      const cloud = await bootstrapPlayerCloudProfile(
        current,
        preferredUsername || current.displayName || undefined,
        'password'
      );
      rememberUsernameEmailAlias(cloud.username, current.email);
      hydrateLocalCacheFromCloud(cloud.username, cloud);
      const isGM = await resolveIsGmAccount(current);

      // Immediately generate this new account's unique invite code & count any pending invite code
      const tamerLabel = cloud.tamerSelection?.tamerName || cloud.username;
      void ensureOwnReferralProfile({
        tamerName: tamerLabel,
        characterId: cloud.tamerSelection?.characterId,
        tamerPhotoUrl: cloud.hudState?.tamerPhotoUrl ?? null,
        tamerCoverUrl: cloud.hudState?.tamerCoverUrl ?? null,
        isGm: isGM,
      });
      await applyPendingReferralCodeIfAny(tamerLabel);

      return {
        success: true,
        message: `E-mail confirmado! Bem-vindo, ${cloud.username}.`,
        user: {
          uid: current.uid,
          username: cloud.username,
          email: current.email ?? undefined,
          persistence: 'local',
          authProvider: 'password',
          isGM,
        },
      };
    } catch (error) {
      const mapped = mapFirebaseAuthError(error);
      return {
        success: false,
        message: mapped.message,
        errorField: mapped.errorField,
      };
    }
  }

  async resendVerificationEmail(): Promise<AuthResponse> {
    const current = auth.currentUser;
    if (!current) {
      return {
        success: false,
        message: 'Faça login com seu e-mail e senha primeiro para reenviar o link.',
        errorField: 'general',
      };
    }
    try {
      await sendEmailVerification(current);
      return {
        success: true,
        requiresEmailVerification: true,
        message: `Novo link de verificação enviado para ${current.email ?? 'seu e-mail'}.`,
      };
    } catch (error) {
      const mapped = mapFirebaseAuthError(error);
      return {
        success: false,
        message: mapped.message,
        errorField: mapped.errorField,
      };
    }
  }

  async sendPasswordReset(identifier: string): Promise<AuthResponse> {
    const trimmed = identifier.trim();
    if (!trimmed || trimmed.length < 3) {
      return {
        success: false,
        message: 'Digite seu e-mail ou usuário cadastrado.',
        errorField: 'email',
      };
    }

    let targetEmail = trimmed.includes('@')
      ? trimmed.toLowerCase()
      : resolveRememberedEmailForUsername(trimmed) ?? '';

    if (!targetEmail || !EMAIL_REGEX.test(targetEmail)) {
      return {
        success: false,
        message: 'Digite o endereço de e-mail completo vinculado à sua conta.',
        errorField: 'email',
      };
    }

    try {
      await sendPasswordResetEmail(auth, targetEmail);
      return {
        success: true,
        message: `Link de redefinição de senha enviado para ${targetEmail}. Confira sua caixa de entrada e spam.`,
      };
    } catch (error) {
      const mapped = mapFirebaseAuthError(error);
      return {
        success: false,
        message: mapped.message,
        errorField: mapped.errorField,
      };
    }
  }

  async signOutAccount(): Promise<void> {
    await Promise.all([
      flushPendingCloudSaves(),
      markLocalWorldPresenceOffline(),
    ]);
    clearCloudSaveSessionCache();
    if (auth.currentUser) {
      try {
        await signOut(auth);
      } catch {
        // Ignore sign-out errors when no active Firebase session exists
      }
    }
  }
}

export const authService: AuthAdapter = new FirebaseDigitalWarAuthService();
