// @vitest-environment node
// Pont d'écarts : la somme des effets = la variation de marge, au centime ; niveau honnête.
import { describe, expect, it } from "vitest";
import { averageBase, flatValues, marginBridge } from "../marginBridge.ts";
import { buildStandardized, type Catalog } from "../templates.ts";

const jul = { ca: 100_000, cogs: 40_000, orders: 1_000, refunds: 5_000, shipping_cost: 12_000, payment_fees: 2_000, ads_total: 30_000 };
const aug = { ca: 110_000, cogs: 47_300, orders: 1_050, refunds: 8_000, shipping_cost: 13_650, payment_fees: 2_200, ads_total: 36_000 };
const sum = (b: ReturnType<typeof marginBridge>) => Math.round(b!.effects.reduce((s, e) => s + e.value, 0) * 100) / 100;

describe("pont d'écarts", () => {
  it("CM3 : effets exacts, triés par impact", () => {
    const b = marginBridge(aug, jul, "juillet")!;
    expect(b.level).toBe("cm3");
    expect(b.from).toBe(16_000); // 60 000 − 12 000 − 2 000 − 30 000
    expect(b.to).toBe(10_850);   // 62 700 − 13 650 − 2 200 − 36 000
    expect(sum(b)).toBeCloseTo(b.delta, 1);
    expect(b.effects.find((e) => e.key === "pub")!.value).toBe(-6_000);
    expect(b.effects.find((e) => e.key === "logistique")!.value).toBe(-1_050); // 13 € vs 12 € par commande × 1 050
    expect(Math.abs(b.effects[0].value)).toBeGreaterThanOrEqual(Math.abs(b.effects[1].value));
  });
  it("logistique inconnue : pont limité à la CM1, dit explicitement", () => {
    const b = marginBridge({ ...aug, shipping_cost: undefined }, jul, "juillet")!;
    expect(b.level).toBe("cm1");
    expect(b.missing).toMatch(/logistique inconnue/);
    expect(b.effects.map((e) => e.key)).not.toContain("pub");
    expect(sum(b)).toBeCloseTo(b.delta, 1);
  });
  it("données insuffisantes → pas de pont", () => {
    expect(marginBridge({ ca: 1 }, jul, "x")).toBeNull();
  });
  it("base moyenne 3 mois : poste moyenné seulement s'il est connu partout", () => {
    const avg = averageBase([jul, aug, { ...jul, ads_total: undefined }])!;
    expect(avg.ca).toBeCloseTo(103_333.33, 1);
    expect(avg.ads_total).toBeUndefined();
    expect(averageBase([jul])).toBeNull();
  });
});

describe("cascade du catalogue", () => {
  const tpl: Catalog = { sections: [{ key: "cascade", label: "" }], checks: [], lines: [
    { id: "ca", label: "", section: "cascade" }, { id: "cogs", label: "", section: "cascade" }, { id: "shipping_cost", label: "", section: "cascade" },
    { id: "ads_total", label: "", section: "cascade" }, { id: "orders", label: "", section: "cascade" },
    { id: "cm1", label: "", section: "cascade", formula: "ca - cogs" },
    { id: "cm2", label: "", section: "cascade", formula: "present(shipping_cost) ? cm1 - shipping_cost - coalesce(payment_fees, 0) : null" },
    { id: "cm3", label: "", section: "cascade", formula: "cm2 - ads_total" },
    { id: "cm2_rate", label: "", section: "cascade", formula: "cm2 / ca * 100" },
    { id: "breakeven_roas", label: "", section: "cascade", formula: "cm2 > 0 ? ca / cm2 : null" },
    { id: "mer", label: "", section: "cascade", formula: "ca / ads_total" },
    { id: "ads_headroom", label: "", section: "cascade", formula: "breakeven_roas > 0 ? (mer / breakeven_roas - 1) * 100 : null" },
  ] };
  it("point mort = 1 / CM2 ; marge de sécurité vs MER", () => {
    const v = flatValues(buildStandardized(tpl, jul, {}, "EUR").data);
    expect(v.cm2).toBe(46_000);          // 60 000 − 12 000 − 2 000 (frais absents du catalogue réduit → 0) … sans payment_fees : 48 000
    expect(v.breakeven_roas).toBeCloseTo(100_000 / 46_000, 2);
  });
  it("sans logistique, pas de CM2 (jamais surestimée en silence)", () => {
    const v = flatValues(buildStandardized(tpl, { ...jul, shipping_cost: undefined as unknown as number }, {}, "EUR").data);
    expect(v.cm1).toBe(60_000);
    expect(v.cm2).toBeUndefined();
    expect(v.breakeven_roas).toBeUndefined();
  });
});
