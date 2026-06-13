import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, CheckCircle, XCircle, Clock, TrendingUp,
  TrendingDown, ArrowUpRight, Activity, Zap, DollarSign, RefreshCw,
  ChevronRight, Filter
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from 'recharts';
import { getDashboard } from '../api';

/* ── Custom Tooltip ──────────────────────────────────────────── */
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-aegis-dark text-white text-xs rounded-xl px-3 py-2 shadow-xl border border-white/10">
      {label && <p className="text-white/50 mb-1 font-medium">{label}</p>}
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || '#94B5E3' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

/* ── Verdict chip ────────────────────────────────────────────── */
function VChip({ verdict }) {
  const map = {
    APPROVE:  { cls: 'chip-approve',  dot: '#22C55E', label: 'Approved' },
    REJECT:   { cls: 'chip-reject',   dot: '#B26552', label: 'Rejected' },
    ESCALATE: { cls: 'chip-escalate', dot: '#D97706', label: 'Escalated' },
  };
  const cfg = map[verdict] || map.ESCALATE;
  return (
    <span className={cfg.cls}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

/* ── KPI card ────────────────────────────────────────────────── */
function KPI({ label, value, sub, icon: Icon, accent, trend, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="kpi-tile card-lift"
      data-testid={`kpi-${label.toLowerCase().replace(/\s+/g,'-')}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}15` }}>
          <Icon className="w-4.5 h-4.5" style={{ color: accent }} />
        </div>
        {trend != null && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-aegis-dark font-mono tracking-tight">{value}</div>
      <div className="text-xs font-semibold text-aegis-text mt-0.5">{label}</div>
      {sub && <div className="text-xs text-aegis-muted mt-0.5">{sub}</div>}
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('7d');

  useEffect(() => {
    getDashboard().then(setData).catch(()=>{}).finally(()=>setLoading(false));
    const iv = setInterval(()=>getDashboard().then(setData).catch(()=>{}), 30000);
    return ()=>clearInterval(iv);
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-3 text-aegis-muted">
        <div className="w-5 h-5 border-2 border-aegis-blue border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading dashboard…</span>
      </div>
    </div>
  );

  const t = data?.totals   || {};
  const lat = data?.latency  || {};
  const cost = data?.cost    || {};
  const audits = data?.recent_audits || [];
  const series = data?.latency_series || [];

  /* Pie data */
  const pieData = [
    { name: 'Approved',  value: t.approve  || 0, color: '#22C55E' },
    { name: 'Rejected',  value: t.reject   || 0, color: '#B26552' },
    { name: 'Escalated', value: t.escalate || 0, color: '#D97706' },
  ].filter(d=>d.value>0);

  /* Area data (last 20 entries reversed for chronological) */
  const areaData = series.slice(-20).map((s,i)=>({
    time: s.time?.slice(-5) || `T-${series.length-i}`,
    ms: s.latency_ms || 0,
  }));

  /* Cost bar */
  const costData = Object.entries(cost.by_model||{}).map(([m,c])=>({
    model: m.replace('claude-','C·').replace('gpt-','G·').slice(0,18),
    cost: parseFloat((c*1000).toFixed(3)),
  }));

  return (
    <div className="flex-1 flex flex-col bg-aegis-bg min-h-screen">
      {/* ── Top Header ── */}
      <div className="h-16 flex items-center justify-between px-8 bg-white border-b border-aegis-border sticky top-0 z-20">
        <div>
          <h1 className="text-lg font-bold text-aegis-dark">Analytics Dashboard</h1>
          <p className="text-xs text-aegis-muted">Medical image verification insights</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period filter */}
          <div className="flex items-center gap-1 bg-aegis-bg rounded-xl p-1 border border-aegis-border">
            {['24h','7d','30d'].map(p=>(
              <button key={p} onClick={()=>setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period===p ? 'bg-white text-aegis-blue shadow-sm' : 'text-aegis-muted hover:text-aegis-dark'
                }`}
                data-testid={`period-${p}`}
              >{p}</button>
            ))}
          </div>
          <button className="btn-blue" onClick={()=>navigate('/verify')} data-testid="dash-verify-btn">
            <Zap className="w-3.5 h-3.5" /> Verify Image
          </button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KPI label="Total Verifications" value={t.total||0} sub="All time"
            icon={BarChart3} accent="#1B47DB" trend={12} delay={0} />
          <KPI label="Approved" value={t.approve||0}
            sub={`${t.total ? Math.round(t.approve/t.total*100):0}% approval rate`}
            icon={CheckCircle} accent="#22C55E" trend={5} delay={0.05} />
          <KPI label="Rejected" value={t.reject||0} sub="Fraud detected"
            icon={XCircle} accent="#B26552" trend={-3} delay={0.1} />
          <KPI label="Avg Latency" value={`${lat.avg_ms||0}ms`}
            sub={`P95: ${lat.p95_ms||0}ms`}
            icon={Clock} accent="#6997E4" delay={0.15} />
        </div>

        {/* ── Savings Banner ── */}
        <motion.div
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="card p-5 flex items-center justify-between gap-4 flex-wrap"
          style={{ background: 'linear-gradient(135deg, #EEF3FF, #F2F4F8)' }}
          data-testid="savings-banner"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl gradient-blue flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-aegis-muted mb-0.5">IronLabs Smart Routing</div>
              <div className="text-2xl font-bold text-aegis-dark">
                <span className="text-blue-gradient">{cost.saved_percent||68.6}%</span> cost saved vs all-top-tier
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-aegis-muted">Total spent</div>
              <div className="text-lg font-bold text-aegis-dark font-mono">${(cost.total_usd||0).toFixed(3)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-aegis-muted">Saved</div>
              <div className="text-lg font-bold text-green-600 font-mono">+${(cost.saved_vs_top_tier_usd||0).toFixed(3)}</div>
            </div>
            <button onClick={()=>navigate('/billing')} className="btn-ghost text-xs" data-testid="upgrade-btn">
              Upgrade Plan <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Area Chart — Latency trend (spans 2 cols) */}
          <motion.div
            initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
            className="card p-6 xl:col-span-2"
            data-testid="latency-area-chart"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-sm font-bold text-aegis-dark">Pipeline Latency</div>
                <div className="text-xs text-aegis-muted">ms per verification</div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-aegis-blue bg-aegis-blueLight px-3 py-1.5 rounded-lg">
                <Activity className="w-3 h-3" /> Live
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#1B47DB" stopOpacity={0.25}/>
                    <stop offset="100%" stopColor="#1B47DB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#E8EDF5" />
                <XAxis dataKey="time" tick={{ fontSize:10, fill:'#9B9B9B' }} />
                <YAxis tick={{ fontSize:10, fill:'#9B9B9B' }} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="ms" stroke="#1B47DB" strokeWidth={2.5}
                  fill="url(#blueGrad)" name="Latency (ms)" dot={false} activeDot={{ r:4, fill:'#1B47DB' }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Verdict Pie */}
          <motion.div
            initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
            className="card p-6"
            data-testid="verdict-pie"
          >
            <div className="text-sm font-bold text-aegis-dark mb-1">Verdict Split</div>
            <div className="text-xs text-aegis-muted mb-4">All verifications</div>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                      dataKey="value" paddingAngle={3}>
                      {pieData.map(e=><Cell key={e.name} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<Tip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {pieData.map(e=>(
                    <div key={e.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background:e.color }} />
                        <span className="text-aegis-muted">{e.name}</span>
                      </div>
                      <span className="font-bold text-aegis-dark font-mono">{e.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-40 flex items-center justify-center text-aegis-muted text-sm">No data yet</div>
            )}
          </motion.div>
        </div>

        {/* ── Cost by Model ── */}
        {costData.length > 0 && (
          <motion.div
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
            className="card p-6"
            data-testid="cost-bar-chart"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-sm font-bold text-aegis-dark">Cost by Model</div>
                <div className="text-xs text-aegis-muted">Milli-dollars per 1k tokens</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={costData} margin={{ top:4, right:4, left:-20, bottom:20 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#E8EDF5" vertical={false} />
                <XAxis dataKey="model" tick={{ fontSize:9, fill:'#9B9B9B' }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize:10, fill:'#9B9B9B' }} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="cost" name="Cost (m$)" radius={[6,6,0,0]}>
                  {costData.map((_,i)=><Cell key={i} fill={i%2===0?'#1B47DB':'#6997E4'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* ── Audit Table ── */}
        <motion.div
          initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          className="card overflow-hidden"
          data-testid="audit-table"
        >
          <div className="px-6 py-4 border-b border-aegis-border flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-aegis-dark">Recent Verifications</div>
              <div className="text-xs text-aegis-muted">{audits.length} records</div>
            </div>
            <button className="btn-ghost text-xs"><Filter className="w-3 h-3" />Filter</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-aegis-bg/60">
                  {['Audit ID','Modality','Verdict','Confidence','Latency','Cost','Timestamp'].map(h=>(
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-aegis-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-aegis-border">
                {audits.slice(0,15).map((r,i)=>(
                  <tr key={r.audit_id}
                    className="hover:bg-aegis-blueLight/30 cursor-pointer transition-colors group"
                    onClick={()=>navigate(`/audit/${r.audit_id}`)}
                    data-testid={`audit-row-${i}`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-aegis-blue font-semibold group-hover:underline">{r.audit_id?.slice(-14)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold uppercase text-aegis-muted bg-aegis-bg px-2 py-0.5 rounded-md">{r.modality}</span>
                    </td>
                    <td className="px-5 py-3.5"><VChip verdict={r.verdict}/></td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-aegis-dark">{Math.round((r.confidence||0)*100)}%</td>
                    <td className="px-5 py-3.5 text-xs text-aegis-muted font-mono">{r.total_latency_ms}ms</td>
                    <td className="px-5 py-3.5 text-xs text-aegis-muted font-mono">${(r.total_cost_usd||0).toFixed(4)}</td>
                    <td className="px-5 py-3.5 text-xs text-aegis-muted">{r.created_at?.slice(0,16)?.replace('T',' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {audits.length === 0 && (
              <div className="py-16 text-center">
                <BarChart3 className="w-8 h-8 text-aegis-border mx-auto mb-3" />
                <p className="text-sm text-aegis-muted">No verifications yet</p>
                <button onClick={()=>navigate('/verify')} className="btn-blue mt-4 mx-auto">Verify Your First Image</button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
