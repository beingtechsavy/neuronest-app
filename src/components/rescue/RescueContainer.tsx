'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { RescueState, RescueAction, RescueSessionData, FrictionType } from '@/types/rescue';
import { generateSessionId } from '@/types/rescue';
import { createActionGenerator } from '@/lib/rescue/actionGenerator';
import { saveSession, daysSinceLastSession } from '@/lib/rescue/anonymousSession';
import { trackEvent } from '@/lib/rescue/rescueAnalytics';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import TaskEntry from './TaskEntry';
import FrictionSelector from './FrictionSelector';
import ActionDisplay from './ActionDisplay';
import ActivationMode from './ActivationMode';
import AdaptationPanel from './AdaptationPanel';
import CompletionScreen from './CompletionScreen';
import StopScreen from './StopScreen';
import OptionalSave from './OptionalSave';

const generator = createActionGenerator();

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

  // ── State transitions ──

  const handleTaskSubmit = useCallback((taskText: string) => {
    setState({ status: 'friction-selection', taskText });
    trackEvent({ event: 'rescue_started' });
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

      // Simulate a brief delay for UX
      await new Promise((r) => setTimeout(r, 400));

      const action = generator.generateInitialAction(current.taskText, friction);
      sessionIdRef.current = generateSessionId();
      setGenerating(false);
      setState({
        status: 'action-ready',
        taskText: current.taskText,
        friction,
        action,
        adaptationDepth: 0,
      });
      trackEvent({ event: 'action_generated', friction });
    },
    [state]
  );

  const handleStart = useCallback(() => {
    const current = state;
    if (current.status !== 'action-ready') return;
    setState({
      status: 'activation',
      taskText: current.taskText,
      friction: current.friction,
      action: current.action,
      adaptationDepth: current.adaptationDepth,
      timerRunning: false,
      elapsedSeconds: 0,
    });
    trackEvent({ event: 'action_started', friction: current.friction });
  }, [state]);

  const handleMakeSmaller = useCallback(() => {
    const current = state;
    if (current.status !== 'action-ready' && current.status !== 'adaptation') return;

    const friction = current.status === 'action-ready' ? current.friction : current.friction;
    const taskText = current.status === 'action-ready' ? current.taskText : current.taskText;
    const currentAction = current.status === 'action-ready' ? current.action : current.currentAction;
    const depth = current.status === 'action-ready' ? current.adaptationDepth : current.adaptationDepth;

    const newAction = generator.generateSmallerAction(currentAction, friction, depth);
    const newDepth = depth + 1;

    trackEvent({ event: 'action_reduced', friction, adaptationDepth: newDepth });

    setState({
      status: 'action-ready',
      taskText,
      friction,
      action: newAction,
      adaptationDepth: newDepth,
    });
  }, [state]);

  const handleDifferentStep = useCallback(() => {
    const current = state;
    if (current.status !== 'action-ready' && current.status !== 'adaptation') return;

    const friction = current.status === 'action-ready' ? current.friction : current.friction;
    const taskText = current.status === 'action-ready' ? current.taskText : current.taskText;
    const currentAction = current.status === 'action-ready' ? current.action : current.currentAction;
    const depth = current.status === 'action-ready' ? current.adaptationDepth : current.adaptationDepth;

    // Collect previous actions
    const previousActions: RescueAction[] = [currentAction];
    if (current.status === 'adaptation') {
      // The adaptation panel already has a newAction we're showing
    }

    const newAction = generator.generateAlternativeAction(taskText, friction, previousActions);
    const newDepth = depth + 1;

    trackEvent({ event: 'action_changed', friction, adaptationDepth: newDepth });

    setState({
      status: 'action-ready',
      taskText,
      friction,
      action: newAction,
      adaptationDepth: newDepth,
    });
  }, [state]);

  const handleDone = useCallback(() => {
    const current = state;
    if (current.status !== 'activation') return;

    trackEvent({ event: 'action_completed', friction: current.friction });

    setState({
      status: 'completed',
      taskText: current.taskText,
      friction: current.friction,
      finalAction: current.action,
      completedAction: true,
    });
  }, [state]);

  const handleStillStuck = useCallback(() => {
    const current = state;
    if (current.status !== 'activation') return;

    trackEvent({ event: 'still_stuck_selected', friction: current.friction, adaptationDepth: current.adaptationDepth });

    const newAction = generator.generateSmallerAction(current.action, current.friction, current.adaptationDepth);
    const newDepth = current.adaptationDepth + 1;

    setState({
      status: 'adaptation',
      taskText: current.taskText,
      friction: current.friction,
      currentAction: current.action,
      adaptationDepth: newDepth,
      reason: 'too-hard',
    });
  }, [state]);

  const handleAdaptationAccept = useCallback(() => {
    const current = state;
    if (current.status !== 'adaptation') return;
    setState({
      status: 'activation',
      taskText: current.taskText,
      friction: current.friction,
      action: current.currentAction,
      adaptationDepth: current.adaptationDepth,
      timerRunning: false,
      elapsedSeconds: 0,
    });
  }, [state]);

  const handleAdaptationMakeSmaller = useCallback(() => {
    const current = state;
    if (current.status !== 'adaptation') return;

    const newAction = generator.generateSmallerAction(current.currentAction, current.friction, current.adaptationDepth);
    const newDepth = current.adaptationDepth + 1;

    trackEvent({ event: 'action_reduced', friction: current.friction, adaptationDepth: newDepth });

    setState({
      status: 'adaptation',
      taskText: current.taskText,
      friction: current.friction,
      currentAction: newAction,
      adaptationDepth: newDepth,
      reason: 'too-hard',
    });
  }, [state]);

  const handleAdaptationDifferentStep = useCallback(() => {
    const current = state;
    if (current.status !== 'adaptation') return;

    const newAction = generator.generateAlternativeAction(current.taskText, current.friction, [current.currentAction]);
    const newDepth = current.adaptationDepth + 1;

    trackEvent({ event: 'action_changed', friction: current.friction, adaptationDepth: newDepth });

    setState({
      status: 'adaptation',
      taskText: current.taskText,
      friction: current.friction,
      currentAction: newAction,
      adaptationDepth: newDepth,
      reason: 'not-right',
    });
  }, [state]);

  const handleStop = useCallback(() => {
    const current = state;
    const action: RescueAction =
      current.status === 'activation'
        ? current.action
        : current.status === 'adaptation'
        ? current.currentAction
        : current.status === 'action-ready'
        ? current.action
        : { id: '', text: '', estimatedMinutes: 0 };

    const friction =
      current.status === 'activation'
        ? current.friction
        : current.status === 'adaptation'
        ? current.friction
        : current.status === 'action-ready'
        ? current.friction
        : 'not-sure';

    const taskText =
      current.status === 'activation'
        ? current.taskText
        : current.status === 'adaptation'
        ? current.taskText
        : current.status === 'action-ready'
        ? current.taskText
        : '';

    const adaptationsUsed =
      current.status === 'activation'
        ? current.adaptationDepth
        : current.status === 'adaptation'
        ? current.adaptationDepth
        : 0;

    trackEvent({ event: 'session_stopped', friction, adaptationsUsed });

    setState({
      status: 'stopped',
      taskText,
      friction,
      lastAction: action,
    });
  }, [state]);

  const handleSave = useCallback(() => {
    const current = state;
    if (current.status !== 'completed' && current.status !== 'stopped') return;

    trackEvent({ event: 'save_session_offered' });

    const sessionData: RescueSessionData = {
      id: sessionIdRef.current || generateSessionId(),
      taskText: current.taskText,
      friction: current.friction,
      initialAction:
        current.status === 'completed' ? current.finalAction : current.lastAction,
      adaptations: [],
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

  const handleNextStep = useCallback(() => {
    // Go back to task entry for a new rescue
    setState({ status: 'landing' });
  }, []);

  const handleFinish = useCallback(() => {
    setState({ status: 'landing' });
  }, []);

  const handleReturnToRescue = useCallback(() => {
    setState({ status: 'landing' });
  }, []);

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
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="w-full max-w-md mx-auto text-center">
              <div className="text-6xl mb-6">🧠</div>
              <h1 className="text-[clamp(1.85rem,6vw,3.25rem)] font-bold text-white mb-4 tracking-tight leading-[1.1]">
                Can&apos;t start? Let&apos;s make the first step small enough.
              </h1>
              <p className="text-slate-400 text-base sm:text-lg mb-8">
                NeuroNest helps you move from stuck to started — one tiny, realistic action at a time.
              </p>
              <button
                onClick={() => setState({ status: 'task-entry', taskText: '' })}
                className="w-full min-h-[48px] py-4 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99]"
              >
                Help me start
              </button>
            </div>
          </div>
        );
      case 'task-entry':
        return <TaskEntry onSubmit={handleTaskSubmit} />;
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
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="animate-pulse text-center">
              <div className="w-12 h-12 bg-purple-500/30 rounded-full mx-auto mb-4" />
              <p className="text-slate-300 text-lg">Finding the right first step…</p>
            </div>
          </div>
        );
      case 'action-ready':
        return (
          <ActionDisplay
            action={state.action}
            adaptationDepth={state.adaptationDepth}
            maxAdaptationDepth={generator.maxAdaptationDepth}
            onStart={handleStart}
            onMakeSmaller={handleMakeSmaller}
            onDifferentStep={handleDifferentStep}
            generating={false}
          />
        );
      case 'activation':
        return (
          <ActivationMode
            action={state.action}
            onDone={handleDone}
            onStillStuck={handleStillStuck}
            onStop={handleStop}
          />
        );
      case 'adaptation':
        return (
          <AdaptationPanel
            reason={state.reason}
            currentAction={state.currentAction}
            newAction={state.currentAction}
            adaptationDepth={state.adaptationDepth}
            onAccept={handleAdaptationAccept}
            onMakeSmaller={handleAdaptationMakeSmaller}
            onDifferentStep={handleAdaptationDifferentStep}
            onStop={handleStop}
            isNearLimit={state.adaptationDepth >= generator.maxAdaptationDepth - 1}
            generating={false}
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
      default:
        return null;
    }
  };

  const stateKey =
    state.status === 'action-ready'
      ? `${state.status}-${state.action.id}`
      : state.status === 'adaptation'
      ? `${state.status}-${state.currentAction.id}`
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