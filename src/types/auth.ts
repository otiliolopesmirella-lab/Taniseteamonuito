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
  animationsEnabled: boolean;
  graphicsQuality: 'alta' | 'equilibrada';
}
