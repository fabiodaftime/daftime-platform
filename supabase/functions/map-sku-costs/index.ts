// map-sku-costs — importe un inventaire de N'IMPORTE QUEL format (CSV collé, texte,
// capture d'écran, PDF) et le remappe vers le schéma des coûts de revient SKU attendu
// par la plateforme (produit + packaging + transport amont + douane → CM1). Staff-only.
//
// AUTONOME (aucun import ../_shared) pour pouvoir être déployée au copier-coller depuis
// le dashboard Supabase quand la CLI n'est pas disponible.
//
// Body: { text?: string, image_base64?, image_media_type?, pdf_base64? }
// Réponse: { ok: true, rows: SkuCost[], usage }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// --- CORS + helper JSON ---
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// --- Garde staff (aligne _shared/guard.ts) ---
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

interface SkuCost {
  sku: string;
  product_cost?: number;
  packaging?: number;
  inbound_transport?: number;
  duties?: number;
}

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-6"; // extraction éco (palier "fast")

const SYSTEM = `Tu es un assistant qui normalise des inventaires e-commerce hétérogènes vers un schéma de coûts de revient unique.

La plateforme attend, par SKU, la décomposition du coût de revient (base de la marge CM1) :
- sku : la référence produit. À DÉFAUT de référence explicite, utilise le nom / libellé du produit (avec sa variante taille/couleur si présente).
- product_cost : coût d'achat / de fabrication de l'article (« cost per item », « coût unitaire », « prix d'achat », « COGS »…).
- packaging : coût d'emballage par unité.
- inbound_transport : transport AMONT (usine → entrepôt), fret, « inbound », « shipping in ».
- duties : droits de douane / taxes à l'import.

Règles :
- Mappe intelligemment les colonnes quel que soit leur ordre, leur langue ou leur intitulé.
- Ne remplis un champ QUE si l'information est réellement présente. N'invente jamais un coût.
- Normalise les nombres : retire les symboles monétaires et séparateurs de milliers, convertis la virgule décimale en point (« 8,50 € » → 8.5).
- Une ligne par SKU / variante. Ignore les lignes de total, d'en-tête ou vides.
- Si une colonne est ambiguë ou hors-schéma (prix de vente, stock, marge…), NE la mappe PAS sur un coût.
- Renvoie toutes les lignes exploitables via l'outil, sans commentaire.`;

const TOOL = {
  name: "sku_costs",
  description: "Renvoie la liste des SKU avec leurs composantes de coût de revient mappées au schéma de la plateforme.",
  input_schema: {
    type: "object",
    properties: {
      rows: {
        type: "array",
        description: "Une entrée par SKU / variante.",
        items: {
          type: "object",
          properties: {
            sku: { type: "string", description: "Référence produit, ou nom du produit à défaut." },
            product_cost: { type: "number", description: "Coût d'achat/fabrication unitaire (optionnel)." },
            packaging: { type: "number", description: "Coût d'emballage unitaire (optionnel)." },
            inbound_transport: { type: "number", description: "Transport amont / fret (optionnel)." },
            duties: { type: "number", description: "Droits de douane à l'import (optionnel)." },
          },
          required: ["sku"],
          additionalProperties: false,
        },
      },
    },
    required: ["rows"],
    additionalProperties: false,
  },
};

const isNum = (v: unknown): v is number => typeof v === "number" && isFinite(v);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    if (!ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY manquante" }, 500);

    const body = await req.json().catch(() => ({}));
    const { text, image_base64, image_media_type, pdf_base64 } = body ?? {};

    const content: unknown[] = [];
    if (image_base64) {
      content.push({ type: "image", source: { type: "base64", media_type: image_media_type ?? "image/png", data: image_base64 } });
      content.push({ type: "text", text: "Voici un inventaire (capture d'écran). Extrais les coûts de revient par SKU." });
    } else if (pdf_base64) {
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf_base64 } });
      content.push({ type: "text", text: "Voici un inventaire (PDF). Extrais les coûts de revient par SKU." });
    } else if (typeof text === "string" && text.trim()) {
      content.push({ type: "text", text: `Voici un inventaire brut. Extrais les coûts de revient par SKU et remappe-les au schéma :\n\n${text.slice(0, 60_000)}` });
    } else {
      return json({ error: "Fournir 'text', 'image_base64' ou 'pdf_base64'." }, 400);
    }

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM,
        messages: [{ role: "user", content }],
        tools: [TOOL],
        tool_choice: { type: "tool", name: TOOL.name },
      }),
    });
    const raw = await resp.text();
    if (!resp.ok) return json({ error: `Anthropic ${resp.status}: ${raw}` }, 502);
    const data = JSON.parse(raw);
    const block = (data.content ?? []).find((b: { type: string; name?: string }) => b.type === "tool_use" && b.name === TOOL.name);
    const input = (block?.input ?? null) as { rows?: SkuCost[] } | null;

    // Nettoyage défensif : sku non vide obligatoire, coûts numériques ≥ 0 uniquement.
    const rows: SkuCost[] = (input?.rows ?? [])
      .filter((r) => r && typeof r.sku === "string" && r.sku.trim())
      .map((r) => {
        const out: SkuCost = { sku: r.sku.trim() };
        for (const k of ["product_cost", "packaging", "inbound_transport", "duties"] as const) {
          if (isNum(r[k]) && (r[k] as number) >= 0) out[k] = r[k];
        }
        return out;
      });

    return json({ ok: true, rows, usage: data.usage });
  } catch (e) {
    console.error("map-sku-costs:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
