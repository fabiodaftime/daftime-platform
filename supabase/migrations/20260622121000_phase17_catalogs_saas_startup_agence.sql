-- Phase 17 — Nouveaux types d'activité + catalogues : SaaS & Tech, Startups, Agences & Médias.

INSERT INTO public.activity_types (slug, name, is_active)
SELECT v.slug, v.name, true FROM (VALUES
  ('saas', 'SaaS & Tech'),
  ('startup', 'Startup'),
  ('agence_media', 'Agence & Médias')
) AS v(slug, name)
WHERE NOT EXISTS (SELECT 1 FROM public.activity_types a WHERE a.slug = v.slug);

-- ───────────────────────── SaaS & Tech ─────────────────────────
UPDATE public.activity_types SET config = $cat$
{
  "slug": "saas",
  "sections": [
    { "key": "pnl", "label": "Compte de résultat" },
    { "key": "rentabilite", "label": "Marges & rentabilité" },
    { "key": "recurring", "label": "Revenus récurrents" },
    { "key": "clients", "label": "Clients & rétention" },
    { "key": "tresorerie", "label": "Trésorerie & runway" }
  ],
  "lines": [
    { "id": "ca", "label": "Revenu reconnu", "section": "pnl", "unit": "CUR", "core": true },
    { "id": "cogs", "label": "Coûts d'infrastructure (hosting)", "section": "pnl", "unit": "CUR" },
    { "id": "marge_brute", "label": "Marge brute", "section": "pnl", "unit": "CUR", "total": true, "formula": "ca - cogs" },
    { "id": "rd", "label": "R&D / Produit", "section": "pnl", "unit": "CUR" },
    { "id": "sales_marketing", "label": "Sales & Marketing", "section": "pnl", "unit": "CUR" },
    { "id": "ga", "label": "Frais généraux (G&A)", "section": "pnl", "unit": "CUR" },
    { "id": "total_opex", "label": "Total charges d'exploitation", "section": "pnl", "unit": "CUR", "total": true, "formula": "sum(rd, sales_marketing, ga)" },
    { "id": "ebitda", "label": "EBITDA", "section": "pnl", "unit": "CUR", "total": true, "formula": "marge_brute - total_opex" },
    { "id": "da", "label": "Amortissements", "section": "pnl", "unit": "CUR" },
    { "id": "taxes", "label": "Impôts", "section": "pnl", "unit": "CUR" },
    { "id": "resultat_net", "label": "Résultat net", "section": "pnl", "unit": "CUR", "total": true, "formula": "(present(da) || present(taxes)) ? (ebitda - coalesce(da, 0) - coalesce(taxes, 0)) : null" },
    { "id": "taux_marge_brute", "label": "Marge brute", "section": "rentabilite", "unit": "%", "formula": "marge_brute / ca * 100" },
    { "id": "marge_ebitda", "label": "Marge d'EBITDA", "section": "rentabilite", "unit": "%", "formula": "ebitda / ca * 100" },
    { "id": "mrr", "label": "MRR", "section": "recurring", "unit": "CUR", "core": true },
    { "id": "arr", "label": "ARR", "section": "recurring", "unit": "CUR", "formula": "mrr * 12" },
    { "id": "new_mrr", "label": "New MRR", "section": "recurring", "unit": "CUR" },
    { "id": "expansion_mrr", "label": "Expansion MRR", "section": "recurring", "unit": "CUR" },
    { "id": "churned_mrr", "label": "Churned MRR", "section": "recurring", "unit": "CUR" },
    { "id": "net_new_mrr", "label": "Net New MRR", "section": "recurring", "unit": "CUR", "total": true, "formula": "(present(new_mrr) || present(expansion_mrr) || present(churned_mrr)) ? (coalesce(new_mrr, 0) + coalesce(expansion_mrr, 0) - coalesce(churned_mrr, 0)) : null" },
    { "id": "customers", "label": "Clients actifs", "section": "clients", "unit": "" },
    { "id": "new_customers", "label": "Nouveaux clients", "section": "clients", "unit": "" },
    { "id": "arpa", "label": "ARPA (par mois)", "section": "clients", "unit": "CUR", "formula": "mrr / customers" },
    { "id": "churn_rate", "label": "Taux de churn (MRR)", "section": "clients", "unit": "%", "formula": "churned_mrr / mrr * 100" },
    { "id": "nrr", "label": "Net Revenue Retention", "section": "clients", "unit": "%", "hint": "Si connu" },
    { "id": "cac", "label": "CAC", "section": "clients", "unit": "CUR", "formula": "sales_marketing / new_customers" },
    { "id": "ltv", "label": "LTV", "section": "clients", "unit": "CUR", "note": "ARPA × marge brute % ÷ churn %", "formula": "arpa * (taux_marge_brute / 100) / (churn_rate / 100)" },
    { "id": "ltv_cac", "label": "LTV / CAC", "section": "clients", "unit": "x", "formula": "ltv / cac" },
    { "id": "cash_start", "label": "Trésorerie début de mois", "section": "tresorerie", "unit": "CUR" },
    { "id": "cash_end", "label": "Trésorerie fin de mois", "section": "tresorerie", "unit": "CUR", "core": true },
    { "id": "cash_variation", "label": "Variation de trésorerie", "section": "tresorerie", "unit": "CUR", "total": true, "formula": "cash_end - cash_start" },
    { "id": "monthly_burn", "label": "Burn mensuel net", "section": "tresorerie", "unit": "CUR" },
    { "id": "runway", "label": "Runway (mois)", "section": "tresorerie", "unit": "", "formula": "cash_end / monthly_burn" }
  ],
  "checks": [
    { "id": "ca_present", "label": "Aucun revenu (CA/MRR) renseigné.", "severity": "error", "expr": "(present(ca) && ca > 0) || (present(mrr) && mrr > 0)" },
    { "id": "cogs_le_ca", "label": "Le COGS dépasse le revenu — à vérifier.", "severity": "warn", "expr": "!present(cogs) || !present(ca) || cogs <= ca" },
    { "id": "churn_max", "label": "Taux de churn > 100% — incohérent.", "severity": "warn", "expr": "!present(churn_rate) || churn_rate <= 100" }
  ]
}
$cat$::jsonb WHERE slug = 'saas';

