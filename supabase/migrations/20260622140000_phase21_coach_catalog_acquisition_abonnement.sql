-- phase21 : enrichit le catalogue Formation/coaching pour les organismes vendant en ligne par abonnement.
-- Ajoute : Acquisition (dépense pub, CAC, ROAS), Abonnement (MRR, churn, ARPU, LTV, LTV/CAC),
-- prestataires/freelances et résultat financier (frais de change) au compte de résultat.
-- Remplace intégralement config (idempotent). Les lignes "sessions/apprenants" restent pour les coachs en présentiel.

update activity_types set config = $cfg$
{
  "slug": "coach",
  "lines": [
    { "id": "ca", "core": true, "unit": "CUR", "label": "Chiffre d'affaires (formations / abonnements)", "section": "pnl" },
    { "id": "trainer_costs", "unit": "CUR", "label": "Intervenants / formateurs", "section": "pnl" },
    { "id": "marge_brute", "unit": "CUR", "label": "Marge brute", "total": true, "formula": "ca - coalesce(trainer_costs, 0)", "section": "pnl" },
    { "id": "contractors", "unit": "CUR", "label": "Prestataires & freelances", "section": "pnl", "hint": "Sous-traitance, freelances (souvent virements SEPA/Salary)" },
    { "id": "payroll", "unit": "CUR", "label": "Salaires & charges", "section": "pnl" },
    { "id": "marketing", "unit": "CUR", "label": "Marketing & publicité", "section": "pnl", "hint": "Coût total marketing (média + outils marketing)" },
    { "id": "platform_fees", "unit": "CUR", "label": "Outils & plateforme", "section": "pnl" },
    { "id": "other_opex", "unit": "CUR", "label": "Autres charges d'exploitation", "section": "pnl" },
    { "id": "total_opex", "unit": "CUR", "label": "Total charges de structure", "total": true, "formula": "sum(payroll, contractors, marketing, platform_fees, other_opex)", "section": "pnl" },
    { "id": "ebitda", "unit": "CUR", "label": "EBITDA", "total": true, "formula": "marge_brute - total_opex", "section": "pnl" },
    { "id": "da", "unit": "CUR", "label": "Amortissements", "section": "pnl" },
    { "id": "fin_result", "unit": "CUR", "label": "Résultat financier (frais de change, intérêts)", "section": "pnl", "hint": "Souvent négatif : frais de change sur dépenses en devises" },
    { "id": "taxes", "unit": "CUR", "label": "Impôts sur le résultat", "section": "pnl" },
    { "id": "resultat_net", "unit": "CUR", "label": "Résultat net", "total": true, "formula": "(present(da) || present(taxes) || present(fin_result)) ? (ebitda - coalesce(da, 0) + coalesce(fin_result, 0) - coalesce(taxes, 0)) : null", "section": "pnl" },

    { "id": "taux_marge_brute", "unit": "%", "label": "Taux de marge brute", "formula": "marge_brute / ca * 100", "section": "rentabilite" },
    { "id": "marge_ebitda", "unit": "%", "label": "Marge d'EBITDA", "formula": "ebitda / ca * 100", "section": "rentabilite" },
    { "id": "marge_nette", "unit": "%", "label": "Marge nette", "formula": "resultat_net / ca * 100", "section": "rentabilite" },

    { "id": "ad_spend", "unit": "CUR", "label": "Dépense publicitaire (média)", "section": "acquisition", "hint": "Meta/Google/TikTok Ads" },
    { "id": "new_customers", "unit": "", "label": "Nouveaux clients / abonnés", "section": "acquisition" },
    { "id": "cac", "unit": "CUR", "label": "Coût d'acquisition (CAC)", "formula": "ad_spend / new_customers", "section": "acquisition" },
    { "id": "roas", "unit": "x", "label": "ROAS (CA / dépense pub)", "formula": "ca / ad_spend", "section": "acquisition" },
    { "id": "marketing_ratio", "unit": "%", "label": "Poids de la pub dans le CA", "formula": "ad_spend / ca * 100", "section": "acquisition" },

    { "id": "mrr", "unit": "CUR", "label": "MRR (revenu récurrent mensuel)", "section": "abonnement" },
    { "id": "active_subs", "unit": "", "label": "Abonnés actifs", "section": "abonnement" },
    { "id": "new_subs", "unit": "", "label": "Nouveaux abonnés", "section": "abonnement" },
    { "id": "churned_subs", "unit": "", "label": "Abonnés perdus (churn)", "section": "abonnement" },
    { "id": "churn_rate", "unit": "%", "label": "Taux de churn", "formula": "churned_subs / active_subs * 100", "section": "abonnement" },
    { "id": "arpu", "unit": "CUR", "label": "ARPU (revenu moyen / abonné)", "formula": "mrr / active_subs", "section": "abonnement" },
    { "id": "ltv", "unit": "CUR", "label": "LTV (valeur vie client)", "formula": "(present(churn_rate) && churn_rate > 0) ? (arpu / (churn_rate / 100)) : null", "section": "abonnement" },
    { "id": "ltv_cac", "unit": "x", "label": "LTV / CAC", "formula": "(present(ltv) && present(cac) && cac > 0) ? (ltv / cac) : null", "section": "abonnement" },

    { "id": "sessions", "unit": "", "label": "Sessions / formations", "section": "activite" },
    { "id": "learners", "unit": "", "label": "Apprenants / participants", "section": "activite" },
    { "id": "capacity", "unit": "", "label": "Capacité totale", "section": "activite" },
    { "id": "fill_rate", "unit": "%", "label": "Taux de remplissage", "formula": "learners / capacity * 100", "section": "activite" },
    { "id": "price_avg", "unit": "CUR", "label": "Prix moyen par apprenant", "formula": "ca / learners", "section": "activite" },
    { "id": "ca_par_session", "unit": "CUR", "label": "CA moyen par session", "formula": "ca / sessions", "section": "activite" },

    { "id": "cash_start", "unit": "CUR", "label": "Trésorerie début de mois", "section": "tresorerie" },
    { "id": "cash_end", "core": true, "unit": "CUR", "label": "Trésorerie fin de mois", "section": "tresorerie" },
    { "id": "cash_variation", "unit": "CUR", "label": "Variation de trésorerie", "total": true, "formula": "cash_end - cash_start", "section": "tresorerie" }
  ],
  "checks": [
    { "id": "ca_present", "expr": "present(ca) && ca > 0", "label": "Le chiffre d'affaires est manquant ou nul.", "severity": "error" },
    { "id": "trainer_le_ca", "expr": "!present(trainer_costs) || !present(ca) || trainer_costs <= ca", "label": "Le coût des intervenants dépasse le CA — à vérifier.", "severity": "warn" },
    { "id": "fill_max", "expr": "!present(fill_rate) || fill_rate <= 100", "label": "Taux de remplissage > 100% — incohérent.", "severity": "warn" },
    { "id": "churn_max", "expr": "!present(churn_rate) || churn_rate <= 100", "label": "Taux de churn > 100% — incohérent.", "severity": "warn" },
    { "id": "ltvcac_health", "expr": "!present(ltv_cac) || ltv_cac >= 1", "label": "LTV/CAC < 1 : l'acquisition coûte plus qu'elle ne rapporte — à vérifier.", "severity": "warn" },
    { "id": "ebitda_plausible", "expr": "!present(ebitda) || !present(ca) || ca == 0 || abs(ebitda / ca) <= 1", "label": "Marge d'EBITDA hors plage plausible (±100%).", "severity": "warn" }
  ],
  "sections": [
    { "key": "pnl", "label": "Compte de résultat" },
    { "key": "rentabilite", "label": "Marges & rentabilité" },
    { "key": "acquisition", "label": "Acquisition & marketing" },
    { "key": "abonnement", "label": "Abonnement & récurrence" },
    { "key": "activite", "label": "Activité pédagogique" },
    { "key": "tresorerie", "label": "Trésorerie" }
  ],
  "dashboard": {
    "pages": [
      { "title": "Vue d'ensemble", "must": ["ca", "marge_brute", "ebitda", "resultat_net", "cash_end"], "ideas": "KPIs clés avec évolution vs mois précédent, tendance CA/EBITDA sur l'historique, callout 'lecture du mois'." },
      { "title": "Acquisition & rentabilité pub", "must": ["ad_spend", "new_customers", "cac", "roas"], "ideas": "Tendance dépense pub vs CA, CAC, ROAS, poids de la pub dans le CA. Barres CA vs pub par mois." },
      { "title": "Abonnement & récurrence", "must": ["mrr", "active_subs", "churn_rate", "arpu"], "ideas": "Courbe MRR et abonnés actifs, churn, ARPU, LTV et LTV/CAC. Mettre en avant la récurrence." },
      { "title": "CA & marges", "must": ["ca", "marge_brute", "taux_marge_brute", "trainer_costs"], "ideas": "Tendance du CA, coût des intervenants, marge brute et taux." },
      { "title": "Charges & rentabilité", "must": ["total_opex", "ebitda", "marge_ebitda"], "ideas": "Donut des charges de structure (salaires, prestataires, marketing, outils), EBITDA et marge." },
      { "title": "Activité pédagogique", "must": ["sessions", "learners", "fill_rate", "price_avg"], "ideas": "Sessions et apprenants, taux de remplissage, prix moyen, CA par session (si présentiel)." },
      { "title": "Trésorerie", "must": ["cash_end", "cash_variation"], "ideas": "Tendance de trésorerie et variation du mois (par devise si pertinent)." }
    ],
    "guidelines": "Dashboard organisme de formation / coaching, y compris formations vendues EN LIGNE par abonnement : visuel, multi-pages, adapté aux données présentes. Pour un business d'abonnement avec acquisition payante, prioriser : CA, EBITDA, dépense pub & CAC/ROAS, MRR & churn, LTV/CAC, masse salariale prestataires, trésorerie. Pour un coach en présentiel, prioriser sessions, remplissage, prix moyen. Ne pas afficher de page vide : n'inclure une page que si ses données existent."
  },
  "documents": [
    "Export des paiements (Stripe / Whop / plateforme)",
    "Dashboard publicitaire (Meta / Google / TikTok)",
    "Relevés de TOUS les comptes du mois (chaque devise)",
    "Factures émises",
    "Factures des prestataires / intervenants",
    "Compte de résultat / bilan / cash flow comptable (si dispo)",
    "Liste des sessions & participants (si formations en présentiel)"
  ]
}
$cfg$::jsonb
where slug = 'coach';
