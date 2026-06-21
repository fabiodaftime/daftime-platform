-- Phase 16 — Catalogues d'indicateurs : Conseil/Services, Restauration & Hôtellerie, Formation, Holdings.

-- ───────────────────────── Conseil & Services ─────────────────────────
UPDATE public.activity_types SET config = $cat$
{
  "slug": "services",
  "sections": [
    { "key": "pnl", "label": "Compte de résultat" },
    { "key": "rentabilite", "label": "Marges & rentabilité" },
    { "key": "activite", "label": "Activité & facturation" },
    { "key": "staffing", "label": "Équipe & staffing" },
    { "key": "tresorerie", "label": "Trésorerie" }
  ],
  "lines": [
    { "id": "ca", "label": "Honoraires", "section": "pnl", "unit": "CUR", "core": true, "hint": "Honoraires facturés sur le mois" },
    { "id": "subcontracting", "label": "Sous-traitance", "section": "pnl", "unit": "CUR", "hint": "Prestataires externes" },
    { "id": "marge_brute", "label": "Marge brute", "section": "pnl", "unit": "CUR", "total": true, "note": "Honoraires − sous-traitance", "formula": "ca - subcontracting" },
    { "id": "payroll", "label": "Salaires & charges", "section": "pnl", "unit": "CUR", "hint": "Masse salariale chargée" },
    { "id": "marketing", "label": "Marketing & commercial", "section": "pnl", "unit": "CUR" },
    { "id": "rent", "label": "Loyer & charges", "section": "pnl", "unit": "CUR" },
    { "id": "other_opex", "label": "Autres charges d'exploitation", "section": "pnl", "unit": "CUR" },
    { "id": "total_opex", "label": "Total charges de structure", "section": "pnl", "unit": "CUR", "total": true, "formula": "sum(payroll, marketing, rent, other_opex)" },
    { "id": "ebitda", "label": "EBITDA", "section": "pnl", "unit": "CUR", "total": true, "formula": "marge_brute - total_opex" },
    { "id": "da", "label": "Amortissements", "section": "pnl", "unit": "CUR" },
    { "id": "resultat_exploitation", "label": "Résultat d'exploitation", "section": "pnl", "unit": "CUR", "total": true, "formula": "ebitda - da" },
    { "id": "financial_result", "label": "Résultat financier", "section": "pnl", "unit": "CUR" },
    { "id": "taxes", "label": "Impôts sur le résultat", "section": "pnl", "unit": "CUR" },
    { "id": "resultat_net", "label": "Résultat net", "section": "pnl", "unit": "CUR", "total": true, "formula": "(present(da) || present(financial_result) || present(taxes)) ? (coalesce(resultat_exploitation, ebitda) + coalesce(financial_result, 0) - coalesce(taxes, 0)) : null" },
    { "id": "taux_marge_brute", "label": "Taux de marge brute", "section": "rentabilite", "unit": "%", "formula": "marge_brute / ca * 100" },
    { "id": "marge_ebitda", "label": "Marge d'EBITDA", "section": "rentabilite", "unit": "%", "formula": "ebitda / ca * 100" },
    { "id": "marge_nette", "label": "Marge nette", "section": "rentabilite", "unit": "%", "formula": "resultat_net / ca * 100" },
    { "id": "billed_days", "label": "Jours facturés", "section": "activite", "unit": "", "core": true, "hint": "Jours-homme facturés sur le mois" },
    { "id": "tjm", "label": "Taux journalier moyen (TJM)", "section": "activite", "unit": "CUR", "formula": "ca / billed_days" },
    { "id": "active_clients", "label": "Clients actifs", "section": "activite", "unit": "" },
    { "id": "ca_par_client", "label": "Honoraires moyens par client", "section": "activite", "unit": "CUR", "formula": "ca / active_clients" },
    { "id": "receivables", "label": "Créances clients", "section": "activite", "unit": "CUR" },
    { "id": "dso", "label": "Délai d'encaissement (jours)", "section": "activite", "unit": "j", "formula": "receivables / ca * 30" },
    { "id": "consultants", "label": "Consultants", "section": "staffing", "unit": "" },
    { "id": "available_days", "label": "Jours disponibles", "section": "staffing", "unit": "" },
    { "id": "utilization", "label": "Taux d'occupation", "section": "staffing", "unit": "%", "formula": "billed_days / available_days * 100" },
    { "id": "ca_par_consultant", "label": "Honoraires par consultant", "section": "staffing", "unit": "CUR", "formula": "ca / consultants" },
    { "id": "cash_start", "label": "Trésorerie début de mois", "section": "tresorerie", "unit": "CUR" },
    { "id": "cash_end", "label": "Trésorerie fin de mois", "section": "tresorerie", "unit": "CUR", "core": true },
    { "id": "cash_variation", "label": "Variation de trésorerie", "section": "tresorerie", "unit": "CUR", "total": true, "formula": "cash_end - cash_start" }
  ],
  "checks": [
    { "id": "ca_present", "label": "Les honoraires sont manquants ou nuls.", "severity": "error", "expr": "present(ca) && ca > 0" },
    { "id": "sub_le_ca", "label": "La sous-traitance dépasse les honoraires — à vérifier.", "severity": "warn", "expr": "!present(subcontracting) || !present(ca) || subcontracting <= ca" },
    { "id": "opex_positive", "label": "Une charge est négative — à vérifier.", "severity": "warn", "expr": "(!present(payroll) || payroll >= 0) && (!present(marketing) || marketing >= 0) && (!present(rent) || rent >= 0) && (!present(other_opex) || other_opex >= 0)" },
    { "id": "ebitda_plausible", "label": "Marge d'EBITDA hors plage plausible (±100%).", "severity": "warn", "expr": "!present(ebitda) || !present(ca) || ca == 0 || abs(ebitda / ca) <= 1" }
  ]
}
$cat$::jsonb WHERE slug = 'services';

