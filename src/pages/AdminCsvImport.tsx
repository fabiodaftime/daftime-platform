// Admin CSV Import — Super admin only.
// Two targets:
//   1) PCGroup manual facts  → table public.pcgroup_manual_facts
//      Upsert key (month_id, entity_code).
//   2) Monthly financials    → table public.monthly_financials
//      Upsert key (company_id, year, month).
//
// Pipeline pour chaque cible :
//   pick CSV  →  Papa.parse(strict, header: true)  →  zod row schema
//   →  cross-check vs DB (months/entities/companies)  →  preview + erreurs ligne par ligne
//   →  Confirmer → upsert batch.
//
// Pas d'upload silencieux : tant que `errors.length > 0`, le bouton commit est désactivé.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { z } from 'zod';
import { ArrowLeft, Upload, Download, CheckCircle2, AlertTriangle, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { runPostImportValidation } from '@/lib/postImportValidation';
import { PostImportValidationStatus } from '@/components/admin/PostImportValidationStatus';

// ---------------------------------------------------------------------------
// Templates (headers stricts — toute colonne en plus/moins est rejetée)
// ---------------------------------------------------------------------------

const PCG_HEADERS = ['month_id', 'entity_code', 'ca', 'charges', 'contribution', 'margin_pct', 'deals', 'warning'] as const;
const FIN_HEADERS = ['company_id', 'year', 'month', 'revenue_actual', 'revenue_budget', 'revenue_prior_year', 'cash_balance', 'fx_rate'] as const;

const PCG_TEMPLATE =
  PCG_HEADERS.join(',') +
  '\njan-2026,SPY,42000,18000,24000,57.1,5,\n' +
  'jan-2026,COMMENT,31000,12000,19000,61.3,3,Ajuster prov. clients\n';

const FIN_TEMPLATE =
  FIN_HEADERS.join(',') +
  '\nc12ecc1f-7f17-4bb6-83c2-d182413f687e,2026,1,42000,40000,38000,150000,1.08\n';

// ---------------------------------------------------------------------------
// Row schemas (zod)
// ---------------------------------------------------------------------------

const numberLike = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'number' ? v : Number(String(v).replace(/[^\d.\-]/g, ''))))
  .refine((n) => Number.isFinite(n), { message: 'doit être un nombre' });

const optionalNumber = z
  .union([z.string(), z.number(), z.undefined(), z.null()])
  .transform((v) => {
    if (v === undefined || v === null || v === '') return null;
    const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.\-]/g, ''));
    return Number.isFinite(n) ? n : null;
  });

const optionalString = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((v) => (v == null || String(v).trim() === '' ? null : String(v).trim()));

const PCGRowSchema = z.object({
  month_id: z.string().trim().min(1).max(20),
  entity_code: z.string().trim().min(1).max(40),
  ca: numberLike,
  charges: numberLike,
  contribution: numberLike,
  margin_pct: numberLike,
  deals: optionalNumber,
  warning: optionalString,
});
type PCGRow = z.infer<typeof PCGRowSchema>;

const FinRowSchema = z.object({
  company_id: z.string().trim().uuid({ message: 'company_id doit être un UUID' }),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  revenue_actual: numberLike,
  revenue_budget: numberLike,
  revenue_prior_year: numberLike,
  cash_balance: numberLike,
  fx_rate: optionalNumber,
});
type FinRow = z.infer<typeof FinRowSchema>;

// ---------------------------------------------------------------------------
// Types UI
// ---------------------------------------------------------------------------

type RowError = { line: number; field?: string; message: string };
type ParseResult<T> = { ok: T[]; errors: RowError[]; rawCount: number };

interface CsvCardProps {
  title: string;
  description: string;
  template: string;
  templateName: string;
  expectedHeaders: readonly string[];
  parse: (text: string, validKeys: { months?: Set<string>; entities?: Set<string>; companies?: Set<string> }) => ParseResult<any>;
  commit: (rows: any[]) => Promise<{ inserted: number }>;
  validKeys: { months?: Set<string>; entities?: Set<string>; companies?: Set<string> };
}

// ---------------------------------------------------------------------------
// Generic header validation
// ---------------------------------------------------------------------------

