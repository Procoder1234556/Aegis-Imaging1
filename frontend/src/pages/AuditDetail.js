import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ArrowLeft, FileSearch, Eye, Stethoscope, Gavel, Shield } from 'lucide-react';
import { getAudit } from '../api';
import VerdictBadge from '../components/VerdictBadge';
import HashChain from '../components/HashChain';

const AGENT_META = {
  intake:    { icon: FileSearch,  label: 'Intake & Metadata',    color: 'text-blue-600' },
  forensics: { icon: Eye,         label: 'Visual Forensics',     color: 'text-purple-600' },
  clinical:  { icon: Stethoscope, label: 'Clinical Plausibility', color: 'text-teal-600' },
  verdict:   { icon: Gavel,       label: 'Verdict Officer',      color: 'text-aegis-navy' },
};

function JsonViewer({ data }) {
  return (
    <pre className="json-viewer text-xs font-mono bg-slate-50 rounded-lg p-4 overflow-auto text-slate-600 leading-relaxed">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function AgentCollapse({ agentKey, data }) {
  const [open, setOpen] = useState(false);
  const meta = AGENT_META[agentKey] || { icon: Shield, label: agentKey, color: 'text-slate-600' };
  const Icon = meta.icon;
  const score = typeof data?.score === 'number' ? Math.round(data.score * 100) : null;

  return (
    <div className="border border-aegis-border rounded-2xl overflow-hidden" data-testid={`agent-collapse-${agentKey}`}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Icon className={`w-4 h-4 ${meta.color}`} />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-slate-700">{meta.label}</div>
            {score !== null && (
              <div className="text-xs text-slate-400">Trust score: {score}%</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {score !== null && (
            <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-aegis-blue"
                style={{ width: `${score}%` }}
              />
            </div>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 border-t border-aegis-border">
              <JsonViewer data={data} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AuditDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAudit(id)
      .then(setRecord)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-aegis-blue border-t-transparent rounded-full animate-spin" />
          Loading audit record...
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Audit record not found</p>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const agentOutputs = record.agent_outputs || {};
  const hashChain = record.hash_chain || {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[calc(100vh-64px)] px-6 py-8"
      style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #EEF4FB 30%, #F8FAFC 100%)' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Back + header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-9 h-9 rounded-xl border border-aegis-border bg-white flex items-center justify-center hover:shadow-md transition-all"
            data-testid="back-to-dashboard-btn"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-aegis-navy">Audit Detail</h1>
            <p className="text-xs font-mono text-slate-500">{record.audit_id}</p>
          </div>
          <div className="ml-auto">
            <VerdictBadge verdict={record.verdict} size="md" />
          </div>
        </div>

        {/* Summary card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-3d p-6 mb-6"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Confidence', value: `${Math.round((record.confidence || 0) * 100)}%` },
              { label: 'Modality', value: (record.modality || 'xray').toUpperCase() },
              { label: 'Latency', value: `${record.total_latency_ms || 0}ms` },
              { label: 'Cost', value: `$${(record.total_cost_usd || 0).toFixed(5)}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs text-slate-400 mb-0.5">{label}</div>
                <div className="text-sm font-bold text-aegis-navy font-mono">{value}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Rationale</div>
            <p className="text-sm text-slate-600 leading-relaxed">{record.rationale || 'No rationale available.'}</p>
          </div>
        </motion.div>

        {/* Hash Chain */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-3d p-6 mb-6"
        >
          <h3 className="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-aegis-navy" />
            Tamper-Evident Hash Chain
          </h3>
          <HashChain
            prevHash={hashChain.prev}
            selfHash={hashChain.self}
            nextHash={null}
          />
          <p className="text-xs text-slate-400 mt-3">
            SHA-256 chain ensures any tampering with this record is cryptographically detectable.
          </p>
        </motion.div>

        {/* Agent JSON breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-3d p-6"
        >
          <h3 className="text-sm font-semibold text-slate-600 mb-4">Agent Output Breakdown</h3>
          <div className="space-y-3" data-testid="agent-outputs">
            {Object.entries(agentOutputs).map(([key, data]) => (
              <AgentCollapse key={key} agentKey={key} data={data} />
            ))}
          </div>
        </motion.div>

        <div className="mt-6 flex gap-3">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary" data-testid="back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    </motion.div>
  );
}
