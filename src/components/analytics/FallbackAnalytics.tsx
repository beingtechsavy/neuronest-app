'use client';

import { motion } from 'framer-motion';
import { Brain, Sparkles, TrendingUp, Target, RefreshCw } from 'lucide-react';

interface FallbackAnalyticsProps {
  onRetry: () => void;
}

export default function FallbackAnalytics({ onRetry }: FallbackAnalyticsProps) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Sparkles className="text-purple-400" size={32} />
          <h1 className="text-3xl font-bold text-white">Your Progress</h1>
        </motion.div>
        
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Retry
        </motion.button>
      </div>

      {/* Demo Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-md border border-purple-500/20 rounded-2xl p-8 overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/10 to-transparent rounded-full blur-2xl" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex-1">
            <motion.h1 
              className="text-3xl font-bold text-white mb-2 flex items-center gap-3"
            >
              <Brain className="text-purple-400" size={32} />
              Getting Ready...
            </motion.h1>
            
            <motion.p 
              className="text-lg text-purple-200 mb-4"
            >
              🚀 Setting up your personalized analytics dashboard!
            </motion.p>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-300">
                Loading your progress data...
              </div>
            </div>
            
            {/* Continue button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-white font-medium flex items-center gap-2 transition-all duration-200 shadow-lg"
              onClick={() => window.location.href = '/dashboard'}
            >
              <Target size={20} />
              Go to Dashboard
            </motion.button>
          </div>
          
          <div className="ml-8">
            <div className="relative w-32 h-32">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-full h-full border-4 border-purple-500/30 border-t-purple-500 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl">🧠</div>
                  <div className="text-xs text-gray-400">Loading</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Demo Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-gradient-to-br from-orange-900/50 to-red-900/50 backdrop-blur-md border border-orange-500/20 rounded-2xl p-6 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-transparent rounded-full blur-xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-orange-400 text-2xl">🔥</div>
              <h3 className="text-lg font-semibold text-white">Study Streak</h3>
            </div>
            
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">🎯</div>
              <div className="text-3xl font-bold text-orange-400 mb-1">
                --
              </div>
              <div className="text-sm text-gray-300">
                days
              </div>
            </div>
            
            <p className="text-sm text-orange-200 text-center mb-4">
              Ready to start your streak?
            </p>
            
            <div className="text-xs text-gray-400 text-center">
              Loading streak data...
            </div>
          </div>
        </motion.div>

        {/* Weekly Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-md border border-green-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-green-400" size={24} />
            <h3 className="text-lg font-semibold text-white">This Week</h3>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div key={day} className="text-center">
                <div className="text-xs text-gray-400 mb-2">{day}</div>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ delay: index * 0.1, duration: 2, repeat: Infinity }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-gray-700 text-gray-500"
                >
                  --
                </motion.div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <div className="text-sm text-green-200">
              Loading weekly data...
            </div>
          </div>
        </motion.div>

        {/* Recent Wins */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-yellow-900/50 to-orange-900/50 backdrop-blur-md border border-yellow-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="text-yellow-400 text-2xl">🏆</div>
            <h3 className="text-lg font-semibold text-white">Recent Wins</h3>
          </div>
          
          <div className="space-y-3">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
            >
              <span className="text-2xl">🌟</span>
              <span className="text-sm text-yellow-400 font-medium">
                Ready to create some wins today!
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Info Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center p-6 bg-slate-800/30 rounded-2xl border border-slate-700"
      >
        <div className="text-4xl mb-4">🚀</div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Analytics Loading
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          We're setting up your personalized analytics dashboard. This usually takes just a moment!
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
        </div>
      </motion.div>
    </div>
  );
}