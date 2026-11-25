export type ModalSection =
  | 'register'
  | 'forgot-password'
  | 'settings'
  | 'ranking'
  | 'events'
  | 'support';

export interface LoginCredentials {
  /** Accepts either a registered username or email address */
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthUserSummary {
  uid: string;
  username: string;
  email?: string;
  persistence: 'local' | 'session';
  authProvider?: 'password';
  isGM?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUserSummary;
  requiresEmailVerification?: boolean;
  emailProviderDisabled?: boolean;
  errorField?: 'username' | 'password' | 'email' | 'confirmPassword' | 'general';
}

export interface AuthAdapter {
  /**
   * Authenticates a tamer using username or email + password via Firebase Auth.
   */
  signInWithCredentials(credentials: LoginCredentials): Promise<AuthResponse>;

  /**
   * Registers a new tamer account with username, email and password via Firebase Auth
   * and triggers email verification for Firestore cloud sync.
   */
  createAccount(payload: RegisterCredentials): Promise<AuthResponse>;

  /**
   * Re-checks whether the currently signed-in user verified their email and hydrates cloud save.
   */
  reloadVerifiedUser(preferredUsername?: string): Promise<AuthResponse>;

  /**
   * Re-sends the Firebase email verification message to the signed-in user.
   */
  resendVerificationEmail(): Promise<AuthResponse>;

  /**
   * Triggers a real Firebase Auth password recovery email.
   */
  sendPasswordReset(identifier: string): Promise<AuthResponse>;

  /**
   * Flushes pending cloud saves and signs out of Firebase Auth.
   */
  signOutAccount(): Promise<void>;
}

export interface AppPreferences {
  soundEnabled: boolean;
  musicEnabled: boolean;
  musicVolume: number; // 0..100
  animationsEnabled: boolean;
  graphicsQuality: 'alta' | 'equilibrada';
  showFloatingDamage: boolean;
  showPlayerNames: boolean;
  showChatBubbles: boolean;
  showOffscreenPointers: boolean;
  minimapSize: 'compacto' | 'padrao';
}

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  soundEnabled: true,
  musicEnabled: true,
  musicVolume: 80,
  animationsEnabled: true,
  graphicsQuality: 'alta',
  showFloatingDamage: true,
  showPlayerNames: true,
  showChatBubbles: true,
  showOffscreenPointers: true,
  minimapSize: 'padrao',
};

const APP_PREFERENCES_STORAGE_KEY = 'digilegends_app_preferences_v2';

export function loadAppPreferences(): AppPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_APP_PREFERENCES };
  try {
    const raw = window.localStorage.getItem(APP_PREFERENCES_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_APP_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      soundEnabled:
        typeof parsed.soundEnabled === 'boolean'
          ? parsed.soundEnabled
          : DEFAULT_APP_PREFERENCES.soundEnabled,
      musicEnabled:
        typeof parsed.musicEnabled === 'boolean'
          ? parsed.musicEnabled
          : DEFAULT_APP_PREFERENCES.musicEnabled,
      musicVolume:
        typeof parsed.musicVolume === 'number' && Number.isFinite(parsed.musicVolume)
          ? Math.max(0, Math.min(100, Math.round(parsed.musicVolume)))
          : DEFAULT_APP_PREFERENCES.musicVolume,
      animationsEnabled:
        typeof parsed.animationsEnabled === 'boolean'
          ? parsed.animationsEnabled
          : DEFAULT_APP_PREFERENCES.animationsEnabled,
      graphicsQuality:
        parsed.graphicsQuality === 'equilibrada' ? 'equilibrada' : 'alta',
      showFloatingDamage:
        typeof parsed.showFloatingDamage === 'boolean'
          ? parsed.showFloatingDamage
          : DEFAULT_APP_PREFERENCES.showFloatingDamage,
      showPlayerNames:
        typeof parsed.showPlayerNames === 'boolean'
          ? parsed.showPlayerNames
          : DEFAULT_APP_PREFERENCES.showPlayerNames,
      showChatBubbles:
        typeof parsed.showChatBubbles === 'boolean'
          ? parsed.showChatBubbles
          : DEFAULT_APP_PREFERENCES.showChatBubbles,
      showOffscreenPointers:
        typeof parsed.showOffscreenPointers === 'boolean'
          ? parsed.showOffscreenPointers
          : DEFAULT_APP_PREFERENCES.showOffscreenPointers,
      minimapSize: parsed.minimapSize === 'compacto' ? 'compacto' : 'padrao',
    };
  } catch {
    return { ...DEFAULT_APP_PREFERENCES };
  }
}

export function saveAppPreferences(prefs: AppPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors
  }
}
