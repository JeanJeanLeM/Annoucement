/**
 * AdSense — remplis ces valeurs depuis AdSense : Compte > Informations sur le compte (ID client)
 * et Annonces > Par unité d'annonces (ID du bloc pour chaque emplacement).
 * Tant que les placeholders restent, aucune annonce ne sera chargée (évite les erreurs en dev).
 */
window.P2P_ADSENSE = {
  client: 'ca-pub-8944795420097131',
  /** Unité « Picture2puzzle - setup » (code affichage classique, pas AMP) */
  slotSetup: '2892011000',
  /** Unité « picture2puzzle - vertical » : colonnes gauche et droite en mode jeu */
  slotGameVertical: '1578929332'
};

function p2pAdsenseConfigured() {
  const c = window.P2P_ADSENSE;
  if (!c || !c.client || !c.slotSetup || !c.slotGameVertical) return false;
  if (
    /X{4,}/.test(c.client) ||
    /X{4,}/.test(String(c.slotSetup)) ||
    /X{4,}/.test(String(c.slotGameVertical))
  )
    return false;
  if (c.client.indexOf('0000000000000000') !== -1) return false;
  return true;
}
window.p2pAdsenseConfigured = p2pAdsenseConfigured;
