import { useState, useEffect, useCallback } from 'react';
import { AnalyticsData } from './useAnalytics';
import { TodayStats } from './useTodayAnalytics';

export interface AIInsight {
  id: string;
  type: 'productivity' | 'pattern' | 'prediction' | 'encouragement' | 'optimization';
  icon: string;
  title: string;
  message: string;
  actionable: boolean;
  confidence: number; // 0-100
  priority: 'low' | 'medium' | 'high';
  category: 'focus' | 'timing' | 'habits' | 'progress' | 'wellbeing';
}

export function useAIInsights(analytics: AnalyticsData | null, todayStats: TodayStats) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);

  const generateInsights = useCallback(() => {
    const insights: AIInsight[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[dayOfWeek];

    // Always show fun, engaging insights regardless of data availability
    
    // 🌅 Time-based insights (always available)
    if (currentHour >= 6 && currentHour < 12) {
      insights.push({
        id: 'morning-energy',
        type: 'encouragement',
        icon: '🌅',
        title: 'Morning Brain Power!',
        message: `Good morning! Your ADHD brain is naturally more focused in the morning. This is prime time for tackling your biggest challenges!`,
        actionable: true,
        confidence: 90,
        priority: 'high',
        category: 'timing'
      });
    } else if (currentHour >= 12 && currentHour < 17) {
      insights.push({
        id: 'afternoon-momentum',
        type: 'productivity',
        icon: '⚡',
        title: 'Afternoon Power Hour!',
        message: `Perfect timing! Your brain is ready for focused work. Try a 25-minute focus session to maximize your productivity!`,
        actionable: true,
        confidence: 85,
        priority: 'high',
        category: 'focus'
      });
    } else if (currentHour >= 17 && currentHour < 21) {
      insights.push({
        id: 'evening-reflection',
        type: 'encouragement',
        icon: '🌆',
        title: 'Evening Reflection Time!',
        message: `Great time to review your day and plan tomorrow. Your ADHD brain loves structure and preparation!`,
        actionable: true,
        confidence: 80,
        priority: 'medium',
        category: 'wellbeing'
      });
    } else {
      insights.push({
        id: 'night-rest',
        type: 'encouragement',
        icon: '🌙',
        title: 'Rest & Recharge!',
        message: `Your brain has worked hard today! Quality sleep is crucial for ADHD brains to reset and prepare for tomorrow's adventures.`,
        actionable: false,
        confidence: 95,
        priority: 'medium',
        category: 'wellbeing'
      });
    }

    // 📅 Day-specific insights (always fun!)
    if (dayOfWeek === 1) { // Monday
      insights.push({
        id: 'monday-fresh-start',
        type: 'encouragement',
        icon: '🚀',
        title: 'Fresh Week, Fresh Possibilities!',
        message: `Mondays are magic for ADHD brains! New beginnings trigger dopamine. Set one small goal and watch the momentum build!`,
        actionable: true,
        confidence: 88,
        priority: 'high',
        category: 'habits'
      });
    } else if (dayOfWeek === 3) { // Wednesday
      insights.push({
        id: 'wednesday-midweek',
        type: 'productivity',
        icon: '🎯',
        title: 'Midweek Momentum!',
        message: `Wednesday is your secret weapon! Research shows ADHD brains hit peak performance midweek. Time to tackle that important task!`,
        actionable: true,
        confidence: 82,
        priority: 'medium',
        category: 'timing'
      });
    } else if (dayOfWeek === 5) { // Friday
      insights.push({
        id: 'friday-celebration',
        type: 'encouragement',
        icon: '🎉',
        title: 'Friday Victory Lap!',
        message: `You made it to Friday! Your ADHD brain deserves celebration. Finish strong and reward yourself for this week's efforts!`,
        actionable: false,
        confidence: 95,
        priority: 'medium',
        category: 'wellbeing'
      });
    } else if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
      insights.push({
        id: 'weekend-recharge',
        type: 'encouragement',
        icon: '🌟',
        title: 'Weekend Recharge Mode!',
        message: `Weekends are perfect for ADHD brains to explore interests and recharge. Follow your curiosity - it's your superpower!`,
        actionable: true,
        confidence: 90,
        priority: 'low',
        category: 'wellbeing'
      });
    }

    // 🧠 ADHD-specific tips (educational and fun)
    insights.push({
      id: 'adhd-brain-fact',
      type: 'pattern',
      icon: '🧠',
      title: 'Your Amazing ADHD Brain!',
      message: `Did you know? ADHD brains have 3x more creativity and are excellent at thinking outside the box. Your different wiring is actually a superpower!`,
      actionable: false,
      confidence: 100,
      priority: 'medium',
      category: 'wellbeing'
    });

    // 🎯 Focus tips (always helpful)
    insights.push({
      id: 'focus-technique',
      type: 'optimization',
      icon: '🎯',
      title: 'Focus Hack of the Day!',
      message: `Try the "2-minute rule": If something takes less than 2 minutes, do it now! This prevents task buildup and gives you quick dopamine wins.`,
      actionable: true,
      confidence: 85,
      priority: 'medium',
      category: 'focus'
    });

    // 💪 Motivation boost (everyone needs this)
    const motivationalInsights = [
      {
        id: 'daily-motivation-1',
        icon: '💪',
        title: 'You\'re Stronger Than You Think!',
        message: `Every day you manage ADHD, you\'re building incredible mental resilience. You\'re literally training your brain to be more focused and organized!`
      },
      {
        id: 'daily-motivation-2', 
        icon: '⭐',
        title: 'Progress Over Perfection!',
        message: `Your ADHD brain doesn\'t need to be perfect - it needs to be progressing. Every small step forward is rewiring your neural pathways for success!`
      },
      {
        id: 'daily-motivation-3',
        icon: '🌈',
        title: 'Embrace Your Unique Rhythm!',
        message: `Your brain works differently, and that\'s beautiful! Some days you\'ll hyperfocus, others you\'ll struggle. Both are part of your amazing ADHD journey.`
      }
    ];

    const randomMotivation = motivationalInsights[Math.floor(Math.random() * motivationalInsights.length)];
    insights.push({
      ...randomMotivation,
      type: 'encouragement',
      actionable: false,
      confidence: 95,
      priority: 'medium',
      category: 'wellbeing'
    });

    // If we have analytics data, add data-driven insights
    if (analytics) {

      // 🧠 ADHD-Specific Productivity Patterns
      if (analytics.productivityHeatmap.length > 7) {
        const morningTasks = analytics.productivityHeatmap.filter(d => {
          const date = new Date(d.date);
          return date.getHours() < 12;
        });
        
        if (morningTasks.length > 0) {
          const avgMorningProductivity = morningTasks.reduce((sum, d) => sum + d.focusScore, 0) / morningTasks.length;
          
          if (avgMorningProductivity > 70) {
            insights.push({
              id: 'morning-productivity',
              type: 'pattern',
              icon: '🌅',
              title: 'You\'re a Morning Warrior!',
              message: `Your ADHD brain is ${Math.round(avgMorningProductivity)}% more focused in the morning. Schedule your hardest tasks before noon!`,
              actionable: true,
              confidence: 85,
              priority: 'high',
              category: 'timing'
            });
          }
        }
      }

      // 🔥 Streak Momentum Insights
      if (analytics.studyStreak.currentStreak >= 3) {
        const streakPower = Math.min(100, analytics.studyStreak.currentStreak * 10);
        insights.push({
          id: 'streak-momentum',
          type: 'encouragement',
          icon: '🚀',
          title: 'Unstoppable Momentum!',
          message: `Your ${analytics.studyStreak.currentStreak}-day streak is building serious neural pathways. You're ${streakPower}% more likely to succeed today!`,
          actionable: false,
          confidence: 90,
          priority: 'high',
          category: 'habits'
        });
      }

    // 📊 Weekly Pattern Recognition
    if (analytics.weeklyProgress.length >= 4) {
      const recentWeeks = analytics.weeklyProgress.slice(-4);
      const avgCompletion = recentWeeks.reduce((sum, w) => sum + w.completionRate, 0) / recentWeeks.length;
      
      if (avgCompletion > 75) {
        insights.push({
          id: 'weekly-consistency',
          type: 'pattern',
          icon: '📈',
          title: 'Consistency Champion!',
          message: `You've maintained ${Math.round(avgCompletion)}% completion rate for 4 weeks. Your ADHD brain is adapting beautifully!`,
          actionable: false,
          confidence: 95,
          priority: 'medium',
          category: 'progress'
        });
      }
    }

    // 🎯 Task Completion Patterns
    if (todayStats.progress > 0) {
      const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';
      insights.push({
        id: 'daily-progress',
        type: 'productivity',
        icon: '⚡',
        title: `${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Progress Update`,
        message: `You're ${Math.round(todayStats.progress)}% done with today's tasks. ${todayStats.progress > 50 ? 'Amazing momentum!' : 'Perfect time for a focus session!'}`,
        actionable: todayStats.progress < 50,
        confidence: 100,
        priority: todayStats.progress < 25 ? 'high' : 'medium',
        category: 'focus'
      });
    }

    // 🧠 Focus Time Optimization
    if (todayStats.focusTimeToday > 0) {
      const focusHours = Math.floor(todayStats.focusTimeToday / 60);
      const focusMinutes = todayStats.focusTimeToday % 60;
      
      if (todayStats.focusTimeToday >= 120) { // 2+ hours
        insights.push({
          id: 'deep-focus-achieved',
          type: 'encouragement',
          icon: '🧠',
          title: 'Deep Work Master!',
          message: `${focusHours}h ${focusMinutes}m of focused work today! Your ADHD brain is in the zone. This is when breakthroughs happen!`,
          actionable: false,
          confidence: 100,
          priority: 'high',
          category: 'focus'
        });
      } else if (todayStats.focusTimeToday >= 30) {
        insights.push({
          id: 'focus-streak-active',
          type: 'encouragement',
          icon: '🎯',
          title: 'Streak Secured!',
          message: `${focusHours > 0 ? `${focusHours}h ` : ''}${focusMinutes}m focused today. Your streak is safe! Keep the momentum going.`,
          actionable: true,
          confidence: 90,
          priority: 'medium',
          category: 'habits'
        });
      }
    }

    // 📅 Day-of-Week Insights
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[dayOfWeek];
    
    if (dayOfWeek === 1) { // Monday
      insights.push({
        id: 'monday-motivation',
        type: 'encouragement',
        icon: '💪',
        title: 'Monday Momentum!',
        message: 'Fresh week, fresh start! Your ADHD brain loves new beginnings. Set the tone for an amazing week!',
        actionable: true,
        confidence: 80,
        priority: 'medium',
        category: 'wellbeing'
      });
    } else if (dayOfWeek === 5) { // Friday
      insights.push({
        id: 'friday-finish-strong',
        type: 'encouragement',
        icon: '🏁',
        title: 'Friday Finish Line!',
        message: 'You\'ve made it to Friday! Finish strong and celebrate your week\'s achievements. You\'ve earned it!',
        actionable: true,
        confidence: 85,
        priority: 'medium',
        category: 'wellbeing'
      });
    }

    // 🎨 Subject Mastery Insights
    if (analytics.subjectStats.length > 0) {
      const masteredSubjects = analytics.subjectStats.filter(s => s.completionRate >= 90);
      const strugglingSubjects = analytics.subjectStats.filter(s => s.completionRate < 30 && s.totalTasks > 0);
      
      if (masteredSubjects.length > 0) {
        insights.push({
          id: 'subject-mastery',
          type: 'encouragement',
          icon: '🏆',
          title: 'Subject Mastery Unlocked!',
          message: `You've mastered ${masteredSubjects.length} subject${masteredSubjects.length === 1 ? '' : 's'}! Your expertise is growing exponentially.`,
          actionable: false,
          confidence: 100,
          priority: 'high',
          category: 'progress'
        });
      }
      
      if (strugglingSubjects.length > 0 && masteredSubjects.length > 0) {
        insights.push({
          id: 'subject-strategy',
          type: 'optimization',
          icon: '🎯',
          title: 'Strategic Focus Opportunity',
          message: `Apply your mastery techniques from ${masteredSubjects[0].subject_title} to boost progress in ${strugglingSubjects[0].subject_title}!`,
          actionable: true,
          confidence: 75,
          priority: 'medium',
          category: 'focus'
        });
      }
    }

    // 🌟 Personalized Encouragement Based on Time
    if (currentHour >= 20) { // Evening
      if (todayStats.progress >= 70) {
        insights.push({
          id: 'evening-celebration',
          type: 'encouragement',
          icon: '🌟',
          title: 'Evening Victory!',
          message: 'What an incredible day! You\'ve accomplished so much. Time to rest and recharge for tomorrow\'s adventures.',
          actionable: false,
          confidence: 100,
          priority: 'low',
          category: 'wellbeing'
        });
      } else if (todayStats.progress > 0) {
        insights.push({
          id: 'evening-progress',
          type: 'encouragement',
          icon: '🌙',
          title: 'Progress is Progress!',
          message: 'Every step forward counts. You\'ve made progress today, and that\'s what matters. Tomorrow is full of possibilities!',
          actionable: false,
          confidence: 90,
          priority: 'medium',
          category: 'wellbeing'
        });
      }
    }

      // 🚀 Predictive Insights
      if (analytics.studyStreak.currentStreak > 0 && todayStats.focusTimeToday < 30) {
        const timeLeft = 24 - currentHour;
        insights.push({
          id: 'streak-protection',
          type: 'prediction',
          icon: '⚠️',
          title: 'Streak Protection Alert!',
          message: `You have ${timeLeft} hours to maintain your ${analytics.studyStreak.currentStreak}-day streak. Just 30 minutes of focus will secure it!`,
          actionable: true,
          confidence: 95,
          priority: 'high',
          category: 'habits'
        });
      }
    } // Close the analytics if block

    // 🎨 Fun contextual insights (always available)
    const month = now.getMonth();
    const seasonalInsights = [
      // Spring (March, April, May)
      ...(month >= 2 && month <= 4 ? [{
        id: 'spring-energy',
        type: 'encouragement' as const,
        icon: '🌸',
        title: 'Spring Brain Boost!',
        message: `Spring is here! Your ADHD brain loves new beginnings and fresh energy. Perfect time to start that project you've been thinking about!`,
        actionable: true,
        confidence: 85,
        priority: 'medium' as const,
        category: 'wellbeing' as const
      }] : []),
      
      // Summer (June, July, August)
      ...(month >= 5 && month <= 7 ? [{
        id: 'summer-focus',
        type: 'productivity' as const,
        icon: '☀️',
        title: 'Summer Focus Power!',
        message: `Longer days = more opportunities! Your ADHD brain can take advantage of extended daylight for better focus and mood.`,
        actionable: true,
        confidence: 80,
        priority: 'medium' as const,
        category: 'timing' as const
      }] : []),
      
      // Fall (September, October, November)
      ...(month >= 8 && month <= 10 ? [{
        id: 'fall-organization',
        type: 'optimization' as const,
        icon: '🍂',
        title: 'Fall Organization Mode!',
        message: `Fall vibes activate your ADHD brain's organizing superpowers! Perfect time to declutter and create systems that work for you.`,
        actionable: true,
        confidence: 88,
        priority: 'medium' as const,
        category: 'focus' as const
      }] : []),
      
      // Winter (December, January, February)
      ...(month >= 11 || month <= 1 ? [{
        id: 'winter-cozy-focus',
        type: 'encouragement' as const,
        icon: '❄️',
        title: 'Cozy Focus Season!',
        message: `Winter is perfect for deep work! Your ADHD brain loves cozy environments. Create a warm, comfortable workspace and dive deep!`,
        actionable: true,
        confidence: 82,
        priority: 'medium' as const,
        category: 'focus' as const
      }] : [])
    ];

    insights.push(...seasonalInsights);

    // 🎲 Random ADHD life hacks (rotate daily)
    const dailyHacks = [
      {
        id: 'body-doubling',
        type: 'optimization' as const,
        icon: '👥',
        title: 'Body Doubling Magic!',
        message: `Try working alongside someone (virtually or in person)! ADHD brains focus better with "body doubling" - even if you're doing different tasks.`,
        actionable: true,
        confidence: 90,
        priority: 'medium' as const,
        category: 'focus' as const
      },
      {
        id: 'fidget-power',
        type: 'optimization' as const,
        icon: '🎯',
        title: 'Fidget for Focus!',
        message: `Keep your hands busy to help your brain focus! Stress balls, fidget toys, or even doodling can improve ADHD concentration by 20%!`,
        actionable: true,
        confidence: 85,
        priority: 'medium' as const,
        category: 'focus' as const
      },
      {
        id: 'music-hack',
        type: 'optimization' as const,
        icon: '🎵',
        title: 'Sound Strategy!',
        message: `Experiment with background sounds! Some ADHD brains love white noise, others prefer instrumental music. Find your focus soundtrack!`,
        actionable: true,
        confidence: 88,
        priority: 'medium' as const,
        category: 'focus' as const
      },
      {
        id: 'movement-break',
        type: 'optimization' as const,
        icon: '🚶',
        title: 'Movement = Brain Fuel!',
        message: `Take a 5-minute walk or do jumping jacks! Movement increases dopamine and norepinephrine - exactly what ADHD brains need to focus.`,
        actionable: true,
        confidence: 92,
        priority: 'medium' as const,
        category: 'focus' as const
      }
    ];

    // Add one random hack per day
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const todaysHack = dailyHacks[dayOfYear % dailyHacks.length];
    insights.push(todaysHack);

    // 🌟 Confidence booster (always end on a high note)
    insights.push({
      id: 'daily-affirmation',
      type: 'encouragement',
      icon: '✨',
      title: 'You\'re Doing Amazing!',
      message: `Remember: Your ADHD brain is not broken, it's just different. You have unique strengths like creativity, hyperfocus, and innovative thinking!`,
      actionable: false,
      confidence: 100,
      priority: 'low',
      category: 'wellbeing'
    });

    // Sort by priority and confidence
    return insights.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority];
      const bPriority = priorityWeight[b.priority];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      return b.confidence - a.confidence;
    }).slice(0, 6); // Limit to top 6 insights
  }, [analytics, todayStats]);

  useEffect(() => {
    setLoading(true);
    const newInsights = generateInsights();
    setInsights(newInsights);
    setLoading(false);
  }, [generateInsights]);

  return {
    insights,
    loading,
    refreshInsights: () => {
      const newInsights = generateInsights();
      setInsights(newInsights);
    }
  };
}