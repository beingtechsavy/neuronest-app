// ────────────────────────────────────────────────────
// NeuroNest Rescue — Explicit State Machine Helpers
// Pure transition helpers for testing and future reducer wiring.
// ────────────────────────────────────────────────────

import type { FrictionType, RescueAction, RescueState } from '@/types/rescue';
import { createActionGenerator } from './actionGenerator';

const generator = createActionGenerator();

export type RescueEvent =
  | { type: 'begin'; taskText: string }
  | { type: 'select-friction'; friction: FrictionType }
  | { type: 'make-smaller' }
  | { type: 'different-step' }
  | { type: 'start' }
  | { type: 'done' }
  | { type: 'still-stuck' }
  | { type: 'stop' }
  | { type: 'reset' };

/**
 * Transition the rescue state machine.
 * Invalid transitions return the current state unchanged.
 */
export function transitionRescueState(state: RescueState, event: RescueEvent): RescueState {
  switch (state.status) {
    case 'landing':
      if (event.type === 'begin') {
        return { status: 'task-entry', taskText: event.taskText };
      }
      return state;

    case 'task-entry':
      if (event.type === 'begin') {
        return { status: 'friction-selection', taskText: event.taskText };
      }
      if (event.type === 'reset') return { status: 'landing' };
      return state;

    case 'friction-selection':
      if (event.type === 'select-friction') {
        const action = generator.generateInitialAction(state.taskText, event.friction);
        return {
          status: 'action-ready',
          taskText: state.taskText,
          friction: event.friction,
          action,
          adaptationDepth: 0,
        };
      }
      if (event.type === 'reset') return { status: 'landing' };
      return state;

    case 'action-ready':
      if (event.type === 'make-smaller') {
        const action = generator.generateSmallerAction(state.action, state.friction, state.adaptationDepth);
        return { ...state, action, adaptationDepth: state.adaptationDepth + 1 };
      }
      if (event.type === 'different-step') {
        const action = generator.generateAlternativeAction(state.taskText, state.friction, [state.action]);
        return { ...state, action, adaptationDepth: state.adaptationDepth + 1 };
      }
      if (event.type === 'start') {
        return {
          status: 'activation',
          taskText: state.taskText,
          friction: state.friction,
          action: state.action,
          adaptationDepth: state.adaptationDepth,
          timerRunning: false,
          elapsedSeconds: 0,
        };
      }
      if (event.type === 'reset') return { status: 'landing' };
      return state;

    case 'activation':
      if (event.type === 'done') {
        return {
          status: 'completed',
          taskText: state.taskText,
          friction: state.friction,
          finalAction: state.action,
          completedAction: true,
        };
      }
      if (event.type === 'still-stuck') {
        const action = generator.generateSmallerAction(state.action, state.friction, state.adaptationDepth);
        return {
          status: 'adaptation',
          taskText: state.taskText,
          friction: state.friction,
          currentAction: action,
          adaptationDepth: state.adaptationDepth + 1,
          reason: 'too-hard',
        };
      }
      if (event.type === 'stop') {
        return {
          status: 'stopped',
          taskText: state.taskText,
          friction: state.friction,
          lastAction: state.action,
        };
      }
      return state;

    case 'adaptation':
      if (event.type === 'make-smaller') {
        const action = generator.generateSmallerAction(state.currentAction, state.friction, state.adaptationDepth);
        return { ...state, currentAction: action, adaptationDepth: state.adaptationDepth + 1 };
      }
      if (event.type === 'different-step') {
        const action = generator.generateAlternativeAction(state.taskText, state.friction, [state.currentAction]);
        return { ...state, currentAction: action, adaptationDepth: state.adaptationDepth + 1, reason: 'not-right' };
      }
      if (event.type === 'start') {
        return {
          status: 'activation',
          taskText: state.taskText,
          friction: state.friction,
          action: state.currentAction,
          adaptationDepth: state.adaptationDepth,
          timerRunning: false,
          elapsedSeconds: 0,
        };
      }
      if (event.type === 'stop') {
        return {
          status: 'stopped',
          taskText: state.taskText,
          friction: state.friction,
          lastAction: state.currentAction,
        };
      }
      return state;

    case 'completed':
    case 'stopped':
      if (event.type === 'reset') return { status: 'landing' };
      return state;

    case 'optional-save':
      if (event.type === 'reset') return { status: 'landing' };
      return state;

    default:
      return state;
  }
}

export function isRescueTerminalState(state: RescueState): boolean {
  return state.status === 'completed' || state.status === 'stopped';
}

export function createStoppedState(taskText: string, friction: FrictionType, action: RescueAction): RescueState {
  return {
    status: 'stopped',
    taskText,
    friction,
    lastAction: action,
  };
}