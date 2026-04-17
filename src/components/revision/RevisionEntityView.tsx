import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Folder, Clock } from 'lucide-react';
import { useRevisionFiles } from './useRevisionData';
import { fileStatusLabel, formatDate } from './revisionUtils';
import { NewRevisionFileDialog } from './NewRevisionFileDialog';
import { RevisionFileView } from './RevisionFileView';
import type { RevisionEntity } from './types';

interface Props {
  companyId: string;
  entity: RevisionEntity;
  currency?: string;
}

export function RevisionEntityView({ companyId, entity, currency }: Props) {
  const { files, refetch } = useRevisionFiles(companyId, entity.id);
  const [open, setOpen] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const activeFile = files.find((f) => f.id === activeFileId);

  if (activeFile) {
    return (
      <RevisionFileView file={activeFile} currency={currency} onBack={() => setActiveFileId(null)} />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Folder className="w-5 h-5" /> {entity.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            Juridiction : {entity.jurisdiction.toUpperCase()} · Dossiers de révision
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1">
          <Plus className="w-4 h-4" /> Nouveau dossier de révision
        </Button>
      </div>

      {files.length === 0 ? (
        <Card className="p-12 text-center">
          <Folder className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Aucun dossier de révision.</p>
          <Button variant="outline" size="sm" className="mt-4 gap-1" onClick={() => setOpen(true)}>
            <Plus className="w-3 h-3" /> Créer le premier dossier
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map((f) => (
            <Card
              key={f.id}
              className="p-4 hover:shadow-md cursor-pointer transition-shadow"
              onClick={() => setActiveFileId(f.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">Exercice {f.fiscal_year}</span>
                <Badge variant="outline">{fileStatusLabel(f.status)}</Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>{formatDate(f.period_start)} → {formatDate(f.period_end)}</div>
                {f.deadline && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Deadline : {formatDate(f.deadline)}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <NewRevisionFileDialog
        open={open}
        onOpenChange={setOpen}
        companyId={companyId}
        entityId={entity.id}
        jurisdiction={entity.jurisdiction}
        onCreated={refetch}
      />
    </div>
  );
}
