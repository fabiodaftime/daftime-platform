import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from './revisionUtils';
import type { RevisionLeadSchedule } from './types';

interface Props {
  cycleId: string;
  rows: RevisionLeadSchedule[];
  currency?: string;
  threshold?: number;
  onChange: () => void;
}

export function LeadSchedulePanel({ cycleId, rows, currency = 'AED', threshold = 20, onChange }: Props) {
  const [acc, setAcc] = useState('');
  const [lbl, setLbl] = useState('');
  const [n, setN] = useState('');
  const [n1, setN1] = useState('');

  const addRow = async () => {
    if (!acc || !lbl) return;
    const nb = parseFloat(n || '0');
    const n1b = parseFloat(n1 || '0');
    const pct = n1b !== 0 ? ((nb - n1b) / Math.abs(n1b)) * 100 : null;
    await supabase.from('revision_lead_schedules').insert({
      cycle_id: cycleId,
      account_number: acc,
      account_label: lbl,
      n_balance: nb,
      n1_balance: n1b,
      variance_pct: pct,
      order_index: rows.length,
    });
    setAcc(''); setLbl(''); setN(''); setN1('');
    onChange();
  };

  const toggleJustified = async (id: string, current: boolean) => {
    await supabase.from('revision_lead_schedules').update({ justified: !current }).eq('id', id);
    onChange();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">N° compte</TableHead>
              <TableHead>Libellé</TableHead>
              <TableHead className="text-right">Solde N</TableHead>
              <TableHead className="text-right">Solde N-1</TableHead>
              <TableHead className="text-right">Variation</TableHead>
              <TableHead className="text-right">%</TableHead>
              <TableHead className="w-24 text-center">Justifié</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground text-sm py-6">
                  Aucune ligne. Ajoutez des comptes ci-dessous ou importez la balance.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => {
              const overThreshold = r.variance_pct !== null && Math.abs(r.variance_pct) > threshold;
              return (
                <TableRow key={r.id} className={cn(overThreshold && !r.justified && 'bg-red-500/5')}>
                  <TableCell className="font-mono text-xs">{r.account_number}</TableCell>
                  <TableCell className="text-sm">{r.account_label}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{formatCurrency(r.n_balance, currency)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">{formatCurrency(r.n1_balance, currency)}</TableCell>
                  <TableCell className={cn('text-right font-mono text-sm', r.variance_amount > 0 ? 'text-green-600' : r.variance_amount < 0 ? 'text-red-600' : '')}>
                    {formatCurrency(r.variance_amount, currency)}
                  </TableCell>
                  <TableCell className={cn('text-right font-mono text-sm', overThreshold && !r.justified && 'text-red-600 font-semibold')}>
                    {r.variance_pct !== null ? `${r.variance_pct.toFixed(1)}%` : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="icon"
                      variant={r.justified ? 'default' : 'outline'}
                      className="h-7 w-7"
                      onClick={() => toggleJustified(r.id, r.justified)}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-12 gap-2 items-end p-3 rounded-md border bg-muted/30">
        <Input className="col-span-2" placeholder="N° compte" value={acc} onChange={(e) => setAcc(e.target.value)} />
        <Input className="col-span-4" placeholder="Libellé" value={lbl} onChange={(e) => setLbl(e.target.value)} />
        <Input className="col-span-2" placeholder="Solde N" type="number" value={n} onChange={(e) => setN(e.target.value)} />
        <Input className="col-span-2" placeholder="Solde N-1" type="number" value={n1} onChange={(e) => setN1(e.target.value)} />
        <Button className="col-span-2 gap-1" onClick={addRow}><Plus className="w-4 h-4" />Ajouter</Button>
      </div>
    </div>
  );
}
