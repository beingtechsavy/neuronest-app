import { OpenAI } from 'openai';

const DEFAULT_OPENROUTER_MODEL = 'deepseek/deepseek-v4.1-flash-1017';
// The fallback must be a fast, non-reasoning free model. Rescue serves people
// who are stuck right now — a reasoning model (the previous default,
// deepseek-r1:free) deliberates for tens of seconds and is the wrong trade.
const DEFAULT_OPENROUTER_FALLBACK_MODEL = 'liquid/lfm-2.5-2.6b:free';

// Wall-clock budget for one OpenRouter attempt. The AI path must fail fast
// into the deterministic generator rather than leave a stuck person staring
// at a spinner; the fallback model adds one more attempt on top.
const OPENROUTER_TIMEOUT_MS = 12_000;
const FREE_MODEL_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*\/[a-zA-Z0-9][a-zA-Z0-9._-]*:free$/;

type OpenRouterCompletionRequest = OpenAI.ChatCompletionCreateParamsNonStreaming & {
  models: string[];
  provider: { require_parameters: true };
};

function getPrimaryModel(): string {
  const model = (process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL).trim();
  if (model === DEFAULT_OPENROUTER_MODEL || FREE_MODEL_PATTERN.test(model)) {
    return model;
  }

  throw new Error(
    'OPENROUTER_MODEL must be DeepSeek V4.1 Flash 1017 or a single provider/model:free ID.'
  );
}

function getFreeFallbackModel(): string {
  const model = (process.env.OPENROUTER_FALLBACK_MODEL ?? DEFAULT_OPENROUTER_FALLBACK_MODEL).trim();
  if (FREE_MODEL_PATTERN.test(model)) {
    return model;
  }

  throw new Error(
    'OPENROUTER_FALLBACK_MODEL must be a single provider/model:free ID. Paid fallback models are disabled.'
  );
}

let openRouter: OpenAI | null = null;

function getOpenRouterClient(): OpenAI {
  if (!openRouter) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OpenRouter configuration is missing. Please set OPENROUTER_API_KEY.');
    }

    openRouter = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        ...(process.env.OPENROUTER_SITE_URL
          ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL }
          : {}),
        ...(process.env.OPENROUTER_APP_NAME
          ? { 'X-Title': process.env.OPENROUTER_APP_NAME }
          : {}),
      },
    });
  }

  return openRouter;
}

// Applied as an SDK request option on every completion call so a slow or hung
// provider can never hold a stuck user's Rescue open past this budget.
function withTimeout<T extends object>(
  request: T,
): T & { timeout: number } {
  return Object.assign(request, { timeout: OPENROUTER_TIMEOUT_MS });
}

export interface TaskBreakdownStep {
  step: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedMinutes: number;
  order: number;
  completionCriteria: string;
  encouragement?: string;
}

export interface TaskBreakdownRequest {
  title: string;
  description?: string;
  deadline?: string;
  subject?: string;
  userContext?: string;
}

export interface RescueActionRequest {
  taskText: string;
  friction: string;
  previousActions?: string[];
  mode: 'initial' | 'continuation' | 'smaller' | 'different';
}

export interface RescueGuideResult {
  text: string;
  estimatedMinutes: number;
  why: string;
}

const breakdownSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    steps: {
      type: 'array',
      minItems: 1,
      maxItems: 10,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          step: { type: 'string', minLength: 1, maxLength: 500 },
          difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD'] },
          estimatedMinutes: { type: 'integer', minimum: 1, maximum: 480 },
          order: { type: 'integer', minimum: 1, maximum: 10 },
          completionCriteria: { type: 'string', minLength: 1, maxLength: 500 },
          encouragement: { type: 'string', maxLength: 180 },
        },
        required: ['step', 'difficulty', 'estimatedMinutes', 'order', 'completionCriteria', 'encouragement'],
      },
    },
  },
  required: ['steps'],
} as const;

const rescueActionSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    action: { type: 'string', minLength: 1, maxLength: 240 },
    estimatedMinutes: { type: 'integer', minimum: 1, maximum: 10 },
    why: { type: 'string', minLength: 1, maxLength: 180 },
  },
  required: ['action', 'estimatedMinutes', 'why'],
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseBreakdown(content: string): TaskBreakdownStep[] {
  const parsed: unknown = JSON.parse(content);
  if (
    !isRecord(parsed) || Object.keys(parsed).length !== 1 ||
    !Array.isArray(parsed.steps) || parsed.steps.length < 1 || parsed.steps.length > 10
  ) {
    throw new Error('Invalid response format from OpenRouter');
  }

  const requiredKeys = breakdownSchema.properties.steps.items.required;
  return parsed.steps.map((step: unknown, index: number): TaskBreakdownStep => {
    if (
      !isRecord(step) || Object.keys(step).length !== requiredKeys.length ||
      !requiredKeys.every((key) => Object.prototype.hasOwnProperty.call(step, key)) ||
      typeof step.step !== 'string' || !step.step.trim() ||
      (step.difficulty !== 'EASY' && step.difficulty !== 'MEDIUM' && step.difficulty !== 'HARD') ||
      typeof step.estimatedMinutes !== 'number' || !Number.isFinite(step.estimatedMinutes) ||
      !Number.isInteger(step.estimatedMinutes) || step.estimatedMinutes < 1 || step.estimatedMinutes > 480 ||
      typeof step.order !== 'number' || !Number.isInteger(step.order) || step.order < 1 || step.order > 10 ||
      typeof step.completionCriteria !== 'string' || !step.completionCriteria.trim() ||
      typeof step.encouragement !== 'string'
    ) {
      throw new Error(`Invalid step ${index + 1} from OpenRouter`);
    }

    return {
      step: step.step.trim().slice(0, 500),
      difficulty: step.difficulty,
      estimatedMinutes: step.estimatedMinutes,
      order: index + 1,
      completionCriteria: step.completionCriteria.trim().slice(0, 500),
      encouragement: step.encouragement.trim().slice(0, 180),
    };
  });
}

function parseRescueAction(content: string): RescueGuideResult {
  const parsed: unknown = JSON.parse(content);
  if (!isRecord(parsed) || Object.keys(parsed).length !== 3) {
    throw new Error('Invalid Rescue response format from OpenRouter');
  }

  if (
    typeof parsed.action !== 'string' || !parsed.action.trim() ||
    typeof parsed.estimatedMinutes !== 'number' || !Number.isInteger(parsed.estimatedMinutes) ||
    parsed.estimatedMinutes < 1 || parsed.estimatedMinutes > 10 ||
    typeof parsed.why !== 'string' || !parsed.why.trim()
  ) {
    throw new Error('Invalid Rescue action from OpenRouter');
  }

  return {
    text: parsed.action.trim().slice(0, 240),
    estimatedMinutes: parsed.estimatedMinutes,
    why: parsed.why.trim().slice(0, 180),
  };
}

function buildCompletionRequest(
  model: string,
  models: string[],
  systemPrompt: string,
  userPrompt: string
): OpenRouterCompletionRequest {
  return {
    model,
    models,
    // Fail rather than routing to endpoints that ignore the JSON schema.
    provider: { require_parameters: true },
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ],
    temperature: 0.4,
    max_tokens: 1500,
      // Use JSON mode for broad provider compatibility. The application
      // performs the strict schema validation in parseBreakdown below.
      response_format: { type: 'json_object' as const },
  };
}

async function requestTaskBreakdown(
  client: OpenAI,
  completionRequest: OpenRouterCompletionRequest
): Promise<TaskBreakdownStep[]> {
  const response = await client.chat.completions.create(withTimeout(completionRequest));
  const choice = response.choices[0];
  if (!choice || choice.finish_reason !== 'stop' || choice.message.refusal) {
    throw new Error('OpenRouter did not return a complete task breakdown');
  }

  const content = choice.message.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('No response from OpenRouter');
  }

  return parseBreakdown(content);
}

async function requestRescueAction(
  client: OpenAI,
  completionRequest: OpenRouterCompletionRequest
): Promise<RescueGuideResult> {
  const response = await client.chat.completions.create(withTimeout(completionRequest));
  const choice = response.choices[0];
  if (!choice || choice.finish_reason !== 'stop' || choice.message.refusal) {
    throw new Error('OpenRouter did not return a complete Rescue action');
  }

  const content = choice.message.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('No Rescue response from OpenRouter');
  }

  return parseRescueAction(content);
}

function isProviderRequestError(error: unknown): boolean {
  return isRecord(error) && typeof error.status === 'number';
}