-- ───────────────────────── Restauration & Hôtellerie ─────────────────────────
UPDATE public.activity_types SET config = $cat$
{
  "slug": "restaurant",
  "sections": [
    { "key": "pnl", "label": "Compte de résultat" },
    { "key": "rentabilite", "label": "Marges & ratios" },
    { "key": "activite", "label": "Activité salle" },
    { "key": "hotel", "label": "Hôtellerie" },
    { "key": "tresorerie", "label": "Trésorerie" }
  ],
  "lines": [
    { "id": "ca", "label": "Chiffre d'affaires", "section": "pnl", "unit": "CUR", "core": true },
    { "id": "food_cost", "label": "Coût matières (food cost)", "section": "pnl", "unit": "CUR", "core": true },
    { "id": "marge_brute", "label": "Marge brute", "section": "pnl", "unit": "CUR", "total": true, "formula": "ca - food_cost" },
    { "id": "payroll", "label": "Masse salariale", "section": "pnl", "unit": "CUR" },
    { "id": "rent", "label": "Loyer", "section": "pnl", "unit": "CUR" },
    { "id": "energy", "label": "Énergie & fluides", "section": "pnl", "unit": "CUR" },
    { "id": "other_opex", "label": "Autres charges", "section": "pnl", "unit": "CUR" },
    { "id": "total_opex", "label": "Total charges de structure", "section": "pnl", "unit": "CUR", "total": true, "formula": "sum(payroll, rent, energy, other_opex)" },
    { "id": "ebitda", "label": "EBITDA", "section": "pnl", "unit": "CUR", "total": true, "formula": "marge_brute - total_opex" },
    { "id": "da", "label": "Amortissements", "section": "pnl", "unit": "CUR" },
    { "id": "resultat_exploitation", "label": "Résultat d'exploitation", "section": "pnl", "unit": "CUR", "total": true, "formula": "ebitda - da" },
    { "id": "taxes", "label": "Impôts sur le résultat", "section": "pnl", "unit": "CUR" },
    { "id": "resultat_net", "label": "Résultat net", "section": "pnl", "unit": "CUR", "total": true, "formula": "(present(da) || present(taxes)) ? (coalesce(resultat_exploitation, ebitda) - coalesce(taxes, 0)) : null" },
    { "id": "taux_marge_brute", "label": "Taux de marge brute", "section": "rentabilite", "unit": "%", "formula": "marge_brute / ca * 100" },
    { "id": "food_cost_rate", "label": "Ratio food cost", "section": "rentabilite", "unit": "%", "formula": "food_cost / ca * 100" },
    { "id": "payroll_rate", "label": "Ratio masse salariale", "section": "rentabilite", "unit": "%", "formula": "payroll / ca * 100" },
    { "id": "marge_ebitda", "label": "Marge d'EBITDA", "section": "rentabilite", "unit": "%", "formula": "ebitda / ca * 100" },
    { "id": "covers", "label": "Couverts servis", "section": "activite", "unit": "", "core": true },
    { "id": "ticket_moyen", "label": "Ticket moyen", "section": "activite", "unit": "CUR", "formula": "ca / covers" },
    { "id": "open_days", "label": "Jours d'ouverture", "section": "activite", "unit": "" },
    { "id": "ca_par_jour", "label": "CA moyen par jour", "section": "activite", "unit": "CUR", "formula": "ca / open_days" },
    { "id": "rooms", "label": "Chambres", "section": "hotel", "unit": "" },
    { "id": "room_nights", "label": "Nuitées vendues", "section": "hotel", "unit": "" },
    { "id": "room_revenue", "label": "CA hébergement", "section": "hotel", "unit": "CUR" },
    { "id": "occupancy", "label": "Taux d'occupation", "section": "hotel", "unit": "%", "formula": "room_nights / (rooms * open_days) * 100" },
    { "id": "adr", "label": "Prix moyen (ADR)", "section": "hotel", "unit": "CUR", "formula": "room_revenue / room_nights" },
    { "id": "revpar", "label": "RevPAR", "section": "hotel", "unit": "CUR", "formula": "room_revenue / (rooms * open_days)" },
    { "id": "cash_start", "label": "Trésorerie début de mois", "section": "tresorerie", "unit": "CUR" },
    { "id": "cash_end", "label": "Trésorerie fin de mois", "section": "tresorerie", "unit": "CUR", "core": true },
    { "id": "cash_variation", "label": "Variation de trésorerie", "section": "tresorerie", "unit": "CUR", "total": true, "formula": "cash_end - cash_start" }
  ],
  "checks": [
    { "id": "ca_present", "label": "Le chiffre d'affaires est manquant ou nul.", "severity": "error", "expr": "present(ca) && ca > 0" },
    { "id": "food_le_ca", "label": "Le food cost dépasse le CA — à vérifier.", "severity": "warn", "expr": "!present(food_cost) || !present(ca) || food_cost <= ca" },
    { "id": "opex_positive", "label": "Une charge est négative — à vérifier.", "severity": "warn", "expr": "(!present(payroll) || payroll >= 0) && (!present(rent) || rent >= 0) && (!present(energy) || energy >= 0) && (!present(other_opex) || other_opex >= 0)" },
    { "id": "occupancy_max", "label": "Taux d'occupation > 100% — incohérent.", "severity": "warn", "expr": "!present(occupancy) || occupancy <= 100" }
  ]
}
$cat$::jsonb WHERE slug = 'restaurant';

