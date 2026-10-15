// ────────────────────────────────────────────────────
// NeuroNest Rescue — Task-aware deterministic action generator
// Uses the task itself plus the selected friction to produce
// small, relevant, testable actions without an AI call.
// ────────────────────────────────────────────────────

import type { FrictionType, RescueAction } from '@/types/rescue';
import { generateActionId } from '@/types/rescue';

export type TaskDomain =
  | 'communication'
  | 'writing'
  | 'study'
  | 'coding'
  | 'cleaning'
  | 'cooking'
  | 'errand'
  | 'admin'
  | 'planning'
  | 'physical'
  | 'generic';

interface TaskContext {
  domain: TaskDomain;
  place: string;
  target: string;
  unit: string;
  open: string;
  locate: string;
  prepare: string;
  imperfect: string;
  tiny: string;
}

const DOMAIN_KEYWORDS: Record<Exclude<TaskDomain, 'generic'>, readonly string[]> = {
  communication: [
    'email', 'e-mail', 'reply', 'respond', 'message', 'text', 'phone', 'call',
    'contact', 'dm', 'whatsapp', 'slack', 'invite', 'send',
  ],
  writing: [
    'write', 'writing', 'draft', 'essay', 'report', 'paper', 'proposal', 'article',
    'blog', 'document', 'presentation', 'slides', 'resume', 'cv',
  ],
  study: [
    'study', 'exam', 'test', 'revise', 'revision', 'homework', 'assignment',
    'textbook', 'lecture', 'notes', 'chapter', 'learn', 'memorize', 'research',
  ],
  coding: [
    'code', 'coding', 'bug', 'debug', 'function', 'repository', 'repo', 'api',
    'deploy', 'program', 'software', 'website', 'app', 'script', 'pull request',
    'feature', 'issue', 'component',
  ],
  cleaning: [
    'clean', 'cleaning', 'tidy', 'organize', 'declutter', 'dishes', 'laundry',
    'wash', 'vacuum', 'mop', 'room', 'kitchen', 'bedroom', 'bathroom', 'trash',
  ],
  cooking: [
    'cook', 'cooking', 'recipe', 'meal', 'dinner', 'breakfast', 'lunch', 'bake',
    'baking', 'ingredients', 'food',
  ],
  errand: [
    'buy', 'purchase', 'shop', 'shopping', 'grocery', 'groceries', 'store',
    'pick up', 'return', 'post office', 'pharmacy', 'order', 'deliver', 'appointment',
  ],
  admin: [
    'bill', 'budget', 'tax', 'form', 'application', 'paperwork', 'bank', 'invoice',
    'insurance', 'renew', 'register', 'submit', 'account', 'payment',
  ],
  planning: [
    'plan', 'planning', 'schedule', 'itinerary', 'trip', 'packing', 'organise',
    'organizing', 'roadmap', 'prepare for',
  ],
  physical: [
    'shower', 'exercise', 'workout', 'walk', 'run', 'medication', 'medicine',
    'brush teeth', 'get dressed', 'sleep', 'bed', 'stretch', 'eat', 'drink water',
  ],
};

function shorten(task: string): string {
  const maxLength = 60;
  if (task.length <= maxLength) return task;
  return `${task.slice(0, maxLength).trimEnd()}…`;
}

function quoteTask(task: string): string {
  return `"${shorten(task)}"`;
}

function containsKeyword(text: string, keyword: string): boolean {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`\\b${escapedKeyword}\\b`).test(text);
}

/**
 * Classify a task using conservative keyword matching. The classifier is
 * intentionally deterministic and only chooses a domain when the task gives
 * us a useful signal; otherwise it falls back to a safe generic strategy.
 */
export function getTaskDomain(taskText: string): TaskDomain {
  const normalized = taskText.trim().toLowerCase();
  let bestDomain: TaskDomain = 'generic';
  let bestScore = 0;

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as Array<[
    Exclude<TaskDomain, 'generic'>,
    readonly string[],
  ]>) {
    const score = keywords.reduce(
      (total, keyword) => total + (containsKeyword(normalized, keyword) ? 1 : 0),
      0,
    );

    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain;
    }
  }

  return bestDomain;
}

