import { useI18n } from '../i18n/I18nProvider';
import { blockName } from '../lib/blocksIndex';
import { formatQuantity, isItemComplete } from '../lib/stacks';
import { wikiUrl } from '../lib/wiki';
import type { BlockItem, ProjectItem, ProjectMode } from '../types';
import { BlockIcon } from './BlockIcon';
import { ProgressBar } from './ProgressBar';
import { QuantityControls } from './QuantityControls';

interface BlockListItemProps {
  item: ProjectItem;
  block: BlockItem;
  mode: ProjectMode;
  onQuantityChange: (quantity: number) => void;
  onObtainedQuantityChange: (obtainedQuantity: number) => void;
  onRemove: () => void;
}

// En mode complétion, un bouton de pas n'a de sens que si la quantité
// nécessaire le justifie, et les bornes (0 obtenu / entièrement complété)
// désactivent les boutons qui n'auraient aucun effet utile.
function completionHiddenDeltas(item: ProjectItem): number[] {
  const hidden: number[] = [];
  if (isItemComplete(item)) hidden.push(64, 1);
  if (item.quantity < 16) hidden.push(16, -16);
  if (item.quantity < 1) hidden.push(1);
  if (item.obtainedQuantity === 0) hidden.push(-1, -16, -64);
  return hidden;
}

export function BlockListItem({
  item,
  block,
  mode,
  onQuantityChange,
  onObtainedQuantityChange,
  onRemove,
}: BlockListItemProps) {
  const { t, lang } = useI18n();
  const name = blockName(block, lang);
  const complete = isItemComplete(item);
  const percent = item.quantity === 0 ? 0 : Math.round((Math.min(item.obtainedQuantity, item.quantity) / item.quantity) * 100);

  return (
    <div
      className={`bevel flex flex-col gap-2 border-stone-400 bg-stone-50 p-3 dark:border-stone-600 dark:bg-stone-800 sm:flex-row sm:items-center ${
        complete ? 'opacity-60' : ''
      }`}
    >
      <div className="flex flex-1 items-center gap-3">
        <BlockIcon iconRef={block.iconRef} alt={name} size={32} />
        <div className="min-w-0 flex-1">
          <a
            href={wikiUrl(name, lang)}
            target="_blank"
            rel="noopener noreferrer"
            className={`truncate text-sm font-semibold hover:underline ${complete ? 'line-through' : ''}`}
          >
            {name}
          </a>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {formatQuantity(item.obtainedQuantity, block.stackSize, t)} /{' '}
            {formatQuantity(item.quantity, block.stackSize, t)}
          </p>
          <div className="mt-1 w-32">
            <ProgressBar percent={percent} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {mode === 'edit' ? (
          <>
            <QuantityControls quantity={item.quantity} onChange={onQuantityChange} />
            <button
              type="button"
              onClick={onRemove}
              aria-label={t('project.removeItem')}
              title={t('project.removeItem')}
              className="bevel border-redstone-dark bg-redstone px-2 py-1 text-xs font-bold text-white hover:brightness-110 active:bevel-inset"
            >
              ✕
            </button>
          </>
        ) : (
          <QuantityControls
            quantity={item.obtainedQuantity}
            max={item.quantity}
            showInput={false}
            hiddenDeltas={completionHiddenDeltas(item)}
            onChange={onObtainedQuantityChange}
          />
        )}
      </div>
    </div>
  );
}
