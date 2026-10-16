// Age multipliers from strengthlevel.com By Age tables (fetched 16 Oct 2026).
// Shared curve = mean of 11 weighted lifts (bench, squat, deadlift, OHP, row, lat-pulldown,
// DB bench, barbell curl, RDL, hip thrust, leg press). Ages 25–40 = 1.0.
// Special per-lift curves for pull-ups / chin-ups / dips / plank (reps or seconds).
// Apply: thresholds_at_age = bodyweight_thresholds × ageMultiplier(age, liftKey).
export type AgePoint = [number, number]; // [age, multiplier]
export const AGE_SHARED: AgePoint[] = [[15, 0.8519], [20, 0.9749], [25, 1.0], [30, 1.0], [35, 1.0], [40, 1.0], [45, 0.9479], [50, 0.8858], [55, 0.8187], [60, 0.7472], [65, 0.676], [70, 0.6085], [75, 0.5445], [80, 0.4878], [85, 0.4372], [90, 0.3926]];
export const AGE_SPECIAL: Record<string, AgePoint[]> = {
  "pull-ups": [[15, 0.6154], [20, 0.9231], [25, 1.0], [30, 1.0], [35, 1.0], [40, 1.0], [45, 0.8462], [50, 0.6923], [55, 0.4615], [60, 0.2308], [65, 0.3262], [70, 0.181], [75, 0.1333], [80, 0.0], [85, 0.0], [90, 0.0]],
  "chin-ups": [[15, 0.6154], [20, 0.9231], [25, 1.0], [30, 1.0], [35, 1.0], [40, 1.0], [45, 0.8462], [50, 0.6923], [55, 0.5385], [60, 0.3077], [65, 0.3095], [70, 0.1881], [75, 0.1333], [80, 0.0], [85, 0.0], [90, 0.0]],
  "dips": [[15, 0.65], [20, 0.95], [25, 1.0], [30, 1.0], [35, 1.0], [40, 1.0], [45, 0.85], [50, 0.7], [55, 0.55], [60, 0.4], [65, 0.25], [70, 0.1], [75, 0.1969], [80, 0.0975], [85, 0.0698], [90, 0.0]],
  "plank": [[15, 0.8533], [20, 0.9733], [25, 1.0], [30, 1.0], [35, 1.0], [40, 1.0], [45, 1.0], [50, 1.0], [55, 0.92], [60, 0.8533], [65, 0.8], [70, 0.7467], [75, 0.7067], [80, 0.6667], [85, 0.6267], [90, 0.6]],
};
export const AGE_LIFTS_USED = ["barbell-curl", "bench-press", "bent-over-row", "deadlift", "dumbbell-bench-press", "hip-thrust", "lat-pulldown", "leg-press", "romanian-deadlift", "shoulder-press", "squat"];
export const AGE_NOTE = 'Age-adjusted using strengthlevel.com By Age data (25–40 baseline). Weighted lifts share one curve; pull-ups, chin-ups, dips and plank use their own.';
