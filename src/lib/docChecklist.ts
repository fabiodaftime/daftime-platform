// Checklist « documents à demander » par activité — AIDE-MÉMOIRE CLOSER (interne), plus précise
// que la liste indicative montrée au client. Utilisée dans le cockpit + copiable pour envoi.
export type DocItem = { t: string; req?: boolean; note?: string };
export type DocGroup = { cat: string; items: DocItem[] };
export type ActivityChecklist = { label: string; docs: DocGroup[]; params?: string[] };

export const DOC_CHECKLIST: Record<string, ActivityChecklist> = {
  ecommerce: {
    label: 'E-commerce',
    docs: [
      { cat: 'Ventes — Shopify (Analytics / Rapports)', items: [
        { t: 'Ventes nettes par commande', req: true, note: 'export « Net sales by order » — CA net, commandes, remboursements, produits' },
        { t: 'Nouveaux vs clients existants', req: true, note: 'export « New vs returning customers » — clé pour le CAC nouveau client' },
        { t: 'Sessions par pays + taux de conversion', note: '« Sessions by location », « Conversion rate »' },
        { t: 'Export Produits avec « Cost per item »', note: 'récupère le coût produit par SKU si la colonne est remplie' },
      ] },
      { cat: 'Paiements — PSP (Stripe / Shopify Payments / PayPal)', items: [
        { t: 'Relevé des frais', req: true, note: '« All fees » / « Balance summary » — frais réels (3–5 % du CA)' },
        { t: 'Paiements par méthode / passerelle', note: '« Net payments by gateway/method » (+ par pays)' },
        { t: 'Historique des versements (payouts)', note: 'délais réels — clé trésorerie' },
      ] },
      { cat: 'Banque', items: [
        { t: 'Relevé(s) bancaire(s) du mois', req: true, note: 'tous les comptes, toutes les devises' },
      ] },
      { cat: 'Publicité (si le shop fait de la pub)', items: [
        { t: 'Export du gestionnaire de pubs', req: true, note: 'Meta / Google / TikTok — dépense par campagne (+ CA attribué)' },
        { t: 'Compta si dispo', note: 'compte de résultat / bilan, factures fournisseurs, TVA' },
      ] },
    ],
    params: [
      'Coût de revient par SKU (produit + packaging + transport amont + douane)',
      'Grille logistique : expédition + pick&pack (3PL) par commande',
      'Coûts d\'acquisition hors-pub : fees agence, créa, outils, influence',
      'Délais fournisseurs & échéances TVA',
      'Niveaux de stock + délais de réappro',
      'Profil du shop : modèle, réachat/one-shot, objectif n°1',
    ],
  },
  coach: { label: 'Coach / Formation', docs: [{ cat: 'Base', items: [
    { t: 'Export des paiements (Stripe / Whop / plateforme)', req: true },
    { t: 'Relevés de TOUS les comptes du mois (chaque devise)', req: true },
    { t: 'Dashboard publicitaire (Meta / Google / TikTok)', req: true },
    { t: 'Factures émises & factures des intervenants' },
    { t: 'Liste sessions & participants (si présentiel)' },
  ] }] },
  saas: { label: 'SaaS & Tech', docs: [{ cat: 'Base', items: [
    { t: 'Export MRR / abonnements (Stripe, billing)', req: true },
    { t: 'Relevé bancaire du mois', req: true },
    { t: 'Factures d\'infrastructure (hosting)' },
    { t: 'Factures Sales & Marketing' }, { t: 'Rapport clients / churn' },
  ] }] },
  agence_media: { label: 'Agence & Médias', docs: [{ cat: 'Base', items: [
    { t: 'Relevé bancaire du mois', req: true },
    { t: 'Factures émises (honoraires + média)', req: true },
    { t: 'Relevé des achats média' }, { t: 'Factures freelances / sous-traitance' }, { t: 'Suivi du temps / projets' },
  ] }] },
  services: { label: 'Services / Conseil', docs: [{ cat: 'Base', items: [
    { t: 'Relevé bancaire du mois', req: true },
    { t: 'Factures émises (honoraires)', req: true },
    { t: 'Suivi du temps / jours facturés' }, { t: 'Factures de sous-traitance' }, { t: 'Justificatifs de dépenses' },
  ] }] },
  restaurant: { label: 'Restauration', docs: [{ cat: 'Base', items: [
    { t: 'Relevé bancaire du mois', req: true },
    { t: 'Z de caisse / export TPE', req: true },
    { t: 'Factures fournisseurs (matières)', req: true },
    { t: 'Journal de paie' }, { t: 'Factures de charges (loyer, énergie)' },
  ] }] },
  immo_agence: { label: 'Immobilier — Agence', docs: [{ cat: 'Base', items: [
    { t: 'Relevé bancaire du mois', req: true },
    { t: 'Honoraires / commissions encaissés', req: true },
    { t: 'Liste des transactions & mandats signés' }, { t: 'Rétrocessions agents' }, { t: 'Factures de charges (marketing, loyer)' },
  ] }] },
  holding: { label: 'Holding / Groupe', docs: [{ cat: 'Base', items: [
    { t: 'Relevés bancaires (holding & filiales)', req: true },
    { t: 'Remontées des filiales (dividendes)', req: true },
    { t: 'Conventions / management fees' }, { t: 'Tableau de la dette (échéancier)' }, { t: 'États financiers des filiales' },
  ] }] },
  startup: { label: 'Startup', docs: [{ cat: 'Base', items: [
    { t: 'Relevé bancaire du mois', req: true },
    { t: 'Suivi de trésorerie / burn', req: true },
    { t: 'Export des revenus (si applicable)' }, { t: 'Effectifs & dépenses' }, { t: 'Métriques produit (utilisateurs, MRR)' },
  ] }] },
};

// Version texte (pour copier-coller à envoyer au client).
export function checklistToText(slug: string): string {
  const c = DOC_CHECKLIST[slug];
  if (!c) return '';
  const lines: string[] = [`Documents à nous transmettre — ${c.label}`, ''];
  for (const g of c.docs) {
    lines.push(g.cat);
    for (const it of g.items) lines.push(`  ${it.req ? '•' : '◦'} ${it.t}${it.note ? ` — ${it.note}` : ''}`);
    lines.push('');
  }
  if (c.params?.length) {
    lines.push('À définir ensemble (une fois, pas des documents) :');
    for (const p of c.params) lines.push(`  – ${p}`);
  }
  return lines.join('\n').trim();
}
