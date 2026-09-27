// ② standardize-data — agrège fichiers du mois + contexte courant + type d'activité,
// et produit des DONNÉES STANDARDISÉES (source de vérité) pour un client/mois.
// Signale explicitement les pièces manquantes au lieu d'inventer.
//
// INCRÉMENTAL : l'edge runtime plafonne le CPU (~2 s) et la mémoire (256 Mo). Les fichiers sont donc
// lus/parsés PAR LOTS (budget par appel) et chaque extraction est mise en cache (std_file_extracts,
// par fichier × mois × version). Tant qu'il reste des fichiers, la réponse est { partial: true } et
// le front relance ; le dernier appel agrège, complète par l'IA et enregistre.
//
// Body: { client_id: uuid, period: "YYYY-MM-01", files_period?: "YYYY-MM-01" }
//   files_period (optionnel) : mois où sont déposés les fichiers, si différent du mois standardisé
//   (ex. exports janv.→août déposés sur août, standardisation de juillet).

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropic, callAnthropicTool, extractJson, MODELS, type AnthropicMessage } from "../_shared/anthropic.ts";
import { insertVersion, poorerStandardized } from "../_shared/versioning.ts";
import { MISSING_CONTENT, readClientFiles, readOneFile, filesToContentBlocks, type FileItem } from "../_shared/readFiles.ts";
import { getCatalog, inputLines, type CatalogLine } from "../_shared/templates.ts";
import { type FileExtract } from "../_shared/reconcile.ts";
import { ratesToReporting } from "../_shared/fx.ts";
import { parseFile, type ParsedExtract } from "../_shared/parsers.ts";
import { applyCostParams, completeLogistics, finalize, mergeParsed, type CostParams } from "../_shared/standardizeCore.ts";
import { reliabilityIndex, runControls } from "../_shared/controls.ts";
import { flatValues } from "../_shared/marginBridge.ts";
import { CLASSIFY_SYSTEM, CLASSIFY_TOOL, classifyUserText, mergeRules, sanitizeClassified, splitByConfidence, toClassify,
  CP_CATEGORY_LABELS, type BankRule, type CpCategory, type Proposal } from "../_shared/counterparties.ts";

// Changer cette version invalide tout le cache d'extraction (nouveaux parsers → re-lecture).
const ENGINE_VERSION = "2026-09-28.3";
// Temps de lecture+parsing (≈ CPU) par appel : marge confortable sous la limite ~2 s de l'edge.
const PARSE_BUDGET_MS = 800;
// Temps RÉEL par appel pour les téléchargements (limite edge ~150 s, agrégation + IA à garder derrière).
const WALL_BUDGET_MS = 45_000;

// Repères métier par type d'activité (chemin générique, activités sans catalogue).
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
  "data": { "sections": [ { "key": "pnl", "label": "Compte de résultat", "rows": [ { "label": "Chiffre d'affaires", "value": 12000, "unit": "EUR" } ] } ] },
  "missing_items": [ "ce qu'il faut demander au client" ]
}`;

// IA de SECOURS : un fichier NON reconnu par les parsers, pour les postes encore manquants.
// Le MOIS CIBLE est explicite (avant : absent → l'IA mélangeait août et cumul janv.→août).
const PERFILE_SYSTEM = (activity: string, lines: CatalogLine[], ctxText: string, period: string) => `Tu analyses UN SEUL fichier d'un client "${activity}". Tu fais partie d'une chaîne qui agrège plusieurs fichiers ensuite : extrais SEULEMENT ce que CE fichier contient, sans déduire le reste.

