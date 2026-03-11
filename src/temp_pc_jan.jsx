import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ComposedChart, Line } from "recharts";

const C = {
  bg: "#F7F8FC", surface: "#FFFFFF", surfaceAlt: "#F0F1F8", card: "#FFFFFF",
  border: "#E4E6F1", borderLight: "#EDEDF5",
  primary: "#4F5BD5", primarySoft: "#E8EAFF",
  accent: "#D946A8", accentSoft: "#FDE8F5",
  green: "#22C55E", greenSoft: "#ECFDF5", greenText: "#16A34A",
  red: "#EF4444", redSoft: "#FEF2F2", redText: "#DC2626",
  orange: "#F59E0B", orangeSoft: "#FFFBEB", orangeText: "#D97706",
  purple: "#8B5CF6", purpleSoft: "#F3F0FF",
  cyan: "#06B6D4", cyanSoft: "#ECFEFF",
  text: "#1E1E2F", textSecondary: "#64668B", textMuted: "#9496B3", textLight: "#B4B6CD",
};
const PIE_COLORS = [C.primary, C.green, C.orange, C.red, C.purple, C.cyan, C.accent];
const fmt = (n) => { if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M"; if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K"; return "$" + n; };
const fmtF = (n) => "$" + n.toLocaleString();

const expenseBreakdown = [
  { name: "Chris Referral", value: 2633 }, { name: "Setup Cost", value: 1300 },
  { name: "Salary", value: 1200 }, { name: "Ads", value: 1038 }, { name: "Master Referral", value: 66 },
];
const clientLifecycle = [
  { status: "New", count: 21, color: C.green }, { status: "Trial", count: 20, color: C.orange },
  { status: "Renewed", count: 20, color: C.primary }, { status: "Upgraded", count: 1, color: C.purple },
];
const tierBreakdown = [
  { tier: "Tier 1", count: 47 }, { tier: "Tier 2", count: 5 },
  { tier: "Tier 3", count: 6 }, { tier: "Tier 6", count: 1 },
];
const topClientsRev = [
  { name: "Stelio Audrey (098)", received: 15503, type: "CL", status: "Active", detail: "VIP - 2 CL payments" },
  { name: "Don Dankowich (12)", received: 2938, type: "CL", status: "Stopped", detail: "New - CL media" },
  { name: "Salmech (115)", received: 1960, type: "CL", status: "Active", detail: "Trial to Active" },
  { name: "Deborah (42)", received: 1761, type: "CL", status: "Active", detail: "Renewed x3" },
  { name: "Hugo VIP (58)", received: 1499, type: "CC", status: "Active", detail: "Tier 6 - $170K spend" },
  { name: "Celementa (100)", received: 1343, type: "CL", status: "Active", detail: "Trial convert" },
  { name: "Oscar (49)", received: 814, type: "CC", status: "Active", detail: "Renewed T3" },
  { name: "Raphael (61)", received: 798, type: "CC", status: "Active", detail: "New T3" },
  { name: "Lucas (43)", received: 699, type: "CC", status: "Active", detail: "Renewed" },
  { name: "Jordan (91)", received: 682, type: "CC", status: "Active", detail: "New T2" },
];
const topSpenders = [
  { name: "Hugo (58) Tier 6", spend: 169965, pct: 60.8 },
  { name: "Yolanda (94) Tier 1", spend: 21903, pct: 7.8 },
  { name: "Lucas (43) Tier 4", spend: 17900, pct: 6.4 },
  { name: "Miriano T (98) CL", spend: 16804, pct: 6.0 },
  { name: "BO (64) Tier 3", spend: 10154, pct: 3.6 },
  { name: "Oscar (49) Tier 3", spend: 9293, pct: 3.3 },
  { name: "Raphael (61) Tier 3", spend: 9124, pct: 3.3 },
  { name: "Jordan (91) Tier 2", spend: 6129, pct: 2.2 },
  { name: "Ahmed (65) Tier 1", spend: 3542, pct: 1.3 },
  { name: "Mateo (90) Tier 1", spend: 2787, pct: 1.0 },
];
const currencyMix = [
  { name: "USD", value: 247805 }, { name: "SEK", value: 21903 },
  { name: "EUR", value: 6994 }, { name: "AED", value: 2787 }, { name: "Others", value: 203 },
];
const newClientsDetail = [
  { name: "Hugo (58)", sub: 1499, tier: "T6", type: "CC", note: "VIP biggest spender" },
  { name: "Raphael (61)", sub: 499, tier: "T3", type: "CC", note: "2 ad accounts" },
  { name: "Julius (68)", sub: 499, tier: "T3", type: "CL", note: "Master referral" },
  { name: "Fellipe (87)", sub: 299, tier: "T2", type: "CC", note: "" },
  { name: "Jordan (91)", sub: 299, tier: "T2", type: "CC", note: "$6K spend" },
  { name: "Oussi (59)", sub: 299, tier: "T2", type: "CC", note: "" },
  { name: "Lawrence (89)", sub: 299, tier: "T2", type: "CC", note: "" },
  { name: "Edward (69)", sub: 199, tier: "T1", type: "CC", note: "Master ref" },
  { name: "Kirin (96)", sub: 199, tier: "T1", type: "CC", note: "" },
  { name: "Mateo (90)", sub: 199, tier: "T1", type: "CC", note: "$2.8K spend" },
  { name: "Don Dankowich (12)", sub: 0, tier: "T1", type: "CL", note: "$2,938 CL - Stopped" },
  { name: "Stelio (098)", sub: 0, tier: "---", type: "CL", note: "$15.5K received" },
];
const trialClients = [
  { name: "Salmech (115)", converted: true, received: 1960, note: "CL - High value" },
  { name: "Celementa (100)", converted: true, received: 1343, note: "CL - Active" },
  { name: "FFC Sander (105)", converted: true, received: 199, note: "" },
  { name: "FFC Gabrielle (103)", converted: true, received: 199, note: "Then New" },
  { name: "FFC Kelly (107)", converted: true, received: 0, note: "Then New" },
  { name: "FFC Amy (106)", converted: true, received: 0, note: "Then Renewed" },
  { name: "Kirin (96)", converted: true, received: 0, note: "Then New $199" },
  { name: "Sam (101)", converted: false, received: 0, note: "No payment" },
  { name: "FFC Kemi (109)", converted: false, received: 0, note: "No payment" },
  { name: "Florian (92)", converted: false, received: 0, note: "Stopped" },
  { name: "Maduro (97)", converted: false, received: 0, note: "Stopped x2" },
  { name: "Yolanda (94)", converted: false, received: 0, note: "Stopped x3 $22K spend!" },
  { name: "Balli (55)", converted: false, received: 100, note: "Stopped" },
];
const risks = [
  { label: "Hugo = 60.8% du spend", desc: "Un seul client genere $170K de media spend. Depart = perte massive de volume.", severity: "high", icon: "🎯" },
  { label: "20 Trials, conversion incertaine", desc: "32% des transactions sont des trials. Beaucoup n'ont pas paye.", severity: "high", icon: "🧪" },
  { label: "Yolanda: $22K spend, $0 revenu", desc: "3 trials, toutes stopped. $21.9K de media spend en SEK sans paiement.", severity: "high", icon: "⚠️" },
  { label: "CL Exposure: $21K", desc: "$21K de media avance sur comptes CL en janvier.", severity: "medium", icon: "💳" },
  { label: "Referral costs en hausse", desc: "Chris referral: $2,633 (41.7% des depenses). Tendance croissante.", severity: "medium", icon: "📣" },
  { label: "14 clients Stopped", desc: "23% des transactions Jan ont abouti a un arret.", severity: "medium", icon: "📉" },
  { label: "FFC batch : 7 trials simultanes", desc: "Amy, Gabrielle, Jolene, Kelly, Sander, Kemi - pipeline fragile.", severity: "medium", icon: "🏭" },
];

const CTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid " + C.border, borderRadius: 12, padding: "12px 16px", boxShadow: "0 4px 24px rgba(30,30,47,0.08)" }}>
      <p style={{ color: C.textMuted, fontSize: 11, margin: "0 0 6px", fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 13, margin: "3px 0", fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" ? fmtF(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

function KPI({ label, value, sub, icon, color, delay }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay || 0); return () => clearTimeout(t); }, [delay]);
  const col = color || C.primary;
  const soft = col === C.green ? C.greenSoft : col === C.red ? C.redSoft : col === C.orange ? C.orangeSoft : col === C.purple ? C.purpleSoft : col === C.cyan ? C.cyanSoft : C.primarySoft;
  return (
    <div style={{ background: C.card, borderRadius: 16, padding: "22px 24px", border: "1px solid " + C.borderLight, boxShadow: "0 1px 4px rgba(30,30,47,0.04)", opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(12px)", transition: "all 0.45s cubic-bezier(0.22,1,0.36,1)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 80, height: 80, borderRadius: "50%", background: soft, opacity: 0.7 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 22, opacity: 0.7 }}>{icon}</span>
      </div>
    </div>
  );
}

function Sec({ title, subtitle, children, sx }) {
  return (
    <div style={{ background: C.card, borderRadius: 16, border: "1px solid " + C.borderLight, boxShadow: "0 1px 4px rgba(30,30,47,0.04)", padding: 28, ...(sx || {}) }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: C.textMuted, margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function BadgeC({ children, color }) {
  const col = color || C.primary;
  const soft = col === C.greenText ? C.greenSoft : col === C.redText ? C.redSoft : col === C.orangeText ? C.orangeSoft : col === C.purple ? C.purpleSoft : col === C.accent ? C.accentSoft : C.primarySoft;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 8, background: soft, color: col, letterSpacing: "0.04em" }}>{children}</span>;
}

function SDot({ s }) {
  const a = s === "Active";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: a ? C.green : C.red }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: a ? C.greenText : C.redText }}>{s}</span>
    </span>
  );
}

