// @vitest-environment node
// Excel → CSV normalisé : l'en-tête reste en 1re ligne (sinon aucun parser ne reconnaît le fichier),
// dates recalculées depuis le numéro de série (indépendantes du fuseau), nombres bruts.
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { derivedCsvPath, isExcelName, workbookToText } from "../xlsxText.ts";

const toBuf = (wb: XLSX.WorkBook) => new Uint8Array(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
const sheet = (rows: unknown[][]) => {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  // Date Excel : numéro de série 46169 = 27/05/2026, format date.
  ws.A2 = { t: "n", v: 46169, z: "dd/mm/yyyy" };
  return ws;
};

describe("workbookToText", () => {
  it("mono-feuille : CSV direct, date ISO depuis le numéro de série, nombres bruts", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet([["Date", "Wording", "Amount"], [null, "Snap, Inc", -273.55]]), "Transactions");
    const txt = workbookToText(XLSX, toBuf(wb));
    expect(txt.split("\n")[0]).toBe("Date,Wording,Amount");
    expect(txt.split("\n")[1]).toBe('2026-05-27,"Snap, Inc",-273.55');
  });
  it("multi-feuilles : blocs « # Feuille: »", () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet([["Date", "A"], [null, 1]]), "Un");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["B"], [2]]), "Deux");
    const txt = workbookToText(XLSX, toBuf(wb));
    expect(txt).toMatch(/# Feuille: Un/);
    expect(txt).toMatch(/# Feuille: Deux/);
  });
});

describe("chemin du CSV préparé", () => {
  it("lié au client, à l'id et à la date de mise à jour", () => {
    expect(derivedCsvPath({ id: "f1", storage_path: "c1/x.xlsx", updated_at: "2026-09-01T00:00:00Z" }))
      .toBe(`c1/_derived/f1-${Date.parse("2026-09-01T00:00:00Z")}.csv`);
    expect(derivedCsvPath({ id: "f1", storage_path: "" })).toBeNull();
    expect(isExcelName("a.XLSX")).toBe(true);
    expect(isExcelName("a.csv")).toBe(false);
  });
});
