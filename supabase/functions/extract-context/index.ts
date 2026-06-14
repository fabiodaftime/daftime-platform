// ① extract-context — extrait le CONTEXTE métier d'un client depuis un document (.txt/.md)
// et l'enregistre comme nouvelle version dans `contexts`.
//
// Body: { client_id: uuid, file_id?: uuid, text?: string }
//   - soit file_id (lit le fichier dans le bucket client-files), soit text brut.

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, extractJson, MODELS } from "../_shared/anthropic.ts";
import { insertVersion } from "../_shared/versioning.ts";

const SYSTEM = `Tu es un assistant qui extrait le CONTEXTE métier d'un client à partir d'un document.
Objectif : structurer les informations utiles pour produire ensuite des analyses financières.
Extrais notamment (quand présents) : activité/secteur, modèle économique, devise, périmètre (entités),
particularités comptables, saisonnalité, faits marquants, et toute note utile.
RÈGLES :
- N'invente rien. Si une information est absente, ne la mets pas.
- Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour.
Format attendu : { "summary": string, "fields": { ...clés/valeurs libres... } }`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    const { admin, user } = guard;

    const body = await req.json().catch(() => ({}));
    const client_id: string | undefined = body.client_id;
    const file_id: string | undefined = body.file_id;
    let sourceText: string = body.text ?? "";

    if (!client_id) return json({ error: "client_id requis" }, 400);

    if (!sourceText && file_id) {
      const { data: file } = await admin.from("files").select("*").eq("id", file_id).maybeSingle();
      if (!file) return json({ error: "fichier introuvable" }, 404);
      if (file.storage_path) {
        const { data: blob, error: dlErr } = await admin.storage.from("client-files").download(file.storage_path);
        if (dlErr || !blob) return json({ error: `téléchargement: ${dlErr?.message ?? "vide"}` }, 400);
        sourceText = await blob.text();
      }
    }
    if (!sourceText.trim()) {
      return json({ error: "aucun texte à analyser (fournir 'text' ou un 'file_id' .txt/.md)" }, 400);
    }

    const { text: out, usage } = await callAnthropic({
      model: MODELS.fast,
      system: SYSTEM,
      messages: [{ role: "user", content: sourceText.slice(0, 100_000) }],
    });
    const data = extractJson(out);

    const saved = await insertVersion(admin, "contexts", { client_id }, {
      source_file_id: file_id ?? null,
      data,
      created_by: user.id,
    });

    return json({ ok: true, context: saved, usage });
  } catch (e) {
    console.error("extract-context:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
