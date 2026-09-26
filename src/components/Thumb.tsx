import { useSyncExternalStore, type KeyboardEvent, type MouseEvent } from 'react';
import type { Exercise } from '../data/exercises';
import { equipName } from '../data/equipment';
import { hasPhoto, photoUrl, PHOTO_CREDIT, PHOTOS } from '../data/images';
import { EquipIcon } from './Icons';

// ---- tiny lightbox store ----
let current: Exercise | null = null;
const subs = new Set<() => void>();
const set = (e: Exercise | null) => { current = e; subs.forEach((s) => s()); };
export const openLightbox = (e: Exercise) => set(e);

/** Small picture of an exercise: real photo if we have one, else a drawn equipment icon. */
export function ExThumb({ ex, size = 56, zoom = true }: { ex: Exercise; size?: number; zoom?: boolean }) {
  const photo = hasPhoto(ex.id);
  const open = (e: MouseEvent | KeyboardEvent) => { e.stopPropagation(); e.preventDefault(); openLightbox(ex); };
  const inner = photo
    ? <img src={photoUrl(ex.id, 0)} alt="" loading="lazy" decoding="async" width={size} height={size} />
    : <EquipIcon id={ex.equipment} />;
  const cls = `thumb ${photo ? 'photo' : 'icon'} ${zoom ? 'zoom' : ''}`;
  const style = { width: size, height: size };
  if (!zoom) return <span className={cls} style={style} aria-hidden>{inner}</span>;
  return (
    <span className={cls} style={style} role="button" tabIndex={0} aria-label={`Show picture: ${ex.name}`}
      onClick={open} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open(e)}>
      {inner}
    </span>
  );
}

/** Start + end photos side by side (or a big icon). */
export function ExPhotos({ ex }: { ex: Exercise }) {
  if (!hasPhoto(ex.id)) {
    return <div className="ex-photos icon-only" onClick={() => openLightbox(ex)}><span className="thumb icon big"><EquipIcon id={ex.equipment} /></span></div>;
  }
  return (
    <div className="ex-photos" role="button" tabIndex={0} aria-label={`Show bigger pictures: ${ex.name}`} onClick={() => openLightbox(ex)} onKeyDown={(e) => e.key === 'Enter' && openLightbox(ex)}>
      {[0, 1].map((i) => (
        <figure key={i}><img src={photoUrl(ex.id, i as 0 | 1)} alt={`${ex.name} – ${i ? 'end' : 'start'}`} loading="lazy" decoding="async" /><figcaption>{i ? 'End' : 'Start'}</figcaption></figure>
      ))}
    </div>
  );
}

export function LightboxHost() {
  const ex = useSyncExternalStore((l) => { subs.add(l); return () => { subs.delete(l); }; }, () => current);
  if (!ex) return null;
  const photo = hasPhoto(ex.id);
  return (
    <div className="overlay center" onClick={() => set(null)}>
      <div className="lightbox" role="dialog" aria-label={ex.name} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head"><h2>{ex.name}</h2><button className="icon-btn" aria-label="Close" onClick={() => set(null)}>✕</button></div>
        {photo ? (
          <div className="lb-photos">
            {[0, 1].map((i) => <figure key={i}><img src={photoUrl(ex.id, i as 0 | 1)} alt={`${ex.name} – ${i ? 'end' : 'start'}`} /><figcaption>{i ? '2. End' : '1. Start'}</figcaption></figure>)}
          </div>
        ) : (
          <div className="lb-icon"><span className="thumb icon big"><EquipIcon id={ex.equipment} /></span><p className="muted small">No photo yet. Tool: {equipName(ex.equipment)}</p></div>
        )}
        <ol className="how">{ex.how.map((h, i) => <li key={i}>{h}</li>)}</ol>
        {photo && <p className="credit">Photo: “{PHOTOS[ex.id]}”. {PHOTO_CREDIT}</p>}
      </div>
    </div>
  );
}
