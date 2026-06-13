import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, Clock, Hash } from 'lucide-react';

export default function Processing() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #f0fdf4 50%, #F8FAFC 100%)' }}
    >
      <div className="max-w-md w-full text-center" data-testid="processing-page">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-aegis-approve" />
        </motion.div>

        <h2 className="text-2xl font-bold text-aegis-navy mb-2">Forwarded to Processing</h2>
        <p className="text-slate-500 mb-6 leading-relaxed">
          This verified image has been submitted to the claims processing workflow.
          The downstream EHR system has been notified via webhook.
        </p>

        <div className="card-3d p-4 mb-8 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">Reference</span>
          </div>
          <code className="text-sm font-mono text-aegis-navy">{id || result?.audit_id}</code>
          <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            EHR webhook delivered
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/dashboard')} className="btn-primary" data-testid="go-to-dashboard-btn">
            <BarChart3 className="w-4 h-4" />
            View Dashboard
          </button>
          <button onClick={() => navigate('/')} className="btn-secondary" data-testid="verify-another-btn">
            Verify Another
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function BarChart3({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
