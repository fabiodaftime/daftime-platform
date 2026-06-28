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
}
export interface Widget {
  type: "kpi_row" | "line" | "bar" | "donut" | "waterfall" | "table" | "callout" | "funnel" | "ranking" | "map";
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
  const fullTypes = new Set(["kpi_row", "line", "funnel", "table", "map"]);
  const col = (i: number) => palette[i % palette.length];

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
      case "bar":
      case "waterfall": {
        const ids = (w.metrics ?? []).filter((id) => has(id));
        if (!ids.length) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "bar", labels: ids.map((mid) => M[mid].label), data: ids.map((mid) => M[mid].value), colors: ids.map((mid, i) => (M[mid].value! < 0 ? "#e24b4a" : col(i))) });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Comparaison")}</div><div class="echart" id="${id}"></div></div>`;
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
.dash{max-width:1060px;margin:0 auto;padding:0 18px 40px}
header.hero{${headerCss};border-radius:0 0 22px 22px;padding:26px 26px 24px;margin:0 -18px 22px;position:relative;overflow:hidden}
${heroDecor ? `header.hero::after{content:'';position:absolute;right:-40px;top:-40px;width:200px;height:200px;border-radius:50%;background:var(--a);opacity:.16}` : ""}
header.hero h1{margin:0;font-size:24px;font-weight:700;letter-spacing:-.02em}
header.hero .sub{opacity:.82;font-size:14px;margin-top:4px;text-transform:capitalize}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 20px}
.tab{border:1px solid var(--bd);background:var(--card);padding:8px 15px;font:inherit;font-size:13px;font-weight:600;color:var(--mut);cursor:pointer;border-radius:999px;transition:all .15s}
.tab:hover{color:var(--ink)} .tab.on{color:#fff;background:var(--p);border-color:var(--p)}
.page{display:none}.page.on{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}
.cell.full{grid-column:1/-1}
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
.echart{height:300px;width:100%}.echart-map{height:420px}
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
