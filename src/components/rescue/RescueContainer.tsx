'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { RescueState, RescueSessionData, FrictionType, RescueAction } from '@/types/rescue';
import { generateSessionId } from '@/types/rescue';
import { createActionGenerator } from '@/lib/rescue/actionGenerator';
import { saveSession, daysSinceLastSession, getPendingRescueSession, clearPendingRescueSession } from '@/lib/rescue/anonymousSession';
import { trackEvent } from '@/lib/rescue/rescueAnalytics';
import { transitionRescueState } from '@/lib/rescue/stateMachine';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import TaskEntry from './TaskEntry';
import FrictionSelector from './FrictionSelector';
import ActionDisplay from './ActionDisplay';
import ActivationMode from './ActivationMode';
import AdaptationPanel from './AdaptationPanel';
import CompletionScreen from './CompletionScreen';
import StopScreen from './StopScreen';
import OptionalSave from './OptionalSave';
import ResumePrompt from './ResumePrompt';
import NeuroNestMark from '@/components/NeuroNestMark';
import { Button, Card } from '@/components/ui';

const generator = createActionGenerator();

async function requestAIRescueAction(
  taskText: string,
  friction: FrictionType,
  mode: 'initial' | 'continuation' | 'smaller' | 'different',
  previousActions: readonly RescueAction[],
): Promise<RescueAction | null> {
  try {
    const response = await fetch('/api/rescue/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        taskText,
        friction,
        mode,
        previousActions: previousActions.map((action) => action.text),
      }),
      // A stuck person should never wait on a hung request: fail fast into
      // the deterministic generator instead.
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) return null;
    const data = await response.json() as { action?: RescueAction };
    if (!data.action?.id || !data.action.text || !Number.isInteger(data.action.estimatedMinutes)) return null;
    return data.action;
  } catch {
    return null;
  }
}

