import type { Muscle } from './exercises';

export type Region = { m: Muscle; d: string; hi?: string };
export type BodyTheme = 'a' | 'c';

/** Anatomical stylised body. Left half only; mirrored. ViewBox 0 0 200 500. */
export const OUTLINE =
  'M100,70 C94,70 88,74 84,82 C82,92 84,102 86,112 C80,120 68,128 54,136 C46,144 42,154 42,166 C40,178 36,190 32,202 C28,214 24,228 22,242 C20,254 22,264 28,268 C34,270 40,262 44,248 C48,258 54,272 56,286 C54,310 52,338 54,360 C56,374 60,386 66,394 C60,406 56,418 62,428 C68,434 78,430 84,420 C88,428 94,432 98,426 C96,410 94,394 90,380 C88,360 86,340 86,320 C88,300 92,288 96,286 C98,278 100,268 100,250 L100,240 Z';

export const FRONT: Region[] = [
  { m: 'traps', d: 'M93,110 C88,118 82,124 74,130 C80,134 88,136 97,134 L97,120 C95,114 94,110 93,110 Z', hi: 'M94,116 C90,122 86,126 80,130' },
  { m: 'shoulders', d: 'M74,130 C58,134 48,144 44,158 C42,172 45,182 52,190 C58,178 64,166 70,156 C76,144 84,134 90,130 C84,128 78,128 74,130 Z', hi: 'M58,150 C54,162 52,174 52,184' },
  { m: 'chest', d: 'M99,150 C90,146 78,148 70,156 C64,166 62,180 62,194 C64,206 72,212 84,210 C93,208 98,200 99,190 C98,174 98,158 99,150 Z', hi: 'M86,160 C78,170 72,184 70,198' },
  { m: 'biceps', d: 'M54,160 C46,168 40,180 34,196 C32,206 36,214 46,214 C52,204 56,190 58,176 C58,168 57,162 54,160 Z', hi: 'M46,174 C40,186 38,198 40,208' },
  { m: 'forearms', d: 'M44,214 C34,226 26,244 22,262 L34,266 C38,250 42,234 50,220 C48,214 46,212 44,214 Z', hi: 'M36,230 C32,244 28,256 26,262' },
  { m: 'abs', d: 'M90,202 L99,202 L99,218 L90,218 C89,212 89,206 90,202 Z', hi: 'M92,206 L97,206' },
  { m: 'abs', d: 'M89,222 L99,222 L99,238 L89,238 C88,232 88,226 89,222 Z', hi: 'M91,226 L97,226' },
  { m: 'abs', d: 'M90,242 L97,242 L97,258 L90,258 C89,252 89,246 90,242 Z', hi: 'M91,246 L96,246' },
  { m: 'abs', d: 'M90,262 L98,262 L98,276 C95,274 91,270 90,266 C89,264 89,262 90,262 Z', hi: 'M92,266 L96,266' },
  { m: 'obliques', d: 'M64,174 C72,176 80,180 88,186 C89,206 89,230 90,254 C90,264 90,272 90,276 C84,272 76,264 70,254 C66,234 64,210 62,190 C62,182 62,176 64,174 Z', hi: 'M72,192 C74,216 76,240 78,258' },
  { m: 'quads', d: 'M58,284 C53,306 52,334 55,360 C58,374 64,384 70,386 C72,362 72,334 70,310 C68,294 64,286 58,284 Z', hi: 'M64,312 C62,338 64,362 68,378' },
  { m: 'quads', d: 'M68,280 C78,288 84,304 86,328 C87,350 84,368 78,382 C74,384 70,384 68,382 C68,358 68,330 66,308 C66,294 66,284 68,280 Z', hi: 'M76,310 C78,336 76,360 74,376' },
  { m: 'quads', d: 'M84,340 C88,350 88,364 84,378 C80,384 74,384 70,382 C76,368 80,354 84,340 Z' },
  { m: 'adductors', d: 'M92,290 C88,282 80,278 72,280 C78,292 82,308 84,322 C88,312 90,300 92,290 Z' },
  { m: 'calves', d: 'M62,390 C56,402 56,414 60,422 C64,418 68,410 68,398 C68,392 66,388 62,390 Z', hi: 'M64,402 C66,410 66,416 64,420' },
  { m: 'calves', d: 'M66,392 C70,402 72,412 70,420 C74,424 78,422 78,416 C78,406 76,398 74,392 C72,388 68,388 66,392 Z', hi: 'M70,404 C72,412 72,416 70,418' },
];

