// @vitest-environment node
// Les 3 points du mois : ordre doctrinal, faits chiffrés, jugement pub vs point mort du shop.
import { describe, expect, it } from "vitest";
import { marginBridge } from "../marginBridge.ts";
import { numbersPreserved, selectMonthPoints } from "../monthPoints.ts";

const jul = { ca: 100_000, cogs: 40_000, orders: 1_000, refunds: 5_000, shipping_cost: 12_000, payment_fees: 2_000, ads_total: 30_000 };
const aug = { ca: 110_000, cogs: 47_300, orders: 1_050, refunds: 8_000, shipping_cost: 13_650, payment_fees: 2_200, ads_total: 36_000 };
const derived = (x: typeof aug) => {
  const cm1 = x.ca - x.cogs, cm2 = cm1 - x.shipping_cost - x.payment_fees, cm3 = cm2 - x.ads_total;
  return { ...x, cm1, cm2, cm3, cm3_rate: (cm3 / x.ca) * 100, mer: x.ca / x.ads_total, breakeven_roas: x.ca / cm2 };
};

describe("3 points du mois", () => {
  const b = marginBridge(aug, jul, "juillet");
  it("ordre : gagne → acquisition → 3e point ; jamais la croissance avant", () => {
    const pts = selectMonthPoints(derived(aug), b, "EUR");
    expect(pts.map((p) => p.key).slice(0, 2)).toEqual(["gagne", "acquisition"]);
    expect(pts.length).toBe(3);
    expect(pts[0].text).toMatch(/dégage 10\s850\s€ de marge après pub \(CM3, 9,9\s% du CA\)/);
    expect(pts[0].text).toMatch(/En baisse de 5\s150\s€ vs juillet/);
  });
  it("pub jugée contre le point mort du shop (1/CM2)", () => {
    const pts = selectMonthPoints(derived(aug), b, "EUR");
    // MER 3,06× vs point mort 110 000 / 46 850 = 2,35× → marge de sécurité ≈ 30 %
    expect(pts[1].text).toMatch(/3,1× .*point mort à 2,3×/);
    const under = selectMonthPoints({ ...derived(aug), ads_total: 60_000, mer: 110_000 / 60_000 }, null, "EUR");
    expect(under.find((p) => p.key === "acquisition")!.text).toMatch(/SOUS le point mort/);
  });
  it("trésorerie en forte baisse : priorité sur la croissance", () => {
    const pts = selectMonthPoints({ ...derived(aug), cash_start: 80_000, cash_end: 50_000 }, b, "EUR");
    expect(pts[2]).toMatchObject({ key: "tresorerie", tone: "warn" });
    expect(pts[2].text).toMatch(/1 mois devant toi/);
  });
  it("point bas à 13 semaines sous zéro : prime sur la variation du mois", () => {
    const pts = selectMonthPoints({ ...derived(aug), cash_start: 80_000, cash_end: 50_000 }, b, "EUR", undefined,
      { start: { balance: 50_000 }, low: { date: "2026-11-05", balance: -3_143 }, below_zero: "2026-11-05" });
    expect(pts[2]).toMatchObject({ key: "tresorerie", tone: "warn" });
    expect(pts[2].text).toMatch(/passe sous zéro le 05\/11/);
  });
  it("logistique inconnue : le point le dit, pas de fausse certitude", () => {
    const pts = selectMonthPoints({ ca: 100_000, cogs: 40_000, cm1: 60_000, cm1_rate: 60 }, null, "EUR");
    expect(pts[0].text).toMatch(/Logistique inconnue/);
  });
});

describe("garde-fou chiffres", () => {
  it("refuse un chiffre inventé par la reformulation", () => {
    const facts = "Ton shop dégage 10 850 € de marge (9,9 % du CA).";
    expect(numbersPreserved(facts, "Tu gardes 10 850 € de marge, soit 9,9 % du CA.")).toBe(true);
    expect(numbersPreserved(facts, "Tu gardes 11 000 € de marge.")).toBe(false);
  });
});

describe("garde-fous ajoutés (audit 20/10)", () => {
  it("frais de paiement connus sur un seul mois : pas de fausse dérive « paiement » dans le pont", () => {
    const b = marginBridge(aug, { ...jul, payment_fees: undefined as unknown as number }, "juillet")!;
    expect(b.effects.find((e) => e.key === "paiement")?.value ?? 0).toBe(0);
  });
  it("CM2 négative : aucun point mort, la pub est signalée comme creusant la perte", () => {
    const x = { ...derived(aug), cogs: 100_000 };
    const cm2 = x.ca - 100_000 - x.shipping_cost - x.payment_fees;
    const pts = selectMonthPoints({ ...x, cm1: x.ca - 100_000, cm2, cm3: cm2 - x.ads_total, breakeven_roas: undefined as unknown as number }, null, "EUR");
    expect(pts.find((p) => p.key === "acquisition")).toMatchObject({ tone: "warn" });
    expect(pts.find((p) => p.key === "acquisition")!.text).toMatch(/aucun niveau de pub/);
  });
  it("frais de paiement inconnus : le point 1 le dit", () => {
    const pts = selectMonthPoints({ ...derived(aug), payment_fees: undefined as unknown as number }, null, "EUR");
    expect(pts[0].text).toMatch(/Frais de paiement inconnus/);
  });
});
