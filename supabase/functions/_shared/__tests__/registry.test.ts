// @vitest-environment node
// Registre : la LECTURE des faits doit redonner, au centime, ce que calcule la fusion actuelle.
import { describe, expect, it } from "vitest";
import { parseFile, pennylaneTransactions, type ParsedExtract } from "../parsers.ts";
import { mergeParsed } from "../standardizeCore.ts";
import { bankRows, extractToFacts, readBankMonth, readFacts, sourceDoc } from "../registry.ts";
import * as F from "./fixtures.ts";

const AUG = "2026-08-01";
const files: [string, string][] = [
  ["Total sales over time - 2026-01-01 - 2026-08-31.csv", F.TOTAL_SALES],
  ["Average order value over time - 2026-01-01 - 2026-08-31.csv", F.AOV],
  ["Cost of goods sold by order - 2026-01-01 - 2026-08-31.csv", F.COGS_BY_ORDER],
  ["FA-TEST0001-details-abc.csv", F.BIGBLUE_INVOICE_1],
  ["FA-TEST0001-details-abc (1).csv", F.BIGBLUE_INVOICE_1_BIS],
  ["FA-TEST0002-details-def.csv", F.BIGBLUE_INVOICE_2],
  ["orders_20260101-20260831.csv", F.BIGBLUE_ORDERS],
  ["PENNYLANE_transaction_banking.xlsx", F.PENNYLANE],
];
const parsed = (period: string) => files.map(([n, t]) => { const p = parseFile(n, t, F.ctx(period))!; p.file = n; return p; });

describe("registre de faits", () => {
  it("lecture du registre = fusion actuelle, au centime", () => {
    const ex = parsed(AUG);
    const facts = ex.flatMap((e) => extractToFacts(e, { client_id: "c1", period: AUG, file_id: null, file_name: e.file! }));
    const m = mergeParsed(ex, new Map(), (x) => x, "EUR");
    const r = readFacts(facts);
    for (const k of Object.keys(m.values)) expect([k, r[k]]).toEqual([k, m.values[k]]);
  });
  it("une facture re-téléchargée et un rapport redéposé ne comptent qu'une fois", () => {
    const ex = parsed(AUG);
    const twice = [...ex, ...ex].flatMap((e) => extractToFacts(e, { client_id: "c1", period: AUG, file_id: null, file_name: e.file! }));
    expect(readFacts(twice).gross_sales).toBe(1200);
    const bb = ex.find((e) => e.file === "FA-TEST0001-details-abc (1).csv")!;
    expect(sourceDoc(bb, bb.file!)).toBe("bigblue_FA-TEST0001");
    expect(sourceDoc(ex[0], ex[0].file!)).toBe("Total sales over time");
  });
});

describe("transactions bancaires brutes", () => {
  const txs = pennylaneTransactions(F.PENNYLANE)!;
  it("toutes les lignes, sans catégorie ni conversion, clé stable", () => {
    expect(txs.length).toBe(12);
    expect(txs.find((t) => t.date === "2026-08-27")).toMatchObject({ amount: -10, counterparty: "Snap Group Limited" });
    const again = pennylaneTransactions(F.PENNYLANE)!;
    expect(again.map((t) => t.dedup)).toEqual(txs.map((t) => t.dedup));
    expect(new Set(bankRows(txs, { client_id: "c1", source: "pennylane_file", file_id: null }).map((r) => r.dedup_key)).size).toBe(12);
  });
  it("classement à la lecture : une nouvelle règle reclasse sans relire le fichier", () => {
    const rows = bankRows(txs, { client_id: "c1", source: "pennylane_file", file_id: null });
    const before = readBankMonth(rows, AUG);
    expect(before.debitsByCat.ads).toBe(310);
    expect(before.netFlow).toBe(-1700);
    const after = readBankMonth(rows, AUG, [{ match: "paypal", category: "ads" }]);
    expect(after.debitsByCat.ads).toBe(610);
  });
  it("un fichier qui n'est pas un relevé Pennylane → null", () => {
    expect(pennylaneTransactions(F.TOTAL_SALES)).toBeNull();
  });
});

// Garde le type importé utilisé (vérification de compilation).
export type _E = ParsedExtract;
