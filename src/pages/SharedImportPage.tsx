import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { decodeSharedProject } from '../lib/share';
import { useProjects } from '../store/useProjects';

export function SharedImportPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { importProject } = useProjects();

  const shared = useMemo(() => {
    const p = searchParams.get('p');
    return p ? decodeSharedProject(p) : null;
  }, [searchParams]);

  if (!shared) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="mb-4 text-sm text-stone-600 dark:text-stone-300">{t('shared.invalid')}</p>
        <Link to="/" className="underline">
          {t('shared.goHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <div className="bevel border-stone-400 bg-stone-50 p-6 dark:border-stone-600 dark:bg-stone-800">
        <h1 className="font-pixel mb-3 text-lg">{t('shared.title')}</h1>
        <p className="mb-6 text-sm text-stone-600 dark:text-stone-300">
          {t('shared.body', { name: shared.name, count: shared.items.length })}
        </p>
        <button
          type="button"
          onClick={() => {
            const imported = importProject(shared);
            navigate(`/project/${imported.id}`);
          }}
          className="bevel border-emerald-dark bg-emerald px-4 py-2 text-sm font-semibold text-white hover:brightness-110 active:bevel-inset"
        >
          {t('shared.importCta')}
        </button>
      </div>
    </div>
  );
}
