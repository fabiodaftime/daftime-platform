// Modèle de TEMPLATE par activité — pièce maîtresse du pipeline.
// Un template = un CATALOGUE de lignes (inputs extraits par l'IA + dérivés CALCULÉS par le code)
// + des vérifications de cohérence. Principe : l'IA extrait, le code calcule et vérifie.
// Chaque dérivé renvoie null proprement si ses inputs manquent → le dashboard s'adapte à la data dispo.

export type Vals = Record<string, number>;

export interface TemplateLine {
  id: string;
  label: string;
  section: string;
  unit?: string;              // 'CUR' = devise client ; sinon littéral ('%', 'x', 'j', '')
  total?: boolean;            // ligne de total/sous-total (marquée type:"total")
  core?: boolean;             // input essentiel : son absence est remontée en "pièce manquante"
  hint?: string;              // aide à l'extraction (inputs)
  note?: string;              // documentation de la formule (dérivés)
  compute?: (v: Vals) => number | null; // présent => DÉRIVÉ ; absent => INPUT
}

export interface TemplateCheck {
  id: string;
  label: string;
  severity: "error" | "warn";
  test: (v: Vals) => boolean; // true = cohérent
}

export interface ActivityTemplate {
  slug: string;
  label: string;
  sections: { key: string; label: string }[];
  lines: TemplateLine[];
  checks: TemplateCheck[];
}

// ───────── helpers de calcul (tous null-safe) ─────────
const r2 = (n: number) => Math.round(n * 100) / 100;
const g = (v: Vals, k: string) => (typeof v[k] === "number" && isFinite(v[k]) ? v[k] : null);
const pct = (a: number | null, b: number | null) => (a != null && b != null && b !== 0 ? r2((a / b) * 100) : null);
const ratio = (a: number | null, b: number | null) => (a != null && b != null && b !== 0 ? r2(a / b) : null);
const sub = (a: number | null, b: number | null) => (a != null && b != null ? r2(a - b) : null);
const sumOpt = (...xs: (number | null)[]) => { const p = xs.filter((x): x is number => x != null); return p.length ? r2(p.reduce((a, b) => a + b, 0)) : null; };

