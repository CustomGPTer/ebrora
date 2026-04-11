// =============================================================================
// API: /api/ai-tools/scope-review
// Two-phase scope review:
//   Phase 1 (action=questions): Upload file + wizard context → AI asks 4 questions
//   Phase 2 (action=generate):  Answers + cached doc text → AI generates report → DOCX
//
// Both phases arrive as POST with FormData.
// Phase 1: file + wizardContext JSON
// Phase 2: wizardContext JSON + answers JSON + parsedText (from phase 1 response)
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { put } from '@vercel/blob';
import { getAiToolLimitByTier } from '@/lib/ai-tools/constants';
import { incrementAiToolUsage } from '@/lib/ai-tools/usage-tracker';
import { generateAiToolDocument } from '@/lib/ai-tools/docx-generator';
import { parseUploadedFile } from '@/lib/ai-tools/upload-parser';
import { wrapUploadContent, detectInjectionPatterns, logInjectionAttempt } from '@/lib/ai-tools/sanitise-input';
import { isValidTemplateSlug } from '@/lib/ai-tools/validate-template-slugs';
import { getContractScopePhase1Prompt, getContractScopeGenerationPrompt } from '@/lib/contract-scope-reviewer/system-prompts';
import { getContractSummaryForPrompt } from '@/lib/contract-scope-reviewer/contract-data';
import type { ContractScopeTemplateSlug, ContractScopeWizardState } from '@/lib/contract-scope-reviewer/types';

export const maxDuration = 300;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const TOOL_SLUG = 'contract-scope-reviewer' as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT_CHARS = 80_000;

// ── Auth + tier check (shared) ────────────────────────────────────────────────
async function authCheck() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Please sign in to use this tool.', status: 401 };
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  const tier = user?.subscription?.tier ?? 'FREE';
  const subscriptionStatus = user?.subscription?.status ?? 'ACTIVE';

  if (tier !== 'FREE' && subscriptionStatus !== 'ACTIVE') {
    return { error: 'Your subscription is not active.', status: 403 };
  }

  const monthLimit = getAiToolLimitByTier(tier, TOOL_SLUG);
  if (monthLimit === 0) {
    return { error: 'This tool requires a paid subscription.', status: 403, upgradeRequired: true };
  }

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const usage = await prisma.aiToolGeneration.count({
    where: {
      user_id: userId,
      created_at: { gte: periodStart, lte: periodEnd },
      status: { in: ['COMPLETED', 'PROCESSING', 'QUEUED'] },
    },
  });

  if (usage >= monthLimit) {
    return { error: `Monthly limit of ${monthLimit} reached. Resets on the 1st.`, status: 429, limitReached: true };
  }

  return { userId, tier };
}

