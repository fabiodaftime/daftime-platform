// MISE EN PAGE DU LIVRABLE (doctrine) — module PUR. Structure FIXE, dans l'ordre de raisonnement :
//   1. Le mois        : les 3 points · marge après pub, pub vs point mort, CA, trésorerie · cascade CM · pont d'écarts · tendance
//   2. Acquisition    : dépense, MER vs point mort, nouveaux vs récurrents, plateformes, entonnoir
//   3. Produits & retours : marge produit, retours, meilleurs / pires produits, pays
//   4. Trésorerie     : 13 semaines, évolution, détail
//   5. Les chiffres   : tables complètes (pour qui veut vérifier)
// L'IA n'intervient PAS sur la structure (elle écrit les textes) → même lecture chaque mois, pour chaque
// client, et aucun graphe vide : chaque widget n'est posé que si sa donnée existe.

import type { DashPlan, Widget } from "./dashboardRender.ts";
import type { ReportData } from "./reportData.ts";

export const REPORT_PAGES = ["Le mois", "Acquisition", "Produits & retours", "Trésorerie", "Les chiffres"] as const;

// Le livrable doctrinal s'applique dès que la cascade de marges existe (e-commerce, marketplaces…).
export const hasCascade = (d: ReportData) => ["ca", "cm1"].every((k) => d.metrics[k]?.value != null);

