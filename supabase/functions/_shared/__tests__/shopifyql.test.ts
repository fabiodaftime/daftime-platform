// @vitest-environment node
// Connecteur Shopify (ShopifyQL) : requête, lecture du tableau, faits, et priorité API > export dans la fusion.
import { describe, expect, it } from "vitest";
import { connectorFactsToExtract, parseSalesTable, salesQuery, salesToFacts } from "../shopifyql.ts";
import { parseFile, type ParsedExtract } from "../parsers.ts";
import { mergeParsed } from "../standardizeCore.ts";
import { readFacts } from "../registry.ts";
import * as F from "./fixtures.ts";

const cols = ["month", "gross_sales", "discounts", "returns", "net_sales", "shipping_charges", "taxes", "total_sales", "orders"].map((name) => ({ name }));

describe("ShopifyQL", () => {
  it("requête mensuelle bornée au dernier jour du mois de fin", () => {
    expect(salesQuery("2026-01-01", "2026-08-01")).toBe("FROM sales SHOW gross_sales, discounts, returns, net_sales, shipping_charges, taxes, total_sales, orders GROUP BY month SINCE 2026-01-01 UNTIL 2026-08-31 ORDER BY month");
  });
  it("lit les lignes en tableaux ou en objets", () => {
    const a = parseSalesTable({ columns: cols, rows: [["2026-08-01", "1200", "-120", "-60", "1020", "36", "204", "1260", "120"]] });
    const o = parseSalesTable({ columns: cols, rows: [{ month: "2026-08-01T00:00:00", gross_sales: 1200, discounts: -120, returns: -60, net_sales: 1020, orders: 120 }] });
    expect(a["2026-08-01"]).toMatchObject({ net_sales: 1020, returns: -60, orders: 120 });
    expect(o["2026-08-01"].net_sales).toBe(1020);
  });
  it("faits : CA = ventes nettes, retours en positif, conversion de devise", () => {
    const facts = salesToFacts({ "2026-08-01": { net_sales: 1020, gross_sales: 1200, returns: -60, orders: 120, total_sales: 1260, taxes: 204 } }, { client_id: "c1", shop: "x.myshopify.com" });
    const r = readFacts(facts.filter((f) => !f.concept.startsWith("_")));
    expect(r).toEqual({ ca: 1020, gross_sales: 1200, refunds: 60, orders: 120 });
    expect(salesToFacts({ "2026-08-01": { net_sales: 100 } }, { client_id: "c1", shop: "x", factor: 4.3 })[0].amount).toBe(430);
  });
  it("dans la fusion, l'API prime sur l'export et l'écart est signalé", () => {
    const exp = parseFile("Total sales over time - 2026-01-01 - 2026-08-31.csv", F.TOTAL_SALES, F.ctx("2026-08-01"))!; exp.file = "Total sales.csv";
    const api = connectorFactsToExtract(salesToFacts({ "2026-08-01": { net_sales: 1050, gross_sales: 1200, returns: -30, orders: 120, total_sales: 1265, taxes: 204 } },
      { client_id: "c1", shop: "x.myshopify.com" })) as unknown as ParsedExtract[];
    const m = mergeParsed([exp, ...api], new Map(), (x) => x, "EUR");
    expect(m.values.ca).toBe(1050); // écart 30 € > tolérance 0,5 %
    expect(m.flags.some((f) => f.id === "_conflict_ca")).toBe(true);
    expect(api[0].aux).toMatchObject({ connector: true, salesTTC: 1265, taxesCollected: 204 });
  });
});
