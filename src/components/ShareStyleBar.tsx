import { Segmented } from './ui';
import { useI18n } from '../i18n';
import { actions, useData, type ShareStyle } from '../lib/store';

export function ShareStyleBar() {
  const data = useData();
  const { t } = useI18n();
  return (
    <Segmented<ShareStyle>
      label={t('share.style')}
      value={data.settings.shareStyle}
      onChange={(v) => actions.setShareStyle(v)}
      options={[
        { v: 'neon', label: t('share.neon') },
        { v: 'poster', label: t('share.poster') },
        { v: 'grid', label: t('share.grid') },
      ]}
    />
  );
}
