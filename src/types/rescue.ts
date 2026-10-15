// ────────────────────────────────────────────────────
// NeuroNest Rescue — Type Definitions
// Discriminated union state model for the rescue loop.
// No impossible state combinations.
// ────────────────────────────────────────────────────

/** The seven friction types a user can select. */
export type FrictionType =
  | 'dont-know-where-to-start'
  | 'feels-too-big'
  | 'anxious-about-doing-it-badly'
  | 'feels-boring'
  | 'low-energy'
  | 'too-many-competing-tasks'
  | 'not-sure';

/** Human-readable labels for each friction type. */
export const FRICTION_LABELS: Record<FrictionType, string> = {
  'dont-know-where-to-start': "I don't know where to start",
  'feels-too-big': 'It feels too big',
  'anxious-about-doing-it-badly': "I'm anxious about doing it badly",
  'feels-boring': 'It feels boring',
  'low-energy': 'I have low energy',
  'too-many-competing-tasks': 'I have too many competing tasks',
  'not-sure': "I'm not sure",
};

/** A single generated rescue action. */
export interface RescueAction {
  readonly id: string;
  readonly text: string;
  readonly estimatedMinutes: number;
}

/** Data persisted for a completed rescue session. */
export interface RescueSessionData {
  readonly id: string;
  readonly taskText: string;
  readonly friction: FrictionType;
  readonly initialAction: RescueAction;
  readonly adaptations: readonly RescueAction[];
  readonly startedAt: string;   // ISO-8601
  readonly completedAt?: string; // ISO-8601
  readonly status: 'completed' | 'stopped';
}

// ────────────────────────────────────────────────────
// Discriminated union — exactly one state at a time
// ────────────────────────────────────────────────────

export type RescueState =
  | { readonly status: 'landing' }
  | { readonly status: 'task-entry'; readonly taskText: string }
  | { readonly status: 'friction-selection'; readonly taskText: string }
  | { readonly status: 'action-generation'; readonly taskText: string; readonly friction: FrictionType }
  | { readonly status: 'action-ready'; readonly taskText: string; readonly friction: FrictionType; readonly action: RescueAction; readonly actions: readonly RescueAction[]; readonly adaptationDepth: number }
  | { readonly status: 'activation'; readonly taskText: string; readonly friction: FrictionType; readonly action: RescueAction; readonly actions: readonly RescueAction[]; readonly adaptationDepth: number; readonly timerRunning: boolean; readonly elapsedSeconds: number }
  | { readonly status: 'adaptation'; readonly taskText: string; readonly friction: FrictionType; readonly previousAction: RescueAction; readonly newAction: RescueAction; readonly actions: readonly RescueAction[]; readonly adaptationDepth: number; readonly reason: 'too-hard' | 'not-right' }
  | { readonly status: 'completed'; readonly taskText: string; readonly friction: FrictionType; readonly finalAction: RescueAction; readonly actions: readonly RescueAction[]; readonly completedAction: boolean }
  | { readonly status: 'stopped'; readonly taskText: string; readonly friction: FrictionType; readonly lastAction: RescueAction; readonly actions: readonly RescueAction[] }
  | { readonly status: 'resume-prompt'; readonly sessionData: RescueSessionData }
  | { readonly status: 'optional-save'; readonly sessionData: RescueSessionData };

// ────────────────────────────────────────────────────
// Analytics events — privacy-safe (no raw text)
// ────────────────────────────────────────────────────

export type RescueAnalyticsEventBase = {
  readonly sessionId?: string;
  readonly utmSource?: string;
  readonly utmMedium?: string;
  readonly utmCampaign?: string;
  readonly referralCode?: string;
};

export type RescueAnalyticsEvent = RescueAnalyticsEventBase & (
  | { readonly event: 'rescue_viewed' }
  | { readonly event: 'rescue_started' }
  | { readonly event: 'task_submitted' }
  | { readonly event: 'friction_selected'; readonly friction: FrictionType }
  | { readonly event: 'action_generated'; readonly friction: FrictionType }
  | { readonly event: 'action_started'; readonly friction: FrictionType }
  | { readonly event: 'action_reduced'; readonly friction: FrictionType; readonly adaptationDepth: number }
  | { readonly event: 'action_changed'; readonly friction: FrictionType; readonly adaptationDepth: number }
  | { readonly event: 'still_stuck_selected'; readonly friction: FrictionType; readonly adaptationDepth: number }
  | { readonly event: 'adaptation_accepted'; readonly friction: FrictionType; readonly adaptationDepth: number }
  | { readonly event: 'action_completed'; readonly friction: FrictionType }
  | { readonly event: 'session_stopped'; readonly friction: FrictionType; readonly adaptationsUsed: number }
  | { readonly event: 'save_offered' }
  | { readonly event: 'account_created_after_rescue' }
  | { readonly event: 'return_rescue_started'; readonly daysSinceLastSession: number }
  | { readonly event: 'pricing_viewed' }
  | { readonly event: 'checkout_started'; readonly plan: 'pro'; readonly billingCycle: 'monthly' | 'yearly' }
  | { readonly event: 'payment_completed'; readonly plan: 'pro'; readonly billingCycle?: 'monthly' | 'yearly' }
);

// ────────────────────────────────────────────────────
// State transition helpers
// ────────────────────────────────────────────────────

/** Generate a unique action ID. */
export function generateActionId(): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : `${Date.now()}_${Math.floor(Math.random() * 1e8).toString(36)}`;
  return `act_${Date.now()}_${random}`;
}

/** Generate a unique session ID. */
export function generateSessionId(): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : `${Date.now()}_${Math.floor(Math.random() * 1e8).toString(36)}`;
  return `session_${Date.now()}_${random}`;
}
