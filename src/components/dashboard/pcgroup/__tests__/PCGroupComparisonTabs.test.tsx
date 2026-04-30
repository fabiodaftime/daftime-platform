import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PCGroupAgencyTab } from "../PCGroupAgencyTab";
import { PCGroupStructuringTab } from "../PCGroupStructuringTab";
import { PCGroupDigitTab } from "../PCGroupDigitTab";
import { PCGroupHoldingTab } from "../PCGroupHoldingTab";
import { getMonthData, EMPTY_ENTITY_ROUTES, type PCGroupMonthData } from "../PCGroupData";

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

const getComparisonTable = (titleMatcher: RegExp): HTMLTableElement => {
  const heading = screen.getByText(titleMatcher);
  // section -> section-header (parent of heading) -> section (grandparent) -> contains body+table
  const section = heading.closest(".pcg-section") as HTMLElement;
  expect(section).not.toBeNull();
  const table = section.querySelector("table.pcg-comparison-table") as HTMLTableElement;
  expect(table).not.toBeNull();
  return table;
};

const getHeaderCells = (table: HTMLTableElement) =>
  Array.from(table.querySelectorAll("thead th")).map((th) => th.textContent?.trim() ?? "");

const getBodyRows = (table: HTMLTableElement) =>
  Array.from(table.querySelectorAll("tbody tr")).map((tr) =>
    Array.from(tr.querySelectorAll("td"))
  );

describe("PCGroup comparison tables — March view (hasMar = true)", () => {
  const mar = getMonthData("mar-2026");

  describe("PCGroupAgencyTab", () => {
    it("renders Mars and YTD columns + variation labelled (Fév→Mars) at index 4", () => {
      renderWithRouter(
        <PCGroupAgencyTab data={mar} entityRoutes={EMPTY_ENTITY_ROUTES} />
      );
      const table = getComparisonTable(/Comparatif Janvier \/ Février \/ Mars/);
      const headers = getHeaderCells(table);

      expect(headers).toEqual([
        "Indicateur",
        "Janvier",
        "Février",
        "Mars",
        "Variation (Fév→Mars)",
        "YTD",
      ]);

      const rows = getBodyRows(table);
      expect(rows.length).toBe(mar.agencyComparison!.length);

      // Variation cell must be at index 4 (3 + 1 because hasMar) and carry pcg-var-* class
      rows.forEach((cells, i) => {
        const expected = mar.agencyComparison![i];
        expect(cells[3].textContent).toBe(expected.mar);
        expect(cells[4].textContent).toBe(expected.variation);
        expect(cells[4].className).toContain(`pcg-var-${expected.varType}`);
        expect(cells[5].textContent).toBe(expected.ytd);
      });
    });
  });

  describe("PCGroupStructuringTab", () => {
    it("renders Mars/YTD columns and variation index = 4", () => {
      renderWithRouter(
        <PCGroupStructuringTab data={mar} entityRoutes={EMPTY_ENTITY_ROUTES} />
      );
      const table = getComparisonTable(/Comparatif Janvier \/ Février \/ Mars/);
      expect(getHeaderCells(table)).toEqual([
        "Indicateur",
        "Janvier",
        "Février",
        "Mars",
        "Variation (Fév→Mars)",
        "YTD",
      ]);
      const rows = getBodyRows(table);
      rows.forEach((cells, i) => {
        const expected = mar.structuringComparison![i];
        expect(cells[3].textContent).toBe(expected.mar);
        expect(cells[4].className).toContain(`pcg-var-${expected.varType}`);
        expect(cells[4].textContent).toBe(expected.variation);
        expect(cells[5].textContent).toBe(expected.ytd);
      });
    });
  });

  describe("PCGroupDigitTab", () => {
    it("renders Mars/YTD columns and variation index = 4", () => {
      renderWithRouter(
        <PCGroupDigitTab data={mar} entityRoutes={EMPTY_ENTITY_ROUTES} />
      );
      const table = getComparisonTable(/Comparatif Janvier \/ Février \/ Mars/);
      expect(getHeaderCells(table)).toEqual([
        "Indicateur",
        "Janvier",
        "Février",
        "Mars",
        "Variation (Fév→Mars)",
        "YTD",
      ]);
      const rows = getBodyRows(table);
      rows.forEach((cells, i) => {
        const expected = mar.digitComparison![i];
        expect(cells[3].textContent).toBe(expected.mar);
        expect(cells[4].textContent).toBe(expected.variation);
        expect(cells[4].className).toContain(`pcg-var-${expected.varType}`);
        expect(cells[5].textContent).toBe(expected.ytd);
      });
    });
  });

  describe("PCGroupHoldingTab", () => {
    it("renders Mars/YTD columns with Holding-specific title and variation index = 4", () => {
      renderWithRouter(<PCGroupHoldingTab data={mar} />);
      const table = getComparisonTable(/Comparatif Janvier \/ Février \/ Mars Holding/);
      expect(getHeaderCells(table)).toEqual([
        "Indicateur",
        "Janvier",
        "Février",
        "Mars",
        "Variation (Fév→Mars)",
        "YTD",
      ]);
      const rows = getBodyRows(table);
      rows.forEach((cells, i) => {
        const expected = mar.holdingComparison![i];
        expect(cells[3].textContent).toBe(expected.mar);
        expect(cells[4].textContent).toBe(expected.variation);
        expect(cells[4].className).toContain(`pcg-var-${expected.varType}`);
        expect(cells[5].textContent).toBe(expected.ytd);
      });
    });
  });
});

