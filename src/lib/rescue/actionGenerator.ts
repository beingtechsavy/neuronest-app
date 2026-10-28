// ────────────────────────────────────────────────────
// NeuroNest Rescue — Task-aware deterministic fallback action generator
// Used when the AI Rescue endpoint is unavailable, rate-limited, or too slow.
//
// Voice rules for every string in this file:
// - Speak to the person ("you"), never describe the task in the abstract.
// - One instruction per sentence. Never chain steps with "Then…".
// - Name concrete things (a notes app, one line, your hands).
// - Where the friction is emotional, include permission, not hype.
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
        place: 'your inbox or messaging app',
        target: 'the conversation',
        unit: 'the first sentence',
        open: `Open your inbox or messaging app and find where ${task} belongs. You do not have to write anything yet.`,
        locate: `Find the conversation or contact for ${task}. Just finding it counts.`,
        prepare: `Put the device that has the conversation for ${task} in front of you.`,
        imperfect: `Write a rough, unsent first sentence for ${task}. Nobody sees it but you.`,
        tiny: `Read just the subject line or first message connected to ${task}.`,
      };
    case 'writing':
      return {
        domain: 'writing',
        place: 'the page or app where it will live',
        target: 'the draft or your notes',
        unit: 'a title or a single line',
        open: `Open a fresh page or doc for ${task}. A blank one is fine — the point is to be looking at it.`,
        locate: `Find the file, note, or app where ${task} would live.`,
        prepare: `Put whatever holds your thoughts for ${task} — a doc, a notebook, a notes app — in front of you.`,
        imperfect: `Write one deliberately bad sentence for ${task}. Bad is the goal right now.`,
        tiny: `Type one word or bullet for ${task}. Any word.`,
      };
    case 'study':
      return {
        domain: 'study',
        place: 'your study material or course page',
        target: 'the chapter or question',
        unit: 'one concept, question, or paragraph',
        open: `Open the book, notes, or course page for ${task}. Just have it in front of you.`,
        locate: `Find the chapter, question, or note where ${task} starts.`,
        prepare: `Put the study material for ${task} where you can see it.`,
        imperfect: `Write one rough line about what you already know about ${task}.`,
        tiny: `Read one paragraph or heading connected to ${task}. Nothing more.`,
      };
    case 'coding':
      return {
        domain: 'coding',
        place: 'your editor, repo, or issue tracker',
        target: 'the file, function, or issue',
        unit: 'one expected behavior or code location',
        open: `Open the editor, repo, or issue for ${task}. You do not need to fix anything yet.`,
        locate: `Find the file, function, or issue where ${task} lives.`,
        prepare: `Open the repo or issue for ${task} and leave it on screen.`,
        imperfect: `Write a two-line note describing what ${task} should do when it works.`,
        tiny: `Read the name of one file or function related to ${task}.`,
      };
    case 'cleaning':
      return {
        domain: 'cleaning',
        place: 'the room or spot',
        target: 'one visible item or surface',
        unit: 'one item or a small surface',
        open: `Go stand in the room or spot where ${task} happens. That is the whole step.`,
        locate: `Pick one visible item that ${task} is about.`,
        prepare: `Grab one bag, cloth, or tool you would need for ${task}.`,
        imperfect: `Move one item toward where it belongs. Do not finish the rest.`,
        tiny: `Touch one item involved in ${task}.`,
      };
    case 'cooking':
      return {
        domain: 'cooking',
        place: 'the kitchen or recipe',
        target: 'the recipe or ingredients',
        unit: 'one ingredient or utensil',
        open: `Walk into the kitchen and find the recipe or first ingredient for ${task}.`,
        locate: `Pick the first ingredient or pan ${task} needs.`,
        prepare: `Put one ingredient or utensil for ${task} on the counter.`,
        imperfect: `Read the first instruction for ${task} without planning to cook it yet.`,
        tiny: `Take out one ingredient or utensil for ${task}.`,
      };
    case 'errand':
      return {
        domain: 'errand',
        place: 'the list, order, or store page',
        target: 'one item or destination',
        unit: 'one item, destination, or order detail',
        open: `Open the list, order, or store page for ${task}.`,
        locate: `Find the first item or destination ${task} involves.`,
        prepare: `Put your bag, keys, or wallet where you will see them when it is time for ${task}.`,
        imperfect: `Write down one item or stop for ${task}. No full list yet.`,
        tiny: `Look at one item or detail connected to ${task}.`,
      };
    case 'admin':
      return {
        domain: 'admin',
        place: 'the form, account, or paperwork',
        target: 'the form, account, or document',
        unit: 'the first field or piece of information',
        open: `Open the form, app, or paperwork for ${task}. Staring at it is allowed.`,
        locate: `Find the form or account ${task} needs.`,
        prepare: `Put the documents or details for ${task} within reach.`,
        imperfect: `Open ${task} and write down what is missing — do not submit anything.`,
        tiny: `Read just the first field or requirement of ${task}.`,
      };
    case 'planning':
      return {
        domain: 'planning',
        place: 'your notes, calendar, or planning space',
        target: 'the first decision or constraint',
        unit: 'one decision, date, or constraint',
        open: `Open your notes or calendar for ${task}.`,
        locate: `Find the first decision ${task} is waiting on.`,
        prepare: `Put the notes or calendar for ${task} in front of you.`,
        imperfect: `Write one rough option for ${task}. You are not choosing it yet.`,
        tiny: `Write or read one date, constraint, or decision related to ${task}.`,
      };
    case 'physical':
      return {
        domain: 'physical',
        place: 'the place or equipment',
        target: 'the first item or movement',
        unit: 'one small movement or preparation',
        open: `Go to where ${task} happens or grab what it needs.`,
        locate: `Find the first item or movement ${task} involves.`,
        prepare: `Put on or bring out the first thing ${task} needs.`,
        imperfect: `Do one small, easy part of ${task} without committing to the rest.`,
        tiny: `Make one small movement toward ${task}.`,
      };
    default:
      return {
        domain: 'generic',
        place: 'the app, file, or spot this task needs',
        target: 'the first thing involved',
        unit: 'one visible piece',
        open: `Open or go to wherever ${task} would happen. Just being there is the step.`,
        locate: `Find the first thing ${task} involves — an app, a file, an object.`,
        prepare: `Put one thing you need for ${task} within reach.`,
        imperfect: `Make a rough start on ${task} — rough on purpose.`,
        tiny: `Look at or touch the first thing ${task} needs.`,
      };
  }
}

