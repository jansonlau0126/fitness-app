import { useMemo, useState } from 'react';
import BodyMap from '../components/BodyMap';
import { confirmDialog, Segmented, Sheet, toast } from '../components/ui';
import { BODY_PARTS, MUSCLES, muscleName, PART_MUSCLE, partLabel, type BodyPart, type EquipId, type Exercise, type Muscle } from '../data/exercises';
import { EQUIPMENT, equipName } from '../data/equipment';
import { allExercises, bestByExercise, fmt } from '../lib/calc';
import { actions, useData } from '../lib/store';

export default function LibraryPage({ onLog }: { onLog: (exId: string) => void }) {
  const data = useData();
  const [tab, setTab] = useState<'ex' | 'eq'>('ex');
  const [q, setQ] = useState('');
  const [part, setPart] = useState<BodyPart | ''>('');
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const all = allExercises(data);
  const best = useMemo(() => bestByExercise(data), [data]);
  const ql = q.trim().toLowerCase();
  const list = all.filter((e) => (!part || e.part === part) && (!ql || e.name.toLowerCase().includes(ql) || e.primary.some((m) => muscleName(m).toLowerCase().includes(ql)) || equipName(e.equipment).toLowerCase().includes(ql)));
  const groups = BODY_PARTS.map((p) => ({ p, items: list.filter((e) => e.part === p).sort((a, b) => a.name.localeCompare(b.name)) })).filter((g) => g.items.length);

  return (
    <div className="page">
      <header className="page-head"><h1>Library</h1><span className="pill">{all.length} exercises</span></header>
      <Segmented value={tab} onChange={setTab} options={[{ v: 'ex', label: 'Exercises' }, { v: 'eq', label: 'Equipment' }]} />

      {tab === 'ex' ? (
        <>
          <div className="filters">
            <input className="search" type="search" placeholder="Search: name, muscle, tool…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select value={part} onChange={(e) => setPart(e.target.value as BodyPart | '')} aria-label="Body part filter">
              <option value="">All parts</option>
              {BODY_PARTS.map((p) => <option key={p} value={p}>{partLabel(p)}</option>)}
            </select>
          </div>
          <button className="btn ghost wide" onClick={() => setAdding(true)}>＋ Add my own exercise</button>
          {groups.length === 0 && <p className="muted center-text">No exercises found.</p>}
          {groups.map((g) => (
            <section key={g.p}>
              <h2 className="group-title">{partLabel(g.p)} <span className="muted">{g.items.length}</span></h2>
              <div className="list">
                {g.items.map((e) => {
                  const isOpen = open === e.id; const b = best.get(e.id);
                  return (
                    <div className={`card ex ${isOpen ? 'open' : ''}`} key={e.id}>
                      <button className="ex-head" onClick={() => setOpen(isOpen ? null : e.id)} aria-expanded={isOpen}>
                        <div className="grow">
                          <div className="entry-name">{e.name} {e.custom && <span className="pill">my</span>}</div>
                          <div className="muted small">{e.primary.map(muscleName).join(', ')} · {equipName(e.equipment)}</div>
                        </div>
                        {b && <span className="pill">{fmt(b.value)} {e.bw ? 'reps' : 'kg'}</span>}
                        <span className="chev">{isOpen ? '▴' : '▾'}</span>
                      </button>
                      {isOpen && <ExDetail e={e} onLog={() => onLog(e.id)} />}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      ) : (
        <div className="list">
          <p className="muted small">Basic gym tools, in simple words.</p>
          {EQUIPMENT.map((q) => (
            <div className="card eq" key={q.id}>
              <div className="eq-icon">{q.icon}</div>
              <div className="grow">
                <h3>{q.name}</h3>
                {q.text.map((t, i) => <p key={i}>{t}</p>)}
                {q.tip && <p className="tip">💡 {q.tip}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {adding && <CustomForm onClose={() => setAdding(false)} />}
    </div>
  );
}

function ExDetail({ e, onLog }: { e: Exercise; onLog: () => void }) {
  return (
    <div className="ex-body">
      <div className="ex-grid">
        <div className="mini-map"><BodyMap primary={new Set(e.primary)} secondary={new Set(e.secondary)} /></div>
        <div>
          <div className="field-label">Main</div>
          <div className="chips">{e.primary.map((m) => <span key={m} className="chip pri">{muscleName(m)}</span>)}</div>
          {e.secondary.length > 0 && <><div className="field-label">Helpers</div><div className="chips">{e.secondary.map((m) => <span key={m} className="chip sec">{muscleName(m)}</span>)}</div></>}
          <div className="field-label">Tool</div>
          <div className="small">{equipName(e.equipment)}{e.bw ? ' (body weight)' : ''}</div>
        </div>
      </div>
      <div className="field-label">How to do it</div>
      <ol className="how">{e.how.map((h, i) => <li key={i}>{h}</li>)}</ol>
      {e.std && <p className="small muted">📊 Has strength standards (see Profile).</p>}
      <div className="row gap">
        <button className="btn primary grow" onClick={onLog}>Log this today</button>
        {e.custom && <button className="btn danger ghost" onClick={async () => {
          if (await confirmDialog(`Delete "${e.name}"? Logs with this exercise will also be deleted.`, { ok: 'Delete', danger: true })) { actions.deleteCustom(e.id); toast('Deleted'); }
        }}>Delete</button>}
      </div>
    </div>
  );
}

function CustomForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [part, setPart] = useState<BodyPart>('Chest');
  const [primary, setPrimary] = useState<Muscle[]>(['chest']);
  const [secondary, setSecondary] = useState<Muscle[]>([]);
  const [equip, setEquip] = useState<EquipId>('dumbbell');
  const [how, setHow] = useState('');
  const [bw, setBw] = useState(false);
  const tog = (arr: Muscle[], set: (m: Muscle[]) => void, m: Muscle) => set(arr.includes(m) ? arr.filter((x) => x !== m) : [...arr, m]);
  const ok = name.trim().length > 1 && primary.length > 0;
  const save = () => {
    const id = 'my-' + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
    actions.addCustom({ id, name: name.trim(), part, primary, secondary: secondary.filter((m) => !primary.includes(m)), equipment: equip, how: how.split('\n').map((s) => s.trim()).filter(Boolean), bw, custom: true });
    toast('Exercise added ✓'); onClose();
  };
  return (
    <Sheet title="Add my own exercise" onClose={onClose} footer={<button className="btn primary big wide" disabled={!ok} onClick={save}>Save exercise</button>}>
      <label className="field"><span className="field-label">Name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cable Y Raise" /></label>
      <label className="field"><span className="field-label">Body part</span>
        <select value={part} onChange={(e) => { const p = e.target.value as BodyPart; setPart(p); setPrimary([PART_MUSCLE[p]]); }}>
          {BODY_PARTS.map((p) => <option key={p} value={p}>{partLabel(p)}</option>)}
        </select>
      </label>
      <div className="field"><span className="field-label">Main muscles</span>
        <div className="chips">{MUSCLES.map((m) => <button key={m.id} className={`chip toggle ${primary.includes(m.id) ? 'on pri' : ''}`} onClick={() => tog(primary, setPrimary, m.id)}>{m.name}</button>)}</div>
      </div>
      <div className="field"><span className="field-label">Helper muscles</span>
        <div className="chips">{MUSCLES.filter((m) => !primary.includes(m.id)).map((m) => <button key={m.id} className={`chip toggle ${secondary.includes(m.id) ? 'on sec' : ''}`} onClick={() => tog(secondary, setSecondary, m.id)}>{m.name}</button>)}</div>
      </div>
      <label className="field"><span className="field-label">Tool</span>
        <select value={equip} onChange={(e) => setEquip(e.target.value as EquipId)}>
          {EQUIPMENT.filter((q) => !['plates', 'rack'].includes(q.id)).map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
        </select>
      </label>
      <label className="check"><input type="checkbox" checked={bw} onChange={(e) => setBw(e.target.checked)} /> Body weight move (weight = extra kg)</label>
      <label className="field"><span className="field-label">How to do it (one step per line)</span><textarea rows={3} value={how} onChange={(e) => setHow(e.target.value)} /></label>
    </Sheet>
  );
}
