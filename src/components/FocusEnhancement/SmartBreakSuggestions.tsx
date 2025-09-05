'use client';

import React, { useState, useEffect } from 'react';
import { Coffee, Zap, Droplets, Dumbbell, Brain, Heart, Sun, Moon } from 'lucide-react';

interface BreakActivity {
  id: string;
  name: string;
  icon: React.ReactNode;
  duration: number; // minutes
  category: 'physical' | 'mental' | 'hydration' | 'rest';
  description: string;
  benefits: string[];
  energyLevel: 'low' | 'medium' | 'high'; // Required energy to do this activity
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any';
}

const BREAK_ACTIVITIES: BreakActivity[] = [
  {
    id: 'water',
    name: 'Hydrate',
    icon: <Droplets className="w-5 h-5" />,
    duration: 2,
    category: 'hydration',
    description: 'Drink a glass of water',
    benefits: ['Improves focus', 'Prevents fatigue', 'Boosts metabolism'],
    energyLevel: 'low',
    timeOfDay: 'any'
  },
  {
    id: 'stretch',
    name: 'Quick Stretch',
    icon: <Dumbbell className="w-5 h-5" />,
    duration: 5,
    category: 'physical',
    description: 'Neck, shoulder, and back stretches',
    benefits: ['Reduces tension', 'Improves posture', 'Increases blood flow'],
    energyLevel: 'low',
    timeOfDay: 'any'
  },
  {
    id: 'walk',
    name: 'Short Walk',
    icon: <Sun className="w-5 h-5" />,
    duration: 10,
    category: 'physical',
    description: 'Walk around the block or office',
    benefits: ['Boosts creativity', 'Improves mood', 'Gets fresh air'],
    energyLevel: 'medium',
    timeOfDay: 'any'
  },
  {
    id: 'meditation',
    name: 'Mini Meditation',
    icon: <Brain className="w-5 h-5" />,
    duration: 5,
    category: 'mental',
    description: 'Brief mindfulness or breathing exercise',
    benefits: ['Reduces stress', 'Improves focus', 'Calms mind'],
    energyLevel: 'low',
    timeOfDay: 'any'
  },
  {
    id: 'snack',
    name: 'Healthy Snack',
    icon: <Coffee className="w-5 h-5" />,
    duration: 5,
    category: 'rest',
    description: 'Eat something nutritious',
    benefits: ['Maintains energy', 'Improves mood', 'Prevents hunger'],
    energyLevel: 'low',
    timeOfDay: 'any'
  },
  {
    id: 'power-nap',
    name: 'Power Nap',
    icon: <Moon className="w-5 h-5" />,
    duration: 15,
    category: 'rest',
    description: '10-15 minute rest with eyes closed',
    benefits: ['Restores energy', 'Improves alertness', 'Reduces fatigue'],
    energyLevel: 'low',
    timeOfDay: 'afternoon'
  },
  {
    id: 'exercise',
    name: 'Quick Exercise',
    icon: <Zap className="w-5 h-5" />,
    duration: 10,
    category: 'physical',
    description: 'Jumping jacks, push-ups, or yoga',
    benefits: ['Boosts energy', 'Improves circulation', 'Releases endorphins'],
    energyLevel: 'high',
    timeOfDay: 'morning'
  },
  {
    id: 'gratitude',
    name: 'Gratitude Moment',
    icon: <Heart className="w-5 h-5" />,
    duration: 3,
    category: 'mental',
    description: 'Think of 3 things you\'re grateful for',
    benefits: ['Improves mood', 'Reduces stress', 'Increases positivity'],
    energyLevel: 'low',
    timeOfDay: 'any'
  }
];

interface SmartBreakSuggestionsProps {
  sessionLength?: number; // minutes of work session
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  userEnergyLevel?: 'low' | 'medium' | 'high';
  onActivitySelect?: (activity: BreakActivity) => void;
}

