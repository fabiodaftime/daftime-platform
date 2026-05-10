// Numeric → display string formatters used by the PCGroup aggregator.
// Centralized so all consolidated outputs share identical formatting.

export const fmtUSD = (n: number): string => {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
};

export const fmtUSDk = (n: number): string => {
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
};

export const fmtPct = (n: number, digits = 1): string => `${n.toFixed(digits)}%`;

export const fmtPctSigned = (n: number, digits = 1): string =>
  `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`;

export const fmtPts = (n: number, digits = 1): string =>
  `${n >= 0 ? '+' : ''}${n.toFixed(digits)}pts`;

export const pctChange = (cur: number, prev: number): number => {
  if (!prev || prev === 0) return 0;
  return ((cur - prev) / Math.abs(prev)) * 100;
};

export const varTypeOf = (cur: number, prev: number, inverse = false): 'positive' | 'negative' | 'neutral' => {
  if (cur === prev) return 'neutral';
  const better = inverse ? cur < prev : cur > prev;
  return better ? 'positive' : 'negative';
};

export const cell = (v?: string): string => (v && v.trim() !== '' ? v : '—');
