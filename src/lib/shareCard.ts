import type { Exercise, Muscle } from '../data/exercises';
import { trackingOf } from '../data/exercises';
import { fmt, fmtInt, fmtSec, type DaySummary } from './calc';
import type { Locale } from './store';

export interface ShareLine {
  name: string;
  detail: string;
  pr?: boolean;
}

export interface SharePayload {
  title: string;
  dateLabel: string;
  primary: Muscle[];
  secondary: Muscle[];
  lines: ShareLine[];
  stats: { sets: number; volume: number; exercises: number; totalSec?: number };
  footer: string;
  locale: Locale;
}

/** Draw a dark vertical share card to a PNG blob. */
export async function renderShareCard(p: SharePayload): Promise<Blob> {
  const W = 720, pad = 36;
  const rowH = 52;
  const headerH = 120;
  const bodyH = 280;
  const statsH = 90;
  const listH = Math.max(p.lines.length, 1) * rowH + 40;
  const H = headerH + bodyH + statsH + listH + 100;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // bg
  ctx.fillStyle = '#0f1115';
  ctx.fillRect(0, 0, W, H);
  // accent bar
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#ff8f66'); grad.addColorStop(1, '#ff6b3d');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, 6);

  ctx.fillStyle = '#eef1f6';
  ctx.font = '800 42px system-ui,sans-serif';
  ctx.fillText(p.title, pad, 56);
  ctx.fillStyle = '#9aa3b2';
  ctx.font = '600 24px system-ui,sans-serif';
  ctx.fillText(p.dateLabel, pad, 92);

  // Mini body diagram (simple colored circles legend + silhouette boxes)
  const bodyY = headerH + 10;
  drawMiniBody(ctx, pad + 40, bodyY, p.primary, p.secondary, false);
  drawMiniBody(ctx, W / 2 + 40, bodyY, p.primary, p.secondary, true);
  ctx.fillStyle = '#9aa3b2'; ctx.font = '700 16px system-ui';
  ctx.fillText('Front', pad + 90, bodyY + 250);
  ctx.fillText('Back', W / 2 + 100, bodyY + 250);

  // Stats
  const sy = headerH + bodyH;
  const cards = [
    { l: p.locale === 'zh-TW' ? '動作' : 'Exercises', v: String(p.stats.exercises) },
    { l: p.locale === 'zh-TW' ? '組' : 'Sets', v: String(p.stats.sets) },
    { l: p.locale === 'zh-TW' ? '總量' : 'Volume', v: p.stats.volume >= 10000 ? fmt(p.stats.volume / 1000, 1) + 'k' : fmtInt(p.stats.volume) },
  ];
  cards.forEach((c, i) => {
    const x = pad + i * 220;
    ctx.fillStyle = '#181b22';
    roundRect(ctx, x, sy, 200, 70, 16); ctx.fill();
    ctx.fillStyle = '#eef1f6'; ctx.font = '800 32px system-ui';
    ctx.fillText(c.v, x + 16, sy + 40);
    ctx.fillStyle = '#9aa3b2'; ctx.font = '600 16px system-ui';
    ctx.fillText(c.l, x + 16, sy + 60);
  });

  // Exercise list
  let y = sy + statsH + 10;
  ctx.fillStyle = '#eef1f6'; ctx.font = '800 22px system-ui';
  ctx.fillText(p.locale === 'zh-TW' ? '動作' : 'Exercises', pad, y);
  y += 28;
  for (const line of p.lines) {
    ctx.fillStyle = '#1f232c';
    roundRect(ctx, pad, y, W - pad * 2, rowH - 8, 12); ctx.fill();
    ctx.fillStyle = '#eef1f6'; ctx.font = '700 20px system-ui';
    ctx.fillText(line.name + (line.pr ? ' 🏆' : ''), pad + 14, y + 28);
    ctx.fillStyle = '#ff6b3d'; ctx.font = '700 18px system-ui';
    const tw = ctx.measureText(line.detail).width;
    ctx.fillText(line.detail, W - pad - 14 - tw, y + 28);
    y += rowH;
  }

  ctx.fillStyle = '#667085'; ctx.font = '600 16px system-ui';
  ctx.fillText(p.footer, pad, H - 28);

  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('blob'))), 'image/png'));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawMiniBody(ctx: CanvasRenderingContext2D, x: number, y: number, pri: Muscle[], sec: Muscle[], back: boolean) {
  const ps = new Set(pri), ss = new Set(sec);
  // silhouette
  ctx.fillStyle = '#232833';
  ctx.beginPath(); ctx.ellipse(x + 60, y + 22, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
  roundRect(ctx, x + 30, y + 42, 60, 90, 18); ctx.fill(); // torso
  roundRect(ctx, x + 8, y + 50, 22, 70, 10); ctx.fill(); // L arm
  roundRect(ctx, x + 90, y + 50, 22, 70, 10); ctx.fill(); // R arm
  roundRect(ctx, x + 36, y + 130, 22, 100, 10); ctx.fill(); // L leg
  roundRect(ctx, x + 62, y + 130, 22, 100, 10); ctx.fill(); // R leg

  const paint = (mx: number, my: number, mw: number, mh: number, m: Muscle) => {
    if (ps.has(m)) ctx.fillStyle = '#ff4f24';
    else if (ss.has(m)) ctx.fillStyle = 'rgba(255,176,140,.85)';
    else return;
    roundRect(ctx, mx, my, mw, mh, 8); ctx.fill();
  };
  if (!back) {
    paint(x + 36, y + 48, 48, 36, 'chest');
    paint(x + 48, y + 88, 24, 40, 'abs');
    paint(x + 10, y + 55, 18, 36, 'biceps');
    paint(x + 92, y + 55, 18, 36, 'biceps');
    paint(x + 38, y + 135, 18, 50, 'quads');
    paint(x + 64, y + 135, 18, 50, 'quads');
    paint(x + 38, y + 195, 18, 30, 'calves');
    paint(x + 64, y + 195, 18, 30, 'calves');
    paint(x + 34, y + 44, 16, 20, 'shoulders');
    paint(x + 70, y + 44, 16, 20, 'shoulders');
  } else {
    paint(x + 36, y + 48, 48, 50, 'lats');
    paint(x + 48, y + 100, 24, 30, 'lower-back');
    paint(x + 38, y + 132, 44, 36, 'glutes');
    paint(x + 38, y + 170, 18, 40, 'hamstrings');
    paint(x + 64, y + 170, 18, 40, 'hamstrings');
    paint(x + 10, y + 55, 18, 36, 'triceps');
    paint(x + 92, y + 55, 18, 36, 'triceps');
    paint(x + 42, y + 42, 36, 20, 'traps');
  }
}

export function buildDayShare(
  summary: DaySummary,
  exById: Map<string, Exercise>,
  prIds: Set<string>,
  labels: { title: string; dateLabel: string; footer: string; locale: Locale; nameOf: (ex: Exercise) => string },
): SharePayload {
  return {
    title: labels.title,
    dateLabel: labels.dateLabel,
    primary: [...summary.primary],
    secondary: [...summary.secondary],
    lines: summary.entries.map((en) => {
      const ex = exById.get(en.exId);
      const st = summary.entries && en;
      // recompute lightly
      let detail = '';
      if (ex && trackingOf(ex) === 'duration') {
        const max = Math.max(0, ...en.sets.map((s) => s.sec ?? 0));
        detail = fmtSec(max);
      } else if (ex && (trackingOf(ex) === 'reps' || ex.bw)) {
        const max = Math.max(0, ...en.sets.map((s) => s.r));
        detail = `${max} reps`;
      } else {
        const best = Math.max(0, ...en.sets.map((s) => (s.w && s.r ? s.w * (s.r === 1 ? 1 : 1 + s.r / 30) : 0)));
        detail = `${fmt(best)} kg`;
      }
      void st;
      return { name: ex ? labels.nameOf(ex) : en.exId, detail, pr: prIds.has(en.exId) };
    }),
    stats: { sets: summary.sets, volume: summary.volume, exercises: summary.entries.length, totalSec: summary.totalSec },
    footer: labels.footer,
    locale: labels.locale,
  };
}

export async function shareOrDownload(blob: Blob, filename: string, title: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' });
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text: title });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'shared';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return 'downloaded';
}
