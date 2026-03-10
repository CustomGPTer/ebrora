import { processGeneration } from './generation-worker';

/**
 * Simple in-memory queue manager for RAMS generation processing.
 * Handles enqueuing generation jobs and processing them sequentially.
 * Prevents duplicate processing of the same generation ID.
 */
export class GenerationQueue {
  private processing: Set<string>;
  private queue: string[];

  constructor() {
    this.processing = new Set();
    this.queue = [];
  }

  /**
   * Enqueues a generation job and starts processing if not already processing.
   * @param generationId - The ID of the generation to process
   */
  async enqueue(generationId: string): Promise<void> {
    if (!generationId) {
      throw new Error('Invalid generation ID');
    }

    // Prevent duplicate processing
    if (this.processing.has(generationId) || this.queue.includes(generationId)) {
      console.log(
        `[Queue Manager] Generation ${generationId} already queued or processing`
      );
      return;
    }

    this.queue.push(generationId);
    console.log(
      `[Queue Manager] Enqueued generation ${generationId}. Queue size: ${this.queue.length}`
    );

    // Start processing
    this.processNext().catch((error) => {
      console.error('[Queue Manager] Error processing queue:', error);
    });
  }

  /**
   * Processes the next job in the queue.
   * Runs sequentially to prevent overwhelming the API.
   */
  async processNext(): Promise<void> {
    // Only allow one job at a time
    if (this.processing.size > 0) {
      return;
    }

    const generationId = this.queue.shift();
    if (!generationId) {
      return;
    }

    this.processing.add(generationId);

    try {
      console.log(`[Queue Manager] Starting processing of ${generationId}`);
      await processGeneration(generationId);
      console.log(
        `[Queue Manager] Completed processing of ${generationId}. Queue size: ${this.queue.length}`
      );
    } catch (error) {
      console.error(
        `[Queue Manager] Failed to process generation ${generationId}:`,
        error
      );
    } finally {
      this.processing.delete(generationId);

      // Process the next item in the queue if available
      if (this.queue.length > 0) {
        this.processNext().catch((error) => {
          console.error('[Queue Manager] Error processing next item:', error);
        });
      }
    }
  }

  /**
   * Checks if a generation is currently being processed.
   * @param generationId - The ID to check
   * @returns true if currently processing, false otherwise
   */
  isProcessing(generationId: string): boolean {
    return this.processing.has(generationId);
  }

  /**
   * Gets the current queue size.
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Gets the number of items currently being processed.
   */
  getProcessingCount(): number {
    return this.processing.size;
  }
}

// Global singleton instance
export const generationQueue = new GenerationQueue();
