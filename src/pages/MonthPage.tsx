import { useMemo, useState } from 'react';
import { BarList, LineChart, MonthCalendar, type Series } from '../components/Charts';
import { Segmented, Stat } from '../components/ui';
import { BODY_PARTS, KEY_LIFTS, partLabel, type BodyPart } from '../data/exercises';
import { bestByExercise, entryStats, exMap, fmt, fmtInt, LEVEL_COLORS, LEVELS, strengthResults } from '../lib/calc';
import { addDays, addMonths, daysInMonth, monthLabel, monthOf, monthShort, todayKey, weekKey, weeksInMonth } from '../lib/date';
import { useData, type AppData } from '../lib/store';

const COLORS = ['#ff6b3d', '#60a5fa', '#34d399', '#fbbf24', '#c084fc'];
const PART_COLORS: Record<BodyPart, string> = {
  Chest: '#ff6b3d', Back: '#60a5fa', Shoulders: '#fbbf24', Biceps: '#34d399', Triceps: '#2dd4bf', Forearms: '#a3e635',
  Abs: '#f472b6', Quads: '#c084fc', Hamstrings: '#a78bfa', Glutes: '#fb7185', Calves: '#38bdf8', Traps: '#facc15', 'Lower Back': '#94a3b8',
};

function monthStats(d: AppData, month: string) {
  const m = exMap(d);
  const es = d.entries.filter((e) => monthOf(e.date) === month);
  const days = new Map<string, number>();
  const parts = new Map<BodyPart, { sets: number; volume: number }>();
  let sets = 0, reps = 0, volume = 0;
  for (const e of es) {
    const st = entryStats(e); sets += st.sets; reps += st.reps; volume += st.volume;
    days.set(e.date, (days.get(e.date) ?? 0) + st.sets);
    const ex = m.get(e.exId);
    if (ex) { const p = parts.get(ex.part) ?? { sets: 0, volume: 0 }; p.sets += st.sets; p.volume += st.volume; parts.set(ex.part, p); }
  }
  return { es, days, parts, sets, reps, volume };
}

function longestStreak(days: string[]) {
  const s = new Set(days); let best = 0;
  for (const d of s) { if (s.has(addDays(d, -1))) continue; let n = 1, c = d; while (s.has(addDays(c, 1))) { n++; c = addDays(c, 1); } best = Math.max(best, n); }
  return best;
}
function likeLifting(kg: number) {
  const things: [number, string, string, string][] = [
    [150000, 'blue whale', 'blue whales', '🐋'], [12000, 'double-decker bus', 'double-decker buses', '🚌'],
    [5000, 'elephant', 'elephants', '🐘'], [1500, 'car', 'cars', '🚗'], [300, 'piano', 'pianos', '🎹'], [25, 'bag of rice', 'bags of rice', '🍚']];
  for (const [w, one, many, icon] of things) {
    const n = kg / w;
    if (n >= 1) { const r = n >= 10 ? Math.round(n) : Math.round(n * 10) / 10; return `${icon} That's like lifting ${r} ${r === 1 ? one : many}!`; }
  }
  return '';
}

