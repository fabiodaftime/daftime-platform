import { useState, useEffect } from 'react';
import skalisLogo from '@/assets/skalis-logo.png';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Menu, ArrowLeft } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  SKALIS_KPI,
  PL_ROWS,
  COST_BREAKDOWN,
  CONSULTANTS,
  TREASURY,
  BREAK_EVEN,
  INSIGHTS,
  MISSING_ELEMENTS,
  NAV_ITEMS,
} from '@/components/dashboard/skalis/SkalisData';
import './DashboardSkalis.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  layout_type: string;
  currency: string;
}

const fmt = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString('fr-FR');
};

const fmtFull = (n: number) => n.toLocaleString('fr-FR');

const DashboardSkalis = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        toast({ title: 'Erreur', description: 'Impossible de charger la société', variant: 'destructive' });
        return;
      }
      setCompany(data);
    };
    fetchCompany();
  }, [id]);

  const activeLabel = NAV_ITEMS.find(n => n.id === activePage)?.label || 'Vue Générale';

  const waterfallData = {
    labels: ['CA', 'Ext. Salary', 'Cons. Exp.', 'DIFC Fees', 'Assurance', 'Marge\ndirecte', 'Int. Salary\n+ Frais', 'Résultat\nopérat.'],
    datasets: [{
      data: [6561487, -3046591, -1828289, -219067, -54829, 1412711, -427891, 984821],
      backgroundColor: ['rgba(192,57,43,.15)', 'rgba(192,57,43,.65)', 'rgba(192,57,43,.45)', 'rgba(217,119,6,.55)', 'rgba(217,119,6,.4)', 'rgba(124,58,237,.2)', 'rgba(37,99,235,.5)', 'rgba(26,158,110,.55)'],
      borderColor: ['#c0392b', '#c0392b', '#c0392b', '#d97706', '#d97706', '#7c3aed', '#2563eb', '#1a9e6e'],
      borderWidth: 1.5,
      borderRadius: 4,
    }],
  };

  const donutData = {
    labels: ['Ext. Salary', 'Consultant Exp.', 'DIFC Fees', 'Assurance médicale', 'Internal Salary', 'Autres structure'],
    datasets: [{
      data: [3046591, 1828289, 219067, 54829, 260256, 167635],
      backgroundColor: ['rgba(192,57,43,.85)', 'rgba(192,57,43,.55)', 'rgba(217,119,6,.75)', 'rgba(217,119,6,.45)', 'rgba(37,99,235,.7)', 'rgba(37,99,235,.4)'],
      borderWidth: 1,
    }],
  };

  const costDonutData = {
    labels: ['COGS direct (portés)', 'DIFC + Assurance', 'Coûts de structure', 'Résultat net'],
    datasets: [{
      data: [4874880, 273896, 427891, 984821],
      backgroundColor: ['rgba(192,57,43,.12)', 'rgba(217,119,6,.12)', 'rgba(37,99,235,.12)', 'rgba(26,158,110,.12)'],
      borderColor: ['#c0392b', '#d97706', '#2563eb', '#1a9e6e'],
      borderWidth: 2,
    }],
  };

  const consultantBarData = {
    labels: CONSULTANTS.map(c => c.name.split(' ').slice(0, 2).join(' ')),
    datasets: [{
      data: CONSULTANTS.map(c => c.ca),
      backgroundColor: CONSULTANTS.map(c => c.ca > 420000 ? 'rgba(192,57,43,.12)' : c.ca > 280000 ? 'rgba(192,57,43,.3)' : 'rgba(192,57,43,.16)'),
      borderColor: CONSULTANTS.map(c => c.ca > 420000 ? '#c0392b' : 'rgba(192,57,43,.35)'),
      borderWidth: 1,
      borderRadius: 3,
    }],
  };

  const margesData = {
    labels: ['Marge Brute', 'Marge Directe', 'Marge Opérat.', 'Marge Nette'],
    datasets: [{
      data: [100, 21.5, 15.0, 15.4],
      backgroundColor: ['rgba(192,57,43,.1)', 'rgba(124,58,237,.15)', 'rgba(26,158,110,.15)', 'rgba(26,158,110,.25)'],
      borderColor: ['#c0392b', '#7c3aed', '#1a9e6e', '#1a9e6e'],
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const breakEvenData = {
    labels: [0, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(String),
    datasets: [{
      label: 'Marge directe cumulée',
      data: [0, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(n => n * 327879 * 0.215),
      backgroundColor: 'rgba(124,58,237,.15)',
      borderColor: '#7c3aed',
      borderWidth: 2,
      borderRadius: 4,
    }],
  };

  const projectionData = (() => {
    const ct = [3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20, 22, 24];
    const res = ct.map(n => n * 327879 * 0.215 - 427891);
    return {
      labels: ct.map(n => n + ' portés'),
      datasets: [{
        label: 'Résultat net estimé',
        data: res,
        backgroundColor: res.map(v => v >= 0 ? 'rgba(26,158,110,.12)' : 'rgba(192,57,43,.12)'),
        borderColor: res.map(v => v >= 0 ? '#1a9e6e' : '#c0392b'),
        borderWidth: 2,
        borderRadius: 4,
      }],
    };
  })();

  const chartOptions = (vertical = true) => ({
    responsive: true,
    indexAxis: vertical ? 'x' as const : 'y' as const,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#eef0f5' }, ticks: { font: { size: 9 } } },
      y: { grid: { color: '#eef0f5' }, ticks: { font: { size: 10 }, callback: (v: number | string) => typeof v === 'number' ? (Math.abs(v) >= 1e6 ? (Number(v) / 1e6).toFixed(1) + 'M' : (Number(v) / 1000).toFixed(0) + 'K') : v } },
    },
  });

  const donutOptions = {
    responsive: true,
    cutout: '60%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { boxWidth: 10, padding: 7, font: { size: 10 } } },
    },
  };

  const renderOverview = () => (
    <div key="overview">
      <div className="mb-5">
        <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--sk-tx)', letterSpacing: '-.4px' }}>Vue Générale — FY 2025</h1>
        <p style={{ fontSize: 10, color: 'var(--sk-t3)', fontFamily: "'DM Mono', monospace", marginTop: 3 }}>SKALIS IT CONSULTANCY MIDDLE EAST · BASE ACCRUAL · AED · P&L MIS À JOUR</p>
      </div>

      <div className="sk-kpi-grid k4">
        <div className="sk-kpi cr">
          <div className="sk-kpi-label">Chiffre d'affaires</div>
          <div className="sk-kpi-value cr">6,56M <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div>
          <div className="sk-kpi-meta">base accrual · 2025</div>
        </div>
        <div className="sk-kpi cr">
          <div className="sk-kpi-label">COGS direct (Ext. Sal. + Cons. Exp.)</div>
          <div className="sk-kpi-value cr">4,87M <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div>
          <div className="sk-kpi-meta">74,3% du CA</div>
          <div className="sk-kpi-badge bd">74,3%</div>
        </div>
        <div className="sk-kpi cp">
          <div className="sk-kpi-label">Marge directe</div>
          <div className="sk-kpi-value cp">1,41M <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div>
          <div className="sk-kpi-meta">CA − COGS − DIFC − Assurance</div>
          <div className="sk-kpi-badge bp">21,5%</div>
        </div>
        <div className="sk-kpi cg">
          <div className="sk-kpi-label">Résultat net</div>
          <div className="sk-kpi-value cg">1,01M <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div>
          <div className="sk-kpi-meta">marge nette 15,4%</div>
          <div className="sk-kpi-badge bu">▲ 15,4%</div>
        </div>
      </div>

      <div className="sk-kpi-grid k4">
        <div className="sk-kpi cd">
          <div className="sk-kpi-label">Cash banques (réel)</div>
          <div className="sk-kpi-value cd">258K <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div>
          <div className="sk-kpi-meta">fin déc. 2025</div>
        </div>
        <div className="sk-kpi ca">
          <div className="sk-kpi-label">AR non-encaissé</div>
          <div className="sk-kpi-value ca">1,86M <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div>
          <div className="sk-kpi-meta">28% du CA — critique</div>
          <div className="sk-kpi-badge bw">⚠</div>
        </div>
        <div className="sk-kpi cr">
          <div className="sk-kpi-label">Consultants portés</div>
          <div className="sk-kpi-value cr">16</div>
          <div className="sk-kpi-meta">identifiés Sales by Item</div>
        </div>
        <div className="sk-kpi cg">
          <div className="sk-kpi-label">CA moyen / consultant</div>
          <div className="sk-kpi-value cg">328K <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div>
          <div className="sk-kpi-meta">≈ 89K USD/an</div>
        </div>
      </div>

      <div className="sk-g6040" style={{ marginTop: 14 }}>
        <div className="sk-card">
          <div className="sk-card-header">
            <div className="sk-card-title"><span className="sk-dot dr" />Cascade économique retraitée (AED)</div>
            <div className="sk-card-sub">ACCRUAL · RETRAITÉ</div>
          </div>
          <Bar data={waterfallData} options={chartOptions()} />
          <div className="sk-notice np" style={{ marginTop: 12 }}>
            <strong>Lecture retraitée :</strong> Le COGS économique absorbe <strong>74,3% du CA</strong>. Après déduction des DIFC Fees et de l'assurance médicale, la <strong>marge directe ressort à 21,5%</strong> (1,41M AED).
          </div>
        </div>
        <div className="sk-card">
          <div className="sk-card-header">
            <div className="sk-card-title"><span className="sk-dot dd" />Répartition des charges</div>
            <div className="sk-card-sub">5,58M AED</div>
          </div>
          <Doughnut data={donutData} options={donutOptions} />
        </div>
      </div>

      <div className="sk-g2" style={{ marginTop: 14 }}>
        <div className="sk-card">
          <div className="sk-card-header">
            <div className="sk-card-title"><span className="sk-dot da" />Cash comptable vs cash réel</div>
          </div>
          {TREASURY.cashFlow.map((row, i) => (
            <div className="sk-ib" key={i}>
              <div className="sk-ib-label" style={{ fontWeight: row.isTotal ? 700 : row.color === 'green' ? 600 : 400, color: row.isTotal ? 'var(--sk-tx)' : row.color === 'green' ? 'var(--sk-grn)' : undefined }}>{row.label}</div>
              <div className="sk-ib-track"><div className="sk-ib-fill" style={{ width: `${row.widthPercent}%`, background: `var(--sk-${row.color === 'dark' ? 'tx' : row.color})` }} /></div>
              <div className="sk-ib-value" style={{ fontWeight: row.isTotal ? 700 : 400, color: row.color === 'red' ? 'var(--sk-red)' : row.color === 'green' ? 'var(--sk-grn)' : row.color === 'amber' ? 'var(--sk-amb)' : row.color === 'blue' ? 'var(--sk-blu)' : undefined }}>
                {row.value < 0 ? '−' : row.isTotal ? '' : '+'}{fmtFull(Math.abs(row.value))}
              </div>
            </div>
          ))}
          <div className="sk-notice na" style={{ marginTop: 12 }}>
            <strong>⚠ Risque trésorerie :</strong> Le résultat comptable est quasi-intégralement absorbé par l'AR non-encaissé. Encaisser les créances clients est la priorité opérationnelle immédiate.
          </div>
        </div>
        <div className="sk-card">
          <div className="sk-card-header">
            <div className="sk-card-title"><span className="sk-dot dp" />Décomposition de la marge directe</div>
          </div>
          <div className="sk-sr"><div className="sk-sr-label">Chiffre d'affaires</div><div className="sk-sr-value">6 561 487 AED</div></div>
          <div className="sk-sr"><div className="sk-sr-label" style={{ color: 'var(--sk-red)' }}>− External Salary (portés)</div><div className="sk-sr-value cr">−3 046 591</div></div>
          <div className="sk-sr"><div className="sk-sr-label" style={{ color: 'var(--sk-red)' }}>− Consultant Expense (coût direct)</div><div className="sk-sr-value cr">−1 828 289</div></div>
          <div className="sk-sr"><div className="sk-sr-label" style={{ color: 'var(--sk-red)' }}>− DIFC Fees</div><div className="sk-sr-value cr">−219 067</div></div>
          <div className="sk-sr"><div className="sk-sr-label" style={{ color: 'var(--sk-red)' }}>− Medical Insurance</div><div className="sk-sr-value cr">−54 829</div></div>
          <hr className="sk-hr" />
          <div className="sk-sr"><div className="sk-sr-label" style={{ fontWeight: 700, color: 'var(--sk-pur)' }}> = MARGE DIRECTE</div><div className="sk-sr-value cp">1 412 711 AED</div></div>
          <div className="sk-sr"><div className="sk-sr-label">Taux de marge directe</div><div className="sk-sr-value cp">21,5%</div></div>
          <hr className="sk-hr" />
          <div className="sk-sr"><div className="sk-sr-label" style={{ color: 'var(--sk-t3)' }}>− Coûts de structure</div><div className="sk-sr-value" style={{ color: 'var(--sk-t3)' }}>−427 890</div></div>
          <div className="sk-sr"><div className="sk-sr-label" style={{ fontWeight: 700 }}>= Résultat opérationnel</div><div className="sk-sr-value cg">984 821 AED</div></div>
          <div className="sk-sr"><div className="sk-sr-label" style={{ color: 'var(--sk-t3)' }}>± Gain/perte de change</div><div className="sk-sr-value ca">+26 813</div></div>
          <div className="sk-sr"><div className="sk-sr-label" style={{ fontWeight: 700 }}>= Résultat net</div><div className="sk-sr-value cg">1 011 634 AED</div></div>
        </div>
      </div>
    </div>
  );

  const renderPL = () => (
    <div key="pl">
      <div className="mb-5">
        <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--sk-tx)' }}>P&L & Retraitement Économique</h1>
        <p style={{ fontSize: 10, color: 'var(--sk-t3)', fontFamily: "'DM Mono', monospace", marginTop: 3 }}>COMPTE DE RÉSULTAT · BASE ACCRUAL · FY 2025 · AED</p>
      </div>

      <div className="sk-retr">
        <div className="sk-retr-title">📐 Retraitement économique — Marge directe d'activité</div>
        <div className="sk-retr-row"><span style={{ color: 'var(--sk-t2)' }}>Chiffre d'affaires</span><span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>6 561 487 AED</span></div>
        <div className="sk-retr-row"><span style={{ color: 'var(--sk-t2)' }}>− External Salary (salaires portés)</span><span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: 'var(--sk-red)' }}>−3 046 591</span></div>
        <div className="sk-retr-row"><span style={{ color: 'var(--sk-t2)' }}>− Consultant Expense (coût direct variable)</span><span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: 'var(--sk-red)' }}>−1 828 289</span></div>
        <div className="sk-retr-row"><span style={{ color: 'var(--sk-t2)' }}>− DIFC Fees (licence / conformité)</span><span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: 'var(--sk-red)' }}>−219 067</span></div>
        <div className="sk-retr-row"><span style={{ color: 'var(--sk-t2)' }}>− Medical Insurance (coût direct)</span><span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: 'var(--sk-red)' }}>−54 829</span></div>
        <div className="sk-retr-total">
          <span style={{ fontWeight: 700, color: 'var(--sk-pur)' }}>MARGE DIRECTE D'ACTIVITÉ</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 800, color: 'var(--sk-pur)' }}>1 412 711 AED — 21,5%</span>
        </div>
      </div>

      <div className="sk-g6040">
        <div className="sk-card">
          <div className="sk-card-header">
            <div className="sk-card-title"><span className="sk-dot dr" />Compte de Résultat complet</div>
            <div className="sk-card-sub">AED · ACCRUAL</div>
          </div>
          <table className="sk-pl-table">
            <tbody>
              <tr className="sk-pl-sec"><td colSpan={2}>PRODUITS</td></tr>
              <tr className="sk-pl-hl sk-pl-l0"><td>Chiffre d'Affaires</td><td>6 561 487</td></tr>
              <tr className="sk-pl-l2"><td>↳ Sales</td><td>6 561 276</td></tr>
              <tr className="sk-pl-l2"><td>↳ Autres charges (produit)</td><td>211</td></tr>
              <tr className="sk-pl-l1"><td>Coût des Ventes (COGS officiel)</td><td style={{ color: 'var(--sk-grn)', fontWeight: 700 }}>0</td></tr>
              <tr className="sk-pl-l0 sk-pl-pos"><td>Marge Brute</td><td>6 561 487</td></tr>

              <tr className="sk-pl-sec"><td colSpan={2}>COGS ÉCONOMIQUE — COÛTS DIRECTS CONSULTANTS</td></tr>
              <tr className="sk-pl-l1 sk-pl-neg"><td>External Salary (salaires portés)</td><td>−3 046 591</td></tr>
              <tr className="sk-pl-l1 sk-pl-neg"><td>Consultant Expense (coût direct)</td><td>−1 828 289</td></tr>
              <tr className="sk-pl-cogs"><td>Sous-total COGS économique</td><td>−4 874 880</td></tr>

              <tr className="sk-pl-sec"><td colSpan={2}>COÛTS DIRECTS LIÉS À LA STRUCTURE DIFC</td></tr>
              <tr className="sk-pl-l1 sk-pl-neg"><td>DIFC Fees (licence, conformité)</td><td>−219 067</td></tr>
              <tr className="sk-pl-l1 sk-pl-neg"><td>Medical Insurance</td><td>−54 829</td></tr>

              <tr className="sk-pl-mdir"><td>MARGE DIRECTE D'ACTIVITÉ</td><td>1 412 711</td></tr>
              <tr className="sk-pl-l2"><td>Taux de marge directe</td><td style={{ color: 'var(--sk-pur)', fontWeight: 600 }}>21,5%</td></tr>

              <tr className="sk-pl-sec"><td colSpan={2}>COÛTS DE STRUCTURE</td></tr>
              <tr className="sk-pl-l1 sk-pl-neg"><td>Internal Salary (business development)</td><td>−260 256</td></tr>
              <tr className="sk-pl-l1 sk-pl-neg"><td>Frais bancaires</td><td>−38 241</td></tr>
              <tr className="sk-pl-l1 sk-pl-neg"><td>Travel Expense</td><td>−27 113</td></tr>
              <tr className="sk-pl-l1 sk-pl-neg"><td>Legal Expense</td><td>−83 564</td></tr>
              <tr className="sk-pl-l1 sk-pl-neg"><td>IT & Internet</td><td>−11 025</td></tr>
              <tr className="sk-pl-l1 sk-pl-neg"><td>Accounting & Audit</td><td>−6 734</td></tr>
              <tr className="sk-pl-l1 sk-pl-neg"><td>Autres frais</td><td>−958</td></tr>

              <tr className="sk-pl-l0"><td>Total charges de structure</td><td style={{ color: 'var(--sk-blu)', fontWeight: 700 }}>−427 891</td></tr>
              <tr className="sk-pl-hl sk-pl-l0 sk-pl-pos"><td>Résultat opérationnel</td><td>+984 821</td></tr>

              <tr className="sk-pl-sec"><td colSpan={2}>HORS EXPLOITATION</td></tr>
              <tr className="sk-pl-l1"><td>Gain / Perte de change</td><td style={{ color: 'var(--sk-amb)' }}>+26 813</td></tr>

              <tr className="sk-pl-l0 sk-pl-pos sk-pl-hl-grn"><td style={{ fontSize: 14 }}>RÉSULTAT NET</td><td style={{ fontSize: 14, color: 'var(--sk-grn)', fontWeight: 800 }}>+1 011 634</td></tr>
              <tr className="sk-pl-l2"><td style={{ color: 'var(--sk-t3)' }}>≈ USD 275K · ≈ EUR 253K</td><td style={{ color: 'var(--sk-t3)' }}>marge 15,4%</td></tr>
            </tbody>
          </table>
        </div>

        <div className="sk-gap">
          <div className="sk-card">
            <div className="sk-card-header">
              <div className="sk-card-title"><span className="sk-dot dp" />Marges successives</div>
            </div>
            <Bar data={margesData} options={{ ...chartOptions(), scales: { ...chartOptions().scales, y: { ...chartOptions().scales.y, max: 110, ticks: { callback: (v: number | string) => v + '%', font: { size: 10 } } } } }} />
          </div>
          <div className="sk-card">
            <div className="sk-card-header">
              <div className="sk-card-title"><span className="sk-dot dd" />Ratios clés</div>
            </div>
            <div className="sk-sr"><div className="sk-sr-label">COGS économique / CA</div><div className="sk-sr-value cr">74,3%</div></div>
            <div className="sk-sr"><div className="sk-sr-label">Marge directe (après DIFC + assurance)</div><div className="sk-sr-value cp">21,5%</div></div>
            <div className="sk-sr"><div className="sk-sr-label">Coûts de structure / CA</div><div className="sk-sr-value cb">6,5%</div></div>
            <div className="sk-sr"><div className="sk-sr-label">Marge opérationnelle</div><div className="sk-sr-value cg">15,0%</div></div>
            <div className="sk-sr"><div className="sk-sr-label">Marge nette</div><div className="sk-sr-value cg">15,4%</div></div>
            <div className="sk-sr"><div className="sk-sr-label">FX gain (exceptionnel)</div><div className="sk-sr-value ca">+0,4%</div></div>
            <div className="sk-notice np" style={{ marginTop: 12 }}>La marge directe de <strong>21,5%</strong> est le KPI central. Elle couvre confortablement la structure (6,5%), laissant 15% de résultat net.</div>
          </div>
          <div className="sk-card">
            <div className="sk-card-header">
              <div className="sk-card-title"><span className="sk-dot da" />Note : FX gain vs perte</div>
            </div>
            <div className="sk-notice na">Le P&L indique <strong>"Échangez un gain ou une perte : −26 813 AED"</strong>. Ce montant négatif en "Non Operating Expense" est comptabilisé en déduction, ce qui <strong>augmente</strong> le résultat net. Il s'agit donc d'un <strong>gain de change net de +26 813 AED</strong>.</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCosts = () => (
    <div key="costs">
      <div className="mb-5">
        <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--sk-tx)' }}>Structure des Coûts</h1>
        <p style={{ fontSize: 10, color: 'var(--sk-t3)', fontFamily: "'DM Mono', monospace", marginTop: 3 }}>DÉCOMPOSITION PAR NATURE · COGS vs STRUCTURE · FY 2025 · AED</p>
      </div>

      <div className="sk-kpi-grid k4">
        <div className="sk-kpi cr"><div className="sk-kpi-label">COGS direct (portés)</div><div className="sk-kpi-value cr">4,87M <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div><div className="sk-kpi-meta">External Sal. + Consultant Exp.</div></div>
        <div className="sk-kpi cr"><div className="sk-kpi-label">Coûts DIFC + Assurance</div><div className="sk-kpi-value cr">274K <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div><div className="sk-kpi-meta">4,2% du CA</div></div>
        <div className="sk-kpi cb"><div className="sk-kpi-label">Coûts de structure</div><div className="sk-kpi-value cb">428K <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div><div className="sk-kpi-meta">6,5% du CA</div></div>
        <div className="sk-kpi cp"><div className="sk-kpi-label">Marge directe</div><div className="sk-kpi-value cp">1,41M <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div><div className="sk-kpi-meta">21,5% du CA</div></div>
      </div>

      <div className="sk-g2" style={{ marginTop: 14 }}>
        <div className="sk-card">
          <div className="sk-card-header">
            <div className="sk-card-title"><span className="sk-dot dr" />Détail des charges par poste</div>
            <div className="sk-card-sub">classé par montant</div>
          </div>

          <div className="sk-section-label">COGS ÉCONOMIQUE (coûts directs variables)</div>
          {COST_BREAKDOWN.cogs.map((item, i) => (
            <div className="sk-ib" key={i}>
              <span className="sk-tag tv" style={{ width: 60, justifyContent: 'center' }}>{item.tag}</span>
              <div className="sk-ib-label">{item.label}</div>
              <div className="sk-ib-track"><div className="sk-ib-fill" style={{ width: `${(item.value / 3046591) * 100}%`, background: 'var(--sk-red)' }} /></div>
              <div className="sk-ib-value">{fmtFull(item.value)}</div>
              <div className="sk-ib-pct">{item.percent}%</div>
            </div>
          ))}

          <div className="sk-section-label" style={{ marginTop: 12, paddingTop: 6, borderTop: '1px solid var(--sk-bg2)' }}>COÛTS DIRECTS DIFC</div>
          {COST_BREAKDOWN.difc.map((item, i) => (
            <div className="sk-ib" key={i}>
              <span className="sk-tag tm" style={{ width: 60, justifyContent: 'center' }}>{item.tag}</span>
              <div className="sk-ib-label">{item.label}</div>
              <div className="sk-ib-track"><div className="sk-ib-fill" style={{ width: `${(item.value / 3046591) * 100}%`, background: 'var(--sk-amb)' }} /></div>
              <div className="sk-ib-value">{fmtFull(item.value)}</div>
              <div className="sk-ib-pct">{item.percent}%</div>
            </div>
          ))}

          <div className="sk-section-label" style={{ marginTop: 12, paddingTop: 6, borderTop: '1px solid var(--sk-bg2)' }}>COÛTS DE STRUCTURE (fixes)</div>
          {COST_BREAKDOWN.structure.map((item, i) => (
            <div className="sk-ib" key={i}>
              <span className="sk-tag tf" style={{ width: 60, justifyContent: 'center' }}>{item.tag}</span>
              <div className="sk-ib-label">{item.label}</div>
              <div className="sk-ib-track"><div className="sk-ib-fill" style={{ width: `${(item.value / 3046591) * 100}%`, background: 'var(--sk-blu)' }} /></div>
              <div className="sk-ib-value">{fmtFull(item.value)}</div>
              <div className="sk-ib-pct">{item.percent}%</div>
            </div>
          ))}

          <hr className="sk-hr" />
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', paddingTop: 4 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--sk-t3)', fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>COGS TOTAL</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--sk-red)', fontFamily: "'DM Mono', monospace" }}>4 874 880 AED</div>
              <div style={{ fontSize: 10, color: 'var(--sk-t3)' }}>74,3% du CA</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--sk-t3)', fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>DIFC + ASSURANCE</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--sk-amb)', fontFamily: "'DM Mono', monospace" }}>273 896 AED</div>
              <div style={{ fontSize: 10, color: 'var(--sk-t3)' }}>4,2% du CA</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--sk-t3)', fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>STRUCTURE</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--sk-blu)', fontFamily: "'DM Mono', monospace" }}>427 891 AED</div>
              <div style={{ fontSize: 10, color: 'var(--sk-t3)' }}>6,5% du CA</div>
            </div>
          </div>
        </div>

        <div className="sk-gap">
          <div className="sk-card">
            <div className="sk-card-header">
              <div className="sk-card-title"><span className="sk-dot dd" />Répartition graphique des charges</div>
            </div>
            <Doughnut data={costDonutData} options={donutOptions} />
          </div>
          <div className="sk-card">
            <div className="sk-card-header">
              <div className="sk-card-title"><span className="sk-dot dp" />Pour 100 AED de CA</div>
            </div>
            <div className="sk-retr" style={{ marginBottom: 0 }}>
              {COST_BREAKDOWN.per100AED.map((item, i) => (
                item.isTotal ? (
                  <div className="sk-retr-total" key={i}>
                    <span style={{ fontWeight: 700, color: 'var(--sk-pur)' }}>{item.label}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 800, color: 'var(--sk-pur)' }}>{item.value} AED</span>
                  </div>
                ) : (
                  <div className="sk-retr-row" key={i}>
                    <span style={{ color: 'var(--sk-t2)' }}>{item.label}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: item.color === 'red' ? 'var(--sk-red)' : item.color === 'amber' ? 'var(--sk-amb)' : 'var(--sk-blu)' }}>{item.value} AED</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConsultants = () => (
    <div key="cons">
      <div className="mb-5">
        <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--sk-tx)' }}>Analyse Consultants</h1>
        <p style={{ fontSize: 10, color: 'var(--sk-t3)', fontFamily: "'DM Mono', monospace", marginTop: 3 }}>SALES BY ITEM · 16 CONSULTANTS · 126 FACTURES · FY 2025</p>
      </div>

      <div className="sk-kpi-grid k4">
        <div className="sk-kpi cr"><div className="sk-kpi-label">CA ventilé total</div><div className="sk-kpi-value cr">5,25M <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div><div className="sk-kpi-meta">hors avoirs</div></div>
        <div className="sk-kpi cd"><div className="sk-kpi-label">Factures émises</div><div className="sk-kpi-value cd">126</div><div className="sk-kpi-meta">moy. 7,9 / consultant</div></div>
        <div className="sk-kpi cg"><div className="sk-kpi-label">Top consultant</div><div className="sk-kpi-value cg">547K <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div><div className="sk-kpi-meta">BENHARI Morad</div></div>
        <div className="sk-kpi ca"><div className="sk-kpi-label">Avoirs / annulations</div><div className="sk-kpi-value ca">224K <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div><div className="sk-kpi-meta">4,1% du CA brut</div></div>
      </div>

      <div className="sk-g4060" style={{ marginTop: 14 }}>
        <div className="sk-gap">
          <div className="sk-card">
            <div className="sk-card-header"><div className="sk-card-title"><span className="sk-dot dd" />Statistiques</div></div>
            <div className="sk-sr"><div className="sk-sr-label">Consultants actifs identifiés</div><div className="sk-sr-value">16</div></div>
            <div className="sk-sr"><div className="sk-sr-label">CA moyen / consultant / an</div><div className="sk-sr-value">327 879 AED</div></div>
            <div className="sk-sr"><div className="sk-sr-label">COGS moyen estimé / consultant</div><div className="sk-sr-value cr">~304 680 AED</div></div>
            <div className="sk-sr"><div className="sk-sr-label">Marge directe moy. / consultant</div><div className="sk-sr-value cp">~88 200 AED</div></div>
            <div className="sk-sr"><div className="sk-sr-label">Top 3 / CA total ventilé</div><div className="sk-sr-value cr">27,4%</div></div>
            <div className="sk-sr"><div className="sk-sr-label">Avoirs / CA brut</div><div className="sk-sr-value ca">4,1%</div></div>
            <div className="sk-notice np" style={{ marginTop: 12 }}>La marge directe moyenne par consultant (~88K AED/an) correspond au ratio de 21,5% appliqué au CA moyen de 328K.</div>
          </div>
          <div className="sk-card">
            <div className="sk-card-header"><div className="sk-card-title"><span className="sk-dot dr" />Distribution CA par consultant</div></div>
            <Bar data={consultantBarData} options={chartOptions(false)} />
          </div>
        </div>
        <div className="sk-card">
          <div className="sk-card-header"><div className="sk-card-title"><span className="sk-dot dr" />Détail par consultant</div><div className="sk-card-sub">AED · FY 2025</div></div>
          <table className="sk-table">
            <thead><tr><th>Consultant</th><th className="r">Fact.</th><th className="r">CA (AED)</th><th className="r">Moy./fact.</th><th>Tier</th></tr></thead>
            <tbody>
              {CONSULTANTS.map((c, i) => (
                <tr key={i}>
                  <td className="nm">{c.name}</td>
                  <td className="mn r">{c.invoices}</td>
                  <td className={`r ${c.tier === 'HIGH' ? 'pos' : c.tier === 'LOW' ? 'neg' : 'mn'}`}>{fmtFull(c.ca)}</td>
                  <td className="mn r">{fmtFull(c.avg)}</td>
                  <td><span className={`sk-tier ${c.tier === 'HIGH' ? 'th' : c.tier === 'MID' ? 'tmi' : 'tlo'}`}>{c.tier}</span></td>
                </tr>
              ))}
              <tr style={{ color: 'var(--sk-red)' }}>
                <td className="nm" style={{ color: 'var(--sk-red)' }}>Avoirs / annulations</td>
                <td className="mn r neg">−6</td>
                <td className="neg r">−223 796</td>
                <td className="mn r neg">—</td>
                <td><span className="sk-tier tlo">AVOIR</span></td>
              </tr>
              <tr className="tot">
                <td className="nm">TOTAL</td>
                <td className="r">126</td>
                <td className="r">5 246 060</td>
                <td className="r">41 636</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTreasury = () => (
    <div key="treas">
      <div className="mb-5">
        <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--sk-tx)' }}>Trésorerie & Banque</h1>
        <p style={{ fontSize: 10, color: 'var(--sk-t3)', fontFamily: "'DM Mono', monospace", marginTop: 3 }}>BILAN TRÉSORERIE · TRANSACTIONS NON CATÉGORISÉES · FY 2025</p>
      </div>

      <div className="sk-kpi-grid k4">
        <div className="sk-kpi cd"><div className="sk-kpi-label">HSBC AED</div><div className="sk-kpi-value cd">287K <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div><div className="sk-kpi-meta">solde 31/12/2025</div></div>
        <div className="sk-kpi cr"><div className="sk-kpi-label">HSBC EUR</div><div className="sk-kpi-value cr">−148K <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div><div className="sk-kpi-meta">solde négatif ⚠</div><div className="sk-kpi-badge bw">⚠</div></div>
        <div className="sk-kpi cg"><div className="sk-kpi-label">SG AED</div><div className="sk-kpi-value cg">117K <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div><div className="sk-kpi-meta">solde 31/12/2025</div></div>
        <div className="sk-kpi ca"><div className="sk-kpi-label">SG EUR</div><div className="sk-kpi-value ca">−1K <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div><div className="sk-kpi-meta">quasi-neutre</div></div>
      </div>

      <div className="sk-g2" style={{ marginTop: 14 }}>
        <div className="sk-card">
          <div className="sk-card-header"><div className="sk-card-title"><span className="sk-dot dr" />HSBC AED — non catégorisées</div><div className="sk-card-sub">AED</div></div>
          <table className="sk-table">
            <thead><tr><th>Date</th><th>Description</th><th className="r">Montant</th><th>Catégorie</th></tr></thead>
            <tbody>
              {TREASURY.hsbcAed.map((t, i) => (
                <tr key={i}><td className="mn">{t.date}</td><td>{t.desc}</td><td className="neg r">{fmtFull(t.amount)}</td><td><span className={`sk-tag ${t.cat === 'EXT. SALARY' ? 'tv' : 'tm'}`}>{t.cat}</span></td></tr>
              ))}
            </tbody>
          </table>
          <div className="sk-notice na" style={{ marginTop: 12 }}>
            <strong>INESAMI L.L.C-FZ</strong> : ces paiements correspondent vraisemblablement à l'External Salary (COGS direct). Total visible : <strong>224 586 AED</strong>.
          </div>
        </div>
        <div className="sk-gap">
          <div className="sk-card">
            <div className="sk-card-header"><div className="sk-card-title"><span className="sk-dot dg" />HSBC EUR — non catégorisées</div><div className="sk-card-sub">EUR</div></div>
            <table className="sk-table">
              <thead><tr><th>Date</th><th>Description</th><th className="r">Montant</th><th>Catégorie</th></tr></thead>
              <tbody>
                {TREASURY.hsbcEur.map((t, i) => (
                  <tr key={i}><td className="mn">{t.date}</td><td style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</td><td className={`r ${t.amount >= 0 ? 'pos' : 'neg'}`}>{t.amount >= 0 ? '+' : ''}{fmtFull(t.amount)} €</td><td><span className={`sk-tag ${t.cat === 'REVENU' ? 'trev' : t.cat === 'INTRA-GROUPE' ? 'trev' : t.cat === 'INT. SALARY' ? 'tf' : 'tuk'}`}>{t.cat}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sk-card">
            <div className="sk-card-header"><div className="sk-card-title"><span className="sk-dot dd" />SG EUR — non catégorisées</div><div className="sk-card-sub">EUR</div></div>
            <table className="sk-table">
              <thead><tr><th>Date</th><th>Description</th><th className="r">Montant</th><th>Catégorie</th></tr></thead>
              <tbody>
                {TREASURY.sgEur.map((t, i) => (
                  <tr key={i}><td className="mn">{t.date}</td><td>{t.desc}</td><td className={`r ${t.amount >= 0 ? 'pos' : 'neg'}`}>{t.amount >= 0 ? '+' : ''}{fmtFull(t.amount)} €</td><td><span className={`sk-tag ${t.cat === 'INTRA-GROUPE' || t.cat === 'REVENU' ? 'trev' : t.cat === 'EXT. SALARY' ? 'tv' : 'tf'}`}>{t.cat}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBreakEven = () => (
    <div key="be">
      <div className="mb-5">
        <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--sk-tx)' }}>Break-Even</h1>
        <p style={{ fontSize: 10, color: 'var(--sk-t3)', fontFamily: "'DM Mono', monospace", marginTop: 3 }}>SEUIL DE RENTABILITÉ · BASÉ SUR LA MARGE DIRECTE · FY 2025</p>
      </div>

      <div className="sk-kpi-grid k3">
        <div className="sk-kpi cp"><div className="sk-kpi-label">Marge directe / consultant (moy.)</div><div className="sk-kpi-value cp">88K <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div><div className="sk-kpi-meta">CA moy. × 21,5%</div></div>
        <div className="sk-kpi cb"><div className="sk-kpi-label">Coûts de structure totaux</div><div className="sk-kpi-value cb">428K <span style={{ fontSize: 12, color: 'var(--sk-t3)' }}>AED</span></div><div className="sk-kpi-meta">Internal Sal. + frais généraux</div></div>
        <div className="sk-kpi cg"><div className="sk-kpi-label">Break-even (nb portés)</div><div className="sk-kpi-value cg">≈ 5</div><div className="sk-kpi-meta">structure très légère</div><div className="sk-kpi-badge bu">16 actifs → +228%</div></div>
      </div>

      <div className="sk-notice np" style={{ marginBottom: 14 }}>
        <strong>Logique break-even retraitée :</strong> Le break-even basé sur la marge directe est atteint avec seulement <strong>~5 consultants</strong>, ce qui positionne la filiale avec une marge de sécurité très confortable.
      </div>

      <div className="sk-g2">
        <div className="sk-card">
          <div className="sk-card-header"><div className="sk-card-title"><span className="sk-dot dr" />Courbe Break-Even</div></div>
          <Bar data={breakEvenData} options={chartOptions()} />
        </div>
        <div className="sk-card">
          <div className="sk-card-header"><div className="sk-card-title"><span className="sk-dot dd" />Résultat simulé par nb de portés</div></div>
          <Bar data={projectionData} options={chartOptions()} />
        </div>
      </div>

      <div className="sk-g2" style={{ marginTop: 14 }}>
        <div className="sk-card">
          <div className="sk-card-header"><div className="sk-card-title"><span className="sk-dot dp" />Hypothèses / consultant</div></div>
          {BREAK_EVEN.hypotheses.map((h, i) => (
            <div className="sk-sr" key={i}>
              <div className="sk-sr-label">{h.label}</div>
              <div className={`sk-sr-value ${h.color === 'red' ? 'cr' : h.color === 'amber' ? 'ca' : h.color === 'purple' ? 'cp' : 'cb'}`}>{h.value}</div>
            </div>
          ))}
          <hr className="sk-hr" />
          <div className="sk-sr"><div className="sk-sr-label" style={{ fontWeight: 700 }}>Résultat net / consultant / an</div><div className="sk-sr-value cg">{BREAK_EVEN.resultatNetConsultant}</div></div>
          <div className="sk-sr"><div className="sk-sr-label">≈ EUR</div><div className="sk-sr-value">≈ 10 900 EUR</div></div>
          <div className="sk-notice ng" style={{ marginTop: 12 }}>La rentabilité par consultant est élevée grâce à une structure interne très légère (Internal Salary de 260K vs 648K précédemment).</div>
        </div>
        <div className="sk-card">
          <div className="sk-card-header"><div className="sk-card-title"><span className="sk-dot da" />Coûts de structure (428K AED)</div></div>
          {BREAK_EVEN.structureDetail.map((item, i) => (
            <div className="sk-ib" key={i}>
              <div className="sk-ib-label">{item.label}</div>
              <div className="sk-ib-track"><div className="sk-ib-fill" style={{ width: `${item.percent}%`, background: 'var(--sk-blu)' }} /></div>
              <div className="sk-ib-value">{fmtFull(item.value)}</div>
              <div className="sk-ib-pct">{item.percent}%</div>
            </div>
          ))}
          <div className="sk-notice nb" style={{ marginTop: 12 }}>La structure interne est très légère : l'Internal Salary (1 salarié en biz dev) représente 60% des coûts fixes. C'est un modèle asset-light idéal pour scaler.</div>
        </div>
      </div>
    </div>
  );

  const renderInsights = () => (
    <div key="ins">
      <div className="mb-5">
        <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--sk-tx)' }}>Observations préliminaires</h1>
        <p style={{ fontSize: 10, color: 'var(--sk-t3)', fontFamily: "'DM Mono', monospace", marginTop: 3 }}>LECTURE GÉNÉRALE · DONNÉES INCOMPLÈTES · À REVALIDER</p>
      </div>

      <div className="sk-alert-banner">
        <div style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>⚠️</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sk-amb)', marginBottom: 6 }}>ANALYSE PRÉLIMINAIRE — DONNÉES ENCORE INCOMPLÈTES</div>
          <div style={{ fontSize: 12, color: 'var(--sk-t2)', lineHeight: 1.75 }}>
            La comptabilité 2025 n'est pas encore finalisée. Les <strong>relevés de compte courant de novembre et décembre</strong> ne sont pas disponibles. Les observations ci-dessous sont volontairement générales et ne constituent <strong>en aucun cas des conclusions définitives</strong>.
          </div>
        </div>
      </div>

      <div className="sk-insights-grid">
        {INSIGHTS.map((ins, i) => (
          <div className={`sk-insight-card ${ins.type === 'amber' ? 'ia' : 'ib'}`} key={i}>
            <div className="sk-insight-title">{ins.title}</div>
            <div className="sk-insight-text">{ins.text}</div>
          </div>
        ))}
      </div>

      <div className="sk-card" style={{ marginTop: 16 }}>
        <div className="sk-card-header"><div className="sk-card-title"><span className="sk-dot da" />Éléments nécessaires pour finaliser l'analyse</div><div className="sk-card-sub">EN ATTENTE</div></div>
        <table className="sk-table">
          <thead><tr><th>#</th><th>Élément attendu</th><th>De la part de</th><th>Pourquoi</th><th>Statut</th></tr></thead>
          <tbody>
            {MISSING_ELEMENTS.map((el, i) => (
              <tr key={i}>
                <td className="mn">{el.id}</td>
                <td className="nm">{el.label}</td>
                <td>{el.from}</td>
                <td>{el.reason}</td>
                <td><span className={`sk-tag ${el.status === 'MANQUANT' ? 'tv' : 'tm'}`}>{el.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (activePage) {
      case 'overview': return renderOverview();
      case 'pl': return renderPL();
      case 'costs': return renderCosts();
      case 'cons': return renderConsultants();
      case 'treas': return renderTreasury();
      case 'be': return renderBreakEven();
      case 'ins': return renderInsights();
      default: return renderOverview();
    }
  };

  return (
    <div className="skalis-dash" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav className={`sk-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sk-sidebar-logo">
          <img src={skalisLogo} alt="Skalis" style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 4 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--sk-tx)' }}>SKALIS</div>
            <div style={{ fontSize: 9, color: 'var(--sk-t3)', fontFamily: "'DM Mono', monospace", marginTop: 1 }}>DUBAI · DIFC</div>
          </div>
        </div>
        <div style={{ padding: '12px 0 4px' }}>
          <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: 'var(--sk-t3)', textTransform: 'uppercase', letterSpacing: '.14em', padding: '0 16px', marginBottom: 3 }}>TABLEAU DE BORD</div>
          {NAV_ITEMS.filter(n => !n.section).map(item => (
            <div
              key={item.id}
              className={`sk-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => { setActivePage(item.id); setSidebarOpen(false); }}
            >
              <span style={{ fontSize: 14, width: 17, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 0 4px' }}>
          <div style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: 'var(--sk-t3)', textTransform: 'uppercase', letterSpacing: '.14em', padding: '0 16px', marginBottom: 3 }}>ADVISORY</div>
          {NAV_ITEMS.filter(n => n.section === 'ADVISORY').map(item => (
            <div
              key={item.id}
              className={`sk-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => { setActivePage(item.id); setSidebarOpen(false); }}
            >
              <span style={{ fontSize: 14, width: 17, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid var(--sk-bdr)' }}>
          <div className="sk-draft">DRAFT v1.1</div>
          <div style={{ fontSize: 10, color: 'var(--sk-t3)', marginTop: 5, fontFamily: "'DM Mono', monospace", lineHeight: 1.7 }}>
            Produit par<br /><strong style={{ color: 'var(--sk-tx)' }}>Daftime Advisory</strong><br />Mars 2026
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="sk-main">
        <div className="sk-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
            <button
              className="sk-mobile-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <Menu size={18} />
            </button>
            <button
              onClick={() => ((window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/'))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--sk-t3)' }}
            >
              <ArrowLeft size={16} />
            </button>
            <span style={{ color: 'var(--sk-t3)', fontWeight: 500 }}>Skalis Dubai</span>
            <span style={{ color: '#c8cdd8' }}>/</span>
            <span style={{ color: 'var(--sk-tx)', fontWeight: 600 }}>{activeLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="sk-chip cp">FY 2025</span>
            <span className="sk-chip cb">Daftime Advisory</span>
          </div>
        </div>
        <div className="sk-content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkalis;
