'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Clock, CheckCircle, AlertCircle, Loader2, Heart, X } from 'lucide-react';
import { canUseAIBreakdown, getUserPlanInfo, UserPlanInfo } from '@/lib/subscriptionLimits';
import UsageLimitModal from './UsageLimitModal';
import type { TaskBreakdownStep } from '@/types/aiBreakdown';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabaseClient';
import { Button, CardInset, IconBadge, Input, Modal, Textarea, buttonClass } from '@/components/ui';
import { cn } from '@/lib/cn';

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

const difficulty = {
  EASY: { label: 'Easy', className: 'border-[#23A55A]/30 bg-[#23A55A]/10 text-[#23A55A]' },
  MEDIUM: { label: 'Medium', className: 'border-[#E8A33D]/30 bg-[#E8A33D]/10 text-[#E8A33D]' },
  HARD: { label: 'Hard', className: 'border-[#ED4245]/30 bg-[#ED4245]/10 text-[#ED4245]' },
} as const;

const fieldClass =
  'w-full rounded-xl border border-[#3F4147] bg-[#1E1F22] px-4 py-3 text-base text-[#F2F3F5] ' +
  'placeholder:text-[#6E747B] outline-none transition-colors focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6] ' +
  'disabled:opacity-50';

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

  const loadUserSubjects = useCallback(async () => {
    setLoadingSubjects(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/subjects/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
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
  }, [userId]);

  const loadPlanInfo = useCallback(async () => {
    try {
      const info = await getUserPlanInfo(userId);
      setPlanInfo(info);
    } catch (err) {
      console.error('Failed to load plan info:', err);
    }
  }, [userId]);

  // Load user's subjects and plan info when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      loadUserSubjects();
      loadPlanInfo();
    }
  }, [isOpen, userId, loadUserSubjects, loadPlanInfo]);

  const [breakdown, setBreakdown] = useState<TaskBreakdownStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
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

  const generateBreakdown = async () => {
    // Validate inputs before proceeding
    if (!inputTaskTitle.trim()) {
      setError('Please enter a task title');
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
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/ai/breakdown-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          taskData: {
            title: inputTaskTitle,
            description: inputTaskDescription,
            deadline: inputDeadline,
            subject: selectedSubject?.title || newSubjectName || undefined
          },
          userId
        })
      });

      const data = await response.json();

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

      setStatusMessage(`${data.breakdown.length} steps ready. Start with the first one.`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      console.error('Breakdown generation error:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
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
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/ai/breakdown-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
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
      ).sort((a: TaskBreakdownStep, b: TaskBreakdownStep) => a.order - b.order);

      setBreakdown(newBreakdown);
      setStatusMessage(`Split "${step.step}" into ${data.breakdown.length} smaller steps.`);

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

  const handleAddAllSteps = async (destination: 'inbox' | 'workspace' = 'inbox') => {
    setSaving(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/ai/save-breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
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
      showSuccess(`Breakdown saved with ${breakdown.length} tasks.`);
      setStatusMessage(`Saved ${breakdown.length} tasks. Taking you there now…`);

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
        setStatusMessage('');
        setBreakdownGenerated(false);

        // Close modal and redirect to the chosen destination
        onClose();
        router.push(destination === 'workspace' ? '/dashboard' : '/tasks');
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

  if (!isOpen) return null;

  const remaining = planInfo ? Math.max(0, planInfo.breakdowns_limit - planInfo.breakdowns_used) : 0;
  const hasBreakdown = breakdown.length > 0;

  return (
    <>
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

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        className="max-w-2xl"
        title={
          <span className="flex items-center gap-3">
            <IconBadge tone="brand" size="sm">
              <Sparkles size={16} />
            </IconBadge>
            Break this down
          </span>
        }
        description="One overwhelming thing in, an ordered list out."
      >
        {/* Usage is a quiet footnote while there is room left, and only turns
            into a warning when the limit is genuinely close. */}
        {planInfo && (
          <CardInset className="mb-5 flex items-center justify-between gap-3 py-3">
            <p className="text-xs text-[#949BA4]">
              {planInfo.plan_type === 'free' ? 'Free plan' : 'Pro plan'} · AI breakdowns today
            </p>
            <p className="text-xs font-semibold tabular-nums text-[#DBDEE1]">
              {planInfo.breakdowns_used}/{planInfo.breakdowns_limit}
            </p>
          </CardInset>
        )}

        {!planInfo?.can_use_ai && planInfo && (
          <p className="mb-4 text-sm text-[#ED4245]">
            Daily limit reached.{' '}
            <button
              type="button"
              onClick={() => setShowUsageLimitModal(true)}
              className="underline underline-offset-2 hover:text-[#FF6B6B]"
            >
              Upgrade for more
            </button>
          </p>
        )}

        {planInfo?.can_use_ai && remaining <= 2 && remaining > 0 && (
          <p className="mb-4 text-sm text-[#E8A33D]">
            {remaining} breakdown{remaining === 1 ? '' : 's'} left today.
          </p>
        )}

        {statusMessage && (
          <p className="mb-4 text-sm text-[#5EEAD4]" role="status" aria-live="polite">
            {statusMessage}
          </p>
        )}

        {!hasBreakdown ? (
          <div className="flex flex-col gap-4">
            <Input
              label="What do you need to do?"
              value={inputTaskTitle}
              onChange={(e) => setInputTaskTitle(e.target.value)}
              placeholder="e.g. Write the literature review"
              autoFocus
            />

            <div>
              <label htmlFor="breakdown-project" className="mb-2 block text-sm font-medium text-[#DBDEE1]">
                Project (optional)
              </label>
              {!createNewSubject ? (
                <>
                  <select
                    id="breakdown-project"
                    value={selectedSubject?.subject_id || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        setSelectedSubject(null);
                        return;
                      }
                      const subjectId = parseInt(value);
                      if (isNaN(subjectId)) {
                        setSelectedSubject(null);
                        return;
                      }
                      setSelectedSubject(subjects.find(s => s.subject_id === subjectId) || null);
                    }}
                    className={cn(fieldClass, 'appearance-none')}
                    disabled={loadingSubjects}
                  >
                    <option value="">
                      {loadingSubjects
                        ? 'Loading projects…'
                        : subjects.length === 0
                          ? 'No projects yet'
                          : 'No project — save to inbox'}
                    </option>
                    {subjects.map(subject => (
                      <option key={subject.subject_id} value={subject.subject_id}>
                        {subject.title}
                      </option>
                    ))}
                  </select>
                  {subjects.length === 0 && !loadingSubjects && (
                    <p className="mt-1.5 text-sm text-[#949BA4]">
                      You can generate without a project and save the steps to your inbox.
                    </p>
                  )}
                </>
              ) : (
                <Input
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="New project name"
                  aria-label="New project name"
                />
              )}

              <button
                type="button"
                onClick={() => {
                  setCreateNewSubject(!createNewSubject);
                  setSelectedSubject(null);
                  setNewSubjectName('');
                }}
                className="mt-2 min-h-11 text-sm text-[#2DD4BF] transition-colors hover:text-[#5EEAD4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]"
              >
                {createNewSubject ? 'Use an existing project' : 'Create a new project'}
              </button>
            </div>

            <Textarea
              label="Additional details (optional)"
              value={inputTaskDescription}
              onChange={(e) => setInputTaskDescription(e.target.value)}
              placeholder="Any requirements, context, or constraints."
              rows={3}
              className="min-h-[96px] resize-none"
            />

            <Input
              label="Deadline (optional)"
              value={inputDeadline}
              onChange={(e) => setInputDeadline(e.target.value)}
              placeholder="e.g. Next Friday, in 2 weeks"
            />

            <Button
              size="lg"
              fullWidth
              onClick={generateBreakdown}
              disabled={loading || !inputTaskTitle.trim() || (createNewSubject && !newSubjectName.trim())}
              className="mt-1"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  Building the steps…
                </>
              ) : (
                <>
                  <Sparkles size={18} aria-hidden="true" />
                  Break this down
                </>
              )}
            </Button>

            {error && (
              <p className="flex items-start gap-2 text-sm text-[#FF6B6B]" role="alert">
                <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight text-[#F2F3F5]">Your steps</h3>
                <p className="text-sm text-[#949BA4]">
                  {breakdown.length} steps. Start with the first one, not the best one.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setBreakdown([]);
                    setStatusMessage('');
                  }}
                  className="text-sm"
                >
                  Start over
                </Button>
                <Button
                  onClick={() => handleAddAllSteps('inbox')}
                  disabled={saving || !breakdownGenerated || breakdown.length === 0}
                  className="text-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} aria-hidden="true" />
                      Save all to inbox
                    </>
                  )}
                </Button>
              </div>
            </div>

            <ol className="space-y-2.5">
              {breakdown.map((step, index) => {
                const tone = difficulty[step.difficulty] ?? { label: step.difficulty, className: 'border-[#3F4147] bg-[#383A40] text-[#949BA4]' };
                const isBreakingDown = loading && breakingDownStep?.order === step.order;

                return (
                  <li key={index}>
                    <CardInset className="p-4 sm:p-5">
                      <div className="mb-2 flex flex-wrap items-center gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#383A40] text-xs font-semibold tabular-nums text-[#F2F3F5]">
                          {Math.floor(step.order)}
                        </span>
                        <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', tone.className)}>
                          {tone.label}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[#949BA4] tabular-nums">
                          <Clock size={12} aria-hidden="true" />
                          {step.estimatedMinutes} min
                        </span>

                        {(step.difficulty === 'MEDIUM' || step.difficulty === 'HARD') && (
                          <button
                            type="button"
                            onClick={() => handleBreakDownStep(step)}
                            disabled={loading}
                            className="ml-auto flex min-h-[32px] items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[#2DD4BF] transition-colors hover:bg-[#14B8A6]/10 disabled:opacity-50"
                            aria-label={`Break down step ${Math.floor(step.order)} further`}
                          >
                            {isBreakingDown ? (
                              <Loader2 size={12} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                            ) : (
                              <Sparkles size={12} aria-hidden="true" />
                            )}
                            Make smaller
                          </button>
                        )}
                      </div>

                      <h4 className="mb-2 text-base font-medium leading-relaxed text-[#F2F3F5]">
                        {step.step}
                      </h4>

                      {step.encouragement && (
                        <p className="mb-2 flex items-start gap-2 text-sm leading-relaxed text-[#5EEAD4]">
                          <Heart size={13} className="mt-1 shrink-0 text-[#2DD4BF]" aria-hidden="true" />
                          {step.encouragement}
                        </p>
                      )}

                      <p className="text-sm leading-relaxed text-[#DBDEE1]">
                        <span className="font-medium text-[#23A55A]">Done when:</span>{' '}
                        {step.completionCriteria}
                      </p>
                    </CardInset>
                  </li>
                );
              })}
            </ol>

            <CardInset className="mt-5">
              <p className="text-xs leading-relaxed text-[#949BA4]">
                Green steps are quick wins — do one before you decide how the rest will go.
                Use <span className="font-medium text-[#DBDEE1]">Make smaller</span> on any step
                that still feels too big.
              </p>
            </CardInset>

            {error && (
              <p className="mt-4 flex items-start gap-2 text-sm text-[#FF6B6B]" role="alert">
                <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}
          </div>
        )}

        {usage && hasBreakdown && (
          <p className="mt-4 text-center text-xs text-[#6E747B] tabular-nums">
            {usage.remaining} of {usage.limit} breakdowns left today
          </p>
        )}

        {/* Escape hatch back to the marketing page if someone landed here cold. */}
        {!hasBreakdown && (
          <p className="mt-5 text-center text-xs text-[#949BA4]">
            Not sure what to break down?{' '}
            <a
              href="/rescue"
              className={buttonClass({ variant: 'ghost', size: 'md', className: 'inline-flex min-h-[36px] px-1 text-xs underline underline-offset-4' })}
            >
              Start a rescue instead
            </a>
          </p>
        )}
      </Modal>
    </>
  );
}
