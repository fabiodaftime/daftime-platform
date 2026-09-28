// Qualification des CONTREPARTIES bancaires (débits non reconnus par les règles et le classement intégré).
// Module PUR : prompt + schéma de l'outil IA, tri auto / proposition, fusion des règles.
// Principe (doctrine : fait / hypothèse) :
//  - l'IA ne reçoit QUE des libellés de contrepartie et des montants (jamais IBAN, lignes complètes, noms de fichiers) ;
//  - confiance ≥ seuil → règle du dossier marquée « IA » (appliquée, visible et révocable dans la revue) ;
//  - en dessous → PROPOSITION : rien n'est appliqué tant que le conseiller ne l'a pas validée ;
//  - une contrepartie « universelle » (même nature chez tous les clients : Qonto, Alan, Canva…) alimente
//    le dictionnaire global std_counterparties ; jamais une personne, un fournisseur de stock ni PayPal.

export const CP_CATEGORIES = ["ads", "stock", "internal", "loan", "payroll", "tools", "logistics", "tax", "vat", "bankfees", "other", "ignore"] as const;
export type CpCategory = typeof CP_CATEGORIES[number];
export const CP_CATEGORY_LABELS: Record<CpCategory, string> = {
  ads: "Publicité", stock: "Achats de stock", internal: "Virement interne / apport", loan: "Emprunt (capital)",
  payroll: "Salaires / rémunération", tools: "Logiciels / abonnements", logistics: "Logistique / transport",
  tax: "Impôts", vat: "TVA", bankfees: "Frais bancaires", other: "Autre charge", ignore: "À exclure",
};
export const AUTO_THRESHOLD = 0.9;

export interface BankRule { match: string; category: string; label?: string; source?: "ia" | "staff"; confidence?: number; amount?: number }
// Identité d'une règle : fragment de libellé + montant exact éventuel (deux règles « paypal » peuvent coexister).
export const ruleKey = (r: { match: string; amount?: number | null }) => `${normMatch(r.match)}|${r.amount ?? ""}`;
export interface Proposal { match: string; category: CpCategory; label: string; confidence: number; amount: number; period: string; reason?: string }
export interface Classified { counterparty: string; match: string; category: CpCategory; label: string; confidence: number; universal: boolean; reason?: string }

export const normMatch = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

// Contreparties déjà traitées (règle, proposition en attente, refus) → jamais re-demandées à l'IA.
export function toClassify(unqualified: { label: string; value: number }[], known: string[]): { label: string; value: number }[] {
  const k = known.map(normMatch).filter(Boolean);
  const seen = new Set<string>();
  return unqualified.filter((u) => {
    const l = normMatch(u.label);
    if (!l || seen.has(l) || k.some((m) => l.includes(m) || m.includes(l))) return false;
    seen.add(l); return true;
  });
}

export const CLASSIFY_SYSTEM = (activity: string) => `Tu qualifies des DÉBITS BANCAIRES d'une entreprise « ${activity} » (e-commerce le plus souvent) pour un conseiller financier.
Pour chaque contrepartie, donne la catégorie la plus probable et une confiance HONNÊTE entre 0 et 1.

Catégories : ads (régie publicitaire, agence média), stock (fournisseur de marchandises, fabricant, emballages), internal (virement vers un autre compte de l'entreprise ou du dirigeant, apport), loan (échéance d'emprunt), payroll (salaires, rémunération du dirigeant, freelances), tools (logiciels, SaaS, abonnements), logistics (transport, 3PL, douane), tax (impôts), vat (TVA), bankfees (frais bancaires), other (autre charge d'exploitation : loyer, honoraires, assurances…), ignore (à exclure).

Règles de confiance :
- ≥ 0.9 seulement si le nom désigne sans ambiguïté un acteur connu dont la nature ne dépend pas du client (ex. « Qonto » frais bancaires, « Canva » logiciel, « URSSAF » social).
- PayPal, Stripe, Amazon, une carte bancaire (« débit mensuel carte »), un virement à une PERSONNE ou à une société inconnue : confiance ≤ 0.6 (la nature dépend du dossier).
- « universal » = true uniquement pour un acteur connu dont la catégorie est la même chez TOUS les clients ; jamais pour une personne, un fournisseur de stock ou un intermédiaire de paiement.
- « match » = fragment STABLE et distinctif du libellé, en minuscules, recopié tel quel depuis le libellé (sans numéros, dates ni références variables).
- « label » = ce que c'est, en clair, en français (ex. « abonnement Canva »).`;

export const CLASSIFY_TOOL = {
  name: "qualify_counterparties",
  description: "Catégorie probable de chaque contrepartie bancaire, avec confiance honnête.",
  input_schema: {
    type: "object",
    properties: {
      items: { type: "array", items: { type: "object", properties: {
        counterparty: { type: "string", description: "libellé EXACT reçu" },
        match: { type: "string" },
        category: { type: "string", enum: [...CP_CATEGORIES] },
        label: { type: "string" },
        confidence: { type: "number" },
        universal: { type: "boolean" },
        reason: { type: "string", description: "une phrase courte" },
      }, required: ["counterparty", "match", "category", "label", "confidence", "universal"], additionalProperties: false } },
    },
    required: ["items"],
    additionalProperties: false,
  },
};