function validateHeaders(headers: string[], expected: readonly string[]): RowError[] {
  const errs: RowError[] = [];
  const got = new Set(headers.map((h) => h.trim()));
  const want = new Set(expected);
  expected.forEach((h) => {
    if (!got.has(h)) errs.push({ line: 0, field: h, message: `colonne manquante` });
  });
  headers.forEach((h) => {
    const t = h.trim();
    if (!want.has(t)) errs.push({ line: 0, field: t, message: `colonne inattendue` });
  });
  return errs;
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parsePCG(text: string, validKeys: { months?: Set<string>; entities?: Set<string> }): ParseResult<PCGRow> {
  const errors: RowError[] = [];
  const ok: PCGRow[] = [];
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });
  if (parsed.errors.length) {
    parsed.errors.forEach((e) => errors.push({ line: (e.row ?? 0) + 2, message: e.message }));
  }
  const headers = parsed.meta.fields ?? [];
  errors.push(...validateHeaders(headers, PCG_HEADERS));
  // Stop early if headers wrong — pas la peine de valider les lignes
  const headerErrs = errors.filter((e) => e.line === 0);
  if (headerErrs.length === 0) {
    const seen = new Set<string>();
    parsed.data.forEach((raw, i) => {
      const line = i + 2;
      const r = PCGRowSchema.safeParse(raw);
      if (!r.success) {
        r.error.issues.forEach((iss) => {
          errors.push({ line, field: iss.path.join('.'), message: iss.message });
        });
        return;
      }
      const row = r.data;
      const key = `${row.month_id}|${row.entity_code}`;
      if (seen.has(key)) {
        errors.push({ line, message: `doublon (month_id+entity_code) déjà présent dans le CSV` });
        return;
      }
      seen.add(key);
      if (validKeys.months && !validKeys.months.has(row.month_id)) {
        errors.push({ line, field: 'month_id', message: `mois inconnu (pas dans pcgroup_months)` });
        return;
      }
      if (validKeys.entities && !validKeys.entities.has(row.entity_code)) {
        errors.push({ line, field: 'entity_code', message: `entité inconnue (pas dans pcgroup_entities)` });
        return;
      }
      ok.push(row);
    });
  }
  return { ok, errors, rawCount: parsed.data.length };
}

function parseFin(text: string, validKeys: { companies?: Set<string> }): ParseResult<FinRow> {
  const errors: RowError[] = [];
  const ok: FinRow[] = [];
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });
  if (parsed.errors.length) {
    parsed.errors.forEach((e) => errors.push({ line: (e.row ?? 0) + 2, message: e.message }));
  }
  const headers = parsed.meta.fields ?? [];
  errors.push(...validateHeaders(headers, FIN_HEADERS));
  const headerErrs = errors.filter((e) => e.line === 0);
  if (headerErrs.length === 0) {
    const seen = new Set<string>();
    parsed.data.forEach((raw, i) => {
      const line = i + 2;
      const r = FinRowSchema.safeParse(raw);
      if (!r.success) {
        r.error.issues.forEach((iss) => {
          errors.push({ line, field: iss.path.join('.'), message: iss.message });
        });
        return;
      }
      const row = r.data;
      const key = `${row.company_id}|${row.year}|${row.month}`;
      if (seen.has(key)) {
        errors.push({ line, message: `doublon (company+year+month) déjà présent dans le CSV` });
        return;
      }
      seen.add(key);
      if (validKeys.companies && !validKeys.companies.has(row.company_id)) {
        errors.push({ line, field: 'company_id', message: `company introuvable / sans accès` });
        return;
      }
      ok.push(row);
    });
  }
  return { ok, errors, rawCount: parsed.data.length };
}

// ---------------------------------------------------------------------------
// Commits (upsert)
// ---------------------------------------------------------------------------

async function commitPCG(rows: PCGRow[]) {
  if (rows.length === 0) return { inserted: 0 };
  const { error } = await supabase
    .from('pcgroup_manual_facts')
    .upsert(rows as any, { onConflict: 'month_id,entity_code' });
  if (error) throw new Error(error.message);
  return { inserted: rows.length };
}

async function commitFin(rows: FinRow[]) {
  if (rows.length === 0) return { inserted: 0 };
  const { error } = await supabase
    .from('monthly_financials')
    .upsert(rows as any, { onConflict: 'company_id,year,month' });
  if (error) throw new Error(error.message);
  return { inserted: rows.length };
}

