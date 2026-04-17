import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  RevisionEntity, RevisionFile, RevisionCycle, RevisionChecklistItem,
  RevisionLeadSchedule, RevisionAnomaly, RevisionComment, RevisionTemplate,
} from './types';

export function useRevisionEntities(companyId: string | undefined) {
  const [entities, setEntities] = useState<RevisionEntity[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const { data } = await supabase
        .from('revision_entities')
        .select('*')
        .eq('company_id', companyId)
        .order('display_order');
      setEntities((data as any) || []);
      setLoading(false);
    })();
  }, [companyId]);
  return { entities, loading };
}

export function useRevisionFiles(companyId: string | undefined, entityId: string | undefined) {
  const [files, setFiles] = useState<RevisionFile[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!companyId || !entityId) return;
    setLoading(true);
    const { data } = await supabase
      .from('revision_files')
      .select('*')
      .eq('company_id', companyId)
      .eq('entity_id', entityId)
      .order('fiscal_year', { ascending: false });
    setFiles((data as any) || []);
    setLoading(false);
  }, [companyId, entityId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { files, loading, refetch };
}

export function useRevisionCycles(fileId: string | undefined) {
  const [cycles, setCycles] = useState<RevisionCycle[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    const { data } = await supabase
      .from('revision_cycles')
      .select('*')
      .eq('revision_file_id', fileId)
      .order('order_index');
    setCycles((data as any) || []);
    setLoading(false);
  }, [fileId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { cycles, loading, refetch };
}

export function useRevisionCycleData(cycleId: string | undefined) {
  const [checklist, setChecklist] = useState<RevisionChecklistItem[]>([]);
  const [leadSchedule, setLeadSchedule] = useState<RevisionLeadSchedule[]>([]);
  const [anomalies, setAnomalies] = useState<RevisionAnomaly[]>([]);
  const [comments, setComments] = useState<RevisionComment[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!cycleId) return;
    setLoading(true);
    const [c, l, a, cm] = await Promise.all([
      supabase.from('revision_checklist_items').select('*').eq('cycle_id', cycleId).order('order_index'),
      supabase.from('revision_lead_schedules').select('*').eq('cycle_id', cycleId).order('order_index'),
      supabase.from('revision_anomalies').select('*').eq('cycle_id', cycleId).order('created_at', { ascending: false }),
      supabase.from('revision_comments').select('*').eq('cycle_id', cycleId).order('created_at', { ascending: false }),
    ]);
    setChecklist((c.data as any) || []);
    setLeadSchedule((l.data as any) || []);
    setAnomalies((a.data as any) || []);
    setComments((cm.data as any) || []);
    setLoading(false);
  }, [cycleId]);

  useEffect(() => { refetch(); }, [refetch]);
  return { checklist, leadSchedule, anomalies, comments, loading, refetch };
}

export async function fetchTemplates(jurisdiction: 'uae' | 'france' | 'portugal'): Promise<RevisionTemplate[]> {
  const { data } = await supabase
    .from('revision_templates')
    .select('*')
    .eq('jurisdiction', jurisdiction)
    .eq('is_active', true)
    .order('order_index');
  return (data as any) || [];
}

export async function createRevisionFile(args: {
  companyId: string;
  entityId: string;
  fiscalYear: number;
  periodStart: string;
  periodEnd: string;
  jurisdiction: 'uae' | 'france' | 'portugal';
  deadline?: string | null;
  userId: string;
}) {
  const { data: file, error } = await supabase
    .from('revision_files')
    .insert({
      company_id: args.companyId,
      entity_id: args.entityId,
      fiscal_year: args.fiscalYear,
      period_start: args.periodStart,
      period_end: args.periodEnd,
      jurisdiction: args.jurisdiction,
      deadline: args.deadline || null,
      created_by: args.userId,
      status: 'todo',
    })
    .select()
    .single();
  if (error || !file) throw error;

  const templates = await fetchTemplates(args.jurisdiction);
  for (const t of templates) {
    const { data: cycle } = await supabase
      .from('revision_cycles')
      .insert({
        revision_file_id: file.id,
        cycle_code: t.cycle_code,
        cycle_name: t.cycle_name,
        order_index: t.order_index,
      })
      .select()
      .single();
    if (cycle && Array.isArray(t.default_checklist_items)) {
      const items = t.default_checklist_items.map((it: any, idx: number) => ({
        cycle_id: cycle.id,
        item_code: it.code,
        label: it.label,
        is_mandatory: !!it.mandatory,
        evidence_required: !!it.evidence,
        order_index: idx,
      }));
      if (items.length) await supabase.from('revision_checklist_items').insert(items);
    }
  }
  return file;
}
