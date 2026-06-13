import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ChevronRight, Shield, Clock, DollarSign, Hash } from 'lucide-react';
import VerdictBadge from '../components/VerdictBadge';

export default function Approved() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Loading result...</p>
      </div>
    );
  }

  const confidence = Math.round((result.confidence || 0.9) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[calc(100vh-64px)] px-6 py-10"
      style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #f0fdf4 50%, #F8FAFC 100%)' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Verdict Banner */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="verdict-approve rounded-2xl p-6 mb-8"
          data-testid="verdict-banner-approve"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-aegis-approve" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <VerdictBadge verdict="APPROVE" size="lg" />
                <span className="text-slate-500 text-sm font-mono">#{result.audit_id}</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">{result.rationale}</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Image + Confidence */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 card-3d p-6"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Verification Result</h3>

            {/* Confidence bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-600">Authenticity Confidence</span>
                <span className="text-2xl font-bold text-aegis-approve" data-testid="confidence-score">{confidence}%</span>
              </div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill bg-aegis-approve"
                  initial={{ width: '0%' }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Fake</span>
                <span>Authentic</span>
              </div>
            </div>

            {/* Agent scores */}
            {result.agent_outputs && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Agent Breakdown</h4>
                {Object.entries(result.agent_outputs).map(([name, data]) => {
                  if (!data || typeof data.score !== 'number') return null;
                  const score = Math.round(data.score * 100);
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-28 capitalize">{name}</span>
                      <div className="flex-1 progress-bar">
                        <motion.div
                          className="progress-fill bg-aegis-blue"
                          initial={{ width: '0%' }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 0.8, delay: 0.4 }}
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold text-aegis-navy w-10 text-right">{score}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Right: Meta */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {[
              { icon: Hash, label: 'Audit ID', value: result.audit_id, mono: true },
              { icon: Clock, label: 'Processing', value: `${result.total_latency_ms || 0}ms` },
              { icon: DollarSign, label: 'Cost', value: `$${(result.total_cost_usd || 0).toFixed(4)}` },
              { icon: Shield, label: 'Modality', value: (result.modality || 'xray').toUpperCase() },
            ].map(({ icon: Icon, label, value, mono }) => (
              <div key={label} className="card-3d p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-aegis-navy/8 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-aegis-navy" />
                </div>
                <div>
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className={`text-sm font-semibold text-aegis-navy ${mono ? 'font-mono' : ''} truncate`}>{value}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <button
            onClick={() => navigate(`/processing/${result.audit_id}`, { state: { result } })}
            data-testid="continue-processing-btn"
            className="btn-primary"
          >
            Continue to Processing
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/audit/${result.audit_id}`)}
            className="btn-secondary"
            data-testid="view-audit-btn"
          >
            View Full Audit
          </button>
          <button onClick={() => navigate('/')} className="btn-secondary" data-testid="verify-another-btn">
            Verify Another
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
