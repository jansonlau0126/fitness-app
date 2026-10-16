import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { en, type Dict } from './en';
import { zhTW } from './zh-TW';
import { EX_ZH, EQUIP_ZH } from './names-zh';
import type { Exercise, BodyPart, Muscle } from '../data/exercises';
import { equipName as enEquip } from '../data/equipment';
import { muscleName as enMuscle, partLabel as enPart } from '../data/exercises';
import type { Locale } from '../lib/store';
import { useData, actions } from '../lib/store';

const dicts: Record<Locale, Dict> = { en, 'zh-TW': zhTW };

type TFn = (path: string, vars?: Record<string, string | number>) => string;

function getPath(d: Dict, path: string): string {
  const parts = path.split('.');
  let cur: unknown = d;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as object)) cur = (cur as Record<string, unknown>)[p];
    else return path;
  }
  return typeof cur === 'string' ? cur : path;
}

function fill(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

const I18nCtx = createContext<{ locale: Locale; t: TFn; d: Dict }>({ locale: 'en', t: (p) => p, d: en });

export function I18nProvider({ children }: { children: ReactNode }) {
  const data = useData();
  const locale = data.settings.locale ?? 'en';
  const value = useMemo(() => {
    const d = dicts[locale] ?? en;
    const t: TFn = (path, vars) => fill(getPath(d, path), vars);
    return { locale, t, d };
  }, [locale]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() { return useContext(I18nCtx); }

export function useLocaleActions() {
  return { setLocale: (l: Locale) => actions.setLocale(l) };
}

export function exName(ex: Exercise | undefined, locale: Locale): string {
  if (!ex) return '';
  if (locale === 'zh-TW') return EX_ZH[ex.id]?.name ?? ex.name;
  return ex.name;
}
export function exNameEn(ex: Exercise | undefined): string { return ex?.name ?? ''; }
export function exHow(ex: Exercise | undefined, locale: Locale): string[] {
  if (!ex) return [];
  if (locale === 'zh-TW' && EX_ZH[ex.id]?.how) return EX_ZH[ex.id].how!;
  return ex.how;
}
export function equipLabel(id: string, locale: Locale): string {
  if (locale === 'zh-TW' && EQUIP_ZH[id]) return EQUIP_ZH[id];
  return enEquip(id);
}
export function partLabelI18n(p: BodyPart, locale: Locale, d: Dict): string {
  if (locale === 'zh-TW') return d.parts[p] ?? enPart(p);
  return enPart(p);
}
export function muscleLabel(m: Muscle, locale: Locale, d: Dict): string {
  if (locale === 'zh-TW') return d.muscles[m] ?? enMuscle(m);
  return enMuscle(m);
}
export function levelLabel(name: string, d: Dict): string {
  return (d.levels as Record<string, string>)[name] ?? name;
}
