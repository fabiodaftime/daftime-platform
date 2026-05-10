import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  validateDigitYTDForMonth,
  formatIssue,
  type YTDValidationIssue,
} from "./digitYTDValidation";
import type { DigitMonthId } from "./DigitData";

interface Props {
  month: DigitMonthId;
  /** Open drawer automatically on the first issue when month changes. Default true. */
  autoOpen?: boolean;
}

const fmtNumber = (n: number, kind: "additive" | "average", indicator: string) => {
  if (kind === "average" && /Taux/i.test(indicator)) return n.toFixed(2) + " %";
  if (/Deals/i.test(indicator)) return Math.round(n).toLocaleString();
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

export function DigitYTDValidationPanel({ month, autoOpen = true }: Props) {
  const issues = useMemo(() => validateDigitYTDForMonth(month), [month]);
  const [openIssue, setOpenIssue] = useState<YTDValidationIssue | null>(null);

  // Auto-open on first issue when arriving on the tab / changing month
  useEffect(() => {
    if (autoOpen && issues.length > 0) {
      setOpenIssue(issues[0]);
    } else {
      setOpenIssue(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  if (issues.length === 0) {
    return (
      <Alert className="mb-4 border-green-300 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-700" />
        <AlertTitle className="text-green-800">Validation YTD : OK</AlertTitle>
        <AlertDescription className="text-green-700">
          Tous les indicateurs YTD correspondent à la somme/agrégation des mois importés.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Alert className="mb-4 border-amber-300 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-700" />
        <AlertTitle className="text-amber-900">
          {issues.length} écart{issues.length > 1 ? "s" : ""} de validation YTD détecté{issues.length > 1 ? "s" : ""}
        </AlertTitle>
        <AlertDescription className="text-amber-900">
          <div className="mt-2 space-y-1">
            {issues.map((iss, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setOpenIssue(iss)}
                className="flex w-full items-center justify-between rounded-md border border-amber-200 bg-white px-3 py-2 text-left text-sm hover:bg-amber-100 transition"
              >
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="border-amber-400 text-amber-900">
                    {iss.kind}
                  </Badge>
                  <span className="font-semibold">{iss.indicator}</span>
                  <span className="text-amber-800">
                    écart {iss.delta > 0 ? "+" : ""}
                    {fmtNumber(iss.delta, iss.kind, iss.indicator)}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-amber-700" />
              </button>
            ))}
          </div>
        </AlertDescription>
      </Alert>

      <Sheet open={!!openIssue} onOpenChange={(o) => !o && setOpenIssue(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          {openIssue && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  {openIssue.indicator}
                </SheetTitle>
                <SheetDescription>{formatIssue(openIssue)}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* YTD displayed value mapping */}
                <section>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    Donnée affichée (cible YTD)
                  </h4>
                  <div className="rounded-md border bg-muted/40 p-3 text-sm">
                    <div className="font-mono text-xs text-muted-foreground break-all">
                      {openIssue.ytdSourcePath}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-xs text-muted-foreground">Affiché</div>
                        <div className="font-semibold">
                          {fmtNumber(openIssue.actual, openIssue.kind, openIssue.indicator)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Attendu</div>
                        <div className="font-semibold">
                          {fmtNumber(openIssue.expected, openIssue.kind, openIssue.indicator)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Écart</div>
                        <div
                          className={`font-semibold ${
                            openIssue.delta >= 0 ? "text-amber-700" : "text-rose-700"
                          }`}
                        >
                          {openIssue.delta > 0 ? "+" : ""}
                          {fmtNumber(openIssue.delta, openIssue.kind, openIssue.indicator)}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {openIssue.formula && (
                  <section>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                      Formule attendue
                    </h4>
                    <div className="rounded-md border bg-muted/40 p-3 font-mono text-sm">
                      {openIssue.formula}
                    </div>
                  </section>
                )}

                {/* Source rows breakdown */}
                <section>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                    Lignes source qui composent la valeur YTD
                  </h4>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/60">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Mois</th>
                          <th className="px-3 py-2 text-left font-semibold">Mapping (DigitData)</th>
                          <th className="px-3 py-2 text-left font-semibold">Valeur brute</th>
                          <th className="px-3 py-2 text-right font-semibold">Valeur parsée</th>
                        </tr>
                      </thead>
                      <tbody>
                        {openIssue.breakdown.map((row, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2 font-semibold">{row.monthLabel}</td>
                            <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground break-all">
                              {row.sourcePath}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{row.rawValue}</td>
                            <td className="px-3 py-2 text-right font-mono">
                              {fmtNumber(row.value, "additive", openIssue.indicator)}
                            </td>
                          </tr>
                        ))}
                        {openIssue.kind === "additive" && (
                          <tr className="border-t bg-muted/30 font-semibold">
                            <td className="px-3 py-2" colSpan={3}>
                              Σ Somme attendue
                            </td>
                            <td className="px-3 py-2 text-right font-mono">
                              {fmtNumber(openIssue.expected, "additive", openIssue.indicator)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Les valeurs proviennent de <code>DigitData.ts</code> (objet mensuel correspondant). 
                    Pour corriger l'écart : aligner soit la valeur YTD affichée, soit l'une des lignes source ci-dessus.
                  </p>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
