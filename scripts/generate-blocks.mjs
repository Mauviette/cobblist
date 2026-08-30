// Script de génération de la base de blocs Cobblist.
// Exécuté manuellement en dev (npm run generate:blocks), jamais côté client.
// Source principale (catégories, noms FR, identification des blocs) :
// fr.minecraft.wiki/w/Bloc (page organisée par catégories).
// Source complémentaire (mêmes catégories) : la navbox "Modèle:Navbox blocs"
// en bas de la même page (section Navigation), utilisée uniquement pour
// combler les blocs absents de la liste catégorisée principale (lacune
// connue du wiki, ex. "Bloc d'os" qui n'apparaît que dans la navbox).
// Source des icônes : minecraft.wiki/w/Block (wiki EN), section "Blocks
// with an item form", qui propose des rendus isométriques de bien meilleure
// qualité que les sprites plats 16×16 du wiki FR. Le rattachement se fait
// par correspondance de nom anglais (avec quelques variantes de repli :
// singulier/pluriel, "Fungi"→"Fungus"...). Les blocs sans correspondance
// (essentiellement les blocs "à venir", pas encore publiés donc sans rendu
// officiel) restent sans icône (repli visuel géré par le composant BlockIcon).
// Réf. utilisateur : {en: "..."} construit à partir du nom de fichier sprite
// (convention BlockSprite_<slug-anglais>.png), corrigé par la table
// NAME_OVERRIDES/PAGE_TITLE_OVERRIDES ci-dessous pour les cas ambigus, puis
// affiné par le nom exact du wiki EN quand une correspondance est trouvée.
//
// Les blocs marqués "à venir" (futures versions de Minecraft) sont inclus :
// ce ne sont pas des données erronées, juste des blocs pas encore publiés
// mais déjà documentés par le wiki.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'public', 'blocks', 'icons');
const OUTPUT_FILE = path.join(ROOT, 'src', 'data', 'blocks.json');

const USER_AGENT = 'CobblistDevScript/0.1 (+https://github.com/; contact: julesbouquet4@gmail.com)';
const FR_API = 'https://fr.minecraft.wiki/api.php?action=parse&page=Bloc&prop=text&format=json&formatversion=2';
const EN_API = 'https://minecraft.wiki/api.php?action=parse&page=Block&prop=text&format=json&formatversion=2';
const ICON_DOWNLOAD_WIDTH = 128;

// Toutes les sections h3 de la page, dans l'ordre du document. Sert à borner
// chaque section cible par la position de la suivante (peu importe si elle
// est incluse ou non dans TARGET_CATEGORIES).
const HEADING_ORDER = [
  'Bloc_en_bois',
  'Blocs_de_construction',
  'Blocs_naturel',
  'Blocs_fonctionnels',
  'Blocs_décoratifs',
  'Blocs_colorées',
  'Blocs_impossible_à_obtenir_en_mode_Survie',
  'Blocs_techniques',
  'Minecraft_Education',
  'Blocs_supprimées',
  "Poisson_d'avril",
  'Historique', // borne de fin après la dernière section utile
];

// Catégories reprises telles quelles du wiki FR (cf. spec). Les catégories
// "impossible à obtenir en survie" / "techniques" / "Education" / "supprimées"
// / "poisson d'avril" sont volontairement exclues : ce sont des blocs qu'on
// ne "récupère" pas en jouant normalement, hors périmètre d'une liste de
// courses de construction.
const TARGET_CATEGORIES = [
  { headingId: 'Bloc_en_bois', id: 'blocs_bois' },
  { headingId: 'Blocs_de_construction', id: 'blocs_construction' },
  { headingId: 'Blocs_naturel', id: 'blocs_naturels' },
  { headingId: 'Blocs_fonctionnels', id: 'blocs_fonctionnels' },
  { headingId: 'Blocs_décoratifs', id: 'blocs_decoratifs' },
  { headingId: 'Blocs_colorées', id: 'blocs_colorees' },
];