function createTaskContext(taskText: string): TaskContext {
  const task = quoteTask(taskText);

  switch (getTaskDomain(taskText)) {
    case 'communication':
      return {
        domain: 'communication',
        place: 'the inbox or messaging app',
        target: 'the conversation or contact',
        unit: 'the first sentence you want to send',
        open: `Open the inbox or messaging app where ${task} belongs.`,
        locate: `Find the conversation or contact related to ${task}.`,
        prepare: `Put the device with the conversation for ${task} in front of you.`,
        imperfect: `Write a rough, unsent version of the first sentence for ${task}.`,
        tiny: `Read only the subject or first line connected to ${task}.`,
      };
    case 'writing':
      return {
        domain: 'writing',
        place: 'the document or workspace',
        target: 'the relevant file or brief',
        unit: 'a title or one bullet point',
        open: `Open the document or workspace where ${task} will live.`,
        locate: `Find the file, brief, or notes connected to ${task}.`,
        prepare: `Put the document or notes for ${task} where you can see them.`,
        imperfect: `Open a draft for ${task} and write one deliberately imperfect sentence.`,
        tiny: `Add one word or bullet to the draft for ${task}.`,
      };
    case 'study':
      return {
        domain: 'study',
        place: 'the study material or course space',
        target: 'the relevant chapter, question, or note',
        unit: 'one concept, question, or paragraph',
        open: `Open the material or course space needed for ${task}.`,
        locate: `Find the chapter, question, or note connected to ${task}.`,
        prepare: `Put the study material for ${task} in front of you and open it.`,
        imperfect: `Write one rough bullet about what you already know for ${task}.`,
        tiny: `Read one paragraph, heading, or question related to ${task}.`,
      };
    case 'coding':
      return {
        domain: 'coding',
        place: 'the repository, editor, or issue tracker',
        target: 'the relevant file, function, or issue',
        unit: 'one expected behavior or code location',
        open: `Open the repository, editor, or issue tracker where ${task} needs to happen.`,
        locate: `Find the file, function, or issue connected to ${task}.`,
        prepare: `Put the repository or issue for ${task} in front of you.`,
        imperfect: `Write a rough note describing the expected behavior for ${task}.`,
        tiny: `Read the name of one file, function, or issue related to ${task}.`,
      };
    case 'cleaning':
      return {
        domain: 'cleaning',
        place: 'the room or area',
        target: 'one visible item or surface',
        unit: 'one item or a small surface',
        open: `Stand near the room or area involved in ${task}.`,
        locate: `Choose one visible item or surface involved in ${task}.`,
        prepare: `Bring one bin, bag, cloth, or tool needed for ${task} nearby.`,
        imperfect: `Move one item without trying to finish ${task}.`,
        tiny: `Look at one visible item related to ${task}.`,
      };
    case 'cooking':
      return {
        domain: 'cooking',
        place: 'the kitchen or recipe',
        target: 'the recipe or ingredients',
        unit: 'one ingredient or utensil',
        open: `Go to the kitchen and find the recipe or ingredients for ${task}.`,
        locate: `Choose the first ingredient or utensil needed for ${task}.`,
        prepare: `Put one ingredient or utensil for ${task} on the counter.`,
        imperfect: `Read the first instruction for ${task} without trying to complete the meal.`,
        tiny: `Touch or move one ingredient or utensil related to ${task}.`,
      };
    case 'errand':
      return {
        domain: 'errand',
        place: 'the list, order, route, or store details',
        target: 'one item or destination',
        unit: 'one item, destination, or order detail',
        open: `Open the list, order, route, or store details needed for ${task}.`,
        locate: `Find the first item or destination involved in ${task}.`,
        prepare: `Put your bag, keys, or the first item needed for ${task} within reach.`,
        imperfect: `Write down one item or destination for ${task} without planning the rest.`,
        tiny: `Look at one item or order detail related to ${task}.`,
      };
    case 'admin':
      return {
        domain: 'admin',
        place: 'the form, account, or paperwork',
        target: 'the relevant form, account, or document',
        unit: 'the first field or piece of information',
        open: `Open the form, account, or paperwork needed for ${task}.`,
        locate: `Find the form, account, or document connected to ${task}.`,
        prepare: `Put the documents or account details needed for ${task} within reach.`,
        imperfect: `Open ${task} without submitting anything and write down what is missing.`,
        tiny: `Read the first field or requirement shown for ${task}.`,
      };
    case 'planning':
      return {
        domain: 'planning',
        place: 'the notes, calendar, or planning space',
        target: 'the first decision or constraint',
        unit: 'one decision, date, or constraint',
        open: `Open the notes, calendar, or planning space for ${task}.`,
        locate: `Find the first decision or constraint involved in ${task}.`,
        prepare: `Put the notes or calendar for ${task} in front of you.`,
        imperfect: `Write one rough option for ${task} without choosing the final plan.`,
        tiny: `Read or write one date, constraint, or decision related to ${task}.`,
      };
    case 'physical':
      return {
        domain: 'physical',
        place: 'the place or equipment needed',
        target: 'the first item or movement',
        unit: 'one small movement or preparation',
        open: `Go to the place or equipment needed for ${task}.`,
        locate: `Find the first item or movement involved in ${task}.`,
        prepare: `Put on, bring out, or place the first item needed for ${task}.`,
        imperfect: `Prepare one small part of ${task} without committing to finishing it.`,
        tiny: `Make one small movement related to ${task}.`,
      };
    default:
      return {
        domain: 'generic',
        place: 'the app, file, object, or place this task needs',
        target: 'the first thing involved',
        unit: 'one visible piece',
        open: `Open, find, or go to the place where ${task} needs to happen.`,
        locate: `Find the first thing involved in ${task}.`,
        prepare: `Put one item or resource needed for ${task} within reach.`,
        imperfect: `Make a rough start on ${task} without trying to make it good yet.`,
        tiny: `Look at or touch the first thing needed for ${task}.`,
      };
  }
}

