-- Phase 14 — Type d'activité « Immobilier — Agence / Transaction » + son catalogue d'indicateurs.

INSERT INTO public.activity_types (slug, name, is_active)
SELECT 'immo_agence', 'Immobilier — Agence / Transaction', true
WHERE NOT EXISTS (SELECT 1 FROM public.activity_types WHERE slug = 'immo_agence');

UPDATE public.activity_types SET config = $cat$
{
  "slug": "immo_agence",
  "sections": [
    { "key": "pnl", "label": "Compte de résultat" },
    { "key": "rentabilite", "label": "Marges & rentabilité" },
    { "key": "activite", "label": "Transactions & mandats" },
    { "key": "productivite", "label": "Productivité (agents)" },
    { "key": "tresorerie", "label": "Trésorerie" }
  ],
  "lines": [
    { "id": "ca", "label": "Honoraires & commissions", "section": "pnl", "unit": "CUR", "core": true, "hint": "Total des commissions/honoraires encaissés sur le mois" },
    { "id": "agent_commissions", "label": "Rétrocessions aux agents", "section": "pnl", "unit": "CUR", "hint": "Commissions reversées aux négociateurs/apporteurs" },
    { "id": "marge_brute", "label": "Marge brute (après rétrocessions)", "section": "pnl", "unit": "CUR", "total": true, "note": "Honoraires − rétrocessions agents", "formula": "ca - agent_commissions" },
    { "id": "marketing", "label": "Marketing & publicité", "section": "pnl", "unit": "CUR", "hint": "Annonces, portails, communication" },
    { "id": "payroll", "label": "Salaires & charges", "section": "pnl", "unit": "CUR", "hint": "Masse salariale chargée (hors agents en rétrocession)" },
    { "id": "rent", "label": "Loyer & charges agence", "section": "pnl", "unit": "CUR", "hint": "Local, énergie, assurances" },
    { "id": "other_opex", "label": "Autres charges d'exploitation", "section": "pnl", "unit": "CUR", "hint": "Honoraires, outils, divers" },
    { "id": "total_opex", "label": "Total charges de structure", "section": "pnl", "unit": "CUR", "total": true, "note": "Marketing + salaires + loyer + autres", "formula": "sum(marketing, payroll, rent, other_opex)" },
    { "id": "ebitda", "label": "EBITDA", "section": "pnl", "unit": "CUR", "total": true, "note": "Marge brute − charges de structure", "formula": "marge_brute - total_opex" },
    { "id": "da", "label": "Amortissements & dépréciations", "section": "pnl", "unit": "CUR", "hint": "Si disponible" },
    { "id": "resultat_exploitation", "label": "Résultat d'exploitation", "section": "pnl", "unit": "CUR", "total": true, "note": "EBITDA − amortissements", "formula": "ebitda - da" },
    { "id": "financial_result", "label": "Résultat financier", "section": "pnl", "unit": "CUR", "hint": "Si dispo" },
    { "id": "taxes", "label": "Impôts sur le résultat", "section": "pnl", "unit": "CUR", "hint": "Si dispo" },
    { "id": "resultat_net", "label": "Résultat net", "section": "pnl", "unit": "CUR", "total": true, "note": "Rés. exploitation (ou EBITDA) + financier − impôts, si données disponibles", "formula": "(present(da) || present(financial_result) || present(taxes)) ? (coalesce(resultat_exploitation, ebitda) + coalesce(financial_result, 0) - coalesce(taxes, 0)) : null" },

    { "id": "taux_marge_brute", "label": "Taux de marge brute", "section": "rentabilite", "unit": "%", "note": "Marge brute ÷ honoraires", "formula": "marge_brute / ca * 100" },
    { "id": "marge_ebitda", "label": "Marge d'EBITDA", "section": "rentabilite", "unit": "%", "note": "EBITDA ÷ honoraires", "formula": "ebitda / ca * 100" },
    { "id": "marge_nette", "label": "Marge nette", "section": "rentabilite", "unit": "%", "note": "Résultat net ÷ honoraires", "formula": "resultat_net / ca * 100" },

    { "id": "transactions", "label": "Transactions conclues", "section": "activite", "unit": "", "core": true, "hint": "Ventes/locations signées sur le mois" },
    { "id": "mandates", "label": "Mandats signés", "section": "activite", "unit": "", "hint": "Nouveaux mandats du mois" },
    { "id": "active_mandates", "label": "Mandats en portefeuille", "section": "activite", "unit": "", "hint": "Mandats actifs en cours" },
    { "id": "transaction_volume", "label": "Volume de transactions", "section": "activite", "unit": "CUR", "hint": "Valeur totale des biens transigés" },
    { "id": "leads", "label": "Leads / contacts", "section": "activite", "unit": "", "hint": "Nombre de contacts entrants" },
    { "id": "commission_moyenne", "label": "Commission moyenne / transaction", "section": "activite", "unit": "CUR", "note": "Honoraires ÷ transactions", "formula": "ca / transactions" },
    { "id": "taux_commission", "label": "Taux de commission moyen", "section": "activite", "unit": "%", "note": "Honoraires ÷ volume de transactions", "formula": "ca / transaction_volume * 100" },
    { "id": "conversion_mandats", "label": "Concrétisation mandats → ventes", "section": "activite", "unit": "%", "note": "Transactions ÷ mandats signés", "formula": "transactions / mandates * 100" },
    { "id": "conversion_leads", "label": "Conversion leads → transactions", "section": "activite", "unit": "%", "note": "Transactions ÷ leads", "formula": "transactions / leads * 100" },

    { "id": "agents", "label": "Nombre d'agents", "section": "productivite", "unit": "", "hint": "Négociateurs actifs" },
    { "id": "ca_par_agent", "label": "Honoraires par agent", "section": "productivite", "unit": "CUR", "note": "Honoraires ÷ agents", "formula": "ca / agents" },
    { "id": "transactions_par_agent", "label": "Transactions par agent", "section": "productivite", "unit": "", "note": "Transactions ÷ agents", "formula": "transactions / agents" },

    { "id": "cash_start", "label": "Trésorerie début de mois", "section": "tresorerie", "unit": "CUR", "hint": "Solde au 1er" },
    { "id": "cash_end", "label": "Trésorerie fin de mois", "section": "tresorerie", "unit": "CUR", "core": true, "hint": "Solde en fin de mois" },
    { "id": "cash_variation", "label": "Variation de trésorerie", "section": "tresorerie", "unit": "CUR", "total": true, "note": "Fin − début", "formula": "cash_end - cash_start" },
    { "id": "receivables", "label": "Commissions à encaisser", "section": "tresorerie", "unit": "CUR", "hint": "Honoraires facturés non encore encaissés" }
  ],
  "checks": [
    { "id": "ca_present", "label": "Les honoraires sont manquants ou nuls.", "severity": "error", "expr": "present(ca) && ca > 0" },
    { "id": "agent_le_ca", "label": "Les rétrocessions dépassent les honoraires — à vérifier.", "severity": "warn", "expr": "!present(agent_commissions) || !present(ca) || agent_commissions <= ca" },
    { "id": "opex_positive", "label": "Une charge est négative — à vérifier.", "severity": "warn", "expr": "(!present(agent_commissions) || agent_commissions >= 0) && (!present(marketing) || marketing >= 0) && (!present(payroll) || payroll >= 0) && (!present(rent) || rent >= 0) && (!present(other_opex) || other_opex >= 0)" },
    { "id": "ebitda_plausible", "label": "Marge d'EBITDA hors plage plausible (±100%).", "severity": "warn", "expr": "!present(ebitda) || !present(ca) || ca == 0 || abs(ebitda / ca) <= 1" },
    { "id": "conversion_max", "label": "Concrétisation mandats > 100% — incohérent.", "severity": "warn", "expr": "!present(conversion_mandats) || conversion_mandats <= 100" },
    { "id": "taux_commission_max", "label": "Taux de commission > 100% — incohérent.", "severity": "warn", "expr": "!present(taux_commission) || taux_commission <= 100" }
  ]
}
$cat$::jsonb
WHERE slug = 'immo_agence';

-- Rattache le client test « Immo Pour Expat » à cette activité.
UPDATE public.clients
SET activity_type_id = (SELECT id FROM public.activity_types WHERE slug = 'immo_agence' LIMIT 1)
WHERE name ILIKE 'Immo Pour Expat';
