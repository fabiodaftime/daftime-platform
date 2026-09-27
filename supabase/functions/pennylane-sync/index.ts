// ⑨ pennylane-sync — transactions bancaires d'une société Pennylane (API v2, via Nango) → registre.
// Staff uniquement. Le jeton Pennylane (lecture seule) vit chez Nango, jamais chez nous.
//  - transactions brutes → src_bank_transactions (source « pennylane_api », classées à la lecture) ;
//  - solde APRÈS la dernière opération de chaque compte (outstanding_balance) → solde de référence
//    (cost_params.bank_anchors) : la trésorerie de tous les mois se reconstitue sans saisie.
// Body: { client_id, from?: "YYYY-MM-01" }  (défaut : 13 mois)

import { corsHeaders, json } from "../_shared/cors.ts";
import { requireStaff } from "../_shared/guard.ts";
import { counterparty } from "../_shared/parsers.ts";

const NANGO_API_URL = Deno.env.get("NANGO_API_URL") ?? "https://api.nango.dev";
const NANGO_SECRET_KEY = Deno.env.get("NANGO_SECRET_KEY") ?? "";
const PREFIXES = ["/api/external/v2", "/v2"]; // selon l'URL de base de l'intégration Nango

type PlTx = { id: number; date: string; label?: string | null; amount?: string | number; currency_amount?: string | number; currency?: string;
  outstanding_balance?: string | number | null; bank_account?: { id: number } | null };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const guard = await requireStaff(req);
    if (!guard.ok) return json({ error: guard.error }, guard.status);
    const { admin } = guard;
    const body = await req.json().catch(() => ({}));
    const client_id: string | undefined = body.client_id;
    if (!client_id) return json({ error: "client_id requis" }, 400);
    const now = new Date();
    const from: string = body.from ?? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 13, 1)).toISOString().slice(0, 10);

    const { data: conn } = await admin.from("src_connections").select("id, nango_connection_id")
      .eq("client_id", client_id).eq("provider", "pennylane").eq("status", "active").maybeSingle();
    if (!conn?.nango_connection_id) return json({ error: "Aucune société Pennylane connectée pour ce client." }, 404);

    let prefix = PREFIXES[0];
    const call = async (path: string) => {
      for (const p of [prefix, ...PREFIXES.filter((x) => x !== prefix)]) {
        const r = await fetch(`${NANGO_API_URL}/proxy${p}${path}`, { headers: { Authorization: `Bearer ${NANGO_SECRET_KEY}`, "Connection-Id": conn.nango_connection_id, "Provider-Config-Key": "pennylane" } });
        if (r.status === 404) continue;
        const t = await r.text();
        if (!r.ok) throw new Error(`Pennylane ${r.status} : ${t.slice(0, 300)}`);
        prefix = p; return JSON.parse(t);
      }
      throw new Error(`Pennylane : chemin introuvable (${path})`);
    };

    // Comptes bancaires (nom lisible, identique à la colonne « Bank account » de l'export).
    const accounts = new Map<number, string>();
    let cursor: string | null = null;
    do {
      const page = await call(`/bank_accounts?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
      for (const a of page.items ?? []) accounts.set(a.id, String(a.name ?? a.label ?? a.id));
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor);

    // Transactions depuis « from », pagination par curseur.
    const filter = encodeURIComponent(JSON.stringify([{ field: "date", operator: "gteq", value: from }]));
    const rows: Record<string, unknown>[] = []; const last = new Map<string, { date: string; id: number; balance: number }>();
    cursor = null; let pages = 0;
    do {
      const page = await call(`/transactions?limit=100&filter=${filter}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
      for (const t of (page.items ?? []) as PlTx[]) {
        const account = accounts.get(t.bank_account?.id ?? -1) ?? "compte";
        const amount = Number(t.currency_amount ?? t.amount); if (!t.date || !isFinite(amount)) continue;
        const label = String(t.label ?? "").replace(/\s+/g, " ").trim();
        rows.push({ client_id, source: "pennylane_api", account, tx_date: t.date.slice(0, 10), amount, currency: t.currency ?? null,
          label, counterparty: counterparty(label), dedup_key: `${client_id}|pennylane:${t.id}` });
        const bal = Number(t.outstanding_balance);
        if (t.outstanding_balance != null && isFinite(bal)) {
          const cur = last.get(account);
          if (!cur || t.date > cur.date || (t.date === cur.date && t.id > cur.id)) last.set(account, { date: t.date.slice(0, 10), id: t.id, balance: bal });
        }
      }
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor && ++pages < 400);

    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await admin.from("src_bank_transactions").upsert(rows.slice(i, i + 500), { onConflict: "dedup_key" });
      if (error) throw error;
    }
    // Soldes de référence (fin de journée de la dernière opération connue de chaque compte).
    if (last.size) {
      const { data: cl } = await admin.from("clients").select("cost_params").eq("id", client_id).maybeSingle();
      const cp = { ...(((cl as { cost_params?: Record<string, unknown> } | null)?.cost_params) ?? {}) } as { bank_anchors?: { account: string; date: string; balance: number; source?: string }[] };
      const keep = (cp.bank_anchors ?? []).filter((a) => !last.has(a.account));
      cp.bank_anchors = [...keep, ...[...last.entries()].map(([account, x]) => ({ account, date: x.date, balance: Math.round(x.balance * 100) / 100, source: "pennylane_api" }))];
      await admin.from("clients").update({ cost_params: cp }).eq("id", client_id);
    }
    await admin.from("src_connections").update({ last_synced_at: new Date().toISOString(), last_error: null }).eq("id", conn.id);
    return json({ ok: true, from, transactions: rows.length, accounts: [...accounts.values()], anchors: last.size,
      months: [...new Set(rows.map((r) => String(r.tx_date).slice(0, 7)))].sort().map((m) => `${m}-01`) });
  } catch (e) {
    console.error("pennylane-sync:", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
