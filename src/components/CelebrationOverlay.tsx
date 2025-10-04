'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCelebration } from '@/hooks/useCelebration';
import { Sparkles, Trophy, Flame, Target } from 'lucide-react';

const CelebrationOverlay = () => {
  const { celebration } = useCelebration();

  const getIcon = (type: string) => {
    switch (type) {
      case 'completion':
        return Target;
      case 'streak':
        return Flame;
      case 'achievement':
        return Trophy;
      case 'milestone':
        return Sparkles;
      default:
        return Sparkles;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'completion':
        return {
          bg: 'from-green-500 to-emerald-500',
          text: 'text-green-100',
          glow: 'shadow-green-500/50'
        };
      case 'streak':
        return {
          bg: 'from-orange-500 to-red-500',
          text: 'text-orange-100',
          glow: 'shadow-orange-500/50'
        };
      case 'achievement':
        return {
          bg: 'from-purple-500 to-pink-500',
          text: 'text-purple-100',
          glow: 'shadow-purple-500/50'
        };
      case 'milestone':
        return {
          bg: 'from-blue-500 to-cyan-500',
          text: 'text-blue-100',
          glow: 'shadow-blue-500/50'
        };
      default:
        return {
          bg: 'from-purple-500 to-pink-500',
          text: 'text-purple-100',
          glow: 'shadow-purple-500/50'
        };
    }
  };

  const Icon = getIcon(celebration.type);
  const colors = getColors(celebration.type);

  return (
    <AnimatePresence>
      {celebration.isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
          />
          
          {/* Celebration card */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: 0,
              rotate: [0, -2, 2, -1, 1, 0]
            }}
            exit={{ scale: 0.5, opacity: 0, y: -50 }}
            transition={{ 
              type: "spring", 
              damping: 15, 
              stiffness: 300,
              rotate: { duration: 0.6, delay: 0.2 }
            }}
            className={`
              relative bg-gradient-to-br ${colors.bg} 
              rounded-2xl p-8 mx-4 max-w-md
              shadow-2xl ${colors.glow}
              border border-white/20
            `}
          >
            {/* Sparkle effects */}
            <div className="absolute -top-2 -right-2">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity }
                }}
                className="text-yellow-300 text-2xl"
              >
                ✨
              </motion.div>
            </div>
            
            <div className="absolute -bottom-2 -left-2">
              <motion.div
                animate={{ 
                  rotate: -360,
                  scale: [1, 1.3, 1]
                }}
                transition={{ 
                  rotate: { duration: 2.5, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1.2, repeat: Infinity, delay: 0.3 }
                }}
                className="text-yellow-300 text-xl"
              >
                ⭐
              </motion.div>
            </div>

            {/* Main content */}
            <div className="text-center relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-4"
              >
                <Icon className={`w-16 h-16 mx-auto ${colors.text}`} />
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-2xl font-bold ${colors.text} mb-2`}
              >
                Amazing!
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`text-lg ${colors.text} opacity-90`}
              >
                {celebration.message}
              </motion.p>
            </div>

            {/* Floating particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full opacity-60"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                animate={{
                  y: [-10, -30, -10],
                  x: [0, Math.random() * 20 - 10, 0],
                  opacity: [0.6, 1, 0.6],
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationOverlay;