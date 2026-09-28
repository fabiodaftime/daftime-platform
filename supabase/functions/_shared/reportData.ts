// PRÉPARATION DES DONNÉES DU LIVRABLE — module PUR (aucun accès base) partagé par generate-dashboard
// et le banc de rendu local : sections du mois (+ variations), historique, indicateurs, cibles,
// répartitions composites, pont d'écarts, 3 points du mois, trésorerie à 13 semaines.

import type { Breakdown, Metric } from "./dashboardRender.ts";
import { averageBase, flatValues, marginBridge, type Bridge } from "./marginBridge.ts";
import { selectMonthPoints, type MonthPoint } from "./monthPoints.ts";
import { buildStandardized, getCatalog } from "./templates.ts";
import type { CashForecast } from "./cashForecast.ts";
import type { PaymentLevers } from "./paymentLevers.ts";

export type Row = { id?: string; label?: string; value?: unknown; unit?: string; type?: string; change_pct?: number };
export type Sec = { label?: string; rows: Row[] };
type Bk = Breakdown;

// Jargon proscrit côté client : jamais affiché dans le livrable.
export const CLIENT_HIDDEN = new Set(["bfr", "bfr_days"]);

const idVal = (d: unknown): Record<string, number> => {
  const m: Record<string, number> = {};
  for (const sec of ((d as { sections?: { rows?: Row[] }[] })?.sections ?? [])) for (const r of (sec.rows ?? [])) if (typeof r.value === "number" && r.id) m[r.id] = r.value;
  return m;
};
const shortMonth = (p: string) => { try { return new Date(p).toLocaleDateString("fr-FR", { month: "short", year: "2-digit", timeZone: "UTC" }); } catch { return p.slice(0, 7); } };
const monthName = (p: string) => { try { return new Date(p).toLocaleDateString("fr-FR", { month: "long", timeZone: "UTC" }); } catch { return p.slice(0, 7); } };
const shiftP = (p: string, k: number) => new Date(Date.UTC(Number(p.slice(0, 4)), Number(p.slice(5, 7)) - 1 + k, 1)).toISOString().slice(0, 10);

export interface ReportInput {
  period: string; currency: string; activityConfig?: unknown;
  sdData: unknown;                                  // standardized_data.data du mois
  history: { period: string; data: unknown }[];     // mois précédents (tous ordres)
  objectives?: Record<string, number>;
}
export interface ReportData {
  sections: Sec[]; metrics: Record<string, Metric>;
  history: { months: string[]; series: Record<string, (number | null)[]>; labels: Record<string, string> };
  breakdowns: Record<string, Bk> | undefined; targets: Record<string, number>;
  curMap: Record<string, number>; prevMap: Record<string, number>;
  bridgePrev: Bridge | null; bridgeAvg: Bridge | null; mainBridge: Bridge | null;
  pointFacts: MonthPoint[]; cashForecast: CashForecast | null; paymentLevers: PaymentLevers | null;
}

export function prepareReport(inp: ReportInput): ReportData {
  const { period, currency } = inp;
  const monthsRaw = [...inp.history].filter((h) => h.period < period).sort((a, b) => (a.period < b.period ? -1 : 1)).slice(-5)
    .map((h) => ({ period: h.period, map: idVal(h.data) }));
  monthsRaw.push({ period, map: idVal(inp.sdData) });
  const prevMap = monthsRaw.length >= 2 ? monthsRaw[monthsRaw.length - 2].map : {};

  // Dérivés du catalogue COURANT (cascade CM, point mort…) recalculés sur chaque mois (valeurs stockées prioritaires).
  const cat = getCatalog(inp.activityConfig);
  if (cat) for (const m of monthsRaw) m.map = { ...flatValues(buildStandardized(cat, m.map, {}, "EUR").data), ...m.map };
  for (const m of monthsRaw) m.map = { ...deriveUnit(m.map), ...m.map };
  const curMap = monthsRaw[monthsRaw.length - 1].map;
  const prevEntry = monthsRaw.find((m) => m.period.slice(0, 7) === shiftP(period, -1).slice(0, 7));
  const bridgePrev = prevEntry ? marginBridge(curMap, prevEntry.map, monthName(prevEntry.period)) : null;
  const prior3 = monthsRaw.filter((m) => m.period < period && m.period >= shiftP(period, -3));
  const avg3 = averageBase(prior3.map((m) => m.map));
  const bridgeAvg = avg3 ? marginBridge(curMap, avg3, "moyenne des 3 mois précédents") : null;
  const mainBridge = bridgePrev ?? bridgeAvg;
  const cashForecast = ((inp.sdData as { cash_forecast?: CashForecast })?.cash_forecast) ?? null;
  const paymentLevers = ((inp.sdData as { payment_levers?: PaymentLevers })?.payment_levers) ?? null;
  const pointFacts = selectMonthPoints(curMap, mainBridge, currency, undefined, cashForecast);

  const breakdowns = (inp.sdData as { breakdowns?: Record<string, Bk> })?.breakdowns
    ? JSON.parse(JSON.stringify((inp.sdData as { breakdowns: Record<string, Bk> }).breakdowns)) as Record<string, Bk> : undefined;
  if (breakdowns) deriveComposites(breakdowns);

  const sections: Sec[] = (((inp.sdData as { sections?: unknown[] })?.sections ?? []) as { label?: string; rows?: Row[] }[]).map((s) => ({
    label: s.label,
    rows: (s.rows ?? []).filter((r) => !CLIENT_HIDDEN.has(r.id ?? "")).map((r) => {
      const row: Row = { id: r.id, label: r.label, value: r.value, unit: r.unit, ...(r.type === "total" ? { type: "total" } : {}) };
      const pv = r.id ? prevMap[r.id] : undefined;
      if (typeof r.value === "number" && typeof pv === "number" && pv !== 0) row.change_pct = Math.round(((r.value - pv) / Math.abs(pv)) * 1000) / 10;
      return row;
    }),
  }));
  // Cascade de marges absente de la donnée stockée (mois standardisé avant la cascade) → ajoutée depuis le recalcul.
  if (cat) {
    const have = new Set(sections.flatMap((s) => s.rows.map((r) => r.id)));
    const pm = prevEntry?.map ?? {};
    const add: Row[] = cat.lines.filter((l) => l.section === "cascade" && !have.has(l.id) && typeof curMap[l.id] === "number").map((l) => {
      const v = curMap[l.id], pv = pm[l.id];
      return { id: l.id, label: l.label, value: v, unit: l.unit === "CUR" ? currency : (l.unit ?? ""),
        ...(l.total ? { type: "total" } : {}), ...(typeof pv === "number" && pv !== 0 ? { change_pct: Math.round(((v - pv) / Math.abs(pv)) * 1000) / 10 } : {}) };
    });
    if (add.length) sections.unshift({ label: "Cascade de marges", rows: add });
  }
  // Indicateurs DÉRIVÉS (par commande, écart brut → net, coûts variables / fixes) : ajoutés s'ils manquent.
  {
    const have = new Set(sections.flatMap((s) => s.rows.map((r) => r.id)));
    const pm = prevEntry?.map ?? {};
    const add: Row[] = DERIVED.filter((x) => !have.has(x.id) && typeof curMap[x.id] === "number").map((x) => {
      const v = curMap[x.id], pv = pm[x.id];
      return { id: x.id, label: x.label, value: v, unit: x.unit === "CUR" ? currency : x.unit,
        ...(typeof pv === "number" && pv !== 0 ? { change_pct: Math.round(((v - pv) / Math.abs(pv)) * 1000) / 10 } : {}) };
    });
    if (add.length) sections.push({ label: "Par commande & structure de coûts", rows: add });
  }

  const labels: Record<string, string> = {};
  for (const s of sections) for (const r of s.rows) if (r.id) labels[r.id] = r.label ?? r.id;
  const series: Record<string, (number | null)[]> = {};
  for (const id of Object.keys(labels)) {
    const arr = monthsRaw.map((m) => (typeof m.map[id] === "number" ? m.map[id] : null));
    if (arr.some((x) => x != null)) series[id] = arr;
  }
  const history = { months: monthsRaw.map((m) => shortMonth(m.period)), series, labels };

  // Cibles des jauges : objectifs du contexte, sinon le mois précédent.
  const targets: Record<string, number> = {};
  for (const id of Object.keys(labels)) { const t = inp.objectives?.[id] ?? (typeof prevMap[id] === "number" ? prevMap[id] : undefined); if (typeof t === "number" && isFinite(t) && t > 0) targets[id] = t; }

  const metrics: Record<string, Metric> = {};
  for (const s of sections) for (const r of s.rows) if (typeof r.value === "number" && r.id) metrics[r.id] = { value: r.value, label: r.label ?? r.id, unit: r.unit ?? "", change_pct: r.change_pct ?? null };

  return { sections, metrics, history, breakdowns, targets, curMap, prevMap, bridgePrev, bridgeAvg, mainBridge, pointFacts, cashForecast, paymentLevers };
}

