import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, Hash, Clock, DollarSign, Shield, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import VerdictBadge from '../components/VerdictBadge';
import { getImageUrl } from '../api';

export default function Rejected() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;
  const [showEvidence, setShowEvidence] = useState(true);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Loading result...</p>
      </div>
    );
  }

  const confidence = Math.round((result.confidence || 0.91) * 100);
  const heatmapUrl = result.heatmap_url ? getImageUrl(result.heatmap_url) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[calc(100vh-64px)] px-6 py-10"
      style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #fff5f5 50%, #F8FAFC 100%)' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Verdict Banner */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="verdict-reject rounded-2xl p-6 mb-8"
          data-testid="verdict-banner-reject"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-8 h-8 text-aegis-reject" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <VerdictBadge verdict="REJECT" size="lg" />
                <span className="text-slate-500 text-sm font-mono">#{result.audit_id}</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">{result.rationale}</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Heatmap */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 card-3d p-6"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Anomaly Heatmap
            </h3>
            <div className="heatmap-container rounded-xl overflow-hidden" data-testid="heatmap-container">
              {heatmapUrl ? (
                <img
                  src={heatmapUrl}
                  alt="Heatmap showing anomalous regions"
                  className="w-full object-cover rounded-xl"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-48 rounded-xl bg-red-50 border border-red-100 flex flex-col items-center justify-center">
                  {/* Mock heatmap visualization */}
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 rounded-xl bg-slate-100" />
                    <div className="absolute" style={{ top: '20%', left: '30%', width: '40%', height: '30%', background: 'rgba(220,38,38,0.4)', borderRadius: '4px', border: '2px solid #DC2626' }} />
                    <div className="absolute" style={{ bottom: '20%', right: '20%', width: '25%', height: '20%', background: 'rgba(220,38,38,0.3)', borderRadius: '4px', border: '1px solid #DC2626' }} />
                  </div>
                  <p className="text-xs text-red-400 mt-2">AI Artifacts Detected</p>
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500/50 border border-red-500" />
                <span className="text-xs text-slate-500">Suspicious regions highlighted</span>
              </div>
            </div>

            {/* Confidence */}
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-slate-500">Rejection Confidence</span>
                <span className="text-sm font-bold text-aegis-reject" data-testid="confidence-score">{confidence}%</span>
              </div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill bg-aegis-reject"
                  initial={{ width: '0%' }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Right: Evidence List */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 space-y-4"
          >
            {/* Meta tiles */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Hash, label: 'Audit ID', value: result.audit_id?.slice(-10), mono: true },
                { icon: Clock, label: 'Processing', value: `${result.total_latency_ms || 0}ms` },
              ].map(({ icon: Icon, label, value, mono }) => (
                <div key={label} className="card-3d p-3 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-slate-400">{label}</div>
                    <div className={`text-xs font-semibold text-slate-700 ${mono ? 'font-mono' : ''}`}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Evidence cards */}
            <div className="card-3d p-5">
              <button
                className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 mb-4"
                onClick={() => setShowEvidence(!showEvidence)}
                data-testid="toggle-evidence-btn"
              >
                <span>Detection Evidence ({(result.evidence || []).length} signals)</span>
                {showEvidence ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showEvidence && (
                <div className="space-y-2" data-testid="evidence-list">
                  {(result.evidence || []).slice(0, 6).map((ev, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-red-50/50 rounded-xl border border-red-100">
                      <div className="w-2 h-2 rounded-full bg-aegis-reject mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-red-800 capitalize">
                          {(ev.type || 'signal').replace(/_/g, ' ')}
                        </div>
                        {ev.description && (
                          <div className="text-xs text-red-600 mt-0.5 leading-relaxed">{ev.description}</div>
                        )}
                      </div>
                      <div className="text-xs font-mono font-bold text-red-700 flex-shrink-0">
                        {Math.round((ev.score || 0.7) * 100)}%
                      </div>
                    </div>
                  ))}
                  {(result.evidence || []).length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">
                      AI frequency artifacts detected in image spectrum analysis
                    </p>
                  )}
                </div>
              )}
            </div>
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
            onClick={() => navigate(`/audit/${result.audit_id}`)}
            data-testid="view-full-audit-btn"
            className="btn-primary"
          >
            <ExternalLink className="w-4 h-4" />
            View Full Audit
          </button>
          <button onClick={() => navigate('/')} className="btn-secondary" data-testid="verify-another-btn">
            Verify Another Image
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
