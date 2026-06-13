import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function MetricTile({ label, value, subLabel, icon: Icon, color = 'navy', index = 0 }) {
  const colorMap = {
    navy: {
      icon: 'bg-aegis-navy/10 text-aegis-navy',
      value: 'text-aegis-navy',
    },
    green: {
      icon: 'bg-green-100 text-green-600',
      value: 'text-green-700',
    },
    red: {
      icon: 'bg-red-100 text-red-600',
      value: 'text-red-700',
    },
    amber: {
      icon: 'bg-amber-100 text-amber-600',
      value: 'text-amber-700',
    },
  };

  const colors = colorMap[color] || colorMap.navy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: 'easeOut' }}
      data-testid={`metric-tile-${label?.toLowerCase().replace(/\s+/g, '-')}`}
      className="metric-tile"
    >
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', colors.icon)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className={clsx('text-3xl font-bold tracking-tight', colors.value)}>
        {value}
      </div>
      <div className="text-sm font-medium text-slate-600 mt-1">{label}</div>
      {subLabel && (
        <div className="text-xs text-slate-400 mt-0.5">{subLabel}</div>
      )}
    </motion.div>
  );
}
