import type { Muscle } from '../data/exercises';
import { BACK, FRONT, OUTLINE, type Region } from '../data/bodyAnatomy';

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
