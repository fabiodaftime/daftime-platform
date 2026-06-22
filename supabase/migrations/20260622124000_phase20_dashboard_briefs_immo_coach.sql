-- Phase 20 — Briefs de dashboard pour Immobilier (agence) et Formation.

UPDATE public.activity_types SET config = jsonb_set(config, '{dashboard}', $br$
{
  "guidelines": "Dashboard agence immobilière : visuel, multi-pages. En Vue d'ensemble : honoraires, marge brute, EBITDA, résultat net, trésorerie. Mets en avant transactions, commission moyenne, concrétisation des mandats, productivité par agent. Adapte aux données présentes.",
  "pages": [
    { "title": "Vue d'ensemble", "must": ["ca", "marge_brute", "ebitda", "resultat_net", "cash_end"], "ideas": "KPIs clés avec évolution, tendance honoraires/EBITDA, callout de lecture du mois." },
    { "title": "Activité & transactions", "must": ["transactions", "mandates", "commission_moyenne", "conversion_mandats"], "ideas": "Transactions et mandats, commission moyenne, taux de concrétisation mandats→ventes, volume transigé, conversion des leads." },
    { "title": "Honoraires & marges", "must": ["ca", "marge_brute", "taux_marge_brute", "agent_commissions"], "ideas": "Tendance des honoraires, rétrocessions aux agents, marge brute et taux." },
    { "title": "Charges & rentabilité", "must": ["total_opex", "ebitda", "marge_ebitda"], "ideas": "Répartition des charges de structure (donut : marketing, salaires, loyer), EBITDA, marges." },
    { "title": "Productivité", "must": ["agents", "ca_par_agent", "transactions_par_agent"], "ideas": "Honoraires par agent et transactions par agent (barres)." },
    { "title": "Trésorerie", "must": ["cash_end", "cash_variation", "receivables"], "ideas": "Tendance de trésorerie, variation, commissions à encaisser." }
  ]
}
$br$::jsonb) WHERE slug = 'immo_agence';

UPDATE public.activity_types SET config = jsonb_set(config, '{dashboard}', $br$
{
  "guidelines": "Dashboard organisme de formation / coaching : visuel, multi-pages. En Vue d'ensemble : chiffre d'affaires, marge brute, EBITDA, résultat net, trésorerie. Mets en avant le taux de remplissage, le prix moyen par apprenant, le nombre de sessions. Adapte aux données présentes.",
  "pages": [
    { "title": "Vue d'ensemble", "must": ["ca", "marge_brute", "ebitda", "resultat_net", "cash_end"], "ideas": "KPIs clés avec évolution, tendance CA/EBITDA, callout de lecture du mois." },
    { "title": "Activité pédagogique", "must": ["sessions", "learners", "fill_rate", "price_avg"], "ideas": "Sessions et apprenants, taux de remplissage, prix moyen par apprenant, CA moyen par session." },
    { "title": "CA & marges", "must": ["ca", "marge_brute", "taux_marge_brute", "trainer_costs"], "ideas": "Tendance du CA, coût des intervenants, marge brute et taux." },
    { "title": "Charges & rentabilité", "must": ["total_opex", "ebitda", "marge_ebitda"], "ideas": "Répartition des charges de structure (donut : salaires, marketing, outils), EBITDA, marges." },
    { "title": "Trésorerie", "must": ["cash_end", "cash_variation"], "ideas": "Tendance de trésorerie et variation du mois." }
  ]
}
$br$::jsonb) WHERE slug = 'coach';
