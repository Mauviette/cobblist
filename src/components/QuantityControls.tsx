import { useI18n } from '../i18n/I18nProvider';

interface QuantityControlsProps {
  quantity: number;
  max?: number;
  showInput?: boolean;
  hiddenDeltas?: number[];
  onChange: (newQuantity: number) => void;
}

const QUICK_DELTAS = [64, 16, 1, -1, -16, -64];

export function QuantityControls({ quantity, max, showInput = true, hiddenDeltas, onChange }: QuantityControlsProps) {
  const { t } = useI18n();

  function clamp(value: number): number {
    const floored = Math.max(0, value);
    return max === undefined ? floored : Math.min(max, floored);
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {QUICK_DELTAS.filter((delta) => !hiddenDeltas?.includes(delta)).map((delta) => (
        <button
          key={delta}
          type="button"
          onClick={() => onChange(clamp(quantity + delta))}
          className={`bevel border-stone-500 px-1.5 py-0.5 text-xs font-bold active:bevel-inset ${
            delta > 0
              ? 'bg-emerald/15 hover:bg-emerald/25 dark:bg-emerald/20 dark:hover:bg-emerald/30'
              : 'bg-redstone/15 hover:bg-redstone/25 dark:bg-redstone/20 dark:hover:bg-redstone/30'
          }`}
        >
          {delta > 0 ? `+${delta}` : delta}
        </button>
      ))}
      {showInput && (
        <input
          type="number"
          min={0}
          max={max}
          value={quantity}
          aria-label={t('project.quantityInput')}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
          className="bevel-inset w-16 border-stone-400 bg-white px-1 py-0.5 text-center text-xs text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
      )}
    </div>
  );
}
