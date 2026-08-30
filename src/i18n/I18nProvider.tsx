import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import en from './en.json';
import fr from './fr.json';
import type { Lang } from '../types';

const DICTIONARIES: Record<Lang, Record<string, string>> = { en, fr };
const STORAGE_KEY = 'cobblist:lang';

function detectInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'fr' || stored === 'en') return stored;
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => detectInitialLang());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useMemo(() => {
    const dict = DICTIONARIES[lang];
    return (key: string, vars?: Record<string, string | number>) => {
      let template = dict[key] ?? key;
      if (vars) {
        for (const [varKey, value] of Object.entries(vars)) {
          template = template.replace(`{{${varKey}}}`, String(value));
        }
      }
      return template;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
