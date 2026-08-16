// ────────────────────────────────────────────────────
// NeuroNest Rescue — Deterministic Action Generator
// Friction-aware action templates with adaptation.
// No AI calls — fully deterministic, testable, safe.
// ────────────────────────────────────────────────────

import type { FrictionType, RescueAction } from '@/types/rescue';
import { generateActionId } from '@/types/rescue';

// ────────────────────────────────────────────────────
// Action templates keyed by friction type
// Each function returns an initial action for a given task.
// ────────────────────────────────────────────────────

type ActionTemplate = (taskText: string) => string;

const INITIAL_TEMPLATES: Record<FrictionType, ActionTemplate> = {
  'dont-know-where-to-start': (task) =>
    `Find the ${describeTask(task)} and put it on your screen.`,
  'feels-too-big': (task) =>
    `Write down the very first thing you need to figure out about "${shorten(task)}".`,
  'anxious-about-doing-it-badly': (task) =>
    `Write one deliberately imperfect sentence about "${shorten(task)}".`,
  'feels-boring': (task) =>
    `Set a timer for 2 minutes and do the most boring part of "${shorten(task)}".`,
  'low-energy': (task) =>
    `Put the materials you need for "${shorten(task)}" on the table in front of you. That's all.`,
  'too-many-competing-tasks': (task) =>
    `Write "${shorten(task)}" on a piece of paper. Close every other tab and window.`,
  'not-sure': (task) =>
    `Describe "${shorten(task)}" aloud in one sentence. Say it out loud right now.`,
};

const SMALLER_TEMPLATES: Record<FrictionType, ActionTemplate[]> = {
  'dont-know-where-to-start': [
    () => 'Open the folder, app, or website where this task lives.',
    () => 'Find and click on just the main file or document link.',
    () => 'Scroll to the top of the document and read the first line.',
    () => 'Put your cursor on the screen where you will start.',
    () => 'Touch your keyboard or mouse for 5 seconds while looking at the screen.',
  ],
  'feels-too-big': [
    () => 'Write down the very first word related to this task. Just one word.',
    () => 'Write a title or single sentence on a piece of paper.',
    () => 'Open a blank page or file and write "Step 1".',
    () => 'Write just 3 letters of any word for this task.',
    () => 'Look at the screen or paper for 10 seconds. That is all.',
  ],
  'anxious-about-doing-it-badly': [
    () => 'Write three random words about this task. They don\'t need to make sense.',
    () => 'Type out 5 random gibberish characters on your keyboard.',
    () => 'Write "Draft 0.0 — Imperfect" at the top of your page.',
    () => 'Make 1 intentional typo on purpose right now.',
    () => 'Remind yourself "Nobody sees this" and take one deep breath.',
  ],
  'feels-boring': [
    () => 'Set a timer for 30 seconds and do anything related to the task.',
    () => 'Do just 1 single keystroke or 1 click for this task.',
    () => 'Look at the task for 15 seconds while listening to music.',
    () => 'Hover your mouse over the file or start button for 5 seconds.',
    () => 'Count down from 5 to 1 out loud while facing your work.',
  ],
  'low-energy': [
    () => 'Stand up, stretch your arms, and take three deep breaths.',
    () => 'Sit down and rest your hands on your desk or keyboard without typing.',
    () => 'Get a glass of water or adjust your chair comfort.',
    () => 'Open the application and just leave it visible on your screen.',
    () => 'Close your eyes for 15 seconds, then open them and look at the screen.',
  ],
  'too-many-competing-tasks': [
    () => 'Close all browser tabs and applications except the one for this task.',
    () => 'Minimize or hide all other windows on your screen.',
    () => 'Put your phone face-down out of arm\'s reach.',
    () => 'Write only the name of this task on a sticky note or paper.',
    () => 'Stare at this single task name for 10 seconds without switching.',
  ],
  'not-sure': [
    () => 'What is one word that describes this task? Write it down.',
    () => 'Say out loud to yourself: "I am choosing to look at this now."',
    () => 'Write down how you feel about starting in just 3 words.',
    () => 'Nod your head and take one deep inhale.',
    () => 'Touch your desk and say "Start".',
  ],
};