// La navbox "Modèle:Navbox blocs" (section Navigation, en bas de page) sert
// de filet de sécurité pour les blocs absents de la liste catégorisée
// principale. Ses groupes ne correspondent pas 1:1 à nos catégories mais
// sont suffisamment proches pour une catégorisation de secours raisonnable.
// Les groupes non listés ici (ex. "Mode créatif ou commandes uniquement",
// "Inutilisé", "Blagues", le titre racine "Blocs") sont ignorés.
const NAVBOX_CATEGORY_MAP = {
  Structurel: 'blocs_construction',
  Ornemental: 'blocs_decoratifs',
  Naturel: 'blocs_naturels',
  Utilitaire: 'blocs_fonctionnels',
  Environnement: 'blocs_naturels',
};

// Blocs dont la taille de stack réelle n'est pas 64. Ce jeu de données ne
// couvre que des BLOCS (pas les objets/items comme seaux ou œufs, qui ne
// figurent pas sur la page wiki "Bloc"). Table éditable à la main : à
// compléter si des entrées manquantes sont repérées.
const STACK_SIZE_1_KEYWORDS = ['bed', 'shulker-box', 'cake'];
const STACK_SIZE_16_KEYWORDS = ['sign', 'banner'];

// Corrections manuelles pour les blocs dont le sprite est partagé avec un
// autre bloc et pour lesquels la règle automatique (Bûche/Bois, Tige/Hyphes,
// cf. deriveWoodVariant) ne s'applique pas. Clé = id final calculé par le
// script (voir le résumé affiché en fin d'exécution pour repérer de
// nouveaux cas de sprite partagé).
const NAME_OVERRIDES = {};

// Corrections directes par titre de page FR (id + nom EN), prioritaires sur
// toute autre règle. Réservé aux cas de sprite partagé non couverts par
// deriveWoodVariant (ex. feuillage réutilisant le sprite d'une autre
// essence) et aux noms mal dérivés du slug (ex. apostrophe).
const PAGE_TITLE_OVERRIDES = {
  'Feuilles de chêne noir': { id: 'dark_oak_leaves', en: 'Dark Oak Leaves' },
  'Citrouille-lanterne': { id: 'jack_o_lantern', en: "Jack o'Lantern" },
};

