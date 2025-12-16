'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface DebugResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export default function AnalyticsDebugger() {
  const user = useUser();
  const [results, setResults] = useState<DebugResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    if (!user) {
      setResults([{
        test: 'User Authentication',
        status: 'error',
        message: 'No user found. Please log in first.'
      }]);
      return;
    }

    setLoading(true);
    const diagnostics: DebugResult[] = [];

    // Test 1: User Authentication
    diagnostics.push({
      test: 'User Authentication',
      status: 'success',
      message: `User authenticated: ${user.email}`,
      details: { userId: user.id }
    });

    // Test 2: Database Connection
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      diagnostics.push({
        test: 'Database Connection',
        status: 'success',
        message: 'Successfully connected to Supabase'
      });
    } catch (error) {
      diagnostics.push({
        test: 'Database Connection',
        status: 'error',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 3: Tasks Table Access
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('task_id, task_status, scheduled_date, effort_units')
        .eq('user_id', user.id)
        .limit(5);

      if (error) throw error;

      diagnostics.push({
        test: 'Tasks Table Access',
        status: 'success',
        message: `Found ${tasks?.length || 0} tasks`,
        details: {
          totalTasks: tasks?.length || 0,
          completedTasks: tasks?.filter(t => t.task_status === 'completed').length || 0,
          sampleTask: tasks?.[0] || null
        }
      });
    } catch (error) {
      diagnostics.push({
        test: 'Tasks Table Access',
        status: 'error',
        message: `Tasks query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      });
    }

    // Test 4: Subjects Table Access
    try {
      const { data: subjects, error } = await supabase
        .from('subjects')
        .select('subject_id, title, color')
        .eq('user_id', user.id)
        .limit(5);

      if (error) throw error;

      diagnostics.push({
        test: 'Subjects Table Access',
        status: 'success',
        message: `Found ${subjects?.length || 0} subjects`,
        details: {
          totalSubjects: subjects?.length || 0,
          sampleSubject: subjects?.[0] || null
        }
      });
    } catch (error) {
      diagnostics.push({
        test: 'Subjects Table Access',
        status: 'error',
        message: `Subjects query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      });
    }

    // Test 5: Chapters Table Access
    try {
      const { data: chapters, error } = await supabase
        .from('chapters')
        .select(`
          chapter_id, 
          title, 
          completed,
          subjects!inner(user_id)
        `)
        .eq('subjects.user_id', user.id)
        .limit(5);

      if (error) throw error;

      diagnostics.push({
        test: 'Chapters Table Access',
        status: 'success',
        message: `Found ${chapters?.length || 0} chapters`,
        details: {
          totalChapters: chapters?.length || 0,
          completedChapters: chapters?.filter(c => c.completed).length || 0,
          sampleChapter: chapters?.[0] || null
        }
      });
    } catch (error) {
      diagnostics.push({
        test: 'Chapters Table Access',
        status: 'warning',
        message: `Chapters query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { error }
      });
    }

    // Test 6: Focus Session Data
    try {
      const sessionData = localStorage.getItem('focusSessionStats');
      if (sessionData) {
        const stats = JSON.parse(sessionData);
        const today = new Date().toISOString().split('T')[0];
        const todayTime = stats[today] || 0;

        diagnostics.push({
          test: 'Focus Session Data',
          status: 'success',
          message: `Focus data available. Today: ${todayTime} minutes`,
          details: {
            todayFocusTime: todayTime,
            totalDays: Object.keys(stats).length,
            sampleData: Object.entries(stats).slice(0, 3)
          }
        });
      } else {
        diagnostics.push({
          test: 'Focus Session Data',
          status: 'warning',
          message: 'No focus session data found in localStorage'
        });
      }
    } catch (error) {
      diagnostics.push({
        test: 'Focus Session Data',
        status: 'error',
        message: `Focus session data error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    // Test 7: Today's Tasks
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayTasks, error } = await supabase
        .from('tasks')
        .select('task_id, task_status, effort_units')
        .eq('user_id', user.id)
        .eq('scheduled_date', today);

      if (error) throw error;

      const completed = todayTasks?.filter(t => t.task_status === 'completed').length || 0;
      const total = todayTasks?.length || 0;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

      diagnostics.push({
        test: 'Today\'s Tasks',
        status: 'success',
        message: `Today: ${completed}/${total} tasks completed (${progress}%)`,
        details: {
          todayTasks: total,
          completedToday: completed,
          progress: progress
        }
      });
    } catch (error) {
      diagnostics.push({
        test: 'Today\'s Tasks',
        status: 'error',
        message: `Today's tasks query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    setResults(diagnostics);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      runDiagnostics();
    }
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="text-green-400" size={20} />;
      case 'error': return <XCircle className="text-red-400" size={20} />;
      case 'warning': return <AlertCircle className="text-yellow-400" size={20} />;
      default: return <AlertCircle className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-500/20 bg-green-500/10';
      case 'error': return 'border-red-500/20 bg-red-500/10';
      case 'warning': return 'border-yellow-500/20 bg-yellow-500/10';
      default: return 'border-gray-500/20 bg-gray-500/10';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Analytics Diagnostics</h2>
          <p className="text-gray-400">Testing all analytics components and data sources</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={runDiagnostics}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-white font-medium flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
          {loading ? 'Running...' : 'Run Diagnostics'}
        </motion.button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <motion.div
            key={result.test}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl border backdrop-blur-md ${getStatusColor(result.status)}`}
          >
            <div className="flex items-start gap-3">
              {getStatusIcon(result.status)}
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">{result.test}</h3>
                <p className="text-gray-300 text-sm mb-2">{result.message}</p>
                {result.details && (
                  <details className="text-xs text-gray-400">
                    <summary className="cursor-pointer hover:text-gray-300">View Details</summary>
                    <pre className="mt-2 p-2 bg-black/20 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {results.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-400">Click "Run Diagnostics" to test analytics components</p>
        </div>
      )}
    </div>
  );
}