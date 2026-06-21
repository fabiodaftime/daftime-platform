// client-chat — assistant "questions à vos chiffres" de l'espace client.
// Réponses FACTUELLES uniquement (pas d'interprétation, pas de conseil), basées sur
// les chiffres des dashboards publiés du client. Le RLS du client est appliqué : on
// interroge avec le token de l'appelant, il ne peut donc voir que SES données.
//
// Body: { client_id: uuid, question: string, history?: {role, content}[] }

import { corsHeaders, json } from "../_shared/cors.ts";
import { userClient } from "../_shared/supabaseClients.ts";
import { callAnthropic, MODELS, type AnthropicMessage } from "../_shared/anthropic.ts";

const SYSTEM = `Tu es l'assistant chiffres de l'espace client Daftime Advisory.
Tu réponds à des questions FACTUELLES sur les chiffres fournis (un poste de charge, un indicateur, une valeur, une évolution).

RÈGLES STRICTES :
- Réponds UNIQUEMENT à partir des CHIFFRES fournis ci-dessous. N'invente jamais une valeur.
- Si l'information demandée ne figure pas dans les chiffres, réponds exactement : "Je ne dispose pas de cette information dans vos chiffres. N'hésitez pas à poser la question à votre conseiller Daftime."
- Tu ne donnes AUCUN conseil, interprétation, recommandation, prévision ni opinion. Pas d'analyse stratégique.
- Tu te limites à restituer ou recalculer des chiffres simples à partir des données (lecture d'une valeur, somme, différence, variation en %).
- Réponds en français, de façon concise (1 à 3 phrases), en citant les montants avec leur devise et le mois concerné.`;

// Met en forme les data_json (sections -> lignes) en texte compact pour le contexte.
function figuresToText(periods: { period: string; data: any }[], currency: string): string {
  return periods
    .map(({ period, data }) => {
      const lines: string[] = [];
      for (const sec of data?.sections ?? []) {
        if (sec?.label) lines.push(`  [${sec.label}]`);
        for (const row of sec?.rows ?? []) {
          if (row?.label == null) continue;
          const val = typeof row.value === "number"
            ? `${row.value.toLocaleString("fr-FR")} ${row.unit ?? currency}`
            : (row.value ?? "");
          lines.push(`    - ${row.label}: ${val}`);
        }
      }
      return `MOIS ${period}:\n${lines.join("\n") || "  (aucune donnée)"}`;
    })
    .join("\n\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const supa = userClient(authHeader);
    const { data: userData, error: authErr } = await supa.auth.getUser();
    if (authErr || !userData?.user) return json({ error: "Not authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const client_id: string | undefined = body.client_id;
    const question: string | undefined = (body.question ?? "").toString().trim();
    const history: AnthropicMessage[] = Array.isArray(body.history) ? body.history.slice(-6) : [];
    if (!client_id || !question) return json({ error: "client_id et question requis" }, 400);

    // RLS appliqué : l'appelant ne lit que SES données. Devise du client.
    const { data: client } = await supa.from("clients").select("id, name, currency").eq("id", client_id).maybeSingle();
    if (!client) return json({ error: "Accès refusé" }, 403);

    const { data: dashes } = await supa
      .from("dashboards")
      .select("period, data_json")
      .eq("client_id", client_id)
      .eq("status", "publie")
      .eq("is_current", true)
      .order("period", { ascending: false })
      .limit(6);

    const periods = (dashes ?? []).map((d: any) => ({ period: d.period, data: d.data_json }));
    if (periods.length === 0) {
      return json({ answer: "Aucun rapport publié n'est encore disponible pour répondre à votre question." });
    }

    const currency = client.currency ?? "EUR";
    const context = figuresToText(periods, currency);

    const messages: AnthropicMessage[] = [
      ...history,
      { role: "user", content: `CHIFFRES DISPONIBLES (devise ${currency}) :\n\n${context}\n\nQUESTION :\n${question}` },
    ];

    const { text } = await callAnthropic({
      model: MODELS.fast,
      system: SYSTEM,
      messages,
      max_tokens: 700,
    });

    return json({ answer: text.trim() });
  } catch (e) {
    console.error("client-chat:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