export const BACK: Region[] = [
  { m: 'traps', d: 'M100,106 C94,110 88,116 80,126 C68,138 54,144 46,148 C58,158 72,170 84,186 C92,202 96,216 100,230 Z', hi: 'M88,132 C82,152 86,182 92,212' },
  { m: 'rear-delts', d: 'M70,140 C54,144 46,154 44,168 C42,180 46,190 52,196 C58,184 66,172 74,162 C78,152 80,144 80,140 C76,138 72,138 70,140 Z', hi: 'M58,158 C54,170 52,182 54,190' },
  { m: 'upper-back', d: 'M74,156 C84,162 92,172 96,184 C98,196 98,206 94,214 C84,212 72,206 64,196 C64,180 68,164 74,156 Z', hi: 'M80,174 C84,186 84,200 80,210' },
  { m: 'lats', d: 'M66,196 C80,206 90,214 98,218 C99,236 99,254 96,270 C90,282 80,292 70,296 C66,276 62,254 58,234 C58,216 60,202 66,196 Z', hi: 'M80,224 C84,244 82,262 76,278' },
  { m: 'lower-back', d: 'M98,226 L98,274 C95,274 93,270 92,266 C92,250 94,234 96,226 Z', hi: 'M96,240 L96,266' },
  { m: 'triceps', d: 'M54,172 C46,180 38,194 32,210 C30,220 36,228 46,226 C52,216 56,200 58,184 C58,176 57,172 54,172 Z', hi: 'M46,188 C40,200 36,210 38,218' },
  { m: 'forearms', d: 'M42,224 C32,238 24,254 20,268 L32,272 C36,258 40,242 48,228 C46,224 44,222 42,224 Z', hi: 'M34,240 C30,252 26,262 24,268' },
  { m: 'glutes', d: 'M96,282 C86,276 74,278 64,290 C58,302 58,318 66,328 C76,336 88,334 96,324 Z', hi: 'M80,294 C76,308 78,320 84,326' },
  { m: 'hamstrings', d: 'M66,334 C60,352 60,368 66,384 L76,386 C78,366 78,348 78,334 C74,330 70,330 66,334 Z', hi: 'M70,350 C68,366 70,378 74,384' },
  { m: 'hamstrings', d: 'M78,334 C80,352 82,370 84,386 L88,386 C88,366 88,346 86,332 C84,332 80,332 78,334 Z', hi: 'M82,350 C84,366 84,378 82,384' },
  { m: 'adductors', d: 'M90,328 C88,338 86,350 85,360 C87,350 89,338 90,328 Z' },
  { m: 'calves', d: 'M66,376 C60,388 60,402 66,412 C70,416 74,412 76,404 C78,392 76,382 74,376 C70,372 68,372 66,376 Z', hi: 'M70,390 C72,400 72,408 70,412' },
  { m: 'calves', d: 'M72,376 C70,390 70,404 74,412 C76,416 80,414 82,408 C82,396 80,384 78,376 C76,372 74,372 72,376 Z' },
];

function muscleKind(m: Muscle, primary: Set<Muscle>, secondary: Set<Muscle>, back: boolean): 'pri' | 'sec' | 'base' {
  if (primary.has(m)) return 'pri';
  if (secondary.has(m)) return 'sec';
  if (back && m === 'rear-delts' && (primary.has('shoulders') || secondary.has('shoulders'))) return 'sec';
  return 'base';
}

