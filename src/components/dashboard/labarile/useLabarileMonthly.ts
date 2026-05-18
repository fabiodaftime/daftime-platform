import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  MONTHLY_COSTS_2026 as DEFAULT_MONTHLY_COSTS_2026,
  ACTUALS_2026 as DEFAULT_ACTUALS_2026,
  YTD_2026 as DEFAULT_YTD_2026,
  type MonthlyCostData,
} from './LabarileData';

const MONTH_LABELS_FR = ['JANVIER','FÉVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOÛT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DÉCEMBRE'];
const MONTH_SHORT_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

interface DbRow {
  year: number;
  month: number;
  revenue: number;
  coaches: number;
  marketing: number;
  it: number;
  stripe: number;
  admin: number;
  autres: number;
  note: string | null;
}

export interface LabarileMonthlyData {
  monthlyCosts2026: MonthlyCostData[];
  actuals2026: { months: string[]; revenue: number[] };
  ytd2026: { months: number; caTotal: number; netProfit: number };
  source: 'database' | 'hardcoded' | 'mixed';
  loading: boolean;
}

function toMonthlyCost(r: DbRow): MonthlyCostData {
  return {
    month: `${MONTH_LABELS_FR[r.month - 1]} ${r.year}`,
    revenue: Number(r.revenue),
    actual: {
      coaches: Number(r.coaches),
      marketing: Number(r.marketing),
      it: Number(r.it),
      stripe: Number(r.stripe),
      admin: Number(r.admin),
      autres: Number(r.autres),
    },
    commentType: 'success',
    commentTitle: `💬 Commentaires ${MONTH_LABELS_FR[r.month - 1]}:`,
    comments: r.note ? [r.note] : [],
  };
}

export function useLabarileMonthly(year = 2026): LabarileMonthlyData {
  const [rows, setRows] = useState<DbRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await (supabase as any)
        .from('labarile_monthly_pl')
        .select('year,month,revenue,coaches,marketing,it,stripe,admin,autres,note')
        .eq('year', year)
        .order('month', { ascending: true });
      if (cancelled) return;
      if (error) {
        console.warn('[useLabarileMonthly]', error.message);
        setRows([]);
      } else {
        setRows((data as DbRow[]) ?? []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [year]);

  if (!rows || rows.length === 0) {
    return {
      monthlyCosts2026: DEFAULT_MONTHLY_COSTS_2026,
      actuals2026: DEFAULT_ACTUALS_2026,
      ytd2026: DEFAULT_YTD_2026,
      source: 'hardcoded',
      loading,
    };
  }

  const monthlyCosts2026 = rows.map(toMonthlyCost);
  const actuals2026 = {
    months: rows.map((r) => `${MONTH_SHORT_FR[r.month - 1]} ${String(r.year).slice(2)}`),
    revenue: rows.map((r) => Math.round(Number(r.revenue) / 100) / 10),
  };
  const caTotal = rows.reduce((a, r) => a + Number(r.revenue), 0);
  const netProfit = rows.reduce((a, r) => {
    const charges = Number(r.coaches) + Number(r.marketing) + Number(r.it) + Number(r.stripe) + Number(r.admin) + Number(r.autres);
    return a + (Number(r.revenue) - charges);
  }, 0);
  const ytd2026 = { months: rows.length, caTotal, netProfit };

  return { monthlyCosts2026, actuals2026, ytd2026, source: 'database', loading };
}
