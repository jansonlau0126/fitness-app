import type { Muscle } from '../data/exercises';

type Region = { m: Muscle; d: string };

// All paths are drawn for the LEFT half of the screen (x < 100) and mirrored.
const OUTLINE =
  'M100,52 C95,52 91,52 90,54 C90,60 89,64 86,67 C78,70 66,71 58,74 C48,77 43,86 42,98 ' +
  'C40,112 39,128 38,142 C37,152 36,160 35,166 C32,182 29,200 28,222 C26,232 23,244 25,256 ' +
  'C27,264 34,264 36,256 C37,246 38,236 40,226 C44,206 48,188 51,170 C53,158 55,146 57,134 ' +
  'C59,124 61,116 63,112 C64,130 66,150 70,170 C71,185 70,198 67,210 C64,222 63,236 63,252 ' +
  'C62,276 63,300 66,318 C65,334 62,350 63,368 C64,384 67,398 69,408 C67,416 64,424 70,428 ' +
  'L92,428 C94,420 92,412 90,406 C90,390 92,370 92,350 C92,336 91,326 92,318 C94,300 97,272 98,246 L100,240 Z';

const FRONT: Region[] = [
  { m: 'traps', d: 'M89,58 C87,64 82,68 70,72 C80,73 90,73 97,73 L97,66 C94,64 91,62 89,58 Z' },
  { m: 'shoulders', d: 'M66,74 C55,75 46,82 44,96 C43,106 44,114 46,120 C50,112 54,104 58,98 C62,90 67,84 73,79 C71,76 69,75 66,74 Z' },
  { m: 'chest', d: 'M98,78 C90,76 81,77 75,80 C68,86 62,96 62,106 C63,114 69,119 77,120 C86,121 93,118 98,114 Z' },
  { m: 'biceps', d: 'M52,110 C47,120 44,132 43,146 C44,156 47,162 51,162 C55,154 57,142 58,130 C58,120 56,113 52,110 Z' },
  { m: 'forearms', d: 'M40,168 C35,182 32,198 30,218 L38,221 C42,204 46,188 49,172 C46,166 43,165 40,168 Z' },
  { m: 'forearms', d: 'M50,164 C51,172 50,182 47,194 C45,202 43,212 41,220 L38,221 C42,204 46,188 49,172 Z' },
  { m: 'abs', d: 'M88,125 L98,125 L98,141 L88,141 C87,136 87,130 88,125 Z' },
  { m: 'abs', d: 'M87,145 L98,145 L98,161 L87,161 C86,156 86,150 87,145 Z' },
  { m: 'abs', d: 'M87,165 L98,165 L98,181 L87,181 C86,176 86,170 87,165 Z' },
  { m: 'abs', d: 'M88,185 L98,185 L98,212 C94,210 90,205 89,198 C88,194 88,190 88,185 Z' },
  { m: 'obliques', d: 'M66,120 C70,121 76,123 83,125 C84,140 84,160 85,180 C85,192 86,202 87,210 C81,206 76,200 73,192 C71,176 69,158 67,142 C66,134 65,126 66,120 Z' },
  { m: 'quads', d: 'M66,226 C62,246 61,270 63,292 C64,304 67,312 72,317 C74,300 74,280 73,262 C72,248 70,236 66,226 Z' },
  { m: 'quads', d: 'M70,222 C78,230 86,244 88,262 C89,280 86,298 81,312 C79,314 77,314 75,312 C75,294 75,274 74,258 C73,244 72,232 70,222 Z' },
  { m: 'quads', d: 'M89,278 C93,288 94,300 91,310 C89,316 85,318 80,317 C85,306 88,292 89,278 Z' },
  { m: 'adductors', d: 'M97,244 C93,236 86,228 78,224 C84,236 89,250 90,268 C93,262 95,254 97,244 Z' },
  { m: 'calves', d: 'M66,330 C62,346 62,362 65,380 C68,372 71,358 72,344 C71,336 69,331 66,330 Z' },
  { m: 'calves', d: 'M74,334 C77,348 78,364 77,384 C80,390 83,392 85,390 C86,372 87,352 86,336 C83,330 78,329 74,334 Z' },
  { m: 'calves', d: 'M90,330 C93,346 93,364 90,382 C88,370 87,354 87,340 C88,334 89,331 90,330 Z' },
];

