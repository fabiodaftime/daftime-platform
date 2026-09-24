// map-sku-costs — importe un/des inventaire(s) de N'IMPORTE QUEL format et les remappe vers
// le schéma des coûts de revient SKU (produit + packaging + transport amont + douane → CM1).
// Staff-only. AUTONOME (aucun import ../_shared) pour déploiement dashboard.
//
// Modes :
//  - TABULAIRE (body.text, ou body.texts = plusieurs fichiers CSV/TSV) → l'IA identifie le
//    RÔLE de chaque colonne (sku, name, barcode, coûts) sur un échantillon, puis le code
//    applique le mapping à TOUTES les lignes localement (scale). Plusieurs fichiers sont
//    JOINTS de façon déterministe sur le code-barres (EAN), à défaut sur le SKU : ça permet
//    p.ex. de croiser un inventaire (codes) avec un export produits Shopify (noms + coûts).
//    Renvoie une ligne par SKU même sans coût (seed).
//  - IMAGE / PDF (body.image_base64 / body.pdf_base64) → l'IA extrait directement les lignes.
//
// Réponse: { ok: true, rows: SkuCost[], seeded: boolean, usage }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const STAFF_ROLES = ["admin", "manager", "collaborateur", "super_admin"];
async function requireStaff(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) return { ok: false as const, error: "Not authenticated", status: 401 };
  const url = Deno.env.get("SUPABASE_URL")!;
  const userSb = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error } = await userSb.auth.getUser();
  if (error || !userData?.user) return { ok: false as const, error: "Not authenticated", status: 401 };
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id);
  const isStaff = (roles ?? []).some((r: { role: string }) => STAFF_ROLES.includes(r.role));
  if (!isStaff) return { ok: false as const, error: "Staff role required", status: 403 };
  return { ok: true as const, user: userData.user };
}

interface SkuCost { sku: string; name?: string; product_cost?: number; packaging?: number; inbound_transport?: number; duties?: number }
const COST_KEYS = ["product_cost", "packaging", "inbound_transport", "duties"] as const;

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-6";
const MAX_ROWS = 5000;

const pickDelim = (line: string): string => {
  const c = (line.match(/,/g) || []).length, s = (line.match(/;/g) || []).length, t = (line.match(/\t/g) || []).length;
  if (t >= c && t >= s && t > 0) return "\t";
  if (s > c) return ";";
  return ",";
};
const splitLine = (line: string, delim: string): string[] => {
  const out: string[] = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else { if (ch === '"') q = true; else if (ch === delim) { out.push(cur); cur = ""; } else cur += ch; }
  }
  out.push(cur);
  return out.map((s) => s.trim());
};
const num = (v: unknown): number | undefined => {
  if (v == null) return undefined;
  const n = parseFloat(String(v).replace(/\s/g, "").replace(",", ".").replace(/[^\d.\-]/g, ""));
  return isFinite(n) && n >= 0 ? n : undefined;
};

async function anthropicTool(system: string, content: unknown[], tool: Record<string, unknown>, maxTokens: number) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL, max_tokens: maxTokens, system,
      messages: [{ role: "user", content }],
      tools: [tool], tool_choice: { type: "tool", name: (tool as { name: string }).name },
    }),
  });
  const raw = await resp.text();
  if (!resp.ok) throw new Error(`Anthropic ${resp.status}: ${raw}`);
  const data = JSON.parse(raw);
  const block = (data.content ?? []).find((b: { type: string; name?: string }) => b.type === "tool_use" && b.name === (tool as { name: string }).name);
  return { input: block?.input ?? null, usage: data.usage };
}

// ---- MODE TABULAIRE : l'IA mappe les colonnes, le code applique/joint localement ----
const MAP_SYSTEM = `On te donne les premières lignes d'un fichier e-commerce (inventaire ou export produits), déjà découpées en colonnes (index 0-based).
Identifie le rôle de chaque colonne et renvoie des INDEX de colonnes (-1 si absent).

- sku : colonne de référence produit / SKU (renseignée de préférence). -1 si aucune.
- name : colonne du NOM / libellé / titre du produit. -1 si absente.
- barcode : colonne code-barres / EAN / GTIN (sert à croiser plusieurs fichiers). -1 si absente.
- product_cost : coût d'achat/fabrication unitaire (« cost per item », « prix d'achat », « COGS »). -1 si absent.
- packaging : coût d'emballage unitaire. -1 si absent.
- inbound_transport : transport AMONT / fret / « inbound ». -1 si absent.
- duties : droits de douane à l'import. -1 si absent.

Règles STRICTES :
- NE mappe JAMAIS une colonne de prix de VENTE, stock/quantité, entrepôt, date, marge ou ventes sur un coût : -1.
- Il est NORMAL qu'un fichier n'ait aucun coût : dans ce cas tous les coûts valent -1.
- Au moins l'un de sku ou name doit être renseigné (>=0).
- has_header = true si la première ligne fournie est un en-tête.`;

