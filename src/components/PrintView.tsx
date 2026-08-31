import { useI18n } from '../i18n/I18nProvider';
import { blockName } from '../lib/blocksIndex';
import { formatQuantity } from '../lib/stacks';
import type { BlockItem, ProjectItem } from '../types';
import { BlockIcon } from './BlockIcon';

interface PrintViewProps {
  projectName: string;
  notes?: string;
  items: { item: ProjectItem; block: BlockItem }[];
}

export function PrintView({ projectName, notes, items }: PrintViewProps) {
  const { t, lang } = useI18n();

  return (
    <div className="text-stone-900">
      <h1 className="mb-2 text-2xl font-bold">{projectName}</h1>
      {notes && <p className="mb-4 whitespace-pre-wrap text-sm text-stone-700">{notes}</p>}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-stone-800 text-left">
            <th className="py-1 pr-2">{t('print.obtained')}</th>
            <th className="py-1 pr-2" />
            <th className="py-1 pr-2">{t('print.name')}</th>
            <th className="py-1 pr-2">{t('print.quantity')}</th>
            <th className="py-1 pl-8">{t('print.progress')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ item, block }) => {
            const percent =
              item.quantity === 0 ? 0 : Math.round((Math.min(item.obtainedQuantity, item.quantity) / item.quantity) * 100);
            return (
              <tr key={item.blockId} className="border-b border-stone-300">
                <td className="py-1 pr-2 align-middle">{percent >= 100 ? '☑' : '☐'}</td>
                <td className="py-1 pr-2 align-middle">
                  <BlockIcon iconRef={block.iconRef} alt={blockName(block, lang)} size={24} />
                </td>
                <td className="py-1 pr-2 align-middle">{blockName(block, lang)}</td>
                <td className="py-1 pr-2 align-middle whitespace-nowrap">
                  {formatQuantity(item.obtainedQuantity, block.stackSize, t)} /{' '}
                  {formatQuantity(item.quantity, block.stackSize, t)}
                </td>
                <td className="py-1 pl-8 align-middle">
                  <span
                    className="block h-2 w-32 border border-stone-800"
                    style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
                  >
                    <span
                      className="block h-full bg-stone-800"
                      style={{
                        width: `${Math.max(0, Math.min(100, percent))}%`,
                        printColorAdjust: 'exact',
                        WebkitPrintColorAdjust: 'exact',
                      }}
                    />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
