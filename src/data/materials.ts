export interface MaterialLabels {
  fr: string;
  en: string;
}

interface MaterialMatcher {
  materialId: string;
  tokens: string[];
}

// Le "matériau" est une classification transversale aux catégories (ex. le
// Chêne regroupe bûche/planches/escalier/porte..., qui appartiennent à des
// catégories wiki différentes). Contrairement à `category`, ce n'est pas une
// donnée scrapée : elle est dérivée à la volée depuis l'id du bloc par
// correspondance de tokens contigus (id découpé sur les "_"), pour éviter de
// devoir maintenir un champ supplémentaire pour ~1100 blocs.
//
// Ordre des correspondances : la séquence de tokens la plus longue gagne
// (ex. "dark_oak" avant "oak", "end_stone" avant "stone" générique). À
// longueur égale, la première entrée déclarée gagne — les matériaux les plus
// spécifiques (deepslate, prismarine, tuff...) sont donc déclarés avant les
// catch-all génériques (bricks, sand...) pour qu'un bloc comme
// "deepslate_bricks" retombe sur Deepslate plutôt que sur Brique, et que les
// minerais en profondeur (ex. "deepslate_iron_ore") retombent sur Deepslate
// plutôt que sur le minerai, par cohérence avec les autres minerais
// approfondis.
const MATERIAL_MATCHERS: MaterialMatcher[] = [
  // Bois
  { materialId: 'pale_oak', tokens: ['pale', 'oak'] },
  { materialId: 'dark_oak', tokens: ['dark', 'oak'] },
  { materialId: 'oak', tokens: ['oak'] },
  { materialId: 'spruce', tokens: ['spruce'] },
  { materialId: 'birch', tokens: ['birch'] },
  { materialId: 'jungle', tokens: ['jungle'] },
  { materialId: 'acacia', tokens: ['acacia'] },
  { materialId: 'mangrove', tokens: ['mangrove'] },
  { materialId: 'cherry', tokens: ['cherry'] },
  { materialId: 'poplar', tokens: ['poplar'] },
  { materialId: 'bamboo', tokens: ['bamboo'] },
  { materialId: 'crimson', tokens: ['crimson'] },
  { materialId: 'warped', tokens: ['warped'] },

  // Pierre, minerais et roches
  { materialId: 'end_stone', tokens: ['end', 'stone'] },
  { materialId: 'red_sandstone', tokens: ['red', 'sandstone'] },
  { materialId: 'nether_brick', tokens: ['nether', 'bricks'] },
  { materialId: 'nether_brick', tokens: ['nether', 'brick'] },
  { materialId: 'copper', tokens: ['lightning', 'rod'] },
  { materialId: 'deepslate', tokens: ['deepslate'] },
  { materialId: 'blackstone', tokens: ['blackstone'] },
  { materialId: 'cobblestone', tokens: ['cobblestone'] },
  { materialId: 'stone', tokens: ['stone'] },
  { materialId: 'granite', tokens: ['granite'] },
  { materialId: 'diorite', tokens: ['diorite'] },
  { materialId: 'andesite', tokens: ['andesite'] },
  { materialId: 'sandstone', tokens: ['sandstone'] },
  { materialId: 'tuff', tokens: ['tuff'] },
  { materialId: 'cinnabar', tokens: ['cinnabar'] },
  { materialId: 'sulfur', tokens: ['sulfur'] },
  { materialId: 'basalt', tokens: ['basalt'] },
  { materialId: 'prismarine', tokens: ['prismarine'] },
  { materialId: 'purpur', tokens: ['purpur'] },
  { materialId: 'mud', tokens: ['mud'] },
  { materialId: 'obsidian', tokens: ['obsidian'] },
  { materialId: 'quartz', tokens: ['quartz'] },
  { materialId: 'resin', tokens: ['resin'] },
  { materialId: 'amethyst', tokens: ['amethyst'] },
  { materialId: 'calcite', tokens: ['calcite'] },
  { materialId: 'dripstone', tokens: ['dripstone'] },
  { materialId: 'copper', tokens: ['copper'] },
  { materialId: 'coal', tokens: ['coal'] },
  { materialId: 'iron', tokens: ['iron'] },
  { materialId: 'gold', tokens: ['gold'] },
  { materialId: 'redstone', tokens: ['redstone'] },
  { materialId: 'emerald', tokens: ['emerald'] },
  { materialId: 'lapis_lazuli', tokens: ['lapis'] },
  { materialId: 'diamond', tokens: ['diamond'] },
  { materialId: 'netherite', tokens: ['netherite'] },
  { materialId: 'gravel', tokens: ['gravel'] },

  // Blocs colorés (matériau indépendant de la couleur/teinte)
  { materialId: 'concrete_powder', tokens: ['concrete', 'powder'] },
  { materialId: 'concrete', tokens: ['concrete'] },
  { materialId: 'glazed_terracotta', tokens: ['glazed', 'terracotta'] },
  { materialId: 'terracotta', tokens: ['terracotta'] },
  { materialId: 'wool', tokens: ['wool'] },
  { materialId: 'stained_glass_pane', tokens: ['stained', 'glass', 'pane'] },
  { materialId: 'stained_glass', tokens: ['stained', 'glass'] },
  { materialId: 'glass_pane', tokens: ['glass', 'pane'] },
  { materialId: 'glass', tokens: ['glass'] },
  { materialId: 'shulker_box', tokens: ['shulker', 'box'] },
  { materialId: 'bed', tokens: ['bed'] },
  { materialId: 'banner', tokens: ['banner'] },
  { materialId: 'candle', tokens: ['candle'] },
  { materialId: 'moss', tokens: ['moss'] },
  { materialId: 'carpet', tokens: ['carpet'] },

  // Nature et divers
  { materialId: 'coral', tokens: ['coral'] },
  { materialId: 'ice', tokens: ['ice'] },
  { materialId: 'snow', tokens: ['snow'] },
  { materialId: 'sand', tokens: ['sand'] },
  { materialId: 'dirt', tokens: ['dirt'] },
  { materialId: 'clay', tokens: ['clay'] },
  { materialId: 'mushroom', tokens: ['mushroom'] },
  { materialId: 'bricks', tokens: ['bricks'] },
  { materialId: 'bricks', tokens: ['brick'] },
];

