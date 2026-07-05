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

const SYSTEM = `Tu es un analyste financier qui AFFINE / CORRIGE des données standardisées, en dialogue. Tu as accès aux FICHIERS sources : tu peux donc RÉ-EXTRAIRE une valeur depuis une AUTRE colonne / ligne / feuille si on te le demande (ex. « pour le CA, prends la colonne Net et non Gross »).

Chaque ligne a la forme { "id", "label", "value", "unit" } et parfois { "derived": true, "formula", "source", "trace", "confidence" }.

RÈGLES STRICTES :
- PRÉSERVE EXACTEMENT la structure : mêmes sections (key, label), mêmes lignes avec leur "id" et "unit", et garde les champs "derived"/"formula" inchangés. Ne renomme/supprime une ligne ou section QUE si l'instruction le demande.
- N'invente JAMAIS un chiffre : toute valeur vient des fichiers fournis.
- RÉ-EXTRACTION : si on te demande de prendre une autre colonne/source pour un poste, recalcule sa valeur DEPUIS le fichier, mets à jour sa "source" pour décrire la nouvelle opération (ex. « Σ colonne «Net» … »), et "confidence":"manual".
- COHÉRENCE DES DÉRIVÉS : si tu changes une valeur d'INPUT (ligne SANS "formula"), recalcule les lignes DÉRIVÉES impactées en appliquant leur "formula" (sur les mêmes ids), et conserve leurs autres champs.
- Donnée indisponible → retire la ligne et ajoute un libellé clair dans "missing_items".
- Réponds UNIQUEMENT en JSON valide :
  { "data": { "sections": [ { "key","label","rows":[ {"id","label","value","unit", ...champs conservés } ] } ] }, "missing_items": [ "..." ], "summary": "ce qui a changé, en une phrase" }`;

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
    // Ici on n'exploite que le TEXTE des fichiers (Excel/CSV/txt) — inutile de télécharger et
    // d'encoder les PDF/images (lourds, plusieurs Mo) qui ne sont de toute façon pas passés au modèle.
    const textFiles = (files ?? []).filter((f: { original_name?: string | null }) =>
      /\.(xlsx|xls|csv|tsv|txt|md|json)$/i.test(String(f.original_name ?? "")));
    const docs = await readClientFiles(admin, textFiles);

    const messages: AnthropicMessage[] = [
      ...history,
      {
        role: "user",
        content:
          `CONTEXTE:\n${JSON.stringify(ctx?.data ?? {}, null, 2)}\n\n` +
          `DONNÉES ACTUELLES:\n${JSON.stringify(sd?.data ?? { sections: [] }, null, 2)}\n\n` +
          `PIÈCES MANQUANTES ACTUELLES:\n${JSON.stringify(sd?.missing_items ?? [], null, 2)}\n\n` +
          `FICHIERS (${docs.length}):\n${docs.map((d) => `### ${d.name}\n${d.kind === "text" ? d.content : `(non lu : ${(d as { reason?: string }).reason ?? "ignoré"})`}`).join("\n\n") || "(aucun)"}\n\n` +
          `INSTRUCTION:\n${message}`,
      },
    ];

    const { text: out, usage } = await callAnthropic({
      model: MODELS.fast,
      system: SYSTEM,
      messages,
      max_tokens: 8000,
      signal: AbortSignal.timeout(150_000), // échec propre si l'appel LLM traîne, au lieu d'un 500 opaque
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
