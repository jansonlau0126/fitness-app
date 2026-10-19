import { useEffect, useMemo, useRef, useState } from 'react';
import BodyMap from '../components/BodyMap';
import { DateBar, Empty, Stat, toast } from '../components/ui';
import { ExThumb } from '../components/Thumb';
import { PrTimelineList } from '../components/PrTimeline';
import { ShareStyleBar } from '../components/ShareStyleBar';
import type { Muscle } from '../data/exercises';
import { trackingOf } from '../data/exercises';
import { daySummary, entryStats, exMap, fmt, fmtInt, fmtSec, formatMetric, prsOn, prTimeline } from '../lib/calc';
import { buildDayShare, pngSize, renderShareCard, shareOrDownload } from '../lib/shareCard';
import { useData } from '../lib/store';
import { niceDay } from '../lib/date';
import { exName, exNameEn, muscleLabel, partLabelI18n, useI18n } from '../i18n';

export default function DayPage({ date, setDate, goLog }: { date: string; setDate: (d: string) => void; goLog: () => void }) {
  const data = useData();
  const { t, locale, d } = useI18n();
  const s = daySummary(data, date);
  const m = exMap(data);
  const prs = prsOn(data, date).filter((p) => p.prev !== null);
  const [filter, setFilter] = useState<Muscle | null>(null);
  const [flash, setFlash] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewDim, setPreviewDim] = useState('');
  const recentPrs = useMemo(() => prTimeline(data).slice(0, 5), [data]);

  useEffect(() => { setFilter(null); setFlash(new Set()); }, [date]);

  const onMuscle = (muscle: Muscle, trained: boolean) => {
    if (!trained) { toast(t('day.notTrained')); return; }
    setFilter(muscle);
    const hit = new Set(
      s.entries.filter((en) => {
        const ex = m.get(en.exId);
        return ex && (ex.primary.includes(muscle) || ex.secondary.includes(muscle));
      }).map((en) => en.id),
    );
    setFlash(hit);
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    setTimeout(() => setFlash(new Set()), 1800);
  };

  const visible = filter
    ? s.entries.filter((en) => {
        const ex = m.get(en.exId);
        return ex && (ex.primary.includes(filter) || ex.secondary.includes(filter));
      })
    : s.entries;
  const filterStats = (() => {
    let sets = 0, reps = 0, volume = 0;
    for (const en of visible) {
      const st = entryStats(en);
      sets += st.sets; reps += st.reps; volume += st.volume;
    }
    return { sets, reps, volume, exercises: visible.length };
  })();

  const doShare = async (send: boolean) => {
    setSharing(true);
    try {
      const prIds = new Set(prs.map((p) => p.exId));
      const style = data.settings.shareStyle;
      const payload = buildDayShare(s, m, prIds, {
        title: t('share.title'),
        subtitle: t('brand.slogan'),
        dateLabel: niceDay(date) + ' · ' + date,
        footer: 'jansonlau0126.github.io/fitness-app · Gym Everyday',
        locale,
        nameOf: (ex) => exName(ex, locale),
      });
      const blob = await renderShareCard(payload, style);
      const dim = await pngSize(blob);
      setPreviewDim(`${dim.w}×${dim.h} · ${style}`);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      if (send) {
        const mode = await shareOrDownload(blob, `gym-everyday-${date}-${style}.png`, t('day.share'));
        toast(mode === 'shared' ? '✓' : t('day.download'));
      }
    } catch {
      toast(t('day.shareFail'));
    } finally { setSharing(false); }
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>{t('day.title')}</h1>
      </header>
      <DateBar date={date} setDate={setDate} />
      {s.entries.length > 0 && (
        <div className="share-tools">
          <ShareStyleBar />
          <div className="row gap">
            <button className="btn ghost grow" disabled={sharing} onClick={() => doShare(false)}>{t('share.preview')}</button>
            <button className="btn primary grow" disabled={sharing} onClick={() => doShare(true)}>{t('day.share')}</button>
          </div>
        </div>
      )}

      {s.entries.length === 0 ? (
        <>
          <Empty icon="😴" title={t('day.emptyTitle')} text={t('day.emptyText')}>
            <button className="btn primary" onClick={goLog}>{t('day.goLog')}</button>
          </Empty>
          {recentPrs.length > 0 && (
            <section className="card">
              <h2 className="card-title">{t('month.prTimeline')}</h2>
              <PrTimelineList events={recentPrs} />
            </section>
          )}
        </>
      ) : (
        <>
          <section className="card">
            <BodyMap primary={s.primary} secondary={s.secondary} active={filter} onMuscle={onMuscle} interactive />
            <div className="legend">
              <span><i className="dot pri" /> {t('day.main')}</span>
              <span><i className="dot sec" /> {t('day.helper')}</span>
            </div>
            <div className="chips">
              {[...s.primary].map((mu) => (
                <button key={mu} className={`chip pri ${filter === mu ? 'on' : ''}`} onClick={() => onMuscle(mu, true)}>{muscleLabel(mu, locale, d)}</button>
              ))}
              {[...s.secondary].map((mu) => (
                <button key={mu} className={`chip sec ${filter === mu ? 'on' : ''}`} onClick={() => onMuscle(mu, true)}>{muscleLabel(mu, locale, d)}</button>
              ))}
            </div>
            {filter && (
              <div className="filter-bar">
                <span>{t('day.showing')}: <b>{muscleLabel(filter, locale, d)}</b></span>
                <button className="btn small ghost" onClick={() => setFilter(null)}>{t('day.clearFilter')}</button>
              </div>
            )}
          </section>

          {prs.length > 0 && (
            <section className="card celebrate">
              <div className="celebrate-icon">🏆</div>
              <div>
                <b>{prs.length === 1 ? t('day.newPr') : `${prs.length} ${t('day.newPrs')}`}</b>
                {prs.map((p) => {
                  const ex = m.get(p.exId);
                  return <div key={p.exId} className="small">{exName(ex, locale)}: {formatMetric(ex, p.value)} <span className="muted">(was {formatMetric(ex, p.prev ?? 0)})</span></div>;
                })}
              </div>
            </section>
          )}

          <div className="stats4">
            <Stat label={t('day.exercises')} value={String(filterStats.exercises)} />
            <Stat label={t('month.sets')} value={String(filterStats.sets)} />
            <Stat label={t('month.reps')} value={fmtInt(filterStats.reps)} />
            <Stat label={t('month.volume')} value={filterStats.volume >= 10000 ? fmt(filterStats.volume / 1000, 1) + 'k' : fmtInt(filterStats.volume)} unit="kg" />
          </div>

          <section className="card" ref={listRef}>
            <h2 className="card-title">{t('day.exercises')}</h2>
            <div className="table">
              <div className="tr th"><span>{t('day.exercises')}</span><span>{t('day.bestSet')}</span><span>{t('day.est1rm')}</span></div>
              {visible.map((en) => {
                const ex = m.get(en.exId); const st = entryStats(en, !!ex?.bw || trackingOf(ex) === 'reps');
                const tr = trackingOf(ex);
                return (
                  <div className={`tr ${flash.has(en.id) ? 'flash' : ''}`} key={en.id}>
                    <span className="tr-ex">
                      {ex && <ExThumb ex={ex} size={40} />}
                      <span>
                        <b>{exName(ex, locale)}</b>
                        {locale === 'zh-TW' && ex && <small className="muted"> {exNameEn(ex)}</small>}
                        <small className="muted"> {ex ? partLabelI18n(ex.part, locale, d) : ''} · {st.sets} {t('log.sets')}</small>
                      </span>
                    </span>
                    <span>
                      {tr === 'duration' ? fmtSec(st.maxSec)
                        : !st.bestSet ? '–'
                        : tr === 'reps' ? `${st.bestSet.w ? '+' + fmt(st.bestSet.w) + ' kg × ' : 'BW × '}${st.bestSet.r}`
                        : `${fmt(st.bestSet.w)} kg × ${st.bestSet.r}`}
                    </span>
                    <span className="strong">
                      {tr === 'duration' ? fmtSec(st.maxSec) : tr === 'reps' ? `${st.maxReps}` : `${fmt(st.best)} kg`}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="muted small note">{t('day.epleyNote')}</p>
          </section>
          <section className="card">
            <h2 className="card-title">{t('month.prTimeline')}</h2>
            <PrTimelineList events={recentPrs} />
          </section>
          {previewUrl && (
            <section className="card share-preview-wrap">
              <h2 className="card-title">{t('day.share')}</h2>
              <img src={previewUrl} alt="Share card preview" />
              <div className="share-preview-meta">{previewDim} PNG</div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