function createAction(text: string, estimatedMinutes: number): RescueAction {
  return {
    id: generateActionId(),
    text,
    estimatedMinutes,
  };
}

function initialActionText(taskText: string, friction: FrictionType, context: TaskContext): string {
  const task = quoteTask(taskText);

  switch (friction) {
    case 'dont-know-where-to-start':
      return `${context.open} Then find the first thing involved.`;
    case 'feels-too-big':
      return `Choose ${context.unit} for ${task}. That is the only part you need to decide right now.`;
    case 'anxious-about-doing-it-badly':
      return context.imperfect;
    case 'feels-boring':
      return `Set a 2-minute timer. ${context.tiny}`;
    case 'low-energy':
      return context.prepare;
    case 'too-many-competing-tasks':
      return `Move one unrelated distraction aside, then leave ${context.place} for ${task} visible.`;
    case 'not-sure':
      return `Say out loud what “done” would look like for ${task}.`;
  }
}

function smallerActionTexts(taskText: string, friction: FrictionType, context: TaskContext): string[] {
  const task = quoteTask(taskText);

  switch (friction) {
    case 'dont-know-where-to-start':
      return [
        context.open,
        context.locate,
        `Look at only the first visible part of ${task}.`,
        `Put your hand or cursor on where you will begin ${task}.`,
        `Stay with that starting point for 5 seconds.`,
      ];
    case 'feels-too-big':
      return [
        `Name one small piece of ${task}.`,
        `Choose ${context.unit} for ${task}.`,
        `Write one word or place one item related to ${task}.`,
        `Touch or open the first thing needed for ${task}.`,
        `Look at that starting point for 10 seconds.`,
      ];
    case 'anxious-about-doing-it-badly':
      return [
        `Open or place the starting point for ${task} without doing it yet.`,
        context.imperfect,
        `Write or say three rough words about ${task}.`,
        `Make one deliberately imperfect mark or movement for ${task}.`,
        `Take one breath while keeping ${task} visible.`,
      ];
    case 'feels-boring':
      return [
        `Set a 30-second timer. ${context.tiny}`,
        `Do one repetition or interaction related to ${task}.`,
        `Look at the starting point for ${task} for 15 seconds.`,
        `Touch or point to the next thing for ${task}.`,
        `Count down from 5 to 1 while facing ${task}.`,
      ];
    case 'low-energy':
      return [
        context.prepare,
        `Move one item or body part into position for ${task}.`,
        `Sit, stand, or move to the place where ${task} will happen.`,
        `Open or place the starting point for ${task}.`,
        `Rest for 15 seconds, then look at ${task}.`,
      ];
    case 'too-many-competing-tasks':
      return [
        'Put your phone or one unrelated item out of reach.',
        `Close one unrelated tab, app, or task before returning to ${task}.`,
        `Write only the name of ${task} on a note.`,
        `Choose one visible item or step for ${task}.`,
        `Look at that one item for 10 seconds.`,
      ];
    case 'not-sure':
      return [
        `Name one word connected to ${task}.`,
        `Say “I am looking at this now” while facing ${task}.`,
        `Write three words about what makes ${task} unclear.`,
        `Point to the smallest visible part of ${task}.`,
        `Take one breath and choose whether to continue or stop.`,
      ];
  }
}

