'use client';

import React, { useState } from 'react';
import PomodoroTimer from '@/components/PomodoroTimer';
import { Clock, TrendingUp, Target } from 'lucide-react';

type TimerState = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroSession {
  id: string;
  type: TimerState;
  duration: number;
  completedAt: Date;
}

export default function PomodoroPage() {
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [totalFocusTime, setTotalFocusTime] = useState(0);

  const handleSessionComplete = (type: TimerState, duration: number) => {
    const newSession: PomodoroSession = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      duration,
      completedAt: new Date()
    };

    setSessions(prev => [newSession, ...prev]);

    if (type === 'work') {
      setTotalFocusTime(prev => prev + duration);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const todaySessions = sessions.filter(session => {
    const today = new Date();
    const sessionDate = session.completedAt;
    return sessionDate.toDateString() === today.toDateString();
  });

  const todayFocusTime = todaySessions
    .filter(session => session.type === 'work')
    .reduce((total, session) => total + session.duration, 0);

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🍅 Pomodoro Timer
          </h1>
          <p className="text-slate-400">
            Stay focused with the Pomodoro Technique
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timer Section */}
          <div className="lg:col-span-2">
            <PomodoroTimer onSessionComplete={handleSessionComplete} />
            
            {/* How it works */}
            <div className="mt-8 bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                How the Pomodoro Technique Works
              </h2>
              <div className="space-y-3 text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-900/30 text-red-400 border border-red-700 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                    1
                  </div>
                  <p>Work for 25 minutes with complete focus on a single task</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-900/30 text-green-400 border border-green-700 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                    2
                  </div>
                  <p>Take a 5-minute short break to rest and recharge</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-900/30 text-blue-400 border border-blue-700 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                    3
                  </div>
                  <p>After 4 work sessions, take a longer 15-30 minute break</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats and History */}
          <div className="space-y-6">
            {/* Today's Stats */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                📊 Today&apos;s Progress
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-900/30 border border-red-700 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Focus Time</p>
                    <p className="text-xl font-semibold text-white">
                      {formatDuration(todayFocusTime)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-900/30 border border-green-700 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Sessions Completed</p>
                    <p className="text-xl font-semibold text-white">
                      {todaySessions.filter(s => s.type === 'work').length}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-900/30 border border-blue-700 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Sessions</p>
                    <p className="text-xl font-semibold text-white">
                      {sessions.filter(s => s.type === 'work').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                🕐 Recent Sessions
              </h3>
              
              {sessions.length === 0 ? (
                <p className="text-slate-400 text-center py-4">
                  No sessions completed yet. Start your first Pomodoro!
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {sessions.slice(0, 10).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-slate-700/50 border border-slate-600 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          session.type === 'work' 
                            ? 'bg-red-400' 
                            : session.type === 'shortBreak'
                              ? 'bg-green-400'
                              : 'bg-blue-400'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-white">
                            {session.type === 'work' 
                              ? 'Focus Session' 
                              : session.type === 'shortBreak'
                                ? 'Short Break'
                                : 'Long Break'
                            }
                          </p>
                          <p className="text-xs text-slate-400">
                            {session.completedAt.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-slate-300">
                        {formatDuration(session.duration)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}