export async function generateTaskBreakdown(
  request: TaskBreakdownRequest
): Promise<TaskBreakdownStep[]> {
  const systemPrompt = `You are a productivity expert who helps professionals break down complex tasks into clear, actionable steps. Your job is to transform overwhelming work into a structured execution plan.

Core Principles:
1. Start with quick-win steps (5-15 min) to build momentum
2. Progress from setup/research → execution → review
3. Make each step specific and concrete — no vague instructions
4. Include clear completion criteria ("done when...")
5. Consider dependencies between steps
6. Estimate time realistically

Difficulty Ratings:
- EASY: 5-15 minutes, low cognitive load, clear outcome
- MEDIUM: 15-30 minutes, moderate focus required
- HARD: 30+ minutes, deep work, complex thinking

Return 6-10 concrete steps. Always start with 2-3 EASY steps. Make every step feel achievable.`;

  const userPrompt = `Break down this task into actionable steps:

Task: "${request.title}"
${request.description ? `Description: ${request.description}` : ''}
${request.deadline ? `Deadline: ${request.deadline}` : ''}
${request.subject ? `Project: ${request.subject}` : ''}
${request.userContext ? `Additional context: ${request.userContext}` : ''}

Create 6-10 concrete steps. Start easy, build up gradually, and be specific.`;

  try {
    const model = getPrimaryModel();
    const fallbackModel = getFreeFallbackModel();
    const client = getOpenRouterClient();

    // Ask OpenRouter to try both models first. Some provider-side failures are
    // returned without invoking the model fallback, so retry the validated
    // fallback explicitly before surfacing the error to the user.
    const models = Array.from(new Set([model, fallbackModel]));
    try {
      return await requestTaskBreakdown(
        client,
        buildCompletionRequest(model, models, systemPrompt, userPrompt)
      );
    } catch (primaryError) {
      if (fallbackModel === model || !isProviderRequestError(primaryError)) {
        throw primaryError;
      }

      console.warn('OpenRouter primary model failed; retrying the free fallback model.');
      return await requestTaskBreakdown(
        client,
        buildCompletionRequest(fallbackModel, [fallbackModel], systemPrompt, userPrompt)
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('OpenRouter API error details:', {
      message,
      ...(isRecord(error) ? { status: error.status, type: error.type, code: error.code } : {}),
    });
    throw new Error(`Failed to generate task breakdown: ${message}`);
  }
}

export async function generateRescueAction(
  request: RescueActionRequest
): Promise<RescueGuideResult> {
  const taskText = request.taskText.trim().slice(0, 500);
  const previousActions = (request.previousActions || [])
    .map((action) => action.trim().slice(0, 240))
    .filter(Boolean)
    .slice(-6);
  const modeInstruction = request.mode === 'initial'
    ? 'Create the first physical action that gets the person moving.'
    : request.mode === 'continuation'
    ? 'The previous actions are complete. Advance the task with the next meaningful implementation step. Do not return to setup or restart the task.'
    : request.mode === 'smaller'
    ? 'Make the next action smaller, easier, and more concrete than the previous action.'
    : 'Offer a genuinely different approach, not a rewording of a previous action.';

  const systemPrompt = `You are NeuroNest Rescue, a compassionate task coach. Your job is to find one tiny physical or observable action the person can do next, while preserving continuity with the task.

Rules:
- Return exactly one action in the requested JSON object.
- The action must take 1-10 minutes and be specific enough to start immediately.
- Respect the selected friction: "${request.friction}".
- Do not use shame, hype, vague advice, or multi-step plans.
- Do not tell the person to "just do the task".
- When continuing a task, assume every previous action was completed and move one level forward toward the task outcome.
- Never repeat an already completed setup action during continuation.
- For low energy, prefer setup or movement over deep work.
- For anxiety, prefer a private rough or reversible start.
- For a task that feels too big, choose one visible slice.
- ${modeInstruction}`;

  const userPrompt = `Task: "${taskText}"
Selected friction: "${request.friction}"
Previous actions to avoid repeating:
${previousActions.length > 0 ? previousActions.map((action) => `- ${action}`).join('\n') : '- none'}

Return a JSON object with:
- action: one concrete next action
- estimatedMinutes: an integer from 1 to 10
- why: one short sentence explaining why this action fits right now`;

  try {
    const model = getPrimaryModel();
    const fallbackModel = getFreeFallbackModel();
    const client = getOpenRouterClient();
    const models = Array.from(new Set([model, fallbackModel]));
    const buildRequest = (selectedModel: string, selectedModels: string[]): OpenRouterCompletionRequest => ({
      model: selectedModel,
      models: selectedModels,
      provider: { require_parameters: true },
      messages: [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 350,
      response_format: { type: 'json_object' as const },
    });

    try {
      return await requestRescueAction(client, buildRequest(model, models));
    } catch (primaryError) {
      if (fallbackModel === model || !isProviderRequestError(primaryError)) {
        throw primaryError;
      }
      console.warn('OpenRouter Rescue primary failed; retrying the free fallback model.');
      return await requestRescueAction(client, buildRequest(fallbackModel, [fallbackModel]));
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('OpenRouter Rescue error details:', {
      message,
      ...(isRecord(error) ? { status: error.status, type: error.type, code: error.code } : {}),
    });
    throw new Error(`Failed to generate Rescue action: ${message}`);
  }
}
