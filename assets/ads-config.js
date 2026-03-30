/**
 * AdSense — remplis ces valeurs depuis AdSense : Compte > Informations sur le compte (ID client)
 * et Annonces > Par unité d'annonces (ID du bloc pour chaque emplacement).
 * Tant que les placeholders restent, aucune annonce ne sera chargée (évite les erreurs en dev).
 */
window.P2P_ADSENSE = {
  client: 'ca-pub-8944795420097131',
  /** Unité « horizontal » ou responsive sous le titre du créateur */
  slotSetup: 'XXXXXXXXXX',
  /** Unité sous la barre d’outils en mode jeu */
  slotGame: 'XXXXXXXXXX'
};

function p2pAdsenseConfigured() {
  const c = window.P2P_ADSENSE;
  if (!c || !c.client || !c.slotSetup || !c.slotGame) return false;
  if (/X{4,}/.test(c.client) || /X{4,}/.test(String(c.slotSetup)) || /X{4,}/.test(String(c.slotGame)))
    return false;
  if (c.client.indexOf('0000000000000000') !== -1) return false;
  return true;
}
window.p2pAdsenseConfigured = p2pAdsenseConfigured;
