// @vitest-environment node
// Lignes vendues sans coût Shopify : coût SKU saisi, sinon coût observé du même produit (variante, puis produit).
import { describe, expect, it } from "vitest";
import { parseFile } from "../parsers.ts";
import { applyCostParams, type Merged } from "../standardizeCore.ts";
import * as F from "./fixtures.ts";

const H = `"Month","Sale ID","Order name","Product title at time of sale","Product variant title at time of sale","Cost of goods sold","Month (previous_year)","Cost of goods sold (previous_year)","Cost of goods sold (previous_year) "`;
const row = (m: string, id: number, t: string, v: string, c: number) => `"${m}",${id},"#${id}","${t}","${v}",${c},"2025-01-01",0,`;
const CSV = [H,
  row("2026-07-01", 1, "BODY B", "M", 8), row("2026-07-01", 2, "BODY B", "M", 9), row("2026-07-01", 3, "BODY B", "L", 11),
  row("2026-08-01", 4, "BODY B", "M", 0), row("2026-08-01", 5, "BODY B", "XL", 0),   // M : coût de la variante ; XL : coût du produit
  row("2026-08-01", 6, "NEW C", "S", 0),                                              // produit jamais chiffré
  row("2026-08-01", 7, "ROBE A", "S", 20), row("2026-08-01", 8, "ROBE D", "S", 0), row("2026-06-01", 9, "ROBE D", "S", 15),
].join("\n");
const NAME = "Cost of goods sold by order - 2026-01-01 - 2026-08-31.csv";

const mergedFrom = () => {
  const e = { ...parseFile(NAME, CSV, F.ctx("2026-08-01"))!, file: NAME };
  return { values: { ...e.values }, sources: {}, traces: {}, confidence: {}, flags: [], breakdowns: {}, questions: [], kept: [e], revenueDocs: [], effRoleOf: () => "analytics" } as unknown as Merged;
};

describe("coût observé des produits vendus sans coût", () => {
  it("le relevé du mois porte les coûts observés (médianes par variante et par produit)", () => {
    const e = parseFile(NAME, CSV, F.ctx("2026-08-01"))!;
    expect(e.values.cogs).toBe(20);
    expect(e.aux?.cogsObserved).toMatchObject({ "BODY B§M": 8.5, "BODY B": 9, "ROBE D": 15 });
  });
  it("complète variante, puis produit ; le produit jamais chiffré reste manquant", () => {
    const m = mergedFrom(); applyCostParams(m, null, "EUR");
    expect(m.values.cogs).toBe(20 + 8.5 + 9 + 15);
    expect(m.confidence.cogs).toBe("estimated");
    expect(m.cogsMissing).toBe(1);
    expect(m.cogsMissingProducts).toEqual([{ title: "NEW C", lines: 1 }]);
    expect(m.flags.map((f) => f.id)).toEqual(["_cogs_observed", "_cogs_gap"]);
  });
  it("le coût SKU saisi par l'équipe prime sur le coût observé", () => {
    const m = mergedFrom(); applyCostParams(m, { sku_costs: [{ name: "ROBE D", product_cost: 14 }] as never }, "EUR");
    expect(m.values.cogs).toBe(20 + 14 + 8.5 + 9);
  });
});
