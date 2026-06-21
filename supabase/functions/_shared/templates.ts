// Modèle de TEMPLATE par activité — pièce maîtresse du pipeline.
// Un template décrit, pour une activité :
//  - les LIGNES (inputs extraits par l'IA + dérivés CALCULÉS par le code) et leur ordre d'affichage ;
//  - les VÉRIFICATIONS de cohérence (déterministes).
// Principe : l'IA extrait les inputs (avec provenance) ; le CODE calcule les dérivés et vérifie.

export type Vals = Record<string, number>;

export interface TemplateLine {
  id: string;                 // identifiant stable (ca, cogs, marge_brute…)
  label: string;              // libellé affiché
  section: string;            // clé de section
  unit?: string;              // 'CUR' = devise client, sinon littéral ('%', 'x', '')
  total?: boolean;            // ligne de total/sous-total (marquée type:"total")
  hint?: string;              // aide à l'extraction (inputs uniquement)
  compute?: (v: Vals) => number | null; // présent => DÉRIVÉ (calculé) ; absent => INPUT (extrait)
}

export interface TemplateCheck {
  id: string;
  label: string;              // message lisible si l'alerte se déclenche
  severity: "error" | "warn";
  test: (v: Vals) => boolean; // true = cohérent ; false = alerte
}

