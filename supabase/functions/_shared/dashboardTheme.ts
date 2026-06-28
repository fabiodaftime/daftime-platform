// Thème data-driven du dashboard : la PRÉSENTATION devient un jeu de paramètres.
// L'IA compose un thème adapté à l'univers du client ; le chat peut l'ajuster ; le code l'applique.
// Bibliothèque de "moods" premium + icônes + polices.

export interface Theme {
  mood?: string;                      // clé de preset (voir PRESETS)
  chart?: Partial<ChartStyle>;        // surcharge fine du style des graphes
  primary?: string; accent?: string;
  palette?: string[];
  background?: "soft" | "plain" | "gradient" | "dark" | "mesh" | "glass";
  header?: "gradient" | "solid" | "dark" | "minimal" | "band";
  kpi?: "icon" | "accent" | "gradient" | "plain" | "glass";
  radius?: number;
  density?: "comfortable" | "compact";
  font?: string;                      // stack CSS
  googleFont?: string;                // nom Google Fonts (chargé en <link>)
  bgColor?: string;                   // fond personnalisé (sinon défaut clair/sombre)
  icons?: Record<string, string>;
}

export interface ChartStyle { area: boolean; smooth: boolean; grid: boolean; barRadius: number; glow: boolean; lineWidth: number }
export interface ResolvedTheme {
  mood: string; primary: string; accent: string; palette: string[];
  background: string; header: string; kpi: string; radius: number; density: string;
  font: string; googleFont?: string; icons: Record<string, string>;
  bg: string; surface: string; ink: string; muted: string; border: string; grid: string; dark: boolean;
  chart: ChartStyle;
}

const VIVID = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"];

// ---- palette de graphes DÉRIVÉE des couleurs de marque (les couleurs restent celles du site) ----
function hexToHsl(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [230, 0.5, 0.45];
  const n = parseInt(m[1], 16); const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0; const l = (mx + mn) / 2;
  const d = mx - mn; const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return [h, s, l];
}
function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}
// Génère une palette cohérente ancrée sur primary + accent (rotations de teinte, S/L lisibles).
export function genPalette(primary: string, accent: string): string[] {
  const [h, s, l] = hexToHsl(primary);
  const S = Math.min(0.78, Math.max(0.45, s)), L = Math.min(0.6, Math.max(0.4, l));
  const rot = (d: number) => hslToHex((h + d + 360) % 360, S, L);
  return [primary, accent, rot(38), rot(-38), rot(85), rot(165)];
}