const MAP_TOOL = {
  name: "column_mapping",
  description: "Index 0-based des colonnes pour chaque champ. -1 pour un champ absent.",
  input_schema: {
    type: "object",
    properties: {
      has_header: { type: "boolean" },
      sku: { type: "integer", description: "Index de la colonne SKU/référence, ou -1." },
      name: { type: "integer", description: "Index de la colonne nom/libellé, ou -1." },
      barcode: { type: "integer", description: "Index du code-barres/EAN, ou -1." },
      product_cost: { type: "integer", description: "Index, ou -1." },
      packaging: { type: "integer", description: "Index, ou -1." },
      inbound_transport: { type: "integer", description: "Index, ou -1." },
      duties: { type: "integer", description: "Index, ou -1." },
    },
    required: ["has_header", "sku", "name", "barcode", "product_cost", "packaging", "inbound_transport", "duties"],
    additionalProperties: false,
  },
};

type Mapping = { has_header?: boolean; sku?: number; name?: number; barcode?: number; product_cost?: number; packaging?: number; inbound_transport?: number; duties?: number };
type Rec = { sku?: string; name?: string; barcode?: string; product_cost?: number; packaging?: number; inbound_transport?: number; duties?: number };

async function mapOneFile(text: string): Promise<{ parsed: string[][]; m: Mapping }> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return { parsed: [], m: {} };
  const delim = pickDelim(lines[0]);
  const parsed = lines.map((l) => splitLine(l, delim));
  const { input } = await anthropicTool(
    MAP_SYSTEM,
    [{ type: "text", text: `Lignes (JSON, index 0-based) :\n${JSON.stringify(parsed.slice(0, 8))}` }],
    MAP_TOOL, 700,
  );
  return { parsed, m: (input as Mapping) ?? {} };
}

function recordsFromFile(parsed: string[][], m: Mapping): Rec[] {
  if (!parsed.length) return [];
  const ncols = Math.max(...parsed.map((r) => r.length));
  const valid = (i: number | undefined) => typeof i === "number" && i >= 0 && i < ncols;
  const data = m.has_header ? parsed.slice(1) : parsed;
  const out: Rec[] = [];
  for (const r of data) {
    const rec: Rec = {};
    if (valid(m.sku)) rec.sku = (r[m.sku as number] ?? "").trim() || undefined;
    if (valid(m.name)) rec.name = (r[m.name as number] ?? "").trim() || undefined;
    if (valid(m.barcode)) rec.barcode = (r[m.barcode as number] ?? "").trim() || undefined;
    for (const k of COST_KEYS) { if (valid(m[k])) { const v = num(r[m[k] as number]); if (v !== undefined) rec[k] = v; } }
    if (rec.sku || rec.name || rec.barcode) out.push(rec);
  }
  return out;
}

async function fromTexts(texts: string[]): Promise<{ rows: SkuCost[]; seeded: boolean; usage: unknown }> {
  const files: Rec[][] = [];
  for (const t of texts) {
    if (!t || !t.trim()) continue;
    const { parsed, m } = await mapOneFile(t.slice(0, 200_000));
    files.push(recordsFromFile(parsed, m));
  }
  if (!files.some((f) => f.length)) throw new Error("Aucun produit identifiable dans le(s) fichier(s).");

  // Jointure déterministe : index par code-barres puis par SKU ; on enrichit sans écraser.
  const norm = (s?: string) => (s ?? "").trim().toLowerCase();
  const byBarcode = new Map<string, Rec>();
  const bySku = new Map<string, Rec>();
  const entries: Rec[] = [];
  const attach = (rec: Rec) => {
    let e = (rec.barcode && byBarcode.get(norm(rec.barcode))) || (rec.sku && bySku.get(norm(rec.sku))) || null;
    if (!e) { e = {}; entries.push(e); }
    if (rec.sku && !e.sku) e.sku = rec.sku;
    if (rec.name && !e.name) e.name = rec.name;
    if (rec.barcode && !e.barcode) e.barcode = rec.barcode;
    for (const k of COST_KEYS) { if (rec[k] !== undefined && e[k] === undefined) e[k] = rec[k]; }
    if (e.barcode) byBarcode.set(norm(e.barcode), e);
    if (e.sku) bySku.set(norm(e.sku), e);
  };
  for (const recs of files) {
    for (const rec of recs) { attach(rec); if (entries.length >= MAX_ROWS) break; }
  }

  let anyCost = false;
  const rows: SkuCost[] = [];
  for (const e of entries) {
    const sku = (e.sku || e.name || e.barcode || "").trim();
    if (!sku) continue;
    const row: SkuCost = { sku };
    if (e.name && e.name !== sku) row.name = e.name;
    for (const k of COST_KEYS) { if (e[k] !== undefined) { row[k] = e[k]; anyCost = true; } }
    rows.push(row);
  }
  return { rows, seeded: !anyCost, usage: null };
}

