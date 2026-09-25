import { STANDARDS } from './standards';

export type Muscle =
  | 'chest' | 'shoulders' | 'rear-delts' | 'biceps' | 'triceps' | 'forearms'
  | 'abs' | 'obliques' | 'traps' | 'lats' | 'upper-back' | 'lower-back'
  | 'glutes' | 'quads' | 'hamstrings' | 'adductors' | 'calves';

export const MUSCLES: { id: Muscle; name: string }[] = [
  { id: 'chest', name: 'Chest' },
  { id: 'shoulders', name: 'Shoulders (front/side)' },
  { id: 'rear-delts', name: 'Rear shoulders' },
  { id: 'biceps', name: 'Biceps' },
  { id: 'triceps', name: 'Triceps' },
  { id: 'forearms', name: 'Forearms' },
  { id: 'abs', name: 'Abs' },
  { id: 'obliques', name: 'Side abs' },
  { id: 'traps', name: 'Traps' },
  { id: 'lats', name: 'Lats' },
  { id: 'upper-back', name: 'Upper back' },
  { id: 'lower-back', name: 'Lower back' },
  { id: 'glutes', name: 'Glutes' },
  { id: 'quads', name: 'Quads' },
  { id: 'hamstrings', name: 'Hamstrings' },
  { id: 'adductors', name: 'Inner thigh' },
  { id: 'calves', name: 'Calves' },
];
export const muscleName = (m: Muscle) => MUSCLES.find((x) => x.id === m)?.name ?? m;

export const BODY_PARTS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Abs',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Traps', 'Lower Back',
] as const;
export type BodyPart = (typeof BODY_PARTS)[number];
export const partLabel = (p: BodyPart) => (p === 'Abs' ? 'Abs / Core' : p);

export const PART_MUSCLE: Record<BodyPart, Muscle> = {
  Chest: 'chest', Back: 'lats', Shoulders: 'shoulders', Biceps: 'biceps', Triceps: 'triceps',
  Forearms: 'forearms', Abs: 'abs', Quads: 'quads', Hamstrings: 'hamstrings', Glutes: 'glutes',
  Calves: 'calves', Traps: 'traps', 'Lower Back': 'lower-back',
};

export type EquipId =
  | 'barbell' | 'ez-bar' | 'trap-bar' | 'dumbbell' | 'kettlebell' | 'cable' | 'smith'
  | 'machine' | 'leg-press' | 'pullup-bar' | 'dip-bars' | 'band' | 'bench' | 'ab-wheel' | 'bodyweight';

export interface Exercise {
  id: string;
  name: string;
  part: BodyPart;
  primary: Muscle[];
  secondary: Muscle[];
  equipment: EquipId;
  how: string[];
  bw?: boolean; // body weight move: weight box = extra weight
  std?: string; // key in STANDARDS
  custom?: boolean;
}

type Opt = { bw?: boolean; std?: string | false };
function ex(id: string, name: string, part: BodyPart, primary: Muscle[], secondary: Muscle[], equipment: EquipId, how: string[], o: Opt = {}): Exercise {
  const std = o.std === false ? undefined : o.std ?? (STANDARDS[id] ? id : undefined);
  return { id, name, part, primary, secondary, equipment, how, bw: o.bw, std };
}

