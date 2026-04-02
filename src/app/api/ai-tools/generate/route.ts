// =============================================================================
// API: /api/ai-tools/generate
// AI Call 2 — Generate full document content → build docx → store in Blob
// Adapted from /api/rams/generate for multi-tool support.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { put } from '@vercel/blob';
import { getAiToolConfig, isValidAiToolSlug, getAiToolLimitByTier } from '@/lib/ai-tools';
import { getGenerationPrompt, getTbtTemplateGenerationPrompt, getCoshhTemplateGenerationPrompt, getCdmCheckerTemplateGenerationPrompt, getConfinedSpacesTemplateGenerationPrompt, getErpTemplateGenerationPrompt, getIncidentReportTemplateGenerationPrompt, getLiftPlanTemplateGenerationPrompt, getManualHandlingTemplateGenerationPrompt, getNoiseAssessmentTemplateGenerationPrompt, getPermitToDigTemplateGenerationPrompt, getPowraTemplateGenerationPrompt, getEarlyWarningTemplateGenerationPrompt } from '@/lib/ai-tools/system-prompts';
import { getCrpTemplateGenerationPrompt } from '@/lib/carbon-reduction/crp-prompts';
import { getCarbonFootprintTemplateGenerationPrompt } from '@/lib/carbon-footprint/cf-prompts';
import { getDayworkSheetTemplateGenerationPrompt } from '@/lib/daywork-sheet/dw-prompts';
import { getNcrTemplateGenerationPrompt } from '@/lib/ncr/ncr-prompts';
import { getSafetyAlertTemplateGenerationPrompt } from '@/lib/safety-alert/sa-prompts';
import { getCeTemplateGenerationPrompt, getDelayTemplateGenerationPrompt, getVariationTemplateGenerationPrompt, getRfiTemplateGenerationPrompt } from '@/lib/ai-tools/commercial-prompts';
import { getScopeTemplateGenerationPrompt, getQuoteTemplateGenerationPrompt, getRiddorTemplateGenerationPrompt, getTrafficTemplateGenerationPrompt, getWasteTemplateGenerationPrompt, getInvasiveTemplateGenerationPrompt, getWahTemplateGenerationPrompt, getWbvTemplateGenerationPrompt } from '@/lib/ai-tools/template-generation-prompts';
import { generateAiToolDocument } from '@/lib/ai-tools/docx-generator';
import { wrapGenerateInput, detectInjectionPatterns, logInjectionAttempt } from '@/lib/ai-tools/sanitise-input';
import type { AiToolSlug } from '@/lib/ai-tools';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const maxDuration = 300; // Vercel Pro allows up to 300s

const MAX_RETRIES = 2;
const MAX_TOTAL_ANSWERS = 40;

