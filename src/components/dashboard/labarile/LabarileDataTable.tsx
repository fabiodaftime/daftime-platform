import { cn } from '@/lib/utils';

interface TableRow {
  month: string;
  ca: number;
  ebitda: number;
  margin: number;
  status: string;
}

interface LabarileDataTableProps {
  data: TableRow[];
}

export function LabarileDataTable({ data }: LabarileDataTableProps) {
  return (
    <div className="bg-labarile-white border border-labarile-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-labarile-ice1 to-labarile-ice2">
            <tr>
              <th className="px-4 lg:px-5 py-3 lg:py-4 text-left text-[11px] lg:text-xs uppercase tracking-wider text-labarile-primary-dark font-bold">
                Mois
              </th>
              <th className="px-4 lg:px-5 py-3 lg:py-4 text-left text-[11px] lg:text-xs uppercase tracking-wider text-labarile-primary-dark font-bold">
                CA (kAED)
              </th>
              <th className="px-4 lg:px-5 py-3 lg:py-4 text-left text-[11px] lg:text-xs uppercase tracking-wider text-labarile-primary-dark font-bold">
                EBITDA (kAED)
              </th>
              <th className="px-4 lg:px-5 py-3 lg:py-4 text-left text-[11px] lg:text-xs uppercase tracking-wider text-labarile-primary-dark font-bold">
                Marge
              </th>
              <th className="px-4 lg:px-5 py-3 lg:py-4 text-left text-[11px] lg:text-xs uppercase tracking-wider text-labarile-primary-dark font-bold">
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-labarile-light-gray transition-colors">
                <td className="px-4 lg:px-5 py-3 lg:py-4 text-sm border-t border-labarile-border font-medium">
                  {row.month}
                </td>
                <td className="px-4 lg:px-5 py-3 lg:py-4 text-sm border-t border-labarile-border">
                  {row.ca.toFixed(1)}
                </td>
                <td className={cn(
                  "px-4 lg:px-5 py-3 lg:py-4 text-sm border-t border-labarile-border font-medium",
                  row.ebitda < 0 ? "text-red-500" : "text-labarile-success"
                )}>
                  {row.ebitda.toFixed(1)}
                </td>
                <td className={cn(
                  "px-4 lg:px-5 py-3 lg:py-4 text-sm border-t border-labarile-border font-medium",
                  row.margin < 0 ? "text-red-500" : "text-labarile-success"
                )}>
                  {row.margin.toFixed(1)}%
                </td>
                <td className="px-4 lg:px-5 py-3 lg:py-4 text-sm border-t border-labarile-border">
                  <span className={cn(
                    "inline-flex items-center gap-1",
                    row.status === 'Excellent' && "text-labarile-success",
                    row.status === 'Bon' && "text-labarile-primary-dark",
                    row.status === 'Ajusté' && "text-labarile-warning"
                  )}>
                    {row.status === 'Excellent' && '✅'}
                    {row.status === 'Bon' && '✅'}
                    {row.status === 'Ajusté' && '⚠️'}
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
