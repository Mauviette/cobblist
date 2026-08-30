import blocksData from '../data/blocks.json';
import type { BlockItem, Lang } from '../types';

export const BLOCKS: BlockItem[] = blocksData as BlockItem[];

export const BLOCKS_BY_ID: Map<string, BlockItem> = new Map(BLOCKS.map((b) => [b.id, b]));

export function blockName(block: BlockItem, lang: Lang): string {
  return block.names[lang] ?? block.names.en ?? block.id;
}

export function searchBlocks(query: string, lang: Lang, limit = 30): BlockItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return BLOCKS.filter((b) => blockName(b, lang).toLowerCase().includes(normalized)).slice(0, limit);
}

export function blocksByCategory(): Map<string, BlockItem[]> {
  const map = new Map<string, BlockItem[]>();
  for (const block of BLOCKS) {
    const list = map.get(block.category) ?? [];
    list.push(block);
    map.set(block.category, list);
  }
  return map;
}