// Bibliothèque de thèmes premium. Chaque preset = ambiance complète (l'IA choisit selon le client).
type Preset = Partial<Omit<Theme, "mood">>;
export const PRESETS: Record<string, Preset> = {
  vivid:     { background: "soft",     header: "gradient", kpi: "icon",   radius: 16, palette: VIVID, googleFont: "Inter" },
  aurora:    { background: "mesh",     header: "gradient", kpi: "icon",   radius: 18, palette: ["#6366f1", "#8b5cf6", "#06b6d4", "#ec4899", "#3b82f6"], accent: "#8b5cf6", googleFont: "Sora" },
  ocean:     { background: "gradient", header: "gradient", kpi: "icon",   radius: 16, palette: ["#0ea5e9", "#06b6d4", "#3b82f6", "#14b8a6", "#6366f1"], primary: "#0b3b66", accent: "#06b6d4", googleFont: "Manrope" },
  sunset:    { background: "gradient", header: "gradient", kpi: "icon",   radius: 18, palette: ["#f97316", "#ef4444", "#ec4899", "#f59e0b", "#fb7185"], primary: "#7c2d12", accent: "#f97316", googleFont: "Plus Jakarta Sans" },
  forest:    { background: "soft",     header: "solid",    kpi: "icon",   radius: 14, palette: ["#16a34a", "#10b981", "#0d9488", "#65a30d", "#059669"], primary: "#14532d", accent: "#84cc16", googleFont: "Manrope" },
  noir:      { background: "dark",     header: "dark",     kpi: "icon",   radius: 16, palette: ["#c8a24a", "#e6c878", "#a78bfa", "#9aa0bd", "#f5f5f0"], primary: "#11131f", accent: "#c8a24a", googleFont: "Sora" },
  neon:      { background: "dark",     header: "dark",     kpi: "icon",   radius: 16, palette: ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#facc15"], accent: "#22d3ee", googleFont: "Space Grotesk" },
  royal:     { background: "plain",    header: "solid",    kpi: "accent", radius: 12, palette: ["#1b2a5b", "#c5a253", "#475569", "#64748b", "#0ea5e9"], primary: "#1b2a5b", accent: "#c5a253", googleFont: "Sora" },
  slate:     { background: "plain",    header: "solid",    kpi: "accent", radius: 12, palette: ["#334155", "#0ea5e9", "#64748b", "#94a3b8", "#1d4ed8"], primary: "#1e293b", accent: "#0ea5e9", googleFont: "Inter" },
  corporate: { background: "plain",    header: "solid",    kpi: "accent", radius: 12, palette: ["#1A1D56", "#475569", "#64748b", "#94a3b8", "#0ea5e9"], googleFont: "Inter" },
  pastel:    { background: "soft",     header: "minimal",  kpi: "gradient", radius: 18, palette: ["#818cf8", "#f0abfc", "#6ee7b7", "#fcd34d", "#7dd3fc"], bgColor: "#f7f7fb", googleFont: "DM Sans" },
  editorial: { background: "soft",     header: "minimal",  kpi: "plain",  radius: 14, palette: ["#1f2937", "#b45309", "#6b7280", "#0f766e", "#9333ea"], bgColor: "#faf7f0", googleFont: "Fraunces" },
  glass:     { background: "glass",    header: "gradient", kpi: "glass",  radius: 18, palette: VIVID, googleFont: "Sora" },
  minimal:   { background: "plain",    header: "minimal",  kpi: "plain",  radius: 14, palette: ["#111827", "#6b7280", "#9ca3af", "#374151", "#2563eb"], googleFont: "Inter" },
  dark:      { background: "dark",     header: "dark",     kpi: "icon",   radius: 16, palette: ["#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#f472b6"], googleFont: "Inter" },
};

// Style des graphes par mood (le rendu ECharts s'ajuste au thème choisi).
const CHART_DEFAULT: ChartStyle = { area: true, smooth: true, grid: true, barRadius: 8, glow: false, lineWidth: 2.5 };
const CHART_STYLES: Record<string, Partial<ChartStyle>> = {
  corporate: { area: false, smooth: false, barRadius: 4 },
  slate:     { area: false, smooth: false, barRadius: 4 },
  royal:     { area: false, smooth: true, barRadius: 6 },
  minimal:   { area: false, smooth: false, grid: false, barRadius: 2, lineWidth: 2 },
  editorial: { area: true, smooth: true, barRadius: 4 },
  noir:      { area: false, smooth: true, glow: true, barRadius: 8 },
  neon:      { area: true, smooth: true, glow: true, barRadius: 10 },
  aurora:    { area: true, smooth: true, glow: true, barRadius: 10 },
  glass:     { area: true, smooth: true, glow: true, barRadius: 10 },
};

export function resolveTheme(brand: Record<string, any> | null | undefined, t: Theme = {}): ResolvedTheme {
  const b = brand ?? {};
  const mood = t.mood && PRESETS[t.mood] ? t.mood : "vivid";
  const p = PRESETS[mood];
  // la marque prime pour les couleurs identitaires ; sinon on prend celles du preset.
  const primary = t.primary ?? b.colors?.primary ?? b.primary ?? p.primary ?? "#1A1D56";
  const accent = t.accent ?? b.colors?.accent ?? b.accent ?? p.accent ?? "#D6D303";
  const background = (t.background ?? p.background ?? "soft") as string;
  const dark = background === "dark";
  // Couleurs = marque. Priorité : palette explicite > PALETTE DU SITE (extraite) > dérivée de primary/accent.
  const brandPalette = Array.isArray(b.palette) && b.palette.length >= 3 ? (b.palette as string[]) : undefined;
  const palette = (t.palette && t.palette.length) ? t.palette : (brandPalette ?? genPalette(primary, accent));
  // Police = marque (site). Le thème ne la change QUE si explicitement demandé (t.font / t.googleFont).
  const brandFont = b.font ?? b.typography?.body ?? (b.fonts?.body ? `'${b.fonts.body}', system-ui, sans-serif` : undefined);
  const googleFont = t.googleFont ?? (b as { googleFont?: string }).googleFont ?? b.typography?.googleFont;
  const stack = t.font ?? brandFont ?? ((googleFont ? `'${googleFont}', ` : "") + "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif");
  const bgColor = t.bgColor ?? p.bgColor;
  return {
    mood, primary, accent, palette, background,
    header: (t.header ?? p.header ?? "gradient") as string,
    kpi: (t.kpi ?? p.kpi ?? "icon") as string,
    radius: t.radius ?? p.radius ?? 16,
    density: (t.density ?? p.density ?? "comfortable") as string,
    font: stack, googleFont,
    icons: t.icons ?? {},
    bg: dark ? "#0f1221" : (bgColor ?? "#f4f5f9"),
    surface: dark ? "#191d2e" : "#ffffff",
    ink: dark ? "#eef0f8" : "#171a2b",
    muted: dark ? "#9aa0bd" : "#6b7180",
    border: dark ? "#2a2f45" : "#ebedf4",
    grid: dark ? "#262b40" : "#eef0f6",
    dark,
    chart: { ...CHART_DEFAULT, ...(CHART_STYLES[mood] ?? {}), ...(t.chart ?? {}) },
  };
}

export const MOOD_KEYS = Object.keys(PRESETS);

// ---- icônes (jeu inline, style trait) ----------------------------------------
const ICONS: Record<string, string> = {
  banknote: "M3 6h18v12H3z M12 9a3 3 0 0 1 0 6 3 3 0 0 1 0-6Z M6 12h.01 M18 12h.01",
  "shopping-bag": "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18 M16 10a4 4 0 0 1-8 0",
  "shopping-cart": "M8 21a1 1 0 1 0 .01 0 M19 21a1 1 0 1 0 .01 0 M2 2h2l3.6 12.5a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 2-1.5L21 7H5.1",
  receipt: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z M8 7h8 M8 11h8 M8 15h5",
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  target: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  "trending-up": "M22 7 13.5 15.5l-5-5L2 17 M16 7h6v6",
  megaphone: "M3 11l18-5v12L3 14v-3z M11.6 16.8a3 3 0 1 1-5.8-1.6",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  wallet: "M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5 M16 12h.01",
  percent: "M19 5 5 19 M6.5 6.5a1.5 1.5 0 1 0 .01 0 M17.5 17.5a1.5 1.5 0 1 0 .01 0",
  "bar-chart": "M3 3v18h18 M7 16v-6 M12 16V8 M17 16v-9",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  rotate: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8 M3 3v5h5",
  package: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z M3.3 7 12 12l8.7-5 M12 22V12",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z M2 12h20 M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z",
  zap: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  trophy: "M6 9a6 6 0 0 0 12 0V3H6Z M6 5H3v2a3 3 0 0 0 3 3 M18 5h3v2a3 3 0 0 1-3 3 M9 21h6 M12 15v6",
  heart: "M19 14c1.5-1.5 3-3.2 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5C2 10.8 3.5 12.5 5 14l7 7Z",
  circle: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z",
};

export function iconFor(id: string, override?: string): string {
  if (override && ICONS[override]) return override;
  const k = id.toLowerCase();
  if (/\bca\b|revenue|sales|mrr|gross|honorair/.test(k)) return "banknote";
  if (/order|commande/.test(k)) return "shopping-bag";
  if (/cart|add_to_cart/.test(k)) return "shopping-cart";
  if (/aov|panier|ticket/.test(k)) return "receipt";
  if (/session|visit|traffic/.test(k)) return "activity";
  if (/conversion|convert|funnel/.test(k)) return "target";
  if (/roas|trend|growth|rotation/.test(k)) return "trending-up";
  if (/cac|cpa|ads|market|pub|cpc|cpm|spend/.test(k)) return "megaphone";
  if (/ltv|fidel|loyal/.test(k)) return "star";
  if (/cash|tresor|treso/.test(k)) return "wallet";
  if (/marge|margin|taux|rate|%|ebitda/.test(k)) return "percent";
  if (/result|net|opex|charge|cost|cogs/.test(k)) return "bar-chart";
  if (/client|customer|user|abonn|learner|appren/.test(k)) return "users";
  if (/refund|return|churn/.test(k)) return "rotate";
  if (/stock|inventory|units|article/.test(k)) return "package";
  if (/location|pays|country|geo/.test(k)) return "globe";
  return "circle";
}

export function iconSvg(name: string, color: string, size = 18): string {
  const d = ICONS[name] ?? ICONS.circle;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
}
