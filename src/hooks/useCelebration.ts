import { useState, useCallback, useEffect } from 'react';

interface CelebrationConfig {
  type: 'completion' | 'streak' | 'achievement' | 'milestone';
  duration?: number;
  sound?: boolean;
  confetti?: boolean;
}

interface CelebrationState {
  isActive: boolean;
  type: string;
  message: string;
}

export function useCelebration() {
  const [celebration, setCelebration] = useState<CelebrationState>({
    isActive: false,
    type: '',
    message: ''
  });

  // Trigger celebration with instant feedback
  const celebrate = useCallback((config: CelebrationConfig & { message?: string }) => {
    const { type, duration = 2000, message = 'Great job!' } = config;
    
    // Instant visual feedback
    setCelebration({
      isActive: true,
      type,
      message
    });

    // Play celebration sound (if enabled)
    if (config.sound) {
      playSuccessSound();
    }

    // Show confetti (if enabled)
    if (config.confetti) {
      triggerConfetti();
    }

    // Auto-hide after duration
    setTimeout(() => {
      setCelebration(prev => ({ ...prev, isActive: false }));
    }, duration);
  }, []);

  // Play success sound using Web Audio API
  const playSuccessSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a simple success sound (ascending notes)
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.type = 'sine';
        
        // Envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime + index * 0.1);
        oscillator.stop(audioContext.currentTime + 0.3 + index * 0.1);
      });
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }, []);

  // Trigger confetti effect
  const triggerConfetti = useCallback(() => {
    // Create confetti particles
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
      createConfettiParticle(colors[Math.floor(Math.random() * colors.length)]);
    }
  }, []);

  const createConfettiParticle = (color: string) => {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: ${color};
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      left: ${Math.random() * window.innerWidth}px;
      top: -10px;
      animation: confetti-fall 3s linear forwards;
    `;
    
    document.body.appendChild(particle);
    
    // Remove particle after animation
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, 3000);
  };

  // Add confetti animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confetti-fall {
        0% {
          transform: translateY(-10px) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(${window.innerHeight + 10}px) rotate(720deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  // Predefined celebration types
  const celebrateTaskCompletion = useCallback(() => {
    celebrate({
      type: 'completion',
      message: '🎉 Task completed! You\'re awesome!',
      sound: true,
      confetti: true
    });
  }, [celebrate]);

  const celebrateStreak = useCallback((days: number) => {
    const messages = {
      3: '🌟 3-day streak! You\'re building momentum!',
      7: '⚡ One week streak! You\'re on fire!',
      14: '🔥 Two weeks! This is becoming a habit!',
      30: '🏆 30 days! You\'re absolutely legendary!'
    };
    
    const message = messages[days as keyof typeof messages] || `🎯 ${days}-day streak! Keep going!`;
    
    celebrate({
      type: 'streak',
      message,
      sound: true,
      confetti: days >= 7
    });
  }, [celebrate]);

  const celebrateAchievement = useCallback((achievement: string) => {
    celebrate({
      type: 'achievement',
      message: `🏆 Achievement unlocked: ${achievement}`,
      sound: true,
      confetti: true,
      duration: 3000
    });
  }, [celebrate]);

  const celebrateMilestone = useCallback((milestone: string) => {
    celebrate({
      type: 'milestone',
      message: `✨ Milestone reached: ${milestone}`,
      sound: true,
      confetti: true,
      duration: 2500
    });
  }, [celebrate]);

  return {
    celebration,
    celebrate,
    celebrateTaskCompletion,
    celebrateStreak,
    celebrateAchievement,
    celebrateMilestone
  };
}

// Hook for instant feedback on user actions
export function useInstantFeedback() {
  const [feedback, setFeedback] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'info' | 'warning';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showFeedback = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setFeedback({ show: true, message, type });
    
    // Auto-hide after 2 seconds
    setTimeout(() => {
      setFeedback(prev => ({ ...prev, show: false }));
    }, 2000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    showFeedback(message, 'success');
  }, [showFeedback]);

  const showInfo = useCallback((message: string) => {
    showFeedback(message, 'info');
  }, [showFeedback]);

  const showWarning = useCallback((message: string) => {
    showFeedback(message, 'warning');
  }, [showFeedback]);

  return {
    feedback,
    showFeedback,
    showSuccess,
    showInfo,
    showWarning
  };
}

// Hook for dopamine-driven progress tracking
export function useProgressRewards() {
  const { celebrate } = useCelebration();
  
  const checkAndReward = useCallback((progress: {
    tasksCompleted: number;
    streak: number;
    completionRate: number;
    subjectsCompleted: number;
  }) => {
    const { tasksCompleted, streak, completionRate, subjectsCompleted } = progress;
    
    // Task completion rewards
    if (tasksCompleted > 0 && tasksCompleted % 5 === 0) {
      celebrate({
        type: 'milestone',
        message: `🎯 ${tasksCompleted} tasks completed! You're productive!`,
        sound: true
      });
    }
    
    // Streak rewards
    if (streak >= 3 && [3, 7, 14, 21, 30].includes(streak)) {
      celebrate({
        type: 'streak',
        message: `🔥 ${streak}-day streak! Consistency is key!`,
        sound: true,
        confetti: streak >= 7
      });
    }
    
    // Completion rate rewards
    if (completionRate >= 80) {
      celebrate({
        type: 'achievement',
        message: `⭐ ${Math.round(completionRate)}% completion rate! Excellence!`,
        sound: true,
        confetti: completionRate >= 95
      });
    }
    
    // Subject completion rewards
    if (subjectsCompleted > 0) {
      celebrate({
        type: 'achievement',
        message: `🏆 Subject completed! You're mastering this!`,
        sound: true,
        confetti: true
      });
    }
  }, [celebrate]);

  return { checkAndReward };
}