-- ───────────────────────── Formation / Coach ─────────────────────────
UPDATE public.activity_types SET config = $cat$
{
  "slug": "coach",
  "sections": [
    { "key": "pnl", "label": "Compte de résultat" },
    { "key": "rentabilite", "label": "Marges & rentabilité" },
    { "key": "activite", "label": "Activité pédagogique" },
    { "key": "tresorerie", "label": "Trésorerie" }
  ],
  "lines": [
    { "id": "ca", "label": "Chiffre d'affaires (formations)", "section": "pnl", "unit": "CUR", "core": true },
    { "id": "trainer_costs", "label": "Intervenants / formateurs", "section": "pnl", "unit": "CUR" },
    { "id": "marge_brute", "label": "Marge brute", "section": "pnl", "unit": "CUR", "total": true, "formula": "ca - trainer_costs" },
    { "id": "payroll", "label": "Salaires & charges", "section": "pnl", "unit": "CUR" },
    { "id": "marketing", "label": "Marketing & acquisition", "section": "pnl", "unit": "CUR" },
    { "id": "platform_fees", "label": "Outils & plateforme", "section": "pnl", "unit": "CUR" },
    { "id": "other_opex", "label": "Autres charges", "section": "pnl", "unit": "CUR" },
    { "id": "total_opex", "label": "Total charges de structure", "section": "pnl", "unit": "CUR", "total": true, "formula": "sum(payroll, marketing, platform_fees, other_opex)" },
    { "id": "ebitda", "label": "EBITDA", "section": "pnl", "unit": "CUR", "total": true, "formula": "marge_brute - total_opex" },
    { "id": "da", "label": "Amortissements", "section": "pnl", "unit": "CUR" },
    { "id": "taxes", "label": "Impôts sur le résultat", "section": "pnl", "unit": "CUR" },
    { "id": "resultat_net", "label": "Résultat net", "section": "pnl", "unit": "CUR", "total": true, "formula": "(present(da) || present(taxes)) ? (ebitda - coalesce(da, 0) - coalesce(taxes, 0)) : null" },
    { "id": "taux_marge_brute", "label": "Taux de marge brute", "section": "rentabilite", "unit": "%", "formula": "marge_brute / ca * 100" },
    { "id": "marge_ebitda", "label": "Marge d'EBITDA", "section": "rentabilite", "unit": "%", "formula": "ebitda / ca * 100" },
    { "id": "sessions", "label": "Sessions / formations", "section": "activite", "unit": "" },
    { "id": "learners", "label": "Apprenants / participants", "section": "activite", "unit": "", "core": true },
    { "id": "capacity", "label": "Capacité totale", "section": "activite", "unit": "" },
    { "id": "fill_rate", "label": "Taux de remplissage", "section": "activite", "unit": "%", "formula": "learners / capacity * 100" },
    { "id": "price_avg", "label": "Prix moyen par apprenant", "section": "activite", "unit": "CUR", "formula": "ca / learners" },
    { "id": "ca_par_session", "label": "CA moyen par session", "section": "activite", "unit": "CUR", "formula": "ca / sessions" },
    { "id": "cash_start", "label": "Trésorerie début de mois", "section": "tresorerie", "unit": "CUR" },
    { "id": "cash_end", "label": "Trésorerie fin de mois", "section": "tresorerie", "unit": "CUR", "core": true },
    { "id": "cash_variation", "label": "Variation de trésorerie", "section": "tresorerie", "unit": "CUR", "total": true, "formula": "cash_end - cash_start" }
  ],
  "checks": [
    { "id": "ca_present", "label": "Le chiffre d'affaires est manquant ou nul.", "severity": "error", "expr": "present(ca) && ca > 0" },
    { "id": "trainer_le_ca", "label": "Le coût des intervenants dépasse le CA — à vérifier.", "severity": "warn", "expr": "!present(trainer_costs) || !present(ca) || trainer_costs <= ca" },
    { "id": "fill_max", "label": "Taux de remplissage > 100% — incohérent.", "severity": "warn", "expr": "!present(fill_rate) || fill_rate <= 100" },
    { "id": "ebitda_plausible", "label": "Marge d'EBITDA hors plage plausible (±100%).", "severity": "warn", "expr": "!present(ebitda) || !present(ca) || ca == 0 || abs(ebitda / ca) <= 1" }
  ]
}
$cat$::jsonb WHERE slug = 'coach';

