import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';

export function Header() {
  const { lang, setLang, t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bevel bg-texture-header border-stone-700 bg-stone-800 text-stone-50">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          {/* Icône du site, ajoutée manuellement. */}
          <img src="/logo.png" alt="" aria-hidden="true" className="pixelated h-8 w-8" />
          <span className="font-pixel text-xl tracking-wide sm:text-2xl">{t('app.name')}</span>
          <span className="hidden text-xs text-stone-300 sm:inline">{t('app.tagline')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
            aria-label={t('lang.toggle')}
            className="bevel border-stone-600 bg-stone-700 px-2 py-1 text-xs font-bold uppercase hover:bg-stone-600 active:bevel-inset"
          >
            {lang}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t('theme.toggle')}
            className="bevel border-stone-600 bg-stone-700 px-2 py-1 hover:bg-stone-600 active:bevel-inset"
          >
            <img
              src={theme === 'dark' ? '/icons/clock_night.png' : '/icons/clock_day.png'}
              alt=""
              aria-hidden="true"
              className="pixelated h-5 w-5"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
