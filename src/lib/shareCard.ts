import type { Exercise, Muscle } from '../data/exercises';
import { trackingOf } from '../data/exercises';
import { fmt, fmtInt, fmtSec, type DaySummary } from './calc';
import type { Locale } from './store';
import { buildBodyViewSvg } from '../data/bodyAnatomy';

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

/** iPhone-class portrait — unmistakably large on phone gallery. */
export const SHARE_W = 1242;
export const SHARE_MIN_H = 2688;

/** High-res vertical share card (1242×2688+). */
export async function renderShareCard(p: SharePayload): Promise<Blob> {
  const W = SHARE_W;
  const PAD = 64;
  const rowH = 128;
  const headerH = 280;
  const bodyH = 740;
  const statsH = 200;
  const listTop = 56;
  const listH = Math.max(p.lines.length, 1) * rowH + listTop + 40;
  const H = Math.max(SHARE_MIN_H, headerH + bodyH + statsH + listH + 160);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#241438');
  bg.addColorStop(0.18, '#0c0618');
  bg.addColorStop(1, '#040308');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W / 2, 40, 10, W / 2, 120, 700);
  glow.addColorStop(0, 'rgba(255,150,70,0.45)');
  glow.addColorStop(0.45, 'rgba(140,60,220,0.16)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 780);

  const bar = ctx.createLinearGradient(0, 0, W, 0);
  bar.addColorStop(0, '#ffc080');
  bar.addColorStop(1, '#ff5a20');
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, W, 14);

  ctx.fillStyle = '#f8f2fc';
  ctx.font = '900 92px system-ui,-apple-system,sans-serif';
  ctx.fillText(p.title, PAD, 120);
  ctx.fillStyle = '#ffb06a';
  ctx.font = '700 40px system-ui,sans-serif';
  ctx.fillText(p.subtitle || 'Gym everyday, gym today.', PAD, 180);
  ctx.fillStyle = '#b8a8c8';
  ctx.font = '600 36px system-ui,sans-serif';
  ctx.fillText(p.dateLabel, PAD, 240);

  const bodyY = headerH + 10;
  const bodyDrawH = 640;
  const bodyDrawW = bodyDrawH * (200 / 500);
  const frontImg = await svgToImage(buildBodyViewSvg(p.primary, p.secondary, false, 'share-fr'));
  const backImg = await svgToImage(buildBodyViewSvg(p.primary, p.secondary, true, 'share-bk'));
  ctx.drawImage(frontImg, PAD + 40, bodyY, bodyDrawW, bodyDrawH);
  ctx.drawImage(backImg, W / 2 + 40, bodyY, bodyDrawW, bodyDrawH);
  ctx.fillStyle = '#c8b8d8';
  ctx.font = '800 32px system-ui';
  ctx.fillText('FRONT', PAD + 160, bodyY + bodyDrawH + 48);
  ctx.fillText('BACK', W / 2 + 180, bodyY + bodyDrawH + 48);

  const sy = headerH + bodyH;
  const cards: { l: string; v: string }[] = [
    { l: p.locale === 'zh-TW' ? '動作' : 'Exercises', v: String(p.stats.exercises) },
    { l: p.locale === 'zh-TW' ? '組' : 'Sets', v: String(p.stats.sets) },
  ];
  if (p.stats.days != null) {
    cards.push({ l: p.locale === 'zh-TW' ? '天' : 'Days', v: String(p.stats.days) });
  }
  cards.push({
    l: p.locale === 'zh-TW' ? '總量' : 'Volume',
    v: p.stats.volume >= 10000 ? fmt(p.stats.volume / 1000, 1) + 'k' : fmtInt(p.stats.volume),
  });
  const gap = 20;
  const cardW = Math.floor((W - PAD * 2 - gap * (cards.length - 1)) / cards.length);
  cards.forEach((c, i) => {
    const x = PAD + i * (cardW + gap);
    ctx.fillStyle = '#1a1228';
    roundRect(ctx, x, sy, cardW, 150, 28); ctx.fill();
    ctx.strokeStyle = '#3a2e50';
    ctx.lineWidth = 3;
    roundRect(ctx, x, sy, cardW, 150, 28); ctx.stroke();
    ctx.fillStyle = '#f8f2fc';
    ctx.font = '900 56px system-ui';
    ctx.fillText(c.v, x + 28, sy + 78);
    ctx.fillStyle = '#a898b8';
    ctx.font = '700 28px system-ui';
    ctx.fillText(c.l, x + 28, sy + 120);
  });

  let y = sy + statsH + 8;
  ctx.fillStyle = '#f8f2fc';
  ctx.font = '900 44px system-ui';
  ctx.fillText(p.locale === 'zh-TW' ? '動作' : 'Exercises', PAD, y);
  y += listTop;
  for (const line of p.lines.slice(0, 14)) {
    ctx.fillStyle = '#1c142c';
    roundRect(ctx, PAD, y, W - PAD * 2, rowH - 16, 24); ctx.fill();
    ctx.fillStyle = '#f8f2fc';
    ctx.font = '800 42px system-ui';
    const name = line.name + (line.pr ? ' 🏆' : '');
    ctx.fillText(truncate(ctx, name, W - PAD * 2 - 340), PAD + 36, y + 68);
    ctx.fillStyle = '#ff7a3d';
    ctx.font = '800 40px system-ui';
    const tw = ctx.measureText(line.detail).width;
    ctx.fillText(line.detail, W - PAD - 36 - tw, y + 68);
    y += rowH;
  }
  if (p.lines.length > 14) {
    ctx.fillStyle = '#a898b8';
    ctx.font = '700 32px system-ui';
    ctx.fillText(`+${p.lines.length - 14} more`, PAD, y + 24);
  }

  ctx.fillStyle = '#7a6a8a';
  ctx.font = '600 28px system-ui';
  ctx.fillText(p.footer, PAD, H - 56);

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

async function svgToImage(svg: string): Promise<HTMLImageElement> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to rasterize body SVG'));
    img.src = url;
  });
  URL.revokeObjectURL(url);
  return img;
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
  title: string; dateLabel: string; subtitle?: string; days: number; sets: number; volume: number;
  lines: ShareLine[]; primary: Muscle[]; secondary: Muscle[]; footer: string; locale: Locale;
}): SharePayload {
  return {
    title: opts.title, dateLabel: opts.dateLabel, subtitle: opts.subtitle,
    primary: opts.primary, secondary: opts.secondary, lines: opts.lines,
    stats: { sets: opts.sets, volume: opts.volume, exercises: opts.lines.length, days: opts.days },
    footer: opts.footer, locale: opts.locale,
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

/** Return pixel size of a PNG blob. */
export async function pngSize(blob: Blob): Promise<{ w: number; h: number }> {
  const bmp = await createImageBitmap(blob);
  const out = { w: bmp.width, h: bmp.height };
  bmp.close();
  return out;
}
