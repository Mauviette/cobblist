import { useState } from 'react';

interface BlockIconProps {
  iconRef?: string;
  alt: string;
  size?: number;
}

// Composant volontairement agnostique de la source d'icône : si iconRef est
// absent ou que le chargement échoue, on retombe sur un carré généré
// (initiale) plutôt que de casser l'affichage. Permet de changer de source
// d'icônes plus tard sans toucher aux appelants.
//
// La boîte englobante est carrée (taille fixe pour l'alignement des listes
// et grilles), mais l'image elle-même garde son format d'origine (les
// rendus isométriques du wiki ne sont pas tous carrés, ex. portes) : pas de
// largeur/hauteur forcées, juste une contrainte max qui la centre dans la
// boîte sans la déformer.
export function BlockIcon({ iconRef, alt, size = 32 }: BlockIconProps) {
  const [errored, setErrored] = useState(false);

  if (!iconRef || errored) {
    return (
      <div
        className="flex shrink-0 items-center justify-center bg-stone-500 text-xs font-bold text-white"
        style={{ width: size, height: size }}
        title={alt}
      >
        {alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <span className="flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <img
        src={iconRef}
        alt={alt}
        style={{ maxWidth: size, maxHeight: size, width: 'auto', height: 'auto' }}
        onError={() => setErrored(true)}
      />
    </span>
  );
}
