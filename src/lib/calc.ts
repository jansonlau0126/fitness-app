import { EXERCISES, type Exercise, type Muscle, type BodyPart } from '../data/exercises';
import { STANDARDS, type LiftStandard } from '../data/standards';
import type { AppData, LogEntry, SetEntry } from './store';

export const LEVELS = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Elite'] as const;
export const LEVEL_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f97316', '#ef4444'];

/** Epley estimate. 1 rep = the weight itself. */
export function e1rm(w: number, r: number): number {
  if (!w || w <= 0 || !r || r <= 0) return 0;
  if (r === 1) return w;
  return w * (1 + r / 30);
}
export const fmt = (n: number, d = 1) => {
  const f = Math.round(n * 10 ** d) / 10 ** d;
  return f.toLocaleString('en-US', { maximumFractionDigits: d });
};
export const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');

export function allExercises(d: AppData): Exercise[] { return [...EXERCISES, ...d.custom]; }
const cache = new WeakMap<object, Map<string, Exercise>>();
export function exMap(d: AppData): Map<string, Exercise> {
  let m = cache.get(d.custom);
  if (!m) { m = new Map(allExercises(d).map((e) => [e.id, e])); cache.set(d.custom, m); }
  return m;
}

export interface EntryStats { sets: number; reps: number; volume: number; best: number; bestSet: SetEntry | null; maxReps: number }
export function entryStats(en: LogEntry): EntryStats {
  let reps = 0, volume = 0, best = 0, maxReps = 0; let bestSet: SetEntry | null = null;
  for (const s of en.sets) {
    reps += s.r; volume += s.w * s.r;
    const e = e1rm(s.w, s.r);
    if (e > best) { best = e; bestSet = s; }
    if (s.r > maxReps) maxReps = s.r;
  }
  if (!bestSet && en.sets.length) bestSet = en.sets.reduce((a, b) => (b.r > a.r ? b : a));
  return { sets: en.sets.length, reps, volume, best, bestSet, maxReps };
}

/** Key number for an exercise: e1RM (kg) for weighted moves, best reps for body-weight moves. */
export const metricOf = (ex: Exercise | undefined, st: EntryStats) => (ex?.bw ? st.maxReps : st.best);
export const metricUnit = (ex: Exercise | undefined) => (ex?.bw ? 'reps' : 'kg');

export function entriesOn(d: AppData, date: string) { return d.entries.filter((e) => e.date === date).sort((a, b) => a.t - b.t); }

export interface DaySummary { date: string; entries: LogEntry[]; sets: number; reps: number; volume: number; primary: Set<Muscle>; secondary: Set<Muscle>; parts: Set<BodyPart> }
export function daySummary(d: AppData, date: string): DaySummary {
  const m = exMap(d);
  const entries = entriesOn(d, date);
  const primary = new Set<Muscle>(), secondary = new Set<Muscle>(), parts = new Set<BodyPart>();
  let sets = 0, reps = 0, volume = 0;
  for (const en of entries) {
    const st = entryStats(en); sets += st.sets; reps += st.reps; volume += st.volume;
    const ex = m.get(en.exId);
    if (ex && en.sets.length) { ex.primary.forEach((x) => primary.add(x)); ex.secondary.forEach((x) => secondary.add(x)); parts.add(ex.part); }
  }
  primary.forEach((p) => secondary.delete(p));
  return { date, entries, sets, reps, volume, primary, secondary, parts };
}

/** Best metric per exercise for entries with date in [from, to] (inclusive). */
export function bestByExercise(d: AppData, from = '0000-00-00', to = '9999-99-99') {
  const m = exMap(d);
  const out = new Map<string, { value: number; date: string; set: SetEntry | null }>();
  for (const en of d.entries) {
    if (en.date < from || en.date > to) continue;
    const st = entryStats(en); const v = metricOf(m.get(en.exId), st);
    const cur = out.get(en.exId);
    if (v > 0 && (!cur || v > cur.value)) out.set(en.exId, { value: v, date: en.date, set: st.bestSet });
  }
  return out;
}

/** PRs set on a given date (beat all earlier days). */
export function prsOn(d: AppData, date: string) {
  const before = bestByExercise(d, '0000-00-00', prevDay(date));
  const today = bestByExercise(d, date, date);
  const res: { exId: string; value: number; prev: number | null }[] = [];
  today.forEach((v, exId) => { const b = before.get(exId); if (!b || v.value > b.value) res.push({ exId, value: v.value, prev: b ? b.value : null }); });
  return res;
}
function prevDay(date: string) { const [y, mo, da] = date.split('-').map(Number); const t = new Date(y, mo - 1, da - 1); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; }

// ---------- Strength standards ----------
export function thresholds(std: LiftStandard, sex: 'male' | 'female', bw: number): number[] {
  const rows = sex === 'female' ? std.female : std.male;
  if (bw <= rows[0][0]) return rows[0].slice(1);
  const last = rows[rows.length - 1];
  if (bw >= last[0]) return last.slice(1);
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i], b = rows[i + 1];
    if (bw >= a[0] && bw <= b[0]) {
      const t = (bw - a[0]) / (b[0] - a[0]);
      return a.slice(1).map((v, j) => v + (b[j + 1] - v) * t);
    }
  }
  return last.slice(1);
}
export interface LevelInfo { level: number; name: string; next: number | null; nextName: string | null; progress: number; toNext: number; score: number }
/** level -1 = not yet Beginner. score = 0..5 position along the scale for the bar. */
export function levelFor(value: number, th: number[]): LevelInfo {
  let level = -1;
  for (let i = 0; i < th.length; i++) if (value >= th[i]) level = i;
  const lo = level < 0 ? 0 : th[level];
  const hi = level < th.length - 1 ? th[level + 1] : null;
  const progress = hi === null ? 1 : Math.max(0, Math.min(1, (value - lo) / (hi - lo || 1)));
  const score = level < 0 ? progress : level + progress;
  return { level, name: level < 0 ? 'Getting started' : LEVELS[level], next: hi, nextName: hi === null ? null : LEVELS[level + 1], progress, toNext: hi === null ? 0 : Math.max(0, hi - value), score };
}
export function stdFor(ex: Exercise | undefined): LiftStandard | undefined { return ex?.std ? STANDARDS[ex.std] : undefined; }

/** Standards results for all lifts with data that user logged (best up to `to`), plus key lifts. */
export function strengthResults(d: AppData, keys: string[], to = '9999-99-99') {
  const m = exMap(d);
  const bw = d.profile.weightKg;
  const best = bestByExercise(d, '0000-00-00', to);
  const ids = new Set<string>(keys);
  best.forEach((_v, id) => { if (stdFor(m.get(id))) ids.add(id); });
  const out: { ex: Exercise; std: LiftStandard; best: number | null; th: number[] | null; info: LevelInfo | null }[] = [];
  ids.forEach((id) => {
    const ex = m.get(id); const std = stdFor(ex);
    if (!ex || !std) return;
    const b = best.get(id)?.value ?? null;
    const th = bw ? thresholds(std, d.profile.sex, bw) : null;
    out.push({ ex, std, best: b, th, info: th && b !== null ? levelFor(b, th) : null });
  });
  return out;
}