const SmartBreakSuggestions: React.FC<SmartBreakSuggestionsProps> = ({
  sessionLength = 25,
  timeOfDay,
  userEnergyLevel = 'medium',
  onActivitySelect
}) => {
  const [selectedActivity, setSelectedActivity] = useState<BreakActivity | null>(null);
  const [suggestions, setSuggestions] = useState<BreakActivity[]>([]);
  const [isActivityActive, setIsActivityActive] = useState(false);
  const [activityTimeLeft, setActivityTimeLeft] = useState(0);

  // Determine current time of day if not provided
  const getCurrentTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    if (timeOfDay) return timeOfDay;
    
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  // Generate smart suggestions based on context
  useEffect(() => {
    const currentTimeOfDay = getCurrentTimeOfDay();
    
    // Filter activities based on context
    let filteredActivities = BREAK_ACTIVITIES.filter(activity => {
      // Time of day filter
      if (activity.timeOfDay !== 'any' && activity.timeOfDay !== currentTimeOfDay) {
        return false;
      }
      
      // Energy level filter (don't suggest high-energy activities when user is low energy)
      if (userEnergyLevel === 'low' && activity.energyLevel === 'high') {
        return false;
      }
      
      return true;
    });

    // Sort by relevance
    filteredActivities.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      
      // Prefer activities matching user's energy level
      if (a.energyLevel === userEnergyLevel) scoreA += 2;
      if (b.energyLevel === userEnergyLevel) scoreB += 2;
      
      // Prefer shorter activities for shorter work sessions
      if (sessionLength <= 25) {
        if (a.duration <= 5) scoreA += 1;
        if (b.duration <= 5) scoreB += 1;
      }
      
      // Time-specific bonuses
      if (currentTimeOfDay === 'afternoon' && a.id === 'power-nap') scoreA += 2;
      if (currentTimeOfDay === 'afternoon' && b.id === 'power-nap') scoreB += 2;
      
      if (currentTimeOfDay === 'morning' && a.category === 'physical') scoreA += 1;
      if (currentTimeOfDay === 'morning' && b.category === 'physical') scoreB += 1;
      
      return scoreB - scoreA;
    });

    setSuggestions(filteredActivities.slice(0, 4)); // Top 4 suggestions
  }, [sessionLength, timeOfDay, userEnergyLevel]);

  const startActivity = (activity: BreakActivity) => {
    setSelectedActivity(activity);
    setActivityTimeLeft(activity.duration * 60); // Convert to seconds
    setIsActivityActive(true);
    onActivitySelect?.(activity);
  };

  const stopActivity = () => {
    setIsActivityActive(false);
    setSelectedActivity(null);
    setActivityTimeLeft(0);
  };

  // Activity countdown
  useEffect(() => {
    if (!isActivityActive || activityTimeLeft <= 0) return;

    const interval = setInterval(() => {
      setActivityTimeLeft(prev => {
        if (prev <= 1) {
          setIsActivityActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActivityActive, activityTimeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'physical': return 'text-green-400 bg-green-900/30 border-green-700';
      case 'mental': return 'text-blue-400 bg-blue-900/30 border-blue-700';
      case 'hydration': return 'text-cyan-400 bg-cyan-900/30 border-cyan-700';
      case 'rest': return 'text-purple-400 bg-purple-900/30 border-purple-700';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-700';
    }
  };

  return (
    <>
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            ☕ Smart Break Ideas
          </h3>
          <div className="text-sm text-slate-400">
            {getCurrentTimeOfDay()} • {userEnergyLevel} energy
          </div>
        </div>

        {/* Suggestions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {suggestions.map((activity) => (
            <button
              key={activity.id}
              onClick={() => startActivity(activity)}
              className={`p-4 rounded-lg border text-left transition-all hover:scale-105 ${getCategoryColor(activity.category)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white mb-1">{activity.name}</div>
                  <div className="text-sm opacity-90 mb-2">{activity.description}</div>
                  <div className="flex items-center gap-2 text-xs opacity-75">
                    <span>{activity.duration} min</span>
                    <span>•</span>
                    <span className="capitalize">{activity.category}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Context Info */}
        <div className="p-3 bg-slate-700/50 rounded-lg">
          <div className="text-slate-300 text-sm">
            💡 <strong>Personalized for you:</strong> Based on {sessionLength}-minute work session, 
            {getCurrentTimeOfDay()} time, and {userEnergyLevel} energy level.
          </div>
        </div>
      </div>

      {/* Activity Timer Modal */}
      {isActivityActive && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 max-w-md w-full text-center">
            <div className="mb-4">
              <div className="text-4xl mb-2">{selectedActivity.icon}</div>
              <h3 className="text-2xl font-semibold text-white mb-2">
                {selectedActivity.name}
              </h3>
              <p className="text-slate-300 mb-4">
                {selectedActivity.description}
              </p>
            </div>

            {/* Timer */}
            <div className="mb-6">
              <div className="text-4xl font-mono font-bold text-blue-400 mb-2">
                {formatTime(activityTimeLeft)}
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${((selectedActivity.duration * 60 - activityTimeLeft) / (selectedActivity.duration * 60)) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-6 p-3 bg-slate-700/50 rounded-lg">
              <div className="text-sm text-slate-300">
                <strong>Benefits:</strong> {selectedActivity.benefits.join(' • ')}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              <button
                onClick={stopActivity}
                className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                End Early
              </button>
              <button
                onClick={() => setActivityTimeLeft(selectedActivity.duration * 60)}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SmartBreakSuggestions;