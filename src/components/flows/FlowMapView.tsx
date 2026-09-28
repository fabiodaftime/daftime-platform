// Cartographie des flux d'un dossier — lecture (cockpit et espace client).
// Sankey « d'où vient l'argent → sur quel compte → où il part », organigramme, comptes, qui on paye et comment.
import { Fragment, useMemo } from 'react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import { ArrowRight, Building2, CreditCard, HelpCircle, Landmark, User, Wallet, Repeat, Network } from 'lucide-react';
import { FlowNetwork } from './FlowNetwork';
import type { FlowAccount, FlowEntity, FlowMap, OutCategory } from '../../../supabase/functions/_shared/flowMap';

const CAT_LABEL: Record<OutCategory, string> = {
  pub: 'Pub', stock: 'Stock', logistique: 'Logistique', 'équipe': 'Équipe', 'impôts & taxes': 'Impôts & taxes',
  financement: 'Financement', outils: 'Outils', interne: 'Interne', autre: 'Autres',
};
const CAT_COLOR: Record<OutCategory, string> = {
  pub: '#C2410C', stock: '#7C3AED', logistique: '#0F766E', 'équipe': '#2563EB', 'impôts & taxes': '#B7791F',
  financement: '#BE185D', outils: '#65A30D', interne: '#64748B', autre: '#94A3B8',
};
const IN_COLOR = '#1E7B4F';
const ACC_COLOR = '#1F2937';

const eur = (x: number, currency = 'EUR') => new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(x);
const k = (x: number) => (Math.abs(x) >= 1000 ? `${Math.round(x / 1000).toLocaleString('fr-FR')} k€` : `${Math.round(x)} €`);

function Certainty({ c }: { c: string }) {
  return c === 'confirmé'
    ? <span className="inline-block rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] whitespace-nowrap">confirmé</span>
    : <span className="inline-block rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[11px] whitespace-nowrap">à confirmer</span>;
}

