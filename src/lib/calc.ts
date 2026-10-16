import { EXERCISES, trackingOf, type Exercise, type Muscle, type BodyPart } from '../data/exercises';
import { STANDARDS, type LiftStandard } from '../data/standards';
import { AGE_SHARED, AGE_SPECIAL } from '../data/age';
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
export const fmtSec = (s: number) => {
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60), r = Math.round(s % 60);
  return r ? `${m}m ${r}s` : `${m}m`;
};

export function allExercises(d: AppData): Exercise[] { return [...EXERCISES, ...d.custom]; }
const cache = new WeakMap<object, Map<string, Exercise>>();
export function exMap(d: AppData): Map<string, Exercise> {
  let m = cache.get(d.custom);
  if (!m) { m = new Map(allExercises(d).map((e) => [e.id, e])); cache.set(d.custom, m); }
  return m;
}

export interface EntryStats {
  sets: number; reps: number; volume: number; best: number;
  bestSet: SetEntry | null; maxReps: number; maxSec: number; totalSec: number;
}
/** Stats for one logged exercise. Pass `bw` so “best set” matches the PR metric (max reps). Duration sets use sec. */
export function entryStats(en: LogEntry, bw = false): EntryStats {
  let reps = 0, volume = 0, best = 0, maxReps = 0, maxSec = 0, totalSec = 0;
  let bestSet: SetEntry | null = null;
  for (const s of en.sets) {
    const sec = s.sec ?? 0;
    if (sec > 0) {
      totalSec += sec;
      if (sec > maxSec) { maxSec = sec; bestSet = s; }
      continue;
    }
    reps += s.r; volume += s.w * s.r;
    const e = e1rm(s.w, s.r);
    if (e > best) best = e;
    if (s.r > maxReps) maxReps = s.r;
    if (bw) {
      if (!bestSet || s.r > (bestSet.r ?? 0) || (s.r === bestSet.r && s.w > bestSet.w)) bestSet = s;
    } else if (e > (bestSet && !(bestSet.sec ?? 0) ? e1rm(bestSet.w, bestSet.r) : 0)) {
      bestSet = s;
    }
  }
  if (!bestSet && en.sets.length) bestSet = en.sets[0];
  return { sets: en.sets.length, reps, volume, best, bestSet, maxReps, maxSec, totalSec };
}

/** Key number for an exercise: e1RM / best reps / best seconds. */
export function metricOf(ex: Exercise | undefined, st: EntryStats): number {
  const t = trackingOf(ex);
  if (t === 'duration') return st.maxSec;
  if (t === 'reps') return st.maxReps;
  return st.best;
}
export function metricUnit(ex: Exercise | undefined): 'kg' | 'reps' | 'sec' {
  const t = trackingOf(ex);
  if (t === 'duration') return 'sec';
  if (t === 'reps') return 'reps';
  return 'kg';
}
export function formatMetric(ex: Exercise | undefined, v: number): string {
  const u = metricUnit(ex);
  if (u === 'sec') return fmtSec(v);
  if (u === 'reps') return `${fmt(v, 0)} reps`;
  return `${fmt(v)} kg`;
}
export function formatSet(ex: Exercise | undefined, s: SetEntry): string {
  if (trackingOf(ex) === 'duration' || (s.sec ?? 0) > 0) {
    const base = fmtSec(s.sec ?? 0);
    return s.w > 0 ? `${base} (+${fmt(s.w)} kg)` : base;
  }
  if (trackingOf(ex) === 'reps' || ex?.bw) {
    return s.w > 0 ? `+${fmt(s.w)} kg × ${s.r}` : `BW × ${s.r}`;
  }
  return `${fmt(s.w)} kg × ${s.r}`;
}

export function entriesOn(d: AppData, date: string) {
  return d.entries.filter((e) => e.date === date).sort((a, b) => a.t - b.t);
}

export interface DaySummary {
  date: string; entries: LogEntry[]; sets: number; reps: number; volume: number;
  primary: Set<Muscle>; secondary: Set<Muscle>; parts: Set<BodyPart>; totalSec: number;
}
export function daySummary(d: AppData, date: string): DaySummary {
  const m = exMap(d);
  const entries = entriesOn(d, date);
  const primary = new Set<Muscle>(), secondary = new Set<Muscle>(), parts = new Set<BodyPart>();
  let sets = 0, reps = 0, volume = 0, totalSec = 0;
  for (const en of entries) {
    const st = entryStats(en);
    sets += st.sets; reps += st.reps; volume += st.volume; totalSec += st.totalSec;
    const ex = m.get(en.exId);
    if (ex && en.sets.length) {
      ex.primary.forEach((x) => primary.add(x));
      ex.secondary.forEach((x) => secondary.add(x));
      parts.add(ex.part);
    }
  }
  primary.forEach((p) => secondary.delete(p));
  return { date, entries, sets, reps, volume, primary, secondary, parts, totalSec };
}

export function bestByExercise(d: AppData, from = '0000-00-00', to = '9999-99-99') {
  const m = exMap(d);
  const out = new Map<string, { value: number; date: string; set: SetEntry | null }>();
  for (const en of d.entries) {
    if (en.date < from || en.date > to) continue;
    const ex = m.get(en.exId);
    const st = entryStats(en, !!ex?.bw || trackingOf(ex) === 'reps'); const v = metricOf(ex, st);
    const cur = out.get(en.exId);
    if (v > 0 && (!cur || v > cur.value)) out.set(en.exId, { value: v, date: en.date, set: st.bestSet });
  }
  return out;
}

