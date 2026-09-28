// @vitest-environment node
// Non-régression des parsers déterministes. Chaque cas = un piège rencontré en production.
import { describe, expect, it } from "vitest";
import { filenameRange, isoOf, parseCsvKeep, parseFile } from "../parsers.ts";
import * as F from "./fixtures.ts";

const AUG = "2026-08-01", JUL = "2026-07-01";

describe("dates et plages", () => {
  it("lit l'ISO et le format français, zéros optionnels (« 27/5/2026 »)", () => {
    expect(isoOf("2026-08-31T23:37:12Z")).toBe("2026-08-31");
    expect(isoOf("27/5/2026")).toBe("2026-05-27");
    expect(isoOf("08/08/2026")).toBe("2026-08-08");
    expect(isoOf("")).toBeNull();
  });
  it("lit la plage d'un export dans son nom de fichier", () => {
    expect(filenameRange("Total sales over time - 2026-01-01 - 2026-08-31.csv")).toEqual({ from: "2026-01-01", to: "2026-08-31" });
    expect(filenameRange("orders_20260101-20260831.csv")).toEqual({ from: "2026-01-01", to: "2026-08-31" });
    expect(filenameRange("FA-ERRO0021-details.csv")).toBeNull();
  });
  it("lecture économe : mêmes index de colonnes, colonnes inutiles vides", () => {
    const rows = parseCsvKeep("a,b,c\n1,2,3\n4,\"5,5\",6", new Set([0, 2]));
    expect(rows).toEqual([["a", "b", "c"], ["1", "", "3"], ["4", "", "6"]]);
  });
});

describe("Shopify — séries mensuelles (colonne Month)", () => {
  it("prend la ligne du mois, jamais la somme des mois ni la colonne N-1", () => {
    const aug = parseFile("Total sales over time - 2026-01-01 - 2026-08-31.csv", F.TOTAL_SALES, F.ctx(AUG))!;
    expect(aug.values).toEqual({ ca: 1020, gross_sales: 1200, refunds: 60, orders: 120, shipping_billed: 36 });
    expect(aug.revenueCandidate).toBe(1020);
    expect(aug.exclusive).toBe(true);
    const jul = parseFile("Total sales over time - 2026-01-01 - 2026-08-31.csv", F.TOTAL_SALES, F.ctx(JUL))!;
    expect(jul.values.ca).toBe(850);
  });
  it("nouveaux / récurrents du mois (avant : additionnés sur 8 mois)", () => {
    const p = parseFile("New vs returning customers over time - 2026-01-01 - 2026-08-31.csv", F.NEW_VS_RETURNING, F.ctx(AUG))!;
    expect(p.values).toEqual({ new_customers: 80, returning_customers: 30, total_customers: 110 });
  });
  it("COGS par commande : somme du mois + lignes sans coût repérées", () => {
    const p = parseFile("Cost of goods sold by order - 2026-01-01 - 2026-08-31.csv", F.COGS_BY_ORDER, F.ctx(AUG))!;
    expect(p.values).toEqual({ cogs: 22.5 });
    expect(p.aux?.cogsZeroLines).toEqual({ "BODY B": 1 });
  });
  it("un rapport secondaire (AOV) a une priorité plus basse que « Total sales »", () => {
    const p = parseFile("Average order value over time - 2026-01-01 - 2026-08-31.csv", F.AOV, F.ctx(AUG))!;
    expect(p.values).toEqual({ gross_sales: 1190, orders: 120 });
    expect(p.priority).toBeLessThan(100);
  });
});

