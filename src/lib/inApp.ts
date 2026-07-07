// Détection des navigateurs « in-app » (webviews Instagram / Facebook / TikTok / etc.).
// Dans ces contextes, les iframes tiers (cal.com) sont souvent bridés (cookies/stockage cloisonnés),
// ce qui peut casser l'affichage du calendrier ou la confirmation du RDV. On propose alors une
// ouverture « plein onglet » (top-level), bien mieux supportée.
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Line\/|Snapchat|Twitter|Pinterest|TikTok|musical_ly/i.test(ua);
}
