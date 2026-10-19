import type { Muscle } from '../data/exercises';
import { BACK, FRONT, OUTLINE, type Region } from '../data/bodyAnatomy';

export interface BodyMapProps {
  primary: Set<Muscle>;
  secondary: Set<Muscle>;
  active?: Muscle | null;
  onMuscle?: (m: Muscle, trained: boolean) => void;
  interactive?: boolean;
}

/** In-app Summary: Theme A — semi-realistic 3D mannequin. Same hit regions as share Theme C. */
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
        <path className="mus-hi" d={r.hi} fill="none" stroke="rgba(255,245,230,.28)" strokeWidth="1.5"
          strokeLinecap="round" style={{ pointerEvents: 'none' }} />
      )}
    </g>
  ));

  return (
    <figure className={`body-view theme-a ${interactive ? 'interactive' : ''}`}>
      <svg viewBox="0 0 200 500" role="img" aria-label={`${label} 3D mannequin`}>
        <defs>
          <linearGradient id={`skinA-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a5368" />
            <stop offset="28%" stopColor="#3e384c" />
            <stop offset="62%" stopColor="#2a2436" />
            <stop offset="100%" stopColor="#16101f" />
          </linearGradient>
          <linearGradient id={`musA-${uid}`} x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#625a70" />
            <stop offset="40%" stopColor="#433c52" />
            <stop offset="100%" stopColor="#2c2638" />
          </linearGradient>
          <radialGradient id={`specA-${uid}`} cx="34%" cy="22%" r="58%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
            <stop offset="45%" stopColor="#ffd0a0" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`rimA-${uid}`} cx="78%" cy="48%" r="70%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="70%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
          </radialGradient>
          <filter id={`softA-${uid}`} x="-20%" y="-10%" width="140%" height="120%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" result="b" />
            <feOffset dy="6" result="o" />
            <feFlood floodColor="#000" floodOpacity="0.45" />
            <feComposite in2="o" operator="in" result="sh" />
            <feMerge><feMergeNode in="sh" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id={`glowA-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feFlood floodColor="#ff7a30" floodOpacity="0.55" result="c" />
            <feComposite in="c" in2="b" operator="in" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id={`priA-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd4a0" />
            <stop offset="35%" stopColor="#ff9a4a" />
            <stop offset="70%" stopColor="#ff6a28" />
            <stop offset="100%" stopColor="#e84810" />
          </linearGradient>
          <linearGradient id={`secA-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffe0c0" />
            <stop offset="100%" stopColor="#ffb888" />
          </linearGradient>
        </defs>
        <g className="sil" filter={`url(#softA-${uid})`}>
          <ellipse cx="100" cy="28" rx="18" ry="22" fill={`url(#skinA-${uid})`} />
          <path d={OUTLINE} fill={`url(#skinA-${uid})`} />
          <path d={OUTLINE} transform="translate(200,0) scale(-1,1)" fill={`url(#skinA-${uid})`} />
        </g>
        {back
          ? <path className="line" d="M100,56 L100,236" />
          : <path className="line" d="M100,78 L100,128" />}
        <style>{`
          .body-view.theme-a .mus { fill: url(#musA-${uid}); stroke: #1a1424; stroke-width: 1.05; }
          .body-view.theme-a .mus.pri {
            fill: url(#priA-${uid}); fill-opacity: 0.88; stroke: #ffd4a8; stroke-width: 1.35;
            filter: url(#glowA-${uid});
          }
          .body-view.theme-a .mus.sec {
            fill: url(#secA-${uid}); fill-opacity: 0.72; stroke: #ffc8a0; stroke-width: 1.15;
          }
        `}</style>
        <g>{paths}</g>
        <g transform="translate(200,0) scale(-1,1)">{paths}</g>
        <rect x="0" y="0" width="200" height="500" fill={`url(#specA-${uid})`} style={{ pointerEvents: 'none' }} />
        <rect x="0" y="0" width="200" height="500" fill={`url(#rimA-${uid})`} style={{ pointerEvents: 'none' }} />
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export default function BodyMap({ primary, secondary, active, onMuscle, interactive }: BodyMapProps) {
  return (
    <div className="body-map theme-a anatomical-v2">
      <View regions={FRONT} primary={primary} secondary={secondary} label="Front" active={active} onMuscle={onMuscle} interactive={interactive} />
      <View regions={BACK} primary={primary} secondary={secondary} back label="Back" active={active} onMuscle={onMuscle} interactive={interactive} />
    </div>
  );
}
