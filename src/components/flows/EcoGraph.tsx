// Rendu SVG commun des vues « Cercle » et « Réseau » : liens (épaisseur = flux mensuel, flèche = sens,
// pointillés = lien sans flux régulier), nœuds par famille, société au centre, survol qui isole les liens.
// Les vues ne diffèrent que par le placement des points (positions fournies).
import { useState } from 'react';
import { GCOLOR, cut, kMonth, type EcoEdge, type Ecosystem } from './ecosystem';

export interface Placed { x: number; y: number }

export function EcoLegend({ eco }: { eco: Ecosystem }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-2 text-xs">
      {eco.groups.map((g) => (
        <span key={g.key} className="inline-flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: g.color }} />{g.label}</span>
      ))}
      <span className="text-muted-foreground">● personne · ■ société ou prestataire</span>
    </div>
  );
}

export function EcoGraph({ eco, pos, center, width, height, bulge = 0.12, stagger = true }: {
  eco: Ecosystem; pos: Map<string, Placed>; center: Placed; width: number; height: number; bulge?: number;
  stagger?: boolean; // décale en hauteur un libellé sur deux en haut / en bas (utile en couronne, pas en réseau libre)
}) {
  const [hover, setHover] = useState<string | null>(null);
  const nodes = eco.groups.flatMap((g) => eco.members[g.key]).filter((n) => pos.has(n.id));
  const P = (id: string) => (id === 'center' ? center : pos.get(id) ?? center);
  const max = Math.max(1, ...eco.edges.map((e) => e.amount ?? 0));
  const active = (e: EcoEdge) => !hover || e.from === hover || e.to === hover;
  const nodeOn = (id: string) => !hover || hover === id || eco.edges.some((e) => active(e) && (e.from === id || e.to === id));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px] w-full h-auto select-none" role="img" aria-label="Écosystème du shop">
        <defs>
          {[...new Set(eco.edges.map((e) => e.color))].map((c) => (
            <marker key={c} id={`arr-${c.slice(1)}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={c} />
            </marker>
          ))}
        </defs>
        {eco.edges.map((e, i) => {
          const a = P(e.from), b = P(e.to);
          const mx = (a.x + b.x) / 2 + (center.y - (a.y + b.y) / 2) * bulge, my = (a.y + b.y) / 2 + ((a.x + b.x) / 2 - center.x) * bulge;
          // l'extrémité s'arrête au bord du nœud (plus large pour la société au centre)
          const stop = e.to === 'center' ? 0.2 : 0.07;
          const tx = b.x - (b.x - mx) * stop, ty = b.y - (b.y - my) * stop;
          const w = e.amount ? 1.5 + 9 * Math.sqrt(e.amount / max) : 1.4;
          return (
            <path key={i} d={`M${a.x},${a.y} Q${mx},${my} ${tx},${ty}`} fill="none" stroke={e.color} strokeWidth={w} strokeOpacity={active(e) ? 0.55 : 0.07}
              strokeDasharray={e.dashed ? '6 5' : undefined} markerEnd={`url(#arr-${e.color.slice(1)})`}>
              <title>{[e.label, e.amount ? kMonth(e.amount) : ''].filter(Boolean).join(' · ')}</title>
            </path>
          );
        })}
        {nodes.map((n, idx) => {
          const p = pos.get(n.id)!, ang = Math.atan2(p.y - center.y, p.x - center.x);
          const c = GCOLOR[n.group], right = Math.cos(ang) > 0.12, left = Math.cos(ang) < -0.12;
          const lx = p.x + Math.cos(ang) * 22, ly = p.y + Math.sin(ang) * 22;
          const anchor = right ? 'start' : left ? 'end' : 'middle';
          const alt = stagger ? (idx % 2) * 28 : 0;
          const dy = !right && !left ? (Math.sin(ang) > 0 ? 14 + alt : -18 - alt) : 0;
          return (
            <g key={n.id} opacity={nodeOn(n.id) ? 1 : 0.18} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}>
              <circle cx={p.x} cy={p.y} r={n.group === 'structure' ? 13 : 10} fill="#fff" stroke={c} strokeWidth={2.5} />
              {n.person ? <circle cx={p.x} cy={p.y} r={4} fill={c} /> : <rect x={p.x - 4} y={p.y - 4} width={8} height={8} rx={1.5} fill={c} />}
              <text x={lx} y={ly + dy} textAnchor={anchor} fontSize={12.5} fontWeight={600} fill="currentColor">{cut(n.name)}</text>
              {(n.amount || n.group === 'structure') && (
                <text x={lx} y={ly + dy + 15} textAnchor={anchor} fontSize={11} fill="#6B7280">{n.amount ? kMonth(n.amount) : cut(n.sub ?? '', 34)}</text>
              )}
              <title>{[n.name, n.sub, n.amount ? kMonth(n.amount) : ''].filter(Boolean).join(' — ')}</title>
            </g>
          );
        })}
        <g onMouseEnter={() => setHover('center')} onMouseLeave={() => setHover(null)}>
          <circle cx={center.x} cy={center.y} r={58} fill="#1F2937" />
          <text x={center.x} y={center.y - 2} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">{cut(eco.center.name, 16)}</text>
          <text x={center.x} y={center.y + 15} textAnchor="middle" fontSize={10} fill="#D1D5DB">le shop</text>
        </g>
      </svg>
    </div>
  );
}
