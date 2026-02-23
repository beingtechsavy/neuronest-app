'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, Clock, CheckCircle, AlertCircle, Loader2, Heart } from 'lucide-react';
import { canUseAIBreakdown, getUserPlanInfo, UserPlanInfo } from '@/lib/subscriptionLimits';
import UsageLimitModal from './UsageLimitModal';
import type { TaskBreakdownStep } from '@/types/aiBreakdown';
import { useToast } from '@/hooks/useToast';

interface Subject {
  subject_id: number;
  title: string;
  color: string;
  is_stressful: boolean;
}

interface AIBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle?: string;
  taskDescription?: string;
  taskDeadline?: string;
  taskSubject?: string;
  userId: string;
  onBreakdownComplete?: (breakdown: TaskBreakdownStep[], subjectId?: number, chapterId?: number) => void;
}

export default function AIBreakdownModal({
  isOpen,
  onClose,
  taskTitle,
  taskDescription,
  taskDeadline,
  taskSubject,
  userId,
  onBreakdownComplete
}: AIBreakdownModalProps) {
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToast();

  // Load user's subjects and plan info when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      loadUserSubjects();
      loadPlanInfo();
    }
  }, [isOpen, userId]);

  const loadUserSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const response = await fetch('/api/subjects/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const result = await response.json();

      if (result.error) throw new Error(result.error);
      setSubjects(result.data || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const loadPlanInfo = async () => {
    setLoadingPlanInfo(true);
    try {
      const info = await getUserPlanInfo(userId);
      setPlanInfo(info);
    } catch (err) {
      console.error('Failed to load plan info:', err);
    } finally {
      setLoadingPlanInfo(false);
    }
  };
  const [breakdown, setBreakdown] = useState<TaskBreakdownStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [animateSteps, setAnimateSteps] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [breakingDownStep, setBreakingDownStep] = useState<TaskBreakdownStep | null>(null);
  const [breakdownGenerated, setBreakdownGenerated] = useState(false);

  // New state for subject selection and task input
  const [inputTaskTitle, setInputTaskTitle] = useState(taskTitle || '');
  const [inputTaskDescription, setInputTaskDescription] = useState(taskDescription || '');
  const [inputDeadline, setInputDeadline] = useState(taskDeadline || '');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [createNewSubject, setCreateNewSubject] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  
  // Usage limit state
  const [planInfo, setPlanInfo] = useState<UserPlanInfo | null>(null);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const [loadingPlanInfo, setLoadingPlanInfo] = useState(false);

  const generateBreakdown = async () => {
    // Validate inputs before proceeding
    if (!inputTaskTitle.trim()) {
      setError('Please enter a task title');
      return;
    }

    if (!selectedSubject && !createNewSubject) {
      setError('Please select or create a subject');
      return;
    }

    if (createNewSubject && !newSubjectName.trim()) {
      setError('Please enter a subject name');
      return;
    }

    // Check usage limits before proceeding
    const usageCheck = await canUseAIBreakdown(userId);
    if (!usageCheck.allowed) {
      setShowUsageLimitModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setBreakdownGenerated(false);

    try {
      console.log('Sending breakdown request...');
      const response = await fetch('/api/ai/breakdown-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskData: {
            title: inputTaskTitle,
            description: inputTaskDescription,
            deadline: inputDeadline,
            subject: selectedSubject?.title || newSubjectName
          },
          userId
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        if (response.status === 429) {
          setShowUsageLimitModal(true);
        } else {
          const errorMsg = data.error || 'Failed to generate breakdown';
          console.error('API error:', errorMsg);
          setError(errorMsg);
        }
        return;
      }

      // Immediately display breakdown results
      setBreakdown(data.breakdown);
      setUsage(data.usage);
      setBreakdownGenerated(true);

      // Refresh plan info to show updated usage
      await loadPlanInfo();

      // Trigger celebration animation
      setShowConfetti(true);
      setCelebrationMessage(getRandomCelebration());
      setTimeout(() => setShowConfetti(false), 3000);

      // Animate steps appearing
      setAnimateSteps(true);

    } catch (err: any) {
      const errorMsg = err.message || 'Something went wrong. Please try again.';
      console.error('Breakdown generation error:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return <div className="w-3 h-3 rounded-full bg-green-400"></div>;
      case 'MEDIUM': return <div className="w-3 h-3 rounded-full bg-yellow-400"></div>;
      case 'HARD': return <div className="w-3 h-3 rounded-full bg-red-400"></div>;
      default: return <div className="w-3 h-3 rounded-full bg-gray-400"></div>;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'HARD': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getRandomCelebration = () => {
    const celebrations = [
      "🎉 Your brain is amazing! Look at this breakdown!",
      "✨ This is going to be so much easier now!",
      "🚀 You've got this! One step at a time!",
      "💪 Your ADHD brain just got a superpower!",
      "🌟 Breaking it down like a champion!",
      "🎯 Perfect! Now you know exactly what to do!",
      "🔥 This breakdown is *chef's kiss* perfect for you!",
      "💎 Look at you, turning overwhelm into action!"
    ];
    return celebrations[Math.floor(Math.random() * celebrations.length)];
  };

  const getRandomEncouragement = (difficulty: string) => {
    const encouragements = {
      EASY: [
        "Perfect starter step! 🌱",
        "This one's a breeze! 💨",
        "Easy win coming up! ⭐",
        "Your confidence builder! 💪",
        "Momentum starter! 🚀"
      ],
      MEDIUM: [
        "You can totally handle this! 💪",
        "This is your sweet spot! 🎯",
        "Steady progress ahead! 📈",
        "You've got the skills for this! ⚡",
        "Right in your wheelhouse! 🏠"
      ],
      HARD: [
        "The big challenge - but you're ready! 🏔️",
        "This is where you shine! ✨",
        "Deep work time - you've got this! 🧠",
        "The final boss - and you're the hero! 🦸",
        "Your moment to level up! 🆙"
      ]
    };
    const options = encouragements[difficulty as keyof typeof encouragements] || encouragements.MEDIUM;
    return options[Math.floor(Math.random() * options.length)];
  };

  const handleBreakDownStep = async (step: TaskBreakdownStep) => {
    // Check usage limits before proceeding
    const usageCheck = await canUseAIBreakdown(userId);
    if (!usageCheck.allowed) {
      setShowUsageLimitModal(true);
      return;
    }

    setBreakingDownStep(step);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/breakdown-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskData: {
            title: step.step,
            description: `Break down this ${step.difficulty.toLowerCase()} task into even smaller, more manageable micro-steps`,
            deadline: taskDeadline,
            subject: taskSubject
          },
          userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setShowUsageLimitModal(true);
        } else {
          setError(data.error || 'Failed to break down step further');
        }
        return;
      }

      // Replace the original step with the new breakdown
      const newBreakdown = breakdown.flatMap(originalStep =>
        originalStep.order === step.order
          ? data.breakdown.map((subStep: TaskBreakdownStep, index: number) => ({
            ...subStep,
            order: step.order + (index * 0.1), // 1.1, 1.2, 1.3, etc.
            step: `${step.order}.${index + 1} ${subStep.step}`
          }))
          : [originalStep]
      ).sort((a, b) => a.order - b.order);

      setBreakdown(newBreakdown);
      setCelebrationMessage(`🎯 Broke "${step.step}" into ${data.breakdown.length} smaller steps!`);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);

      // Refresh plan info to show updated usage
      await loadPlanInfo();

    } catch (err) {
      setError('Failed to break down step further');
      console.error('Step breakdown error:', err);
    } finally {
      setLoading(false);
      setBreakingDownStep(null);
    }
  };

  const handleAddAllSteps = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/save-breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          breakdown,
          taskTitle: inputTaskTitle,
          selectedSubjectId: selectedSubject?.subject_id,
          newSubjectName,
          createNewSubject,
          saveTasksToInbox: true // Always create tasks from breakdown steps
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error response
        const errorMessage = data.error || 'Failed to save breakdown';
        setError(errorMessage);
        showError(errorMessage);
        return;
      }

      // Show success toast notification
      showSuccess(`🎉 Breakdown saved with ${breakdown.length} tasks! Check your dashboard.`);
      
      // Show success animation
      setShowConfetti(true);
      setCelebrationMessage(`🎉 Breakdown saved with ${breakdown.length} tasks! Check your dashboard.`);
      
      if (onBreakdownComplete) {
        onBreakdownComplete(breakdown, data.subjectId, data.chapterId);
      }
      
      setTimeout(() => {
        // Reset form
        setBreakdown([]);
        setInputTaskTitle('');
        setInputTaskDescription('');
        setInputDeadline('');
        setSelectedSubject(null);
        setNewSubjectName('');
        setCreateNewSubject(false);
        setCelebrationMessage('');
        setBreakdownGenerated(false);
        
        // Close modal and redirect to dashboard
        onClose();
        router.push('/dashboard');
      }, 1500);
      
    } catch (err) {
      const errorMessage = 'Failed to save breakdown. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
      console.error('Save breakdown error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Confetti component
  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none z-60 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        >
          {['🎉', '✨', '🌟', '💫', '⭐', '🎊'][Math.floor(Math.random() * 6)]}
        </div>
      ))}
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      {showConfetti && <Confetti />}
      
      {/* Usage Limit Modal */}
      {planInfo && (
        <UsageLimitModal
          isOpen={showUsageLimitModal}
          onClose={() => setShowUsageLimitModal(false)}
          planInfo={planInfo}
          limitType="ai"
          onUpgrade={() => {
            window.location.href = '/pricing';
          }}
        />
      )}
      
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header - iPhone Style */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">AI Breakdown</h2>
                <p className="text-slate-400 text-sm">Making it manageable</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-slate-700/50 hover:bg-slate-600/50 rounded-full flex items-center justify-center transition-all"
            >
              <X className="text-slate-300" size={18} />
            </button>
          </div>

          {/* Celebration Message - Subtle */}
          {celebrationMessage && (
            <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl">
              <p className="text-center text-white font-medium">{celebrationMessage}</p>
            </div>
          )}

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Usage Info */}
            {planInfo && (
              <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-300">Daily AI Breakdowns</span>
                    <div className="text-xs text-slate-400 mt-1">
                      {planInfo.plan_type === 'free' ? 'Free Plan' : 
                       planInfo.plan_type === 'master' ? 'Master Plan' : 'Warrior Plan'}
                    </div>
                  </div>
                  <span className="text-white font-semibold">
                    {planInfo.breakdowns_used}/{planInfo.breakdowns_limit} used
                  </span>
                </div>
                <div className="mt-2 w-full bg-slate-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      planInfo.breakdowns_used >= planInfo.breakdowns_limit 
                        ? 'bg-red-500' 
                        : planInfo.breakdowns_used / planInfo.breakdowns_limit > 0.8 
                        ? 'bg-yellow-500' 
                        : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min((planInfo.breakdowns_used / planInfo.breakdowns_limit) * 100, 100)}%` }}
                  ></div>
                </div>
                {!planInfo.can_use_ai && (
                  <p className="text-red-400 text-sm mt-2">
                    Daily limit reached. 
                    <button 
                      onClick={() => setShowUsageLimitModal(true)}
                      className="underline ml-1 hover:text-red-300"
                    >
                      Upgrade for more
                    </button>
                  </p>
                )}
                {planInfo.can_use_ai && (planInfo.breakdowns_limit - planInfo.breakdowns_used) <= 2 && (
                  <p className="text-yellow-400 text-sm mt-2">
                    Only {planInfo.breakdowns_limit - planInfo.breakdowns_used} breakdowns remaining today.
                    <button 
                      onClick={() => setShowUsageLimitModal(true)}
                      className="underline ml-1 hover:text-yellow-300"
                    >
                      Upgrade for more
                    </button>
                  </p>
                )}
              </div>
            )}

            {/* Task Input Form */}
            {breakdown.length === 0 && (
              <div className="space-y-6">
                {/* Task Title Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    What do you need to do?
                  </label>
                  <input
                    type="text"
                    value={inputTaskTitle}
                    onChange={(e) => setInputTaskTitle(e.target.value)}
                    placeholder="e.g., Write research paper, Study for exam, Plan birthday party"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Subject
                  </label>
                  <div className="space-y-3">
                    {/* Existing Subject Dropdown */}
                    {!createNewSubject && (
                      <div>
                        <select
                          value={selectedSubject?.subject_id || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            
                            if (!value || value === '') {
                              setSelectedSubject(null);
                              return;
                            }
                            
                            const subjectId = parseInt(value);
                            
                            if (isNaN(subjectId)) {
                              setSelectedSubject(null);
                              return;
                            }
                            
                            const subject = subjects.find(s => s.subject_id === subjectId);
                            setSelectedSubject(subject || null);
                          }}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:border-purple-500 focus:outline-none transition-colors"
                          disabled={loadingSubjects}
                        >
                          <option value="">
                            {loadingSubjects ? 'Loading subjects...' : 
                             subjects.length === 0 ? 'No subjects found' : 
                             'Select existing subject...'}
                          </option>
                          {subjects.map(subject => (
                            <option key={subject.subject_id} value={subject.subject_id}>
                              {subject.title}
                            </option>
                          ))}
                        </select>
                        {subjects.length === 0 && !loadingSubjects && (
                          <p className="text-slate-400 text-xs mt-1">
                            No subjects found. Create a new subject or add subjects from your dashboard first.
                          </p>
                        )}
                      </div>
                    )}

                    {/* New Subject Input */}
                    {createNewSubject && (
                      <input
                        type="text"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        placeholder="Enter new subject name..."
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none transition-colors"
                      />
                    )}

                    {/* Toggle Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setCreateNewSubject(!createNewSubject);
                        setSelectedSubject(null);
                        setNewSubjectName('');
                      }}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {createNewSubject ? '← Use existing subject' : '+ Create new subject'}
                    </button>
                  </div>
                </div>

                {/* Optional Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={inputTaskDescription}
                    onChange={(e) => setInputTaskDescription(e.target.value)}
                    placeholder="Any specific requirements, context, or constraints..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Optional Deadline */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Deadline (optional)
                  </label>
                  <input
                    type="text"
                    value={inputDeadline}
                    onChange={(e) => setInputDeadline(e.target.value)}
                    placeholder="e.g., Next Friday, In 2 weeks, March 15th"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Generate Button */}
                <div className="pt-4">
                  <button
                    onClick={generateBreakdown}
                    disabled={loading || !inputTaskTitle.trim() || (!selectedSubject && !createNewSubject) || (createNewSubject && !newSubjectName.trim())}
                    className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Working my magic...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        <span>Break This Down</span>
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle size={20} />
                      <span>{error}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Breakdown Results */}
            {breakdown.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Your Breakdown
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {breakdown.length} steps • Start with green for momentum
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setBreakdown([]);
                        setCelebrationMessage('');
                      }}
                      className="px-4 py-2 text-slate-400 hover:text-white transition-all bg-slate-700/50 hover:bg-slate-600/50 rounded-xl text-sm font-medium"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleAddAllSteps}
                      disabled={saving || !breakdownGenerated || breakdown.length === 0}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 text-sm shadow-lg"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Save Breakdown
                        </>
                      )}
                    </button>
                  </div>
                </div>



                {/* Steps List - iPhone Style Clean Design */}
                <div className="space-y-3">
                  {breakdown.map((step, index) => (
                    <div
                      key={index}
                      className={`group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 transition-all duration-300 hover:bg-white/8 hover:border-white/20 ${animateSteps ? 'animate-fade-in-up' : ''
                        }`}
                      style={{
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      <div className="p-5">
                        {/* Header Row */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-sm">
                              <span className="text-white font-semibold text-sm">
                                {Math.floor(step.order)}
                              </span>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${step.difficulty === 'EASY' ? 'bg-green-400' :
                              step.difficulty === 'MEDIUM' ? 'bg-yellow-400' : 'bg-red-400'
                              }`}></div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${step.difficulty === 'EASY' ? 'bg-green-400/20 text-green-300' :
                              step.difficulty === 'MEDIUM' ? 'bg-yellow-400/20 text-yellow-300' : 'bg-red-400/20 text-red-300'
                              }`}>
                              {step.difficulty}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-slate-400 text-sm">
                              <Clock size={14} />
                              <span>{step.estimatedMinutes}m</span>
                            </div>

                            {/* Recursive Breakdown Button - Only for MEDIUM/HARD */}
                            {(step.difficulty === 'MEDIUM' || step.difficulty === 'HARD') && (
                              <button
                                onClick={() => handleBreakDownStep(step)}
                                disabled={loading && breakingDownStep?.order === step.order}
                                className="opacity-0 group-hover:opacity-100 transition-all duration-200 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-full text-purple-300 text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                                title="Break this down further"
                              >
                                {loading && breakingDownStep?.order === step.order ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Sparkles size={12} />
                                )}
                                <span>Break Down</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Task Title */}
                        <h4 className="text-white font-medium text-base leading-relaxed mb-3">
                          {step.step}
                        </h4>

                        {/* Encouragement - Subtle */}
                        {step.encouragement && (
                          <div className="mb-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                            <p className="text-blue-200 text-sm flex items-center gap-2">
                              <Heart size={12} className="text-pink-400 flex-shrink-0" />
                              {step.encouragement}
                            </p>
                          </div>
                        )}

                        {/* Completion Criteria - Clean */}
                        <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                          <p className="text-slate-300 text-sm">
                            <span className="text-green-400 font-medium">Done when:</span> {step.completionCriteria}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tips - Clean & Minimal */}
                <div className="mt-6 p-5 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
                  <h4 className="font-semibold text-slate-200 mb-3 text-sm">
                    Pro Tips
                  </h4>
                  <div className="space-y-2 text-sm text-slate-400">
                    <p>• Start with green steps for quick wins</p>
                    <p>• Take breaks between steps</p>
                    <p>• Celebrate each completion</p>
                    <p>• Use "Break Down" for complex steps</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Custom CSS for animations */}
        <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
      </div>
    </>
  );
}