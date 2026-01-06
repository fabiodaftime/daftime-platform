import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DrillDownData {
  title: string;
  data: {
    label: string;
    actual: number;
    budget: number;
    variance: number;
  }[];
  currency: string;
}

interface DrillDownDrawerProps {
  open: boolean;
  onClose: () => void;
  data: DrillDownData | null;
}

export function DrillDownDrawer({ open, onClose, data }: DrillDownDrawerProps) {
  if (!data) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: data.currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-dashboard-card border-dashboard-border text-dashboard-text w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle className="text-dashboard-text">{data.title}</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-dashboard-border hover:bg-transparent">
                <TableHead className="text-dashboard-text-muted">Item</TableHead>
                <TableHead className="text-right text-dashboard-text-muted">Actual</TableHead>
                <TableHead className="text-right text-dashboard-text-muted">Budget</TableHead>
                <TableHead className="text-right text-dashboard-text-muted">Var %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((row, index) => (
                <TableRow key={index} className="border-dashboard-border hover:bg-dashboard-card-hover">
                  <TableCell className="font-medium text-dashboard-text">
                    {row.label}
                  </TableCell>
                  <TableCell className="text-right text-dashboard-text">
                    {formatCurrency(row.actual)}
                  </TableCell>
                  <TableCell className="text-right text-dashboard-text-muted">
                    {formatCurrency(row.budget)}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${
                    row.variance >= 0 ? 'text-kpi-positive' : 'text-kpi-negative'
                  }`}>
                    {formatPercent(row.variance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SheetContent>
    </Sheet>
  );
}
