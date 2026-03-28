/**
 * Médias statiques (GitHub / Vercel).
 * Sons de connexion : 1re fusion → 1connect.ext, 2e → 2connect.ext, …
 * En 3×3 il y a au plus 8 connexions → fichiers 1 à 8.
 */
window.GAME_ASSETS = {
  /**
   * Vidéo d’ouverture : préchargée (preload), lecture au clic (pas d’autoplay).
   * Mettre false pour sauter l’intro. Chaîne vide = même effet que l’absence de clé (vidéo par défaut dans le HTML).
   */
  introVideo: 'assets/video/videolucpaysage.mp4',
  image: 'reunion.png',
  soundVolume: 0.75,
  connectSounds: {
    dir: 'assets/sounds',
    ext: '.m4a',
    /** Extensions par numéro (ex. 8 en .ogg, le reste = ext). */
    extByIndex: { 8: '.ogg' }
  },
  sounds: {
    win: ''
  }
};
