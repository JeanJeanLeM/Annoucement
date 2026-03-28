/**
 * Médias statiques (GitHub / Vercel).
 * Sons de connexion : 1re fusion → 1connect.ext, 2e → 2connect.ext, …
 * En 3×3 il y a au plus 8 connexions → fichiers 1 à 8.
 */
window.GAME_ASSETS = {
  /**
   * Vidéo d’ouverture : préchargée (preload), lecture seulement après un clic (pas d’autoplay).
   * Ex. 'assets/video/intro.mp4' — laisser '' pour aller directement au cadeau.
   */
  introVideo: 'assets/video/videolucpaysage.mp4',
  image: 'reunion.png',
  soundVolume: 0.75,
  connectSounds: {
    dir: 'assets/sounds',
    ext: '.m4a'
  },
  sounds: {
    win: ''
  }
};
