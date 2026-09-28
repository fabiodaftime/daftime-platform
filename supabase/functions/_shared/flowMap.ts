// CARTOGRAPHIE DES FLUX d'un dossier — module PUR partagé edge / front (aucun import Deno).
// Qui est qui (organigramme), où est l'argent (comptes), d'où il vient (encaissements, délais), où il part
// (décaissements : qui, depuis quel compte, à quel rythme, à quelles conditions), flux entre entités.
// Rédigée par l'IA à partir du contexte, des calls et du relevé ; relue et publiée par le conseiller.

export type Certainty = "confirmé" | "à confirmer";
export interface FlowEntity { id: string; name: string; kind: "société" | "personne" | "autre"; country?: string; role: string; parent?: string; link?: string }
export interface FlowAccount { id: string; name: string; bank?: string; entity?: string; kind: "banque" | "prestataire de paiement" | "carte" | "autre"; role: string; in_treasury: boolean }
export interface FlowIn { source: string; channel: string; account: string; amount_month?: number; delay: string; certainty: Certainty; note?: string }
export type OutCategory = "pub" | "stock" | "logistique" | "équipe" | "impôts & taxes" | "financement" | "outils" | "interne" | "autre";
export interface FlowOut { payee: string; category: OutCategory; account: string; via?: string; amount_month?: number; rhythm: string; terms: string; certainty: Certainty; note?: string }
export interface FlowInterco { from: string; to: string; nature: string; amount?: string; treatment: string }
export interface FlowMap {
  summary: string;
  entities: FlowEntity[];
  accounts: FlowAccount[];
  inflows: FlowIn[];
  outflows: FlowOut[];
  interco: FlowInterco[];
  open_questions: string[];
  generated_at?: string;
}

export const OUT_CATEGORIES: OutCategory[] = ["pub", "stock", "logistique", "équipe", "impôts & taxes", "financement", "outils", "interne", "autre"];

const S = (d: string) => ({ type: "string", description: d });
const N = (d: string) => ({ type: "number", description: d });
const CERT = { type: "string", enum: ["confirmé", "à confirmer"], description: "confirmé = dit en call / règle validée par le conseiller ; à confirmer = déduit du relevé" };
export const FLOW_TOOL = {
  name: "cartographie_flux",
  description: "Cartographie des flux d'argent du dossier, en français, tutoiement, sans jargon comptable.",
  input_schema: {
    type: "object",
    properties: {
      summary: S("3 phrases max : comment l'argent circule chez le client (d'où il vient, où il est, où il part)."),
      entities: { type: "array", items: { type: "object", properties: {
        id: S("identifiant court (ex. fr, uae, fondatrice)"), name: S("nom"), kind: { type: "string", enum: ["société", "personne", "autre"] },
        country: S("pays"), role: S("rôle en une phrase"), parent: S("id de l'entité qui la détient / dont elle dépend (optionnel)"), link: S("nature du lien avec le parent (ex. actionnaire 100 %, gérante)") },
        required: ["id", "name", "kind", "role"] } },
      accounts: { type: "array", items: { type: "object", properties: {
        id: S("identifiant court"), name: S("nom du compte tel qu'il apparaît"), bank: S("banque / prestataire"), entity: S("id de l'entité titulaire"),
        kind: { type: "string", enum: ["banque", "prestataire de paiement", "carte", "autre"] }, role: S("à quoi il sert"), in_treasury: { type: "boolean", description: "compté dans la trésorerie suivie" } },
        required: ["id", "name", "kind", "role", "in_treasury"] } },
      inflows: { type: "array", items: { type: "object", properties: {
        source: S("qui paye (ex. clients du shop)"), channel: S("moyen / prestataire (Shopify Payments, Klarna, PayPal…)"), account: S("id du compte crédité"),
        amount_month: N("montant mensuel récent (EUR), si connu"), delay: S("délai entre la vente et l'argent sur le compte"), certainty: CERT, note: S("précision utile") },
        required: ["source", "channel", "account", "delay", "certainty"] } },
      outflows: { type: "array", items: { type: "object", properties: {
        payee: S("qui est payé"), category: { type: "string", enum: OUT_CATEGORIES }, account: S("id du compte débité"), via: S("intermédiaire (ex. PayPal, carte)"),
        amount_month: N("montant mensuel récent (EUR), si connu"), rhythm: S("fréquence / mode (ex. prélevé au fil de la dépense, 2 fois par mois)"),
        terms: S("conditions de paiement (ex. avant réception, 30 jours fin de mois, inconnu)"), certainty: CERT, note: S("précision utile") },
        required: ["payee", "category", "account", "rhythm", "terms", "certainty"] } },
      interco: { type: "array", items: { type: "object", properties: {
        from: S("entité qui paye"), to: S("entité qui reçoit"), nature: S("nature (management fees, compte courant…)"), amount: S("montant / fréquence"), treatment: S("traitement dans l'analyse (ex. neutralisé en vue consolidée)") },
        required: ["from", "to", "nature", "treatment"] } },
      open_questions: { type: "array", items: S("question précise à poser au client pour compléter la carte") },
    },
    required: ["summary", "entities", "accounts", "inflows", "outflows", "interco", "open_questions"],
  },
};

