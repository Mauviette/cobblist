// Script d'ajout des "objets plaçables" à la base de blocs Cobblist.
// Exécuté manuellement en dev (npm run generate:items), jamais côté client.
//
// Contrairement à generate-blocks.mjs (qui scrape exhaustivement la page
// wiki "Bloc"), ce script n'ajoute qu'une whitelist choisie à la main :
// minecraft.wiki/w/Item recense tous les objets du jeu, dont l'immense
// majorité (outils, nourriture, ingrédients...) n'a pas sa place dans une
// liste de courses de construction. Seuls les objets qu'on "place" belle et
// bien dans le monde (au même titre qu'un bloc) sont retenus ici.
//
// Source des icônes : minecraft.wiki/images/ItemSprite_<slug>.png (sprite
// plat, extrait de la page objet), pour rester visuellement cohérent avec
// les entrées "bloc-entité" déjà présentes dans blocks.json (item_frame,
// glow_item_frame), qui utilisent ce même style de sprite plat plutôt que
// les rendus isométriques "Invicon" (absents, trop lourds ou animés pour
// certains objets, ex. le Cristal de l'End).

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'public', 'blocks', 'icons');
const OUTPUT_FILE = path.join(ROOT, 'src', 'data', 'blocks.json');

const USER_AGENT = 'CobblistDevScript/0.1 (+https://github.com/; contact: julesbouquet4@gmail.com)';
const CATEGORY_ID = 'objets_placables';

// Whitelist validée avec l'utilisateur (2026-08-31) : item frame / glow item
// frame étaient déjà présents dans blocks.json (catégorie blocs_decoratifs,
// le wiki FR "Bloc" les recense comme des blocs), le reste ne l'était pas.
const WHITELIST = [
  { id: 'painting', pageTitle: 'Painting', spriteSlug: 'painting', fr: 'Tableau', stackSize: 64 },
  { id: 'armor_stand', pageTitle: 'Armor Stand', spriteSlug: 'armor-stand', fr: 'Porte-armure', stackSize: 16 },
  { id: 'end_crystal', pageTitle: 'End Crystal', spriteSlug: 'end-crystal', fr: "Cristal de l'End", stackSize: 64 },
  { id: 'glow_berries', pageTitle: 'Glow Berries', spriteSlug: 'glow-berries', fr: 'Baies lumineuses', stackSize: 64 },
  { id: 'lead', pageTitle: 'Lead', spriteSlug: 'lead', fr: 'Laisse', stackSize: 64 },
];

async function downloadIcon(item) {
  const dest = path.join(ICONS_DIR, `${item.id}.png`);
  try {
    await fs.access(dest);
    return 'skipped'; // déjà téléchargé (re-run idempotent)
  } catch {
    // pas encore présent
  }

  const url = `https://minecraft.wiki/images/ItemSprite_${item.spriteSlug}.png`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(ICONS_DIR, { recursive: true });
  await fs.writeFile(dest, buf);
  return 'downloaded';
}

async function main() {
  const raw = await fs.readFile(OUTPUT_FILE, 'utf-8');
  const blocks = JSON.parse(raw);
  const existingIds = new Set(blocks.map((b) => b.id));

  let added = 0;
  for (const item of WHITELIST) {
    if (existingIds.has(item.id)) {
      console.log(`  ${item.id} : déjà présent dans blocks.json, ignoré.`);
      continue;
    }

    const status = await downloadIcon(item);
    console.log(`  ${item.id} : icône ${status}.`);

    blocks.push({
      id: item.id,
      names: { fr: item.fr, en: item.pageTitle },
      category: CATEGORY_ID,
      stackSize: item.stackSize,
      iconRef: `/blocks/icons/${item.id}.png`,
    });
    added += 1;
  }

  if (added > 0) {
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(blocks, null, 2) + '\n', 'utf-8');
    console.log(`\n${added} objet(s) ajouté(s) à ${path.relative(ROOT, OUTPUT_FILE)}.`);
  } else {
    console.log('\nAucun nouvel objet à ajouter.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