MOIS CIBLE : ${period.slice(0, 7)} (du 1er au dernier jour du mois). N'extrais QUE des montants qui concernent CE mois.
- Si le document couvre PLUSIEURS mois et que tu ne peux pas isoler ce mois (cumul, capture d'un tableau de bord sur une plage de dates, total annuel…) : n'inclus AUCUNE valeur pour ces postes (value=null, provenance = « cumul multi-mois, mois non isolable »). Ne divise JAMAIS un cumul par le nombre de mois.
- Vérifie la plage de dates affichée (en-tête, filtre, titre) AVANT d'extraire.

${ctxText ? `CONTEXTE DU DOSSIER (rôle des sources, montage financier — à respecter) :\n${ctxText}\n` : ""}
1) IDENTIFIE le type de source (source_type) parmi : "sales_export", "ads_dashboard", "bank_statement", "invoice", "payroll", "pnl", "other".
2) DEVISE : "currency" = devise PRINCIPALE des montants (code ISO). Montants bruts DANS CETTE DEVISE, sans conversion.
3) EXTRAIS uniquement les postes ci-dessous que CE fichier fournit réellement pour LE MOIS CIBLE (valeur numérique brute). N'invente rien.
   - RELEVÉ BANCAIRE : catégorise les transactions du mois et additionne par poste. Les encaissements ne sont PAS du CA.
   - EXPORT DE PAIEMENTS : seulement les paiements réussis ; exclus échecs, en attente, remboursements.
   - ANTI-DOUBLE-COMPTAGE : les mouvements internes (virements entre comptes, payouts PSP) vont dans "note", pas dans "values".
4) Pour chaque valeur, indique OÙ tu l'as trouvée (page / ligne / feuille / zone de l'écran) dans "provenance".

