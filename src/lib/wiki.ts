import type { Lang } from '../types';

const WIKI_HOST: Record<Lang, string> = {
  fr: 'https://fr.minecraft.wiki/w/',
  en: 'https://minecraft.wiki/w/',
};

export function wikiUrl(name: string, lang: Lang): string {
  return WIKI_HOST[lang] + encodeURIComponent(name.replace(/ /g, '_'));
}
