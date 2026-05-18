// Mapping comptes P&L Zoho LLE Educational Services FZCO → 6 catégories Labarile.
// L'ordre des règles compte (premier match gagne).

export type LabarileCategory = 'coaches' | 'marketing' | 'it' | 'stripe' | 'admin' | 'autres';

export interface MappingRule {
  category: LabarileCategory | 'revenue' | 'ignore';
  /** Sous-chaînes (insensibles à la casse) qui déclenchent ce mapping. */
  matches: string[];
  label?: string;
}

export const LABARILE_MAPPING_RULES: MappingRule[] = [
  // --- Revenus ---
  {
    category: 'revenue',
    matches: ['operating income', 'sales income', 'sales', 'revenue', 'income from services', 'service revenue', 'turnover'],
    label: 'Revenu',
  },
  // --- Coaches ---
  {
    category: 'coaches',
    matches: ['coach-consultant', 'coach consultant', 'closer sales', 'consultant expense', 'coach'],
    label: 'Coaches',
  },
  // --- Marketing ---
  {
    category: 'marketing',
    matches: ['advertising', 'media buying', 'video editing', 'podcast', 'event venue', 'marketing'],
    label: 'Marketing',
  },
  // --- IT & Tools ---
  {
    category: 'it',
    matches: ['it & internet', 'it and internet', 'online tools', 'software', 'telephone', 'internet'],
    label: 'IT & Tools',
  },
  // --- Stripe / Fees ---
  {
    category: 'stripe',
    matches: ['stripe', 'paypal', 'bank fees', 'bank charges', 'merchant fees'],
    label: 'Stripe / Fees',
  },
  // --- Admin ---
  {
    category: 'admin',
    matches: [
      'accounting', 'audit', 'salaries', 'salary', 'payroll',
      'office supplies', 'travel', 'meals', 'automobile', 'rent', 'legal', 'professional fees',
    ],
    label: 'Admin',
  },
  // --- Autres (catch-all) ---
  {
    category: 'autres',
    matches: ['bad debt'],
    label: 'Autres',
  },
];

export function classifyAccount(accountName: string): LabarileCategory | 'revenue' | 'unmapped' {
  if (!accountName) return 'unmapped';
  const name = accountName.toLowerCase().trim();
  for (const rule of LABARILE_MAPPING_RULES) {
    if (rule.matches.some((m) => name.includes(m))) {
      if (rule.category === 'ignore') return 'unmapped';
      return rule.category;
    }
  }
  return 'unmapped';
}

export const CATEGORY_LABELS: Record<LabarileCategory, string> = {
  coaches: 'Coaches',
  marketing: 'Marketing',
  it: 'IT & Tools',
  stripe: 'Stripe / Fees',
  admin: 'Admin',
  autres: 'Autres',
};
