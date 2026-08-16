import { beforeEach, describe, expect, it } from 'vitest';
import { clearSessions, getSessionCount, getSessions, saveSession, daysSinceLastSession } from '@/lib/rescue/anonymousSession';
import type { RescueSessionData } from '@/types/rescue';

const session: RescueSessionData = {
  id: 'session-1',
  taskText: 'Write the report',
  friction: 'feels-too-big',
  initialAction: {
    id: 'action-1',
    text: 'Open the document.',
    estimatedMinutes: 2,
  },
  adaptations: [],
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  status: 'completed',
};

describe('anonymousSession', () => {
  beforeEach(() => {
    clearSessions();
  });

  it('stores and retrieves sessions locally', () => {
    saveSession(session);
    expect(getSessionCount()).toBe(1);
    expect(getSessions()[0]?.taskText).toBe('Write the report');
  });

  it('returns null days since last session when empty', () => {
    expect(daysSinceLastSession()).toBeNull();
  });
});