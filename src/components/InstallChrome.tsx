import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import {
  INSTALL_HELP_EVENT, dismissInstall, getInstallSnapshot, noteVisit, promptInstall, shouldShowInstallBar, useInstallSnapshot,
} from '../lib/install';
import { Sheet, toast } from './ui';

async function runInstall(openHelp: () => void, installedMsg: string) {
  if (!getInstallSnapshot().canPrompt) { openHelp(); return; }
  const outcome = await promptInstall();
  if (outcome === 'accepted') toast(installedMsg);
  else if (outcome === 'unavailable') openHelp();
}

/** Install bar + iOS Add-to-Home-Screen sheet. Mount once at the app root. */
export default function InstallChrome({ entryCount }: { entryCount: number }) {
  const { t } = useI18n();
  const snap = useInstallSnapshot();
  const [help, setHelp] = useState(false);
  const showBar = shouldShowInstallBar(snap, entryCount);

  useEffect(() => { noteVisit(); }, []);
  useEffect(() => {
    const open = () => setHelp(true);
    window.addEventListener(INSTALL_HELP_EVENT, open);
    return () => window.removeEventListener(INSTALL_HELP_EVENT, open);
  }, []);

  const act = () => { void runInstall(() => setHelp(true), t('install.installed')); };

  return (
    <>
      {showBar && (
        <div className="install-bar" role="region" aria-label={t('install.barTitle')}>
          <div className="install-copy">
            <b>{t('install.barTitle')}</b>
            <span>{t('install.barBody')}</span>
          </div>
          <div className="install-actions">
            <button className="btn primary small" onClick={act}>{t('install.install')}</button>
            <button className="icon-btn small" aria-label={t('install.notNow')} onClick={() => dismissInstall()}>✕</button>
          </div>
        </div>
      )}
      {help && (
        <Sheet
          title={t('install.sheetTitle')}
          onClose={() => setHelp(false)}
          footer={(
            <div className="stack">
              {snap.canPrompt && <button className="btn primary big" onClick={act}>{t('install.install')}</button>}
              <button className="btn ghost big" onClick={() => setHelp(false)}>{t('common.close')}</button>
            </div>
          )}
        >
          <ol className="install-steps">
            <li>{t('install.step1')}</li>
            <li>{t('install.step2')}</li>
            <li>{t('install.step3')}</li>
          </ol>
          <p className="small muted">{t('install.settingsLong')}</p>
        </Sheet>
      )}
    </>
  );
}
