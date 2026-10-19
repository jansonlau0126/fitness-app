import { useSyncExternalStore } from 'react';

type Phase = 'idle' | 'run' | 'paused' | 'done';
interface Snap { left: number; total: number; phase: Phase }

let total = 90;
let phase: Phase = 'idle';
let until = 0;
let pausedLeft = 90;
let fired = false;
let audio: AudioContext | null = null;
let snap: Snap = { left: 90, total: 90, phase: 'idle' };
const listeners = new Set<() => void>();
let interval = 0;

function remaining() {
  if (phase === 'run') return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  if (phase === 'paused') return pausedLeft;
  if (phase === 'done') return 0;
  return total;
}

function publish() {
  const next: Snap = { left: remaining(), total, phase };
  if (snap.left === next.left && snap.total === next.total && snap.phase === next.phase) return;
  snap = next;
  listeners.forEach((l) => l());
}

function primeAudio() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!audio) audio = new AC();
    if (audio.state === 'suspended') void audio.resume();
  } catch { /* autoplay policies */ }
}

function cueRest() {
  try { navigator.vibrate?.([28, 40, 48]); } catch { /* no vibration */ }
  try {
    if (!audio) return;
    const ctx = audio;
    const beep = (freq: number, at: number, dur: number, gain: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
      o.start(ctx.currentTime + at);
      o.stop(ctx.currentTime + at + dur);
    };
    beep(698, 0, 0.22, 0.05);
    beep(880, 0.26, 0.28, 0.045);
  } catch { /* ignore */ }
}

function tick() {
  if (phase !== 'run') return;
  if (remaining() <= 0) {
    phase = 'done';
    if (!fired) { fired = true; cueRest(); }
  }
  publish();
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (!interval) interval = window.setInterval(tick, 250);
  return () => {
    listeners.delete(l);
    if (listeners.size === 0 && interval) {
      window.clearInterval(interval);
      interval = 0;
    }
  };
}

function clamp(sec: number) {
  return Math.min(300, Math.max(15, Math.round(sec) || 90));
}

/** Start (or restart) the rest countdown. Call from a tap so audio can unlock. */
export function restStart(sec: number) {
  primeAudio();
  const n = clamp(sec);
  total = n;
  pausedLeft = n;
  until = Date.now() + n * 1000;
  phase = 'run';
  fired = false;
  publish();
}

export function restApplyDefault(sec: number) {
  const n = clamp(sec);
  if (phase === 'run' || phase === 'paused') return;
  total = n;
  pausedLeft = n;
  phase = 'idle';
  fired = false;
  publish();
}

export function restToggle(defaultSec: number) {
  if (phase === 'run') {
    pausedLeft = remaining();
    phase = 'paused';
    publish();
    return;
  }
  if (phase === 'paused') {
    primeAudio();
    until = Date.now() + pausedLeft * 1000;
    phase = 'run';
    fired = false;
    publish();
    return;
  }
  restStart(defaultSec);
}

export function restSkip() {
  phase = 'idle';
  fired = false;
  pausedLeft = total;
  publish();
}

export function useRest() {
  return useSyncExternalStore(subscribe, () => snap);
}
