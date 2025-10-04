'use client';

import { motion } from 'framer-motion';
import { useCelebration } from '@/hooks/useCelebration';
import InstantFeedbackButton from '@/components/InstantFeedbackButton';
import { Target, Flame, Trophy, Sparkles } from 'lucide-react';

const DemoActions = () => {
  const { celebrateTaskCompletion, celebrateStreak, celebrateAchievement, celebrateMilestone } = useCelebration();

  const demoActions = [
    {
      icon: Target,
      label: 'Complete Task',
      action: celebrateTaskCompletion,
      variant: 'success' as const,
      description: 'See what happens when you complete a task!'
    },
    {
      icon: Flame,
      label: '7-Day Streak',
      action: () => celebrateStreak(7),
      variant: 'warning' as const,
      description: 'Experience a streak celebration!'
    },
    {
      icon: Trophy,
      label: 'Achievement',
      action: () => celebrateAchievement('First Week Complete'),
      variant: 'info' as const,
      description: 'Unlock an achievement!'
    },
    {
      icon: Sparkles,
      label: 'Milestone',
      action: () => celebrateMilestone('100 Tasks Completed'),
      variant: 'primary' as const,
      description: 'Reach a major milestone!'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="text-indigo-400" size={24} />
        <h3 className="text-lg font-semibold text-white">Try the Celebrations!</h3>
      </div>
      
      <p className="text-indigo-200 mb-6 text-sm">
        Experience the dopamine-driven feedback system designed for ADHD brains. 
        Each action provides instant visual and audio rewards! The analytics above show real demo data automatically.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {demoActions.map((demo, index) => (
          <motion.div
            key={demo.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            <InstantFeedbackButton
              onClick={demo.action}
              variant={demo.variant}
              celebrationType="achievement"
              celebrationMessage={`🎉 Demo: ${demo.label}!`}
              className="w-full"
            >
              <demo.icon size={20} />
              {demo.label}
            </InstantFeedbackButton>
            <p className="text-xs text-gray-400 text-center">
              {demo.description}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
        <p className="text-sm text-indigo-300 text-center">
          💡 <strong>ADHD-Friendly Design:</strong> Instant feedback, visual celebrations, 
          and audio cues help maintain engagement and provide the dopamine hits that ADHD brains crave!
        </p>
      </div>
    </motion.div>
  );
};

export default DemoActions;