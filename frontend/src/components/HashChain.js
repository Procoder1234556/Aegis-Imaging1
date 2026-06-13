import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock } from 'lucide-react';

export default function HashChain({ prevHash, selfHash, nextHash }) {
  const truncate = (h) => h ? `${h.slice(0, 8)}...${h.slice(-8)}` : 'N/A';

  const boxes = [
    { label: 'Previous Block', hash: prevHash, isGenesis: prevHash === 'GENESIS' || !prevHash },
    { label: 'This Record', hash: selfHash, isCurrent: true },
    { label: 'Next Block', hash: nextHash, isPending: !nextHash },
  ];

  return (
    <div data-testid="hash-chain" className="flex items-center gap-2 flex-wrap">
      {boxes.map((box, i) => (
        <React.Fragment key={i}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.15 }}
            className={`flex-1 min-w-[160px] rounded-xl border p-4 ${
              box.isCurrent
                ? 'border-aegis-blue/40 bg-aegis-navy/5'
                : box.isPending
                ? 'border-slate-200 bg-slate-50'
                : 'border-slate-200 bg-white'
            }`}
            style={box.isCurrent ? {
              boxShadow: '0 0 0 2px rgba(46,92,138,0.2)',
            } : {}}
          >
            <div className="flex items-center gap-2 mb-2">
              <Lock className={`w-3.5 h-3.5 ${box.isCurrent ? 'text-aegis-blue' : 'text-slate-400'}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${
                box.isCurrent ? 'text-aegis-blue' : 'text-slate-500'
              }`}>
                {box.label}
              </span>
            </div>
            <code className={`text-xs font-mono block break-all ${
              box.isPending ? 'text-slate-300 italic' :
              box.isCurrent ? 'text-aegis-navy font-semibold' :
              'text-slate-600'
            }`}>
              {box.isPending ? 'Pending...' :
               box.isGenesis ? 'GENESIS' :
               truncate(box.hash)}
            </code>
            {box.hash && !box.isPending && (
              <div className="mt-2 text-xs text-slate-400 font-mono opacity-60 truncate">
                SHA-256
              </div>
            )}
          </motion.div>
          {i < boxes.length - 1 && (
            <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
