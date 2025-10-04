'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Clock, Zap, ChevronRight } from 'lucide-react';
import { useFocusSessionTasks, TaskOption } from '@/hooks/useFocusSessionTasks';

interface TaskSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (task: TaskOption | null) => void;
}

export default function TaskSelectionModal({ isOpen, onClose, onSelectTask }: TaskSelectionModalProps) {
  const { smartSuggestions, lastTask, loading } = useFocusSessionTasks();

  const handleSelect = (task: TaskOption | null) => {
    onSelectTask(task);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="text-purple-400" size={24} />
                    What are you working on?
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="text-gray-400" size={20} />
                  </button>
                </div>
                <p className="text-sm text-gray-400">
                  Select a task to track your focus time
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(80vh-200px)]">
                {/* Quick Continue - Last Task */}
                {lastTask && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="text-yellow-400" size={16} />
                      <h3 className="text-sm font-medium text-gray-300">Quick Continue</h3>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect(lastTask)}
                      className="w-full p-4 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-xl text-left hover:border-yellow-500/50 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: lastTask.subject_color }}
                          />
                          <div className="flex-1">
                            <div className="text-white font-medium mb-1">{lastTask.title}</div>
                            <div className="text-xs text-gray-400">
                              {lastTask.subject_title} • {lastTask.chapter_title}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="text-yellow-400 group-hover:translate-x-1 transition-transform" size={20} />
                      </div>
                    </motion.button>
                  </div>
                )}

                {/* Smart Suggestions */}
                {smartSuggestions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="text-blue-400" size={16} />
                      <h3 className="text-sm font-medium text-gray-300">Suggested Tasks</h3>
                    </div>
                    <div className="space-y-2">
                      {smartSuggestions.map((task) => (
                        <motion.button
                          key={task.task_id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelect(task)}
                          className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-left hover:border-slate-600 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: task.subject_color }}
                              />
                              <div className="flex-1">
                                <div className="text-white font-medium mb-1">{task.title}</div>
                                <div className="text-xs text-gray-400 flex items-center gap-2">
                                  <span>{task.subject_title}</span>
                                  {task.is_today && (
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                                      Today
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="text-gray-400 group-hover:translate-x-1 transition-transform" size={20} />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Study Option */}
                <div>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-slate-900 text-gray-500">or</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(null)}
                    className="w-full p-4 bg-slate-800/30 border border-slate-700 rounded-xl text-left hover:border-purple-500/50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <BookOpen className="text-purple-400" size={20} />
                        </div>
                        <div>
                          <div className="text-white font-medium mb-1">General Study</div>
                          <div className="text-xs text-gray-400">
                            Focus without a specific task
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="text-purple-400 group-hover:translate-x-1 transition-transform" size={20} />
                    </div>
                  </motion.button>
                </div>

                {loading && (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-400">Loading tasks...</div>
                  </div>
                )}

                {!loading && smartSuggestions.length === 0 && !lastTask && (
                  <div className="text-center py-8">
                    <BookOpen className="mx-auto mb-3 text-gray-600" size={48} />
                    <p className="text-gray-400 text-sm mb-2">No tasks available</p>
                    <p className="text-gray-500 text-xs">
                      Create some tasks to track your focus time
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                <p className="text-xs text-center text-gray-500">
                  💡 Your focus time will be automatically tracked
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}