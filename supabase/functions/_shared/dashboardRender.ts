// Moteur de RENDU multi-pages : PLAN (composé par l'IA) + data VALIDÉE + THÈME.
// Graphes premium via ECharts ; carte choroplèthe pour les breakdowns par pays.
// Les chiffres viennent de la data (zéro hallucination).

import { type Theme, resolveTheme, iconFor, iconSvg } from "./dashboardTheme.ts";

export interface Metric { value: number | null; label: string; unit: string; change_pct?: number | null }
export interface Breakdown { label: string; rows: { label: string; value: number; unit?: string }[] }
export interface RenderCtx {
  client: string; period: string; currency: string;
  brand?: Record<string, any> | null;
  theme?: Theme;
  metrics: Record<string, Metric>;
  history: { months: string[]; series: Record<string, (number | null)[]>; labels: Record<string, string> };
  breakdowns?: Record<string, Breakdown>;
  targets?: Record<string, number>;
}
export interface Widget {
  type:
    | "kpi_row" | "line" | "bar" | "donut" | "waterfall" | "table" | "callout" | "funnel" | "ranking" | "map" | "gauge" | "stacked" | "flow" | "radar" | "treemap" | "calendar"
    // bibliothèque premium étendue (composée par l'IA quand ça s'y prête) :
    | "area" | "stacked_area" | "river" | "combo" | "slope" | "matrix"
    | "rose" | "polar" | "sunburst" | "pictorial" | "lollipop" | "share" | "histogram"
    | "bullet" | "rings" | "gauge_grid" | "diverging" | "comparison" | "trend_grid";
  title?: string; metrics?: string[]; items?: { metric: string }[]; breakdown?: string;
  line?: string; // widget "combo" : id de la métrique tracée en courbe (2e axe)
  rows?: { label: string; value: number | null; unit?: string; type?: string; change_pct?: number | null }[];
  text?: string; tone?: "info" | "warn" | "good";
}
export interface DashPlan { pages: { key?: string; title: string; widgets: Widget[] }[]; theme?: Theme }

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const periodLabel = (p: string) => { try { return new Date(p).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }); } catch { return p; } };

