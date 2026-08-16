import { describe, expect, it } from 'vitest';
import { createActionGenerator } from '@/lib/rescue/actionGenerator';
import type { FrictionType } from '@/types/rescue';

const generator = createActionGenerator();

const FRICTION_TYPES: FrictionType[] = [
  'dont-know-where-to-start',
  'feels-too-big',
  'anxious-about-doing-it-badly',
  'feels-boring',
  'low-energy',
  'too-many-competing-tasks',
  'not-sure',
];

describe('actionGenerator', () => {
  it('generates a single tiny physical initial action', () => {
    const action = generator.generateInitialAction('Finish my essay', 'feels-too-big');
    expect(action.text).toMatch(/first thing/i);
    expect(action.estimatedMinutes).toBe(2);
  });

  it('makes an action smaller through 5 distinct levels without repeats', () => {
    const frictions: FrictionType[] = FRICTION_TYPES;

    for (const friction of frictions) {
      const initial = generator.generateInitialAction('Clean the kitchen', friction);
      const levels: string[] = [];

      for (let depth = 0; depth < 5; depth++) {
        const smaller = generator.generateSmallerAction(initial, friction, depth);
        levels.push(smaller.text);
      }

      // Check all 5 levels are unique strings
      const unique = new Set(levels);
      expect(unique.size).toBe(5);
    }
  });

  it('generates genuinely different initial actions for all 7 friction types', () => {
    const task = 'Write quarterly report';
    const initialActions = FRICTION_TYPES.map((f) => generator.generateInitialAction(task, f).text);
    const unique = new Set(initialActions);

    expect(unique.size).toBe(7);
  });

  it('creates a different strategy on request', () => {
    const current = generator.generateInitialAction('Reply to the email', 'dont-know-where-to-start');
    const alternative = generator.generateAlternativeAction('Reply to the email', 'dont-know-where-to-start', [current]);

    expect(alternative.text).not.toBe(current.text);
    expect(alternative.estimatedMinutes).toBe(2);
  });
});