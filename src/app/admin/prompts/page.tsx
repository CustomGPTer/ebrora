import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { PromptsClient } from '@/components/admin/PromptsClient';

export const metadata = { title: 'System Prompts – Admin' };

export default async function PromptsPage() {
  await requireAdmin();

  const prompts = await prisma.systemPrompt.findMany({
    include: { rams_format: { select: { id: true, name: true } } },
    orderBy: { created_at: 'asc' },
  });

  const promptsData = prompts.map((p) => ({
    id: p.id,
    formatId: p.format_id,
    formatName: p.rams_format?.name || 'Unknown',
    text: p.content,
    createdAt: p.created_at.toISOString(),
    updatedAt: p.updated_at.toISOString(),
  }));

  return <PromptsClient prompts={promptsData} />;
}
