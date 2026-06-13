import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

const VERDICT_CONFIG = {
  APPROVE: {
    icon: CheckCircle,
    label: 'Approved',
    className: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-aegis-approve',
  },
  REJECT: {
    icon: XCircle,
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-aegis-reject',
  },
  ESCALATE: {
    icon: AlertTriangle,
    label: 'Escalated',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-aegis-escalate',
  },
};

export default function VerdictBadge({ verdict, size = 'md' }) {
  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG['ESCALATE'];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      data-testid={`verdict-badge-${verdict?.toLowerCase()}`}
      className={clsx(
        'inline-flex items-center font-semibold rounded-lg border',
        sizeClasses[size],
        config.className
      )}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
    </span>
  );
}
