import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Project } from '../types';

interface SharedPayload {
  name: string;
  items: Project['items'];
}

export function buildShareUrl(project: Project): string {
  const payload: SharedPayload = { name: project.name, items: project.items };
  const compressed = compressToEncodedURIComponent(JSON.stringify(payload));
  const url = new URL('/s', window.location.origin);
  url.searchParams.set('p', compressed);
  return url.toString();
}

export function decodeSharedProject(compressed: string): Project | null {
  try {
    const json = decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    const payload = JSON.parse(json) as SharedPayload;
    if (typeof payload.name !== 'string' || !Array.isArray(payload.items)) return null;
    const now = new Date().toISOString();
    return { id: crypto.randomUUID(), name: payload.name, items: payload.items, createdAt: now, updatedAt: now };
  } catch {
    return null;
  }
}