function createAction(text: string, estimatedMinutes: number, why?: string): RescueAction {
  return why
    ? { id: generateActionId(), text, estimatedMinutes, why }
    : { id: generateActionId(), text, estimatedMinutes };
}

// Why-lines for the fallback actions. The UI shows these under the action, so
// they carry the warmth the deterministic templates otherwise lack.
const INITIAL_WHY: Record<FrictionType, string> = {
  'dont-know-where-to-start': 'Finding the place counts as starting — momentum often follows contact.',
  'feels-too-big': 'Choosing one small slice shrinks the task to a size you can face.',
  'anxious-about-doing-it-badly': 'A rough, unsent version cannot be judged — it only has to exist.',
  'feels-boring': 'Two minutes is short enough that boring does not get a vote.',
  'low-energy': 'Setting things up is real progress when energy is low.',
  'too-many-competing-tasks': 'Clearing one distraction gives your attention a place to land.',
  'not-sure': 'Naming what done looks like turns a fog into a target.',
};

const SMALLER_WHY = [
  'One notch smaller still moves you forward.',
  'This version asks almost nothing of you — that is the point.',
  'Brief contact with the task is a genuine start.',
  'You do not have to feel ready to touch the task.',
  'Staying near the task keeps the door open.',
] as const;

const ALTERNATIVE_WHY = 'A different angle can lower resistance in a way more effort cannot.';
const CONTINUATION_WHY = 'You already started — the next piece is smaller than it looked at the beginning.';

function initialActionText(taskText: string, friction: FrictionType, context: TaskContext): string {
  const task = quoteTask(taskText);

  switch (friction) {
    case 'dont-know-where-to-start':
      return context.open;
    case 'feels-too-big':
      return `Pick ${context.unit} for ${task}. That is the only decision you have to make right now.`;
    case 'anxious-about-doing-it-badly':
      return context.imperfect;
    case 'feels-boring':
      return `Set a 2-minute timer. ${context.tiny}`;
    case 'low-energy':
      return context.prepare;
    case 'too-many-competing-tasks':
      return `Move one distraction out of reach, then leave the starting point of ${task} open in front of you.`;
    case 'not-sure':
      return `Say out loud what “done” would look like for ${task}. One sentence is enough.`;
  }
}

