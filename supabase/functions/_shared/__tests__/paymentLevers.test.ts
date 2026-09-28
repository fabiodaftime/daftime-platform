// @vitest-environment node
// Argent avancé par poste + leviers de décalage ; port facturé déduit de la logistique.
import { describe, expect, it } from "vitest";
import { leverScenario, paymentLevers, type ClassifiedDebit } from "../paymentLevers.ts";
import { netShippingBilled } from "../standardizeCore.ts";
import type { CashForecast } from "../cashForecast.ts";

const deb = (tx_date: string, amount: number, cat: string, extra: Partial<ClassifiedDebit> = {}): ClassifiedDebit => ({ tx_date, amount, cat, ...extra });
const debits: ClassifiedDebit[] = [
  ...Array.from({ length: 10 }, (_, i) => deb(`2026-08-${String(i + 1).padStart(2, "0")}`, -10_000, "ads", { platform: "paypal", counterparty: "PayPal Europe" })),
  deb("2026-08-05", -21_171, "ads", { platform: "Google", counterparty: "Google Ireland" }),
  deb("2026-08-04", -40_000, "stock", { counterparty: "SARL HANAYAKA" }), deb("2026-08-17", -35_000, "stock", { counterparty: "SARL HANAYAKA" }),
  deb("2026-08-06", -29_064, "logistics", { counterparty: "Bigblue" }), deb("2026-08-20", -37_730, "logistics", { counterparty: "Bigblue" }),
  deb("2026-08-24", -23_867, "vat"), deb("2026-07-20", -50_000, "stock"), deb("2026-08-10", -500, "tools"),
];

describe("leviers de décalage", () => {
  const L = paymentLevers(debits, "2026-08-01")!;
  it("montants du mois par poste (hors TVA, hors autres mois), triés", () => {
    expect(L.items.map((i) => [i.key, i.monthly, i.count])).toEqual([
      ["ads_paypal", 100_000, 10], ["stock", 75_000, 2], ["logistics", 66_794, 2]]);
    expect(L.total).toBe(241_794);
    expect(L.hypothesis).toMatch(/30 jours/);
  });
  it("scénario : gain qui monte sur 30 jours puis reste acquis", () => {
    const f = { start: { date: "2026-08-31", balance: 99_236 }, weeks: Array.from({ length: 13 }, (_, i) => ({ week_start: "", inflow: 0, outflow: 0, balance: 99_236 - (i + 1) * 5_000 })),
      low: { date: "2026-11-30", balance: 34_236 }, run_rate: { inflow_week: 0, outflow_week: 0 }, scheduled: [], hypotheses: [] } as CashForecast;
    const s = leverScenario(f, 30_000)!;
    expect(s.weeks[0].balance).toBe(99_236 - 5_000 + 7_000);
    expect(s.weeks[12].balance).toBe(34_236 + 30_000);
    expect(s.below_zero).toBeUndefined();
  });
  it("sortie ponctuelle exclue (ex. virement exceptionnel classé logistique)", () => {
    const L2 = paymentLevers([...debits, deb("2026-08-13", -33_000, "logistics", { counterparty: "BP RIVES DE PARIS" })], "2026-08-01", ["BP RIVES DE PARIS"])!;
    expect(L2.items.find((i) => i.key === "logistics")?.monthly).toBe(66_794);
  });
  it("aucun poste significatif → rien", () => {
    expect(paymentLevers([deb("2026-08-10", -500, "tools")], "2026-08-01")).toBeNull();
  });
});

describe("port facturé aux clients", () => {
  const m = () => ({ values: { shipping_cost: 55_253, shipping_billed: 22_417 } as Record<string, number>, sources: { shipping_cost: "Bigblue" } as Record<string, string>,
    traces: {} as Record<string, { src: string; value: number }[]>, confidence: {} as Record<string, string>, flags: [] as { id: string; severity: string; label: string }[] });
  it("déduit du coût logistique, ne reste pas comme indicateur", () => {
    const x = m(); netShippingBilled(x as never, "EUR");
    expect(x.values.shipping_cost).toBe(32_836);
    expect(x.values.shipping_billed).toBeUndefined();
    expect(x.flags[0].label).toMatch(/nette du port facturé/);
  });
  it("sans coût logistique : rien n'est inventé", () => {
    const x = m(); delete x.values.shipping_cost; netShippingBilled(x as never, "EUR");
    expect(x.values.shipping_cost).toBeUndefined();
    expect(x.values.shipping_billed).toBeUndefined();
  });
});
