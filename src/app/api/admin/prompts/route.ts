import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdatePromptSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const prompts = await prisma.systemPrompt.findMany({
      include: { rams_format: { select: { name: true } } },
      orderBy: { created_at: 'asc' },
    });

    return NextResponse.json(prompts);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { id, text } = UpdatePromptSchema.parse(body);

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Prompt text cannot be empty' },
        { status: 400 }
      );
    }

    const prompt = await prisma.systemPrompt.update({
      where: { id },
      data: { content: text },
      include: { rams_format: { select: { name: true } } },
    });

    return NextResponse.json(prompt);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
  }
}
