// map-sku-costs — importe un inventaire de N'IMPORTE QUEL format (CSV collé, texte,
// capture d'écran, PDF) et le remappe vers le schéma des coûts de revient SKU attendu
// par la plateforme (produit + packaging + transport amont + douane → CM1).
// Staff-only. Sortie structurée garantie par l'outil Anthropic.
//
// Body: { text?: string, image_base64?, image_media_type?, pdf_base64? }
// Réponse: { ok: true, rows: SkuCost[], usage }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropicTool, MODELS } from "../_shared/anthropic.ts";

interface SkuCost {
  sku: string;
  product_cost?: number;
  packaging?: number;
  inbound_transport?: number;
  duties?: number;
}

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
} as const;

const isNum = (v: unknown): v is number => typeof v === "number" && isFinite(v);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);

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

    const { input, usage } = await callAnthropicTool<{ rows: SkuCost[] }>({
      model: MODELS.fast,
      system: SYSTEM,
      messages: [{ role: "user", content }],
      tool: TOOL as unknown as { name: string; description: string; input_schema: Record<string, unknown> },
      max_tokens: 4096,
    });

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

    return json({ ok: true, rows, usage });
  } catch (e) {
    console.error("map-sku-costs:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
