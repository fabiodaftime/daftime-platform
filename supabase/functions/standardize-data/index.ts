// ② standardize-data — agrège fichiers du mois + contexte courant + type d'activité,
// et produit des DONNÉES STANDARDISÉES (source de vérité) pour un client/mois.
// Signale explicitement les pièces manquantes au lieu d'inventer.
//
// Body: { client_id: uuid, period: "YYYY-MM-01" }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, extractJson, MODELS } from "../_shared/anthropic.ts";
import { insertVersion } from "../_shared/versioning.ts";

const SYSTEM = (activity: string) => `Tu es un analyste financier qui standardise les données mensuelles d'un client.
Type d'activité du client : "${activity}".
À partir du CONTEXTE et des FICHIERS fournis, produis un jeu de données standardisé, cohérent et exploitable.
RÈGLES ABSOLUES :
- N'invente JAMAIS un chiffre. Si une donnée nécessaire est absente ou ambiguë, NE la devine pas.
- Toute information manquante doit être listée dans "missing_items" (libellé clair de ce qu'il faut demander au client).
- Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour.
Format attendu : { "data": { ...données standardisées... }, "missing_items": [ "..." ] }`;

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

    const docs: { name: string; content: string }[] = [];
    for (const f of files ?? []) {
      if (f.storage_path) {
        const { data: blob } = await admin.storage.from("client-files").download(f.storage_path);
        if (blob) docs.push({ name: f.original_name ?? f.id, content: (await blob.text()).slice(0, 50_000) });
      }
    }

    const activity = (client as { activity_types?: { slug?: string } }).activity_types?.slug ?? "inconnu";
    const userContent =
      `CONTEXTE CLIENT:\n${JSON.stringify(ctx?.data ?? {}, null, 2)}\n\n` +
      `FICHIERS DU MOIS (${docs.length}):\n` +
      (docs.length
        ? docs.map((d) => `### ${d.name}\n${d.content}`).join("\n\n")
        : "(aucun fichier déposé pour ce mois)");

    const { text: out, usage } = await callAnthropic({
      model: MODELS.fast,
      system: SYSTEM(activity),
      messages: [{ role: "user", content: userContent }],
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