function smallerActionTexts(taskText: string, friction: FrictionType, context: TaskContext): string[] {
  const task = quoteTask(taskText);

  switch (friction) {
    case 'dont-know-where-to-start':
      return [
        context.open,
        context.locate,
        `Look at the first visible piece of ${task} for ten seconds. That is all.`,
        `Put your hand or cursor on the exact spot where ${task} would begin.`,
        `Stay with that spot for five more seconds. You are not behind — this is the work right now.`,
      ];
    case 'feels-too-big':
      return [
        `Name one small piece of ${task} out loud or on paper.`,
        `Pick ${context.unit} for ${task}.`,
        `Write one word or move one thing that belongs to ${task}.`,
        `Touch or open the first thing ${task} needs.`,
        `Look at that starting point for ten seconds. Starting counts even when it is this small.`,
      ];
    case 'anxious-about-doing-it-badly':
      return [
        `Open the place where ${task} would happen — and stop there. Opening is allowed to be the whole step.`,
        context.imperfect,
        `Write or say three rough words about ${task}. They can be wrong.`,
        `Make one deliberately imperfect mark or movement for ${task}.`,
        `Take one slow breath with ${task} still visible. Then decide if you want to keep going.`,
      ];
    case 'feels-boring':
      return [
        `Set a 30-second timer. ${context.tiny}`,
        `Do one single interaction with ${task} — one tap, one line, one motion.`,
        `Look at the starting point for ${task} for fifteen seconds.`,
        `Touch or point at the next thing ${task} needs.`,
        `Count down from five while facing ${task}. Boring gets easier after contact.`,
      ];
    case 'low-energy':
      return [
        context.prepare,
        `Move one thing into place for ${task}. One thing is plenty today.`,
        `Go to the spot where ${task} will happen and sit or stand there.`,
        `Open or set out the starting point for ${task}.`,
        `Rest for fifteen seconds with ${task} in view. Rest counts as preparing.`,
      ];
    case 'too-many-competing-tasks':
      return [
        `Put your phone or one unrelated thing out of arm's reach.`,
        `Close one unrelated tab or app before you return to ${task}.`,
        `Write only the name of ${task} on a note or blank page.`,
        `Choose one visible piece of ${task} to look at first.`,
        `Look at that one piece for ten seconds. Everything else can wait its turn.`,
      ];
    case 'not-sure':
      return [
        `Name one word that ${task} brings up.`,
        `Say “I am looking at this now” while facing whatever ${task} involves.`,
        `Write three words about what feels unclear about ${task}.`,
        `Point at the smallest visible part of ${task}.`,
        `Take one breath, then choose: keep going or stop for now. Both are fine.`,
      ];
  }
}

function alternativeActionTexts(taskText: string, friction: FrictionType, context: TaskContext): string[] {
  const task = quoteTask(taskText);

  switch (friction) {
    case 'dont-know-where-to-start':
      return [
        context.locate,
        `Ask someone or something — a person, a search, a tool — what the very first step of ${task} usually is.`,
        `Find a past example of ${task} and just look at how it started.`,
      ];
    case 'feels-too-big':
      return [
        `Write down just ${context.unit} for ${task} and nothing else.`,
        `Set a 5-minute timer and give it only to ${context.unit} of ${task}.`,
        `Describe 1% of ${task} in one short phrase.`,
      ];
    case 'anxious-about-doing-it-badly':
      return [
        `Open the starting place for ${task} and label it “rough draft” out loud or in writing.`,
        `Picture someone else doing ${task} badly. What would their first move be?`,
        `Make the least polished version of one part of ${task} that you can accept.`,
      ];
    case 'feels-boring':
      return [
        `Put on music or a podcast and do one small piece of ${task} alongside it.`,
        `Race a 3-minute timer: how much of ${task} can you get done?`,
        `Pair ${task} with one small treat — a drink, a snack, a good seat.`,
      ];
    case 'low-energy':
      return [
        `Do the easiest physical bit of preparing for ${task}.`,
        `Rest for five minutes first. Then look at ${context.target} for ${task}.`,
        `Just get ${context.target} for ${task} in front of you. Nothing after that.`,
      ];
    case 'too-many-competing-tasks':
      return [
        `Write every competing task down, then circle only ${task}.`,
        `Pick a task at random — if it is not ${task}, give it two minutes and come back.`,
        `Ask: if only one piece of ${task} could happen today, which piece would matter most?`,
      ];
    case 'not-sure':
      return [
        `Give ${task} a two-minute “taste” — just enough to know it better.`,
        `Ask someone: “What would you do first with ${task}?”`,
        `Choose the smallest visible action ${task} allows and do only that.`,
      ];
  }
}

