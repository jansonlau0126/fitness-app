import { useSyncExternalStore } from 'react';
import type { Exercise, Tracking } from '../data/exercises';
import { toast } from '../components/ui';

export interface SetEntry { w: number; r: number; sec?: number }
export interface LogEntry { id: string; date: string; exId: string; sets: SetEntry[]; t: number }
export interface Profile { name: string; sex: 'male' | 'female'; age: number | null; heightCm: number | null; weightKg: number | null }
export interface WeightLog { date: string; kg: number }
export type Theme = 'auto' | 'dark' | 'light';
export type Locale = 'en' | 'zh-TW';
/** Weekly template. Indexed by JS getDay(): 0 Sunday … 6 Saturday. */
export type PlanFocus = 'push' | 'pull' | 'legs' | 'rest';
export type ShareStyle = 'neon' | 'poster' | 'grid';
export const PLAN_CYCLE: PlanFocus[] = ['push', 'pull', 'legs', 'rest'];
/** Sun rest, then Push / Pull / Legs repeating. */
export const DEFAULT_PLAN: PlanFocus[] = ['rest', 'push', 'pull', 'legs', 'push', 'pull', 'legs'];

export interface Settings {
  theme: Theme;
  locale: Locale;
  /** Default rest between sets, in seconds. */
  restSec: number;
  plan: PlanFocus[];
  shareStyle: ShareStyle;
}
export interface AppData {
  app: 'janson-fit';
  version: 1;
  profile: Profile;
  weights: WeightLog[];
  entries: LogEntry[];
  custom: Exercise[];
  settings: Settings;
  updatedAt?: number;
}

export function clampRest(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 90;
  return Math.min(300, Math.max(15, Math.round(v)));
}

function normalizePlan(p: unknown): PlanFocus[] {
  const ok = (x: unknown): x is PlanFocus => x === 'push' || x === 'pull' || x === 'legs' || x === 'rest';
  if (!Array.isArray(p) || p.length !== 7 || !p.every(ok)) return [...DEFAULT_PLAN];
  return [...p];
}

function normalizeStyle(s: unknown): ShareStyle {
  return s === 'poster' || s === 'grid' || s === 'neon' ? s : 'neon';
}

export function focusOn(plan: PlanFocus[] | undefined, dateKey: string): PlanFocus {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dow = new Date(y, (m || 1) - 1, d || 1).getDay();
  const src = plan && plan.length === 7 ? plan : DEFAULT_PLAN;
  return src[dow] ?? 'rest';
}

export function nextFocus(f: PlanFocus): PlanFocus {
  const i = PLAN_CYCLE.indexOf(f);
  return PLAN_CYCLE[(i + 1) % PLAN_CYCLE.length];
}

// Keep this key. Renaming it would drop existing workouts unless we migrate them.
const KEY = 'janson-fit-v1';

function detectLocale(): Locale {
  try {
    const lang = (navigator.language || '').toLowerCase();
    if (lang.startsWith('zh')) return 'zh-TW';
  } catch { /* SSR / tests */ }
  return 'en';
}

export const emptyData = (): AppData => ({
  app: 'janson-fit', version: 1,
  profile: { name: '', sex: 'male', age: null, heightCm: null, weightKg: null },
  weights: [], entries: [], custom: [],
  settings: { theme: 'auto', locale: detectLocale(), restSec: 90, plan: [...DEFAULT_PLAN], shareStyle: 'neon' },
  updatedAt: Date.now(),
});

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData();
    return normalize(JSON.parse(raw));
  } catch {
    return emptyData();
  }
}

function normalizeSet(s: Partial<SetEntry>): SetEntry {
  const sec = s.sec !== undefined && s.sec !== null ? Number(s.sec) : undefined;
  return {
    w: Number(s.w) || 0,
    r: Number(s.r) || 0,
    ...(sec !== undefined && !Number.isNaN(sec) ? { sec } : {}),
  };
}

function normalizeCustom(c: Partial<Exercise> & { id: string; name: string }): Exercise {
  const tracking: Tracking = c.tracking ?? (c.bw ? 'reps' : 'weight_reps');
  return {
    id: c.id,
    name: c.name,
    part: (c.part as Exercise['part']) || 'Chest',
    primary: Array.isArray(c.primary) ? c.primary : [],
    secondary: Array.isArray(c.secondary) ? c.secondary : [],
    equipment: (c.equipment as Exercise['equipment']) || 'dumbbell',
    how: Array.isArray(c.how) ? c.how : [],
    bw: tracking === 'reps',
    tracking,
    custom: true,
    std: c.std,
  };
}

