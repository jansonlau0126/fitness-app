import { useMemo, useState } from 'react';
import { BODY_PARTS, partLabel, type BodyPart, type Exercise } from '../data/exercises';
import { equipName } from '../data/equipment';
import { actions, uid, useData, type LogEntry, type SetEntry } from '../lib/store';
import { allExercises, bestByExercise, e1rm, entriesOn, entryStats, exMap, fmt, fmtInt, metricOf } from '../lib/calc';
import { addDays, shortDate } from '../lib/date';
import { confirmDialog, DateBar, Empty, NumberField, Sheet, toast } from '../components/ui';

export default function LogPage({ date, setDate, goSummary }: { date: string; setDate: (d: string) => void; goSummary: () => void }) {
  const data = useData();
  const entries = entriesOn(data, date);
  const m = exMap(data);
  const [editing, setEditing] = useState<LogEntry | 'new' | null>(null);
  const before = useMemo(() => bestByExercise(data, '0000-00-00', addDays(date, -1)), [data, date]);
  const totals = entries.reduce((a, e) => { const s = entryStats(e); return { sets: a.sets + s.sets, volume: a.volume + s.volume }; }, { sets: 0, volume: 0 });

  return (
    <div className="page">
      <header className="page-head">
        <h1>Workout Log</h1>
        {entries.length > 0 && <span className="pill">{entries.length} exercises · {totals.sets} sets</span>}
      </header>
      <DateBar date={date} setDate={setDate} />

      {entries.length === 0 ? (
        <Empty icon="💪" title="No exercises yet" text="Tap “Add exercise” to log your workout for this day." />
      ) : (
        <div className="list">
          {entries.map((en) => {
            const ex = m.get(en.exId); const st = entryStats(en);
            const v = metricOf(ex, st); const prev = before.get(en.exId)?.value;
            const isPR = v > 0 && (prev === undefined || v > prev) ;
            return (
              <button className="card entry" key={en.id} onClick={() => setEditing(en)}>
                <div className="entry-top">
                  <div>
                    <div className="entry-name">{ex?.name ?? 'Unknown exercise'}</div>
                    <div className="muted small">{ex ? partLabel(ex.part) : ''} · {st.sets} {st.sets === 1 ? 'set' : 'sets'} · {st.reps} reps{st.volume > 0 && ` · ${fmtInt(st.volume)} kg`}</div>
                  </div>
                  {isPR && prev !== undefined && <span className="badge pr">🏆 PR</span>}
                </div>
                <div className="set-chips">
                  {en.sets.map((s, i) => <span className="set-chip" key={i}><b>{s.w ? fmt(s.w) : ex?.bw ? 'BW' : 0}</b>{s.w || !ex?.bw ? ' kg' : ''} × {s.r}</span>)}
                </div>
                <div className="entry-best">
                  <span>{ex?.bw ? <>Best set: <b>{st.maxReps} reps</b></> : <>Best est. 1RM: <b>{fmt(st.best)} kg</b></>}</span>
                  <span className="muted small edit-hint">Tap to edit</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="stack">
        <button className="btn primary big" onClick={() => setEditing('new')}>＋ Add exercise</button>
        {entries.length > 0 && <button className="btn ghost big" onClick={goSummary}>See day summary →</button>}
      </div>

      {editing && <EntryEditor key={editing === 'new' ? 'new' : editing.id} entry={editing === 'new' ? null : editing} date={date} onClose={() => setEditing(null)} />}
    </div>
  );
}

function lastTime(entries: LogEntry[], exId: string, date: string, exceptId?: string) {
  let best: LogEntry | null = null;
  for (const e of entries) if (e.exId === exId && e.id !== exceptId && e.date < date && (!best || e.date > best.date)) best = e;
  return best;
}

export function EntryEditor({ entry, date, onClose, presetEx }: { entry: LogEntry | null; date: string; onClose: () => void; presetEx?: string }) {
  const data = useData();
  const all = allExercises(data);
  const m = exMap(data);
  const initEx = entry ? m.get(entry.exId) : presetEx ? m.get(presetEx) : undefined;
  const [part, setPart] = useState<BodyPart | ''>(initEx?.part ?? '');
  const [exId, setExId] = useState<string>(initEx?.id ?? '');
  const [sets, setSets] = useState<{ w: number | null; r: number | null }[]>(entry ? entry.sets.map((s) => ({ ...s })) : [{ w: null, r: null }]);
  const ex: Exercise | undefined = m.get(exId);
  const list = all.filter((e) => e.part === part).sort((a, b) => a.name.localeCompare(b.name));
  const last = exId ? lastTime(data.entries, exId, date, entry?.id) : null;

  const pickEx = (id: string) => {
    setExId(id);
    if (!entry) {
      const lt = lastTime(data.entries, id, date);
      const e = m.get(id);
      if (lt && sets.every((s) => s.w === null && s.r === null)) setSets(lt.sets.map((s) => ({ ...s })));
      else if (e?.bw && sets.length === 1 && sets[0].w === null) setSets([{ w: 0, r: sets[0].r }]);
    }
  };
  const upd = (i: number, k: 'w' | 'r', v: number | null) => setSets((s) => s.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const addSet = () => setSets((s) => [...s, { ...(s[s.length - 1] ?? { w: ex?.bw ? 0 : null, r: null }) }]);
  const removeSet = (i: number) => setSets((s) => (s.length > 1 ? s.filter((_, j) => j !== i) : s));
  const clean: SetEntry[] = sets.filter((s) => (s.r ?? 0) > 0).map((s) => ({ w: Math.max(0, s.w ?? 0), r: Math.round(s.r ?? 0) }));
  const canSave = !!ex && clean.length > 0;

  const save = () => {
    if (!canSave || !ex) return;
    const before = bestByExercise(data, '0000-00-00', addDays(date, -1)).get(ex.id)?.value;
    const en: LogEntry = { id: entry?.id ?? uid(), date, exId: ex.id, sets: clean, t: entry?.t ?? Date.now() };
    actions.saveEntry(en);
    const v = metricOf(ex, entryStats(en));
    if (before !== undefined && v > before) toast(`🏆 New PR! ${ex.name}: ${fmt(v)} ${ex.bw ? 'reps' : 'kg (est. 1RM)'}`);
    else toast(entry ? 'Saved ✓' : 'Added ✓');
    onClose();
  };
  const del = async () => {
    if (!entry) return;
    if (await confirmDialog(`Delete ${ex?.name ?? 'this exercise'} from this day?`, { ok: 'Delete', danger: true })) { actions.deleteEntry(entry.id); toast('Deleted'); onClose(); }
  };

  return (
    <Sheet title={entry ? 'Edit exercise' : 'Add exercise'} onClose={onClose} footer={
      <div className="row gap">
        {entry && <button className="btn danger ghost" onClick={del}>Delete</button>}
        <button className="btn primary grow big" disabled={!canSave} onClick={save}>{entry ? 'Save' : 'Add to log'}</button>
      </div>
    }>
      <label className="field">
        <span className="field-label">1. Body part</span>
        <select value={part} onChange={(e) => { setPart(e.target.value as BodyPart); setExId(''); }}>
          <option value="" disabled>Choose body part…</option>
          {BODY_PARTS.map((p) => <option key={p} value={p}>{partLabel(p)}</option>)}
        </select>
      </label>
      <label className="field">
        <span className="field-label">2. Exercise</span>
        <select value={exId} disabled={!part} onChange={(e) => pickEx(e.target.value)}>
          <option value="" disabled>{part ? 'Choose exercise…' : 'Pick a body part first'}</option>
          {list.map((e) => <option key={e.id} value={e.id}>{e.name}{e.custom ? ' (my)' : ''}</option>)}
        </select>
      </label>
      {ex && (
        <div className="hint">
          <span>🧰 {equipName(ex.equipment)}</span>
          {ex.bw && <span>Body weight move: put 0 kg, or extra kg you add.</span>}
          {ex.equipment === 'dumbbell' && <span>Put the weight of ONE dumbbell.</span>}
          {last && <span>Last time ({shortDate(last.date)}): {last.sets.map((s) => `${s.w ? fmt(s.w) + '×' : ''}${s.r}`).join(', ')}</span>}
        </div>
      )}

      <div className="sets-head">
        <h3>3. Sets <span className="pill">{sets.length}</span></h3>
        <span className="muted small">{ex?.bw ? 'Best reps' : 'Est. 1RM'}</span>
      </div>
      <div className="sets">
        <div className="set-row head"><span>#</span><span>{ex?.bw ? '+kg' : 'kg'}</span><span>Reps</span><span /><span /></div>
        {sets.map((s, i) => {
          const est = e1rm(s.w ?? 0, s.r ?? 0);
          return (
            <div className="set-row" key={i}>
              <span className="set-no">{i + 1}</span>
              <NumberField value={s.w} onChange={(v) => upd(i, 'w', v)} placeholder="0" />
              <NumberField value={s.r} onChange={(v) => upd(i, 'r', v)} placeholder="0" />
              <span className="set-est">{ex?.bw ? (s.r ? `${s.r}` : '–') : est ? fmt(est) : '–'}</span>
              <button className="icon-btn small" aria-label={`Remove set ${i + 1}`} disabled={sets.length === 1} onClick={() => removeSet(i)}>✕</button>
            </div>
          );
        })}
      </div>
      <button className="btn ghost wide" onClick={addSet}>＋ Add set</button>
      <p className="muted small note">Est. 1RM = estimated one-rep max (Epley formula: kg × (1 + reps ÷ 30)). It is a guess, not a real test.</p>
    </Sheet>
  );
}
