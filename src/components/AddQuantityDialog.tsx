import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { blockName } from '../lib/blocksIndex';
import type { BlockItem } from '../types';
import { BlockIcon } from './BlockIcon';

interface AddQuantityDialogProps {
  block: BlockItem | null;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
}

const QUICK_AMOUNTS = [1, 16, 64];

export function AddQuantityDialog({ block, onConfirm, onCancel }: AddQuantityDialogProps) {
  const { t, lang } = useI18n();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (block) setQuantity(1);
  }, [block]);

  if (!block) return null;

  const name = blockName(block, lang);

  function submit() {
    if (quantity > 0) onConfirm(quantity);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bevel w-full max-w-sm border-stone-600 bg-stone-100 p-4 text-stone-900 dark:bg-stone-800 dark:text-stone-100">
        <div className="mb-3 flex items-center gap-2">
          <BlockIcon iconRef={block.iconRef} alt={name} size={28} />
          <h2 className="font-pixel text-base">{name}</h2>
        </div>
        <label htmlFor="add-quantity-input" className="mb-1 block text-xs font-semibold text-stone-500 dark:text-stone-400">
          {t('project.addQuantityLabel')}
        </label>
        <input
          id="add-quantity-input"
          type="number"
          min={1}
          autoFocus
          value={quantity}
          onChange={(e) => setQuantity(Math.max(0, Number(e.target.value) || 0))}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="bevel-inset mb-3 w-full border-stone-400 bg-white px-2 py-1.5 text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
        <div className="mb-4 flex gap-1">
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => setQuantity(amount)}
              className="bevel border-stone-500 bg-stone-200 px-2 py-1 text-xs font-bold hover:bg-stone-300 active:bevel-inset dark:bg-stone-700 dark:hover:bg-stone-600"
            >
              {amount}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="bevel border-stone-500 bg-stone-300 px-3 py-1.5 text-sm font-semibold hover:bg-stone-200 active:bevel-inset dark:bg-stone-600 dark:hover:bg-stone-500"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={quantity <= 0}
            className="bevel border-emerald-dark bg-emerald px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110 active:bevel-inset disabled:opacity-50"
          >
            {t('project.addBlock')}
          </button>
        </div>
      </div>
    </div>
  );
}
