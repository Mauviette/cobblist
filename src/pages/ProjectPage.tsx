import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { AddQuantityDialog } from '../components/AddQuantityDialog';
import { BlockGrid } from '../components/BlockGrid';
import { BlockListItem } from '../components/BlockListItem';
import { BlockSearchBar } from '../components/BlockSearchBar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PrintView } from '../components/PrintView';
import { ProgressBar } from '../components/ProgressBar';
import { categoryLabel } from '../data/categories';
import { deriveMaterial, materialLabel } from '../data/materials';
import { useI18n } from '../i18n/I18nProvider';
import { BLOCKS_BY_ID, blockName } from '../lib/blocksIndex';
import { downloadProjectJson } from '../lib/importExport';
import { buildShareUrl } from '../lib/share';
import { computeProgress, isItemComplete } from '../lib/stacks';
import { useProjects } from '../store/useProjects';
import type { BlockItem, ProjectItem, ProjectMode, SortMode } from '../types';

// Le regroupement visuel par en-tête ne s'applique qu'aux tris qui ont un
// sens de "groupe" (catégorie wiki ou matériau dérivé) ; les autres tris
// (alphabétique, quantité, statut) n'affichent aucun en-tête.
function groupKeyFor(sortMode: SortMode, block: BlockItem): string | null {
  if (sortMode === 'category') return block.category;
  if (sortMode === 'material') return deriveMaterial(block.id);
  return null;
}

function groupLabelFor(sortMode: SortMode, key: string, lang: 'fr' | 'en'): string {
  if (sortMode === 'material') return materialLabel(key, lang);
  return categoryLabel(key, lang);
}

