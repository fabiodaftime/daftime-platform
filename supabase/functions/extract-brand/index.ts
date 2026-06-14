// ⑤ extract-brand — déduit la CHARTE GRAPHIQUE d'un client (couleurs/typo/style)
// à partir d'une capture d'écran, d'un PDF ou de l'URL de son site, et la stocke
// dans clients.brand (réutilisée par generate-dashboard / chat-iterate).
//
// Body: { client_id, image_base64?, image_media_type?, pdf_base64?, url? }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, extractJson, MODELS } from "../_shared/anthropic.ts";

const SYSTEM = `Tu es un directeur artistique. À partir de la source fournie (capture d'écran, PDF, ou HTML/CSS d'un site web), déduis la CHARTE GRAPHIQUE de la marque.
Réponds UNIQUEMENT avec un objet JSON valide :
{
  "colors": { "primary": "#RRGGBB", "secondary": "#RRGGBB", "accent": "#RRGGBB", "background": "#RRGGBB", "text": "#RRGGBB" },
  "fonts": { "heading": "Nom de police", "body": "Nom de police" },
  "style": ["mots-clés (ex: minimal, corporate, luxe, tech)"],
  "notes": "courte description du ressenti visuel"
}
Utilise de vraies couleurs hexadécimales. Si une info est incertaine, propose une valeur cohérente plutôt que de laisser vide.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    const { admin } = guard;

    const body = await req.json().catch(() => ({}));
    const { client_id, image_base64, image_media_type, pdf_base64, url } = body;
    if (!client_id) return json({ error: "client_id requis" }, 400);

    const content: unknown[] = [];
    if (image_base64) {
      content.push({ type: "image", source: { type: "base64", media_type: image_media_type ?? "image/png", data: image_base64 } });
      content.push({ type: "text", text: "Déduis la charte graphique de cette capture d'écran." });
    } else if (pdf_base64) {
      content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf_base64 } });
      content.push({ type: "text", text: "Déduis la charte graphique de ce document." });
    } else if (url) {
      let html = "";
      try {
        const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 DaftimeBot" } });
        html = (await r.text()).slice(0, 60_000);
      } catch (_e) { /* ignore */ }
      if (!html) return json({ error: "impossible de récupérer l'URL fournie" }, 400);
      content.push({ type: "text", text: `Déduis la charte graphique (best-effort) à partir du HTML/CSS du site ${url} :\n\n${html}` });
    } else {
      return json({ error: "fournir image_base64, pdf_base64 ou url" }, 400);
    }

    const { text: out, usage } = await callAnthropic({
      model: MODELS.quality,
      system: SYSTEM,
      messages: [{ role: "user", content }],
      max_tokens: 2000,
    });
    const brand = extractJson(out);

    const { data: saved, error } = await admin
      .from("clients").update({ brand }).eq("id", client_id).select("id, brand").single();
    if (error) return json({ error: error.message }, 500);

    return json({ ok: true, brand: saved.brand, usage });
  } catch (e) {
    console.error("extract-brand:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