// Indicateurs dérivés au rendu, sur chaque mois (valeurs stockées prioritaires). Coûts variables = CA − CM3
// (produit + logistique/paiement + pub : tout ce qui bouge avec les ventes) ; charges fixes = CM3 − EBITDA.
export const DERIVED: { id: string; label: string; unit: string }[] = [
  { id: "cm3_per_order", label: "Marge après pub (CM3) par commande", unit: "CUR" },
  { id: "logistics_per_order", label: "Logistique par commande", unit: "CUR" },
  { id: "discounts", label: "Remises", unit: "CUR" },
  { id: "variable_costs", label: "Coûts variables (produit, logistique, pub)", unit: "CUR" },
  { id: "fixed_costs", label: "Charges fixes", unit: "CUR" },
];
export function deriveUnit(m: Record<string, number>): Record<string, number> {
  const o: Record<string, number> = {};
  const n = (k: string) => (typeof m[k] === "number" && isFinite(m[k]) ? m[k] : null);
  const r2 = (x: number) => Math.round(x * 100) / 100;
  const orders = n("orders"), ca = n("ca"), cm3 = n("cm3"), ship = n("shipping_cost"), gross = n("gross_sales"), refunds = n("refunds"), ebitda = n("ebitda");
  if (orders && orders > 0) {
    if (cm3 != null) o.cm3_per_order = r2(cm3 / orders);
    if (ship != null) o.logistics_per_order = r2(ship / orders);
  }
  // Remises implicites : brut − retours − net (seulement si l'écart est cohérent : positif et < 50 % du brut).
  if (gross != null && ca != null && gross > 0) { const disc = gross - (refunds ?? 0) - ca; if (disc > gross * 0.005 && disc < gross * 0.5) o.discounts = r2(disc); }
  if (ca != null && cm3 != null) o.variable_costs = r2(ca - cm3);
  if (cm3 != null && ebitda != null && cm3 - ebitda > 0) o.fixed_costs = r2(cm3 - ebitda);
  return o;
}

// Répartitions MULTI-COLONNES dérivées (performance par canal / par catégorie), calculées au rendu.
function deriveComposites(breakdowns: Record<string, Bk>) {
  const mp = (k: string): Record<string, number> => { const o: Record<string, number> = {}; for (const r of breakdowns[k]?.rows ?? []) o[r.label] = r.value; return o; };
  const r1 = (n: number) => Math.round(n * 10) / 10, r2 = (n: number) => Math.round(n * 100) / 100;
  if (breakdowns.sales_by_channel && !breakdowns.channel_performance) {
    const ca = mp("sales_by_channel"); const labels = Object.keys(ca);
    if (labels.length) {
      const commission = mp("commissions_by_channel"), margin = mp("margin_by_channel"), orders = mp("orders_by_channel");
      const hasCom = Object.keys(commission).length > 0, hasMar = Object.keys(margin).length > 0, hasOrd = Object.keys(orders).length > 0;
      const totalCA = labels.reduce((s, l) => s + (ca[l] || 0), 0) || 1;
      const rows = labels.map((l) => {
        const values: Record<string, number> = { ca: ca[l], share_ca: r1((ca[l] / totalCA) * 100) };
        if (hasOrd) { values.orders = orders[l]; if (orders[l]) values.aov = r2(ca[l] / orders[l]); }
        if (hasCom) { values.commission = commission[l]; if (ca[l]) values.commission_rate = r1((commission[l] / ca[l]) * 100); }
        if (hasMar) { values.marge_contributive = margin[l]; if (ca[l]) values.taux_marge_contributive = r1((margin[l] / ca[l]) * 100); }
        return { label: l, value: hasMar ? margin[l] : ca[l], values };
      });
      const columns: { key: string; label: string; unit: string; emphasis?: boolean; sort?: boolean }[] = [{ key: "ca", label: "CA", unit: "CUR", emphasis: true }, { key: "share_ca", label: "% CA", unit: "%" }];
      if (hasOrd) columns.push({ key: "orders", label: "Cmd", unit: "" }, { key: "aov", label: "Panier", unit: "CUR" });
      if (hasCom) columns.push({ key: "commission", label: "Commission", unit: "CUR" }, { key: "commission_rate", label: "Taux comm.", unit: "%" });
      if (hasMar) columns.push({ key: "marge_contributive", label: "Marge contrib.", unit: "CUR", sort: true }, { key: "taux_marge_contributive", label: "Taux MC", unit: "%" });
      else columns[0].sort = true;
      breakdowns.channel_performance = { label: "Performance par canal", rows, columns: columns as Breakdown["columns"], total_row: true };
    }
  }
  if (breakdowns.sales_by_category && !breakdowns.category_performance) {
    const ca = mp("sales_by_category"); const labels = Object.keys(ca);
    if (labels.length) {
      const marge = mp("margin_by_category"); const hasMar = Object.keys(marge).length > 0;
      const totalCA = labels.reduce((s, l) => s + (ca[l] || 0), 0) || 1;
      const rows = labels.map((l) => {
        const values: Record<string, number> = { ca: ca[l], share_ca: r1((ca[l] / totalCA) * 100) };
        if (hasMar) { values.marge = marge[l]; if (ca[l]) values.taux_marge = r1((marge[l] / ca[l]) * 100); }
        return { label: l, value: hasMar ? marge[l] : ca[l], values };
      });
      const columns: { key: string; label: string; unit: string; emphasis?: boolean; sort?: boolean }[] = [{ key: "ca", label: "CA", unit: "CUR", emphasis: true }, { key: "share_ca", label: "% CA", unit: "%" }];
      if (hasMar) columns.push({ key: "marge", label: "Marge", unit: "CUR", sort: true }, { key: "taux_marge", label: "Taux marge", unit: "%" });
      else columns[0].sort = true;
      breakdowns.category_performance = { label: "Performance par catégorie", rows, columns: columns as Breakdown["columns"], total_row: true };
    }
  }
}
