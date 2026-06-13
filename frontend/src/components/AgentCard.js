import React from 'react';
import { motion } from 'framer-motion';
import {
  FileSearch, Eye, Stethoscope, Gavel, Shield,
  Check, Loader, Clock
} from 'lucide-react';
import clsx from 'clsx';

const ICONS = {
  intake: FileSearch,
  forensics: Eye,
  clinical: Stethoscope,
  verdict: Gavel,
  audit: Shield,
};

const STATUS_STYLES = {
  pending: {
    card: 'bg-slate-50 border-slate-200',
    icon: 'text-slate-300',
    label: 'text-slate-400',
    indicator: 'bg-slate-200',
    badge: 'text-slate-400',
  },
  running: {
    card: 'bg-blue-50 border-blue-300',
    icon: 'text-aegis-blue',
    label: 'text-aegis-blue font-semibold',
    indicator: 'bg-blue-400',
    badge: 'text-blue-600',
  },
  done: {
    card: 'bg-green-50 border-green-300',
    icon: 'text-aegis-approve',
    label: 'text-green-700 font-semibold',
    indicator: 'bg-green-500',
    badge: 'text-green-700',
  },
  error: {
    card: 'bg-red-50 border-red-300',
    icon: 'text-aegis-reject',
    label: 'text-red-700',
    indicator: 'bg-red-500',
    badge: 'text-red-600',
  },
};

export default function AgentCard({ name, agentKey, status = 'pending', latencyMs, score, index = 0 }) {
  const Icon = ICONS[agentKey] || FileSearch;
  const styles = STATUS_STYLES[status];

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: index * 0.15,
        duration: 0.4,
        ease: [0.34, 1.56, 0.64, 1],
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      data-testid={`agent-card-${agentKey}`}
      className={clsx(
        'relative rounded-2xl border p-5 transition-all duration-500',
        styles.card
      )}
      style={{
        boxShadow: status === 'running'
          ? '0 0 0 2px rgba(46,92,138,0.3), 0 8px 24px rgba(46,92,138,0.12)'
          : status === 'done'
          ? '0 4px 16px rgba(22,163,74,0.1)'
          : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Status indicator dot */}
      <div className="absolute top-3 right-3">
        {status === 'running' ? (
          <Loader className={clsx('w-4 h-4 animate-spin', styles.badge)} />
        ) : status === 'done' ? (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        ) : (
          <div className={clsx('w-2.5 h-2.5 rounded-full', styles.indicator)} />
        )}
      </div>

      {/* Icon */}
      <div className={clsx(
        'w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all duration-500',
        status === 'running' ? 'bg-aegis-blue/15 animate-pulse-blue' :
        status === 'done' ? 'bg-green-100' :
        'bg-slate-100'
      )}>
        <Icon className={clsx('w-5 h-5', styles.icon)} />
      </div>

      {/* Name */}
      <div className={clsx('text-sm truncate', styles.label)}>
        {name}
      </div>

      {/* Latency */}
      {latencyMs != null && status === 'done' && (
        <div className="mt-2 flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-400 font-mono">{latencyMs}ms</span>
        </div>
      )}

      {/* Score */}
      {score != null && status === 'done' && (
        <div className="mt-1">
          <div className="text-xs text-slate-500">
            Score: <span className="font-semibold font-mono text-aegis-navy">{(score * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* Running animation bar */}
      {status === 'running' && (
        <div className="mt-3 h-1 rounded-full bg-blue-100 overflow-hidden">
          <div
            className="h-full bg-aegis-blue rounded-full"
            style={{
              animation: 'shimmer 1.5s linear infinite',
              background: 'linear-gradient(90deg, transparent 0%, #2E5C8A 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      )}
    </motion.div>
  );
}
