import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Mail, Clock, Hash, ChevronRight } from 'lucide-react';
import VerdictBadge from '../components/VerdictBadge';

export default function Escalated() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;
  const [forwarded, setForwarded] = useState(false);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Loading result...</p>
      </div>
    );
  }

  const handleForward = () => {
    setForwarded(true);
    setTimeout(() => navigate(`/audit/${result.audit_id}`), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[calc(100vh-64px)] px-6 py-10"
      style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #fffbeb 50%, #F8FAFC 100%)' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Verdict Banner */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="verdict-escalate rounded-2xl p-6 mb-8"
          data-testid="verdict-banner-escalate"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-aegis-escalate" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <VerdictBadge verdict="ESCALATE" size="lg" />
                <span className="text-slate-500 text-sm font-mono">#{result.audit_id}</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{result.rationale}</p>
            </div>
          </div>
        </motion.div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Hash, label: 'Audit Reference', value: result.audit_id?.slice(-12), mono: true },
            { icon: Clock, label: 'Pipeline Time', value: `${result.total_latency_ms || 0}ms` },
            { icon: AlertTriangle, label: 'Confidence', value: `${Math.round((result.confidence || 0.5) * 100)}%`, amber: true },
          ].map(({ icon: Icon, label, value, mono, amber }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-3d p-4"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${amber ? 'bg-amber-100' : 'bg-aegis-navy/8'}`}>
                <Icon className={`w-4 h-4 ${amber ? 'text-amber-600' : 'text-aegis-navy'}`} />
              </div>
              <div className={`text-base font-bold ${mono ? 'font-mono' : ''} ${amber ? 'text-amber-600' : 'text-aegis-navy'}`}>{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Forward card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-3d p-8 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-aegis-escalate" />
          </div>

          <h3 className="text-xl font-bold text-aegis-navy mb-2">Manual Review Required</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto leading-relaxed">
            The automated detection pipeline returned inconclusive results. A qualified radiologist
            must review this image before it can be processed.
          </p>

          {forwarded ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-100 text-green-700 font-semibold"
              data-testid="forwarded-confirmation"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Forwarded to Review Queue
            </motion.div>
          ) : (
            <button
              onClick={handleForward}
              data-testid="forward-reviewer-btn"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #D97706, #f59e0b)', boxShadow: '0 4px 14px rgba(217,119,6,0.3)' }}
            >
              <Mail className="w-4 h-4" />
              Forward to Human Reviewer
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex flex-wrap gap-3"
        >
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
