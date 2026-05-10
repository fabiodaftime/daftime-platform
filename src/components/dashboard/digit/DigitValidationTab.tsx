import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  validateAllDigitYTD,
  formatIssue,
  type YTDValidationIssue,
} from "./digitYTDValidation";
import { DIGIT_AVAILABLE_MONTHS, type DigitMonthId } from "./DigitData";

const fmtNumber = (n: number, kind: "additive" | "average", indicator: string) => {
  if (kind === "average" && /Taux/i.test(indicator)) return n.toFixed(2) + " %";
  if (/Deals/i.test(indicator)) return Math.round(n).toLocaleString();
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

export function DigitValidationTab() {
  const allIssues = useMemo(() => validateAllDigitYTD(), []);
  const [openIssue, setOpenIssue] = useState<YTDValidationIssue | null>(null);

  // Group by month, preserving DIGIT_AVAILABLE_MONTHS order
  const byMonth = useMemo(() => {
    const map = new Map<DigitMonthId, YTDValidationIssue[]>();
    for (const m of DIGIT_AVAILABLE_MONTHS) map.set(m.id, []);
    for (const iss of allIssues) map.get(iss.month)?.push(iss);
    return map;
  }, [allIssues]);

  const totalIssues = allIssues.length;
  const additiveCount = allIssues.filter((i) => i.kind === "additive").length;
  const averageCount = allIssues.filter((i) => i.kind === "average").length;

  return (
    <div>
      <h2 className="digit-section-title">Validation YTD — Contrôle continu</h2>

      {/* Summary header */}
      <div
        className="digit-kpi-grid"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
      >
        <div
          className="digit-metric-card"
          style={{
            borderLeftColor: totalIssues === 0 ? "#16a34a" : "#d97706",
          }}
        >
          <div className="digit-metric-label">État global</div>
          <div className="digit-metric-value" style={{ color: totalIssues === 0 ? "#16a34a" : "#b45309" }}>
            {totalIssues === 0 ? "OK" : `${totalIssues} écart${totalIssues > 1 ? "s" : ""}`}
          </div>
          <div className="digit-metric-sub">
            {totalIssues === 0
              ? "Tous les YTD sont cohérents"
              : "Cliquer un indicateur pour voir les lignes sources"}
          </div>
        </div>
        <div className="digit-metric-card" style={{ borderLeftColor: "#d97706" }}>
          <div className="digit-metric-label">Écarts additifs</div>
          <div className="digit-metric-value">{additiveCount}</div>
          <div className="digit-metric-sub">YTD ≠ Σ mois Jan→courant</div>
        </div>
        <div className="digit-metric-card" style={{ borderLeftColor: "#d97706" }}>
          <div className="digit-metric-label">Écarts de moyenne</div>
          <div className="digit-metric-value">{averageCount}</div>
          <div className="digit-metric-sub">Formule (Marge/CA, CA/Deals) non respectée</div>
        </div>
      </div>

      {/* Per month sections */}
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {DIGIT_AVAILABLE_MONTHS.map((m) => {
          const monthIssues = byMonth.get(m.id) ?? [];
          return (
            <div
              key={m.id}
              className="digit-chart-container"
              style={{ padding: 16 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {monthIssues.length === 0 ? (
                    <CheckCircle2 className="h-5 w-5" style={{ color: "#16a34a" }} />
                  ) : (
                    <AlertTriangle className="h-5 w-5" style={{ color: "#d97706" }} />
                  )}
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{m.label}</h3>
                </div>
                <Badge
                  variant="outline"
                  className={
                    monthIssues.length === 0
                      ? "border-green-400 text-green-700"
                      : "border-amber-400 text-amber-800"
                  }
                >
                  {monthIssues.length === 0
                    ? "OK"
                    : `${monthIssues.length} écart${monthIssues.length > 1 ? "s" : ""}`}
                </Badge>
              </div>

              {monthIssues.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: "#536471" }}>
                  Tous les indicateurs YTD correspondent à la somme/agrégation Jan→{m.label}.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                        <th style={{ padding: "8px 12px", fontWeight: 600 }}>Indicateur</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600 }}>Type</th>
                        <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>
                          Attendu
                        </th>
                        <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>
                          Obtenu
                        </th>
                        <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>
                          Écart
                        </th>
                        <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthIssues.map((iss, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "10px 12px", fontWeight: 600 }}>{iss.indicator}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <Badge
                              variant="outline"
                              className={
                                iss.kind === "additive"
                                  ? "border-blue-400 text-blue-700"
                                  : "border-purple-400 text-purple-700"
                              }
                            >
                              {iss.kind}
                            </Badge>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace" }}>
                            {fmtNumber(iss.expected, iss.kind, iss.indicator)}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace" }}>
                            {fmtNumber(iss.actual, iss.kind, iss.indicator)}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              textAlign: "right",
                              fontFamily: "monospace",
                              fontWeight: 700,
                              color: iss.delta >= 0 ? "#b45309" : "#be123c",
                            }}
                          >
                            {iss.delta > 0 ? "+" : ""}
                            {fmtNumber(iss.delta, iss.kind, iss.indicator)}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right" }}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setOpenIssue(iss)}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Lignes sources
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Drawer reused (same look as YTD tab inline panel) */}
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
                    Source : <code>DigitData.ts</code> (objet mensuel correspondant). Pour
                    corriger l'écart : aligner la valeur YTD affichée ou l'une des lignes
                    source ci-dessus.
                  </p>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