-- ───────────────────────── Startup ─────────────────────────
UPDATE public.activity_types SET config = $cat$
{
  "slug": "startup",
  "sections": [
    { "key": "pnl", "label": "Compte de résultat" },
    { "key": "croissance", "label": "Croissance & traction" },
    { "key": "tresorerie", "label": "Cash & runway" }
  ],
  "lines": [
    { "id": "ca", "label": "Revenu", "section": "pnl", "unit": "CUR" },
    { "id": "cogs", "label": "Coûts directs", "section": "pnl", "unit": "CUR" },
    { "id": "marge_brute", "label": "Marge brute", "section": "pnl", "unit": "CUR", "total": true, "formula": "ca - cogs" },
    { "id": "payroll", "label": "Salaires & charges", "section": "pnl", "unit": "CUR" },
    { "id": "marketing", "label": "Marketing & acquisition", "section": "pnl", "unit": "CUR" },
    { "id": "rd", "label": "R&D / Produit", "section": "pnl", "unit": "CUR" },
    { "id": "other_opex", "label": "Autres charges", "section": "pnl", "unit": "CUR" },
    { "id": "total_opex", "label": "Total charges d'exploitation", "section": "pnl", "unit": "CUR", "total": true, "formula": "sum(payroll, marketing, rd, other_opex)" },
    { "id": "ebitda", "label": "Résultat opérationnel", "section": "pnl", "unit": "CUR", "total": true, "formula": "marge_brute - total_opex" },
    { "id": "mrr", "label": "MRR", "section": "croissance", "unit": "CUR" },
    { "id": "mrr_growth", "label": "Croissance MRR (MoM)", "section": "croissance", "unit": "%", "hint": "Vs mois précédent" },
    { "id": "active_users", "label": "Utilisateurs actifs", "section": "croissance", "unit": "" },
    { "id": "new_users", "label": "Nouveaux utilisateurs", "section": "croissance", "unit": "" },
    { "id": "user_growth", "label": "Croissance utilisateurs (MoM)", "section": "croissance", "unit": "%", "hint": "Vs mois précédent" },
    { "id": "cac", "label": "CAC", "section": "croissance", "unit": "CUR", "formula": "marketing / new_users" },
    { "id": "cash_start", "label": "Trésorerie début de mois", "section": "tresorerie", "unit": "CUR" },
    { "id": "cash_end", "label": "Trésorerie fin de mois", "section": "tresorerie", "unit": "CUR", "core": true },
    { "id": "cash_variation", "label": "Variation de trésorerie", "section": "tresorerie", "unit": "CUR", "total": true, "formula": "cash_end - cash_start" },
    { "id": "monthly_burn", "label": "Burn net mensuel", "section": "tresorerie", "unit": "CUR", "core": true, "hint": "Cash consommé sur le mois" },
    { "id": "runway", "label": "Runway (mois)", "section": "tresorerie", "unit": "", "note": "Trésorerie ÷ burn mensuel", "formula": "cash_end / monthly_burn" }
  ],
  "checks": [
    { "id": "cogs_le_ca", "label": "Les coûts directs dépassent le revenu — à vérifier.", "severity": "warn", "expr": "!present(cogs) || !present(ca) || cogs <= ca" },
    { "id": "opex_positive", "label": "Une charge est négative — à vérifier.", "severity": "warn", "expr": "(!present(payroll) || payroll >= 0) && (!present(marketing) || marketing >= 0) && (!present(rd) || rd >= 0) && (!present(other_opex) || other_opex >= 0)" },
    { "id": "burn_present", "label": "Renseigner trésorerie et burn pour suivre le runway.", "severity": "warn", "expr": "present(cash_end) && present(monthly_burn)" }
  ]
}
$cat$::jsonb WHERE slug = 'startup';

