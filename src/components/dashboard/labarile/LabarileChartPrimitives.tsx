import type { TooltipProps } from 'recharts';

/**
 * Hidden SVG defs mounted once at page level so `url(#lab-grad-*)` references
 * resolve across all Recharts SVGs (gradient ids are document-scoped).
 * Render <LabarileGradients /> once at the top of a dashboard page.
 *
 * Kept as a backwards-compatible no-op when placed inside a Recharts chart.
 */
export function LabarileGradients() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="lab-grad-primary" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7CC9CC" stopOpacity={1} />
          <stop offset="100%" stopColor="#5AB5B8" stopOpacity={0.85} />
        </linearGradient>
        <linearGradient id="lab-grad-success" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5FD3B5" stopOpacity={1} />
          <stop offset="100%" stopColor="#4EB79F" stopOpacity={0.85} />
        </linearGradient>
        <linearGradient id="lab-grad-warning" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F19878" stopOpacity={1} />
          <stop offset="100%" stopColor="#E87E60" stopOpacity={0.85} />
        </linearGradient>
        <linearGradient id="lab-grad-ice" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9EDEF" stopOpacity={1} />
          <stop offset="100%" stopColor="#9DD8DA" stopOpacity={0.7} />
        </linearGradient>
        <linearGradient id="lab-grad-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7CC9CC" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#7CC9CC" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="lab-grad-projected" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9EDEF" stopOpacity={0.95} />
          <stop offset="100%" stopColor="#9DD8DA" stopOpacity={0.6} />
        </linearGradient>
      </defs>
    </svg>
  );
}

export const LAB_GRADIENT_BY_INDEX = [
  'url(#lab-grad-primary)',
  'url(#lab-grad-success)',
  'url(#lab-grad-ice)',
  'url(#lab-grad-warning)',
];

/** Modern tooltip card used across all Labarile charts. */
export function LabarileTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: TooltipProps<number, string> & {
  valueFormatter?: (v: number, name?: string) => string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-labarile-border/80 bg-white/95 backdrop-blur-sm shadow-xl shadow-labarile-primary/10 overflow-hidden min-w-[160px]">
      <div className="h-1 bg-gradient-to-r from-labarile-primary-dark via-labarile-primary to-labarile-success" />
      <div className="px-3.5 py-2.5">
        {label !== undefined && label !== '' && (
          <p className="text-[11px] font-bold uppercase tracking-wider text-labarile-primary-dark mb-1.5">
            {label}
          </p>
        )}
        <div className="space-y-1">
          {payload.map((entry, i) => {
            const v = entry.value as number;
            if (v === null || v === undefined) return null;
            const formatted = valueFormatter ? valueFormatter(v, entry.name as string) : v.toString();
            return (
              <div key={i} className="flex items-center justify-between gap-3 text-xs">
                {entry.name && (
                  <span className="flex items-center gap-1.5 text-labarile-muted">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: (entry.color as string) ?? entry.fill ?? '#7CC9CC' }}
                    />
                    {entry.name}
                  </span>
                )}
                <span className="font-bold tabular-nums text-labarile-text">{formatted}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Subtle dashed gridlines and tick styling defaults. */
export const LAB_AXIS_TICK = { fill: '#7a7a7a', fontSize: 11, fontWeight: 500 };
export const LAB_GRID_STROKE = '#E8EEF0';
