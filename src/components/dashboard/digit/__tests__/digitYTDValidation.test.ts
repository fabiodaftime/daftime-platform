import { describe, it, expect } from "vitest";
import {
  DIGIT_AVAILABLE_MONTHS,
  type DigitMonthId,
} from "../DigitData";
import {
  validateDigitYTDForMonth,
  formatIssue,
} from "../digitYTDValidation";

describe("Digit YTD — validation continue", () => {
  for (const m of DIGIT_AVAILABLE_MONTHS) {
    describe(`${m.label} (${m.id})`, () => {
      const issues = validateDigitYTDForMonth(m.id as DigitMonthId);
      const additive = issues.filter((i) => i.kind === "additive");
      const averages = issues.filter((i) => i.kind === "average");

      it("YTD additifs = somme Jan→mois courant", () => {
        if (additive.length > 0) {
          // eslint-disable-next-line no-console
          console.error(additive.map(formatIssue).join("\n"));
        }
        expect(additive, additive.map(formatIssue).join("\n")).toEqual([]);
      });

      it("YTD moyennes utilisent la bonne formule (Marge/CA, CA/Deals)", () => {
        if (averages.length > 0) {
          // eslint-disable-next-line no-console
          console.error(averages.map(formatIssue).join("\n"));
        }
        expect(averages, averages.map(formatIssue).join("\n")).toEqual([]);
      });
    });
  }
});
