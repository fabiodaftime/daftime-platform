// REGISTRE DE FAITS (chantier B) — module PUR.
// On remplace progressivement « relire tous les fichiers à chaque mois » par des FAITS datés, écrits une
// seule fois par chaque source ; un mois n'est plus qu'une LECTURE du registre.
// Étape 1 (ici) : DOUBLE ÉCRITURE — les parsers actuels déposent aussi leurs faits ; la standardisation
// continue de lire les extractions. Étape 2 : lecture du registre, comparée au centime, puis bascule.
//
// Deux familles :
//  - std_facts : un poste d'une source pour un mois (grain mensuel tant que la source n'est que mensuelle) ;
//  - src_bank_transactions : transactions BRUTES (même table pour fichier Pennylane, API Pennylane,
//    agrégateur bancaire) — classées À LA LECTURE, donc une règle reclasse tout l'historique.

import type { ParsedExtract, BankTx } from "./parsers.ts";
import { classifyDebit } from "./parsers.ts";

export interface Fact {
  client_id: string; period: string; concept: string; amount: number;
  source: string;            // parser / connecteur (shopify, bigblue_invoice, pennylane_bank…)
  source_doc: string;        // document logique : rapport Shopify, n° de facture, fichier…
  role: string | null;       // rôle comptable de la source (revenue, expense, bank…)
  exclusive: boolean;        // plusieurs sources décrivent le MÊME fait → la plus prioritaire fait foi
  priority: number;
  file_id: string | null;
  basis: "engagement" | "tresorerie";
  dedup_key: string;         // (source, document, concept, mois) → un fichier redéposé ne compte qu'une fois
}

// Document LOGIQUE d'une extraction : même rapport Shopify déposé dans deux dossiers = un seul document ;
// même facture re-téléchargée = un seul document (dedupGroup) ; sinon le nom de fichier.
export function sourceDoc(e: ParsedExtract, fileName: string): string {
  if (e.dedupGroup) return e.dedupGroup;
  const base = fileName.replace(/\.[a-z0-9]+$/i, "").replace(/\s*\(\d+\)\s*$/, "");
  if (e.exclusive) return base.replace(/\s*-\s*\d{4}-\d{2}-\d{2}\s*-\s*\d{4}-\d{2}-\d{2}.*$/, "").replace(/_\d{8}-\d{8}$/, "").trim();
  return base.trim();
}

export function extractToFacts(e: ParsedExtract, ctx: { client_id: string; period: string; file_id: string | null; file_name: string }): Fact[] {
  const doc = sourceDoc(e, ctx.file_name);
  const basis: Fact["basis"] = e.role === "bank" ? "tresorerie" : "engagement";
  const out: Fact[] = [];
  const push = (concept: string, amount: number) => {
    if (typeof amount !== "number" || !isFinite(amount)) return;
    out.push({ client_id: ctx.client_id, period: ctx.period, concept, amount: Math.round(amount * 100) / 100, source: e.parser, source_doc: doc,
      role: e.role ?? null, exclusive: !!e.exclusive, priority: e.priority ?? 0, file_id: ctx.file_id, basis,
      dedup_key: `${ctx.client_id}|${e.parser}|${doc}|${concept}|${ctx.period}` });
  };
  for (const [k, v] of Object.entries(e.values)) if (k !== "ca") push(k, v);
  // CA : uniquement le candidat d'une source au rôle « revenue » (même règle que la fusion actuelle).
  if (typeof e.revenueCandidate === "number") push("ca", e.revenueCandidate);
  return out;
}

// LECTURE : faits du mois → valeurs, avec la même logique que mergeParsed (additifs sommés, exclusifs par
// priorité, CA = sources « revenue » additives d'abord). Sert à la comparaison au centime avant bascule.
export function readFacts(facts: Fact[]): Record<string, number> {
  const byKey = new Map<string, Fact>(); for (const f of facts) byKey.set(f.dedup_key, f); // dédoublonnage
  const all = [...byKey.values()];
  const out: Record<string, number> = {};
  const concepts = new Set(all.map((f) => f.concept));
  for (const c of concepts) {
    const fs = all.filter((f) => f.concept === c);
    if (c === "ca") {
      const add = fs.filter((f) => !f.exclusive && f.role === "revenue"), ex = fs.filter((f) => f.exclusive && f.role === "revenue").sort((a, b) => b.priority - a.priority);
      if (add.length) out.ca = add.reduce((s, f) => s + f.amount, 0); else if (ex.length) out.ca = ex[0].amount;
      continue;
    }
    const ex = fs.filter((f) => f.exclusive).sort((a, b) => b.priority - a.priority);
    const add = fs.filter((f) => !f.exclusive);
    if (ex.length) out[c] = ex[0].amount; else if (add.length) out[c] = add.reduce((s, f) => s + f.amount, 0);
  }
  for (const k of Object.keys(out)) out[k] = Math.round(out[k] * 100) / 100;
  return out;
}

// Transactions brutes → lignes à écrire (clé stable par client).
export function bankRows(txs: BankTx[], ctx: { client_id: string; source: string; file_id: string | null }) {
  return txs.map((t) => ({ client_id: ctx.client_id, source: ctx.source, account: t.account, tx_date: t.date, amount: t.amount, currency: t.currency,
    label: t.label, counterparty: t.counterparty, file_id: ctx.file_id, dedup_key: `${ctx.client_id}|${t.dedup}` }));
}

// Transactions du registre → texte au FORMAT DE L'EXPORT PENNYLANE : relues par le même parser que les
// fichiers (mêmes règles de classement, mêmes soldes de référence) — une source API n'a pas de logique à part.
export function bankTxsToPennylaneCsv(txs: { tx_date: string; amount: number; label: string | null; account: string; currency?: string | null }[]): string {
  const q = (s: unknown) => { const v = String(s ?? ""); return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  return ["Date,Bank account,Wording,Amount,Currency,Justified",
    ...txs.map((t) => [t.tx_date, q(t.account), q(t.label ?? ""), String(t.amount), t.currency ?? "", "No"].join(","))].join("\n");
}

// Lecture bancaire d'un mois avec les RÈGLES DU MOMENT (catégories calculées, jamais stockées).
export function readBankMonth(txs: { tx_date: string; amount: number; label: string; account: string }[], period: string,
  rules: { match: string; category: string }[] = []): { inflow: number; debitsByCat: Record<string, number>; netFlow: number; accounts: string[] } {
  const ym = period.slice(0, 7);
  const debitsByCat: Record<string, number> = {}; let inflow = 0, net = 0;
  for (const t of txs) {
    if (t.tx_date.slice(0, 7) !== ym) continue;
    net += t.amount;
    if (t.amount >= 0) { inflow += t.amount; continue; }
    const { cat } = classifyDebit(t.label, rules);
    debitsByCat[cat] = (debitsByCat[cat] ?? 0) - t.amount;
  }
  const r2 = (x: number) => Math.round(x * 100) / 100;
  for (const k of Object.keys(debitsByCat)) debitsByCat[k] = r2(debitsByCat[k]);
  return { inflow: r2(inflow), debitsByCat, netFlow: r2(net), accounts: [...new Set(txs.map((t) => t.account))] };
}
