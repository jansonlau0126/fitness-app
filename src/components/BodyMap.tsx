import type { Muscle } from '../data/exercises';

type Region = { m: Muscle; d: string; soft?: boolean };

/** More anatomical half-body paths (left side; mirrored in SVG). Stylised, not medical. */
const OUTLINE =
  'M100,48 C96,48 92,49 90,52 C89,58 87,64 84,68 C76,72 64,74 56,78 C46,82 40,92 39,104 ' +
  'C37,120 36,136 35,150 C34,160 33,168 32,176 C29,194 26,214 25,236 C23,248 21,262 24,274 ' +
  'C26,282 34,282 36,274 C37,262 38,250 40,238 C44,216 48,196 52,176 C54,162 56,150 58,140 ' +
  'C60,130 62,122 64,118 C65,138 67,160 71,182 C72,198 71,212 68,226 C65,240 64,256 64,274 ' +
  'C63,300 64,326 68,346 C67,364 64,382 65,400 C66,416 70,430 72,440 C70,448 66,456 74,460 ' +
  'L94,460 C96,450 94,440 92,432 C92,414 94,392 94,370 C94,354 93,342 94,332 C96,312 99,282 99,254 L100,248 Z';

const FRONT: Region[] = [
  { m: 'traps', d: 'M90,56 C88,62 84,66 72,70 C80,72 90,72 97,72 L97,64 C94,60 92,58 90,56 Z' },
  { m: 'shoulders', d: 'M68,74 C56,76 46,84 44,100 C43,112 44,120 47,128 C52,118 56,108 61,100 C66,90 72,82 78,78 C74,75 71,74 68,74 Z' },
  { m: 'chest', d: 'M98,80 C88,78 78,80 72,84 C64,92 58,104 58,116 C60,126 68,132 78,132 C88,132 94,126 98,120 Z', soft: true },
  { m: 'chest', d: 'M98,86 C90,84 82,86 76,90 C70,96 66,106 66,114 C68,122 74,126 82,126 C90,126 95,122 98,118 Z' },
  { m: 'biceps', d: 'M54,118 C48,130 45,144 44,160 C45,172 49,178 54,178 C58,168 60,154 61,140 C61,128 58,120 54,118 Z' },
  { m: 'forearms', d: 'M42,180 C36,196 32,214 30,236 L39,240 C43,220 48,202 51,184 C48,178 45,177 42,180 Z' },
  { m: 'forearms', d: 'M52,176 C53,186 52,198 48,212 C46,222 43,234 41,242 L39,240 C43,220 48,202 51,184 Z' },
  { m: 'abs', d: 'M89,134 L98,134 L98,152 L89,152 C88,146 88,140 89,134 Z' },
  { m: 'abs', d: 'M88,156 L98,156 L98,174 L88,174 C87,168 87,162 88,156 Z' },
  { m: 'abs', d: 'M88,178 L98,178 L98,196 L88,196 C87,190 87,184 88,178 Z' },
  { m: 'abs', d: 'M89,200 L98,200 L98,228 C94,226 90,220 89,212 C88,208 88,204 89,200 Z' },
  { m: 'obliques', d: 'M66,128 C72,130 80,132 86,134 C87,152 87,174 88,196 C88,210 89,222 90,230 C84,226 78,218 74,208 C72,190 70,168 68,150 C67,142 66,134 66,128 Z' },
  { m: 'quads', d: 'M68,244 C63,268 62,296 65,322 C66,336 70,346 76,352 C78,332 78,308 77,286 C76,270 73,256 68,244 Z' },
  { m: 'quads', d: 'M72,240 C82,250 90,266 92,288 C93,310 90,332 84,348 C82,350 80,350 78,348 C78,326 78,302 77,282 C76,266 74,252 72,240 Z' },
  { m: 'quads', d: 'M93,304 C97,316 98,330 94,342 C92,350 87,352 82,350 C88,336 91,320 93,304 Z' },
  { m: 'adductors', d: 'M98,262 C94,252 86,244 78,240 C84,254 90,272 91,292 C94,284 96,274 98,262 Z' },
  { m: 'calves', d: 'M68,362 C63,382 63,402 67,424 C71,414 74,398 75,380 C74,370 71,364 68,362 Z' },
  { m: 'calves', d: 'M76,366 C80,384 81,404 80,428 C84,436 88,438 90,434 C91,412 92,388 90,368 C87,360 80,360 76,366 Z' },
  { m: 'calves', d: 'M94,362 C97,382 97,404 94,426 C91,412 90,392 90,374 C91,366 92,363 94,362 Z' },
];