const str = (x: unknown, max = 300) => (typeof x === "string" ? x.trim().slice(0, max) : "");
const num = (x: unknown) => (typeof x === "number" && isFinite(x) ? Math.round(x) : undefined);
const cert = (x: unknown): Certainty => (x === "confirmé" ? "confirmé" : "à confirmer");
const arr = <T>(x: unknown, f: (o: Record<string, unknown>) => T | null, max = 40): T[] =>
  (Array.isArray(x) ? x : []).slice(0, max).map((o) => (o && typeof o === "object" ? f(o as Record<string, unknown>) : null)).filter((v): v is T => v != null);

// Nettoyage défensif (sortie IA ou édition manuelle) : champs bornés, énumérations respectées.
export function sanitizeFlowMap(x: unknown): FlowMap {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  return {
    summary: str(o.summary, 800),
    entities: arr(o.entities, (e) => str(e.name) ? { id: str(e.id, 40) || str(e.name, 40), name: str(e.name, 120), kind: (["société", "personne"].includes(String(e.kind)) ? e.kind : "autre") as FlowEntity["kind"],
      ...(str(e.country) ? { country: str(e.country, 60) } : {}), role: str(e.role), ...(str(e.parent) ? { parent: str(e.parent, 40) } : {}), ...(str(e.link) ? { link: str(e.link, 120) } : {}) } : null, 15),
    accounts: arr(o.accounts, (a) => str(a.name) ? { id: str(a.id, 40) || str(a.name, 40), name: str(a.name, 120), ...(str(a.bank) ? { bank: str(a.bank, 80) } : {}), ...(str(a.entity) ? { entity: str(a.entity, 40) } : {}),
      kind: (["banque", "prestataire de paiement", "carte"].includes(String(a.kind)) ? a.kind : "autre") as FlowAccount["kind"], role: str(a.role), in_treasury: a.in_treasury === true } : null, 20),
    inflows: arr(o.inflows, (f) => str(f.channel) ? { source: str(f.source, 120) || "clients", channel: str(f.channel, 120), account: str(f.account, 40),
      ...(num(f.amount_month) != null ? { amount_month: num(f.amount_month) } : {}), delay: str(f.delay, 160) || "inconnu", certainty: cert(f.certainty), ...(str(f.note) ? { note: str(f.note) } : {}) } : null, 20),
    outflows: arr(o.outflows, (f) => str(f.payee) ? { payee: str(f.payee, 120), category: (OUT_CATEGORIES.includes(f.category as OutCategory) ? f.category : "autre") as OutCategory,
      account: str(f.account, 40), ...(str(f.via) ? { via: str(f.via, 80) } : {}), ...(num(f.amount_month) != null ? { amount_month: num(f.amount_month) } : {}),
      rhythm: str(f.rhythm, 160) || "inconnu", terms: str(f.terms, 160) || "inconnues", certainty: cert(f.certainty), ...(str(f.note) ? { note: str(f.note) } : {}) } : null, 30),
    interco: arr(o.interco, (f) => str(f.from) && str(f.to) ? { from: str(f.from, 80), to: str(f.to, 80), nature: str(f.nature, 160), ...(str(f.amount) ? { amount: str(f.amount, 120) } : {}), treatment: str(f.treatment, 200) } : null, 10),
    open_questions: (Array.isArray(o.open_questions) ? o.open_questions : []).map((q) => str(q, 240)).filter(Boolean).slice(0, 10),
    ...(str(o.generated_at) ? { generated_at: str(o.generated_at, 40) } : {}),
  };
}

// RÉSUMÉ DU RELEVÉ pour l'IA : par compte et par contrepartie, montants mensuels moyens (3 derniers mois),
// nombre d'opérations, catégorie selon les règles du dossier. Montants seulement — aucune donnée client final.
export interface DigestTx { tx_date: string; amount: number; account?: string | null; counterparty?: string | null; label?: string | null; cat?: string; rule?: string }
export function bankDigest(txs: DigestTx[], months: string[]): string {
  const inM = txs.filter((t) => months.includes(t.tx_date.slice(0, 7)));
  // Clé = compte + sens + contrepartie + CLASSEMENT : un même prestataire peut porter deux flux (ex. PayPal = pub ET prêt).
  const k = (t: DigestTx) => `${t.account ?? "?"}§${t.amount >= 0 ? "+" : "-"}§${(t.counterparty || t.label || "?").slice(0, 40)}§${t.cat ?? ""}`;
  const g = new Map<string, { n: number; s: number; cat?: string; rule?: string }>();
  for (const t of inM) { const x = g.get(k(t)) ?? { n: 0, s: 0, cat: t.cat, rule: t.rule }; x.n++; x.s += t.amount; g.set(k(t), x); }
  const rows = [...g.entries()].map(([key, v]) => { const [acc, sign, cp] = key.split("§"); return { acc, sign, cp, m: v.s / months.length, n: v.n, cat: v.cat, rule: v.rule }; })
    .filter((r) => Math.abs(r.m) >= 300).sort((a, b) => Math.abs(b.m) - Math.abs(a.m)).slice(0, 60);
  return rows.map((r) => `${r.acc} | ${r.sign === "+" ? "ENTRÉE" : "SORTIE"} | ${r.cp} | ${Math.round(Math.abs(r.m)).toLocaleString("fr-FR")} €/mois | ${r.n} opérations sur ${months.length} mois${r.cat ? ` | classé : ${r.cat}` : ""}${r.rule ? ` (${r.rule})` : ""}`).join("\n");
}
