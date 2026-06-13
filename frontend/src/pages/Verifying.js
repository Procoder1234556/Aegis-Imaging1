import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, Eye, Stethoscope, Gavel, Shield } from 'lucide-react';
import { getAudit } from '../api';

const AGENTS = [
  { key: 'intake',    name: 'Intake & Metadata',    icon: FileSearch,   desc: 'Analyzing EXIF, DICOM headers...' },
  { key: 'forensics', name: 'Visual Forensics',      icon: Eye,          desc: 'Scanning for AI frequency artifacts...' },
  { key: 'clinical',  name: 'Clinical Plausibility', icon: Stethoscope,  desc: 'Checking anatomical coherence...' },
  { key: 'verdict',   name: 'Verdict Officer',       icon: Gavel,        desc: 'Synthesizing agent outputs...' },
  { key: 'audit',     name: 'Audit & Compliance',    icon: Shield,       desc: 'Writing tamper-proof audit record...' },
];

const STATUS_STYLES = {
  pending: {
    wrapper: 'bg-slate-50 border-slate-200',
    icon: 'bg-slate-100 text-slate-300',
    title: 'text-slate-400',
    dot: 'bg-slate-300',
  },
  running: {
    wrapper: 'bg-blue-50 border-blue-300 shadow-lg',
    icon: 'bg-aegis-blue/15 text-aegis-blue',
    title: 'text-aegis-blue font-bold',
    dot: 'bg-blue-400 animate-ping',
  },
  done: {
    wrapper: 'bg-green-50 border-green-300',
    icon: 'bg-green-100 text-green-600',
    title: 'text-green-700 font-semibold',
    dot: 'bg-green-500',
  },
};

export default function Verifying() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(location.state?.result || null);
  const startRef = useRef(Date.now());

  // Tick the elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((Date.now() - startRef.current) / 1000);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Animate agents sequentially
  useEffect(() => {
    AGENTS.forEach((_, i) => {
      setTimeout(() => setStep(i + 1), 300 * (i + 1));
    });
  }, []);

  // If we don't have the result yet, fetch it
  useEffect(() => {
    if (!result && id && id !== 'pending') {
      getAudit(id).then(setResult).catch(() => {});
    }
  }, [id, result]);

  // Once animation done AND result available → navigate
  useEffect(() => {
    if (step >= AGENTS.length && result) {
      const timeout = setTimeout(() => {
        const v = result.verdict;
        if (v === 'APPROVE') navigate(`/result/approved/${result.audit_id}`, { state: { result } });
        else if (v === 'REJECT') navigate(`/result/rejected/${result.audit_id}`, { state: { result } });
        else navigate(`/result/escalated/${result.audit_id}`, { state: { result } });
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [step, result, navigate]);

  const getAgentStatus = (i) => {
    if (i + 1 < step) return 'done';
    if (i + 1 === step) return 'running';
    return 'pending';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 py-16"
      style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #EEF4FB 50%, #F8FAFC 100%)' }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #0F2A47 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="w-full max-w-3xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          {/* Scanning animation orb */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-aegis-blue/30 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-aegis-blue/50 animate-spin-slow" />
            <div className="absolute inset-4 rounded-full bg-aegis-navy flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(46,92,138,0.4)' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-aegis-navy mb-2">Verifying Image</h2>
          <p className="text-slate-500 text-lg">5 specialized agents are inspecting your image...</p>

          {/* Live timer */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-aegis-navy/8 border border-aegis-navy/15">
            <div className="w-2 h-2 rounded-full bg-aegis-blue animate-pulse" />
            <span className="text-aegis-navy font-mono font-semibold text-sm" data-testid="elapsed-timer">
              Elapsed: {elapsed.toFixed(2)}s
            </span>
          </div>
        </motion.div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3" data-testid="agent-pipeline">
          {AGENTS.map((agent, i) => {
            const status = getAgentStatus(i);
            const s = STATUS_STYLES[status];
            const Icon = agent.icon;
            return (
              <motion.div
                key={agent.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                data-testid={`agent-card-${agent.key}`}
                className={`relative rounded-2xl border p-4 transition-all duration-500 ${s.wrapper}`}
                style={status === 'running' ? { boxShadow: '0 0 0 2px rgba(46,92,138,0.25), 0 8px 24px rgba(46,92,138,0.12)' } : {}}
              >
                {/* Status dot */}
                <div className="absolute top-3 right-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                </div>

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.icon}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Name */}
                <div className={`text-xs ${s.title} leading-tight`}>{agent.name}</div>

                {/* Active description */}
                {status === 'running' && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 text-xs text-blue-500 leading-tight"
                  >
                    {agent.desc}
                  </motion.p>
                )}

                {/* Done check */}
                {status === 'done' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="mt-2 text-xs text-green-600 font-medium"
                  >
                    Complete
                  </motion.div>
                )}

                {/* Running shimmer bar */}
                {status === 'running' && (
                  <div className="mt-3 h-1 rounded-full bg-blue-100 overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, #2E5C8A 50%, transparent 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.2s linear infinite',
                      }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex items-center justify-center"
        >
          <div className="flex items-center gap-2">
            {AGENTS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${
                i + 1 <= step ? 'bg-aegis-blue w-8' : 'bg-slate-200 w-4'
              }`} />
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-slate-400 mt-4"
        >
          {step < AGENTS.length
            ? `Running ${AGENTS[Math.max(0, step - 1)]?.name || ''}...`
            : 'Analysis complete — loading result...'}
        </motion.p>
      </div>
    </motion.div>
  );
}
