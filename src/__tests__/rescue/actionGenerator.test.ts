import { describe, expect, it } from 'vitest';
import { createActionGenerator, getTaskDomain } from '@/lib/rescue/actionGenerator';
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
    expect(action.text).toMatch(/essay/i);
    expect(action.text).toMatch(/title|bullet|paragraph|sentence/i);
    expect(action.estimatedMinutes).toBe(2);
  });

  it('makes an action smaller through 5 distinct levels without repeats', () => {
    const frictions: FrictionType[] = FRICTION_TYPES;

    for (const friction of frictions) {
      const initial = generator.generateInitialAction('Clean the kitchen', friction);
      const levels: string[] = [];

      for (let depth = 0; depth < 5; depth++) {
        const smaller = generator.generateSmallerAction('Clean the kitchen', initial, friction, depth);
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
    expect(alternative.text).toMatch(/email|conversation|message|inbox/i);
    expect(alternative.estimatedMinutes).toBe(2);
  });

  it('continues a completed task instead of reopening the starting point', () => {
    const initial = generator.generateInitialAction('Write my quarterly report', 'feels-too-big');
    const next = generator.generateContinuationAction('Write my quarterly report', [initial]);

    expect(next.text).not.toBe(initial.text);
    expect(next.text).toMatch(/bullet|sentence|detail|draft/i);
    expect(next.estimatedMinutes).toBe(3);
  });

  it('classifies common task language so generated actions stay relevant', () => {
    expect(getTaskDomain('Reply to my manager')).toBe('communication');
    expect(getTaskDomain('Study chapter 4 for the exam')).toBe('study');
    expect(getTaskDomain('Fix the API bug')).toBe('coding');
    expect(getTaskDomain('Happen to finish something')).toBe('generic');
    expect(getTaskDomain('Do something')).toBe('generic');
  });
});