describe("Shopify — rapports cumulés (pas de colonne de date)", () => {
  it("un cumul janv.→août ne donne AUCUNE valeur à juillet", () => {
    const jul = parseFile(F.GROSS_PROFIT_BY_PRODUCT_NAME, F.GROSS_PROFIT_BY_PRODUCT, F.ctx(JUL))!;
    expect(jul.values).toEqual({});
    expect(jul.breakdowns).toBeUndefined();
  });
  it("au mois de fin : répartition « cumul », jamais une valeur mensuelle", () => {
    const aug = parseFile(F.GROSS_PROFIT_BY_PRODUCT_NAME, F.GROSS_PROFIT_BY_PRODUCT, F.ctx(AUG))!;
    expect(aug.values).toEqual({});
    expect(aug.breakdowns?.product_margin_period?.label).toMatch(/cumul/);
    expect(aug.breakdowns?.product_margin_period?.rows[0]).toMatchObject({ label: "ROBE A", value: 5000 });
  });
  it("stock valorisé : état à la date de fin seulement", () => {
    expect(parseFile(F.INVENTORY_NAME, F.INVENTORY, F.ctx(AUG))!.values).toEqual({ inventory_value: 71 });
    expect(parseFile(F.INVENTORY_NAME, F.INVENTORY, F.ctx(JUL))!.values).toEqual({});
  });
});

describe("Bigblue", () => {
  it("facture : prestations datées du mois, formats de date mixtes, avoirs non datés écartés", () => {
    const p = parseFile("FA-TEST0001-details-abc.csv", F.BIGBLUE_INVOICE_1, F.ctx(AUG))!;
    expect(p.parser).toBe("bigblue_invoice");
    expect(p.values).toEqual({ shipping_cost: 7.5 });
    expect(p.dedupGroup).toBe("bigblue_FA-TEST0001");
    expect(p.aux?.undatedCredits).toEqual({ n: 1, amount: -1.5 });
  });
  it("commandes : articles du mois hors annulées, ventes par pays", () => {
    const p = parseFile("orders_20260101-20260831.csv", F.BIGBLUE_ORDERS, F.ctx(AUG))!;
    expect(p.values).toEqual({ units: 3 });
    expect(p.breakdowns?.sales_by_country?.rows).toEqual([{ label: "FR", value: 100 }, { label: "BE", value: 50 }]);
  });
});

describe("Pennylane — relevé sans solde", () => {
  const name = "PENNYLANE_transaction_banking.xlsx";
  it("classe par contrepartie, pas par catégorie Pennylane", () => {
    const p = parseFile(name, F.PENNYLANE, F.ctx(AUG))!;
    expect(p.parser).toBe("pennylane_bank");
    // pub = Snap 100 + Google 200 + Snap 10 (date « 27/8/2026 ») ; frais bancaires AVANT la TVA
    expect(p.values).toEqual({ ads_total: 310, ads_google: 200, other_opex: 30, platform_fees: 20 });
    expect(p.aux?.unqualifiedTotal).toBe(1300);
    expect(p.aux?.netFlow).toBe(-1700);
    expect(p.note).toMatch(/remboursements d'emprunt/);
    expect(p.note).toMatch(/TVA reversée 400/);
  });
  it("une règle du dossier prime (« paypal → pub »)", () => {
    const p = parseFile(name, F.PENNYLANE, F.ctx(AUG, { categoryRules: [{ match: "paypal", category: "ads" }] }))!;
    expect(p.values.ads_total).toBe(610);
    expect(p.aux?.unqualifiedTotal).toBe(1000);
  });
  it("trésorerie reconstituée depuis un solde de référence par compte (casse exacte)", () => {
    const anchors = [{ account: "Error Company", date: "2026-08-31", balance: 5000 }, { account: "ERROR COMPANY", date: "2026-08-31", balance: 1000 }];
    const p = parseFile(name, F.PENNYLANE, F.ctx(AUG, { bankAnchors: anchors }))!;
    expect(p.values.cash_end).toBe(6000);
    expect(p.values.cash_start).toBe(7700); // fin juillet : 5000 + 2150 et 1000 − 450
  });
  it("un solde ambigu (deux comptes « error company ») n'est jamais appliqué aux deux", () => {
    const p = parseFile(name, F.PENNYLANE, F.ctx(AUG, { bankAnchors: [{ account: "error company", date: "2026-08-31", balance: 5000 }] }))!;
    expect(p.values.cash_end).toBeUndefined();
  });
});
