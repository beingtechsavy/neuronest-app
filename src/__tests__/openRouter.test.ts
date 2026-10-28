// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const primaryModel = 'deepseek/deepseek-v4.1-flash-1017';
const fallbackModel = 'liquid/lfm-2.5-2.6b:free';
const validStep = {
  step: '  Gather project notes  ',
  difficulty: 'EASY',
  estimatedMinutes: 10,
  order: 1,
  completionCriteria: '  All relevant notes are collected  ',
  encouragement: '  You can do this!  ',
};

function completionResponse(
  content: string | null = JSON.stringify({ steps: [validStep] }),
  finishReason = 'stop',
  refusal: string | null = null,
  model = primaryModel
) {
  return new Response(JSON.stringify({
    id: 'test-completion',
    object: 'chat.completion',
    created: 1,
    model,
    choices: [{
      index: 0,
      finish_reason: finishReason,
      logprobs: null,
      message: { role: 'assistant', content, refusal },
    }],
  }), { headers: { 'Content-Type': 'application/json' } });
}

const fetchMock = vi.fn<typeof fetch>();
let generateTaskBreakdown: typeof import('@/lib/openRouter').generateTaskBreakdown;
let generateRescueAction: typeof import('@/lib/openRouter').generateRescueAction;

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv('OPENROUTER_API_KEY', 'test-only-not-a-real-key');
  vi.stubEnv('OPENROUTER_MODEL', undefined);
  vi.stubEnv('OPENROUTER_FALLBACK_MODEL', undefined);
  vi.stubEnv('OPENROUTER_SITE_URL', undefined);
  vi.stubEnv('OPENROUTER_APP_NAME', undefined);
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(completionResponse());
  ({ generateTaskBreakdown, generateRescueAction } = await import('@/lib/openRouter'));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('OpenRouter model routing', () => {
  it('serializes the paid primary, free fallback, and compatible JSON routing through the real SDK', async () => {
    const steps = await generateTaskBreakdown({ title: 'Prepare a project' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://openrouter.ai/api/v1/chat/completions');
    const body = JSON.parse(String(init?.body));
    expect(body).toMatchObject({
      model: primaryModel,
      models: [primaryModel, fallbackModel],
      provider: { require_parameters: true },
      response_format: { type: 'json_object' },
    });
    expect(body).not.toHaveProperty('extra_body');
    expect(steps).toEqual([{
      ...validStep,
      step: validStep.step.trim(),
      completionCriteria: validStep.completionCriteria.trim(),
      encouragement: validStep.encouragement.trim(),
    }]);
  });

  it('honors validated overrides in priority order and accepts a fallback response', async () => {
    vi.stubEnv('OPENROUTER_MODEL', ` ${primaryModel} `);
    vi.stubEnv('OPENROUTER_FALLBACK_MODEL', ` ${fallbackModel} `);
    fetchMock.mockResolvedValue(completionResponse(undefined, 'stop', null, primaryModel));

    await expect(generateTaskBreakdown({ title: 'Prepare a project' })).resolves.toHaveLength(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.model).toBe(primaryModel);
    expect(body.models).toEqual([primaryModel, fallbackModel]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries the validated fallback when the provider returns an error without model failover', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: { code: 404, message: 'Provider returned error' },
      }), { status: 404, headers: { 'Content-Type': 'application/json' } }))
      .mockResolvedValueOnce(completionResponse(undefined, 'stop', null, fallbackModel));

    await expect(generateTaskBreakdown({ title: 'Prepare a project' })).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(firstBody.models).toEqual([primaryModel, fallbackModel]);

    const fallbackBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(fallbackBody.model).toBe(fallbackModel);
    expect(fallbackBody.models).toEqual([fallbackModel]);
  });

  it('does not duplicate identical primary and fallback models', async () => {
    vi.stubEnv('OPENROUTER_MODEL', fallbackModel);
    vi.stubEnv('OPENROUTER_FALLBACK_MODEL', fallbackModel);
    await generateTaskBreakdown({ title: 'Prepare a project' });
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.models).toEqual([fallbackModel]);
  });

  const invalidModels = [
    'openai/gpt-oss-20b',
    'openrouter/auto',
    'provider/model:free:paid',
    'provider/model:free,openai/paid',
    'provider/paid,provider/model:free',
    'provider/model:FREE',
    'provider/model:free?other=paid',
    ':free',
    '',
    '   ',
  ];

  describe.each(['OPENROUTER_MODEL', 'OPENROUTER_FALLBACK_MODEL'] as const)('%s validation', (variable) => {
    it.each(invalidModels)('rejects %j before any network request', async (model) => {
      vi.stubEnv(variable, model);
      await expect(generateTaskBreakdown({ title: 'Prepare a project' }))
        .rejects.toThrow(variable === 'OPENROUTER_MODEL'
          ? 'OPENROUTER_MODEL must be DeepSeek V4.1 Flash 1017 or a single provider/model:free ID'
          : 'OPENROUTER_FALLBACK_MODEL must be a single provider/model:free ID');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  it('accepts a free primary while keeping the fallback free', async () => {
    vi.stubEnv('OPENROUTER_MODEL', fallbackModel);
    await generateTaskBreakdown({ title: 'Prepare a project' });
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.models).toEqual([fallbackModel]);
  });

  it('revalidates fallback cost safety even when the SDK client is already cached', async () => {
    await generateTaskBreakdown({ title: 'Prepare a project' });
    vi.stubEnv('OPENROUTER_FALLBACK_MODEL', 'openai/paid-model');
    await expect(generateTaskBreakdown({ title: 'Prepare another project' }))
      .rejects.toThrow('OPENROUTER_FALLBACK_MODEL must be a single provider/model:free ID');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails closed if strict JSON schema support is unavailable', async () => {
    const schemaError = () => new Response(JSON.stringify({
      error: { message: 'No endpoints support the requested parameters', code: 400 },
    }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    fetchMock.mockImplementationOnce(async () => schemaError())
      .mockImplementationOnce(async () => schemaError());

    await expect(generateTaskBreakdown({ title: 'Prepare a project' }))
      .rejects.toThrow('Failed to generate task breakdown');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('task breakdown response validation', () => {
  const invalidResponses: [string, unknown][] = [
    ['top-level array', [validStep]],
    ['null envelope', null],
    ['primitive envelope', 'steps'],
    ['missing steps', {}],
    ['extra envelope fields', { steps: [validStep], extra: true }],
    ['non-array steps', { steps: {} }],
    ['empty steps', { steps: [] }],
    ['too many steps', { steps: Array.from({ length: 11 }, () => validStep) }],
    ['null step', { steps: [validStep, null] }],
    ['array step', { steps: [validStep, []] }],
    ['primitive step', { steps: [validStep, 'do work'] }],
    ['empty title', { steps: [{ ...validStep, step: ' ' }] }],
    ['object title', { steps: [{ ...validStep, step: {} }] }],
    ['invalid difficulty', { steps: [{ ...validStep, difficulty: 'easy' }] }],
    ['missing estimate', { steps: [{ ...validStep, estimatedMinutes: undefined }] }],
    ['numeric string estimate', { steps: [{ ...validStep, estimatedMinutes: '10' }] }],
    ['NaN string estimate', { steps: [{ ...validStep, estimatedMinutes: 'NaN' }] }],
    ['NaN serialized as null', { steps: [{ ...validStep, estimatedMinutes: NaN }] }],
    ['infinite estimate serialized as null', { steps: [{ ...validStep, estimatedMinutes: Infinity }] }],
    ['zero estimate', { steps: [{ ...validStep, estimatedMinutes: 0 }] }],
    ['negative estimate', { steps: [{ ...validStep, estimatedMinutes: -1 }] }],
    ['fractional estimate', { steps: [{ ...validStep, estimatedMinutes: 1.5 }] }],
    ['oversized estimate', { steps: [{ ...validStep, estimatedMinutes: 481 }] }],
    ['non-integer order', { steps: [{ ...validStep, order: 1.5 }] }],
    ['string order', { steps: [{ ...validStep, order: '1' }] }],
    ['out-of-range order', { steps: [{ ...validStep, order: 0 }] }],
    ['blank completion criteria', { steps: [{ ...validStep, completionCriteria: ' ' }] }],
    ['missing encouragement', { steps: [{ ...validStep, encouragement: undefined }] }],
    ['object encouragement', { steps: [{ ...validStep, encouragement: {} }] }],
    ['extra step fields', { steps: [{ ...validStep, extra: true }] }],
  ];

  it.each(invalidResponses)('rejects %s without returning a partial breakdown', async (_name, payload) => {
    fetchMock.mockResolvedValue(completionResponse(JSON.stringify(payload)));
    await expect(generateTaskBreakdown({ title: 'Prepare a project' }))
      .rejects.toThrow('Failed to generate task breakdown');
  });

  it.each([
    '',
    'not json',
    '{"steps":[',
    JSON.stringify({ steps: [validStep] }).replace('"estimatedMinutes":10', '"estimatedMinutes":1e400'),
    JSON.stringify({ steps: [validStep] }).replace('"estimatedMinutes":10', '"estimatedMinutes":NaN'),
  ])('rejects invalid or non-finite JSON content %j', async (content) => {
    fetchMock.mockResolvedValue(completionResponse(content));
    await expect(generateTaskBreakdown({ title: 'Prepare a project' }))
      .rejects.toThrow('Failed to generate task breakdown');
  });

  it.each(['length', 'content_filter', 'tool_calls'])('rejects a %s finish even with valid JSON', async (reason) => {
    fetchMock.mockResolvedValue(completionResponse(undefined, reason));
    await expect(generateTaskBreakdown({ title: 'Prepare a project' }))
      .rejects.toThrow('did not return a complete task breakdown');
  });

  it('rejects a refusal even if the response also contains valid JSON', async () => {
    fetchMock.mockResolvedValue(completionResponse(undefined, 'stop', 'Cannot help'));
    await expect(generateTaskBreakdown({ title: 'Prepare a project' }))
      .rejects.toThrow('did not return a complete task breakdown');
  });

  it('accepts boundary estimates, trims text, and normalizes order', async () => {
    fetchMock.mockResolvedValue(completionResponse(JSON.stringify({ steps: [
      { ...validStep, estimatedMinutes: 1, order: 9, encouragement: '' },
      { ...validStep, estimatedMinutes: 480, order: 3 },
    ] })));
    const steps = await generateTaskBreakdown({ title: 'Prepare a project' });
    expect(steps.map((step) => step.estimatedMinutes)).toEqual([1, 480]);
    expect(steps.map((step) => step.order)).toEqual([1, 2]);
    expect(steps[0].encouragement).toBe('');
    expect(steps[1].step).toBe(validStep.step.trim());
  });
});

describe('AI Rescue guidance', () => {
  it('requests one task-aware JSON action with the selected friction and history', async () => {
    fetchMock.mockResolvedValue(completionResponse(JSON.stringify({
      action: 'Open the document and write only the title.',
      estimatedMinutes: 2,
      why: 'A reversible two-minute start lowers the pressure of making the whole document good.',
    })));

    const action = await generateRescueAction({
      taskText: 'Write my quarterly report',
      friction: 'anxious-about-doing-it-badly',
      mode: 'initial',
      previousActions: [],
    });

    expect(action).toEqual({
      text: 'Open the document and write only the title.',
      estimatedMinutes: 2,
      why: 'A reversible two-minute start lowers the pressure of making the whole document good.',
    });
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.messages[1].content).toContain('anxious-about-doing-it-badly');
  });

  it('asks for a meaningful continuation after completed actions', async () => {
    fetchMock.mockResolvedValue(completionResponse(JSON.stringify({
      action: 'Add three rough bullets beneath the report title.',
      estimatedMinutes: 3,
      why: 'The title is already in place, so this advances the report without asking for a polished draft.',
    })));

    await generateRescueAction({
      taskText: 'Write my quarterly report',
      friction: 'feels-too-big',
      mode: 'continuation',
      previousActions: ['Open the document and write the title.'],
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.messages[0].content).toContain('Advance the task with the next meaningful implementation step');
    expect(body.messages[0].content).toContain('Never repeat an already completed setup action');
  });

  it('rejects malformed Rescue actions instead of returning unsafe guidance', async () => {
    fetchMock.mockResolvedValue(completionResponse(JSON.stringify({
      action: 'Do the whole task',
      estimatedMinutes: '30',
      why: '',
    })));

    await expect(generateRescueAction({
      taskText: 'Finish my assignment',
      friction: 'feels-too-big',
      mode: 'smaller',
      previousActions: ['Open the assignment'],
    })).rejects.toThrow('Failed to generate Rescue action');
  });
});
