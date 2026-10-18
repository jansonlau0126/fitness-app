import { normalize, type AppData } from './store';

export const SYNC_API = (import.meta as ImportMeta & { env: Record<string, string> }).env?.VITE_SYNC_API
  || 'https://gym-everyday-api.jansonlau.workers.dev';
export const GOOGLE_CLIENT_ID = (import.meta as ImportMeta & { env: Record<string, string> }).env?.VITE_GOOGLE_CLIENT_ID || '';

const AUTH_KEY = 'gym-everyday-auth';
const SYNC_META_KEY = 'gym-everyday-sync-meta';

export interface AuthUser {
  userId: string;
  email?: string;
  name?: string;
  picture?: string;
  idToken: string;
  expiresAt: number;
}

export interface SyncMeta {
  lastSyncedAt: number | null;
  updatedAt: number | null;
}

export function googleConfigured() {
  return !!GOOGLE_CLIENT_ID;
}

export function loadAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as AuthUser;
    if (!u.idToken || !u.userId) return null;
    if (u.expiresAt && u.expiresAt < Date.now() + 60_000) return null;
    return u;
  } catch { return null; }
}

export function saveAuth(u: AuthUser | null) {
  if (!u) localStorage.removeItem(AUTH_KEY);
  else localStorage.setItem(AUTH_KEY, JSON.stringify(u));
}

export function loadSyncMeta(): SyncMeta {
  try {
    return JSON.parse(localStorage.getItem(SYNC_META_KEY) || '{"lastSyncedAt":null,"updatedAt":null}');
  } catch { return { lastSyncedAt: null, updatedAt: null }; }
}

export function saveSyncMeta(m: SyncMeta) {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(m));
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: Record<string, unknown>) => void;
          prompt: (cb?: (n: { isNotDisplayed?: boolean; isSkippedMoment?: boolean; isDismissedMoment?: boolean }) => void) => void;
          renderButton: (el: HTMLElement, cfg: Record<string, unknown>) => void;
          revoke: (hint: string, done: () => void) => void;
        };
      };
    };
  }
}

let gisPromise: Promise<void> | null = null;
export function loadGis(): Promise<void> {
  if (!GOOGLE_CLIENT_ID) return Promise.reject(new Error('no-client-id'));
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('gis-load-failed'));
    document.head.appendChild(s);
  });
  return gisPromise;
}

export async function signInWithGoogle(): Promise<AuthUser> {
  await loadGis();
  return new Promise((resolve, reject) => {
    window.google!.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (resp: { credential: string }) => {
        try {
          const parts = resp.credential.split('.');
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          const user: AuthUser = {
            userId: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            idToken: resp.credential,
            expiresAt: (payload.exp || 0) * 1000,
          };
          saveAuth(user);
          resolve(user);
        } catch (e) { reject(e); }
      },
      auto_select: false,
      ux_mode: 'popup',
    });
    // Prefer One Tap; if blocked, still resolve via button render elsewhere
    window.google!.accounts.id.prompt((n) => {
      if (n.isNotDisplayed || n.isSkippedMoment || n.isDismissedMoment) {
        // caller should show renderButton fallback
      }
    });
    // Also expose a transient button click path
    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.left = '-9999px';
    document.body.appendChild(host);
    window.google!.accounts.id.renderButton(host, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'signin_with' });
    const btn = host.querySelector('div[role=button]') as HTMLElement | null;
    setTimeout(() => btn?.click(), 50);
    setTimeout(() => { if (host.parentNode) host.remove(); }, 8000);
  });
}

export function signOut() {
  const u = loadAuth();
  saveAuth(null);
  if (u?.email && window.google?.accounts?.id) {
    try { window.google.accounts.id.revoke(u.email, () => {}); } catch { /* ignore */ }
  }
}

export type SyncResult =
  | { ok: true; updatedAt: number; pulled: boolean }
  | { ok: false; error: string };

/** Last-write-wins: if cloud newer → pull; else push local. */
export async function syncNow(local: AppData, localUpdatedAt: number): Promise<{ result: SyncResult; data?: AppData }> {
  const auth = loadAuth();
  if (!auth) return { result: { ok: false, error: 'not-signed-in' } };
  if (!navigator.onLine) return { result: { ok: false, error: 'offline' } };

  const headers = {
    Authorization: `Bearer ${auth.idToken}`,
    'Content-Type': 'application/json',
  };

  const getRes = await fetch(`${SYNC_API}/api/sync`, { headers });
  if (getRes.status === 503) return { result: { ok: false, error: 'need-setup' } };
  if (getRes.status === 401) { saveAuth(null); return { result: { ok: false, error: 'unauthorized' } }; }
  if (!getRes.ok) return { result: { ok: false, error: `get-${getRes.status}` } };
  const remote = await getRes.json() as { data: unknown; updatedAt: number | null };

  if (remote.updatedAt && remote.updatedAt > localUpdatedAt && remote.data) {
    const data = normalize(remote.data);
    saveSyncMeta({ lastSyncedAt: Date.now(), updatedAt: remote.updatedAt });
    return { result: { ok: true, updatedAt: remote.updatedAt, pulled: true }, data };
  }

  const putRes = await fetch(`${SYNC_API}/api/sync`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ data: local, updatedAt: localUpdatedAt }),
  });
  if (putRes.status === 409) {
    const body = await putRes.json() as { data: unknown; updatedAt: number };
    const data = normalize(body.data);
    saveSyncMeta({ lastSyncedAt: Date.now(), updatedAt: body.updatedAt });
    return { result: { ok: true, updatedAt: body.updatedAt, pulled: true }, data };
  }
  if (!putRes.ok) return { result: { ok: false, error: `put-${putRes.status}` } };
  const body = await putRes.json() as { updatedAt: number };
  saveSyncMeta({ lastSyncedAt: Date.now(), updatedAt: body.updatedAt });
  return { result: { ok: true, updatedAt: body.updatedAt, pulled: false } };
}

export async function health(): Promise<{ ok: boolean; googleConfigured: boolean }> {
  try {
    const r = await fetch(`${SYNC_API}/api/health`);
    return await r.json();
  } catch {
    return { ok: false, googleConfigured: false };
  }
}
