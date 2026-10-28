import { NextRequest, NextResponse } from 'next/server';
import { generateRescueAction, RescueActionRequest } from '@/lib/openRouter';
import { generateActionId, FRICTION_LABELS, FrictionType } from '@/types/rescue';
import { checkRateLimit } from '@/lib/serverRateLimit';

const FRICTIONS = new Set(Object.keys(FRICTION_LABELS));

function isFrictionType(value: unknown): value is FrictionType {
  return typeof value === 'string' && FRICTIONS.has(value);
}

function isMode(value: unknown): value is RescueActionRequest['mode'] {
  return value === 'initial' || value === 'continuation' || value === 'smaller' || value === 'different';
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(request, 'rescue-ai', 20, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rescue is taking a short breather. Try again soon.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    );
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'AI Rescue is not configured' }, { status: 503 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const taskText = typeof body.taskText === 'string' ? body.taskText.trim() : '';
    const friction = body.friction;
    const mode = body.mode;
    const previousActions = Array.isArray(body.previousActions)
      ? body.previousActions.filter((value): value is string => typeof value === 'string')
      : [];

    if (!taskText || taskText.length > 500 || !isFrictionType(friction) || !isMode(mode)) {
      return NextResponse.json({ error: 'Invalid Rescue request' }, { status: 400 });
    }

    if (previousActions.length > 8 || previousActions.some((action) => action.length > 240)) {
      return NextResponse.json({ error: 'Rescue history is too long' }, { status: 400 });
    }

    const result = await generateRescueAction({
      taskText,
      friction,
      mode,
      previousActions,
    });

    return NextResponse.json({
      action: {
        id: generateActionId(),
        text: result.text,
        estimatedMinutes: result.estimatedMinutes,
        why: result.why,
      },
      source: 'ai',
    });
  } catch (error) {
    console.error('Rescue action API error:', error);
    return NextResponse.json({ error: 'Unable to generate an AI Rescue action' }, { status: 503 });
  }
}
