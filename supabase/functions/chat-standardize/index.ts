// ⑥ chat-standardize — applique des RÉPONSES / CORRECTIONS en langage naturel aux données d'un mois.
// Ex. « PayPal = pub Meta, Hanayaka = achats de stock », « solde du compte Error Company au 31/08 :
// 12 400 € », « le CA d'août = 334 526 », « pour le CA prends la colonne Net sales ».
//
// Avant : le modèle RÉÉCRIVAIT tout le jeu de données en JSON libre (fragile : une réponse en prose
// → « Aucun objet JSON », structure abîmée, dérivés faux). Désormais il ne renvoie qu'un PATCH
// structuré (outil) que le code applique et MÉMORISE :
//   - règles bancaires (contrepartie → catégorie) : valent pour TOUS les mois ;
//   - soldes bancaires de référence (onboarding) : reconstituent la trésorerie de tous les mois ;
//   - corrections de valeurs du mois (avec provenance).
// La standardisation est ensuite relancée (déterministe) par le front → dérivés toujours justes.
//
// Body: { client_id, period, message, history?: {role, content}[] }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropicTool, MODELS, type AnthropicMessage } from "../_shared/anthropic.ts";
import { insertVersion } from "../_shared/versioning.ts";
import { readClientFiles, filesToContentBlocks } from "../_shared/readFiles.ts";
import { getCatalog, inputLines } from "../_shared/templates.ts";

const CATEGORIES = ["ads", "stock", "internal", "payroll", "tools", "logistics", "tax", "vat", "bankfees", "other", "ignore"] as const;

