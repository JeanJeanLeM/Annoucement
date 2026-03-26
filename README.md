# Puzzle Photo (Picture2puzzle)

Jeu de puzzle en navigateur : choisis une photo, découpe-la en grille, puis réassemble les pièces.

## Lancer en local

Ouvre `index.html` dans ton navigateur (double-clic ou « Ouvrir avec »). Aucune installation ni serveur obligatoire.

Pour éviter certaines restrictions sur le chargement de fichiers locaux, tu peux servir le dossier avec un petit serveur HTTP si besoin.

## Fichiers utiles

- **`index.html`** — interface et logique du jeu
- **`assets/game-config.js`** — image par défaut, volume des sons, dossier des sons de connexion
- **`assets/sounds/`** — sons joués quand deux pièces se connectent (`1connect`, `2connect`, …)
- **`vercel.json`** — en-têtes de cache pour un déploiement sur [Vercel](https://vercel.com)

## Déploiement

Le projet peut être déployé comme site statique (Vercel, GitHub Pages, etc.) : envoie tout le dossier à la racine du site.
