// @vitest-environment node
// Non-régression du cœur de standardisation : fusion sans double comptage, onboarding, tri des absences.
import { describe, expect, it } from "vitest";
import { parseFile, type ParsedExtract } from "../parsers.ts";
import { applyCostParams, completeLogistics, finalize, mergeParsed } from "../standardizeCore.ts";
import type { Catalog } from "../templates.ts";
import * as F from "./fixtures.ts";

const AUG = "2026-08-01";
// Catalogue réduit, mêmes ids et même logique que le catalogue e-commerce en base.
const TPL: Catalog = {
  sections: [{ key: "pnl", label: "Compte de résultat" }, { key: "orders", label: "Commandes" }, { key: "cash", label: "Trésorerie" }],
  lines: [
    { id: "ca", label: "Chiffre d'affaires net", section: "pnl", unit: "CUR", core: true },
    { id: "cogs", label: "COGS", section: "pnl", unit: "CUR", core: true },
    { id: "marge_brute", label: "Marge brute", section: "pnl", unit: "CUR", formula: "ca - cogs" },
    { id: "shipping_cost", label: "Logistique", section: "pnl", unit: "CUR" },
    { id: "ads_total", label: "Dépense publicitaire totale", section: "pnl", unit: "CUR", core: true },
    { id: "gross_sales", label: "CA brut", section: "orders", unit: "CUR" },
    { id: "refunds", label: "Remboursements", section: "orders", unit: "CUR" },
    { id: "orders", label: "Commandes", section: "orders", unit: "", core: true },
    { id: "units", label: "Articles", section: "orders", unit: "" },
    { id: "cash_end", label: "Trésorerie fin de mois", section: "cash", unit: "CUR", core: true },
  ],
  checks: [],
};
const labelOf = (id: string) => TPL.lines.find((l) => l.id === id)?.label ?? id;
const parse = (name: string, text: string, extra: Record<string, unknown> = {}): ParsedExtract => {
  const p = parseFile(name, text, F.ctx(AUG, extra))!; p.file = name; return p;
};
const allExtracts = () => [
  parse("Total sales over time - 2026-01-01 - 2026-08-31.csv", F.TOTAL_SALES),
  parse("Average order value over time - 2026-01-01 - 2026-08-31.csv", F.AOV),
  parse("Cost of goods sold by order - 2026-01-01 - 2026-08-31.csv", F.COGS_BY_ORDER),
  parse("FA-TEST0001-details-abc.csv", F.BIGBLUE_INVOICE_1),
  parse("FA-TEST0001-details-abc (1).csv", F.BIGBLUE_INVOICE_1_BIS),
  parse("FA-TEST0002-details-def.csv", F.BIGBLUE_INVOICE_2),
  parse("orders_20260101-20260831.csv", F.BIGBLUE_ORDERS),
  parse("PENNYLANE_transaction_banking.xlsx", F.PENNYLANE),
];

describe("fusion des extractions", () => {
  const m = mergeParsed(allExtracts(), new Map(), labelOf, "EUR");
  it("un même fait vu par deux rapports n'est jamais additionné", () => {
    expect(m.values.gross_sales).toBe(1200); // « Total sales » (priorité 100), pas 1200 + 1190
    expect(m.values.orders).toBe(120);
    expect(m.confidence.gross_sales).toBe("corroborated"); // écart 0,8 % < 1 %
  });
  it("le CA vient du rapport de référence au rôle « CA »", () => {
    expect(m.values.ca).toBe(1020);
  });
  it("les factures s'additionnent, une facture re-téléchargée ne compte qu'une fois", () => {
    expect(m.values.shipping_cost).toBe(11.5); // FA-0001 « (1) » (8,5, la plus complète) + FA-0002 (3)
    expect(m.flags.some((f) => f.id === "_dups")).toBe(true);
  });
  it("les débits non qualifiés deviennent une question, jamais une charge", () => {
    expect(m.values.other_opex).toBe(30);
    expect(m.questions.join(" ")).toMatch(/Débits bancaires à qualifier \(1\s?300 EUR\)/);
  });
});

