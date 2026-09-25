import { parseKey, shortDate, daysInMonth, monthStartDow, todayKey } from '../lib/date';

export interface Series { name: string; color: string; points: { x: string; y: number }[] }

export function LineChart({ series, unit, from, to, height = 190 }: { series: Series[]; unit: string; from: string; to: string; height?: number }) {
  const W = 350, H = height, L = 38, R = 10, T = 12, B = 26;
  const all = series.flatMap((s) => s.points);
  if (!all.length) return <div className="chart-empty">No data in this time.</div>;
  const t0 = parseKey(from).getTime(), t1 = Math.max(parseKey(to).getTime(), t0 + 864e5);
  let lo = Math.min(...all.map((p) => p.y)), hi = Math.max(...all.map((p) => p.y));
  const pad = Math.max((hi - lo) * 0.15, hi * 0.05, 1);
  lo = Math.max(0, lo - pad); hi = hi + pad;
  const x = (k: string) => L + ((parseKey(k).getTime() - t0) / (t1 - t0)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks = 4;
  const yt = Array.from({ length: ticks + 1 }, (_, i) => lo + ((hi - lo) * i) / ticks);
  const xt = Array.from({ length: 4 }, (_, i) => { const d = new Date(t0 + ((t1 - t0) * i) / 3); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line chart">
      {yt.map((v, i) => (
        <g key={i}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="grid" />
          <text x={L - 6} y={y(v) + 4} className="axis" textAnchor="end">{Math.round(v)}</text>
        </g>
      ))}
      {xt.map((k, i) => <text key={k + i} x={x(k)} y={H - 6} className="axis" textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'}>{shortDate(k)}</text>)}
      <text x={4} y={T - 2} className="axis">{unit}</text>
      {series.map((s) => {
        const pts = [...s.points].sort((a, b) => a.x.localeCompare(b.x));
        const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
        return (
          <g key={s.name}>
            <path d={d} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p) => <circle key={p.x} cx={x(p.x)} cy={y(p.y)} r={3.2} fill={s.color} stroke="var(--card)" strokeWidth={1.5}><title>{`${s.name}: ${p.y.toFixed(1)} ${unit} (${shortDate(p.x)})`}</title></circle>)}
          </g>
        );
      })}
    </svg>
  );
}

export function Sparkline({ points, color = 'var(--accent)' }: { points: { x: string; y: number }[]; color?: string }) {
  if (points.length < 2) return null;
  const W = 300, H = 60;
  const ys = points.map((p) => p.y); const lo = Math.min(...ys) - 0.5, hi = Math.max(...ys) + 0.5;
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${((i / (points.length - 1)) * (W - 8) + 4).toFixed(1)},${(H - 6 - ((p.y - lo) / (hi - lo)) * (H - 12)).toFixed(1)}`).join(' ');
  return <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"><path d={d} fill="none" stroke={color} strokeWidth={2.5} vectorEffect="non-scaling-stroke" /></svg>;
}

export function BarList({ items, unit }: { items: { label: string; value: number; sub?: string; color?: string }[]; unit: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="barlist">
      {items.map((it) => (
        <div className="bar-row" key={it.label}>
          <div className="bar-label">{it.label}</div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(2, (it.value / max) * 100)}%`, background: it.color }} /></div>
          <div className="bar-value">{it.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}<small> {unit}</small>{it.sub && <div className="bar-sub">{it.sub}</div>}</div>
        </div>
      ))}
    </div>
  );
}

export function MonthCalendar({ month, values, onPick }: { month: string; values: Map<string, number>; onPick?: (d: string) => void }) {
  const n = daysInMonth(month), start = monthStartDow(month), today = todayKey();
  const max = Math.max(1, ...values.values());
  const cells: (string | null)[] = [...Array(start).fill(null), ...Array.from({ length: n }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
  return (
    <div className="cal">
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="cal-dow">{d}</div>)}
      {cells.map((k, i) => {
        if (!k) return <div key={'e' + i} />;
        const v = values.get(k) ?? 0;
        const lvl = v === 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4));
        return (
          <button key={k} className={`cal-day l${lvl} ${k === today ? 'today' : ''}`} onClick={() => onPick?.(k)} aria-label={`${k}: ${v} sets`}>
            {Number(k.slice(8))}
          </button>
        );
      })}
    </div>
  );
}