function continuationActionTexts(taskText: string, context: TaskContext): string[] {
  const task = quoteTask(taskText);

  switch (context.domain) {
    case 'communication':
      return [
        `Write a rough version of the main point you want to send for ${task}.`,
        `Add one real detail to the message for ${task}.`,
        `Read the draft for ${task} once and fix one thing that sounds off.`,
        `Send or schedule the message for ${task} if it is close enough. Close enough is good enough.`,
      ];
    case 'writing':
      return [
        `Add three rough bullets under the title for ${task}.`,
        `Pick one bullet for ${task} and grow it into two sentences.`,
        `Add one example or detail to the draft for ${task}.`,
        `Read the draft for ${task} once and mark the next missing piece.`,
      ];
    case 'study':
      return [
        `Write one question you want ${task} to answer.`,
        `Read one short section of ${task} and write one sentence from memory.`,
        `Answer one practice question connected to ${task}.`,
        `Mark the one concept in ${task} that still feels shaky.`,
      ];
    case 'coding':
      return [
        `Write one expected behavior for ${task} as a tiny example.`,
        `Find the smallest file or function that should change for ${task}.`,
        `Make one focused change for ${task}.`,
        `Run the narrowest check that tells you whether ${task} works now.`,
      ];
    case 'cleaning':
      return [
        `Clear one small surface or group of items for ${task}.`,
        `Put five items from ${task} back where they belong.`,
        `Pick the next visible section of ${task} and give it two minutes.`,
        `Decide what “good enough” means for ${task} — then stop there.`,
      ];
    case 'cooking':
      return [
        `Prep the first ingredient or pan for ${task}.`,
        `Do the next short instruction in the recipe for ${task}.`,
        `Taste or check the food for ${task} and adjust one thing if needed.`,
        `Set up the next serving or cleanup step for ${task}.`,
      ];
    case 'errand':
      return [
        `Confirm the first item, stop, or requirement for ${task}.`,
        `Do one small transaction or prep step for ${task}.`,
        `Check what is still missing before ${task} can be finished.`,
        `Do the next concrete thing that moves ${task} toward done.`,
      ];
    case 'admin':
      return [
        `Fill in the easiest field or detail for ${task}.`,
        `Find one document or answer you still need for ${task}.`,
        `Complete the next small section of ${task}.`,
        `Look at ${task} once and name the one thing blocking it from being submitted.`,
      ];
    case 'planning':
      return [
        `Write down the first decision or constraint for ${task}.`,
        `Choose one realistic option for ${task} — realistic, not perfect.`,
        `Put one date or commitment from ${task} on the calendar.`,
        `Look over the plan for ${task} and name what it depends on next.`,
      ];
    case 'physical':
      return [
        `Do the next small movement or prep for ${task}.`,
        `Stay with ${task} for two minutes without trying to improve anything.`,
        `Do one easy repetition connected to ${task}.`,
        `Choose on purpose: another two minutes of ${task}, or stop for today.`,
      ];
    default:
      return [
        `Name the next visible piece of ${task} after what you just finished.`,
        `Give that one piece of ${task} two minutes.`,
        `Make one concrete improvement to ${task}.`,
        `Check what is still missing before ${task} can be called done.`,
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

  /** Generate the next meaningful action after the current step is complete. */
  generateContinuationAction(
    taskText: string,
    previousActions: readonly RescueAction[],
  ): RescueAction;

  /** Maximum number of adaptations before suggesting a break. */
  readonly maxAdaptationDepth: number;
}

export function createActionGenerator(): ActionGenerator {
  return {
    maxAdaptationDepth: 5,

    generateInitialAction(taskText: string, friction: FrictionType): RescueAction {
      const text = initialActionText(taskText, friction, createTaskContext(taskText));
      return createAction(text, 2, INITIAL_WHY[friction]);
    },

    generateSmallerAction(
      taskText: string,
      _currentAction: RescueAction,
      friction: FrictionType,
      depth: number = 0,
    ): RescueAction {
      const actions = smallerActionTexts(taskText, friction, createTaskContext(taskText));
      const index = Math.min(Math.max(0, depth), actions.length - 1);
      return createAction(actions[index], 1, SMALLER_WHY[index]);
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

      return createAction(nextText, 2, ALTERNATIVE_WHY);
    },

    generateContinuationAction(
      taskText: string,
      previousActions: readonly RescueAction[],
    ): RescueAction {
      const continuation = continuationActionTexts(taskText, createTaskContext(taskText));
      const previousTexts = new Set(previousActions.map((action) => action.text));
      const nextText = continuation.find((text) => !previousTexts.has(text))
        ?? `Take the next concrete step toward ${quoteTask(taskText)} without reopening the starting point.`;

      return createAction(nextText, 3, CONTINUATION_WHY);
    },
  };
}