describe("onboarding branché", () => {
  it("lignes sans coût Shopify complétées par le coût SKU (1 unité par ligne)", () => {
    const m = mergeParsed(allExtracts(), new Map(), labelOf, "EUR");
    applyCostParams(m, { sku_costs: [{ sku: "X", name: "body  b", product_cost: 7 }] }, "EUR");
    expect(m.values.cogs).toBe(29.5); // 22,5 + 7
    expect(m.confidence.cogs).toBe("estimated");
    expect(m.cogsMissingProducts).toEqual([]);
    const none = mergeParsed(allExtracts(), new Map(), labelOf, "EUR");
    applyCostParams(none, null, "EUR");
    expect(none.cogsMissingProducts).toEqual([{ title: "BODY B", lines: 1 }]);
  });
  it("sans facture logistique : pick & pack × commandes, signalé comme hypothèse", () => {
    const ex = allExtracts().filter((e) => e.parser !== "bigblue_invoice");
    const m = mergeParsed(ex, new Map(), labelOf, "EUR");
    applyCostParams(m, { fulfillment: { pick_pack_per_order: 2 } }, "EUR");
    expect(m.values.shipping_cost).toBe(240);
    expect(m.confidence.shipping_cost).toBe("estimated");
  });
});

describe("mois incomplet côté logistique", () => {
  it("factures jusqu'au 20/08 : reste du mois estimé au rythme observé, signalé", () => {
    const m = mergeParsed(allExtracts(), new Map(), labelOf, "EUR");
    completeLogistics(m, AUG, "EUR");
    expect(m.values.shipping_cost).toBeCloseTo(17.82, 2); // 11,5 réels + 11,5/20 × 11 jours
    expect(m.confidence.shipping_cost).toBe("estimated");
    expect(m.flags.find((f) => f.id === "_logistics_partial")?.label).toMatch(/s'arrêtent au 20\/08/);
  });
  it("mois couvert jusqu'à la fin : aucune estimation", () => {
    const full = parse("FA-TEST0003-details-x.csv", F.BIGBLUE_INVOICE_2.replace("20/08/2026", "30/08/2026"));
    const m = mergeParsed([full], new Map(), labelOf, "EUR");
    completeLogistics(m, AUG, "EUR");
    expect(m.values.shipping_cost).toBe(3);
  });
});

describe("finalisation et tri des absences", () => {
  it("trésorerie absente = pièce à fournir, pas un blocage", () => {
    const m = mergeParsed(allExtracts(), new Map(), labelOf, "EUR");
    const out = finalize({ tpl: TPL, activity: "ecommerce", currency: "EUR", period: AUG, entity: "Test", merged: m, llmExtracts: [], factor: { EUR: 1 }, fxSource: "test", skipped: [] });
    expect(out.blocking).toEqual([]);
    expect(out.missing.some((x) => x.startsWith("Trésorerie fin de mois — à fournir"))).toBe(true);
    const rows = (out.data.sections as { rows: { id: string; value: number }[] }[]).flatMap((s) => s.rows);
    expect(rows.find((r) => r.id === "marge_brute")?.value).toBe(1020 - 22.5);
  });
  it("les fichiers non lus sont regroupés par motif", () => {
    const m = mergeParsed([], new Map(), labelOf, "EUR");
    const out = finalize({ tpl: TPL, activity: "ecommerce", currency: "EUR", period: AUG, entity: null, merged: m, llmExtracts: [], factor: { EUR: 1 }, fxSource: "test",
      skipped: [{ name: "a.csv", reason: "contenu introuvable" }, { name: "b.csv", reason: "contenu introuvable" }] });
    const f = (out.data.flags as { id: string; label: string }[]).find((x) => x.id === "_skipped")!;
    expect(f.label).toBe("Fichiers non lus (2) — contenu introuvable : a.csv, b.csv.");
  });
});