// Pages qui ne correspondent pas à un bloc "récupérable" en jouant (états
// techniques de l'air), exclues du jeu de données.
const EXCLUDED_PAGE_TITLES = new Set(['Air', 'Air de caverne', 'Air du vide']);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripDiacritics(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function slugify(str) {
  return stripDiacritics(str)
    .toLowerCase()
    .replace(/'/g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Version sûre pour un nom de fichier/URL locale : le slug de sprite décodé
// peut contenir des apostrophes, parenthèses, etc. (ex. "jack-o'lantern").
function fileSafeSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function titleCaseFromSlug(slug) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Sur le wiki FR, la variante "Bois de X" (toutes faces écorce) et la
// variante "Tige"/"Hyphes" (bois du Nether) réutilisent parfois le sprite
// de leur variante "Bûche"/"Hyphes" faute d'icône dédiée. Cette fonction
// dérive un id/nom anglais correct à partir du nom FR plutôt que de
// retomber sur un id français, pour ces deux motifs bien connus.
function deriveWoodVariant(frName, spriteBasedSlug, spriteDerivedName) {
  if (/^Bois d[e']/i.test(frName) && spriteBasedSlug.includes('log')) {
    return { id: spriteBasedSlug.replace('log', 'wood'), en: spriteDerivedName.replace('Log', 'Wood') };
  }
  if (/^Tige\b/i.test(frName) && spriteBasedSlug.includes('hyphae')) {
    return { id: spriteBasedSlug.replace('hyphae', 'stem'), en: spriteDerivedName.replace('Hyphae', 'Stem') };
  }
  return null;
}

function guessStackSize(id) {
  if (STACK_SIZE_1_KEYWORDS.some((kw) => id.includes(kw))) return 1;
  if (STACK_SIZE_16_KEYWORDS.some((kw) => id.includes(kw))) return 16;
  return 64;
}

async function fetchFrPageHtml() {
  const res = await fetch(FR_API, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Échec récupération page FR : ${res.status}`);
  const data = await res.json();
  return data.parse.text;
}

async function fetchEnPageHtml() {
  const res = await fetch(EN_API, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Échec récupération page EN : ${res.status}`);
  const data = await res.json();
  return data.parse.text;
}

function normalizeEnName(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * Parse la section EN "Blocks with an item form" (rendus isométriques,
 * bien plus qualitatifs que les sprites plats du wiki FR) en une table
 * nom-normalisé -> {enName, filename}. C'est la source des icônes finales.
 */
function parseEnImageMap(html) {
  const start = html.indexOf('id="Blocks_with_an_item_form"');
  const end = html.indexOf('id="Technical_blocks"');
  if (start === -1 || end === -1) return new Map();
  const $ = cheerio.load(html.slice(start, end));
  const map = new Map();

  $('li').each((_, li) => {
    const $li = $(li);
    const fileHref = $li.find('a.mw-file-description').first().attr('href');
    const nameLink = $li.find('a').last();
    const enName = nameLink.attr('title') || nameLink.text().trim();
    if (!fileHref || !enName) return;
    // Certains rendus (bannières, lave, lanternes...) sont des GIF animés :
    // le thumbnail du wiki préserve l'animation même en petite taille, ce
    // qui produit des fichiers énormes (800 Ko+ par bannière). On les
    // ignore ici ; ces blocs retombent sur le sprite plat FR (voir
    // buildBlockItems), un compromis raisonnable plutôt que d'alourdir le
    // site de plusieurs dizaines de Mo pour quelques dizaines de blocs.
    if (/\.gif$/i.test(fileHref)) return;
    const filename = decodeURIComponent(fileHref.replace('/w/File:', ''));
    const key = normalizeEnName(enName);
    if (!map.has(key)) map.set(key, { enName, filename });
  });

  return map;
}

/**
 * Cherche une correspondance pour un nom EN dans la table d'images,
 * en essayant quelques variantes de repli connues (singulier/pluriel des
 * cultures, "Fungi"→"Fungus", "Stationary X"→"X", suffixe "Front" de
 * certains sous-composants) avant d'abandonner.
 */
function matchEnImage(enImageMap, enName) {
  const candidates = [
    enName,
    enName.replace(/s$/, ''),
    enName.replace(/Fungi\b/, 'Fungus'),
    enName.replace(/^Stationary /, ''),
    enName.replace(/ Front$/, ''),
  ];
  for (const candidate of candidates) {
    const match = enImageMap.get(normalizeEnName(candidate));
    if (match) return match;
  }
  return null;
}

/**
 * Extrait toutes les entrées de blocs (span.sprite-text + sprite + lien)
 * présentes dans un fragment HTML, quelle que soit la profondeur
 * d'imbrication (listes de listes, tableaux...).
 *
 * skipGroupNodes : la navbox (contrairement à la liste catégorisée
 * principale) est un arbre où certains liens représentent un groupe/une
 * page de redirection générique (ex. "/w/Bois") plutôt qu'un bloc précis —
 * reconnaissables au fait que leur <li> contient lui-même un <ul> enfant
 * (les vrais blocs sont toujours des feuilles de l'arbre). À activer
 * uniquement pour la navbox : dans la liste principale, certains vrais
 * blocs ont légitimement un <ul> enfant (variantes escalier/dalle/mur d'un
 * même matériau) et seraient exclus à tort.
 */
function extractEntries($, categoryId, { skipGroupNodes = false } = {}) {
  const entries = [];
  $('span.sprite-text').each((_, spriteTextEl) => {
    const $spriteText = $(spriteTextEl);
    const $wrap = $spriteText.closest('span.nowrap');
    if (skipGroupNodes) {
      const $li = $wrap.closest('li');
      if ($li.length && $li.children('ul').length > 0) return;
    }
    // Le titre complet du lien (attribut title) est la source de nom la
    // plus fiable : dans la navbox, le texte visible du span.sprite-text
    // est parfois tronqué (ex. "funeste" au lieu de "Bannière funeste")
    // faute de place dans la mise en page imbriquée.
    const pageTitle = $wrap.find('a[title]').first().attr('title');
    const frName = pageTitle;
    const img = $wrap.find('img').first();
    const src = img.attr('src') || '';
    const match = src.match(/BlockSprite_(.+?)\.png/);
    // Le nom de fichier peut être URL-encodé (apostrophes, parenthèses...) :
    // on décode systématiquement avant toute utilisation en aval.
    const spriteSlug = match ? decodeURIComponent(match[1]) : null;
    if (!frName || !spriteSlug) return;
    // Icônes agrégatrices ("all-wool-stairs", "all-tulips"...) : représentent
    // un groupe entier, pas un bloc précis à collecter.
    if (spriteSlug.startsWith('all-')) return;
    entries.push({ frName, pageTitle, spriteSlug, categoryId });
  });
  return entries;
}

function parseSection(sectionHtml, categoryId) {
  const $ = cheerio.load(sectionHtml);
  return extractEntries($, categoryId);
}

/**
 * Repère les groupes de la navbox "Modèle:Navbox blocs" (section
 * Navigation en bas de page) par leur titre, et retourne pour chacun le
 * fragment HTML allant de ce titre au suivant.
 */
function findNavboxGroups(navHtml) {
  const matches = [...navHtml.matchAll(/class="navbox-title">(.*?)<\/th>/gs)];
  return matches.map((m, i) => {
    const title = m[1].replace(/<[^>]+>/g, '').trim();
    const end = matches[i + 1] ? matches[i + 1].index : navHtml.length;
    return { title, html: navHtml.slice(m.index, end) };
  });
}

/**
 * Complète la liste principale avec les blocs présents dans la navbox mais
 * absents de la liste catégorisée (lacune connue du wiki, ex. "Bloc d'os").
 * Catégorisation approximative (mapping de groupe), acceptable puisque ce
 * n'est qu'un filet de sécurité pour un nombre restreint de blocs.
 *
 * On n'accepte que les entrées dont le sprite n'est pas déjà utilisé
 * ailleurs (liste principale ou entrée navbox déjà retenue) : au-delà du
 * filtre skipGroupNodes, la navbox contient encore quelques liens de
 * regroupement mal étiquetés (ex. "Bois" pointant vers une page générique)
 * qui se traduisent systématiquement par un sprite déjà vu ; les vrais
 * doublons légitimes (Bûche/Bois, Tige/Hyphes) sont déjà couverts par la
 * liste principale via deriveWoodVariant.
 */
function parseNavboxSupplement(html, existingPageTitles, existingSpriteSlugs) {
  const navIdx = html.indexOf('id="Navigation"');
  if (navIdx === -1) return [];
  const navHtml = html.slice(navIdx);
  const groups = findNavboxGroups(navHtml);
  const usedSlugs = new Set(existingSpriteSlugs);

  const entries = [];
  for (const { title, html: groupHtml } of groups) {
    const categoryId = NAVBOX_CATEGORY_MAP[title];
    if (!categoryId) continue; // groupe exclu (créatif/commandes, inutilisé, blagues, racine)
    const $ = cheerio.load(groupHtml);
    for (const entry of extractEntries($, categoryId, { skipGroupNodes: true })) {
      if (existingPageTitles.has(entry.pageTitle)) continue;
      if (usedSlugs.has(entry.spriteSlug)) continue;
      usedSlugs.add(entry.spriteSlug);
      entries.push(entry);
    }
  }
  return entries;
}

function buildBlockItems(rawEntries, enImageMap) {
  // Dédoublonnage global par page FR (une page = un bloc distinct), en
  // excluant les entrées hors périmètre (états techniques, etc.). En cas de
  // doublon entre plusieurs sources, la première rencontrée gagne (liste
  // catégorisée principale, traitée avant le complément navbox).
  const seen = new Map();
  for (const entry of rawEntries) {
    if (EXCLUDED_PAGE_TITLES.has(entry.pageTitle)) continue;
    // Sprites placeholder/glitch (ex. "???") ne contenant aucun caractère
    // alphanumérique une fois nettoyés : pas un bloc réel, à exclure.
    if (!fileSafeSlug(entry.spriteSlug)) continue;
    if (!seen.has(entry.pageTitle)) seen.set(entry.pageTitle, entry);
  }
  const unique = [...seen.values()];

  // Un même sprite peut être réutilisé par plusieurs blocs distincts sur le
  // wiki (données de sprite incomplètes côté wiki) : dans ce cas l'id ne
  // peut pas être dérivé du sprite, on retombe sur le titre de page FR
  // translittéré pour garantir l'unicité.
  const spriteCounts = new Map();
  for (const entry of unique) {
    spriteCounts.set(entry.spriteSlug, (spriteCounts.get(entry.spriteSlug) || 0) + 1);
  }

  const usedIds = new Set();
  const unresolvedCollisions = [];
  const items = unique.map((entry) => {
    const spriteBasedId = slugify(entry.spriteSlug.replace(/-/g, '_'));
    const defaultEnName = titleCaseFromSlug(entry.spriteSlug);
    const isCollision = spriteCounts.get(entry.spriteSlug) > 1;

    let id = spriteBasedId;
    let enName = defaultEnName;

    const pageOverride = PAGE_TITLE_OVERRIDES[entry.pageTitle];
    if (pageOverride) {
      id = pageOverride.id;
      enName = pageOverride.en;
    } else if (isCollision) {
      const variant = deriveWoodVariant(entry.frName, spriteBasedId, defaultEnName);
      if (variant) {
        id = variant.id;
        enName = variant.en;
      }
      // Sinon : considéré comme le propriétaire "canonique" du sprite
      // (ex. Bûche/Hyphes) — on garde l'id dérivé du sprite tel quel.
    }

    let suffix = 2;
    const baseId = id;
    const neededSuffix = usedIds.has(id);
    while (usedIds.has(id)) {
      id = `${baseId}_${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);
    if (neededSuffix) {
      unresolvedCollisions.push({ id, frName: entry.frName, spriteSlug: entry.spriteSlug });
    }

    const override = NAME_OVERRIDES[id];
    const preOverrideEnName = override?.en || enName;
    // Le nom EN exact du wiki (quand une image y correspond) est plus fiable
    // que notre dérivation heuristique à partir du slug de sprite FR.
    const enImageMatch = matchEnImage(enImageMap, preOverrideEnName);

    return {
      id,
      names: {
        fr: override?.fr || entry.frName,
        en: enImageMatch?.enName || preOverrideEnName,
      },
      category: entry.categoryId,
      stackSize: guessStackSize(id),
      // Repli sur le sprite plat FR si aucune image EN statique ne
      // correspond (blocs "à venir" sans rendu officiel, GIF animés
      // exclus...) : géré au téléchargement (downloadIcons). Si aucune des
      // deux sources n'aboutit, BlockIcon assure le repli visuel à
      // l'affichage.
      iconRef: `/blocks/icons/${id}.png`,
      _enImageFilename: enImageMatch?.filename ?? null, // usage interne script, retiré avant écriture
      _frSpriteSlug: entry.spriteSlug, // usage interne script, retiré avant écriture
    };
  });

  return { items, collisions: unresolvedCollisions };
}

async function downloadIcons(items) {
  await fs.mkdir(ICONS_DIR, { recursive: true });

  const CONCURRENCY = 6;
  let cursor = 0;
  let downloaded = 0;
  let fallbackUsed = 0;
  const failed = [];

  async function worker() {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      const dest = path.join(ICONS_DIR, `${item.id}.png`);
      try {
        await fs.access(dest);
        continue; // déjà téléchargé (re-run idempotent)
      } catch {
        // pas encore présent, on télécharge
      }

      if (item._enImageFilename) {
        try {
          const filename = encodeURIComponent(item._enImageFilename);
          const url = `https://minecraft.wiki/images/thumb/${filename}/${ICON_DOWNLOAD_WIDTH}px-${filename}`;
          const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = Buffer.from(await res.arrayBuffer());
          await fs.writeFile(dest, buf);
          downloaded += 1;
          await sleep(50);
          continue;
        } catch {
          // on retombe sur le sprite FR ci-dessous
        }
      }

      try {
        const spriteFilename = `BlockSprite_${encodeURIComponent(item._frSpriteSlug)}.png`;
        const res = await fetch(`https://minecraft.wiki/images/${spriteFilename}`, {
          headers: { 'User-Agent': USER_AGENT },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        await fs.writeFile(dest, buf);
        downloaded += 1;
        fallbackUsed += 1;
      } catch (err) {
        failed.push({ id: item.id, error: String(err) });
      }
      await sleep(50);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { downloaded, fallbackUsed, failed, total: items.length };
}

async function main() {
  console.log('Récupération de la page wiki FR "Bloc"...');
  const html = await fetchFrPageHtml();
  console.log('Récupération de la page wiki EN "Block" (icônes)...');
  const enHtml = await fetchEnPageHtml();
  const enImageMap = parseEnImageMap(enHtml);
  console.log(`  ${enImageMap.size} images EN indexées.`);

  const rawEntries = [];
  for (const { headingId, id: categoryId } of TARGET_CATEGORIES) {
    const startIdx = html.indexOf(`id="${headingId}"`);
    if (startIdx === -1) {
      console.warn(`Section introuvable : ${headingId}`);
      continue;
    }
    const orderIdx = HEADING_ORDER.indexOf(headingId);
    const nextHeadingId = HEADING_ORDER[orderIdx + 1];
    const endIdx = nextHeadingId ? html.indexOf(`id="${nextHeadingId}"`) : html.length;
    const sectionHtml = html.slice(startIdx, endIdx === -1 ? html.length : endIdx);

    const entries = parseSection(sectionHtml, categoryId);
    console.log(`  ${headingId} -> ${entries.length} entrées`);
    rawEntries.push(...entries);
  }

  const primaryPageTitles = new Set(rawEntries.map((e) => e.pageTitle));
  const primarySpriteSlugs = new Set(rawEntries.map((e) => e.spriteSlug));
  const supplementEntries = parseNavboxSupplement(html, primaryPageTitles, primarySpriteSlugs);
  console.log(`  Navbox (complément) -> ${supplementEntries.length} entrées ajoutées`);
  rawEntries.push(...supplementEntries);

  const { items, collisions } = buildBlockItems(rawEntries, enImageMap);
  console.log(`\nTotal blocs uniques : ${items.length}`);
  const withoutEnIcon = items.filter((item) => !item._enImageFilename).length;
  console.log(`  dont ${items.length - withoutEnIcon} avec icône EN (isométrique), ${withoutEnIcon} en repli sprite FR.`);
  if (collisions.length > 0) {
    console.log(`\nBlocs à sprite partagé (nom EN à vérifier / à ajouter dans NAME_OVERRIDES) :`);
    for (const c of collisions) {
      console.log(`  - ${c.id} (sprite: ${c.spriteSlug}, fr: ${c.frName})`);
    }
  }

  console.log('\nTéléchargement des icônes...');
  const { downloaded, fallbackUsed, failed, total } = await downloadIcons(items);
  console.log(`  ${downloaded}/${total} icônes téléchargées (nouvelles), dont ${fallbackUsed} en repli sprite FR.`);
  if (failed.length > 0) {
    console.log(`  ${failed.length} échecs de téléchargement (aucune des deux sources) :`);
    for (const f of failed) console.log(`    - ${f.id}: ${f.error}`);
  }

  const output = items.map(({ _enImageFilename, _frSpriteSlug, ...item }) => item);
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf-8');
  console.log(`\nÉcrit : ${path.relative(ROOT, OUTPUT_FILE)}`);

  const byCategory = {};
  for (const item of output) byCategory[item.category] = (byCategory[item.category] || 0) + 1;
  console.log('\nRépartition par catégorie :');
  for (const [cat, count] of Object.entries(byCategory)) console.log(`  ${cat}: ${count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
