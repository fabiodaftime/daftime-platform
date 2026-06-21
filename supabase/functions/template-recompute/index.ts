// template-recompute — recalcule les dérivés + rejoue les vérifications d'un template
// à partir d'inputs édités à la main (aucun fichier, aucune IA : pur calcul, instantané).
//
// Body: { activity: "ecommerce", inputs: { ca: 12000, ... }, currency: "EUR" }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { getTemplate, buildStandardized } from "../_shared/templates.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);

    const body = await req.json().catch(() => ({}));
    const tpl = getTemplate(body.activity);
    if (!tpl) return json({ error: "template inconnu pour cette activité" }, 400);

    const inputs: Record<string, number> = {};
    for (const [k, v] of Object.entries(body.inputs ?? {})) {
      const n = typeof v === "number" ? v : Number(v);
      if (isFinite(n)) inputs[k] = n;
    }
    const built = buildStandardized(tpl, inputs, {}, body.currency ?? "EUR");
    return json({ ok: true, data: built.data });
  } catch (e) {
    console.error("template-recompute:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
