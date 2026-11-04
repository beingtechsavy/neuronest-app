const KEY = 'neuronest_guide_dismissed';

/**
 * Whether the first-run walkthrough card has been dismissed on this browser.
 *
 * ponytail: browser-local, matching the other first-run hints (`breakdown-hint-dismissed`).
 * Upgrade to a `profiles` column only if dismissal needs to follow the user across devices.
 */
export function isGuideDismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === 'true';
  } catch {
    // Storage blocked (private mode, site data disabled). Treat as not dismissed
    // so the help is still reachable; the card simply reappears next visit.
    return false;
  }
}

export function dismissGuide(): void {
  try {
    localStorage.setItem(KEY, 'true');
  } catch {
    // Nothing to do: the caller hides the card for this session regardless.
  }
}
