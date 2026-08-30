export interface BlockItem {
  id: string;
  names: Record<string, string>;
  category: string;
  stackSize: 1 | 16 | 64;
  iconRef: string;
}

export interface ProjectItem {
  blockId: string;
  quantity: number;
  obtainedQuantity: number;
}

export type ProjectMode = 'edit' | 'completion';

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: ProjectItem[];
}

export type Lang = 'fr' | 'en';

export type SortMode = 'alphabetical' | 'quantity' | 'category' | 'status';
