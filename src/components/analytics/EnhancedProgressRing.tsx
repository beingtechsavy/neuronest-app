'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface EnhancedProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showCelebration?: boolean;
  label?: string;
  animate?: boolean;
}

const EnhancedProgressRing = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'from-green-400 to-emerald-500',
  showCelebration = false,
  label = 'Complete',
  animate = true
}: EnhancedProgressRingProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [showSparkles, setShowSparkles] = useState(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    if (animate) {
      // Animate progress from 0 to target
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(progress);
    }
  }, [progress, animate]);

  useEffect(() => {
    // Show sparkles when progress is high
    if (animatedProgress >= 80) {
      setShowSparkles(true);
      const timer = setTimeout(() => setShowSparkles(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [animatedProgress]);

  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  const getProgressColor = () => {
    if (animatedProgress >= 90) return 'from-yellow-400 to-orange-500';
    if (animatedProgress >= 70) return 'from-green-400 to-emerald-500';
    if (animatedProgress >= 50) return 'from-blue-400 to-cyan-500';
    return 'from-gray-400 to-gray-500';
  };

  const getProgressEmoji = () => {
    if (animatedProgress >= 100) return '🎉';
    if (animatedProgress >= 90) return '🔥';
    if (animatedProgress >= 70) return '⚡';
    if (animatedProgress >= 50) return '💪';
    if (animatedProgress >= 25) return '🌟';
    return '🎯';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background glow effect */}
      <motion.div
        animate={{
          scale: showSparkles ? [1, 1.1, 1] : 1,
          opacity: showSparkles ? [0.5, 0.8, 0.5] : 0.3
        }}
        transition={{ duration: 1, repeat: showSparkles ? Infinity : 0 }}
        className={`absolute inset-0 rounded-full bg-gradient-to-r ${getProgressColor()} blur-lg opacity-30`}
      />

      <svg
        className="transform -rotate-90 relative z-10"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className={`text-${getProgressColor().split('-')[1]}-400`} stopColor="currentColor" />
            <stop offset="100%" className={`text-${getProgressColor().split('-')[3]}-500`} stopColor="currentColor" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ 
              scale: showCelebration ? [1, 1.2, 1] : 1,
              rotate: showCelebration ? [0, 10, -10, 0] : 0
            }}
            className="text-3xl mb-1"
          >
            {getProgressEmoji()}
          </motion.div>
          <motion.div 
            className="text-2xl font-bold text-white"
            animate={{ scale: showCelebration ? [1, 1.1, 1] : 1 }}
          >
            {Math.round(animatedProgress)}%
          </motion.div>
          <div className="text-xs text-gray-400">{label}</div>
        </div>
      </div>
      
      {/* Floating sparkles */}
      {showSparkles && (
        <>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full"
              style={{
                left: `${30 + Math.random() * 40}%`,
                top: `${30 + Math.random() * 40}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </>
      )}

      {/* Pulse effect for high progress */}
      {animatedProgress >= 80 && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-yellow-400"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  );
};

export default EnhancedProgressRing;