# Puzzle Photo (Picture2puzzle)

Outil de puzzle dans le navigateur : tu choisis une image, personnalises le texte de victoire (message, police, couleur, effet), puis tu joues ou tu génères un **lien de partage** qui conserve l’image et les réglages (stockage [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)).

## Lancer en local

- **Interface seule** : ouvre [`CadeauLuc.html`](CadeauLuc.html) (double-clic). Tu peux préparer un puzzle et jouer **sans** serveur, mais les routes `/api/*` ne répondront pas : **pas de lien de partage** tant qu’un backend n’est pas servi.
- **Avec API et Blob** : à la racine du projet, `npm install`, configure le token (voir ci-dessous), puis `npx vercel dev` et ouvre l’URL indiquée (souvent `http://localhost:3000`).

## Créer le store Blob sur Vercel

1. Connecte-toi sur [vercel.com](https://vercel.com) et ouvre ton **projet** (ou crée-en un à partir de ce dépôt).
2. Va dans **Storage** (ou **Store**), puis **Create** → choisis **Blob**.
3. Donne un nom au store, valide la création, puis **connecte** le store à ton projet si Vercel le propose.

La doc détaillée : [Using Vercel Blob](https://vercel.com/docs/storage/vercel-blob).

## Variable `BLOB_READ_WRITE_TOKEN`

- C’est un **secret généré par Vercel** pour ton store Blob (tu ne l’inventes pas).
- Dans le dashboard : **Project → Settings → Environment Variables**, ajoute :
  - **Name** : `BLOB_READ_WRITE_TOKEN`
  - **Value** : le token **Read and Write** affiché pour le store Blob (copié depuis l’écran du store ou depuis les suggestions après liaison au projet).
  - Coche au minimum **Production** ; ajoute **Preview** si tu veux que les déploiements de preview puissent aussi uploader.
- **Sécurité** : ne mets **jamais** cette valeur dans le dépôt Git, dans le README, ni dans un ticket public. Si un token a fuité, **régénère-le** dans Vercel et mets à jour la variable.
- **Développement local** : crée un fichier `.env.local` à la racine (non versionné ; ajoute-le à `.gitignore` si besoin) avec une ligne du type `BLOB_READ_WRITE_TOKEN=...` pour que `vercel dev` charge le secret. Ne commit pas ce fichier.

## Déploiement

1. Pousse le dépôt et relie-le au projet Vercel (ou `vercel --prod`).
2. Vérifie que `BLOB_READ_WRITE_TOKEN` est bien définie pour l’environnement cible.
3. Vercel installe les dépendances (`package.json`) et déploie les fonctions dans `api/`.

Les liens de partage ont la forme `https://<ton-domaine>/CadeauLuc.html?s=<uuid>` (bouton « Générer le lien de partage » après upload).

Quotas et tarification : [documentation Blob](https://vercel.com/docs/storage/vercel-blob) (limites selon le plan).

## Fichiers utiles

- **`CadeauLuc.html`** — créateur de scénario, jeu, écran de victoire, chargement `?s=`
- **`assets/game-config.js`** — overrides optionnels (`window.GAME_ASSETS`)
- **`api/create-scenario.js`** — `POST` multipart : champ `meta` (JSON) + fichier `image`
- **`api/scenario/[id].js`** — `GET` : renvoie le JSON du scénario (dont `imageUrl`)
- **`vercel.json`** — réécriture `/` → `CadeauLuc.html`, cache des assets

## Limites

- Image **max 8 Mo** (JPG, PNG, WebP, GIF).
- Taille max du corps des requêtes serverless selon ton plan Vercel (voir [limits](https://vercel.com/docs/functions/runtimes#request-body-size)).