const SYSTEM = `Tu traduis les réponses / corrections d'un conseiller financier en MODIFICATIONS STRUCTURÉES des données d'un client e-commerce, via l'outil. Tu ne réécris jamais les données toi-même : le moteur recalcule tout.

Trois types de modifications :
1) bank_rules — qualification d'une contrepartie bancaire (valable pour tous les mois). « match » = un fragment DISTINCTIF du libellé bancaire tel qu'il apparaît dans la liste (ex. « paypal », « hanayaka », « bp rives de paris », « zaoui »), en minuscules. Catégories :
   ads (publicité), stock (achats de marchandises / fournisseurs de stock / emballages), internal (virement entre ses propres comptes, apport, remboursement d'emprunt, transfert vers une autre société du dirigeant), payroll (salaires, rémunération du dirigeant, freelances récurrents), tools (logiciels/abonnements), logistics (transport, 3PL), tax (impôts), vat (TVA), bankfees (frais bancaires), other (autre charge d'exploitation), ignore (à exclure).
2) bank_anchors — solde bancaire CONNU d'un compte à une date (le nom du compte tel qu'il apparaît dans les données, date ISO YYYY-MM-DD, solde en devise).
3) overrides — valeur d'un poste du MOIS donnée EXPLICITEMENT par le conseiller, ou recalculée par toi depuis un fichier fourni si on te le demande (avec la provenance précise). N'invente jamais un chiffre.

Si une réponse est ambiguë, ne crée rien pour elle et explique-le dans « summary ». « summary » = une phrase en français, tutoiement, qui dit ce qui a été compris et appliqué.`;

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
      .from("clients").select("id, cost_params, activity_types:activity_type_id(slug, config)").eq("id", client_id).maybeSingle();
    if (!client) return json({ error: "client introuvable" }, 404);
    const tpl = getCatalog((client as { activity_types?: { config?: unknown } }).activity_types?.config);
    const inputIds = tpl ? inputLines(tpl).map((l) => l.id) : [];

    const { data: ctx } = await admin.from("contexts").select("data").eq("client_id", client_id).eq("is_current", true).maybeSingle();
    const { data: sd } = await admin.from("standardized_data").select("data, missing_items").eq("client_id", client_id).eq("period", period).eq("is_current", true).maybeSingle();
    const { data: files } = await admin.from("files").select("id, original_name, storage_path, updated_at").eq("client_id", client_id).eq("period", period);

    // Données actuelles, compactes (id, libellé, valeur, provenance) — pas de ré-écriture demandée.
    const rows: string[] = [];
    for (const s of ((sd?.data as { sections?: { rows?: Record<string, unknown>[] }[] })?.sections ?? []))
      for (const r of s.rows ?? []) rows.push(`${r.id} | ${r.label} | ${r.value ?? "—"}${r.derived ? " (calculé)" : ""}${r.source ? ` | ${String(r.source).slice(0, 120)}` : ""}`);
    const meta = (sd?.data as { meta?: { bank_accounts?: string[] } })?.meta;
    const flags = ((sd?.data as { flags?: { severity: string; label: string }[] })?.flags ?? []).filter((f) => f.severity !== "info").map((f) => `- ${f.label}`);

    // Fichiers : contenu joint uniquement pour ceux que le message cite (re-extraction à la demande).
    const msgL = message.toLowerCase();
    const cited = (files ?? []).filter((f: { original_name?: string | null }) => {
      const n = String(f.original_name ?? "").toLowerCase().replace(/\.[a-z0-9]+$/, "");
      return n && (msgL.includes(n) || n.split(/[\s_-]+/).filter((w) => w.length > 5).some((w) => msgL.includes(w)));
    }).slice(0, 3);
    const docs = cited.length ? await readClientFiles(admin, cited) : [];

    const TOOL = {
      name: "apply_changes",
      description: "Modifications structurées à appliquer (règles bancaires, soldes de référence, corrections de valeurs du mois).",
      input_schema: {
        type: "object",
        properties: {
          bank_rules: { type: "array", items: { type: "object", properties: {
            match: { type: "string", description: "fragment distinctif du libellé bancaire, en minuscules" },
            category: { type: "string", enum: [...CATEGORIES] },
            label: { type: "string", description: "ce que c'est, en clair (ex. « pub Meta via PayPal »)" },
          }, required: ["match", "category"], additionalProperties: false } },
          bank_anchors: { type: "array", items: { type: "object", properties: {
            account: { type: "string" }, date: { type: "string", description: "YYYY-MM-DD" }, balance: { type: "number" },
          }, required: ["account", "date", "balance"], additionalProperties: false } },
          overrides: { type: "array", items: { type: "object", properties: {
            id: { type: "string", enum: inputIds.length ? inputIds : ["_none"] }, value: { type: "number" },
            source: { type: "string", description: "d'où vient la valeur (réponse du conseiller, fichier + colonne…)" },
          }, required: ["id", "value", "source"], additionalProperties: false } },
          summary: { type: "string" },
        },
        required: ["summary"],
        additionalProperties: false,
      },
    };
    const content: unknown[] = [
      { type: "text", text:
        `MOIS : ${period.slice(0, 7)}\n\nDONNÉES ACTUELLES (id | libellé | valeur | provenance) :\n${rows.join("\n") || "(aucune)"}\n\n` +
        `COMPTES BANCAIRES DÉTECTÉS : ${(meta?.bank_accounts ?? []).join(" ; ") || "(inconnus)"}\n\n` +
        `ALERTES / QUESTIONS EN COURS :\n${[...flags, ...((sd?.missing_items as string[] | null) ?? []).map((m) => `- ${m}`)].join("\n") || "(aucune)"}\n\n` +
        `RÈGLES BANCAIRES DÉJÀ CONNUES : ${JSON.stringify((ctx?.data as { bank_rules?: unknown })?.bank_rules ?? [])}` },
      ...filesToContentBlocks(docs),
      { type: "text", text: `RÉPONSES / INSTRUCTION DU CONSEILLER :\n${message}` },
    ];
    const { input, usage } = await callAnthropicTool<{
      bank_rules?: { match: string; category: string; label?: string }[];
      bank_anchors?: { account: string; date: string; balance: number }[];
      overrides?: { id: string; value: number; source: string }[];
      summary?: string;
    }>({ model: MODELS.quality, system: SYSTEM, messages: [...history, { role: "user", content } as AnthropicMessage], tool: TOOL, max_tokens: 2000, signal: AbortSignal.timeout(120_000) });
    if (!input) return json({ error: "Réponse du modèle inexploitable — reformule ta réponse." }, 502);

    // 1) Règles bancaires + corrections du mois → nouvelle version du CONTEXTE (tous les mois en profitent).
    const ctxData = { ...((ctx?.data as Record<string, unknown>) ?? {}) } as Record<string, unknown> & {
      bank_rules?: { match: string; category: string; label?: string }[];
      value_overrides?: Record<string, Record<string, { value: number; source: string }>>;
    };
    const rules = (input.bank_rules ?? []).filter((r) => r.match?.trim() && (CATEGORIES as readonly string[]).includes(r.category))
      .map((r) => ({ match: r.match.trim().toLowerCase(), category: r.category, ...(r.label ? { label: r.label } : {}) }));
    const overrides = (input.overrides ?? []).filter((o) => inputIds.includes(o.id) && typeof o.value === "number" && isFinite(o.value));
    if (rules.length || overrides.length) {
      const byMatch = new Map((ctxData.bank_rules ?? []).map((r) => [r.match.toLowerCase(), r]));
      for (const r of rules) byMatch.set(r.match, r);
      ctxData.bank_rules = [...byMatch.values()];
      if (overrides.length) {
        const vo = { ...(ctxData.value_overrides ?? {}) };
        vo[period] = { ...(vo[period] ?? {}), ...Object.fromEntries(overrides.map((o) => [o.id, { value: o.value, source: o.source }])) };
        ctxData.value_overrides = vo;
      }
      await insertVersion(admin, "contexts", { client_id }, { data: ctxData, created_by: user.id });
    }
    // 2) Soldes de référence → onboarding (Paramètres shop), fusionnés par compte + date.
    const anchors = (input.bank_anchors ?? []).filter((a) => a.account?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(a.date) && isFinite(a.balance));
    if (anchors.length) {
      const cp = { ...(((client as { cost_params?: Record<string, unknown> }).cost_params) ?? {}) } as { bank_anchors?: { account: string; date: string; balance: number }[] };
      const key = (a: { account: string; date: string }) => `${a.account.trim()}|${a.date}`;
      const m = new Map((cp.bank_anchors ?? []).map((a) => [key(a), a]));
      for (const a of anchors) m.set(key(a), { account: a.account.trim(), date: a.date, balance: a.balance });
      cp.bank_anchors = [...m.values()];
      await admin.from("clients").update({ cost_params: cp }).eq("id", client_id);
    }

    return json({ ok: true, rerun: !!(rules.length || overrides.length || anchors.length), summary: input.summary ?? "",
      applied: { rules: rules.length, anchors: anchors.length, overrides: overrides.length }, usage });
  } catch (e) {
    console.error("chat-standardize:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
