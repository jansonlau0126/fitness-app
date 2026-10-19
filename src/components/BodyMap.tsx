import type { Muscle } from '../data/exercises';

type Region = { m: Muscle; d: string; hi?: string };

/**
 * Anatomical stylised body (v2) — unmistakable muscle contours vs flat blocks.
 * Left half only; mirrored in SVG. ViewBox 0 0 200 480.
 */
const OUTLINE =
  'M100,46 C95,46 91,47 89,51 C88,58 86,65 82,70 C74,74 62,76 54,80 C44,85 38,96 37,110 ' +
  'C35,128 34,146 33,162 C32,174 31,184 30,194 C27,214 24,236 23,258 C21,272 19,288 23,300 ' +
  'C25,308 34,308 36,300 C37,286 38,272 40,258 C44,234 48,212 52,190 C54,174 56,160 58,148 ' +
  'C60,136 62,128 64,124 C65,146 67,170 72,194 C73,212 72,228 68,244 C65,260 64,278 64,298 ' +
  'C63,326 64,354 69,376 C68,396 65,416 66,436 C67,452 71,466 74,476 C72,484 68,492 76,496 ' +
  'L95,496 C97,484 95,472 93,462 C93,442 95,418 95,394 C95,376 94,362 95,350 C97,328 100,294 100,264 L100,256 Z';

/** Front — defined pecs, six-pack abs, delts, biceps peak, teardrop quads */
const FRONT: Region[] = [
  // upper traps / neck
  { m: 'traps', d: 'M91,54 C88,62 82,68 70,72 C78,74 88,75 97,74 L97,62 C94,58 92,55 91,54 Z',
    hi: 'M93,58 C90,64 86,68 78,70' },
  // anterior deltoid — rounded cap
  { m: 'shoulders', d: 'M70,74 C58,76 46,86 44,104 C43,118 45,128 49,136 C54,124 58,112 64,102 C70,90 78,80 84,76 C78,74 74,74 70,74 Z',
    hi: 'M62,88 C58,98 56,110 55,120' },
  // pectoralis — fan from sternum
  { m: 'chest', d: 'M99,82 C90,78 78,80 70,86 C60,96 54,110 54,122 C56,132 66,138 78,136 C88,134 95,128 99,120 C96,108 96,94 99,82 Z',
    hi: 'M86,90 C78,96 70,108 68,120' },
  // biceps — peaked oval
  { m: 'biceps', d: 'M54,124 C47,136 44,152 43,170 C44,182 49,188 55,186 C60,174 62,158 62,142 C61,132 58,126 54,124 Z',
    hi: 'M52,140 C50,150 49,162 50,172' },
  // brachialis / forearm flexors
  { m: 'forearms', d: 'M42,190 C35,208 31,228 28,250 L38,254 C42,232 47,212 50,194 C47,188 44,187 42,190 Z',
    hi: 'M40,200 C36,216 33,234 32,248' },
  { m: 'forearms', d: 'M52,186 C53,198 51,212 47,228 C44,240 41,252 38,254 C42,232 47,212 50,194 Z' },
  // rectus abdominis — 4 stacked packs with indent
  { m: 'abs', d: 'M90,138 L99,138 L99,156 L90,156 C89,150 89,144 90,138 Z', hi: 'M92,142 L97,142' },
  { m: 'abs', d: 'M89,160 L99,160 L99,178 L89,178 C88,172 88,166 89,160 Z', hi: 'M91,164 L97,164' },
  { m: 'abs', d: 'M89,182 L99,182 L99,200 L89,200 C88,194 88,188 89,182 Z', hi: 'M91,186 L97,186' },
  { m: 'abs', d: 'M90,204 L99,204 L99,234 C95,232 91,226 90,218 C89,212 89,208 90,204 Z', hi: 'M92,210 L97,210' },
  // external oblique
  { m: 'obliques', d: 'M66,132 C74,134 82,136 88,138 C89,158 89,182 90,206 C90,222 91,234 92,242 C84,236 76,226 72,214 C70,194 68,170 66,152 C65,144 65,136 66,132 Z',
    hi: 'M72,150 C74,170 76,194 78,214' },
  // vastus lateralis
  { m: 'quads', d: 'M68,256 C62,282 61,314 65,344 C67,360 72,372 80,378 C82,354 82,326 80,300 C78,280 74,266 68,256 Z',
    hi: 'M72,280 C70,310 72,340 76,360' },
  // rectus femoris / vastus medialis teardrop
  { m: 'quads', d: 'M74,252 C86,264 94,282 96,308 C97,334 93,358 86,376 C83,378 80,378 78,376 C78,348 78,320 76,296 C75,276 74,262 74,252 Z',
    hi: 'M82,280 C84,310 82,340 80,360' },
  { m: 'quads', d: 'M96,320 C100,334 100,352 95,366 C92,374 86,376 80,374 C88,356 92,338 96,320 Z' },
  // adductors
  { m: 'adductors', d: 'M99,274 C94,262 85,252 76,250 C84,266 90,288 92,310 C95,300 97,288 99,274 Z' },
  // gastrocnemius heads
  { m: 'calves', d: 'M70,388 C64,410 64,434 69,458 C74,446 78,426 79,404 C78,394 74,388 70,388 Z',
    hi: 'M72,410 C74,430 74,446 72,456' },
  { m: 'calves', d: 'M78,392 C83,414 84,438 82,464 C87,474 92,476 95,470 C96,444 97,416 94,392 C90,384 82,384 78,392 Z',
    hi: 'M86,412 C88,436 88,456 86,466' },
  { m: 'calves', d: 'M97,388 C100,412 100,438 96,462 C93,444 92,420 92,398 C93,390 95,388 97,388 Z' },
];

