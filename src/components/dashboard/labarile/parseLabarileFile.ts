import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { classifyAccount, type LabarileCategory } from './LabarileMapping';

export interface ParsedMonth {
  year: number;
  month: number; // 1-12
  monthLabel: string; // ex: "JANVIER 2026"
  revenue: number;
  coaches: number;
  marketing: number;
  it: number;
  stripe: number;
  admin: number;
  autres: number;
  /** Comptes non mappés trouvés dans ce mois (à reporter à l'utilisateur). */
  unmapped: Array<{ account: string; amount: number }>;
  /** Détail brut compte → catégorie pour audit. */
  detail: Array<{ account: string; amount: number; category: LabarileCategory | 'revenue' | 'unmapped' }>;
}

export interface ParseResult {
  format: 'wide-xlsx' | 'long-csv';
  months: ParsedMonth[];
  warnings: string[];
}

const MONTH_NAMES_FR = ['janvier','février','fevrier','mars','avril','mai','juin','juillet','août','aout','septembre','octobre','novembre','décembre','decembre'];
const MONTH_NAMES_EN = ['january','february','march','april','may','june','july','august','september','october','november','december'];
const MONTH_NAMES_SHORT = ['jan','feb','fév','fev','mar','apr','avr','may','mai','jun','jul','aug','aoû','aou','sep','oct','nov','dec','déc'];

function monthLabel(year: number, month: number): string {
  const labels = ['JANVIER','FÉVRIER','MARS','AVRIL','MAI','JUIN','JUILLET','AOÛT','SEPTEMBRE','OCTOBRE','NOVEMBRE','DÉCEMBRE'];
  return `${labels[month - 1]} ${year}`;
}

function parseMonthYearFromHeader(h: string): { year: number; month: number } | null {
  if (!h) return null;
  const s = String(h).toLowerCase().trim();
  // Match "jan 2026", "janvier 2026", "01/2026", "2026-01", "2026/01"
  const m1 = s.match(/(\d{4})[-/](\d{1,2})/);
  if (m1) return { year: +m1[1], month: +m1[2] };
  const m2 = s.match(/(\d{1,2})[-/](\d{4})/);
  if (m2) return { year: +m2[2], month: +m2[1] };
  const yearMatch = s.match(/(20\d{2})/);
  if (!yearMatch) return null;
  const year = +yearMatch[1];
  const all = [...MONTH_NAMES_FR, ...MONTH_NAMES_EN, ...MONTH_NAMES_SHORT];
  for (const name of all) {
    if (s.includes(name)) {
      const month = monthIndexFromName(name);
      if (month) return { year, month };
    }
  }
  return null;
}

function monthIndexFromName(name: string): number | null {
  const map: Record<string, number> = {
    janvier: 1, january: 1, jan: 1,
    février: 2, fevrier: 2, february: 2, feb: 2, fév: 2, fev: 2,
    mars: 3, march: 3, mar: 3,
    avril: 4, april: 4, apr: 4, avr: 4,
    mai: 5, may: 5,
    juin: 6, june: 6, jun: 6,
    juillet: 7, july: 7, jul: 7,
    août: 8, aout: 8, august: 8, aug: 8, aoû: 8, aou: 8,
    septembre: 9, september: 9, sep: 9,
    octobre: 10, october: 10, oct: 10,
    novembre: 11, november: 11, nov: 11,
    décembre: 12, decembre: 12, december: 12, dec: 12, déc: 12,
  };
  return map[name.toLowerCase()] ?? null;
}

function toNumber(v: any): number {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/[^\d.,()-]/g, '').replace(/\s/g, '');
  const negative = s.startsWith('(') && s.endsWith(')');
  const clean = s.replace(/[()]/g, '').replace(/,/g, '');
  const n = parseFloat(clean);
  if (isNaN(n)) return 0;
  return negative ? -n : n;
}

function emptyMonth(year: number, month: number): ParsedMonth {
  return {
    year, month, monthLabel: monthLabel(year, month),
    revenue: 0, coaches: 0, marketing: 0, it: 0, stripe: 0, admin: 0, autres: 0,
    unmapped: [], detail: [],
  };
}

function applyAccount(m: ParsedMonth, account: string, amount: number) {
  const category = classifyAccount(account);
  m.detail.push({ account, amount, category });
  if (category === 'revenue') {
    m.revenue += Math.abs(amount);
  } else if (category === 'unmapped') {
    m.unmapped.push({ account, amount: Math.abs(amount) });
    m.autres += Math.abs(amount); // fallback dans Autres
  } else {
    m[category] += Math.abs(amount);
  }
}

