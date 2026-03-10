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
      include: { questions: true },
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

    // Convert questions array to a key-value object
    const answers: Record<string, string> = {};
    if (generation.questions && Array.isArray(generation.questions)) {
      generation.questions.forEach((q: { questionId: string; answer: string }) => {
        answers[q.questionId] = q.answer || '';
      });
    }

    // Generate content using AI
    console.log(
      `[Generation Worker] Generating content for format: ${generation.formatSlug}`
    );
    const generatedContent = await generateRamsContent(
      generation.formatSlug,
      answers
    );

    // Build the Word document
    console.log(`[Generation Worker] Building RAMS document...`);
    const docxBuffer = await buildRamsDocument(
      generation.formatSlug,
      generatedContent
    );

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
        fileUrl: filePath,
        completedAt: new Date(),
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
            errorMessage: errorMessage.substring(0, 500),
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