-- ───────────────────────── Holdings & Groupes ─────────────────────────
UPDATE public.activity_types SET config = $cat$
{
  "slug": "holding",
  "sections": [
    { "key": "pnl", "label": "Produits & résultat" },
    { "key": "rentabilite", "label": "Rentabilité" },
    { "key": "patrimoine", "label": "Patrimoine & dette" },
    { "key": "perimetre", "label": "Périmètre" },
    { "key": "tresorerie", "label": "Trésorerie" }
  ],
  "lines": [
    { "id": "dividends", "label": "Dividendes reçus", "section": "pnl", "unit": "CUR", "hint": "Remontées des filiales" },
    { "id": "management_fees", "label": "Management fees / refacturations", "section": "pnl", "unit": "CUR" },
    { "id": "other_revenue", "label": "Autres produits", "section": "pnl", "unit": "CUR" },
    { "id": "ca", "label": "Total des produits", "section": "pnl", "unit": "CUR", "total": true, "formula": "sum(dividends, management_fees, other_revenue)" },
    { "id": "holding_costs", "label": "Frais de holding", "section": "pnl", "unit": "CUR" },
    { "id": "payroll", "label": "Salaires & charges", "section": "pnl", "unit": "CUR" },
    { "id": "other_opex", "label": "Autres charges", "section": "pnl", "unit": "CUR" },
    { "id": "total_opex", "label": "Total charges", "section": "pnl", "unit": "CUR", "total": true, "formula": "sum(holding_costs, payroll, other_opex)" },
    { "id": "ebitda", "label": "Résultat opérationnel", "section": "pnl", "unit": "CUR", "total": true, "formula": "ca - total_opex" },
    { "id": "financial_result", "label": "Résultat financier (intérêts)", "section": "pnl", "unit": "CUR" },
    { "id": "da", "label": "Amortissements", "section": "pnl", "unit": "CUR" },
    { "id": "taxes", "label": "Impôts", "section": "pnl", "unit": "CUR" },
    { "id": "resultat_net", "label": "Résultat net", "section": "pnl", "unit": "CUR", "total": true, "formula": "(present(financial_result) || present(taxes) || present(da)) ? (ebitda - coalesce(da, 0) + coalesce(financial_result, 0) - coalesce(taxes, 0)) : null" },
    { "id": "marge_ebitda", "label": "Marge opérationnelle", "section": "rentabilite", "unit": "%", "formula": "ebitda / ca * 100" },
    { "id": "marge_nette", "label": "Marge nette", "section": "rentabilite", "unit": "%", "formula": "resultat_net / ca * 100" },
    { "id": "investments_value", "label": "Valeur des participations", "section": "patrimoine", "unit": "CUR" },
    { "id": "debt", "label": "Dette financière", "section": "patrimoine", "unit": "CUR" },
    { "id": "equity", "label": "Capitaux propres", "section": "patrimoine", "unit": "CUR" },
    { "id": "ltv", "label": "LTV (dette / participations)", "section": "patrimoine", "unit": "%", "formula": "debt / investments_value * 100" },
    { "id": "gearing", "label": "Gearing (dette / fonds propres)", "section": "patrimoine", "unit": "x", "formula": "debt / equity" },
    { "id": "subsidiaries", "label": "Nombre de filiales", "section": "perimetre", "unit": "" },
    { "id": "consolidated_result", "label": "Résultat consolidé", "section": "perimetre", "unit": "CUR" },
    { "id": "cash_start", "label": "Trésorerie début de mois", "section": "tresorerie", "unit": "CUR" },
    { "id": "cash_end", "label": "Trésorerie consolidée", "section": "tresorerie", "unit": "CUR", "core": true },
    { "id": "cash_variation", "label": "Variation de trésorerie", "section": "tresorerie", "unit": "CUR", "total": true, "formula": "cash_end - cash_start" }
  ],
  "checks": [
    { "id": "produits_present", "label": "Aucun produit (dividendes/fees) renseigné.", "severity": "error", "expr": "present(ca) && ca > 0" },
    { "id": "opex_positive", "label": "Une charge est négative — à vérifier.", "severity": "warn", "expr": "(!present(holding_costs) || holding_costs >= 0) && (!present(payroll) || payroll >= 0) && (!present(other_opex) || other_opex >= 0)" },
    { "id": "ltv_plausible", "label": "LTV > 150% — à vérifier.", "severity": "warn", "expr": "!present(ltv) || ltv <= 150" }
  ]
}
$cat$::jsonb WHERE slug = 'holding';
