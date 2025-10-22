'use client';

import { motion } from 'framer-motion';

interface ReadyBadgeProps {
  count: number;
  type?: 'breakdown' | 'ready';
  size?: 'sm' | 'md';
}

export default function ReadyBadge({ count, type = 'breakdown', size = 'sm' }: ReadyBadgeProps) {
  if (count === 0) return null;

  const isReady = type === 'ready';
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-full
        ${size === 'sm' ? 'text-xs' : 'text-sm'}
        ${isReady 
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
        }
      `}
    >
      {/* Pulsing Dot */}
      <div className="relative">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className={`
            w-2 h-2 rounded-full
            ${isReady ? 'bg-amber-400' : 'bg-purple-400'}
          `}
        />
      </div>
      
      <span className="font-medium">
        {count} {isReady ? 'ready' : 'planned'}
      </span>
    </motion.div>
  );
}