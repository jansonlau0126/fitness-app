import { useSyncExternalStore } from 'react';
import type { Exercise } from '../data/exercises';

export interface SetEntry { w: number; r: number }
export interface LogEntry { id: string; date: string; exId: string; sets: SetEntry[]; t: number }
export interface Profile { name: string; sex: 'male' | 'female'; age: number | null; heightCm: number | null; weightKg: number | null }
export interface WeightLog { date: string; kg: number }
export type Theme = 'auto' | 'dark' | 'light';
export interface AppData {
  app: 'janson-fit';
  version: 1;
  profile: Profile;
  weights: WeightLog[];
  entries: LogEntry[];
  custom: Exercise[];
  settings: { theme: Theme };
}

const KEY = 'janson-fit-v1';
export const emptyData = (): AppData => ({
  app: 'janson-fit', version: 1,
  profile: { name: '', sex: 'male', age: null, heightCm: null, weightKg: null },
  weights: [], entries: [], custom: [], settings: { theme: 'auto' },
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

export function normalize(x: unknown): AppData {
  const e = emptyData();
  if (!x || typeof x !== 'object') throw new Error('Not a valid backup file.');
  const o = x as Partial<AppData>;
  if (!Array.isArray(o.entries)) throw new Error('Not a valid backup file (no workouts found).');
  return {
    ...e,
    profile: { ...e.profile, ...(o.profile ?? {}) },
    weights: Array.isArray(o.weights) ? o.weights.filter((w) => w && typeof w.kg === 'number' && typeof w.date === 'string') : [],
    entries: o.entries
      .filter((en) => en && typeof en.date === 'string' && typeof en.exId === 'string' && Array.isArray(en.sets))
      .map((en) => ({ id: String(en.id ?? uid()), date: en.date, exId: en.exId, t: Number(en.t) || Date.now(),
        sets: en.sets.map((s) => ({ w: Number(s.w) || 0, r: Number(s.r) || 0 })) })),
    custom: Array.isArray(o.custom) ? o.custom.map((c) => ({ ...c, custom: true })) : [],
    settings: { ...e.settings, ...(o.settings ?? {}) },
  };
}

let state: AppData = load();
const listeners = new Set<() => void>();
function emit() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full */ }
  listeners.forEach((l) => l());
}
export function setData(fn: (d: AppData) => AppData) { state = fn(state); emit(); }
export function getData() { return state; }
export function useData(): AppData {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state);
}
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

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
      const latest = weights[weights.length - 1];
      return { ...d, weights, profile: { ...d.profile, weightKg: latest ? latest.kg : d.profile.weightKg } };
    });
  },
  deleteWeight(date: string) { setData((d) => ({ ...d, weights: d.weights.filter((x) => x.date !== date) })); },
  addCustom(ex: Exercise) { setData((d) => ({ ...d, custom: [...d.custom, { ...ex, custom: true }] })); },
  deleteCustom(id: string) { setData((d) => ({ ...d, custom: d.custom.filter((c) => c.id !== id), entries: d.entries.filter((e) => e.exId !== id) })); },
  setTheme(theme: Theme) { setData((d) => ({ ...d, settings: { ...d.settings, theme } })); },
  replaceAll(d: AppData) { setData(() => d); },
  clearAll() { setData((d) => ({ ...emptyData(), settings: d.settings })); },
};
