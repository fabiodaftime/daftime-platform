// ⑦ bank-rules — revue des CONTREPARTIES bancaires d'un dossier (panneau « Contreparties »).
// Valide / corrige / écarte les propositions de l'IA et gère les règles (contrepartie → catégorie),
// valables pour tous les mois. Nouvelle version du contexte à chaque modification (historique conservé).
// « share » : pousse une règle dans le dictionnaire GLOBAL (acteur dont la nature est la même partout).
//
// Body: { client_id, ops: [{ op: "accept"|"set"|"reject"|"delete"|"share", match, category?, label? }] }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { insertVersion } from "../_shared/versioning.ts";
import { applyRuleOps, CP_CATEGORIES, normMatch, type RuleOp, type RuleState } from "../_shared/counterparties.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    const { admin, user } = guard;

    const body = await req.json().catch(() => ({}));
    const client_id: string | undefined = body.client_id;
    const ops: (RuleOp | { op: "share"; match: string; category: string; label?: string })[] = Array.isArray(body.ops) ? body.ops.slice(0, 100) : [];
    if (!client_id || !ops.length) return json({ error: "client_id et ops requis" }, 400);

    const { data: ctx } = await admin.from("contexts").select("data").eq("client_id", client_id).eq("is_current", true).maybeSingle();
    const data = { ...((ctx?.data as Record<string, unknown>) ?? {}) } as Record<string, unknown> & RuleState;

    const local = ops.filter((o): o is RuleOp => o.op !== "share");
    const shared = ops.filter((o) => o.op === "share" && normMatch(o.match ?? "").length >= 3 && (CP_CATEGORIES as readonly string[]).includes(String(o.category)));
    if (local.length) {
      const next = applyRuleOps(data, local);
      await insertVersion(admin, "contexts", { client_id }, { data: { ...data, ...next }, created_by: user.id });
    }
    for (const s of shared) {
      const match = normMatch(s.match);
      await admin.from("std_counterparties").upsert({ match, category: s.category, label: s.label ?? null, source: "staff", confidence: 1, updated_at: new Date().toISOString() }, { onConflict: "match" });
    }
    return json({ ok: true, applied: local.length, shared: shared.length, rerun: local.some((o) => o.op !== "reject") || shared.length > 0 });
  } catch (e) {
    console.error("bank-rules:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
