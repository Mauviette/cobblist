# Cobblist

Listes de blocs Minecraft à récupérer pour vos projets de construction. Application front-end uniquement (React + TypeScript + Vite + Tailwind), sans backend : tout fonctionne côté client, avec sauvegarde automatique en `localStorage`.

## Développement

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Régénérer la base de blocs

La base de blocs (`src/data/blocks.json` + sprites dans `public/blocks/icons/`) est générée à partir du [Minecraft Wiki francophone](https://fr.minecraft.wiki/w/Bloc) par un script exécuté manuellement en local (jamais côté client) :

```bash
npm run generate:blocks
```

À relancer ponctuellement (nouvelle version de Minecraft, enrichissement de la base), pas à chaque déploiement. Les blocs de données de blocs sont basées sur le Minecraft Wiki (licence CC BY-NC-SA) ; les textures restent la propriété de Mojang/Microsoft.

La police pixel utilisée (`src/assets/fonts/Monocraft.ttf`) est [Monocraft](https://github.com/IdreesInc/Monocraft), sous licence SIL Open Font License (voir `Monocraft-LICENSE.txt` à côté).
