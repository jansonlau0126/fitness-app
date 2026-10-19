import { useI18n } from '../i18n';
import { focusOn, useData, type PlanFocus } from '../lib/store';

export function PlanHint({ date }: { date: string }) {
  const data = useData();
  const { t } = useI18n();
  const focus: PlanFocus = focusOn(data.settings.plan, date);
  return (
    <div className={`plan-hint focus-${focus}`}>
      <span className="plan-kicker">{t('plan.today')}</span>
      <b>{t(`plan.${focus}`)}</b>
      <span className="muted small">{t(`plan.hint.${focus}`)}</span>
    </div>
  );
}
