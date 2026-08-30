import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { BLOCKS_BY_ID, blockName } from '../lib/blocksIndex';
import { computeProgress } from '../lib/stacks';
import type { BlockItem, Project } from '../types';
import { BlockIcon } from './BlockIcon';
import { ProgressBar } from './ProgressBar';

interface ProjectCardProps {
  project: Project;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function ProjectCard({ project, onRename, onDuplicate, onDelete }: ProjectCardProps) {
  const { t, lang } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(project.name);
  const progress = computeProgress(project.items);
  const updatedAt = new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(project.updatedAt),
  );

  // Aperçu des blocs nécessaires, du plus au moins demandé. Rendu dans une
  // rangée qui ne passe jamais à la ligne et masque le débordement : la
  // largeur disponible (alignée sur la barre de progression) détermine
  // naturellement combien d'icônes tiennent, sans calcul en JS.
  const previewBlocks = useMemo(() => {
    return [...project.items]
      .sort((a, b) => b.quantity - a.quantity)
      .map((item) => BLOCKS_BY_ID.get(item.blockId))
      .filter((block): block is BlockItem => !!block);
  }, [project.items]);

  function commitRename() {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== project.name) onRename(trimmed);
    setEditing(false);
  }

  return (
    <div className="bevel flex flex-col gap-3 border-stone-400 bg-stone-50 p-4 dark:border-stone-600 dark:bg-stone-800">
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') {
                setDraftName(project.name);
                setEditing(false);
              }
            }}
            className="bevel-inset min-w-0 flex-1 border-stone-500 bg-white px-2 py-1 text-lg font-semibold text-stone-900 dark:bg-stone-900 dark:text-stone-100"
          />
        ) : (
          <Link to={`/project/${project.id}`} className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold hover:underline">{project.name}</h3>
          </Link>
        )}
      </div>

      <p className="text-xs text-stone-500 dark:text-stone-400">
        {t('home.updatedAt', { date: updatedAt })} · {t('home.itemsCount', { count: project.items.length })}
      </p>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ProgressBar percent={progress.percent} />
        </div>
        <span className="w-10 shrink-0 text-right text-xs font-semibold text-stone-500 dark:text-stone-400">
          {progress.percent}%
        </span>
      </div>

      {previewBlocks.length > 0 && (
        <div className="bevel-inset flex flex-nowrap items-center gap-1 overflow-hidden border-stone-400 bg-stone-100 p-1.5 dark:border-stone-600 dark:bg-stone-900">
          {previewBlocks.map((block) => (
            <BlockIcon key={block.id} iconRef={block.iconRef} alt={blockName(block, lang)} size={20} />
          ))}
        </div>
      )}

      <div className="mt-1 flex flex-wrap gap-2 text-xs">
        <Link
          to={`/project/${project.id}`}
          className="bevel border-stone-500 bg-stone-200 px-2 py-1 font-semibold hover:bg-stone-300 active:bevel-inset dark:bg-stone-700 dark:hover:bg-stone-600"
        >
          {t('home.open')}
        </Link>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="bevel border-stone-500 bg-stone-200 px-2 py-1 font-semibold hover:bg-stone-300 active:bevel-inset dark:bg-stone-700 dark:hover:bg-stone-600"
        >
          {t('common.rename')}
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="bevel border-stone-500 bg-stone-200 px-2 py-1 font-semibold hover:bg-stone-300 active:bevel-inset dark:bg-stone-700 dark:hover:bg-stone-600"
        >
          {t('common.duplicate')}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="bevel border-redstone-dark bg-redstone px-2 py-1 font-semibold text-white hover:brightness-110 active:bevel-inset"
        >
          {t('common.delete')}
        </button>
      </div>
    </div>
  );
}