export function prsOn(d: AppData, date: string) {
  const before = bestByExercise(d, '0000-00-00', prevDay(date));
  const today = bestByExercise(d, date, date);
  const res: { exId: string; value: number; prev: number | null }[] = [];
  today.forEach((v, exId) => {
    const b = before.get(exId);
    if (!b || v.value > b.value) res.push({ exId, value: v.value, prev: b ? b.value : null });
  });
  return res;
}
function prevDay(date: string) {
  const [y, mo, da] = date.split('-').map(Number);
  const t = new Date(y, mo - 1, da - 1);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/** Last logged entry for an exercise before a given date (or any other day if editing). */
export function lastSession(d: AppData, exId: string, beforeDate: string, exceptId?: string): LogEntry | null {
  let best: LogEntry | null = null;
  for (const e of d.entries) {
    if (e.exId !== exId || e.id === exceptId) continue;
    if (e.date > beforeDate) continue;
    if (e.date === beforeDate && exceptId) { /* same day other entry ok if older */ }
    if (!best || e.date > best.date || (e.date === best.date && e.t > best.t)) best = e;
  }
  // Prefer a strictly earlier date when available
  const earlier = d.entries
    .filter((e) => e.exId === exId && e.id !== exceptId && e.date < beforeDate)
    .sort((a, b) => b.date.localeCompare(a.date) || b.t - a.t)[0];
  return earlier ?? (best && best.date < beforeDate ? best : earlier ?? null);
}

// ---------- Strength standards + age ----------
export function ageMultiplier(age: number | null | undefined, liftKey?: string): number {
  if (age === null || age === undefined || Number.isNaN(age)) return 1;
  const a = Math.max(15, Math.min(90, age));
  const curve = (liftKey && AGE_SPECIAL[liftKey]) || AGE_SHARED;
  if (a <= curve[0][0]) return curve[0][1];
  const last = curve[curve.length - 1];
  if (a >= last[0]) return last[1];
  for (let i = 0; i < curve.length - 1; i++) {
    const [a0, m0] = curve[i], [a1, m1] = curve[i + 1];
    if (a >= a0 && a <= a1) {
      const t = (a - a0) / (a1 - a0 || 1);
      return m0 + (m1 - m0) * t;
    }
  }
  return 1;
}

export function thresholds(std: LiftStandard, sex: 'male' | 'female', bw: number, age?: number | null): number[] {
  const rows = sex === 'female' ? std.female : std.male;
  let base: number[];
  if (bw <= rows[0][0]) base = rows[0].slice(1);
  else {
    const last = rows[rows.length - 1];
    if (bw >= last[0]) base = last.slice(1);
    else {
      base = last.slice(1);
      for (let i = 0; i < rows.length - 1; i++) {
        const a = rows[i], b = rows[i + 1];
        if (bw >= a[0] && bw <= b[0]) {
          const t = (bw - a[0]) / (b[0] - a[0]);
          base = a.slice(1).map((v, j) => v + (b[j + 1] - v) * t);
          break;
        }
      }
    }
  }
  const mult = ageMultiplier(age, std.key);
  return base.map((v) => v * mult);
}

export interface LevelInfo {
  level: number; name: string; next: number | null; nextName: string | null;
  progress: number; toNext: number; score: number;
}
export function levelFor(value: number, th: number[]): LevelInfo {
  let level = -1;
  for (let i = 0; i < th.length; i++) if (value >= th[i]) level = i;
  const lo = level < 0 ? 0 : th[level];
  const hi = level < th.length - 1 ? th[level + 1] : null;
  const progress = hi === null ? 1 : Math.max(0, Math.min(1, (value - lo) / (hi - lo || 1)));
  const score = level < 0 ? progress : level + progress;
  return {
    level,
    name: level < 0 ? 'Getting started' : LEVELS[level],
    next: hi,
    nextName: hi === null ? null : LEVELS[level + 1],
    progress,
    toNext: hi === null ? 0 : Math.max(0, hi - value),
    score,
  };
}
export function stdFor(ex: Exercise | undefined): LiftStandard | undefined {
  return ex?.std ? STANDARDS[ex.std] : undefined;
}

export function strengthResults(d: AppData, keys: string[], to = '9999-99-99') {
  const m = exMap(d);
  const bw = d.profile.weightKg;
  const age = d.profile.age;
  const best = bestByExercise(d, '0000-00-00', to);
  const ids = new Set<string>(keys);
  best.forEach((_v, id) => { if (stdFor(m.get(id))) ids.add(id); });
  const out: { ex: Exercise; std: LiftStandard; best: number | null; th: number[] | null; info: LevelInfo | null }[] = [];
  ids.forEach((id) => {
    const ex = m.get(id); const std = stdFor(ex);
    if (!ex || !std) return;
    const b = best.get(id)?.value ?? null;
    const th = bw ? thresholds(std, d.profile.sex, bw, age) : null;
    out.push({ ex, std, best: b, th, info: th && b !== null ? levelFor(b, th) : null });
  });
  return out;
}
