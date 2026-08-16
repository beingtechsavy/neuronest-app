'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import BreakdownTaskItem from './BreakdownTaskItem';
import { useToastContext } from './ToastProvider';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabaseClient';

interface BreakdownTask {
  task_id: number;
  title: string;
  difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD';
  estimated_minutes?: number;
  task_status?: 'breakdown' | 'inbox' | 'scheduled' | 'completed';
}

interface Chapter {
  chapter_id: number;
  title: string;
  completed: boolean;
  ai_generated?: boolean;
}

interface ChapterBreakdownViewProps {
  chapter: Chapter;
  tasks: BreakdownTask[];
  onTaskMoved?: () => void;
}

export default function ChapterBreakdownView({ 
  chapter, 
  tasks, 
  onTaskMoved 
}: ChapterBreakdownViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState<Set<number>>(new Set());
  const { success, error } = useToastContext();
  const user = useUser();

  const breakdownTasks = tasks.filter(t => t.task_status === 'breakdown');
  const inboxTasks = tasks.filter(t => t.task_status === 'inbox');
  const scheduledTasks = tasks.filter(t => t.task_status === 'scheduled');
  const completedTasks = tasks.filter(t => t.task_status === 'completed');

  const handleAddToInbox = async (taskId: number) => {
    if (!user?.id) {
      error('Please log in to move tasks');
      return;
    }

    setLoadingTasks(prev => new Set(prev).add(taskId));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/tasks/move-to-inbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          userId: user.id,
          taskIds: [taskId]
        })
      });

      const result = await response.json();

      if (result.success) {
        success('Added to your schedule! 📅');
        onTaskMoved?.();
      } else {
        error('Failed to add task. Please try again.');
      }
    } catch (err) {
      error('Something went wrong. Please try again.');
    } finally {
      setLoadingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const handleAddAllToInbox = async () => {
    if (breakdownTasks.length === 0) return;
    
    if (!user?.id) {
      error('Please log in to move tasks');
      return;
    }
    
    const taskIds = breakdownTasks.map(t => t.task_id);
    setLoadingTasks(new Set(taskIds));
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/tasks/move-to-inbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          userId: user.id,
          taskIds
        })
      });

      const result = await response.json();

      if (result.success) {
        success(`Added ${result.movedTasks} tasks to your schedule! 🚀`);
        onTaskMoved?.();
      } else {
        error('Failed to add tasks. Please try again.');
      }
    } catch (err) {
      error('Something went wrong. Please try again.');
    } finally {
      setLoadingTasks(new Set());
    }
  };

  if (!chapter.ai_generated || tasks.length === 0) {
    return null; // Don't show for non-AI chapters or empty chapters
  }

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white" size={16} />
            </div>
            <div>
              <h3 className="text-white font-semibold">{chapter.title}</h3>
              <div className="flex items-center gap-3 mt-1">
                <TaskStatusSummary 
                  breakdown={breakdownTasks.length}
                  inbox={inboxTasks.length}
                  scheduled={scheduledTasks.length}
                  completed={completedTasks.length}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Magic Button - Start This Project */}
            {breakdownTasks.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddAllToInbox();
                }}
                disabled={loadingTasks.size > 0}
                className="
                  flex items-center gap-2 px-3 py-1.5
                  bg-gradient-to-r from-purple-500 to-pink-500 
                  hover:from-purple-600 hover:to-pink-600
                  text-white text-sm font-medium rounded-lg
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <Sparkles size={14} />
                <span>Start Project</span>
              </motion.button>
            )}
            
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="text-slate-400" size={20} />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-3">
              {/* Breakdown Tasks */}
              {breakdownTasks.length > 0 && (
                <div>
                  <h4 className="text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full" />
                    Ready to Schedule ({breakdownTasks.length})
                  </h4>
                  <div className="space-y-2">
                    {breakdownTasks.map(task => (
                      <BreakdownTaskItem
                        key={task.task_id}
                        task={task}
                        onAddToInbox={handleAddToInbox}
                        isLoading={loadingTasks.has(task.task_id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Status Tasks (for reference) */}
              {(inboxTasks.length > 0 || scheduledTasks.length > 0 || completedTasks.length > 0) && (
                <div className="pt-3 border-t border-slate-700/50">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {inboxTasks.length > 0 && (
                      <div>
                        <div className="text-amber-400 font-semibold">{inboxTasks.length}</div>
                        <div className="text-slate-400 text-xs">In Schedule</div>
                      </div>
                    )}
                    {scheduledTasks.length > 0 && (
                      <div>
                        <div className="text-green-400 font-semibold">{scheduledTasks.length}</div>
                        <div className="text-slate-400 text-xs">Scheduled</div>
                      </div>
                    )}
                    {completedTasks.length > 0 && (
                      <div>
                        <div className="text-blue-400 font-semibold">{completedTasks.length}</div>
                        <div className="text-slate-400 text-xs">Completed</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper component for status summary
function TaskStatusSummary({ 
  breakdown, 
  inbox, 
  scheduled, 
  completed 
}: { 
  breakdown: number;
  inbox: number; 
  scheduled: number;
  completed: number;
}) {
  const total = breakdown + inbox + scheduled + completed;
  const progress = total > 0 ? ((scheduled + completed) / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {breakdown > 0 && (
          <span className="text-purple-400 text-xs font-medium">
            {breakdown} ready
          </span>
        )}
        {inbox > 0 && (
          <span className="text-amber-400 text-xs font-medium">
            • {inbox} scheduled
          </span>
        )}
        {completed > 0 && (
          <span className="text-green-400 text-xs font-medium">
            • {completed} done
          </span>
        )}
      </div>
      
      {total > 0 && (
        <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-green-500 to-blue-500"
          />
        </div>
      )}
    </div>
  );
}