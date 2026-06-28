// Moteur de RENDU de dashboard multi-pages à partir d'un PLAN (composé par l'IA) + la data
// VALIDÉE. Le code met en scène ; les chiffres viennent de la data (zéro hallucination).
// Widgets : kpi_row, line, bar, donut, waterfall, table, callout.

export interface Metric { value: number | null; label: string; unit: string; change_pct?: number | null }
export interface RenderCtx {
  client: string; period: string; currency: string;
  brand?: Record<string, any> | null;
  metrics: Record<string, Metric>;                                  // par id
  history: { months: string[]; series: Record<string, (number | null)[]>; labels: Record<string, string> };
}
export interface Widget {
  type: "kpi_row" | "line" | "bar" | "donut" | "waterfall" | "table" | "callout" | "funnel";
  title?: string;
  metrics?: string[];          // ids
  items?: { metric: string }[];
  rows?: { label: string; value: number | null; unit?: string; type?: string; change_pct?: number | null }[]; // pour table libre
  text?: string;               // callout
  tone?: "info" | "warn" | "good";
}
export interface DashPlan { pages: { key?: string; title: string; widgets: Widget[] }[] }

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const periodLabel = (p: string) => { try { return new Date(p).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }); } catch { return p; } };

function fmt(value: number | null | undefined, unit = "", currency = "EUR"): string {
  if (value == null || !isFinite(value)) return "n/d";
  if (unit === "%") return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
  if (unit === "x") return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}×`;
  if (unit === "j") return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} j`;
  if (unit === "" || unit == null) return value.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  // devise
  try { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: unit && unit.length === 3 ? unit : currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} ${unit}`; }
}

const changeHtml = (pct?: number | null) =>
  pct == null ? "" : `<span class="chg ${pct >= 0 ? "up" : "down"}">${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}%</span>`;

export function renderDashboard(ctx: RenderCtx, plan: DashPlan): string {
  const b = ctx.brand ?? {};
  const primary = b.colors?.primary ?? b.primary ?? "#1A1D56";
  const accent = b.colors?.accent ?? b.accent ?? "#D6D303";
  const font = b.typography?.body ?? b.font ?? "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  const charts: { id: string; type: string; data: unknown; options: unknown }[] = [];
  let cid = 0;
  const M = ctx.metrics;
  const has = (id: string) => M[id] && M[id].value != null;

  // palette pour les graphes catégoriels
  const palette = [primary, accent, "#4f86c6", "#e07a5f", "#3d9970", "#9b5de5", "#f4a261", "#577590", "#bc4749"];

  const widgetHtml = (w: Widget): string => {
    switch (w.type) {
      case "kpi_row": {
        const ids = (w.items?.map((i) => i.metric) ?? w.metrics ?? []).filter((id) => has(id)).slice(0, 6);
        if (!ids.length) return "";
        return `<div class="kpis">${ids.map((id) => {
          const m = M[id];
          return `<div class="kpi"><div class="kpi-l">${esc(m.label)}</div><div class="kpi-v">${esc(fmt(m.value, m.unit, ctx.currency))}</div>${changeHtml(m.change_pct)}</div>`;
        }).join("")}</div>`;
      }
      case "line": {
        const ids = (w.metrics ?? []).filter((id) => ctx.history.series[id]);
        if (!ids.length || ctx.history.months.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({
          id, type: "line",
          data: { labels: ctx.history.months, datasets: ids.map((mid, i) => ({ label: ctx.history.labels[mid] ?? M[mid]?.label ?? mid, data: ctx.history.series[mid], borderColor: palette[i % palette.length], backgroundColor: palette[i % palette.length] + "22", tension: 0.3, fill: false })) },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: ids.length > 1 } } },
        });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Tendance")}</div><div class="cbox"><canvas id="${id}"></canvas></div></div>`;
      }
      case "bar":
      case "waterfall": {
        const ids = (w.metrics ?? []).filter((id) => has(id));
        if (!ids.length) return "";
        const id = `ch${cid++}`;
        charts.push({
          id, type: "bar",
          data: { labels: ids.map((mid) => M[mid].label), datasets: [{ data: ids.map((mid) => M[mid].value), backgroundColor: ids.map((mid, i) => (M[mid].value! < 0 ? "#bc4749" : palette[i % palette.length])) }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
        });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Comparaison")}</div><div class="cbox"><canvas id="${id}"></canvas></div></div>`;
      }
      case "donut": {
        const ids = (w.metrics ?? []).filter((id) => has(id) && (M[id].value ?? 0) > 0);
        if (ids.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({
          id, type: "doughnut",
          data: { labels: ids.map((mid) => M[mid].label), datasets: [{ data: ids.map((mid) => M[mid].value), backgroundColor: ids.map((_, i) => palette[i % palette.length]) }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right" } } },
        });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Répartition")}</div><div class="cbox"><canvas id="${id}"></canvas></div></div>`;
      }
      case "table": {
        const rows = (w.rows ?? (w.metrics ?? []).filter(has).map((id) => ({ label: M[id].label, value: M[id].value, unit: M[id].unit, change_pct: M[id].change_pct, type: undefined })));
        if (!rows.length) return "";
        return `<div class="card"><div class="card-t">${esc(w.title ?? "Détail")}</div><table class="tbl"><tbody>${rows.map((r) =>
          `<tr class="${r.type === "total" ? "tot" : ""}"><td>${esc(r.label)}</td><td class="num">${esc(fmt(r.value as number, r.unit, ctx.currency))}</td><td class="num">${changeHtml(r.change_pct)}</td></tr>`).join("")}</tbody></table></div>`;
      }
      case "funnel": {
        // Entonnoir (style Shopify) : étapes décroissantes + taux de passage entre étapes.
        const ids = (w.metrics ?? []).filter(has);
        if (ids.length < 2) return "";
        const top = M[ids[0]].value || 0;
        return `<div class="card"><div class="card-t">${esc(w.title ?? "Entonnoir de conversion")}</div><div class="funnel">${
          ids.map((id, i) => {
            const m = M[id]; const val = m.value ?? 0;
            const w2 = top > 0 ? Math.max(8, Math.round((val / top) * 100)) : 100;
            const prev = i > 0 ? (M[ids[i - 1]].value ?? 0) : 0;
            const conv = i > 0 && prev > 0 ? Math.round((val / prev) * 1000) / 10 : null;
            return `<div class="fn-row">${conv != null ? `<div class="fn-conv">↓ ${conv.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}%</div>` : ""}` +
              `<div class="fn-bar" style="width:${w2}%"><span class="fn-l">${esc(m.label)}</span><span class="fn-v">${esc(fmt(val, m.unit, ctx.currency))}</span></div></div>`;
          }).join("")
        }</div></div>`;
      }
      case "callout": {
        if (!w.text) return "";
        const tone = w.tone ?? "info";
        return `<div class="callout ${tone}">${w.title ? `<div class="co-t">${esc(w.title)}</div>` : ""}<div>${esc(w.text)}</div></div>`;
      }
      default: return "";
    }
  };

  // On rend chaque page puis on écarte celles dont le contenu rendu est vide (widgets sans data).
  const rendered = (plan.pages ?? [])
    .map((p) => ({ title: p.title, body: (p.widgets ?? []).map(widgetHtml).join("") }))
    .filter((p) => p.body.trim().length > 0);
  const nav = rendered.map((p, i) => `<button class="tab ${i === 0 ? "on" : ""}" data-i="${i}">${esc(p.title)}</button>`).join("");
  const main = rendered.map((p, i) => `<section class="page ${i === 0 ? "on" : ""}" data-i="${i}">${p.body}</section>`).join("");

  const chartsJs = `const CHARTS=${JSON.stringify(charts)};const made={};
function build(i){document.querySelectorAll('.page[data-i="'+i+'"] canvas').forEach(c=>{if(made[c.id])return;const d=CHARTS.find(x=>x.id===c.id);if(!d||!window.Chart)return;made[c.id]=new Chart(c,{type:d.type,data:d.data,options:d.options});});}
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{const i=t.dataset.i;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x===t));document.querySelectorAll('.page').forEach(p=>p.classList.toggle('on',p.dataset.i===i));build(i);}));
window.addEventListener('load',()=>build('0'));`;

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(ctx.client)} — ${esc(periodLabel(ctx.period))}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
:root{--p:${primary};--a:${accent};--bg:#f6f7fb;--card:#fff;--bd:#e6e8ef;--mut:#6b7280;--tx:#1f2430}
*{box-sizing:border-box}body{margin:0;font-family:${font};background:var(--bg);color:var(--tx)}
.dash{max-width:1000px;margin:0 auto;padding:20px}
header h1{margin:0;font-size:22px}header .sub{color:var(--mut);font-size:14px;margin-top:2px;text-transform:capitalize}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin:18px 0;border-bottom:1px solid var(--bd)}
.tab{border:0;background:none;padding:9px 14px;font:inherit;font-size:14px;color:var(--mut);cursor:pointer;border-bottom:2px solid transparent}
.tab.on{color:var(--p);border-bottom-color:var(--p);font-weight:600}
.page{display:none;flex-direction:column;gap:14px}.page.on{display:flex}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.kpi{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:14px}
.kpi-l{font-size:12px;color:var(--mut)}.kpi-v{font-size:22px;font-weight:600;margin-top:4px;font-variant-numeric:tabular-nums}
.chg{font-size:12px}.chg.up{color:#16a34a}.chg.down{color:#dc2626}
.card{background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:16px}
.card-t{font-weight:600;margin-bottom:10px}
.chartcard .cbox{position:relative;height:300px}
.tbl{width:100%;border-collapse:collapse;font-size:14px}
.tbl td{padding:7px 4px;border-bottom:1px solid var(--bd)}.tbl td.num{text-align:right;font-variant-numeric:tabular-nums}
.tbl tr.tot td{font-weight:700;background:#fafafa}
.funnel{display:flex;flex-direction:column;gap:6px}
.fn-row{display:flex;align-items:center;gap:10px}
.fn-conv{font-size:12px;color:var(--mut);min-width:64px}
.fn-bar{background:var(--p);color:#fff;border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;min-width:140px;gap:10px}
.fn-l{font-size:13px;opacity:.92}.fn-v{font-weight:700;font-variant-numeric:tabular-nums}
.callout{border:1px solid var(--bd);border-left:3px solid var(--p);background:var(--card);border-radius:8px;padding:12px 14px;font-size:14px}
.callout.warn{border-left-color:#d97706;background:#fffbeb}.callout.good{border-left-color:#16a34a;background:#f0fdf4}
.co-t{font-weight:600;margin-bottom:3px}
@media(max-width:640px){.chartcard .cbox{height:240px}}
</style></head><body>
<div class="dash">
  <header><h1>${esc(ctx.client)}</h1><div class="sub">${esc(periodLabel(ctx.period))} · ${esc(ctx.currency)}</div></header>
  <nav class="tabs">${nav}</nav>
  <main>${main}</main>
</div>
<script>${chartsJs}</script>
</body></html>`;
}
