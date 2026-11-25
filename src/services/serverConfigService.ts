import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

export const ALLOWED_SERVER_EXP_RATES = [100, 150, 200, 250] as const;
export type ServerExpRatePct = (typeof ALLOWED_SERVER_EXP_RATES)[number];

export interface ServerExpRateState {
  expRatePct: ServerExpRatePct;
  updatedBy: string;
}

const LOCAL_STORAGE_KEY = 'dmo_server_exp_rate_v1';
const DEFAULT_RATE_STATE: ServerExpRateState = {
  expRatePct: 100,
  updatedBy: 'Sistema',
};

const localListeners = new Set<(state: ServerExpRateState) => void>();

function normalizeExpRatePct(raw: unknown): ServerExpRatePct {
  if (raw === 150 || raw === 200 || raw === 250) return raw;
  return 100;
}

function readLocalRateState(): ServerExpRateState {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return DEFAULT_RATE_STATE;
    const parsed = JSON.parse(raw) as Partial<ServerExpRateState>;
    return {
      expRatePct: normalizeExpRatePct(parsed.expRatePct),
      updatedBy:
        typeof parsed.updatedBy === 'string' && parsed.updatedBy.trim().length > 0
          ? parsed.updatedBy.trim().slice(0, 24)
          : 'Sistema',
    };
  } catch {
    return DEFAULT_RATE_STATE;
  }
}

function writeLocalRateState(state: ServerExpRateState): void {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
  for (const listener of localListeners) {
    listener(state);
  }
}

/**
 * Applies the active server EXP rate (100% = normal, 150% = 1.5x, 200% = 2x, 250% = 2.5x)
 * plus optional passive Guild EXP bonus percentage.
 */
export function applyServerExpMultiplier(
  baseExp: number,
  expRatePct: ServerExpRatePct,
  guildExpBonusPct = 0
): number {
  const safeBase = Math.max(1, Math.round(baseExp));
  const totalPct = Math.max(100, expRatePct + Math.max(0, guildExpBonusPct));
  return Math.max(1, Math.round((safeBase * totalPct) / 100));
}

export function subscribeServerExpRate(
  onUpdate: (state: ServerExpRateState) => void
): Unsubscribe {
  localListeners.add(onUpdate);
  onUpdate(readLocalRateState());

  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return () => {
      localListeners.delete(onUpdate);
    };
  }

  const ref = doc(db, 'serverConfig', 'rates');
  const unsubSnapshot = onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(readLocalRateState());
        return;
      }
      const data = snap.data() as Record<string, unknown>;
      const next: ServerExpRateState = {
        expRatePct: normalizeExpRatePct(data.expRatePct),
        updatedBy:
          typeof data.updatedBy === 'string' && data.updatedBy.trim().length > 0
            ? data.updatedBy.trim().slice(0, 24)
            : 'GM',
      };
      writeLocalRateState(next);
    },
    (error) => {
      onUpdate(readLocalRateState());
      try {
        handleFirestoreError(error, OperationType.GET, 'serverConfig/rates');
      } catch {
        // Keep game running smoothly on local fallback
      }
    }
  );

  return () => {
    localListeners.delete(onUpdate);
    unsubSnapshot();
  };
}

export async function setServerExpRate(
  expRatePct: ServerExpRatePct,
  gmName: string
): Promise<{ ok: boolean; error?: string }> {
  const cleanName = gmName.trim().slice(0, 24) || 'GM';
  const nextState: ServerExpRateState = {
    expRatePct: normalizeExpRatePct(expRatePct),
    updatedBy: cleanName,
  };

  writeLocalRateState(nextState);

  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return { ok: true };
  }

  const ref = doc(db, 'serverConfig', 'rates');
  try {
    await setDoc(ref, {
      expRatePct: nextState.expRatePct,
      updatedBy: nextState.updatedBy,
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, 'serverConfig/rates');
    } catch {
      // Structured log only
    }
    return {
      ok: false,
      error: 'Apenas o GM autorizado pode alterar a taxa de EXP do servidor.',
    };
  }
}

// ============================================================================
// Global Server Announcements & Maintenance Banner (/serverConfig/announcement)
// ============================================================================

export type ServerAnnouncementSeverity =
  | 'info'
  | 'event'
  | 'warning'
  | 'maintenance';

export interface ServerAnnouncementState {
  announcementId: string;
  title: string;
  message: string;
  severity: ServerAnnouncementSeverity;
  maintenanceMode: boolean;
  active: boolean;
  updatedBy: string;
}

const ANNOUNCEMENT_LOCAL_KEY = 'dmo_server_announcement_v1';
const announcementListeners = new Set<
  (state: ServerAnnouncementState | null) => void