// ---------------------------------------------------------------------------
// Reusable card UI per target
// ---------------------------------------------------------------------------

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function CsvCard({ title, description, template, templateName, expectedHeaders, parse, commit, validKeys }: CsvCardProps) {
  const [text, setText] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const result = useMemo(() => (text ? parse(text, validKeys) : null), [text, parse, validKeys]);

  const onFile = async (f: File | null) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (>5MB)');
      return;
    }
    setFilename(f.name);
    setText(await f.text());
  };

  const handleCommit = async () => {
    if (!result || result.errors.length > 0 || result.ok.length === 0) return;
    setBusy(true);
    try {
      const { inserted } = await commit(result.ok);
      toast.success(`${inserted} ligne(s) importée(s) dans ${title}`);

      // Auto-trigger : recalcul YTD + contrôle d'alignement après chaque import.
      const validation = runPostImportValidation({ source: title, inserted });
      if (validation.status === 'ok') {
        toast.success('Contrôle d\'alignement & recalcul YTD : OK');
      } else {
        toast.warning(
          `Validation : ${validation.alignment.issuesCount} écart(s) d'alignement, ${validation.ytd.correctionsCount} YTD/dérivés à corriger`,
        );
      }

      setText(null); setFilename(''); if (inputRef.current) inputRef.current.value = '';
    } catch (e: any) {
      toast.error(`Échec import : ${e.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" /> {title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          <div className="text-xs text-muted-foreground mt-2 font-mono">
            colonnes : {expectedHeaders.join(', ')}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => downloadText(templateName, template)}>
          <Download className="w-4 h-4 mr-2" /> Template
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        {filename && <Badge variant="secondary">{filename}</Badge>}
      </div>

      {result && (
        <div className="space-y-3 border-t pt-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Lignes lues : {result.rawCount}</Badge>
            <Badge variant={result.ok.length > 0 ? 'default' : 'secondary'}>
              <CheckCircle2 className="w-3 h-3 mr-1" /> Valides : {result.ok.length}
            </Badge>
            <Badge variant={result.errors.length > 0 ? 'destructive' : 'secondary'}>
              <AlertTriangle className="w-3 h-3 mr-1" /> Erreurs : {result.errors.length}
            </Badge>
          </div>

          {result.errors.length > 0 && (
            <div className="max-h-48 overflow-auto rounded border bg-destructive/5 p-3 text-xs space-y-1 font-mono">
              {result.errors.slice(0, 50).map((e, i) => (
                <div key={i}>
                  <span className="text-destructive font-semibold">
                    {e.line === 0 ? 'header' : `L${e.line}`}
                  </span>
                  {e.field && <span className="text-muted-foreground"> · {e.field}</span>} — {e.message}
                </div>
              ))}
              {result.errors.length > 50 && (
                <div className="text-muted-foreground">… et {result.errors.length - 50} autres</div>
              )}
            </div>
          )}

          {result.ok.length > 0 && (
            <div className="rounded border overflow-x-auto text-xs">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>{expectedHeaders.map((h) => <th key={h} className="text-left px-2 py-1">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {result.ok.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t">
                      {expectedHeaders.map((h) => (
                        <td key={h} className="px-2 py-1">{String((r as any)[h] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.ok.length > 5 && (
                <div className="px-2 py-1 text-muted-foreground bg-muted/50">… {result.ok.length - 5} autres lignes</div>
              )}
            </div>
          )}

          <Button
            onClick={handleCommit}
            disabled={busy || result.errors.length > 0 || result.ok.length === 0}
            className="w-full"
          >
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Importer {result.ok.length} ligne(s) (upsert)
          </Button>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Export section — same columns/order as the import templates (round-trip safe)
// ---------------------------------------------------------------------------

function toCsv(headers: readonly string[], rows: any[]): string {
  const esc = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}

type PreviewState = {
  kind: 'pcg' | 'fin';
  headers: readonly string[];
  rows: any[];
  filename: string;
} | null;

function ExportSection() {
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>(null);

  const loadPCG = async () => {
    setBusy('pcg');
    try {
      const { data, error } = await supabase
        .from('pcgroup_manual_facts')
        .select('month_id, entity_code, ca, charges, contribution, margin_pct, deals, warning')
        .order('month_id').order('entity_code');
      if (error) throw error;
      setPreview({
        kind: 'pcg',
        headers: PCG_HEADERS,
        rows: data ?? [],
        filename: `pcgroup_manual_facts_${new Date().toISOString().slice(0, 10)}.csv`,
      });
    } catch (e: any) {
      toast.error(`Chargement échoué : ${e.message ?? e}`);
    } finally {
      setBusy(null);
    }
  };

  const loadFin = async () => {
    setBusy('fin');
    try {
      const { data, error } = await supabase
        .from('monthly_financials')
        .select('company_id, year, month, revenue_actual, revenue_budget, revenue_prior_year, cash_balance, fx_rate')
        .order('company_id').order('year').order('month');
      if (error) throw error;
      setPreview({
        kind: 'fin',
        headers: FIN_HEADERS,
        rows: data ?? [],
        filename: `monthly_financials_${new Date().toISOString().slice(0, 10)}.csv`,
      });
    } catch (e: any) {
      toast.error(`Chargement échoué : ${e.message ?? e}`);
    } finally {
      setBusy(null);
    }
  };

  const confirmDownload = () => {
    if (!preview) return;
    downloadText(preview.filename, toCsv(preview.headers, preview.rows));
    toast.success(`${preview.rows.length} ligne(s) exportée(s)`);
    setPreview(null);
  };

  return (
    <Card className="p-6 space-y-3">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Download className="w-5 h-5" /> Export CSV
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Prévisualisez les données avant téléchargement. Format identique aux templates d'import (round-trip via upsert).
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={loadPCG} disabled={busy !== null}>
          {busy === 'pcg' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
          Prévisualiser PCGroup manual facts
        </Button>
        <Button variant="outline" onClick={loadFin} disabled={busy !== null}>
          {busy === 'fin' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
          Prévisualiser Monthly financials
        </Button>
      </div>

      {preview && (
        <div className="space-y-3 border-t pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{preview.rows.length} ligne(s)</Badge>
            <Badge variant="secondary">{preview.headers.length} colonne(s)</Badge>
            <Badge variant="outline" className="font-mono">{preview.filename}</Badge>
          </div>
          <div className="rounded border overflow-x-auto text-xs max-h-72">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>{preview.headers.map((h) => <th key={h} className="text-left px-2 py-1 whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 10).map((r, i) => (
                  <tr key={i} className="border-t">
                    {preview.headers.map((h) => (
                      <td key={h} className="px-2 py-1 whitespace-nowrap">{String((r as any)[h] ?? '')}</td>
                    ))}
                  </tr>
                ))}
                {preview.rows.length === 0 && (
                  <tr><td colSpan={preview.headers.length} className="px-2 py-3 text-center text-muted-foreground">Aucune donnée</td></tr>
                )}
              </tbody>
            </table>
            {preview.rows.length > 10 && (
              <div className="px-2 py-1 text-muted-foreground bg-muted/50">… {preview.rows.length - 10} autre(s) ligne(s)</div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={confirmDownload} disabled={preview.rows.length === 0}>
              <Download className="w-4 h-4 mr-2" /> Télécharger le CSV
            </Button>
            <Button variant="ghost" onClick={() => setPreview(null)}>Annuler</Button>
          </div>
        </div>
      )}
    </Card>
  );
}



// ---------------------------------------------------------------------------

export default function AdminCsvImport() {
  const navigate = useNavigate();
  const [months, setMonths] = useState<Set<string>>(new Set());
  const [entities, setEntities] = useState<Set<string>>(new Set());
  const [companies, setCompanies] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [mRes, eRes, cRes] = await Promise.all([
        supabase.from('pcgroup_months').select('month_id'),
        supabase.from('pcgroup_entities').select('code'),
        supabase.from('companies').select('id'),
      ]);
      setMonths(new Set((mRes.data ?? []).map((r: any) => r.month_id)));
      setEntities(new Set((eRes.data ?? []).map((r: any) => r.code)));
      setCompanies(new Set((cRes.data ?? []).map((r: any) => r.id)));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
            <h1 className="text-2xl font-semibold mt-2">Import CSV</h1>
            <p className="text-sm text-muted-foreground">
              Téléchargez le template, remplissez-le, puis envoyez-le. Toute erreur de format ou clé inconnue est listée avant l'import (aucun upload silencieux). Le contrôle d'alignement et le recalcul YTD sont déclenchés automatiquement après chaque import.
            </p>
          </div>
        </div>

        <PostImportValidationStatus />

        <ExportSection />


        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          </div>
        ) : (
          <Tabs defaultValue="pcg">
            <TabsList>
              <TabsTrigger value="pcg">PCGroup manual facts</TabsTrigger>
              <TabsTrigger value="fin">Monthly financials</TabsTrigger>
            </TabsList>

            <TabsContent value="pcg" className="mt-4">
              <CsvCard
                title="PCGroup — manual facts"
                description="Faits mensuels par entité (SPY/Comment/Holding…). Upsert sur (month_id, entity_code)."
                template={PCG_TEMPLATE}
                templateName="pcgroup_manual_facts_template.csv"
                expectedHeaders={PCG_HEADERS}
                parse={parsePCG as any}
                commit={commitPCG as any}
                validKeys={{ months, entities }}
              />
            </TabsContent>

            <TabsContent value="fin" className="mt-4">
              <CsvCard
                title="Monthly financials"
                description="P&L mensuel générique par company. Upsert sur (company_id, year, month)."
                template={FIN_TEMPLATE}
                templateName="monthly_financials_template.csv"
                expectedHeaders={FIN_HEADERS}
                parse={parseFin as any}
                commit={commitFin as any}
                validKeys={{ companies }}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
