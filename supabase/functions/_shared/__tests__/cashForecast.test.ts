// @vitest-environment node
// Trésorerie 13 semaines : échéances fixes replanifiées, rythmes hebdo, point bas et date sous zéro.
import { describe, expect, it } from "vitest";
import { forecastCash, type Tx } from "../cashForecast.ts";

// 3 mois : encaissements 7 000/semaine (1 000/jour), pub 5 000/semaine, loyer 12 000 le 5, prêt 3 000 le 20.
const txs: Tx[] = [];
for (let d = new Date(Date.UTC(2026, 5, 1)); d <= new Date(Date.UTC(2026, 7, 31)); d.setUTCDate(d.getUTCDate() + 1)) {
  const iso = d.toISOString().slice(0, 10), dom = d.getUTCDate();
  txs.push({ tx_date: iso, amount: 1_000, counterparty: "Shopify Payments" });
  txs.push({ tx_date: iso, amount: -5_000 / 7, counterparty: "Meta" });
  if (dom === 5) txs.push({ tx_date: iso, amount: -12_000, counterparty: "Bailleur" });
  if (dom === 20) txs.push({ tx_date: iso, amount: -3_000, counterparty: "Prêt BPI" });
}

describe("trésorerie à 13 semaines", () => {
  const f = forecastCash(txs, "2026-08-31", 20_000)!;
  it("échéances fixes détectées aux bons jours, flux continus au rythme hebdo", () => {
    expect(f.scheduled.map((s) => [s.counterparty, s.days, s.amount])).toEqual([["Bailleur", [5], 12_000], ["Prêt BPI", [20], 3_000]]);
    expect(f.run_rate).toEqual({ inflow_week: 7_000, outflow_week: 5_000 });
    expect(f.weeks.length).toBe(13);
  });
  it("point bas daté : le mois perd ~6 400, le loyer du 5 novembre fait passer sous zéro", () => {
    // 20 000 + 66 j × (1 000 − 714,29) − (12 000 × 3 + 3 000 × 2) ≈ −3 143 le 5 novembre
    expect(f.weeks[0].balance).toBeLessThan(20_000);
    expect(f.low.date).toBe("2026-11-05");
    expect(f.low.balance).toBeCloseTo(-3_143, -1);
    expect(f.below_zero).toBe("2026-11-05");
  });
  it("trésorerie de départ faible : date de passage sous zéro", () => {
    expect(forecastCash(txs, "2026-08-31", 5_000)!.below_zero).toBe("2026-09-05");
  });
  it("relevé qui s'arrête avant la fin de période → pas de projection", () => {
    expect(forecastCash(txs.filter((t) => t.tx_date < "2026-08-15"), "2026-08-31", 20_000)).toBeNull();
  });
});