export interface ActivityTemplate {
  slug: string;
  label: string;
  sections: { key: string; label: string }[];
  lines: TemplateLine[];
  checks: TemplateCheck[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: Vals, k: string) => (typeof v[k] === "number" && isFinite(v[k]) ? v[k] : null);

// ───────────────────────── E-COMMERCE ─────────────────────────
export const ECOMMERCE: ActivityTemplate = {
  slug: "ecommerce",
  label: "E-commerce",
  sections: [
    { key: "pnl", label: "Compte de résultat" },
    { key: "kpi", label: "Indicateurs e-commerce" },
    { key: "tresorerie", label: "Trésorerie" },
  ],
  lines: [
    { id: "ca", label: "Chiffre d'affaires", section: "pnl", unit: "CUR", hint: "Ventes nettes du mois (hors taxes)" },
    { id: "cogs", label: "Coût des marchandises vendues (COGS)", section: "pnl", unit: "CUR", hint: "Achats de marchandises vendues sur le mois" },
    { id: "marge_brute", label: "Marge brute", section: "pnl", unit: "CUR", total: true, compute: (v) => (num(v, "ca") != null && num(v, "cogs") != null ? r2(v.ca - v.cogs) : null) },
    { id: "ads", label: "Publicité & acquisition", section: "pnl", unit: "CUR", hint: "Dépenses média (Meta, Google, TikTok…)" },
    { id: "platform_fees", label: "Frais de plateforme (Shopify, Stripe…)", section: "pnl", unit: "CUR", hint: "Abonnements + commissions de paiement" },
    { id: "logistics", label: "Logistique & expédition", section: "pnl", unit: "CUR", hint: "Préparation, transport, retours" },
    { id: "payroll", label: "Salaires & charges", section: "pnl", unit: "CUR", hint: "Masse salariale chargée" },
    { id: "other_opex", label: "Autres charges d'exploitation", section: "pnl", unit: "CUR", hint: "Outils, honoraires, frais divers non classés ailleurs" },
    { id: "total_opex", label: "Total charges d'exploitation", section: "pnl", unit: "CUR", total: true, compute: (v) => {
      const parts = ["ads", "platform_fees", "logistics", "payroll", "other_opex"].map((k) => num(v, k)).filter((x): x is number => x != null);
      return parts.length ? r2(parts.reduce((a, b) => a + b, 0)) : null;
    } },
    { id: "ebitda", label: "EBITDA", section: "pnl", unit: "CUR", total: true, compute: (v) => (num(v, "marge_brute") != null && num(v, "total_opex") != null ? r2(v.marge_brute - v.total_opex) : null) },

    { id: "taux_marge_brute", label: "Taux de marge brute", section: "kpi", unit: "%", compute: (v) => (num(v, "marge_brute") != null && num(v, "ca") && v.ca !== 0 ? r2((v.marge_brute / v.ca) * 100) : null) },
    { id: "orders", label: "Nombre de commandes", section: "kpi", unit: "", hint: "Nombre de commandes livrées sur le mois" },
    { id: "panier_moyen", label: "Panier moyen", section: "kpi", unit: "CUR", compute: (v) => (num(v, "ca") != null && num(v, "orders") && v.orders !== 0 ? r2(v.ca / v.orders) : null) },
    { id: "roas", label: "ROAS (CA / pub)", section: "kpi", unit: "x", compute: (v) => (num(v, "ca") != null && num(v, "ads") && v.ads !== 0 ? r2(v.ca / v.ads) : null) },

    { id: "cash_end", label: "Trésorerie fin de mois", section: "tresorerie", unit: "CUR", hint: "Solde bancaire à la fin du mois" },
  ],
  checks: [
    { id: "ca_present", label: "Le chiffre d'affaires est manquant ou nul.", severity: "error", test: (v) => num(v, "ca") != null && v.ca > 0 },
    { id: "cogs_le_ca", label: "Le COGS dépasse le chiffre d'affaires — à vérifier.", severity: "warn", test: (v) => num(v, "cogs") == null || num(v, "ca") == null || v.cogs <= v.ca },
    { id: "opex_positive", label: "Une charge d'exploitation est négative — à vérifier.", severity: "warn", test: (v) => ["ads", "platform_fees", "logistics", "payroll", "other_opex"].every((k) => num(v, k) == null || v[k] >= 0) },
    { id: "ebitda_plausible", label: "Marge d'EBITDA hors plage plausible (±100% du CA) — possible erreur d'échelle.", severity: "warn", test: (v) => num(v, "ebitda") == null || num(v, "ca") == null || v.ca === 0 || Math.abs(v.ebitda / v.ca) <= 1 },
  ],
};

export const TEMPLATES: Record<string, ActivityTemplate> = {
  ecommerce: ECOMMERCE,
};

export function getTemplate(slug?: string | null): ActivityTemplate | null {
  return slug ? TEMPLATES[slug] ?? null : null;
}

export function inputLines(tpl: ActivityTemplate): TemplateLine[] {
  return tpl.lines.filter((l) => !l.compute);
}

// Construit la data standardisée à partir des inputs extraits : calcule les dérivés,
// ordonne par section, marque les totaux, attache la provenance, et joue les checks.
export function buildStandardized(
  tpl: ActivityTemplate,
  inputs: Vals,
  sources: Record<string, string>,
  currency: string,
): { data: Record<string, unknown>; flags: { id: string; label: string; severity: string }[] } {
  const v: Vals = {};
  for (const [k, val] of Object.entries(inputs)) if (typeof val === "number" && isFinite(val)) v[k] = val;

  // Dérivés dans l'ordre de déclaration (les dépendances précèdent).
  for (const line of tpl.lines) {
    if (line.compute) {
      const val = line.compute(v);
      if (val != null && isFinite(val)) v[line.id] = val;
    }
  }

  const sections = tpl.sections.map((sec) => ({
    key: sec.key,
    label: sec.label,
    rows: tpl.lines
      .filter((l) => l.section === sec.key && v[l.id] != null)
      .map((l) => ({
        id: l.id,
        label: l.label,
        value: v[l.id],
        unit: l.unit === "CUR" ? currency : (l.unit ?? ""),
        ...(l.total ? { type: "total" } : {}),
        ...(sources[l.id] ? { source: sources[l.id] } : {}),
      })),
  })).filter((s) => s.rows.length > 0);

  const flags = tpl.checks
    .filter((c) => { try { return !c.test(v); } catch { return false; } })
    .map((c) => ({ id: c.id, label: c.label, severity: c.severity }));

  return { data: { sections, flags, meta: { template: tpl.slug } }, flags };
}
