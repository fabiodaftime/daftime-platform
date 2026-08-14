// Tri des absences (doctrine H7) : d'où DOIT venir chaque concept, pour ne plus confondre
// « bug » et « manque de paramétrage ».
//   export      = présent dans un export standard → si absent = BUG (données/parsing) → bloque.
//   onboarding  = jamais dans un export (coût de revient réel, grilles 3PL, fees…) → paramétrage shop.
//   client      = obtenable mais pas dans les fichiers fournis → demande client nommée.
//   history     = nécessite plusieurs périodes (cohortes/tendances).
//   derived     = calculé par formule → un manque n'est PAS un bug (dépend d'inputs manquants).

export type ConceptSource = "export" | "onboarding" | "client" | "history" | "derived";
export type GapStatus = "missing_bug" | "missing_param" | "missing_obtainable" | "needs_history" | "derived";

interface ConceptMeta { source: ConceptSource; ask?: string }

// Classification des concepts e-commerce actuels (extensible / futur `doctrine.config`).
const MAP: Record<string, ConceptMeta> = {
  // Structurellement hors-export → onboarding
  cogs: { source: "onboarding", ask: "Coût de revient par SKU (produit + packaging + transport amont + douane) — via l'onboarding : « Cost per item » Shopify est presque toujours vide." },
  // Dérivés (calculés par formule) — un manque = conséquence d'un input absent, pas un bug
  marge_brute: { source: "derived" }, taux_marge_brute: { source: "derived" },
  ebitda: { source: "derived" }, marge_ebitda: { source: "derived" },
  resultat_net: { source: "derived" }, marge_nette: { source: "derived" },
  total_opex: { source: "derived" }, financial_result: { source: "derived" },
  cash_variation: { source: "derived" }, refund_rate: { source: "derived" },
  aov: { source: "derived" }, units_per_order: { source: "derived" },
  new_customer_share: { source: "derived" }, repeat_rate: { source: "derived" },
  purchase_frequency: { source: "derived" }, cpa_order: { source: "derived" },
  payback_cac: { source: "derived" }, conversion_rate: { source: "derived" },
  add_to_cart_rate: { source: "derived" }, psp_fee_rate: { source: "derived" },
  roas: { source: "derived" }, cac: { source: "derived" },
};

const STATUS: Record<ConceptSource, GapStatus> = {
  export: "missing_bug", onboarding: "missing_param", client: "missing_obtainable",
  history: "needs_history", derived: "derived",
};

// Défaut = "export" : un concept inconnu est censé être dans un export → bug s'il manque (prudent).
export function classifyGap(id: string): { statut: GapStatus; source: ConceptSource; ask?: string } {
  const m = MAP[id] ?? { source: "export" as ConceptSource };
  return { statut: STATUS[m.source], source: m.source, ask: m.ask };
}