function fmt(value: number | null | undefined, unit = "", currency = "EUR"): string {
  if (value == null || !isFinite(value)) return "n/d";
  if (unit === "%") return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
  if (unit === "x") return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}×`;
  if (unit === "j") return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} j`;
  if (unit === "" || unit == null) return value.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  try { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: unit && unit.length === 3 ? unit : currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} ${unit}`; }
}
const changeHtml = (pct?: number | null) =>
  pct == null ? "" : `<span class="chg ${pct >= 0 ? "up" : "down"}">${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}%</span>`;

// noms FR → EN pour matcher la carte mondiale ECharts (noms anglais).
const COUNTRY_EN: Record<string, string> = {
  "france": "France", "suisse": "Switzerland", "switzerland": "Switzerland", "belgique": "Belgium", "belgium": "Belgium",
  "luxembourg": "Luxembourg", "allemagne": "Germany", "germany": "Germany", "espagne": "Spain", "spain": "Spain",
  "italie": "Italy", "italy": "Italy", "royaume-uni": "United Kingdom", "united kingdom": "United Kingdom",
  "états-unis": "United States", "etats-unis": "United States", "united states": "United States",
  "pays-bas": "Netherlands", "netherlands": "Netherlands", "portugal": "Portugal", "canada": "Canada",
};
const toEN = (n: string) => COUNTRY_EN[n.trim().toLowerCase()] ?? n.trim();

export function renderDashboard(ctx: RenderCtx, plan: DashPlan): string {
  const th = resolveTheme(ctx.brand, ctx.theme ?? plan.theme ?? {});
  const { primary, accent, palette } = th;
  const charts: any[] = [];
  let cid = 0;
  const M = ctx.metrics;
  const has = (id: string) => M[id] && M[id].value != null;
  // "full" = pleine largeur (graphes larges) ; "wide" = 2/3 ; le reste tient en 1/3 pour densifier (4-10 widgets/page).
  const fullTypes = new Set(["kpi_row", "map", "flow", "calendar", "matrix", "river", "table", "trend_grid", "sankey"]);
  const wideTypes = new Set(["funnel", "waterfall", "combo", "stacked_area", "stacked", "comparison", "histogram"]);
  const cellCls = (t: string) => (fullTypes.has(t) ? "full" : wideTypes.has(t) ? "wide" : "half");
  const col = (i: number) => palette[i % palette.length];
  const chCard = (id: string, title: string, cls = "echart") => `<div class="card chartcard"><div class="card-t">${esc(title)}</div><div class="${cls}" id="${id}"></div></div>`;
  const hist = (id: string) => ctx.history.series[id]; // série temporelle d'une métrique (ou undefined)
  const lab = (id: string) => ctx.history.labels[id] ?? M[id]?.label ?? id;
  const hasTarget = (id: string) => has(id) && ctx.targets?.[id] != null && isFinite(ctx.targets[id]) && (ctx.targets[id] as number) > 0;

  const kpiTile = (id: string, i: number): string => {
    const m = M[id]; const c = col(i);
    const sp = ctx.history.series[id] && ctx.history.months.length > 1;
    let spHtml = "";
    if (sp) { const spId = `ch${cid++}`; charts.push({ id: spId, kind: "spark", color: c, data: ctx.history.series[id] }); spHtml = `<div class="spark echart" id="${spId}"></div>`; }
    const foot = `<div class="kpi-foot">${changeHtml(m.change_pct) || '<span class="chg flat">—</span>'}${spHtml}</div>`;
    const main = `<div class="kpi-main"><div class="kpi-l">${esc(m.label)}</div><div class="kpi-v">${esc(fmt(m.value, m.unit, ctx.currency))}</div>${foot}</div>`;
    if (th.kpi === "icon" || th.kpi === "glass") return `<div class="kpi k-icon"><div class="kpi-ic" style="background:${c}1f;color:${c}">${iconSvg(iconFor(id, th.icons[id]), c)}</div>${main}</div>`;
    if (th.kpi === "gradient") return `<div class="kpi k-grad" style="background:linear-gradient(135deg, ${c}14, transparent)"><div class="kpi-bar" style="background:${c}"></div>${main}</div>`;
    if (th.kpi === "plain") return `<div class="kpi k-plain">${main}</div>`;
    return `<div class="kpi k-accent"><div class="kpi-bar" style="background:${c}"></div>${main}</div>`;
  };

  const widgetHtml = (w: Widget): string => {
    switch (w.type) {
      case "kpi_row": {
        const ids = (w.items?.map((i) => i.metric) ?? w.metrics ?? []).filter((id) => has(id)).slice(0, 6);
        if (!ids.length) return "";
        return `<div class="kpis">${ids.map((id, i) => kpiTile(id, i)).join("")}</div>`;
      }
      case "line": {
        const ids = (w.metrics ?? []).filter((id) => ctx.history.series[id]);
        if (!ids.length || ctx.history.months.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "line", labels: ctx.history.months, series: ids.map((mid, i) => ({ name: ctx.history.labels[mid] ?? M[mid]?.label ?? mid, data: ctx.history.series[mid], color: col(i) })) });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Tendance")}</div><div class="echart" id="${id}"></div></div>`;
      }
      case "bar": {
        const ids = (w.metrics ?? []).filter((id) => has(id));
        if (!ids.length) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "bar", labels: ids.map((mid) => M[mid].label), data: ids.map((mid) => M[mid].value), colors: ids.map((mid, i) => (M[mid].value! < 0 ? "#e24b4a" : col(i))) });
        return chCard(id, w.title ?? "Comparaison");
      }
      case "waterfall": {
        // cascade : enchaîne des totaux (ex. CA → marge brute → EBITDA → résultat net) en montrant hausses/baisses
        const ids = (w.metrics ?? []).filter(has);
        if (ids.length < 2) return "";
        const vals = ids.map((mid) => M[mid].value as number);
        const labels = ids.map((mid) => M[mid].label);
        const base: number[] = []; const delta: number[] = []; const colors: string[] = [];
        let prev = 0;
        vals.forEach((v, i) => {
          if (i === 0) { base.push(0); delta.push(v); colors.push(primary); }
          else if (v >= prev) { base.push(prev); delta.push(v - prev); colors.push("#16a34a"); }
          else { base.push(v); delta.push(prev - v); colors.push("#e24b4a"); }
          prev = v;
        });
        const id = `ch${cid++}`;
        charts.push({ id, kind: "waterfall", labels, base, delta, colors, real: vals });
        return chCard(id, w.title ?? "Du chiffre d'affaires au résultat");
      }
      case "donut": {
        const ids = (w.metrics ?? []).filter((id) => has(id) && (M[id].value ?? 0) > 0);
        if (ids.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "pie", items: ids.map((mid, i) => ({ name: M[mid].label, value: M[mid].value, color: col(i) })) });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Répartition")}</div><div class="echart" id="${id}"></div></div>`;
      }
      case "map": {
        const bk = w.breakdown ? ctx.breakdowns?.[w.breakdown] : undefined;
        if (!bk || !bk.rows?.length) return "";
        const id = `ch${cid++}`;
        const items = bk.rows.map((r) => ({ name: toEN(r.label), value: r.value }));
        charts.push({ id, kind: "map", items, color: primary, max: Math.max(...bk.rows.map((r) => r.value)) || 1 });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? bk.label)}</div><div class="echart echart-map" id="${id}"></div></div>`;
      }
      case "ranking": {
        const bk = w.breakdown ? ctx.breakdowns?.[w.breakdown] : undefined;
        if (!bk || !bk.rows?.length) return "";
        const rows = bk.rows.slice(0, 8);
        const max = Math.max(...rows.map((r) => Math.abs(r.value))) || 1;
        const total = rows.reduce((s, r) => s + r.value, 0) || 1;
        return `<div class="card"><div class="card-t">${esc(w.title ?? bk.label)}</div><div class="rank">${rows.map((r, i) => {
          const pct = Math.max(4, Math.round((Math.abs(r.value) / max) * 100));
          const share = Math.round((r.value / total) * 1000) / 10;
          return `<div class="rk-row"><div class="rk-l" title="${esc(r.label)}">${esc(r.label)}</div><div class="rk-track"><div class="rk-bar" style="width:${pct}%;background:${col(i)}"></div></div><div class="rk-v">${esc(fmt(r.value, r.unit ?? "", ctx.currency))} <span class="rk-s">${share}%</span></div></div>`;
        }).join("")}</div></div>`;
      }
      case "table": {
        const rows = (w.rows ?? (w.metrics ?? []).filter(has).map((id) => ({ label: M[id].label, value: M[id].value, unit: M[id].unit, change_pct: M[id].change_pct, type: undefined })));
        if (!rows.length) return "";
        return `<div class="card"><div class="card-t">${esc(w.title ?? "Détail")}</div><table class="tbl"><tbody>${rows.map((r) =>
          `<tr class="${r.type === "total" ? "tot" : ""}"><td>${esc(r.label)}</td><td class="num">${esc(fmt(r.value as number, r.unit, ctx.currency))}</td><td class="num">${changeHtml(r.change_pct)}</td></tr>`).join("")}</tbody></table></div>`;
      }
      case "funnel": {
        const ids = (w.metrics ?? []).filter(has);
        if (ids.length < 2) return "";
        const top = M[ids[0]].value || 0;
        return `<div class="card"><div class="card-t">${esc(w.title ?? "Entonnoir de conversion")}</div><div class="funnel">${
          ids.map((id, i) => {
            const m = M[id]; const val = m.value ?? 0; const c = col(i);
            const w2 = top > 0 ? Math.max(12, Math.round((val / top) * 100)) : 100;
            const prev = i > 0 ? (M[ids[i - 1]].value ?? 0) : 0;
            const conv = i > 0 && prev > 0 ? Math.round((val / prev) * 1000) / 10 : null;
            return `<div class="fn-row">${conv != null ? `<div class="fn-conv">↓ ${conv.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}%</div>` : ""}` +
              `<div class="fn-bar" style="width:${w2}%;background:linear-gradient(90deg,${c},${c}bb)"><span class="fn-l">${esc(m.label)}</span><span class="fn-v">${esc(fmt(val, m.unit, ctx.currency))}</span></div></div>`;
          }).join("")
        }</div></div>`;
      }
      case "gauge": {
        const id = w.metrics?.[0];
        if (!id || !has(id)) return "";
        const target = ctx.targets?.[id];
        if (target == null || !isFinite(target) || target <= 0) return "";
        const m = M[id]; const gid = `ch${cid++}`;
        charts.push({ id: gid, kind: "gauge", value: m.value, target, color: primary, accent, fmt: fmt(m.value, m.unit, ctx.currency), targetFmt: fmt(target, m.unit, ctx.currency) });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? m.label)}</div><div class="echart echart-gauge" id="${gid}"></div></div>`;
      }
      case "stacked": {
        const ids = (w.metrics ?? []).filter((id) => ctx.history.series[id]);
        if (ids.length < 2 || ctx.history.months.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "stackbar", labels: ctx.history.months, series: ids.map((mid, i) => ({ name: ctx.history.labels[mid] ?? M[mid]?.label ?? mid, data: ctx.history.series[mid], color: col(i) })) });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Évolution")}</div><div class="echart" id="${id}"></div></div>`;
      }
      case "flow": {
        const v = (id: string) => (has(id) ? (M[id].value as number) : null);
        const ca = v("ca"), cogs = v("cogs"), marge = v("marge_brute"), opex = v("total_opex"), ebitda = v("ebitda");
        const nodes: { name: string; itemStyle?: { color: string } }[] = []; const links: { source: string; target: string; value: number }[] = [];
        const addN = (n: string) => { if (!nodes.find((x) => x.name === n)) nodes.push({ name: n }); };
        const link = (s: string, t: string, val: number | null) => { if (val && val > 0) { addN(s); addN(t); links.push({ source: s, target: t, value: Math.round(val) }); } };
        if (ca && marge != null) { link("Chiffre d'affaires", "Marge brute", marge); link("Chiffre d'affaires", "Coût des ventes", cogs); }
        if (marge && ebitda != null) { link("Marge brute", "EBITDA", ebitda); link("Marge brute", "Charges", opex); }
        if (links.length < 2) return "";
        nodes.forEach((n, i) => (n.itemStyle = { color: col(i) }));
        const id = `ch${cid++}`;
        charts.push({ id, kind: "sankey", nodes, links });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Du chiffre d'affaires au résultat")}</div><div class="echart echart-map" id="${id}"></div></div>`;
      }
      case "radar": {
        const ids = (w.metrics ?? []).filter(has);
        if (ids.length < 3) return "";
        const id = `ch${cid++}`;
        const prevOf = (mid: string) => { const v = M[mid].value ?? 0; const p = M[mid].change_pct; return p != null && p !== -100 ? v / (1 + p / 100) : v; };
        const indicators = ids.map((mid) => ({ name: M[mid].label, max: Math.max(Math.abs(M[mid].value ?? 0), Math.abs(prevOf(mid))) * 1.25 || 1 }));
        const series: { name: string; value: number[]; color: string }[] = [{ name: "Ce mois", value: ids.map((mid) => M[mid].value ?? 0), color: primary }];
        if (ids.some((mid) => M[mid].change_pct != null)) series.push({ name: "M-1", value: ids.map((mid) => Math.round(prevOf(mid))), color: accent });
        charts.push({ id, kind: "radar", indicators, series });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Profil")}</div><div class="echart" id="${id}"></div></div>`;
      }
      case "treemap": {
        const bk = w.breakdown ? ctx.breakdowns?.[w.breakdown] : undefined;
        if (!bk || bk.rows.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "treemap", items: bk.rows.slice(0, 12).map((r, i) => ({ name: r.label, value: r.value, color: col(i) })) });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? bk.label)}</div><div class="echart" id="${id}"></div></div>`;
      }
      case "calendar": {
        const bk = w.breakdown ? ctx.breakdowns?.[w.breakdown] : undefined;
        if (!bk || !bk.rows.length) return "";
        const data = bk.rows.filter((r) => /^\d{4}-\d{2}-\d{2}/.test(r.label)).map((r) => [r.label.slice(0, 10), r.value]);
        if (!data.length) return "";
        const id = `ch${cid++}`;
        const max = Math.max(...data.map((d) => Math.abs(d[1] as number))) || 1;
        charts.push({ id, kind: "calendar", data, max, range: ctx.period.slice(0, 7) });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? bk.label)}</div><div class="echart echart-cal" id="${id}"></div></div>`;
      }
      // ───── Bibliothèque premium étendue ─────
      case "area": {
        const ids = (w.metrics ?? []).filter(hist);
        if (!ids.length || ctx.history.months.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "area", labels: ctx.history.months, series: ids.slice(0, 4).map((mid, i) => ({ name: lab(mid), data: hist(mid), color: col(i) })) });
        return chCard(id, w.title ?? "Tendance");
      }
      case "stacked_area": {
        const ids = (w.metrics ?? []).filter(hist);
        if (ids.length < 2 || ctx.history.months.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "stackarea", labels: ctx.history.months, series: ids.map((mid, i) => ({ name: lab(mid), data: hist(mid), color: col(i) })) });
        return chCard(id, w.title ?? "Composition dans le temps");
      }
      case "river": {
        const ids = (w.metrics ?? []).filter(hist);
        if (ids.length < 2 || ctx.history.months.length < 3) return "";
        const data: [string, number, string][] = []; const colors: string[] = [];
        ids.forEach((mid, i) => { const nm = lab(mid); colors.push(col(i)); ctx.history.months.forEach((mo, j) => { const v = hist(mid)[j]; data.push([mo, v == null ? 0 : Math.max(0, v), nm]); }); });
        const id = `ch${cid++}`;
        charts.push({ id, kind: "river", data, labels: ctx.history.months, colors });
        return chCard(id, w.title ?? "Flux dans le temps");
      }
      case "combo": {
        const barIds = (w.metrics ?? []).filter(hist);
        const lineId = w.line && hist(w.line) ? w.line : null;
        if (!barIds.length || !lineId || ctx.history.months.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "combo", labels: ctx.history.months, bars: barIds.slice(0, 3).map((mid, i) => ({ name: lab(mid), data: hist(mid), color: col(i) })), line: { name: lab(lineId), data: hist(lineId), color: accent }, lineUnit: M[lineId]?.unit ?? "" });
        return chCard(id, w.title ?? "Évolution combinée");
      }
      case "slope": {
        const ids = (w.metrics ?? []).filter((id) => has(id) && M[id].change_pct != null && M[id].change_pct !== -100);
        if (ids.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "slope", labels: ["M-1", "Ce mois"], series: ids.slice(0, 6).map((mid, i) => ({ name: M[mid].label, color: col(i), data: [100, Math.round(100 * (1 + (M[mid].change_pct as number) / 100))] })) });
        return chCard(id, w.title ?? "Performance indexée (base 100 = M-1)");
      }
      case "matrix": {
        const ids = (w.metrics ?? []).filter(hist);
        if (ids.length < 2 || ctx.history.months.length < 3) return "";
        const rowlabels = ids.map(lab); const collabels = ctx.history.months;
        const data: [number, number, number, number][] = [];
        ids.forEach((mid, r) => { const arr = hist(mid).map((v) => (v == null ? 0 : v)); const mx = Math.max(...arr.map(Math.abs)) || 1; arr.forEach((v, c) => data.push([c, r, Math.round((Math.abs(v) / mx) * 100), v])); });
        const id = `ch${cid++}`;
        charts.push({ id, kind: "matrix", rowlabels, collabels, data });
        return chCard(id, w.title ?? "Carte de chaleur des indicateurs");
      }
      case "rose": {
        const bk = w.breakdown ? ctx.breakdowns?.[w.breakdown] : undefined;
        const rows = bk?.rows.filter((r) => r.value > 0).slice(0, 10) ?? [];
        if (rows.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "rose", items: rows.map((r, i) => ({ name: r.label, value: r.value, color: col(i) })) });
        return chCard(id, w.title ?? bk!.label);
      }
      case "polar": {
        const bk = w.breakdown ? ctx.breakdowns?.[w.breakdown] : undefined;
        const rows = bk?.rows.slice(0, 8) ?? [];
        if (rows.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "polarbar", labels: rows.map((r) => r.label), data: rows.map((r) => Math.abs(r.value)), colors: rows.map((_, i) => col(i)), max: (Math.max(...rows.map((r) => Math.abs(r.value))) || 1) * 1.1 });
        return chCard(id, w.title ?? bk!.label);
      }
      case "sunburst": {
        const bk = w.breakdown ? ctx.breakdowns?.[w.breakdown] : undefined;
        if (!bk || bk.rows.length < 2) return "";
        const sep = /\s*[\/–→>·]\s*|\s-\s/;
        let data: any[];
        if (bk.rows.some((r) => sep.test(r.label))) {
          const groups: Record<string, { name: string; children: any[]; value: number }> = {};
          bk.rows.forEach((r) => { const parts = r.label.split(sep); const p = (parts[0] || "Autre").trim(); const child = (parts.slice(1).join(" ").trim()) || r.label; if (!groups[p]) groups[p] = { name: p, children: [], value: 0 }; groups[p].children.push({ name: child, value: Math.abs(r.value) }); groups[p].value += Math.abs(r.value); });
          data = Object.values(groups).map((g, i) => ({ name: g.name, itemStyle: { color: col(i) }, children: g.children }));
        } else {
          data = bk.rows.slice(0, 12).map((r, i) => ({ name: r.label, value: Math.abs(r.value), itemStyle: { color: col(i) } }));
        }
        const id = `ch${cid++}`;
        charts.push({ id, kind: "sunburst", data });
        return chCard(id, w.title ?? bk.label);
      }
      case "pictorial": {
        const bk = w.breakdown ? ctx.breakdowns?.[w.breakdown] : undefined;
        const rows = bk?.rows.slice(0, 7) ?? [];
        if (rows.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "pictorial", labels: rows.map((r) => r.label), data: rows.map((r) => Math.abs(r.value)), colors: rows.map((_, i) => col(i)), max: (Math.max(...rows.map((r) => Math.abs(r.value))) || 1) * 1.15, fmts: rows.map((r) => fmt(r.value, r.unit ?? "", ctx.currency)) });
        return chCard(id, w.title ?? bk!.label);
      }
      case "lollipop": {
        const bk = w.breakdown ? ctx.breakdowns?.[w.breakdown] : undefined;
        const rows = bk?.rows.slice(0, 8) ?? [];
        if (rows.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "lollipop", labels: rows.map((r) => r.label), data: rows.map((r) => Math.abs(r.value)), colors: rows.map((_, i) => col(i)), max: (Math.max(...rows.map((r) => Math.abs(r.value))) || 1) * 1.15, fmts: rows.map((r) => fmt(r.value, r.unit ?? "", ctx.currency)) });
        return chCard(id, w.title ?? bk!.label);
      }
      case "share": {
        const bk = w.breakdown ? ctx.breakdowns?.[w.breakdown] : undefined;
        const rows = bk?.rows.filter((r) => r.value > 0).slice(0, 8) ?? [];
        if (rows.length < 2) return "";
        const total = rows.reduce((s, r) => s + r.value, 0) || 1;
        const seg = rows.map((r, i) => `<div class="sh-seg" style="width:${((r.value / total) * 100).toFixed(2)}%;background:${col(i)}" title="${esc(r.label)} : ${esc(fmt(r.value, r.unit ?? "", ctx.currency))}"></div>`).join("");
        const leg = rows.map((r, i) => `<div class="sh-li"><span class="sh-dot" style="background:${col(i)}"></span>${esc(r.label)} <b>${((r.value / total) * 100).toFixed(1)}%</b></div>`).join("");
        return `<div class="card"><div class="card-t">${esc(w.title ?? bk!.label)}</div><div class="sh-bar">${seg}</div><div class="sh-leg">${leg}</div></div>`;
      }
      case "histogram": {
        const bk = w.breakdown ? ctx.breakdowns?.[w.breakdown] : undefined;
        const vals = bk ? bk.rows.map((r) => r.value).filter((v) => isFinite(v)) : [];
        if (vals.length < 5) return "";
        const mn = Math.min(...vals), mx = Math.max(...vals);
        if (mx <= mn) return "";
        const nb = Math.min(10, Math.max(5, Math.round(Math.sqrt(vals.length))));
        const wd = (mx - mn) / nb; const counts = new Array(nb).fill(0);
        vals.forEach((v) => { let b = Math.floor((v - mn) / wd); if (b >= nb) b = nb - 1; if (b < 0) b = 0; counts[b]++; });
        const unit = bk!.rows[0]?.unit ?? "";
        const labels = counts.map((_, i) => fmt(Math.round(mn + i * wd), unit, ctx.currency));
        const id = `ch${cid++}`;
        charts.push({ id, kind: "bar", labels, data: counts, colors: counts.map(() => col(0)) });
        return chCard(id, w.title ?? `Distribution — ${bk!.label}`);
      }
      case "bullet": {
        const ids = (w.metrics ?? []).filter(hasTarget);
        if (!ids.length) return "";
        return `<div class="card"><div class="card-t">${esc(w.title ?? "Objectifs")}</div><div class="blt">${ids.slice(0, 6).map((id, i) => {
          const m = M[id]; const t = ctx.targets![id]; const v = m.value ?? 0; const pct = Math.min(100, Math.round((v / t) * 100)); const c = col(i); const ok = v >= t;
          return `<div class="blt-row"><div class="blt-h"><span>${esc(m.label)}</span><span class="blt-vv">${esc(fmt(v, m.unit, ctx.currency))} <span class="blt-pct ${ok ? "ok" : ""}">${pct}%</span></span></div><div class="blt-track"><div class="blt-fill" style="width:${pct}%;background:${c}"></div><div class="blt-tgt" title="cible ${esc(fmt(t, m.unit, ctx.currency))}"></div></div></div>`;
        }).join("")}</div></div>`;
      }
      case "rings": {
        const ids = (w.metrics ?? []).filter(hasTarget).slice(0, 4);
        if (!ids.length) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "rings", rings: ids.map((mid, i) => ({ pct: Math.min(100, Math.round(((M[mid].value ?? 0) / ctx.targets![mid]) * 100)), color: col(i), name: M[mid].label })), center: `${ids.length} obj.` });
        const leg = ids.map((mid, i) => `<div class="sh-li"><span class="sh-dot" style="background:${col(i)}"></span>${esc(M[mid].label)} <b>${Math.round(((M[mid].value ?? 0) / ctx.targets![mid]) * 100)}%</b></div>`).join("");
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Objectifs")}</div><div class="echart echart-gauge" id="${id}"></div><div class="sh-leg">${leg}</div></div>`;
      }
      case "gauge_grid": {
        const ids = (w.metrics ?? []).filter(hasTarget).slice(0, 4);
        if (!ids.length) return "";
        return `<div class="card"><div class="card-t">${esc(w.title ?? "Objectifs")}</div><div class="gg">${ids.map((id, i) => {
          const m = M[id]; const t = ctx.targets![id]; const gid = `ch${cid++}`;
          charts.push({ id: gid, kind: "gauge", value: m.value, target: t, color: col(i), accent, fmt: fmt(m.value, m.unit, ctx.currency), targetFmt: fmt(t, m.unit, ctx.currency) });
          return `<div class="gg-c"><div class="echart echart-gg" id="${gid}"></div><div class="gg-l">${esc(m.label)}</div></div>`;
        }).join("")}</div></div>`;
      }
      case "diverging": {
        const ids = (w.metrics ?? []).filter((id) => has(id) && M[id].change_pct != null).slice(0, 10);
        if (ids.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "diverging", labels: ids.map((mid) => M[mid].label), data: ids.map((mid) => Math.round((M[mid].change_pct as number) * 10) / 10) });
        return chCard(id, w.title ?? "Variation vs M-1");
      }
      case "comparison": {
        const ids = (w.metrics ?? []).filter((id) => has(id) && M[id].change_pct != null && M[id].change_pct !== -100).slice(0, 6);
        if (!ids.length) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "group", labels: ids.map((mid) => M[mid].label), series: [
          { name: "M-1", color: accent, data: ids.map((mid) => Math.round((M[mid].value as number) / (1 + (M[mid].change_pct as number) / 100))) },
          { name: "Ce mois", color: primary, data: ids.map((mid) => M[mid].value) },
        ] });
        return chCard(id, w.title ?? "Ce mois vs M-1");
      }
      case "trend_grid": {
        const ids = (w.metrics ?? []).filter((id) => has(id) && hist(id) && ctx.history.months.length > 1).slice(0, 8);
        if (!ids.length) return "";
        return `<div class="card"><div class="card-t">${esc(w.title ?? "Tendances clés")}</div><div class="tg">${ids.map((id, i) => {
          const m = M[id]; const c = col(i); const spId = `ch${cid++}`;
          charts.push({ id: spId, kind: "spark", color: c, data: hist(id) });
          return `<div class="tg-c"><div class="tg-l">${esc(m.label)}</div><div class="tg-v">${esc(fmt(m.value, m.unit, ctx.currency))}</div><div class="tg-f">${changeHtml(m.change_pct) || '<span class="chg flat">—</span>'}</div><div class="tg-s echart" id="${spId}"></div></div>`;
        }).join("")}</div></div>`;
      }
      case "callout": {
        if (!w.text) return "";
        const tone = w.tone ?? "info";
        const ic = tone === "good" ? "✓" : tone === "warn" ? "!" : "i";
        return `<div class="callout ${tone}"><span class="co-ic">${ic}</span><div>${w.title ? `<div class="co-t">${esc(w.title)}</div>` : ""}<div>${esc(w.text)}</div></div></div>`;
      }
      default: return "";
    }
  };

  const rendered = (plan.pages ?? [])
    .map((p) => ({ title: p.title, cells: (p.widgets ?? []).map((w) => { const html = widgetHtml(w); return html.trim() ? `<div class="cell ${cellCls(w.type)}">${html}</div>` : ""; }).join("") }))
    .filter((p) => p.cells.trim().length > 0);
  const nav = rendered.map((p, i) => `<button class="tab ${i === 0 ? "on" : ""}" data-i="${i}">${esc(p.title)}</button>`).join("");
  const main = rendered.map((p, i) => `<section class="page ${i === 0 ? "on" : ""}" data-i="${i}">${p.cells}</section>`).join("");

  const bgCss = th.background === "gradient"
    ? `radial-gradient(1100px 420px at 100% -8%, ${accent}14, transparent), linear-gradient(180deg, ${primary}0d, transparent 28%), ${th.bg}`
    : th.background === "mesh"
    ? `radial-gradient(720px 520px at 6% -12%, ${col(0)}26, transparent), radial-gradient(680px 520px at 102% 4%, ${col(1)}20, transparent), radial-gradient(820px 600px at 50% 124%, ${col(2)}1c, transparent), ${th.bg}`
    : th.background === "glass"
    ? `radial-gradient(700px 480px at 0% 0%, ${col(0)}33, transparent), radial-gradient(700px 480px at 100% 10%, ${col(3)}2b, transparent), ${th.bg}`
    : th.bg;
  const headerCss = th.header === "gradient" ? `background:linear-gradient(135deg, ${primary}, color-mix(in srgb, ${primary} 70%, #000));color:#fff`
    : th.header === "dark" ? `background:#14172b;color:#fff`
    : th.header === "minimal" ? `background:transparent;color:var(--ink);border-bottom:2px solid ${accent};border-radius:0`
    : th.header === "band" ? `background:${th.surface};color:var(--ink);border-top:4px solid ${accent};border-bottom:1px solid var(--bd);border-radius:0`
    : `background:${primary};color:#fff`;
  const heroDecor = (th.header === "gradient" || th.header === "solid" || th.header === "dark");
  const glass = th.background === "glass" || th.kpi === "glass";
  const logo = (ctx.brand as { logo?: string; logo_url?: string } | null)?.logo ?? (ctx.brand as { logo_url?: string } | null)?.logo_url;
  const fontLink = th.googleFont ? `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${th.googleFont.replace(/ /g, "+")}:wght@400;500;600;700&display=swap">` : "";

  const chartsJs = `const CHARTS=${JSON.stringify(charts)};const PALETTE=${JSON.stringify(palette)};const PRIMARY=${JSON.stringify(primary)};const INK='${th.ink}',MUT='${th.muted}',GRID='${th.grid}',SURF='${th.surface}',DARK=${th.dark};const CS=${JSON.stringify(th.chart)};const made={};
const BASE={textStyle:{fontFamily:${JSON.stringify(th.font)},color:MUT},tooltip:{backgroundColor:DARK?'#0b0e1a':'#171a2b',borderWidth:0,textStyle:{color:'#fff',fontSize:12},padding:[8,11]},grid:{left:8,right:14,top:16,bottom:6,containLabel:true}};
function gr(e,c){return new e.graphic.LinearGradient(0,0,0,1,[{offset:0,color:c+'59'},{offset:1,color:c+'05'}]);}
function opt(e,d){const ax={axisLine:{show:false},axisTick:{show:false},splitLine:{show:CS.grid,lineStyle:{color:GRID}},axisLabel:{color:MUT}};
 if(d.kind==='spark')return{animationDuration:700,grid:{left:0,right:0,top:2,bottom:2},xAxis:{type:'category',show:false,data:d.data.map((_,i)=>i)},yAxis:{type:'value',show:true,scale:true,axisLabel:{show:false},splitLine:{show:false}},series:[{type:'line',data:d.data,smooth:true,symbol:'none',lineStyle:{width:2,color:d.color},areaStyle:{color:gr(e,d.color)}}]};
 if(d.kind==='line')return{...BASE,animationDuration:850,legend:{show:d.series.length>1,bottom:0,icon:'circle',itemWidth:8,textStyle:{color:MUT}},xAxis:{type:'category',boundaryGap:false,data:d.labels,...ax,splitLine:{show:false}},yAxis:{type:'value',...ax},series:d.series.map(s=>({name:s.name,type:'line',data:s.data,smooth:CS.smooth,symbol:'circle',symbolSize:6,showSymbol:false,lineStyle:{width:CS.lineWidth,color:s.color,shadowBlur:CS.glow?14:0,shadowColor:s.color},itemStyle:{color:s.color,borderColor:'#fff',borderWidth:2},areaStyle:(CS.area&&d.series.length===1)?{color:gr(e,s.color)}:undefined}))};
 if(d.kind==='bar')return{...BASE,animationDuration:800,xAxis:{type:'category',data:d.labels,...ax,splitLine:{show:false},axisLabel:{color:MUT,interval:0,hideOverlap:true}},yAxis:{type:'value',...ax},series:[{type:'bar',data:d.data.map((v,i)=>({value:v,itemStyle:{color:d.colors[i],borderRadius:[CS.barRadius,CS.barRadius,0,0],shadowBlur:CS.glow?10:0,shadowColor:d.colors[i]+'66'}})),barMaxWidth:54}]};
 if(d.kind==='pie')return{...BASE,animationDuration:800,tooltip:{...BASE.tooltip,trigger:'item'},legend:{orient:'vertical',right:0,top:'center',icon:'circle',textStyle:{color:MUT}},series:[{type:'pie',radius:['58%','80%'],center:['38%','50%'],avoidLabelOverlap:true,itemStyle:{borderColor:SURF,borderWidth:2,borderRadius:4},label:{show:false},data:d.items.map(it=>({name:it.name,value:it.value,itemStyle:{color:it.color}}))}]};
 if(d.kind==='map')return{tooltip:{trigger:'item',backgroundColor:DARK?'#0b0e1a':'#171a2b',borderWidth:0,textStyle:{color:'#fff'},formatter:function(p){return p.name+(p.value?(': '+Number(p.value).toLocaleString('fr-FR')):'');}},visualMap:{min:0,max:d.max,left:8,bottom:8,calculable:true,inRange:{color:[PRIMARY+'18',PRIMARY+'66',PRIMARY]},textStyle:{color:MUT}},series:[{type:'map',map:'world',roam:false,emphasis:{label:{show:false},itemStyle:{areaColor:${JSON.stringify(accent)}}},itemStyle:{borderColor:GRID,areaColor:DARK?'#1d2236':'#eef0f6'},data:d.items}]};
 if(d.kind==='gauge')return{series:[{type:'gauge',startAngle:215,endAngle:-35,min:0,max:Math.max(d.target,d.value)||1,progress:{show:true,width:13,roundCap:true,itemStyle:{color:d.color}},axisLine:{lineStyle:{width:13,color:[[1,GRID]]}},axisTick:{show:false},splitLine:{show:false},axisLabel:{show:false},pointer:{show:false},anchor:{show:false},title:{offsetCenter:[0,'32%'],color:MUT,fontSize:12},detail:{offsetCenter:[0,'-6%'],fontSize:23,fontWeight:'bold',color:INK,formatter:function(){return d.fmt;}},data:[{value:d.value,name:'objectif '+d.targetFmt+(d.target?(' · '+Math.round(d.value/d.target*100)+'%'):'')}]}]};
 if(d.kind==='stackbar')return{...BASE,animationDuration:800,legend:{bottom:0,icon:'circle',textStyle:{color:MUT}},xAxis:{type:'category',data:d.labels,...ax,splitLine:{show:false}},yAxis:{type:'value',...ax},series:d.series.map(function(s){return{name:s.name,type:'bar',stack:'t',data:s.data,itemStyle:{color:s.color},barMaxWidth:48};})};
 if(d.kind==='sankey')return{...BASE,tooltip:{trigger:'item',backgroundColor:DARK?'#0b0e1a':'#171a2b',borderWidth:0,textStyle:{color:'#fff'}},series:[{type:'sankey',data:d.nodes,links:d.links,emphasis:{focus:'adjacency',lineStyle:{opacity:.7}},nodeGap:18,nodeWidth:16,label:{color:INK,fontSize:12,fontWeight:600},itemStyle:{borderWidth:0,borderRadius:3},lineStyle:{color:'source',opacity:.5,curveness:.55}}]};
 if(d.kind==='radar')return{...BASE,legend:{show:d.series.length>1,bottom:0,icon:'circle',textStyle:{color:MUT}},radar:{indicator:d.indicators,splitNumber:4,axisName:{color:MUT,fontSize:11},splitLine:{lineStyle:{color:GRID}},splitArea:{show:false},axisLine:{lineStyle:{color:GRID}}},series:[{type:'radar',data:d.series.map(function(s){return{value:s.value,name:s.name,symbolSize:4,lineStyle:{width:2,color:s.color},itemStyle:{color:s.color},areaStyle:{color:s.color,opacity:.12}};})}]};
 if(d.kind==='treemap')return{...BASE,tooltip:{trigger:'item',backgroundColor:DARK?'#0b0e1a':'#171a2b',borderWidth:0,textStyle:{color:'#fff'},formatter:function(p){return p.name+': '+Number(p.value).toLocaleString('fr-FR');}},series:[{type:'treemap',roam:false,nodeClick:false,breadcrumb:{show:false},width:'100%',height:'100%',label:{color:'#fff',fontSize:12,overflow:'truncate'},itemStyle:{borderColor:SURF,borderWidth:2,gapWidth:2},data:d.items.map(function(it){return{name:it.name,value:it.value,itemStyle:{color:it.color}};})}]};
 if(d.kind==='calendar')return{tooltip:{backgroundColor:DARK?'#0b0e1a':'#171a2b',borderWidth:0,textStyle:{color:'#fff'},formatter:function(p){return p.value[0]+': '+Number(p.value[1]).toLocaleString('fr-FR');}},visualMap:{min:0,max:d.max,show:false,inRange:{color:[PRIMARY+'14',PRIMARY+'66',PRIMARY]}},calendar:{range:d.range,cellSize:['auto',15],left:20,right:14,top:22,bottom:6,itemStyle:{color:SURF,borderColor:DARK?'#0f1221':'#fff',borderWidth:2},splitLine:{show:false},dayLabel:{color:MUT,firstDay:1},monthLabel:{show:false},yearLabel:{show:false}},series:[{type:'heatmap',coordinateSystem:'calendar',data:d.data}]};
 if(d.kind==='area')return{...BASE,animationDuration:850,tooltip:{...BASE.tooltip,trigger:'axis'},legend:{show:d.series.length>1,bottom:0,icon:'circle',textStyle:{color:MUT}},xAxis:{type:'category',boundaryGap:false,data:d.labels,...ax,splitLine:{show:false}},yAxis:{type:'value',...ax},series:d.series.map(function(s){return{name:s.name,type:'line',data:s.data,smooth:CS.smooth,symbol:'none',lineStyle:{width:CS.lineWidth,color:s.color,shadowBlur:CS.glow?14:0,shadowColor:s.color},areaStyle:{color:gr(e,s.color),opacity:d.series.length>1?.55:.95}};})};
 if(d.kind==='stackarea')return{...BASE,tooltip:{...BASE.tooltip,trigger:'axis'},legend:{bottom:0,icon:'circle',textStyle:{color:MUT}},xAxis:{type:'category',boundaryGap:false,data:d.labels,...ax,splitLine:{show:false}},yAxis:{type:'value',...ax},series:d.series.map(function(s){return{name:s.name,type:'line',stack:'t',data:s.data,smooth:CS.smooth,symbol:'none',lineStyle:{width:1,color:s.color},areaStyle:{color:s.color,opacity:.72}};})};
 if(d.kind==='river')return{...BASE,tooltip:{trigger:'axis',backgroundColor:DARK?'#0b0e1a':'#171a2b',borderWidth:0,textStyle:{color:'#fff'},axisPointer:{type:'line',lineStyle:{color:GRID}}},legend:{bottom:0,icon:'circle',textStyle:{color:MUT}},singleAxis:{type:'category',data:d.labels,top:12,bottom:42,axisLine:{lineStyle:{color:GRID}},axisTick:{show:false},axisLabel:{color:MUT}},series:[{type:'themeRiver',data:d.data,color:d.colors,emphasis:{itemStyle:{shadowBlur:12,shadowColor:'rgba(0,0,0,.25)'}},label:{show:false}}]};
 if(d.kind==='combo')return{...BASE,animationDuration:800,tooltip:{...BASE.tooltip,trigger:'axis'},legend:{bottom:0,icon:'circle',textStyle:{color:MUT}},xAxis:{type:'category',data:d.labels,...ax,splitLine:{show:false}},yAxis:[{type:'value',...ax},{type:'value',...ax,splitLine:{show:false},axisLabel:{color:MUT,formatter:function(v){return v+(d.lineUnit==='%'?'%':'');}}}],series:d.bars.map(function(s){return{name:s.name,type:'bar',data:s.data,itemStyle:{color:s.color,borderRadius:[CS.barRadius,CS.barRadius,0,0]},barMaxWidth:40};}).concat([{name:d.line.name,type:'line',yAxisIndex:1,data:d.line.data,smooth:CS.smooth,symbol:'circle',symbolSize:7,z:5,lineStyle:{width:CS.lineWidth+.5,color:d.line.color},itemStyle:{color:d.line.color,borderColor:'#fff',borderWidth:2}}])};
 if(d.kind==='slope')return{...BASE,tooltip:{trigger:'item',backgroundColor:DARK?'#0b0e1a':'#171a2b',borderWidth:0,textStyle:{color:'#fff'},formatter:function(p){return p.seriesName+' : '+p.value+(p.dataIndex===1?' (base 100)':'');}},legend:{type:'scroll',bottom:0,icon:'circle',textStyle:{color:MUT}},grid:{left:8,right:64,top:14,bottom:34,containLabel:true},xAxis:{type:'category',data:d.labels,boundaryGap:false,axisLine:{lineStyle:{color:GRID}},axisTick:{show:false},axisLabel:{color:MUT}},yAxis:{type:'value',show:false,scale:true},series:d.series.map(function(s){return{name:s.name,type:'line',data:s.data,symbol:'circle',symbolSize:8,lineStyle:{width:2.4,color:s.color},itemStyle:{color:s.color},endLabel:{show:true,color:s.color,fontSize:11,formatter:function(p){return s.name;}}};})};
 if(d.kind==='matrix')return{...BASE,tooltip:{position:'top',backgroundColor:DARK?'#0b0e1a':'#171a2b',borderWidth:0,textStyle:{color:'#fff'},formatter:function(p){return d.rowlabels[p.value[1]]+' · '+d.collabels[p.value[0]]+': '+Number(p.value[3]).toLocaleString('fr-FR');}},grid:{left:8,right:14,top:8,bottom:24,containLabel:true},xAxis:{type:'category',data:d.collabels,splitArea:{show:false},axisLine:{show:false},axisTick:{show:false},axisLabel:{color:MUT}},yAxis:{type:'category',data:d.rowlabels,splitArea:{show:false},axisLine:{show:false},axisTick:{show:false},axisLabel:{color:MUT}},visualMap:{min:0,max:100,show:false,inRange:{color:[PRIMARY+'12',PRIMARY+'70',PRIMARY]}},series:[{type:'heatmap',data:d.data,label:{show:false},itemStyle:{borderColor:SURF,borderWidth:3,borderRadius:5},emphasis:{itemStyle:{shadowBlur:8,shadowColor:'rgba(0,0,0,.2)'}}}]};
 if(d.kind==='rose')return{...BASE,tooltip:{...BASE.tooltip,trigger:'item'},legend:{type:'scroll',orient:'vertical',right:0,top:'center',icon:'circle',textStyle:{color:MUT}},series:[{type:'pie',radius:['20%','80%'],center:['36%','50%'],roseType:'radius',itemStyle:{borderColor:SURF,borderWidth:2,borderRadius:5},label:{show:false},data:d.items.map(function(it){return{name:it.name,value:it.value,itemStyle:{color:it.color}};})}]};
 if(d.kind==='polarbar')return{...BASE,tooltip:{...BASE.tooltip,trigger:'item'},polar:{radius:[18,'74%']},angleAxis:{max:d.max,startAngle:90,axisLine:{show:false},axisTick:{show:false},splitLine:{lineStyle:{color:GRID}},axisLabel:{show:false}},radiusAxis:{type:'category',data:d.labels,z:10,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:MUT,fontSize:11}},series:[{type:'bar',coordinateSystem:'polar',roundCap:true,data:d.data.map(function(v,i){return{value:v,itemStyle:{color:d.colors[i]}};}),barMaxWidth:16}]};
 if(d.kind==='sunburst')return{...BASE,tooltip:{trigger:'item',backgroundColor:DARK?'#0b0e1a':'#171a2b',borderWidth:0,textStyle:{color:'#fff'},formatter:function(p){return p.name+': '+Number(p.value).toLocaleString('fr-FR');}},series:[{type:'sunburst',radius:['22%','92%'],center:['50%','50%'],data:d.data,label:{color:'#fff',fontSize:11,minAngle:10},itemStyle:{borderColor:SURF,borderWidth:2},emphasis:{focus:'ancestor'}}]};
 if(d.kind==='pictorial')return{...BASE,tooltip:{...BASE.tooltip,trigger:'item'},grid:{left:8,right:34,top:8,bottom:8,containLabel:true},xAxis:{type:'value',show:false,max:d.max},yAxis:{type:'category',data:d.labels,inverse:true,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:MUT,fontSize:12}},series:[{type:'pictorialBar',symbol:'roundRect',symbolRepeat:true,symbolSize:[9,15],symbolMargin:3,symbolClip:false,data:d.data.map(function(v,i){return{value:v,itemStyle:{color:d.colors[i]}};}),label:{show:true,position:'right',color:MUT,fontSize:11,formatter:function(p){return d.fmts[p.dataIndex];}}}]};
 if(d.kind==='lollipop')return{...BASE,tooltip:{...BASE.tooltip,trigger:'item'},grid:{left:8,right:30,top:8,bottom:8,containLabel:true},xAxis:{type:'value',...ax,max:d.max},yAxis:{type:'category',data:d.labels,inverse:true,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:MUT,fontSize:12}},series:[{type:'bar',data:d.data,barWidth:2,silent:true,z:1,itemStyle:{color:GRID}},{type:'scatter',data:d.data.map(function(v,i){return{value:[v,i],itemStyle:{color:d.colors[i]}};}),symbolSize:14,z:3,label:{show:true,position:'right',color:MUT,fontSize:11,formatter:function(p){return d.fmts[p.dataIndex];}}}]};
 if(d.kind==='rings')return{tooltip:{show:false},series:d.rings.map(function(r,i){var rad=92-i*15;return{type:'gauge',startAngle:90,endAngle:-270,min:0,max:100,radius:rad+'%',center:['50%','50%'],pointer:{show:false},progress:{show:true,roundCap:true,width:9,itemStyle:{color:r.color}},axisLine:{lineStyle:{width:9,color:[[1,GRID]]}},axisTick:{show:false},splitLine:{show:false},axisLabel:{show:false},anchor:{show:false},title:{show:false},detail:i===0?{offsetCenter:[0,0],fontSize:17,fontWeight:'bold',color:INK,formatter:function(){return d.center;}}:{show:false},data:[{value:r.pct}]};})};
 if(d.kind==='diverging')return{...BASE,tooltip:{trigger:'item',backgroundColor:DARK?'#0b0e1a':'#171a2b',borderWidth:0,textStyle:{color:'#fff'},formatter:function(p){return p.name+': '+(p.value>=0?'+':'')+p.value+'%';}},grid:{left:8,right:24,top:8,bottom:8,containLabel:true},xAxis:{type:'value',...ax,axisLabel:{color:MUT,formatter:'{value}%'}},yAxis:{type:'category',data:d.labels,inverse:true,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:MUT,fontSize:12}},series:[{type:'bar',data:d.data.map(function(v){return{value:v,itemStyle:{color:v>=0?'#16a34a':'#e24b4a',borderRadius:v>=0?[0,5,5,0]:[5,0,0,5]}};}),barMaxWidth:18,label:{show:true,color:MUT,fontSize:11,position:'right',formatter:function(p){return(p.value>=0?'+':'')+p.value+'%';}}}]};
 if(d.kind==='group')return{...BASE,animationDuration:800,tooltip:{...BASE.tooltip,trigger:'axis'},legend:{bottom:0,icon:'circle',textStyle:{color:MUT}},xAxis:{type:'category',data:d.labels,...ax,splitLine:{show:false},axisLabel:{color:MUT,interval:0,hideOverlap:true}},yAxis:{type:'value',...ax},series:d.series.map(function(s){return{name:s.name,type:'bar',data:s.data,itemStyle:{color:s.color,borderRadius:[CS.barRadius,CS.barRadius,0,0]},barMaxWidth:24,barGap:'18%'};})};
 if(d.kind==='waterfall')return{...BASE,animationDuration:800,tooltip:{trigger:'axis',backgroundColor:DARK?'#0b0e1a':'#171a2b',borderWidth:0,textStyle:{color:'#fff'},formatter:function(p){var x=p[p.length-1];return x.name+': '+Number(d.real[x.dataIndex]).toLocaleString('fr-FR');}},xAxis:{type:'category',data:d.labels,...ax,splitLine:{show:false},axisLabel:{color:MUT,interval:0,hideOverlap:true}},yAxis:{type:'value',...ax},series:[{type:'bar',stack:'w',data:d.base,itemStyle:{color:'transparent'},emphasis:{itemStyle:{color:'transparent'}},silent:true},{type:'bar',stack:'w',data:d.delta.map(function(v,i){return{value:v,itemStyle:{color:d.colors[i],borderRadius:3}};}),barMaxWidth:46}]};
 return{};}
function build(i){if(!window.echarts)return;document.querySelectorAll('.page[data-i="'+i+'"] .echart').forEach(function(el){if(made[el.id])return;var d=CHARTS.find(function(x){return x.id===el.id;});if(!d)return;if(d.kind==='map'&&!(echarts.getMap&&echarts.getMap('world')))return;try{var c=echarts.init(el,null,{renderer:'canvas'});c.setOption(opt(echarts,d));made[el.id]=c;}catch(e){}});}
window.addEventListener('resize',function(){for(var k in made){try{made[k].resize();}catch(e){}}});
document.querySelectorAll('.tab').forEach(function(t){t.addEventListener('click',function(){var i=t.dataset.i;document.querySelectorAll('.tab').forEach(function(x){x.classList.toggle('on',x===t);});document.querySelectorAll('.page').forEach(function(p){p.classList.toggle('on',p.dataset.i===i);});build(i);});});
window.addEventListener('load',function(){build('0');});`;

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(ctx.client)} — ${esc(periodLabel(ctx.period))}</title>
<script src="https://cdn.jsdelivr.net/npm/echarts@4.9.0/dist/echarts.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/js/world.js"></script>
${fontLink}
<style>
:root{--p:${primary};--a:${accent};--bg:${th.bg};--card:${th.surface};--bd:${th.border};--mut:${th.muted};--ink:${th.ink};--r:${th.radius}px}
*{box-sizing:border-box}body{margin:0;font-family:${th.font};background:${bgCss};color:var(--ink);-webkit-font-smoothing:antialiased}
.dash{max-width:1480px;margin:0 auto;padding:0 26px 48px}
header.hero{${headerCss};border-radius:0 0 22px 22px;padding:26px 26px 24px;margin:0 -18px 22px;position:relative;overflow:hidden}
${heroDecor ? `header.hero::after{content:'';position:absolute;right:-40px;top:-40px;width:200px;height:200px;border-radius:50%;background:var(--a);opacity:.16}` : ""}
header.hero h1{margin:0;font-size:24px;font-weight:700;letter-spacing:-.02em}
header.hero .sub{opacity:.82;font-size:14px;margin-top:4px;text-transform:capitalize}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 20px}
.tab{border:1px solid var(--bd);background:var(--card);padding:8px 15px;font:inherit;font-size:13px;font-weight:600;color:var(--mut);cursor:pointer;border-radius:999px;transition:all .15s}
.tab:hover{color:var(--ink)} .tab.on{color:#fff;background:var(--p);border-color:var(--p)}
.page{display:none}.page.on{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:start}
.cell.full{grid-column:1/-1}.cell.wide{grid-column:span 2}
@media(max-width:1150px){.page.on{grid-template-columns:repeat(2,minmax(0,1fr))}.cell.wide{grid-column:1/-1}}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px}
.kpi{background:var(--card);border:1px solid var(--bd);border-radius:var(--r);padding:15px 17px;position:relative;overflow:hidden;transition:transform .15s,box-shadow .15s;display:flex;gap:13px;align-items:center}
.kpi:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(20,26,60,.10)}
.kpi-bar{position:absolute;left:0;top:0;bottom:0;width:4px}
.kpi-ic{flex:0 0 auto;width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center}
.kpi-main{flex:1;min-width:0}.k-plain,.k-icon{padding-left:17px}.k-accent .kpi-main,.k-grad .kpi-main{padding-left:6px}
.kpi-l{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;font-weight:600}
.kpi-v{font-size:24px;font-weight:700;margin-top:4px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.kpi-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:7px;min-height:20px}
.chg{font-size:12px;font-weight:600;padding:2px 8px;border-radius:999px;white-space:nowrap}
.chg.up{color:#0a7d3f;background:#e7f7ee}.chg.down{color:#b41a3a;background:#fdeaf0}.chg.flat{color:var(--mut);background:${th.dark ? "#262b40" : "#f1f2f7"}}
.spark{height:32px;width:84px;flex:0 0 auto}
.glassbg .card,.glassbg .kpi{background:rgba(255,255,255,.62);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-color:rgba(255,255,255,.5)}
.card{background:var(--card);border:1px solid var(--bd);border-radius:var(--r);padding:18px 20px;box-shadow:0 1px 2px rgba(20,26,60,.04)}
.card-t{font-weight:700;font-size:15px;margin-bottom:14px}
.echart{height:280px;width:100%}.echart-map{height:440px}.echart-gauge{height:240px}.echart-cal{height:180px}.echart-gg{height:130px}
.sh-bar{display:flex;height:24px;border-radius:8px;overflow:hidden;background:var(--bd)}.sh-seg{height:100%;transition:width .3s}
.sh-leg{display:flex;flex-wrap:wrap;gap:10px 16px;margin-top:13px;font-size:12.5px;color:var(--mut)}
.sh-li{display:flex;align-items:center;gap:6px}.sh-li b{color:var(--ink);font-weight:600}.sh-dot{width:9px;height:9px;border-radius:3px;flex:0 0 auto}
.blt{display:flex;flex-direction:column;gap:14px}.blt-row{display:flex;flex-direction:column;gap:6px}
.blt-h{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;color:var(--ink)}
.blt-vv{font-variant-numeric:tabular-nums;font-weight:600}.blt-pct{font-size:11px;color:var(--mut);font-weight:600;margin-left:4px}.blt-pct.ok{color:#0a7d3f}
.blt-track{position:relative;height:10px;background:var(--bd);border-radius:999px;overflow:visible}
.blt-fill{height:100%;border-radius:999px}.blt-tgt{position:absolute;top:-3px;left:100%;transform:translateX(-50%);width:3px;height:16px;background:var(--ink);border-radius:2px;opacity:.55}
.tg{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.tg-c{border:1px solid var(--bd);border-radius:13px;padding:12px 13px;background:var(--card)}
.tg-l{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em;font-weight:600}
.tg-v{font-size:19px;font-weight:700;margin-top:3px;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.tg-f{margin-top:5px}.tg-s{height:34px;width:100%;margin-top:4px}
.gg{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;text-align:center}
.gg-c{padding:4px}.gg-l{font-size:12px;color:var(--mut);font-weight:600;margin-top:-6px}
.tbl{width:100%;border-collapse:collapse;font-size:14px}
.tbl td{padding:9px 4px;border-bottom:1px solid var(--bd)}.tbl td.num{text-align:right;font-variant-numeric:tabular-nums}
.tbl tr:last-child td{border-bottom:0}.tbl tr.tot td{font-weight:700;color:var(--ink)}
.rank{display:flex;flex-direction:column;gap:9px}
.rk-row{display:grid;grid-template-columns:minmax(70px,34%) 1fr auto;align-items:center;gap:10px;font-size:13px}
.rk-l{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink)}
.rk-track{height:8px;background:var(--bd);border-radius:999px;overflow:hidden}.rk-bar{height:100%;border-radius:999px}
.rk-v{font-variant-numeric:tabular-nums;font-weight:500;white-space:nowrap}.rk-s{color:var(--mut);font-weight:400;font-size:12px;margin-left:3px}
.funnel{display:flex;flex-direction:column;gap:8px}.fn-row{display:flex;align-items:center;gap:12px}
.fn-conv{font-size:12px;color:var(--mut);min-width:66px;font-weight:600}
.fn-bar{color:#fff;border-radius:10px;padding:11px 15px;display:flex;justify-content:space-between;align-items:center;gap:10px;min-width:150px;box-shadow:0 2px 8px rgba(20,26,60,.12)}
.fn-l{font-size:13px;opacity:.95}.fn-v{font-weight:700;font-variant-numeric:tabular-nums}
.callout{display:flex;gap:11px;align-items:flex-start;border:1px solid var(--bd);border-left:3px solid var(--p);background:var(--card);border-radius:12px;padding:13px 15px;font-size:14px;line-height:1.5}
.callout.warn{border-left-color:#d97706}.callout.good{border-left-color:#16a34a}
.co-ic{flex:0 0 auto;width:20px;height:20px;border-radius:50%;background:var(--p);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.callout.warn .co-ic{background:#d97706}.callout.good .co-ic{background:#16a34a}.co-t{font-weight:700;margin-bottom:3px}
@media(max-width:760px){.page.on{grid-template-columns:1fr}.echart{height:260px}.echart-map{height:340px}}
</style></head><body class="${glass ? "glassbg" : ""}">
<div class="dash">
  <header class="hero"><div class="hero-row" style="display:flex;align-items:center;gap:14px">${logo ? `<img src="${esc(logo)}" alt="" style="height:38px;max-width:140px;object-fit:contain;background:#fff;border-radius:9px;padding:4px 8px">` : ""}<div><h1>${esc(ctx.client)}</h1><div class="sub">${esc(periodLabel(ctx.period))} · ${esc(ctx.currency)}</div></div></div></header>
  <nav class="tabs">${nav}</nav>
  <main>${main}</main>
</div>
<script>${chartsJs}</script>
</body></html>`;
}
