// ② standardize-data — agrège fichiers du mois + contexte courant + type d'activité,
// et produit des DONNÉES STANDARDISÉES (source de vérité) pour un client/mois.
// Signale explicitement les pièces manquantes au lieu d'inventer.
//
// Body: { client_id: uuid, period: "YYYY-MM-01" }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, callAnthropicTool, extractJson, MODELS, type AnthropicMessage } from "../_shared/anthropic.ts";
import { insertVersion } from "../_shared/versioning.ts";
import { readClientFiles, filesToContentBlocks } from "../_shared/readFiles.ts";
import { getCatalog, inputLines, buildStandardized, type CatalogLine } from "../_shared/templates.ts";
import { reconcile, type FileExtract } from "../_shared/reconcile.ts";
import { ratesToReporting } from "../_shared/fx.ts";
import { parseFile, type ParsedExtract } from "../_shared/parsers.ts";

// Unités NON monétaires (comptes, ratios, durées) : ne pas convertir.
const NON_MONEY_UNITS = new Set(["%", "x", "u", "nb", "ratio", "pts", "j", "jours", "mois", "q", "score"]);
const isMonetary = (unit?: string) => !unit || !NON_MONEY_UNITS.has(unit.trim());

// Repères métier par type d'activité (KPIs et charges typiques). Surchargé par activity_types.config si fourni.
const ACTIVITY_GUIDE: Record<string, string> = {
  ecommerce: "KPIs : chiffre d'affaires, marge brute, coût d'acquisition (CAC/MER/ROAS), panier moyen, taux de marge. Charges typiques : achats/COGS, publicité, frais de plateforme (Shopify/Stripe), logistique.",
  coach: "KPIs : chiffre d'affaires, nombre de clients/sessions, taux de remplissage, panier moyen. Charges typiques : outils, marketing, sous-traitance.",
  restaurant: "KPIs : chiffre d'affaires, food cost %, masse salariale %, ticket moyen. Charges typiques : achats matières, personnel, loyer, énergie.",
  holding: "Structure : remontées par filiale, dividendes reçus, frais de holding, consolidation simple. KPIs : résultat consolidé, trésorerie par entité.",
  services: "KPIs : chiffre d'affaires, taux journalier moyen, taux d'occupation/staffing, créances clients. Charges typiques : masse salariale, sous-traitance, frais généraux.",
};

const SYSTEM = (activity: string, guide: string) => `Tu es un analyste financier qui standardise les données mensuelles d'un client.
Type d'activité du client : "${activity}".
À partir du CONTEXTE et des FICHIERS fournis (qui peuvent inclure des PDF et des images : relevés, factures, exports comptables), produis un jeu de données standardisé, cohérent et exploitable.

RÈGLES ABSOLUES :
- N'invente JAMAIS un chiffre. Si une donnée nécessaire est absente ou ambiguë, NE la devine pas.
- Toute information manquante doit être listée dans "missing_items" (libellé clair de ce qu'il faut demander au client).
- Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour.

STRUCTURE CIBLE (à adapter aux données réelles, ne rien inventer) :
- Section "pnl" (Compte de résultat) avec, dans l'ordre : Chiffre d'affaires, Coût des ventes (COGS), Marge brute, les postes de Charges d'exploitation détaillés, EBITDA, Résultat d'exploitation, Résultat net.
  Marque CHAQUE ligne de total/sous-total avec "type":"total" (ex. Marge brute, EBITDA, Résultat d'exploitation, Résultat net).
- Section "tresorerie" si l'information est disponible : solde de trésorerie de fin de mois, variation sur le mois.
${guide ? `- Spécificités du métier : ${guide}` : ""}

Format attendu (STRICT, structure tabulaire) :
{
  "data": {
    "sections": [
      { "key": "pnl", "label": "Compte de résultat",
        "rows": [
          { "label": "Chiffre d'affaires", "value": 12000, "unit": "EUR" },
          { "label": "Marge brute", "value": 8000, "unit": "EUR", "type": "total" }
        ] }
    ]
  },
  "missing_items": [ "ce qu'il faut demander au client" ]
}`;

