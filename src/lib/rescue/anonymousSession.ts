// ────────────────────────────────────────────────────
// NeuroNest Rescue — Anonymous Session Handling
// localStorage-based persistence for anonymous rescue sessions.
// No database writes, no cookies, no tracking.
// ────────────────────────────────────────────────────

import type { RescueSessionData } from '@/types/rescue';

const STORAGE_KEY = 'neuronest_rescue_sessions';

// ────────────────────────────────────────────────────
// Read / Write
// ────────────────────────────────────────────────────

function readSessions(): RescueSessionData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RescueSessionData[];
  } catch {
    return [];
  }
}

function writeSessions(sessions: RescueSessionData[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

// ────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────

export function saveSession(session: RescueSessionData): void {
  const sessions = readSessions();
  sessions.push(session);
  writeSessions(sessions);
}

export function getSessions(): RescueSessionData[] {
  return readSessions();
}

export function getSessionById(id: string): RescueSessionData | undefined {
  return readSessions().find((s) => s.id === id);
}

export function getRecentSessions(count: number = 10): RescueSessionData[] {
  return readSessions()
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, count);
}

export function clearSessions(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

export function getSessionCount(): number {
  return readSessions().length;
}

export function getLastSessionDate(): string | null {
  const sessions = readSessions();
  if (sessions.length === 0) return null;
  return sessions.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  )[0].startedAt;
}

/** Check if this is a returning user (has at least one prior session). */
export function isReturningUser(): boolean {
  return getSessionCount() > 0;
}

/** Calculate days since last session. Returns null if no prior sessions. */
export function daysSinceLastSession(): number | null {
  const lastDate = getLastSessionDate();
  if (!lastDate) return null;
  const now = Date.now();
  const last = new Date(lastDate).getTime();
  return Math.floor((now - last) / (1000 * 60 * 60 * 24));
}

/**
 * Attaches any pending anonymous rescue sessions from localStorage to the newly created user account,
 * converting local guest activity into saved account data upon signup.
 */
export async function attachAnonymousSessionsToUser(
  supabase: any,
  userId: string
): Promise<number> {
  const localSessions = readSessions();
  if (localSessions.length === 0) return 0;

  try {
    for (const session of localSessions) {
      await supabase.from('tasks').insert({
        user_id: userId,
        title: session.taskText,
        status: session.status === 'completed' ? 'completed' : 'inbox',
        is_stressful: session.friction === 'anxious-about-doing-it-badly' || session.friction === 'feels-too-big',
        created_at: session.startedAt,
      });
    }

    try {
      const { trackEvent } = await import('./rescueAnalytics');
      trackEvent({ event: 'account_created_after_rescue' });
    } catch {}

    clearSessions();
    return localSessions.length;
  } catch (err) {
    console.error('Error attaching anonymous sessions to user:', err);
    return 0;
  }
}