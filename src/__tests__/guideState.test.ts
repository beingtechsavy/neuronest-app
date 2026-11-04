import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dismissGuide, isGuideDismissed } from '@/lib/guideState';

describe('guide dismissal', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('shows until dismissed, then stays dismissed', () => {
    expect(isGuideDismissed()).toBe(false);
    dismissGuide();
    expect(isGuideDismissed()).toBe(true);
  });

  it('treats blocked storage as "not dismissed" instead of throwing', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => dismissGuide()).not.toThrow();
    expect(isGuideDismissed()).toBe(false);
  });
});
