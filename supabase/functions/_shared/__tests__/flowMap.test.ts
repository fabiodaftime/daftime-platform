// @vitest-environment node
// Cartographie des flux : résumé du relevé (séparé par classement) et nettoyage de la sortie IA.
import { describe, expect, it } from "vitest";
import { bankDigest, sanitizeFlowMap } from "../flowMap.ts";

describe("cartographie des flux", () => {
  it("le résumé du relevé sépare un même prestataire par classement (PayPal pub vs prêt)", () => {
    const months = ["2026-06", "2026-07", "2026-08"];
    const txs = [
      ...months.flatMap((m) => [1, 2, 3].map((d) => ({ tx_date: `${m}-0${d}`, amount: -10_000, account: "Error Company", counterparty: "PayPal Europe", cat: "ads" }))),
      ...months.flatMap((m) => [1, 2, 3, 4].map((d) => ({ tx_date: `${m}-1${d}`, amount: -6_628, account: "Error Company", counterparty: "PayPal Europe", cat: "loan", rule: "prêt PayPal" }))),
      { tx_date: "2026-08-20", amount: 250_000, account: "Error Company", counterparty: "Shopify" },
    ];
    const d = bankDigest(txs, months).split("\n");
    // Séparateur de milliers fr-FR = espace fine insécable → \s dans les motifs.
    expect(d.some((l) => /PayPal Europe \| 30\s000 €\/mois .*classé : ads/.test(l))).toBe(true);
    expect(d.some((l) => /PayPal Europe \| 26\s512 €\/mois .*classé : loan \(prêt PayPal\)/.test(l))).toBe(true);
    expect(d[0]).toMatch(/ENTRÉE \| Shopify \| 83\s333 €\/mois/);
  });
  it("sortie IA nettoyée : énumérations, bornes, champs manquants", () => {
    const m = sanitizeFlowMap({ summary: "x", entities: [{ name: "Error", kind: "holding" }], accounts: [{ name: "BNP", kind: "banque", in_treasury: "oui" }],
      inflows: [{ channel: "Shopify", account: "bnp", amount_month: 1200.4, certainty: "sûr" }], outflows: [{ payee: "Meta", category: "marketing", account: "bnp" }],
      interco: [{ from: "FR" }], open_questions: ["Délai Hanayaka ?", 3, ""] });
    expect(m.entities[0]).toMatchObject({ id: "Error", kind: "autre" });
    expect(m.accounts[0].in_treasury).toBe(false);
    expect(m.inflows[0]).toMatchObject({ amount_month: 1200, certainty: "à confirmer", delay: "inconnu" });
    expect(m.outflows[0]).toMatchObject({ category: "autre", rhythm: "inconnu", terms: "inconnues" });
    expect(m.interco).toEqual([]);
    expect(m.open_questions).toEqual(["Délai Hanayaka ?"]);
  });
});
