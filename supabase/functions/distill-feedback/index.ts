// distill-feedback — transforme la transcription d'un call client en CONSIGNES DURABLES
// pour la production des prochains dashboards, et les ajoute au champ clients.dashboard_guidance.
//
// Body: { client_id: uuid, transcript: string, period?: "YYYY-MM-01" }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, MODELS, type AnthropicMessage } from "../_shared/anthropic.ts";

const SYSTEM = `Tu lis la transcription d'un appel entre un cabinet de conseil et son client, à propos du dashboard financier mensuel du client.
Extrais UNIQUEMENT les CONSIGNES DURABLES qui doivent guider la production des PROCHAINS dashboards :
- ce qu'il faut mettre en avant, ajouter, retirer ou reformuler ;
- les indicateurs prioritaires pour ce client ;
- le ton et le niveau d'analyse attendus ;
- les préférences de présentation.
Ignore le bavardage, les données chiffrées ponctuelles et tout ce qui ne concerne qu'un seul mois.
Réponds par une LISTE DE PUCES courtes, claires et actionnables, en français (commence chaque ligne par "- ").
Si rien de pertinent pour les futurs dashboards, réponds exactement : RAS`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    const { admin } = guard;

    const body = await req.json().catch(() => ({}));
    const client_id: string | undefined = body.client_id;
    const transcript: string = (body.transcript ?? "").toString();
    const period: string | undefined = body.period;
    if (!client_id || !transcript.trim()) return json({ error: "client_id et transcript requis" }, 400);

    const { data: client } = await admin.from("clients").select("dashboard_guidance").eq("id", client_id).maybeSingle();
    if (!client) return json({ error: "client introuvable" }, 404);

    const res = await callAnthropic({
      model: MODELS.fast,
      system: SYSTEM,
      messages: [{ role: "user", content: `Transcription de l'appel :\n\n${transcript.slice(0, 30000)}` } as AnthropicMessage],
      max_tokens: 1200,
    });
    const distilled = res.text.trim();
    if (!distilled || /^RAS\b/i.test(distilled)) {
      return json({ ok: true, added: false, guidance: (client as { dashboard_guidance?: string }).dashboard_guidance ?? "", message: "Aucune consigne durable détectée dans la transcription." });
    }

    const stamp = (period ?? new Date().toISOString().slice(0, 10));
    const prev = ((client as { dashboard_guidance?: string }).dashboard_guidance ?? "").trim();
    const block = `## Call ${stamp}\n${distilled}`;
    const guidance = prev ? `${prev}\n\n${block}` : block;

    const { error: upErr } = await admin.from("clients").update({ dashboard_guidance: guidance }).eq("id", client_id);
    if (upErr) throw upErr;

    return json({ ok: true, added: true, distilled, guidance });
  } catch (e) {
    console.error("distill-feedback:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
