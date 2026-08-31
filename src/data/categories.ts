export interface CategoryInfo {
  labels: { fr: string; en: string };
  accent: string;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  blocs_bois: {
    labels: { fr: 'Bloc en bois', en: 'Wood Blocks' },
    accent: '#a5732c',
  },
  blocs_construction: {
    labels: { fr: 'Blocs de construction', en: 'Building Blocks' },
    accent: '#8a8a8a',
  },
  blocs_naturels: {
    labels: { fr: 'Blocs naturels', en: 'Natural Blocks' },
    accent: '#33ab4c',
  },
  blocs_fonctionnels: {
    labels: { fr: 'Blocs fonctionnels', en: 'Functional Blocks' },
    accent: '#2f5fce',
  },
  blocs_decoratifs: {
    labels: { fr: 'Blocs décoratifs', en: 'Decorative Blocks' },
    accent: '#e0a721',
  },
  blocs_colorees: {
    labels: { fr: 'Blocs colorées', en: 'Colored Blocks' },
    accent: '#d3401f',
  },
  objets_placables: {
    labels: { fr: 'Objets plaçables', en: 'Placeable Objects' },
    accent: '#6a4fb0',
  },
};

export function categoryLabel(categoryId: string, lang: 'fr' | 'en'): string {
  return CATEGORIES[categoryId]?.labels[lang] ?? categoryId;
}