// ---- MODE IMAGE / PDF : extraction directe des lignes ----
const EXTRACT_SYSTEM = `Tu extrais un inventaire e-commerce vers un schéma de coûts de revient (produit + packaging + transport amont + douane → CM1).
Pour chaque produit/SKU : sku (référence, ou nom du produit à défaut), name (nom/libellé si disponible), puis product_cost, packaging, inbound_transport, duties UNIQUEMENT si présents.
Ne remplis un coût que s'il existe (n'invente rien). Normalise les nombres (« 8,50 € » → 8.5). Une ligne par SKU/variante.
Si aucun coût n'est présent, renvoie quand même une ligne par produit. Ignore prix de vente, stock, totaux.`;
const EXTRACT_TOOL = {
  name: "sku_costs",
  description: "Liste des SKU avec nom et composantes de coût (optionnelles).",
  input_schema: {
    type: "object",
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          properties: {
            sku: { type: "string" }, name: { type: "string" },
            product_cost: { type: "number" }, packaging: { type: "number" },
            inbound_transport: { type: "number" }, duties: { type: "number" },
          },
          required: ["sku"], additionalProperties: false,
        },
      },
    },
    required: ["rows"], additionalProperties: false,
  },
};

async function fromMedia(content: unknown[]): Promise<{ rows: SkuCost[]; seeded: boolean; usage: unknown }> {
  const { input, usage } = await anthropicTool(EXTRACT_SYSTEM, content, EXTRACT_TOOL, 8000);
  const raw = ((input as { rows?: (SkuCost & { name?: string })[] } | null)?.rows) ?? [];
  const seen = new Set<string>();
  const rows: SkuCost[] = [];
  let anyCost = false;
  for (const r of raw) {
    if (!r || typeof r.sku !== "string" || !r.sku.trim()) continue;
    const sku = r.sku.trim(); const key = sku.toLowerCase();
    if (seen.has(key)) continue; seen.add(key);
    const row: SkuCost = { sku };
    if (typeof r.name === "string" && r.name.trim() && r.name.trim() !== sku) row.name = r.name.trim();
    for (const k of COST_KEYS) { if (typeof r[k] === "number" && isFinite(r[k] as number) && (r[k] as number) >= 0) { row[k] = r[k]; anyCost = true; } }
    rows.push(row);
    if (rows.length >= MAX_ROWS) break;
  }
  return { rows, seeded: !anyCost, usage };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    if (!ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY manquante" }, 500);

    const body = await req.json().catch(() => ({}));
    const { text, texts, image_base64, image_media_type, pdf_base64 } = body ?? {};

    let result: { rows: SkuCost[]; seeded: boolean; usage: unknown };
    if (image_base64) {
      result = await fromMedia([
        { type: "image", source: { type: "base64", media_type: image_media_type ?? "image/png", data: image_base64 } },
        { type: "text", text: "Extrais les produits / coûts de cet inventaire." },
      ]);
    } else if (pdf_base64) {
      result = await fromMedia([
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf_base64 } },
        { type: "text", text: "Extrais les produits / coûts de cet inventaire." },
      ]);
    } else if (Array.isArray(texts) && texts.some((t) => typeof t === "string" && t.trim())) {
      result = await fromTexts(texts.filter((t) => typeof t === "string" && t.trim()));
    } else if (typeof text === "string" && text.trim()) {
      result = await fromTexts([text]);
    } else {
      return json({ error: "Fournir 'text', 'texts', 'image_base64' ou 'pdf_base64'." }, 400);
    }

    return json({ ok: true, rows: result.rows, seeded: result.seeded, usage: result.usage });
  } catch (e) {
    console.error("map-sku-costs:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