function Section({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold flex items-center gap-2">{icon}{title}</h3>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// Nœud du Sankey : barre + libellé (nom, montant) à l'extérieur — à gauche pour la 1re colonne, à droite sinon.
const short = (s: string) => (s.length > 20 ? `${s.slice(0, 19)}…` : s);
function SankeyNode(props: any) {
  const { x, y, width, height, payload } = props;
  const right = (payload.depth ?? 1) > 0;
  return (
    <g>
      <rect x={x} y={y} width={width} height={Math.max(height, 2)} fill={payload.color} rx={2} />
      <text x={right ? x + width + 8 : x - 8} y={y + height / 2} textAnchor={right ? 'start' : 'end'} dominantBaseline="middle" fontSize={12} fill="currentColor">
        <tspan fontWeight={600}>{short(payload.name)}</tspan>
        <tspan dx={6} fill="#6B7280">{k(payload.value)}</tspan>
      </text>
    </g>
  );
}

export function FlowMapView({ map, currency = 'EUR' }: { map: FlowMap; currency?: string }) {
  const accName = useMemo(() => new Map(map.accounts.map((a) => [a.id, a.name])), [map.accounts]);

  // Sankey : entrées (canal) → comptes → catégories de sorties (hors flux internes). Seuls les montants connus.
  const sankey = useMemo(() => {
    const nodes: { name: string; color: string }[] = []; const idx = new Map<string, number>();
    const node = (key: string, name: string, color: string) => { if (!idx.has(key)) { idx.set(key, nodes.length); nodes.push({ name, color }); } return idx.get(key)!; };
    const links: { source: number; target: number; value: number }[] = [];
    const add = (s: number, t: number, v: number) => { const l = links.find((x) => x.source === s && x.target === t); if (l) l.value += v; else links.push({ source: s, target: t, value: v }); };
    for (const f of map.inflows) if (f.amount_month && f.amount_month > 0) {
      add(node(`in:${f.channel}`, f.channel, IN_COLOR), node(`acc:${f.account}`, accName.get(f.account) ?? f.account, ACC_COLOR), f.amount_month);
    }
    for (const f of map.outflows) if (f.amount_month && f.amount_month > 0 && f.category !== 'interne') {
      add(node(`acc:${f.account}`, accName.get(f.account) ?? f.account, ACC_COLOR), node(`out:${f.category}`, CAT_LABEL[f.category], CAT_COLOR[f.category]), f.amount_month);
    }
    return links.length >= 2 ? { nodes, links } : null;
  }, [map, accName]);

  const outByCat = useMemo(() => {
    const g = new Map<OutCategory, typeof map.outflows>();
    for (const f of map.outflows) g.set(f.category, [...(g.get(f.category) ?? []), f]);
    return [...g.entries()].map(([cat, rows]) => ({ cat, rows, total: rows.reduce((s, r) => s + (r.amount_month ?? 0), 0) }))
      .sort((a, b) => b.total - a.total);
  }, [map.outflows]);

  const roots = map.entities.filter((e) => !e.parent || !map.entities.some((x) => x.id === e.parent));
  const children = (id: string) => map.entities.filter((e) => e.parent === id);
  const EntityCard = ({ e }: { e: FlowEntity }) => (
    <div className="rounded-lg border bg-background p-3 min-w-[200px] max-w-[280px]">
      <div className="flex items-center gap-2 font-medium">{e.kind === 'personne' ? <User className="w-4 h-4 text-muted-foreground" /> : <Building2 className="w-4 h-4 text-muted-foreground" />}{e.name}</div>
      {e.country && <div className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">{e.country}</div>}
      <p className="text-xs text-muted-foreground mt-1.5">{e.role}</p>
      {e.link && <p className="text-[11px] mt-1.5 text-foreground/70">{e.link}</p>}
    </div>
  );
  const Tree = ({ e }: { e: FlowEntity }) => (
    <div className="flex flex-col items-start gap-2">
      <EntityCard e={e} />
      {children(e.id).length > 0 && (
        <div className="ml-5 pl-4 border-l-2 border-dashed border-border flex flex-wrap gap-3">
          {children(e.id).map((c) => <Tree key={c.id} e={c} />)}
        </div>
      )}
    </div>
  );
  const accIcon = (a: FlowAccount) => a.kind === 'carte' ? <CreditCard className="w-4 h-4" /> : a.kind === 'prestataire de paiement' ? <Wallet className="w-4 h-4" /> : <Landmark className="w-4 h-4" />;
  const totalIn = map.inflows.reduce((s, f) => s + (f.amount_month ?? 0), 0);
  const totalOut = map.outflows.filter((f) => f.category !== 'interne').reduce((s, f) => s + (f.amount_month ?? 0), 0);

  return (
    <div className="space-y-4">
      {map.summary && (
        <section className="rounded-xl border bg-card p-5">
          <p className="text-[15px] leading-relaxed">{map.summary}</p>
          {(totalIn > 0 || totalOut > 0) && (
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span><span className="text-muted-foreground">Entre chaque mois</span> <b>{eur(totalIn, currency)}</b></span>
              <span><span className="text-muted-foreground">Sort chaque mois</span> <b>{eur(totalOut, currency)}</b></span>
              <span className="text-muted-foreground text-xs self-center">moyennes des derniers mois, d'après tes relevés</span>
            </div>
          )}
        </section>
      )}

      {(map.entities.length + map.outflows.length) >= 3 && (
        <Section icon={<Network className="w-4 h-4 text-accent" />} title="Tout ton écosystème" hint="Qui gravite autour de ton shop : associés, sociétés, qui te paye, qui tu payes. Plus le trait est épais, plus le montant mensuel est gros ; les pointillés sont des liens sans flux régulier. En vue Réseau ou Cercle, survole un point pour isoler ses liens.">
          <FlowNetwork map={map} />
        </Section>
      )}

      {sankey && (
        <Section icon={<ArrowRight className="w-4 h-4 text-accent" />} title="Comment l'argent circule" hint="De gauche à droite : d'où vient l'argent, sur quel compte il arrive, où il repart (moyenne mensuelle).">
          <div className="w-full overflow-x-auto overflow-y-hidden">
            <div className="min-w-[680px] h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <Sankey data={sankey} nodePadding={18} nodeWidth={10} margin={{ top: 12, right: 160, bottom: 24, left: 170 }}
                  link={{ stroke: '#94A3B8', strokeOpacity: 0.28 }} node={<SankeyNode />}>
                  <Tooltip formatter={(v: number) => eur(v, currency)} />
                </Sankey>
              </ResponsiveContainer>
            </div>
          </div>
        </Section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {map.entities.length > 0 && (
          <Section icon={<Building2 className="w-4 h-4 text-accent" />} title="Qui est qui">
            <div className="flex flex-wrap gap-4">{roots.map((e) => <Tree key={e.id} e={e} />)}</div>
          </Section>
        )}
        {map.accounts.length > 0 && (
          <Section icon={<Landmark className="w-4 h-4 text-accent" />} title="Où est ton argent" hint="Les comptes qui voient passer de l'argent, et s'ils sont comptés dans la trésorerie suivie.">
            <ul className="space-y-2">
              {map.accounts.map((a) => (
                <li key={a.id} className="rounded-lg border bg-background p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 font-medium">{accIcon(a)}{a.name}</span>
                    <span className={`text-[11px] rounded-full px-2 py-0.5 border ${a.in_treasury ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground'}`}>{a.in_treasury ? 'dans la trésorerie suivie' : 'hors trésorerie suivie'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{[a.bank, a.kind].filter(Boolean).join(' · ')}</p>
                  <p className="text-sm mt-1">{a.role}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      {map.inflows.length > 0 && (
        <Section icon={<Wallet className="w-4 h-4 text-accent" />} title="Ce qui rentre, et quand" hint="Le délai entre la vente et l'argent sur ton compte : c'est ce que tu avances.">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b"><th className="py-2 pr-3 font-medium">Canal</th><th className="py-2 pr-3 font-medium">Arrive sur</th><th className="py-2 pr-3 font-medium text-right">Par mois</th><th className="py-2 pr-3 font-medium">Délai</th><th className="py-2 font-medium"></th></tr></thead>
              <tbody>
                {[...map.inflows].sort((a, b) => (b.amount_month ?? 0) - (a.amount_month ?? 0)).map((f, i) => (
                  <tr key={i} className="border-b last:border-0 align-top">
                    <td className="py-2 pr-3"><div className="font-medium">{f.channel}</div><div className="text-xs text-muted-foreground">{f.source}{f.note ? ` · ${f.note}` : ''}</div></td>
                    <td className="py-2 pr-3">{accName.get(f.account) ?? f.account}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{f.amount_month ? eur(f.amount_month, currency) : '—'}</td>
                    <td className="py-2 pr-3">{f.delay}</td>
                    <td className="py-2"><Certainty c={f.certainty} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {outByCat.length > 0 && (
        <Section icon={<ArrowRight className="w-4 h-4 text-accent" />} title="Qui tu payes, et comment" hint="Par poste : depuis quel compte, à quel rythme et à quelles conditions. Les conditions sont tes leviers pour décaler les paiements.">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b"><th className="py-2 pr-3 font-medium">Payé à</th><th className="py-2 pr-3 font-medium">Depuis</th><th className="py-2 pr-3 font-medium text-right">Par mois</th><th className="py-2 pr-3 font-medium">Rythme</th><th className="py-2 pr-3 font-medium">Conditions</th><th className="py-2 font-medium"></th></tr></thead>
              <tbody>
                {outByCat.map(({ cat, rows, total }) => (
                  <Fragment key={cat}>
                    <tr className="bg-muted/40">
                      <td colSpan={2} className="py-1.5 px-2 text-xs font-semibold uppercase tracking-wide" style={{ color: CAT_COLOR[cat] }}>{CAT_LABEL[cat]}</td>
                      <td className="py-1.5 pr-3 text-right text-xs font-semibold tabular-nums">{total ? eur(total, currency) : ''}</td>
                      <td colSpan={3}></td>
                    </tr>
                    {[...rows].sort((a, b) => (b.amount_month ?? 0) - (a.amount_month ?? 0)).map((f, i) => (
                      <tr key={`${cat}-${i}`} className="border-b last:border-0 align-top">
                        <td className="py-2 pr-3"><div className="font-medium">{f.payee}</div>{f.note && <div className="text-xs text-muted-foreground">{f.note}</div>}</td>
                        <td className="py-2 pr-3">{accName.get(f.account) ?? f.account}{f.via ? <span className="text-muted-foreground"> via {f.via}</span> : null}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{f.amount_month ? eur(f.amount_month, currency) : '—'}</td>
                        <td className="py-2 pr-3">{f.rhythm}</td>
                        <td className="py-2 pr-3">{f.terms}</td>
                        <td className="py-2"><Certainty c={f.certainty} /></td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {map.interco.length > 0 && (
          <Section icon={<Repeat className="w-4 h-4 text-accent" />} title="Entre tes sociétés" hint="Ces flux restent dans le groupe : ni chiffre d'affaires ni dépense dans la vue d'ensemble.">
            <ul className="space-y-2">
              {map.interco.map((f, i) => (
                <li key={i} className="rounded-lg border bg-background p-3 text-sm">
                  <div className="font-medium flex items-center gap-1.5">{f.from} <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" /> {f.to}</div>
                  <div className="mt-1">{f.nature}{f.amount ? <span className="text-muted-foreground"> · {f.amount}</span> : null}</div>
                  <div className="text-xs text-muted-foreground mt-1">{f.treatment}</div>
                </li>
              ))}
            </ul>
          </Section>
        )}
        {map.open_questions.length > 0 && (
          <Section icon={<HelpCircle className="w-4 h-4 text-accent" />} title="À clarifier ensemble" hint="Les réponses complètent la carte et rendent l'analyse plus juste.">
            <ul className="space-y-2 list-disc pl-5 text-sm">{map.open_questions.map((q, i) => <li key={i}>{q}</li>)}</ul>
          </Section>
        )}
      </div>
    </div>
  );
}
