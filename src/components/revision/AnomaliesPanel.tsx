import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Plus } from 'lucide-react';
import { severityColor, severityLabel, formatCurrency } from './revisionUtils';
import type { RevisionAnomaly, RevisionAnomalySeverity } from './types';

interface Props {
  cycleId: string;
  fileId: string;
  anomalies: RevisionAnomaly[];
  currency?: string;
  onChange: () => void;
}

export function AnomaliesPanel({ cycleId, fileId, anomalies, currency = 'AED', onChange }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [sev, setSev] = useState<RevisionAnomalySeverity>('medium');
  const [amount, setAmount] = useState('');
  const [debit, setDebit] = useState('');
  const [credit, setCredit] = useState('');

  const submit = async () => {
    if (!desc || !user) return;
    await supabase.from('revision_anomalies').insert({
      cycle_id: cycleId,
      revision_file_id: fileId,
      severity: sev,
      description: desc,
      proposed_adjustment_amount: amount ? parseFloat(amount) : null,
      debit_account: debit || null,
      credit_account: credit || null,
      created_by: user.id,
    });
    setOpen(false);
    setDesc(''); setAmount(''); setDebit(''); setCredit(''); setSev('medium');
    onChange();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          Anomalies & Écritures d'ajustement ({anomalies.length})
        </h4>
        <Button size="sm" variant="outline" onClick={() => setOpen(!open)} className="gap-1">
          <Plus className="w-3 h-3" /> Nouvelle anomalie
        </Button>
      </div>

      {open && (
        <div className="border rounded-md p-3 space-y-2 bg-muted/30">
          <Textarea placeholder="Description de l'anomalie..." value={desc} onChange={(e) => setDesc(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Select value={sev} onValueChange={(v) => setSev(v as RevisionAnomalySeverity)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
                <SelectItem value="blocking">Bloquante</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Montant ajustement" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Input placeholder="Compte à débiter" value={debit} onChange={(e) => setDebit(e.target.value)} />
            <Input placeholder="Compte à créditer" value={credit} onChange={(e) => setCredit(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button size="sm" onClick={submit}>Créer</Button>
          </div>
        </div>
      )}

      {anomalies.length === 0 && !open && (
        <p className="text-sm text-muted-foreground text-center py-3">Aucune anomalie détectée.</p>
      )}

      {anomalies.map((a) => (
        <div key={a.id} className="border rounded-md p-3 space-y-1">
          <div className="flex items-center justify-between">
            <Badge className={severityColor(a.severity)}>{severityLabel(a.severity)}</Badge>
            <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
          <p className="text-sm">{a.description}</p>
          {a.proposed_adjustment_amount !== null && (
            <p className="text-xs text-muted-foreground">
              Ajustement : <span className="font-mono font-medium text-foreground">{formatCurrency(a.proposed_adjustment_amount, currency)}</span>
              {a.debit_account && <> · D: {a.debit_account}</>}
              {a.credit_account && <> · C: {a.credit_account}</>}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