function alternativeActionTexts(taskText: string, friction: FrictionType, context: TaskContext): string[] {
  const task = quoteTask(taskText);

  switch (friction) {
    case 'dont-know-where-to-start':
      return [
        context.locate,
        `Ask a person or tool what the first step for ${task} is.`,
        `Look for a previous example related to ${task}.`,
      ];
    case 'feels-too-big':
      return [
        `Write down only ${context.unit} for ${task}.`,
        `Set a 5-minute timer and work only on ${context.unit} for ${task}.`,
        `Describe 1% of ${task} in one phrase.`,
      ];
    case 'anxious-about-doing-it-badly':
      return [
        `Open the starting place for ${task} and label it “rough draft”.`,
        `Imagine someone doing ${task} imperfectly. What would they do first?`,
        `Create the least polished acceptable version of one part of ${task}.`,
      ];
    case 'feels-boring':
      return [
        `Put on music or a podcast, then do one small part of ${task}.`,
        `Set a challenge: how much of ${task} can you do in 3 minutes?`,
        `Pair ${task} with a small enjoyable thing, such as a drink or snack.`,
      ];
    case 'low-energy':
      return [
        `Do the easiest physical preparation for ${task}.`,
        `Rest for 5 minutes, then return to ${context.target} for ${task}.`,
        `Just get ${context.target} for ${task} in front of you.`,
      ];
    case 'too-many-competing-tasks':
      return [
        `Write all competing tasks down and circle ${task}.`,
        `Use a random picker to choose one task, then give ${task} two minutes.`,
        `Ask: if only one part of ${task} could happen today, which part matters most?`,
      ];
    case 'not-sure':
      return [
        `Do a 2-minute “taste” of ${task}.`,
        `Ask someone: “What should I do first for ${task}?”`,
        `Choose the smallest visible action connected to ${task}.`,
      ];
  }
}

export interface ActionGenerator {
  /** Generate the initial action for a task+friction pair. */
  generateInitialAction(taskText: string, friction: FrictionType): RescueAction;

  /** Generate a smaller, task-aware version of the current action. */
  generateSmallerAction(
    taskText: string,
    currentAction: RescueAction,
    friction: FrictionType,
    depth?: number,
  ): RescueAction;

  /** Generate an alternative, task-aware action. */
  generateAlternativeAction(
    taskText: string,
    friction: FrictionType,
    previousActions: readonly RescueAction[],
  ): RescueAction;

  /** Maximum number of adaptations before suggesting a break. */
  readonly maxAdaptationDepth: number;
}

export function createActionGenerator(): ActionGenerator {
  return {
    maxAdaptationDepth: 5,

    generateInitialAction(taskText: string, friction: FrictionType): RescueAction {
      return createAction(initialActionText(taskText, friction, createTaskContext(taskText)), 2);
    },

    generateSmallerAction(
      taskText: string,
      _currentAction: RescueAction,
      friction: FrictionType,
      depth: number = 0,
    ): RescueAction {
      const actions = smallerActionTexts(taskText, friction, createTaskContext(taskText));
      const index = Math.min(Math.max(0, depth), actions.length - 1);
      return createAction(actions[index], 1);
    },

    generateAlternativeAction(
      taskText: string,
      friction: FrictionType,
      previousActions: readonly RescueAction[],
    ): RescueAction {
      const alternatives = alternativeActionTexts(taskText, friction, createTaskContext(taskText));
      const previousTexts = new Set(previousActions.map((action) => action.text));
      const nextText = alternatives.find((text) => !previousTexts.has(text))
        ?? `Look at one small, concrete part of ${quoteTask(taskText)} for 10 seconds.`;

      return createAction(nextText, 2);
    },
  };
}
