'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb } from 'lucide-react';

interface FloatingHintProps {
  message: string;
  show: boolean;
  onDismiss: () => void;
  position?: 'top' | 'bottom';
}

export default function FloatingHint({ 
  message, 
  show, 
  onDismiss, 
  position = 'bottom' 
}: FloatingHintProps) {
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    if (show && !hasBeenShown) {
      setHasBeenShown(true);
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        onDismiss();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [show, hasBeenShown, onDismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ 
            opacity: 0, 
            y: position === 'bottom' ? 20 : -20,
            scale: 0.9 
          }}
          animate={{ 
            opacity: 1, 
            y: 0,
            scale: 1 
          }}
          exit={{ 
            opacity: 0, 
            y: position === 'bottom' ? 20 : -20,
            scale: 0.9 
          }}
          transition={{ 
            duration: 0.3, 
            ease: "easeOut" 
          }}
          className={`
            fixed z-50 left-1/2 transform -translate-x-1/2
            ${position === 'bottom' ? 'bottom-6' : 'top-6'}
          `}
        >
          <div className="
            bg-gradient-to-r from-purple-600 to-pink-600 
            text-white px-4 py-3 rounded-2xl shadow-2xl
            border border-purple-400/30
            max-w-sm mx-4
            backdrop-blur-sm
          ">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Lightbulb size={16} className="text-yellow-300" />
                </motion.div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-relaxed">
                  {message}
                </p>
              </div>
              
              <button
                onClick={onDismiss}
                className="
                  flex-shrink-0 p-1 rounded-full 
                  hover:bg-white/20 transition-colors
                  text-white/80 hover:text-white
                "
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}