// @vitest-environment node
// Rendu des éléments doctrinaux : 3 points du mois, pont d'écarts, cascade CM1 → CM3.
import { describe, expect, it } from "vitest";
import { renderDashboard } from "../dashboardRender.ts";
import { marginBridge } from "../marginBridge.ts";

const jul = { ca: 100_000, cogs: 40_000, orders: 1_000, shipping_cost: 12_000, payment_fees: 2_000, ads_total: 30_000 };
const aug = { ca: 110_000, cogs: 47_300, orders: 1_050, shipping_cost: 13_650, payment_fees: 2_200, ads_total: 36_000 };
const M = (id: string, value: number, unit = "EUR") => ({ value, label: id.toUpperCase(), unit, change_pct: null });

describe("rendu doctrinal", () => {
  const html = renderDashboard({
    client: "Test", period: "2026-08-01", currency: "EUR", activity: "ecommerce",
    metrics: { ca: M("ca", 110_000), cm1: M("cm1", 62_700), cm2: M("cm2", 46_850), cm3: M("cm3", 10_850), cm3_rate: M("cm3_rate", 9.9, "%") },
    history: { months: ["août 26"], series: {}, labels: {} },
    bridge: marginBridge(aug, jul, "juillet"),
    points: [{ key: "gagne", tone: "warn", text: "Ton shop dégage 10 850 € <b>de CM3</b>." }],
  }, { pages: [{ title: "Vue d'ensemble", widgets: [{ type: "points" }, { type: "bridge" }, { type: "waterfall", metrics: ["ca", "cm1", "cm2", "cm3"] }, { type: "kpi_row", items: [{ metric: "cm3_rate" }] }] }] });

  it("3 points : liste ordonnée, texte échappé", () => {
    expect(html).toMatch(/Les 3 points du mois/);
    expect(html).toMatch(/<li class="pt warn">/);
    expect(html).toContain("&lt;b&gt;de CM3&lt;/b&gt;");
  });
  it("pont d'écarts et cascade CM rendus", () => {
    expect(html).toMatch(/Pourquoi la marge a bougé \(CM3, vs juillet\)/);
    expect(html).toContain("Publicité");       // libellé de la cascade CM2 → CM3
    expect(html).toContain("CM3 juillet");      // barre de départ du pont
  });
  it("trésorerie à 13 semaines : point bas et passage sous zéro", () => {
    const h = renderDashboard({ client: "T", period: "2026-08-01", currency: "EUR", metrics: {}, history: { months: [], series: {}, labels: {} },
      cashForecast: { start: { date: "2026-08-31", balance: 20_000 }, weeks: [{ week_start: "2026-09-01", inflow: 7_000, outflow: 17_000, balance: 10_000 }],
        low: { date: "2026-11-05", balance: -3_143 }, below_zero: "2026-11-05", run_rate: { inflow_week: 7_000, outflow_week: 5_000 }, scheduled: [], hypotheses: ["Encaissements au rythme…"] } },
      { pages: [{ title: "Trésorerie", widgets: [{ type: "cash_forecast" }] }] });
    expect(h).toMatch(/Trésorerie à 13 semaines/);
    expect(h).toMatch(/Passage sous zéro le 05\/11/);
  });
  it("repère CM3 de la doctrine (sain 15-30 %)", () => {
    expect(html).toMatch(/sain 15-30 %/);
  });
});
