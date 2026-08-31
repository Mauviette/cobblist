import type { Project, ProjectItem } from '../types';

export class InvalidProjectFileError extends Error {}

function isValidItem(x: unknown): x is ProjectItem {
  if (typeof x !== 'object' || x === null) return false;
  const item = x as Record<string, unknown>;
  return (
    typeof item.blockId === 'string' &&
    typeof item.quantity === 'number' &&
    typeof item.obtainedQuantity === 'number'
  );
}

export function parseProjectJson(raw: string): Project {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new InvalidProjectFileError('Invalid JSON');
  }
  if (typeof data !== 'object' || data === null) throw new InvalidProjectFileError('Not an object');
  const project = data as Record<string, unknown>;
  if (
    typeof project.name !== 'string' ||
    !Array.isArray(project.items) ||
    !project.items.every(isValidItem)
  ) {
    throw new InvalidProjectFileError('Missing required project fields');
  }
  const now = new Date().toISOString();
  return {
    id: typeof project.id === 'string' ? project.id : crypto.randomUUID(),
    name: project.name,
    createdAt: typeof project.createdAt === 'string' ? project.createdAt : now,
    updatedAt: typeof project.updatedAt === 'string' ? project.updatedAt : now,
    items: project.items as ProjectItem[],
    notes: typeof project.notes === 'string' ? project.notes : '',
  };
}

export function downloadProjectJson(project: Project): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[^a-z0-9_-]+/gi, '_')}.cobblist.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
