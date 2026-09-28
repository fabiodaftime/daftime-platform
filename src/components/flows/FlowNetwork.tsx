// Écosystème du shop en « toile » : la société au centre, autour d'elle par famille — sociétés & associés,
// encaissements, fournisseurs, logistique, pub, équipe, État, banques & financement, outils. Chaque lien porte
// le flux mensuel (épaisseur) et son sens (flèche). Dérivé de la cartographie (aucune donnée en plus).
import { useMemo, useState } from 'react';
import type { FlowMap, OutCategory } from '../../../supabase/functions/_shared/flowMap';

type GroupKey = 'structure' | 'in' | Exclude<OutCategory, 'interne'>;
const GROUPS: { key: GroupKey; label: string; color: string }[] = [
  { key: 'structure', label: 'Sociétés & associés', color: '#1F2937' },
  { key: 'stock', label: 'Fournisseurs', color: '#7C3AED' },
  { key: 'logistique', label: 'Logistique', color: '#0F766E' },
  { key: 'pub', label: 'Pub', color: '#C2410C' },
  { key: 'outils', label: 'Outils', color: '#65A30D' },
  { key: 'autre', label: 'Autres', color: '#64748B' },
  { key: 'équipe', label: 'Équipe', color: '#2563EB' },
  { key: 'impôts & taxes', label: 'État', color: '#B7791F' },
  { key: 'financement', label: 'Banques & financement', color: '#BE185D' },
  { key: 'in', label: 'Encaissements', color: '#1E7B4F' },
];
const GCOLOR = Object.fromEntries(GROUPS.map((g) => [g.key, g.color])) as Record<GroupKey, string>;

interface Node { id: string; name: string; sub?: string; group: GroupKey; amount?: number; person?: boolean; x: number; y: number; angle: number }
interface Edge { from: string; to: string; amount?: number; color: string; dashed?: boolean; label?: string }