const ALTERNATIVE_TEMPLATES: Record<FrictionType, ActionTemplate[]> = {
  'dont-know-where-to-start': [
    (task) => `Search for "${shorten(task)}" and open the first result.`,
    () => 'Ask someone (or an AI) "What is the first step for this task?"',
    () => 'Look at a similar completed task and copy its first step.',
  ],
  'feels-too-big': [
    (task) => `Break "${shorten(task)}" into 3 parts. Write down just part 1.`,
    () => 'Set a timer for 5 minutes. Work on this for 5 minutes only.',
    () => 'Tell yourself: "I only need to do 1% of this." What is 1%?',
  ],
  'anxious-about-doing-it-badly': [
    () => 'Open a blank document and write "This is my first bad draft."',
    (task) => `Imagine someone else doing "${shorten(task)}" badly. What would their first step be?`,
    () => 'Write the worst possible version of this task. Get it out of your system.',
  ],
  'feels-boring': [
    () => 'Put on music or a podcast. Then start the boring part.',
    (task) => `Set a challenge: "How much of "${shorten(task)}" can I do in 3 minutes?"`,
    () => 'Pair the boring task with something enjoyable (coffee, a treat, a favorite show).',
  ],
  'low-energy': [
    () => 'Do the easiest possible version. Reduce the standard by 80%.',
    () => 'Set a timer for 5 minutes of rest. After the timer, do 2 minutes of work.',
    () => 'Just open the document. Don\'t do anything. Just open it.',
  ],
  'too-many-competing-tasks': [
    (task) => `Write all competing tasks on paper. Circle "${shorten(task)}". Tear the paper.`,
    () => 'Use a random picker. Whatever it picks, do that one thing.',
    () => 'Ask: "If I can only do one thing today, what is the most important?" Do that.',
  ],
  'not-sure': [
    () => 'Flip a coin. Heads = do it, tails = don\'t. The coin tells you how you feel.',
    () => 'Do a 2-minute "taste" of the task. If it feels wrong, pick something else.',
    () => 'Ask a friend: "What should I do about this?" Say it out loud to them.',
  ],
};

// ────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────

/** Extract a short descriptor from the task text. */
function describeTask(task: string): string {
  const words = task.trim().split(/\s+/);
  if (words.length <= 3) return task.trim();
  // Return first 3 words as a descriptor
  return words.slice(0, 3).join(' ');
}

/** Shorten text to a reasonable length for display in an action. */
function shorten(task: string): string {
  const MAX = 60;
  if (task.length <= MAX) return task;
  return task.slice(0, MAX).trimEnd() + '…';
}

// ────────────────────────────────────────────────────
// Generator
// ────────────────────────────────────────────────────

export interface ActionGenerator {
  /** Generate the initial action for a task+friction pair. */
  generateInitialAction(taskText: string, friction: FrictionType): RescueAction;

  /** Generate a smaller version of the current action. */
  generateSmallerAction(currentAction: RescueAction, friction: FrictionType, depth?: number): RescueAction;

  /** Generate an alternative action (different strategy). */
  generateAlternativeAction(
    taskText: string,
    friction: FrictionType,
    previousActions: readonly RescueAction[]
  ): RescueAction;

  /** Maximum number of adaptations before suggesting a break. */
  readonly maxAdaptationDepth: number;
}

export function createActionGenerator(): ActionGenerator {
  return {
    maxAdaptationDepth: 5,

    generateInitialAction(taskText: string, friction: FrictionType): RescueAction {
      const template = INITIAL_TEMPLATES[friction];
      const text = template(taskText);

      return {
        id: generateActionId(),
        text,
        estimatedMinutes: 2,
      };
    },

    generateSmallerAction(currentAction: RescueAction, friction: FrictionType, depth: number = 0): RescueAction {
      const templates = SMALLER_TEMPLATES[friction];
      const index = Math.min(Math.max(0, depth), templates.length - 1);
      const template = templates[index];
      const text = template(currentAction.text);

      return {
        id: generateActionId(),
        text,
        estimatedMinutes: 1,
      };
    },

    generateAlternativeAction(
      taskText: string,
      friction: FrictionType,
      previousActions: readonly RescueAction[]
    ): RescueAction {
      const templates = ALTERNATIVE_TEMPLATES[friction];
      const previousTexts = new Set(previousActions.map((a) => a.text));

      // Find the first alternative template whose output isn't a repeat
      for (const template of templates) {
        const text = template(taskText);
        if (!previousTexts.has(text)) {
          return {
            id: generateActionId(),
            text,
            estimatedMinutes: 2,
          };
        }
      }

      // Fallback: use the last template (even if repeated)
      const lastTemplate = templates[templates.length - 1];
      return {
        id: generateActionId(),
        text: lastTemplate(taskText),
        estimatedMinutes: 2,
      };
    },
  };
}