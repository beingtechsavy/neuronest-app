'use client';

import { useState, useRef } from 'react';
import { motion, PanInfo, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Clock, TrendingUp } from 'lucide-react';

interface TimeRange {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
}

interface GestureAnalyticsViewProps {
  children: (timeRange: TimeRange) => React.ReactNode;
}

const timeRanges: TimeRange[] = [
  {
    id: 'today',
    label: 'Today\'s Progress',
    shortLabel: 'Today',
    icon: <Clock size={20} />,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'week',
    label: 'This Week',
    shortLabel: 'Week',
    icon: <Calendar size={20} />,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'month',
    label: 'This Month',
    shortLabel: 'Month',
    icon: <TrendingUp size={20} />,
    color: 'from-purple-500 to-pink-500'
  }
];

export default function GestureAnalyticsView({ children }: GestureAnalyticsViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const constraintsRef = useRef(null);

  const currentTimeRange = timeRanges[currentIndex];

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    
    if (info.offset.x > threshold && currentIndex > 0) {
      // Swipe right - go to previous
      setCurrentIndex(currentIndex - 1);
      setDragDirection('right');
    } else if (info.offset.x < -threshold && currentIndex < timeRanges.length - 1) {
      // Swipe left - go to next
      setCurrentIndex(currentIndex + 1);
      setDragDirection('left');
    }
    
    setTimeout(() => setDragDirection(null), 300);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setDragDirection('right');
      setTimeout(() => setDragDirection(null), 300);
    }
  };

  const goToNext = () => {
    if (currentIndex < timeRanges.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDragDirection('left');
      setTimeout(() => setDragDirection(null), 300);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Header with time range selector */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className={`
            p-3 rounded-xl transition-all duration-200
            ${currentIndex === 0 
              ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed' 
              : 'bg-white/10 hover:bg-white/20 text-white'
            }
          `}
        >
          <ChevronLeft size={20} />
        </motion.button>

        <div className="flex-1 mx-4">
          <motion.div
            key={currentTimeRange.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="text-center"
          >
            <div className={`
              inline-flex items-center gap-3 px-6 py-3 rounded-2xl
              bg-gradient-to-r ${currentTimeRange.color} bg-opacity-20
              border border-white/20 backdrop-blur-md
            `}>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {currentTimeRange.icon}
              </motion.div>
              <h2 className="text-xl font-bold text-white">
                {currentTimeRange.label}
              </h2>
            </div>
          </motion.div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {timeRanges.map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => setCurrentIndex(index)}
                className={`
                  w-2 h-2 rounded-full transition-all duration-200
                  ${index === currentIndex 
                    ? 'bg-white shadow-lg shadow-white/30' 
                    : 'bg-white/30 hover:bg-white/50'
                  }
                `}
              />
            ))}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToNext}
          disabled={currentIndex === timeRanges.length - 1}
          className={`
            p-3 rounded-xl transition-all duration-200
            ${currentIndex === timeRanges.length - 1
              ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed' 
              : 'bg-white/10 hover:bg-white/20 text-white'
            }
          `}
        >
          <ChevronRight size={20} />
        </motion.button>
      </div>

      {/* Swipeable content area */}
      <div ref={constraintsRef} className="relative">
        <motion.div
          drag="x"
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing"
          whileDrag={{ scale: 0.98 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTimeRange.id}
              initial={{ 
                opacity: 0, 
                x: dragDirection === 'left' ? 100 : dragDirection === 'right' ? -100 : 0,
                scale: 0.95
              }}
              animate={{ 
                opacity: 1, 
                x: 0,
                scale: 1
              }}
              exit={{ 
                opacity: 0, 
                x: dragDirection === 'left' ? -100 : dragDirection === 'right' ? 100 : 0,
                scale: 0.95
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                opacity: { duration: 0.2 }
              }}
              className="min-h-[400px]"
            >
              {children(currentTimeRange)}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Swipe hint */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center"
        >
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ChevronLeft size={12} />
            <span>Swipe to navigate</span>
            <ChevronRight size={12} />
          </div>
        </motion.div>
      </div>

      {/* Quick access tabs */}
      <div className="flex justify-center gap-2 mt-6">
        {timeRanges.map((range, index) => (
          <motion.button
            key={range.id}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentIndex(index)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${index === currentIndex
                ? `bg-gradient-to-r ${range.color} text-white shadow-lg`
                : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              }
            `}
          >
            <div className="flex items-center gap-2">
              {range.icon}
              <span>{range.shortLabel}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Touch feedback */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}