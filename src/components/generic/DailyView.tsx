// Vue « Quotidien » du portail client : le matin, la cliente voit ses chiffres de la veille,
// le cumul du mois (vs mois précédent + an dernier + projection) et la tendance.
// Alimentée par la table daily_metrics (source connector | manual | demo). Mode dégradé si vide.
// Saisonnalité marquée → comparaisons à J-7 et à l'an dernier (J-1 n'a pas de sens sur ce métier).
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sunrise, ShoppingBag, Coins, TrendingUp } from 'lucide-react';

type Row = { day: string; ca: number | null; orders: number | null; marge_estimee: number | null };

const fmtMoney = (v: number | null | undefined, currency = 'EUR') =>
  v == null ? 'n/d'
    : (() => { try { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v); }
        catch { return `${Math.round(v).toLocaleString('fr-FR')} ${currency}`; } })();
const fmtInt = (v: number | null | undefined) => (v == null ? 'n/d' : Math.round(v).toLocaleString('fr-FR'));
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dayLabel = (s: string) => { try { return new Date(s).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); } catch { return s; } };

function Delta({ cur, ref, label }: { cur: number | null; ref: number | null; label: string }) {
  if (cur == null || ref == null || ref === 0) return <span className="text-[11px] text-muted-foreground">{label} : n/d</span>;
  const pct = ((cur - ref) / Math.abs(ref)) * 100;
  const up = pct >= 0;
  return <span className={`text-[11px] ${up ? 'text-emerald-600' : 'text-red-600'}`}>{up ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}% {label}</span>;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values), min = Math.min(...values), range = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / range) * 26}`).join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-7 mt-2">
      <polyline points={pts} fill="none" className="stroke-accent" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function DailyView({ clientId, currency = 'EUR' }: { clientId: string; currency?: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('daily_metrics' as any)
        .select('day, ca, orders, marge_estimee')
        .eq('client_id', clientId).eq('channel', 'all')
        .order('day', { ascending: true });
      setRows(((data as any[]) ?? []) as Row[]);
    })();
  }, [clientId]);

  const model = useMemo(() => {
    if (!rows || !rows.length) return null;
    const by: Record<string, Row> = {};
    for (const r of rows) by[r.day] = r;
    const sum = (from: string, to: string, k: keyof Row) =>
      rows.reduce((s, r) => (r.day >= from && r.day <= to && r[k] != null ? s + (r[k] as number) : s), 0);
    const has = (from: string, to: string) => rows.some((r) => r.day >= from && r.day <= to);

    const today = new Date();
    const y = addDays(today, -1);                         // "hier"
    const yKey = ymd(y);
    const yesterday = by[yKey] ?? null;
    const wow = by[ymd(addDays(y, -7))] ?? null;          // même jour, semaine précédente
    const yoy = by[ymd(new Date(y.getFullYear() - 1, y.getMonth(), y.getDate()))] ?? null; // même jour, an dernier

    // Cumul du mois en cours (jours 1 → hier) vs même période M-1 et an dernier + projection.
    const mStart = `${yKey.slice(0, 7)}-01`;
    const dayNum = y.getDate();
    const daysInMonth = new Date(y.getFullYear(), y.getMonth() + 1, 0).getDate();
    const pmRef = new Date(y.getFullYear(), y.getMonth() - 1, 1);
    const pmStart = ymd(new Date(pmRef.getFullYear(), pmRef.getMonth(), 1));
    const pmEnd = ymd(new Date(pmRef.getFullYear(), pmRef.getMonth(), Math.min(dayNum, new Date(pmRef.getFullYear(), pmRef.getMonth() + 1, 0).getDate())));
    const lyStart = ymd(new Date(y.getFullYear() - 1, y.getMonth(), 1));
    const lyEnd = ymd(new Date(y.getFullYear() - 1, y.getMonth(), Math.min(dayNum, new Date(y.getFullYear() - 1, y.getMonth() + 1, 0).getDate())));

    const caMonth = sum(mStart, yKey, 'ca');
    const caPrevMonth = has(pmStart, pmEnd) ? sum(pmStart, pmEnd, 'ca') : null;
    const caLastYear = has(lyStart, lyEnd) ? sum(lyStart, lyEnd, 'ca') : null;
    const projection = dayNum > 0 ? (caMonth / dayNum) * daysInMonth : null;

    // 30 derniers jours (jusqu'à hier) pour la sparkline.
    const sparkFrom = ymd(addDays(y, -29));
    const spark = rows.filter((r) => r.day >= sparkFrom && r.day <= yKey).map((r) => r.ca ?? 0);

    // Courbe 24 mois : agrégation daily → mensuelle.
    const byMonth: Record<string, number> = {};
    for (const r of rows) { const m = r.day.slice(0, 7); byMonth[m] = (byMonth[m] ?? 0) + (r.ca ?? 0); }
    const monthly = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-24)
      .map(([m, ca]) => ({ m: new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), ca: Math.round(ca) }));

    return { yKey, yesterday, wow, yoy, caMonth, caPrevMonth, caLastYear, projection, dayNum, daysInMonth, spark, monthly };
  }, [rows]);

  if (rows === null) return <div className="text-muted-foreground text-sm">Chargement…</div>;

  // Mode dégradé : aucune donnée quotidienne (connecteur non branché).
  if (!model) return (
    <div className="rounded-xl border bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 p-5">
      <div className="font-semibold flex items-center gap-2"><Sunrise className="w-4 h-4 text-amber-600" /> Suivi quotidien pas encore actif</div>
      <p className="text-sm text-muted-foreground mt-2">
        Ton suivi jour par jour s'affichera ici dès que ta boutique sera connectée. En attendant, retrouve ton analyse dans l'onglet <b>Rapport complet</b>.
      </p>
    </div>
  );

  const m = model;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-semibold flex items-center gap-2"><Sunrise className="w-4 h-4 text-accent" /> Hier — {dayLabel(m.yKey)}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Comparé à la semaine dernière et à l'an dernier (la saisonnalité rend le J-1 trompeur).</p>
      </div>

      {/* Bandeau du jour */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Ventes (CA)</div>
          <div className="text-2xl font-semibold tabular-nums mt-1">{fmtMoney(m.yesterday?.ca ?? null, currency)}</div>
          <div className="flex gap-3 mt-1"><Delta cur={m.yesterday?.ca ?? null} ref={m.wow?.ca ?? null} label="vs sem. préc." /><Delta cur={m.yesterday?.ca ?? null} ref={m.yoy?.ca ?? null} label="vs an dernier" /></div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> Commandes <span className="text-[10px] opacity-70">estimé</span></div>
          <div className="text-2xl font-semibold tabular-nums mt-1">{fmtInt(m.yesterday?.orders ?? null)}</div>
          <div className="flex gap-3 mt-1"><Delta cur={m.yesterday?.orders ?? null} ref={m.wow?.orders ?? null} label="vs sem. préc." /></div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5"><Coins className="w-3.5 h-3.5" /> Marge <span className="text-[10px] opacity-70">estimée</span></div>
          <div className="text-2xl font-semibold tabular-nums mt-1">{fmtMoney(m.yesterday?.marge_estimee ?? null, currency)}</div>
          <div className="flex gap-3 mt-1"><Delta cur={m.yesterday?.marge_estimee ?? null} ref={m.yoy?.marge_estimee ?? null} label="vs an dernier" /></div>
        </div>
      </div>

      {/* Cumul du mois + projection */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h3 className="font-semibold">Ce mois-ci (jour {m.dayNum}/{m.daysInMonth})</h3>
          <div className="text-sm text-muted-foreground">Projection fin de mois : <b className="text-foreground tabular-nums">{fmtMoney(m.projection, currency)}</b></div>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><div className="text-xs text-muted-foreground">CA cumulé</div><div className="text-xl font-semibold tabular-nums">{fmtMoney(m.caMonth, currency)}</div></div>
          <div><div className="text-xs text-muted-foreground">Même période, mois préc.</div><div className="text-xl font-semibold tabular-nums">{fmtMoney(m.caPrevMonth, currency)}</div><Delta cur={m.caMonth} ref={m.caPrevMonth} label="" /></div>
          <div><div className="text-xs text-muted-foreground">Même période, an dernier</div><div className="text-xl font-semibold tabular-nums">{fmtMoney(m.caLastYear, currency)}</div><Delta cur={m.caMonth} ref={m.caLastYear} label="" /></div>
        </div>
        <Sparkline values={m.spark} />
        <div className="text-[11px] text-muted-foreground mt-1">CA des 30 derniers jours</div>
      </div>

      {/* Tendance 24 mois — barres maison (SVG/div), cohérent avec le reste du portail */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-3">Tendance du CA sur 24 mois</h3>
        {(() => {
          const maxCa = Math.max(...m.monthly.map((d) => d.ca), 1);
          return (
            <>
              <div className="flex items-end gap-1 h-40">
                {m.monthly.map((d, i) => (
                  <div key={i} className="flex-1 flex items-end" title={`${d.m} · ${fmtMoney(d.ca, currency)}`}>
                    <div className="w-full rounded-t bg-accent/70 hover:bg-accent transition-colors" style={{ height: `${Math.max(2, (d.ca / maxCa) * 100)}%` }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                <span>{m.monthly[0]?.m}</span><span>{m.monthly[m.monthly.length - 1]?.m}</span>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