const W = 1100, H = 780, CX = W / 2, CY = H / 2 + 10, R = 290;
const k = (x: number) => (x >= 1000 ? `${Math.round(x / 1000).toLocaleString('fr-FR')} k€/mois` : `${Math.round(x)} €/mois`);
const cut = (s: string, n = 24) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function FlowNetwork({ map }: { map: FlowMap }) {
  const [hover, setHover] = useState<string | null>(null);

  const { center, nodes, edges, legend } = useMemo(() => {
    // Société au centre : la société racine qui porte le plus de flux.
    const acctEntity = new Map(map.accounts.map((a) => [a.id, a.entity]));
    const usage = (id: string) => map.outflows.filter((f) => (acctEntity.get(f.account) ?? '') === id).length + map.inflows.filter((f) => (acctEntity.get(f.account) ?? '') === id).length;
    const companies = map.entities.filter((e) => e.kind === 'société');
    const main = [...companies].sort((a, b) => (a.parent ? 1 : 0) - (b.parent ? 1 : 0) || usage(b.id) - usage(a.id))[0] ?? map.entities[0];
    const centerNode = { id: main?.id ?? 'shop', name: main?.name ?? 'Le shop' };

    // Un bénéficiaire qui est une entité du dossier (ex. la société sœur qui reçoit des management fees) → son nœud.
    const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "");
    const entityOf = (name: string) => { const n = norm(name); return map.entities.find((e) => { const en = norm(e.name); return en.length >= 6 && (n.startsWith(en.slice(0, 12)) || en.startsWith(n.slice(0, 12))); }); };
    // Membres par famille.
    const members: Record<GroupKey, Omit<Node, 'x' | 'y' | 'angle'>[]> = Object.fromEntries(GROUPS.map((g) => [g.key, []])) as never;
    for (const e of map.entities) if (e.id !== centerNode.id) members.structure.push({ id: `e:${e.id}`, name: e.name, sub: e.link || e.role, group: 'structure', person: e.kind === 'personne' });
    for (const f of map.inflows) members.in.push({ id: `in:${f.channel}`, name: f.channel, group: 'in', amount: f.amount_month });
    for (const f of map.outflows) if (f.category !== 'interne' && !entityOf(f.payee)) {
      const g = f.category as GroupKey; const id = `out:${f.payee}`;
      const ex = members[g].find((m) => m.id === id);
      if (ex) ex.amount = (ex.amount ?? 0) + (f.amount_month ?? 0); else members[g].push({ id, name: f.payee, group: g, amount: f.amount_month });
    }
    const groups = GROUPS.filter((g) => members[g.key].length);
    // Secteurs proportionnels au nombre de membres (minimum pour les familles d'un seul membre) ; structure en haut.
    const weight = (g: GroupKey) => (g === 'structure' ? Math.max(members[g].length * 1.8, 3) : Math.max(members[g].length, 1.6));
    const total = groups.reduce((s, g) => s + weight(g.key), 0);
    const nodes: Node[] = [];
    let a0 = -Math.PI / 2 - (weight(groups[0]?.key ?? 'structure') / total) * Math.PI; // centre la 1re famille sur le haut
    const legend: { key: GroupKey; label: string; color: string; mid: number }[] = [];
    for (const g of groups) {
      const span = (weight(g.key) / total) * 2 * Math.PI, list = members[g.key];
      list.sort((x, y) => (y.amount ?? 0) - (x.amount ?? 0));
      list.forEach((m, i) => {
        const ang = a0 + span * ((i + 0.5) / list.length);
        nodes.push({ ...m, angle: ang, x: CX + R * Math.cos(ang), y: CY + R * Math.sin(ang) });
      });
      legend.push({ key: g.key, label: g.label, color: g.color, mid: a0 + span / 2 });
      a0 += span;
    }

    // Liens : encaissements → centre ; centre (ou entité qui paye) → bénéficiaire ; structure (parent, interco, dirigeant).
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const edges: Edge[] = [];
    const payer = (account: string) => { const ent = acctEntity.get(account); return ent && ent !== centerNode.id && byId.has(`e:${ent}`) ? `e:${ent}` : 'center'; };
    for (const f of map.inflows) edges.push({ from: `in:${f.channel}`, to: payer(f.account), amount: f.amount_month, color: GCOLOR.in });
    const seen = new Set<string>();
    for (const f of map.outflows) if (f.category !== 'interne') {
      const ent = entityOf(f.payee);
      const from = payer(f.account), to = ent ? (ent.id === centerNode.id ? 'center' : `e:${ent.id}`) : `out:${f.payee}`, key = `${from}>${to}`;
      const ex = edges.find((e) => `${e.from}>${e.to}` === key);
      if (ex) ex.amount = (ex.amount ?? 0) + (f.amount_month ?? 0); else if (!seen.has(key) && from !== to) { seen.add(key); edges.push({ from, to, amount: f.amount_month, color: ent ? GCOLOR.structure : GCOLOR[f.category as GroupKey], ...(ent ? { label: f.payee } : {}) }); }
    }
    const entByName = (s: string) => map.entities.find((e) => e.id === s || e.name.toLowerCase() === s.toLowerCase() || s.toLowerCase().includes(e.id.toLowerCase()));
    for (const e of map.entities) if (e.parent && e.id !== centerNode.id) {
      const p = e.parent === centerNode.id ? 'center' : `e:${e.parent}`;
      if (p === 'center' || byId.has(p)) edges.push({ from: p, to: `e:${e.id}`, color: GCOLOR.structure, label: e.link });
    }
    for (const f of map.interco) {
      const a = entByName(f.from), b = entByName(f.to);
      const A = a ? (a.id === centerNode.id ? 'center' : `e:${a.id}`) : null, B = b ? (b.id === centerNode.id ? 'center' : `e:${b.id}`) : null;
      if (A && B && A !== B && !edges.some((e) => e.from === A && e.to === B && e.dashed)) edges.push({ from: A, to: B, color: GCOLOR.structure, dashed: true, label: f.nature });
    }
    // Entités sans aucun lien (ex. dirigeant) : rattachées au centre en pointillé.
    for (const n of nodes) if (n.group === 'structure' && !edges.some((e) => e.from === n.id || e.to === n.id))
      edges.push({ from: n.id, to: 'center', color: GCOLOR.structure, dashed: true, label: n.sub });
    return { center: centerNode, nodes, edges, legend };
  }, [map]);

  const max = Math.max(1, ...edges.map((e) => e.amount ?? 0));
  const pos = (id: string) => (id === 'center' ? { x: CX, y: CY } : nodes.find((n) => n.id === id) ?? { x: CX, y: CY });
  const active = (e: Edge) => !hover || e.from === hover || e.to === hover || (hover === 'center' && (e.from === 'center' || e.to === 'center'));
  const nodeOn = (id: string) => !hover || hover === id || edges.some((e) => active(e) && (e.from === id || e.to === id));

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-2 text-xs">
        {legend.map((g) => (
          <span key={g.key} className="inline-flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: g.color }} />{g.label}</span>
        ))}
        <span className="text-muted-foreground">● personne · ■ société ou prestataire</span>
      </div>
      <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[720px] w-full h-auto select-none" role="img" aria-label="Écosystème du shop">
        <defs>
          {[...new Set(edges.map((e) => e.color))].map((c) => (
            <marker key={c} id={`arr-${c.slice(1)}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={c} />
            </marker>
          ))}
        </defs>
        {/* Anneau guide */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} />
        {/* Liens */}
        {edges.map((e, i) => {
          const a = pos(e.from), b = pos(e.to);
          const mx = (a.x + b.x) / 2 + (CY - (a.y + b.y) / 2) * 0.12, my = (a.y + b.y) / 2 + ((a.x + b.x) / 2 - CX) * 0.12;
          // on raccourcit l'extrémité pour que la flèche s'arrête au bord du nœud
          const tx = b.x - (b.x - mx) * (e.to === 'center' ? 0.2 : 0.07), ty = b.y - (b.y - my) * (e.to === 'center' ? 0.2 : 0.07);
          const w = e.amount ? 1.5 + 9 * Math.sqrt(e.amount / max) : 1.4;
          return (
            <path key={i} d={`M${a.x},${a.y} Q${mx},${my} ${tx},${ty}`} fill="none" stroke={e.color} strokeWidth={w} strokeOpacity={active(e) ? 0.55 : 0.07}
              strokeDasharray={e.dashed ? '6 5' : undefined} markerEnd={`url(#arr-${e.color.slice(1)})`}>
              <title>{[e.label, e.amount ? k(e.amount) : ''].filter(Boolean).join(' · ')}</title>
            </path>
          );
        })}
        {/* Nœuds */}
        {nodes.map((n) => {
          const c = GCOLOR[n.group], right = Math.cos(n.angle) > 0.12, left = Math.cos(n.angle) < -0.12;
          const idx = nodes.indexOf(n);
          const lx = n.x + Math.cos(n.angle) * 22, ly = n.y + Math.sin(n.angle) * 22;
          const anchor = right ? 'start' : left ? 'end' : 'middle';
          const dy = !right && !left ? (Math.sin(n.angle) > 0 ? 14 + (idx % 2) * 28 : -18 - (idx % 2) * 28) : 0;
          return (
            <g key={n.id} opacity={nodeOn(n.id) ? 1 : 0.18} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
              <circle cx={n.x} cy={n.y} r={n.group === 'structure' ? 13 : 10} fill="#fff" stroke={c} strokeWidth={2.5} />
              {n.person ? <circle cx={n.x} cy={n.y} r={4} fill={c} /> : <rect x={n.x - 4} y={n.y - 4} width={8} height={8} rx={1.5} fill={c} />}
              <text x={lx} y={ly + dy} textAnchor={anchor} fontSize={12.5} fontWeight={600} fill="currentColor">{cut(n.name)}</text>
              {(n.amount || n.group === 'structure') && (
                <text x={lx} y={ly + dy + 15} textAnchor={anchor} fontSize={11} fill="#6B7280">{n.amount ? k(n.amount) : cut(n.sub ?? '', 34)}</text>
              )}
              <title>{[n.name, n.sub, n.amount ? k(n.amount) : ''].filter(Boolean).join(' — ')}</title>
            </g>
          );
        })}
        {/* Centre */}
        <g onMouseEnter={() => setHover('center')} onMouseLeave={() => setHover(null)}>
          <circle cx={CX} cy={CY} r={58} fill="#1F2937" />
          <text x={CX} y={CY - 2} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">{cut(center.name, 16)}</text>
          <text x={CX} y={CY + 15} textAnchor="middle" fontSize={10} fill="#D1D5DB">le shop</text>
        </g>
      </svg>
      </div>
    </div>
  );
}
