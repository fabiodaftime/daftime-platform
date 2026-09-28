// Écosystème du shop — trois lectures des mêmes données (cartographie des flux) :
//  - Organigramme : associés en haut, sociétés au milieu, parties prenantes par famille en dessous ;
//  - Réseau : placement libre par attraction des liens (les acteurs les plus liés se rapprochent) ;
//  - Cercle : la société au centre, les familles en couronne.
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { FlowMap } from '../../../supabase/functions/_shared/flowMap';
import { buildEcosystem, cut, GCOLOR, kMonth, type EcoNode, type Ecosystem, type GroupKey } from './ecosystem';
import { EcoGraph, EcoLegend, type Placed } from './EcoGraph';

const W = 1100, H = 780;

// ---- Cercle -------------------------------------------------------------------------------------------
const RADIAL_ORDER: GroupKey[] = ['structure', 'stock', 'logistique', 'pub', 'outils', 'autre', 'équipe', 'impôts & taxes', 'financement', 'in'];
function radialLayout(eco: Ecosystem): { pos: Map<string, Placed>; center: Placed } {
  const center = { x: W / 2, y: H / 2 + 10 }, R = 290;
  const groups = RADIAL_ORDER.filter((g) => eco.members[g].length);
  const weight = (g: GroupKey) => (g === 'structure' ? Math.max(eco.members[g].length * 1.8, 3) : Math.max(eco.members[g].length, 1.6));
  const total = groups.reduce((s, g) => s + weight(g), 0);
  const pos = new Map<string, Placed>();
  let a0 = -Math.PI / 2 - (weight(groups[0] ?? 'structure') / total) * Math.PI;
  for (const g of groups) {
    const span = (weight(g) / total) * 2 * Math.PI, list = eco.members[g];
    list.forEach((m, i) => { const ang = a0 + span * ((i + 0.5) / list.length); pos.set(m.id, { x: center.x + R * Math.cos(ang), y: center.y + R * Math.sin(ang) }); });
    a0 += span;
  }
  return { pos, center };
}

// ---- Réseau (forces, déterministe) --------------------------------------------------------------------
function forceLayout(eco: Ecosystem): { pos: Map<string, Placed>; center: Placed } {
  const start = radialLayout(eco);
  const ids = [...start.pos.keys()];
  const p = new Map<string, { x: number; y: number; vx: number; vy: number }>([['center', { ...start.center, vx: 0, vy: 0 }], ...ids.map((id) => [id, { ...start.pos.get(id)!, vx: 0, vy: 0 }] as const)]);
  const groupOf = new Map(eco.groups.flatMap((g) => eco.members[g.key].map((m) => [m.id, g.key] as const)));
  const max = Math.max(1, ...eco.edges.map((e) => e.amount ?? 0));
  const all = ['center', ...ids];
  for (let it = 0; it < 450; it++) {
    const cool = 1 - it / 450;
    // répulsion entre tous les nœuds
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const a = p.get(all[i])!, b = p.get(all[j])!; let dx = a.x - b.x, dy = a.y - b.y; const d2 = Math.max(dx * dx + dy * dy, 100);
      const f = 24000 / d2, d = Math.sqrt(d2); dx /= d; dy /= d;
      a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
    }
    // ressorts le long des liens : plus le flux est gros, plus le lien est court
    for (const e of eco.edges) {
      const a = p.get(e.from), b = p.get(e.to); if (!a || !b) continue;
      const L = e.amount ? 270 - 90 * Math.sqrt(e.amount / max) : 190;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.max(Math.hypot(dx, dy), 1), f = 0.04 * (d - L);
      a.vx += (dx / d) * f; a.vy += (dy / d) * f; b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
    }
    // cohésion des familles + gravité douce vers le centre
    const cent = new Map<string, { x: number; y: number; n: number }>();
    for (const id of ids) { const g = groupOf.get(id)!, q = p.get(id)!, c = cent.get(g) ?? { x: 0, y: 0, n: 0 }; c.x += q.x; c.y += q.y; c.n++; cent.set(g, c); }
    for (const id of ids) {
      const q = p.get(id)!, c = cent.get(groupOf.get(id)!)!;
      q.vx += (c.x / c.n - q.x) * 0.02 + (start.center.x - q.x) * 0.004; q.vy += (c.y / c.n - q.y) * 0.02 + (start.center.y - q.y) * 0.004;
    }
    const c0 = p.get('center')!; c0.vx = 0; c0.vy = 0; c0.x = start.center.x; c0.y = start.center.y; // la société reste au centre
    for (const id of ids) { const q = p.get(id)!; const v = Math.hypot(q.vx, q.vy), lim = 18 * cool + 1; if (v > lim) { q.vx *= lim / v; q.vy *= lim / v; } q.x += q.vx; q.y += q.vy; q.vx *= 0.55; q.vy *= 0.55; }
  }
  // anti-chevauchement des libellés : distance « elliptique » (un libellé est large et peu haut)
  for (let it = 0; it < 250; it++) {
    let moved = false;
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const a = p.get(all[i])!, b = p.get(all[j])!; const dx = a.x - b.x, dy = a.y - b.y;
      const minD = all[i] === 'center' || all[j] === 'center' ? 95 : 44, d = Math.hypot(dx / 2.4, dy);
      if (d < minD) {
        const push = (minD - d) / 2 + 0.5, ux = d ? dx / 2.4 / d : 1, uy = d ? dy / d : 0;
        if (all[i] !== 'center') { a.x += ux * push * 2.4; a.y += uy * push; }
        if (all[j] !== 'center') { b.x -= ux * push * 2.4; b.y -= uy * push; }
        moved = true;
      }
    }
    if (!moved) break;
  }
  // cadrage dans la zone de dessin (marges pour les libellés)
  const xs = all.map((id) => p.get(id)!.x), ys = all.map((id) => p.get(id)!.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const s = Math.min((W - 360) / Math.max(x1 - x0, 1), (H - 140) / Math.max(y1 - y0, 1));
  const fit = (q: { x: number; y: number }) => ({ x: 180 + (q.x - x0) * s + ((W - 360) - (x1 - x0) * s) / 2, y: 70 + (q.y - y0) * s + ((H - 140) - (y1 - y0) * s) / 2 });
  return { pos: new Map(ids.map((id) => [id, fit(p.get(id)!)])), center: fit(p.get('center')!) };
}

