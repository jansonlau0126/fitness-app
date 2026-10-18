import { useEffect, useState } from 'react';
import { Hosts } from './components/ui';
import { I18nProvider, useI18n } from './i18n';
import { LightboxHost } from './components/Thumb';
import { EntryEditor } from './pages/LogPage';
import LogPage from './pages/LogPage';
import DayPage from './pages/DayPage';
import MonthPage from './pages/MonthPage';
import LibraryPage from './pages/LibraryPage';
import ProfilePage from './pages/ProfilePage';
import { todayKey } from './lib/date';
import { useData } from './lib/store';

type Tab = 'log' | 'day' | 'month' | 'library' | 'profile';
const TAB_ICONS: Record<Tab, React.ReactNode> = {
  log: <path d="M9 4h6v2H9zM7 5H5v16h14V5h-2M12 10v6M9 13h6" />,
  day: <><circle cx="12" cy="4.5" r="2" /><path d="M6 8.5h12M12 8.5v5M12 13.5l-3 7M12 13.5l3 7M7 8.5l-1.5 5M17 8.5l1.5 5" /></>,
  month: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4M8 16l2.5-2.5 2 2L16 12" /></>,
  library: <path d="M5 4h5a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H5zM19 4h-5a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h5z" />,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" /></>,
};
const TAB_IDS: Tab[] = ['log', 'day', 'month', 'library', 'profile'];

const readHash = (): Tab => { const h = location.hash.replace('#/', '').replace('#', ''); return (TAB_IDS.includes(h as Tab) ? h : 'log') as Tab; };

export default function App() {
  return <I18nProvider><AppInner /></I18nProvider>;
}
function AppInner() {
  const data = useData();
  const { t } = useI18n();
  const [tab, setTabState] = useState<Tab>(readHash);
  const [date, setDate] = useState(todayKey());
  const [quickEx, setQuickEx] = useState<string | null>(null);
  const setTab = (t: Tab) => { setTabState(t); history.replaceState(null, '', `#/${t}`); window.scrollTo(0, 0); };

  useEffect(() => { const f = () => setTabState(readHash()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  useEffect(() => {
    const t = data.settings.theme;
    const apply = () => {
      const dark = t === 'dark' || (t === 'auto' && !window.matchMedia('(prefers-color-scheme: light)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a0614' : '#f6f1ea');
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: light)'); mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [data.settings.theme]);

  return (
    <div className="app">
      <main>
        {tab === 'log' && <LogPage date={date} setDate={setDate} goSummary={() => setTab('day')} />}
        {tab === 'day' && <DayPage date={date} setDate={setDate} goLog={() => setTab('log')} />}
        {tab === 'month' && <MonthPage openDay={(d) => { setDate(d); setTab('day'); }} />}
        {tab === 'library' && <LibraryPage onLog={(id) => { setDate(todayKey()); setQuickEx(id); }} />}
        {tab === 'profile' && <ProfilePage />}
      </main>
      <nav className="tabbar" aria-label="Main">
        {TAB_IDS.map((id) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{TAB_ICONS[id]}</svg>
            <span>{t(`tabs.${id}`)}</span>
          </button>
        ))}
      </nav>
      {quickEx && <EntryEditor entry={null} date={todayKey()} presetEx={quickEx} onClose={() => { setQuickEx(null); }} />}
      <LightboxHost />
      <Hosts />
    </div>
  );
}