// Chemin MULTI-SOURCES : on classe + extrait UN fichier à la fois, puis on réconcilie.
const PERFILE_SYSTEM = (activity: string, lines: CatalogLine[], ctxText: string) => `Tu analyses UN SEUL fichier d'un client "${activity}". Tu fais partie d'une chaîne qui agrège plusieurs fichiers ensuite : extrais SEULEMENT ce que CE fichier contient, sans déduire le reste.

${ctxText ? `CONTEXTE DU DOSSIER (rôle des sources, montage financier — à respecter) :\n${ctxText}\n` : ""}
1) IDENTIFIE le type de source (source_type) parmi : "sales_export" (export de ventes Shopify/Stripe/Amazon/Whop), "ads_dashboard" (dashboard publicitaire Meta/Google/TikTok), "bank_statement" (relevé bancaire), "invoice" (facture / export de factures), "payroll" (journal de paie), "pnl" (compte de résultat / bilan / cash flow comptable), "other".
2) DEVISE : indique "currency" = la devise PRINCIPALE des montants de ce fichier (code ISO : EUR, AED, USD, GBP…). Donne les montants DANS CETTE DEVISE, bruts, SANS conversion (la conversion est faite ensuite par le système). Si le fichier mélange plusieurs devises ligne à ligne, additionne par devise et renvoie la devise dominante dans "currency" (la conversion fine sera gérée en aval — signale-le dans "note").
3) EXTRAIS uniquement les postes ci-dessous que CE fichier fournit réellement, pour LE MOIS (valeur numérique brute, sans symbole ni séparateur de milliers). N'invente rien ; omets ce qui n'est pas dans ce fichier.
   - RELEVÉ BANCAIRE : catégorise les transactions et additionne par poste (ventes encaissées, pub, salaires, frais de paiement, abonnements/outils, frais bancaires…). Ignore les frais de change internes "Foreign exchange transaction fee" comme poste de CA. Le solde de fin = dernier "Balance".
   - EXPORT DE PAIEMENTS (Stripe/Whop) : ne compte QUE les paiements réussis (Paid/Captured=true/succeeded). EXCLUS les "Failed", "open", "pending", "past_due" et les remboursements.
   - ⚠️ ANTI-DOUBLE-COMPTAGE : n'attribue PAS au CA des montants qui sont de simples mouvements internes (virements entre comptes, "payouts" Stripe vers la banque, règlements d'un processeur qui réapparaissent sur le relevé bancaire). Si tu identifies un tel mouvement, mets-le dans "note" plutôt que dans "values".
4) Pour chaque valeur, indique brièvement OÙ tu l'as trouvée (page / ligne / feuille) dans "sources".

POSTES POSSIBLES :
${lines.map((l) => `- ${l.id} : ${l.label}${l.hint ? ` (${l.hint})` : ""}`).join("\n")}

Réponds UNIQUEMENT en JSON :
{ "source_type": "sales_export", "currency": "EUR", "values": { "ca": 12000 }, "sources": { "ca": "lignes Paid, colonne Amount" }, "note": "payouts ignorés (mouvement interne)" }`;

