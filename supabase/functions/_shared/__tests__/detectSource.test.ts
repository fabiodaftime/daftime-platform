// @vitest-environment node
// Reconnaissance au dépôt + grille de couverture.
import { describe, expect, it } from "vitest";
import { coverageGrid, detectSource, monthsOf } from "../detectSource.ts";
import * as F from "./fixtures.ts";

describe("detectSource", () => {
  it("Shopify : rapport nommé, famille, plage du nom de fichier", () => {
    expect(detectSource("Total sales over time - 2026-01-01 - 2026-08-31.csv", F.TOTAL_SALES)).toMatchObject(
      { recognized: true, parser: "shopify", family: "sales", label: "Shopify · Total sales over time", from: "2026-01-01", to: "2026-08-31" });
    expect(detectSource("Cost of goods sold by order - 2026-01-01 - 2026-08-31.csv", F.COGS_BY_ORDER).family).toBe("cogs");
  });
  it("Bigblue / Pennylane : plage lue dans la colonne de date (formats mixtes)", () => {
    expect(detectSource("FA-TEST0001-details-abc.csv", F.BIGBLUE_INVOICE_1)).toMatchObject(
      { recognized: true, family: "logistics", label: "Bigblue · facture", from: "2026-07-31", to: "2026-08-09" });
    expect(detectSource("PENNYLANE_transaction_banking.xlsx", F.PENNYLANE)).toMatchObject(
      { recognized: true, family: "bank", from: "2026-07-31", to: "2026-08-27" });
  });
  it("non reconnu : famille devinée par le nom, lu par l'IA", () => {
    expect(detectSource("Meta ads campagnes août.csv", "Campagne,Montant dépensé\nA,100")).toMatchObject({ recognized: false, family: "ads" });
  });
});

describe("couverture", () => {
  it("mois couverts par plage ; fichier sans date = mois de dépôt", () => {
    expect(monthsOf("2026-06-15", "2026-08-02")).toEqual(["2026-06-01", "2026-07-01", "2026-08-01"]);
    const g = coverageGrid([
      { period: "2026-08-01", detected: { recognized: true, family: "sales", label: "", from: "2026-07-01", to: "2026-08-31" } },
      { period: "2026-08-01", detected: { recognized: false, family: "ads", label: "" } },
      { period: "2026-08-01", detected: null },
    ]);
    expect([...g.sales]).toEqual(["2026-07-01", "2026-08-01"]);
    expect([...g.ads]).toEqual(["2026-08-01"]);
    expect(g.bank.size).toBe(0);
  });
});
