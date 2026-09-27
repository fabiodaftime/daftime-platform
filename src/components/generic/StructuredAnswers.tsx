// Réponses STRUCTURÉES (A2) : le collaborateur remplit des champs au lieu de rédiger une réponse.
//  - Trésorerie : un solde par compte à la fin du mois (préremplis s'ils sont connus) → soldes de
//    référence (onboarding) : le moteur reconstitue la trésorerie de TOUS les mois depuis le relevé.
//  - Coûts manquants : produits vendus sans coût ce mois → coût de revient unitaire (coûts SKU).
// La question en texte libre reste en dernier recours (tableau des pièces manquantes).
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type Anchor = { account: string; date: string; balance: number };
type SkuCost = { sku: string; name?: string; product_cost?: number };
export type CostParamsLite = { bank_anchors?: Anchor[]; sku_costs?: SkuCost[]; [k: string]: unknown };

const lastDay = (period: string) => { const [y, m] = period.slice(0, 7).split('-').map(Number); return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); };
const toNum = (s: string) => { const n = Number(String(s).replace(/\s/g, '').replace(',', '.')); return s.trim() !== '' && Number.isFinite(n) ? n : null; };

export function StructuredAnswers({ period, accounts, costParams, missingProducts, askCash, busy, onSave }: {
  period: string;
  accounts: string[];
  costParams: CostParamsLite | null | undefined;
  missingProducts: { title: string; lines: number }[];
  askCash: boolean;
  busy: boolean;
  onSave: (next: CostParamsLite, summary: string) => void;
}) {
  const date = lastDay(period);
  const anchors = costParams?.bank_anchors ?? [];
  const [bal, setBal] = useState<Record<string, string>>(() =>
    Object.fromEntries(accounts.map((a) => [a, String(anchors.find((x) => x.account === a && x.date === date)?.balance ?? '')])));
  const [cost, setCost] = useState<Record<string, string>>({});
  const [all, setAll] = useState(false);
  const shown = all ? missingProducts : missingProducts.slice(0, 15);
  const totalLines = useMemo(() => missingProducts.reduce((s, p) => s + p.lines, 0), [missingProducts]);

  const showCash = askCash && accounts.length > 0;
  if (!showCash && !missingProducts.length) return null;

  const save = () => {
    const next: CostParamsLite = { ...(costParams ?? {}) };
    const newAnchors = accounts.map((a) => ({ a, v: toNum(bal[a] ?? '') })).filter((x) => x.v != null) as { a: string; v: number }[];
    if (newAnchors.length) {
      const keep = anchors.filter((x) => !(x.date === date && newAnchors.some((n) => n.a === x.account)));
      next.bank_anchors = [...keep, ...newAnchors.map((n) => ({ account: n.a, date, balance: n.v }))];
    }
    const newCosts = Object.entries(cost).map(([title, v]) => ({ title, v: toNum(v) })).filter((x) => x.v != null && x.v > 0) as { title: string; v: number }[];
    if (newCosts.length) {
      const skus = [...(costParams?.sku_costs ?? [])];
      for (const c of newCosts) {
        const i = skus.findIndex((s) => (s.name ?? s.sku).trim().toLowerCase() === c.title.trim().toLowerCase());
        if (i >= 0) skus[i] = { ...skus[i], product_cost: c.v }; else skus.push({ sku: c.title, name: c.title, product_cost: c.v });
      }
      next.sku_costs = skus;
    }
    const parts = [newAnchors.length ? `${newAnchors.length} solde(s) de compte` : '', newCosts.length ? `${newCosts.length} coût(s) produit` : ''].filter(Boolean);
    if (parts.length) onSave(next, `${parts.join(' et ')} enregistré(s).`);
  };
  const dirty = accounts.some((a) => toNum(bal[a] ?? '') != null && toNum(bal[a] ?? '') !== anchors.find((x) => x.account === a && x.date === date)?.balance)
    || Object.values(cost).some((v) => (toNum(v) ?? 0) > 0);

  return (
    <div className="mb-4 border rounded-lg bg-background p-3 space-y-4">
      <div className="text-sm font-medium">À compléter pour ce mois</div>
      {showCash && (
        <div>
          <div className="text-xs font-medium mb-1">Solde de chaque compte au {date.slice(8, 10)}/{date.slice(5, 7)}/{date.slice(0, 4)}</div>
          <p className="text-xs text-muted-foreground mb-2">Un solde par compte suffit : le moteur reconstitue la trésorerie de tous les autres mois à partir du relevé.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {accounts.map((a) => (
              <label key={a} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate" title={a}>{a}</span>
                <input inputMode="decimal" value={bal[a] ?? ''} onChange={(e) => setBal((b) => ({ ...b, [a]: e.target.value }))} placeholder="solde"
                  className="w-32 h-8 rounded border bg-background px-2 text-sm text-right tabular-nums" disabled={busy} />
              </label>
            ))}
          </div>
        </div>
      )}
      {missingProducts.length > 0 && (
        <div>
          <div className="text-xs font-medium mb-1">Produits vendus sans coût ({missingProducts.length} produits, {totalLines} lignes de vente)</div>
          <p className="text-xs text-muted-foreground mb-2">Coût de revient unitaire (produit seul). Pour un import en masse, utilise l'import IA des coûts SKU (Paramètres shop).</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {shown.map((p) => (
                  <tr key={p.title} className="border-t">
                    <td className="py-1 pr-2 max-w-[280px] truncate" title={p.title}>{p.title}</td>
                    <td className="py-1 pr-2 text-xs text-muted-foreground whitespace-nowrap tabular-nums">{p.lines} ligne(s)</td>
                    <td className="py-1 text-right">
                      <input inputMode="decimal" value={cost[p.title] ?? ''} onChange={(e) => setCost((c) => ({ ...c, [p.title]: e.target.value }))} placeholder="coût"
                        className="w-24 h-7 rounded border bg-background px-2 text-sm text-right tabular-nums" disabled={busy} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {missingProducts.length > 15 && (
            <button className="mt-1 text-xs underline text-muted-foreground" onClick={() => setAll((x) => !x)}>{all ? 'Réduire' : `Voir les ${missingProducts.length} produits`}</button>
          )}
        </div>
      )}
      <Button size="sm" onClick={save} disabled={busy || !dirty}>
        {busy ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Recalcul…</> : 'Enregistrer et recalculer'}
      </Button>
    </div>
  );
}
