// flow-map — CARTOGRAPHIE DES FLUX d'un dossier (brouillon rédigé par l'IA, relu et publié par le conseiller).
// Sources : contexte du dossier (calls, champs structurés), consignes, règles bancaires validées, relevé des
// 3 derniers mois complets (par compte et contrepartie), leviers de décalage et sorties ponctuelles.
// Écrit la ligne « draft » de client_flow_maps (jamais la version publiée : c'est le conseiller qui publie).
//
// Body: { client_id }

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { callAnthropicTool, MODELS } from "../_shared/anthropic.ts";
import { classifyDebit } from "../_shared/parsers.ts";
import { bankDigest, FLOW_TOOL, sanitizeFlowMap, type DigestTx } from "../_shared/flowMap.ts";

const SYSTEM = `Tu es conseiller financier e-commerce chez Daftime. Tu dresses la CARTOGRAPHIE DES FLUX d'argent d'un client, qu'il lira lui-même : tutoiement, phrases courtes, langage e-commerce, AUCUN jargon comptable (pas de BFR, DSO, DPO).
Règles :
- N'invente rien. Tout ce qui vient d'un call, du contexte ou d'une règle validée par le conseiller = « confirmé ». Ce que tu déduis du relevé = « à confirmer ».
- Les montants mensuels viennent du relevé fourni (moyenne des mois indiqués), arrondis. Pas de montant si tu ne l'as pas.
- Chaque encaissement et chaque décaissement pointe vers l'id d'un compte de la liste « accounts ».
- Regroupe les petites dépenses (outils, abonnements) ; garde visibles les gros postes (pub par régie, fournisseur de stock, logistique, équipe, impôts, financement).
- Les virements entre comptes du client ou entre ses sociétés vont dans « interco » (ou en catégorie « interne »), jamais en dépense.
- Les remboursements de prêt (catégorie « loan » du relevé, même via PayPal) vont en « financement », avec leur rythme (ex. chaque semaine).
- Un flux ponctuel (1 ou 2 opérations sur la période) n'a PAS de montant mensuel : mets le montant total et la date dans « note ».
- « open_questions » : ce qu'il faut demander au client pour compléter la carte (délais fournisseurs, comptes manquants, nature d'un flux).
- La carte ALIMENTE LE MOTEUR : pour chaque sortie qui correspond à UNE contrepartie du relevé, renseigne « match » avec le mot-clé de cette contrepartie tel qu'il apparaît dans le résumé (minuscules, le plus court qui reste sans ambiguïté, ex. « hanayaka », « bigblue »). Si une même contrepartie porte deux flux différents (ex. PayPal = pub ET prêt), mets le mot-clé sur les deux et « amount » (montant exact d'une opération) sur celui qui a un montant fixe. Laisse « match » vide pour un poste qui regroupe plusieurs contreparties.
- « in_treasury » d'un compte = son solde fait partie de la trésorerie du shop. Un compte personnel ou d'une autre société qui paie des dépenses du shop est HORS trésorerie (false) : ses dépenses restent des charges du shop.
Réponds en appelant l'outil.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    const { admin, user } = guard;
    const body = await req.json().catch(() => ({}));
    const client_id: string | undefined = body.client_id;
    if (!client_id) return json({ error: "client_id requis" }, 400);

    const { data: client } = await admin.from("clients").select("name, currency, dashboard_guidance").eq("id", client_id).maybeSingle();
    if (!client) return json({ error: "Dossier introuvable" }, 404);
    const { data: ctx } = await admin.from("contexts").select("data").eq("client_id", client_id).eq("is_current", true).maybeSingle();
    const cd = (ctx?.data ?? {}) as { summary?: unknown; fields?: unknown; bank_rules?: { match: string; category: string; label?: string; amount?: number }[] };
    const rules = (cd.bank_rules ?? []).map((r) => ({ match: r.match, category: r.category, ...(typeof r.amount === "number" ? { amount: r.amount } : {}) }));
    const ruleLabel = (label: string, amount: number) => {
      const d = label.toLowerCase(); const abs = Math.round(Math.abs(amount) * 100);
      const hit = [...(cd.bank_rules ?? []).filter((r) => r.amount != null && Math.round(Math.abs(r.amount) * 100) === abs), ...(cd.bank_rules ?? []).filter((r) => r.amount == null)]
        .find((r) => d.includes(r.match.toLowerCase()));
      return hit?.label;
    };

    // Relevé : 3 derniers mois COMPLETS avant la dernière opération connue.
    const { data: last } = await admin.from("src_bank_transactions").select("tx_date").eq("client_id", client_id).order("tx_date", { ascending: false }).limit(1).maybeSingle();
    let digest = "aucun relevé bancaire déposé", months: string[] = [];
    if (last?.tx_date) {
      const lastD = new Date(`${last.tx_date}T00:00:00Z`);
      const endMonth = new Date(Date.UTC(lastD.getUTCFullYear(), lastD.getUTCMonth() + (lastD.getUTCDate() >= 28 ? 1 : 0), 1)); // mois en cours inclus s'il est quasi complet
      months = [3, 2, 1].map((i) => new Date(Date.UTC(endMonth.getUTCFullYear(), endMonth.getUTCMonth() - i, 1)).toISOString().slice(0, 7));
      const txs: DigestTx[] = [];
      for (let off = 0; off < 30000; off += 1000) {
        const { data: page } = await admin.from("src_bank_transactions").select("tx_date, amount, account, counterparty, label")
          .eq("client_id", client_id).gte("tx_date", `${months[0]}-01`).lt("tx_date", endMonth.toISOString().slice(0, 10)).order("tx_date").range(off, off + 999);
        for (const t of (page ?? []) as { tx_date: string; amount: number; account: string | null; counterparty: string | null; label: string | null }[]) {
          const amount = Number(t.amount); const lab = `${t.label ?? ""} ${t.counterparty ?? ""}`;
          txs.push({ tx_date: t.tx_date, amount, account: t.account, counterparty: t.counterparty, label: t.label,
            ...(amount < 0 ? { cat: classifyDebit(lab, rules, amount).cat, rule: ruleLabel(lab, amount) } : {}) });
        }
        if (!page || page.length < 1000) break;
      }
      digest = bankDigest(txs, months) || digest;
    }
    // Leviers / sorties ponctuelles du dernier mois standardisé.
    const { data: sd } = await admin.from("standardized_data").select("period, data").eq("client_id", client_id).eq("is_current", true).order("period", { ascending: false }).limit(1).maybeSingle();
    const sdd = (sd?.data ?? {}) as { payment_levers?: { items?: { label: string; monthly: number; how: string }[] }; cash_forecast?: { oneoffs?: { counterparty: string; amount: number }[]; scheduled?: { counterparty: string; days: number[]; amount: number }[] } };

    const content = [
      `CLIENT : ${client.name} (devise ${client.currency ?? "EUR"})`,
      `CONTEXTE DU DOSSIER (issu des calls et documents) :\n${typeof cd.summary === "string" ? cd.summary.slice(0, 4000) : "—"}`,
      `CHAMPS STRUCTURÉS :\n${cd.fields ? JSON.stringify(cd.fields).slice(0, 6000) : "—"}`,
      `CONSIGNES DU CONSEILLER :\n${String(client.dashboard_guidance ?? "").slice(0, 3000) || "—"}`,
      `RÈGLES BANCAIRES VALIDÉES PAR LE CONSEILLER (confirmé) :\n${(cd.bank_rules ?? []).map((r) => `- « ${r.match} »${r.amount != null ? ` (débits de ${r.amount} € exactement)` : ""} → ${r.category}${r.label ? ` : ${r.label}` : ""}`).join("\n") || "—"}`,
      `RELEVÉ BANCAIRE — moyenne mensuelle sur ${months.join(", ") || "—"} (compte | sens | contrepartie | montant | fréquence | classement) :\n${digest}`,
      sdd.cash_forecast?.scheduled?.length ? `ÉCHÉANCES FIXES DÉTECTÉES : ${sdd.cash_forecast.scheduled.slice(0, 12).map((s) => `${s.counterparty} ${s.amount} € le(s) ${s.days.join(", ")}`).join(" ; ")}` : "",
      sdd.payment_levers?.items?.length ? `ARGENT AVANCÉ CHAQUE MOIS : ${sdd.payment_levers.items.map((i) => `${i.label} ${i.monthly} € (${i.how})`).join(" ; ")}` : "",
      sdd.cash_forecast?.oneoffs?.length ? `SORTIES PONCTUELLES : ${sdd.cash_forecast.oneoffs.map((o) => `${o.counterparty} ${o.amount} €`).join(" ; ")}` : "",
    ].filter(Boolean).join("\n\n");

    const { input } = await callAnthropicTool({ model: MODELS.quality, effort: "low", system: SYSTEM, messages: [{ role: "user", content }],
      tool: FLOW_TOOL as never, max_tokens: 7000, signal: AbortSignal.timeout(140_000) });
    if (!input) return json({ error: "L'IA n'a pas renvoyé de cartographie — réessaie." }, 502);
    const map = { ...sanitizeFlowMap(input), generated_at: new Date().toISOString() };
    const { error } = await admin.from("client_flow_maps").upsert({ client_id, status: "draft", data: map, updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: "client_id,status" });
    if (error) throw error;
    return json({ ok: true, map });
  } catch (e) {
    console.error("flow-map:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