export const classifyUserText = (items: { label: string; value: number }[], currency: string) =>
  `Contreparties (libellé | montant débité ce mois en ${currency}) :\n${items.map((u) => `- ${u.label} | ${Math.round(u.value)}`).join("\n")}`;

// Valide la sortie IA : contrepartie connue, « match » réellement contenu dans le libellé, catégorie valide.
export function sanitizeClassified(raw: unknown, asked: { label: string }[]): Classified[] {
  const items = (raw as { items?: unknown[] } | null)?.items ?? [];
  const byNorm = new Map(asked.map((a) => [normMatch(a.label), a.label]));
  const out: Classified[] = [];
  for (const it of items as Record<string, unknown>[]) {
    const cp = byNorm.get(normMatch(String(it.counterparty ?? "")));
    if (!cp || !(CP_CATEGORIES as readonly string[]).includes(String(it.category))) continue;
    let match = normMatch(String(it.match ?? ""));
    if (match.length < 3 || !normMatch(cp).includes(match)) match = normMatch(cp);
    const conf = Math.max(0, Math.min(1, Number(it.confidence) || 0));
    out.push({ counterparty: cp, match, category: it.category as CpCategory, label: String(it.label ?? cp).slice(0, 80), confidence: conf,
      universal: it.universal === true && conf >= AUTO_THRESHOLD, reason: it.reason ? String(it.reason).slice(0, 160) : undefined });
  }
  return out;
}

// Seuil → règles appliquées (IA) vs propositions (à valider). « other »/« ignore » restent des propositions :
// l'IA ne décide jamais seule de sortir une dépense du résultat ni de la ranger en charge fourre-tout.
export function splitByConfidence(cls: Classified[], amounts: Map<string, number>, period: string, threshold = AUTO_THRESHOLD): { auto: BankRule[]; proposals: Proposal[]; universal: Classified[] } {
  const auto: BankRule[] = [], proposals: Proposal[] = [], universal: Classified[] = [];
  for (const c of cls) {
    const autoOk = c.confidence >= threshold && c.category !== "other" && c.category !== "ignore";
    if (autoOk) { auto.push({ match: c.match, category: c.category, label: c.label, source: "ia", confidence: Math.round(c.confidence * 100) / 100 }); if (c.universal) universal.push(c); }
    else proposals.push({ match: c.match, category: c.category, label: c.label, confidence: Math.round(c.confidence * 100) / 100,
      amount: Math.round((amounts.get(c.counterparty) ?? 0) * 100) / 100, period, ...(c.reason ? { reason: c.reason } : {}) });
  }
  return { auto, proposals, universal };
}

// Revue par le conseiller (panneau « Contreparties »). Toute décision humaine devient une règle « staff ».
//  accept / set : règle (retire la proposition correspondante) · reject : proposition écartée, jamais redemandée ·
//  delete : règle retirée (une règle IA retirée passe en « rejetée » pour ne pas être recréée).
export type RuleOp = { op: "accept" | "set" | "reject" | "delete"; match: string; category?: string; label?: string; amount?: number };
export interface RuleState { bank_rules?: BankRule[]; bank_rule_proposals?: Proposal[]; bank_rules_rejected?: string[] }
export function applyRuleOps(state: RuleState, ops: RuleOp[]): Required<RuleState> {
  let rules = [...(state.bank_rules ?? [])], props = [...(state.bank_rule_proposals ?? [])];
  const rejected = new Set((state.bank_rules_rejected ?? []).map(normMatch));
  for (const o of ops) {
    const k = normMatch(o.match ?? ""); if (k.length < 2) continue;
    const same = (r: BankRule) => ruleKey(r) === ruleKey({ match: k, amount: o.amount });
    if (o.op === "accept" || o.op === "set") {
      if (!(CP_CATEGORIES as readonly string[]).includes(String(o.category))) continue;
      const prev = rules.find(same) ?? props.find((p) => normMatch(p.match) === k);
      rules = [...rules.filter((r) => !same(r)), { match: k, category: o.category!, label: o.label ?? prev?.label, source: "staff", ...(o.amount != null ? { amount: o.amount } : {}) }];
      props = props.filter((p) => normMatch(p.match) !== k); rejected.delete(k);
    } else if (o.op === "reject") {
      props = props.filter((p) => normMatch(p.match) !== k); rejected.add(k);
    } else if (o.op === "delete") {
      const r = rules.find(same);
      rules = rules.filter((x) => !same(x));
      if (r?.source === "ia") rejected.add(k);
    }
  }
  return { bank_rules: rules, bank_rule_proposals: props, bank_rules_rejected: [...rejected] };
}

// Fusion par « match » : une règle du conseiller n'est jamais écrasée par une règle IA.
export function mergeRules(existing: BankRule[], incoming: BankRule[]): BankRule[] {
  const m = new Map(existing.map((r) => [ruleKey(r), r]));
  for (const r of incoming) {
    const k = ruleKey(r); const cur = m.get(k);
    if (cur && cur.source !== "ia" && r.source === "ia") continue;
    m.set(k, { ...r, match: normMatch(r.match) });
  }
  return [...m.values()];
}