-- ───────────────────────── Agence & Médias ─────────────────────────
UPDATE public.activity_types SET config = $cat$
{
  "slug": "agence_media",
  "sections": [
    { "key": "pnl", "label": "Compte de résultat" },
    { "key": "rentabilite", "label": "Marges & rentabilité" },
    { "key": "activite", "label": "Activité & clients" },
    { "key": "staffing", "label": "Équipe & production" },
    { "key": "tresorerie", "label": "Trésorerie" }
  ],
  "lines": [
    { "id": "gross_billings", "label": "Facturation brute", "section": "pnl", "unit": "CUR", "hint": "Incluant l'achat média refacturé" },
    { "id": "media_buying", "label": "Achats média (refacturés)", "section": "pnl", "unit": "CUR" },
    { "id": "ca", "label": "Revenu net (honoraires)", "section": "pnl", "unit": "CUR", "core": true, "hint": "Honoraires hors achats média" },
    { "id": "freelance_costs", "label": "Freelances / sous-traitance", "section": "pnl", "unit": "CUR" },
    { "id": "marge_brute", "label": "Marge brute", "section": "pnl", "unit": "CUR", "total": true, "formula": "ca - freelance_costs" },
    { "id": "payroll", "label": "Salaires & charges", "section": "pnl", "unit": "CUR" },
    { "id": "tools", "label": "Outils & licences", "section": "pnl", "unit": "CUR" },
    { "id": "rent", "label": "Loyer & charges", "section": "pnl", "unit": "CUR" },
    { "id": "other_opex", "label": "Autres charges", "section": "pnl", "unit": "CUR" },
    { "id": "total_opex", "label": "Total charges de structure", "section": "pnl", "unit": "CUR", "total": true, "formula": "sum(payroll, tools, rent, other_opex)" },
    { "id": "ebitda", "label": "EBITDA", "section": "pnl", "unit": "CUR", "total": true, "formula": "marge_brute - total_opex" },
    { "id": "da", "label": "Amortissements", "section": "pnl", "unit": "CUR" },
    { "id": "taxes", "label": "Impôts", "section": "pnl", "unit": "CUR" },
    { "id": "resultat_net", "label": "Résultat net", "section": "pnl", "unit": "CUR", "total": true, "formula": "(present(da) || present(taxes)) ? (ebitda - coalesce(da, 0) - coalesce(taxes, 0)) : null" },
    { "id": "taux_marge_brute", "label": "Taux de marge brute", "section": "rentabilite", "unit": "%", "formula": "marge_brute / ca * 100" },
    { "id": "marge_ebitda", "label": "Marge d'EBITDA", "section": "rentabilite", "unit": "%", "formula": "ebitda / ca * 100" },
    { "id": "active_clients", "label": "Clients actifs", "section": "activite", "unit": "" },
    { "id": "new_clients", "label": "Nouveaux clients", "section": "activite", "unit": "" },
    { "id": "ca_par_client", "label": "Revenu moyen par client", "section": "activite", "unit": "CUR", "formula": "ca / active_clients" },
    { "id": "retainer_revenue", "label": "Revenu récurrent (retainers)", "section": "activite", "unit": "CUR" },
    { "id": "retainer_share", "label": "Part de revenu récurrent", "section": "activite", "unit": "%", "formula": "retainer_revenue / ca * 100" },
    { "id": "projects", "label": "Projets actifs", "section": "activite", "unit": "" },
    { "id": "staff", "label": "Effectif (ETP)", "section": "staffing", "unit": "" },
    { "id": "billed_hours", "label": "Heures facturées", "section": "staffing", "unit": "" },
    { "id": "available_hours", "label": "Heures disponibles", "section": "staffing", "unit": "" },
    { "id": "utilization", "label": "Taux d'occupation", "section": "staffing", "unit": "%", "formula": "billed_hours / available_hours * 100" },
    { "id": "ca_par_etp", "label": "Revenu par ETP", "section": "staffing", "unit": "CUR", "formula": "ca / staff" },
    { "id": "cash_start", "label": "Trésorerie début de mois", "section": "tresorerie", "unit": "CUR" },
    { "id": "cash_end", "label": "Trésorerie fin de mois", "section": "tresorerie", "unit": "CUR", "core": true },
    { "id": "cash_variation", "label": "Variation de trésorerie", "section": "tresorerie", "unit": "CUR", "total": true, "formula": "cash_end - cash_start" },
    { "id": "receivables", "label": "Créances clients", "section": "tresorerie", "unit": "CUR" }
  ],
  "checks": [
    { "id": "ca_present", "label": "Le revenu net (honoraires) est manquant ou nul.", "severity": "error", "expr": "present(ca) && ca > 0" },
    { "id": "freelance_le_ca", "label": "Les freelances dépassent les honoraires — à vérifier.", "severity": "warn", "expr": "!present(freelance_costs) || !present(ca) || freelance_costs <= ca" },
    { "id": "opex_positive", "label": "Une charge est négative — à vérifier.", "severity": "warn", "expr": "(!present(payroll) || payroll >= 0) && (!present(tools) || tools >= 0) && (!present(rent) || rent >= 0) && (!present(other_opex) || other_opex >= 0)" },
    { "id": "retainer_max", "label": "Part de récurrent > 100% — incohérent.", "severity": "warn", "expr": "!present(retainer_share) || retainer_share <= 100" }
  ]
}
$cat$::jsonb WHERE slug = 'agence_media';
