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
    expect(adapted.status).toBe('adaptation');
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