function withGroupHeaders<T extends { block: BlockItem }>(
  entries: T[],
  sortMode: SortMode,
): (T & { showGroupHeader: boolean; groupKey: string | null })[] {
  let lastGroupKey: string | null = null;
  return entries.map((entry) => {
    const groupKey = groupKeyFor(sortMode, entry.block);
    const showGroupHeader = groupKey !== null && groupKey !== lastGroupKey;
    if (groupKey !== null) lastGroupKey = groupKey;
    return { ...entry, showGroupHeader, groupKey };
  });
}

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { t, lang } = useI18n();
  const { projects, updateProjectItems, renameProject, updateProjectNotes } = useProjects();
  const initialMode: ProjectMode =
    (location.state as { initialMode?: ProjectMode } | null)?.initialMode === 'edit' ? 'edit' : 'completion';
  const [mode, setMode] = useState<ProjectMode>(initialMode);
  const [sortMode, setSortMode] = useState<SortMode>('category');
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [printView, setPrintView] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [pendingAddBlockId, setPendingAddBlockId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [notesDraft, setNotesDraft] = useState('');

  const project = projects.find((p) => p.id === id);

  useEffect(() => {
    setNotesDraft(project?.notes ?? '');
  }, [project?.id]);

  const sortedItems = useMemo(() => {
    if (!project) return [];
    const withBlocks = project.items
      .map((item) => ({ item, block: BLOCKS_BY_ID.get(item.blockId) }))
      .filter((x): x is { item: ProjectItem; block: NonNullable<typeof x.block> } => !!x.block);

    const compare = (a: typeof withBlocks[number], b: typeof withBlocks[number]) => {
      switch (sortMode) {
        case 'quantity':
          return b.item.quantity - a.item.quantity;
        case 'status':
          return (
            Number(isItemComplete(a.item)) - Number(isItemComplete(b.item)) ||
            blockName(a.block, lang).localeCompare(blockName(b.block, lang))
          );
        case 'category':
          return (
            categoryLabel(a.block.category, lang).localeCompare(categoryLabel(b.block.category, lang)) ||
            blockName(a.block, lang).localeCompare(blockName(b.block, lang))
          );
        case 'material':
          return (
            materialLabel(deriveMaterial(a.block.id), lang).localeCompare(materialLabel(deriveMaterial(b.block.id), lang)) ||
            blockName(a.block, lang).localeCompare(blockName(b.block, lang))
          );
        case 'alphabetical':
        default:
          return blockName(a.block, lang).localeCompare(blockName(b.block, lang));
      }
    };

    const sorted = [...withBlocks].sort(compare);

    return withGroupHeaders(sorted, sortMode);
  }, [project, sortMode, lang]);

  const displayedItems = useMemo(() => {
    const query = mode === 'completion' ? filterQuery.trim().toLowerCase() : '';
    if (!query) return sortedItems;

    const filtered = sortedItems.filter(({ block }) => blockName(block, lang).toLowerCase().includes(query));
    return withGroupHeaders(filtered, sortMode);
  }, [sortedItems, filterQuery, mode, sortMode, lang]);

  if (!project) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <Link to="/" className="text-sm underline">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  const progress = computeProgress(project.items);

  function mutateItems(updater: (items: ProjectItem[]) => ProjectItem[]) {
    if (!project) return;
    updateProjectItems(project.id, updater(project.items));
  }

  function addBlock(blockId: string, amount = 1) {
    mutateItems((items) => {
      const existing = items.find((i) => i.blockId === blockId);
      if (existing) {
        return items.map((i) => (i.blockId === blockId ? { ...i, quantity: i.quantity + amount } : i));
      }
      return [...items, { blockId, quantity: amount, obtainedQuantity: 0 }];
    });
  }

  function updateItem(blockId: string, patch: Partial<ProjectItem>) {
    mutateItems((items) => items.map((i) => (i.blockId === blockId ? { ...i, ...patch } : i)));
  }

  function removeItem(blockId: string) {
    mutateItems((items) => items.filter((i) => i.blockId !== blockId));
  }

  const itemToRemove = project.items.find((i) => i.blockId === pendingRemove);
  const itemToRemoveBlock = itemToRemove ? BLOCKS_BY_ID.get(itemToRemove.blockId) : undefined;

  async function handleShare() {
    if (!project) return;
    const url = buildShareUrl(project);
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  if (printView) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6">
        <button
          type="button"
          onClick={() => setPrintView(false)}
          className="bevel print:hidden mb-4 border-stone-500 bg-stone-200 px-3 py-1.5 text-sm font-semibold hover:bg-stone-300 active:bevel-inset dark:bg-stone-700 dark:hover:bg-stone-600"
        >
          {t('project.exitPrintView')}
        </button>
        <PrintView projectName={project.name} notes={project.notes} items={sortedItems} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {renaming ? (
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={() => {
                if (draftName.trim()) renameProject(project.id, draftName.trim());
                setRenaming(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="bevel-inset border-stone-400 bg-white px-2 py-1 text-xl font-bold text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
            />
          ) : (
            <h1
              className="font-pixel cursor-pointer text-xl"
              title={t('project.rename')}
              onClick={() => {
                setDraftName(project.name);
                setRenaming(true);
              }}
            >
              {project.name}
            </h1>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() => downloadProjectJson(project)}
            className="bevel border-stone-500 bg-stone-200 px-2 py-1.5 font-semibold hover:bg-stone-300 active:bevel-inset dark:bg-stone-700 dark:hover:bg-stone-600"
          >
            {t('project.exportJson')}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="bevel border-stone-500 bg-stone-200 px-2 py-1.5 font-semibold hover:bg-stone-300 active:bevel-inset dark:bg-stone-700 dark:hover:bg-stone-600"
          >
            {linkCopied ? t('project.shareLinkCopied') : t('project.shareLink')}
          </button>
          <button
            type="button"
            onClick={() => setPrintView(true)}
            className="bevel border-stone-500 bg-stone-200 px-2 py-1.5 font-semibold hover:bg-stone-300 active:bevel-inset dark:bg-stone-700 dark:hover:bg-stone-600"
          >
            {t('project.printView')}
          </button>
        </div>
      </div>

      <div className="bevel mb-4 flex flex-col gap-2 border-stone-400 bg-stone-50 p-3 dark:border-stone-600 dark:bg-stone-800">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>{t('project.progress', { obtained: progress.obtained, total: progress.total })}</span>
          <span>{progress.percent}%</span>
        </div>
        <ProgressBar percent={progress.percent} />
      </div>

      <div className="bevel mb-4 flex flex-col gap-1 border-stone-400 bg-stone-50 p-3 dark:border-stone-600 dark:bg-stone-800">
        <label htmlFor="project-notes" className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {t('project.notes')}
        </label>
        <textarea
          id="project-notes"
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={() => {
            if (project && notesDraft !== project.notes) updateProjectNotes(project.id, notesDraft);
          }}
          placeholder={t('project.notesPlaceholder')}
          rows={2}
          className="bevel-inset resize-y border-stone-400 bg-white px-2 py-1 text-sm text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        />
      </div>

      <div className="bevel-inset mb-6 flex border-stone-500 bg-stone-200 p-1 dark:bg-stone-900">
        <button
          type="button"
          onClick={() => setMode('completion')}
          className={`flex flex-1 items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold ${
            mode === 'completion'
              ? 'bevel border-emerald-dark bg-emerald text-white'
              : 'text-stone-600 dark:text-stone-300'
          }`}
        >
          <img src="/icons/knowledge_book.png" alt="" aria-hidden="true" className="pixelated h-5 w-5" />
          {t('project.mode.completion')}
        </button>
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={`flex flex-1 items-center justify-center gap-2 px-3 py-1.5 text-sm font-semibold ${
            mode === 'edit' ? 'bevel border-emerald-dark bg-emerald text-white' : 'text-stone-600 dark:text-stone-300'
          }`}
        >
          <img src="/icons/iron_pickaxe.png" alt="" aria-hidden="true" className="pixelated h-5 w-5" />
          {t('project.mode.edit')}
        </button>
      </div>

      {mode === 'edit' && (
        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <BlockSearchBar onAdd={(blockId) => setPendingAddBlockId(blockId)} />
          <BlockGrid onAdd={(blockId) => setPendingAddBlockId(blockId)} />
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="sort-select" className="font-semibold text-stone-500 dark:text-stone-400">
          {t('project.sortLabel')}
        </label>
        <select
          id="sort-select"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="bevel-inset border-stone-400 bg-white px-2 py-1 text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        >
          <option value="category">{t('project.sort.category')}</option>
          <option value="material">{t('project.sort.material')}</option>
          <option value="alphabetical">{t('project.sort.alphabetical')}</option>
          <option value="quantity">{t('project.sort.quantity')}</option>
          <option value="status">{t('project.sort.status')}</option>
        </select>
        {mode === 'completion' && (
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder={t('project.filterPlaceholder')}
            aria-label={t('project.filterPlaceholder')}
            className="bevel-inset w-48 border-stone-400 bg-white px-2 py-1 text-stone-900 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          />
        )}
      </div>

      {sortedItems.length === 0 ? (
        <div className="bevel flex flex-col items-center gap-2 border-stone-400 bg-stone-50 px-6 py-12 text-center dark:border-stone-600 dark:bg-stone-800">
          <h2 className="font-pixel text-base">{t('project.emptyTitle')}</h2>
          <p className="max-w-sm text-sm text-stone-500 dark:text-stone-400">{t('project.emptyBody')}</p>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="bevel flex flex-col items-center gap-2 border-stone-400 bg-stone-50 px-6 py-12 text-center dark:border-stone-600 dark:bg-stone-800">
          <p className="text-sm text-stone-500 dark:text-stone-400">{t('project.noResults')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {displayedItems.map(({ item, block, showGroupHeader, groupKey }) => {
            return (
              <div key={item.blockId}>
                {showGroupHeader && groupKey && (
                  <h3 className="mt-3 mb-1 text-xs font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                    {groupLabelFor(sortMode, groupKey, lang)}
                  </h3>
                )}
                <BlockListItem
                  item={item}
                  block={block}
                  mode={mode}
                  onQuantityChange={(quantity) => updateItem(item.blockId, { quantity })}
                  onObtainedQuantityChange={(obtainedQuantity) => updateItem(item.blockId, { obtainedQuantity })}
                  onRemove={() => setPendingRemove(item.blockId)}
                />
              </div>
            );
          })}
        </div>
      )}

      <AddQuantityDialog
        block={pendingAddBlockId ? (BLOCKS_BY_ID.get(pendingAddBlockId) ?? null) : null}
        onCancel={() => setPendingAddBlockId(null)}
        onConfirm={(quantity) => {
          if (pendingAddBlockId) addBlock(pendingAddBlockId, quantity);
          setPendingAddBlockId(null);
        }}
      />

      <ConfirmDialog
        open={pendingRemove !== null}
        title={t('project.removeItem')}
        body={t('project.removeItemConfirm', {
          name: itemToRemoveBlock ? blockName(itemToRemoveBlock, lang) : '',
        })}
        danger
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          if (pendingRemove) removeItem(pendingRemove);
          setPendingRemove(null);
        }}
      />
    </div>
  );
}
