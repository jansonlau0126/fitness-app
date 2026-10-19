import { PUBLIC_URL } from '../lib/publicSite';
import { useI18n } from '../i18n';

const MAIL = 'support@gymeveryday.app';

export default function PrivacyPage({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  return (
    <div className="page">
      <header className="page-head">
        <h1>{t('privacy.title')}</h1>
        <button className="btn ghost small" onClick={onBack}>{t('privacy.back')}</button>
      </header>
      <p className="small muted">{t('privacy.updated')}</p>
      <p>{t('privacy.intro')}</p>

      <section className="card">
        <h2 className="card-title">{t('privacy.collectTitle')}</h2>
        <p>{t('privacy.collectBody')}</p>
      </section>
      <section className="card">
        <h2 className="card-title">{t('privacy.localTitle')}</h2>
        <p>{t('privacy.localBody')}</p>
      </section>
      <section className="card">
        <h2 className="card-title">{t('privacy.syncTitle')}</h2>
        <p>{t('privacy.syncBody')}</p>
      </section>
      <section className="card">
        <h2 className="card-title">{t('privacy.thirdTitle')}</h2>
        <p>{t('privacy.thirdBody')}</p>
      </section>
      <section className="card">
        <h2 className="card-title">{t('privacy.deleteTitle')}</h2>
        <p>{t('privacy.deleteBody')}</p>
      </section>
      <section className="card" id="privacy-contact">
        <h2 className="card-title">{t('privacy.contactTitle')}</h2>
        <p><a href={`mailto:${MAIL}`}>{MAIL}</a></p>
        <p className="small muted">{t('privacy.contactNote')}</p>
        <p className="small">
          {t('privacy.siteLabel')}: <a href={PUBLIC_URL} target="_blank" rel="noopener noreferrer">{PUBLIC_URL}</a>
        </p>
        <p className="small"><a href="./privacy.html">{t('privacy.pageLink')}</a></p>
      </section>
    </div>
  );
}
