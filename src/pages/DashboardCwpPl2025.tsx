import { useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Cell,
  Legend,
} from "recharts";

import "./DashboardCwpPl2025.css";

type PnlRow = {
  label: string;
  values: number[]; // 12 months
  variant?: "section" | "total" | "ebitda" | "net";
};

const FX = 3.6725;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

// Source data in AED (converted to USD in code)
const DATA_AED = {
  sales: [
    1545725, 325850, 278130, 755913, 202506, 520512, 396630, 323966, 904777,
    436250, 444938, 1054545,
  ],
  disbursement: [
    62275, 31190, 36615, 18753, 42950, 48554, 114844, 27338, 102371, 93869,
    62047, 71382,
  ],
  opex: {
    "Administrative Services": [
      290670, 176280, 165263, 159086, 163063, 139200, 172608, 164440, 198315,
      115099, 91813, 164397,
    ],
    "Consulting & Accounting": [
      134503, 122417, 92214, 398641, 104929, 209857, 122818, 99523, 198277,
      190489, 202105, 817041,
    ],
    Salaries: [
      69481, 69632, 71337, 70515, 70197, 74148, 60176, 74875, 76334,
      140234, 95039, 136992,
    ],
    "Bank Fees": [
      651, 886, 933, 1731, 788, 1332, 1064, 1025, 415, 2361, 6013, 44277,
    ],
    "Rent & Office": [
      5922, 5922, 5922, 5922, 5922, 6328, 5923, 5922, 43375, 7558, 7354,
      7308,
    ],
    "Legal & Professional": [0, 0, 63634, 0, 0, 0, 0, 7676, 12119, 5142, -817, 22940],
    Other: [0, 0, 0, 206, 56924, 703, 0, -11638, 0, 9536, 9500, 11744],
  } as Record<string, number[]>,
  fx: [21954, 82, -11986, -27408, 14860, -263, -8192, 3179, -29262, -26194, -4799, -8159],
} as const;

const EBITDA_ADJUSTMENTS = [
  {
    title: "JG Commissions 2024",
    amountUsd: 38002,
    description:
      "Commission expenses recorded in 2025 that relate to services rendered in 2024. These costs are attributable to the prior fiscal year and have been added back to reflect the true recurring operating performance of 2025. This adjustment ensures year-over-year comparability and removes timing distortions from the EBITDA calculation.",
  },
  {
    title: "Restructuring Costs (Fidence Acquisition)",
    amountUsd: 20500,
    description:
      "One-time expenses incurred in connection with the acquisition of the entity by Fidence. These non-recurring costs include legal, advisory, and integration-related expenses that are not representative of ongoing business operations. Standard practice for investment fund reporting excludes such transaction-related costs from normalized EBITDA.",
  },
] as const;

function sum(values: number[]) {
  return values.reduce((a, b) => a + b, 0);
}

function formatUsd(n: number) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  return abs === 0 ? "-" : `${sign}$${abs.toLocaleString("en-US")}`;
}