export async function POST(req: NextRequest) {
  let bodyGenerationId: string | undefined;

  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Parse request
    const body = await req.json();
    const { generationId, answers, description, tbtTemplateSlug, coshhTemplateSlug, cdmCheckerTemplateSlug, confinedSpacesTemplateSlug, erpTemplateSlug, incidentReportTemplateSlug, liftPlanTemplateSlug, manualHandlingTemplateSlug, noiseAssessmentTemplateSlug, permitToDigTemplateSlug, powraTemplateSlug, scopeTemplateSlug, earlyWarningTemplateSlug, quoteTemplateSlug, wahTemplateSlug, wbvTemplateSlug, riddorTemplateSlug, trafficTemplateSlug, wasteTemplateSlug, invasiveTemplateSlug, ceTemplateSlug, delayTemplateSlug, variationTemplateSlug, rfiTemplateSlug, crpTemplateSlug, carbonFootprintTemplateSlug, dayworkSheetTemplateSlug, ncrTemplateSlug, safetyAlertTemplateSlug } = body as {
      generationId: string;
      answers: { number: number; question: string; answer: string }[];
      description?: string;
      tbtTemplateSlug?: string;
      coshhTemplateSlug?: string;
      cdmCheckerTemplateSlug?: string;
      confinedSpacesTemplateSlug?: string;
      erpTemplateSlug?: string;
      incidentReportTemplateSlug?: string;
      liftPlanTemplateSlug?: string;
      manualHandlingTemplateSlug?: string;
      noiseAssessmentTemplateSlug?: string;
      permitToDigTemplateSlug?: string;
      powraTemplateSlug?: string;
      scopeTemplateSlug?: string;
      earlyWarningTemplateSlug?: string;
      quoteTemplateSlug?: string;
      wahTemplateSlug?: string;
      wbvTemplateSlug?: string;
      riddorTemplateSlug?: string;
      trafficTemplateSlug?: string;
      wasteTemplateSlug?: string;
      invasiveTemplateSlug?: string;
      ceTemplateSlug?: string;
      delayTemplateSlug?: string;
      variationTemplateSlug?: string;
      rfiTemplateSlug?: string;
      crpTemplateSlug?: string;
      carbonFootprintTemplateSlug?: string;
      dayworkSheetTemplateSlug?: string;
      ncrTemplateSlug?: string;
      safetyAlertTemplateSlug?: string;
    };
    bodyGenerationId = generationId;

    if (!generationId || !answers || answers.length === 0) {
      return NextResponse.json(
        { error: 'Generation ID and at least one answered question are required.' },
        { status: 400 }
      );
    }

    if (answers.length > MAX_TOTAL_ANSWERS) {
      return NextResponse.json(
        { error: `Too many answers (${answers.length}). Maximum is ${MAX_TOTAL_ANSWERS}.` },
        { status: 400 }
      );
    }

    // Validate answer word counts
    for (const a of answers) {
      const wc = a.answer.trim().split(/\s+/).length;
      if (wc > 160) {
        return NextResponse.json(
          { error: `Answer ${a.number} exceeds the word limit.` },
          { status: 400 }
        );
      }
    }

    // Fetch the generation record
    const generation = await (prisma as any).aiToolGeneration.findUnique({
      where: { id: generationId },
    });

    if (!generation || generation.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Generation not found.' }, { status: 404 });
    }

    if (generation.status !== 'PROCESSING' && generation.status !== 'QUEUED') {
      return NextResponse.json({ error: 'Invalid generation state.' }, { status: 400 });
    }

    const toolSlug = generation.tool_slug as AiToolSlug;
    if (!isValidAiToolSlug(toolSlug)) {
      return NextResponse.json({ error: 'Invalid tool.' }, { status: 400 });
    }

    // Independent tier limit check (prevents replay attacks bypassing chat check)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });
    const tier = user?.subscription?.tier ?? 'FREE';
    const subscriptionStatus = user?.subscription?.status ?? 'ACTIVE';

    // Paid tier: require active subscription
    if (tier !== 'FREE' && subscriptionStatus !== 'ACTIVE') {
      await (prisma as any).aiToolGeneration.update({
        where: { id: generationId },
        data: { status: 'FAILED', error_message: 'Subscription not active' },
      });
      return NextResponse.json(
        { error: 'Your subscription is not active. Please update your billing details.' },
        { status: 403 }
      );
    }

    const monthLimit = getAiToolLimitByTier(tier, toolSlug);
    const nowDate = new Date();
    const periodStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
    const periodEnd = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0, 23, 59, 59);

    const usageThisMonth = await (prisma as any).aiToolGeneration.count({
      where: {
        user_id: session.user.id,
        tool_slug: toolSlug,
        created_at: { gte: periodStart, lte: periodEnd },
        status: { in: ['COMPLETED', 'PROCESSING', 'QUEUED'] },
        id: { not: generationId }, // exclude current generation being processed
      },
    });

    if (usageThisMonth >= monthLimit) {
      const toolConfig = getAiToolConfig(toolSlug);
      await (prisma as any).aiToolGeneration.update({
        where: { id: generationId },
        data: { status: 'FAILED', error_message: 'Monthly limit exceeded' },
      });
      return NextResponse.json(
        {
          error: monthLimit === 0
            ? `The ${toolConfig.shortName} is available on Standard and Professional plans.`
            : `You've reached your monthly limit for ${toolConfig.shortName}.`,
          limitReached: true,
        },
        { status: 429 }
      );
    }

    const toolConfig = getAiToolConfig(toolSlug);
    const workDescription = description || generation.description || '';

    // Update status to PROCESSING
    await (prisma as any).aiToolGeneration.update({
      where: { id: generationId },
      data: { status: 'PROCESSING', answers: JSON.stringify(answers) },
    });

    // Get the tool-specific generation prompt (template-aware for TBT, COSHH, CDM, Confined Spaces, ERP)
    const systemPrompt = (toolSlug === 'tbt-generator' && tbtTemplateSlug)
      ? getTbtTemplateGenerationPrompt(tbtTemplateSlug as any)
      : (toolSlug === 'coshh' && coshhTemplateSlug)
      ? getCoshhTemplateGenerationPrompt(coshhTemplateSlug as any)
      : (toolSlug === 'cdm-checker' && cdmCheckerTemplateSlug)
      ? getCdmCheckerTemplateGenerationPrompt(cdmCheckerTemplateSlug as any)
      : (toolSlug === 'confined-spaces' && confinedSpacesTemplateSlug)
      ? getConfinedSpacesTemplateGenerationPrompt(confinedSpacesTemplateSlug as any)
      : (toolSlug === 'emergency-response' && erpTemplateSlug)
      ? getErpTemplateGenerationPrompt(erpTemplateSlug as any)
      : (toolSlug === 'incident-report' && incidentReportTemplateSlug)
      ? getIncidentReportTemplateGenerationPrompt(incidentReportTemplateSlug as any)
      : (toolSlug === 'lift-plan' && liftPlanTemplateSlug)
      ? getLiftPlanTemplateGenerationPrompt(liftPlanTemplateSlug as any)
      : (toolSlug === 'manual-handling' && manualHandlingTemplateSlug)
      ? getManualHandlingTemplateGenerationPrompt(manualHandlingTemplateSlug as any)
      : (toolSlug === 'noise-assessment' && noiseAssessmentTemplateSlug)
      ? getNoiseAssessmentTemplateGenerationPrompt(noiseAssessmentTemplateSlug as any)
      : (toolSlug === 'permit-to-dig' && permitToDigTemplateSlug)
      ? getPermitToDigTemplateGenerationPrompt(permitToDigTemplateSlug as any)
      : (toolSlug === 'powra' && powraTemplateSlug)
      ? getPowraTemplateGenerationPrompt(powraTemplateSlug as any)
      : (toolSlug === 'early-warning' && earlyWarningTemplateSlug)
      ? getEarlyWarningTemplateGenerationPrompt(earlyWarningTemplateSlug as any)
      : (toolSlug === 'carbon-reduction-plan' && crpTemplateSlug)
      ? getCrpTemplateGenerationPrompt(crpTemplateSlug as any)
      : (toolSlug === 'ce-notification' && ceTemplateSlug)
      ? getCeTemplateGenerationPrompt(ceTemplateSlug as any)
      : (toolSlug === 'delay-notification' && delayTemplateSlug)
      ? getDelayTemplateGenerationPrompt(delayTemplateSlug as any)
      : (toolSlug === 'variation-confirmation' && variationTemplateSlug)
      ? getVariationTemplateGenerationPrompt(variationTemplateSlug as any)
      : (toolSlug === 'rfi-generator' && rfiTemplateSlug)
      ? getRfiTemplateGenerationPrompt(rfiTemplateSlug as any)
      : (toolSlug === 'scope-of-works' && scopeTemplateSlug)
      ? getScopeTemplateGenerationPrompt(scopeTemplateSlug as any)
      : (toolSlug === 'quote-generator' && quoteTemplateSlug)
      ? getQuoteTemplateGenerationPrompt(quoteTemplateSlug as any)
      : (toolSlug === 'riddor-report' && riddorTemplateSlug)
      ? getRiddorTemplateGenerationPrompt(riddorTemplateSlug as any)
      : (toolSlug === 'traffic-management' && trafficTemplateSlug)
      ? getTrafficTemplateGenerationPrompt(trafficTemplateSlug as any)
      : (toolSlug === 'waste-management' && wasteTemplateSlug)
      ? getWasteTemplateGenerationPrompt(wasteTemplateSlug as any)
      : (toolSlug === 'invasive-species' && invasiveTemplateSlug)
      ? getInvasiveTemplateGenerationPrompt(invasiveTemplateSlug as any)
      : (toolSlug === 'wah-assessment' && wahTemplateSlug)
      ? getWahTemplateGenerationPrompt(wahTemplateSlug as any)
      : (toolSlug === 'wbv-assessment' && wbvTemplateSlug)
      ? getWbvTemplateGenerationPrompt(wbvTemplateSlug as any)
      : (toolSlug === 'carbon-footprint' && carbonFootprintTemplateSlug)
      ? getCarbonFootprintTemplateGenerationPrompt(carbonFootprintTemplateSlug as any)
      : (toolSlug === 'daywork-sheet' && dayworkSheetTemplateSlug)
      ? getDayworkSheetTemplateGenerationPrompt(dayworkSheetTemplateSlug as any)
      : (toolSlug === 'ncr' && ncrTemplateSlug)
      ? getNcrTemplateGenerationPrompt(ncrTemplateSlug as any)
      : (toolSlug === 'safety-alert' && safetyAlertTemplateSlug)
      ? getSafetyAlertTemplateGenerationPrompt(safetyAlertTemplateSlug as any)
      : getGenerationPrompt(toolSlug);

    // Build user message with description + all Q&A (sanitised)
    const descPatterns = detectInjectionPatterns(workDescription || '');
    if (descPatterns.length > 0) {
      logInjectionAttempt(session.user.id, toolSlug, 'generate-description', descPatterns);
    }

    const userMessage = wrapGenerateInput(workDescription || '', answers);

    // AI Call with retry loop
    let documentContent: any = null;
    let retryCount = 0;

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    while (retryCount <= MAX_RETRIES) {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages,
        temperature: 0.5,
        max_tokens: 16000,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) throw new Error('No response from AI');

      try {
        documentContent = JSON.parse(responseText);
        break;
      } catch (parseErr) {
        if (retryCount >= MAX_RETRIES) {
          throw new Error('AI returned invalid JSON after retries');
        }
        messages.push({ role: 'assistant', content: responseText });
        messages.push({
          role: 'user',
          content: 'Your response was not valid JSON. Please respond with ONLY a valid JSON object — no markdown, no code fences, no commentary.',
        });
        retryCount++;
      }
    }

    // Generate the document buffer (xlsx for ITP, docx for others)
    const toolOutputFormat = toolConfig.outputFormat || 'docx';
    let docBuffer: Buffer;
    let mimeType: string;
    let fileExtension: string;

    // Inject TBT template slug into content so docx-generator can route it
    if (toolSlug === 'tbt-generator' && tbtTemplateSlug) {
      documentContent._tbtTemplateSlug = tbtTemplateSlug;
    }

    // Inject COSHH template slug into content so docx-generator can route it
    if (toolSlug === 'coshh' && coshhTemplateSlug) {
      documentContent._coshhTemplateSlug = coshhTemplateSlug;
    }

    // Inject CDM Checker template slug into content so docx-generator can route it
    if (toolSlug === 'cdm-checker' && cdmCheckerTemplateSlug) {
      documentContent._cdmCheckerTemplateSlug = cdmCheckerTemplateSlug;
    }

    // Inject Confined Spaces template slug into content so docx-generator can route it
    if (toolSlug === 'confined-spaces' && confinedSpacesTemplateSlug) {
      documentContent._confinedSpacesTemplateSlug = confinedSpacesTemplateSlug;
    }

    // Inject ERP template slug into content so docx-generator can route it
    if (toolSlug === 'emergency-response' && erpTemplateSlug) {
      documentContent._erpTemplateSlug = erpTemplateSlug;
    }

    // Inject Incident Report template slug into content so docx-generator can route it
    if (toolSlug === 'incident-report' && incidentReportTemplateSlug) {
      documentContent._incidentReportTemplateSlug = incidentReportTemplateSlug;
    }

    // Inject Lift Plan template slug into content so docx-generator can route it
    if (toolSlug === 'lift-plan' && liftPlanTemplateSlug) {
      documentContent._liftPlanTemplateSlug = liftPlanTemplateSlug;
    }

    // Inject Manual Handling template slug into content so docx-generator can route it
    if (toolSlug === 'manual-handling' && manualHandlingTemplateSlug) {
      documentContent._manualHandlingTemplateSlug = manualHandlingTemplateSlug;
    }

    // Inject Noise Assessment template slug into content so docx-generator can route it
    if (toolSlug === 'noise-assessment' && noiseAssessmentTemplateSlug) {
      documentContent._noiseAssessmentTemplateSlug = noiseAssessmentTemplateSlug;
    }

    // Inject Permit to Dig template slug into content so docx-generator can route it
    if (toolSlug === 'permit-to-dig' && permitToDigTemplateSlug) {
      documentContent._permitToDigTemplateSlug = permitToDigTemplateSlug;
    }

    // Inject POWRA template slug into content so docx-generator can route it
    if (toolSlug === 'powra' && powraTemplateSlug) {
      documentContent._powraTemplateSlug = powraTemplateSlug;
    }

    // Inject Scope of Works template slug into content so docx-generator can route it
    if (toolSlug === 'scope-of-works' && scopeTemplateSlug) {
      documentContent._scopeTemplateSlug = scopeTemplateSlug;
    }

    // Inject Early Warning template slug into content so docx-generator can route it
    if (toolSlug === 'early-warning' && earlyWarningTemplateSlug) {
      documentContent._earlyWarningTemplateSlug = earlyWarningTemplateSlug;
    }

    // Inject Quotation Builder template slug into content so docx-generator can route it
    if (toolSlug === 'quote-generator' && quoteTemplateSlug) {
      documentContent._quoteTemplateSlug = quoteTemplateSlug;
    }

    // Inject WAH Assessment template slug
    if (toolSlug === 'wah-assessment' && wahTemplateSlug) {
      documentContent._wahTemplateSlug = wahTemplateSlug;
    }

    // Inject WBV Assessment template slug
    if (toolSlug === 'wbv-assessment' && wbvTemplateSlug) {
      documentContent._wbvTemplateSlug = wbvTemplateSlug;
    }

    // Inject RIDDOR Report template slug
    if (toolSlug === 'riddor-report' && riddorTemplateSlug) {
      documentContent._riddorTemplateSlug = riddorTemplateSlug;
    }

    // Inject Traffic Management template slug
    if (toolSlug === 'traffic-management' && trafficTemplateSlug) {
      documentContent._trafficTemplateSlug = trafficTemplateSlug;
    }

    // Inject Waste Management template slug
    if (toolSlug === 'waste-management' && wasteTemplateSlug) {
      documentContent._wasteTemplateSlug = wasteTemplateSlug;
    }

    // Inject Invasive Species template slug
    if (toolSlug === 'invasive-species' && invasiveTemplateSlug) {
      documentContent._invasiveTemplateSlug = invasiveTemplateSlug;
    }

    // Inject CE Notification template slug
    if (toolSlug === 'ce-notification' && ceTemplateSlug) {
      documentContent._ceTemplateSlug = ceTemplateSlug;
    }

    // Inject Delay Notification template slug
    if (toolSlug === 'delay-notification' && delayTemplateSlug) {
      documentContent._delayTemplateSlug = delayTemplateSlug;
    }

    // Inject Variation Confirmation template slug
    if (toolSlug === 'variation-confirmation' && variationTemplateSlug) {
      documentContent._variationTemplateSlug = variationTemplateSlug;
    }

    // Inject RFI Generator template slug
    if (toolSlug === 'rfi-generator' && rfiTemplateSlug) {
      documentContent._rfiTemplateSlug = rfiTemplateSlug;
    }

    // Inject Carbon Reduction Plan template slug
    if (toolSlug === 'carbon-reduction-plan' && crpTemplateSlug) {
      documentContent._crpTemplateSlug = crpTemplateSlug;
    }

    // Inject Carbon Footprint template slug
    if (toolSlug === 'carbon-footprint' && carbonFootprintTemplateSlug) {
      documentContent._carbonFootprintTemplateSlug = carbonFootprintTemplateSlug;
    }

    // Inject Daywork Sheet template slug
    if (toolSlug === 'daywork-sheet' && dayworkSheetTemplateSlug) {
      documentContent._dayworkSheetTemplateSlug = dayworkSheetTemplateSlug;
    }

    // Inject NCR template slug
    if (toolSlug === 'ncr' && ncrTemplateSlug) {
      documentContent._ncrTemplateSlug = ncrTemplateSlug;
    }

    // Inject Safety Alert template slug
    if (toolSlug === 'safety-alert' && safetyAlertTemplateSlug) {
      documentContent._safetyAlertTemplateSlug = safetyAlertTemplateSlug;
    }

    if (toolSlug === 'itp') {
      const { generateItpXlsx } = await import('@/lib/ai-tools/templates/itp-xlsx-generator');
      docBuffer = await generateItpXlsx(documentContent);
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileExtension = 'xlsx';
    } else {
      docBuffer = await generateAiToolDocument(toolSlug, documentContent);
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileExtension = 'docx';
    }

    // Generate filename
    const projectName = (documentContent.projectName || documentContent.topic || toolConfig.shortName)
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${toolConfig.shortName.replace(/\s+/g, '-')}-${projectName}-${dateStr}.${fileExtension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, docBuffer, {
      access: 'public',
      contentType: mimeType,
    });

    // 24-hour expiry
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update generation record
    await (prisma as any).aiToolGeneration.update({
      where: { id: generationId },
      data: {
        status: 'COMPLETED',
        blob_url: blob.url,
        blob_pathname: blob.pathname,
        filename,
        expires_at: expiresAt,
        completed_at: new Date(),
      },
    });

    return NextResponse.json({
      generationId,
      downloadUrl: blob.url,
      filename,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('[AI Tools Generate] Error:', error);

    // Update status to FAILED
    if (bodyGenerationId) {
      try {
        await (prisma as any).aiToolGeneration.update({
          where: { id: bodyGenerationId },
          data: { status: 'FAILED', error_message: error.message?.substring(0, 500) },
        });
      } catch {}
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate document' },
      { status: 500 }
    );
  }
}
