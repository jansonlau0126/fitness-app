import { addDays, parseKey, todayKey } from './date';
import { emptyData, uid, type AppData, type LogEntry } from './store';

// [exercise id, start kg, end kg, reps, sets]  (kg 0 = body weight; then reps grow)
type P = [string, number, number, number, number, number?];
const PLAN: Record<number, P[]> = {
  1: [ // Monday – push
    ['bench-press', 50, 72.5, 5, 4], ['shoulder-press', 32.5, 42.5, 6, 3], ['incline-dumbbell-bench-press', 18, 24, 10, 3],
    ['dumbbell-lateral-raise', 7, 10, 12, 3], ['tricep-pushdown', 25, 32.5, 12, 3]],
  2: [ // Tuesday – pull
    ['deadlift', 80, 112.5, 5, 3], ['pull-ups', 0, 0, 6, 3, 10], ['bent-over-row', 50, 62.5, 8, 3],
    ['face-pull', 15, 22.5, 15, 3], ['barbell-curl', 25, 32.5, 10, 3]],
  4: [ // Thursday – legs
    ['squat', 70, 92.5, 5, 4], ['romanian-deadlift', 70, 85, 8, 3], ['leg-press', 120, 160, 10, 3],
    ['lying-leg-curl', 30, 40, 12, 3], ['calf-raise', 60, 80, 12, 3], ['hanging-leg-raise', 0, 0, 8, 3, 12]],
  6: [ // Saturday – upper
    ['dumbbell-bench-press', 22, 28, 8, 3], ['lat-pulldown', 50, 62.5, 10, 3], ['dips', 0, 0, 8, 3, 12],
    ['seated-cable-row', 50, 60, 10, 3], ['hammer-curl', 12, 16, 10, 3], ['cable-crunch', 30, 40, 12, 3]],
};

const SKIP = new Set([12, 26, 36]);
function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
const round = (x: number, step: number) => Math.round(x / step) * step;

export function makeDemo(): AppData {
  const r = rng(42);
  const today = todayKey();
  const start = addDays(today, -42); // 6 weeks, ending yesterday (today stays empty)
  const entries: LogEntry[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(start, i);
    const dow = parseKey(date).getDay();
    const plan = PLAN[dow];
    if (!plan) continue;
    if (SKIP.has(i)) continue; // a few missed days
    const t = i / 41;
    let n = 0;
    for (const [exId, a, b, reps, sets, repsEnd] of plan) {
      const step = a < 30 ? (a < 15 ? 1 : 2) : 2.5;
      const w = a === 0 ? 0 : round(a + (b - a) * t + (r() - 0.5) * step, step);
      const baseReps = repsEnd ? Math.round(reps + (repsEnd - reps) * t) : reps;
      const s = Array.from({ length: sets }, (_, k) => ({ w, r: Math.max(1, baseReps - (k === sets - 1 && r() < 0.4 ? 1 : 0) - (repsEnd && k > 0 ? k : 0)) }));
      entries.push({ id: uid(), date, exId, sets: s, t: parseKey(date).getTime() + 18 * 3600e3 + n++ * 60e3 });
    }
  }
  const weights = Array.from({ length: 7 }, (_, k) => ({ date: addDays(start, k * 7), kg: Math.round((76.4 - k * 0.25 + (r() - 0.5) * 0.4) * 10) / 10 }));
  const d = emptyData();
  return { ...d, profile: { name: 'Janson', sex: 'male', age: 32, heightCm: 175, weightKg: weights[weights.length - 1].kg }, weights, entries };
}