export default function RescueContainer() {
  const [state, setState] = useState<RescueState>({ status: 'landing' });
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  // Track landing view
  useEffect(() => {
    trackEvent({ event: 'rescue_viewed' });
    const daysSince = daysSinceLastSession();
    if (daysSince !== null) {
      trackEvent({ event: 'return_rescue_started', daysSinceLastSession: daysSince });
    }
  }, []);

  useEffect(() => {
    const pending = getPendingRescueSession();
    if (window.location.search.includes('resume=') && pending) {
      setState({ status: 'resume-prompt', sessionData: pending });
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const taskParam = searchParams.get('task');
    const frictionParam = searchParams.get('friction') as FrictionType | null;

    if (taskParam && frictionParam) {
      trackEvent({ event: 'rescue_started' });
      trackEvent({ event: 'task_submitted' });
      trackEvent({ event: 'friction_selected', friction: frictionParam });
      setGenerating(true);
      setState({ status: 'action-generation', taskText: taskParam, friction: frictionParam });

      void (async () => {
        const action = await requestAIRescueAction(taskParam, frictionParam, 'initial', [])
          || generator.generateInitialAction(taskParam, frictionParam);
        sessionIdRef.current = generateSessionId();
        setGenerating(false);
        setState({
          status: 'action-ready',
          taskText: taskParam,
          friction: frictionParam,
          action,
          actions: [action],
          adaptationDepth: 0,
          stage: 'initial',
        });
        trackEvent({ event: 'action_generated', friction: frictionParam });
      })();
    } else if (taskParam) {
      setState({ status: 'friction-selection', taskText: taskParam });
      trackEvent({ event: 'rescue_started' });
      trackEvent({ event: 'task_submitted' });
    }
  }, []);

  // ── State transitions ──

  const handleTaskSubmit = useCallback((taskText: string) => {
    setState({ status: 'friction-selection', taskText });
    trackEvent({ event: 'rescue_started' });
    trackEvent({ event: 'task_submitted' });
  }, []);

  const handleFrictionBack = useCallback(() => {
    const current = state;
    if (current.status === 'friction-selection') {
      setState({ status: 'task-entry', taskText: current.taskText });
    }
  }, [state]);

  const handleFrictionSelect = useCallback(
    async (friction: FrictionType) => {
      const current = state;
      if (current.status !== 'friction-selection') return;

      trackEvent({ event: 'friction_selected', friction });

      // Generate action
      setGenerating(true);
      setState({ status: 'action-generation', taskText: current.taskText, friction });

       const action = await requestAIRescueAction(current.taskText, friction, 'initial', [])
         || generator.generateInitialAction(current.taskText, friction);
      sessionIdRef.current = generateSessionId();
      setGenerating(false);
      setState({
        status: 'action-ready',
        taskText: current.taskText,
        friction,
        action,
         actions: [action],
         adaptationDepth: 0,
         stage: 'initial',
       });
      trackEvent({ event: 'action_generated', friction });
    },
    [state]
  );

  const handleStart = useCallback(() => {
    const current = state;
    if (current.status !== 'action-ready') return;
    const next = transitionRescueState(current, { type: 'start' });
    setState(next);
    trackEvent({ event: 'action_started', friction: current.friction });
  }, [state]);

  const handleMakeSmaller = useCallback(async () => {
    const current = state;
    if (current.status !== 'action-ready' && current.status !== 'adaptation') return;
    if (current.adaptationDepth >= generator.maxAdaptationDepth) return;

    setGenerating(true);
    const previousAction = current.status === 'action-ready' ? current.action : current.newAction;
    const action = await requestAIRescueAction(
      current.taskText,
      current.friction,
      'smaller',
      current.actions,
    ) || generator.generateSmallerAction(
      current.taskText,
      previousAction,
      current.friction,
      current.adaptationDepth,
    );

    const next = current.status === 'action-ready'
      ? {
          ...current,
          action,
          actions: [...current.actions, action],
          adaptationDepth: current.adaptationDepth + 1,
        }
      : {
          ...current,
          previousAction: current.newAction,
          newAction: action,
          actions: [...current.actions, action],
          adaptationDepth: current.adaptationDepth + 1,
        };
    const nextDepth = next.adaptationDepth;
    trackEvent({ event: 'action_reduced', friction: current.friction, adaptationDepth: nextDepth });
    setState(next);
    setGenerating(false);
  }, [state]);

  const handleDifferentStep = useCallback(async () => {
    const current = state;
    if (current.status !== 'action-ready' && current.status !== 'adaptation') return;
    if (current.adaptationDepth >= generator.maxAdaptationDepth) return;

    setGenerating(true);
    const action = await requestAIRescueAction(
      current.taskText,
      current.friction,
      'different',
      current.actions,
    ) || generator.generateAlternativeAction(current.taskText, current.friction, current.actions);

    const next = current.status === 'action-ready'
      ? {
          ...current,
          action,
          actions: [...current.actions, action],
          adaptationDepth: current.adaptationDepth + 1,
        }
      : {
          ...current,
          previousAction: current.newAction,
          newAction: action,
          actions: [...current.actions, action],
          adaptationDepth: current.adaptationDepth + 1,
          reason: 'not-right' as const,
        };
    const nextDepth = next.adaptationDepth;
    trackEvent({ event: 'action_changed', friction: current.friction, adaptationDepth: nextDepth });
    setState(next);
    setGenerating(false);
  }, [state]);

  const handleDone = useCallback(() => {
    const current = state;
    if (current.status !== 'activation') return;

    trackEvent({ event: 'action_completed', friction: current.friction });
    setState(transitionRescueState(current, { type: 'done' }));
  }, [state]);

  const handleStillStuck = useCallback(async () => {
    const current = state;
    if (current.status !== 'activation') return;

    trackEvent({ event: 'still_stuck_selected', friction: current.friction, adaptationDepth: current.adaptationDepth });

    if (current.adaptationDepth >= generator.maxAdaptationDepth) return;

    setGenerating(true);
    const newAction = await requestAIRescueAction(
      current.taskText,
      current.friction,
      'smaller',
      current.actions,
    ) || generator.generateSmallerAction(
      current.taskText,
      current.action,
      current.friction,
      current.adaptationDepth,
    );
    setState({
      status: 'adaptation',
      taskText: current.taskText,
      friction: current.friction,
      previousAction: current.action,
      newAction,
      actions: [...current.actions, newAction],
       adaptationDepth: current.adaptationDepth + 1,
       stage: current.stage,
       reason: 'too-hard',
    });
    setGenerating(false);
  }, [state]);

  const handleAdaptationAccept = useCallback(() => {
    const current = state;
    if (current.status !== 'adaptation') return;
    trackEvent({ event: 'adaptation_accepted', friction: current.friction, adaptationDepth: current.adaptationDepth });
    setState(transitionRescueState(current, { type: 'start' }));
  }, [state]);

  const handleAdaptationMakeSmaller = useCallback(() => {
    void handleMakeSmaller();
  }, [handleMakeSmaller]);

  const handleAdaptationDifferentStep = useCallback(() => {
    void handleDifferentStep();
  }, [handleDifferentStep]);

  const handleStop = useCallback(() => {
    const current = state;
    if (current.status !== 'activation' && current.status !== 'adaptation') return;

    const friction = current.friction;
    const adaptationsUsed = current.adaptationDepth;
    trackEvent({ event: 'session_stopped', friction, adaptationsUsed });

    const next = transitionRescueState(current, { type: 'stop' });
    if (next !== current) {
      setState(next);
    }
  }, [state]);

  const handleSave = useCallback(() => {
    const current = state;
    if (current.status !== 'completed' && current.status !== 'stopped') return;

    trackEvent({ event: 'save_offered' });

    const sessionData: RescueSessionData = {
      id: sessionIdRef.current || generateSessionId(),
      taskText: current.taskText,
      friction: current.friction,
      initialAction: current.actions[0] || (current.status === 'completed' ? current.finalAction : current.lastAction),
      adaptations: current.actions.slice(1),
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: current.status === 'completed' ? 'completed' : 'stopped',
    };

    saveSession(sessionData);

    setState({
      status: 'optional-save',
      sessionData,
    });
  }, [state]);

  const handleSkipSave = useCallback(() => {
    setState({ status: 'landing' });
  }, []);

  const handleNextStep = useCallback(async () => {
    const current = state;
    if (current.status !== 'completed' || generating) return;

    setGenerating(true);
    const nextAction = await requestAIRescueAction(
      current.taskText,
      current.friction,
      'continuation',
      current.actions,
    ) || generator.generateContinuationAction(current.taskText, current.actions);

    setState({
      status: 'action-ready',
      taskText: current.taskText,
      friction: current.friction,
      action: nextAction,
      actions: [...current.actions, nextAction],
      adaptationDepth: 0,
      stage: 'continuation',
    });
    setGenerating(false);
    trackEvent({ event: 'action_generated', friction: current.friction });
  }, [generating, state]);

  const handleFinish = useCallback(() => {
    setState({ status: 'landing' });
  }, []);

  const handleReturnToRescue = useCallback(() => {
    setState({ status: 'landing' });
  }, []);

  const handleResumeContinue = useCallback(() => {
    const current = state;
    if (current.status !== 'resume-prompt') return;
    clearPendingRescueSession();
    setState({ status: 'task-entry', taskText: current.sessionData.taskText });
  }, [state]);

  const handleResumeSave = useCallback(async (saveTaskText: boolean) => {
    const current = state;
    if (current.status !== 'resume-prompt') return;
    setSaving(true);
    try {
      const { data: { session } } = await (await import('@/lib/supabaseClient')).supabase.auth.getSession();
      const response = await fetch('/api/rescue/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ session: current.sessionData, saveTaskText }),
      });
      if (!response.ok) throw new Error('Unable to save Rescue history');
      clearPendingRescueSession();
      setState({ status: 'landing' });
    } catch (error) {
      console.error('Resume Rescue save error:', error);
    } finally {
      setSaving(false);
    }
  }, [state]);

  // ── Render based on state ──

  const shouldReduceMotion = useReducedMotion();

  const getVariants = (status: RescueState['status']) => {
    if (shouldReduceMotion) {
      return {
        initial: { opacity: 0, y: 0 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 0 },
      };
    }
    if (status === 'activation') {
      return {
        initial: { opacity: 0, y: 0 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 0 },
      };
    }
    return {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -8 },
    };
  };

  const getTransition = (status: RescueState['status']) => {
    if (shouldReduceMotion) {
      return { duration: 0.1, ease: 'easeOut' as const };
    }
    if (status === 'activation') {
      return { duration: 0.3, ease: 'easeOut' as const };
    }
    return { duration: 0.2, ease: 'easeOut' as const };
  };

  const renderContent = () => {
    switch (state.status) {
      case 'landing':
        return (
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
            <Card className="mx-auto w-full max-w-md text-center">
              <NeuroNestMark size={64} className="mx-auto mb-6" />
              <h1 className="mb-3 text-2xl font-bold leading-tight tracking-tight text-[#F2F3F5] sm:text-3xl">
                Can&apos;t start? Let&apos;s make the first step small enough.
              </h1>
              <p className="mb-8 text-sm leading-relaxed text-[#949BA4] sm:text-base">
                NeuroNest listens to what is getting in the way, then gives you one tiny next move for this task.
              </p>
              <Button
                size="lg"
                fullWidth
                onClick={() => setState({ status: 'task-entry', taskText: '' })}
              >
                Help me start
              </Button>
            </Card>
          </div>
        );
      case 'task-entry':
        return <TaskEntry initialText={state.taskText} onSubmit={handleTaskSubmit} />;
      case 'friction-selection':
        return (
          <FrictionSelector
            taskText={state.taskText}
            onSelect={handleFrictionSelect}
            onBack={handleFrictionBack}
          />
        );
      case 'action-generation':
        return (
          <div className="flex min-h-[60vh] flex-col items-center justify-center px-4" role="status" aria-live="polite">
            <Card className="mx-auto w-full max-w-md text-center">
              <Loader2 size={28} className="mx-auto mb-4 animate-spin text-[#2DD4BF] motion-reduce:animate-none" aria-hidden="true" />
              <p className="text-base font-medium text-[#DBDEE1]">
                Tailoring one tiny next step to your task…
              </p>
            </Card>
          </div>
        );
      case 'action-ready':
        return (
          <ActionDisplay
            action={state.action}
            isContinuation={state.stage === 'continuation'}
            adaptationDepth={state.adaptationDepth}
            maxAdaptationDepth={generator.maxAdaptationDepth}
            onStart={handleStart}
            onMakeSmaller={handleMakeSmaller}
            onDifferentStep={handleDifferentStep}
            generating={generating}
          />
        );
      case 'activation':
        return (
          <ActivationMode
            action={state.action}
            canAdapt={state.adaptationDepth < generator.maxAdaptationDepth}
            onDone={handleDone}
            onStillStuck={handleStillStuck}
            onStop={handleStop}
          />
        );
      case 'adaptation':
        return (
          <AdaptationPanel
            reason={state.reason}
            currentAction={state.previousAction}
            newAction={state.newAction}
            adaptationDepth={state.adaptationDepth}
            maxAdaptationDepth={generator.maxAdaptationDepth}
            onAccept={handleAdaptationAccept}
            onMakeSmaller={handleAdaptationMakeSmaller}
            onDifferentStep={handleAdaptationDifferentStep}
            onStop={handleStop}
            isNearLimit={state.adaptationDepth >= generator.maxAdaptationDepth - 1}
            generating={generating}
          />
        );
      case 'completed':
        return (
          <CompletionScreen
            action={state.finalAction}
            completedAction={state.completedAction}
            onSave={handleSave}
            onNextStep={handleNextStep}
            onFinish={handleFinish}
            generating={generating}
          />
        );
      case 'stopped':
        return (
          <StopScreen
            action={state.lastAction}
            onSave={handleSave}
            onReturn={handleReturnToRescue}
            onFinish={handleFinish}
          />
        );
      case 'optional-save':
        return (
          <OptionalSave
            sessionData={state.sessionData}
            onSave={() => {
              window.location.href = '/signup';
            }}
            onSkip={handleSkipSave}
            saving={false}
          />
        );
      case 'resume-prompt':
        return (
          <ResumePrompt
            sessionData={state.sessionData}
            onContinue={handleResumeContinue}
            onSave={handleResumeSave}
           onSkip={() => {
              clearPendingRescueSession();
              setState({ status: 'landing' });
            }}
          />
        );
      default:
        return null;
    }
  };

  const stateKey =
    state.status === 'action-ready'
      ? `${state.status}-${state.action.id}`
      : state.status === 'adaptation'
      ? `${state.status}-${state.newAction.id}`
      : state.status;

  const variants = getVariants(state.status);
  const transition = getTransition(state.status);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stateKey}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={transition}
        className="w-full"
      >
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
}