const BACK: Region[] = [
  { m: 'traps', d: 'M100,56 C97,58 93,60 89,63 C81,68 70,71 62,74 C72,78 81,84 87,93 C92,106 96,122 100,138 Z' },
  { m: 'rear-delts', d: 'M62,75 C52,77 45,84 44,96 C43,106 44,114 46,120 C52,112 58,104 64,98 C68,92 70,86 70,80 C68,77 65,75 62,75 Z' },
  { m: 'upper-back', d: 'M70,84 C77,87 83,92 86,98 C89,106 91,114 90,121 C82,121 73,118 66,112 C65,104 66,94 70,84 Z' },
  { m: 'lats', d: 'M64,115 C72,121 82,124 91,125 C94,138 96,152 95,166 C91,176 85,184 79,190 C75,176 71,160 67,146 C65,136 64,126 64,115 Z' },
  { m: 'lower-back', d: 'M98,140 L98,206 C94,206 90,203 88,197 C88,180 90,160 93,146 C95,142 97,140 98,140 Z' },
  { m: 'triceps', d: 'M47,112 C43,122 41,136 42,150 C43,158 47,162 52,161 C55,150 57,138 58,126 C57,118 52,110 47,112 Z' },
  { m: 'forearms', d: 'M40,168 C35,182 32,198 30,218 L38,221 C42,204 46,188 49,172 C46,166 43,165 40,168 Z' },
  { m: 'forearms', d: 'M50,164 C51,172 50,182 47,194 C45,202 43,212 41,220 L38,221 C42,204 46,188 49,172 Z' },
  { m: 'glutes', d: 'M98,208 C88,205 77,207 70,215 C65,226 65,240 71,249 C79,256 91,255 98,248 Z' },
  { m: 'hamstrings', d: 'M69,256 C65,274 65,294 68,312 L78,314 C79,296 80,276 81,258 C77,256 73,255 69,256 Z' },
  { m: 'hamstrings', d: 'M83,258 C85,278 87,298 88,314 L92,314 C94,296 96,274 96,254 C92,256 87,258 83,258 Z' },
  { m: 'adductors', d: 'M97,252 C96,264 95,276 94,286 C93,276 92,266 91,258 C93,256 95,254 97,252 Z' },
  { m: 'calves', d: 'M68,326 C63,340 63,358 67,372 C71,377 75,373 77,364 C78,350 78,336 76,326 C73,322 70,322 68,326 Z' },
  { m: 'calves', d: 'M80,326 C79,340 79,356 81,366 C84,374 89,374 91,366 C93,352 92,338 89,326 C86,322 82,322 80,326 Z' },
];

export interface BodyMapProps { primary: Set<Muscle>; secondary: Set<Muscle>; size?: number; showLabels?: boolean }

function View({ regions, primary, secondary, back, label }: { regions: Region[]; primary: Set<Muscle>; secondary: Set<Muscle>; back?: boolean; label: string }) {
  const cls = (m: Muscle) => (primary.has(m) ? 'mus pri' : secondary.has(m) ? 'mus sec' : 'mus');
  // back view: 'shoulders' also lights the rear deltoid lightly, and rear-delts light the front deltoid
  const cls2 = (m: Muscle) => {
    if (back && m === 'rear-delts' && !primary.has(m) && !secondary.has(m) && (primary.has('shoulders') || secondary.has('shoulders'))) return 'mus sec';
    return cls(m);
  };
  const paths = regions.map((r, i) => <path key={i} className={cls2(r.m)} d={r.d}><title>{r.m}</title></path>);
  return (
    <figure className="body-view">
      <svg viewBox="0 0 200 440" role="img" aria-label={`${label} view of body`}>
        <g className="sil">
          <ellipse cx="100" cy="31" rx="16" ry="20" />
          <path d={OUTLINE} />
          <path d={OUTLINE} transform="translate(200,0) scale(-1,1)" />
        </g>
        {back ? <path className="line" d="M100,60 L100,210" /> : <path className="line" d="M100,78 L100,118" />}
        <g>{paths}</g>
        <g transform="translate(200,0) scale(-1,1)">{paths}</g>
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export default function BodyMap({ primary, secondary }: BodyMapProps) {
  return (
    <div className="body-map">
      <View regions={FRONT} primary={primary} secondary={secondary} label="Front" />
      <View regions={BACK} primary={primary} secondary={secondary} back label="Back" />
    </div>
  );
}
