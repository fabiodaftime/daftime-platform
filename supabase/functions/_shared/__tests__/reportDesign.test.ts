// @vitest-environment node
// Système visuel « rapport » : contrastes garantis, palette lisible, mise en page doctrinale sans doublon.
import { describe, expect, it } from "vitest";
import { contrast, reportPalette, resolveTheme } from "../dashboardTheme.ts";
import { buildReportPlan } from "../reportPlan.ts";
import type { ReportData } from "../reportData.ts";

const ERROR_BRAND = { colors: { text: "#212121", accent: "#F78080", primary: "#000000", secondary: "#252525", background: "#FFFFFF" },
  palette: ["#000000", "#F78080", "#252525", "#E4E4E4", "#8A2942", "#C49A6C"], fonts: { body: "Abel", heading: "Bebas Neue" }, style: ["minimal noir & blanc"] };

describe("thème rapport dérivé de la marque", () => {
  const th = resolveTheme(ERROR_BRAND, {});
  it("fond clair, encre de marque, polices du site", () => {
    expect(th.report).toBe(true);
    expect(th.dark).toBe(false);
    expect(th.ink).toBe("#212121");
    expect(th.headingFont).toMatch(/Bebas Neue/);
    expect(th.googleFonts).toEqual(["Bebas Neue", "Abel"]);
  });
  it("palette : couleurs de marque lisibles, gris clair et doublons d'encre écartés", () => {
    expect(th.palette).not.toContain("#E4E4E4");
    expect(th.palette.filter((c) => ["#000000", "#212121", "#252525"].includes(c)).length).toBe(1);
    expect(th.palette).toContain("#8A2942");
    for (const c of th.palette) expect(contrast(c, "#FFFFFF")).toBeGreaterThanOrEqual(1.8);
  });
  it("accent trop pâle pour du texte → version assombrie à 4,5:1", () => {
    expect(contrast(th.accentInk, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  });
  it("une ancienne ambiance sombre choisie par l'IA n'est plus appliquée (sauf imposée)", () => {
    expect(resolveTheme(ERROR_BRAND, { mood: "noir" }).report).toBe(true);
    expect(resolveTheme(ERROR_BRAND, { mood: "noir", legacy: true }).dark).toBe(true);
  });
  it("sans marque : palette de repli testée", () => {
    expect(reportPalette([], "#FFFFFF").length).toBeGreaterThanOrEqual(5);
  });
});

describe("mise en page doctrinale", () => {
  const M = (v: number) => ({ value: v, label: "x", unit: "EUR" });
  const d = {
    sections: [{ label: "Cascade", rows: [{ id: "ca", value: 1 }] }],
    metrics: { ca: M(100), cm1: M(60), cm2: M(40), cm3: M(20), cm3_rate: M(20), mer: M(5), cash_end: M(10), ads_total: M(20), breakeven_roas: M(2.5) },
    history: { months: ["j", "f", "m"], series: { ca: [1, 2, 3], cm3_rate: [1, 2, 3] }, labels: {} },
    breakdowns: { sales_by_country: { label: "Pays", rows: [{ label: "FR", value: 1 }] } }, targets: {}, curMap: {}, prevMap: {},
    bridgePrev: null, bridgeAvg: null, mainBridge: { level: "cm3", base: "juillet", from: 1, to: 2, delta: 1, effects: [] }, pointFacts: [], cashForecast: null,
  } as unknown as ReportData;
  it("ordre : le mois (points, tuiles, cascade, pont, tendance) → … → les chiffres", () => {
    const plan = buildReportPlan(d);
    expect(plan.pages[0].title).toBe("Le mois");
    expect(plan.pages[0].widgets.map((w) => w.type)).toEqual(["points", "kpi_row", "waterfall", "bridge", "combo"]);
    expect(plan.pages[plan.pages.length - 1].title).toBe("Les chiffres");
  });
  it("graphiques obligatoires : ajoutés s'ils apportent du neuf, jamais en doublon", () => {
    const plan = buildReportPlan(d, [{ type: "kpi_row", metrics: ["ca"] }, { type: "map", breakdown: "sales_by_country" }, { type: "line", metrics: ["ebitda"] }]);
    const all = plan.pages.flatMap((p) => p.widgets);
    expect(all.filter((w) => w.type === "kpi_row" && w.metrics?.[0] === "ca").length).toBe(0); // CA déjà en tuile
    expect(all.filter((w) => w.type === "map").length).toBe(1);                              // placée en « Produits »
    expect(all.some((w) => w.type === "line" && w.metrics?.[0] === "ebitda")).toBe(false);   // donnée absente
  });
});
