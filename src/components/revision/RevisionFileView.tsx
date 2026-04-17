import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, FileCheck, Send, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRevisionCycles, useRevisionCycleData } from './useRevisionData';
import { cycleStatusColor, cycleStatusDot, cycleStatusLabel, formatDate } from './revisionUtils';
import { ChecklistPanel } from './ChecklistPanel';
import { LeadSchedulePanel } from './LeadSchedulePanel';
import { AnomaliesPanel } from './AnomaliesPanel';
import { CommentsPanel } from './CommentsPanel';
import type { RevisionFile } from './types';

interface Props {
  file: RevisionFile;
  currency?: string;
  onBack: () => void;
}

export function RevisionFileView({ file, currency = 'AED', onBack }: Props) {
  const { toast } = useToast();
  const { cycles, refetch: refetchCycles } = useRevisionCycles(file.id);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const activeCycleId = selectedCycleId || cycles[0]?.id || null;
  const { checklist, leadSchedule, anomalies, comments, refetch: refetchCycleData } =
    useRevisionCycleData(activeCycleId || undefined);

  const activeCycle = cycles.find((c) => c.id === activeCycleId);

  // compute progress for sidebar from the loaded checklist (only for active cycle)
  const computeProgress = (cycleId: string) => {
    if (cycleId !== activeCycleId) return null;
    const total = checklist.length;
    if (!total) return 0;
    const done = checklist.filter((i) => i.status === 'done' || i.status === 'na').length;
    return Math.round((done / total) * 100);
  };

  const submitForReview = async () => {
    if (!activeCycle) return;
    await supabase.from('revision_cycles').update({ status: 'in_review' }).eq('id', activeCycle.id);
    toast({ title: 'Soumis en revue' });
    refetchCycles();
  };

  const validateCycle = async () => {
    if (!activeCycle) return;
    const mandatoryNotDone = checklist.filter((i) => i.is_mandatory && i.status !== 'done' && i.status !== 'na');
    if (mandatoryNotDone.length) {
      toast({
        title: 'Validation impossible',
        description: `${mandatoryNotDone.length} item(s) obligatoire(s) restant(s).`,
        variant: 'destructive',
      });
      return;
    }
    await supabase.from('revision_cycles').update({ status: 'validated', progress_pct: 100 }).eq('id', activeCycle.id);
    toast({ title: 'Cycle validé' });
    refetchCycles();
  };

  const totalProgress = cycles.length
    ? Math.round((cycles.filter((c) => c.status === 'validated').length / cycles.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ChevronLeft className="w-4 h-4" /> Retour aux dossiers
        </Button>
        <div className="text-sm text-muted-foreground">
          Exercice <span className="font-semibold text-foreground">{file.fiscal_year}</span> ·
          {' '}{formatDate(file.period_start)} → {formatDate(file.period_end)} ·
          {' '}Deadline : <span className="font-medium text-foreground">{formatDate(file.deadline)}</span>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Avancement global du dossier</span>
          <span className="text-sm font-semibold">{totalProgress}%</span>
        </div>
        <Progress value={totalProgress} />
      </Card>

      <div className="grid grid-cols-12 gap-4">
        {/* SIDEBAR cycles */}
        <Card className="col-span-12 lg:col-span-3 p-2 max-h-[70vh] overflow-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase px-2 py-2">Cycles</div>
          {cycles.map((c) => {
            const prog = computeProgress(c.id);
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCycleId(c.id)}
                className={cn(
                  'w-full text-left px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors flex items-start gap-2',
                  activeCycleId === c.id && 'bg-muted',
                )}
              >
                <span className="text-base leading-none mt-0.5">{cycleStatusDot(c.status)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.cycle_name}</div>
                  {prog !== null && <Progress value={prog} className="h-1 mt-1" />}
                </div>
              </button>
            );
          })}
        </Card>

        {/* CONTENT */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          {activeCycle && (
            <>
              <Card className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FileCheck className="w-5 h-5" />
                      {activeCycle.cycle_name}
                    </h3>
                    <Badge className={cn('mt-1', cycleStatusColor(activeCycle.status))}>
                      {cycleStatusLabel(activeCycle.status)}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={submitForReview} className="gap-1">
                      <Send className="w-3 h-3" /> Soumettre en revue
                    </Button>
                    <Button size="sm" onClick={validateCycle} className="gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Valider le cycle
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="text-sm font-semibold mb-3">Feuille maîtresse (Lead Schedule)</h4>
                <LeadSchedulePanel
                  cycleId={activeCycle.id}
                  rows={leadSchedule}
                  currency={currency}
                  onChange={refetchCycleData}
                />
              </Card>

              <Card className="p-4">
                <h4 className="text-sm font-semibold mb-3">Checklist de diligences</h4>
                <ChecklistPanel items={checklist} onChange={refetchCycleData} />
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-4">
                  <AnomaliesPanel
                    cycleId={activeCycle.id}
                    fileId={file.id}
                    anomalies={anomalies}
                    currency={currency}
                    onChange={refetchCycleData}
                  />
                </Card>
                <Card className="p-4">
                  <CommentsPanel
                    cycleId={activeCycle.id}
                    fileId={file.id}
                    comments={comments}
                    onChange={refetchCycleData}
                  />
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
