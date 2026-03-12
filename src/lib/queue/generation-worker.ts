import prisma from '@/lib/prisma';
import { generateRamsContent } from '@/lib/ai/generate-content';
import { buildRamsDocument } from '@/lib/docgen/builder';
import fs from 'fs/promises';
import path from 'path';

/**
 * Processes a RAMS generation job.
 * Fetches the generation record, generates content via AI, builds the Word document,
 * and updates the record with the result.
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

    // Save the document to a temporary location
    const tmpDir = '/tmp/rams-docs';
    await fs.mkdir(tmpDir, { recursive: true });

    const filename = `rams-${generationId}-${Date.now()}.docx`;
    const filePath = path.join(tmpDir, filename);
    await fs.writeFile(filePath, docxBuffer);

    console.log(`[Generation Worker] Document saved to: ${filePath}`);

    // Update generation record with success
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: 'COMPLETED',
        file_path: filePath,
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
