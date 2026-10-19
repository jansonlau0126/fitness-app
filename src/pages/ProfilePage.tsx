import { Fragment, useEffect, useRef, useState } from 'react';
import { Sparkline } from '../components/Charts';
import { confirmDialog, NumberField, Segmented, toast } from '../components/ui';
import { KEY_LIFTS } from '../data/exercises';
import { fmt, LEVEL_COLORS, LEVELS, strengthResults } from '../lib/calc';
import { shortDate, todayKey } from '../lib/date';
import { makeDemo } from '../lib/demo';
import { PHOTO_CREDIT_URL } from '../data/images';
import { exName, levelLabel, useI18n, useLocaleActions } from '../i18n';
import type { Locale } from '../lib/store';
import { actions, focusOn, nextFocus, normalize, useData, type PlanFocus, type Theme } from '../lib/store';
import {
  googleConfigured, health, loadAuth, loadSyncMeta, signInWithGoogle, signOut, syncNow, type AuthUser,
} from '../lib/sync';

export default function ProfilePage() {
  const data = useData();
  const { t, locale, d } = useI18n();
  const { setLocale } = useLocaleActions();
  const p = data.profile;
  const [wDate, setWDate] = useState(todayKey());
  const [wKg, setWKg] = useState<number | null>(null);
  const [moreLifts, setMoreLifts] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<AuthUser | null>(() => loadAuth());
  const [syncBusy, setSyncBusy] = useState(false);
  const [apiReady, setApiReady] = useState<{ ok: boolean; googleConfigured: boolean } | null>(null);
  const meta = loadSyncMeta();
  useEffect(() => { health().then(setApiReady).catch(() => setApiReady({ ok: false, googleConfigured: false })); }, []);

  const bmi = p.heightCm && p.weightKg ? p.weightKg / (p.heightCm / 100) ** 2 : null;
  const results = strengthResults(data, KEY_LIFTS);
  const order = (id: string) => { const i = KEY_LIFTS.indexOf(id); return i < 0 ? 100 : i; };
  results.sort((a, b) => order(a.ex.id) - order(b.ex.id) || (b.info?.score ?? -1) - (a.info?.score ?? -1));

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `fitness-backup-${todayKey()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast(t('toast.backupSaved'));
  };
  const importData = async (f: File) => {
    try {
      const d = normalize(JSON.parse(await f.text()));
      if (await confirmDialog(t('toast.importMsg', { n: d.entries.length }), { title: t('toast.importTitle'), ok: t('toast.importOk') })) { actions.replaceAll(d); toast(t('toast.backupLoaded')); }
    } catch (e) { toast('❌ ' + (e instanceof Error ? e.message : t('toast.backupBad'))); }
  };

  return (
    <div className="page">
      <header className="page-head"><h1>{t('profile.title')}</h1></header>

      <section className="card">
        <h2 className="card-title">{t('profile.aboutYou')}</h2>
        <label className="field"><span className="field-label">{t('profile.name')}</span><input value={p.name} placeholder="Your name" onChange={(e) => actions.setProfile({ name: e.target.value })} /></label>
        <div className="field"><span className="field-label">{t('profile.sex')}</span>
          <Segmented value={p.sex} onChange={(v) => actions.setProfile({ sex: v })} options={[{ v: 'male', label: t('profile.male') }, { v: 'female', label: t('profile.female') }]} />
        </div>
        <div className="grid3">
          <NumberField label={t('profile.age')} value={p.age} onChange={(v) => actions.setProfile({ age: v })} suffix={t('profile.yr')} />
          <NumberField label={t('profile.height')} value={p.heightCm} onChange={(v) => actions.setProfile({ heightCm: v })} suffix={t('profile.cm')} />
          <NumberField label={t('profile.weight')} value={p.weightKg} onChange={(v) => actions.setProfile({ weightKg: v })} suffix="kg" />
        </div>
        {bmi && <p className="small muted">BMI: <b>{fmt(bmi)}</b> (a rough guide only)</p>}
      </section>

      <section className="card">
        <h2 className="card-title">{t('plan.title')}</h2>
        <p className="small muted">{t('plan.blurb')}</p>
        <div className="plan-week">
          {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
            const focus = (data.settings.plan[dow] ?? 'rest') as PlanFocus;
            const isToday = new Date().getDay() === dow;
            return (
              <button key={dow} type="button" className={`plan-day focus-${focus} ${isToday ? 'today' : ''}`} onClick={() => actions.setPlanDay(dow, nextFocus(focus))}>
                <span>{t(`plan.dow.${dow}`)}</span>
                <b>{t(`plan.${focus}`)}</b>
              </button>
            );
          })}
        </div>
        <p className="small muted plan-today-line">{t('plan.today')}: <b>{t(`plan.${focusOn(data.settings.plan, todayKey())}`)}</b></p>
        <button className="btn ghost small" onClick={() => actions.resetPlan()}>{t('plan.reset')}</button>
        <RestDefault />
        <p className="small muted">{t('profile.restHint')}</p>
      </section>

      <section className="card">
        <h2 className="card-title">{t('profile.weightHistory')}</h2>
        <div className="row gap wrap-row">
          <input type="date" value={wDate} onChange={(e) => setWDate(e.target.value)} aria-label="Weight date" className="grow" />
          <NumberField value={wKg} onChange={setWKg} placeholder="0" suffix="kg" className="w90" />
          <button className="btn primary" disabled={!wKg} onClick={() => { if (wKg) { actions.addWeight({ date: wDate, kg: wKg }); setWKg(null); toast(t('toast.weightSaved')); } }}>Add</button>
        </div>
        {data.weights.length >= 2 && <Sparkline points={data.weights.map((w) => ({ x: w.date, y: w.kg }))} />}
        {data.weights.length > 0 ? (
          <div className="weights">
            {[...data.weights].reverse().slice(0, 8).map((w) => (
              <div className="weight-row" key={w.date}>
                <span>{shortDate(w.date)} <span className="muted small">{w.date.slice(0, 4)}</span></span><b>{fmt(w.kg)} kg</b>
                <button className="icon-btn small" aria-label="Delete weight" onClick={() => actions.deleteWeight(w.date)}>✕</button>
              </div>
            ))}
          </div>
        ) : <p className="muted small">{t('profile.noWeights')}</p>}
      </section>

      <section className="card" id="standards">
        <h2 className="card-title">{t('profile.standards')}</h2>
        {!p.weightKg ? <p className="warn">{t('profile.needWeight')}</p> : (
          <p className="small muted">{t('profile.forLifter', {
            sex: p.sex === 'male' ? t('profile.male') : t('profile.female'),
            kg: fmt(p.weightKg),
            age: p.age ? t('profile.agePart', { age: p.age }) : '',
          })}</p>
        )}
        <div className="lvl-scale">{LEVELS.map((l, i) => <span key={l} style={{ color: LEVEL_COLORS[i] }}>{levelLabel(l, d)}</span>)}</div>
        <details className="small">
          <summary className="muted">{t('profile.stdHelp')}</summary>
          <div className="lvl-help">
            {['5%', '20%', '50%', '80%', '95%'].map((pc, i) => <Fragment key={pc}><b style={{ color: LEVEL_COLORS[i] }}>{LEVELS[i]}</b><span>{t('profile.strongerThan', { pc })}</span></Fragment>)}
          </div>
        </details>
        <div className="list">
          {results.filter((r) => moreLifts || KEY_LIFTS.includes(r.ex.id)).map((r) => <StrengthCard key={r.ex.id} r={r} />)}
          {results.length > KEY_LIFTS.length && (
            <button className="btn ghost" onClick={() => setMoreLifts(!moreLifts)}>{moreLifts ? t('profile.showKey') : t('profile.showMore', { n: results.length - KEY_LIFTS.length })}</button>
          )}
        </div>
        <p className="small muted note">{p.age ? t('profile.ageNote') : t('profile.noAgeNote')}</p>
      </section>


      <section className="card sync-card" id="sync">
        <h2 className="card-title">{t('sync.title')}</h2>
        {!googleConfigured() || (apiReady && !apiReady.googleConfigured) ? (
          <div className="sync-setup">
            <b>{t('sync.setupTitle')}</b>
            <p className="small muted">{t('sync.setupBody')}</p>
            <p className="small muted">{t('sync.appleLater')}</p>
          </div>
        ) : user ? (
          <div className="stack">
            <div className="user-row">
              {user.picture && <img className="avatar" src={user.picture} alt="" />}
              <div className="grow">
                <div className="strong">{t('sync.signedInAs')}</div>
                <div className="small muted">{user.name || user.email}</div>
                <div className="small muted">{t('sync.lastSynced')}: {meta.lastSyncedAt ? new Date(meta.lastSyncedAt).toLocaleString() : t('sync.never')}</div>
              </div>
            </div>
            <button className="btn primary big" disabled={syncBusy} onClick={async () => {
              setSyncBusy(true);
              try {
                const r = await syncNow(data, data.updatedAt ?? 0);
                if (!r.result.ok) toast(r.result.error === 'offline' ? t('sync.offline') : t('sync.needSetup'));
                else {
                  if (r.data) actions.replaceAll(r.data);
                  toast(r.result.pulled ? t('sync.conflict') : t('sync.synced'));
                  setUser(loadAuth());
                }
              } finally { setSyncBusy(false); }
            }}>{syncBusy ? t('sync.syncing') : t('sync.syncNow')}</button>
            <button className="btn ghost" onClick={() => { signOut(); setUser(null); toast(t('sync.signOut')); }}>{t('sync.signOut')}</button>
          </div>
        ) : (
          <div className="stack">
            <button className="btn primary big" onClick={async () => {
              try {
                const u = await signInWithGoogle();
                setUser(u);
                toast(t('sync.synced'));
                const r = await syncNow(data, data.updatedAt ?? 0);
                if (r.data) actions.replaceAll(r.data);
              } catch { toast(t('sync.needSetup')); }
            }}>{t('sync.signInGoogle')}</button>
            <p className="small muted">{t('sync.appleLater')}</p>
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">{t('profile.language')}</h2>
        <Segmented value={locale} onChange={(v: Locale) => setLocale(v)} options={[{ v: 'en', label: t('profile.english') }, { v: 'zh-TW', label: t('profile.chinese') }]} />
      </section>

      <section className="card">
        <h2 className="card-title">{t('profile.look')}</h2>
        <Segmented value={data.settings.theme} onChange={(v: Theme) => actions.setTheme(v)} options={[{ v: 'auto', label: t('profile.auto') }, { v: 'dark', label: t('profile.dark') }, { v: 'light', label: t('profile.light') }]} />
      </section>

      <section className="card">
        <h2 className="card-title">{t('profile.yourData')}</h2>
        <p className="small muted">{t('profile.dataNote')}</p>
        <div className="stack">
          <button className="btn ghost big" onClick={exportData}>{t('profile.export')}</button>
          <button className="btn ghost big" onClick={() => fileRef.current?.click()}>{t('profile.import')}</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ''; }} />
          <button className="btn ghost big" onClick={async () => {
            const has = data.entries.length > 0;
            if (await confirmDialog(has ? t('toast.demoHas') : t('toast.demoEmpty'), { title: t('toast.demoTitle'), ok: t('toast.demoOk'), danger: has })) {
              actions.replaceAll({ ...makeDemo(), settings: data.settings }); toast(t('toast.demoLoaded'));
            }
          }}>{t('profile.demo')}</button>
          <button className="btn danger big" onClick={async () => {
            if (await confirmDialog(t('toast.clearMsg'), { title: t('toast.clearTitle'), ok: t('toast.clearOk'), danger: true })) { actions.clearAll(); toast(t('toast.cleared')); }
          }}>{t('profile.clear')}</button>
        </div>
      </section>
      <section className="card">
        <h2 className="card-title">{t('profile.about')}</h2>
        <p className="small muted">{t('profile.ageNote')}</p>
        <p className="small muted">{t('profile.photoCredit')} <a href={PHOTO_CREDIT_URL} target="_blank" rel="noopener noreferrer">github.com/yuhonas/free-exercise-db</a>. {t('profile.iconsCredit')}</p>
      </section>
      <p className="center-text small muted">{t('profile.madeFor')}</p>
    </div>
  );
}

function RestDefault() {
  const data = useData();
  const { t } = useI18n();
  const sec = data.settings.restSec;
  return (
    <label className="field" key={sec}>
      <span className="field-label">{t('profile.restDefault')}</span>
      <span className="num-wrap">
        <input
          className="num" inputMode="numeric" defaultValue={String(sec)} aria-label={t('profile.restDefault')}
          onBlur={(e) => actions.setRestSec(Number(e.target.value.replace(/\D/g, '')) || 90)}
        />
        <span className="num-suffix">s</span>
      </span>
    </label>
  );
}

type R = ReturnType<typeof strengthResults>[number];
function StrengthCard({ r }: { r: R }) {
  const { t, d, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const unit = r.std.kind === 'seconds' ? 's' : r.std.kind === 'reps' ? 'reps' : 'kg';
  const info = r.info;
  const pos = info ? (info.level < 0 ? 0.01 : Math.min(1, (info.level + info.progress) / 5)) : 0;
  return (
    <button className="card inner lvl" onClick={() => setOpen(!open)} aria-expanded={open}>
      <div className="lvl-top">
        <div className="grow">
          <div className="entry-name">{exName(r.ex, locale)}</div>
          <div className="muted small">{r.best !== null ? <>{t('profile.yourBest')}: <b className="fg">{fmt(r.best)} {unit}</b>{unit === 'kg' && ' (est. 1RM)'}</> : t('profile.noDataYet')}</div>
        </div>
        {info && <span className="lvl-tag" style={{ background: info.level < 0 ? 'var(--line)' : LEVEL_COLORS[info.level] }}>{levelLabel(info.name, d)}</span>}
      </div>
      {r.th && (
        <>
          <div className="scale">
            {LEVEL_COLORS.map((c, i) => <span key={i} style={{ background: c, opacity: info && info.level >= i ? 1 : 0.28 }} />)}
            {info && <i className="marker" style={{ left: `${pos * 100}%` }} />}
          </div>
          {info && (info.next !== null ? (
            <div className="small next">
              <span><b>{fmt(info.toNext)} {unit}</b> {t('profile.moreTo')} <b style={{ color: LEVEL_COLORS[info.level + 1] }}>{info.nextName ? levelLabel(info.nextName, d) : ''}</b></span>
              <span className="muted">{Math.round(info.progress * 100)}%</span>
            </div>
          ) : <div className="small next">🏅 {t('profile.topLevel')}</div>)}
          {open && (
            <div className="th-row">
              {r.th.map((v, i) => <div key={i}><span style={{ color: LEVEL_COLORS[i] }}>{levelLabel(LEVELS[i], d)}</span><b>{fmt(v, 0)}</b></div>)}
            </div>
          )}
        </>
      )}
    </button>
  );
}
