import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ProjectCard } from '../components/ProjectCard';
import { useI18n } from '../i18n/I18nProvider';
import { InvalidProjectFileError, parseProjectJson, readFileAsText } from '../lib/importExport';
import { useProjects } from '../store/useProjects';

export function HomePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { projects, createProject, importProject, renameProject, duplicateProject, deleteProject } =
    useProjects();
  const [newName, setNewName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [importError, setImportError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sorted = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const projectToDelete = projects.find((p) => p.id === pendingDelete);

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const project = createProject(trimmed);
    setNewName('');
    navigate(`/project/${project.id}`, { state: { initialMode: 'edit' } });
  }

  async function handleImportFile(file: File) {
    try {
      const text = await readFileAsText(file);
      const project = parseProjectJson(text);
      importProject(project);
      setImportError(false);
    } catch (err) {
      if (err instanceof InvalidProjectFileError) setImportError(true);
      else throw err;
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-pixel text-2xl">{t('home.title')}</h1>
        <div className="flex flex-wrap gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder={t('home.newProjectPlaceholder')}
            className="bevel-inset border-stone-400 bg-white px-3 py-1.5 text-sm text-stone-900 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="bevel border-emerald-dark bg-emerald px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110 active:bevel-inset"
          >
            {t('home.newProject')}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bevel border-stone-500 bg-stone-200 px-3 py-1.5 text-sm font-semibold hover:bg-stone-300 active:bevel-inset dark:bg-stone-700 dark:hover:bg-stone-600"
          >
            {t('home.importProject')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {importError && (
        <p className="mb-4 bevel-inset border-redstone bg-redstone/10 px-3 py-2 text-sm text-redstone-dark dark:text-redstone">
          {t('shared.invalid')}
        </p>
      )}

      {sorted.length === 0 ? (
        <div className="bevel flex flex-col items-center gap-3 border-stone-400 bg-stone-50 px-6 py-16 text-center dark:border-stone-600 dark:bg-stone-800">
          <h2 className="font-pixel text-lg">{t('home.emptyTitle')}</h2>
          <p className="max-w-sm text-sm text-stone-500 dark:text-stone-400">{t('home.emptyBody')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onRename={(name) => renameProject(project.id, name)}
              onDuplicate={() => duplicateProject(project.id, t('home.copySuffix'))}
              onDelete={() => setPendingDelete(project.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t('home.deleteConfirmTitle')}
        body={t('home.deleteConfirmBody', { name: projectToDelete?.name ?? '' })}
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteProject(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
