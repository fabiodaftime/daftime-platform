// Moteur de RENDU de dashboard multi-pages à partir d'un PLAN (composé par l'IA) + la data
// VALIDÉE. Le code met en scène ; les chiffres viennent de la data (zéro hallucination).
// Widgets : kpi_row (avec sparkline), line, bar, donut, waterfall, table, callout, funnel.

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
  rows?: { label: string; value: number | null; unit?: string; type?: string; change_pct?: number | null }[];
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
  try { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: unit && unit.length === 3 ? unit : currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} ${unit}`; }
}

const changeHtml = (pct?: number | null) =>
  pct == null ? "" : `<span class="chg ${pct >= 0 ? "up" : "down"}">${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}%</span>`;

export function renderDashboard(ctx: RenderCtx, plan: DashPlan): string {
  const b = ctx.brand ?? {};
  const primary = b.colors?.primary ?? b.primary ?? "#1A1D56";
  const accent = b.colors?.accent ?? b.accent ?? "#D6D303";
  const font = b.typography?.body ?? b.font ?? "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  const charts: { id: string; type: string; data: unknown; spark?: boolean }[] = [];
  let cid = 0;
  const M = ctx.metrics;
  const has = (id: string) => M[id] && M[id].value != null;
  const palette = [primary, accent, "#4f86c6", "#e07a5f", "#3d9970", "#9b5de5", "#f4a261", "#577590", "#bc4749"];
  const fullTypes = new Set(["kpi_row", "line", "funnel", "table"]);

  const widgetHtml = (w: Widget): string => {
    switch (w.type) {
      case "kpi_row": {
        const ids = (w.items?.map((i) => i.metric) ?? w.metrics ?? []).filter((id) => has(id)).slice(0, 6);
        if (!ids.length) return "";
        return `<div class="kpis">${ids.map((id) => {
          const m = M[id];
          const sp = ctx.history.series[id] && ctx.history.months.length > 1;
          let spHtml = "";
          if (sp) { const spId = `ch${cid++}`; charts.push({ id: spId, type: "line", spark: true, data: { labels: ctx.history.months, datasets: [{ data: ctx.history.series[id], borderColor: primary }] } }); spHtml = `<canvas class="spark" id="${spId}"></canvas>`; }
          return `<div class="kpi"><div class="kpi-l">${esc(m.label)}</div><div class="kpi-v">${esc(fmt(m.value, m.unit, ctx.currency))}</div><div class="kpi-foot">${changeHtml(m.change_pct) || '<span class="chg flat">—</span>'}${spHtml}</div></div>`;
        }).join("")}</div>`;
      }
      case "line": {
        const ids = (w.metrics ?? []).filter((id) => ctx.history.series[id]);
        if (!ids.length || ctx.history.months.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, type: "line", data: { labels: ctx.history.months, datasets: ids.map((mid, i) => ({ label: ctx.history.labels[mid] ?? M[mid]?.label ?? mid, data: ctx.history.series[mid], borderColor: palette[i % palette.length] })) } });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Tendance")}</div><div class="cbox"><canvas id="${id}"></canvas></div></div>`;
      }
      case "bar":
      case "waterfall": {
        const ids = (w.metrics ?? []).filter((id) => has(id));
        if (!ids.length) return "";
        const id = `ch${cid++}`;
        charts.push({ id, type: "bar", data: { labels: ids.map((mid) => M[mid].label), datasets: [{ data: ids.map((mid) => M[mid].value), backgroundColor: ids.map((mid, i) => (M[mid].value! < 0 ? "#e24b4a" : palette[i % palette.length])) }] } });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Comparaison")}</div><div class="cbox"><canvas id="${id}"></canvas></div></div>`;
      }
      case "donut": {
        const ids = (w.metrics ?? []).filter((id) => has(id) && (M[id].value ?? 0) > 0);
        if (ids.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, type: "doughnut", data: { labels: ids.map((mid) => M[mid].label), datasets: [{ data: ids.map((mid) => M[mid].value), backgroundColor: ids.map((_, i) => palette[i % palette.length]), borderWidth: 0 }] } });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Répartition")}</div><div class="cbox"><canvas id="${id}"></canvas></div></div>`;
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
            const m = M[id]; const val = m.value ?? 0;
            const w2 = top > 0 ? Math.max(12, Math.round((val / top) * 100)) : 100;
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
        const ic = tone === "good" ? "✓" : tone === "warn" ? "!" : "i";
        return `<div class="callout ${tone}"><span class="co-ic">${ic}</span><div>${w.title ? `<div class="co-t">${esc(w.title)}</div>` : ""}<div>${esc(w.text)}</div></div></div>`;
      }
      default: return "";
    }
  };

  const rendered = (plan.pages ?? [])
    .map((p) => ({ title: p.title, cells: (p.widgets ?? []).map((w) => { const html = widgetHtml(w); return html.trim() ? `<div class="cell ${fullTypes.has(w.type) ? "full" : "half"}">${html}</div>` : ""; }).join("") }))
    .filter((p) => p.cells.trim().length > 0);
  const nav = rendered.map((p, i) => `<button class="tab ${i === 0 ? "on" : ""}" data-i="${i}">${esc(p.title)}</button>`).join("");
  const main = rendered.map((p, i) => `<section class="page ${i === 0 ? "on" : ""}" data-i="${i}">${p.cells}</section>`).join("");

  const chartsJs = `const CHARTS=${JSON.stringify(charts)};const made={};
if(window.Chart){Chart.defaults.font.family=${JSON.stringify(font)};Chart.defaults.font.size=12;Chart.defaults.color='#6b7180';Chart.defaults.plugins.legend.labels.usePointStyle=true;Chart.defaults.plugins.legend.labels.boxWidth=8;Chart.defaults.plugins.tooltip.backgroundColor='#171a2b';Chart.defaults.plugins.tooltip.padding=10;Chart.defaults.plugins.tooltip.cornerRadius=8;Chart.defaults.plugins.tooltip.boxPadding=6;Chart.defaults.plugins.tooltip.titleFont={weight:'600'};Chart.defaults.animation.duration=800;Chart.defaults.animation.easing='easeOutQuart';}
function grad(ctx,col){const g=ctx.createLinearGradient(0,0,0,300);g.addColorStop(0,col+'40');g.addColorStop(1,col+'03');return g;}
function build(i){document.querySelectorAll('.page[data-i="'+i+'"] canvas').forEach(c=>{if(made[c.id])return;const d=CHARTS.find(x=>x.id===c.id);if(!d||!window.Chart)return;const cx=c.getContext('2d');const cfg={type:d.type,data:JSON.parse(JSON.stringify(d.data)),options:{responsive:true,maintainAspectRatio:false}};
if(d.spark){cfg.options.plugins={legend:{display:false},tooltip:{enabled:false}};cfg.options.scales={x:{display:false},y:{display:false}};cfg.data.datasets.forEach(ds=>{ds.borderColor=ds.borderColor;ds.borderWidth=2;ds.tension=.45;ds.fill=false;ds.pointRadius=0;});}
else if(d.type==='line'){cfg.options.interaction={mode:'index',intersect:false};cfg.options.plugins={legend:{display:cfg.data.datasets.length>1,position:'bottom'}};cfg.options.scales={x:{grid:{display:false},border:{display:false}},y:{grid:{color:'#eef0f6'},border:{display:false},ticks:{maxTicksLimit:5}}};cfg.data.datasets.forEach(ds=>{const col=ds.borderColor||'#1A1D56';ds.backgroundColor=grad(cx,col);ds.fill=true;ds.tension=.4;ds.borderWidth=2.5;ds.pointRadius=0;ds.pointHoverRadius=5;ds.pointBackgroundColor=col;ds.pointBorderColor='#fff';ds.pointBorderWidth=2;});}
else if(d.type==='bar'){cfg.options.plugins={legend:{display:false}};cfg.options.scales={x:{grid:{display:false},border:{display:false}},y:{grid:{color:'#eef0f6'},border:{display:false},ticks:{maxTicksLimit:5}}};cfg.data.datasets.forEach(ds=>{ds.borderRadius=8;ds.maxBarThickness=56;});}
else if(d.type==='doughnut'){cfg.options.cutout='64%';cfg.options.plugins={legend:{position:'right',labels:{padding:14}}};}
made[c.id]=new Chart(c,cfg);});}
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{const i=t.dataset.i;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x===t));document.querySelectorAll('.page').forEach(p=>p.classList.toggle('on',p.dataset.i===i));build(i);}));
window.addEventListener('load',()=>build('0'));`;

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(ctx.client)} — ${esc(periodLabel(ctx.period))}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
:root{--p:${primary};--a:${accent};--bg:#f4f5f9;--card:#fff;--bd:#ebedf4;--mut:#6b7180;--ink:#171a2b}
*{box-sizing:border-box}body{margin:0;font-family:${font};background:var(--bg);color:var(--ink);-webkit-font-smoothing:antialiased}
.dash{max-width:1060px;margin:0 auto;padding:0 18px 40px}
header.hero{background:var(--p);color:#fff;border-radius:0 0 22px 22px;padding:26px 26px 24px;margin:0 -18px 22px;position:relative;overflow:hidden}
header.hero::after{content:'';position:absolute;right:-40px;top:-40px;width:200px;height:200px;border-radius:50%;background:var(--a);opacity:.16}
header.hero h1{margin:0;font-size:24px;font-weight:700;letter-spacing:-.02em}
header.hero .sub{opacity:.82;font-size:14px;margin-top:4px;text-transform:capitalize}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 20px}
.tab{border:0;background:#fff;border:1px solid var(--bd);padding:8px 15px;font:inherit;font-size:13px;font-weight:600;color:var(--mut);cursor:pointer;border-radius:999px;transition:all .15s}
.tab:hover{color:var(--ink);border-color:#d6d9e6}
.tab.on{color:#fff;background:var(--p);border-color:var(--p)}
.page{display:none}.page.on{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}
.cell.full{grid-column:1/-1}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:14px}
.kpi{background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:15px 17px;position:relative;overflow:hidden;transition:transform .15s,box-shadow .15s}
.kpi:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(20,26,60,.09)}
.kpi::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--a)}
.kpi-l{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;font-weight:600}
.kpi-v{font-size:25px;font-weight:700;margin-top:6px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.kpi-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;min-height:20px}
.chg{font-size:12px;font-weight:600;padding:2px 8px;border-radius:999px;white-space:nowrap}
.chg.up{color:#0a7d3f;background:#e7f7ee}.chg.down{color:#b41a3a;background:#fdeaf0}.chg.flat{color:var(--mut);background:#f1f2f7}
canvas.spark{height:30px!important;width:84px!important;flex:0 0 auto}
.card{background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:18px 20px;box-shadow:0 1px 2px rgba(20,26,60,.04)}
.card-t{font-weight:700;font-size:15px;margin-bottom:14px}
.chartcard .cbox{position:relative;height:300px}
.tbl{width:100%;border-collapse:collapse;font-size:14px}
.tbl td{padding:9px 4px;border-bottom:1px solid var(--bd)}.tbl td.num{text-align:right;font-variant-numeric:tabular-nums}
.tbl tr:last-child td{border-bottom:0}.tbl tr.tot td{font-weight:700;color:var(--ink)}
.funnel{display:flex;flex-direction:column;gap:8px}
.fn-row{display:flex;align-items:center;gap:12px}
.fn-conv{font-size:12px;color:var(--mut);min-width:66px;font-weight:600}
.fn-bar{background:linear-gradient(90deg,var(--p),color-mix(in srgb,var(--p) 78%,#fff));color:#fff;border-radius:10px;padding:11px 15px;display:flex;justify-content:space-between;align-items:center;gap:10px;min-width:150px;box-shadow:0 2px 8px rgba(20,26,60,.12)}
.fn-l{font-size:13px;opacity:.92}.fn-v{font-weight:700;font-variant-numeric:tabular-nums}
.callout{display:flex;gap:11px;align-items:flex-start;border:1px solid var(--bd);border-left:3px solid var(--p);background:var(--card);border-radius:12px;padding:13px 15px;font-size:14px;line-height:1.5}
.callout.warn{border-left-color:#d97706;background:#fffbeb}.callout.good{border-left-color:#16a34a;background:#f0fdf4}
.co-ic{flex:0 0 auto;width:20px;height:20px;border-radius:50%;background:var(--p);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.callout.warn .co-ic{background:#d97706}.callout.good .co-ic{background:#16a34a}
.co-t{font-weight:700;margin-bottom:3px}
@media(max-width:760px){.page.on{grid-template-columns:1fr}.chartcard .cbox{height:250px}}
</style></head><body>
<div class="dash">
  <header class="hero"><h1>${esc(ctx.client)}</h1><div class="sub">${esc(periodLabel(ctx.period))} · ${esc(ctx.currency)}</div></header>
  <nav class="tabs">${nav}</nav>
  <main>${main}</main>
</div>
<script>${chartsJs}</script>
</body></html>`;
}
