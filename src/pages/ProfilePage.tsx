import { Fragment, useRef, useState } from 'react';
import { Sparkline } from '../components/Charts';
import { confirmDialog, NumberField, Segmented, toast } from '../components/ui';
import { KEY_LIFTS } from '../data/exercises';
import { fmt, LEVEL_COLORS, LEVELS, strengthResults } from '../lib/calc';
import { shortDate, todayKey } from '../lib/date';
import { makeDemo } from '../lib/demo';
import { PHOTO_CREDIT, PHOTO_CREDIT_URL } from '../data/images';
import { actions, normalize, useData, type Theme } from '../lib/store';

export default function ProfilePage() {
  const data = useData();
  const p = data.profile;
  const [wDate, setWDate] = useState(todayKey());
  const [wKg, setWKg] = useState<number | null>(null);
  const [moreLifts, setMoreLifts] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bmi = p.heightCm && p.weightKg ? p.weightKg / (p.heightCm / 100) ** 2 : null;
  const results = strengthResults(data, KEY_LIFTS);
  const order = (id: string) => { const i = KEY_LIFTS.indexOf(id); return i < 0 ? 100 : i; };
  results.sort((a, b) => order(a.ex.id) - order(b.ex.id) || (b.info?.score ?? -1) - (a.info?.score ?? -1));

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `fitness-backup-${todayKey()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Backup file saved ✓');
  };
  const importData = async (f: File) => {
    try {
      const d = normalize(JSON.parse(await f.text()));
      if (await confirmDialog(`This file has ${d.entries.length} exercise logs. Replace ALL data on this phone with it?`, { title: 'Import backup', ok: 'Replace' })) { actions.replaceAll(d); toast('Backup loaded ✓'); }
    } catch (e) { toast('❌ ' + (e instanceof Error ? e.message : 'Could not read file.')); }
  };

  return (
    <div className="page">
      <header className="page-head"><h1>Profile</h1></header>

      <section className="card">
        <h2 className="card-title">About you</h2>
        <label className="field"><span className="field-label">Name</span><input value={p.name} placeholder="Your name" onChange={(e) => actions.setProfile({ name: e.target.value })} /></label>
        <div className="field"><span className="field-label">Sex (for strength standards)</span>
          <Segmented value={p.sex} onChange={(v) => actions.setProfile({ sex: v })} options={[{ v: 'male', label: 'Male' }, { v: 'female', label: 'Female' }]} />
        </div>
        <div className="grid3">
          <NumberField label="Age" value={p.age} onChange={(v) => actions.setProfile({ age: v })} suffix="yr" />
          <NumberField label="Height" value={p.heightCm} onChange={(v) => actions.setProfile({ heightCm: v })} suffix="cm" />
          <NumberField label="Weight" value={p.weightKg} onChange={(v) => actions.setProfile({ weightKg: v })} suffix="kg" />
        </div>
        {bmi && <p className="small muted">BMI: <b>{fmt(bmi)}</b> (a rough guide only)</p>}
      </section>

      <section className="card">
        <h2 className="card-title">Body weight history</h2>
        <div className="row gap wrap-row">
          <input type="date" value={wDate} onChange={(e) => setWDate(e.target.value)} aria-label="Weight date" className="grow" />
          <NumberField value={wKg} onChange={setWKg} placeholder="kg" suffix="kg" className="w90" />
          <button className="btn primary" disabled={!wKg} onClick={() => { if (wKg) { actions.addWeight({ date: wDate, kg: wKg }); setWKg(null); toast('Weight saved ✓'); } }}>Add</button>
        </div>
        {data.weights.length >= 2 && <Sparkline points={data.weights.map((w) => ({ x: w.date, y: w.kg }))} />}
        {data.weights.length > 0 ? (
          <div className="weights">
            {[...data.weights].reverse().slice(0, 8).map((w) => (
              <div className="weight-row" key={w.date}>
                <span>{shortDate(w.date)} <span className="muted small">{w.date.slice(0, 4)}</span></span><b>{fmt(w.kg)} kg</b>
                <button className="icon-btn small" aria-label="Delete weight" onClick={() => actions.deleteWeight(w.date)}>✕</button>
              </div>
            ))}
          </div>
        ) : <p className="muted small">No weights yet. Adding one also updates your weight above.</p>}
      </section>

      <section className="card" id="standards">
        <h2 className="card-title">Strength standards</h2>
        {!p.weightKg ? <p className="warn">Please enter your body weight above to see your levels.</p> : (
          <p className="small muted">For a {p.sex} lifter at {fmt(p.weightKg)} kg. Uses your best est. 1RM (body weight moves: best reps in one set). Dumbbell lifts: weight of one dumbbell.</p>
        )}
        <div className="lvl-scale">{LEVELS.map((l, i) => <span key={l} style={{ color: LEVEL_COLORS[i] }}>{l}</span>)}</div>
        <details className="small">
          <summary className="muted">What do the levels mean?</summary>
          <div className="lvl-help">
            {['5%', '20%', '50%', '80%', '95%'].map((pc, i) => <Fragment key={pc}><b style={{ color: LEVEL_COLORS[i] }}>{LEVELS[i]}</b><span>Stronger than {pc} of lifters</span></Fragment>)}
          </div>
        </details>
        <div className="list">
          {results.filter((r) => moreLifts || KEY_LIFTS.includes(r.ex.id)).map((r) => <StrengthCard key={r.ex.id} r={r} />)}
          {results.length > KEY_LIFTS.length && (
            <button className="btn ghost" onClick={() => setMoreLifts(!moreLifts)}>{moreLifts ? 'Show key lifts only' : `Show ${results.length - KEY_LIFTS.length} more lifts you did`}</button>
          )}
        </div>
        <p className="small muted note">Standards based on strengthlevel.com data (by body weight and sex). Est. 1RM is an estimate.</p>
      </section>

      <section className="card">
        <h2 className="card-title">Look</h2>
        <Segmented value={data.settings.theme} onChange={(v: Theme) => actions.setTheme(v)} options={[{ v: 'auto', label: 'Auto' }, { v: 'dark', label: 'Dark' }, { v: 'light', label: 'Light' }]} />
      </section>

      <section className="card">
        <h2 className="card-title">Your data</h2>
        <p className="small muted">All data stays in this browser on this phone. Save a backup file sometimes!</p>
        <div className="stack">
          <button className="btn ghost big" onClick={exportData}>⬇️ Export backup (JSON)</button>
          <button className="btn ghost big" onClick={() => fileRef.current?.click()}>⬆️ Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ''; }} />
          <button className="btn ghost big" onClick={async () => {
            const has = data.entries.length > 0;
            if (await confirmDialog(has ? 'Load demo data? This will REPLACE your data with 6 weeks of sample workouts.' : 'Load 6 weeks of sample workouts so you can try the charts?', { title: 'Load demo data', ok: 'Load demo', danger: has })) {
              actions.replaceAll({ ...makeDemo(), settings: data.settings }); toast('Demo data loaded ✓');
            }
          }}>🧪 Load demo data</button>
          <button className="btn danger big" onClick={async () => {
            if (await confirmDialog('Delete ALL workouts, profile and custom exercises? This cannot be undone.', { title: 'Clear all data', ok: 'Delete all', danger: true })) { actions.clearAll(); toast('All data cleared'); }
          }}>🗑️ Clear all data</button>
        </div>
      </section>
      <section className="card">
        <h2 className="card-title">About</h2>
        <p className="small muted">Strength standards based on strengthlevel.com data.</p>
        <p className="small muted">{PHOTO_CREDIT} <a href={PHOTO_CREDIT_URL} target="_blank" rel="noopener noreferrer">github.com/yuhonas/free-exercise-db</a>. Equipment icons and body map drawn for this app.</p>
      </section>
      <p className="center-text small muted">Fitness Log · made for Janson 🇭🇰</p>
    </div>
  );
}

type R = ReturnType<typeof strengthResults>[number];
function StrengthCard({ r }: { r: R }) {
  const [open, setOpen] = useState(false);
  const unit = r.std.kind === 'reps' ? 'reps' : 'kg';
  const info = r.info;
  const pos = info ? (info.level < 0 ? 0.01 : Math.min(1, (info.level + info.progress) / 5)) : 0;
  return (
    <button className="card inner lvl" onClick={() => setOpen(!open)} aria-expanded={open}>
      <div className="lvl-top">
        <div className="grow">
          <div className="entry-name">{r.ex.name}</div>
          <div className="muted small">{r.best !== null ? <>Your best: <b className="fg">{fmt(r.best)} {unit}</b>{unit === 'kg' && ' (est. 1RM)'}</> : 'No data yet — log this lift'}</div>
        </div>
        {info && <span className="lvl-tag" style={{ background: info.level < 0 ? 'var(--line)' : LEVEL_COLORS[info.level] }}>{info.name}</span>}
      </div>
      {r.th && (
        <>
          <div className="scale">
            {LEVEL_COLORS.map((c, i) => <span key={i} style={{ background: c, opacity: info && info.level >= i ? 1 : 0.28 }} />)}
            {info && <i className="marker" style={{ left: `${pos * 100}%` }} />}
          </div>
          {info && (info.next !== null ? (
            <div className="small next">
              <span><b>{fmt(info.toNext)} {unit}</b> more to <b style={{ color: LEVEL_COLORS[info.level + 1] }}>{info.nextName}</b></span>
              <span className="muted">{Math.round(info.progress * 100)}%</span>
            </div>
          ) : <div className="small next">🏅 Top level! Amazing.</div>)}
          {open && (
            <div className="th-row">
              {r.th.map((v, i) => <div key={i}><span style={{ color: LEVEL_COLORS[i] }}>{LEVELS[i]}</span><b>{fmt(v, 0)}</b></div>)}
            </div>
          )}
        </>
      )}
    </button>
  );
}