// Exécute fn sur le tableau avec un parallélisme borné (évite les limites de débit Anthropic).
async function mapLimit<T, R>(arr: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, arr.length || 1) }, async () => {
    while (i < arr.length) { const idx = i++; out[idx] = await fn(arr[idx]); }
  });
  await Promise.all(workers);
  return out;
}

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
      .select("id, name, currency, activity_type_id, activity_types:activity_type_id(slug, name, config)")
      .eq("id", client_id)
      .maybeSingle();
    if (!client) return json({ error: "client introuvable" }, 404);

    const { data: ctx } = await admin
      .from("contexts").select("data").eq("client_id", client_id).eq("is_current", true).maybeSingle();

    const { data: files } = await admin
      .from("files").select("*").eq("client_id", client_id).eq("period", period);

    const docs = await readClientFiles(admin, files ?? []);

    const at = (client as { activity_types?: { slug?: string; config?: Record<string, unknown> } }).activity_types;
    const activity = at?.slug ?? "inconnu";
    const currency = (client as { currency?: string }).currency ?? "EUR";
    const tpl = getCatalog(at?.config);

    const ctxBlock = { type: "text", text: `CONTEXTE CLIENT:\n${JSON.stringify(ctx?.data ?? {}, null, 2)}\n\nFICHIERS DU MOIS (${docs.length}) :` };
    const fileBlocks = docs.length ? filesToContentBlocks(docs) : [{ type: "text", text: "(aucun fichier déposé pour ce mois)" }];

    let dataToSave: unknown;
    let missing: unknown[];
    let usage: unknown;

    if (tpl) {
      // PIPELINE : 1) parsers DÉTERMINISTES (CSV/exports) → 2) IA seulement sur les PDF/inconnus
      //            et uniquement pour les postes encore manquants → 3) réconciliation → calcul.
      const lines = inputLines(tpl);
      const monetaryIds = new Set(lines.filter((l) => isMonetary(l.unit)).map((l) => l.id));
      const labelOf = (id: string) => tpl.lines.find((l) => l.id === id)?.label ?? id;

      const fxOverrides = (ctx?.data as { fx_rates?: Record<string, number> } | null)?.fx_rates;
      const { factor, source: fxSource } = await ratesToReporting(period, currency, fxOverrides);
      // Règles de catégorisation bancaire propres au dossier (ex. "paypal" -> "cogs").
      const ctxData = (ctx?.data ?? {}) as { bank_rules?: { match: string; category: string }[]; playbook?: { bank_rules?: { match: string; category: string }[] } };
      const categoryRules = ctxData.bank_rules ?? ctxData.playbook?.bank_rules;
      const pctx = { reporting: currency, factor, period, activity, categoryRules };

      // Triage manuel : rôle imposé + commentaire par fichier (prime sur la détection auto).
      const manualByName = new Map<string, { role?: string; note?: string }>();
      for (const f of (files ?? []) as { original_name?: string; doc_role?: string; doc_note?: string }[])
        if (f.original_name) manualByName.set(f.original_name, { role: f.doc_role ?? undefined, note: f.doc_note ?? undefined });
      // Normalise les catégories métier (Shopify, PSP, ads, comptable…) vers un rôle comptable canonique.
      const CANON: Record<string, string> = {
        shopify: "revenue", site: "revenue", invoicing: "revenue", quaderno: "revenue", revenue: "revenue",
        psp: "payment", payment: "payment",
        bank: "bank", banque: "bank",
        ads: "ads", publicite: "ads",
        accounting: "pnl", comptable: "pnl", pnl: "pnl",
        expense: "expense", internal: "internal", ignore: "ignore",
      };
      const effRoleOf = (e: ParsedExtract) => {
        const raw = (manualByName.get(e.file)?.role || e.role) as string;
        return CANON[raw] ?? raw;
      };

      // 1) PARSERS déterministes sur les fichiers texte/CSV reconnus (hors fichiers mis en "ignore").
      const usable = docs.filter((d) => d.kind !== "skipped" && manualByName.get(d.name)?.role !== "ignore");
      const parsed: ParsedExtract[] = [];
      const llmDocs: typeof usable = [];
      for (const doc of usable) {
        const p = doc.kind === "text" ? parseFile(doc.name, (doc as { content: string }).content, pctx) : null;
        if (p) parsed.push(p); else llmDocs.push(doc);
      }
      // Dédup par groupe (Stripe multi-mois, Ebury -EUR vs all_currencies…) : on garde le plus complet.
      const best = new Map<string, ParsedExtract>();
      for (const e of parsed) if (e.dedupGroup) { const c = best.get(e.dedupGroup); if (!c || (e.count ?? 0) > (c.count ?? 0)) best.set(e.dedupGroup, e); }
      const keptParsed = parsed.filter((e) => !e.dedupGroup || best.get(e.dedupGroup) === e);

      // Somme des contributions parsées (déjà en devise de reporting). On garde le DÉTAIL par document (trace).
      const parsedValues: Record<string, number> = {};
      const parsedSources: Record<string, string> = {};
      const traces: Record<string, { src: string; value: number }[]> = {};
      const traceSrc = (e: ParsedExtract, k: string) => (e.sources[k] ? `${e.file} — ${e.sources[k]}` : `${e.file} (${e.parser})`);
      for (const e of keptParsed) for (const [k, val] of Object.entries(e.values)) {
        parsedValues[k] = Math.round(((parsedValues[k] ?? 0) + val) * 100) / 100;
        if (!parsedSources[k]) parsedSources[k] = e.sources[k] ?? e.parser;
        if (!traces[k]) traces[k] = [];
        traces[k].push({ src: traceSrc(e, k), value: Math.round(val * 100) / 100 });
      }
      // CA = somme des revenueCandidate des documents dont le RÔLE EFFECTIF est "revenue" (ex. Quaderno).
      const revenueDocs = keptParsed.filter((e) => effRoleOf(e) === "revenue" && typeof e.revenueCandidate === "number");
      if (revenueDocs.length) {
        parsedValues["ca"] = Math.round(revenueDocs.reduce((s, e) => s + (e.revenueCandidate ?? 0), 0) * 100) / 100;
        parsedSources["ca"] = revenueDocs.map((e) => e.sources.ca ?? e.parser).join(" + ");
        traces["ca"] = revenueDocs.map((e) => ({ src: e.sources.ca ? `${e.file} — ${e.sources.ca}` : `${e.file} (${e.parser})`, value: Math.round((e.revenueCandidate ?? 0) * 100) / 100 }));
      }

      // 2) GAP-FILL IA (contrat STRICT via tool use) : sur les fichiers NON reconnus (PDF/scan/inconnu),
      //    et SEULEMENT pour les postes encore absents. Chaque champ = valeur+provenance OU null+raison.
      const missingLines = lines.filter((l) => parsedValues[l.id] == null);
      const missingIds = missingLines.map((l) => l.id);
      const playbookText = ctx?.data ? JSON.stringify((ctx.data as { playbook?: unknown }).playbook ?? ctx.data).slice(0, 4000) : "";
      const fileNotes = [...manualByName.entries()].filter(([, m]) => m.note).map(([n, m]) => `${n} : ${m.note}`).join(" | ");
      const ctxText = [playbookText, fileNotes ? `NOTES PAR FICHIER (contexte imposé) : ${fileNotes}` : ""].filter(Boolean).join("\n");
      const EXTRACT_TOOL = {
        name: "emit_extraction",
        description: "Renvoie les postes que CE fichier permet de renseigner. N'invente jamais : si un poste est introuvable, ne l'inclus pas (ou value=null avec la raison).",
        input_schema: {
          type: "object",
          properties: {
            source_type: { type: "string", enum: ["sales_export", "ads_dashboard", "bank_statement", "invoice", "payroll", "pnl", "other"] },
            currency: { type: "string", description: "Code ISO de la devise principale des montants (EUR, AED, USD, GBP…)" },
            fields: {
              type: "array",
              description: "Un élément par poste réellement présent dans ce fichier.",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", enum: missingIds },
                  value: { type: ["number", "null"], description: "Montant brut DANS la devise du fichier (sans conversion), ou null si absent." },
                  provenance: { type: "string", description: "Où trouvé (page/ligne/feuille) si value≠null ; sinon raison de l'absence." },
                },
                required: ["id", "value", "provenance"],
                additionalProperties: false,
              },
            },
          },
          required: ["currency", "fields"],
          additionalProperties: false,
        },
      };
      type ToolOut = { source_type?: string; currency?: string; fields?: { id: string; value: number | null; provenance: string }[] };
      const llmExtracts = (llmDocs.length && missingIds.length)
        ? (await mapLimit(llmDocs, 3, async (doc) => {
            const content: unknown[] = [...filesToContentBlocks([doc]), { type: "text", text: "Classe ce fichier et renseigne UNIQUEMENT les postes présents, via l'outil." }];
            try {
              const { input } = await callAnthropicTool<ToolOut>({ model: MODELS.fast, system: PERFILE_SYSTEM(activity, missingLines, ctxText),
                messages: [{ role: "user", content } as AnthropicMessage], tool: EXTRACT_TOOL, max_tokens: 1500 });
              if (!input) return null;
              const values: Record<string, number> = {}; const sources: Record<string, string> = {};
              for (const f of input.fields ?? []) {
                // Contrat : valeur retenue seulement si numérique ET provenance fournie.
                if (typeof f.value === "number" && isFinite(f.value) && f.provenance && f.provenance.trim()) {
                  values[f.id] = f.value; sources[f.id] = `${doc.name} — ${f.provenance}`;
                }
              }
              return { file: doc.name, type: (input.source_type ?? "other") as FileExtract["type"], currency: input.currency, values, sources } as FileExtract;
            } catch { return null; }
          })).filter((x): x is FileExtract => !!x)
        : [];
      // Trace des contributions IA (pour les postes non couverts par un parser, qui prime).
      for (const ex of llmExtracts) for (const [k, val] of Object.entries(ex.values)) {
        if (parsedValues[k] != null) continue;
        if (!traces[k]) traces[k] = [];
        traces[k].push({ src: ex.sources[k] ?? `${ex.file} (IA)`, value: val });
      }
      const recLLM = reconcile(llmExtracts, labelOf, { factor, monetaryIds, reporting: currency });

      // 3) FUSION : les parsers (exacts) priment ; l'IA complète les trous.
      const values = { ...recLLM.values, ...parsedValues };
      const sources = { ...recLLM.sources, ...parsedSources };
      const confidence: Record<string, string> = { ...recLLM.confidence };
      for (const k of Object.keys(parsedValues)) confidence[k] = "parsed";

      const built = buildStandardized(tpl, values, sources, currency, traces);
      const data = built.data as { sections: { rows: Record<string, unknown>[] }[]; flags: unknown[]; meta?: Record<string, unknown> };
      for (const sec of data.sections) for (const row of sec.rows) { const c = confidence[row.id as string]; if (c) row.confidence = c; }

      const detected = [...new Set([...keptParsed.map((e) => e.currency), ...llmExtracts.map((e) => (e.currency ?? "").toUpperCase())].filter(Boolean))];
      const flags: unknown[] = [...(data.flags ?? [])];
      flags.push({ id: "_fx", severity: "info", label: `Devises converties vers ${currency} (taux ${fxSource}).` });
      // Classification des documents par rôle EFFECTIF (auto + override manuel) — pas de devinette.
      const byRole = (role: string) => keptParsed.filter((e) => effRoleOf(e) === role).map((e) => e.parser).join(", ") || "—";
      flags.push({ id: "_classif", severity: "info", label: `Documents classés — CA (facturé) : ${byRole("revenue")} · Réception : ${byRole("payment")} · Banque : ${byRole("bank")}.` });
      if (!revenueDocs.length)
        flags.push({ id: "_no_revenue", severity: "warn", label: "Aucune source de CA (rôle « revenue », ex. Quaderno) — CA potentiellement incomplet. Classe un document en « CA » si besoin." });
      if (revenueDocs.length > 1)
        flags.push({ id: "_multi_revenue", severity: "warn", label: `${revenueDocs.length} sources de CA cumulées (${revenueDocs.map((e) => e.parser).join(", ")}) — risque de double comptage. Mets en « réception » celles qui ne sont pas le CA facturé.` });
      // Remonte les notes des parsers (CA par méthode, montants de réception Stripe/Whop…).
      for (const e of keptParsed) if (e.note) flags.push({ id: `_note_${e.parser}`, severity: "info", label: e.note });
      flags.push(...recLLM.conflicts);
      data.flags = flags;

      // VALIDATION BLOQUANTE : champs clés (core) présents + aucun check d'erreur du catalogue.
      const coreMissing = lines.filter((l) => l.core && values[l.id] == null).map((l) => l.label);
      const errorIssues = (flags as { severity?: string; label?: string }[]).filter((f) => f.severity === "error").map((f) => f.label ?? "");
      const blocking = [...coreMissing.map((l) => `Champ clé manquant : ${l}`), ...errorIssues];
      if (blocking.length) flags.push({ id: "_invalid", severity: "error", label: `Validation bloquante : ${blocking.join(" · ")}. Le dashboard ne sera pas généré tant que ce n'est pas corrigé.` });

      data.meta = { ...(data.meta ?? {}), fx: { reporting: currency, source: fxSource, detected, factor },
        classification: keptParsed.map((e) => ({ parser: e.parser, file: e.file, role: e.role, effRole: effRoleOf(e), manual: !!manualByName.get(e.file)?.role, revenueCandidate: e.revenueCandidate ?? null, note: e.note })),
        sources_count: keptParsed.length + llmExtracts.length,
        period, currency, entity: (client as { name?: string }).name ?? null,
        validation: { ok: blocking.length === 0, blocking } };

      // Breakdowns dimensionnels (ventes par pays, top produits…) collectés depuis les parsers.
      const breakdowns: Record<string, unknown> = {};
      for (const e of keptParsed) if (e.breakdowns) for (const [k, v] of Object.entries(e.breakdowns)) if (!breakdowns[k]) breakdowns[k] = v;
      if (Object.keys(breakdowns).length) (data as { breakdowns?: unknown }).breakdowns = breakdowns;

      dataToSave = data;
      missing = lines.filter((l) => l.core && values[l.id] == null).map((l) => `${l.label} — non trouvé dans les fichiers fournis`);
      usage = { parsers: keptParsed.length, llm: llmExtracts.length };
    } else {
      // GÉNÉRIQUE (activités sans template) : l'IA produit directement la structure.
      const configGuide = at?.config && Object.keys(at.config).length ? JSON.stringify(at.config) : "";
      const guide = [ACTIVITY_GUIDE[activity] ?? "", configGuide].filter(Boolean).join(" ");
      const content: unknown[] = [ctxBlock, ...fileBlocks, { type: "text", text: "Produis maintenant le JSON standardisé selon les règles." }];
      const res = await callAnthropic({
        model: MODELS.fast,
        system: SYSTEM(activity, guide),
        messages: [{ role: "user", content } as AnthropicMessage],
        max_tokens: 8000,
      });
      usage = res.usage;
      const parsed = extractJson<{ data?: unknown; missing_items?: unknown[] }>(res.text);
      dataToSave = parsed.data ?? {};
      missing = parsed.missing_items ?? [];
    }

    const saved = await insertVersion(admin, "standardized_data", { client_id, period }, {
      activity_type_id: client.activity_type_id,
      data: dataToSave ?? {},
      missing_items: missing ?? [],
      source: "ai",
      created_by: user.id,
    });

    return json({ ok: true, standardized_data: saved, usage });
  } catch (e) {
    console.error("standardize-data:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
