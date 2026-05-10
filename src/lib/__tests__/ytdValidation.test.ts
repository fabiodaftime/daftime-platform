import { describe, it, expect } from "vitest";
import {
  parseAmount,
  isAverageIndicator,
  validateComparisonRows,
} from "@/lib/ytdValidation";
import { getMonthData } from "../PCGroupData";

describe("ytdValidation — parseAmount", () => {
  it("parses currency strings", () => {
    expect(parseAmount("$1,276")).toBe(1276);
    expect(parseAmount("-$11,163")).toBe(-11163);
    expect(parseAmount("$92,208")).toBe(92208);
  });
  it("parses percentages and pts", () => {
    expect(parseAmount("50.4%")).toBe(50.4);
    expect(parseAmount("+25.2pts")).toBe(25.2);
  });
  it("returns null for placeholders", () => {
    expect(parseAmount("—")).toBeNull();
    expect(parseAmount("")).toBeNull();
    expect(parseAmount(undefined)).toBeNull();
  });
  it("handles K/M suffixes", () => {
    expect(parseAmount("$1.5K")).toBe(1500);
    expect(parseAmount("$2M")).toBe(2_000_000);
  });
});

describe("ytdValidation — isAverageIndicator", () => {
  it("flags rates", () => {
    expect(isAverageIndicator("Taux Marge Nette", "50.4%")).toBe(true);
    expect(isAverageIndicator("Taux de Marge", "39.4%")).toBe(true);
  });
  it("flags ticket moyen", () => {
    expect(isAverageIndicator("Ticket Moyen", "$465")).toBe(true);
  });
  it("does not flag CA / Marge", () => {
    expect(isAverageIndicator("CA Brut", "$92,208")).toBe(false);
    expect(isAverageIndicator("Marge Nette", "$58,854")).toBe(false);
  });
});

describe("ytdValidation — validateComparisonRows (additive)", () => {
  it("returns no issues when YTD = jan+feb+mar within tolerance", () => {
    const rows = [
      { indicator: "CA", jan: "$10,000", feb: "$20,000", mar: "$30,000", ytd: "$60,000" },
    ];
    expect(validateComparisonRows(rows, "test")).toEqual([]);
  });

  it("detects additive mismatch", () => {
    const rows = [
      { indicator: "CA", jan: "$10,000", feb: "$20,000", mar: "$30,000", ytd: "$55,000" },
    ];
    const issues = validateComparisonRows(rows, "test");
    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("additive-mismatch");
    expect(issues[0].expected).toBe(60000);
    expect(issues[0].actual).toBe(55000);
  });

  it("does NOT additively check rate indicators", () => {
    const rows = [
      { indicator: "Taux Marge", jan: "10%", feb: "20%", mar: "30%", ytd: "20%" },
    ];
    expect(validateComparisonRows(rows, "test")).toEqual([]);
  });

  it("flags average indicators stored as a naive sum", () => {
    const rows = [
      { indicator: "Taux Marge", jan: "10%", feb: "20%", mar: "30%", ytd: "60%" },
    ];
    const issues = validateComparisonRows(rows, "test");
    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("average-as-sum");
  });
});

describe("ytdValidation — production data", () => {
  it("MAR PCGroup: every additive comparison row sums correctly to YTD", () => {
    const mar = getMonthData("mar-2026");
    const blocks = [
      ["Agency", mar.agencyComparison],
      ["Structuring", mar.structuringComparison],
      ["Digit", mar.digitComparison],
      ["Holding", mar.holdingComparison],
    ] as const;
    for (const [name, rows] of blocks) {
      const issues = validateComparisonRows(rows ?? null, name);
      // Provide actionable failure output if anything breaks.
      expect(issues, JSON.stringify(issues, null, 2)).toEqual([]);
    }
  });

  it("MAR PCGroup: rate / average rows are NOT stored as a simple sum", () => {
    const mar = getMonthData("mar-2026");
    const allRows = [
      ...(mar.agencyComparison ?? []),
      ...(mar.structuringComparison ?? []),
      ...(mar.digitComparison ?? []),
      ...(mar.holdingComparison ?? []),
    ];
    const issues = validateComparisonRows(allRows, "PCGroup-MAR");
    const sumAsAverage = issues.filter((i) => i.kind === "average-as-sum");
    expect(sumAsAverage).toEqual([]);
  });
});
