// Écosystème d'un dossier, dérivé de la cartographie des flux — commun aux trois vues (organigramme, réseau, cercle).
// Acteurs rangés par famille + liens (montant mensuel, sens, nature). Aucune donnée en plus de la carte.
import type { FlowMap, OutCategory } from '../../../supabase/functions/_shared/flowMap';

export type GroupKey = 'structure' | 'in' | Exclude<OutCategory, 'interne'>;
export const GROUPS: { key: GroupKey; label: string; color: string; hint: string }[] = [
  { key: 'structure', label: 'Sociétés & associés', color: '#1F2937', hint: '' },
  { key: 'in', label: 'Encaissements', color: '#1E7B4F', hint: 'te payent' },
  { key: 'stock', label: 'Fournisseurs', color: '#7C3AED', hint: 'tu payes' },
  { key: 'logistique', label: 'Logistique', color: '#0F766E', hint: 'tu payes' },
  { key: 'pub', label: 'Pub', color: '#C2410C', hint: 'tu payes' },
  { key: 'équipe', label: 'Équipe', color: '#2563EB', hint: 'tu payes' },
  { key: 'impôts & taxes', label: 'État', color: '#B7791F', hint: 'tu payes' },
  { key: 'financement', label: 'Banques & financement', color: '#BE185D', hint: 'tu rembourses' },
  { key: 'outils', label: 'Outils', color: '#65A30D', hint: 'tu payes' },
  { key: 'autre', label: 'Autres', color: '#64748B', hint: 'tu payes' },
];
export const GCOLOR = Object.fromEntries(GROUPS.map((g) => [g.key, g.color])) as Record<GroupKey, string>;

export interface EcoNode { id: string; name: string; sub?: string; group: GroupKey; amount?: number; person?: boolean; entityId?: string; payer?: string }
export interface EcoEdge { from: string; to: string; amount?: number; color: string; dashed?: boolean; label?: string }
export interface Ecosystem {
  center: { id: string; name: string };
  members: Record<GroupKey, EcoNode[]>;      // triés par montant décroissant
  groups: typeof GROUPS;                     // familles présentes, dans l'ordre d'affichage
  edges: EcoEdge[];                          // 'center' = la société au centre
}

export const kMonth = (x: number) => (x >= 1000 ? `${Math.round(x / 1000).toLocaleString('fr-FR')} k€/mois` : `${Math.round(x)} €/mois`);
export const cut = (s: string, n = 24) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function buildEcosystem(map: FlowMap): Ecosystem {
  // Société au centre : la société racine qui porte le plus de flux.
  const acctEntity = new Map(map.accounts.map((a) => [a.id, a.entity]));
  const usage = (id: string) => map.outflows.filter((f) => (acctEntity.get(f.account) ?? '') === id).length + map.inflows.filter((f) => (acctEntity.get(f.account) ?? '') === id).length;
  const companies = map.entities.filter((e) => e.kind === 'société');
  const main = [...companies].sort((a, b) => (a.parent ? 1 : 0) - (b.parent ? 1 : 0) || usage(b.id) - usage(a.id))[0] ?? map.entities[0];
  const center = { id: main?.id ?? 'shop', name: main?.name ?? 'Le shop' };

  // Un bénéficiaire qui est une entité du dossier (ex. la société sœur qui reçoit des management fees) → son nœud.
  const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
  const entityOf = (name: string) => { const n = norm(name); return map.entities.find((e) => { const en = norm(e.name); return en.length >= 6 && (n.startsWith(en.slice(0, 12)) || en.startsWith(n.slice(0, 12))); }); };
  const nodeOfEntity = (id: string) => (id === center.id ? 'center' : `e:${id}`);
  const payer = (account: string) => { const ent = acctEntity.get(account); return ent && ent !== center.id && map.entities.some((e) => e.id === ent) ? `e:${ent}` : 'center'; };

  const members = Object.fromEntries(GROUPS.map((g) => [g.key, []])) as unknown as Record<GroupKey, EcoNode[]>;
  for (const e of map.entities) if (e.id !== center.id) members.structure.push({ id: `e:${e.id}`, name: e.name, sub: e.link || e.role, group: 'structure', person: e.kind === 'personne', entityId: e.id });
  for (const f of map.inflows) members.in.push({ id: `in:${f.channel}`, name: f.channel, group: 'in', amount: f.amount_month, payer: payer(f.account) });
  for (const f of map.outflows) if (f.category !== 'interne' && !entityOf(f.payee)) {
    const g = f.category as GroupKey; const id = `out:${f.payee}`;
    const ex = members[g].find((m) => m.id === id);
    if (ex) ex.amount = (ex.amount ?? 0) + (f.amount_month ?? 0); else members[g].push({ id, name: f.payee, group: g, amount: f.amount_month, payer: payer(f.account) });
  }
  for (const g of GROUPS) if (g.key !== 'structure') members[g.key].sort((x, y) => (y.amount ?? 0) - (x.amount ?? 0));
  const groups = GROUPS.filter((g) => members[g.key].length);

  // Liens : encaissements → centre ; centre (ou entité qui paye) → bénéficiaire ; structure (détention, interco, dirigeant).
  const edges: EcoEdge[] = [];
  for (const f of map.inflows) edges.push({ from: `in:${f.channel}`, to: payer(f.account), amount: f.amount_month, color: GCOLOR.in });
  for (const f of map.outflows) if (f.category !== 'interne') {
    const ent = entityOf(f.payee);
    const from = payer(f.account), to = ent ? nodeOfEntity(ent.id) : `out:${f.payee}`;
    if (from === to) continue;
    const ex = edges.find((e) => e.from === from && e.to === to && !e.dashed);
    if (ex) ex.amount = (ex.amount ?? 0) + (f.amount_month ?? 0);
    else edges.push({ from, to, amount: f.amount_month, color: ent ? GCOLOR.structure : GCOLOR[f.category as GroupKey], ...(ent ? { label: f.payee } : {}) });
  }
  const entByName = (s: string) => map.entities.find((e) => e.id === s || e.name.toLowerCase() === s.toLowerCase() || s.toLowerCase().includes(e.id.toLowerCase()));
  for (const e of map.entities) if (e.parent && e.id !== center.id && map.entities.some((x) => x.id === e.parent)) {
    edges.push({ from: nodeOfEntity(e.parent), to: `e:${e.id}`, color: GCOLOR.structure, label: e.link });
  }
  for (const f of map.interco) {
    const a = entByName(f.from), b = entByName(f.to);
    const A = a ? nodeOfEntity(a.id) : null, B = b ? nodeOfEntity(b.id) : null;
    if (A && B && A !== B && !edges.some((e) => e.from === A && e.to === B && e.dashed)) edges.push({ from: A, to: B, color: GCOLOR.structure, dashed: true, label: f.nature });
  }
  // Entités sans aucun lien (ex. dirigeant) : rattachées au centre en pointillé.
  for (const n of members.structure) if (!edges.some((e) => e.from === n.id || e.to === n.id))
    edges.push({ from: n.id, to: 'center', color: GCOLOR.structure, dashed: true, label: n.sub });
  return { center, members, groups, edges };
}
