import { useI18n } from '../i18n/I18nProvider';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, body, danger, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useI18n();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bevel w-full max-w-sm border-stone-600 bg-stone-100 p-4 text-stone-900 dark:bg-stone-800 dark:text-stone-100">
        <h2 className="font-pixel mb-2 text-lg">{title}</h2>
        <p className="mb-4 text-sm text-stone-600 dark:text-stone-300">{body}</p>
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
            onClick={onConfirm}
            className={`bevel px-3 py-1.5 text-sm font-semibold text-white active:bevel-inset ${
              danger ? 'border-redstone-dark bg-redstone hover:brightness-110' : 'border-emerald-dark bg-emerald hover:brightness-110'
            }`}
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
