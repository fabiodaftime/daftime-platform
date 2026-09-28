// @vitest-environment node
// Frais de paiement (CM2) estimés depuis les encaissements par prestataire quand aucun relevé ne les donne.
import { describe, expect, it } from "vitest";
import { parseFile, type ParsedExtract } from "../parsers.ts";
import { estimatePaymentFees, type Merged } from "../standardizeCore.ts";
import { treasuryPerimeter } from "../flowRules.ts";
import { sanitizeFlowMap } from "../flowMap.ts";
import * as F from "./fixtures.ts";

const HEADER = "Date,Month,Bank account,Wording,Amount,Third,Justified,Comments,State,Type,Suivi de trésorerie";
const line = (d: string, acc: string, w: string, a: number) => `${d},8,${acc},${w},${a},,No,,Booked transaction,,`;
const CSV = [HEADER,
  line("2026-08-02", "PSP LEDGER", "Charge: gid://shopify/PaymentSession/a", 60),
  line("2026-08-02", "PSP LEDGER", "Charge: gid://shopify/PaymentSession/b", 40),
  line("2026-08-03", "PSP LEDGER", "Refund:  - gid://shopify/PaymentSession/a", -10),
  line("2026-08-04", "Shop Bank", "VIR RECU 1S DE: Klarna Bank AB MOTIF: 1 REF", 965),
  line("2026-08-05", "Shop Bank", "VIR RECU 2S DE: PayPal Europe S.a.r.l. et Cie S.C.A MOTIF: Shopify REF:", 200),
  line("2026-08-06", "Shop Bank", "VIR RECU 3S DE: Client Dupont MOTIF: facture", 500),
  line("2026-08-07", "Perso Account", "VIR RECU 4S DE: Scalapay IP S.p.a. MOTIF: x", 300),
  line("2026-07-30", "Shop Bank", "VIR RECU 5S DE: Klarna Bank AB MOTIF: 0 REF", 999),
].join("\n");
const perimeter = treasuryPerimeter(sanitizeFlowMap({ accounts: [{ id: "p", name: "Perso Account", kind: "banque", role: "perso", in_treasury: false }] }));

describe("encaissements par prestataire (relevé)", () => {
  const p = parseFile("PENNYLANE_transaction_banking.xlsx", CSV, F.ctx("2026-08-01", { treasuryPerimeter: perimeter }))!;
  it("journal brut (paiements de commandes) vs versements nets ; virement client et compte hors trésorerie ignorés", () => {
    expect(p.aux?.pspInflows).toEqual({
      "Shopify Payments": { gross: 100, net: 0, n: 2 },
      Klarna: { gross: 0, net: 965, n: 1 },
      PayPal: { gross: 0, net: 200, n: 1 },   // « PayPal … MOTIF: Shopify » = versement PayPal
    });
  });
});

const merged = (pspInflows: Record<string, { gross: number; net: number; n: number }>, values: Record<string, number> = {}): Merged => ({
  values: { ca: 10_000, orders: 100, ...values }, sources: {}, traces: {}, confidence: {}, flags: [], breakdowns: {}, questions: [],
  kept: [{ parser: "pennylane_bank", role: "bank", values: {}, sources: {}, aux: { pspInflows } } as unknown as ParsedExtract],
  revenueDocs: [], effRoleOf: () => "bank",
});

describe("estimation des frais de paiement", () => {
  it("brut × taux + part fixe × transactions ; net reconstitué en brut (panier moyen 100 €)", () => {
    const m = merged({ "Shopify Payments": { gross: 5_000, net: 0, n: 50 }, Klarna: { gross: 0, net: 965, n: 1 } });
    estimatePaymentFees(m, "EUR");
    // Shopify : 5 000 × 1,8 % + 0,25 × 50 = 102,5 ; Klarna : 965 / (1 − 3,3 % − 0,35/100) − 965 = 36,56
    expect(m.values.payment_fees).toBe(139.06);
    expect(m.confidence.payment_fees).toBe("estimated");
    expect(m.breakdowns.payment_fees_by_psp.rows.map((r) => [r.label, r.value])).toEqual([["Shopify Payments", 102.5], ["Klarna", 36.56]]);
    expect(m.flags[0].label).toMatch(/tarifs standards utilisés pour Shopify Payments, Klarna/);
    expect(m.questions[0]).toMatch(/tarifs réels/);
  });
  it("tarif du contrat : calcul sans mention d'hypothèse", () => {
    const m = merged({ Klarna: { gross: 0, net: 970, n: 1 } });
    estimatePaymentFees(m, "EUR", { klarna: { pct: 3 } });
    expect(m.values.payment_fees).toBe(30);   // 970 / 0,97 − 970
    expect(m.confidence.payment_fees).toBeUndefined();
    expect(m.flags[0].severity).toBe("info");
    expect(m.questions).toEqual([]);
  });
  it("une vraie source de frais prime : rien n'est estimé", () => {
    const m = merged({ Klarna: { gross: 0, net: 970, n: 1 } }, { payment_fees: 12 });
    estimatePaymentFees(m, "EUR");
    expect(m.values.payment_fees).toBe(12);
    expect(m.flags).toEqual([]);
  });
  it("sans encaissement de prestataire : rien", () => {
    const m = merged({});
    estimatePaymentFees(m, "EUR");
    expect(m.values.payment_fees).toBeUndefined();
  });
});
