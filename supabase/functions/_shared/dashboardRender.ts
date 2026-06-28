// Moteur de RENDU multi-pages à partir d'un PLAN (composé par l'IA) + data VALIDÉE + THÈME.
// La présentation est pilotée par le thème (couleurs, fond, icônes, style de tuiles) — voir dashboardTheme.ts.
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
}
export interface Widget {
  type: "kpi_row" | "line" | "bar" | "donut" | "waterfall" | "table" | "callout" | "funnel" | "ranking";
  title?: string; metrics?: string[]; items?: { metric: string }[]; breakdown?: string;
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

export function renderDashboard(ctx: RenderCtx, plan: DashPlan): string {
  const th = resolveTheme(ctx.brand, ctx.theme ?? plan.theme ?? {});
  const { primary, accent, palette } = th;
  const charts: { id: string; type: string; data: unknown; spark?: boolean; color?: string }[] = [];
  let cid = 0;
  const M = ctx.metrics;
  const has = (id: string) => M[id] && M[id].value != null;
  const fullTypes = new Set(["kpi_row", "line", "funnel", "table"]);
  const col = (i: number) => palette[i % palette.length];

  const kpiTile = (id: string, i: number): string => {
    const m = M[id]; const c = col(i);
    const sp = ctx.history.series[id] && ctx.history.months.length > 1;
    let spHtml = "";
    if (sp) { const spId = `ch${cid++}`; charts.push({ id: spId, type: "line", spark: true, color: c, data: { labels: ctx.history.months, datasets: [{ data: ctx.history.series[id], borderColor: c }] } }); spHtml = `<canvas class="spark" id="${spId}"></canvas>`; }
    const foot = `<div class="kpi-foot">${changeHtml(m.change_pct) || '<span class="chg flat">—</span>'}${spHtml}</div>`;
    const main = `<div class="kpi-main"><div class="kpi-l">${esc(m.label)}</div><div class="kpi-v">${esc(fmt(m.value, m.unit, ctx.currency))}</div>${foot}</div>`;
    if (th.kpi === "icon" || th.kpi === "glass") {
      return `<div class="kpi k-icon"><div class="kpi-ic" style="background:${c}1f;color:${c}">${iconSvg(iconFor(id, th.icons[id]), c)}</div>${main}</div>`;
    }
    if (th.kpi === "gradient") {
      return `<div class="kpi k-grad" style="background:linear-gradient(135deg, ${c}14, transparent)"><div class="kpi-bar" style="background:${c}"></div>${main}</div>`;
    }
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
        charts.push({ id, type: "line", data: { labels: ctx.history.months, datasets: ids.map((mid, i) => ({ label: ctx.history.labels[mid] ?? M[mid]?.label ?? mid, data: ctx.history.series[mid], borderColor: col(i) })) } });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Tendance")}</div><div class="cbox"><canvas id="${id}"></canvas></div></div>`;
      }
      case "bar":
      case "waterfall": {
        const ids = (w.metrics ?? []).filter((id) => has(id));
        if (!ids.length) return "";
        const id = `ch${cid++}`;
        charts.push({ id, type: "bar", data: { labels: ids.map((mid) => M[mid].label), datasets: [{ data: ids.map((mid) => M[mid].value), backgroundColor: ids.map((mid, i) => (M[mid].value! < 0 ? "#e24b4a" : col(i))) }] } });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Comparaison")}</div><div class="cbox"><canvas id="${id}"></canvas></div></div>`;
      }
      case "donut": {
        const ids = (w.metrics ?? []).filter((id) => has(id) && (M[id].value ?? 0) > 0);
        if (ids.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, type: "doughnut", data: { labels: ids.map((mid) => M[mid].label), datasets: [{ data: ids.map((mid) => M[mid].value), backgroundColor: ids.map((_, i) => col(i)), borderWidth: 0 }] } });
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
            const m = M[id]; const val = m.value ?? 0; const c = col(i);
            const w2 = top > 0 ? Math.max(12, Math.round((val / top) * 100)) : 100;
            const prev = i > 0 ? (M[ids[i - 1]].value ?? 0) : 0;
            const conv = i > 0 && prev > 0 ? Math.round((val / prev) * 1000) / 10 : null;
            return `<div class="fn-row">${conv != null ? `<div class="fn-conv">↓ ${conv.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}%</div>` : ""}` +
              `<div class="fn-bar" style="width:${w2}%;background:linear-gradient(90deg,${c},${c}bb)"><span class="fn-l">${esc(m.label)}</span><span class="fn-v">${esc(fmt(val, m.unit, ctx.currency))}</span></div></div>`;
          }).join("")
        }</div></div>`;
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

  // Fond + en-tête selon le thème.
  const pe = (i: number, a: string) => `${palette[i % palette.length]}${a}`;
  const bgCss = th.background === "gradient"
    ? `radial-gradient(1100px 420px at 100% -8%, ${accent}14, transparent), linear-gradient(180deg, ${primary}0d, transparent 28%), ${th.bg}`
    : th.background === "mesh"
    ? `radial-gradient(720px 520px at 6% -12%, ${pe(0, "26")}, transparent), radial-gradient(680px 520px at 102% 4%, ${pe(1, "20")}, transparent), radial-gradient(820px 600px at 50% 124%, ${pe(2, "1c")}, transparent), ${th.bg}`
    : th.background === "glass"
    ? `radial-gradient(700px 480px at 0% 0%, ${pe(0, "33")}, transparent), radial-gradient(700px 480px at 100% 10%, ${pe(3, "2b")}, transparent), ${th.bg}`
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

  const chartsJs = `const CHARTS=${JSON.stringify(charts)};const made={};const MUT='${th.muted}',GRID='${th.grid}',DARK=${th.dark};