const BACK: Region[] = [
  // traps diamond
  { m: 'traps', d: 'M100,52 C95,54 90,58 84,64 C74,72 60,78 52,82 C66,90 78,100 86,114 C94,132 98,154 100,174 Z',
    hi: 'M90,70 C84,90 88,120 94,150' },
  // rear delt
  { m: 'rear-delts', d: 'M64,78 C50,80 42,92 41,108 C40,122 43,132 48,140 C56,128 64,116 70,106 C74,96 76,86 76,80 C72,78 68,78 64,78 Z',
    hi: 'M58,96 C54,108 52,120 54,130' },
  // rhomboids / upper back
  { m: 'upper-back', d: 'M72,92 C82,98 90,106 94,118 C98,130 98,142 94,150 C84,148 72,142 64,132 C64,118 66,104 72,92 Z',
    hi: 'M80,110 C84,122 84,136 80,146' },
  // latissimus — V wing
  { m: 'lats', d: 'M64,132 C76,142 88,148 96,150 C100,170 102,192 98,212 C92,226 82,238 74,246 C70,224 66,200 62,178 C60,162 60,146 64,132 Z',
    hi: 'M78,160 C82,180 80,204 74,224' },
  // erector spinae
  { m: 'lower-back', d: 'M99,164 L99,238 C94,238 90,232 88,224 C88,200 90,176 94,164 Z',
    hi: 'M96,180 L96,220' },
  // triceps — 3-head silhouette
  { m: 'triceps', d: 'M48,128 C42,142 40,160 42,178 C44,190 50,194 56,190 C60,174 62,156 62,140 C60,132 54,126 48,128 Z',
    hi: 'M50,148 C48,160 48,172 50,182' },
  { m: 'forearms', d: 'M42,190 C35,208 31,228 28,250 L38,254 C42,232 47,212 50,194 C47,188 44,187 42,190 Z' },
  { m: 'forearms', d: 'M52,186 C53,198 51,212 47,228 C44,240 41,252 38,254 C42,232 47,212 50,194 Z' },
  // glute max
  { m: 'glutes', d: 'M99,240 C88,234 74,236 64,248 C56,264 56,284 66,298 C78,308 92,304 99,294 Z',
    hi: 'M82,256 C78,270 80,286 86,294' },
  // hamstrings
  { m: 'hamstrings', d: 'M70,302 C64,328 64,356 70,382 L82,384 C84,356 84,328 84,304 C80,300 74,300 70,302 Z',
    hi: 'M74,320 C72,344 74,368 78,380' },
  { m: 'hamstrings', d: 'M86,304 C88,332 92,360 94,384 L100,384 C102,356 102,324 100,298 C94,300 90,302 86,304 Z',
    hi: 'M92,320 C94,348 94,372 92,380' },
  { m: 'adductors', d: 'M99,296 C98,312 96,328 95,342 C94,328 93,314 92,302 C94,298 97,296 99,296 Z' },
  { m: 'calves', d: 'M72,392 C64,414 64,440 70,462 C76,470 82,462 84,448 C86,426 86,406 82,392 C78,384 74,384 72,392 Z',
    hi: 'M76,414 C78,434 78,450 76,460' },
  { m: 'calves', d: 'M86,392 C84,414 84,438 88,456 C94,468 102,466 104,452 C106,428 104,406 98,392 C94,384 88,384 86,392 Z' },
];

