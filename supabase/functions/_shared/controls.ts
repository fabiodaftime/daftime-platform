// CONTRÔLES CROISÉS du mois (onglet Audit) + INDICE DE FIABILITÉ /100. Module PUR.
// Chaque contrôle est : OK · en écart (montants, explication, action) · non contrôlable (pièce manquante
// NOMMÉE). L'indice = complétude des sources × contrôles × part des débits classée — il sert à repérer
// les dossiers à risque AVANT l'envoi au client (cible ≥ 90).

import type { ParsedExtract } from "./parsers.ts";

export type ControlStatus = "ok" | "ecart" | "non_controlable";
export interface Control { id: string; label: string; status: ControlStatus; detail: string; action?: string }
export interface Reliability { score: number; completeness: number; controls: number; classified: number; missing: string[] }

type V = Record<string, number | undefined>;
const num = (x: unknown): number | null => (typeof x === "number" && isFinite(x) ? x : null);
const auxOf = (kept: ParsedExtract[], k: string): number | null => {
  for (const e of kept) { const v = num(e.aux?.[k]); if (v != null) return v; }
  return null;
};

export function runControls(v: V, prev: V | null, kept: ParsedExtract[], currency = "EUR", extra: { cogsMissing?: number } = {}): Control[] {
  const eur = (x: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(x);
  const pct = (x: number) => `${Math.round(x)} %`;
  const eur2 = (x: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(x);
  const dec1 = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  const n = (k: string) => num(v[k]);
  const out: Control[] = [];

  // 1) Trésorerie déclarée / reconstituée vs flux net du relevé.
  const netFlow = auxOf(kept, "netFlow");
  if (n("cash_end") == null || n("cash_start") == null) out.push({ id: "cash", label: "Trésorerie vs flux bancaire", status: "non_controlable", detail: "Trésorerie de début et de fin de mois inconnues.", action: "Renseigne un solde de référence par compte (Paramètres shop) ou la trésorerie de fin de mois." });
  else if (netFlow == null) out.push({ id: "cash", label: "Trésorerie vs flux bancaire", status: "non_controlable", detail: "Pas de relevé bancaire complet du mois.", action: "Dépose le relevé bancaire (export Pennylane ou banque) du mois." });
  else {
    const variation = n("cash_end")! - n("cash_start")!, gap = variation - netFlow;
    const ok = Math.abs(gap) <= Math.max(500, Math.abs(n("cash_start")!) * 0.01);
    out.push({ id: "cash", label: "Trésorerie vs flux bancaire", status: ok ? "ok" : "ecart",
      detail: `Variation de trésorerie ${eur(variation)} vs flux net du relevé ${eur(netFlow)}${ok ? "." : ` : écart ${eur(gap)}.`}`,
      ...(ok ? {} : { action: "Un compte manque au relevé, ou un compte du relevé n'est pas dans la trésorerie (solde Shopify Payments, PayPal, carte)." }) });
  }

  // 2) Ventes vs encaissements (ventes TTC Shopify vs entrées sur le relevé, décalage PSP de 2 à 30 jours).
  const salesTTC = auxOf(kept, "salesTTC"), inflow = auxOf(kept, "inflow");
  if (salesTTC == null || inflow == null) out.push({ id: "cash_in", label: "Ventes vs encaissements", status: "non_controlable",
    detail: salesTTC == null ? "Ventes TTC du mois inconnues." : "Encaissements du mois inconnus.",
    action: salesTTC == null ? "Dépose l'export Shopify « Total sales over time »." : "Dépose le relevé bancaire complet du mois." });
  else {
    const ratio = salesTTC ? inflow / salesTTC : 0, ok = ratio >= 0.85 && ratio <= 1.15;
    out.push({ id: "cash_in", label: "Ventes vs encaissements", status: ok ? "ok" : "ecart",
      detail: `Encaissements ${eur(inflow)} pour ${eur(salesTTC)} de ventes TTC (${pct(ratio * 100)}).`,
      ...(ok ? {} : { action: ratio < 0.85
        ? "Ventes non encaissées sur le compte : prestataire de paiement non versé (solde PSP, PayPal, paiement fractionné), compte manquant, ou frais retenus à la source."
        : "Encaissements supérieurs aux ventes : apport, prêt, remboursement ou virement interne compté comme encaissement ?" }) });
  }

  // 3) Logistique : coût par commande vs mois précédent (dérive, facture manquante).
  if (n("shipping_cost") == null || !n("orders")) out.push({ id: "logistics", label: "Logistique vs commandes", status: "non_controlable", detail: "Coût logistique ou nombre de commandes inconnu.", action: "Dépose les factures du 3PL du mois (ou renseigne le coût pick & pack)." });
  else {
    const cpo = n("shipping_cost")! / n("orders")!;
    const pcpo = prev && num(prev.shipping_cost) != null && num(prev.orders) ? num(prev.shipping_cost)! / num(prev.orders)! : null;
    if (pcpo == null) out.push({ id: "logistics", label: "Logistique vs commandes", status: "non_controlable", detail: `${eur2(cpo)} par commande ; pas de mois précédent pour comparer.` });
    else {
      const d = (cpo / pcpo - 1) * 100, ok = Math.abs(d) <= 20;
      out.push({ id: "logistics", label: "Logistique vs commandes", status: ok ? "ok" : "ecart",
        detail: `${eur2(cpo)} par commande vs ${eur2(pcpo)} le mois précédent (${d >= 0 ? "+" : ""}${pct(d)}).`,
        ...(ok ? {} : { action: d > 0 ? "Hausse du coût par commande : tarif transporteur, poids, retours facturés, ou double facture ?" : "Baisse du coût par commande : facture du 3PL manquante ou mois partiellement facturé ?" }) });
    }
  }

  // 4) Couverture des coûts d'achat (lignes vendues sans coût → COGS sous-estimé).
  const lines = auxOf(kept, "cogsLines");
  const missing = extra.cogsMissing ?? null;
  if (lines == null) out.push({ id: "cogs_cov", label: "Couverture des coûts d'achat", status: "non_controlable", detail: "Pas de coût par ligne de vente.", action: "Dépose l'export Shopify « Cost of goods sold by order » ou les coûts de revient par SKU." });
  else {
    const share = lines ? ((missing ?? 0) / lines) * 100 : 0, ok = share < 2;
    out.push({ id: "cogs_cov", label: "Couverture des coûts d'achat", status: ok ? "ok" : "ecart",
      detail: `${missing ?? 0} ligne(s) vendue(s) sans coût sur ${lines} (${dec1(share)} %).`,
      ...(ok ? {} : { action: "Complète les coûts de revient par SKU (Paramètres shop) : la marge produit est surestimée d'autant." }) });
  }

  // 5) TVA collectée (Shopify) vs reversée (relevé) — souvent décalée d'un mois : écart = à expliquer, pas une erreur.
  const taxes = auxOf(kept, "taxesCollected"), vat = auxOf(kept, "vatPaid");
  if (taxes == null || vat == null) out.push({ id: "vat", label: "TVA collectée vs reversée", status: "non_controlable", detail: taxes == null ? "TVA collectée inconnue." : "Pas de relevé bancaire du mois.", action: taxes == null ? "Dépose l'export Shopify « Total sales over time »." : "Dépose le relevé bancaire du mois." });
  else {
    // La TVA reversée en M porte sur M-1 (collectée − déductible sur les achats) : cohérente si elle représente
    // 20 à 110 % de la TVA collectée le mois précédent (estimée au taux de TVA observé ce mois sur le CA de M-1).
    const rate = n("ca") ? taxes / n("ca")! : null;
    const prevCollected = prev && num(prev.ca) != null && rate != null ? num(prev.ca)! * rate : taxes;
    const ratio = prevCollected > 0 ? vat / prevCollected : 0, ok = ratio >= 0.2 && ratio <= 1.1;
    out.push({ id: "vat", label: "TVA collectée vs reversée", status: ok ? "ok" : "ecart",
      detail: `TVA reversée ce mois ${eur(vat)} pour ≈ ${eur(prevCollected)} collectée le mois précédent (${pct(ratio * 100)} ; le reste = TVA déductible sur les achats). Collectée ce mois : ${eur(taxes)}.`,
      ...(ok ? {} : { action: ratio < 0.2
        ? "Aucune TVA (ou très peu) reversée : déclaration trimestrielle, crédit de TVA, ou paiement classé ailleurs dans le relevé (vérifie la règle « DGFIP »)."
        : "TVA reversée supérieure à la collectée du mois précédent : régularisation, pénalités, ou paiement de plusieurs périodes — à vérifier sur la déclaration." }) });
  }

  // 6) Débits bancaires qualifiés.
  const debits = auxOf(kept, "totalDebits"), unq = auxOf(kept, "unqualifiedTotal") ?? 0;
  if (debits != null && debits > 0) {
    const share = (1 - unq / debits) * 100, ok = share >= 90;
    out.push({ id: "debits", label: "Débits bancaires qualifiés", status: ok ? "ok" : "ecart",
      detail: `${pct(share)} des débits classés (${eur(unq)} à qualifier).`,
      ...(ok ? {} : { action: "Valide les propositions dans « Contreparties » (onglet Données)." }) });
  }

  // 8) Commandes vendues (boutique) vs expédiées (3PL) — même mois de création.
  const shipped = auxOf(kept, "shippedOrders");
  if (shipped != null && n("orders")) {
    const d = (shipped / n("orders")! - 1) * 100, ok = Math.abs(d) <= 5;
    out.push({ id: "orders_3pl", label: "Commandes vendues vs expédiées", status: ok ? "ok" : "ecart",
      detail: `${Math.round(n("orders")!)} commandes vendues, ${Math.round(shipped)} au 3PL (${d >= 0 ? "+" : ""}${dec1(d)} %).`,
      ...(ok ? {} : { action: d < 0 ? "Commandes non transmises au 3PL (précommandes, dropshipping, autre entrepôt) ou export 3PL incomplet ?" : "Plus d'envois que de ventes : renvois, échanges, commandes manuelles ou export Shopify filtré ?" }) });
  }

  // 9) Versements du prestataire Shopify Payments retrouvés sur les relevés.
  const spGross = auxOf(kept, "shopifyPaymentsGross");
  if (spGross != null && spGross >= 1000) {
    const psp = kept.map((e) => e.aux?.pspInflows as Record<string, { net: number }> | undefined).find(Boolean);
    if (psp) {
      const paid = psp["Shopify Payments"]?.net ?? 0, ok = paid >= spGross * 0.8;
      out.push({ id: "psp_payouts", label: "Versements Shopify Payments sur les relevés", status: ok ? "ok" : "ecart",
        detail: `Shopify Payments : ${eur(spGross)} payés par les clients ce mois, ${eur(paid)} versés sur les comptes du relevé.`,
        ...(ok ? {} : { action: "Les versements arrivent sur un compte absent des relevés : dépose-le (ou son solde) — sinon trésorerie et encaissements sont incomplets." }) });
    }
  }

  // 10) Retours du mois : taux (boutique) vs mois précédent, recoupé avec le 3PL (commandes retournées, motif principal).
  if (n("refunds") != null && n("gross_sales")) {
    const rate = (n("refunds")! / n("gross_sales")!) * 100;
    const prate = prev && num(prev.refunds) != null && num(prev.gross_sales) ? (num(prev.refunds)! / num(prev.gross_sales)!) * 100 : null;
    const ret3 = auxOf(kept, "returnedOrders");
    const reasons = kept.map((e) => e.aux?.returnsByReason as Record<string, number> | undefined).find(Boolean);
    const top = reasons ? Object.entries(reasons).sort((a, b) => b[1] - a[1])[0] : undefined;
    const totR = reasons ? Object.values(reasons).reduce((s, x) => s + x, 0) : 0;
    const jump = prate != null && rate > prate * 1.5 && rate - prate >= 3;
    out.push({ id: "returns", label: "Retours du mois", status: jump ? "ecart" : "ok",
      detail: `Retours ${dec1(rate)} % du CA brut${prate != null ? ` (mois précédent ${dec1(prate)} %)` : ""}` +
        (shipped && ret3 != null ? ` · 3PL : ${Math.round(ret3)} commandes du mois retournées sur ${Math.round(shipped)} (${dec1((ret3 / shipped) * 100)} %)` : "") +
        (top && totR ? ` · motif principal : ${top[0]} (${pct((top[1] / totR) * 100)})` : "") + ".",
      ...(jump ? { action: "Hausse des retours : regarde les produits concernés (page « Produits & retours ») — guide des tailles, description, qualité." } : {}) });
  }

  // 7) Mois vs historique : poste qui bouge de plus de 40 % sans cause identifiée.
  if (prev) {
    const KEYS: [string, string][] = [["ca", "CA"], ["cogs", "coût des marchandises"], ["shipping_cost", "logistique"], ["ads_total", "pub"],
      ["payroll", "salaires"], ["other_opex", "autres charges"], ["platform_fees", "outils"]];
    const moves = KEYS.map(([k, l]) => { const a = n(k), b = num(prev[k]); return a != null && b != null && Math.abs(b) >= 500 ? { l, d: (a / b - 1) * 100, a, b } : null; })
      .filter((x): x is { l: string; d: number; a: number; b: number } => !!x && Math.abs(x.d) > 40);
    out.push({ id: "history", label: "Mois vs mois précédent", status: moves.length ? "ecart" : "ok",
      detail: moves.length ? moves.map((m) => `${m.l} ${m.d >= 0 ? "+" : ""}${pct(m.d)} (${eur(m.b)} → ${eur(m.a)})`).join(" · ") : "Aucun poste ne bouge de plus de 40 %.",
      ...(moves.length ? { action: "Vérifie la cause (saisonnalité, pièce manquante ou en double, nouvelle charge) et note-la en commentaire." } : {}) });
  } else out.push({ id: "history", label: "Mois vs mois précédent", status: "non_controlable", detail: "Pas de mois précédent standardisé.", action: "Standardise le mois précédent (bouton « Tous les mois »)." });

  return out;
}

const CORE: [string, string][] = [["ca", "CA"], ["cogs", "coût des marchandises"], ["shipping_cost", "logistique"], ["ads_total", "pub"], ["orders", "commandes"], ["cash_end", "trésorerie"]];

export function reliabilityIndex(v: V, controls: Control[], kept: ParsedExtract[]): Reliability {
  const missing = CORE.filter(([k]) => num(v[k]) == null).map(([, l]) => l);
  const completeness = (CORE.length - missing.length) / CORE.length;
  const w = { ok: 1, ecart: 0.6, non_controlable: 0.8 } as const;
  const ctl = controls.length ? controls.reduce((s, c) => s + w[c.status], 0) / controls.length : 0.8;
  const debits = auxOf(kept, "totalDebits"), unq = auxOf(kept, "unqualifiedTotal") ?? 0;
  const classified = debits && debits > 0 ? Math.max(0, 1 - unq / debits) : 1;
  const r = (x: number) => Math.round(x * 100) / 100;
  return { score: Math.round(100 * completeness * ctl * classified), completeness: r(completeness), controls: r(ctl), classified: r(classified), missing };
}