/** Theme A — semi-realistic 3D mannequin (Summary). Theme C — neon fiber outlines (share). */
export function buildBodyViewSvg(
  primary: Iterable<Muscle>,
  secondary: Iterable<Muscle>,
  back: boolean,
  uid: string,
  theme: BodyTheme = 'a',
): string {
  const pri = primary instanceof Set ? primary : new Set(primary);
  const sec = secondary instanceof Set ? secondary : new Set(secondary);
  const regions = back ? BACK : FRONT;
  const line = back ? 'M100,56 L100,236' : 'M100,78 L100,128';

  if (theme === 'c') return buildThemeC(regions, pri, sec, back, uid, line);
  return buildThemeA(regions, pri, sec, back, uid, line);
}

function buildThemeA(
  regions: Region[],
  pri: Set<Muscle>,
  sec: Set<Muscle>,
  back: boolean,
  uid: string,
  line: string,
): string {
  const pathPair = (r: Region) => {
    const kind = muscleKind(r.m, pri, sec, back);
    let fill: string;
    let stroke: string;
    let sw: string;
    let filt = '';
    let op = '';
    if (kind === 'pri') {
      fill = `url(#priA-${uid})`;
      stroke = '#ffd4a8';
      sw = '1.35';
      filt = ` filter="url(#glowA-${uid})"`;
      op = ' fill-opacity="0.88"';
    } else if (kind === 'sec') {
      fill = `url(#secA-${uid})`;
      stroke = '#ffc8a0';
      sw = '1.15';
      op = ' fill-opacity="0.72"';
    } else {
      fill = `url(#musA-${uid})`;
      stroke = '#1a1424';
      sw = '1.05';
    }
    const hi = r.hi
      ? `<path d="${r.hi}" fill="none" stroke="rgba(255,245,230,.28)" stroke-width="1.5" stroke-linecap="round"/>`
      : '';
    return `<path d="${r.d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"${filt}${op}/>${hi}`;
  };

  const left = regions.map(pathPair).join('');
  const right = regions.map(pathPair).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 500" width="200" height="500">
  <defs>
    <linearGradient id="skinA-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5a5368"/>
      <stop offset="28%" stop-color="#3e384c"/>
      <stop offset="62%" stop-color="#2a2436"/>
      <stop offset="100%" stop-color="#16101f"/>
    </linearGradient>
    <linearGradient id="musA-${uid}" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0%" stop-color="#625a70"/>
      <stop offset="40%" stop-color="#433c52"/>
      <stop offset="100%" stop-color="#2c2638"/>
    </linearGradient>
    <radialGradient id="specA-${uid}" cx="34%" cy="22%" r="58%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="45%" stop-color="#ffd0a0" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="rimA-${uid}" cx="78%" cy="48%" r="70%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.45"/>
    </radialGradient>
    <filter id="softA-${uid}" x="-20%" y="-10%" width="140%" height="120%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="b"/>
      <feOffset dy="6" result="o"/>
      <feFlood flood-color="#000" flood-opacity="0.45"/>
      <feComposite in2="o" operator="in" result="sh"/>
      <feMerge><feMergeNode in="sh"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="glowA-${uid}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3.2" result="b"/>
      <feFlood flood-color="#ff7a30" flood-opacity="0.55" result="c"/>
      <feComposite in="c" in2="b" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <linearGradient id="priA-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffd4a0"/>
      <stop offset="35%" stop-color="#ff9a4a"/>
      <stop offset="70%" stop-color="#ff6a28"/>
      <stop offset="100%" stop-color="#e84810"/>
    </linearGradient>
    <linearGradient id="secA-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffe0c0"/>
      <stop offset="100%" stop-color="#ffb888"/>
    </linearGradient>
  </defs>
  <g filter="url(#softA-${uid})">
    <ellipse cx="100" cy="28" rx="18" ry="22" fill="url(#skinA-${uid})"/>
    <path d="${OUTLINE}" fill="url(#skinA-${uid})"/>
    <path d="${OUTLINE}" transform="translate(200,0) scale(-1,1)" fill="url(#skinA-${uid})"/>
  </g>
  <path d="${line}" fill="none" stroke="rgba(255,210,170,.18)" stroke-width="1.1"/>
  <g>${left}</g>
  <g transform="translate(200,0) scale(-1,1)">${right}</g>
  <rect x="0" y="0" width="200" height="500" fill="url(#specA-${uid})" pointer-events="none"/>
  <rect x="0" y="0" width="200" height="500" fill="url(#rimA-${uid})" pointer-events="none"/>
</svg>`;
}

function buildThemeC(
  regions: Region[],
  pri: Set<Muscle>,
  sec: Set<Muscle>,
  back: boolean,
  uid: string,
  line: string,
): string {
  const pathPair = (r: Region) => {
    const kind = muscleKind(r.m, pri, sec, back);
    let fill: string;
    let stroke: string;
    let sw: string;
    let filt = '';
    let hiStroke = 'rgba(180,120,255,.35)';
    let hiW = '1.2';
    if (kind === 'pri') {
      fill = 'rgba(255,90,30,0.12)';
      stroke = '#ff9a40';
      sw = '3.1';
      filt = ` filter="url(#neonO-${uid})"`;
      hiStroke = '#ffe8b0';
      hiW = '2.2';
    } else if (kind === 'sec') {
      fill = 'rgba(255,40,200,0.10)';
      stroke = '#ff3dc8';
      sw = '2.5';
      filt = ` filter="url(#neonM-${uid})"`;
      hiStroke = '#ffc0f0';
      hiW = '1.9';
    } else {
      fill = 'rgba(8,4,18,0.75)';
      stroke = '#6a40c8';
      sw = '1.35';
      filt = ` filter="url(#edgeC-${uid})"`;
    }
    const hi = r.hi
      ? `<path d="${r.hi}" fill="none" stroke="${hiStroke}" stroke-width="${hiW}" stroke-linecap="round"${kind !== 'base' ? filt : ''}/>`
      : '';
    return `<path d="${r.d}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"${filt}/>${hi}`;
  };

  const left = regions.map(pathPair).join('');
  const right = regions.map(pathPair).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 500" width="200" height="500">
  <defs>
    <linearGradient id="midC-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#140a28"/>
      <stop offset="100%" stop-color="#05030c"/>
    </linearGradient>
    <linearGradient id="silC-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1028"/>
      <stop offset="100%" stop-color="#080410"/>
    </linearGradient>
    <filter id="neonO-${uid}" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="5.2" result="b"/>
      <feFlood flood-color="#ff6a20" flood-opacity="0.85" result="c"/>
      <feComposite in="c" in2="b" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="neonM-${uid}" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="4.4" result="b"/>
      <feFlood flood-color="#ff2a9a" flood-opacity="0.8" result="c"/>
      <feComposite in="c" in2="b" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="edgeC-${uid}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="1.6" result="b"/>
      <feFlood flood-color="#7a4cff" flood-opacity="0.55" result="c"/>
      <feComposite in="c" in2="b" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="flareC-${uid}" cx="50%" cy="18%" r="55%">
      <stop offset="0%" stop-color="#ff6a30" stop-opacity="0.22"/>
      <stop offset="50%" stop-color="#a040ff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="200" height="500" fill="url(#midC-${uid})"/>
  <rect width="200" height="500" fill="url(#flareC-${uid})"/>
  <ellipse cx="100" cy="28" rx="18" ry="22" fill="url(#silC-${uid})" stroke="#5a3a8a" stroke-width="1.4" filter="url(#edgeC-${uid})"/>
  <path d="${OUTLINE}" fill="url(#silC-${uid})" stroke="#4a2e78" stroke-width="1.5" filter="url(#edgeC-${uid})"/>
  <path d="${OUTLINE}" transform="translate(200,0) scale(-1,1)" fill="url(#silC-${uid})" stroke="#4a2e78" stroke-width="1.5" filter="url(#edgeC-${uid})"/>
  <path d="${line}" fill="none" stroke="rgba(255,100,200,.35)" stroke-width="1.3" stroke-dasharray="3 4"/>
  <g>${left}</g>
  <g transform="translate(200,0) scale(-1,1)">${right}</g>
</svg>`;
}