POSTES POSSIBLES :
${lines.map((l) => `- ${l.id} : ${l.label}${l.hint ? ` (${l.hint})` : ""}`).join("\n")}`;

async function mapLimit<T, R>(arr: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, arr.length || 1) }, async () => {
    while (i < arr.length) { const idx = i++; out[idx] = await fn(arr[idx]); }
  });
  await Promise.all(workers);
  return out;
}

async function sha1(s: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

type FileRow = { id: string; original_name: string | null; storage_path: string | null; updated_at: string | null; doc_role?: string | null; doc_note?: string | null };
type CacheRow = { file_id: string; fingerprint: string; status: "parsed" | "llm" | "skipped"; extract: ParsedExtract | null; reason: string | null };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const tStart = Date.now();
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    const { admin, user } = guard;

    const body = await req.json().catch(() => ({}));
    const client_id: string | undefined = body.client_id;
    const period: string | undefined = body.period;
    const filesPeriod: string = body.files_period ?? period;
    if (!client_id || !period) return json({ error: "client_id et period (YYYY-MM-01) requis" }, 400);

    const { data: client } = await admin
      .from("clients")
      .select("id, name, currency, activity_type_id, cost_params, activity_types:activity_type_id(slug, name, config)")
      .eq("id", client_id)
      .maybeSingle();
    if (!client) return json({ error: "client introuvable" }, 404);

    const { data: ctx } = await admin
      .from("contexts").select("data").eq("client_id", client_id).eq("is_current", true).maybeSingle();

    const { data: filesRaw } = await admin
      .from("files").select("id, original_name, storage_path, updated_at, doc_role, doc_note").eq("client_id", client_id).eq("period", filesPeriod);
    // Doublons de ligne pour un même objet (anciens ré-uploads du même nom) : une seule lecture,
    // la plus récente — sinon un relevé bancaire déposé deux fois était compté deux fois.
    const byPath = new Map<string, FileRow>();
    for (const f of (filesRaw ?? []) as FileRow[]) {
      const k = f.storage_path ?? f.id; const cur = byPath.get(k);
      if (!cur || (f.updated_at ?? "") > (cur.updated_at ?? "")) byPath.set(k, f);
    }
    const files = [...byPath.values()];

    const at = (client as { activity_types?: { slug?: string; config?: Record<string, unknown> } }).activity_types;
    const activity = at?.slug ?? "inconnu";
    const currency = (client as { currency?: string }).currency ?? "EUR";
    const tpl = getCatalog(at?.config);
    const manualByName = new Map<string, { role?: string; note?: string }>();
    for (const f of files) if (f.original_name) manualByName.set(f.original_name, { role: f.doc_role ?? undefined, note: f.doc_note ?? undefined });

    let dataToSave: unknown;
    let missing: unknown[];
    let usage: unknown;
    let qualification: { auto: BankRule[]; proposals: Proposal[] } | null = null;

    if (tpl) {
      const costParams = ((client as { cost_params?: CostParams }).cost_params ?? null) as CostParams | null;
      const ctxData = (ctx?.data ?? {}) as { fx_rates?: Record<string, number>; bank_rules?: BankRule[]; playbook?: { bank_rules?: { match: string; category: string }[] };
        value_overrides?: Record<string, Record<string, { value: number; source: string }>>;
        bank_rule_proposals?: Proposal[]; bank_rules_rejected?: string[] };
      const { factor, source: fxSource } = await ratesToReporting(period, currency, ctxData.fx_rates);
      // Priorité : règles du dossier > playbook > dictionnaire global des contreparties (> classement intégré).
      const { data: globalCp } = await admin.from("std_counterparties").select("match, category").order("match");
      const categoryRules = [...(ctxData.bank_rules ?? []).map((r) => ({ match: r.match, category: r.category })),
        ...(ctxData.playbook?.bank_rules ?? []), ...((globalCp ?? []) as { match: string; category: string }[])];
      const bankAnchors = costParams?.bank_anchors;
      const pctx = { reporting: currency, factor, period, activity, categoryRules, bankAnchors };
      // Empreinte à 2 niveaux : les règles bancaires / soldes de référence n'invalident QUE les relevés
      // bancaires (une nouvelle règle « paypal → pub » ne relit pas les 34 fichiers).
      const baseHash = await sha1(JSON.stringify({ ENGINE_VERSION, currency, factor }));
      const bankHash = await sha1(JSON.stringify({ baseHash, categoryRules, bankAnchors: bankAnchors ?? null }));
      const fpOf = (f: FileRow, bank = false) => `${f.updated_at ?? ""}|${bank ? bankHash : baseHash}`;
      const isBank = (e: ParsedExtract | null | undefined) => e?.role === "bank";

      // 1) CACHE : extractions déjà faites pour ce mois avec la même empreinte.
      const cache = new Map<string, CacheRow>();
      if (files.length) {
        const { data: rows } = await admin.from("std_file_extracts")
          .select("file_id, fingerprint, status, extract, reason").eq("client_id", client_id).eq("period", period).in("file_id", files.map((f) => f.id));
        for (const r of (rows ?? []) as CacheRow[]) { const f = files.find((x) => x.id === r.file_id); if (f && r.fingerprint === fpOf(f, isBank(r.extract))) cache.set(r.file_id, r); }
      }

      // 2) LOT : lecture + parsing des fichiers pas encore en cache, dans la limite du budget.
      const todo = files.filter((f) => !cache.has(f.id));
      const pending: string[] = [], toPrepare: { id: string; name: string }[] = [];
      const missingContent = new Set<string>(); // contenu absent du stockage : signalé, JAMAIS mis en cache
      let spent = 0, doneNow = 0;
      for (const f of todo) {
        const name = f.original_name ?? f.id;
        if ((spent >= PARSE_BUDGET_MS || Date.now() - tStart > WALL_BUDGET_MS) && doneNow > 0) { pending.push(name); continue; }
        const r = await readOneFile(admin, f, { allowEdgeXlsx: doneNow === 0 });
        if ("kind" in r) { if (r.kind === "prepare") toPrepare.push({ id: f.id, name }); else pending.push(name); continue; }
        if (r.item.kind === "skipped" && r.item.reason === MISSING_CONTENT) { missingContent.add(f.id); continue; }
        const t0 = performance.now();
        let row: CacheRow;
        if (r.item.kind === "skipped") row = { file_id: f.id, fingerprint: fpOf(f), status: "skipped", extract: null, reason: r.item.reason };
        else if (r.item.kind === "text") {
          const p = parseFile(name, r.item.content, pctx);
          if (p) { p.file = name; row = { file_id: f.id, fingerprint: fpOf(f, isBank(p)), status: "parsed", extract: p, reason: null }; }
          else row = { file_id: f.id, fingerprint: fpOf(f), status: "llm", extract: null, reason: "format non reconnu → IA" };
        } else row = { file_id: f.id, fingerprint: fpOf(f), status: "llm", extract: null, reason: "PDF/image → IA" };
        spent += performance.now() - t0 + r.cpuMs; doneNow++;
        await admin.from("std_file_extracts").delete().eq("file_id", f.id).eq("period", period).neq("fingerprint", row.fingerprint);
        await admin.from("std_file_extracts").upsert({ client_id, period, ...row }, { onConflict: "file_id,period,fingerprint" });
        cache.set(f.id, row);
      }
      if (pending.length || toPrepare.length) {
        return json({ ok: true, partial: true, total: files.length, done: cache.size, pending, needs_preparation: toPrepare });
      }

      // 3) AGRÉGATION déterministe + onboarding.
      const lines = inputLines(tpl);
      const labelOf = (id: string) => tpl.lines.find((l) => l.id === id)?.label ?? id;
      const parsed: ParsedExtract[] = [];
      const llmFiles: FileRow[] = [];
      const skipped: { name: string; reason: string }[] = [];
      for (const f of files) {
        const c = cache.get(f.id); const name = f.original_name ?? f.id;
        if (!c) { skipped.push({ name, reason: missingContent.has(f.id) ? MISSING_CONTENT : "non lu" }); continue; }
        if (c.status === "parsed" && c.extract) { c.extract.file = name; if (manualByName.get(name)?.role !== "ignore") parsed.push(c.extract); }
        else if (c.status === "llm") { if (manualByName.get(name)?.role !== "ignore") llmFiles.push(f); }
        else skipped.push({ name, reason: c.reason ?? "non lu" });
      }
      let proposals = ctxData.bank_rule_proposals ?? [];
      let merged = mergeParsed(parsed, manualByName, labelOf, currency, proposals);

      // 3b) QUALIFICATION IA des débits bancaires encore inconnus (contrepartie + montant seulement).
      //  ≥ 90 % → règle du dossier « IA » (appliquée, révocable) puis re-lecture du relevé ; sinon proposition.
      const unq = merged.kept.flatMap((e) => (e.aux?.unqualifiedDebits as { label: string; value: number }[] | undefined) ?? []);
      const asked = toClassify(unq, [...categoryRules.map((r) => r.match), ...proposals.map((p) => p.match), ...(ctxData.bank_rules_rejected ?? [])]).slice(0, 40);
      if (asked.length && body.no_ai_rules !== true) {
        try {
          const { input } = await callAnthropicTool({ model: MODELS.fast, system: CLASSIFY_SYSTEM(activity),
            messages: [{ role: "user", content: classifyUserText(asked, currency) }], tool: CLASSIFY_TOOL, max_tokens: 4000, signal: AbortSignal.timeout(60_000) });
          const cls = sanitizeClassified(input, asked);
          const split = splitByConfidence(cls, new Map(asked.map((a) => [a.label, a.value])), period);
          // Contreparties que l'IA n'a pas su qualifier : mémorisées (confiance 0) pour ne pas être redemandées.
          const got = new Set(cls.map((c) => c.counterparty));
          const unknown: Proposal[] = asked.filter((a) => !got.has(a.label)).map((a) => ({ match: a.label.toLowerCase().replace(/\s+/g, " ").trim(),
            category: "other" as CpCategory, label: a.label, confidence: 0, amount: a.value, period, reason: "non qualifiable automatiquement" }));
          qualification = { auto: split.auto, proposals: [...split.proposals, ...unknown] };
          if (!body.dry_run) {
            const nextCtx = { ...((ctx?.data as Record<string, unknown>) ?? {}),
              bank_rules: mergeRules(ctxData.bank_rules ?? [], split.auto), bank_rule_proposals: [...proposals, ...qualification.proposals] };
            await insertVersion(admin, "contexts", { client_id }, { data: nextCtx, created_by: user.id });
            for (const u of split.universal) {
              const { data: cur } = await admin.from("std_counterparties").select("id, hits").eq("match", u.match).maybeSingle();
              if (cur) await admin.from("std_counterparties").update({ hits: ((cur as { hits: number }).hits ?? 0) + 1, updated_at: new Date().toISOString() }).eq("id", (cur as { id: string }).id);
              else await admin.from("std_counterparties").insert({ match: u.match, category: u.category, label: u.label, source: "ai", confidence: u.confidence });
            }
            // Nouvelles règles → le relevé doit être relu (empreinte bancaire changée) : on rend la main au front.
            if (split.auto.length) {
              const bankNames = files.filter((f) => isBank(cache.get(f.id)?.extract)).map((f) => f.original_name ?? f.id);
              return json({ ok: true, partial: true, total: files.length, done: files.length - bankNames.length, pending: bankNames,
                step: `Débits qualifiés par l'IA : ${split.auto.length}`, auto_rules: split.auto.length });
            }
          }
          proposals = [...proposals, ...qualification.proposals];
          merged = mergeParsed(parsed, manualByName, labelOf, currency, proposals);
        } catch (e) { console.warn("standardize-data: qualification IA ignorée", e); }
      }
      // Traçabilité fait / hypothèse : les règles posées par l'IA restent visibles tant qu'un humain ne les a pas validées.
      const iaRules = (ctxData.bank_rules ?? []).filter((r) => r.source === "ia");
      if (iaRules.length) merged.flags.push({ id: "_ia_rules", severity: "info",
        label: `Débits qualifiés automatiquement par l'IA (hypothèse, à vérifier dans « Contreparties ») : ${iaRules.slice(0, 8).map((r) => `${r.label ?? r.match} → ${CP_CATEGORY_LABELS[r.category as CpCategory] ?? r.category}${r.confidence ? ` (${Math.round(r.confidence * 100)} %)` : ""}`).join(" · ")}${iaRules.length > 8 ? ` · +${iaRules.length - 8}` : ""}.` });
      applyCostParams(merged, costParams, currency);
      completeLogistics(merged, period, currency);
      // Corrections explicites du conseiller pour ce mois (réponses aux pièces manquantes / audit) : priment.
      for (const [id, o] of Object.entries(ctxData.value_overrides?.[period] ?? {})) {
        if (typeof o?.value !== "number" || !isFinite(o.value)) continue;
        merged.values[id] = o.value; merged.sources[id] = `correction du conseiller : ${o.source}`;
        merged.traces[id] = [{ src: merged.sources[id], value: o.value }, ...(merged.traces[id] ?? []).map((t) => ({ ...t, src: `${t.src} (remplacé)` }))];
        merged.confidence[id] = "manual";
      }
      // Trésorerie de DÉBUT = trésorerie de fin du mois précédent, si le conseiller l'a déclarée.
      const prevP = (() => { const [y, m] = period.slice(0, 7).split("-").map(Number); const d = new Date(Date.UTC(y, m - 2, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`; })();
      const prevEnd = ctxData.value_overrides?.[prevP]?.cash_end;
      if (!ctxData.value_overrides?.[period]?.cash_start && typeof prevEnd?.value === "number" && isFinite(prevEnd.value)) {
        merged.values.cash_start = prevEnd.value;
        merged.sources.cash_start = `trésorerie de fin ${prevP.slice(0, 7)} déclarée par le conseiller`;
        merged.traces.cash_start = [{ src: merged.sources.cash_start, value: prevEnd.value }];
        merged.confidence.cash_start = "manual";
      }
      // Contrôle : une trésorerie DÉCLARÉE doit être cohérente avec le flux net du relevé bancaire du mois.
      const netFlow = merged.kept.map((e) => e.aux?.netFlow as number | undefined).find((x) => typeof x === "number");
      const declared = merged.confidence.cash_end === "manual" || merged.confidence.cash_start === "manual";
      if (declared && netFlow != null && merged.values.cash_end != null && merged.values.cash_start != null) {
        const fe = (x: number) => Math.round(x).toLocaleString("fr-FR");
        const variation = merged.values.cash_end - merged.values.cash_start, gap = variation - netFlow;
        merged.flags.push(Math.abs(gap) > Math.max(500, Math.abs(merged.values.cash_start) * 0.01)
          ? { id: "_cash_recon", severity: "warn" as const, label: `Contrôle trésorerie : variation du mois ${fe(variation)} ${currency} (fin − début déclarées) vs flux net du relevé bancaire ${fe(netFlow)} ${currency} — écart ${fe(gap)} ${currency}. Un compte manque au relevé, ou un compte du relevé n'est pas dans ta trésorerie déclarée (ex. solde Shopify Payments, carte).` }
          : { id: "_cash_recon", severity: "info" as const, label: `Contrôle trésorerie OK : la variation déclarée correspond au flux net du relevé (${fe(netFlow)} ${currency}).` });
      }

      // 4) IA DE SECOURS : fichiers non reconnus, postes encore manquants, MOIS CIBLE explicite.
      const missingLines = lines.filter((l) => merged.values[l.id] == null);
      const missingIds = missingLines.map((l) => l.id);
      const playbookText = ctx?.data ? JSON.stringify((ctx.data as { playbook?: unknown }).playbook ?? ctx.data).slice(0, 4000) : "";
      const fileNotes = [...manualByName.entries()].filter(([, m]) => m.note).map(([n, m]) => `${n} : ${m.note}`).join(" | ");
      const ctxText = [playbookText, fileNotes ? `NOTES PAR FICHIER (contexte imposé) : ${fileNotes}` : ""].filter(Boolean).join("\n");
      const EXTRACT_TOOL = {
        name: "emit_extraction",
        description: "Renvoie les postes que CE fichier permet de renseigner POUR LE MOIS CIBLE. N'invente jamais : si un poste est introuvable ou seulement disponible en cumul multi-mois, value=null avec la raison.",
        input_schema: {
          type: "object",
          properties: {
            source_type: { type: "string", enum: ["sales_export", "ads_dashboard", "bank_statement", "invoice", "payroll", "pnl", "other"] },
            currency: { type: "string", description: "Code ISO de la devise principale des montants (EUR, AED, USD, GBP…)" },
            period_covered: { type: "string", description: "Plage de dates couverte par le document, telle qu'affichée (ex. 2026-01-01 → 2026-08-31)" },
            fields: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", enum: missingIds.length ? missingIds : ["_none"] },
                  value: { type: ["number", "null"], description: "Montant brut DANS la devise du fichier, pour le MOIS CIBLE uniquement, ou null." },
                  provenance: { type: "string", description: "Où trouvé si value≠null ; sinon raison de l'absence." },
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
      type ToolOut = { source_type?: string; currency?: string; period_covered?: string; fields?: { id: string; value: number | null; provenance: string }[] };
      const llmExtracts: FileExtract[] = (llmFiles.length && missingIds.length)
        ? (await mapLimit(llmFiles, 3, async (f) => {
            const r = await readOneFile(admin, f, { allowEdgeXlsx: false });
            if ("kind" in r || r.item.kind === "skipped") return null;
            const doc: FileItem = r.item;
            const content: unknown[] = [...filesToContentBlocks([doc]), { type: "text", text: `Classe ce fichier et renseigne UNIQUEMENT les postes présents pour ${period.slice(0, 7)}, via l'outil.` }];
            try {
              const { input } = await callAnthropicTool<ToolOut>({ model: MODELS.fast, system: PERFILE_SYSTEM(activity, missingLines, ctxText, period),
                messages: [{ role: "user", content } as AnthropicMessage], tool: EXTRACT_TOOL, max_tokens: 1500 });
              if (!input) return null;
              const values: Record<string, number> = {}; const sources: Record<string, string> = {};
              for (const x of input.fields ?? []) {
                if (typeof x.value === "number" && isFinite(x.value) && x.provenance && x.provenance.trim())
                  { values[x.id] = x.value; sources[x.id] = `${doc.name} — ${x.provenance}`; }
              }
              return { file: doc.name, type: (input.source_type ?? "other") as FileExtract["type"], currency: input.currency, values, sources } as FileExtract;
            } catch { return null; }
          })).filter((x): x is FileExtract => !!x)
        : [];

      // 5) FINALISATION (calcul, contrôles, tri des absences).
      const out = finalize({ tpl, activity, currency, period, entity: (client as { name?: string }).name ?? null,
        merged, llmExtracts, factor, fxSource, skipped,
        expectedBreakdowns: (at?.config as { expected_breakdowns?: { key: string; label: string }[] })?.expected_breakdowns });
      const bankAccounts = [...new Set(merged.kept.flatMap((e) => (e.aux?.bankAccounts as string[] | undefined) ?? []))];
      // 6) CONTRÔLES CROISÉS + INDICE DE FIABILITÉ (onglet Audit, accueil) — comparés au mois précédent standardisé.
      const { data: prevSd } = await admin.from("standardized_data").select("data").eq("client_id", client_id).eq("period", prevP).eq("is_current", true).maybeSingle();
      const cur = flatValues(out.data);
      const controls = runControls(cur, prevSd ? flatValues(prevSd.data) : null, merged.kept, currency, { cogsMissing: merged.cogsMissing });
      const reliability = reliabilityIndex(cur, controls, merged.kept);
      dataToSave = { ...out.data, controls, reliability, meta: { ...(out.data.meta as Record<string, unknown>), engine: ENGINE_VERSION, files_period: filesPeriod,
        ...(bankAccounts.length ? { bank_accounts: bankAccounts } : {}) } };
      missing = out.missing;
      usage = { parsers: merged.kept.length, llm: llmExtracts.length, files: files.length };
    } else {
      // GÉNÉRIQUE (activités sans catalogue) : l'IA produit directement la structure.
      const docs = await readClientFiles(admin, files);
      const configGuide = at?.config && Object.keys(at.config).length ? JSON.stringify(at.config) : "";
      const guide = [ACTIVITY_GUIDE[activity] ?? "", configGuide].filter(Boolean).join(" ");
      const ctxBlock = { type: "text", text: `CONTEXTE CLIENT:\n${JSON.stringify(ctx?.data ?? {}, null, 2)}\n\nFICHIERS DU MOIS (${docs.length}) :` };
      const fileBlocks = docs.length ? filesToContentBlocks(docs) : [{ type: "text", text: "(aucun fichier déposé pour ce mois)" }];
      const content: unknown[] = [ctxBlock, ...fileBlocks, { type: "text", text: "Produis maintenant le JSON standardisé selon les règles." }];
      const res = await callAnthropic({ model: MODELS.fast, system: SYSTEM(activity, guide), messages: [{ role: "user", content } as AnthropicMessage], max_tokens: 8000 });
      usage = res.usage;
      const parsed = extractJson<{ data?: unknown; missing_items?: unknown[] }>(res.text);
      dataToSave = parsed.data ?? {};
      missing = parsed.missing_items ?? [];
      if (activity && activity !== "inconnu") {
        console.warn(`standardize-data: chemin générique pour activité « ${activity} » (pas de catalogue)`);
        const d = dataToSave as { flags?: unknown[] };
        d.flags = [...(Array.isArray(d.flags) ? d.flags : []),
          { id: "_degraded", severity: "warn", label: `Extraction en mode générique (pas de catalogue pour l'activité « ${activity} ») — données appauvries. Vérifie la configuration de l'activité.` }];
      }
    }

    // Diagnostic : calcule tout SANS enregistrer de version (le cache d'extraction, lui, est alimenté).
    if (body.dry_run) return json({ ok: true, partial: false, dry_run: true, data: dataToSave, missing_items: missing, usage, qualification });

    const saved = await insertVersion(admin, "standardized_data", { client_id, period }, {
      activity_type_id: client.activity_type_id,
      data: dataToSave ?? {},
      missing_items: missing ?? [],
      source: "ai",
      created_by: user.id,
    }, {
      // Garde-fou anti-régression seulement À MOTEUR ÉGAL : une version d'un moteur plus récent n'est pas
      // une régression (répartitions erronées supprimées, nouvelles sources) → toujours appliquée.
      demoteIfPoorer: (cand, cur) => ((cur.data as { meta?: { engine?: string } })?.meta?.engine === ENGINE_VERSION) && poorerStandardized(cand, cur),
    });

    const demoted = (saved as { _demoted?: boolean })._demoted === true;
    return json({ ok: true, partial: false, standardized_data: saved, usage, demoted,
      ...(demoted ? { warning: "Version enregistrée mais NON appliquée : elle est plus pauvre (moins de breakdowns) que la version courante. L'ancienne, plus riche, est conservée." } : {}) });
  } catch (e) {
    console.error("standardize-data:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