export function buildReportPlan(d: ReportData, forced: Widget[] = []): DashPlan {
  const has = (id: string) => d.metrics[id]?.value != null;
  const pick = (...ids: string[]) => ids.filter(has);
  const months = d.history.months.length;
  const trend = (id: string) => months >= 3 && (d.history.series[id] ?? []).filter((x) => x != null).length >= 3;
  const bk = (...keys: string[]) => keys.find((k) => d.breakdowns?.[k]?.rows?.length);
  const kpis = (...ids: string[]): Widget | null => { const m = pick(...ids).slice(0, 5); return m.length ? { type: "kpi_row", items: m.map((metric) => ({ metric })) } : null; };
  const W = (w: Widget | null | false | undefined | "") => (w ? [w] : []);
  const pages: DashPlan["pages"] = [];

  // 1. LE MOIS
  const cmChain = pick("ca", "cm1", "cm2", "cm3");
  pages.push({ key: "mois", title: REPORT_PAGES[0], widgets: [
    { type: "points", title: "Les 3 points du mois" },
    ...W(kpis("cm3", "cm3_rate", "mer", "ca", "cash_end")),
    ...W(cmChain.length >= 3 && { type: "waterfall", title: "Du CA à la marge après pub", metrics: cmChain }),
    ...W(d.mainBridge && { type: "bridge" }),
    ...W(trend("ca") && trend("cm3_rate") && { type: "combo", title: "CA et marge après pub (%) — 6 derniers mois", metrics: ["ca"], line: "cm3_rate" }),
    ...W(trend("ca") && !trend("cm3_rate") && { type: "line", title: "CA — 6 derniers mois", metrics: ["ca"] }),
  ] });

  // 2. ACQUISITION
  const acq: Widget[] = [
    ...W(kpis("ads_total", "mer", "breakeven_roas", "new_customers", "aov")),
    ...W(trend("ads_total") && trend("mer") && { type: "combo", title: "Dépense pub et MER", metrics: ["ads_total"], line: "mer" }),
    ...W(pick("new_customers", "returning_customers").length === 2 && { type: "bar", title: "Nouveaux vs récurrents", metrics: ["new_customers", "returning_customers"] }),
    ...W(bk("ads_by_platform") && { type: "ranking", title: "Dépense par plateforme", breakdown: bk("ads_by_platform") }),
    ...W(pick("sessions", "add_to_carts", "orders").length >= 2 && { type: "funnel", title: "Des visites aux commandes", metrics: pick("sessions", "add_to_carts", "orders") }),
  ];
  if (acq.length >= 2) pages.push({ key: "acquisition", title: REPORT_PAGES[1], widgets: acq });

  // 3. PRODUITS & RETOURS
  const prodBk = bk("category_performance", "channel_performance");
  const rankBk = bk("product_margin_period", "top_products");
  const prod: Widget[] = [
    ...W(kpis("cm1_rate", "refund_rate", "refunds", "aov", "units")),
    ...W(prodBk && { type: "matrix_table", title: d.breakdowns?.[prodBk]?.label, breakdown: prodBk, highlight: "both", total_row: true }),
    ...W(!prodBk && rankBk && { type: "ranking", title: d.breakdowns?.[rankBk]?.label, breakdown: rankBk }),
    ...W(bk("returns_by_reason") && { type: "ranking", title: "Retours par motif", breakdown: "returns_by_reason" }),
    ...W(trend("refund_rate") && { type: "line", title: "Taux de retour — 6 derniers mois", metrics: ["refund_rate"] }),
    ...W(bk("sales_by_country") && { type: "map", title: "Ventes par pays", breakdown: "sales_by_country" }),
  ];
  if (prod.length >= 2) pages.push({ key: "produits", title: REPORT_PAGES[2], widgets: prod });

  // 4. TRÉSORERIE
  const cash: Widget[] = [
    ...W(kpis("cash_end", "cash_variation", "cash_start", "inventory_value")),
    ...W(d.cashForecast && { type: "cash_forecast" }),
    ...W(trend("cash_end") && { type: "line", title: "Trésorerie de fin de mois", metrics: ["cash_end"] }),
  ];
  if (cash.length >= 2) pages.push({ key: "tresorerie", title: REPORT_PAGES[3], widgets: cash });

  // 5. LES CHIFFRES : une table par section (vérification, export).
  const tables: Widget[] = d.sections.filter((s) => s.rows.some((r) => typeof r.value === "number"))
    .map((s) => ({ type: "table", title: s.label, metrics: s.rows.map((r) => r.id!).filter(Boolean) }));
  if (tables.length) pages.push({ key: "chiffres", title: REPORT_PAGES[4], widgets: tables });

  // Graphiques OBLIGATOIRES du client : ajoutés à la page qui leur correspond (sinon « Le mois »), SAUF s'ils
  // n'apportent rien de nouveau (indicateurs déjà en tuile / répartition déjà montrée) → pas de doublon.
  const shownIds = new Set(pages.filter((p) => p.key !== "chiffres").flatMap((p) => p.widgets.flatMap((w) => [...(w.items?.map((i) => i.metric) ?? []), ...(w.metrics ?? []), ...(w.line ? [w.line] : [])])));
  const shownBk = new Set(pages.flatMap((p) => p.widgets.map((w) => w.breakdown).filter(Boolean)));
  for (const w of forced) {
    const ids = [...(w.items?.map((i) => i.metric) ?? []), ...(w.metrics ?? [])];
    if (w.breakdown ? shownBk.has(w.breakdown) : ids.length > 0 && ids.every((id) => shownIds.has(id))) continue;
    if (w.breakdown && !d.breakdowns?.[w.breakdown]?.rows?.length) continue;
    if (!w.breakdown && !ids.some(has)) continue;
    const target = /map|country|pays/i.test(`${w.type} ${w.breakdown ?? ""}`) ? pages.find((p) => p.key === "produits")
      : /ads|pub|roas|mer/i.test(`${(w.metrics ?? []).join(" ")} ${w.breakdown ?? ""}`) ? pages.find((p) => p.key === "acquisition")
      : /cash|treso/i.test(`${(w.metrics ?? []).join(" ")}`) ? pages.find((p) => p.key === "tresorerie") : undefined;
    const sig = (x: Widget) => `${x.type}:${(x.metrics ?? []).join(",")}:${x.breakdown ?? ""}`;
    const dest = target ?? pages[0];
    if (!pages.some((p) => p.widgets.some((x) => sig(x) === sig(w)))) dest.widgets.push(w);
  }
  return { pages };
}
