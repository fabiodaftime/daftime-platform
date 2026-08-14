// Onboarding shop : paramètres + coûts HORS-EXPORT qui débloquent la cascade CM1→CM2→CM3.
// Écrit dans clients.shop_profile et clients.cost_params (jsonb).
import { useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, X, Loader2, Save, Check } from 'lucide-react';

type SkuCost = { sku: string; product_cost?: number; packaging?: number; inbound_transport?: number; duties?: number };
type Profile = { model?: string; repeat_model?: string; founder_profile?: string; north_star?: string };
type Costs = {
  sku_costs?: SkuCost[];
  fulfillment?: { shipping_cost_model?: string; pick_pack_per_order?: number; threepl_note?: string };
  acquisition_overheads?: { agency_fees?: number; creative?: number; attribution_tools?: number; influence?: number };
  supplier_terms?: { dpo_days?: number };
  vat?: { regime?: string; rate?: number };
  inventory?: { source?: string; reorder_lead_days?: number };
};

const num = (v: string): number | undefined => { const n = parseFloat(v.replace(',', '.')); return isFinite(n) ? n : undefined; };
const S = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block text-xs"><span className="text-muted-foreground">{label}</span><div className="mt-1">{children}</div></label>
);
const inputCls = 'h-8 w-full rounded border bg-background px-2 text-sm';

