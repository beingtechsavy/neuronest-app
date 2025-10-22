'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIInsights, AIInsight } from '@/hooks/useAIInsights';
import { AnalyticsData } from '@/hooks/useAnalytics';
import { TodayStats } from '@/hooks/useTodayAnalytics';
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Lightbulb, 
  ArrowRight, 
  RefreshCw,
  Zap,
  Target,
  Heart,
  Star,
  ChevronRight,
  Info
} from 'lucide-react';

interface AIInsightsPanelProps {
  analytics: AnalyticsData | null;
  todayStats: TodayStats;
}

const InsightCard = ({ insight, index, onAction }: { 
  insight: AIInsight; 
  index: number;
  onAction?: (insight: AIInsight) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-500/20 to-orange-500/20 border-red-500/30';
      case 'medium': return 'from-blue-500/20 to-purple-500/20 border-blue-500/30';
      case 'low': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      default: return 'from-gray-500/20 to-slate-500/20 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'productivity': return <TrendingUp size={16} className="text-blue-400" />;
      case 'pattern': return <Brain size={16} className="text-purple-400" />;
      case 'prediction': return <Zap size={16} className="text-yellow-400" />;
      case 'encouragement': return <Heart size={16} className="text-pink-400" />;
      case 'optimization': return <Target size={16} className="text-green-400" />;
      default: return <Lightbulb size={16} className="text-orange-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`
        relative bg-gradient-to-br ${getPriorityColor(insight.priority)} 
        backdrop-blur-md border rounded-2xl p-4 cursor-pointer
        hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300
        group overflow-hidden
      `}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <motion.div 
            className="text-2xl mt-0.5"
            animate={{ 
              rotate: isExpanded ? [0, 10, -10, 0] : 0,
              scale: isExpanded ? [1, 1.1, 1] : 1
            }}
            transition={{ duration: 0.5 }}
          >
            {insight.icon}
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {getTypeIcon(insight.type)}
              <h4 className="font-semibold text-white text-sm truncate">
                {insight.title}
              </h4>
              <div className="flex items-center gap-1 ml-auto">
                <div className={`
                  w-2 h-2 rounded-full 
                  ${insight.priority === 'high' ? 'bg-red-400' : 
                    insight.priority === 'medium' ? 'bg-blue-400' : 'bg-green-400'}
                `} />
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight size={16} className="text-gray-400" />
                </motion.div>
              </div>
            </div>
            
            <p className="text-sm text-gray-200 leading-relaxed">
              {insight.message}
            </p>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-white/10">
                {/* Confidence & Category */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {insight.confidence}% confidence • {insight.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i}
                        size={12} 
                        className={`
                          ${i < Math.floor(insight.confidence / 20) 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-600'
                          }
                        `} 
                      />
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                {insight.actionable && onAction && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction(insight);
                    }}
                    className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Target size={14} />
                    Take Action
                    <ArrowRight size={14} />
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
    </motion.div>
  );
};

export default function AIInsightsPanel({ analytics, todayStats }: AIInsightsPanelProps) {
  const { insights, loading, refreshInsights } = useAIInsights(analytics, todayStats);
  const [showAll, setShowAll] = useState(false);

  const handleInsightAction = (insight: AIInsight) => {
    // Handle different types of actions based on insight category
    switch (insight.category) {
      case 'focus':
        window.location.href = '/focus-session';
        break;
      case 'timing':
        window.location.href = '/calendar';
        break;
      case 'habits':
        window.location.href = '/tasks';
        break;
      case 'progress':
        window.location.href = '/dashboard';
        break;
      default:
        // Show a motivational toast or modal
        console.log('Insight action:', insight.title);
    }
  };

  const displayedInsights = showAll ? insights : insights.slice(0, 3);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Brain className="text-indigo-400" size={24} />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Insights</h3>
            <p className="text-sm text-indigo-200">🧠 Analyzing your ADHD patterns...</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2 }}
              className="bg-white/5 rounded-xl p-4 relative overflow-hidden"
            >
              <motion.div
                animate={{ x: [-100, 300] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />
              <div className="flex items-center gap-3 relative z-10">
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                  className="w-8 h-8 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full flex items-center justify-center"
                >
                  {['🧠', '⚡', '🎯'][i]}
                </motion.div>
                <div className="flex-1">
                  <div className="w-3/4 h-4 bg-white/10 rounded mb-2" />
                  <div className="w-full h-3 bg-white/5 rounded" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-indigo-300">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-indigo-400 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              className="w-2 h-2 bg-purple-400 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              className="w-2 h-2 bg-pink-400 rounded-full"
            />
          </div>
          <p className="text-xs text-indigo-300 mt-2">Crafting insights just for you...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-md border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/10 to-transparent rounded-full blur-2xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Brain className="text-indigo-400" size={24} />
            </motion.div>
            <div>
              <h3 className="text-lg font-semibold text-white">AI Insights</h3>
              <p className="text-sm text-indigo-200">Personalized for your ADHD brain</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={refreshInsights}
            className="p-2 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-xl border border-indigo-500/30 transition-colors"
            title="Refresh insights"
          >
            <RefreshCw size={16} className="text-indigo-300" />
          </motion.button>
        </div>

        {/* Insights Grid */}
        {insights.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {displayedInsights.map((insight, index) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  index={index}
                  onAction={handleInsightAction}
                />
              ))}
            </AnimatePresence>

            {/* Show More/Less Button */}
            {insights.length > 3 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAll(!showAll)}
                className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                {showAll ? 'Show Less' : `Show ${insights.length - 3} More Insights`}
                <motion.div
                  animate={{ rotate: showAll ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight size={16} />
                </motion.div>
              </motion.button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Brain className="mx-auto mb-4 text-indigo-400" size={48} />
            </motion.div>
            <h4 className="text-lg font-semibold text-white mb-2">
              AI Brain Warming Up...
            </h4>
            <p className="text-indigo-200 text-sm">
              🧠 Generating your personalized insights in 3... 2... 1...
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refreshInsights}
              className="mt-4 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl text-indigo-300 text-sm font-medium transition-all"
            >
              <Sparkles size={16} className="inline mr-2" />
              Activate AI Insights
            </motion.button>
          </div>
        )}

        {/* Powered by indicator */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 text-xs text-indigo-300">
            <Sparkles size={12} />
            <span>Powered by ADHD-optimized AI</span>
            <Sparkles size={12} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}