const BACK: Region[] = [
  { m: 'traps', d: 'M100,54 C96,56 92,58 88,62 C80,68 68,72 60,76 C72,82 82,90 88,100 C94,116 98,134 100,152 Z' },
  { m: 'rear-delts', d: 'M62,76 C50,78 44,88 43,102 C42,114 44,122 47,130 C54,120 60,110 66,102 C70,94 72,86 72,80 C70,77 66,76 62,76 Z' },
  { m: 'upper-back', d: 'M70,88 C78,92 84,98 88,106 C92,116 94,126 92,134 C84,134 74,130 66,122 C65,112 66,98 70,88 Z' },
  { m: 'lats', d: 'M64,124 C74,132 84,136 92,138 C96,154 98,172 96,188 C92,200 84,210 78,216 C74,198 70,178 66,160 C64,148 64,134 64,124 Z' },
  { m: 'lower-back', d: 'M98,152 L98,222 C94,222 90,218 88,210 C88,190 90,168 94,152 Z' },
  { m: 'triceps', d: 'M48,120 C43,132 41,148 42,164 C44,174 48,178 54,176 C58,162 60,148 61,134 C60,126 54,118 48,120 Z' },
  { m: 'forearms', d: 'M42,180 C36,196 32,214 30,236 L39,240 C43,220 48,202 51,184 C48,178 45,177 42,180 Z' },
  { m: 'forearms', d: 'M52,176 C53,186 52,198 48,212 C46,222 43,234 41,242 L39,240 C43,220 48,202 51,184 Z' },
  { m: 'glutes', d: 'M98,224 C88,220 76,222 68,232 C62,246 62,262 70,274 C80,282 92,280 98,272 Z' },
  { m: 'hamstrings', d: 'M70,278 C65,300 65,324 69,346 L80,348 C81,326 82,302 83,280 C78,278 74,277 70,278 Z' },
  { m: 'hamstrings', d: 'M85,280 C87,304 90,328 91,348 L96,348 C98,326 100,300 100,276 C95,278 90,280 85,280 Z' },
  { m: 'adductors', d: 'M98,274 C97,288 96,302 95,314 C94,302 93,290 92,280 C94,278 96,276 98,274 Z' },
  { m: 'calves', d: 'M70,358 C64,376 64,398 69,416 C74,422 78,416 80,404 C81,386 81,370 78,358 C75,352 72,352 70,358 Z' },
  { m: 'calves', d: 'M82,358 C81,376 81,396 84,410 C88,420 94,420 96,410 C98,392 97,374 93,358 C90,352 84,352 82,358 Z' },
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
  const cls = (m: Muscle) => {
    let c = primary.has(m) ? 'mus pri' : secondary.has(m) ? 'mus sec' : 'mus';
    if (active === m) c += ' focus';
    if (interactive) c += ' tap';
    return c;
  };
  const cls2 = (m: Muscle) => {
    if (back && m === 'rear-delts' && !primary.has(m) && !secondary.has(m) && (primary.has('shoulders') || secondary.has('shoulders'))) {
      return cls(m).replace('mus ', 'mus sec ');
    }
    return cls(m);
  };
  const hit = (m: Muscle) => {
    if (!onMuscle) return;
    onMuscle(m, primary.has(m) || secondary.has(m));
  };
  const uid = back ? 'b' : 'f';
  const paths = regions.map((r, i) => (
    <path key={i} className={cls2(r.m) + (r.soft ? ' soft' : '')} d={r.d} onClick={() => hit(r.m)}
      role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => interactive && (e.key === 'Enter' || e.key === ' ') && hit(r.m)}>
      <title>{r.m}</title>
    </path>
  ));
  return (
    <figure className={`body-view ${interactive ? 'interactive' : ''}`}>
      <svg viewBox="0 0 200 470" role="img" aria-label={`${label} view of body`}>
        <defs>
          <linearGradient id={`sil-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sil)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--mus)" stopOpacity="0.85" />
          </linearGradient>
          <radialGradient id={`hi-${uid}`} cx="35%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="sil">
          <ellipse cx="100" cy="30" rx="17" ry="21" fill={`url(#sil-${uid})`} />
          <path d={OUTLINE} fill={`url(#sil-${uid})`} />
          <path d={OUTLINE} transform="translate(200,0) scale(-1,1)" fill={`url(#sil-${uid})`} />
          <rect x="0" y="0" width="200" height="470" fill={`url(#hi-${uid})`} style={{ pointerEvents: 'none' }} />
        </g>
        {back ? <path className="line" d="M100,58 L100,220" /> : <path className="line" d="M100,78 L100,122" />}
        <g>{paths}</g>
        <g transform="translate(200,0) scale(-1,1)">{paths}</g>
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export default function BodyMap({ primary, secondary, active, onMuscle, interactive }: BodyMapProps) {
  return (
    <div className="body-map">
      <View regions={FRONT} primary={primary} secondary={secondary} label="Front" active={active} onMuscle={onMuscle} interactive={interactive} />
      <View regions={BACK} primary={primary} secondary={secondary} back label="Back" active={active} onMuscle={onMuscle} interactive={interactive} />
    </div>
  );
}