export function ShopOnboardingPanel({ clientId, initialProfile, initialCosts, productSeed, onSaved }: {
  clientId: string; initialProfile: Profile; initialCosts: Costs; productSeed?: string[]; onSaved?: (p: Profile, c: Costs) => void;
}) {
  const [p, setP] = useState<Profile>(initialProfile ?? {});
  const [c, setC] = useState<Costs>(initialCosts ?? {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [csv, setCsv] = useState('');

  const setF = <K extends keyof Costs>(k: K, patch: Partial<NonNullable<Costs[K]>>) =>
    setC((prev) => ({ ...prev, [k]: { ...(prev[k] as object ?? {}), ...patch } }));
  const skus = c.sku_costs ?? [];
  const setSku = (i: number, patch: Partial<SkuCost>) => setC((prev) => ({ ...prev, sku_costs: (prev.sku_costs ?? []).map((r, j) => j === i ? { ...r, ...patch } : r) }));
  const addSku = () => setC((prev) => ({ ...prev, sku_costs: [...(prev.sku_costs ?? []), { sku: '' }] }));
  const rmSku = (i: number) => setC((prev) => ({ ...prev, sku_costs: (prev.sku_costs ?? []).filter((_, j) => j !== i) }));
  const seedFromSales = () => {
    const existing = new Set((c.sku_costs ?? []).map((r) => r.sku.trim().toLowerCase()));
    const rows = (productSeed ?? []).filter((s) => s && !existing.has(s.trim().toLowerCase())).map((s) => ({ sku: s }));
    if (rows.length) setC((prev) => ({ ...prev, sku_costs: [...(prev.sku_costs ?? []), ...rows] }));
  };
  const importCsv = () => {
    const rows = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => l.split(/[,;\t]/).map((x) => x.trim()));
    const start = rows.length && /sku|réf|ref|product/i.test(rows[0][0]) ? 1 : 0; // saute l'en-tête éventuel
    const parsed: SkuCost[] = rows.slice(start).filter((r) => r[0]).map((r) => ({
      sku: r[0], product_cost: num(r[1] ?? ''), packaging: num(r[2] ?? ''), inbound_transport: num(r[3] ?? ''), duties: num(r[4] ?? ''),
    }));
    if (parsed.length) { setC((prev) => ({ ...prev, sku_costs: [...(prev.sku_costs ?? []), ...parsed] })); setCsv(''); }
  };

  const save = async () => {
    setSaving(true); setErr(null); setSaved(false);
    const { error } = await supabase.from('clients' as never).update({ shop_profile: p, cost_params: c } as never).eq('id', clientId);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setSaved(true); onSaved?.(p, c); setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground max-w-2xl">Ces paramètres <b>hors-export</b> (coûts réels, grilles, échéances, profil) débloquent la cascade CM1→CM2→CM3, les breakevens et le prévisionnel. Renseignés une fois, éditables.</p>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : saved ? <Check className="w-4 h-4 mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
          {saved ? 'Enregistré' : 'Enregistrer'}
        </Button>
      </div>
      {err && <p className="text-xs text-destructive">Erreur : {err}</p>}

      {/* 1. Profil */}
      <section className="border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">1 · Profil du shop <span className="text-xs text-muted-foreground">— conditionne les benchmarks applicables</span></h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <S label="Modèle"><select className={inputCls} value={p.model ?? ''} onChange={(e) => setP({ ...p, model: e.target.value })}><option value="">—</option><option value="dropshipping">Dropshipping</option><option value="dtc_brand">Marque DTC (stock)</option><option value="large_catalog">Gros catalogue</option></select></S>
          <S label="Réachat"><select className={inputCls} value={p.repeat_model ?? ''} onChange={(e) => setP({ ...p, repeat_model: e.target.value })}><option value="">—</option><option value="one_shot">One-shot</option><option value="repeat">Réachat</option></select></S>
          <S label="Profil founder"><select className={inputCls} value={p.founder_profile ?? ''} onChange={(e) => setP({ ...p, founder_profile: e.target.value })}><option value="">—</option><option value="media_buyer">Media buyer</option><option value="product_ops">Produit / ops</option><option value="delegator">Délègue</option></select></S>
          <S label="North star"><select className={inputCls} value={p.north_star ?? ''} onChange={(e) => setP({ ...p, north_star: e.target.value })}><option value="">—</option><option value="cm3_eur">Marge après pub (€)</option><option value="marge_nette">Marge nette (%)</option><option value="cash_end">Trésorerie</option></select></S>
        </div>
      </section>

      {/* 2. Coûts SKU */}
      <section className="border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-1">2 · Coûts de revient par SKU <span className="text-xs text-muted-foreground">— produit + packaging + transport amont + douane → CM1</span></h3>
        <p className="text-xs text-muted-foreground mb-3">« Cost per item » Shopify est presque toujours vide : ces coûts n'existent nulle part ailleurs.</p>
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto] gap-2 text-[11px] text-muted-foreground px-1"><span>SKU / produit</span><span>Produit</span><span>Packaging</span><span>Transport amont</span><span>Douane</span><span></span></div>
          {skus.map((r, i) => (
            <div key={i} className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center">
              <input className={inputCls} value={r.sku} onChange={(e) => setSku(i, { sku: e.target.value })} placeholder="SKU / nom" />
              <input className={inputCls} type="number" value={r.product_cost ?? ''} onChange={(e) => setSku(i, { product_cost: num(e.target.value) })} />
              <input className={inputCls} type="number" value={r.packaging ?? ''} onChange={(e) => setSku(i, { packaging: num(e.target.value) })} />
              <input className={inputCls} type="number" value={r.inbound_transport ?? ''} onChange={(e) => setSku(i, { inbound_transport: num(e.target.value) })} />
              <input className={inputCls} type="number" value={r.duties ?? ''} onChange={(e) => setSku(i, { duties: num(e.target.value) })} />
              <button onClick={() => rmSku(i)} className="text-muted-foreground hover:text-destructive" aria-label="Retirer"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={addSku}><Plus className="w-3.5 h-3.5 mr-1" /> Ajouter un SKU</Button>
          <Button variant="outline" size="sm" onClick={seedFromSales} disabled={!productSeed?.length}
            title={productSeed?.length ? 'Ajoute les produits vendus (issus des exports), coûts à compléter' : 'Génère d\'abord un dashboard pour récupérer la liste des produits vendus'}>
            ✨ Pré-remplir depuis les ventes{productSeed?.length ? ` (${productSeed.length})` : ''}
          </Button>
        </div>
        <div className="mt-3">
          <S label="Importer un CSV (sku, produit, packaging, transport, douane — une ligne par SKU)">
            <textarea className="w-full text-xs border rounded p-2 bg-background font-mono" rows={3} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="TSHIRT-BLK-M, 8.50, 0.40, 1.20, 0.30" />
          </S>
          <Button variant="outline" size="sm" className="mt-1" onClick={importCsv} disabled={!csv.trim()}>Importer</Button>
        </div>
      </section>

      {/* 3. Logistique */}
      <section className="border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">3 · Logistique <span className="text-xs text-muted-foreground">— livraison sortante + pick&amp;pack → CM2</span></h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <S label="Modèle coût d'expédition"><select className={inputCls} value={c.fulfillment?.shipping_cost_model ?? ''} onChange={(e) => setF('fulfillment', { shipping_cost_model: e.target.value })}><option value="">—</option><option value="flat">Forfait / commande</option><option value="per_order">Réel / commande</option><option value="by_weight">Par poids / zone</option></select></S>
          <S label="Pick & pack / commande (€)"><input className={inputCls} type="number" value={c.fulfillment?.pick_pack_per_order ?? ''} onChange={(e) => setF('fulfillment', { pick_pack_per_order: num(e.target.value) })} /></S>
          <S label="Note grille 3PL / transporteur"><input className={inputCls} value={c.fulfillment?.threepl_note ?? ''} onChange={(e) => setF('fulfillment', { threepl_note: e.target.value })} placeholder="ex. 4,20 €/cmd + 0,15/article" /></S>
        </div>
      </section>

      {/* 4. Acquisition */}
      <section className="border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">4 · Coûts d'acquisition hors-pub (mensuel, €) <span className="text-xs text-muted-foreground">— → CAC complet / CM3</span></h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <S label="Fees agence"><input className={inputCls} type="number" value={c.acquisition_overheads?.agency_fees ?? ''} onChange={(e) => setF('acquisition_overheads', { agency_fees: num(e.target.value) })} /></S>
          <S label="Créa"><input className={inputCls} type="number" value={c.acquisition_overheads?.creative ?? ''} onChange={(e) => setF('acquisition_overheads', { creative: num(e.target.value) })} /></S>
          <S label="Outils d'attribution"><input className={inputCls} type="number" value={c.acquisition_overheads?.attribution_tools ?? ''} onChange={(e) => setF('acquisition_overheads', { attribution_tools: num(e.target.value) })} /></S>
          <S label="Influence"><input className={inputCls} type="number" value={c.acquisition_overheads?.influence ?? ''} onChange={(e) => setF('acquisition_overheads', { influence: num(e.target.value) })} /></S>
        </div>
      </section>

      {/* 5. Trésorerie / échéances */}
      <section className="border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">5 · Trésorerie &amp; échéances <span className="text-xs text-muted-foreground">— → prévisionnel 13 semaines</span></h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <S label="Délai règlement fournisseurs (jours)"><input className={inputCls} type="number" value={c.supplier_terms?.dpo_days ?? ''} onChange={(e) => setF('supplier_terms', { dpo_days: num(e.target.value) })} /></S>
          <S label="Régime TVA"><input className={inputCls} value={c.vat?.regime ?? ''} onChange={(e) => setF('vat', { regime: e.target.value })} placeholder="ex. FR mensuel, UAE 5%" /></S>
          <S label="Taux TVA (%)"><input className={inputCls} type="number" value={c.vat?.rate ?? ''} onChange={(e) => setF('vat', { rate: num(e.target.value) })} /></S>
        </div>
      </section>

      {/* 6. Stock */}
      <section className="border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">6 · Stock <span className="text-xs text-muted-foreground">— → jours de vente par produit</span></h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <S label="Source des niveaux de stock"><select className={inputCls} value={c.inventory?.source ?? ''} onChange={(e) => setF('inventory', { source: e.target.value })}><option value="">—</option><option value="shopify_export">Export Shopify (inventaire)</option><option value="manual">Saisie manuelle</option></select></S>
          <S label="Délai de réappro fournisseur (jours)"><input className={inputCls} type="number" value={c.inventory?.reorder_lead_days ?? ''} onChange={(e) => setF('inventory', { reorder_lead_days: num(e.target.value) })} /></S>
        </div>
      </section>

      <div className="flex justify-end">
        <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}Enregistrer</Button>
      </div>
    </div>
  );
}
