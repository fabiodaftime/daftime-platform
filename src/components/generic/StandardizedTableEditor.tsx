// Éditeur tabulaire des données standardisées : { sections: [{ key, label, rows:[{label,value,unit}] }] }
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface Row { label: string; value: string | number | null; unit?: string }
interface Section { key: string; label: string; rows: Row[] }

export function StandardizedTableEditor({
  value,
  onChange,
}: {
  value: any;
  onChange: (v: any) => void;
}) {
  const sections: Section[] = Array.isArray(value?.sections) ? value.sections : [];

  const commit = (next: Section[]) => onChange({ ...(value ?? {}), sections: next });

  const setSection = (si: number, patch: Partial<Section>) =>
    commit(sections.map((s, i) => (i === si ? { ...s, ...patch } : s)));

  const setRow = (si: number, ri: number, patch: Partial<Row>) =>
    setSection(si, { rows: sections[si].rows.map((r, i) => (i === ri ? { ...r, ...patch } : r)) });

  const addRow = (si: number) =>
    setSection(si, { rows: [...sections[si].rows, { label: '', value: '', unit: '' }] });

  const removeRow = (si: number, ri: number) =>
    setSection(si, { rows: sections[si].rows.filter((_, i) => i !== ri) });

  const addSection = () =>
    commit([...sections, { key: `section_${sections.length + 1}`, label: 'Nouvelle section', rows: [] }]);

  const removeSection = (si: number) => commit(sections.filter((_, i) => i !== si));

  if (sections.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune donnée standardisée pour ce mois.</p>;
  }

  return (
    <div className="space-y-5">
      {sections.map((section, si) => (
        <div key={si} className="border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 border-b">
            <input
              className="bg-transparent font-semibold text-sm flex-1 outline-none"
              value={section.label}
              onChange={(e) => setSection(si, { label: e.target.value })}
            />
            <Button variant="ghost" size="sm" onClick={() => removeSection(si)} title="Supprimer la section">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b">
                <th className="px-3 py-1.5 w-1/2">Libellé</th>
                <th className="px-3 py-1.5">Valeur</th>
                <th className="px-3 py-1.5 w-24">Unité</th>
                <th className="px-3 py-1.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, ri) => (
                <tr key={ri} className="border-b last:border-0">
                  <td className="px-3 py-1">
                    <input className="w-full bg-transparent outline-none" value={row.label}
                      onChange={(e) => setRow(si, ri, { label: e.target.value })} />
                  </td>
                  <td className="px-3 py-1">
                    <input className="w-full bg-transparent outline-none tabular-nums"
                      value={row.value ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const num = Number(raw.replace(',', '.'));
                        setRow(si, ri, { value: raw !== '' && !Number.isNaN(num) ? num : raw });
                      }} />
                  </td>
                  <td className="px-3 py-1">
                    <input className="w-full bg-transparent outline-none" value={row.unit ?? ''}
                      onChange={(e) => setRow(si, ri, { unit: e.target.value })} />
                  </td>
                  <td className="px-3 py-1 text-right">
                    <button className="text-muted-foreground hover:text-destructive" onClick={() => removeRow(si, ri)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 py-1.5 border-t">
            <Button variant="ghost" size="sm" onClick={() => addRow(si)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Ligne
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addSection}>
        <Plus className="w-4 h-4 mr-1" /> Ajouter une section
      </Button>
    </div>
  );
}