function Tb({ active, children, onClick }) {
  return (
    <button onClick={onClick} style={{ background: active ? C.primary : "transparent", color: active ? "#fff" : C.textSecondary, border: active ? "none" : "1.5px solid " + C.border, borderRadius: 12, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7, transition: "all 0.2s", boxShadow: active ? "0 2px 12px rgba(79,91,213,0.25)" : "none" }}>
      {children}
    </button>
  );
}

function AlertBox({ children, type }) {
  var t = type || "red";
  var s = t === "red" ? { bg: C.redSoft, c: C.redText, b: "rgba(239,68,68,0.15)" } : t === "green" ? { bg: C.greenSoft, c: C.greenText, b: "rgba(34,197,94,0.15)" } : { bg: C.orangeSoft, c: C.orangeText, b: "rgba(245,158,11,0.15)" };
  return (
    <div style={{ padding: "14px 18px", background: s.bg, borderRadius: 12, border: "1px solid " + s.b, display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
      <span style={{ fontSize: 12, color: s.c, fontWeight: 600, lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

var thS = function(left) { return { padding: "10px 14px", textAlign: left ? "left" : "right", background: C.surfaceAlt, color: C.textMuted, fontWeight: 600, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: "2px solid " + C.border }; };
var tdS = function(left, bold, bg) { return { padding: "10px 14px", textAlign: left ? "left" : "right", fontWeight: bold ? 700 : 400, color: C.text, borderBottom: "1px solid " + C.borderLight, background: bg || "transparent" }; };

export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  var tabs = [
    { id: "overview", label: "Vue d'ensemble", icon: "📊" },
    { id: "clients", label: "Clients", icon: "👥" },
    { id: "media", label: "Media Spend", icon: "📡" },
    { id: "blink", label: "Suivi Blink", icon: "🏦" },
    { id: "risks", label: "Risques", icon: "⚠️" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans',-apple-system,sans-serif", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap" rel="stylesheet" />

      <header style={{ background: "linear-gradient(135deg,#FFFFFF 0%,#F4F5FF 100%)", borderBottom: "1px solid " + C.border, padding: "20px 32px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1360, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src={"data:image/jpeg;base64,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"} alt="Prime Circle" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", background: "#FFFFFF", padding: 4 }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <BadgeC color={C.accent}>JANVIER 2026</BadgeC>
                </div>
                <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>Monthly Financial & Operational Dashboard</p>
              </div>
            </div>
            <div style={{ background: C.primarySoft, borderRadius: 10, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "0.06em" }}>MOIS</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.primary }}>JAN 2026</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, overflowX: "auto" }}>
            {tabs.map(function(t) { return <Tb key={t.id} active={tab === t.id} onClick={function() { setTab(t.id); }}>{t.icon} {t.label}</Tb>; })}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1360, margin: "0 auto", padding: "24px 32px 80px" }}>

        {tab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 24 }}>
              <KPI label="Gross Revenue" value="$10,726" icon="💰" color={C.primary} delay={0} sub="Sub + Setup" />
              <KPI label="Total Depenses" value="$6,237" icon="📉" color={C.red} delay={60} sub="58.2% du revenue" />
              <KPI label="Net Revenue" value="$4,489" icon="📈" color={C.green} delay={120} sub="Marge 41.8%" />
              <KPI label="PCA Share (50%)" value="$2,245" icon="🤝" color={C.purple} delay={180} sub="Du a Blink" />
              <KPI label="Transactions" value="59" icon="📋" color={C.primary} delay={240} sub="21 New - 20 Trial" />
              <KPI label="Clients Actifs" value="47" icon="✅" color={C.green} delay={300} sub="12 Stopped" />
              <KPI label="Total Encaisse" value="$28,975" icon="🏦" color={C.cyan} delay={360} sub="Incl. CL media" />
              <KPI label="Media Gere" value="$279.7K" icon="📡" color={C.orange} delay={420} sub="33 ad accounts" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
              <Sec title="Waterfall Revenue - Net" subtitle="Decomposition du P&L Janvier 2026">
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <tbody>
                      {[
                        { l: "Subscriptions", v: 8074, bg: C.primarySoft, b: false },
                        { l: "Setup Fees", v: 2787, bg: C.primarySoft, b: false },
                        { l: "Discounts", v: -135, bg: null, b: false },
                        { l: "GROSS REVENUE", v: 10726, bg: C.primarySoft, b: true },
                        { l: "", v: null },
                        { l: "Setup Cost (agents)", v: -1300, bg: null, b: false },
                        { l: "Salary", v: -1200, bg: null, b: false },
                        { l: "Advertising", v: -1038, bg: null, b: false },
                        { l: "Chris Referral (10%)", v: -2633, bg: C.redSoft, b: false },
                        { l: "Master Referral (5%)", v: -66, bg: null, b: false },
                        { l: "TOTAL EXPENSES", v: -6237, bg: C.redSoft, b: true },
                        { l: "", v: null },
                        { l: "NET REVENUE", v: 4489, bg: C.greenSoft, b: true },
                        { l: "PCA Share (50%)", v: -2245, bg: C.purpleSoft, b: true },
                        { l: "PC RETAINED", v: 2244, bg: C.greenSoft, b: true },
                      ].map(function(r, i) {
                        if (r.v === null) return <tr key={i}><td colSpan={2} style={{ height: 8 }}></td></tr>;
                        return (
                          <tr key={i}>
                            <td style={tdS(true, r.b, r.bg)}>{r.l}</td>
                            <td style={Object.assign({}, tdS(false, r.b, r.bg), { fontVariantNumeric: "tabular-nums" })}>
                              {typeof r.v === "number" ? (r.v < 0 ? "(" + fmtF(Math.abs(r.v)) + ")" : fmtF(r.v)) : r.v}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Sec>
              <Sec title="Repartition des Depenses" subtitle="$6,237 total - Chris Referral = 42.2%">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={3} label={function(e) { return e.name + " " + (e.percent * 100).toFixed(0) + "%"; }} labelLine={{ stroke: C.textLight }}>
                      {expenseBreakdown.map(function(_, i) { return <Cell key={i} fill={[C.accent, C.primary, C.orange, C.cyan, C.textLight][i]} />; })}
                    </Pie>
                    <Tooltip content={<CTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <AlertBox type="orange">Chris Referral ($2,633) represente 42.2% des charges et depasse le salary ($1,200)</AlertBox>
              </Sec>
            </div>

            <Sec title="Client Lifecycle - Janvier 2026" subtitle="62 transactions : 21 New, 20 Trial, 20 Renewed, 1 Upgraded">
              <div style={{ display: "flex", gap: 14 }}>
                {clientLifecycle.map(function(c, i) {
                  var soft = c.color === C.green ? C.greenSoft : c.color === C.orange ? C.orangeSoft : c.color === C.primary ? C.primarySoft : C.purpleSoft;
                  return (
                    <div key={i} style={{ flex: 1, background: soft, borderRadius: 14, padding: "22px 16px", textAlign: "center", border: "1px solid " + C.border }}>
                      <div style={{ fontSize: 36, fontWeight: 800, color: c.color }}>{c.count}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 4 }}>{c.status}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{Math.round(c.count / 62 * 100)}% des tx</div>
                    </div>
                  );
                })}
                <div style={{ flex: 1, background: C.redSoft, borderRadius: 14, padding: "22px 16px", textAlign: "center", border: "1px solid " + C.border }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: C.red }}>14</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 4 }}>Stopped</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>23% des tx</div>
                </div>
              </div>
            </Sec>
          </div>
        )}

        {tab === "clients" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 24 }}>
              <KPI label="Nouveaux Clients" value="21" icon="🆕" color={C.green} delay={0} sub="Dont Stelio $13K" />
              <KPI label="Renouveles" value="20" icon="🔄" color={C.primary} delay={60} />
              <KPI label="Trials" value="20" icon="🧪" color={C.orange} delay={120} sub="~35% conversion" />
              <KPI label="Stopped" value="14" icon="🛑" color={C.red} delay={180} />
              <KPI label="CC Comptes" value="47" icon="💳" color={C.primary} delay={240} />
              <KPI label="CL Comptes" value="14" icon="⚡" color={C.orange} delay={300} sub="Risque credit" />
            </div>

            <Sec title="Top 10 Clients - Janvier (par encaissement)" sx={{ marginBottom: 18 }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["#", "Client", "Encaisse", "Type", "Statut", "Detail"].map(function(h, i) {
                        return <th key={i} style={Object.assign({}, thS(i < 2 || i === 5), { textAlign: i === 4 ? "center" : i < 2 || i === 5 ? "left" : "right" })}>{h}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {topClientsRev.map(function(c, i) {
                      return (
                        <tr key={i} onMouseEnter={function(e) { e.currentTarget.style.background = C.surfaceAlt; }} onMouseLeave={function(e) { e.currentTarget.style.background = "transparent"; }}>
                          <td style={tdS(true, true)}><span style={{ color: i < 3 ? C.accent : C.textMuted }}>{i + 1}</span></td>
                          <td style={tdS(true, true)}>{c.name}</td>
                          <td style={tdS(false, true)}>{fmtF(c.received)}</td>
                          <td style={tdS(false)}><BadgeC color={c.type === "CL" ? C.orangeText : C.primary}>{c.type}</BadgeC></td>
                          <td style={Object.assign({}, tdS(false), { textAlign: "center" })}><SDot s={c.status} /></td>
                          <td style={Object.assign({}, tdS(true), { color: C.textSecondary, fontSize: 12 })}>{c.detail}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Sec>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <Sec title="Nouveaux Clients - Detail" subtitle="21 nouvelles inscriptions en janvier">
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>{["Client", "Sub", "Tier", "Type", "Note"].map(function(h, i) { return <th key={i} style={thS(i === 0 || i === 4)}>{h}</th>; })}</tr>
                    </thead>
                    <tbody>
                      {newClientsDetail.map(function(c, i) {
                        return (
                          <tr key={i}>
                            <td style={tdS(true, true)}>{c.name}</td>
                            <td style={tdS(false)}>{c.sub > 0 ? fmtF(c.sub) : "---"}</td>
                            <td style={tdS(false)}>{c.tier}</td>
                            <td style={tdS(false)}><BadgeC color={c.type === "CL" ? C.orangeText : C.primary}>{c.type}</BadgeC></td>
                            <td style={Object.assign({}, tdS(true), { color: C.textSecondary, fontSize: 11 })}>{c.note}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Sec>
              <Sec title="Tiers & Types" subtitle="Repartition des 62 transactions">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Par Tier</div>
                    {tierBreakdown.map(function(t, i) {
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.text, width: 50 }}>{t.tier}</span>
                          <div style={{ flex: 1, background: C.surfaceAlt, borderRadius: 6, height: 22, overflow: "hidden" }}>
                            <div style={{ height: "100%", borderRadius: 6, background: "linear-gradient(90deg," + C.primary + ",#7C8CF5)", width: (t.count / 44 * 100) + "%", display: "flex", alignItems: "center", paddingLeft: 8 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{t.count}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>CC vs CL</div>
                    <div style={{ background: C.primarySoft, borderRadius: 12, padding: 16, textAlign: "center", marginBottom: 10, border: "1px solid " + C.border }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: C.primary }}>47</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>CC (75.8%)</div>
                    </div>
                    <div style={{ background: C.orangeSoft, borderRadius: 12, padding: 16, textAlign: "center", border: "1px solid " + C.border }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: C.orangeText }}>14</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>CL (22.6%)</div>
                    </div>
                  </div>
                </div>
              </Sec>
            </div>
          </div>
        )}

        {tab === "media" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 24 }}>
              <KPI label="Total Media Spend" value="$279.7K" icon="📡" color={C.primary} delay={0} sub="x4.3 vs decembre" />
              <KPI label="CC Spend" value="$258.7K" icon="✅" color={C.green} delay={60} sub="92.5% - sans risque" />
              <KPI label="CL Spend" value="$21.0K" icon="📊" color={C.orange} delay={120} sub="7.5% du total" />
              <KPI label="Ad Accounts Actifs" value="33" icon="📊" color={C.purple} delay={180} />
            </div>

            <Sec title="Top 10 Comptes par Media Spend" subtitle="Janvier 2026 - ALERTE concentration extreme" sx={{ marginBottom: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {topSpenders.map(function(s, i) {
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ width: 26, fontSize: 13, fontWeight: 700, color: i < 3 ? C.accent : C.textMuted, textAlign: "center" }}>{"#" + (i + 1)}</span>
                      <span style={{ width: 170, fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
                      <div style={{ flex: 1, background: C.surfaceAlt, borderRadius: 8, height: 28, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 8, background: i === 0 ? "linear-gradient(90deg," + C.accent + ",#FF6B9D)" : i < 3 ? "linear-gradient(90deg," + C.primary + ",#7C8CF5)" : "linear-gradient(90deg," + C.cyan + ",#7DD3E8)", width: Math.min(s.pct * 1.6, 100) + "%", display: "flex", alignItems: "center", paddingLeft: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{fmtF(s.spend)}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? C.redText : C.textSecondary, width: 50, textAlign: "right" }}>{s.pct + "%"}</span>
                    </div>
                  );
                })}
              </div>
            </Sec>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <Sec title="Exposition Devises" subtitle="$279.7K repartis sur 6 devises">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={currencyMix} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={2} label={function(e) { return e.name + " " + (e.percent * 100).toFixed(0) + "%"; }} labelLine={{ stroke: C.textLight }}>
                      {[C.primary, C.purple, C.orange, C.green, C.textLight].map(function(c, i) { return <Cell key={i} fill={c} />; })}
                    </Pie>
                    <Tooltip content={<CTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Sec>
              <Sec title="CC vs CL Media" subtitle="Repartition du risque">
                <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
                  <div style={{ flex: 2.5, background: C.greenSoft, borderRadius: 14, padding: 24, textAlign: "center", border: "1px solid " + C.border }}>
                    <div style={{ fontSize: 38, fontWeight: 800, color: C.greenText }}>92.5%</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 6 }}>CC - $258.7K</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Client paie directement</div>
                  </div>
                  <div style={{ flex: 1, background: C.redSoft, borderRadius: 14, padding: 24, textAlign: "center", border: "1px solid " + C.border }}>
                    <div style={{ fontSize: 38, fontWeight: 800, color: C.redText }}>7.5%</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginTop: 6 }}>CL - $21.0K</div>
                    <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>PCA avance le media</div>
                  </div>
                </div>
              </Sec>
            </div>
          </div>
        )}

        {tab === "blink" && (
          <div>
            <Sec title="Suivi Blink - Benefit & Media" subtitle="Reporting Sep 2025 - Jan 2026" sx={{ marginBottom: 18 }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["", "Sep-25", "Oct-25", "Nov-25", "Dec-25", "Jan-26"].map(function(h, i) {
                        return <th key={i} style={Object.assign({}, thS(i === 0), { textAlign: i === 0 ? "left" : "right" })}>{h}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { l: "Net Revenue", v: [198, 10644, 5854, 8518, 4489], bg: null, b: false, sep: false },
                      { l: "CA PCA (50%)", v: [99, 5322, 2927, 4259, 2244], bg: null, b: false, sep: false },
                      { l: "CA PCA (50%) Cumulated", v: [99, 5421, 8348, 12607, 14852], bg: C.primarySoft, b: true, sep: false },
                      { l: "CA Blink to PAID at Blink (50%)", v: [99, 5322, 2927, 4259, 2244], bg: null, b: false, sep: false },
                      { l: "Amount Paid by PCA on Benefit", v: [0, 0, 0, 0, 0], bg: C.redSoft, b: false, sep: false },
                      { l: "To Paid at Blink Cumulated", v: [99, 5421, 8348, 12607, 14852], bg: C.redSoft, b: true, sep: true },
                      { l: "Total Media to Pay (CL)", v: [31788, 12866, 5730, 4406, 21009], bg: null, b: false, sep: false },
                      { l: "Amount Paid by PCA on Media", v: [31788, 12866, 5730, 4406, 21009], bg: C.greenSoft, b: false, sep: false },
                      { l: "To Paid at Blink Cumulated (Media)", v: [0, 0, 0, 0, 0], bg: C.greenSoft, b: true, sep: true },
                      { l: "Total Blink to Pay / Month (Benefit & Media)", v: [31887, 18188, 8657, 8665, 23253], bg: null, b: false, sep: false },
                      { l: "Total Blink to Pay Cumulated", v: [99, 5421, 8348, 12607, 14852], bg: C.purpleSoft, b: true, sep: false },
                    ].map(function(r, i) {
                      return (
                        <React.Fragment key={i}>
                          <tr>
                            <td style={tdS(true, r.b, r.bg)}>{r.l}</td>
                            {r.v.map(function(val, ci) {
                              return <td key={ci} style={Object.assign({}, tdS(false, r.b, r.bg), { fontVariantNumeric: "tabular-nums" })}>
                                {val === 0 ? "$0" : fmtF(val)}
                              </td>;
                            })}
                          </tr>
                          {r.sep && <tr><td colSpan={6} style={{ height: 10 }}></td></tr>}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Sec>

          </div>
        )}

        {tab === "risks" && (
          <div>
            <Sec title="Indicateurs Cles de Risque - Janvier 2026" sx={{ marginBottom: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 12 }}>
                {[
                  { l: "Concentration Hugo", v: "60.8%", s: "du media spend", c: C.redText },
                  { l: "CL Exposure", v: "$21.0K", s: "media avance", c: C.redText },
                  { l: "Marge Nette", v: "41.8%", s: "vs 54.8% en Dec", c: C.orangeText },
                  { l: "Clients Stopped", v: "14", s: "23% des tx", c: C.orangeText },
                ].map(function(item, i) {
                  return (
                    <div key={i} style={{ background: item.c === C.redText ? C.redSoft : C.orangeSoft, borderRadius: 12, padding: "16px 14px", textAlign: "center", border: "1px solid " + C.border }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{item.l}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: item.c }}>{item.v}</div>
                      <div style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>{item.s}</div>
                    </div>
                  );
                })}
              </div>
            </Sec>

          </div>
        )}
      </main>
    </div>
  );
}
