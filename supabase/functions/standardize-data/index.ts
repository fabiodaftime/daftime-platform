// ② standardize-data — agrège fichiers du mois + contexte courant + type d'activité,
// et produit des DONNÉES STANDARDISÉES (source de vérité) pour un client/mois.
// Signale explicitement les pièces manquantes au lieu d'inventer.
//
// Body: { client_id: uuid, period: "YYYY-MM-01" }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, extractJson, MODELS, type AnthropicMessage } from "../_shared/anthropic.ts";
import { insertVersion } from "../_shared/versioning.ts";
import { readClientFiles, filesToContentBlocks } from "../_shared/readFiles.ts";

// Repères métier par type d'activité (KPIs et charges typiques). Surchargé par activity_types.config si fourni.
const ACTIVITY_GUIDE: Record<string, string> = {
  ecommerce: "KPIs : chiffre d'affaires, marge brute, coût d'acquisition (CAC/MER/ROAS), panier moyen, taux de marge. Charges typiques : achats/COGS, publicité, frais de plateforme (Shopify/Stripe), logistique.",
  coach: "KPIs : chiffre d'affaires, nombre de clients/sessions, taux de remplissage, panier moyen. Charges typiques : outils, marketing, sous-traitance.",
  restaurant: "KPIs : chiffre d'affaires, food cost %, masse salariale %, ticket moyen. Charges typiques : achats matières, personnel, loyer, énergie.",
  holding: "Structure : remontées par filiale, dividendes reçus, frais de holding, consolidation simple. KPIs : résultat consolidé, trésorerie par entité.",
  services: "KPIs : chiffre d'affaires, taux journalier moyen, taux d'occupation/staffing, créances clients. Charges typiques : masse salariale, sous-traitance, frais généraux.",
};

const SYSTEM = (activity: string, guide: string) => `Tu es un analyste financier qui standardise les données mensuelles d'un client.
Type d'activité du client : "${activity}".
À partir du CONTEXTE et des FICHIERS fournis (qui peuvent inclure des PDF et des images : relevés, factures, exports comptables), produis un jeu de données standardisé, cohérent et exploitable.

RÈGLES ABSOLUES :
- N'invente JAMAIS un chiffre. Si une donnée nécessaire est absente ou ambiguë, NE la devine pas.
- Toute information manquante doit être listée dans "missing_items" (libellé clair de ce qu'il faut demander au client).
- Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour.

STRUCTURE CIBLE (à adapter aux données réelles, ne rien inventer) :
- Section "pnl" (Compte de résultat) avec, dans l'ordre : Chiffre d'affaires, Coût des ventes (COGS), Marge brute, les postes de Charges d'exploitation détaillés, EBITDA, Résultat d'exploitation, Résultat net.
  Marque CHAQUE ligne de total/sous-total avec "type":"total" (ex. Marge brute, EBITDA, Résultat d'exploitation, Résultat net).
- Section "tresorerie" si l'information est disponible : solde de trésorerie de fin de mois, variation sur le mois.
${guide ? `- Spécificités du métier : ${guide}` : ""}

Format attendu (STRICT, structure tabulaire) :
{
  "data": {
    "sections": [
      { "key": "pnl", "label": "Compte de résultat",
        "rows": [
          { "label": "Chiffre d'affaires", "value": 12000, "unit": "EUR" },
          { "label": "Marge brute", "value": 8000, "unit": "EUR", "type": "total" }
        ] }
    ]
  },
  "missing_items": [ "ce qu'il faut demander au client" ]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    const { admin, user } = guard;

    const body = await req.json().catch(() => ({}));
    const client_id: string | undefined = body.client_id;
    const period: string | undefined = body.period;
    if (!client_id || !period) return json({ error: "client_id et period (YYYY-MM-01) requis" }, 400);

    const { data: client } = await admin
      .from("clients")
      .select("id, name, activity_type_id, activity_types:activity_type_id(slug, name, config)")
      .eq("id", client_id)
      .maybeSingle();
    if (!client) return json({ error: "client introuvable" }, 404);

    const { data: ctx } = await admin
      .from("contexts").select("data").eq("client_id", client_id).eq("is_current", true).maybeSingle();

    const { data: files } = await admin
      .from("files").select("*").eq("client_id", client_id).eq("period", period);

    const docs = await readClientFiles(admin, files ?? []);

    const at = (client as { activity_types?: { slug?: string; config?: Record<string, unknown> } }).activity_types;
    const activity = at?.slug ?? "inconnu";
    const configGuide = at?.config && Object.keys(at.config).length ? JSON.stringify(at.config) : "";
    const guide = [ACTIVITY_GUIDE[activity] ?? "", configGuide].filter(Boolean).join(" ");

    // Message multimodal : contexte (texte) + chaque fichier (texte, ou bloc PDF/image natif).
    const content: unknown[] = [
      { type: "text", text: `CONTEXTE CLIENT:\n${JSON.stringify(ctx?.data ?? {}, null, 2)}\n\nFICHIERS DU MOIS (${docs.length}) :` },
      ...(docs.length ? filesToContentBlocks(docs) : [{ type: "text", text: "(aucun fichier déposé pour ce mois)" }]),
      { type: "text", text: "Produis maintenant le JSON standardisé selon les règles." },
    ];

    const { text: out, usage } = await callAnthropic({
      model: MODELS.fast,
      system: SYSTEM(activity, guide),
      messages: [{ role: "user", content } as AnthropicMessage],
      max_tokens: 8000,
    });
    const parsed = extractJson<{ data?: unknown; missing_items?: unknown[] }>(out);

    const saved = await insertVersion(admin, "standardized_data", { client_id, period }, {
      activity_type_id: client.activity_type_id,
      data: parsed.data ?? {},
      missing_items: parsed.missing_items ?? [],
      source: "ai",
      created_by: user.id,
    });

    return json({ ok: true, standardized_data: saved, usage });
  } catch (e) {
    console.error("standardize-data:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
