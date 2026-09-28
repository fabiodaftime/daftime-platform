// @vitest-environment node
// Contrôles croisés + indice de fiabilité : OK / écart / non contrôlable (pièce nommée).
import { describe, expect, it } from "vitest";
import { reliabilityIndex, runControls } from "../controls.ts";
import type { ParsedExtract } from "../parsers.ts";

const ex = (aux: Record<string, unknown>): ParsedExtract => ({ parser: "x", role: "bank", source_type: "other", currency: "EUR", values: {}, sources: {}, aux });
const kept = [ex({ netFlow: -1_000, inflow: 118_000, totalDebits: 100_000, unqualifiedTotal: 5_000, vatPaid: 10_000 }), ex({ salesTTC: 120_000, taxesCollected: 20_000, cogsLines: 1_000 })];
const v = { ca: 100_000, cogs: 40_000, shipping_cost: 13_000, orders: 1_000, ads_total: 30_000, cash_start: 50_000, cash_end: 49_000 };
const prev = { ca: 95_000, cogs: 38_000, shipping_cost: 12_000, orders: 1_000, ads_total: 15_000 };
const byId = (cs: ReturnType<typeof runControls>) => Object.fromEntries(cs.map((c) => [c.id, c]));

describe("contrôles croisés", () => {
  const c = byId(runControls(v, prev, kept, "EUR", { cogsMissing: 50 }));
  it("trésorerie cohérente avec le relevé", () => expect(c.cash.status).toBe("ok"));
  it("encaissements ≈ ventes TTC", () => expect(c.cash_in.status).toBe("ok"));
  it("coût logistique par commande : +8 % = OK", () => expect(c.logistics.status).toBe("ok"));
  it("5 % des lignes sans coût = écart avec action", () => {
    expect(c.cogs_cov.status).toBe("ecart");
    expect(c.cogs_cov.action).toMatch(/coûts de revient/);
  });
  it("TVA reversée ≈ moitié de la collectée du mois précédent (déductible sur achats) = cohérent", () => {
    expect(c.vat.status).toBe("ok");
    expect(c.vat.detail).toMatch(/pour ≈ 19\s000\s€ collectée le mois précédent \(53\s%/);
  });
  it("aucune TVA reversée = écart avec piste (règle DGFIP)", () => {
    const k2 = [ex({ netFlow: -1_000, inflow: 118_000, totalDebits: 100_000, unqualifiedTotal: 5_000, vatPaid: 0 }), ex({ salesTTC: 120_000, taxesCollected: 20_000, cogsLines: 1_000 })];
    const c2 = byId(runControls(v, prev, k2, "EUR"));
    expect(c2.vat.status).toBe("ecart");
    expect(c2.vat.action).toMatch(/DGFIP/);
  });
  it("pub doublée vs M-1 = poste qui bouge de plus de 40 %", () => {
    expect(c.history.status).toBe("ecart");
    expect(c.history.detail).toMatch(/pub \+100 %/);
  });
  it("sans relevé : non contrôlable avec la pièce à fournir", () => {
    const n = byId(runControls({ ca: 1 }, null, [], "EUR"));
    expect(n.cash).toMatchObject({ status: "non_controlable" });
    expect(n.cash_in.action).toMatch(/Total sales over time/);
    expect(n.history.action).toMatch(/Tous les mois/);
  });
});

describe("indice de fiabilité", () => {
  it("complétude × contrôles × débits classés", () => {
    const cs = runControls(v, prev, kept, "EUR", { cogsMissing: 50 });
    const r = reliabilityIndex(v, cs, kept);
    expect(r.completeness).toBe(1);
    expect(r.classified).toBe(0.95);
    expect(r.score).toBeGreaterThan(70);
    expect(r.score).toBeLessThan(95);
    const poor = reliabilityIndex({ ca: 1 }, runControls({ ca: 1 }, null, [], "EUR"), []);
    expect(poor.missing).toContain("trésorerie");
    expect(poor.score).toBeLessThan(20);
  });
});
