import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface IntercosCashRow {
  month_id: string;
  entity_code: string;
  amount_received: number; // USD
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntercosBucket {
  label: string; // ex: "mai 2026"
  rows: IntercosCashRow[];
  totalUsd: number;
  totalAed: number;
  byEntity: Array<{ entity: string; usd: number; aed: number }>;
}

export interface IntercosCashSources {
  loading: boolean;
  fxAedPerUsd: number;
  buckets: IntercosBucket[]; // ordonné: mai, mars, autres
  allRows: IntercosCashRow[];
}

const FX = 3.6725; // taux fixe AED→USD

const MONTH_NAMES_FR = [
  'janvier','février','mars','avril','mai','juin',
  'juillet','août','septembre','octobre','novembre','décembre',
];

function monthLabelFR(date: Date) {
  return `${MONTH_NAMES_FR[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * Catégorise une ligne par la date "effective" d'encaissement :
 *  1) si la note mentionne explicitement "<mois> <année>" → on prend ce mois.
 *  2) sinon → updated_at (fallback created_at).
 */
function bucketKey(row: IntercosCashRow): string {
  const note = (row.note ?? '').toLowerCase();
  for (let i = 0; i < MONTH_NAMES_FR.length; i++) {
    const m = MONTH_NAMES_FR[i];
    const match = note.match(new RegExp(`${m}\\s+(20\\d{2})`));
    if (match) return `${m} ${match[1]}`;
  }
  const d = new Date(row.updated_at ?? row.created_at);
  return monthLabelFR(d);
}

const ENTITY_DISPLAY: Record<string, string> = {
  structuring: 'Structuring',
  digit: 'Digit',
  spy: 'Digit · SPY',
  comment: 'Digit · Comment-Trust',
  agency: 'Agency',
  holding: 'Holding',
};

function entityName(code: string) {
  return ENTITY_DISPLAY[code] ?? code.charAt(0).toUpperCase() + code.slice(1);
}

export function useIntercosCashSources(monthIds: string[]): IntercosCashSources {
  const [rows, setRows] = useState<IntercosCashRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (monthIds.length === 0) { setLoading(false); return; }
    (async () => {
      const { data, error } = await (supabase as any)
        .from('pcgroup_intercos_cash')
        .select('month_id,entity_code,amount_received,note,created_at,updated_at')
        .in('month_id', monthIds)
        .gt('amount_received', 0);
      if (cancelled) return;
      if (error) {
        console.warn('[useIntercosCashSources]', error.message);
        setRows([]);
      } else {
        setRows((data as IntercosCashRow[]) ?? []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [monthIds.join('|')]);

  // Regroupe par mois d'encaissement
  const map = new Map<string, IntercosCashRow[]>();
  for (const r of rows) {
    const key = bucketKey(r);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  // Ordonne : descendant par (année, mois)
  const sortedKeys = [...map.keys()].sort((a, b) => {
    const pa = a.match(/(\w+)\s+(\d{4})/);
    const pb = b.match(/(\w+)\s+(\d{4})/);
    if (!pa || !pb) return 0;
    const ma = MONTH_NAMES_FR.indexOf(pa[1]);
    const mb = MONTH_NAMES_FR.indexOf(pb[1]);
    return (+pb[2] - +pa[2]) || (mb - ma);
  });

  const buckets: IntercosBucket[] = sortedKeys.map((key) => {
    const bucketRows = map.get(key)!;
    // Agrège par entité
    const agg = new Map<string, number>();
    for (const r of bucketRows) {
      agg.set(r.entity_code, (agg.get(r.entity_code) ?? 0) + Number(r.amount_received));
    }
    const byEntity = [...agg.entries()]
      .map(([code, usd]) => ({ entity: entityName(code), usd, aed: usd * FX }))
      .sort((a, b) => b.usd - a.usd);
    const totalUsd = byEntity.reduce((a, e) => a + e.usd, 0);
    return {
      label: key,
      rows: bucketRows,
      totalUsd,
      totalAed: totalUsd * FX,
      byEntity,
    };
  });

  return { loading, fxAedPerUsd: FX, buckets, allRows: rows };
}
