'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCelebration } from '@/hooks/useCelebration';
import { CheckCircle, Zap } from 'lucide-react';

interface InstantFeedbackButtonProps {
  children: React.ReactNode;
  onClick: () => void | Promise<void>;
  celebrationType?: 'completion' | 'streak' | 'achievement' | 'milestone';
  celebrationMessage?: string;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'success' | 'warning' | 'info';
}

const InstantFeedbackButton = ({
  children,
  onClick,
  celebrationType = 'completion',
  celebrationMessage = 'Great job!',
  disabled = false,
  className = '',
  variant = 'primary'
}: InstantFeedbackButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { celebrate } = useCelebration();

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600';
      case 'warning':
        return 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600';
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600';
      default:
        return 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600';
    }
  };

  const handleClick = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      // Execute the action
      await onClick();
      
      // Show instant success feedback
      setShowSuccess(true);
      
      // Trigger celebration
      celebrate({
        type: celebrationType,
        message: celebrationMessage,
        sound: true,
        confetti: celebrationType === 'achievement' || celebrationType === 'milestone'
      });

      // Reset success state
      setTimeout(() => {
        setShowSuccess(false);
      }, 1000);

    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`
        relative overflow-hidden px-6 py-3 rounded-xl text-white font-medium
        transition-all duration-200 shadow-lg
        ${getVariantStyles()}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* Background pulse effect */}
      {isLoading && (
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute inset-0 bg-white/20 rounded-xl"
        />
      )}

      {/* Success ripple effect */}
      {showSuccess && (
        <motion.div
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-white rounded-xl"
        />
      )}

      {/* Button content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Zap size={20} />
            </motion.div>
            <span>Working...</span>
          </>
        ) : showSuccess ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle size={20} />
            </motion.div>
            <span>Done!</span>
          </>
        ) : (
          children
        )}
      </div>

      {/* Sparkle effects on success */}
      {showSuccess && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                scale: 0, 
                x: 0, 
                y: 0,
                opacity: 1
              }}
              animate={{ 
                scale: [0, 1, 0],
                x: (Math.random() - 0.5) * 100,
                y: (Math.random() - 0.5) * 100,
                opacity: [1, 1, 0]
              }}
              transition={{ 
                duration: 0.8,
                delay: i * 0.1,
                ease: "easeOut"
              }}
              className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-300 rounded-full pointer-events-none"
            />
          ))}
        </>
      )}
    </motion.button>
  );
};

export default InstantFeedbackButton;