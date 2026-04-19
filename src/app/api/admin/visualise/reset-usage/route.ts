import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { validateOrigin } from '@/lib/csrf';
import prisma from '@/lib/prisma';
import { VISUALISE_TOOL_SLUG } from '@/lib/visualise/constants';

/**
 * POST /api/admin/visualise/reset-usage
 *
 * Resets a user's Visualise quota for the current calendar month by marking
 * their COMPLETED / PROCESSING / QUEUED generation rows as FAILED. The
 * /api/visualise/access endpoint counts only the first three statuses, so
 * flipping to FAILED removes them from the quota count without losing
 * history or blob URLs.
 *
 * Use case: customer support — a user has hit their monthly cap due to
 * failed generations, bad inputs, or a gift-reset request. Also covers
 * admin self-reset (the site owner resetting their own testing usage).
 *
 * Requires ADMIN role + origin validation (matches grant-plan pattern).
 *
 * Body:
 *   { email: string, dryRun?: boolean }
 *
 * Response (success):
 *   { success: true, affected: number, user: { email, name }, dryRun: boolean }
 *
 * Response (error):
 *   { error: string }
 *
 * Notes on deliberate choices:
 *   • Status flip, not DELETE — preserves history + audit trail.
 *   • error_message gets stamped with a "[Reset by admin …]" marker so the
 *     rows are self-documenting when inspected later.
 *   • Only the current CALENDAR month is touched — matches the quota window
 *     in /api/visualise/access. Earlier months stay untouched regardless of
 *     status (they don't count toward quota anyway).
 *   • dryRun=true returns the count that WOULD be affected without making
 *     any changes. Useful for confirming before pulling the trigger.
 */

export async function POST(request: NextRequest) {
  try {
    // ── CSRF check ──
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'Invalid request origin' },
        { status: 403 }
      );
    }

    // ── Admin auth check ──
    const session = await requireAdmin();
    const adminEmail = (session.user as { email?: string } | undefined)?.email || 'unknown';

    // ── Parse & validate input ──
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';
    const dryRun = body.dryRun === true;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    // ── Lookup user ──
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ── Compute the current calendar month window ──
    // Mirror the exact window used by /api/visualise/access so we reset
    // precisely the set of rows that counts against the quota, and nothing
    // more.
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // ── Count what would be reset (for dry-run and for the response) ──
    const countable = await prisma.aiToolGeneration.count({
      where: {
        user_id: user.id,
        tool_slug: VISUALISE_TOOL_SLUG,
        created_at: { gte: periodStart, lte: periodEnd },
        status: { in: ['COMPLETED', 'PROCESSING', 'QUEUED'] },
      },
    });

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        affected: countable,
        user: { email: user.email, name: user.name },
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      });
    }

    if (countable === 0) {
      return NextResponse.json({
        success: true,
        dryRun: false,
        affected: 0,
        user: { email: user.email, name: user.name },
        note: 'Nothing to reset — no countable rows in the current month.',
      });
    }

    // ── Perform the reset ──
    // Use updateMany so this is a single SQL statement rather than N row
    // updates. The error_message stamp tells future-us why a row ended up
    // FAILED when it's later inspected for some unrelated debugging.
    const stamp = `[Reset by admin ${adminEmail} on ${now.toISOString()}]`;
    const result = await prisma.aiToolGeneration.updateMany({
      where: {
        user_id: user.id,
        tool_slug: VISUALISE_TOOL_SLUG,
        created_at: { gte: periodStart, lte: periodEnd },
        status: { in: ['COMPLETED', 'PROCESSING', 'QUEUED'] },
      },
      data: {
        status: 'FAILED',
        error_message: stamp,
      },
    });

    // ── Audit log (server-side only) ──
    console.log(
      `[ADMIN RESET-USAGE] Admin "${adminEmail}" reset ${result.count} Visualise generation(s) for "${email}" (month: ${periodStart.toISOString()} → ${periodEnd.toISOString()})`
    );

    return NextResponse.json({
      success: true,
      dryRun: false,
      affected: result.count,
      user: { email: user.email, name: user.name },
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    });
  } catch (error) {
    console.error('Reset visualise usage error:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Failed to reset usage' },
      { status: 500 }
    );
  }
}
