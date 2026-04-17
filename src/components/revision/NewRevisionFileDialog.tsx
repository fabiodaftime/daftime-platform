import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createRevisionFile } from './useRevisionData';
import type { RevisionJurisdiction } from './types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string;
  entityId: string;
  jurisdiction: RevisionJurisdiction;
  onCreated: () => void;
}

export function NewRevisionFileDialog({ open, onOpenChange, companyId, entityId, jurisdiction, onCreated }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const year = new Date().getFullYear();
  const [fy, setFy] = useState(year);
  const [start, setStart] = useState(`${year}-01-01`);
  const [end, setEnd] = useState(`${year}-12-31`);
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await createRevisionFile({
        companyId, entityId, fiscalYear: fy, periodStart: start, periodEnd: end,
        jurisdiction, deadline: deadline || null, userId: user.id,
      });
      toast({ title: 'Dossier créé', description: 'Cycles et checklist initialisés.' });
      onCreated();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau dossier de révision</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Exercice fiscal</Label>
            <Input type="number" value={fy} onChange={(e) => setFy(parseInt(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Début de période</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label>Fin de période</Label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Deadline (optionnel)</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={submit} disabled={loading}>{loading ? 'Création…' : 'Créer le dossier'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
