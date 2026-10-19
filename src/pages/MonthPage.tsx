import { exName, levelLabel, partLabelI18n, useI18n } from '../i18n';
import { useMemo, useState } from 'react';
import { buildMonthShare, renderShareCard, shareOrDownload } from '../lib/shareCard';
import { BarList, LineChart, MonthCalendar, type Series } from '../components/Charts';
import { PlanHint } from '../components/PlanHint';
import { PrTimelineList } from '../components/PrTimeline';
import { ShareStyleBar } from '../components/ShareStyleBar';
import { Segmented, Stat, toast } from '../components/ui';
import { BODY_PARTS, KEY_LIFTS, type BodyPart, type Muscle } from '../data/exercises';
import { bestByExercise, entryStats, exMap, fmt, fmtInt, formatMetric, LEVEL_COLORS, LEVELS, monthLiftDeltas, prTimeline, strengthResults } from '../lib/calc';
import { addDays, addMonths, daysInMonth, monthLabel, monthOf, monthShort, todayKey, weekKey, weeksInMonth } from '../lib/date';
import { SHARE_FOOTER } from '../lib/publicSite';
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
  const volumes = new Map<string, number>();
  const parts = new Map<BodyPart, { sets: number; volume: number }>();
  let sets = 0, reps = 0, volume = 0;
  for (const e of es) {
    const st = entryStats(e); sets += st.sets; reps += st.reps; volume += st.volume;
    days.set(e.date, (days.get(e.date) ?? 0) + st.sets);
    volumes.set(e.date, (volumes.get(e.date) ?? 0) + st.volume);
    const ex = m.get(e.exId);
    if (ex) { const p = parts.get(ex.part) ?? { sets: 0, volume: 0 }; p.sets += st.sets; p.volume += st.volume; parts.set(ex.part, p); }
  }
  return { es, days, volumes, parts, sets, reps, volume };
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
  const { t, locale, d } = useI18n();
  const [month, setMonth] = useState(monthOf(todayKey()));
  const [sharing, setSharing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [barMode, setBarMode] = useState<'sets' | 'volume'>('sets');
  const [heat, setHeat] = useState<'sets' | 'volume'>('sets');
  const [allTimeline, setAllTimeline] = useState(false);
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
    return { name: exName(m.get(id), locale) || id, color: COLORS[i % COLORS.length], points: [...best.entries()].map(([x, y]) => ({ x, y })) };
  });
  const toggle = (id: string) => setPicked((p) => { const s = p ?? sel; return s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-5); });

  const timeline = useMemo(() => prTimeline(data), [data]);
  const lifts = useMemo(() => monthLiftDeltas(data, month, 3), [data, month]);
  const nDays = cur.days.size, pDays = prev.days.size, diff = nDays - pDays;
  const streak = longestStreak([...cur.days.keys()]);
  const topPart = [...cur.parts.entries()].sort((a, b) => b[1].sets - a[1].sets)[0];

  const msgs: string[] = [];
  if (nDays === 0) msgs.push(t('monthMsg.none'));
  else {
    const dayWord = nDays === 1 ? t('monthMsg.day') : t('monthMsg.days');
    let extra = pDays === 0 ? t('monthMsg.greatStart') : diff > 0 ? t('monthMsg.moreThan', { diff }) : diff === 0 ? t('monthMsg.same') : t('monthMsg.lastWas', { p: pDays });
    msgs.push(t('monthMsg.trained', { n: nDays, dayWord }) + extra);
    if (cur.volume > 0) msgs.push(t('monthMsg.lifted', { kg: fmtInt(cur.volume), like: likeLifting(cur.volume) }));
    [...prs.out].sort((x, y) => Number(KEY_LIFTS.includes(y.exId)) - Number(KEY_LIFTS.includes(x.exId))).slice(0, 3).forEach((p) => {
      const ex = m.get(p.exId);
      const value = ex && (ex.tracking === 'duration' || ex.bw) ? (ex.tracking === 'duration' ? `${fmt(p.value, 0)}s` : `${fmt(p.value, 0)} reps`) : `${fmt(p.value)} kg`;
      msgs.push(t('monthMsg.newPr', { name: exName(ex, locale), value }));
    });
    if (prs.out.length > 3) msgs.push(t('monthMsg.manyPrs', { n: prs.out.length }));
    if (ups.length > 0 && ups.length <= 2) ups.forEach((u) => msgs.push(t('monthMsg.levelUp', { name: exName(u.ex, locale), level: levelLabel(u.name, d) })));
    if (ups.length > 2) msgs.push(t('monthMsg.manyLevels', { n: ups.length, list: ups.map((u) => `${exName(u.ex, locale)} (${levelLabel(u.name, d)})`).join(', ') }));
    if (streak >= 3) msgs.push(t('monthMsg.streak', { n: streak }));
    if (topPart) msgs.push(t('monthMsg.topPart', { part: partLabelI18n(topPart[0], locale, d), sets: topPart[1].sets }));
    if (prev.volume > 0 && cur.volume > prev.volume) msgs.push(t('monthMsg.volumeUp', { pct: Math.round(((cur.volume - prev.volume) / prev.volume) * 100) }));
  }

  const monthWeeks = weeksInMonth(month);
  const trainedWeekKeys = new Set([...cur.days.keys()].map(weekKey));
  const everyWeek = monthWeeks.length > 0 && monthWeeks.every((w) => trainedWeekKeys.has(w));
  const badges = [
    { icon: '👟', name: t('badges.first'), desc: t('badges.firstDesc'), ok: nDays >= 1 },
    { icon: '📆', name: t('badges.regular'), desc: t('badges.regularDesc'), ok: nDays >= 8 },
    { icon: '🔥', name: t('badges.fire'), desc: t('badges.fireDesc'), ok: nDays >= 12 },
    { icon: '🏆', name: t('badges.prHunter'), desc: t('badges.prHunterDesc'), ok: prs.out.length >= 1 },
    { icon: '💎', name: t('badges.prMachine'), desc: t('badges.prMachineDesc'), ok: prs.out.length >= 5 },
    { icon: '🐘', name: t('badges.heavy'), desc: t('badges.heavyDesc'), ok: cur.volume >= 50000 },
    { icon: '🧍', name: t('badges.full'), desc: t('badges.fullDesc'), ok: cur.parts.size >= 8 },
    { icon: '⭐', name: t('badges.levelUp'), desc: t('badges.levelUpDesc'), ok: ups.length > 0 },
    { icon: '🗓️', name: t('badges.everyWeek'), desc: t('badges.everyWeekDesc'), ok: everyWeek },
  ];
  const earned = badges.filter((b) => b.ok).length;

  const partItems = BODY_PARTS.filter((p) => cur.parts.has(p)).map((p) => ({ label: partLabelI18n(p, locale, d), value: barMode === 'sets' ? cur.parts.get(p)!.sets : cur.parts.get(p)!.volume, sub: barMode === 'sets' ? `${fmtInt(cur.parts.get(p)!.volume)} kg` : `${cur.parts.get(p)!.sets} sets`, color: PART_COLORS[p] }))
    .sort((a, b) => b.value - a.value);


  const doShare = async (send: boolean) => {
    setSharing(true);
    try {
      const primary = new Set<Muscle>();
      const secondary = new Set<Muscle>();
      for (const e of cur.es) {
        const ex = m.get(e.exId);
        if (!ex) continue;
        ex.primary.forEach((x) => primary.add(x));
        ex.secondary.forEach((x) => secondary.add(x));
      }
      primary.forEach((p) => secondary.delete(p));
      const lines = prs.out.slice(0, 8).map((p) => {
        const ex = m.get(p.exId);
        return { name: exName(ex, locale) || p.exId, detail: `${fmt(p.value)}`, pr: true };
      });
      if (!lines.length) {
        for (const [id, v] of [...bestByExercise(data, mStart, mEnd).entries()].slice(0, 8)) {
          lines.push({ name: exName(m.get(id), locale) || id, detail: `${fmt(v.value)}`, pr: false });
        }
      }
      const payload = buildMonthShare({
        title: t('share.title'),
        subtitle: t('brand.slogan'),
        dateLabel: monthLabel(month),
        days: nDays,
        sets: cur.sets,
        volume: cur.volume,
        lines,
        primary: [...primary],
        secondary: [...secondary],
        footer: SHARE_FOOTER,
        locale,
      });
      const style = data.settings.shareStyle;
      const blob = await renderShareCard(payload, style);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      if (send) {
        const mode = await shareOrDownload(blob, `gym-everyday-${month}-${style}.png`, t('month.share'));
        toast(mode === 'shared' ? '✓' : t('day.download'));
      }
    } catch {
      toast(t('day.shareFail'));
    } finally { setSharing(false); }
  };

  const tone = pDays === 0 && prev.volume === 0 ? 'new' : (cur.volume - prev.volume) + (nDays - pDays) * 500 > 0 ? 'up' : (cur.volume - prev.volume) + (nDays - pDays) * 500 < 0 ? 'down' : 'flat';
  const encourage = tone === 'new' ? t('compare.encourageNew') : tone === 'up' ? t('compare.encourageUp') : tone === 'down' ? t('compare.encourageDown') : t('compare.encourageFlat');
  const cmp = (now: number, before: number) => {
    if (before <= 0 && now <= 0) return t('compare.flat');
    if (before <= 0) return t('compare.fresh');
    const d = now - before;
    if (d === 0) return t('compare.flat');
    const pct = Math.round((Math.abs(d) / before) * 100);
    return d > 0 ? t('compare.up', { n: fmtInt(d), pct }) : t('compare.down', { n: fmtInt(Math.abs(d)), pct });
  };
  const shownTimeline = allTimeline ? timeline : timeline.slice(0, 6);

  return (
    <div className="page">
      <header className="page-head"><h1>{t('month.title')}</h1></header>
      <div className="datebar">
        <button className="icon-btn" aria-label="Previous month" onClick={() => { setMonth(addMonths(month, -1)); setPicked(null); }}>‹</button>
        <div className="datebar-mid static"><span className="datebar-label">{monthLabel(month)}</span></div>
        <button className="icon-btn" aria-label="Next month" onClick={() => { setMonth(addMonths(month, 1)); setPicked(null); }}>›</button>
      </div>
      <div className="share-tools">
        <ShareStyleBar />
        <div className="row gap">
          <button className="btn ghost grow" disabled={sharing || nDays === 0} onClick={() => doShare(false)}>{t('share.preview')}</button>
          <button className="btn primary grow" disabled={sharing || nDays === 0} onClick={() => doShare(true)}>{t('month.share')}</button>
        </div>
      </div>
      {month === monthOf(todayKey()) && <PlanHint date={todayKey()} />}

      {streak >= 2 && (
        <div className="streak-banner">
          <div className="n">{streak}</div>
          <div><b>{locale === 'zh-TW' ? '最長連續' : 'Best streak'}</b><div className="small muted">{locale === 'zh-TW' ? '本月連續訓練天數' : 'days in a row this month'}</div></div>
        </div>
      )}
      <section className={`card hero ${prs.out.length ? 'party' : ''}`}>
        {prs.out.length > 0 && <Confetti />}
        <div className="hero-num">{nDays}</div>
        <div className="hero-text"><b>{nDays === 1 ? t('month.workoutDay') : t('month.workoutDays')}</b><span className="muted">{pDays ? `${monthShort(addMonths(month, -1))}: ${pDays} days` : 'in ' + monthShort(month)}</span></div>
        <div className="hero-badges">{earned} / {badges.length} badges</div>
      </section>

      <div className="stats4">
        <Stat label={t('month.days')} value={String(nDays)} delta={pDays ? diff : null} />
        <Stat label={t('month.sets')} value={fmtInt(cur.sets)} delta={prev.sets ? cur.sets - prev.sets : null} />
        <Stat label={t('month.reps')} value={fmtInt(cur.reps)} delta={prev.reps ? cur.reps - prev.reps : null} />
        <Stat label={t('month.volume')} value={cur.volume >= 10000 ? fmt(cur.volume / 1000, 1) + 'k' : fmtInt(cur.volume)} unit="kg" />
      </div>

      <section className="card compare">
        <h2 className="card-title">{t('compare.title')}</h2>
        <div className="compare-grid">
          <div className="compare-card">
            <div className="stat-label">{t('compare.sessions')}</div>
            <div className="n">{nDays}</div>
            <div className={`delta ${nDays > pDays ? 'up' : nDays < pDays ? 'down' : ''}`}>{cmp(nDays, pDays)}</div>
          </div>
          <div className="compare-card">
            <div className="stat-label">{t('compare.volume')}</div>
            <div className="n">{cur.volume >= 10000 ? fmt(cur.volume / 1000, 1) + 'k' : fmtInt(cur.volume)}</div>
            <div className={`delta ${cur.volume < prev.volume ? 'down' : cur.volume > prev.volume ? 'up' : ''}`}>{cmp(cur.volume, prev.volume)}</div>
          </div>
        </div>
        <h3 className="compare-sub">{t('compare.topLifts')}</h3>
        {lifts.length ? (
          <div className="lift-deltas">
            {lifts.map((row) => {
              const ex = m.get(row.exId);
              const name = exName(ex, locale);
              const delta = row.prev == null ? null : row.value - row.prev;
              const deltaText = delta == null ? '' : formatMetric(ex, Math.abs(delta));
              const line = delta == null
                ? t('compare.newLift', { name })
                : delta > 0 ? t('compare.liftUp', { name, delta: deltaText })
                : delta < 0 ? t('compare.liftDown', { name, delta: deltaText })
                : t('compare.liftFlat', { name });
              return (
                <div className="lift-delta" key={row.exId}>
                  <div className="grow">
                    <b>{exName(ex, locale)}</b>
                    <div className="small muted">{line}</div>
                  </div>
                  <div className="lift-nums">
                    <b className={delta != null && delta > 0 ? 'accent' : ''}>{formatMetric(ex, row.value)}</b>
                    {row.prev != null && <div className="small muted">{formatMetric(ex, row.prev)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="muted small">{t('compare.none')}</p>}
        <p className="compare-note">{encourage}</p>
      </section>

      <section className="card msgs">
        {msgs.map((t, i) => <p key={i} className="msg">{t}</p>)}
      </section>

      <section className="card">
        <h2 className="card-title">{t('month.badges')}</h2>
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
        <div className="card-title-row">
          <h2 className="card-title">{t('month.trainingDays')}</h2>
          <Segmented value={heat} onChange={setHeat} options={[{ v: 'sets', label: t('month.heatSets') }, { v: 'volume', label: t('month.heatVolume') }]} />
        </div>
        <MonthCalendar month={month} values={heat === 'sets' ? cur.days : cur.volumes} mode={heat} onPick={openDay} />
        <div className="legend"><span className="muted small">{t('month.heatQuiet')}</span><i className="sq l0" /><i className="sq l1" /><i className="sq l2" /><i className="sq l3" /><i className="sq l4" /><span className="muted small">{t('month.heatHot')}</span></div>
      </section>

      <section className="card">
        <div className="card-title-row">
          <h2 className="card-title">{t('month.bodyParts')}</h2>
          <Segmented value={barMode} onChange={setBarMode} options={[{ v: 'sets', label: 'Sets' }, { v: 'volume', label: 'Volume' }]} />
        </div>
        {partItems.length ? <BarList items={partItems} unit={barMode === 'sets' ? 'sets' : 'kg'} /> : <p className="muted">{t('month.noData')}</p>}
      </section>

      <section className="card">
        <div className="card-title-row">
          <h2 className="card-title">{t('month.progress')}</h2>
          <Segmented value={range} onChange={setRange} options={[{ v: 'month', label: '1M' }, { v: '3m', label: '3M' }, { v: 'all', label: 'All' }]} />
        </div>
        {chartable.length ? (
          <>
            <div className="chips scroll">
              {chartable.slice(0, 14).map((id) => {
                const i = sel.indexOf(id);
                return <button key={id} className={`chip toggle ${i >= 0 ? 'on' : ''}`} style={i >= 0 ? { borderColor: COLORS[i % 5], color: COLORS[i % 5] } : undefined} onClick={() => toggle(id)}>{exName(m.get(id), locale)}</button>;
              })}
            </div>
            <LineChart series={series} unit="kg" from={chartFrom} to={chartTo} />
            <div className="legend wrap">{series.map((s) => <span key={s.name}><i className="dot" style={{ background: s.color }} /> {s.name}</span>)}</div>
          </>
        ) : <p className="muted">Log weighted exercises to see a chart.</p>}
      </section>

      <section className="card">
        <h2 className="card-title">{t('month.prTimeline')} {timeline.length > 0 && <span className="pill gold">{timeline.length}</span>}</h2>
        <PrTimelineList events={shownTimeline} />
        {timeline.length > 6 && <button className="btn ghost small" onClick={() => setAllTimeline(!allTimeline)}>{allTimeline ? t('profile.showLess') : t('profile.showAllPrs', { n: timeline.length })}</button>}
      </section>

      <section className="card">
        <h2 className="card-title">{t('month.newPrs')} {prs.out.length > 0 && <span className="pill gold">{prs.out.length}</span>}</h2>
        {prs.out.length ? (
          <div className="pr-list">
            {(allPrs ? prs.out : prs.out.slice(0, 5)).map((p) => { const ex = m.get(p.exId); const u = ex?.bw ? 'reps' : 'kg'; return (
              <div className="pr-item" key={p.exId}>
                <span className="pr-medal">🏅</span>
                <span className="grow"><b>{exName(ex, locale)}</b><small className="muted"> {fmt(p.prev)} → </small><b className="accent">{fmt(p.value)} {u}</b></span>
                <span className="pill up">+{fmt(p.value - p.prev)}</span>
              </div>); })}
            {prs.out.length > 5 && <button className="btn ghost small" onClick={() => setAllPrs(!allPrs)}>{allPrs ? 'Show less' : `Show all ${prs.out.length} PRs`}</button>}
          </div>
        ) : <p className="muted">{prs.firsts.length ? 'No PRs yet — you tried new exercises. Next month, beat them!' : 'No new PRs this month. Keep pushing!'}</p>}
        {prs.firsts.length > 0 && <p className="small muted">New exercises tried: {prs.firsts.map((id) => m.get(id)?.name).join(', ')}</p>}
        <p className="small muted">PR = best est. 1RM (or most reps for body weight moves).</p>
      </section>

      <section className="card">
        <h2 className="card-title">{t('month.levels')}</h2>
        {!levels ? <p className="muted">Add your body weight in Profile to see levels.</p> : levels.length === 0 ? <p className="muted">Log key lifts (bench, squat, deadlift…) to see levels.</p> : (
          <div className="lvl-list">
            {(allLvls ? levels : levels.filter((l) => (l.from !== null && l.to > l.from) || KEY_LIFTS.includes(l.ex.id))).map((l) => (
              <div className="lvl-change" key={l.ex.id}>
                <span className="grow">{exName(l.ex, locale)}</span>
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
      {previewUrl && (
        <section className="card share-preview-wrap">
          <h2 className="card-title">{t('month.share')}</h2>
          <img src={previewUrl} alt="Share card preview" />
        </section>
      )}
    </div>
  );
}

export function LevelTag({ level }: { level: number }) {
  const { d } = useI18n();
  return <span className="lvl-tag" style={{ background: level < 0 ? 'var(--line)' : LEVEL_COLORS[level] }}>{level < 0 ? levelLabel('Starter', d) : levelLabel(LEVELS[level], d)}</span>;
}

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.12}s`, background: COLORS[i % 5], transform: `rotate(${i * 29}deg)` }} />)}
    </div>
  );
}
