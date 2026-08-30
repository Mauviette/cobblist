import { useCallback, useEffect, useState } from 'react';
import type { Project, ProjectItem } from '../types';

const STORAGE_KEY = 'cobblist:projects';

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function newId(): string {
  return crypto.randomUUID();
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const createProject = useCallback((name: string): Project => {
    const now = new Date().toISOString();
    const project: Project = { id: newId(), name, createdAt: now, updatedAt: now, items: [] };
    setProjects((prev) => [...prev, project]);
    return project;
  }, []);

  const importProject = useCallback((project: Project): Project => {
    const now = new Date().toISOString();
    const imported: Project = { ...project, id: newId(), createdAt: now, updatedAt: now };
    setProjects((prev) => [...prev, imported]);
    return imported;
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p)),
    );
  }, []);

  const duplicateProject = useCallback((id: string, copySuffix: string) => {
    setProjects((prev) => {
      const source = prev.find((p) => p.id === id);
      if (!source) return prev;
      const now = new Date().toISOString();
      const copy: Project = {
        ...source,
        id: newId(),
        name: `${source.name} ${copySuffix}`,
        createdAt: now,
        updatedAt: now,
        items: source.items.map((item) => ({ ...item })),
      };
      return [...prev, copy];
    });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateProjectItems = useCallback((id: string, items: ProjectItem[]) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, items, updatedAt: new Date().toISOString() } : p)),
    );
  }, []);

  return {
    projects,
    createProject,
    importProject,
    renameProject,
    duplicateProject,
    deleteProject,
    updateProjectItems,
  };
}
