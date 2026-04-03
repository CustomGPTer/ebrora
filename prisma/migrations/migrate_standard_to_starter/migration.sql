-- =============================================================================
-- Batch 7: Migrate STANDARD → STARTER
-- Run AFTER all code batches (1-6) are deployed and working.
-- =============================================================================

-- Step 1: Migrate all STANDARD subscribers to STARTER
UPDATE "subscriptions" SET tier = 'STARTER' WHERE tier = 'STANDARD';

-- Step 2: Verify no STANDARD records remain
-- This should return 0
SELECT COUNT(*) AS remaining_standard FROM "subscriptions" WHERE tier = 'STANDARD';

-- Step 3: Verify STARTER records look correct
SELECT tier, status, COUNT(*) 
FROM "subscriptions" 
WHERE tier IN ('STARTER', 'PROFESSIONAL', 'UNLIMITED', 'FREE')
GROUP BY tier, status
ORDER BY tier, status;

-- NOTE: Do NOT remove STANDARD from the Prisma enum yet.
-- Keep it in the schema as a safety net. It can be removed in a future
-- cleanup once you're confident no code path references it.
