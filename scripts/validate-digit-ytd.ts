#!/usr/bin/env tsx
/**
 * CI gate: runs validateAllDigitYTD and exits 1 if any additive or average
 * YTD indicator is off, blocking the deployment pipeline.
 *
 * Usage: tsx scripts/validate-digit-ytd.ts
 */
import {
  validateAllDigitYTD,
  formatIssue,
} from "../src/components/dashboard/digit/digitYTDValidation";

const issues = validateAllDigitYTD();

if (issues.length === 0) {
  console.log("✅ Digit YTD validation: all additive and average indicators OK.");
  process.exit(0);
}

const additive = issues.filter((i) => i.kind === "additive");
const averages = issues.filter((i) => i.kind === "average");

console.error("❌ Digit YTD validation FAILED — deployment blocked.\n");
console.error(
  `Found ${issues.length} issue(s): ${additive.length} additive, ${averages.length} average.\n`,
);

if (additive.length > 0) {
  console.error("— Additive YTD mismatches (YTD ≠ Σ months) —");
  for (const i of additive) console.error("  • " + formatIssue(i));
  console.error("");
}
if (averages.length > 0) {
  console.error("— Average YTD formula mismatches —");
  for (const i of averages) console.error("  • " + formatIssue(i));
  console.error("");
}

process.exit(1);
