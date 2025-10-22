'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface EnhancedProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showCelebration?: boolean;
  label?: string;
  animate?: boolean;
  playSound?: boolean;
}

const EnhancedProgressRing = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = 'from-green-400 to-emerald-500',
  showCelebration = false,
  label = 'Complete',
  animate = true,
  playSound = true
}: EnhancedProgressRingProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [showSparkles, setShowSparkles] = useState(false);
  const [showMilestoneEffect, setShowMilestoneEffect] = useState(false);
  const [lastMilestone, setLastMilestone] = useState(0);
  const [showPulse, setShowPulse] = useState(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Play celebration sound
  const playSuccessSound = () => {
    if (!playSound) return;
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not available');
    }
  };

  useEffect(() => {
    if (animate) {
      // Animate progress from 0 to target with milestone celebrations
      const timer = setTimeout(() => {
        setAnimatedProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(progress);
    }
  }, [progress, animate]);

  useEffect(() => {
    // Milestone celebrations every 25%
    const currentMilestone = Math.floor(animatedProgress / 25) * 25;
    
    if (currentMilestone > lastMilestone && currentMilestone > 0) {
      setLastMilestone(currentMilestone);
      setShowMilestoneEffect(true);
      setShowPulse(true);
      playSuccessSound();
      
      setTimeout(() => {
        setShowMilestoneEffect(false);
        setShowPulse(false);
      }, 1500);
    }

    // Show sparkles when progress is high
    if (animatedProgress >= 80) {
      setShowSparkles(true);
      const timer = setTimeout(() => setShowSparkles(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [animatedProgress, lastMilestone]);

  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  const getProgressColor = () => {
    if (animatedProgress >= 90) return 'from-yellow-400 to-orange-500';
    if (animatedProgress >= 70) return 'from-green-400 to-emerald-500';
    if (animatedProgress >= 50) return 'from-blue-400 to-cyan-500';
    return 'from-gray-400 to-gray-500';
  };

  const getProgressEmoji = () => {
    if (animatedProgress >= 100) return '🏆';
    if (animatedProgress >= 90) return '🎉';
    if (animatedProgress >= 75) return '🔥';
    if (animatedProgress >= 50) return '⚡';
    if (animatedProgress >= 25) return '💪';
    if (animatedProgress > 0) return '🌟';
    return '🎯';
  };

  const getMilestoneMessage = () => {
    if (animatedProgress >= 100) return 'Perfect! 🏆';
    if (animatedProgress >= 75) return 'Almost there! 🔥';
    if (animatedProgress >= 50) return 'Halfway! ⚡';
    if (animatedProgress >= 25) return 'Great start! 💪';
    return 'Let\'s go! 🎯';
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
      
      {/* Milestone celebration effect */}
      <AnimatePresence>
        {showMilestoneEffect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                rotate: [0, 360],
              }}
              transition={{ duration: 1 }}
              className="text-4xl"
            >
              {getProgressEmoji()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating sparkles */}
      {showSparkles && (
        <>
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute pointer-events-none"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180, 360],
                x: [0, (Math.random() - 0.5) * 40],
                y: [0, (Math.random() - 0.5) * 40],
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut"
              }}
            >
              <div className="w-1 h-1 bg-yellow-300 rounded-full shadow-lg shadow-yellow-300/50" />
            </motion.div>
          ))}
        </>
      )}

      {/* Pulse effect for high progress */}
      {(animatedProgress >= 80 || showPulse) && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-yellow-400"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 0, 0.6]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Milestone message */}
      <AnimatePresence>
        {showMilestoneEffect && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg">
              {getMilestoneMessage()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Continuous glow for completed */}
      {animatedProgress >= 100 && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-500/20"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3]
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