// ---- Organigramme ---------------------------------------------------------------------------------------
type Line = { x1: number; y1: number; x2: number; y2: number; color: string; dashed?: boolean; w: number; label?: string; straight?: boolean };
function OrgChart({ eco }: { eco: Ecosystem }) {
  const box = useRef<HTMLDivElement>(null);
  const refs = useRef(new Map<string, HTMLElement>());
  const [lines, setLines] = useState<Line[]>([]);
  const reg = (id: string) => (el: HTMLElement | null) => { if (el) refs.current.set(id, el); else refs.current.delete(id); };

  const persons = eco.members.structure.filter((n) => n.person);
  const companies = [{ id: 'center', name: eco.center.name, sub: 'le shop', group: 'structure' as GroupKey } as EcoNode, ...eco.members.structure.filter((n) => !n.person)];
  const families = eco.groups.filter((g) => g.key !== 'structure');
  const nameOf = (id: string) => (id === 'center' ? eco.center.name : eco.members.structure.find((n) => n.id === id)?.name ?? id);
  const max = Math.max(1, ...families.map((g) => eco.members[g.key].reduce((s, m) => s + (m.amount ?? 0), 0)));

  useLayoutEffect(() => {
    const compute = () => {
      const root = box.current; if (!root) return;
      const R0 = root.getBoundingClientRect();
      const rect = (id: string) => { const el = refs.current.get(id); if (!el) return null; const r = el.getBoundingClientRect(); return { l: r.left - R0.left, r: r.right - R0.left, t: r.top - R0.top, b: r.bottom - R0.top, cx: (r.left + r.right) / 2 - R0.left, cy: (r.top + r.bottom) / 2 - R0.top }; };
      const out: Line[] = [];
      // liens de structure (détention, dirigeant, interco) — fusionnés par paire
      const pairs = new Map<string, { a: string; b: string; labels: string[]; dashed: boolean; amount: number }>();
      for (const e of eco.edges) {
        const isStruct = (id: string) => id === 'center' || id.startsWith('e:');
        if (!isStruct(e.from) || !isStruct(e.to)) continue;
        const key = [e.from, e.to].sort().join('|');
        const p = pairs.get(key) ?? { a: e.from, b: e.to, labels: [], dashed: true, amount: 0 };
        if (e.label && !p.labels.includes(e.label)) p.labels.push(e.label);
        if (!e.dashed) p.dashed = false; p.amount += e.amount ?? 0; pairs.set(key, p);
      }
      for (const p of pairs.values()) {
        const A = rect(p.a), B = rect(p.b); if (!A || !B) continue;
        const sameRow = Math.abs(A.cy - B.cy) < 20;
        const [up, down] = A.cy <= B.cy ? [A, B] : [B, A];
        // sans libellé : la nature du lien est écrite sur les cartes (évite les textes qui se chevauchent)
        out.push(sameRow
          ? { x1: A.cx < B.cx ? A.r : A.l, y1: A.cy, x2: A.cx < B.cx ? B.l : B.r, y2: B.cy, color: GCOLOR.structure, dashed: p.dashed, w: 1.6 }
          : { x1: up.cx, y1: up.b, x2: down.cx, y2: down.t, color: GCOLOR.structure, dashed: p.dashed, w: 1.6 });
      }
      // société → familles : arbre (tronc, une barre par rangée, départs dont l'épaisseur = flux mensuel de la famille)
      const C = rect('center');
      const fam = families.map((g) => ({ g, r: rect(`fam:${g.key}`) })).filter((x) => !!x.r) as { g: (typeof families)[number]; r: NonNullable<ReturnType<typeof rect>> }[];
      if (C && fam.length) {
        const rows = [...new Set(fam.map((x) => Math.round(x.r.t)))].sort((a, b) => a - b);
        const trunkX = Math.min(...fam.map((x) => x.r.l)) - 14;
        const bus = (t: number) => t - 16;
        const grey = '#9CA3AF';
        out.push({ x1: C.cx, y1: C.b, x2: C.cx, y2: bus(rows[0]), color: grey, w: 2, straight: true });
        if (rows.length > 1) out.push({ x1: trunkX, y1: bus(rows[0]), x2: trunkX, y2: bus(rows[rows.length - 1]), color: grey, w: 2, straight: true });
        rows.forEach((t, i) => {
          const inRow = fam.filter((x) => Math.round(x.r.t) === t);
          const xs = [...inRow.map((x) => x.r.cx), ...(i === 0 ? [C.cx] : []), ...(rows.length > 1 ? [trunkX] : [])];
          out.push({ x1: Math.min(...xs), y1: bus(t), x2: Math.max(...xs), y2: bus(t), color: grey, w: 2, straight: true });
          for (const x of inRow) {
            const tot = eco.members[x.g.key].reduce((s2, m) => s2 + (m.amount ?? 0), 0);
            out.push({ x1: x.r.cx, y1: bus(t), x2: x.r.cx, y2: x.r.t, color: x.g.color, w: tot ? 2 + 8 * Math.sqrt(tot / max) : 2, straight: true });
          }
        });
      }
      setLines(out);
    };
    compute();
    const ro = new ResizeObserver(compute); if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [eco]);

  // Flux entre la société au centre et une autre entité (interco, frais…) : résumés sur la carte de cette entité.
  const linkInfo = (id: string) => {
    const parts = eco.edges.filter((e) => (e.from === id && e.to === 'center') || (e.from === 'center' && e.to === id))
      .map((e) => [e.label, e.amount ? kMonth(e.amount) : ''].filter(Boolean).join(' ')).filter((t) => t && t !== eco.members.structure.find((n) => n.id === id)?.sub);
    return parts.length ? `Avec ${cut(eco.center.name, 20)} : ${[...new Set(parts)].join(' · ')}` : '';
  };
  const Card = ({ n, dark, children }: { n: EcoNode; dark?: boolean; children?: ReactNode }) => (
    <div ref={reg(n.id)} className={`rounded-lg border px-3 py-2 min-w-[170px] max-w-[280px] text-center shadow-sm ${dark ? 'bg-[#1F2937] text-white border-[#1F2937]' : 'bg-background'}`}>
      <div className="font-semibold text-sm">{n.person ? '● ' : ''}{n.name}</div>
      {n.sub && <div className={`text-[11px] mt-0.5 ${dark ? 'text-gray-300' : 'text-muted-foreground'}`}>{cut(n.sub, 60)}</div>}
      {!dark && linkInfo(n.id) && <div className="text-[11px] mt-1.5 pt-1.5 border-t text-foreground/80">{cut(linkInfo(n.id), 140)}</div>}
      {children}
    </div>
  );

  return (
    <div ref={box} className="relative w-full">
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        {lines.map((l, i) => {
          const my = (l.y1 + l.y2) / 2;
          const d = l.straight || Math.abs(l.y1 - l.y2) < 20 ? `M${l.x1},${l.y1} L${l.x2},${l.y2}` : `M${l.x1},${l.y1} C${l.x1},${my} ${l.x2},${my} ${l.x2},${l.y2}`;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={l.color} strokeOpacity={l.straight ? 0.8 : 0.55} strokeWidth={l.w} strokeLinecap="round" strokeDasharray={l.dashed ? '6 5' : undefined} />
              {l.label && <text x={(l.x1 + l.x2) / 2} y={my - 4} textAnchor="middle" fontSize={11} fill="#4B5563" stroke="hsl(var(--card))" strokeWidth={4} paintOrder="stroke">{cut(l.label, 60)}</text>}
            </g>
          );
        })}
      </svg>
      <div className="relative flex flex-col gap-12">
        {persons.length > 0 && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground text-center mb-2">Associés & dirigeants</div>
            <div className="flex flex-wrap justify-center items-start gap-6">{persons.map((n) => <Card key={n.id} n={n} />)}</div>
          </div>
        )}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground text-center mb-2">Sociétés</div>
          <div className="flex flex-wrap justify-center items-start gap-10">{companies.map((n) => <Card key={n.id} n={n} dark={n.id === 'center'} />)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground text-center mb-9">Parties prenantes</div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', columnGap: 12, rowGap: 36 }}>
            {families.map((g) => {
              const list = eco.members[g.key], tot = list.reduce((s, m) => s + (m.amount ?? 0), 0);
              return (
                <div key={g.key} ref={reg(`fam:${g.key}`)} className="rounded-lg border bg-background overflow-hidden" style={{ borderTop: `3px solid ${g.color}` }}>
                  <div className="px-3 pt-2 pb-1.5 flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: g.color }}>{g.label}</span>
                    {tot > 0 && <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">{kMonth(tot)}</span>}
                  </div>
                  {g.hint && <div className="px-3 -mt-1 pb-1 text-[10px] text-muted-foreground">{g.hint}</div>}
                  <ul className="px-3 pb-2.5 space-y-1">
                    {list.slice(0, 7).map((m) => (
                      <li key={m.id} className="text-[12.5px] leading-tight flex justify-between gap-2">
                        <span>{cut(m.name, 30)}{m.payer && m.payer !== 'center' ? <span className="block text-[10.5px] text-muted-foreground">via le compte de {nameOf(m.payer)}</span> : null}</span>
                        {m.amount ? <span className="text-muted-foreground tabular-nums whitespace-nowrap">{kMonth(m.amount).replace('/mois', '')}</span> : null}
                      </li>
                    ))}
                    {list.length > 7 && <li className="text-[11px] text-muted-foreground">+ {list.length - 7} autre(s)</li>}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Sélecteur -------------------------------------------------------------------------------------------
type Mode = 'org' | 'network' | 'circle';
const MODES: { key: Mode; label: string }[] = [{ key: 'org', label: 'Organigramme' }, { key: 'network', label: 'Réseau' }, { key: 'circle', label: 'Cercle' }];
const LS = 'daftime.flowmap.view';

export function FlowNetwork({ map }: { map: FlowMap }) {
  const eco = useMemo(() => buildEcosystem(map), [map]);
  const [mode, setMode] = useState<Mode>(() => { try { const v = localStorage.getItem(LS); return (MODES.some((m) => m.key === v) ? v : 'org') as Mode; } catch { return 'org'; } });
  const choose = (m: Mode) => { setMode(m); try { localStorage.setItem(LS, m); } catch { /* stockage indisponible */ } };
  const radial = useMemo(() => radialLayout(eco), [eco]);
  const force = useMemo(() => (mode === 'network' ? forceLayout(eco) : null), [eco, mode]);
  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="inline-flex rounded-lg border bg-muted/40 p-0.5" role="tablist" aria-label="Vue de l'écosystème">
          {MODES.map((m) => (
            <button key={m.key} role="tab" aria-selected={mode === m.key} onClick={() => choose(m.key)}
              className={`px-3 py-1.5 text-xs rounded-md transition ${mode === m.key ? 'bg-background shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>{m.label}</button>
          ))}
        </div>
        {mode !== 'org' && <EcoLegend eco={eco} />}
      </div>
      {mode === 'org' && <OrgChart eco={eco} />}
      {mode === 'network' && force && <EcoGraph eco={eco} pos={force.pos} center={force.center} width={W} height={H} bulge={0.06} stagger={false} />}
      {mode === 'circle' && <EcoGraph eco={eco} pos={radial.pos} center={radial.center} width={W} height={H} />}
    </div>
  );
}
