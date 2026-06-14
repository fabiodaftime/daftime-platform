// ⑥ chat-standardize — affine les DONNÉES STANDARDISÉES d'un client/mois par conversation.
// Ex: « le CA de mars ne sera pas dispo », « ajoute marge brute = 5000 », « corrige cette ligne ».
// Enregistre une nouvelle version de standardized_data.
//
// Body: { client_id, period, message, history?: {role, content}[] }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, extractJson, MODELS, type AnthropicMessage } from "../_shared/anthropic.ts";
import { insertVersion } from "../_shared/versioning.ts";
import { readClientFiles } from "../_shared/readFiles.ts";

const SYSTEM = `Tu es un analyste financier qui AFFINE des données standardisées avec l'utilisateur, en dialogue.
Tu reçois les données actuelles (structure sections/rows), le contexte, les fichiers, et une instruction.
L'utilisateur peut : signaler qu'une donnée ne sera pas disponible, corriger/ajouter/retirer une ligne, renommer une section, etc.
RÈGLES :
- N'invente JAMAIS un chiffre. Si une donnée est déclarée indisponible, retire-la des données et ajoute un libellé clair dans "missing_items".
- Conserve la structure tabulaire { sections: [ { key, label, rows: [ { label, value, unit } ] } ] }.
- Réponds UNIQUEMENT avec un JSON valide :
  { "data": { "sections": [...] }, "missing_items": [ "..." ], "summary": "résumé des changements" }`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    const { admin, user } = guard;

    const body = await req.json().catch(() => ({}));
    const client_id: string | undefined = body.client_id;
    const period: string | undefined = body.period;
    const message: string | undefined = body.message;
    const history: AnthropicMessage[] = Array.isArray(body.history) ? body.history : [];
    if (!client_id || !period || !message) return json({ error: "client_id, period et message requis" }, 400);

    const { data: client } = await admin
      .from("clients")
      .select("id, activity_type_id, activity_types:activity_type_id(slug)")
      .eq("id", client_id).maybeSingle();
    if (!client) return json({ error: "client introuvable" }, 404);

    const { data: ctx } = await admin
      .from("contexts").select("data").eq("client_id", client_id).eq("is_current", true).maybeSingle();
    const { data: sd } = await admin
      .from("standardized_data").select("*").eq("client_id", client_id).eq("period", period).eq("is_current", true).maybeSingle();
    const { data: files } = await admin
      .from("files").select("*").eq("client_id", client_id).eq("period", period);
    const docs = await readClientFiles(admin, files ?? []);

    const messages: AnthropicMessage[] = [
      ...history,
      {
        role: "user",
        content:
          `CONTEXTE:\n${JSON.stringify(ctx?.data ?? {}, null, 2)}\n\n` +
          `DONNÉES ACTUELLES:\n${JSON.stringify(sd?.data ?? { sections: [] }, null, 2)}\n\n` +
          `PIÈCES MANQUANTES ACTUELLES:\n${JSON.stringify(sd?.missing_items ?? [], null, 2)}\n\n` +
          `FICHIERS (${docs.length}):\n${docs.map((d) => `### ${d.name}\n${d.content}`).join("\n\n") || "(aucun)"}\n\n` +
          `INSTRUCTION:\n${message}`,
      },
    ];

    const { text: out, usage } = await callAnthropic({
      model: MODELS.fast,
      system: SYSTEM,
      messages,
      max_tokens: 8000,
    });
    const parsed = extractJson<{ data?: unknown; missing_items?: unknown[]; summary?: string }>(out);

    const saved = await insertVersion(admin, "standardized_data", { client_id, period }, {
      activity_type_id: client.activity_type_id,
      data: parsed.data ?? { sections: [] },
      missing_items: parsed.missing_items ?? [],
      source: "ai",
      created_by: user.id,
    });

    return json({ ok: true, standardized_data: saved, summary: parsed.summary ?? "", usage });
  } catch (e) {
    console.error("chat-standardize:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
