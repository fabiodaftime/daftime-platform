// Thème data-driven du dashboard : la PRÉSENTATION devient un jeu de paramètres.
// L'IA compose un thème adapté à l'univers du client ; le chat peut l'ajuster ; le code l'applique.
// Aucun recodage : changer le thème change le rendu.

export interface Theme {
  mood?: "vivid" | "corporate" | "minimal" | "dark" | "editorial";
  primary?: string; accent?: string;
  palette?: string[];                 // couleurs des graphes / icônes
  background?: "soft" | "plain" | "gradient" | "dark";
  header?: "gradient" | "solid" | "dark" | "minimal";
  kpi?: "icon" | "accent" | "gradient" | "plain";
  radius?: number;                    // arrondi des cartes (px)
  density?: "comfortable" | "compact";
  font?: string;
  icons?: Record<string, string>;     // id de métrique -> nom d'icône
}

export interface ResolvedTheme {
  mood: string; primary: string; accent: string; palette: string[];
  background: string; header: string; kpi: string; radius: number; density: string; font: string;
  icons: Record<string, string>;
  // couleurs dérivées
  bg: string; surface: string; ink: string; muted: string; border: string; grid: string; dark: boolean;
}

const VIVID = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#14b8a6"];

const MOODS: Record<string, Partial<ResolvedTheme>> = {
  vivid:     { background: "soft",  header: "gradient", kpi: "icon",   radius: 16 },
  corporate: { background: "plain", header: "solid",    kpi: "accent", radius: 12 },
  minimal:   { background: "plain", header: "minimal",  kpi: "plain",  radius: 14 },
  dark:      { background: "dark",  header: "dark",      kpi: "icon",   radius: 16 },
  editorial: { background: "soft",  header: "minimal",  kpi: "gradient", radius: 18 },
};

export function resolveTheme(brand: Record<string, any> | null | undefined, t: Theme = {}): ResolvedTheme {
  const b = brand ?? {};
  const primary = t.primary ?? b.colors?.primary ?? b.primary ?? "#1A1D56";
  const accent = t.accent ?? b.colors?.accent ?? b.accent ?? "#D6D303";
  const mood = t.mood ?? "vivid";
  const m = MOODS[mood] ?? MOODS.vivid;
  const dark = (t.background ?? m.background) === "dark";
  const palette = (t.palette && t.palette.length ? t.palette : (mood === "corporate" ? [primary, "#475569", "#64748b", accent, "#94a3b8", "#0ea5e9"] : VIVID));
  return {
    mood, primary, accent, palette,
    background: t.background ?? m.background ?? "soft",
    header: t.header ?? m.header ?? "gradient",
    kpi: t.kpi ?? m.kpi ?? "icon",
    radius: t.radius ?? m.radius ?? 16,
    density: t.density ?? "comfortable",
    font: t.font ?? b.typography?.body ?? b.font ?? "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    icons: t.icons ?? {},
    bg: dark ? "#0f1221" : "#f4f5f9",
    surface: dark ? "#1a1e30" : "#ffffff",
    ink: dark ? "#eef0f8" : "#171a2b",
    muted: dark ? "#9aa0bd" : "#6b7180",
    border: dark ? "#2a2f45" : "#ebedf4",
    grid: dark ? "#262b40" : "#eef0f6",
    dark,
  };
}

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
  circle: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z",
};

export function iconFor(id: string, override?: string): string {
  if (override && ICONS[override]) return override;
  const k = id.toLowerCase();
  if (/\bca\b|revenue|sales|mrr|gross|honorair/.test(k)) return "banknote";
  if (/order|commande/.test(k)) return "shopping-bag";
  if (/cart|panier_ajout|add_to_cart/.test(k)) return "shopping-cart";
  if (/aov|panier|ticket/.test(k)) return "receipt";
  if (/session|visit|traffic/.test(k)) return "activity";
  if (/conversion|convert|funnel/.test(k)) return "target";
  if (/roas|trend|growth|rotation/.test(k)) return "trending-up";
  if (/cac|cpa|ads|market|pub|cpc|cpm|spend/.test(k)) return "megaphone";
  if (/ltv|star|fidel/.test(k)) return "star";
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
