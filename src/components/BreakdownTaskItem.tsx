'use client';

import { useState } from 'react';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BreakdownTask {
  task_id: number;
  title: string;
  difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD';
  estimated_minutes?: number;
  task_status?: 'breakdown' | 'inbox' | 'scheduled' | 'completed';
}

interface BreakdownTaskItemProps {
  task: BreakdownTask;
  onAddToInbox: (taskId: number) => void;
  isLoading?: boolean;
}

export default function BreakdownTaskItem({ task, onAddToInbox, isLoading }: BreakdownTaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-400/20 text-green-300 border-green-400/30';
      case 'MEDIUM': return 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30';
      case 'HARD': return 'bg-red-400/20 text-red-300 border-red-400/30';
      default: return 'bg-purple-400/20 text-purple-300 border-purple-400/30';
    }
  };

  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty) {
      case 'EASY': return '🟢';
      case 'MEDIUM': return '🟡';
      case 'HARD': return '🔴';
      default: return '🟣';
    }
  };

  return (
    <motion.div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`
        relative p-3 rounded-xl border transition-all duration-200
        ${task.task_status === 'breakdown' 
          ? 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40' 
          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
        }
      `}>
        {/* Task Content */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">
                {getDifficultyIcon(task.difficulty_level)}
              </span>
              {task.difficulty_level && (
                <span className={`
                  text-xs px-2 py-0.5 rounded-full border font-medium
                  ${getDifficultyColor(task.difficulty_level)}
                `}>
                  {task.difficulty_level}
                </span>
              )}
            </div>
            
            <h4 className="text-white font-medium text-sm leading-relaxed truncate">
              {task.title}
            </h4>
            
            {task.estimated_minutes && (
              <div className="flex items-center gap-1 mt-1 text-slate-400 text-xs">
                <Clock size={10} />
                <span>{task.estimated_minutes}m</span>
              </div>
            )}
          </div>

          {/* The Jobs Magic - Contextual Action */}
          <AnimatePresence>
            {isHovered && task.task_status === 'breakdown' && (
              <motion.button
                initial={{ opacity: 0, x: 10, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                onClick={() => onAddToInbox(task.task_id)}
                disabled={isLoading}
                className="
                  flex items-center gap-1.5 px-3 py-1.5 
                  bg-gradient-to-r from-purple-500 to-pink-500 
                  hover:from-purple-600 hover:to-pink-600
                  text-white text-xs font-medium rounded-lg
                  transition-all duration-200 transform hover:scale-105
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-lg hover:shadow-xl
                "
                title="Add to your schedule"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles size={12} />
                  </motion.div>
                ) : (
                  <>
                    <span>Add</span>
                    <ArrowRight size={12} />
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Subtle Status Indicator */}
        <div className={`
          absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-200
          ${task.task_status === 'breakdown' ? 'bg-purple-500' : 
            task.task_status === 'inbox' ? 'bg-amber-500' :
            task.task_status === 'scheduled' ? 'bg-green-500' : 'bg-slate-500'}
        `} />
      </div>
    </motion.div>
  );
}