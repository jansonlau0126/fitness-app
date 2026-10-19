import { useMemo, useState } from 'react';
import { BODY_PARTS, trackingOf, type BodyPart, type Exercise } from '../data/exercises';
import { actions, uid, useData, type LogEntry, type SetEntry } from '../lib/store';
import {
  allExercises, bestByExercise, e1rm, entriesOn, entryStats, exMap, fmt, fmtInt, fmtSec,
  formatMetric, formatSet, lastSession, metricOf,
} from '../lib/calc';
import { addDays, shortDate } from '../lib/date';
import { confirmDialog, DateBar, Empty, NumberField, Sheet, toast } from '../components/ui';
import { ExThumb } from '../components/Thumb';
import { PlanHint } from '../components/PlanHint';
import { RestTimer } from '../components/RestTimer';
import { restStart } from '../lib/restTimer';
import { equipLabel, exName, exNameEn, partLabelI18n, useI18n } from '../i18n';

export default function LogPage({ date, setDate, goSummary }: { date: string; setDate: (d: string) => void; goSummary: () => void }) {
  const data = useData();
  const { t, locale, d } = useI18n();
  const entries = entriesOn(data, date);
  const m = exMap(data);
  const [editing, setEditing] = useState<LogEntry | 'new' | null>(null);
  const before = useMemo(() => bestByExercise(data, '0000-00-00', addDays(date, -1)), [data, date]);
  const totals = entries.reduce((a, e) => { const s = entryStats(e); return { sets: a.sets + s.sets, volume: a.volume + s.volume }; }, { sets: 0, volume: 0 });

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>{t('log.title')}</h1>
          <div className="brand-slogan"><em>{t('brand.slogan')}</em></div>
        </div>
        {entries.length > 0 && <span className="pill">{entries.length} {t('log.exercises')} · {totals.sets} {t('log.sets')}</span>}
      </header>
      <DateBar date={date} setDate={setDate} />
      <PlanHint date={date} />
      <RestTimer />

      {entries.length === 0 ? (
        <Empty icon="💪" title={t('log.emptyTitle')} text={t('log.emptyText')} />
      ) : (
        <div className="list">
          {entries.map((en) => {
            const ex = m.get(en.exId); const st = entryStats(en);
            const v = metricOf(ex, st); const prev = before.get(en.exId)?.value;
            const isPR = v > 0 && (prev === undefined || v > prev);
            const tr = trackingOf(ex);
            return (
              <button className="card entry" key={en.id} onClick={() => setEditing(en)}>
                <div className="entry-top">
                  {ex && <ExThumb ex={ex} size={48} />}
                  <div className="grow">
                    <div className="entry-name">{exName(ex, locale)}{locale === 'zh-TW' && ex && <span className="en-sub"> {exNameEn(ex)}</span>}</div>
                    <div className="muted small">{ex ? partLabelI18n(ex.part, locale, d) : ''} · {st.sets} {st.sets === 1 ? t('log.set') : t('log.sets')}
                      {tr === 'duration' ? ` · ${fmtSec(st.totalSec)}` : ` · ${st.reps} ${t('log.reps')}`}
                      {st.volume > 0 && ` · ${fmtInt(st.volume)} kg`}
                    </div>
                  </div>
                  {isPR && prev !== undefined && <span className="badge pr">🏆 {t('log.pr')}</span>}
                </div>
                <div className="set-chips">
                  {en.sets.map((s, i) => <span className="set-chip" key={i}>{formatSet(ex, s)}</span>)}
                </div>
                <div className="entry-best">
                  <span>
                    {tr === 'duration' ? <>{t('log.bestTime')}: <b>{fmtSec(st.maxSec)}</b></>
                      : tr === 'reps' ? <>{t('log.bestSet')}: <b>{st.maxReps} {t('log.reps')}</b></>
                      : <>{t('log.bestEst')}: <b>{fmt(st.best)} kg</b></>}
                  </span>
                  <span className="muted small edit-hint">{t('log.tapEdit')}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="stack">
        <button className="btn primary big" onClick={() => setEditing('new')}>{t('log.add')}</button>
        {entries.length > 0 && <button className="btn ghost big" onClick={goSummary}>{t('log.seeSummary')}</button>}
      </div>

      {editing && <EntryEditor key={editing === 'new' ? 'new' : editing.id} entry={editing === 'new' ? null : editing} date={date} onClose={() => setEditing(null)} />}
    </div>
  );
}

export function EntryEditor({ entry, date, onClose, presetEx }: { entry: LogEntry | null; date: string; onClose: () => void; presetEx?: string }) {
  const data = useData();
  const { t, locale, d } = useI18n();
  const all = allExercises(data);
  const m = exMap(data);
  const initEx = entry ? m.get(entry.exId) : presetEx ? m.get(presetEx) : undefined;
  const [part, setPart] = useState<BodyPart | ''>(initEx?.part ?? '');
  const [exId, setExId] = useState<string>(initEx?.id ?? '');
  const [picking, setPicking] = useState(!initEx);
  const blankSet = (ex?: Exercise): { w: number | null; r: number | null; sec: number | null } =>
    trackingOf(ex) === 'duration' ? { w: 0, r: null, sec: null } : { w: ex && trackingOf(ex) === 'reps' ? 0 : null, r: null, sec: null };
  const [sets, setSets] = useState<{ w: number | null; r: number | null; sec: number | null }[]>(
    entry ? entry.sets.map((s) => ({ w: s.w, r: s.r, sec: s.sec ?? null })) : [blankSet(initEx)],
  );
  const ex: Exercise | undefined = m.get(exId);
  const list = all.filter((e) => e.part === part).sort((a, b) => exName(a, locale).localeCompare(exName(b, locale), locale === 'zh-TW' ? 'zh-Hant' : 'en'));
  const last = exId ? lastSession(data, exId, date, entry?.id) : null;
  const allTime = exId ? bestByExercise(data).get(exId) : undefined;
  const tr = trackingOf(ex);

  const applyLast = (lt: LogEntry, keepPicking = false) => {
    setSets(lt.sets.map((s) => ({ w: s.w, r: s.r ?? null, sec: s.sec ?? null })));
    if (!keepPicking) setPicking(false);
  };

  const pickEx = (id: string) => {
    setExId(id);
    setPicking(false);
    const e = m.get(id);
    if (!entry) {
      const lt = lastSession(data, id, date);
      if (lt) applyLast(lt, true);
      else setSets([blankSet(e)]);
    }
  };

  const upd = (i: number, k: 'w' | 'r' | 'sec', v: number | null) => setSets((s) => s.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const addSet = () => {
    setSets((s) => [...s, { ...(s[s.length - 1] ?? blankSet(ex)) }]);
    restStart(data.settings.restSec);
  };
  const removeSet = (i: number) => setSets((s) => (s.length > 1 ? s.filter((_, j) => j !== i) : s));

  const clean: SetEntry[] = sets
    .filter((s) => (tr === 'duration' ? (s.sec ?? 0) > 0 : (s.r ?? 0) > 0))
    .map((s) => {
      if (tr === 'duration') return { w: Math.max(0, s.w ?? 0), r: 0, sec: Math.round(s.sec ?? 0) };
      return { w: Math.max(0, s.w ?? 0), r: Math.round(s.r ?? 0) };
    });
  const canSave = !!ex && clean.length > 0;

  const save = () => {
    if (!canSave || !ex) return;
    const before = bestByExercise(data, '0000-00-00', addDays(date, -1)).get(ex.id)?.value;
    const en: LogEntry = { id: entry?.id ?? uid(), date, exId: ex.id, sets: clean, t: entry?.t ?? Date.now() };
    actions.saveEntry(en);
    const v = metricOf(ex, entryStats(en));
    if (before !== undefined && v > before) toast(`🏆 ${t('log.pr')}! ${exName(ex, locale)}: ${formatMetric(ex, v)}`);
    else toast(entry ? t('common.saved') : t('common.added'));
    onClose();
  };
  const del = async () => {
    if (!entry) return;
    if (await confirmDialog(`${t('common.delete')} ${exName(ex, locale)}?`, { ok: t('common.delete'), danger: true })) {
      actions.deleteEntry(entry.id); toast(t('common.deleted')); onClose();
    }
  };

  return (
    <Sheet title={entry ? t('editor.editTitle') : t('editor.addTitle')} onClose={onClose} footer={
      <div className="row gap">
        {entry && <button className="btn danger ghost" onClick={del}>{t('editor.delete')}</button>}
        <button className="btn primary grow big" disabled={!canSave} onClick={save}>{entry ? t('editor.save') : t('editor.addToLog')}</button>
      </div>
    }>
      <label className="field">
        <span className="field-label">{t('editor.bodyPart')}</span>
        <select value={part} onChange={(e) => { setPart(e.target.value as BodyPart); setExId(''); setPicking(true); setSets([blankSet()]); }}>
          <option value="" disabled>{t('editor.choosePart')}</option>
          {BODY_PARTS.map((p) => <option key={p} value={p}>{partLabelI18n(p, locale, d)}</option>)}
        </select>
      </label>

      <div className="field">
        <span className="field-label">{t('editor.exercise')} {part && (picking || !ex) && <span className="muted">· {list.length} {t('editor.choices')}</span>}</span>
        {!part ? (
          <div className="pick-empty">{t('editor.pickPartFirst')}</div>
        ) : ex && !picking ? (
          <div className="ex-picked">
            <ExThumb ex={ex} size={64} />
            <div className="grow">
              <div className="entry-name">{exName(ex, locale)}</div>
              {locale === 'zh-TW' && <div className="muted small">{exNameEn(ex)}</div>}
              <div className="muted small">{equipLabel(ex.equipment, locale)} · {t('editor.tapZoom')}</div>
            </div>
            <button className="btn small ghost" onClick={() => setPicking(true)}>{t('editor.change')}</button>
          </div>
        ) : (
          <div className="ex-pick" role="listbox" aria-label={t('editor.exercise')}>
            {list.map((e) => (
              <button key={e.id} role="option" aria-selected={e.id === exId} className={`ex-opt ${e.id === exId ? 'on' : ''}`} onClick={() => pickEx(e.id)}>
                <ExThumb ex={e} size={48} zoom={false} />
                <span className="grow">
                  <span className="ex-opt-name">{exName(e, locale)}{e.custom ? ' ★' : ''}</span>
                  {locale === 'zh-TW' && <span className="muted small">{exNameEn(e)}</span>}
                  <span className="muted small">{equipLabel(e.equipment, locale)}</span>
                </span>
                <span className="chev">›</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {ex && last && (
        <div className="last-card">
          <div className="field-label">{t('editor.lastTime')}</div>
          <div className="last-note">{t('editor.lastNote', {
            when: shortDate(last.date),
            sets: last.sets.length,
            best: formatSet(ex, entryStats(last, trackingOf(ex) === 'reps').bestSet ?? last.sets[0]),
          })}</div>
          <div className="set-chips">
            {last.sets.map((s, i) => <span className="set-chip" key={i}>{formatSet(ex, s)}</span>)}
          </div>
          <button className="btn primary wide" onClick={() => applyLast(last)}>{t('editor.fillLast')}</button>
          {allTime && (
            <div className="last-pr muted small">{t('editor.allTimePr')}: <b className="accent">{formatMetric(ex, allTime.value)}</b>
              {allTime.date !== last.date && <> · {shortDate(allTime.date)}</>}
            </div>
          )}
        </div>
      )}

      {ex && (tr === 'duration' || tr === 'reps' || ex.equipment === 'dumbbell') && (
        <div className="hint">
          {tr === 'duration' && <span>{t('editor.durationHint')}</span>}
          {tr === 'reps' && <span>{t('editor.bwHint')}</span>}
          {ex.equipment === 'dumbbell' && tr === 'weight_reps' && <span>{t('editor.dbHint')}</span>}
        </div>
      )}

      {ex && <>
        <RestTimer />
        <div className="sets-head">
          <h3>{t('editor.sets')} <span className="pill">{sets.length}</span></h3>
          <span className="muted small">{tr === 'duration' ? t('log.bestTime') : tr === 'reps' ? t('log.bestSet') : t('log.bestEst')}</span>
        </div>
        <div className="sets">
          <div className="set-row head">
            <span>#</span>
            <span>{tr === 'duration' ? t('editor.plusKg') : tr === 'reps' ? t('editor.plusKg') : t('editor.kg')}</span>
            <span>{tr === 'duration' ? t('editor.sec') : t('log.reps')}</span>
            <span /><span />
          </div>
          {sets.map((s, i) => {
            const est = tr === 'duration' ? (s.sec ? fmtSec(s.sec) : '–')
              : tr === 'reps' ? (s.r ? String(s.r) : '–')
              : (e1rm(s.w ?? 0, s.r ?? 0) ? fmt(e1rm(s.w ?? 0, s.r ?? 0)) : '–');
            return (
              <div className="set-row" key={i}>
                <span className="set-no">{i + 1}</span>
                <NumberField value={s.w} onChange={(v) => upd(i, 'w', v)} placeholder="0" />
                {tr === 'duration'
                  ? <NumberField value={s.sec} onChange={(v) => upd(i, 'sec', v)} placeholder="0" />
                  : <NumberField value={s.r} onChange={(v) => upd(i, 'r', v)} placeholder="0" />}
                <span className="set-est">{est}</span>
                <button className="icon-btn small" aria-label={`Remove set ${i + 1}`} disabled={sets.length === 1} onClick={() => removeSet(i)}>✕</button>
              </div>
            );
          })}
        </div>
        <button className="btn ghost wide" onClick={addSet}>{t('editor.addSet')}</button>
        {tr === 'weight_reps' && <p className="muted small note">{t('editor.epleyNote')}</p>}
      </>}
    </Sheet>
  );
}
