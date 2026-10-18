import { useSyncExternalStore } from 'react';
import type { Exercise, Tracking } from '../data/exercises';
import { toast } from '../components/ui';

export interface SetEntry { w: number; r: number; sec?: number }
export interface LogEntry { id: string; date: string; exId: string; sets: SetEntry[]; t: number }
export interface Profile { name: string; sex: 'male' | 'female'; age: number | null; heightCm: number | null; weightKg: number | null }
export interface WeightLog { date: string; kg: number }
export type Theme = 'auto' | 'dark' | 'light';
export type Locale = 'en' | 'zh-TW';
export interface AppData {
  app: 'janson-fit';
  version: 1;
  profile: Profile;
  weights: WeightLog[];
  entries: LogEntry[];
  custom: Exercise[];
  settings: { theme: Theme; locale: Locale };
  updatedAt?: number;
}

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
  settings: { theme: 'auto', locale: detectLocale() },
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
  const settings = { ...e.settings, ...(o.settings ?? {}) };
  if (settings.locale !== 'en' && settings.locale !== 'zh-TW') settings.locale = e.settings.locale;
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
  replaceAll(d: AppData) { setData(() => d); },
  clearAll() { setData((d) => ({ ...emptyData(), settings: d.settings })); },
};
