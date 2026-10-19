import { exName, useI18n } from '../i18n';
import { exMap, formatMetric, type PrEvent } from '../lib/calc';
import { shortDate } from '../lib/date';
import { useData } from '../lib/store';

export function PrTimelineList({ events }: { events: PrEvent[] }) {
  const data = useData();
  const { t, locale } = useI18n();
  const m = exMap(data);
  if (!events.length) return <p className="muted">{t('month.prTimelineEmpty')}</p>;
  return (
    <div className="pr-timeline">
      {events.map((ev, i) => {
        const ex = m.get(ev.exId);
        return (
          <div className="pr-time" key={`${ev.exId}-${ev.date}-${ev.value}-${i}`}>
            <div className="pr-date">{shortDate(ev.date)}</div>
            <div className="grow">
              <b>{exName(ex, locale) || ev.exId}</b>
              <div className="small muted">{t('month.prWas', { prev: formatMetric(ex, ev.prev) })}</div>
            </div>
            <b className="accent">{formatMetric(ex, ev.value)}</b>
          </div>
        );
      })}
    </div>
  );
}
