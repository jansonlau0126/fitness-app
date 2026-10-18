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
  subtitle?: string;
  primary: Muscle[];
  secondary: Muscle[];
  lines: ShareLine[];
  stats: { sets: number; volume: number; exercises: number; days?: number };
  footer: string;
  locale: Locale;
}

const W = 1080;
const PAD = 56;

/** High-res vertical share card (1080×~1920+). */
export async function renderShareCard(p: SharePayload): Promise<Blob> {
  const rowH = 88;
  const headerH = 200;
  const bodyH = 520;
  const statsH = 160;
  const listH = Math.max(p.lines.length, 1) * rowH + 80;
  const H = Math.max(1920, headerH + bodyH + statsH + listH + 140);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // night sky bg
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1a1030');
  bg.addColorStop(0.25, '#0a0614');
  bg.addColorStop(1, '#05040a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // dawn glow
  const glow = ctx.createRadialGradient(W / 2, 0, 20, W / 2, 80, 520);
  glow.addColorStop(0, 'rgba(255,140,70,0.35)');
  glow.addColorStop(0.5, 'rgba(120,60,200,0.12)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 600);

  // accent bar
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0, '#ffb06a');
  grad.addColorStop(1, '#ff6a2a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 10);

  ctx.fillStyle = '#f3eef8';
  ctx.font = '850 64px system-ui,sans-serif';
  ctx.fillText(p.title, PAD, 90);
  ctx.fillStyle = '#ffb06a';
  ctx.font = '650 28px system-ui,sans-serif';
  ctx.fillText(p.subtitle || 'Gym everyday, gym today.', PAD, 132);
  ctx.fillStyle = '#a89bb8';
  ctx.font = '600 32px system-ui,sans-serif';
  ctx.fillText(p.dateLabel, PAD, 178);

  const bodyY = headerH + 20;
  drawMiniBody(ctx, PAD + 40, bodyY, p.primary, p.secondary, false);
  drawMiniBody(ctx, W / 2 + 40, bodyY, p.primary, p.secondary, true);
  ctx.fillStyle = '#a89bb8';
  ctx.font = '700 26px system-ui';
  ctx.fillText('Front', PAD + 160, bodyY + 460);
  ctx.fillText('Back', W / 2 + 170, bodyY + 460);

  const sy = headerH + bodyH;
  const cards: { l: string; v: string }[] = [
    { l: p.locale === 'zh-TW' ? '動作' : 'Exercises', v: String(p.stats.exercises) },
    { l: p.locale === 'zh-TW' ? '組' : 'Sets', v: String(p.stats.sets) },
    {
      l: p.stats.days != null ? (p.locale === 'zh-TW' ? '天' : 'Days') : (p.locale === 'zh-TW' ? '總量' : 'Volume'),
      v: p.stats.days != null
        ? String(p.stats.days)
        : p.stats.volume >= 10000 ? fmt(p.stats.volume / 1000, 1) + 'k' : fmtInt(p.stats.volume),
    },
  ];
  if (p.stats.days != null) {
    cards[2] = { l: p.locale === 'zh-TW' ? '天' : 'Days', v: String(p.stats.days) };
    cards.push({
      l: p.locale === 'zh-TW' ? '總量' : 'Volume',
      v: p.stats.volume >= 10000 ? fmt(p.stats.volume / 1000, 1) + 'k' : fmtInt(p.stats.volume),
    });
  }
  const cardW = p.stats.days != null ? 220 : 300;
  const gap = 24;
  const totalW = cards.length * cardW + (cards.length - 1) * gap;
  const startX = (W - totalW) / 2;
  cards.forEach((c, i) => {
    const x = startX + i * (cardW + gap);
    ctx.fillStyle = '#14101f';
    roundRect(ctx, x, sy, cardW, 120, 24);
    ctx.fill();
    ctx.strokeStyle = '#2e2640';
    ctx.lineWidth = 2;
    roundRect(ctx, x, sy, cardW, 120, 24);
    ctx.stroke();
    ctx.fillStyle = '#f3eef8';
    ctx.font = '850 48px system-ui';
    ctx.fillText(c.v, x + 24, sy + 62);
    ctx.fillStyle = '#a89bb8';
    ctx.font = '650 24px system-ui';
    ctx.fillText(c.l, x + 24, sy + 96);
  });

  let y = sy + statsH + 20;
  ctx.fillStyle = '#f3eef8';
  ctx.font = '800 36px system-ui';
  ctx.fillText(p.locale === 'zh-TW' ? '動作' : 'Exercises', PAD, y);
  y += 40;
  for (const line of p.lines.slice(0, 12)) {
    ctx.fillStyle = '#1c1629';
    roundRect(ctx, PAD, y, W - PAD * 2, rowH - 12, 18);
    ctx.fill();
    ctx.fillStyle = '#f3eef8';
    ctx.font = '750 32px system-ui';
    const name = line.name + (line.pr ? ' 🏆' : '');
    ctx.fillText(truncate(ctx, name, W - PAD * 2 - 280), PAD + 28, y + 48);
    ctx.fillStyle = '#ff7a3d';
    ctx.font = '750 30px system-ui';
    const tw = ctx.measureText(line.detail).width;
    ctx.fillText(line.detail, W - PAD - 28 - tw, y + 48);
    y += rowH;
  }
  if (p.lines.length > 12) {
    ctx.fillStyle = '#a89bb8';
    ctx.font = '600 26px system-ui';
    ctx.fillText(`+${p.lines.length - 12} more`, PAD, y + 20);
  }

  ctx.fillStyle = '#6b5f7a';
  ctx.font = '600 24px system-ui';
  ctx.fillText(p.footer, PAD, H - 48);

  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('blob'))), 'image/png'));
}