export interface BodyMapProps {
  primary: Set<Muscle>;
  secondary: Set<Muscle>;
  active?: Muscle | null;
  onMuscle?: (m: Muscle, trained: boolean) => void;
  interactive?: boolean;
}

function View({ regions, primary, secondary, back, label, active, onMuscle, interactive }: {
  regions: Region[]; primary: Set<Muscle>; secondary: Set<Muscle>; back?: boolean; label: string;
  active?: Muscle | null; onMuscle?: (m: Muscle, trained: boolean) => void; interactive?: boolean;
}) {
  const uid = back ? 'bk' : 'fr';
  const cls = (m: Muscle) => {
    let c = primary.has(m) ? 'mus pri' : secondary.has(m) ? 'mus sec' : 'mus';
    if (active === m) c += ' focus';
    if (interactive) c += ' tap';
    return c;
  };
  const cls2 = (m: Muscle) => {
    if (back && m === 'rear-delts' && !primary.has(m) && !secondary.has(m)
      && (primary.has('shoulders') || secondary.has('shoulders'))) {
      return cls(m).replace('mus ', 'mus sec ');
    }
    return cls(m);
  };
  const hit = (m: Muscle) => { if (onMuscle) onMuscle(m, primary.has(m) || secondary.has(m)); };

  const paths = regions.map((r, i) => (
    <g key={i}>
      <path className={cls2(r.m)} d={r.d} onClick={() => hit(r.m)}
        role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined}
        onKeyDown={(e) => interactive && (e.key === 'Enter' || e.key === ' ') && hit(r.m)}>
        <title>{r.m}</title>
      </path>
      {r.hi && (
        <path className="mus-hi" d={r.hi} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.4"
          strokeLinecap="round" style={{ pointerEvents: 'none' }} />
      )}
    </g>
  ));

  return (
    <figure className={`body-view anatomical ${interactive ? 'interactive' : ''}`}>
      <svg viewBox="0 0 200 500" role="img" aria-label={`${label} anatomical body`}>
        <defs>
          <linearGradient id={`sil-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a3348" />
            <stop offset="45%" stopColor="#2a2438" />
            <stop offset="100%" stopColor="#1a1428" />
          </linearGradient>
          <radialGradient id={`shine-${uid}`} cx="32%" cy="28%" r="55%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id={`pri-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffb06a" />
            <stop offset="55%" stopColor="#ff6a2a" />
            <stop offset="100%" stopColor="#e84810" />
          </linearGradient>
          <linearGradient id={`sec-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd4b0" />
            <stop offset="100%" stopColor="#ffb080" />
          </linearGradient>
        </defs>
        <g className="sil">
          <ellipse cx="100" cy="28" rx="18" ry="22" fill={`url(#sil-${uid})`} />
          <path d={OUTLINE} fill={`url(#sil-${uid})`} />
          <path d={OUTLINE} transform="translate(200,0) scale(-1,1)" fill={`url(#sil-${uid})`} />
          <rect x="0" y="0" width="200" height="500" fill={`url(#shine-${uid})`} style={{ pointerEvents: 'none' }} />
        </g>
        {back
          ? <path className="line" d="M100,56 L100,236" />
          : <path className="line" d="M100,78 L100,128" />}
        <style>{`
          .body-view.anatomical .mus.pri { fill: url(#pri-${uid}); filter: url(#glow-${uid}); }
          .body-view.anatomical .mus.sec { fill: url(#sec-${uid}); opacity: 0.92; }
        `}</style>
        <g>{paths}</g>
        <g transform="translate(200,0) scale(-1,1)">{paths}</g>
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export default function BodyMap({ primary, secondary, active, onMuscle, interactive }: BodyMapProps) {
  return (
    <div className="body-map anatomical-v2">
      <View regions={FRONT} primary={primary} secondary={secondary} label="Front" active={active} onMuscle={onMuscle} interactive={interactive} />
      <View regions={BACK} primary={primary} secondary={secondary} back label="Back" active={active} onMuscle={onMuscle} interactive={interactive} />
    </div>
  );
}
