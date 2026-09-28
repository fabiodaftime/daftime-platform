// @vitest-environment node
// Qualification des contreparties : l'IA ne décide seule qu'au-dessus du seuil, jamais contre le conseiller.
import { describe, expect, it } from "vitest";
import { applyRuleOps, mergeRules, sanitizeClassified, splitByConfidence, toClassify } from "../counterparties.ts";
import { parseFile } from "../parsers.ts";
import { mergeParsed } from "../standardizeCore.ts";
import * as F from "./fixtures.ts";

const asked = [{ label: "SARL HANAYAKA", value: 1000 }, { label: "PayPal Europe S.a.r.l. et Cie S.C.A", value: 300 }, { label: "Qonto  SAS", value: 29 }];

describe("sélection des contreparties à qualifier", () => {
  it("ignore celles déjà couvertes par une règle, une proposition ou un refus", () => {
    expect(toClassify(asked, ["paypal", "qonto sas"]).map((x) => x.label)).toEqual(["SARL HANAYAKA"]);
    expect(toClassify([...asked, { label: "sarl  hanayaka", value: 5 }], []).length).toBe(3); // doublon de casse/espaces
  });
});

describe("sortie IA validée", () => {
  const raw = { items: [
    { counterparty: "Qonto SAS", match: "qonto", category: "bankfees", label: "abonnement Qonto", confidence: 0.97, universal: true },
    { counterparty: "PayPal Europe S.a.r.l. et Cie S.C.A", match: "paypal", category: "ads", label: "pub via PayPal", confidence: 0.55, universal: true },
    { counterparty: "SARL HANAYAKA", match: "fournisseur", category: "stock", label: "achats", confidence: 0.92, universal: false },
    { counterparty: "Inconnu", match: "x", category: "ads", label: "?", confidence: 1, universal: true },
    { counterparty: "SARL HANAYAKA", match: "hanayaka", category: "salaire", label: "?", confidence: 1, universal: false },
  ] };
  const cls = sanitizeClassified(raw, asked);
  it("écarte contrepartie inventée / catégorie invalide ; « match » toujours contenu dans le libellé", () => {
    expect(cls.map((c) => c.counterparty)).toEqual(["Qonto  SAS", "PayPal Europe S.a.r.l. et Cie S.C.A", "SARL HANAYAKA"]);
    expect(cls[2].match).toBe("sarl hanayaka"); // « fournisseur » n'est pas dans le libellé → libellé complet
  });
  it("≥ 90 % → règle IA ; sinon proposition ; universel seulement si appliqué", () => {
    const s = splitByConfidence(cls, new Map(asked.map((a) => [a.label, a.value])), "2026-08-01");
    expect(s.auto.map((r) => [r.match, r.category, r.source])).toEqual([["qonto", "bankfees", "ia"], ["sarl hanayaka", "stock", "ia"]]);
    expect(s.proposals).toEqual([expect.objectContaining({ match: "paypal", category: "ads", confidence: 0.55, amount: 300 })]);
    expect(s.universal.map((u) => u.match)).toEqual(["qonto"]);
  });
  it("jamais d'application automatique de « autre » ou « à exclure »", () => {
    const s = splitByConfidence([{ counterparty: "X", match: "x", category: "ignore", label: "x", confidence: 0.99, universal: false }], new Map(), "2026-08-01");
    expect(s.auto).toEqual([]);
    expect(s.proposals.length).toBe(1);
  });
});

describe("règles : le conseiller prime", () => {
  it("une règle IA n'écrase pas une règle du conseiller", () => {
    const r = mergeRules([{ match: "paypal", category: "ads", source: "staff" }], [{ match: "PayPal", category: "stock", source: "ia" }]);
    expect(r).toEqual([{ match: "paypal", category: "ads", source: "staff" }]);
  });
  it("revue : valider, écarter, supprimer une règle IA (→ jamais recréée)", () => {
    const st = applyRuleOps({
      bank_rules: [{ match: "qonto", category: "bankfees", source: "ia" }],
      bank_rule_proposals: [{ match: "paypal", category: "ads", label: "pub", confidence: 0.5, amount: 300, period: "2026-08-01" },
        { match: "zaoui", category: "payroll", label: "dirigeant", confidence: 0.4, amount: 2000, period: "2026-08-01" }],
    }, [{ op: "accept", match: "paypal", category: "ads" }, { op: "reject", match: "zaoui" }, { op: "delete", match: "qonto" }]);
    expect(st.bank_rules).toEqual([{ match: "paypal", category: "ads", label: "pub", source: "staff" }]);
    expect(st.bank_rule_proposals).toEqual([]);
    expect(st.bank_rules_rejected.sort()).toEqual(["qonto", "zaoui"]);
  });
});

describe("question au conseiller", () => {
  it("affiche la proposition IA à côté du débit à qualifier", () => {
    const p = parseFile("PENNYLANE_transaction_banking.xlsx", F.PENNYLANE, F.ctx("2026-08-01"))!; p.file = "b.xlsx";
    const m = mergeParsed([p], new Map(), (x) => x, "EUR", [{ match: "paypal", category: "ads", confidence: 0.6 }]);
    expect(m.questions[0]).toMatch(/PayPal Europe S\.a\.r\.l\. et Cie S\.C\.A 300 \(IA : pub \? 60 %\)/);
    expect(m.questions[0]).toMatch(/Contreparties/);
  });
});

describe("règle au montant (ex. PayPal 6 628 €/semaine = remboursement de prêt)", async () => {
  const { classifyDebit } = await import("../parsers.ts");
  const { applyRuleOps, mergeRules } = await import("../counterparties.ts");
  const rules = [{ match: "paypal", category: "ads" }, { match: "paypal", category: "loan", amount: 6628 }];
  const w = "PRELEVEMENT EUROPEEN DE: PayPal Europe S.a.r.l. et Cie S.C.A MOTIF: 1052277134549/PAYPAL";
  it("le débit du montant exact prend la règle au montant, les autres la règle générale", () => {
    expect(classifyDebit(w, rules, -6628).cat).toBe("loan");
    expect(classifyDebit(w, rules, -1500).cat).toBe("ads");
    expect(classifyDebit(w, rules).cat).toBe("ads");
  });
  it("les deux règles coexistent (fusion et décisions du conseiller)", () => {
    expect(mergeRules([{ match: "paypal", category: "ads", source: "staff" }], [{ match: "paypal", category: "loan", amount: 6628, source: "staff" }])).toHaveLength(2);
    const st = applyRuleOps({ bank_rules: [{ match: "paypal", category: "ads", source: "staff" }, { match: "paypal", category: "loan", amount: 6628, source: "staff" }] },
      [{ op: "set", match: "paypal", category: "stock" }]);
    expect(st.bank_rules.map((r) => [r.category, r.amount ?? null])).toEqual([["loan", 6628], ["stock", null]]);
  });
});