function truncate(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > max) t = t.slice(0, -1);
  return t + '…';
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
  const scale = 1.7;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#1a1428';
  ctx.beginPath(); ctx.ellipse(60, 22, 16, 20, 0, 0, Math.PI * 2); ctx.fill();
  roundRect(ctx, 28, 42, 64, 100, 20); ctx.fill();
  roundRect(ctx, 4, 50, 26, 78, 12); ctx.fill();
  roundRect(ctx, 90, 50, 26, 78, 12); ctx.fill();
  roundRect(ctx, 34, 140, 24, 110, 12); ctx.fill();
  roundRect(ctx, 62, 140, 24, 110, 12); ctx.fill();

  const paint = (mx: number, my: number, mw: number, mh: number, m: Muscle) => {
    if (ps.has(m)) ctx.fillStyle = '#ff6a2a';
    else if (ss.has(m)) ctx.fillStyle = 'rgba(255,196,160,.9)';
    else return;
    roundRect(ctx, mx, my, mw, mh, 10); ctx.fill();
  };
  if (!back) {
    paint(34, 48, 52, 40, 'chest');
    paint(46, 92, 28, 44, 'abs');
    paint(6, 58, 22, 40, 'biceps');
    paint(92, 58, 22, 40, 'biceps');
    paint(36, 148, 20, 56, 'quads');
    paint(64, 148, 20, 56, 'quads');
    paint(36, 214, 20, 34, 'calves');
    paint(64, 214, 20, 34, 'calves');
    paint(32, 44, 18, 22, 'shoulders');
    paint(70, 44, 18, 22, 'shoulders');
  } else {
    paint(34, 48, 52, 56, 'lats');
    paint(46, 108, 28, 34, 'lower-back');
    paint(36, 144, 48, 40, 'glutes');
    paint(36, 186, 20, 44, 'hamstrings');
    paint(64, 186, 20, 44, 'hamstrings');
    paint(6, 58, 22, 40, 'triceps');
    paint(92, 58, 22, 40, 'triceps');
    paint(40, 42, 40, 22, 'traps');
  }
  ctx.restore();
}

export function buildDayShare(
  summary: DaySummary,
  exById: Map<string, Exercise>,
  prIds: Set<string>,
  labels: { title: string; dateLabel: string; footer: string; locale: Locale; nameOf: (ex: Exercise) => string; subtitle?: string },
): SharePayload {
  return {
    title: labels.title,
    dateLabel: labels.dateLabel,
    subtitle: labels.subtitle,
    primary: [...summary.primary],
    secondary: [...summary.secondary],
    lines: summary.entries.map((en) => {
      const ex = exById.get(en.exId);
      let detail = '';
      if (ex && trackingOf(ex) === 'duration') {
        detail = fmtSec(Math.max(0, ...en.sets.map((s) => s.sec ?? 0)));
      } else if (ex && (trackingOf(ex) === 'reps' || ex.bw)) {
        detail = `${Math.max(0, ...en.sets.map((s) => s.r))} reps`;
      } else {
        const best = Math.max(0, ...en.sets.map((s) => (s.w && s.r ? s.w * (s.r === 1 ? 1 : 1 + s.r / 30) : 0)));
        detail = `${fmt(best)} kg`;
      }
      return { name: ex ? labels.nameOf(ex) : en.exId, detail, pr: prIds.has(en.exId) };
    }),
    stats: { sets: summary.sets, volume: summary.volume, exercises: summary.entries.length },
    footer: labels.footer,
    locale: labels.locale,
  };
}

export function buildMonthShare(opts: {
  title: string;
  dateLabel: string;
  subtitle?: string;
  days: number;
  sets: number;
  volume: number;
  lines: ShareLine[];
  primary: Muscle[];
  secondary: Muscle[];
  footer: string;
  locale: Locale;
}): SharePayload {
  return {
    title: opts.title,
    dateLabel: opts.dateLabel,
    subtitle: opts.subtitle,
    primary: opts.primary,
    secondary: opts.secondary,
    lines: opts.lines,
    stats: { sets: opts.sets, volume: opts.volume, exercises: opts.lines.length, days: opts.days },
    footer: opts.footer,
    locale: opts.locale,
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
