import { useEffect } from 'react';
import { useI18n } from '../i18n';
import { restApplyDefault, restSkip, restToggle, useRest } from '../lib/restTimer';
import { actions, useData } from '../lib/store';

export function RestTimer() {
  const data = useData();
  const { t } = useI18n();
  const s = useRest();
  useEffect(() => { restApplyDefault(data.settings.restSec); }, [data.settings.restSec]);

  const mm = Math.floor(s.left / 60);
  const ss = String(s.left % 60).padStart(2, '0');
  const pct = s.total > 0 ? Math.max(0, Math.min(1, s.left / s.total)) : 0;
  const primary = s.phase === 'run' ? t('editor.restPause') : s.phase === 'paused' ? t('editor.restResume') : t('editor.restStart');

  return (
    <div className={`rest-timer ${s.phase}`} role="timer">
      <div className="rest-top">
        <span className="field-label">{t('editor.rest')}</span>
        <span className="rest-clock">{mm}:{ss}</span>
      </div>
      <div className="rest-track" aria-hidden><div className="rest-fill" style={{ width: `${pct * 100}%` }} /></div>
      {s.phase === 'done' && <div className="rest-done">{t('editor.restDone')}</div>}
      <div className="rest-actions">
        <button className="btn small primary" onClick={() => restToggle(data.settings.restSec)}>{primary}</button>
        <button className="btn small ghost" onClick={restSkip}>{t('editor.restSkip')}</button>
        <button className="btn small ghost" aria-label="−15 seconds" onClick={() => actions.setRestSec(data.settings.restSec - 15)}>−15</button>
        <button className="btn small ghost" aria-label="+15 seconds" onClick={() => actions.setRestSec(data.settings.restSec + 15)}>+15</button>
      </div>
      <p className="muted small rest-hint">{t('editor.restHint', { s: data.settings.restSec })}</p>
    </div>
  );
}