const SORTED_MATCHERS = [...MATERIAL_MATCHERS].sort((a, b) => b.tokens.length - a.tokens.length);

export const MATERIAL_LABELS: Record<string, MaterialLabels> = {
  pale_oak: { fr: 'Chêne blanchi', en: 'Pale Oak' },
  dark_oak: { fr: 'Chêne noir', en: 'Dark Oak' },
  oak: { fr: 'Chêne', en: 'Oak' },
  spruce: { fr: 'Sapin', en: 'Spruce' },
  birch: { fr: 'Bouleau', en: 'Birch' },
  jungle: { fr: 'Acajou', en: 'Jungle Wood' },
  acacia: { fr: 'Acacia', en: 'Acacia' },
  mangrove: { fr: 'Palétuvier', en: 'Mangrove' },
  cherry: { fr: 'Cerisier', en: 'Cherry' },
  poplar: { fr: 'Peuplier', en: 'Poplar' },
  bamboo: { fr: 'Bambou', en: 'Bamboo' },
  crimson: { fr: 'Écarlate', en: 'Crimson' },
  warped: { fr: 'Biscornu', en: 'Warped' },

  end_stone: { fr: "Pierre de l'End", en: 'End Stone' },
  red_sandstone: { fr: 'Grès rouge', en: 'Red Sandstone' },
  nether_brick: { fr: 'Brique du Nether', en: 'Nether Brick' },
  deepslate: { fr: 'Ardoise profonde', en: 'Deepslate' },
  blackstone: { fr: 'Pierre des ténèbres', en: 'Blackstone' },
  cobblestone: { fr: 'Pavé', en: 'Cobblestone' },
  stone: { fr: 'Pierre', en: 'Stone' },
  granite: { fr: 'Granite', en: 'Granite' },
  diorite: { fr: 'Diorite', en: 'Diorite' },
  andesite: { fr: 'Andésite', en: 'Andesite' },
  sandstone: { fr: 'Grès', en: 'Sandstone' },
  tuff: { fr: 'Tuf', en: 'Tuff' },
  cinnabar: { fr: 'Cinabre', en: 'Cinnabar' },
  sulfur: { fr: 'Soufre', en: 'Sulfur' },
  basalt: { fr: 'Basalte', en: 'Basalt' },
  prismarine: { fr: 'Prismarine', en: 'Prismarine' },
  purpur: { fr: 'Purpur', en: 'Purpur' },
  mud: { fr: 'Boue', en: 'Mud' },
  obsidian: { fr: 'Obsidienne', en: 'Obsidian' },
  quartz: { fr: 'Quartz', en: 'Quartz' },
  resin: { fr: 'Résine', en: 'Resin' },
  amethyst: { fr: 'Améthyste', en: 'Amethyst' },
  calcite: { fr: 'Calcite', en: 'Calcite' },
  dripstone: { fr: 'Dripstone', en: 'Dripstone' },
  copper: { fr: 'Cuivre', en: 'Copper' },
  coal: { fr: 'Charbon', en: 'Coal' },
  iron: { fr: 'Fer', en: 'Iron' },
  gold: { fr: 'Or', en: 'Gold' },
  redstone: { fr: 'Redstone', en: 'Redstone' },
  emerald: { fr: 'Émeraude', en: 'Emerald' },
  lapis_lazuli: { fr: 'Lapis-lazuli', en: 'Lapis Lazuli' },
  diamond: { fr: 'Diamant', en: 'Diamond' },
  netherite: { fr: 'Netherite', en: 'Netherite' },
  gravel: { fr: 'Gravier', en: 'Gravel' },

  concrete_powder: { fr: 'Béton en poudre', en: 'Concrete Powder' },
  concrete: { fr: 'Béton', en: 'Concrete' },
  glazed_terracotta: { fr: 'Terre cuite vernissée', en: 'Glazed Terracotta' },
  terracotta: { fr: 'Terre cuite', en: 'Terracotta' },
  wool: { fr: 'Laine', en: 'Wool' },
  stained_glass_pane: { fr: 'Vitre teintée', en: 'Stained Glass Pane' },
  stained_glass: { fr: 'Verre teinté', en: 'Stained Glass' },
  glass_pane: { fr: 'Vitre', en: 'Glass Pane' },
  glass: { fr: 'Verre', en: 'Glass' },
  shulker_box: { fr: 'Shulker Box', en: 'Shulker Box' },
  bed: { fr: 'Lit', en: 'Bed' },
  banner: { fr: 'Bannière', en: 'Banner' },
  candle: { fr: 'Bougie', en: 'Candle' },
  moss: { fr: 'Mousse', en: 'Moss' },
  carpet: { fr: 'Tapis', en: 'Carpet' },

  coral: { fr: 'Corail', en: 'Coral' },
  ice: { fr: 'Glace', en: 'Ice' },
  snow: { fr: 'Neige', en: 'Snow' },
  sand: { fr: 'Sable', en: 'Sand' },
  dirt: { fr: 'Terre', en: 'Dirt' },
  clay: { fr: 'Argile', en: 'Clay' },
  mushroom: { fr: 'Champignon', en: 'Mushroom' },
  bricks: { fr: 'Brique', en: 'Bricks' },

  other: { fr: 'Autres', en: 'Other' },
};

function includesSubsequence(tokens: string[], sub: string[]): boolean {
  for (let i = 0; i <= tokens.length - sub.length; i++) {
    if (sub.every((t, j) => tokens[i + j] === t)) return true;
  }
  return false;
}

export function deriveMaterial(blockId: string): string {
  const tokens = blockId.split('_');
  for (const matcher of SORTED_MATCHERS) {
    if (includesSubsequence(tokens, matcher.tokens)) return matcher.materialId;
  }
  return 'other';
}

export function materialLabel(materialId: string, lang: 'fr' | 'en'): string {
  return MATERIAL_LABELS[materialId]?.[lang] ?? materialId;
}
