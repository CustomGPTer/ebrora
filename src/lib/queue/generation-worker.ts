import prisma from '@/lib/prisma';
import { generateRamsContent } from '@/lib/ai/generate-content';
import { buildRamsDocument } from '@/lib/docgen/builder';
import { put } from '@vercel/blob';

/**
 * Processes a RAMS generation job.
 * Fetches the generation record, generates content via AI, builds the Word document,
 * uploads to Vercel Blob, and updates the record with the result.
 * @param generationId - The ID of the generation record to process
 */
export async function processGeneration(generationId: string): Promise<void> {
  let generation;

  try {
    // Fetch the generation record from database
    generation = await prisma.generation.findUnique({
      where: { id: generationId },
      include: { rams_format: true },
    });

    if (!generation) {
      throw new Error(`Generation record not found: ${generationId}`);
    }

    // Update status to PROCESSING
    await prisma.generation.update({
      where: { id: generationId },
      data: { status: 'PROCESSING' },
    });

    console.log(`[Generation Worker] Processing generation: ${generationId}`);

    // Get answers from the JSON field
    const answers: Record<string, string> = {};
    if (generation.answers && typeof generation.answers === 'object') {
      const rawAnswers = generation.answers as Record<string, unknown>;
      Object.entries(rawAnswers).forEach(([key, value]) => {
        answers[key] = String(value || '');
      });
    }

    const formatSlug = generation.rams_format.slug;

    // Generate content using AI
    console.log(
      `[Generation Worker] Generating content for format: ${formatSlug}`
    );
    const generatedContent = await generateRamsContent(
      formatSlug,
      answers
    );

    // Build the Word document
    console.log(`[Generation Worker] Building RAMS document...`);
    const docxBuffer = await buildRamsDocument({
      formatSlug,
      answers,
      generatedContent,
      generationDate: new Date(),
    });

    // Upload to Vercel Blob
    const filename = `rams-${generationId}-${Date.now()}.docx`;
    const blob = await put(`rams/${filename}`, docxBuffer, {
      access: 'public',
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    console.log(`[Generation Worker] Document uploaded to: ${blob.url}`);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update generation record with success
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: 'COMPLETED',
        blobUrl: blob.url,
        blobPathname: blob.pathname,
        filename,
        expiresAt,
        completed_at: new Date(),
      },
    });

    console.log(`[Generation Worker] Generation completed: ${generationId}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    console.error(
      `[Generation Worker] Error processing generation ${generationId}:`,
      errorMessage
    );

    // Update generation record with error
    if (generation) {
      try {
        await prisma.generation.update({
          where: { id: generationId },
          data: {
            status: 'FAILED',
            error_message: errorMessage.substring(0, 500),
          },
        });
      } catch (updateError) {
        console.error(
          '[Generation Worker] Failed to update generation record with error:',
          updateError
        );
      }
    }

    throw error;
  }
}
