// =============================================================================
// API: POST /api/visualise/clarify (Batch CQ)
//
// Accepts the user's input text + prior clarify answers, returns either
// the next question to ask (chip-based from questions.json, or free-text
// for the data topic) OR done=true to proceed to /api/visualise/generate.
//
// Pure decision route — no quota, no database writes, no blob ops. Free
// to call as many times as the clarify flow needs. The generate call
// that follows is the one that costs a use.
//
// Session state lives entirely client-side (React context per scope doc
// decision 5 — session-scoped, one-shot). The server is stateless; the
// client sends the whole prior-answers array on each call.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import { decide } from '@/lib/visualise/ai/clarify/decide';
import {
  CLARIFY_MAX_ANSWER_WORDS,
  CLARIFY_MAX_ROUNDS,
  countWords,
  truncateToWordCap,
  type ClarifyAnswer,
  type ClarifyRequest,
  type ClarifyResponse,
  type ClarifyTopic,
} from '@/lib/visualise/ai/clarify/types';

// Minimal runtime validation for incoming answers. We don't pull in zod here
// just for this — the shape is small and the cost isn't justified.
function sanitiseAnswer(raw: unknown): ClarifyAnswer | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as { topic?: unknown; value?: unknown };
  if (typeof obj.topic !== 'string' || typeof obj.value !== 'string') return null;
  const validTopics: ClarifyTopic[] = ['family', 'preset', 'count', 'palette', 'data'];
  if (!validTopics.includes(obj.topic as ClarifyTopic)) return null;

  // Server-side safety net for the 40-word cap. Client enforces at entry time
  // but we truncate here too so a modified client can't bypass it.
  const value = obj.topic === 'data' ? truncateToWordCap(obj.value) : obj.value;
  if (value.length > 500) return null; // hard ceiling regardless of word count

  return { topic: obj.topic as ClarifyTopic, value };
}

export async function POST(req: NextRequest): Promise<NextResponse<ClarifyResponse | { error: string }>> {
  // Auth — clarify is a gated feature alongside generate; same rules apply.
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  let body: ClarifyRequest;
  try {
    body = (await req.json()) as ClarifyRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }
  if (text.length > 8000) {
    return NextResponse.json({ error: 'text too long' }, { status: 400 });
  }

  const priorRaw = Array.isArray(body.priorAnswers) ? body.priorAnswers : [];
  const priorAnswers: ClarifyAnswer[] = priorRaw
    .map(sanitiseAnswer)
    .filter((a): a is ClarifyAnswer => a !== null)
    .slice(0, CLARIFY_MAX_ROUNDS); // can't have more answers than max rounds

  // Reject free-text answers that exceed the word cap outright (rather than
  // silently truncating) — the client should never send these. Truncation
  // above is belt-and-braces for safety, not primary enforcement.
  for (const a of priorAnswers) {
    if (a.topic === 'data' && countWords(a.value) > CLARIFY_MAX_ANSWER_WORDS) {
      return NextResponse.json(
        { error: `Answer exceeds ${CLARIFY_MAX_ANSWER_WORDS}-word cap` },
        { status: 400 },
      );
    }
  }

  const result = decide(text, priorAnswers);
  return NextResponse.json(result satisfies ClarifyResponse);
}