describe("PCGroup comparison tables — February view (hasMar = false)", () => {
  const feb = getMonthData("feb-2026");

  it("Agency: no Mars column, variation stays at index 3", () => {
    renderWithRouter(
      <PCGroupAgencyTab data={feb} entityRoutes={EMPTY_ENTITY_ROUTES} />
    );
    const table = getComparisonTable(/Comparatif M-1/);
    const headers = getHeaderCells(table);
    expect(headers).toEqual(["Indicateur", "Janvier", "Février", "Variation"]);
    expect(headers).not.toContain("Mars");

    const rows = getBodyRows(table);
    rows.forEach((cells, i) => {
      const expected = feb.agencyComparison![i];
      expect(cells[3].textContent).toBe(expected.variation);
      expect(cells[3].className).toContain(`pcg-var-${expected.varType}`);
    });
  });

  it("Structuring: no Mars column, variation at index 3", () => {
    renderWithRouter(
      <PCGroupStructuringTab data={feb} entityRoutes={EMPTY_ENTITY_ROUTES} />
    );
    const table = getComparisonTable(/Comparatif M-1/);
    const headers = getHeaderCells(table);
    expect(headers).toEqual(["Indicateur", "Janvier", "Février", "Variation"]);
    const rows = getBodyRows(table);
    rows.forEach((cells, i) => {
      expect(cells[3].className).toContain(
        `pcg-var-${feb.structuringComparison![i].varType}`
      );
    });
  });

  it("Digit: no Mars column, variation at index 3", () => {
    renderWithRouter(
      <PCGroupDigitTab data={feb} entityRoutes={EMPTY_ENTITY_ROUTES} />
    );
    const table = getComparisonTable(/Comparatif M-1/);
    expect(getHeaderCells(table)).toEqual([
      "Indicateur",
      "Janvier",
      "Février",
      "Variation",
    ]);
  });

  it("Holding: no Mars column, variation at index 3", () => {
    renderWithRouter(<PCGroupHoldingTab data={feb} />);
    const table = getComparisonTable(/Comparatif M-1 Holding/);
    expect(getHeaderCells(table)).toEqual([
      "Indicateur",
      "Janvier",
      "Février",
      "Variation",
    ]);
  });
});