export function normalize(x: unknown): AppData {
  const e = emptyData();
  if (!x || typeof x !== 'object') throw new Error('Not a valid backup file.');
  const o = x as Partial<AppData>;
  if (!Array.isArray(o.entries)) throw new Error('Not a valid backup file (no workouts found).');
  const raw = (o.settings ?? {}) as Partial<Settings>;
  const settings: Settings = {
    ...e.settings,
    ...raw,
    locale: raw.locale === 'en' || raw.locale === 'zh-TW' ? raw.locale : e.settings.locale,
    restSec: clampRest(raw.restSec),
    plan: normalizePlan(raw.plan),
    shareStyle: normalizeStyle(raw.shareStyle),
  };
  if (settings.theme !== 'auto' && settings.theme !== 'dark' && settings.theme !== 'light') settings.theme = e.settings.theme;
  const weights = Array.isArray(o.weights)
    ? o.weights
      .filter((w) => w && typeof w.kg === 'number' && typeof w.date === 'string')
      .sort((a, b) => a.date.localeCompare(b.date))
    : [];
  return {
    ...e,
    profile: { ...e.profile, ...(o.profile ?? {}) },
    weights,
    entries: o.entries
      .filter((en) => en && typeof en.date === 'string' && typeof en.exId === 'string' && Array.isArray(en.sets))
      .map((en) => ({
        id: String(en.id ?? uid()),
        date: en.date,
        exId: en.exId,
        t: Number(en.t) || Date.now(),
        sets: en.sets.map((s) => normalizeSet(s)),
      })),
    custom: Array.isArray(o.custom) ? o.custom.filter((c) => c && c.id && c.name).map((c) => normalizeCustom(c)) : [],
    settings,
    updatedAt: typeof o.updatedAt === 'number' ? o.updatedAt : Date.now(),
  };
}

let state: AppData = load();
const listeners = new Set<() => void>();
function notify() { listeners.forEach((l) => l()); }
function emit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    toast('Could not save — storage full. Export a backup.');
    return false;
  }
  notify();
  return true;
}
export function setData(fn: (d: AppData) => AppData) {
  const prev = state;
  state = { ...fn(state), updatedAt: Date.now() };
  if (!emit()) {
    state = prev;
    notify();
  }
}
export function getData() { return state; }
export function useData(): AppData {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state);
}
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// Keep tabs/webviews in sync when another one writes localStorage.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    try {
      state = e.newValue ? normalize(JSON.parse(e.newValue)) : emptyData();
    } catch {
      return;
    }
    notify();
  });
}

function syncWeightFromHistory(weights: WeightLog[], profile: Profile): Profile {
  const latest = weights[weights.length - 1];
  return { ...profile, weightKg: latest ? latest.kg : null };
}

export const actions = {
  saveEntry(en: LogEntry) {
    setData((d) => {
      const exists = d.entries.some((x) => x.id === en.id);
      return { ...d, entries: exists ? d.entries.map((x) => (x.id === en.id ? en : x)) : [...d.entries, en] };
    });
  },
  deleteEntry(id: string) { setData((d) => ({ ...d, entries: d.entries.filter((x) => x.id !== id) })); },
  setProfile(p: Partial<Profile>) { setData((d) => ({ ...d, profile: { ...d.profile, ...p } })); },
  addWeight(w: WeightLog) {
    setData((d) => {
      const weights = [...d.weights.filter((x) => x.date !== w.date), w].sort((a, b) => a.date.localeCompare(b.date));
      return { ...d, weights, profile: syncWeightFromHistory(weights, d.profile) };
    });
  },
  deleteWeight(date: string) {
    setData((d) => {
      const weights = d.weights.filter((x) => x.date !== date);
      return { ...d, weights, profile: syncWeightFromHistory(weights, d.profile) };
    });
  },
  addCustom(ex: Exercise) { setData((d) => ({ ...d, custom: [...d.custom, { ...ex, custom: true, tracking: ex.tracking ?? 'weight_reps' }] })); },
  deleteCustom(id: string) { setData((d) => ({ ...d, custom: d.custom.filter((c) => c.id !== id), entries: d.entries.filter((e) => e.exId !== id) })); },
  setTheme(theme: Theme) { setData((d) => ({ ...d, settings: { ...d.settings, theme } })); },
  setLocale(locale: Locale) { setData((d) => ({ ...d, settings: { ...d.settings, locale } })); },
  setRestSec(sec: number) { setData((d) => ({ ...d, settings: { ...d.settings, restSec: clampRest(sec) } })); },
  setPlanDay(dow: number, focus: PlanFocus) {
    setData((d) => {
      if (dow < 0 || dow > 6) return d;
      const plan = (d.settings.plan?.length === 7 ? d.settings.plan : DEFAULT_PLAN).slice();
      plan[dow] = focus;
      return { ...d, settings: { ...d.settings, plan } };
    });
  },
  resetPlan() { setData((d) => ({ ...d, settings: { ...d.settings, plan: [...DEFAULT_PLAN] } })); },
  setShareStyle(shareStyle: ShareStyle) { setData((d) => ({ ...d, settings: { ...d.settings, shareStyle } })); },
  replaceAll(d: AppData) { setData(() => d); },
  clearAll() { setData((d) => ({ ...emptyData(), settings: d.settings })); },
};
