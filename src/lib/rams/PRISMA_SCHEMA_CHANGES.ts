// =============================================================================
// PRISMA SCHEMA ADDITIONS
// =============================================================================
// Add/replace these fields in your existing prisma/schema.prisma file.
// The Generation model needs these new fields for the two-phase flow.
// Run `npx prisma db push` after making changes.
// =============================================================================

// REPLACE your existing Generation model with this:
//
// model Generation {
//   id            String    @id @default(cuid())
//   userId        String
//   user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
//
//   // Template & input
//   templateSlug  String                    // e.g. "standard-5x5"
//   description   String    @db.Text        // User's initial description (max 100 words)
//
//   // AI Call 1 output
//   questions     String?   @db.Text        // JSON array of 20 generated questions
//
//   // AI Call 2 input & output
//   answers       String?   @db.Text        // JSON array of 20 answered questions
//   blobUrl       String?                   // Vercel Blob download URL
//   blobPathname  String?                   // Vercel Blob pathname (for deletion)
//   filename      String?                   // Clean filename for download
//
//   // Status tracking
//   status        String    @default("QUESTIONS_GENERATED")
//   // Possible values: QUESTIONS_GENERATED, GENERATING_DOCUMENT, COMPLETE, FAILED, EXPIRED
//
//   // 24-hour expiry
//   expiresAt     DateTime?
//
//   // Timestamps
//   createdAt     DateTime  @default(now())
//   updatedAt     DateTime  @updatedAt
//
//   // Relations
//   usageRecords  UsageRecord[]
//
//   @@index([userId])
//   @@index([status])
//   @@index([expiresAt])
// }
//
// ALSO ensure your UsageRecord model has:
//
// model UsageRecord {
//   id            String    @id @default(cuid())
//   userId        String
//   user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
//   action        String                    // QUESTION_GENERATION or DOCUMENT_GENERATION
//   tokensUsed    Int       @default(0)
//   generationId  String?
//   generation    Generation? @relation(fields: [generationId], references: [id])
//   createdAt     DateTime  @default(now())
//
//   @@index([userId])
// }

// =============================================================================
// VERCEL ENVIRONMENT VARIABLES NEEDED:
// =============================================================================
// OPENAI_API_KEY         — Your OpenAI API key (already set)
// BLOB_READ_WRITE_TOKEN  — Generate from Vercel Dashboard > Storage > Blob > Create Store
// CRON_SECRET            — Any random string for cron job authentication
// =============================================================================

// =============================================================================
// vercel.json — Add this cron configuration:
// =============================================================================
// {
//   "crons": [
//     {
//       "path": "/api/cron/cleanup-rams",
//       "schedule": "0 */6 * * *"
//     }
//   ]
// }
// =============================================================================