// ───────────────────────── E-COMMERCE ─────────────────────────
export const ECOMMERCE: ActivityTemplate = {
  slug: "ecommerce",
  label: "E-commerce",
  sections: [
    { key: "pnl", label: "Compte de résultat" },
    { key: "rentabilite", label: "Marges & rentabilité" },
    { key: "orders", label: "Commandes & retours" },
    { key: "marketing", label: "Acquisition & publicité" },
    { key: "traffic", label: "Trafic & conversion" },
    { key: "customers", label: "Clients & valeur (LTV)" },
    { key: "cash", label: "Trésorerie & stock" },
  ],
  lines: [
    // ── Compte de résultat (monétaire) ──
    { id: "ca", label: "Chiffre d'affaires net", section: "pnl", unit: "CUR", core: true, hint: "Ventes nettes du mois (hors taxes, après remboursements)" },
    { id: "cogs", label: "Coût des marchandises vendues (COGS)", section: "pnl", unit: "CUR", core: true, hint: "Coût d'achat des produits vendus sur le mois" },
    { id: "marge_brute", label: "Marge brute", section: "pnl", unit: "CUR", total: true, note: "CA net − COGS", compute: (v) => sub(g(v, "ca"), g(v, "cogs")) },
    { id: "shipping_cost", label: "Logistique & expédition", section: "pnl", unit: "CUR", hint: "Préparation, transport, retours" },
    { id: "payment_fees", label: "Frais de paiement", section: "pnl", unit: "CUR", hint: "Commissions Stripe/PayPal/CB" },
    { id: "platform_fees", label: "Frais de plateforme", section: "pnl", unit: "CUR", hint: "Abonnements Shopify/outils SaaS" },
    { id: "ads_total", label: "Dépense publicitaire totale", section: "pnl", unit: "CUR", core: true, hint: "Total média tous canaux (Meta, Google, TikTok…)" },
    { id: "payroll", label: "Salaires & charges", section: "pnl", unit: "CUR", hint: "Masse salariale chargée" },
    { id: "other_opex", label: "Autres charges d'exploitation", section: "pnl", unit: "CUR", hint: "Honoraires, outils, frais divers" },
    { id: "total_opex", label: "Total charges d'exploitation", section: "pnl", unit: "CUR", total: true, note: "pub + plateforme + logistique + paiement + salaires + autres", compute: (v) => sumOpt(g(v, "ads_total"), g(v, "platform_fees"), g(v, "shipping_cost"), g(v, "payment_fees"), g(v, "payroll"), g(v, "other_opex")) },
    { id: "ebitda", label: "EBITDA", section: "pnl", unit: "CUR", total: true, note: "Marge brute − total charges d'exploitation", compute: (v) => sub(g(v, "marge_brute"), g(v, "total_opex")) },
    { id: "da", label: "Amortissements & dépréciations", section: "pnl", unit: "CUR", hint: "Si disponible" },
    { id: "resultat_exploitation", label: "Résultat d'exploitation", section: "pnl", unit: "CUR", total: true, note: "EBITDA − amortissements", compute: (v) => sub(g(v, "ebitda"), g(v, "da")) },
    { id: "financial_result", label: "Résultat financier", section: "pnl", unit: "CUR", hint: "Intérêts, gains/pertes de change (si dispo)" },
    { id: "taxes", label: "Impôts sur le résultat", section: "pnl", unit: "CUR", hint: "Si disponible" },
    { id: "resultat_net", label: "Résultat net", section: "pnl", unit: "CUR", total: true, note: "Résultat d'exploitation (ou EBITDA) + financier − impôts", compute: (v) => {
      const base = g(v, "resultat_exploitation") ?? g(v, "ebitda");
      if (base == null) return null;
      if (g(v, "da") == null && g(v, "financial_result") == null && g(v, "taxes") == null) return null;
      return r2(base + (g(v, "financial_result") ?? 0) - (g(v, "taxes") ?? 0));
    } },

    // ── Marges & rentabilité (ratios) ──
    { id: "taux_marge_brute", label: "Taux de marge brute", section: "rentabilite", unit: "%", note: "Marge brute ÷ CA", compute: (v) => pct(g(v, "marge_brute"), g(v, "ca")) },
    { id: "marge_ebitda", label: "Marge d'EBITDA", section: "rentabilite", unit: "%", note: "EBITDA ÷ CA", compute: (v) => pct(g(v, "ebitda"), g(v, "ca")) },
    { id: "marge_nette", label: "Marge nette", section: "rentabilite", unit: "%", note: "Résultat net ÷ CA", compute: (v) => pct(g(v, "resultat_net"), g(v, "ca")) },

    // ── Commandes & retours ──
    { id: "gross_sales", label: "CA brut (avant remboursements)", section: "orders", unit: "CUR", hint: "Ventes brutes avant retours" },
    { id: "refunds", label: "Remboursements & retours", section: "orders", unit: "CUR", hint: "Montant remboursé sur le mois" },
    { id: "refund_rate", label: "Taux de remboursement", section: "orders", unit: "%", note: "Remboursements ÷ CA brut", compute: (v) => pct(g(v, "refunds"), g(v, "gross_sales")) },
    { id: "orders", label: "Nombre de commandes", section: "orders", unit: "", core: true, hint: "Commandes livrées sur le mois" },
    { id: "units", label: "Articles vendus", section: "orders", unit: "", hint: "Nombre d'unités vendues" },
    { id: "aov", label: "Panier moyen (AOV)", section: "orders", unit: "CUR", note: "CA ÷ commandes", compute: (v) => ratio(g(v, "ca"), g(v, "orders")) },
    { id: "units_per_order", label: "Articles par commande", section: "orders", unit: "", note: "Articles ÷ commandes", compute: (v) => ratio(g(v, "units"), g(v, "orders")) },

    // ── Acquisition & publicité ──
    { id: "ads_meta", label: "Dépense pub Meta", section: "marketing", unit: "CUR", hint: "Si détaillé par canal" },
    { id: "ads_google", label: "Dépense pub Google", section: "marketing", unit: "CUR", hint: "Si détaillé par canal" },
    { id: "new_customers", label: "Nouveaux clients", section: "marketing", unit: "", hint: "Clients ayant commandé pour la 1re fois" },
    { id: "cac", label: "Coût d'acquisition (CAC)", section: "marketing", unit: "CUR", note: "Dépense pub ÷ nouveaux clients", compute: (v) => ratio(g(v, "ads_total"), g(v, "new_customers")) },
    { id: "roas", label: "ROAS (blended = MER)", section: "marketing", unit: "x", note: "CA ÷ dépense pub totale", compute: (v) => ratio(g(v, "ca"), g(v, "ads_total")) },
    { id: "cpa_order", label: "Coût par commande", section: "marketing", unit: "CUR", note: "Dépense pub ÷ commandes", compute: (v) => ratio(g(v, "ads_total"), g(v, "orders")) },
    { id: "impressions", label: "Impressions pub", section: "marketing", unit: "", hint: "Si dispo (dashboards pub)" },
    { id: "clicks", label: "Clics pub", section: "marketing", unit: "", hint: "Si dispo (dashboards pub)" },
    { id: "cpm", label: "CPM (coût pour 1000 impr.)", section: "marketing", unit: "CUR", note: "Dépense pub ÷ impressions × 1000", compute: (v) => { const r = ratio(g(v, "ads_total"), g(v, "impressions")); return r != null ? r2(r * 1000) : null; } },
    { id: "cpc", label: "CPC (coût par clic)", section: "marketing", unit: "CUR", note: "Dépense pub ÷ clics", compute: (v) => ratio(g(v, "ads_total"), g(v, "clicks")) },
    { id: "ctr", label: "CTR", section: "marketing", unit: "%", note: "Clics ÷ impressions", compute: (v) => pct(g(v, "clicks"), g(v, "impressions")) },

    // ── Trafic & conversion ──
    { id: "sessions", label: "Sessions / visites", section: "traffic", unit: "", hint: "Visites du site sur le mois (analytics)" },
    { id: "add_to_carts", label: "Ajouts au panier", section: "traffic", unit: "", hint: "Si dispo" },
    { id: "conversion_rate", label: "Taux de conversion", section: "traffic", unit: "%", note: "Commandes ÷ sessions", compute: (v) => pct(g(v, "orders"), g(v, "sessions")) },
    { id: "add_to_cart_rate", label: "Taux d'ajout au panier", section: "traffic", unit: "%", note: "Ajouts panier ÷ sessions", compute: (v) => pct(g(v, "add_to_carts"), g(v, "sessions")) },

    // ── Clients & valeur ──
    { id: "returning_customers", label: "Clients récurrents", section: "customers", unit: "", hint: "Clients ayant déjà commandé" },
    { id: "total_customers", label: "Clients actifs", section: "customers", unit: "", hint: "Clients ayant commandé sur le mois" },
    { id: "avg_lifespan_months", label: "Durée de vie client moyenne (mois)", section: "customers", unit: "", hint: "Estimation si connue" },
    { id: "new_customer_share", label: "Part de nouveaux clients", section: "customers", unit: "%", note: "Nouveaux ÷ clients actifs", compute: (v) => pct(g(v, "new_customers"), g(v, "total_customers")) },
    { id: "repeat_rate", label: "Taux de réachat", section: "customers", unit: "%", note: "Clients récurrents ÷ clients actifs", compute: (v) => pct(g(v, "returning_customers"), g(v, "total_customers")) },
    { id: "purchase_frequency", label: "Fréquence d'achat", section: "customers", unit: "", note: "Commandes ÷ clients actifs", compute: (v) => ratio(g(v, "orders"), g(v, "total_customers")) },
    { id: "ltv", label: "LTV (valeur vie client)", section: "customers", unit: "CUR", note: "AOV × taux de marge brute × fréquence d'achat × durée de vie (mois)", compute: (v) => { const a = g(v, "aov"), m = g(v, "taux_marge_brute"), f = g(v, "purchase_frequency"), l = g(v, "avg_lifespan_months"); return (a != null && m != null && f != null && l != null) ? r2(a * (m / 100) * f * l) : null; } },
    { id: "ltv_cac", label: "LTV / CAC", section: "customers", unit: "x", note: "LTV ÷ CAC", compute: (v) => ratio(g(v, "ltv"), g(v, "cac")) },
    { id: "payback_cac", label: "Payback CAC (mois)", section: "customers", unit: "", note: "CAC ÷ (marge brute mensuelle ÷ clients actifs)", compute: (v) => { const c = g(v, "cac"), mb = g(v, "marge_brute"), tc = g(v, "total_customers"); if (c == null || mb == null || tc == null || tc === 0) return null; const per = mb / tc; return per > 0 ? r2(c / per) : null; } },

    // ── Trésorerie & stock ──
    { id: "cash_start", label: "Trésorerie début de mois", section: "cash", unit: "CUR", hint: "Solde bancaire au 1er du mois" },
    { id: "cash_end", label: "Trésorerie fin de mois", section: "cash", unit: "CUR", core: true, hint: "Solde bancaire en fin de mois" },
    { id: "cash_variation", label: "Variation de trésorerie", section: "cash", unit: "CUR", total: true, note: "Trésorerie fin − début", compute: (v) => sub(g(v, "cash_end"), g(v, "cash_start")) },
    { id: "inventory_value", label: "Valeur du stock", section: "cash", unit: "CUR", hint: "Stock valorisé en fin de mois" },
    { id: "receivables", label: "Créances clients", section: "cash", unit: "CUR", hint: "Si dispo" },
    { id: "payables", label: "Dettes fournisseurs", section: "cash", unit: "CUR", hint: "Si dispo" },
    { id: "bfr", label: "BFR", section: "cash", unit: "CUR", note: "Créances + stock − dettes fournisseurs", compute: (v) => { const rc = g(v, "receivables"), inv = g(v, "inventory_value"), pay = g(v, "payables"); if (rc == null && inv == null && pay == null) return null; return r2((rc ?? 0) + (inv ?? 0) - (pay ?? 0)); } },
    { id: "stock_days", label: "Jours de stock", section: "cash", unit: "j", note: "Stock ÷ COGS × 30", compute: (v) => { const r = ratio(g(v, "inventory_value"), g(v, "cogs")); return r != null ? r2(r * 30) : null; } },
    { id: "stock_rotation", label: "Rotation du stock", section: "cash", unit: "x", note: "COGS ÷ stock", compute: (v) => ratio(g(v, "cogs"), g(v, "inventory_value")) },
  ],
  checks: [
    { id: "ca_present", label: "Le chiffre d'affaires est manquant ou nul.", severity: "error", test: (v) => g(v, "ca") != null && v.ca > 0 },
    { id: "cogs_le_ca", label: "Le COGS dépasse le chiffre d'affaires — à vérifier.", severity: "warn", test: (v) => g(v, "cogs") == null || g(v, "ca") == null || v.cogs <= v.ca },
    { id: "opex_positive", label: "Une charge est négative — à vérifier.", severity: "warn", test: (v) => ["cogs", "shipping_cost", "payment_fees", "platform_fees", "ads_total", "ads_meta", "ads_google", "payroll", "other_opex"].every((k) => g(v, k) == null || v[k] >= 0) },
    { id: "ebitda_plausible", label: "Marge d'EBITDA hors plage plausible (±100% du CA) — possible erreur d'échelle.", severity: "warn", test: (v) => g(v, "ebitda") == null || g(v, "ca") == null || v.ca === 0 || Math.abs(v.ebitda / v.ca) <= 1 },
    { id: "conversion_max", label: "Taux de conversion > 100% — incohérent (commandes vs sessions).", severity: "warn", test: (v) => g(v, "conversion_rate") == null || v.conversion_rate <= 100 },
    { id: "refund_max", label: "Taux de remboursement > 100% — incohérent.", severity: "warn", test: (v) => g(v, "refund_rate") == null || v.refund_rate <= 100 },
    { id: "orders_le_sessions", label: "Plus de commandes que de sessions — à vérifier.", severity: "warn", test: (v) => g(v, "orders") == null || g(v, "sessions") == null || v.orders <= v.sessions },
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

// Construit la data standardisée : calcule les dérivés (par points fixes, l'ordre n'importe pas),
// ordonne par section, marque les totaux, attache la provenance, joue les checks.
export function buildStandardized(
  tpl: ActivityTemplate,
  inputs: Vals,
  sources: Record<string, string>,
  currency: string,
): { data: Record<string, unknown>; flags: { id: string; label: string; severity: string }[] } {
  const v: Vals = {};
  for (const [k, val] of Object.entries(inputs)) if (typeof val === "number" && isFinite(val)) v[k] = val;

  // Résolution des dérivés par itérations successives (gère les chaînes de dépendances).
  for (let pass = 0; pass < 6; pass++) {
    let changed = false;
    for (const line of tpl.lines) {
      if (line.compute && v[line.id] == null) {
        const val = line.compute(v);
        if (val != null && isFinite(val)) { v[line.id] = val; changed = true; }
      }
    }
    if (!changed) break;
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
        ...(l.note ? { note: l.note } : {}),
        ...(sources[l.id] ? { source: sources[l.id] } : {}),
      })),
  })).filter((s) => s.rows.length > 0);

  const flags = tpl.checks
    .filter((c) => { try { return !c.test(v); } catch { return false; } })
    .map((c) => ({ id: c.id, label: c.label, severity: c.severity }));

  return { data: { sections, flags, meta: { template: tpl.slug } }, flags };
}
