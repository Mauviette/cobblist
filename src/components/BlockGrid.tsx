import { useMemo, useState } from 'react';
import { categoryLabel } from '../data/categories';
import { useI18n } from '../i18n/I18nProvider';
import { blockName, blocksByCategory } from '../lib/blocksIndex';
import { BlockIcon } from './BlockIcon';

interface BlockGridProps {
  onAdd: (blockId: string) => void;
}

export function BlockGrid({ onAdd }: BlockGridProps) {
  const { t, lang } = useI18n();
  const byCategory = useMemo(() => blocksByCategory(), []);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  return (
    <div className="bevel border-stone-400 bg-stone-50 dark:border-stone-600 dark:bg-stone-800">
      <p className="border-b border-stone-300 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:border-stone-700 dark:text-stone-400">
        {t('project.browseByCategory')}
      </p>
      <div className="divide-y divide-stone-300 dark:divide-stone-700">
        {[...byCategory.entries()].map(([catId, blocks]) => {
          const isOpen = openCategory === catId;
          return (
            <div key={catId}>
              <button
                type="button"
                onClick={() => setOpenCategory(isOpen ? null : catId)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold hover:bg-stone-200 dark:hover:bg-stone-700"
              >
                <span>{categoryLabel(catId, lang)}</span>
                <span className="text-xs text-stone-400">
                  {blocks.length} {isOpen ? '▲' : '▼'}
                </span>
              </button>
              {isOpen && (
                <div className="grid grid-cols-6 gap-1 p-2 sm:grid-cols-10 md:grid-cols-12">
                  {blocks.map((block) => (
                    <button
                      key={block.id}
                      type="button"
                      title={blockName(block, lang)}
                      onClick={() => onAdd(block.id)}
                      className="flex items-center justify-center bg-stone-200 p-1 hover:bg-emerald/40 dark:bg-stone-700"
                    >
                      <BlockIcon iconRef={block.iconRef} alt={blockName(block, lang)} size={28} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
