import type { EquipId } from './exercises';

export interface Equipment { id: EquipId | string; name: string; icon: string; text: string[]; tip?: string }

export const EQUIPMENT: Equipment[] = [
  { id: 'barbell', name: 'Barbell', icon: '🏋️', text: [
    'A long metal bar. You put weight plates on each end.',
    'A normal gym barbell weighs 20 kg (women\'s bar: 15 kg).',
    'Used for big lifts: squat, bench press, deadlift.'], tip: 'Count the bar in your weight. 20 kg bar + two 20 kg plates = 60 kg.' },
  { id: 'ez-bar', name: 'EZ Bar', icon: '〰️', text: [
    'A short bar with bends in it.',
    'The bends are easier on your wrists.',
    'Good for curls and skull crushers. Often 7–10 kg.'] },
  { id: 'trap-bar', name: 'Trap Bar (Hex Bar)', icon: '⬡', text: [
    'A six-sided bar. You stand inside it.',
    'Handles are at your sides, so it is easy on your back.',
    'Great for deadlifts and carries.'] },
  { id: 'plates', name: 'Weight Plates', icon: '⚫', text: [
    'Round weights with a hole in the middle.',
    'Common sizes: 1.25, 2.5, 5, 10, 15, 20, 25 kg.',
    'Always use clips so plates do not slide off.'] },
  { id: 'dumbbell', name: 'Dumbbell', icon: '🔩', text: [
    'A short bar with weight on both ends. One for each hand.',
    'Lets each arm work on its own.',
    'In this app, log the weight of ONE dumbbell.'] },
  { id: 'kettlebell', name: 'Kettlebell', icon: '🔔', text: [
    'A round iron ball with a handle on top.',
    'Great for swings, goblet squats and carries.',
    'Common sizes: 8, 12, 16, 20, 24 kg.'] },
  { id: 'cable', name: 'Cable Machine', icon: '🎛️', text: [
    'A tall frame with a weight stack and a wire (cable).',
    'You can move the pulley high or low.',
    'Clip on a bar, rope or handle. Tension stays the same the whole move.'], tip: 'Pick the weight with the pin in the stack.' },
  { id: 'smith', name: 'Smith Machine', icon: '🧱', text: [
    'A barbell fixed on two rails. It only moves up and down.',
    'Safer to use alone. Turn the bar to hook it.',
    'Good for squats, bench press and lunges.'] },
  { id: 'bench', name: 'Bench', icon: '🛋️', text: [
    'A padded bench to lie or sit on.',
    'Flat bench: for bench press. Incline bench: back is raised.',
    'Decline bench: head is lower than feet.'] },
  { id: 'rack', name: 'Squat Rack / Power Rack', icon: '🏗️', text: [
    'A steel frame that holds the barbell at the right height.',
    'Has safety bars (pins) to catch the bar if you fail.',
    'Use it for squats, bench press and overhead press.'], tip: 'Set the safety bars just below your lowest point.' },
  { id: 'pullup-bar', name: 'Pull-up Bar', icon: '➖', text: [
    'A high bar to hang from.',
    'For pull-ups, chin-ups and hanging leg raises.',
    'Too hard? Use a band or the assisted pull-up machine.'] },
  { id: 'dip-bars', name: 'Dip Bars', icon: '🟰', text: [
    'Two parallel bars at waist height.',
    'For dips (chest and triceps).',
    'Often part of a "power tower" with a pull-up bar.'] },
  { id: 'band', name: 'Resistance Band', icon: '🎗️', text: [
    'A stretchy rubber band. Colors show how strong it is.',
    'Good for warm-ups, travel and help with pull-ups.',
    'Cheap, light and easy to carry.'] },
  { id: 'leg-press', name: 'Leg Press', icon: '🦵', text: [
    'You sit and push a heavy plate away with your feet.',
    'Trains legs without weight on your back.',
    'Do not lock your knees at the top.'] },
  { id: 'machine', name: 'Other Machines', icon: '⚙️', text: [
    'Leg extension, leg curl, chest press, pec deck, shoulder press, row, hack squat, calf raise.',
    'Machines guide the path of the move, so they are easy to learn.',
    'Change the seat so the joint lines up with the machine\'s pivot.'], tip: 'Look for the sticker on the machine. It shows how to use it.' },
  { id: 'ab-wheel', name: 'Ab Wheel', icon: '🛞', text: [
    'A small wheel with handles.',
    'Roll forward and back to train your abs.',
    'Start from your knees.'] },
  { id: 'bodyweight', name: 'Body Weight', icon: '🤸', text: [
    'No tools needed. Your body is the weight.',
    'Push-ups, pull-ups, dips, lunges, sit-ups.',
    'In this app, put 0 kg, or the extra weight you add (vest or belt).'] },
];

export const equipName = (id: string) => EQUIPMENT.find((e) => e.id === id)?.name ?? id;
