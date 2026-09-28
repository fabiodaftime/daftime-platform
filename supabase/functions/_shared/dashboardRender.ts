// Moteur de RENDU multi-pages : PLAN (composé par l'IA) + data VALIDÉE + THÈME.
// Graphes premium via ECharts ; carte choroplèthe pour les breakdowns par pays.
// Les chiffres viennent de la data (zéro hallucination).

import { type Theme, contrast, resolveTheme, iconFor, iconSvg } from "./dashboardTheme.ts";
import { assess, type BenchOverride } from "./benchmarks.ts";
import { ratesToReporting } from "./fx.ts";
import type { Bridge } from "./marginBridge.ts";
import type { MonthPoint } from "./monthPoints.ts";
import type { CashForecast } from "./cashForecast.ts";

export interface Metric { value: number | null; label: string; unit: string; change_pct?: number | null }
// Colonne d'un breakdown MULTI-COLONNES (ex. perf par canal : CA, commission, marge…).
export interface BreakdownColumn { key: string; label: string; unit?: "CUR" | "%" | "x" | "j" | ""; align?: "left" | "right"; emphasis?: boolean; sort?: boolean }
// Ligne : `value` (scalaire, TOUJOURS renseigné → rétrocompat mono-métrique) + `values` optionnel (multi-colonnes).
export interface BreakdownRow { label: string; value: number; values?: Record<string, number>; unit?: string }
export interface Breakdown { label: string; rows: BreakdownRow[]; columns?: BreakdownColumn[]; total_row?: boolean }
export interface RenderCtx {
  client: string; period: string; currency: string;
  activity?: string; // slug d'activité (ex. "ecommerce") → repères sectoriels
  benchmarks?: Record<string, BenchOverride>; // surcharges des seuils par client
  brand?: Record<string, any> | null;
  theme?: Theme;
  metrics: Record<string, Metric>;
  history: { months: string[]; series: Record<string, (number | null)[]>; labels: Record<string, string> };
  breakdowns?: Record<string, Breakdown>;
  targets?: Record<string, number>;
  fxRate?: number; // taux AED pour 1 EUR (bascule devise) — injecté par renderDashboardWithFx ; repli constant sinon
  bridge?: Bridge | null;      // pont d'écarts de marge (déterministe) — widget "bridge"
  cashForecast?: CashForecast | null; // trésorerie à 13 semaines — widget "cash_forecast"
  points?: MonthPoint[] | null; // les 3 points du mois — widget "points"
}
export interface Widget {
  type:
    | "kpi_row" | "line" | "bar" | "donut" | "waterfall" | "table" | "callout" | "funnel" | "ranking" | "map" | "gauge" | "stacked" | "flow" | "radar" | "treemap" | "calendar"
    // bibliothèque premium étendue (composée par l'IA quand ça s'y prête) :
    | "area" | "stacked_area" | "river" | "combo" | "slope" | "matrix"
    | "rose" | "polar" | "sunburst" | "pictorial" | "lollipop" | "share" | "histogram"
    | "bullet" | "rings" | "gauge_grid" | "diverging" | "comparison" | "trend_grid" | "scorecard"
    | "matrix_table" // tableau multi-colonnes trié (perf par canal/produit) — lit un breakdown à colonnes
    | "scatter" // nuage de points volume (CA) vs marge % — lit un breakdown à colonnes
    | "points"  // les 3 points du mois (doctrine) — lit ctx.points
    | "bridge" // pont d'écarts de marge vs M-1 — lit ctx.bridge
    | "cash_forecast"; // trésorerie à 13 semaines (point bas) — lit ctx.cashForecast
  title?: string; metrics?: string[]; items?: { metric: string }[]; breakdown?: string;
  line?: string; // widget "combo" : id de la métrique tracée en courbe (2e axe)
  rows?: { label: string; value: number | null; unit?: string; type?: string; change_pct?: number | null }[];
  text?: string; tone?: "info" | "warn" | "good";
  // matrix_table :
  sort_by?: string; sort_dir?: "asc" | "desc"; highlight?: "best" | "worst" | "both"; total_row?: boolean;
}
export interface DashPlan { pages: { key?: string; title: string; widgets: Widget[] }[]; theme?: Theme }

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const periodLabel = (p: string) => { try { return new Date(p).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }); } catch { return p; } };
// Anti-injection CSS : les couleurs/police viennent de la marque (client) → on n'accepte que des valeurs sûres.
const FALLBACK_PAL = ["#4f46e5", "#ec4899", "#f59e0b", "#10b981", "#0ea5e9", "#a855f7"];
const safeColor = (c: unknown, fallback: string): string => {
  const s = String(c ?? "").trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s;
  if (/^(rgb|hsl)a?\([0-9.,%\s/]+\)$/i.test(s)) return s;
  if (/^[a-zA-Z]{1,20}$/.test(s)) return s;
  return fallback;
};
const safeFontFamily = (f: unknown): string => (String(f ?? "").replace(/[^a-zA-Z0-9 ,"'\-]/g, "").trim().slice(0, 80)) || "Inter, system-ui, sans-serif";

// Bascule devise : fmt() encapsule chaque MONTANT dans un jeton ASCII [[CV:CODE:VALEUR:TEXTE]].
// ASCII pur : traverse JSON.stringify() ET esc() sans alteration, et ne peut pas collisionner avec les donnees.
// -> spanifyMoney : corps HTML (spans .cv togglables) ; detokMoney : libelles de graphes / attributs (texte brut).
const CUR_TOK = /\[\[CV:([A-Z]{3}):(-?[\d.]+):([^\]]*)\]\]/g;
const spanifyMoney = (s: string) => s.replace(CUR_TOK, (_m, cur, val, out) => `<span class=\"cv\" data-c=\"${cur}\" data-v=\"${val}\">${out}</span>`);
const detokMoney = (s: string) => s.replace(CUR_TOK, (_m, _c, _v, out) => out);

function fmt(value: number | null | undefined, unit = "", currency = "EUR"): string {
  if (value == null || !isFinite(value)) return "n/d";
  if (unit === "%") return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
  if (unit === "x") return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}×`;
  if (unit === "j") return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} j`;
  if (unit === "" || unit == null) return value.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  const cur = unit && unit.length === 3 ? unit : currency;
  try { const out = new Intl.NumberFormat("fr-FR", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(value); return `[[CV:${cur}:${value}:${out}]]`; }
  catch { return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} ${unit}`; }
}
// Montant en texte BRUT (jeton retiré) — pour les attributs HTML et libellés où on ne peut pas injecter de <span>.
const fmtPlain = (value: number | null | undefined, unit = "", currency = "EUR"): string => detokMoney(fmt(value, unit, currency));
// Indicateurs où MOINS = MIEUX (coûts, retours, point mort…) : une hausse s'affiche en rouge.
export const LOWER_IS_BETTER = /^(refunds|refund_rate|ads_total|ads_meta|ads_google|cogs|shipping_cost|payment_fees|platform_fees|marketplace_fees|payroll|other_opex|total_opex|cac|cpa_order|cpc|cpm|breakeven_roas|stock_days|bfr|bfr_days|payback_cac|commission_rate_global|marketplace_fee_rate|psp_fee_rate)$/;
const changeHtml = (pct?: number | null, id?: string) => {
  if (pct == null) return "";
  const good = id && LOWER_IS_BETTER.test(id) ? pct <= 0 : pct >= 0;
  return `<span class="chg ${good ? "up" : "down"}">${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}%</span>`;
};

// noms FR → EN pour matcher la carte mondiale ECharts (noms anglais).
const COUNTRY_EN: Record<string, string> = {
  "france": "France", "suisse": "Switzerland", "switzerland": "Switzerland", "belgique": "Belgium", "belgium": "Belgium",
  "luxembourg": "Luxembourg", "allemagne": "Germany", "germany": "Germany", "espagne": "Spain", "spain": "Spain",
  "italie": "Italy", "italy": "Italy", "royaume-uni": "United Kingdom", "united kingdom": "United Kingdom",
  "états-unis": "United States", "etats-unis": "United States", "united states": "United States",
  "pays-bas": "Netherlands", "netherlands": "Netherlands", "portugal": "Portugal", "canada": "Canada",
  "émirats arabes unis": "United Arab Emirates", "emirats arabes unis": "United Arab Emirates", "uae": "United Arab Emirates",
  "autriche": "Austria", "irlande": "Ireland", "suède": "Sweden", "danemark": "Denmark", "norvège": "Norway", "pologne": "Poland",
  "grèce": "Greece", "japon": "Japan", "australie": "Australia", "arabie saoudite": "Saudi Arabia", "qatar": "Qatar", "maroc": "Morocco",
};
// Codes ISO 3166-1 alpha-2 (exports Shopify / 3PL) → noms de la carte. DOM-TOM et Monaco rattachés à la France.
const ISO2_EN: Record<string, string> = {
  FR: "France", RE: "France", GP: "France", MQ: "France", GF: "France", YT: "France", MC: "France",
  BE: "Belgium", CH: "Switzerland", LU: "Luxembourg", DE: "Germany", ES: "Spain", IT: "Italy", PT: "Portugal", NL: "Netherlands",
  GB: "United Kingdom", UK: "United Kingdom", IE: "Ireland", AT: "Austria", SE: "Sweden", DK: "Denmark", NO: "Norway", FI: "Finland",
  PL: "Poland", CZ: "Czech Rep.", GR: "Greece", RO: "Romania", HU: "Hungary",
  US: "United States", CA: "Canada", MX: "Mexico", BR: "Brazil", AU: "Australia", NZ: "New Zealand", JP: "Japan", KR: "Korea", CN: "China",
  SG: "Singapore", HK: "China", AE: "United Arab Emirates", SA: "Saudi Arabia", QA: "Qatar", KW: "Kuwait", IL: "Israel", TR: "Turkey",
  MA: "Morocco", TN: "Tunisia", DZ: "Algeria", ZA: "South Africa", IN: "India",
};
const toEN = (n: string) => { const t = n.trim(); return ISO2_EN[t.toUpperCase()] ?? COUNTRY_EN[t.toLowerCase()] ?? t; };

// FEUILLE DE STYLE « RAPPORT » (défaut) : éditoriale, claire, filets fins, chiffres dans la police des titres.
// Appliquée APRÈS l'ancienne feuille (elle prime) ; tout passe par les tokens du thème → réutilisable pour
// chaque client (la marque change polices, encre et accent, jamais la lisibilité).
function reportCss(th: ReturnType<typeof resolveTheme>, headFont: string): string {
  const A = safeColor(th.accent, "#C2410C"), AI = safeColor(th.accentInk, "#9A3412");
  const G = safeColor(th.good, "#1E7B4F"), W = safeColor(th.warn, "#B7791F"), B = safeColor(th.bad, "#B42318");
  return "\nbody.report{background:var(--bg);font-size:15px}\n.report .dash{max-width:1240px}\n.rhead{background:var(--card);margin:0 calc(-1*clamp(16px,4vw,30px)) 0;padding:clamp(18px,3vw,26px) clamp(16px,4vw,30px) 16px;border-bottom:1px solid var(--ink)}\n.rhead-row{display:flex;align-items:center;gap:18px;max-width:1240px;margin:0 auto}\n.rhead-logo{height:42px;max-width:150px;object-fit:contain;border-radius:3px}\n.rhead-id{flex:1;min-width:0}\n.report .eyebrow{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--mut);opacity:1;margin-bottom:4px;font-weight:600}\n.rhead h1{margin:0;font-family:HEADFONT;font-weight:400;font-size:clamp(30px,3.2vw,46px);line-height:.95;letter-spacing:.02em;text-transform:uppercase}\n.rhead-right{text-align:right;flex:0 0 auto}\n.rhead-period{font-family:HEADFONT;font-size:clamp(18px,1.6vw,24px);letter-spacing:.05em;text-transform:uppercase;line-height:1}\n.report .cur-switch{background:var(--bg);border:1px solid var(--bd);margin-top:8px}\n.report .cur-switch button{color:var(--mut);opacity:1}\n.report .cur-switch button.on{background:var(--ink);color:#fff}\n.report .tabs{gap:0;flex-wrap:nowrap;overflow-x:auto;border-bottom:1px solid var(--bd);margin:0 0 26px;scrollbar-width:none}\n.report .tab{border:0;border-radius:0;background:transparent;padding:15px 16px 12px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut);border-bottom:2px solid transparent;white-space:nowrap;font-weight:600}\n.report .tab:hover{color:var(--ink);border-color:transparent;border-bottom-color:var(--bd)}\n.report .tab.on{background:transparent;color:var(--ink);border-bottom-color:ACCENT;box-shadow:none}\n.report .page-h{border-bottom:0;margin:0 0 16px;padding:0}\n.report .page-h h2{font-family:HEADFONT;font-weight:400;font-size:clamp(26px,2.4vw,34px);letter-spacing:.03em;text-transform:uppercase;line-height:1}\n.report .grid{grid-template-columns:repeat(12,minmax(0,1fr));gap:16px}\n.report .cell.full{grid-column:1/-1}.report .cell.wide,.report .cell.half{grid-column:span 6}\n@media(max-width:900px){.report .cell.wide,.report .cell.half{grid-column:1/-1}}\n.report .card{border-radius:var(--r);box-shadow:none;border:1px solid var(--bd);padding:18px 20px 14px}\n.report .card-t{font-size:11.5px;text-transform:uppercase;letter-spacing:.13em;color:var(--mut);font-weight:600;margin-bottom:12px}\n.report .echart{height:clamp(230px,24vw,270px)}\n.report .kpis{grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:0;border:1px solid var(--bd);border-radius:var(--r);background:var(--card);overflow:hidden}\n.rkpi{padding:16px 18px 8px;border-right:1px solid var(--bd);border-bottom:1px solid var(--bd);margin:0 -1px -1px 0;display:flex;flex-direction:column;min-height:138px;position:relative;min-width:0}\n.rkpi-l{font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--mut);font-weight:600;line-height:1.35;min-height:28px}\n.rkpi-v{font-family:HEADFONT;font-size:clamp(28px,2.3vw,38px);line-height:1;letter-spacing:.01em;margin-top:6px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.rkpi-f{display:flex;align-items:center;gap:6px;margin-top:8px}\n.rkpi-vs{font-size:11px;color:var(--mut)}\n.rkpi-b{font-size:11px;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}\n.report .rkpi .rk-spark{height:26px;width:100%;margin-top:auto}\n.report .kpi-drill:hover{transform:none;background:var(--bg);box-shadow:none}\n.report .kpi-drill::after{top:12px;right:12px}\n.report .chg{border-radius:3px;font-size:11px;padding:1px 6px}\n.report .chg.up{color:GOODC;background:#1E7B4F14}.report .chg.down{color:BADC;background:#B4231812}\n.report .b-good{color:GOODC}.report .b-warn{color:WARNC}.report .b-bad{color:BADC}\n.report .pts{border:1px solid var(--bd);border-left:3px solid ACCENT;background:var(--card);padding:18px 22px 16px}\n.report .pts .card-t{color:var(--ink)}\n.report .pts-l{gap:11px}\n.report .pt{font-size:16px;line-height:1.45}\n.report .pt::before{background:var(--ink);border-radius:2px;width:24px;height:24px;font-family:HEADFONT;font-weight:400;font-size:16px}\n.report .pt.warn::before{background:WARNC}.report .pt.good::before{background:GOODC}\n.report .callout{border:1px solid var(--bd);border-left:3px solid var(--ink);border-radius:var(--r);font-size:14.5px;line-height:1.55;padding:14px 18px}\n.report .callout.warn{border-left-color:WARNC}.report .callout.good{border-left-color:GOODC}\n.report .co-ic{display:none}\n.report .co-t{font-size:11.5px;text-transform:uppercase;letter-spacing:.13em;color:var(--mut);font-weight:600;margin-bottom:5px}\n.report .tbl{font-size:14px}.report .tbl th{letter-spacing:.1em}\n.report .tbl tr.tot td{border-top:1px solid var(--ink)}\n.report .rk-track{height:6px;border-radius:0}.report .rk-bar{border-radius:0}\n.report .foot{letter-spacing:.16em}\n.report a{color:ACCENTINK}\n@media(max-width:640px){.rhead-row{flex-wrap:wrap}.rhead-right{text-align:left}.report .page-h h2{font-size:24px}}\n"
    .replace(/HEADFONT/g, headFont).replace(/ACCENTINK/g, AI).replace(/ACCENT/g, A)
    .replace(/GOODC/g, G).replace(/WARNC/g, W).replace(/BADC/g, B);
}

export function renderDashboard(ctx: RenderCtx, plan: DashPlan): string {
  const th = resolveTheme(ctx.brand, ctx.theme ?? plan.theme ?? {});
  const primary = safeColor(th.primary, "#4f46e5");
  const accent = safeColor(th.accent, "#ec4899");
  const palette = (Array.isArray(th.palette) && th.palette.length ? th.palette : FALLBACK_PAL).map((c, i) => safeColor(c, FALLBACK_PAL[i % FALLBACK_PAL.length]));
  const font = safeFontFamily(th.font);
  const headFont = safeFontFamily(th.headingFont);
  const GOOD = safeColor(th.good, "#16a34a"), BAD = safeColor(th.bad, "#e24b4a");
  const SUBTOT = th.report ? `${th.ink}8C` : accent; // sous-totaux d'une cascade : encre adoucie
  const charts: any[] = [];
  let cid = 0;
  const M = ctx.metrics;
  const has = (id: string) => M[id] && M[id].value != null;
  // "full" = pleine largeur (graphes larges) ; "wide" = 2/3 ; le reste tient en 1/3 pour densifier (4-10 widgets/page).
  // callout = bandeau d'analyse → TOUJOURS pleine largeur (bande fine sur toute la largeur, jamais un bloc 1/3 épais).
  const fullTypes = new Set(["kpi_row", "map", "flow", "calendar", "matrix", "river", "table", "trend_grid", "sankey", "scorecard", "matrix_table", "callout", "points"]);
  const wideTypes = new Set(["funnel", "waterfall", "combo", "stacked_area", "stacked", "comparison", "histogram", "scatter", "bridge", "cash_forecast"]);
  const cellCls = (t: string) => (fullTypes.has(t) ? "full" : wideTypes.has(t) ? "wide" : "half");
  const col = (i: number) => palette[i % palette.length];
  // Couleur qui se DISTINGUE d'une autre (ex. courbe sur des barres) : accent si assez contrasté, sinon palette.
  const distinctFrom = (c: string) => contrast(accent, c) >= 2 ? accent : (palette.find((x) => contrast(x, c) >= 2) ?? "#C2410C");
  const chCard = (id: string, title: string, cls = "echart") => `<div class="card chartcard"><div class="card-t">${esc(title)}</div><div class="${cls}" id="${id}"></div></div>`;
  const hist = (id: string) => ctx.history.series[id]; // série temporelle d'une métrique (ou undefined)
  const lab = (id: string) => ctx.history.labels[id] ?? M[id]?.label ?? id;
  const hasTarget = (id: string) => has(id) && ctx.targets?.[id] != null && isFinite(ctx.targets[id]) && (ctx.targets[id] as number) > 0;
  // "Répartition" : lignes depuis un breakdown nommé OU directement depuis une liste de métriques (w.metrics).
  const repRows = (w: Widget, opts?: { positive?: boolean }): { label: string; value: number; unit?: string }[] => {
    if (w.breakdown && ctx.breakdowns?.[w.breakdown]?.rows?.length) return ctx.breakdowns[w.breakdown].rows;
    let rows = (w.metrics ?? []).filter(has).map((id) => ({ label: M[id].label, value: M[id].value as number, unit: M[id].unit }));
    if (opts?.positive) rows = rows.filter((r) => r.value > 0);
    return rows;
  };
  const repLabel = (w: Widget, def: string) => (w.breakdown ? ctx.breakdowns?.[w.breakdown]?.label : undefined) ?? w.title ?? def;

  // Drill-down : pour un KPI donné, quels breakdowns du client sont pertinents (triés par affinité).
  // Générique (aucune hypothèse client) : score par mots-clés id-métrique ↔ clé-breakdown.
  const bkAll = Object.keys(ctx.breakdowns ?? {});
  const drillKeys = (id: string): string[] => {
    if (!bkAll.length) return [];
    const k = id.toLowerCase();
    const money = /\bca\b|sale|revenue|resultat|marge|ebitda|aov|ads|cash|gross|honorair/.test(k);
    const traffic = /session|visit|conversion|cart|traffic|panier/.test(k);
    const orders = /order|commande|units|article/.test(k);
    const score = (key: string) => {
      const kk = key.toLowerCase(); let s = 0;
      if (/daily|jour|day|date/.test(kk)) s += 2;                       // le détail temporel est presque toujours utile
      if (traffic && /session|visit|traffic/.test(kk)) s += 4;
      if (money && /sale|ca|revenue|encaiss|amount|montant/.test(kk)) s += 3;
      if ((money || orders) && /product|produit|item|sku/.test(kk)) s += 3;
      if (/country|pays|geo|region|ville|city/.test(kk)) s += (money || traffic ? 2 : 1);
      return s;
    };
    return bkAll.slice().sort((a, b) => score(b) - score(a));
  };

  // Tuile « rapport » : hauteur fixe, grand chiffre (police des titres), variation + verdict sur une ligne,
  // mini-courbe fine en pied (couleur d'encre, pas d'aplat) — lisible d'un coup d'œil, identique partout.
  const reportTile = (id: string): string => {
    const m = M[id];
    const dCls = drillKeys(id).length ? " kpi-drill" : "";
    const dAttr = dCls ? ` data-drill="${esc(id)}" role="button" tabindex="0"` : "";
    let spHtml = "";
    if (ctx.history.series[id] && ctx.history.months.length > 2) { const spId = `ch${cid++}`; charts.push({ id: spId, kind: "spark", color: th.ink, data: ctx.history.series[id] }); spHtml = `<div class="rk-spark echart" id="${spId}"></div>`; }
    let vb = assess(id, m.value, ctx.activity, ctx.benchmarks);
    if (id === "mer" && has("breakeven_roas")) {
      const head = M.ads_headroom?.value, v = head != null ? assess("ads_headroom", head, ctx.activity, ctx.benchmarks) : null;
      vb = { level: v?.level ?? "warn", note: `point mort ${fmtPlain(M.breakeven_roas.value, "x")}${head != null ? ` · sécurité ${head >= 0 ? "+" : ""}${Math.round(head)} %` : ""}` };
    }
    if (id === "cash_end" && ctx.cashForecast?.low) {
      const f = ctx.cashForecast, d = f.low.date;
      vb = { level: f.below_zero ? "bad" : f.low.balance < f.start.balance * 0.5 ? "warn" : "good", note: `point bas ${fmtPlain(f.low.balance, ctx.currency, ctx.currency)} le ${d.slice(8, 10)}/${d.slice(5, 7)}` };
    }
    return `<div class="rkpi${dCls}"${dAttr}><div class="rkpi-l">${esc(m.label)}</div><div class="rkpi-v">${esc(fmt(m.value, m.unit, ctx.currency))}</div>` +
      `<div class="rkpi-f">${changeHtml(m.change_pct, id) || '<span class="chg flat">—</span>'}<span class="rkpi-vs">vs M-1</span></div>` +
      (vb ? `<div class="rkpi-b b-${vb.level}" title="${esc(vb.note)}">${esc(vb.note)}</div>` : "") + spHtml + `</div>`;
  };
  const kpiTile = (id: string, i: number): string => {
    if (th.report) return reportTile(id);
    const m = M[id]; const c = col(i);
    const dCls = drillKeys(id).length ? " kpi-drill" : "";                 // KPI cliquable si un détail existe
    const dAttr = dCls ? ` data-drill="${esc(id)}" role="button" tabindex="0"` : "";
    const sp = ctx.history.series[id] && ctx.history.months.length > 1;
    let spHtml = "";
    if (sp) { const spId = `ch${cid++}`; charts.push({ id: spId, kind: "spark", color: c, data: ctx.history.series[id] }); spHtml = `<div class="spark echart" id="${spId}"></div>`; }
    const foot = `<div class="kpi-foot">${changeHtml(m.change_pct, id) || '<span class="chg flat">—</span>'}${spHtml}</div>`;
    const vb = assess(id, m.value, ctx.activity, ctx.benchmarks); // verdict (repères secteur + surcharges client)
    const benchHtml = vb ? `<div class="kpi-bench b-${vb.level}">${esc(vb.note)}</div>` : "";
    const main = `<div class="kpi-main"><div class="kpi-l">${esc(m.label)}</div><div class="kpi-v">${esc(fmt(m.value, m.unit, ctx.currency))}</div>${foot}${benchHtml}</div>`;
    if (th.kpi === "icon" || th.kpi === "glass") return `<div class="kpi k-icon${dCls}"${dAttr}><div class="kpi-ic" style="background:${c}1f;color:${c}">${iconSvg(iconFor(id, th.icons[id]), c)}</div>${main}</div>`;
    if (th.kpi === "gradient") return `<div class="kpi k-grad${dCls}" style="background:linear-gradient(135deg, ${c}14, transparent)"${dAttr}><div class="kpi-bar" style="background:${c}"></div>${main}</div>`;
    if (th.kpi === "plain") return `<div class="kpi k-plain${dCls}"${dAttr}>${main}</div>`;
    return `<div class="kpi k-accent${dCls}"${dAttr}><div class="kpi-bar" style="background:${c}"></div>${main}</div>`;
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
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? `${ids.map(lab).join(" · ")} — évolution`)}</div><div class="echart" id="${id}"></div></div>`;
      }
      case "bar": {
        const ids = (w.metrics ?? []).filter((id) => has(id));
        if (!ids.length) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "bar", labels: ids.map((mid) => M[mid].label), data: ids.map((mid) => M[mid].value), colors: ids.map((mid, i) => (M[mid].value! < 0 ? "#e24b4a" : col(i))) });
        return chCard(id, w.title ?? "Comparaison");
      }
      case "waterfall": {
        // Cascade P&L lisible : on ANCRE les sous-totaux (CA, marge brute, EBITDA, résultat net) à leur vraie
        // valeur (barre 0→valeur) et, entre deux, une barre FLOTTANTE matérialise la variation (coût/charge).
        const ids = (w.metrics ?? []).filter(has);
        if (ids.length < 2) return "";
        const labels: string[] = []; const base: number[] = []; const delta: number[] = []; const colors: string[] = []; const real: number[] = [];
        const push = (l: string, b: number, d: number, c: string, r: number) => { labels.push(l); base.push(b); delta.push(d); colors.push(c); real.push(r); };
        // Doctrine : cascade CA → CM1 → CM2 → CM3 quand elle existe ; sinon l'ancienne chaîne P&L.
        const cmChain = ["ca", "cm1", "cm2", "cm3"].filter(has);
        const chain = cmChain.length >= 3 ? cmChain : ["ca", "marge_brute", "ebitda", "resultat_net"].filter(has);
        const dl: Record<string, string> = { "ca>marge_brute": M["cogs"]?.label ?? "Coût des ventes", "marge_brute>ebitda": M["total_opex"]?.label ?? "Charges", "ebitda>resultat_net": "Impôts & autres",
          "ca>cm1": "Coût des marchandises", "cm1>cm2": "Logistique & paiement", "cm2>cm3": "Publicité", "cm1>cm3": "Opérations & pub" };
        if (chain.length >= 2 && chain[0] === "ca") {
          for (let i = 0; i < chain.length; i++) {
            const v = M[chain[i]].value as number;
            if (i > 0) {
              const prevV = M[chain[i - 1]].value as number; const change = v - prevV;
              const label = dl[`${chain[i - 1]}>${chain[i]}`] ?? "Variation";
              if (change >= 0) push(label, prevV, change, GOOD, change);
              else push(label, v, -change, BAD, change);
            }
            const SHORT: Record<string, string> = { ca: "CA net", cm1: "CM1", cm2: "CM2", cm3: "CM3", marge_brute: "Marge brute", ebitda: "EBITDA", resultat_net: "Résultat net" };
            push(th.report ? (SHORT[chain[i]] ?? M[chain[i]].label) : M[chain[i]].label, 0, v, i === 0 || i === chain.length - 1 ? primary : SUBTOT, v);
          }
        } else {
          let prev = 0;
          ids.forEach((mid, i) => {
            const v = M[mid].value as number;
            if (i === 0) push(M[mid].label, 0, v, primary, v);
            else if (v >= prev) push(M[mid].label, prev, v - prev, "#16a34a", v);
            else push(M[mid].label, v, prev - v, "#e24b4a", v);
            prev = v;
          });
        }
        const id = `ch${cid++}`;
        charts.push({ id, kind: "waterfall", labels, base, delta, colors, real });
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
        // Codes pays agrégés (RE + FR → France). Couleur sur la RACINE de la valeur : le pays n°1 n'écrase
        // pas les autres (sinon tout sauf lui paraît gris) ; le tooltip garde la valeur réelle.
        const agg = new Map<string, number>();
        for (const r of bk.rows) { const n = toEN(r.label); agg.set(n, (agg.get(n) ?? 0) + r.value); }
        const items = [...agg].map(([name, v]) => ({ name, value: Math.sqrt(Math.max(0, v)), raw: v }));
        const EU = /^(France|Belgium|Switzerland|Luxembourg|Germany|Spain|Italy|Portugal|Netherlands|United Kingdom|Ireland|Austria|Sweden|Denmark|Norway|Finland|Poland|Czech Rep\.|Greece|Romania|Hungary)$/;
        const tot = [...agg.values()].reduce((s, v) => s + v, 0) || 1;
        const euShare = [...agg].filter(([n]) => EU.test(n)).reduce((s, [, v]) => s + v, 0) / tot;
        charts.push({ id, kind: "map", items, color: primary, min: Math.min(...items.map((x) => x.value)), max: Math.max(...items.map((x) => x.value)) || 1, europe: euShare >= 0.7 });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? bk.label)}</div><div class="echart echart-map" id="${id}"></div></div>`;
      }
      case "ranking": {
        const rows = repRows(w).slice(0, 8);
        if (rows.length < 2) return "";
        const max = Math.max(...rows.map((r) => Math.abs(r.value))) || 1;
        const total = rows.reduce((s, r) => s + r.value, 0) || 1;
        return `<div class="card"><div class="card-t">${esc(repLabel(w, "Classement"))}</div><div class="rank">${rows.map((r, i) => {
          const pct = Math.max(4, Math.round((Math.abs(r.value) / max) * 100));
          const share = Math.round((r.value / total) * 1000) / 10;
          return `<div class="rk-row"><div class="rk-l" title="${esc(r.label)}">${esc(r.label)}</div><div class="rk-track"><div class="rk-bar" style="width:${pct}%;background:${th.report ? (i === 0 ? th.ink : `${th.ink}99`) : col(i)}"></div></div><div class="rk-v">${esc(fmt(r.value, r.unit ?? "", ctx.currency))} <span class="rk-s">${share}%</span></div></div>`;
        }).join("")}</div></div>`;
      }
      case "table": {
        const rows = (w.rows ?? (w.metrics ?? []).filter(has).map((id) => ({ label: M[id].label, value: M[id].value, unit: M[id].unit, change_pct: M[id].change_pct, type: undefined })));
        if (!rows.length) return "";
        // Compte de résultat annoté : colonne « % du CA » quand un CA existe et que les montants sont monétaires.
        const caVal = has("ca") ? (M["ca"].value as number) : null;
        const isMoney = (r: { unit?: string }) => !["%", "x", "j", "pts"].includes(r.unit ?? "");
        const showPct = !!caVal && caVal !== 0 && rows.filter((r) => typeof r.value === "number" && isMoney(r)).length >= 2;
        const anyChg = rows.some((r) => r.change_pct != null);
        const head = `<thead><tr><th>Poste</th><th class="num">Montant</th>${showPct ? '<th class="num">% CA</th>' : ""}${anyChg ? '<th class="num">vs M-1</th>' : ""}</tr></thead>`;
        const body = rows.map((r) => {
          const pctCell = showPct ? `<td class="num pct">${typeof r.value === "number" && isMoney(r) ? `${Math.round((r.value / (caVal as number)) * 1000) / 10} %` : ""}</td>` : "";
          const chgCell = anyChg ? `<td class="num">${changeHtml(r.change_pct)}</td>` : "";
          return `<tr class="${r.type === "total" ? "tot" : ""}"><td>${esc(r.label)}</td><td class="num">${esc(fmt(r.value as number, r.unit, ctx.currency))}</td>${pctCell}${chgCell}</tr>`;
        }).join("");
        return `<div class="card"><div class="card-t">${esc(w.title ?? "Détail")}</div><table class="tbl">${head}<tbody>${body}</tbody></table></div>`;
      }
      case "funnel": {
        const ids = (w.metrics ?? []).filter(has);
        if (ids.length < 2) return "";
        const top = M[ids[0]].value || 1;
        const items = ids.map((id, i) => {
          const m = M[id]; const val = m.value ?? 0;
          const prev = i > 0 ? (M[ids[i - 1]].value ?? 0) : 0;
          const conv = i > 0 && prev > 0 ? Math.round((val / prev) * 1000) / 10 : null;
          return { name: m.label, value: val, color: th.report ? [th.ink, `${th.ink}B3`, `${th.ink}66`, `${th.ink}40`][i] ?? `${th.ink}33` : col(i), real: fmt(val, m.unit, ctx.currency), pct: Math.round((val / top) * 1000) / 10, conv };
        });
        const id = `ch${cid++}`;
        charts.push({ id, kind: "funnel", items });
        return chCard(id, w.title ?? "Entonnoir de conversion");
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
        // Référentiel COMMUN à 100 (sinon hexagone régulier illisible) : % de la cible si dispo, sinon % vs M-1.
        const tgtCount = ids.filter((mid) => ctx.targets?.[mid] != null && (ctx.targets[mid] as number) > 0).length;
        const prevOf = (mid: string) => { const v = M[mid].value ?? 0; const p = M[mid].change_pct; return p != null && p !== -100 ? v / (1 + p / 100) : v; };
        let series: { name: string; value: number[]; color: string; dash?: boolean }[];
        let refLabel: string;
        if (tgtCount >= Math.ceil(ids.length / 2)) {
          refLabel = "Atteinte des objectifs (100 % = cible)";
          series = [
            { name: "Réalisé", value: ids.map((mid) => { const t = ctx.targets?.[mid]; return t && t > 0 ? Math.round(((M[mid].value ?? 0) / t) * 100) : 100; }), color: primary },
            { name: "Objectif", value: ids.map(() => 100), color: accent, dash: true },
          ];
        } else {
          refLabel = "Performance vs M-1 (100 = stable)";
          series = [
            { name: "Ce mois", value: ids.map((mid) => { const p = prevOf(mid); return p ? Math.round(((M[mid].value ?? 0) / p) * 100) : 100; }), color: primary },
            { name: "M-1", value: ids.map(() => 100), color: accent, dash: true },
          ];
        }
        const peak = Math.max(120, ...series.flatMap((s) => s.value));
        const indicators = ids.map((mid) => ({ name: M[mid].label, max: Math.ceil(peak / 10) * 10 }));
        charts.push({ id, kind: "radar", indicators, series, ref: 100 });
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Profil de performance")} <span class="card-sub">· ${esc(refLabel)}</span></div><div class="echart" id="${id}"></div></div>`;
      }
      case "treemap": {
        const rows = repRows(w, { positive: true }).slice(0, 12);
        if (rows.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "treemap", items: rows.map((r, i) => ({ name: r.label, value: Math.abs(r.value), color: col(i) })) });
        return chCard(id, repLabel(w, "Répartition"));
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
        charts.push({ id, kind: "combo", labels: ctx.history.months, bars: barIds.slice(0, 3).map((mid, i) => ({ name: lab(mid), data: hist(mid), color: col(i) })), line: { name: lab(lineId), data: hist(lineId), color: distinctFrom(col(0)) }, lineUnit: M[lineId]?.unit ?? "" });
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
        const rows = repRows(w, { positive: true }).slice(0, 10);
        if (rows.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "rose", items: rows.map((r, i) => ({ name: r.label, value: r.value, color: col(i) })) });
        return chCard(id, repLabel(w, "Répartition"));
      }
      case "polar": {
        const rows = repRows(w).slice(0, 8);
        if (rows.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "polarbar", labels: rows.map((r) => r.label), data: rows.map((r) => Math.abs(r.value)), colors: rows.map((_, i) => col(i)), max: (Math.max(...rows.map((r) => Math.abs(r.value))) || 1) * 1.1 });
        return chCard(id, repLabel(w, "Classement"));
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
        const rows = repRows(w).slice(0, 7);
        if (rows.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "pictorial", labels: rows.map((r) => r.label), data: rows.map((r) => Math.abs(r.value)), colors: rows.map((_, i) => col(i)), max: (Math.max(...rows.map((r) => Math.abs(r.value))) || 1) * 1.15, fmts: rows.map((r) => fmt(r.value, r.unit ?? "", ctx.currency)) });
        return chCard(id, repLabel(w, "Comparaison"));
      }
      case "lollipop": {
        const rows = repRows(w).slice(0, 8);
        if (rows.length < 2) return "";
        const id = `ch${cid++}`;
        charts.push({ id, kind: "lollipop", labels: rows.map((r) => r.label), data: rows.map((r) => Math.abs(r.value)), colors: rows.map((_, i) => col(i)), max: (Math.max(...rows.map((r) => Math.abs(r.value))) || 1) * 1.15, fmts: rows.map((r) => fmt(r.value, r.unit ?? "", ctx.currency)) });
        return chCard(id, repLabel(w, "Classement"));
      }
      case "share": {
        const rows = repRows(w, { positive: true }).slice(0, 8);
        if (rows.length < 2) return "";
        const total = rows.reduce((s, r) => s + r.value, 0) || 1;
        const seg = rows.map((r, i) => `<div class="sh-seg" style="width:${((r.value / total) * 100).toFixed(2)}%;background:${col(i)}" title="${esc(r.label)} : ${esc(fmtPlain(r.value, r.unit ?? "", ctx.currency))}"></div>`).join("");
        const leg = rows.map((r, i) => `<div class="sh-li"><span class="sh-dot" style="background:${col(i)}"></span>${esc(r.label)} <b>${((r.value / total) * 100).toFixed(1)}%</b></div>`).join("");
        return `<div class="card"><div class="card-t">${esc(repLabel(w, "Répartition"))}</div><div class="sh-bar">${seg}</div><div class="sh-leg">${leg}</div></div>`;
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
          return `<div class="blt-row"><div class="blt-h"><span>${esc(m.label)}</span><span class="blt-vv">${esc(fmt(v, m.unit, ctx.currency))} <span class="blt-pct ${ok ? "ok" : ""}">${pct}%</span></span></div><div class="blt-track"><div class="blt-fill" style="width:${pct}%;background:${c}"></div><div class="blt-tgt" title="cible ${esc(fmtPlain(t, m.unit, ctx.currency))}"></div></div></div>`;
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
          return `<div class="tg-c"><div class="tg-l">${esc(m.label)}</div><div class="tg-v">${esc(fmt(m.value, m.unit, ctx.currency))}</div><div class="tg-f">${changeHtml(m.change_pct, id) || '<span class="chg flat">—</span>'}</div><div class="tg-s echart" id="${spId}"></div></div>`;
        }).join("")}</div></div>`;
      }
      case "scorecard": {
        // Diagnostic synthétique : compte les indicateurs sains / à surveiller / en alerte (via les repères).
        type SI = { label: string; value: number; unit: string; level: string; note: string };
        const items: SI[] = (w.metrics ?? Object.keys(M)).map((id) => {
          if (!has(id)) return null; const v = assess(id, M[id].value, ctx.activity, ctx.benchmarks);
          return v ? { label: M[id].label, value: M[id].value as number, unit: M[id].unit, level: v.level, note: v.note } : null;
        }).filter(Boolean) as SI[];
        if (items.length < 3) return "";
        const cnt = (lv: string) => items.filter((x) => x.level === lv).length;
        const chip = (x: SI) => `<div class="sc-chip b-${x.level}"><span class="sc-dot"></span><div><div class="sc-cl">${esc(x.label)} · <b>${esc(fmt(x.value, x.unit, ctx.currency))}</b></div><div class="sc-cn">${esc(x.note)}</div></div></div>`;
        const strengths = items.filter((x) => x.level === "good").slice(0, 5);
        const alerts = items.filter((x) => x.level !== "good").sort((a, b) => (a.level === "bad" ? 0 : 1) - (b.level === "bad" ? 0 : 1)).slice(0, 6);
        return `<div class="card sc"><div class="card-t">${esc(w.title ?? "Diagnostic du mois")}</div>` +
          `<div class="sc-stats"><div class="sc-stat b-good"><div class="sc-n">${cnt("good")}</div><div class="sc-sl">sains</div></div>` +
          `<div class="sc-stat b-warn"><div class="sc-n">${cnt("warn")}</div><div class="sc-sl">à surveiller</div></div>` +
          `<div class="sc-stat b-bad"><div class="sc-n">${cnt("bad")}</div><div class="sc-sl">en alerte</div></div></div>` +
          `<div class="sc-cols"><div><div class="sc-h">Points forts</div>${strengths.length ? strengths.map(chip).join("") : '<div class="sc-empty">—</div>'}</div>` +
          `<div><div class="sc-h">Points de vigilance</div>${alerts.length ? alerts.map(chip).join("") : '<div class="sc-empty">—</div>'}</div></div></div>`;
      }
      case "points": {
        // LES 3 POINTS DU MOIS : une ligne chacun (filtre > exhaustivité), dans l'ordre doctrinal.
        const pts = (ctx.points ?? []).slice(0, 3);
        if (!pts.length) return "";
        return `<div class="card pts"><div class="card-t">${esc(w.title ?? "Les 3 points du mois")}</div><ol class="pts-l">${pts.map((p) =>
          `<li class="pt ${p.tone}"><span class="pt-d"></span><span>${esc(p.text)}</span></li>`).join("")}</ol></div>`;
      }
      case "bridge": {
        // PONT D'ÉCARTS : marge de la base → effets (volume, panier, retours, marge produit, logistique,
        // paiement, pub) → marge du mois. Calcul déterministe (marginBridge) ; somme des effets = variation.
        const b = ctx.bridge;
        if (!b || !b.effects.length) return "";
        const lv = b.level.toUpperCase();
        const labels: string[] = []; const base: number[] = []; const delta: number[] = []; const colors: string[] = []; const real: number[] = [];
        const push = (l: string, bs: number, d: number, c: string, r: number) => { labels.push(l); base.push(bs); delta.push(d); colors.push(c); real.push(r); };
        push(`${lv} ${b.base}`, Math.min(0, b.from), Math.abs(b.from), primary, b.from);
        let run = b.from;
        for (const e of [...b.effects].sort((x, y) => y.value - x.value)) {
          const next = run + e.value;
          const SH: Record<string, string> = { volume: "Volume", panier: "Panier", retours: "Retours", marge_produit: "Marge produit", logistique: "Logistique", paiement: "Paiement", pub: "Pub" };
          push(th.report ? (SH[e.key] ?? e.label) : e.label.replace(/ \(.*\)$/, ""), Math.min(run, next), Math.abs(e.value), e.value >= 0 ? GOOD : BAD, e.value);
          run = next;
        }
        push(`${lv} ce mois`, Math.min(0, b.to), Math.abs(b.to), primary, b.to);
        const id = `ch${cid++}`;
        charts.push({ id, kind: "waterfall", labels, base, delta, colors, real });
        return chCard(id, w.title ?? `Pourquoi la marge a bougé (${lv}, vs ${b.base})`);
      }
      case "cash_forecast": {
        // TRÉSORERIE À 13 SEMAINES : solde projeté fin de semaine (rythme constant) + point bas daté.
        const f = ctx.cashForecast;
        if (!f || !f.weeks?.length) return "";
        const d = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
        const id = `ch${cid++}`;
        const series = [{ name: f.plan ? "Au rythme actuel" : "Trésorerie projetée", data: [f.start.balance, ...f.weeks.map((x) => x.balance)], color: f.below_zero ? "#e24b4a" : primary }];
        if (f.plan?.weeks?.length) series.push({ name: `Selon ton ${f.plan.label}`, data: [f.start.balance, ...f.plan.weeks.map((x) => x.balance)], color: distinctFrom(primary) });
        charts.push({ id, kind: "line", labels: [d(f.start.date), ...f.weeks.map((x) => d(x.week_start))], series });
        const m = (x: number) => fmt(x, ctx.currency, ctx.currency);
        const lowOf = (s: { low: { date: string; balance: number }; below_zero?: string }) => s.below_zero
          ? `passage sous zéro le ${d(s.below_zero)} · point bas ${m(s.low.balance)} le ${d(s.low.date)}` : `point bas ${m(s.low.balance)} le ${d(s.low.date)}`;
        const lowTxt = f.plan ? `Au rythme actuel : ${lowOf(f)} — selon ton ${f.plan.label} : ${lowOf(f.plan)}` : lowOf(f).replace(/^./, (c) => c.toUpperCase());
        const notes = [f.hypotheses?.[0] ?? "", ...(f.oneoffs?.length ? [`Sorties ponctuelles non reconduites : ${f.oneoffs.slice(0, 3).map((o) => `${o.counterparty} ${m(o.amount)}`).join(", ")}.`] : []),
          ...(f.neutralized ? [`Virements entre tes comptes neutralisés (${m(f.neutralized)}).`] : [])].filter(Boolean);
        return `<div class="card chartcard"><div class="card-t">${esc(w.title ?? "Trésorerie à 13 semaines")}</div>` +
          `<div class="co-t" style="margin:2px 0 6px;color:${f.below_zero ? "#dc2626" : "inherit"}">${esc(lowTxt)}</div><div class="echart" id="${id}"></div>` +
          `<div style="font-size:11.5px;opacity:.7;margin-top:6px">Projection (hypothèse) : ${esc(notes.join(" "))}</div></div>`;
      }
      case "callout": {
        if (!w.text) return "";
        const tone = w.tone ?? "info";
        const ic = tone === "good" ? "✓" : tone === "warn" ? "!" : "i";
        return `<div class="callout ${tone}"><span class="co-ic">${ic}</span><div>${w.title ? `<div class="co-t">${esc(w.title)}</div>` : ""}<div>${esc(w.text)}</div></div></div>`;
      }
      case "matrix_table": {
        // Tableau MULTI-COLONNES trié (perf par canal/produit) : une ligne = un canal, N colonnes chiffrées.
        // Rendu dans le corps HTML (via fmt → jetons [[CV:]]) → la bascule FX s'applique aux montants.
        const bk = w.breakdown ? ctx.breakdowns?.[w.breakdown] : undefined;
        if (!bk || !bk.rows?.length || !bk.columns?.length) return "";
        const cols = bk.columns;
        const val = (r: BreakdownRow, key: string): number | undefined =>
          r.values?.[key] ?? (key === (cols.find((c) => c.sort)?.key) ? r.value : undefined);
        const sortCol = (w.sort_by && cols.find((c) => c.key === w.sort_by)) || cols.find((c) => c.sort) || cols.find((c) => c.emphasis) || cols[0];
        const dir = w.sort_dir ?? "desc";
        const rows = [...bk.rows].sort((a, b) => {
          const av = val(a, sortCol.key), bv = val(b, sortCol.key);
          const an = av == null ? -Infinity : av, bn = bv == null ? -Infinity : bv;
          return dir === "asc" ? an - bn : bn - an;
        });
        const empCol = cols.find((c) => c.emphasis);
        const empMax = empCol ? (Math.max(...rows.map((r) => Math.abs(val(r, empCol.key) ?? 0))) || 1) : 1;
        const hiVals = rows.map((r) => val(r, sortCol.key) ?? 0);
        const best = Math.max(...hiVals), worst = Math.min(...hiVals);
        const wantBest = w.highlight === "best" || w.highlight === "both";
        const wantWorst = w.highlight === "worst" || w.highlight === "both";
        const unitCur = (u?: string) => (u === "CUR" ? ctx.currency : (u ?? ""));
        const cell = (r: BreakdownRow, c: BreakdownColumn) => {
          const v = val(r, c.key);
          const inner = v == null ? "–" : fmt(v, unitCur(c.unit), ctx.currency);
          const negCss = (typeof v === "number" && v < 0) ? "color:#dc2626;font-weight:600;" : ""; // valeur négative (perte) → rouge
          if (empCol && c.key === empCol.key) {
            const pct = Math.max(3, Math.round((Math.abs(v ?? 0) / empMax) * 100));
            return `<td class="num" style="position:relative"><div style="position:absolute;left:0;top:2px;bottom:2px;width:${pct}%;background:${primary}22;border-radius:3px;z-index:0"></div><span style="position:relative;z-index:1;${negCss}">${esc(inner)}</span></td>`;
          }
          return `<td class="num" style="${negCss}">${esc(inner)}</td>`;
        };
        const head = `<thead><tr><th></th>${cols.map((c) => `<th class="num">${esc(c.label)}</th>`).join("")}</tr></thead>`;
        const body = rows.map((sv) => {
          const s = val(sv, sortCol.key) ?? 0;
          const bg = wantBest && s === best ? "background:#10b9811f" : wantWorst && s === worst ? "background:#ef44441f" : "";
          return `<tr${bg ? ` style="${bg}"` : ""}><td>${esc(sv.label)}</td>${cols.map((c) => cell(sv, c)).join("")}</tr>`;
        }).join("");
        let totalRow = "";
        if ((w.total_row ?? bk.total_row) && rows.length) {
          const additive = (c: BreakdownColumn) => (c.unit === "CUR" || c.unit === "" || c.unit == null) && c.key !== "aov"; // pas de somme pour %/x/j ni pour une moyenne (AOV)
          const tot = (c: BreakdownColumn) => {
            if (!additive(c)) return `<td class="num"></td>`;
            const s = rows.reduce((acc, r) => acc + (val(r, c.key) ?? 0), 0);
            return `<td class="num">${esc(fmt(s, unitCur(c.unit), ctx.currency))}</td>`;
          };
          totalRow = `<tr class="tot"><td>Total</td>${cols.map(tot).join("")}</tr>`;
        }
        return `<div class="card"><div class="card-t">${esc(w.title ?? bk.label)}</div><div style="overflow-x:auto"><table class="tbl">${head}<tbody>${body}${totalRow}</tbody></table></div></div>`;
      }
      case "scatter": {
        // Nuage de points : X = volume (CA), Y = marge % → repère les gros volumes à FAIBLE marge.
        // Lit un breakdown À COLONNES (channel_performance / category_performance…). SVG (corps HTML).
        const bk = w.breakdown ? ctx.breakdowns?.[w.breakdown] : undefined;
        if (!bk || !bk.rows?.length || !bk.columns?.length) return "";
        const cols = bk.columns;
        const uc = (u?: string) => (u === "CUR" ? ctx.currency : (u ?? ""));
        const xCol = cols.find((c) => c.emphasis) || cols.find((c) => c.unit === "CUR") || cols[0];
        const yCol = cols.find((c) => c.unit === "%");
        if (!xCol || !yCol) return "";
        const pts = bk.rows.map((r) => ({ label: r.label, x: r.values?.[xCol.key], y: r.values?.[yCol.key] }))
          .filter((p) => typeof p.x === "number" && typeof p.y === "number") as { label: string; x: number; y: number }[];
        if (pts.length < 2) return "";
        const W = 320, H = 190, pl = 6, pr = 6, ptp = 8, pb = 16;
        const maxX = Math.max(...pts.map((p) => p.x)) || 1;
        const ys = pts.map((p) => p.y); const maxY = Math.max(...ys, 0), minY = Math.min(...ys, 0);
        const sx = (v: number) => pl + (v / maxX) * (W - pl - pr);
        const sy = (v: number) => (H - pb) - ((v - minY) / ((maxY - minY) || 1)) * (H - pb - ptp);
        const zeroY = minY < 0 ? sy(0) : null;
        const circles = pts.map((p) => {
          const rr = 3 + (p.x / maxX) * 5;
          const c = p.y < 0 ? "#dc2626" : accent;
          return `<circle cx="${sx(p.x).toFixed(1)}" cy="${sy(p.y).toFixed(1)}" r="${rr.toFixed(1)}" fill="${c}" fill-opacity="0.65" stroke="${c}" stroke-width="1"><title>${esc(p.label)} — ${esc(fmtPlain(p.x, uc(xCol.unit), ctx.currency))} · ${esc(fmtPlain(p.y, "%"))}</title></circle>`;
        }).join("");
        const worst = pts.reduce((a, b) => (b.y < a.y ? b : a));
        const big = pts.reduce((a, b) => (b.x > a.x ? b : a));
        const lab = (p: { label: string; x: number; y: number }, color: string) =>
          `<text x="${Math.min(sx(p.x) + 6, W - 40).toFixed(1)}" y="${(sy(p.y) + 3).toFixed(1)}" font-size="8" fill="${color}">${esc(p.label.slice(0, 20))}</text>`;
        const svg = `<svg viewBox="0 0 ${W} ${H}" class="w-full" style="display:block">`
          + (zeroY != null ? `<line x1="${pl}" y1="${zeroY.toFixed(1)}" x2="${W - pr}" y2="${zeroY.toFixed(1)}" stroke="#dc2626" stroke-dasharray="3 3" stroke-width="1"/>` : "")
          + circles + lab(worst, "#dc2626") + (big !== worst ? lab(big, safeColor(accent, "#ec4899")) : "") + `</svg>`;
        return `<div class="card"><div class="card-t">${esc(w.title ?? bk.label)}</div>${svg}<div style="font-size:10px;color:${th.muted};margin-top:4px">Horizontal : ${esc(xCol.label)} · Vertical : ${esc(yCol.label)} · taille ∝ ${esc(xCol.label)}</div></div>`;
      }
      default: return "";
    }
  };

  const rendered = (plan.pages ?? [])
    .map((p) => ({ title: p.title, cells: (p.widgets ?? []).map((w) => { const html = widgetHtml(w); return html.trim() ? `<div class="cell ${cellCls(w.type)}">${html}</div>` : ""; }).join("") }))
    .filter((p) => p.cells.trim().length > 0);
  const nav = rendered.map((p, i) => `<button class="tab ${i === 0 ? "on" : ""}" data-i="${i}">${esc(p.title)}</button>`).join("");
  const main = rendered.map((p, i) =>
    `<section class="page ${i === 0 ? "on" : ""}" data-i="${i}"><div class="page-h"><h2>${esc(p.title)}</h2><span class="page-meta">${esc(periodLabel(ctx.period))}</span></div><div class="grid">${p.cells}</div></section>`).join("");
  const ACT: Record<string, string> = { ecommerce: "E-commerce", ecommerce_marketplace: "E-commerce multicanal", immobilier: "Immobilier", coaching: "Coaching", formation: "Formation", saas: "SaaS", hotellerie: "Hôtellerie", restauration: "Restauration" };
  const eyebrow = ACT[ctx.activity ?? ""] ?? "Rapport financier";
  // Bascule devise (indicatif) : proposée uniquement pour EUR/AED ; sinon on garde l'affichage simple.
  const altCur = ctx.currency === "EUR" ? "AED" : ctx.currency === "AED" ? "EUR" : null;
  const fxRate = typeof ctx.fxRate === "number" && isFinite(ctx.fxRate) && ctx.fxRate > 0 ? ctx.fxRate : 3.9663;
  const curTitle = `1 EUR ≈ ${fxRate.toLocaleString("fr-FR", { maximumFractionDigits: 3 })} AED — conversion indicative`;
  const curToggle = altCur
    ? `<div class="cur-switch" title="${esc(curTitle)}"><button data-cur="${esc(ctx.currency)}" class="on">${esc(ctx.currency)}</button><button data-cur="${esc(altCur)}">${esc(altCur)}</button></div>`
    : `<div class="hero-cur">${esc(ctx.currency)}</div>`;

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
  const safeFont = (th.googleFont ?? "").replace(/[^a-zA-Z0-9 ]/g, "").trim().slice(0, 40); // anti-injection dans l'URL
  const fams = (th.googleFonts?.length ? th.googleFonts : safeFont ? [safeFont] : []).map((f) => f.replace(/[^a-zA-Z0-9 ]/g, "").trim()).filter(Boolean).slice(0, 3);
  const famQ = fams.map((f) => `family=${f.replace(/ /g, "+")}${f === "Inter" ? ":wght@400;500;600;700" : ""}`).join("&");
  const fontLinkReport = famQ ? `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${famQ}&display=swap">` : "";
  const fontLinkLegacy = safeFont ? `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${safeFont.replace(/ /g, "+")}:wght@400;500;600;700&display=swap">` : "";
  const fontLink = th.report ? fontLinkReport : fontLinkLegacy;

  const drillMap: Record<string, string[]> = {};
  for (const id of Object.keys(M)) { const dk = drillKeys(id); if (dk.length) drillMap[id] = dk; }
  const chartsJs = `const REPORT=${th.report};const CHARTS=${JSON.stringify(charts)};const PALETTE=${JSON.stringify(palette)};const PRIMARY=${JSON.stringify(primary)};const INK='${th.ink}',MUT='${th.muted}',GRID='${th.grid}',SURF='${th.surface}',DARK=${th.dark};const CS=${JSON.stringify(th.chart)};const FONT=${JSON.stringify(font)};const TIPBG=DARK?'#0b0e1a':'#171a2b';const made={};
function nf(v){return (v==null||isNaN(v))?'–':Number(v).toLocaleString('fr-FR',{maximumFractionDigits:0});}
function nk(v){if(v==null||isNaN(v))return '–';if(Math.round(Math.abs(v))===0)return '0';var a=Math.abs(v),s=a>=1e6?(a/1e6).toLocaleString('fr-FR',{maximumFractionDigits:1})+' M':a>=1e4?Math.round(a/1e3).toLocaleString('fr-FR')+' k':Math.round(a).toLocaleString('fr-FR');return (v<0?'−':'')+s;}
function sval(p){var v=p.value;return (v&&v.length!==undefined)?v[v.length-1]:v;}
function axisTip(ps){if(!ps||!ps.length)return '';var s='<b>'+(ps[0].axisValueLabel||ps[0].name||'')+'</b>';for(var i=0;i<ps.length;i++){if(ps[i].seriesName&&ps[i].seriesName.indexOf('series')===0&&ps.length===1){s+='<br/>'+ps[i].marker+' <b>'+nf(sval(ps[i]))+'</b>';}else{s+='<br/>'+ps[i].marker+' '+ps[i].seriesName+' : <b>'+nf(sval(ps[i]))+'</b>';}}return s;}
const TIP={backgroundColor:TIPBG,borderWidth:0,textStyle:{color:'#fff',fontSize:12},padding:[9,12],extraCssText:'border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.24)'};
const BASE={textStyle:{fontFamily:FONT,color:MUT},tooltip:{...TIP,trigger:'item',axisPointer:{type:'shadow',shadowStyle:{color:INK+'0d'}}},grid:{left:10,right:18,top:20,bottom:8,containLabel:true}};
const LTIP={...TIP,trigger:'axis',formatter:axisTip,axisPointer:{type:'line',lineStyle:{color:MUT,width:1,type:'dashed',opacity:.5}}};
const STIP={...TIP,trigger:'axis',formatter:axisTip,axisPointer:{type:'shadow',shadowStyle:{color:INK+'0d'}}};
const EMPH={emphasis:{focus:'series'}};
function gr(e,c){if(REPORT)return c+'12';return new e.graphic.LinearGradient(0,0,0,1,[{offset:0,color:c+'59'},{offset:1,color:c+'05'}]);}
function opt(e,d){const ax={axisLine:{show:false},axisTick:{show:false},splitLine:{show:CS.grid,lineStyle:{color:GRID,type:REPORT?'solid':'dashed'}},axisLabel:{color:MUT,formatter:REPORT?function(v){return typeof v==='number'?nk(v):v;}:undefined}};
 if(d.kind==='spark')return{animationDuration:700,grid:{left:0,right:0,top:2,bottom:2},xAxis:{type:'category',show:false,data:d.data.map((_,i)=>i)},yAxis:{type:'value',show:true,scale:true,axisLabel:{show:false},splitLine:{show:false}},series:[{type:'line',data:d.data,smooth:true,symbol:'none',lineStyle:{width:2,color:d.color},areaStyle:{color:gr(e,d.color)}}]};
 if(d.kind==='line')return{...BASE,animationDuration:850,tooltip:LTIP,legend:REPORT?{show:d.series.length>1,top:0,right:0,icon:'roundRect',itemWidth:12,itemHeight:4,textStyle:{color:MUT,fontSize:11}}:{show:d.series.length>1,bottom:0,icon:'circle',itemWidth:8,textStyle:{color:MUT}},xAxis:{type:'category',boundaryGap:false,data:d.labels,...ax,splitLine:{show:false}},yAxis:{type:'value',...ax},series:d.series.map(s=>({name:s.name,type:'line',data:s.data,smooth:CS.smooth,symbol:'circle',symbolSize:7,showSymbol:false,emphasis:{focus:'series'},lineStyle:{width:CS.lineWidth,color:s.color,shadowBlur:CS.glow?14:6,shadowColor:s.color+'66',shadowOffsetY:3},itemStyle:{color:s.color,borderColor:'#fff',borderWidth:2},areaStyle:(CS.area&&d.series.length===1)?{color:gr(e,s.color)}:undefined}))};
 if(d.kind==='bar')return{...BASE,animationDuration:800,tooltip:STIP,xAxis:{type:'category',data:d.labels,...ax,splitLine:{show:false},axisLabel:{color:MUT,interval:0,hideOverlap:true}},yAxis:{type:'value',...ax},series:[{type:'bar',label:{show:REPORT,position:'top',color:INK,fontSize:11,formatter:function(p){return nk(p.value);}},data:d.data.map((v,i)=>({value:v,itemStyle:{color:gbar(e,d.colors[i]),borderRadius:[CS.barRadius,CS.barRadius,0,0],shadowBlur:CS.glow?10:0,shadowColor:d.colors[i]+'66'}})),emphasis:{itemStyle:{shadowBlur:14,shadowColor:'rgba(0,0,0,.22)'}},barMaxWidth:52}]};
 if(d.kind==='pie')return{...BASE,animationDuration:800,tooltip:{...TIP,trigger:'item',formatter:function(p){return p.name+' : <b>'+nf(p.value)+'</b> ('+p.percent+'%)';}},legend:{type:'scroll',bottom:0,left:'center',icon:'circle',itemWidth:9,itemHeight:9,textStyle:{color:MUT,fontSize:11},pageIconColor:MUT,pageTextStyle:{color:MUT}},series:[{type:'pie',radius:['50%','72%'],center:['50%','44%'],avoidLabelOverlap:true,itemStyle:{borderColor:SURF,borderWidth:2,borderRadius:5},label:{show:false},emphasis:{scale:true,scaleSize:8,itemStyle:{shadowBlur:18,shadowColor:'rgba(0,0,0,.22)'},label:{show:true,fontSize:14,fontWeight:'bold',color:INK,formatter:function(p){return p.name+'\\n'+p.percent+'%';}}},data:d.items.map(it=>({name:it.name,value:it.value,itemStyle:{color:it.color}}))}]};
 if(d.kind==='map')return{tooltip:{...TIP,trigger:'item',formatter:function(p){var v=p.data&&p.data.raw!=null?p.data.raw:p.value;return p.name+(v?(': <b>'+nf(v)+'</b>'):'');}},visualMap:{show:false,min:d.min*0.85,max:d.max,left:8,bottom:8,calculable:true,inRange:{color:REPORT?['#C9C5BD',PRIMARY+'B3',PRIMARY]:[PRIMARY+'40',PRIMARY+'80',PRIMARY]},textStyle:{color:MUT}},series:[{type:'map',map:'world',roam:false,...(d.europe?{center:[6,49],zoom:6.5}:{}),emphasis:{label:{show:false},itemStyle:{areaColor:${JSON.stringify(accent)}}},itemStyle:{borderColor:DARK?GRID:'#FFFFFF',borderWidth:0.6,areaColor:DARK?'#1d2236':(REPORT?'#F1EFEA':'#eef0f6')},data:d.items}]};
 if(d.kind==='gauge')return{series:[{type:'gauge',startAngle:215,endAngle:-35,min:0,max:Math.max(d.target,d.value)||1,progress:{show:true,width:13,roundCap:true,itemStyle:{color:d.color}},axisLine:{lineStyle:{width:13,color:[[1,GRID]]}},axisTick:{show:false},splitLine:{show:false},axisLabel:{show:false},pointer:{show:false},anchor:{show:false},title:{offsetCenter:[0,'32%'],color:MUT,fontSize:12},detail:{offsetCenter:[0,'-6%'],fontSize:22,fontWeight:'bold',color:INK,formatter:function(){return d.fmt;}},data:[{value:d.value,name:'objectif '+d.targetFmt+(d.target?(' · '+Math.round(d.value/d.target*100)+'%'):'')}]}]};
 if(d.kind==='stackbar')return{...BASE,animationDuration:800,tooltip:STIP,legend:{bottom:0,icon:'circle',textStyle:{color:MUT}},xAxis:{type:'category',data:d.labels,...ax,splitLine:{show:false}},yAxis:{type:'value',...ax},series:d.series.map(function(s){return{name:s.name,type:'bar',stack:'t',data:s.data,emphasis:{focus:'series'},itemStyle:{color:s.color},barMaxWidth:48};})};
 if(d.kind==='sankey')return{...BASE,tooltip:{...TIP,trigger:'item',formatter:function(p){return p.data&&p.data.source?(p.data.source+' → '+p.data.target+' : <b>'+nf(p.value)+'</b>'):(p.name+' : <b>'+nf(p.value)+'</b>');}},series:[{type:'sankey',data:d.nodes,links:d.links,emphasis:{focus:'adjacency',lineStyle:{opacity:.72}},nodeGap:18,nodeWidth:16,label:{color:INK,fontSize:12,fontWeight:600},itemStyle:{borderWidth:0,borderRadius:3},lineStyle:{color:'source',opacity:.48,curveness:.55}}]};
 if(d.kind==='radar')return{...BASE,tooltip:{...TIP,trigger:'item'},legend:{show:d.series.length>1,bottom:0,icon:'circle',textStyle:{color:MUT}},radar:{indicator:d.indicators,splitNumber:4,center:['50%','52%'],radius:'64%',axisName:{color:MUT,fontSize:11},splitLine:{lineStyle:{color:GRID}},splitArea:{show:true,areaStyle:{color:[DARK?'#161a30':'#fbfbfe',SURF]}},axisLine:{lineStyle:{color:GRID}}},series:[{type:'radar',data:d.series.map(function(s){return{value:s.value,name:s.name,symbol:s.dash?'none':'circle',symbolSize:5,lineStyle:{width:s.dash?1.5:2.5,color:s.color,type:s.dash?'dashed':'solid'},itemStyle:{color:s.color},areaStyle:s.dash?undefined:{color:s.color,opacity:.16}};})}]};
 if(d.kind==='funnel')return{...BASE,tooltip:{...TIP,trigger:'item',formatter:function(p){var it=d.items[p.dataIndex];return it.name+' : <b>'+it.real+'</b><br/>'+it.pct+'% du sommet'+(it.conv!=null?'<br/>conversion : '+it.conv+'%':'');}},legend:{show:!REPORT,type:'scroll',bottom:0,icon:'circle',textStyle:{color:MUT}},series:[{type:'funnel',left:'6%',right:REPORT?'34%':'6%',top:12,bottom:REPORT?12:36,minSize:'16%',maxSize:'100%',sort:'descending',gap:3,funnelAlign:'center',label:{show:true,position:REPORT?'right':'inside',color:REPORT?INK:'#fff',fontSize:12,fontWeight:600,formatter:function(p){var it=d.items[p.dataIndex];return REPORT?(p.name+' · '+it.real+(it.conv!=null?' ('+it.conv+' %)':'')):(p.name+'  '+it.pct+'%');}},labelLine:{show:REPORT,lineStyle:{color:GRID}},itemStyle:{borderColor:SURF,borderWidth:1,borderRadius:4},emphasis:{label:{fontSize:13}},data:d.items.map(function(it){return{name:it.name,value:it.value,itemStyle:{color:it.color}};})}]};
 if(d.kind==='treemap')return{...BASE,tooltip:{...TIP,trigger:'item',formatter:function(p){return p.name+': <b>'+nf(p.value)+'</b>';}},series:[{type:'treemap',roam:false,nodeClick:false,breadcrumb:{show:false},width:'100%',height:'100%',label:{color:'#fff',fontSize:12,overflow:'truncate'},itemStyle:{borderColor:SURF,borderWidth:2,gapWidth:2},data:d.items.map(function(it){return{name:it.name,value:it.value,itemStyle:{color:it.color}};})}]};
 if(d.kind==='calendar')return{tooltip:{...TIP,formatter:function(p){return p.value[0]+': <b>'+nf(p.value[1])+'</b>';}},visualMap:{min:0,max:d.max,show:false,inRange:{color:[PRIMARY+'14',PRIMARY+'66',PRIMARY]}},calendar:{range:d.range,cellSize:['auto',16],left:22,right:16,top:24,bottom:8,itemStyle:{color:SURF,borderColor:DARK?'#0f1221':'#fff',borderWidth:3,borderRadius:3},splitLine:{show:false},dayLabel:{color:MUT,firstDay:1},monthLabel:{show:false},yearLabel:{show:false}},series:[{type:'heatmap',coordinateSystem:'calendar',data:d.data}]};
 if(d.kind==='area')return{...BASE,animationDuration:850,tooltip:LTIP,legend:{show:d.series.length>1,bottom:0,icon:'circle',textStyle:{color:MUT}},xAxis:{type:'category',boundaryGap:false,data:d.labels,...ax,splitLine:{show:false}},yAxis:{type:'value',...ax},series:d.series.map(function(s){return{name:s.name,type:'line',data:s.data,smooth:CS.smooth,symbol:'none',emphasis:{focus:'series'},lineStyle:{width:CS.lineWidth,color:s.color,shadowBlur:CS.glow?14:6,shadowColor:s.color+'66',shadowOffsetY:3},areaStyle:{color:gr(e,s.color),opacity:d.series.length>1?.55:.95}};})};
 if(d.kind==='stackarea')return{...BASE,tooltip:LTIP,legend:{bottom:0,icon:'circle',textStyle:{color:MUT}},xAxis:{type:'category',boundaryGap:false,data:d.labels,...ax,splitLine:{show:false}},yAxis:{type:'value',...ax},series:d.series.map(function(s){return{name:s.name,type:'line',stack:'t',data:s.data,smooth:CS.smooth,symbol:'none',emphasis:{focus:'series'},lineStyle:{width:1,color:s.color},areaStyle:{color:s.color,opacity:.72}};})};
 if(d.kind==='river')return{...BASE,tooltip:{...TIP,trigger:'axis',axisPointer:{type:'line',lineStyle:{color:GRID}}},legend:{bottom:0,icon:'circle',textStyle:{color:MUT}},singleAxis:{type:'category',data:d.labels,top:12,bottom:42,axisLine:{lineStyle:{color:GRID}},axisTick:{show:false},axisLabel:{color:MUT}},series:[{type:'themeRiver',data:d.data,color:d.colors,emphasis:{itemStyle:{shadowBlur:12,shadowColor:'rgba(0,0,0,.25)'}},label:{show:false}}]};
 if(d.kind==='combo')return{...BASE,grid:{left:10,right:18,top:REPORT?34:20,bottom:8,containLabel:true},animationDuration:800,tooltip:LTIP,legend:REPORT?{top:0,right:0,icon:'roundRect',itemWidth:12,itemHeight:4,textStyle:{color:MUT,fontSize:11}}:{bottom:0,icon:'circle',textStyle:{color:MUT}},xAxis:{type:'category',data:d.labels,...ax,splitLine:{show:false}},yAxis:[{type:'value',...ax},{type:'value',...ax,splitLine:{show:false},axisLabel:{color:MUT,formatter:function(v){return v+(d.lineUnit==='%'?'%':'');}}}],series:d.bars.map(function(s){return{name:s.name,type:'bar',data:s.data,emphasis:{focus:'series'},itemStyle:{color:gbar(e,s.color),borderRadius:[CS.barRadius,CS.barRadius,0,0]},barMaxWidth:38};}).concat([{name:d.line.name,type:'line',yAxisIndex:1,data:d.line.data,smooth:CS.smooth,symbol:'circle',symbolSize:7,z:5,lineStyle:{width:CS.lineWidth+.5,color:d.line.color},itemStyle:{color:d.line.color,borderColor:'#fff',borderWidth:2}}])};
 if(d.kind==='slope')return{...BASE,tooltip:{...TIP,trigger:'item',formatter:function(p){return p.seriesName+' : <b>'+p.value+'</b>'+(p.dataIndex===1?' (base 100)':'');}},legend:{type:'scroll',bottom:0,icon:'circle',textStyle:{color:MUT}},grid:{left:10,right:66,top:16,bottom:34,containLabel:true},xAxis:{type:'category',data:d.labels,boundaryGap:false,axisLine:{lineStyle:{color:GRID}},axisTick:{show:false},axisLabel:{color:MUT}},yAxis:{type:'value',show:false,scale:true},series:d.series.map(function(s){return{name:s.name,type:'line',data:s.data,symbol:'circle',symbolSize:8,lineStyle:{width:2.4,color:s.color},itemStyle:{color:s.color},endLabel:{show:true,color:s.color,fontSize:11,formatter:function(p){return s.name;}}};})};
 if(d.kind==='matrix')return{...BASE,tooltip:{...TIP,position:'top',formatter:function(p){return d.rowlabels[p.value[1]]+' · '+d.collabels[p.value[0]]+': <b>'+nf(p.value[3])+'</b>';}},grid:{left:10,right:16,top:10,bottom:26,containLabel:true},xAxis:{type:'category',data:d.collabels,splitArea:{show:false},axisLine:{show:false},axisTick:{show:false},axisLabel:{color:MUT}},yAxis:{type:'category',data:d.rowlabels,splitArea:{show:false},axisLine:{show:false},axisTick:{show:false},axisLabel:{color:MUT}},visualMap:{min:0,max:100,show:false,inRange:{color:[PRIMARY+'12',PRIMARY+'70',PRIMARY]}},series:[{type:'heatmap',data:d.data,label:{show:false},itemStyle:{borderColor:SURF,borderWidth:3,borderRadius:5},emphasis:{itemStyle:{shadowBlur:8,shadowColor:'rgba(0,0,0,.2)'}}}]};
 if(d.kind==='rose')return{...BASE,tooltip:{...TIP,trigger:'item',formatter:function(p){return p.name+' : <b>'+nf(p.value)+'</b> ('+p.percent+'%)';}},legend:{type:'scroll',bottom:0,left:'center',icon:'circle',itemWidth:9,itemHeight:9,textStyle:{color:MUT,fontSize:11},pageIconColor:MUT,pageTextStyle:{color:MUT}},series:[{type:'pie',radius:['18%','74%'],center:['50%','44%'],roseType:'radius',itemStyle:{borderColor:SURF,borderWidth:2,borderRadius:5},label:{show:false},emphasis:{scale:true,scaleSize:6,itemStyle:{shadowBlur:16,shadowColor:'rgba(0,0,0,.2)'}},data:d.items.map(function(it){return{name:it.name,value:it.value,itemStyle:{color:it.color}};})}]};
 if(d.kind==='polarbar')return{...BASE,tooltip:{...TIP,trigger:'item',formatter:function(p){return p.name+' : <b>'+nf(p.value)+'</b>';}},polar:{radius:[18,'72%'],center:['50%','48%']},angleAxis:{max:d.max,startAngle:90,axisLine:{show:false},axisTick:{show:false},splitLine:{lineStyle:{color:GRID}},axisLabel:{show:false}},radiusAxis:{type:'category',data:d.labels,z:10,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:MUT,fontSize:11}},series:[{type:'bar',coordinateSystem:'polar',roundCap:true,data:d.data.map(function(v,i){return{value:v,itemStyle:{color:d.colors[i]}};}),barMaxWidth:16}]};
 if(d.kind==='sunburst')return{...BASE,tooltip:{...TIP,trigger:'item',formatter:function(p){return p.name+': <b>'+nf(p.value)+'</b>';}},series:[{type:'sunburst',radius:['22%','92%'],center:['50%','50%'],data:d.data,label:{color:'#fff',fontSize:11,minAngle:10},itemStyle:{borderColor:SURF,borderWidth:2},emphasis:{focus:'ancestor'}}]};
 if(d.kind==='pictorial')return{...BASE,tooltip:{...TIP,trigger:'item',formatter:function(p){return p.name+' : <b>'+d.fmts[p.dataIndex]+'</b>';}},grid:{left:10,right:36,top:8,bottom:8,containLabel:true},xAxis:{type:'value',show:false,max:d.max},yAxis:{type:'category',data:d.labels,inverse:true,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:MUT,fontSize:12}},series:[{type:'pictorialBar',symbol:'roundRect',symbolRepeat:true,symbolSize:[9,15],symbolMargin:3,symbolClip:false,data:d.data.map(function(v,i){return{value:v,itemStyle:{color:d.colors[i]}};}),label:{show:true,position:'right',color:MUT,fontSize:11,formatter:function(p){return d.fmts[p.dataIndex];}}}]};
 if(d.kind==='lollipop')return{...BASE,tooltip:{...TIP,trigger:'item',formatter:function(p){return d.labels[p.dataIndex]+' : <b>'+d.fmts[p.dataIndex]+'</b>';}},grid:{left:10,right:32,top:8,bottom:8,containLabel:true},xAxis:{type:'value',...ax,max:d.max},yAxis:{type:'category',data:d.labels,inverse:true,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:MUT,fontSize:12}},series:[{type:'bar',data:d.data,barWidth:2,silent:true,z:1,itemStyle:{color:GRID}},{type:'scatter',data:d.data.map(function(v,i){return{value:[v,i],itemStyle:{color:d.colors[i]}};}),symbolSize:15,z:3,emphasis:{scale:true},label:{show:true,position:'right',color:MUT,fontSize:11,formatter:function(p){return d.fmts[p.dataIndex];}}}]};
 if(d.kind==='rings')return{tooltip:{show:false},series:d.rings.map(function(r,i){var rad=92-i*15;return{type:'gauge',startAngle:90,endAngle:-270,min:0,max:100,radius:rad+'%',center:['50%','50%'],pointer:{show:false},progress:{show:true,roundCap:true,width:9,itemStyle:{color:r.color}},axisLine:{lineStyle:{width:9,color:[[1,GRID]]}},axisTick:{show:false},splitLine:{show:false},axisLabel:{show:false},anchor:{show:false},title:{show:false},detail:i===0?{offsetCenter:[0,0],fontSize:17,fontWeight:'bold',color:INK,formatter:function(){return d.center;}}:{show:false},data:[{value:r.pct}]};})};
 if(d.kind==='diverging')return{...BASE,tooltip:{...TIP,trigger:'item',formatter:function(p){return p.name+': <b>'+(p.value>=0?'+':'')+p.value+'%</b>';}},grid:{left:10,right:26,top:8,bottom:8,containLabel:true},xAxis:{type:'value',...ax,axisLabel:{color:MUT,formatter:'{value}%'}},yAxis:{type:'category',data:d.labels,inverse:true,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:MUT,fontSize:12}},series:[{type:'bar',data:d.data.map(function(v){return{value:v,itemStyle:{color:v>=0?'#16a34a':'#e24b4a',borderRadius:v>=0?[0,5,5,0]:[5,0,0,5]}};}),barMaxWidth:18,label:{show:true,color:MUT,fontSize:11,position:'right',formatter:function(p){return(p.value>=0?'+':'')+p.value+'%';}}}]};
 if(d.kind==='group')return{...BASE,animationDuration:800,tooltip:STIP,legend:{bottom:0,icon:'circle',textStyle:{color:MUT}},xAxis:{type:'category',data:d.labels,...ax,splitLine:{show:false},axisLabel:{color:MUT,interval:0,hideOverlap:true}},yAxis:{type:'value',...ax},series:d.series.map(function(s){return{name:s.name,type:'bar',data:s.data,emphasis:{focus:'series'},itemStyle:{color:s.color,borderRadius:[CS.barRadius,CS.barRadius,0,0]},barMaxWidth:24,barGap:'18%'};})};
 if(d.kind==='waterfall')return{...BASE,animationDuration:800,tooltip:{...TIP,trigger:'axis',formatter:function(p){var x=p[p.length-1];var r=d.real[x.dataIndex];return x.name+' : <b>'+(r<0?'-':'')+nf(Math.abs(r))+'</b>';}},xAxis:{type:'category',data:d.labels,...ax,splitLine:{show:false},axisLabel:{color:MUT,interval:0,hideOverlap:true,fontSize:11}},yAxis:{type:'value',...ax},series:[{type:'bar',stack:'w',stackStrategy:'all',data:d.base,itemStyle:{color:'transparent'},emphasis:{itemStyle:{color:'transparent'}},silent:true},{type:'bar',stack:'w',stackStrategy:'all',data:d.delta.map(function(v,i){return{value:v,itemStyle:{color:d.colors[i],borderRadius:REPORT?1:3}};}),label:{show:REPORT,position:'top',color:INK,fontSize:11,fontFamily:FONT,formatter:function(p){return nk(d.real[p.dataIndex]);}},emphasis:{itemStyle:{shadowBlur:12,shadowColor:'rgba(0,0,0,.2)'}},barMaxWidth:46}]};
 return{};}
function gbar(e,c){if(REPORT)return c;return new e.graphic.LinearGradient(0,0,0,1,[{offset:0,color:c},{offset:1,color:c+'c2'}]);}
function build(i){if(!window.echarts)return;document.querySelectorAll('.page[data-i="'+i+'"] .echart').forEach(function(el){if(made[el.id])return;var d=CHARTS.find(function(x){return x.id===el.id;});if(!d)return;if(d.kind==='map'&&!(echarts.getMap&&echarts.getMap('world')))return;try{var c=echarts.init(el,null,{renderer:'canvas'});c.setOption(opt(echarts,d));made[el.id]=c;if(window.ResizeObserver){new ResizeObserver(function(){try{c.resize();}catch(e){}}).observe(el);}}catch(e){}});}
window.addEventListener('resize',function(){for(var k in made){try{made[k].resize();}catch(e){}}});
document.querySelectorAll('.tab').forEach(function(t){t.addEventListener('click',function(){var i=t.dataset.i;document.querySelectorAll('.tab').forEach(function(x){x.classList.toggle('on',x===t);});document.querySelectorAll('.page').forEach(function(p){p.classList.toggle('on',p.dataset.i===i);});build(i);});});
function start(){build('0');setTimeout(function(){for(var k in made){try{made[k].resize();}catch(e){}}},140);}
// ECharts 5 ne fournit plus la carte monde : on enregistre le GeoJSON (format standard) avant de dessiner.
var needMap=CHARTS.some(function(c){return c.kind==='map';});
window.addEventListener('load',function(){
 if(needMap&&window.echarts&&!(echarts.getMap&&echarts.getMap('world'))){
  fetch('https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json').then(function(r){return r.json();}).then(function(j){try{echarts.registerMap('world',j);}catch(e){}start();}).catch(start);
 } else { start(); }
});
/* ── Phase 1 : drill-down au clic sur un KPI + tri des tableaux ── */
const DRILLBK=${JSON.stringify(ctx.breakdowns ?? {})};const DRILLMAP=${JSON.stringify(drillMap)};
function dEsc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function dNum(v){return (v==null||isNaN(v))?'–':Number(v).toLocaleString('fr-FR',{maximumFractionDigits:0});}
function openDrill(id){var keys=DRILLMAP[id]||Object.keys(DRILLBK);if(!keys.length)return;var kel=document.querySelector('.kpi[data-drill="'+id+'"] .kpi-l');var label=kel?kel.textContent:'Détail';document.getElementById('drill-h').innerHTML='<div class="drawer-eyebrow">Détail du poste</div><h3>'+dEsc(label)+'</h3>';var html='';keys.forEach(function(key){var bk=DRILLBK[key];if(!bk||!bk.rows||!bk.rows.length)return;var rows=bk.rows.slice().sort(function(a,b){return Math.abs(b.value)-Math.abs(a.value);}).slice(0,12);var max=Math.max.apply(null,rows.map(function(r){return Math.abs(r.value);}))||1;html+='<div class="drawer-sec"><div class="drawer-st">'+dEsc(bk.label)+'</div><div class="rank">';rows.forEach(function(r,i){var pct=Math.max(4,Math.round(Math.abs(r.value)/max*100));html+='<div class="rk-row"><div class="rk-l" title="'+dEsc(r.label)+'">'+dEsc(r.label)+'</div><div class="rk-track"><div class="rk-bar" style="width:'+pct+'%;background:'+PALETTE[i%PALETTE.length]+'"></div></div><div class="rk-v">'+dNum(r.value)+'</div></div>';});html+='</div></div>';});document.getElementById('drill-body').innerHTML=html||'<div class="sc-empty">Pas de détail disponible pour ce poste.</div>';var dr=document.getElementById('drill');dr.classList.add('open');dr.setAttribute('aria-hidden','false');}
function closeDrill(){var dr=document.getElementById('drill');if(dr){dr.classList.remove('open');dr.setAttribute('aria-hidden','true');}}
document.addEventListener('click',function(e){var t=e.target;if(!t||!t.closest)return;var k=t.closest('.kpi-drill');if(k&&k.getAttribute('data-drill')){openDrill(k.getAttribute('data-drill'));return;}if(t.closest('.drawer-bg')||t.closest('.drawer-x'))closeDrill();});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeDrill();});
document.querySelectorAll('.tbl').forEach(function(tbl){[].forEach.call(tbl.querySelectorAll('th'),function(th,ci){th.style.cursor='pointer';th.title='Trier';var dir=1;th.addEventListener('click',function(){var tb=tbl.querySelector('tbody');if(!tb)return;var rows=[].slice.call(tb.querySelectorAll('tr')).filter(function(r){return r.className.indexOf('tot')<0;});rows.sort(function(a,b){var A=a.children[ci],B=b.children[ci];if(!A||!B)return 0;var na=parseFloat((A.textContent||'').replace(/[^0-9,.-]/g,'').replace(',','.'));var nb=parseFloat((B.textContent||'').replace(/[^0-9,.-]/g,'').replace(',','.'));if(!isNaN(na)&&!isNaN(nb))return (na-nb)*dir;return ((A.textContent||'')>(B.textContent||'')?1:-1)*dir;});dir*=-1;rows.forEach(function(r){tb.appendChild(r);});});});});
/* ── Phase 2 : bascule devise EUR ⇄ AED (indicatif — AED arrimé USD, EUR/AED ≈ 3,97) ── */
var FXR=${typeof ctx.fxRate === "number" && isFinite(ctx.fxRate) && ctx.fxRate > 0 ? ctx.fxRate : 3.9663};
function fmtCur(v,cur){try{return new Intl.NumberFormat('fr-FR',{style:'currency',currency:cur,maximumFractionDigits:0}).format(v);}catch(e){return Math.round(v).toLocaleString('fr-FR')+' '+cur;}}
function convCur(v,base,target){if(base===target)return v;if(base==='EUR'&&target==='AED')return v*FXR;if(base==='AED'&&target==='EUR')return v/FXR;return v;}
function setCur(target){[].forEach.call(document.querySelectorAll('.cv'),function(el){var base=el.getAttribute('data-c'),v=parseFloat(el.getAttribute('data-v'));if(isNaN(v))return;if(!((base==='EUR'||base==='AED')&&(target==='EUR'||target==='AED')))return;el.textContent=fmtCur(convCur(v,base,target),target);});[].forEach.call(document.querySelectorAll('.cur-switch button'),function(b){b.classList.toggle('on',b.getAttribute('data-cur')===target);});}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.cur-switch button');if(b)setCur(b.getAttribute('data-cur'));});
`;

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(ctx.client)} — ${esc(periodLabel(ctx.period))}</title>
<script src="https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js"></script>
${fontLink}
<style>
:root{--p:${primary};--a:${accent};--bg:${th.bg};--card:${th.surface};--bd:${th.border};--mut:${th.muted};--ink:${th.ink};--r:${th.radius}px}
*{box-sizing:border-box}body{margin:0;font-family:${font};font-size:clamp(13.5px,.35vw+12.7px,15px);line-height:1.55;background:${bgCss};color:var(--ink);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.dash{max-width:1500px;margin:0 auto;padding:0 clamp(16px,4vw,30px) 56px}
header.hero{${headerCss};border-top:4px solid var(--a);border-radius:0 0 24px 24px;padding:clamp(20px,3.4vw,30px) clamp(18px,4vw,34px) clamp(18px,3vw,28px);margin:0 calc(-1*clamp(16px,4vw,30px)) 26px;position:relative;overflow:hidden}
${heroDecor ? `header.hero::after{content:'';position:absolute;right:-50px;top:-50px;width:230px;height:230px;border-radius:50%;background:var(--a);opacity:.14}` : ""}
.hero-row{display:flex;align-items:center;gap:18px;position:relative;z-index:1}
.hero-id{flex:1;min-width:0}
.eyebrow{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;opacity:.62;margin-bottom:7px}
header.hero h1{margin:0;font-size:clamp(21px,1.5vw+1rem,28px);font-weight:700;letter-spacing:-.02em;line-height:1.08}
.hero-right{text-align:right;flex:0 0 auto}
.hero-period{font-size:clamp(14px,.6vw+.7rem,17px);font-weight:600;text-transform:capitalize}
.hero-cur{font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.55;margin-top:3px}
.cur-switch{display:inline-flex;gap:2px;margin-top:6px;background:rgba(255,255,255,.14);border-radius:999px;padding:3px;vertical-align:middle}
.cur-switch button{border:0;background:transparent;color:inherit;opacity:.6;font:inherit;font-size:11px;font-weight:700;letter-spacing:.04em;padding:4px 11px;border-radius:999px;cursor:pointer;transition:all .15s}
.cur-switch button.on{background:#fff;color:#141a45;opacity:1}
.tabs{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 22px}
.tab{border:1px solid var(--bd);background:var(--card);padding:8px 16px;font:inherit;font-size:13px;font-weight:600;color:var(--mut);cursor:pointer;border-radius:999px;transition:all .15s}
.tab:hover{color:var(--ink);border-color:var(--mut)} .tab.on{color:#fff;background:var(--p);border-color:var(--p);box-shadow:0 4px 13px ${primary}40}
.page{display:none}.page.on{display:block;animation:fade .35s ease}
@keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.page-h{display:flex;align-items:baseline;justify-content:space-between;gap:14px;margin:2px 0 18px;padding-bottom:13px;border-bottom:1px solid var(--bd)}
.page-h h2{margin:0;font-size:clamp(17px,1vw+.7rem,20px);font-weight:700;letter-spacing:-.01em}
.page-meta{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.1em;white-space:nowrap}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;align-items:start}
.cell.full{grid-column:1/-1}.cell.wide{grid-column:span 2}
.foot{margin-top:30px;padding-top:18px;border-top:1px solid var(--bd);font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.12em;text-align:center}
@media(max-width:1150px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cell.wide{grid-column:1/-1}}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,168px),1fr));gap:14px}
.kpi{background:var(--card);border:1px solid var(--bd);border-radius:var(--r);padding:17px 19px;position:relative;overflow:hidden;transition:transform .15s,box-shadow .15s;display:flex;gap:14px;align-items:center}
.kpi:hover{transform:translateY(-3px);box-shadow:0 14px 32px rgba(20,26,60,.12)}
.kpi-bar{position:absolute;left:0;top:0;bottom:0;width:4px}
.kpi-ic{flex:0 0 auto;width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center}
.kpi-main{flex:1;min-width:0}.k-plain,.k-icon{padding-left:18px}.k-accent .kpi-main,.k-grad .kpi-main{padding-left:7px}
.kpi-l{font-size:11px;color:var(--mut);text-transform:uppercase;letter-spacing:.08em;font-weight:600}
.kpi-v{font-size:clamp(21px,1.3vw+1rem,28px);font-weight:700;margin-top:5px;letter-spacing:-.025em;font-variant-numeric:tabular-nums;line-height:1.05}
.kpi-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:7px;min-height:20px}
.chg{font-size:12px;font-weight:600;padding:2px 8px;border-radius:999px;white-space:nowrap}
.chg.up{color:#0a7d3f;background:#e7f7ee}.chg.down{color:#b41a3a;background:#fdeaf0}.chg.flat{color:var(--mut);background:${th.dark ? "#262b40" : "#f1f2f7"}}
.spark{height:32px;width:84px;flex:0 0 auto}
.kpi-bench{font-size:11px;font-weight:600;margin-top:7px;display:flex;align-items:center;gap:5px;line-height:1.3}
.kpi-bench::before{content:'';width:7px;height:7px;border-radius:50%;background:currentColor;flex:0 0 auto}
.b-good{color:#0a7d3f}.b-warn{color:#b9770a}.b-bad{color:#b41a3a}
.sc-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}
.sc-stat{border:1px solid var(--bd);border-radius:13px;padding:15px 12px;text-align:center}
.sc-stat.b-good{background:${th.dark ? "#13301f" : "#eafaf0"};border-color:${th.dark ? "#1d4a30" : "#cdeedb"}}
.sc-stat.b-warn{background:${th.dark ? "#332611" : "#fef6e7"};border-color:${th.dark ? "#54421c" : "#f1e2bf"}}
.sc-stat.b-bad{background:${th.dark ? "#3a1c1c" : "#fdecec"};border-color:${th.dark ? "#5a2a2a" : "#f3cccc"}}
.sc-n{font-size:30px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
.sc-sl{font-size:11px;text-transform:uppercase;letter-spacing:.07em;margin-top:6px;font-weight:600;opacity:.9}
.sc-cols{display:grid;grid-template-columns:1fr 1fr;gap:14px 26px}
.sc-h{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);font-weight:700;margin-bottom:8px}
.sc-chip{display:flex;gap:9px;align-items:flex-start;padding:7px 0;border-bottom:1px solid var(--bd)}.sc-chip:last-child{border-bottom:0}
.sc-dot{width:8px;height:8px;border-radius:50%;background:currentColor;margin-top:6px;flex:0 0 auto}
.sc-cl{font-size:13px;color:var(--ink)}.sc-cn{font-size:11.5px;color:var(--mut)}.sc-empty{color:var(--mut);font-size:13px}
@media(max-width:760px){.sc-cols{grid-template-columns:1fr}}
.glassbg .card,.glassbg .kpi{background:rgba(255,255,255,.62);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-color:rgba(255,255,255,.5)}
.card{background:var(--card);border:1px solid var(--bd);border-radius:var(--r);padding:20px 22px;box-shadow:0 1px 2px rgba(20,26,60,.04),0 10px 26px rgba(20,26,60,.035)}
.card-t{font-weight:700;font-size:15px;margin-bottom:16px;letter-spacing:-.01em;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.card-sub{font-weight:500;color:var(--mut);font-size:12px}
.echart{height:clamp(230px,26vw,285px);width:100%}.echart-map{height:clamp(320px,40vw,440px)}.echart-gauge{height:240px}.echart-cal{height:180px}.echart-gg{height:130px}
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
.tbl th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--mut);font-weight:600;padding:0 4px 9px;border-bottom:1.5px solid var(--bd)}.tbl th.num{text-align:right}
.tbl td{padding:9px 4px;border-bottom:1px solid var(--bd)}.tbl td.num{text-align:right;font-variant-numeric:tabular-nums}.tbl td.pct{color:var(--mut);font-size:13px}
.tbl tbody tr:last-child td{border-bottom:0}.tbl tr.tot td{font-weight:700;color:var(--ink);border-top:2px solid var(--bd)}
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
.pts-l{list-style:none;margin:6px 0 0;padding:0;display:grid;gap:9px;counter-reset:pt}
.pt{display:flex;gap:10px;align-items:flex-start;font-size:15px;line-height:1.45;counter-increment:pt}
.pt::before{content:counter(pt);flex:0 0 auto;width:22px;height:22px;border-radius:50%;background:var(--p);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}
.pt.warn::before{background:#d97706}.pt.good::before{background:#16a34a}.pt-d{display:none}
@media(max-width:760px){.grid{grid-template-columns:1fr}.echart-map{height:300px}}
.kpi-drill{cursor:pointer}.kpi-drill:hover{transform:translateY(-3px);box-shadow:0 14px 32px rgba(20,26,60,.14)}
.kpi-drill::after{content:'›';position:absolute;top:6px;right:11px;font-size:17px;line-height:1;color:var(--mut);opacity:.45}
.drawer{position:fixed;inset:0;z-index:60;visibility:hidden;opacity:0;transition:opacity .2s,visibility .2s}
.drawer.open{visibility:visible;opacity:1}
.drawer-bg{position:absolute;inset:0;background:rgba(10,13,30,.42)}
.drawer-panel{position:absolute;top:0;right:0;height:100%;width:min(440px,92vw);background:var(--card);color:var(--ink);box-shadow:-20px 0 60px rgba(20,26,60,.28);overflow:auto;transform:translateX(100%);transition:transform .25s cubic-bezier(.4,0,.2,1);padding:20px clamp(16px,3vw,24px) 40px}
.drawer.open .drawer-panel{transform:none}
.drawer-x{position:absolute;top:14px;right:15px;border:0;background:var(--bd);color:var(--ink);width:30px;height:30px;border-radius:50%;font-size:18px;line-height:1;cursor:pointer}
.drawer-eyebrow{font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--mut)}
.drawer-h h3{margin:4px 0 18px;font-size:19px;font-weight:700;letter-spacing:-.01em}
.drawer-sec{margin-bottom:20px}.drawer-st{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:10px}
${th.report ? reportCss(th, headFont) : ""}</style></head><body class="${glass ? "glassbg" : ""}${th.report ? " report" : ""}">
<div class="dash">
  ${th.report ? `<header class="rhead"><div class="rhead-row">${logo ? `<img class="rhead-logo" src="${esc(logo)}" alt="">` : ""}<div class="rhead-id"><div class="eyebrow">${esc(eyebrow === "Rapport financier" ? "Rapport financier mensuel" : `${eyebrow} · rapport mensuel`)}</div><h1>${esc(ctx.client)}</h1></div><div class="rhead-right"><div class="rhead-period">${esc(periodLabel(ctx.period))}</div>${curToggle}</div></div></header>` : `<header class="hero"><div class="hero-row">${logo ? `<img src="${esc(logo)}" alt="" style="height:44px;max-width:150px;object-fit:contain;background:#fff;border-radius:10px;padding:5px 9px">` : ""}<div class="hero-id"><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(ctx.client)}</h1></div><div class="hero-right"><div class="hero-period">${esc(periodLabel(ctx.period))}</div>${curToggle}</div></div></header>`}
  <nav class="tabs">${nav}</nav>
  <main>${spanifyMoney(main)}</main>
  <footer class="foot">${esc(ctx.client)} · ${esc(periodLabel(ctx.period))} · ${esc(ctx.currency)} — Document confidentiel</footer>
</div>
<aside id="drill" class="drawer" aria-hidden="true"><div class="drawer-bg"></div><div class="drawer-panel"><button class="drawer-x" aria-label="Fermer">×</button><div class="drawer-h" id="drill-h"></div><div class="drawer-body" id="drill-body"></div></div></aside>
<script>${detokMoney(chartsJs).replace(/<\/(script)/gi, "<\\/$1").replace(/<!--/g, "<\\!--")}</script>
</body></html>`;
}

// Variante async : calcule le taux EUR/AED (BCE + parité USD/AED via fx.ts) puis rend.
// À utiliser depuis les edge functions (generate-dashboard, restyle-dashboard, dashboard-chat).
export async function renderDashboardWithFx(ctx: RenderCtx, plan: DashPlan): Promise<string> {
  let fxRate = ctx.fxRate;
  if (fxRate == null) {
    try {
      const { factor } = await ratesToReporting(ctx.period, "AED"); // factor.EUR = nombre d'AED pour 1 EUR
      if (typeof factor.EUR === "number" && isFinite(factor.EUR) && factor.EUR > 0) fxRate = factor.EUR;
    } catch { /* repli : constante embarquée dans le rendu */ }
  }
  return renderDashboard({ ...ctx, fxRate }, plan);
}
