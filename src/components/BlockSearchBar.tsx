import { useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { blockName, searchBlocks } from '../lib/blocksIndex';
import { BlockIcon } from './BlockIcon';

interface BlockSearchBarProps {
  onAdd: (blockId: string) => void;
}

export function BlockSearchBar({ onAdd }: BlockSearchBarProps) {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchBlocks(query, lang, 12), [query, lang]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('project.searchPlaceholder')}
        className="bevel-inset w-full border-stone-400 bg-white px-3 py-2 text-sm text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
      />
      {query.trim() && (
        <div className="bevel absolute z-20 mt-1 max-h-80 w-full overflow-y-auto border-stone-500 bg-stone-50 dark:bg-stone-800">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-stone-500 dark:text-stone-400">{t('project.noResults')}</p>
          ) : (
            results.map((block) => (
              <button
                key={block.id}
                type="button"
                onClick={() => {
                  onAdd(block.id);
                  setQuery('');
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-stone-200 dark:hover:bg-stone-700"
              >
                <BlockIcon iconRef={block.iconRef} alt={blockName(block, lang)} size={20} />
                <span>{blockName(block, lang)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
