// @vitest-environment node
// Carte des flux → règles du moteur : périmètre de trésorerie, règles bancaires, écarts, leviers.
import { describe, expect, it } from "vitest";
import { sanitizeFlowMap } from "../flowMap.ts";
import { isOutOfTreasury, leverDefsFromMap, mapDiscrepancies, rulesFromMap, treasuryPerimeter } from "../flowRules.ts";
import { paymentLevers, type ClassifiedDebit } from "../paymentLevers.ts";

// Carte synthétique (aucune donnée client réelle), calquée sur un shop avec pub via PayPal + prêt PayPal.
const map = sanitizeFlowMap({
  summary: "x",
  entities: [{ id: "fr", name: "Shop SAS", kind: "société", role: "vend" }],
  accounts: [
    { id: "main", name: "Shop Company", kind: "banque", role: "principal", in_treasury: true },
    { id: "perso", name: "Jane Doe EUR BUSINESS", kind: "banque", role: "paie la pub Snap", in_treasury: false },
    { id: "other", name: "Banque Rives Test", kind: "banque", role: "autre compte", in_treasury: false },
  ],
  inflows: [],
  outflows: [
    { payee: "SARL Textilia", category: "stock", account: "main", rhythm: "~10 virements par mois", terms: "payé avant réception", certainty: "confirmé", match: "Textilia" },
    { payee: "Meta / TikTok", category: "pub", account: "main", via: "PayPal", rhythm: "prélevé au fil de la dépense", terms: "par paliers", certainty: "confirmé" },
    { payee: "Prêt PayPal", category: "financement", account: "main", via: "PayPal", match: "paypal", amount: 6628, rhythm: "chaque semaine", terms: "automatique", certainty: "confirmé" },
    { payee: "Google Ads", category: "pub", account: "main", rhythm: "prélevé au fil de la dépense", terms: "inconnu", certainty: "confirmé" },
    { payee: "Snapchat (Snap Group)", category: "pub", account: "perso", rhythm: "au fil de la dépense", terms: "inconnu", certainty: "confirmé" },
    { payee: "Bigblue", category: "logistique", account: "main", rhythm: "2 fois par mois", terms: "facture mensuelle", certainty: "confirmé" },
    { payee: "Boost Agency", category: "pub", account: "main", rhythm: "ponctuel", terms: "inconnu", certainty: "confirmé" },
  ],
  interco: [], open_questions: [],
});

describe("périmètre de trésorerie", () => {
  const p = treasuryPerimeter(map);
  it("compte hors trésorerie reconnu (casse et libellé bancaire tolérés)", () => {
    expect(isOutOfTreasury("Jane Doe EUR BUSINESS", p)).toBe(true);
    expect(isOutOfTreasury("JANE DOE EUR BUSINESS", p)).toBe(true);
    expect(isOutOfTreasury("Banque Rives Test - compte courant", p)).toBe(true);
  });
  it("compte de trésorerie ou non cité : reste dedans", () => {
    expect(isOutOfTreasury("Shop Company", p)).toBe(false);
    expect(isOutOfTreasury("SHOP COMPANY", p)).toBe(false);
    expect(isOutOfTreasury("Visa Business ****1234", p)).toBe(false);
  });
  it("sans carte : aucun compte exclu", () => {
    expect(treasuryPerimeter(null)).toBeUndefined();
    expect(isOutOfTreasury("Jane Doe EUR BUSINESS", undefined)).toBe(false);
  });
});

describe("règles bancaires issues de la carte", () => {
  it("seules les sorties avec un mot-clé du relevé deviennent des règles (au montant si précisé)", () => {
    expect(rulesFromMap(map).map((r) => [r.match, r.category, r.amount ?? null])).toEqual([["textilia", "stock", null], ["paypal", "loan", 6628]]);
    expect(rulesFromMap(map)[0].source).toBe("carte");
    const vatMap = sanitizeFlowMap({ outflows: [{ payee: "DGFIP (TVA)", category: "impôts & taxes", account: "main", match: "dgfip", rhythm: "mensuel", terms: "échéance", certainty: "confirmé" },
      { payee: "DGFIP (impôt sur les sociétés)", category: "impôts & taxes", account: "main", match: "impot societes", rhythm: "trimestriel", terms: "échéance", certainty: "confirmé" }] });
    expect(rulesFromMap(vatMap).map((r) => r.category)).toEqual(["vat", "tax"]);
  });
});

describe("écarts carte ↔ classement", () => {
  it("coût classé autrement que dans la carte → écart ; même contrepartie pour 2 flux → pas d'écart", () => {
    const gaps = mapDiscrepancies(map, [
      { amount: -40_000, cat: "logistics", text: "VIR SARL TEXTILIA" },   // la carte dit stock
      { amount: -5_000, cat: "ads", text: "PAYPAL EUROPE" },             // pub via PayPal : OK
      { amount: -6_628, cat: "loan", text: "PAYPAL EUROPE" },            // prêt PayPal : OK
      { amount: -3_000, cat: "unknown", text: "BIGBLUE SAS" },           // non classé mais la carte sait
      { amount: -200, cat: "refund", text: "PAYPAL refund" },
    ]);
    expect(gaps.map((g) => [g.payee, g.expected, g.found, g.amount])).toEqual([["SARL Textilia", "stock", "logistics", 40_000], ["Bigblue", "logistique", "unknown", 3_000]]);
  });
});

describe("leviers décrits par la carte", () => {
  const defs = leverDefsFromMap(map)!;
  const deb = (amount: number, cat: string, counterparty: string, tx_date = "2026-08-10"): ClassifiedDebit => ({ tx_date, amount, cat, counterparty });
  const L = paymentLevers([
    ...Array.from({ length: 4 }, () => deb(-10_000, "ads", "PAYPAL EUROPE")), deb(-6_628, "loan", "PAYPAL EUROPE"),
    deb(-8_000, "ads", "GOOGLE IRELAND"), deb(-30_000, "stock", "SARL TEXTILIA"), deb(-25_000, "logistics", "BIGBLUE"),
    deb(-12_000, "ads", "SNAP GROUP"), deb(-5_000, "ads", "BOOSTAGENCY"),
  ], "2026-08-01", [], defs)!;
  it("un levier par poste payé depuis la trésorerie ; ni poste hors trésorerie, ni ponctuel, ni prêt", () => {
    expect(L.items.map((i) => [i.label, i.monthly, i.count])).toEqual([
      ["Meta / TikTok (via PayPal)", 40_000, 4], ["SARL Textilia", 30_000, 1], ["Bigblue", 25_000, 1], ["Google Ads", 8_000, 1]]);
    expect(L.total).toBe(103_000);
  });
  it("rythme et conditions de la carte repris tels quels (conditions inconnues omises)", () => {
    expect(L.items[0].how).toBe("prélevé au fil de la dépense · par paliers — 4 paiements ce mois");
    expect(L.items.find((i) => i.label === "Google Ads")!.how).toBe("prélevé au fil de la dépense — 1 paiement ce mois");
    expect(L.items[0].lever).toMatch(/facturation mensuelle/);
  });
  it("sans carte : leviers par défaut inchangés", () => {
    expect(leverDefsFromMap(null)).toBeNull();
  });
});
