import BodyMap from '../components/BodyMap';
import { DateBar, Empty, Stat } from '../components/ui';
import { muscleName, partLabel } from '../data/exercises';
import { daySummary, entryStats, exMap, fmt, fmtInt, prsOn } from '../lib/calc';
import { useData } from '../lib/store';

export default function DayPage({ date, setDate, goLog }: { date: string; setDate: (d: string) => void; goLog: () => void }) {
  const data = useData();
  const s = daySummary(data, date);
  const m = exMap(data);
  const prs = prsOn(data, date).filter((p) => p.prev !== null);

  return (
    <div className="page">
      <header className="page-head"><h1>Day Summary</h1></header>
      <DateBar date={date} setDate={setDate} />

      {s.entries.length === 0 ? (
        <Empty icon="😴" title="No workout on this day" text="Rest days help you grow too. Log a workout to see your muscles light up.">
          <button className="btn primary" onClick={goLog}>Go to log</button>
        </Empty>
      ) : (
        <>
          <section className="card">
            <BodyMap primary={s.primary} secondary={s.secondary} />
            <div className="legend">
              <span><i className="dot pri" /> Main muscles</span>
              <span><i className="dot sec" /> Helper muscles</span>
            </div>
            <div className="chips">
              {[...s.primary].map((mu) => <span key={mu} className="chip pri">{muscleName(mu)}</span>)}
              {[...s.secondary].map((mu) => <span key={mu} className="chip sec">{muscleName(mu)}</span>)}
            </div>
          </section>

          {prs.length > 0 && (
            <section className="card celebrate">
              <div className="celebrate-icon">🏆</div>
              <div>
                <b>{prs.length === 1 ? 'New PR today!' : `${prs.length} new PRs today!`}</b>
                {prs.map((p) => { const ex = m.get(p.exId); return <div key={p.exId} className="small">{ex?.name}: {fmt(p.value)} {ex?.bw ? 'reps' : 'kg'} <span className="muted">(was {fmt(p.prev ?? 0)})</span></div>; })}
              </div>
            </section>
          )}

          <div className="stats4">
            <Stat label="Exercises" value={String(s.entries.length)} />
            <Stat label="Sets" value={String(s.sets)} />
            <Stat label="Reps" value={fmtInt(s.reps)} />
            <Stat label="Volume" value={s.volume >= 10000 ? fmt(s.volume / 1000, 1) + 'k' : fmtInt(s.volume)} unit="kg" />
          </div>

          <section className="card">
            <h2 className="card-title">Exercises</h2>
            <div className="table">
              <div className="tr th"><span>Exercise</span><span>Best set</span><span>Est. 1RM</span></div>
              {s.entries.map((en) => {
                const ex = m.get(en.exId); const st = entryStats(en);
                return (
                  <div className="tr" key={en.id}>
                    <span><b>{ex?.name}</b><small className="muted"> {ex ? partLabel(ex.part) : ''} · {st.sets} sets</small></span>
                    <span>{st.bestSet ? `${st.bestSet.w ? fmt(st.bestSet.w) + ' kg' : 'BW'} × ${st.bestSet.r}` : '–'}</span>
                    <span className="strong">{ex?.bw ? `${st.maxReps} reps` : `${fmt(st.best)} kg`}</span>
                  </div>
                );
              })}
            </div>
            <p className="muted small note">Est. 1RM is an estimate (Epley formula). Body weight moves show best reps.</p>
          </section>
        </>
      )}
    </div>
  );
}