/** Transparent glow-only overlay (pri/sec) for compositing on HQ base art. */
export function buildGlowOverlaySvg(
  primary: Iterable<Muscle>,
  secondary: Iterable<Muscle>,
  back: boolean,
  uid: string,
  theme: BodyTheme = 'a',
): string {
  const pri = primary instanceof Set ? primary : new Set(primary);
  const sec = secondary instanceof Set ? secondary : new Set(secondary);
  const regions = back ? BACK : FRONT;

  const pathPair = (r: Region) => {
    const kind = muscleKind(r.m, pri, sec, back);
    if (kind === 'base') {
      // invisible hit target only used in React; for raster glow skip base
      return '';
    }
    if (theme === 'c') {
      if (kind === 'pri') {
        return `<path d="${r.d}" fill="rgba(255,100,40,0.28)" stroke="#ff9a40" stroke-width="2.8" stroke-linejoin="round" filter="url(#gO-${uid})"/>` +
          (r.hi ? `<path d="${r.hi}" fill="none" stroke="#ffe8b0" stroke-width="2" stroke-linecap="round" filter="url(#gO-${uid})"/>` : '');
      }
      return `<path d="${r.d}" fill="rgba(255,40,200,0.18)" stroke="#ff3dc8" stroke-width="2.2" stroke-linejoin="round" filter="url(#gM-${uid})"/>` +
        (r.hi ? `<path d="${r.hi}" fill="none" stroke="#ffc0f0" stroke-width="1.6" stroke-linecap="round" filter="url(#gM-${uid})"/>` : '');
    }
    // theme A — translucent sunrise glow
    if (kind === 'pri') {
      return `<path d="${r.d}" fill="url(#gPri-${uid})" fill-opacity="0.72" stroke="#ffd4a8" stroke-width="1.2" stroke-linejoin="round" filter="url(#gA-${uid})"/>`;
    }
    return `<path d="${r.d}" fill="url(#gSec-${uid})" fill-opacity="0.55" stroke="#ffc8a0" stroke-width="1" stroke-linejoin="round"/>`;
  };

  const left = regions.map(pathPair).join('');
  const right = regions.map(pathPair).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 500" width="200" height="500">
  <defs>
    <linearGradient id="gPri-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffd4a0"/><stop offset="55%" stop-color="#ff6a28"/><stop offset="100%" stop-color="#e84810"/>
    </linearGradient>
    <linearGradient id="gSec-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffe0c0"/><stop offset="100%" stop-color="#ffb888"/>
    </linearGradient>
    <filter id="gA-${uid}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3.5" result="b"/>
      <feFlood flood-color="#ff7a30" flood-opacity="0.55" result="c"/>
      <feComposite in="c" in2="b" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="gO-${uid}" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="4.5" result="b"/>
      <feFlood flood-color="#ff6a20" flood-opacity="0.9" result="c"/>
      <feComposite in="c" in2="b" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="gM-${uid}" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="3.8" result="b"/>
      <feFlood flood-color="#ff2a9a" flood-opacity="0.85" result="c"/>
      <feComposite in="c" in2="b" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g>${left}</g>
  <g transform="translate(200,0) scale(-1,1)">${right}</g>
</svg>`;
}
