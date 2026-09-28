// @vitest-environment node
// Contrôles croisés ajoutés après l'audit d'août : commandes boutique vs 3PL, versements Shopify Payments,
// retours du mois (boutique + 3PL), retours par produit.
import { describe, expect, it } from "vitest";
import { runControls } from "../controls.ts";
import { productKey, type ParsedExtract } from "../parsers.ts";
import { guardComponents, returnsByProduct, type Merged } from "../standardizeCore.ts";

const ex = (aux: Record<string, unknown>): ParsedExtract => ({ parser: "x", role: "analytics", values: {}, sources: {}, aux } as unknown as ParsedExtract);
const v = { ca: 334_526, gross_sales: 453_493, refunds: 60_215, orders: 4_553 };
const prev = { ca: 347_321, gross_sales: 435_782, refunds: 24_079, orders: 4_282 };

describe("contrôles croisés", () => {
  const kept = [
    ex({ shippedOrders: 4_528, returnedOrders: 849 }),
    ex({ returnsByReason: { "Trop petit": 903, "Ne plaît pas": 242, "Trop grand": 122 } }),
    ex({ shopifyPaymentsGross: 42_621, shopifyPaymentsTx: 384 }),
    ex({ pspInflows: { Stripe: { gross: 219_953, net: 0, n: 2135 }, Klarna: { gross: 0, net: 68_956, n: 4 } } }),
  ];
  const c = runControls(v, prev, kept);
  const get = (id: string) => c.find((x) => x.id === id)!;
  it("commandes vendues vs expédiées : écart < 5 % → OK", () => {
    expect(get("orders_3pl").status).toBe("ok");
    expect(get("orders_3pl").detail).toMatch(/4553 commandes vendues, 4528 au 3PL/);
  });
  it("versements Shopify Payments absents des relevés → écart (compte manquant)", () => {
    expect(get("psp_payouts").status).toBe("ecart");
    expect(get("psp_payouts").action).toMatch(/compte absent des relevés/);
  });
  it("retours qui doublent → écart, recoupé avec le 3PL et le motif principal", () => {
    const r = get("returns");
    expect(r.status).toBe("ecart");
    expect(r.detail).toMatch(/13,3 % du CA brut \(mois précédent 5,5 %\)/);
    expect(r.detail).toMatch(/849 commandes du mois retournées sur 4528/);
    expect(r.detail).toMatch(/motif principal : Trop petit \(71 %\)/);
  });
  it("retours stables → OK", () => {
    expect(runControls({ ...v, refunds: 25_000 }, prev, kept).find((x) => x.id === "returns")!.status).toBe("ok");
  });
});

describe("retours par produit", () => {
  it("clé produit commune boutique / 3PL (taille en suffixe retirée)", () => {
    expect(productKey("Capri asymétrique rouge - M")).toBe("CAPRI ASYMÉTRIQUE ROUGE");
    expect(productKey("BODY NOIR SABLIER / XL")).toBe("BODY NOIR SABLIER");
    expect(productKey("TOP COL ROULÉ JAUNE")).toBe("TOP COL ROULÉ JAUNE");
    expect(productKey("TOP COL ROULÉ NOIR S")).toBe("TOP COL ROULÉ NOIR");
  });
  it("taux de retour par produit, trié par nombre de retours", () => {
    const m = { values: {}, sources: {}, traces: {}, confidence: {}, flags: [], breakdowns: {}, questions: [], revenueDocs: [], effRoleOf: () => "",
      kept: [ex({ returnsByProduct: { "TOP COL ROULÉ JAUNE": 28, "CAPRI ASYMÉTRIQUE ROUGE": 65 } }), ex({ soldByProduct: { "TOP COL ROULÉ JAUNE": 44, "CAPRI ASYMÉTRIQUE ROUGE": 307 } })] } as unknown as Merged;
    returnsByProduct(m);
    expect(m.breakdowns.returns_by_product.rows.map((r) => [r.label, r.values?.sold, r.values?.returned, r.values?.rate]))
      .toEqual([["CAPRI ASYMÉTRIQUE ROUGE", 307, 65, 21.17], ["TOP COL ROULÉ JAUNE", 44, 28, 63.64]]);
  });
});

describe("valeurs de l'IA hors période", () => {
  it("pub Meta supérieure à la pub totale du mois → écartée (capture non datée), trafic de la même pièce aussi", () => {
    const llm = [{ file: "Screenshot.png", values: { ads_meta: 247_777, sessions: 868_585 } }, { file: "autre.pdf", values: { ads_google: 20_000 } }];
    const flags: { id: string; severity: "info" | "warn" | "error"; label: string }[] = [];
    guardComponents(llm, { ads_total: 105_775 }, flags, "EUR");
    expect(llm[0].values).toEqual({});
    expect(llm[1].values).toEqual({ ads_google: 20_000 });
    expect(flags[0].label).toMatch(/Screenshot\.png.*pub Meta.*autre période/);
  });
});