export async function POST(req: NextRequest) {
  let generationId: string | undefined;

  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const auth = await authCheck();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error, upgradeRequired: (auth as any).upgradeRequired, limitReached: (auth as any).limitReached }, { status: auth.status });
    }
    const { userId } = auth;

    // ── Parse form data ──────────────────────────────────────────────────
    let formData: FormData;
    try { formData = await req.formData(); } catch {
      return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 });
    }

    const action = formData.get('action') as string;
    const wizardContextRaw = formData.get('wizardContext') as string;

    if (!action || !wizardContextRaw) {
      return NextResponse.json({ error: 'Missing action or wizardContext.' }, { status: 400 });
    }

    let wizardContext: ContractScopeWizardState;
    try { wizardContext = JSON.parse(wizardContextRaw); } catch {
      return NextResponse.json({ error: 'Invalid wizardContext JSON.' }, { status: 400 });
    }

    // Validate template slug
    if (!isValidTemplateSlug(TOOL_SLUG, wizardContext.templateSlug)) {
      return NextResponse.json({ error: 'Invalid template selected.' }, { status: 400 });
    }

    const contractContext = getContractSummaryForPrompt(wizardContext);

    // ══════════════════════════════════════════════════════════════════════
    // PHASE 1: Upload → AI reads → returns 4 questions
    // ══════════════════════════════════════════════════════════════════════
    if (action === 'questions') {
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
      }

      // Validate file
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum is 10 MB.` }, { status: 400 });
      }
      const ext = file.name.toLowerCase().split('.').pop() || '';
      if (!['pdf', 'docx'].includes(ext)) {
        return NextResponse.json({ error: 'File type not supported. Please upload a PDF or DOCX file.' }, { status: 400 });
      }

      // Parse file
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parseUploadedFile(buffer, file.name, file.type || 'application/octet-stream');

      if (parsed.characterCount < 50) {
        return NextResponse.json({ error: 'Could not extract readable content from the file.' }, { status: 422 });
      }

      // Injection check
      const patterns = detectInjectionPatterns(parsed.text.slice(0, 5000));
      if (patterns.length > 0) logInjectionAttempt(userId, TOOL_SLUG, 'uploaded-file', patterns);

      // Truncate
      const parsedText = parsed.text.length > MAX_TEXT_CHARS
        ? parsed.text.slice(0, MAX_TEXT_CHARS) + '\n\n[... document truncated at 80,000 characters ...]'
        : parsed.text;

      // Wrap content
      const wrappedContent = wrapUploadContent(file.name, parsed.fileType, file.size, parsed.characterCount, parsedText, 'Scope of Works');

      // AI call — Phase 1
      const phase1Prompt = getContractScopePhase1Prompt(contractContext);
      let questionsData: any = null;
      const MAX_RETRIES = 2;
      let retryCount = 0;

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: phase1Prompt },
        { role: 'user', content: wrappedContent },
      ];

      while (retryCount <= MAX_RETRIES) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4.1',
          messages,
          temperature: 0.4,
          max_tokens: 4000,
          response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) throw new Error('No response from AI');

        try {
          questionsData = JSON.parse(responseText);
          break;
        } catch {
          if (retryCount >= MAX_RETRIES) throw new Error('AI returned invalid JSON after retries');
          messages.push({ role: 'assistant', content: responseText });
          messages.push({ role: 'user', content: 'Your response was not valid JSON. Please respond with ONLY a valid JSON object.' });
          retryCount++;
        }
      }

      // Return questions + parsed text (client will send it back in phase 2)
      return NextResponse.json({
        phase: 'questions',
        documentSummary: questionsData.documentSummary || '',
        questions: questionsData.questions || [],
        parsedText,
        fileName: file.name,
        fileSize: file.size,
        fileType: parsed.fileType,
        characterCount: parsed.characterCount,
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // PHASE 2: Answers → AI generates report → DOCX
    // ══════════════════════════════════════════════════════════════════════
    if (action === 'generate') {
      const parsedText = formData.get('parsedText') as string;
      const answersRaw = formData.get('answers') as string;
      const fileName = formData.get('fileName') as string || 'scope-of-works';
      const fileSize = parseInt(formData.get('fileSize') as string || '0', 10);
      const characterCount = parseInt(formData.get('characterCount') as string || '0', 10);
      const fileType = formData.get('fileType') as string || 'pdf';

      if (!parsedText || !answersRaw) {
        return NextResponse.json({ error: 'Missing parsedText or answers.' }, { status: 400 });
      }

      let answers: Array<{ question: string; answer: string }>;
      try { answers = JSON.parse(answersRaw); } catch {
        return NextResponse.json({ error: 'Invalid answers JSON.' }, { status: 400 });
      }

      // Format Q&A for prompt
      const questionsAndAnswers = answers.map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`).join('\n\n');

      // Create generation record
      const generation = await prisma.aiToolGeneration.create({
        data: {
          user_id: userId,
          tool_slug: TOOL_SLUG,
          description: `Scope review: ${fileName}`,
          status: 'PROCESSING',
        },
      });
      generationId = generation.id;
      await incrementAiToolUsage(userId, TOOL_SLUG);

      // Wrap upload content for phase 2
      const wrappedContent = wrapUploadContent(fileName, fileType, fileSize, characterCount, parsedText, 'Scope of Works');

      // AI call — Phase 2 (generation)
      const genPrompt = getContractScopeGenerationPrompt(
        wizardContext.templateSlug as ContractScopeTemplateSlug,
        contractContext,
        questionsAndAnswers,
      );

      let documentContent: any = null;
      const MAX_RETRIES = 2;
      let retryCount = 0;

      const genMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: genPrompt },
        { role: 'user', content: wrappedContent },
      ];

      while (retryCount <= MAX_RETRIES) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4.1',
          messages: genMessages,
          temperature: 0.4,
          max_tokens: 16000,
          response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content;
        if (!responseText) throw new Error('No response from AI');

        try {
          documentContent = JSON.parse(responseText);
          break;
        } catch {
          if (retryCount >= MAX_RETRIES) throw new Error('AI returned invalid JSON after retries');
          genMessages.push({ role: 'assistant', content: responseText });
          genMessages.push({ role: 'user', content: 'Your response was not valid JSON. Please respond with ONLY a valid JSON object.' });
          retryCount++;
        }
      }

      // Embed template slug so docx generator routes correctly
      documentContent._contractScopeTemplateSlug = wizardContext.templateSlug;

      // Generate DOCX
      const docBuffer = await generateAiToolDocument(TOOL_SLUG, documentContent);

      // Upload to Vercel Blob
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-').substring(0, 40);
      const dateStr = new Date().toISOString().split('T')[0];
      const blobFilename = `Scope-Risk-Review-${safeFileName}-${dateStr}.docx`;

      const blob = await put(blobFilename, docBuffer, {
        access: 'public',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.aiToolGeneration.update({
        where: { id: generationId },
        data: {
          status: 'COMPLETED',
          blob_url: blob.url,
          blob_pathname: blob.pathname,
          filename: blobFilename,
          expires_at: expiresAt,
          completed_at: new Date(),
        },
      });

      return NextResponse.json({
        phase: 'complete',
        generationId,
        downloadUrl: blob.url,
        filename: blobFilename,
        expiresAt: expiresAt.toISOString(),
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use "questions" or "generate".' }, { status: 400 });

  } catch (error: any) {
    console.error('[Scope Review] Error:', error);

    if (generationId) {
      try {
        await prisma.aiToolGeneration.update({
          where: { id: generationId },
          data: { status: 'FAILED', error_message: error.message?.substring(0, 500) },
        });
      } catch {}
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process scope review.' },
      { status: 500 },
    );
  }
}