export const EXERCISES: Exercise[] = [
  // CHEST
  ex('bench-press', 'Bench Press', 'Chest', ['chest'], ['shoulders', 'triceps'], 'barbell', [
    'Lie on a flat bench. Hold the bar a bit wider than your shoulders.',
    'Lower the bar slowly to the middle of your chest.',
    'Push it back up until your arms are straight.',
    'Keep your feet flat and your back tight.']),
  ex('incline-bench-press', 'Incline Bench Press', 'Chest', ['chest'], ['shoulders', 'triceps'], 'barbell', [
    'Set the bench at about 30–45 degrees.',
    'Lower the bar to your upper chest.',
    'Push up until your arms are straight.']),
  ex('decline-bench-press', 'Decline Bench Press', 'Chest', ['chest'], ['triceps', 'shoulders'], 'barbell', [
    'Lie on a decline bench with your legs locked in.',
    'Lower the bar to your lower chest.',
    'Push it back up with control.']),
  ex('dumbbell-bench-press', 'Dumbbell Bench Press', 'Chest', ['chest'], ['shoulders', 'triceps'], 'dumbbell', [
    'Lie on a flat bench with a dumbbell in each hand.',
    'Lower them to the sides of your chest.',
    'Press up and bring them close at the top.',
    'Log the weight of ONE dumbbell.']),
  ex('incline-dumbbell-bench-press', 'Incline Dumbbell Press', 'Chest', ['chest'], ['shoulders', 'triceps'], 'dumbbell', [
    'Set the bench at 30–45 degrees.',
    'Lower the dumbbells to your upper chest.',
    'Press up. Log the weight of ONE dumbbell.']),
  ex('dumbbell-fly', 'Dumbbell Fly', 'Chest', ['chest'], ['shoulders'], 'dumbbell', [
    'Lie on a bench, arms up, elbows a little bent.',
    'Open your arms wide like a big hug.',
    'Feel a stretch, then bring them back up.']),
  ex('cable-fly', 'Cable Fly', 'Chest', ['chest'], ['shoulders'], 'cable', [
    'Stand between two cables set high.',
    'Pull the handles down and together in front of you.',
    'Go back slowly. Keep elbows a little bent.']),
  ex('machine-chest-fly', 'Pec Deck (Machine Fly)', 'Chest', ['chest'], ['shoulders'], 'machine', [
    'Sit with your back on the pad.',
    'Bring the arms of the machine together in front.',
    'Open slowly until you feel a stretch.']),
  ex('chest-press', 'Machine Chest Press', 'Chest', ['chest'], ['shoulders', 'triceps'], 'machine', [
    'Sit and hold the handles at chest height.',
    'Push forward until your arms are straight.',
    'Come back slowly.']),
  ex('smith-machine-bench-press', 'Smith Machine Bench Press', 'Chest', ['chest'], ['shoulders', 'triceps'], 'smith', [
    'Lie on a bench under the Smith bar.',
    'Unhook the bar and lower it to your chest.',
    'Push up. The machine keeps the bar on a track.']),
  ex('push-ups', 'Push-up', 'Chest', ['chest'], ['shoulders', 'triceps', 'abs'], 'bodyweight', [
    'Hands on the floor, a bit wider than shoulders.',
    'Keep your body in a straight line.',
    'Lower your chest to the floor, then push up.',
    'Too hard? Put your knees down.'], { bw: true }),
  ex('dips', 'Dips', 'Chest', ['chest', 'triceps'], ['shoulders'], 'dip-bars', [
    'Hold the dip bars with straight arms.',
    'Lean forward a little and bend your elbows.',
    'Go down until upper arms are level, then push up.',
    'Add weight with a belt when it gets easy.'], { bw: true }),

  // BACK
  ex('deadlift', 'Deadlift', 'Back', ['lower-back', 'glutes', 'hamstrings'], ['quads', 'traps', 'forearms', 'lats'], 'barbell', [
    'Stand with the bar over the middle of your feet.',
    'Hold the bar, flat back, chest up.',
    'Push the floor away and stand up tall.',
    'Lower the bar the same way. Keep it close.']),
  ex('pull-ups', 'Pull-up', 'Back', ['lats'], ['biceps', 'upper-back', 'forearms'], 'pullup-bar', [
    'Hang from the bar, palms facing away.',
    'Pull your chest up until your chin is over the bar.',
    'Lower slowly until your arms are straight.'], { bw: true }),
  ex('chin-ups', 'Chin-up', 'Back', ['lats', 'biceps'], ['upper-back', 'forearms'], 'pullup-bar', [
    'Hang from the bar, palms facing you.',
    'Pull up until your chin is over the bar.',
    'Lower slowly.'], { bw: true }),
  ex('lat-pulldown', 'Lat Pulldown', 'Back', ['lats'], ['biceps', 'upper-back'], 'cable', [
    'Sit and hold the wide bar.',
    'Pull the bar down to your upper chest.',
    'Squeeze your back, then let it up slowly.']),
  ex('close-grip-lat-pulldown', 'Close Grip Lat Pulldown', 'Back', ['lats'], ['biceps', 'upper-back'], 'cable', [
    'Use a close grip handle.',
    'Pull it down to your chest, elbows close to body.',
    'Go back up slowly.']),
  ex('bent-over-row', 'Barbell Row', 'Back', ['lats', 'upper-back'], ['biceps', 'rear-delts', 'lower-back'], 'barbell', [
    'Hold the bar and bend forward, flat back.',
    'Pull the bar to your belly.',
    'Lower it with control.']),
  ex('pendlay-row', 'Pendlay Row', 'Back', ['upper-back', 'lats'], ['biceps', 'rear-delts', 'lower-back'], 'barbell', [
    'Bend over until your back is almost flat.',
    'Pull the bar from the floor to your chest fast.',
    'Put it back on the floor each rep.']),
  ex('dumbbell-row', 'Dumbbell Row', 'Back', ['lats', 'upper-back'], ['biceps', 'rear-delts'], 'dumbbell', [
    'Put one knee and hand on a bench.',
    'Pull the dumbbell up to your hip.',
    'Lower it slowly. Do both sides.']),
  ex('seated-cable-row', 'Seated Cable Row', 'Back', ['upper-back', 'lats'], ['biceps', 'rear-delts'], 'cable', [
    'Sit with feet on the plate, knees soft.',
    'Pull the handle to your belly.',
    'Squeeze your shoulder blades, then go back.']),
  ex('t-bar-row', 'T-Bar Row', 'Back', ['upper-back', 'lats'], ['biceps', 'lower-back'], 'barbell', [
    'Stand over the bar, bend forward, flat back.',
    'Pull the handle to your chest.',
    'Lower with control.']),
  ex('machine-row', 'Machine Row', 'Back', ['upper-back', 'lats'], ['biceps', 'rear-delts'], 'machine', [
    'Sit with your chest on the pad.',
    'Pull the handles back.',
    'Squeeze your back, then go back slowly.']),
  ex('dumbbell-pullover', 'Dumbbell Pullover', 'Back', ['lats', 'chest'], ['triceps'], 'dumbbell', [
    'Lie on a bench, hold one dumbbell over your chest.',
    'Lower it back over your head, arms a little bent.',
    'Pull it back over your chest.']),
  ex('inverted-row', 'Inverted Row', 'Back', ['upper-back', 'lats'], ['biceps', 'rear-delts'], 'bodyweight', [
    'Lie under a low bar and hold it.',
    'Keep your body straight like a plank.',
    'Pull your chest to the bar, then lower.'], { bw: true }),

  // SHOULDERS
  ex('shoulder-press', 'Overhead Press', 'Shoulders', ['shoulders'], ['triceps', 'traps', 'chest'], 'barbell', [
    'Stand tall, bar at the top of your chest.',
    'Press the bar straight over your head.',
    'Lower it back to your chest.',
    'Squeeze your glutes. Do not lean back.']),
  ex('dumbbell-shoulder-press', 'Dumbbell Shoulder Press', 'Shoulders', ['shoulders'], ['triceps', 'traps'], 'dumbbell', [
    'Sit or stand, dumbbells at shoulder height.',
    'Press them up over your head.',
    'Lower slowly. Log the weight of ONE dumbbell.']),
  ex('arnold-press', 'Arnold Press', 'Shoulders', ['shoulders'], ['triceps'], 'dumbbell', [
    'Start with dumbbells in front, palms facing you.',
    'Turn your palms out as you press up.',
    'Turn back as you lower.']),
  ex('machine-shoulder-press', 'Machine Shoulder Press', 'Shoulders', ['shoulders'], ['triceps'], 'machine', [
    'Sit with handles at shoulder height.',
    'Press up until arms are straight.',
    'Lower slowly.']),
  ex('dumbbell-lateral-raise', 'Lateral Raise', 'Shoulders', ['shoulders'], ['traps'], 'dumbbell', [
    'Stand with a dumbbell in each hand at your sides.',
    'Lift your arms out to the side to shoulder height.',
    'Lower slowly. Use a light weight.']),
  ex('cable-lateral-raise', 'Cable Lateral Raise', 'Shoulders', ['shoulders'], ['traps'], 'cable', [
    'Stand side-on to a low cable.',
    'Lift the handle out to the side to shoulder height.',
    'Lower slowly. Do both sides.']),
  ex('dumbbell-front-raise', 'Front Raise', 'Shoulders', ['shoulders'], ['chest'], 'dumbbell', [
    'Hold dumbbells in front of your legs.',
    'Lift them to shoulder height in front of you.',
    'Lower slowly.']),
  ex('dumbbell-reverse-fly', 'Rear Delt Fly', 'Shoulders', ['rear-delts'], ['upper-back', 'traps'], 'dumbbell', [
    'Bend forward with a flat back.',
    'Lift the dumbbells out to the sides.',
    'Squeeze, then lower slowly.']),
  ex('face-pull', 'Face Pull', 'Shoulders', ['rear-delts'], ['upper-back', 'traps'], 'cable', [
    'Set a rope on a high cable.',
    'Pull the rope to your face, hands apart.',
    'Elbows high. Go back slowly.']),
  ex('upright-row', 'Upright Row', 'Shoulders', ['shoulders', 'traps'], ['biceps'], 'barbell', [
    'Hold the bar in front of your legs.',
    'Pull it up to your chest, elbows high.',
    'Lower slowly.']),
  ex('landmine-press', 'Landmine Press', 'Shoulders', ['shoulders', 'chest'], ['triceps'], 'barbell', [
    'Put one end of the bar in a corner or holder.',
    'Hold the other end at your shoulder.',
    'Press it up and forward, then lower.']),
  ex('pike-push-up', 'Pike Push-up', 'Shoulders', ['shoulders'], ['triceps'], 'bodyweight', [
    'Hands and feet on the floor, hips high.',
    'Bend your arms and lower your head to the floor.',
    'Push back up.'], { bw: true }),

  // BICEPS
  ex('barbell-curl', 'Barbell Curl', 'Biceps', ['biceps'], ['forearms'], 'barbell', [
    'Stand, hold the bar with palms up.',
    'Curl the bar up to your chest.',
    'Keep your elbows still. Lower slowly.']),
  ex('ez-bar-curl', 'EZ Bar Curl', 'Biceps', ['biceps'], ['forearms'], 'ez-bar', [
    'Hold the EZ bar on the angled parts.',
    'Curl it up, elbows at your sides.',
    'Lower slowly.']),
  ex('dumbbell-curl', 'Dumbbell Curl', 'Biceps', ['biceps'], ['forearms'], 'dumbbell', [
    'Hold dumbbells at your sides, palms forward.',
    'Curl them up to your shoulders.',
    'Lower slowly. Log ONE dumbbell.']),
  ex('hammer-curl', 'Hammer Curl', 'Biceps', ['biceps', 'forearms'], [], 'dumbbell', [
    'Hold dumbbells with palms facing in.',
    'Curl up like holding a hammer.',
    'Lower slowly.']),
  ex('preacher-curl', 'Preacher Curl', 'Biceps', ['biceps'], ['forearms'], 'ez-bar', [
    'Sit with your arms on the preacher pad.',
    'Curl the bar up.',
    'Lower until arms are almost straight.']),
  ex('incline-dumbbell-curl', 'Incline Dumbbell Curl', 'Biceps', ['biceps'], ['forearms'], 'dumbbell', [
    'Sit back on an incline bench, arms hanging.',
    'Curl the dumbbells up.',
    'Lower slowly for a big stretch.']),
  ex('concentration-curl', 'Concentration Curl', 'Biceps', ['biceps'], [], 'dumbbell', [
    'Sit, elbow on the inside of your thigh.',
    'Curl the dumbbell up.',
    'Lower slowly. Do both arms.']),
  ex('cable-bicep-curl', 'Cable Curl', 'Biceps', ['biceps'], ['forearms'], 'cable', [
    'Stand facing a low cable with a bar.',
    'Curl the bar up to your chest.',
    'Lower slowly.']),
  ex('machine-bicep-curl', 'Machine Curl', 'Biceps', ['biceps'], [], 'machine', [
    'Sit with your arms on the pad.',
    'Curl the handles up.',
    'Lower slowly.']),

  // TRICEPS
  ex('close-grip-bench-press', 'Close Grip Bench Press', 'Triceps', ['triceps'], ['chest', 'shoulders'], 'barbell', [
    'Lie on a bench, hands shoulder-width apart.',
    'Lower the bar to your lower chest, elbows in.',
    'Push up.']),
  ex('skull-crusher', 'Skull Crusher', 'Triceps', ['triceps'], [], 'ez-bar', [
    'Lie on a bench, bar over your chest.',
    'Bend only your elbows to lower the bar to your forehead.',
    'Straighten your arms again.']),
  ex('tricep-pushdown', 'Tricep Pushdown', 'Triceps', ['triceps'], [], 'cable', [
    'Stand at a high cable with a bar.',
    'Keep elbows at your sides.',
    'Push the bar down until arms are straight.']),
  ex('tricep-rope-pushdown', 'Rope Pushdown', 'Triceps', ['triceps'], [], 'cable', [
    'Use a rope on a high cable.',
    'Push down and pull the rope ends apart.',
    'Go back up slowly.']),
  ex('cable-overhead-tricep-extension', 'Cable Overhead Extension', 'Triceps', ['triceps'], [], 'cable', [
    'Face away from the cable, rope behind your head.',
    'Straighten your arms up and forward.',
    'Bend back slowly.']),
  ex('dumbbell-tricep-extension', 'Overhead Dumbbell Extension', 'Triceps', ['triceps'], [], 'dumbbell', [
    'Hold one dumbbell with both hands over your head.',
    'Lower it behind your head.',
    'Straighten your arms.']),
  ex('dumbbell-tricep-kickback', 'Tricep Kickback', 'Triceps', ['triceps'], [], 'dumbbell', [
    'Bend forward, upper arm by your side.',
    'Straighten your arm back.',
    'Bend back slowly.']),
  ex('bench-dips', 'Bench Dips', 'Triceps', ['triceps'], ['chest', 'shoulders'], 'bench', [
    'Hands on a bench behind you, legs out.',
    'Bend your elbows to lower your body.',
    'Push back up.'], { bw: true }),

  // FOREARMS
  ex('wrist-curl', 'Wrist Curl', 'Forearms', ['forearms'], [], 'barbell', [
    'Sit, forearms on your legs, palms up.',
    'Curl the bar up using only your wrists.',
    'Lower slowly.']),
  ex('reverse-wrist-curl', 'Reverse Wrist Curl', 'Forearms', ['forearms'], [], 'barbell', [
    'Sit, forearms on your legs, palms down.',
    'Lift the bar with your wrists.',
    'Lower slowly.']),
  ex('dumbbell-wrist-curl', 'Dumbbell Wrist Curl', 'Forearms', ['forearms'], [], 'dumbbell', [
    'Rest your forearm on a bench, palm up.',
    'Curl the dumbbell up with your wrist.',
    'Lower slowly.']),
  ex('reverse-curl', 'Reverse Curl', 'Forearms', ['forearms'], ['biceps'], 'barbell', [
    'Hold the bar with palms down.',
    'Curl it up, elbows at your sides.',
    'Lower slowly.']),

  // ABS
  ex('crunches', 'Crunch', 'Abs', ['abs'], [], 'bodyweight', [
    'Lie on your back, knees bent.',
    'Lift your shoulders off the floor.',
    'Lower slowly.'], { bw: true }),
  ex('sit-ups', 'Sit-up', 'Abs', ['abs'], ['obliques'], 'bodyweight', [
    'Lie on your back, knees bent, feet down.',
    'Sit all the way up.',
    'Lower slowly.'], { bw: true }),
  ex('hanging-leg-raise', 'Hanging Leg Raise', 'Abs', ['abs'], ['obliques', 'forearms'], 'pullup-bar', [
    'Hang from a bar.',
    'Lift your straight legs up to hip height or higher.',
    'Lower slowly. No swinging.'], { bw: true }),
  ex('hanging-knee-raise', 'Hanging Knee Raise', 'Abs', ['abs'], ['forearms'], 'pullup-bar', [
    'Hang from a bar.',
    'Pull your knees up to your chest.',
    'Lower slowly.'], { bw: true }),
  ex('leg-raise', 'Lying Leg Raise', 'Abs', ['abs'], [], 'bodyweight', [
    'Lie on your back, legs straight.',
    'Lift your legs up to point at the ceiling.',
    'Lower slowly. Keep your lower back down.'], { bw: true }),
  ex('cable-crunch', 'Cable Crunch', 'Abs', ['abs'], ['obliques'], 'cable', [
    'Kneel at a high cable, rope by your head.',
    'Crunch down, bringing elbows to knees.',
    'Go back up slowly.']),
  ex('ab-wheel-rollout', 'Ab Wheel Rollout', 'Abs', ['abs'], ['lats', 'shoulders'], 'ab-wheel', [
    'Kneel and hold the ab wheel.',
    'Roll forward slowly, keep your back flat.',
    'Pull back with your abs.'], { bw: true }),
  ex('russian-twist', 'Russian Twist', 'Abs', ['obliques'], ['abs'], 'bodyweight', [
    'Sit, lean back a little, feet up or down.',
    'Turn your body left and right.',
    'Each side counts as one rep.'], { bw: true }),
  ex('bicycle-crunch', 'Bicycle Crunch', 'Abs', ['obliques', 'abs'], [], 'bodyweight', [
    'Lie on your back, hands by your head.',
    'Bring one elbow to the other knee.',
    'Switch sides like riding a bike.'], { bw: true }),

  // QUADS
  ex('squat', 'Squat', 'Quads', ['quads', 'glutes'], ['hamstrings', 'lower-back', 'adductors'], 'barbell', [
    'Bar on your upper back, feet shoulder-width.',
    'Sit down and back until thighs are level.',
    'Stand up. Keep your chest up and knees out.']),
  ex('front-squat', 'Front Squat', 'Quads', ['quads'], ['glutes', 'abs', 'upper-back'], 'barbell', [
    'Rest the bar on the front of your shoulders.',
    'Squat down with your chest up.',
    'Stand back up.']),
  ex('goblet-squat', 'Goblet Squat', 'Quads', ['quads', 'glutes'], ['abs'], 'kettlebell', [
    'Hold a kettlebell or dumbbell at your chest.',
    'Squat down between your knees.',
    'Stand up tall.']),
  ex('dumbbell-squat', 'Dumbbell Squat', 'Quads', ['quads', 'glutes'], ['hamstrings'], 'dumbbell', [
    'Hold dumbbells at your sides.',
    'Squat down until thighs are level.',
    'Stand up. Log ONE dumbbell.']),
  ex('leg-press', 'Leg Press', 'Quads', ['quads', 'glutes'], ['hamstrings', 'adductors'], 'leg-press', [
    'Sit in the machine, feet on the plate.',
    'Lower the plate until knees are near your chest.',
    'Push back up. Do not lock your knees hard.']),
  ex('hack-squat', 'Hack Squat', 'Quads', ['quads'], ['glutes'], 'machine', [
    'Stand in the machine, back on the pad.',
    'Squat down slowly.',
    'Push back up.']),
  ex('smith-machine-squat', 'Smith Machine Squat', 'Quads', ['quads', 'glutes'], ['hamstrings'], 'smith', [
    'Stand under the Smith bar, bar on your back.',
    'Squat down until thighs are level.',
    'Stand up.']),
  ex('leg-extension', 'Leg Extension', 'Quads', ['quads'], [], 'machine', [
    'Sit in the machine, pad on your lower shins.',
    'Straighten your legs.',
    'Lower slowly.']),
  ex('dumbbell-lunge', 'Dumbbell Lunge', 'Quads', ['quads', 'glutes'], ['hamstrings', 'adductors'], 'dumbbell', [
    'Hold dumbbells at your sides.',
    'Step forward and lower your back knee.',
    'Push back up. Switch legs.']),
  ex('lunge', 'Lunge (body weight)', 'Quads', ['quads', 'glutes'], ['hamstrings'], 'bodyweight', [
    'Stand tall.',
    'Step forward and bend both knees.',
    'Push back up. Switch legs.'], { bw: true }),
  ex('bulgarian-split-squat', 'Bulgarian Split Squat', 'Quads', ['quads', 'glutes'], ['hamstrings', 'adductors'], 'dumbbell', [
    'Put your back foot on a bench.',
    'Lower your back knee toward the floor.',
    'Push up with your front leg.']),
  ex('step-up', 'Step-up', 'Quads', ['quads', 'glutes'], ['hamstrings'], 'dumbbell', [
    'Stand in front of a box or bench.',
    'Step up with one foot and stand tall.',
    'Step down. Switch legs.']),

  // HAMSTRINGS
  ex('romanian-deadlift', 'Romanian Deadlift', 'Hamstrings', ['hamstrings', 'glutes'], ['lower-back', 'forearms'], 'barbell', [
    'Hold the bar, knees a little bent.',
    'Push your hips back and lower the bar down your legs.',
    'Feel the stretch, then stand up.']),
  ex('dumbbell-romanian-deadlift', 'Dumbbell Romanian Deadlift', 'Hamstrings', ['hamstrings', 'glutes'], ['lower-back'], 'dumbbell', [
    'Hold dumbbells in front of your legs.',
    'Push hips back, lower the weights.',
    'Stand up by squeezing your glutes.']),
  ex('stiff-leg-deadlift', 'Stiff Leg Deadlift', 'Hamstrings', ['hamstrings'], ['glutes', 'lower-back'], 'barbell', [
    'Stand with legs almost straight.',
    'Bend at the hips and lower the bar.',
    'Stand back up.']),
  ex('lying-leg-curl', 'Lying Leg Curl', 'Hamstrings', ['hamstrings'], ['calves'], 'machine', [
    'Lie face down, pad behind your ankles.',
    'Curl your heels to your glutes.',
    'Lower slowly.']),
  ex('seated-leg-curl', 'Seated Leg Curl', 'Hamstrings', ['hamstrings'], ['calves'], 'machine', [
    'Sit, pad behind your lower legs.',
    'Pull your heels down and under.',
    'Let it back slowly.']),
  ex('good-morning', 'Good Morning', 'Hamstrings', ['hamstrings', 'lower-back'], ['glutes'], 'barbell', [
    'Bar on your upper back, knees soft.',
    'Bend forward at the hips, back flat.',
    'Stand back up.']),
  ex('nordic-curl', 'Nordic Curl', 'Hamstrings', ['hamstrings'], ['glutes'], 'bodyweight', [
    'Kneel, have someone hold your ankles.',
    'Lower your body forward slowly.',
    'Catch with your hands, push back up.'], { bw: true }),

  // GLUTES
  ex('hip-thrust', 'Hip Thrust', 'Glutes', ['glutes'], ['hamstrings', 'quads'], 'barbell', [
    'Upper back on a bench, bar on your hips.',
    'Push your hips up until your body is flat.',
    'Squeeze your glutes, then lower.']),
  ex('glute-bridge', 'Glute Bridge', 'Glutes', ['glutes'], ['hamstrings'], 'bodyweight', [
    'Lie on your back, knees bent.',
    'Lift your hips up.',
    'Squeeze, then lower.'], { bw: true }),
  ex('sumo-deadlift', 'Sumo Deadlift', 'Glutes', ['glutes', 'quads', 'adductors'], ['hamstrings', 'lower-back', 'traps'], 'barbell', [
    'Stand with feet wide, toes out.',
    'Hold the bar inside your legs.',
    'Stand up tall, then lower.']),
  ex('cable-kickback', 'Cable Kickback', 'Glutes', ['glutes'], ['hamstrings'], 'cable', [
    'Put an ankle strap on a low cable.',
    'Kick your leg back.',
    'Go back slowly. Switch legs.']),
  ex('glute-kickback', 'Glute Kickback (floor)', 'Glutes', ['glutes'], ['hamstrings'], 'bodyweight', [
    'Get on hands and knees.',
    'Kick one leg back and up.',
    'Lower. Switch legs.'], { bw: true }),
  ex('hip-abduction', 'Hip Abduction Machine', 'Glutes', ['glutes'], [], 'machine', [
    'Sit, pads on the outside of your knees.',
    'Push your knees out.',
    'Come back slowly.']),
  ex('hip-adduction', 'Hip Adduction Machine', 'Glutes', ['adductors'], [], 'machine', [
    'Sit, pads on the inside of your knees.',
    'Squeeze your knees together.',
    'Open slowly.']),
  ex('kettlebell-swing', 'Kettlebell Swing', 'Glutes', ['glutes', 'hamstrings'], ['lower-back', 'shoulders', 'forearms'], 'kettlebell', [
    'Stand with feet wide, kettlebell in both hands.',
    'Push hips back, then snap them forward.',
    'Let the bell swing to chest height.']),

  // CALVES
  ex('calf-raise', 'Standing Calf Raise (machine)', 'Calves', ['calves'], [], 'machine', [
    'Stand on the step, pads on your shoulders.',
    'Rise up on your toes.',
    'Lower your heels for a stretch.']),
  ex('seated-calf-raise', 'Seated Calf Raise', 'Calves', ['calves'], [], 'machine', [
    'Sit, pad on your knees, balls of feet on the step.',
    'Lift your heels up.',
    'Lower slowly.']),
  ex('dumbbell-calf-raise', 'Dumbbell Calf Raise', 'Calves', ['calves'], [], 'dumbbell', [
    'Hold dumbbells, stand on a step.',
    'Rise up on your toes.',
    'Lower slowly.']),
  ex('standing-calf-raise', 'Calf Raise (body weight)', 'Calves', ['calves'], [], 'bodyweight', [
    'Stand on the edge of a step.',
    'Rise up on your toes.',
    'Lower your heels below the step.'], { bw: true }),
  ex('leg-press-calf-raise', 'Leg Press Calf Raise', 'Calves', ['calves'], [], 'leg-press', [
    'Sit in the leg press, balls of feet on the plate.',
    'Push with your toes.',
    'Let the plate come back slowly.']),

  // TRAPS
  ex('barbell-shrug', 'Barbell Shrug', 'Traps', ['traps'], ['forearms'], 'barbell', [
    'Hold the bar in front of your legs.',
    'Lift your shoulders up to your ears.',
    'Hold, then lower.']),
  ex('dumbbell-shrug', 'Dumbbell Shrug', 'Traps', ['traps'], ['forearms'], 'dumbbell', [
    'Hold dumbbells at your sides.',
    'Shrug your shoulders up.',
    'Lower slowly.']),
  ex('farmers-walk', "Farmer's Walk", 'Traps', ['traps', 'forearms'], ['abs', 'glutes'], 'dumbbell', [
    'Hold heavy dumbbells at your sides.',
    'Walk tall with small steps.',
    'Log steps as reps.']),

  // LOWER BACK
  ex('back-extension', 'Back Extension', 'Lower Back', ['lower-back'], ['glutes', 'hamstrings'], 'bench', [
    'Lock your legs in the back extension bench.',
    'Bend down at the hips.',
    'Lift up until your body is straight.'], { bw: true }),
  ex('rack-pull', 'Rack Pull', 'Lower Back', ['lower-back', 'traps'], ['glutes', 'hamstrings', 'forearms'], 'barbell', [
    'Set the bar in a rack at knee height.',
    'Hold it and stand up tall.',
    'Lower it back to the pins.']),
  ex('trap-bar-deadlift', 'Trap Bar Deadlift', 'Lower Back', ['quads', 'glutes', 'lower-back'], ['hamstrings', 'traps', 'forearms'], 'trap-bar', [
    'Stand inside the trap bar.',
    'Hold the handles, flat back.',
    'Stand up tall, then lower.']),
  ex('superman', 'Superman', 'Lower Back', ['lower-back'], ['glutes'], 'bodyweight', [
    'Lie face down, arms forward.',
    'Lift your arms and legs off the floor.',
    'Hold for a moment, then lower.'], { bw: true }),
];

export const KEY_LIFTS = ['bench-press', 'squat', 'deadlift', 'shoulder-press', 'bent-over-row', 'pull-ups', 'dumbbell-bench-press', 'lat-pulldown'];
