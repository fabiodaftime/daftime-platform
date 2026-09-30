// @vitest-environment node
// Adaptation du rapport au dossier : indicateurs dérivés, blocs optionnels, repli mots-clés.
import { describe, expect, it } from "vitest";
import { deriveUnit, prepareReport } from "../reportData.ts";
import { availableExtras, buildReportPlan, tailorFromText } from "../reportPlan.ts";

const sec = (rows: [string, number][]) => ({ sections: [{ label: "P&L", rows: rows.map(([id, value]) => ({ id, label: id, value, unit: "EUR" })) }] });
const aug = sec([["ca", 334_526], ["cm1", 230_070], ["cm2", 174_817], ["cm3", -942], ["ebitda", -42_163], ["orders", 4_553], ["shipping_cost", 55_253],
  ["gross_sales", 453_493], ["refunds", 60_215], ["cogs", 104_457], ["ads_total", 175_758], ["payroll", 26_540], ["other_opex", 6_157], ["aov", 73], ["cm2_per_order", 38.4], ["cash_end", 99_236], ["mer", 1.9]]);
const d = prepareReport({ period: "2026-08-01", currency: "EUR", sdData: aug, history: [] });

describe("indicateurs dérivés", () => {
  it("par commande, remises implicites, coûts variables / fixes", () => {
    const u = deriveUnit({ ca: 334_526, cm3: -942, ebitda: -42_163, orders: 4_553, shipping_cost: 55_253, gross_sales: 453_493, refunds: 60_215 });
    expect(u.cm3_per_order).toBeCloseTo(-0.21, 2);
    expect(u.logistics_per_order).toBeCloseTo(12.14, 2);
    expect(u.discounts).toBeCloseTo(58_752, 0);
    expect(u.variable_costs).toBeCloseTo(335_468, 0);
    expect(u.fixed_costs).toBeCloseTo(41_221, 0);
  });
  it("ajoutés au rapport dans une section dédiée", () => {
    expect(d.sections.find((s) => s.label === "Par commande & structure de coûts")?.rows.map((r) => r.id))
      .toEqual(["cm3_per_order", "logistics_per_order", "discounts", "variable_costs", "fixed_costs"]);
  });
});

describe("adaptation au dossier", () => {
  const guidance = "Afficher les trois indicateurs prioritaires : CM3 par commande, MER, cycle de conversion cash. Cascade CA net → CM1 → CM2 → CM3 → EBITDA. Signaler l'écart CA brut TTC → CA net. Cost kill : coûts variables vs fixes.";
  it("mots-clés → blocs disponibles uniquement + indicateurs demandés en tête", () => {
    const t = tailorFromText(guidance, d);
    expect(t.kpis).toEqual(["cm3_per_order", "mer", "cash_end"]);
    expect(t.extras).toEqual(["par_commande", "brut_net", "jusqu_ebitda", "structure_couts"]);
    expect(availableExtras(d).map((x) => x.id)).toContain("par_commande");
  });
  it("plan : tête réordonnée, cascade jusqu'à l'EBITDA, brut → net, structure de coûts", () => {
    const p = buildReportPlan(d, [], { kpis: ["cm3_per_order", "mer"], extras: ["par_commande", "brut_net", "jusqu_ebitda", "structure_couts", "inconnu"] });
    const w = p.pages[0].widgets;
    expect(w[1].items?.map((i) => i.metric)).toEqual(["cm3_per_order", "mer", "cm3", "ebitda", "ca", "cash_end"]);
    expect(w.find((x) => x.title === "Du CA net à ce qu'il te reste après tes charges fixes")?.metrics).toEqual(["ca", "cm1", "cm2", "cm3", "ebitda"]);
    expect(w.find((x) => x.title === "Du CA brut au CA net")?.metrics).toEqual(["gross_sales", "discounts", "refunds", "ca"]);
    expect(w.find((x) => x.title?.startsWith("Où part l"))?.metrics?.[0]).toBe("ads_total");
  });
  it("sans adaptation : socle doctrinal, résultat après charges fixes toujours montré s'il est connu", () => {
    const w = buildReportPlan(d).pages[0].widgets;
    expect(w[1].items?.map((i) => i.metric)).toEqual(["cm3", "ebitda", "mer", "ca", "cash_end"]);
    expect(w.find((x) => x.type === "waterfall")?.metrics).toEqual(["ca", "cm1", "cm2", "cm3", "ebitda"]);
    expect(w.some((x) => x.title === "Du CA brut au CA net")).toBe(false);
  });
});
