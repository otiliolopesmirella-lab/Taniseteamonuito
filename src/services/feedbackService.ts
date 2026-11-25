import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  type Timestamp,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';

export type AlphaFeedbackCategory = 'bug' | 'suggestion' | 'balance' | 'other';

export interface AlphaFeedbackItem {
  id: string;
  ownerUid: string;
  username: string;
  tamerName: string;
  category: AlphaFeedbackCategory;
  screenContext: string;
  message: string;
  deviceInfo: string;
  status: 'open';
  createdAtMs: number;
}

export interface SubmitAlphaFeedbackInput {
  username: string;
  tamerName?: string;
  category: AlphaFeedbackCategory;
  screenContext: string;
  message: string;
}

function buildDeviceInfo(): string {
  if (typeof window === 'undefined') return 'web-unknown';
  const nav = window.navigator;
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (nav as Navigator & { standalone?: boolean }).standalone === true;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent);
  const platform = isMobile ? 'Mobile' : 'Desktop';
  const mode = standalone ? 'PWA' : 'Browser';
  const dims = `${window.innerWidth}x${window.innerHeight}`;
  return `${platform} (${mode}) ${dims}`.slice(0, 120);
}

function sanitizeUsername(raw: string): string {
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9._-]/g, '');
  if (cleaned.length >= 3) return cleaned.slice(0, 24);
  return 'DomadorAlfa';
}

function generateReportId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `fb_${Date.now()}_${randomPart}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function submitAlphaFeedback(
  input: SubmitAlphaFeedbackInput
): Promise<AlphaFeedbackItem> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    throw new Error(
      'Faça login com uma conta verificada para enviar relatos da versão Alfa.'
    );
  }

  const trimmedMessage = input.message.trim();
  if (trimmedMessage.length < 5) {
    throw new Error('Descreva o problema ou sugestão com pelo menos 5 caracteres.');
  }
  if (trimmedMessage.length > 600) {
    throw new Error('A mensagem deve ter no máximo 600 caracteres.');
  }

  const reportId = generateReportId();
  const path = `alphaFeedback/${reportId}`;
  const username = sanitizeUsername(input.username);
  const tamerName = (input.tamerName ?? '').trim().slice(0, 16);
  const screenContext = (input.screenContext || 'world').trim().slice(0, 40) || 'world';
  const deviceInfo = buildDeviceInfo();

  try {
    await setDoc(doc(db, 'alphaFeedback', reportId), {
      ownerUid: user.uid,
      username,
      tamerName,
      category: input.category,
      screenContext,
      message: trimmedMessage,
      deviceInfo,
      status: 'open',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return {
    id: reportId,
    ownerUid: user.uid,
    username,
    tamerName,
    category: input.category,
    screenContext,
    message: trimmedMessage,
    deviceInfo,
    status: 'open',
    createdAtMs: Date.now(),
  };
}

export async function listMyAlphaFeedback(): Promise<AlphaFeedbackItem[]> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return [];
  }

  try {
    const q = query(
      collection(db, 'alphaFeedback'),
      where('ownerUid', '==', user.uid)
    );
    const snap = await getDocs(q);
    const items: AlphaFeedbackItem[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const ts = data.createdAt as Timestamp | undefined;
      const createdAtMs =
        ts && typeof ts.toMillis === 'function' ? ts.toMillis() : Date.now();
      items.push({
        id: docSnap.id,
        ownerUid: String(data.ownerUid ?? user.uid),
        username: String(data.username ?? ''),
        tamerName: String(data.tamerName ?? ''),
        category: (data.category as AlphaFeedbackCategory) ?? 'bug',
        screenContext: String(data.screenContext ?? 'world'),
        message: String(data.message ?? ''),
        deviceInfo: String(data.deviceInfo ?? ''),
        status: 'open',
        createdAtMs,
      });
    });

    items.sort((a, b) => b.createdAtMs - a.createdAtMs);
    return items.slice(0, 20);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'alphaFeedback');
  }
}

export async function deleteMyAlphaFeedback(reportId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;

  const path = `alphaFeedback/${reportId}`;
  try {
    await deleteDoc(doc(db, 'alphaFeedback', reportId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function listAllAlphaFeedbackForGm(): Promise<AlphaFeedbackItem[]> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    return [];
  }

  try {
    const snap = await getDocs(collection(db, 'alphaFeedback'));
    const items: AlphaFeedbackItem[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const ts = data.createdAt as Timestamp | undefined;
      const createdAtMs =
        ts && typeof ts.toMillis === 'function' ? ts.toMillis() : Date.now();
      items.push({
        id: docSnap.id,
        ownerUid: String(data.ownerUid ?? ''),
        username: String(data.username ?? ''),
        tamerName: String(data.tamerName ?? ''),
        category: (data.category as AlphaFeedbackCategory) ?? 'bug',
        screenContext: String(data.screenContext ?? 'world'),
        message: String(data.message ?? ''),
        deviceInfo: String(data.deviceInfo ?? ''),
        status: 'open',
        createdAtMs,
      });
    });

    items.sort((a, b) => b.createdAtMs - a.createdAtMs);
    return items.slice(0, 50);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'alphaFeedback');
  }
}
