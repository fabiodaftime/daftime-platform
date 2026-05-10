// Super Admin: configure Google Sheets → entity_monthly_inputs sync.
// Phase 1: pilot on 'digit'. Per-entity mapping of cells to canonical fields.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Save, FlaskConical, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ENTITY_REGISTRY, SUPPORTED_MONTHS, type EntityLayoutKey } from '@/lib/entityInputs/schema';

interface MappingRow {
  id: string;
  entity_layout: string;
  source_type: string;
  source_ref: string;
  sheet_tab: string | null;
  field_map: Record<string, { cell: string; type?: 'number' | 'integer' }>;
  month_map: Record<string, { tab?: string }>;
  auto_sync: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
}

function extractSheetId(input: string): string {
  const m = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : input.trim();
}

export default function AdminDataSources() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [layout, setLayout] = useState<EntityLayoutKey>('digit');
  const meta = ENTITY_REGISTRY[layout];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [mapping, setMapping] = useState<MappingRow | null>(null);

  // Form state
  const [sourceUrl, setSourceUrl] = useState('');
  const [defaultTab, setDefaultTab] = useState('Sheet1');
  const [autoSync, setAutoSync] = useState(false);
  const [fieldCells, setFieldCells] = useState<Record<string, string>>({});
  const [monthTabs, setMonthTabs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('entity_data_mappings')
        .select('*')
        .eq('entity_layout', layout)
        .maybeSingle();
      if (cancelled) return;
      if (error && error.code !== 'PGRST116') {
        toast({ title: 'Erreur chargement', description: error.message, variant: 'destructive' });
      }
      const row = (data as unknown as MappingRow | null) ?? null;
      setMapping(row);
      if (row) {
        setSourceUrl(row.source_ref);
        setDefaultTab(row.sheet_tab ?? 'Sheet1');
        setAutoSync(row.auto_sync);
        const fc: Record<string, string> = {};
        for (const f of meta.fields) fc[f.key] = row.field_map?.[f.key]?.cell ?? '';
        setFieldCells(fc);
        const mt: Record<string, string> = {};
        for (const m of SUPPORTED_MONTHS) mt[m.id] = row.month_map?.[m.id]?.tab ?? '';
        setMonthTabs(mt);
      } else {
        setSourceUrl('');
        setDefaultTab('Sheet1');
        setAutoSync(false);
        const fc: Record<string, string> = {};
        for (const f of meta.fields) fc[f.key] = '';
        setFieldCells(fc);
        const mt: Record<string, string> = {};
        for (const m of SUPPORTED_MONTHS) mt[m.id] = '';
        setMonthTabs(mt);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, layout, meta]);

  const groups = useMemo(() => {
    const out: string[] = [];
    for (const f of meta.fields) if (!out.includes(f.group)) out.push(f.group);
    return out;
  }, [meta]);

  if (authLoading) return <div className="p-8">Chargement…</div>;
  if (!isSuperAdmin) {
    return <div className="p-8 text-destructive">Accès Super Admin requis.</div>;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const sheetId = extractSheetId(sourceUrl);
      if (!sheetId) throw new Error('Lien Google Sheet invalide');
      const field_map: Record<string, { cell: string; type: string }> = {};
      for (const f of meta.fields) {
        const cell = fieldCells[f.key]?.trim();
        if (cell) field_map[f.key] = { cell, type: f.unit === 'count' ? 'integer' : 'number' };
      }
      const month_map: Record<string, { tab: string }> = {};
      for (const m of SUPPORTED_MONTHS) {
        const tab = monthTabs[m.id]?.trim();
        if (tab) month_map[m.id] = { tab };
      }

      const payload = {
        entity_layout: layout,
        source_type: 'google_sheets',
        source_ref: sheetId,
        sheet_tab: defaultTab || null,
        field_map,
        month_map,
        auto_sync: autoSync,
      };

      const { error } = mapping
        ? await supabase.from('entity_data_mappings').update(payload).eq('id', mapping.id)
        : await supabase.from('entity_data_mappings').insert(payload);
      if (error) throw error;
      toast({ title: 'Mapping enregistré' });
      // Refresh
      const { data } = await supabase
        .from('entity_data_mappings')
        .select('*')
        .eq('entity_layout', layout)
        .maybeSingle();
      setMapping((data as unknown as MappingRow | null) ?? null);
    } catch (e) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const runSync = async (dry: boolean) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-gsheet-to-inputs', {
        body: { entity_layout: layout, dry_run: dry },
      });
      if (error) throw error;
      const r = data as { ok?: boolean; results?: Array<{ month_id: string; status: string; error?: string }> };
      const ok = r?.ok;
      const errs = (r?.results ?? []).filter((x) => x.status === 'error');
      toast({
        title: dry ? 'Aperçu sync (dry-run)' : 'Synchronisation terminée',
        description: ok
          ? `${(r?.results ?? []).length} mois traités sans erreur`
          : `Erreurs: ${errs.map((e) => `${e.month_id}: ${e.error}`).join(' · ')}`,
        variant: ok ? 'default' : 'destructive',
      });
      // Refresh mapping to update last_sync_*
      if (!dry) {
        const { data: refreshed } = await supabase
          .from('entity_data_mappings')
          .select('*')
          .eq('entity_layout', layout)
          .maybeSingle();
        setMapping((refreshed as unknown as MappingRow | null) ?? null);
      }
    } catch (e) {
      toast({
        title: 'Sync échouée',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Sources de données</h1>
              <p className="text-sm text-muted-foreground">
                Branche un Google Sheet à une entité. La synchronisation alimente automatiquement les
                dashboards et le consolidé.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 border rounded-md bg-background text-sm"
              value={layout}
              onChange={(e) => setLayout(e.target.value as EntityLayoutKey)}
            >
              {Object.entries(ENTITY_REGISTRY).map(([key, v]) => (
                <option key={key} value={key}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Source Google Sheets</span>
              {mapping?.last_sync_at && (
                <Badge variant={mapping.last_sync_status === 'ok' ? 'default' : 'destructive'}>
                  Dernière sync : {new Date(mapping.last_sync_at).toLocaleString('fr-FR')} ·{' '}
                  {mapping.last_sync_status}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Colle l'URL d'un Google Sheet partagé avec le compte connecté. Onglet par défaut utilisé
              si un mois ne précise pas le sien.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label>URL ou ID du Google Sheet</Label>
                <Input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                />
              </div>
              <div>
                <Label>Onglet par défaut</Label>
                <Input
                  value={defaultTab}
                  onChange={(e) => setDefaultTab(e.target.value)}
                  placeholder="Sheet1"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">Auto-sync activé</div>
                <div className="text-xs text-muted-foreground">
                  Permet le déclenchement par webhook (Apps Script) ou cron.
                </div>
              </div>
              <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            </div>
            {mapping?.last_sync_error && (
              <div className="text-xs text-destructive">⚠ {mapping.last_sync_error}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mapping des cellules → champs canoniques</CardTitle>
            <CardDescription>
              Pour chaque champ, indique la cellule (ex. <code>B5</code>) qui contient la valeur. Les
              cellules sans valeur sont ignorées.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {groups.map((g) => (
              <div key={g}>
                <h3 className="text-sm font-semibold mb-2">{g}</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {meta.fields
                    .filter((f) => f.group === g)
                    .map((f) => (
                      <div key={f.key} className="grid grid-cols-[1fr_120px] gap-2 items-center">
                        <Label className="text-sm">
                          {f.label}{' '}
                          <span className="text-xs text-muted-foreground">({f.unit})</span>
                        </Label>
                        <Input
                          value={fieldCells[f.key] ?? ''}
                          onChange={(e) =>
                            setFieldCells((p) => ({ ...p, [f.key]: e.target.value }))
                          }
                          placeholder="B5"
                        />
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Onglet par mois</CardTitle>
            <CardDescription>
              Si chaque mois a son propre onglet, indique son nom ici. Sinon laisse vide pour utiliser
              l'onglet par défaut.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {SUPPORTED_MONTHS.map((m) => (
                <div key={m.id} className="grid grid-cols-[1fr_180px] gap-2 items-center">
                  <Label className="text-sm">{m.label}</Label>
                  <Input
                    value={monthTabs[m.id] ?? ''}
                    onChange={(e) => setMonthTabs((p) => ({ ...p, [m.id]: e.target.value }))}
                    placeholder="ex. Janvier 2026"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex flex-wrap gap-2 justify-end">
          {sourceUrl && (
            <Button variant="ghost" asChild>
              <a
                href={`https://docs.google.com/spreadsheets/d/${extractSheetId(sourceUrl)}/edit`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-1" /> Ouvrir le Sheet
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={() => runSync(true)} disabled={syncing || !mapping}>
            <FlaskConical className="h-4 w-4 mr-1" />
            Test (dry-run)
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Enregistrement…' : 'Enregistrer le mapping'}
          </Button>
          <Button onClick={() => runSync(false)} disabled={syncing || !mapping}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronisation…' : 'Synchroniser maintenant'}
          </Button>
        </div>
      </div>
    </div>
  );
}
