import { useSyncExternalStore } from 'react';
import { todayKey } from './date';

/**
 * Install prompt memory. Separate from the workout store on purpose:
 * the workout key stays `janson-fit-v1` so existing logs are not dropped.
 */
const INSTALL_KEY = 'gym-everyday-install';
export const INSTALL_HELP_EVENT = 'gym-install-help';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface InstallSnap {
  /** Home-screen / installed window, including iOS `navigator.standalone`. */
  standalone: boolean;
  ios: boolean;
  canPrompt: boolean;
  dismissed: boolean;
  installed: boolean;
  visitDays: number;
}

type Pref = { dismissed?: boolean; installed?: boolean; days?: string[] };

const EMPTY: InstallSnap = {
  standalone: false, ios: false, canPrompt: false, dismissed: false, installed: false, visitDays: 0,
};

let deferred: BeforeInstallPromptEvent | null = null;
let snap: InstallSnap | null = null;
const listeners = new Set<() => void>();

function read(): Pref {
  try {
    const raw = localStorage.getItem(INSTALL_KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as Pref;
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}

function write(p: Pref) {
  try { localStorage.setItem(INSTALL_KEY, JSON.stringify(p)); } catch { /* private mode / quota */ }
}

function isIosDevice(): boolean {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

function isStandaloneMode(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) return true;
  // `window-controls-overlay` is the installed desktop window. Treat it like standalone
  // so the bar does not sit inside an app the user already installed.
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: window-controls-overlay)').matches;
}

function compute(): InstallSnap {
  if (typeof window === 'undefined') return EMPTY;
  const pref = read();
  const days = Array.isArray(pref.days) ? pref.days.filter((d) => typeof d === 'string') : [];
  return {
    standalone: isStandaloneMode(),
    ios: isIosDevice(),
    canPrompt: deferred !== null,
    dismissed: pref.dismissed === true,
    installed: pref.installed === true,
    visitDays: days.length,
  };
}

function invalidate() {
  snap = null;
  listeners.forEach((l) => l());
}

function arm() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    invalidate();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    write({ ...read(), installed: true });
    invalidate();
  });
  for (const q of ['(display-mode: standalone)', '(display-mode: window-controls-overlay)']) {
    try { window.matchMedia(q).addEventListener('change', () => invalidate()); } catch { /* ignore */ }
  }
}

arm();

export function subscribeInstall(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function getInstallSnapshot(): InstallSnap {
  if (!snap) snap = compute();
  return snap;
}

export function useInstallSnapshot(): InstallSnap {
  return useSyncExternalStore(subscribeInstall, getInstallSnapshot, () => EMPTY);
}

/** Remember today. Two different local days counts as a return visit. */
export function noteVisit() {
  if (typeof window === 'undefined') return;
  const pref = read();
  const days = Array.isArray(pref.days) ? pref.days.filter((d) => typeof d === 'string') : [];
  const day = todayKey();
  if (days.includes(day)) return;
  days.push(day);
  write({ ...pref, days: days.slice(-30) });
  invalidate();
}

export function dismissInstall() {
  write({ ...read(), dismissed: true });
  invalidate();
}

export function requestInstallHelp() {
  window.dispatchEvent(new Event(INSTALL_HELP_EVENT));
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const ev = deferred;
  if (!ev) return 'unavailable';
  deferred = null;
  invalidate();
  try {
    await ev.prompt();
    const choice = await ev.userChoice;
    const pref = read();
    if (choice.outcome === 'accepted') write({ ...pref, installed: true });
    else write({ ...pref, dismissed: true });
    invalidate();
    return choice.outcome;
  } catch {
    invalidate();
    return 'unavailable';
  }
}

/** Bar only after a real log, or a second calendar day — and never once installed, dismissed, or standalone. */
export function shouldShowInstallBar(s: InstallSnap, entryCount: number): boolean {
  if (s.standalone || s.installed || s.dismissed) return false;
  if (!s.canPrompt && !s.ios) return false;
  return entryCount > 0 || s.visitDays >= 2;
}