>();

function readLocalAnnouncement(): ServerAnnouncementState | null {
  try {
    const raw = window.localStorage.getItem(ANNOUNCEMENT_LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ServerAnnouncementState>;
    if (!parsed || typeof parsed.message !== 'string') return null;
    return {
      announcementId: String(parsed.announcementId ?? 'local'),
      title: String(parsed.title ?? 'Aviso do Servidor').slice(0, 48),
      message: String(parsed.message ?? '').slice(0, 240),
      severity:
        parsed.severity === 'event' ||
        parsed.severity === 'warning' ||
        parsed.severity === 'maintenance'
          ? parsed.severity
          : 'info',
      maintenanceMode: Boolean(parsed.maintenanceMode),
      active: Boolean(parsed.active),
      updatedBy: String(parsed.updatedBy ?? 'GM').slice(0, 24),
    };
  } catch {
    return null;
  }
}

function writeLocalAnnouncement(state: ServerAnnouncementState | null): void {
  try {
    if (state) {
      window.localStorage.setItem(ANNOUNCEMENT_LOCAL_KEY, JSON.stringify(state));
    } else {
      window.localStorage.removeItem(ANNOUNCEMENT_LOCAL_KEY);
    }
  } catch {
    // Ignore storage errors
  }
  for (const listener of announcementListeners) {
    listener(state);
  }
}

export function subscribeServerAnnouncement(
  onUpdate: (state: ServerAnnouncementState | null) => void
): Unsubscribe {
  announcementListeners.add(onUpdate);
  onUpdate(readLocalAnnouncement());

  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return () => {
      announcementListeners.delete(onUpdate);
    };
  }

  const ref = doc(db, 'serverConfig', 'announcement');
  const unsubSnapshot = onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        writeLocalAnnouncement(null);
        return;
      }
      const d = snap.data() as Record<string, unknown>;
      const severityRaw = String(d.severity ?? 'info');
      const severity: ServerAnnouncementSeverity =
        severityRaw === 'event' ||
        severityRaw === 'warning' ||
        severityRaw === 'maintenance'
          ? severityRaw
          : 'info';

      const next: ServerAnnouncementState = {
        announcementId: String(d.announcementId ?? 'srv_ann').slice(0, 64),
        title: String(d.title ?? 'Aviso do Servidor').slice(0, 48),
        message: String(d.message ?? '').slice(0, 240),
        severity,
        maintenanceMode: Boolean(d.maintenanceMode),
        active: Boolean(d.active),
        updatedBy:
          typeof d.updatedBy === 'string' && d.updatedBy.trim().length > 0
            ? d.updatedBy.trim().slice(0, 24)
            : 'GM',
      };
      writeLocalAnnouncement(next);
    },
    (error) => {
      onUpdate(readLocalAnnouncement());
      try {
        handleFirestoreError(error, OperationType.GET, 'serverConfig/announcement');
      } catch {
        // Structured log only
      }
    }
  );

  return () => {
    announcementListeners.delete(onUpdate);
    unsubSnapshot();
  };
}

export async function publishServerAnnouncement(input: {
  title: string;
  message: string;
  severity: ServerAnnouncementSeverity;
  maintenanceMode: boolean;
  active: boolean;
  gmName: string;
}): Promise<{ ok: boolean; error?: string; state?: ServerAnnouncementState }> {
  const cleanTitle = input.title.trim().slice(0, 48) || 'Aviso do Servidor';
  const cleanMessage =
    input.message.trim().slice(0, 240) || 'Manutenção programada em breve.';
  const cleanGm = input.gmName.trim().slice(0, 24) || 'GM';
  const announcementId = `ann_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 7)}`.slice(0, 64);

  const nextState: ServerAnnouncementState = {
    announcementId,
    title: cleanTitle,
    message: cleanMessage,
    severity: input.severity,
    maintenanceMode: Boolean(input.maintenanceMode),
    active: Boolean(input.active),
    updatedBy: cleanGm,
  };

  writeLocalAnnouncement(nextState);

  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return { ok: true, state: nextState };
  }

  const ref = doc(db, 'serverConfig', 'announcement');
  try {
    await setDoc(ref, {
      ...nextState,
      updatedAt: serverTimestamp(),
    });
    return { ok: true, state: nextState };
  } catch (error) {
    try {
      handleFirestoreError(
        error,
        OperationType.WRITE,
        'serverConfig/announcement'
      );
    } catch {
      // Structured log only
    }
    return {
      ok: false,
      error: 'Apenas o GM autorizado pode publicar avisos globais.',
    };
  }
}

