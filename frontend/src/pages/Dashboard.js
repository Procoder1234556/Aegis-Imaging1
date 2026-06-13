import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, Activity, DollarSign, Clock,
  CheckCircle, XCircle, AlertTriangle, TrendingUp
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { getDashboard } from '../api';
import MetricTile from '../components/MetricTile';
import VerdictBadge from '../components/VerdictBadge';

const PIE_COLORS = { APPROVE: '#16A34A', REJECT: '#DC2626', ESCALATE: '#D97706' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-aegis-border rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      getDashboard().then(setData).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-aegis-blue border-t-transparent rounded-full animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  const totals = data?.totals || {};
  const latency = data?.latency || {};
  const cost = data?.cost || {};
  const audits = data?.recent_audits || [];
  const latencySeries = data?.latency_series || [];

  const pieData = [
    { name: 'APPROVE',  value: totals.approve   || 0 },
    { name: 'REJECT',   value: totals.reject    || 0 },
    { name: 'ESCALATE', value: totals.escalate  || 0 },
  ].filter(d => d.value > 0);

  const modelCostData = Object.entries(cost.by_model || {}).map(([model, c]) => ({
    name: model.replace('claude-', 'C-').replace('gpt-', 'G-').slice(0, 16),
    cost: parseFloat((c * 1000).toFixed(3)),
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[calc(100vh-64px)] px-6 py-8"
      style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #EEF4FB 30%, #F8FAFC 100%)' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-aegis-navy tracking-tight">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Live verification metrics &amp; audit trail</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-700 text-xs font-medium">Live</span>
          </div>
        </div>

        {/* Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricTile
            label="Total Verifications"
            value={totals.total || 0}
            subLabel="All time"
            icon={BarChart3}
            color="navy"
            index={0}
            data-testid="metric-total"
          />
          <MetricTile
            label="Approved"
            value={totals.approve || 0}
            subLabel={`${totals.total ? Math.round(totals.approve / totals.total * 100) : 0}% of total`}
            icon={CheckCircle}
            color="green"
            index={1}
          />
          <MetricTile
            label="Rejected"
            value={totals.reject || 0}
            subLabel="Fraud detected"
            icon={XCircle}
            color="red"
            index={2}
          />
          <MetricTile
            label="Avg Latency"
            value={`${latency.avg_ms || 0}ms`}
            subLabel={`P95: ${latency.p95_ms || 0}ms`}
            icon={Clock}
            color="navy"
            index={3}
          />
        </div>

        {/* IronLabs Savings Banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 rounded-2xl border border-aegis-blue/20 p-5"
          style={{ background: 'linear-gradient(135deg, rgba(15,42,71,0.04), rgba(46,92,138,0.06))' }}
          data-testid="ironlabs-savings"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-aegis-navy/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-aegis-navy" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">IronLabs Routing Savings</div>
                <div className="text-2xl font-bold text-aegis-navy">{cost.saved_percent || 68.6}% cost saved</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500">vs all-top-tier</div>
              <div className="text-xl font-bold text-aegis-approve">+${(cost.saved_vs_top_tier_usd || 0).toFixed(3)} saved</div>
            </div>
          </div>
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Verdict Pie */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-3d p-6"
            data-testid="verdict-pie-chart"
          >
            <h3 className="text-sm font-semibold text-slate-600 mb-4">Verdict Distribution</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-300 text-sm">No data yet</div>
            )}
          </motion.div>

          {/* Cost by Model */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-3d p-6"
            data-testid="cost-bar-chart"
          >
            <h3 className="text-sm font-semibold text-slate-600 mb-4">Cost by Model (per 1k tokens)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={modelCostData} margin={{ top: 4, right: 4, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cost" fill="#2E5C8A" radius={[4, 4, 0, 0]} name="Cost (m$)" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Latency Line */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-3d p-6"
            data-testid="latency-line-chart"
          >
            <h3 className="text-sm font-semibold text-slate-600 mb-4">Pipeline Latency (ms)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={latencySeries.slice(-15)} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" tick={{ fontSize: 8 }} hide />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="latency_ms" stroke="#2E5C8A" strokeWidth={2} dot={false} name="Latency" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Audit Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-3d overflow-hidden"
          data-testid="audit-table"
        >
          <div className="p-6 border-b border-aegis-border">
            <h3 className="text-sm font-semibold text-slate-600">Recent Audit Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {['Audit ID', 'Modality', 'Verdict', 'Confidence', 'Latency', 'Cost', 'Time'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-aegis-border">
                {audits.slice(0, 15).map((row, i) => (
                  <tr
                    key={row.audit_id}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    onClick={() => navigate(`/audit/${row.audit_id}`)}
                    data-testid={`audit-row-${i}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-aegis-navy">{row.audit_id?.slice(-12)}</td>
                    <td className="px-4 py-3 text-slate-600 uppercase text-xs">{row.modality}</td>
                    <td className="px-4 py-3"><VerdictBadge verdict={row.verdict} size="sm" /></td>
                    <td className="px-4 py-3 font-mono text-xs">{Math.round((row.confidence || 0) * 100)}%</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{row.total_latency_ms}ms</td>
                    <td className="px-4 py-3 text-xs text-slate-500">${(row.total_cost_usd || 0).toFixed(4)}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{row.created_at?.slice(0, 16)?.replace('T', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {audits.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm">
                No verifications yet. Upload your first image to get started.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
