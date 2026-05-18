// Admin Labarile Import — Super admin only.
// Importer un P&L (CSV/Excel) → mapping vers 6 catégories Labarile → persiste BDD + export TS.

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Database, Code, CheckCircle2, AlertTriangle, Loader2, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { parseLabarileFile, toMonthlyCostsTs, type ParseResult, type ParsedMonth } from '@/components/dashboard/labarile/parseLabarileFile';
import { CATEGORY_LABELS, type LabarileCategory } from '@/components/dashboard/labarile/LabarileMapping';

const MONTH_LABELS = ['JAN','FÉV','MAR','AVR','MAI','JUN','JUL','AOÛ','SEP','OCT','NOV','DÉC'];

export default function AdminLabarileImport() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [persisting, setPersisting] = useState(false);

  const totalUnmapped = useMemo(() => {
    if (!result) return 0;
    return result.months.reduce((a, m) => a + m.unmapped.length, 0);
  }, [result]);

  async function handleFile(f: File) {
    setFile(f);
    setResult(null);
    setParsing(true);
    try {
      const r = await parseLabarileFile(f);
      setResult(r);
      if (r.months.length === 0) {
        toast.error('Aucun mois détecté dans le fichier. Vérifie le format.');
      } else {
        toast.success(`${r.months.length} mois détecté(s) (${r.format})`);
      }
    } catch (e: any) {
      toast.error(`Erreur de parsing : ${e.message ?? e}`);
    } finally {
      setParsing(false);
    }
  }

  async function persist() {
    if (!result || result.months.length === 0) return;
    setPersisting(true);
    try {
      const rows = result.months.map((m) => ({
        year: m.year,
        month: m.month,
        revenue: Math.round(m.revenue),
        coaches: Math.round(m.coaches),
        marketing: Math.round(m.marketing),
        it: Math.round(m.it),
        stripe: Math.round(m.stripe),
        admin: Math.round(m.admin),
        autres: Math.round(m.autres),
        note: m.unmapped.length
          ? `Import ${new Date().toISOString().slice(0,10)} — ${m.unmapped.length} compte(s) non mappé(s) reversé(s) dans Autres`
          : `Import ${new Date().toISOString().slice(0,10)}`,
      }));
      const { error } = await (supabase as any)
        .from('labarile_monthly_pl')
        .upsert(rows, { onConflict: 'year,month' });
      if (error) throw error;
      toast.success(`${rows.length} mois enregistré(s) en base.`);
    } catch (e: any) {
      toast.error(`Erreur d'enregistrement : ${e.message ?? e}`);
    } finally {
      setPersisting(false);
    }
  }

  function copyTs() {
    if (!result) return;
    const ts = toMonthlyCostsTs(result.months);
    navigator.clipboard.writeText(ts);
    toast.success('Bloc TS copié — coller dans LabarileData.ts');
  }

  function downloadDetailCsv() {
    if (!result) return;
    const lines = ['year,month,account,amount,category'];
    for (const m of result.months) {
      for (const d of m.detail) {
        lines.push(`${m.year},${m.month},"${d.account.replace(/"/g, '""')}",${Math.round(d.amount)},${d.category}`);
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labarile-import-detail-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour Admin
          </Button>
          <Badge variant="outline">Super Admin uniquement</Badge>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Import P&L Labarile</h1>
          <p className="text-muted-foreground mt-1">
            Parse un P&L (CSV/Excel), mappe automatiquement les comptes vers les 6 catégories Labarile, puis persiste en BDD ou génère le code TypeScript à coller.
          </p>
        </div>

        {/* Upload */}
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/30 transition">
              <Upload className="w-10 h-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-semibold">Sélectionne un fichier P&L</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Formats acceptés : <strong>.xlsx</strong> (Zoho, colonnes = mois) ou <strong>.csv</strong> (long format : date, account, amount)
                </p>
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <span>Choisir un fichier</span>
              </Button>
            </label>
            {file && (
              <div className="text-sm text-muted-foreground">
                Fichier : <strong>{file.name}</strong> ({Math.round(file.size / 1024)} KB)
                {parsing && <Loader2 className="inline w-4 h-4 ml-2 animate-spin" />}
              </div>
            )}
          </div>
        </Card>

        {/* Warnings */}
        {result?.warnings && result.warnings.length > 0 && (
          <Card className="p-4 border-amber-300 bg-amber-50">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-1">Avertissements de parsing :</p>
                <ul className="list-disc ml-5 space-y-0.5">
                  {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Preview */}
        {result && result.months.length > 0 && (
          <>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Aperçu mappé ({result.months.length} mois)</h2>
                <div className="flex gap-2 items-center text-xs">
                  <Badge variant={totalUnmapped === 0 ? 'default' : 'secondary'}>
                    {totalUnmapped === 0 ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                    {totalUnmapped} compte(s) non mappé(s)
                  </Badge>
                  <Badge variant="outline">Format : {result.format}</Badge>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-2">Mois</th>
                      <th className="text-right p-2">CA</th>
                      {Object.values(CATEGORY_LABELS).map((l) => (
                        <th key={l} className="text-right p-2">{l}</th>
                      ))}
                      <th className="text-right p-2">EBITDA</th>
                      <th className="text-right p-2">Non mappés</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.months.map((m) => {
                      const charges = (['coaches','marketing','it','stripe','admin','autres'] as LabarileCategory[])
                        .reduce((a, k) => a + m[k], 0);
                      const ebitda = m.revenue - charges;
                      return (
                        <tr key={`${m.year}-${m.month}`} className="border-b hover:bg-muted/20">
                          <td className="p-2 font-semibold">{MONTH_LABELS[m.month - 1]} {m.year}</td>
                          <td className="p-2 text-right">{Math.round(m.revenue).toLocaleString()}</td>
                          <td className="p-2 text-right">{Math.round(m.coaches).toLocaleString()}</td>
                          <td className="p-2 text-right">{Math.round(m.marketing).toLocaleString()}</td>
                          <td className="p-2 text-right">{Math.round(m.it).toLocaleString()}</td>
                          <td className="p-2 text-right">{Math.round(m.stripe).toLocaleString()}</td>
                          <td className="p-2 text-right">{Math.round(m.admin).toLocaleString()}</td>
                          <td className="p-2 text-right">{Math.round(m.autres).toLocaleString()}</td>
                          <td className={`p-2 text-right font-semibold ${ebitda < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {Math.round(ebitda).toLocaleString()}
                          </td>
                          <td className="p-2 text-right">{m.unmapped.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Unmapped accounts detail */}
              {totalUnmapped > 0 && (
                <details className="mt-4">
                  <summary className="text-sm text-amber-700 cursor-pointer font-semibold">
                    Voir les comptes non mappés (reversés dans « Autres »)
                  </summary>
                  <div className="mt-2 max-h-60 overflow-y-auto text-xs bg-amber-50 p-3 rounded">
                    {result.months.flatMap((m) =>
                      m.unmapped.map((u, i) => (
                        <div key={`${m.year}-${m.month}-${i}`}>
                          {MONTH_LABELS[m.month - 1]} {m.year} — {u.account} : {Math.round(u.amount).toLocaleString()} AED
                        </div>
                      ))
                    )}
                  </div>
                </details>
              )}
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Button onClick={persist} disabled={persisting}>
                  {persisting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                  Persister en BDD ({result.months.length} mois)
                </Button>
                <Button variant="outline" onClick={copyTs}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copier en TypeScript (LabarileData.ts)
                </Button>
                <Button variant="outline" onClick={downloadDetailCsv}>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le détail (audit CSV)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                <strong>BDD :</strong> upsert sur (year, month) dans <code>labarile_monthly_pl</code>. Le dashboard Labarile lira ces valeurs en priorité, et retombera sur les valeurs hardcodées si vide.
                <br />
                <strong>TS :</strong> coller le bloc dans <code>src/components/dashboard/labarile/LabarileData.ts</code> à la place de l'export <code>MONTHLY_COSTS_2026</code>.
              </p>
            </Card>

            {/* TS preview */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Code className="w-5 h-5" /> Code TypeScript généré
              </h2>
              <pre className="bg-muted p-4 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
                {toMonthlyCostsTs(result.months)}
              </pre>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
