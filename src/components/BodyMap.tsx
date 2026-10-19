import type { Muscle } from '../data/exercises';
import { BACK, FRONT, type Region } from '../data/bodyAnatomy';

export interface BodyMapProps {
  primary: Set<Muscle>;
  secondary: Set<Muscle>;
  active?: Muscle | null;
  onMuscle?: (m: Muscle, trained: boolean) => void;
  interactive?: boolean;
}

const BASE = `${import.meta.env.BASE_URL}body/`;

/** Theme A HQ base art + SVG glow/hit overlays (same regions as share Theme C). */
function View({ regions, primary, secondary, back, label, active, onMuscle, interactive }: {
  regions: Region[]; primary: Set<Muscle>; secondary: Set<Muscle>; back?: boolean; label: string;
  active?: Muscle | null; onMuscle?: (m: Muscle, trained: boolean) => void; interactive?: boolean;
}) {
  const uid = back ? 'bk' : 'fr';
  const baseSrc = `${BASE}a-${back ? 'back' : 'front'}.webp`;
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
    </g>
  ));

  return (
    <figure className={`body-view theme-a hq ${interactive ? 'interactive' : ''}`}>
      <svg viewBox="0 0 200 500" role="img" aria-label={`${label} 3D mannequin`}>
        <defs>
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
          <filter id={`glowA-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feFlood floodColor="#ff7a30" floodOpacity="0.55" result="c" />
            <feComposite in="c" in2="b" operator="in" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <image href={baseSrc} x="0" y="0" width="200" height="500" preserveAspectRatio="xMidYMid slice" />
        <style>{`
          .body-view.theme-a.hq .mus {
            fill: transparent; stroke: transparent; stroke-width: 0;
          }
          .body-view.theme-a.hq .mus.pri {
            fill: url(#priA-${uid}); fill-opacity: 0.55; stroke: #ffd4a8; stroke-width: 1.1;
            filter: url(#glowA-${uid});
          }
          .body-view.theme-a.hq .mus.sec {
            fill: url(#secA-${uid}); fill-opacity: 0.42; stroke: #ffc8a0; stroke-width: 0.9;
          }
          .body-view.theme-a.hq.interactive .mus.tap:not(.pri):not(.sec) {
            fill: rgba(255,255,255,0.001);
          }
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
    <div className="body-map theme-a hq anatomical-v2">
      <View regions={FRONT} primary={primary} secondary={secondary} label="Front" active={active} onMuscle={onMuscle} interactive={interactive} />
      <View regions={BACK} primary={primary} secondary={secondary} back label="Back" active={active} onMuscle={onMuscle} interactive={interactive} />
    </div>
  );
}
