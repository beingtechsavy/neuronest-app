import { describe, expect, it } from 'vitest';
import { transitionRescueState, isRescueTerminalState, createStoppedState } from '@/lib/rescue/stateMachine';
import type { RescueState } from '@/types/rescue';

describe('rescue state machine', () => {
  it('moves from landing to task-entry', () => {
    const next = transitionRescueState({ status: 'landing' }, { type: 'begin', taskText: 'Start assignment' });
    expect(next.status).toBe('task-entry');
  });

  it('rejects invalid transitions by preserving state', () => {
    const current: RescueState = { status: 'landing' };
    const next = transitionRescueState(current, { type: 'start' });
    expect(next).toBe(current);
  });

  it('reaches activation and adapts when stuck', () => {
    const taskEntry = transitionRescueState({ status: 'task-entry', taskText: 'Write report' }, { type: 'begin', taskText: 'Write report' });
    const friction = transitionRescueState(taskEntry, { type: 'select-friction', friction: 'feels-too-big' });
    const activation = transitionRescueState(friction, { type: 'start' });
    const adapted = transitionRescueState(activation, { type: 'still-stuck' });

    expect(activation.status).toBe('activation');
    if (activation.status === 'activation') expect(activation.stage).toBe('initial');
    expect(adapted.status).toBe('adaptation');
  });

  it('keeps the proposed adaptation and starts that exact action when accepted', () => {
    const friction = transitionRescueState(
      { status: 'friction-selection', taskText: 'Reply to the email' },
      { type: 'select-friction', friction: 'feels-too-big' },
    );
    const activation = transitionRescueState(friction, { type: 'start' });
    const adapted = transitionRescueState(activation, { type: 'still-stuck' });

    expect(adapted.status).toBe('adaptation');
    if (adapted.status !== 'adaptation') return;

    expect(adapted.previousAction).toEqual(activation.status === 'activation' ? activation.action : undefined);
    expect(adapted.actions).toHaveLength(2);

    const accepted = transitionRescueState(adapted, { type: 'start' });
    expect(accepted.status).toBe('activation');
    if (accepted.status !== 'activation') return;

    expect(accepted.action).toEqual(adapted.newAction);
    expect(accepted.actions).toEqual(adapted.actions);
  });

  it('does not generate adaptations beyond the configured maximum depth', () => {
    let state: RescueState = transitionRescueState(
      { status: 'friction-selection', taskText: 'Write the report' },
      { type: 'select-friction', friction: 'feels-too-big' },
    );

    for (let i = 0; i < 5; i += 1) {
      state = transitionRescueState(state, { type: 'make-smaller' });
    }

    expect(state.status).toBe('action-ready');
    if (state.status !== 'action-ready') return;
    expect(state.adaptationDepth).toBe(5);
    expect(state.actions).toHaveLength(6);

    const unchanged = transitionRescueState(state, { type: 'different-step' });
    expect(unchanged).toBe(state);
  });

  it('detects terminal states', () => {
    const stopped = createStoppedState('Task', 'low-energy', {
      id: 'a',
      text: 'Open the document.',
      estimatedMinutes: 2,
    });

    expect(isRescueTerminalState(stopped)).toBe(true);
  });
});
