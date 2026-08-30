import type { ProjectItem } from '../types';

export function toStacks(quantity: number, stackSize: number): { stacks: number; rest: number } {
  return { stacks: Math.floor(quantity / stackSize), rest: quantity % stackSize };
}

export function formatQuantity(
  quantity: number,
  stackSize: number,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  if (stackSize === 1) return String(quantity);
  const { stacks, rest } = toStacks(quantity, stackSize);
  if (stacks === 0) return String(quantity);
  const plural = stacks !== 1 ? 'Plural' : '';
  if (rest === 0) return t(`project.stacksFormatExact${plural}`, { total: quantity, stacks });
  return t(`project.stacksFormat${plural}`, { total: quantity, stacks, rest });
}

export interface ProgressInfo {
  obtained: number;
  total: number;
  percent: number;
}

export function computeProgress(items: ProjectItem[]): ProgressInfo {
  let obtained = 0;
  let total = 0;
  for (const item of items) {
    total += item.quantity;
    obtained += Math.min(item.obtainedQuantity, item.quantity);
  }
  const percent = total === 0 ? 0 : Math.round((obtained / total) * 100);
  return { obtained, total, percent };
}

export function isItemComplete(item: ProjectItem): boolean {
  return item.quantity > 0 && item.obtainedQuantity >= item.quantity;
}