// ----- Long CSV : (date|year+month, account, amount) -----
function parseLongCsv(text: string): ParseResult {
  const warnings: string[] = [];
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) warnings.push(`CSV: ${parsed.errors.length} erreurs de parsing`);

  const byMonth = new Map<string, ParsedMonth>();

  for (const row of parsed.data) {
    const keys = Object.keys(row);
    const findKey = (...names: string[]) =>
      keys.find((k) => names.some((n) => k.toLowerCase().trim() === n));

    const dateKey = findKey('date', 'period', 'mois', 'month');
    const accKey = findKey('account', 'compte', 'libellé', 'libelle', 'description');
    const amtKey = findKey('amount', 'montant', 'value', 'valeur', 'total');
    if (!dateKey || !accKey || !amtKey) {
      warnings.push("CSV: colonnes 'date|mois', 'account|compte', 'amount|montant' requises");
      break;
    }

    const my = parseMonthYearFromHeader(row[dateKey]);
    if (!my) continue;
    const key = `${my.year}-${my.month}`;
    if (!byMonth.has(key)) byMonth.set(key, emptyMonth(my.year, my.month));
    applyAccount(byMonth.get(key)!, row[accKey], toNumber(row[amtKey]));
  }

  return { format: 'long-csv', months: [...byMonth.values()].sort((a, b) => a.year - b.year || a.month - b.month), warnings };
}

// ----- Wide xlsx : lignes = comptes, colonnes = mois -----
function parseWideXlsx(buffer: ArrayBuffer): ParseResult {
  const warnings: string[] = [];
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  if (!rows.length) return { format: 'wide-xlsx', months: [], warnings: ['Feuille vide'] };

  // Trouve la ligne d'en-tête (celle où apparaissent des mois)
  let headerRowIdx = -1;
  let monthCols: Array<{ col: number; year: number; month: number }> = [];
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    const cols: typeof monthCols = [];
    for (let c = 0; c < row.length; c++) {
      const my = parseMonthYearFromHeader(String(row[c] ?? ''));
      if (my) cols.push({ col: c, ...my });
    }
    if (cols.length >= 2) { headerRowIdx = i; monthCols = cols; break; }
  }

  if (headerRowIdx === -1) {
    warnings.push("Aucune colonne de type 'mois année' détectée dans les 20 premières lignes.");
    return { format: 'wide-xlsx', months: [], warnings };
  }

  const months = monthCols.map((c) => emptyMonth(c.year, c.month));

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const account = String(row[0] ?? '').trim();
    if (!account) continue;
    // Évite les lignes 'Total' ou sections
    if (/^total/i.test(account) && !/income/i.test(account)) continue;

    monthCols.forEach((c, idx) => {
      const amount = toNumber(row[c.col]);
      if (amount === 0) return;
      applyAccount(months[idx], account, amount);
    });
  }

  return { format: 'wide-xlsx', months, warnings };
}

export async function parseLabarileFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseWideXlsx(await file.arrayBuffer());
  }
  // CSV : essayer wide d'abord (colonnes mois), sinon long
  const text = await file.text();
  const headerLine = text.split(/\r?\n/)[0] ?? '';
  const cells = headerLine.split(/[,;\t]/);
  const monthLikeCells = cells.filter((c) => parseMonthYearFromHeader(c));
  if (monthLikeCells.length >= 2) {
    // Convertit le CSV en feuille xlsx pour réutiliser le parser wide
    const wb = XLSX.read(text, { type: 'string' });
    const ab = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    return parseWideXlsx(ab);
  }
  return parseLongCsv(text);
}

export function toMonthlyCostsTs(months: ParsedMonth[]): string {
  const items = months.map((m) => {
    const comments: string[] = [];
    if (m.unmapped.length) {
      const unm = m.unmapped.slice(0, 3).map((u) => `${u.account} ${Math.round(u.amount).toLocaleString()}`).join(', ');
      comments.push(`⚠️ Comptes non mappés (rangés dans Autres) : ${unm}${m.unmapped.length > 3 ? ' …' : ''}`);
    }
    const commentsStr = comments.length ? `[${comments.map((c) => `'${c.replace(/'/g, "\\'")}'`).join(', ')}]` : `[]`;
    return `  {
    month: '${m.monthLabel}',
    revenue: ${Math.round(m.revenue)},
    actual: { coaches: ${Math.round(m.coaches)}, marketing: ${Math.round(m.marketing)}, it: ${Math.round(m.it)}, stripe: ${Math.round(m.stripe)}, admin: ${Math.round(m.admin)}, autres: ${Math.round(m.autres)} },
    commentType: 'success',
    commentTitle: '💬 Commentaires ${m.monthLabel}:',
    comments: ${commentsStr},
  },`;
  }).join('\n');
  return `export const MONTHLY_COSTS_2026: MonthlyCostData[] = [\n${items}\n];\n`;
}