export default function MonthPage({ openDay }: { openDay: (d: string) => void }) {
  const data = useData();
  const [month, setMonth] = useState(monthOf(todayKey()));
  const [barMode, setBarMode] = useState<'sets' | 'volume'>('sets');
  const [range, setRange] = useState<'month' | '3m' | 'all'>('3m');
  const [picked, setPicked] = useState<string[] | null>(null);
  const [allPrs, setAllPrs] = useState(false);
  const [allLvls, setAllLvls] = useState(false);
  const m = exMap(data);

  const cur = useMemo(() => monthStats(data, month), [data, month]);
  const prev = useMemo(() => monthStats(data, addMonths(month, -1)), [data, month]);
  const mStart = `${month}-01`, mEnd = `${month}-${String(daysInMonth(month)).padStart(2, '0')}`;

  // PRs this month
  const prs = useMemo(() => {
    const before = bestByExercise(data, '0000-00-00', addDays(mStart, -1));
    const during = bestByExercise(data, mStart, mEnd);
    const out: { exId: string; value: number; prev: number; date: string }[] = [];
    const firsts: string[] = [];
    during.forEach((v, id) => { const b = before.get(id); if (!b) firsts.push(id); else if (v.value > b.value) out.push({ exId: id, value: v.value, prev: b.value, date: v.date }); });
    out.sort((a, b) => (b.value - b.prev) / b.prev - (a.value - a.prev) / a.prev);
    return { out, firsts };
  }, [data, mStart, mEnd]);

  // Strength level changes
  const levels = useMemo(() => {
    if (!data.profile.weightKg) return null;
    const a = strengthResults(data, KEY_LIFTS, addDays(mStart, -1));
    const b = strengthResults(data, KEY_LIFTS, mEnd);
    return b.filter((r) => r.info).map((r) => {
      const old = a.find((x) => x.ex.id === r.ex.id)?.info ?? null;
      return { ex: r.ex, from: old ? old.level : null, to: r.info!.level, name: r.info!.name, fromName: old?.name ?? null };
    }).sort((x, y) => Number(y.from !== null && y.to > y.from) - Number(x.from !== null && x.to > x.from));
  }, [data, mStart, mEnd]);
  const ups = levels?.filter((l) => l.from !== null && l.to > l.from) ?? [];

  // Chart
  const firstLog = data.entries.reduce((a, e) => (e.date < a ? e.date : a), mStart);
  const rangeStart = range === 'month' ? mStart : range === '3m' ? `${addMonths(month, -2)}-01` : firstLog;
  const chartFrom = rangeStart < firstLog ? firstLog : rangeStart;
  const chartTo = mEnd > todayKey() && mStart <= todayKey() ? todayKey() : mEnd;
  const chartable = useMemo(() => {
    const count = new Map<string, number>();
    for (const e of data.entries) if (e.date >= chartFrom && e.date <= chartTo && !m.get(e.exId)?.bw) count.set(e.exId, (count.get(e.exId) ?? 0) + e.sets.length);
    return [...count.entries()].sort((a, b) => (KEY_LIFTS.includes(b[0]) ? 1000 : 0) + b[1] - ((KEY_LIFTS.includes(a[0]) ? 1000 : 0) + a[1])).map(([id]) => id);
  }, [data, chartFrom, chartTo, m]);
  const sel = (picked ?? chartable.slice(0, 3)).filter((id) => chartable.includes(id));
  const series: Series[] = sel.map((id, i) => {
    const best = new Map<string, number>();
    for (const e of data.entries) if (e.exId === id && e.date >= chartFrom && e.date <= chartTo) { const v = entryStats(e).best; if (v > (best.get(e.date) ?? 0)) best.set(e.date, v); }
    return { name: m.get(id)?.name ?? id, color: COLORS[i % COLORS.length], points: [...best.entries()].map(([x, y]) => ({ x, y })) };
  });
  const toggle = (id: string) => setPicked((p) => { const s = p ?? sel; return s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-5); });

  const nDays = cur.days.size, pDays = prev.days.size, diff = nDays - pDays;
  const streak = longestStreak([...cur.days.keys()]);
  const topPart = [...cur.parts.entries()].sort((a, b) => b[1].sets - a[1].sets)[0];

  const msgs: string[] = [];
  if (nDays === 0) msgs.push('No workouts this month yet. Every big trip starts with one step. You can do it! 🚀');
  else {
    msgs.push(`You trained ${nDays} ${nDays === 1 ? 'day' : 'days'} this month.` + (pDays === 0 ? ' Great start! 🎉' : diff > 0 ? ` That's ${diff} more than last month! 🔥` : diff === 0 ? ' Same as last month. Nice and steady! 👍' : ` Last month was ${pDays}. Keep going! 💪`));
    if (cur.volume > 0) msgs.push(`You lifted ${fmtInt(cur.volume)} kg in total. ${likeLifting(cur.volume)}`);
    [...prs.out].sort((x, y) => Number(KEY_LIFTS.includes(y.exId)) - Number(KEY_LIFTS.includes(x.exId))).slice(0, 3).forEach((p) => { const ex = m.get(p.exId); msgs.push(`New PR: ${ex?.name} ${fmt(p.value)} ${ex?.bw ? 'reps' : 'kg'}! 🏆`); });
    if (prs.out.length > 3) msgs.push(`You set ${prs.out.length} new PRs this month. Amazing work! 🥳`);
    if (ups.length > 0 && ups.length <= 2) ups.forEach((u) => msgs.push(`Level up! Your ${u.ex.name} is now ${u.name}. ⭐`));
    if (ups.length > 2) msgs.push(`Level up! ${ups.length} lifts reached a new level: ${ups.map((u) => `${u.ex.name} (${u.name})`).join(', ')}. ⭐`);
    if (streak >= 3) msgs.push(`Your best streak was ${streak} days in a row. 📅`);
    if (topPart) msgs.push(`Your top body part was ${partLabel(topPart[0])} with ${topPart[1].sets} sets.`);
    if (prev.volume > 0 && cur.volume > prev.volume) msgs.push(`Your total volume went up ${Math.round(((cur.volume - prev.volume) / prev.volume) * 100)}% from last month. 📈`);
  }

  const monthWeeks = weeksInMonth(month);
  const trainedWeekKeys = new Set([...cur.days.keys()].map(weekKey));
  const everyWeek = monthWeeks.length > 0 && monthWeeks.every((w) => trainedWeekKeys.has(w));
  const badges = [
    { icon: '👟', name: 'First step', desc: '1+ workout', ok: nDays >= 1 },
    { icon: '📆', name: 'Regular', desc: '8+ days', ok: nDays >= 8 },
    { icon: '🔥', name: 'On fire', desc: '12+ days', ok: nDays >= 12 },
    { icon: '🏆', name: 'PR hunter', desc: '1+ new PR', ok: prs.out.length >= 1 },
    { icon: '💎', name: 'PR machine', desc: '5+ new PRs', ok: prs.out.length >= 5 },
    { icon: '🐘', name: 'Heavy lifter', desc: '50,000 kg', ok: cur.volume >= 50000 },
    { icon: '🧍', name: 'Full body', desc: '8+ body parts', ok: cur.parts.size >= 8 },
    { icon: '⭐', name: 'Level up', desc: 'New strength level', ok: ups.length > 0 },
    { icon: '🗓️', name: 'Every week', desc: 'Train each week', ok: everyWeek },
  ];
  const earned = badges.filter((b) => b.ok).length;

  const partItems = BODY_PARTS.filter((p) => cur.parts.has(p)).map((p) => ({ label: partLabel(p), value: barMode === 'sets' ? cur.parts.get(p)!.sets : cur.parts.get(p)!.volume, sub: barMode === 'sets' ? `${fmtInt(cur.parts.get(p)!.volume)} kg` : `${cur.parts.get(p)!.sets} sets`, color: PART_COLORS[p] }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="page">
      <header className="page-head"><h1>Month</h1></header>
      <div className="datebar">
        <button className="icon-btn" aria-label="Previous month" onClick={() => { setMonth(addMonths(month, -1)); setPicked(null); }}>‹</button>
        <div className="datebar-mid static"><span className="datebar-label">{monthLabel(month)}</span></div>
        <button className="icon-btn" aria-label="Next month" onClick={() => { setMonth(addMonths(month, 1)); setPicked(null); }}>›</button>
      </div>

      <section className={`card hero ${prs.out.length ? 'party' : ''}`}>
        {prs.out.length > 0 && <Confetti />}
        <div className="hero-num">{nDays}</div>
        <div className="hero-text"><b>workout {nDays === 1 ? 'day' : 'days'}</b><span className="muted">{pDays ? `${monthShort(addMonths(month, -1))}: ${pDays} days` : 'in ' + monthShort(month)}</span></div>
        <div className="hero-badges">{earned} / {badges.length} badges</div>
      </section>

      <div className="stats4">
        <Stat label="Days" value={String(nDays)} delta={pDays ? diff : null} />
        <Stat label="Sets" value={fmtInt(cur.sets)} delta={prev.sets ? cur.sets - prev.sets : null} />
        <Stat label="Reps" value={fmtInt(cur.reps)} delta={prev.reps ? cur.reps - prev.reps : null} />
        <Stat label="Volume" value={cur.volume >= 10000 ? fmt(cur.volume / 1000, 1) + 'k' : fmtInt(cur.volume)} unit="kg" />
      </div>

      <section className="card msgs">
        {msgs.map((t, i) => <p key={i} className="msg">{t}</p>)}
      </section>

      <section className="card">
        <h2 className="card-title">Badges</h2>
        <div className="badges">
          {badges.map((b) => (
            <div key={b.name} className={`badge-tile ${b.ok ? 'ok' : ''}`} title={b.desc}>
              <div className="badge-icon">{b.icon}</div>
              <div className="badge-name">{b.name}</div>
              <div className="badge-desc">{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Training days</h2>
        <MonthCalendar month={month} values={cur.days} onPick={openDay} />
        <div className="legend"><span className="muted small">Less</span><i className="sq l1" /><i className="sq l2" /><i className="sq l3" /><i className="sq l4" /><span className="muted small">More sets</span></div>
      </section>

      <section className="card">
        <div className="card-title-row">
          <h2 className="card-title">Body parts</h2>
          <Segmented value={barMode} onChange={setBarMode} options={[{ v: 'sets', label: 'Sets' }, { v: 'volume', label: 'Volume' }]} />
        </div>
        {partItems.length ? <BarList items={partItems} unit={barMode === 'sets' ? 'sets' : 'kg'} /> : <p className="muted">No data this month.</p>}
      </section>

      <section className="card">
        <div className="card-title-row">
          <h2 className="card-title">Est. 1RM progress</h2>
          <Segmented value={range} onChange={setRange} options={[{ v: 'month', label: '1M' }, { v: '3m', label: '3M' }, { v: 'all', label: 'All' }]} />
        </div>
        {chartable.length ? (
          <>
            <div className="chips scroll">
              {chartable.slice(0, 14).map((id) => {
                const i = sel.indexOf(id);
                return <button key={id} className={`chip toggle ${i >= 0 ? 'on' : ''}`} style={i >= 0 ? { borderColor: COLORS[i % 5], color: COLORS[i % 5] } : undefined} onClick={() => toggle(id)}>{m.get(id)?.name}</button>;
              })}
            </div>
            <LineChart series={series} unit="kg" from={chartFrom} to={chartTo} />
            <div className="legend wrap">{series.map((s) => <span key={s.name}><i className="dot" style={{ background: s.color }} /> {s.name}</span>)}</div>
          </>
        ) : <p className="muted">Log weighted exercises to see a chart.</p>}
      </section>

      <section className="card">
        <h2 className="card-title">New PRs this month {prs.out.length > 0 && <span className="pill gold">{prs.out.length}</span>}</h2>
        {prs.out.length ? (
          <div className="pr-list">
            {(allPrs ? prs.out : prs.out.slice(0, 5)).map((p) => { const ex = m.get(p.exId); const u = ex?.bw ? 'reps' : 'kg'; return (
              <div className="pr-item" key={p.exId}>
                <span className="pr-medal">🏅</span>
                <span className="grow"><b>{ex?.name}</b><small className="muted"> {fmt(p.prev)} → </small><b className="accent">{fmt(p.value)} {u}</b></span>
                <span className="pill up">+{fmt(p.value - p.prev)}</span>
              </div>); })}
            {prs.out.length > 5 && <button className="btn ghost small" onClick={() => setAllPrs(!allPrs)}>{allPrs ? 'Show less' : `Show all ${prs.out.length} PRs`}</button>}
          </div>
        ) : <p className="muted">{prs.firsts.length ? 'No PRs yet — you tried new exercises. Next month, beat them!' : 'No new PRs this month. Keep pushing!'}</p>}
        {prs.firsts.length > 0 && <p className="small muted">New exercises tried: {prs.firsts.map((id) => m.get(id)?.name).join(', ')}</p>}
        <p className="small muted">PR = best est. 1RM (or most reps for body weight moves).</p>
      </section>

      <section className="card">
        <h2 className="card-title">Strength levels</h2>
        {!levels ? <p className="muted">Add your body weight in Profile to see levels.</p> : levels.length === 0 ? <p className="muted">Log key lifts (bench, squat, deadlift…) to see levels.</p> : (
          <div className="lvl-list">
            {(allLvls ? levels : levels.filter((l) => (l.from !== null && l.to > l.from) || KEY_LIFTS.includes(l.ex.id))).map((l) => (
              <div className="lvl-change" key={l.ex.id}>
                <span className="grow">{l.ex.name}</span>
                {l.from !== null && l.from !== l.to && <><LevelTag level={l.from} /><span className="arrow">→</span></>}
                <LevelTag level={l.to} />
                {l.from !== null && l.to > l.from && <span className="up-star">⬆</span>}
              </div>
            ))}
            {levels.length > levels.filter((l) => (l.from !== null && l.to > l.from) || KEY_LIFTS.includes(l.ex.id)).length && (
              <button className="btn ghost small" onClick={() => setAllLvls(!allLvls)}>{allLvls ? 'Show key lifts only' : `Show all ${levels.length} lifts`}</button>
            )}
          </div>
        )}
        <p className="small muted">Standards based on strengthlevel.com data.</p>
      </section>
    </div>
  );
}

export function LevelTag({ level }: { level: number }) {
  return <span className="lvl-tag" style={{ background: level < 0 ? 'var(--line)' : LEVEL_COLORS[level] }}>{level < 0 ? 'Starter' : LEVELS[level]}</span>;
}

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.12}s`, background: COLORS[i % 5], transform: `rotate(${i * 29}deg)` }} />)}
    </div>
  );
}