if(window.Chart){Chart.defaults.font.family=${JSON.stringify(th.font)};Chart.defaults.font.size=12;Chart.defaults.color=MUT;Chart.defaults.plugins.legend.labels.usePointStyle=true;Chart.defaults.plugins.legend.labels.boxWidth=8;Chart.defaults.plugins.tooltip.backgroundColor=DARK?'#000':'#171a2b';Chart.defaults.plugins.tooltip.padding=10;Chart.defaults.plugins.tooltip.cornerRadius=8;Chart.defaults.plugins.tooltip.boxPadding=6;Chart.defaults.animation.duration=850;Chart.defaults.animation.easing='easeOutQuart';}
function grad(cx,c){const g=cx.createLinearGradient(0,0,0,300);g.addColorStop(0,c+'45');g.addColorStop(1,c+'04');return g;}
function build(i){document.querySelectorAll('.page[data-i="'+i+'"] canvas').forEach(c=>{if(made[c.id])return;const d=CHARTS.find(x=>x.id===c.id);if(!d||!window.Chart)return;const cx=c.getContext('2d');const cfg={type:d.type,data:JSON.parse(JSON.stringify(d.data)),options:{responsive:true,maintainAspectRatio:false}};
if(d.spark){cfg.options.plugins={legend:{display:false},tooltip:{enabled:false}};cfg.options.scales={x:{display:false},y:{display:false}};cfg.data.datasets.forEach(ds=>{ds.borderColor=d.color;ds.borderWidth=2;ds.tension=.45;ds.fill=false;ds.pointRadius=0;});}
else if(d.type==='line'){cfg.options.interaction={mode:'index',intersect:false};cfg.options.plugins={legend:{display:cfg.data.datasets.length>1,position:'bottom'}};cfg.options.scales={x:{grid:{display:false},border:{display:false}},y:{grid:{color:GRID},border:{display:false},ticks:{maxTicksLimit:5}}};cfg.data.datasets.forEach(ds=>{const cc=ds.borderColor||'#1A1D56';ds.backgroundColor=grad(cx,cc);ds.fill=true;ds.tension=.4;ds.borderWidth=2.5;ds.pointRadius=0;ds.pointHoverRadius=5;ds.pointBackgroundColor=cc;ds.pointBorderColor='#fff';ds.pointBorderWidth=2;});}
else if(d.type==='bar'){cfg.options.plugins={legend:{display:false}};cfg.options.scales={x:{grid:{display:false},border:{display:false}},y:{grid:{color:GRID},border:{display:false},ticks:{maxTicksLimit:5}}};cfg.data.datasets.forEach(ds=>{ds.borderRadius=8;ds.maxBarThickness=56;});}
else if(d.type==='doughnut'){cfg.options.cutout='64%';cfg.options.plugins={legend:{position:'right',labels:{padding:14}}};}
made[c.id]=new Chart(c,cfg);});}
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{const i=t.dataset.i;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x===t));document.querySelectorAll('.page').forEach(p=>p.classList.toggle('on',p.dataset.i===i));build(i);}));
window.addEventListener('load',()=>build('0'));`;

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(ctx.client)} — ${esc(periodLabel(ctx.period))}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
${fontLink}
<style>
:root{--p:${primary};--a:${accent};--bg:${th.bg};--card:${th.surface};--bd:${th.border};--mut:${th.muted};--ink:${th.ink};--r:${th.radius}px}
*{box-sizing:border-box}body{margin:0;font-family:${th.font};background:${bgCss};color:var(--ink);-webkit-font-smoothing:antialiased}
.dash{max-width:1060px;margin:0 auto;padding:0 18px 40px}
header.hero{${headerCss};border-radius:0 0 22px 22px;padding:26px 26px 24px;margin:0 -18px 22px;position:relative;overflow:hidden}
${heroDecor ? `header.hero::after{content:'';position:absolute;right:-40px;top:-40px;width:200px;height:200px;border-radius:50%;background:var(--a);opacity:.16}` : ""}
header.hero h1{margin:0;font-size:24px;font-weight:700;letter-spacing:-.02em}
header.hero .sub{opacity:.82;font-size:14px;margin-top:4px;text-transform:capitalize}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 20px}
.tab{border:1px solid var(--bd);background:var(--card);padding:8px 15px;font:inherit;font-size:13px;font-weight:600;color:var(--mut);cursor:pointer;border-radius:999px;transition:all .15s}
.tab:hover{color:var(--ink)}
.tab.on{color:#fff;background:var(--p);border-color:var(--p)}
.page{display:none}.page.on{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}
.cell.full{grid-column:1/-1}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px}
.kpi{background:var(--card);border:1px solid var(--bd);border-radius:var(--r);padding:15px 17px;position:relative;overflow:hidden;transition:transform .15s,box-shadow .15s;display:flex;gap:13px;align-items:center}
.kpi:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(20,26,60,.10)}
.kpi-bar{position:absolute;left:0;top:0;bottom:0;width:4px}
.kpi-ic{flex:0 0 auto;width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center}
.kpi-main{flex:1;min-width:0}
.kpi-l{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;font-weight:600}
.kpi-v{font-size:24px;font-weight:700;margin-top:4px;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.kpi-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:7px;min-height:20px}
.k-plain,.k-icon{padding-left:17px}.k-accent .kpi-main,.k-grad .kpi-main{padding-left:6px}
.chg{font-size:12px;font-weight:600;padding:2px 8px;border-radius:999px;white-space:nowrap}
.chg.up{color:#0a7d3f;background:#e7f7ee}.chg.down{color:#b41a3a;background:#fdeaf0}.chg.flat{color:var(--mut);background:${th.dark ? "#262b40" : "#f1f2f7"}}
canvas.spark{height:30px!important;width:80px!important;flex:0 0 auto}
.card{background:var(--card);border:1px solid var(--bd);border-radius:var(--r);padding:18px 20px;box-shadow:0 1px 2px rgba(20,26,60,.04)}
.card-t{font-weight:700;font-size:15px;margin-bottom:14px}
.chartcard .cbox{position:relative;height:300px}
.tbl{width:100%;border-collapse:collapse;font-size:14px}
.tbl td{padding:9px 4px;border-bottom:1px solid var(--bd)}.tbl td.num{text-align:right;font-variant-numeric:tabular-nums}
.tbl tr:last-child td{border-bottom:0}.tbl tr.tot td{font-weight:700;color:var(--ink)}
.funnel{display:flex;flex-direction:column;gap:8px}
.fn-row{display:flex;align-items:center;gap:12px}
.fn-conv{font-size:12px;color:var(--mut);min-width:66px;font-weight:600}
.fn-bar{color:#fff;border-radius:10px;padding:11px 15px;display:flex;justify-content:space-between;align-items:center;gap:10px;min-width:150px;box-shadow:0 2px 8px rgba(20,26,60,.12)}
.fn-l{font-size:13px;opacity:.95}.fn-v{font-weight:700;font-variant-numeric:tabular-nums}
.rank{display:flex;flex-direction:column;gap:9px}
.rk-row{display:grid;grid-template-columns:minmax(70px,34%) 1fr auto;align-items:center;gap:10px;font-size:13px}
.rk-l{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink)}
.rk-track{height:8px;background:var(--bd);border-radius:999px;overflow:hidden}
.rk-bar{height:100%;border-radius:999px}
.rk-v{font-variant-numeric:tabular-nums;font-weight:500;white-space:nowrap}
.rk-s{color:var(--mut);font-weight:400;font-size:12px;margin-left:3px}
.callout{display:flex;gap:11px;align-items:flex-start;border:1px solid var(--bd);border-left:3px solid var(--p);background:var(--card);border-radius:12px;padding:13px 15px;font-size:14px;line-height:1.5}
.callout.warn{border-left-color:#d97706}.callout.good{border-left-color:#16a34a}
.co-ic{flex:0 0 auto;width:20px;height:20px;border-radius:50%;background:var(--p);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.callout.warn .co-ic{background:#d97706}.callout.good .co-ic{background:#16a34a}
.co-t{font-weight:700;margin-bottom:3px}
@media(max-width:760px){.page.on{grid-template-columns:1fr}.chartcard .cbox{height:250px}}
${glass ? ".glassbg .card,.glassbg .kpi{background:rgba(255,255,255,.62);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-color:rgba(255,255,255,.5)}" : ""}
.hero-row{display:flex;align-items:center;gap:14px}
.logo{height:38px;max-width:140px;object-fit:contain;background:#fff;border-radius:9px;padding:4px 8px}
</style></head><body class="${glass ? "glassbg" : ""}">
<div class="dash">
  <header class="hero"><div class="hero-row">${logo ? `<img class="logo" src="${esc(logo)}" alt="">` : ""}<div><h1>${esc(ctx.client)}</h1><div class="sub">${esc(periodLabel(ctx.period))} · ${esc(ctx.currency)}</div></div></div></header>
  <nav class="tabs">${nav}</nav>
  <main>${main}</main>
</div>
<script>${chartsJs}</script>
</body></html>`;
}
