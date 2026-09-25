import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { addDays, niceDay, todayKey } from '../lib/date';

// ---------- tiny global stores for toast + confirm ----------
type ConfirmReq = { msg: string; title?: string; ok?: string; danger?: boolean; resolve: (v: boolean) => void };
let confirmReq: ConfirmReq | null = null;
let toastMsg: { text: string; id: number } | null = null;
const subs = new Set<() => void>();
const ping = () => subs.forEach((s) => s());
const subscribe = (l: () => void) => { subs.add(l); return () => { subs.delete(l); }; };

export function confirmDialog(msg: string, opts: { title?: string; ok?: string; danger?: boolean } = {}) {
  return new Promise<boolean>((resolve) => { confirmReq = { msg, ...opts, resolve }; ping(); });
}
export function toast(text: string) {
  toastMsg = { text, id: Date.now() }; ping();
  const id = toastMsg.id;
  setTimeout(() => { if (toastMsg?.id === id) { toastMsg = null; ping(); } }, 2600);
}

export function Hosts() {
  const c = useSyncExternalStore(subscribe, () => confirmReq);
  const t = useSyncExternalStore(subscribe, () => toastMsg);
  const done = (v: boolean) => { c?.resolve(v); confirmReq = null; ping(); };
  return (
    <>
      {c && (
        <div className="overlay center" onClick={() => done(false)}>
          <div className="dialog" role="alertdialog" onClick={(e) => e.stopPropagation()}>
            {c.title && <h3>{c.title}</h3>}
            <p>{c.msg}</p>
            <div className="row gap end">
              <button className="btn ghost" onClick={() => done(false)}>Cancel</button>
              <button className={`btn ${c.danger ? 'danger' : 'primary'}`} onClick={() => done(true)}>{c.ok ?? 'OK'}</button>
            </div>
          </div>
        </div>
      )}
      {t && <div className="toast" key={t.id}>{t.text}</div>}
    </>
  );
}

// ---------- layout bits ----------
export function Sheet({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.classList.add('no-scroll');
    return () => { window.removeEventListener('keydown', k); document.body.classList.remove('no-scroll'); };
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function DateBar({ date, setDate }: { date: string; setDate: (d: string) => void }) {
  const today = todayKey();
  return (
    <div className="datebar">
      <button className="icon-btn" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>‹</button>
      <label className="datebar-mid">
        <span className="datebar-label">{niceDay(date)}</span>
        <span className="datebar-sub">{date}</span>
        <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Pick a date" />
      </label>
      <button className="icon-btn" aria-label="Next day" onClick={() => setDate(addDays(date, 1))}>›</button>
      {date !== today && <button className="btn small ghost" onClick={() => setDate(today)}>Today</button>}
    </div>
  );
}

export function NumberField({ value, onChange, label, step = 'any', placeholder, className, suffix }: {
  value: number | null; onChange: (v: number | null) => void; label?: string; step?: string; placeholder?: string; className?: string; suffix?: string;
}) {
  const [text, setText] = useState(value === null || Number.isNaN(value) ? '' : String(value));
  useEffect(() => {
    const parsed = text === '' ? null : Number(text.replace(',', '.'));
    if (parsed !== value) setText(value === null ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  const input = (
    <span className={`num-wrap ${className ?? ''}`}>
      <input
        className="num" inputMode="decimal" type="text" value={text} placeholder={placeholder} step={step} aria-label={label}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const t = e.target.value.replace(/[^0-9.,]/g, '');
          setText(t);
          const n = t === '' ? null : Number(t.replace(',', '.'));
          onChange(n === null || Number.isNaN(n) ? null : n);
        }}
      />
      {suffix && <span className="num-suffix">{suffix}</span>}
    </span>
  );
  return label ? <label className="field"><span className="field-label">{label}</span>{input}</label> : input;
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label?: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} role="radio" aria-checked={value === o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Stat({ label, value, unit, delta }: { label: string; value: string; unit?: string; delta?: number | null }) {
  return (
    <div className="stat">
      <div className="stat-value">{value}{unit && <small> {unit}</small>}</div>
      <div className="stat-label">{label}</div>
      {delta !== undefined && delta !== null && delta !== 0 && (
        <div className={`stat-delta ${delta > 0 ? 'up' : 'down'}`}>{delta > 0 ? '▲' : '▼'} {Math.abs(delta).toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
      )}
    </div>
  );
}

export function Empty({ icon, title, text, children }: { icon: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}
