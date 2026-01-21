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

  const chartColors = [
    "hsl(var(--primary))",
    "hsl(var(--muted-foreground))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
    "hsl(var(--border))",
    "hsl(var(--ring))",
    "hsl(var(--foreground))",
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto w-full max-w-7xl px-6 pt-8">
        <div className="rounded-2xl border bg-card/40 p-6 text-center backdrop-blur">
          <h1 className="text-balance text-2xl font-semibold tracking-widest text-foreground md:text-3xl">
            <span className="text-primary">CW</span> PARTNERS FZCO
            <span className="ml-3 inline-flex items-center rounded-full border bg-muted px-3 py-1 text-xs font-semibold text-foreground">
              USD
            </span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Profit &amp; Loss Dashboard — Full Year 2025
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            FX Rate: 1 USD = {FX} AED • Company ID: {id}
          </p>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-6 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-card/40 p-5">
            <div className="text-xs font-medium tracking-widest text-muted-foreground">
              NET REVENUE
            </div>
            <div className="mt-2 text-3xl font-semibold">
              {formatShortUsd(computed.fyNetRevenue)}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              After disbursements
            </div>
          </div>

          <div className="rounded-2xl border bg-card/40 p-5">
            <div className="text-xs font-medium tracking-widest text-muted-foreground">
              OPERATING EXPENSES
            </div>
            <div className="mt-2 text-3xl font-semibold">
              {formatShortUsd(computed.fyOpex)}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {percent(computed.fyOpex, computed.fyNetRevenue)} of Net Revenue
            </div>
          </div>

          <div className="rounded-2xl border bg-card/40 p-5">
            <div className="text-xs font-medium tracking-widest text-muted-foreground">
              EBITDA (STATUTORY)
            </div>
            <div className="mt-2 text-3xl font-semibold">
              {formatShortUsd(computed.fyEbitda)}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {percent(computed.fyEbitda, computed.fyNetRevenue)} margin
            </div>
          </div>

          <div className="rounded-2xl border bg-card/40 p-5 ring-1 ring-primary/20">
            <div className="text-xs font-medium tracking-widest text-muted-foreground">
              ADJUSTED EBITDA
            </div>
            <div className="mt-2 text-3xl font-semibold text-primary">
              {formatShortUsd(computed.adjustedEbitda)}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {percent(computed.adjustedEbitda, computed.fyNetRevenue)} margin
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pt-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border bg-card/40 p-6 lg:col-span-2">
            <h2 className="text-base font-semibold">EBITDA Adjustments Explanation</h2>

            <div className="mt-5 space-y-4">
              {EBITDA_ADJUSTMENTS.map((a) => (
                <article
                  key={a.title}
                  className="rounded-xl border bg-background/20 p-5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-semibold text-primary">{a.title}</div>
                    <div className="text-lg font-semibold text-primary">
                      +{formatUsd(a.amountUsd)}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {a.description}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-xl border bg-primary/5 p-5">
              <div className="space-y-3">
                <div className="flex items-baseline justify-between border-b border-border/60 pb-3">
                  <div className="text-sm font-semibold">Statutory EBITDA</div>
                  <div className="text-sm font-semibold">
                    {formatUsd(computed.fyEbitda)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {percent(computed.fyEbitda, computed.fyNetRevenue)}
                    </span>
                  </div>
                </div>
                {EBITDA_ADJUSTMENTS.map((a) => (
                  <div
                    key={a.title}
                    className="flex items-baseline justify-between"
                  >
                    <div className="text-sm text-muted-foreground">(+) {a.title}</div>
                    <div className="text-sm font-semibold text-primary">
                      +{formatUsd(a.amountUsd)}
                    </div>
                  </div>
                ))}
                <div className="mt-3 flex items-baseline justify-between border-t border-border/60 pt-4">
                  <div className="text-sm font-semibold">Adjusted EBITDA</div>
                  <div className="text-base font-semibold text-primary">
                    {formatUsd(computed.adjustedEbitda)}
                    <span className="ml-2 text-xs text-primary/80">
                      {percent(computed.adjustedEbitda, computed.fyNetRevenue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card/40 p-6">
            <h2 className="text-base font-semibold">Operating Expenses Breakdown</h2>
            <div className="mt-4 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${formatShortUsd(value)} (${percent(
                        value,
                        computed.fyOpex,
                      )})`,
                      name,
                    ]}
                  />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Pie
                    data={computed.opexTotals}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={2}
                    stroke="hsl(var(--background))"
                    strokeWidth={1}
                  >
                    {computed.opexTotals.map((_, i) => (
                      <Cell
                        key={i}
                        fill={chartColors[i % chartColors.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Donut en USD (somme annuelle par catégorie)
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-12 pt-6">
        <div className="rounded-2xl border bg-card/40 p-6">
          <h2 className="text-base font-semibold">
            Detailed P&amp;L — Monthly Breakdown (USD)
          </h2>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="bg-muted/40 px-3 py-3 text-left text-xs font-semibold tracking-widest text-primary">
                    ACCOUNT
                  </th>
                  {MONTHS.map((m) => (
                    <th
                      key={m}
                      className="bg-muted/40 px-3 py-3 text-right text-xs font-semibold tracking-widest text-primary"
                    >
                      {m.toUpperCase()}
                    </th>
                  ))}
                  <th className="bg-muted/40 px-3 py-3 text-right text-xs font-semibold tracking-widest text-primary">
                    FY 2025
                  </th>
                </tr>
              </thead>
              <tbody>
                {computed.rows.map((row) => {
                  const isSection = row.variant === "section";
                  const isTotal = row.variant === "total";
                  const isEbitda = row.variant === "ebitda";
                  const isNet = row.variant === "net";

                  const baseRowClass = "border-b border-border/40";
                  const rowClass = isSection
                    ? ""
                    : isEbitda
                      ? "bg-primary/10"
                      : isTotal
                        ? "bg-muted/30"
                        : isNet
                          ? "bg-muted/50"
                          : "";

                  return (
                    <tr
                      key={row.label}
                      className={[baseRowClass, rowClass].filter(Boolean).join(" ")}
                    >
                      <td
                        className={
                          isSection
                            ? "px-3 pt-6 text-xs font-semibold tracking-widest text-primary"
                            : isEbitda
                              ? "px-3 py-2 font-semibold text-primary"
                              : isTotal || isNet
                                ? "px-3 py-2 font-semibold"
                                : "px-3 py-2 text-muted-foreground"
                        }
                      >
                        {row.label}
                      </td>

                      {isSection ? (
                        <>
                          {Array.from({ length: 12 }).map((_, i) => (
                            <td key={i} className="px-3 pt-6 text-right text-xs" />
                          ))}
                          <td className="px-3 pt-6 text-right text-xs" />
                        </>
                      ) : (
                        <>
                          {row.values.map((v, i) => (
                            <td key={i} className="px-3 py-2 text-right">
                              {formatUsd(v)}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right font-semibold">
                            {formatUsd(sum(row.values))}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="py-8 text-center text-xs text-muted-foreground">
          CW Partners FZCO — CFO Reporting — Prepared for Group CFO &amp; Investment
          Fund Review
        </footer>
      </section>
    </main>
  );
}