function formatShortUsd(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function percent(part: number, total: number) {
  if (!total) return "0.0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

export default function DashboardCwpPl2025() {
  const { id } = useParams();

  const computed = useMemo(() => {
    const salesUsd = DATA_AED.sales.map((v) => v / FX);
    const disbUsd = DATA_AED.disbursement.map((v) => v / FX);
    const fxUsd = DATA_AED.fx.map((v) => v / FX);

    const opexUsdByCat: Record<string, number[]> = {};
    Object.entries(DATA_AED.opex).forEach(([k, arr]) => {
      opexUsdByCat[k] = arr.map((v) => v / FX);
    });

    const netRevenue = salesUsd.map((s, i) => s - disbUsd[i]);

    const totalOpex = MONTHS.map((_, i) =>
      Object.values(opexUsdByCat).reduce((acc, arr) => acc + arr[i], 0),
    );

    const ebitda = netRevenue.map((r, i) => r - totalOpex[i]);
    const netProfit = ebitda.map((e, i) => e - fxUsd[i]);

    const opexTotals = Object.entries(opexUsdByCat)
      .map(([name, values]) => ({ name, value: sum(values) }))
      .sort((a, b) => b.value - a.value);

    const fyNetRevenue = sum(netRevenue);
    const fyOpex = sum(totalOpex);
    const fyEbitda = sum(ebitda);
    const adjustmentsTotal = EBITDA_ADJUSTMENTS.reduce(
      (acc, a) => acc + a.amountUsd,
      0,
    );
    const adjustedEbitda = fyEbitda + adjustmentsTotal;

    const rows: PnlRow[] = [
      { label: "REVENUE", values: Array(12).fill(0), variant: "section" },
      { label: "Gross Sales", values: salesUsd },
      {
        label: "Disbursements",
        values: disbUsd.map((v) => -v),
      },
      { label: "Net Revenue", values: netRevenue, variant: "total" },
      {
        label: "OPERATING EXPENSES",
        values: Array(12).fill(0),
        variant: "section",
      },
      ...Object.entries(opexUsdByCat).map(([name, values]) => ({
        label: name,
        values,
      })),
      { label: "Total OpEx", values: totalOpex, variant: "total" },
      { label: "EBITDA", values: ebitda, variant: "ebitda" },
      {
        label: "NON-OPERATING",
        values: Array(12).fill(0),
        variant: "section",
      },
      { label: "FX Gain/(Loss)", values: fxUsd },
      { label: "Net Profit/(Loss)", values: netProfit, variant: "net" },
    ];

    return {
      salesUsd,
      disbUsd,
      netRevenue,
      totalOpex,
      ebitda,
      fxUsd,
      netProfit,
      opexTotals,
      fyNetRevenue,
      fyOpex,
      fyEbitda,
      adjustedEbitda,
      rows,
    };
  }, []);

  // Match the original HTML palette ordering
  const chartColors = [
    "hsl(var(--cwp-gold))",
    "hsl(42 30% 42%)" /* #8b7a4a approx */,
    "hsl(var(--cwp-muted))",
    "hsl(210 14% 42%)" /* #5a6a7a approx */,
    "hsl(39 38% 73%)" /* #d4c4a0 approx */,
    "hsl(210 18% 35%)" /* #4a5a6a approx */,
    "hsl(var(--cwp-muted-2))",
  ];

  return (
    <div className="cwp-pl-2025">
      <div className="header cwp-header">
        <h1>
          <span className="cw">CW</span> PARTNERS FZCO
          <span className="currency-badge">USD</span>
        </h1>
        <p>Profit &amp; Loss Dashboard — Full Year 2025</p>
        <div className="fx-note">FX Rate: 1 USD = {FX} AED</div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Net Revenue</div>
          <div className="kpi-value">{formatShortUsd(computed.fyNetRevenue)}</div>
          <div className="kpi-sub">After disbursements</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Operating Expenses</div>
          <div className="kpi-value">{formatShortUsd(computed.fyOpex)}</div>
          <div className="kpi-sub">
            {percent(computed.fyOpex, computed.fyNetRevenue)} of Net Revenue
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">EBITDA (Statutory)</div>
          <div className="kpi-value">{formatShortUsd(computed.fyEbitda)}</div>
          <div className="kpi-sub">
            {percent(computed.fyEbitda, computed.fyNetRevenue)} margin
          </div>
        </div>

        <div className="kpi-card highlight">
          <div className="kpi-label">Adjusted EBITDA</div>
          <div className="kpi-value">{formatShortUsd(computed.adjustedEbitda)}</div>
          <div className="kpi-sub positive">
            {percent(computed.adjustedEbitda, computed.fyNetRevenue)} margin
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="card">
          <div className="card-title">EBITDA Adjustments Explanation</div>

          <div className="adjustment-section">
            {EBITDA_ADJUSTMENTS.map((a) => (
              <div key={a.title} className="adjustment-item">
                <div className="adjustment-header">
                  <div className="adjustment-title">{a.title}</div>
                  <div className="adjustment-amount">+{formatUsd(a.amountUsd)}</div>
                </div>
                <div className="adjustment-description">{a.description}</div>
              </div>
            ))}
          </div>

          <div className="ebitda-bridge">
            <div className="bridge-row">
              <div className="bridge-label">Statutory EBITDA</div>
              <div className="bridge-value">
                {formatUsd(computed.fyEbitda)}
                <span className="bridge-pct">
                  {percent(computed.fyEbitda, computed.fyNetRevenue)}
                </span>
              </div>
            </div>

            {EBITDA_ADJUSTMENTS.map((a) => (
              <div key={a.title} className="bridge-row">
                <div className="bridge-label">(+) {a.title}</div>
                <div className="bridge-value add">+{formatUsd(a.amountUsd)}</div>
              </div>
            ))}

            <div className="bridge-row">
              <div className="bridge-label">Adjusted EBITDA</div>
              <div className="bridge-value">
                {formatUsd(computed.adjustedEbitda)}
                <span className="bridge-pct" style={{ color: "hsl(var(--cwp-gold))" }}>
                  {percent(computed.adjustedEbitda, computed.fyNetRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Operating Expenses Breakdown</div>
          <div className="chart-container" aria-label="Operating expenses breakdown">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${formatShortUsd(value)} (${percent(value, computed.fyOpex)})`,
                    name,
                  ]}
                  contentStyle={{
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid rgba(201,169,98,0.25)",
                    borderRadius: 12,
                    color: "#e8eef5",
                  }}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  wrapperStyle={{ fontSize: 11, color: "#a0b0c8" }}
                />
                <Pie
                  data={computed.opexTotals}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={1}
                  stroke="rgba(0,0,0,0)"
                >
                  {computed.opexTotals.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="table-section">
        <div className="table-title">Detailed P&amp;L — Monthly Breakdown (USD)</div>
        <table className="pl-table" aria-label="Detailed P&L monthly breakdown">
          <thead>
            <tr>
              <th>Account</th>
              {MONTHS.map((m) => (
                <th key={m}>{m}</th>
              ))}
              <th>FY 2025</th>
            </tr>
          </thead>
          <tbody>
            {computed.rows.map((row) => {
              const cls =
                row.variant === "section"
                  ? "section-header"
                  : row.variant === "total"
                    ? "total-row"
                    : row.variant === "ebitda"
                      ? "ebitda-row"
                      : row.variant === "net"
                        ? "net-row"
                        : "";

              return (
                <tr key={row.label} className={cls}>
                  <td>{row.label}</td>
                  {row.variant === "section" ? (
                    <>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <td key={i} />
                      ))}
                      <td />
                    </>
                  ) : (
                    <>
                      {row.values.map((v, i) => (
                        <td key={i}>{formatUsd(v)}</td>
                      ))}
                      <td>{formatUsd(sum(row.values))}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="footer cwp-footer">
        CW Partners FZCO — CFO Reporting — Prepared for Group CFO &amp; Investment
        Fund Review
        <div style={{ marginTop: 6, opacity: 0.7 }}>
          (Accès séparé) URL: /dashboard-cwp-pl-2025/{id}
        </div>
      </div>
    </div>
  );
}
