import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';
import { PromptsClient } from '@/components/admin/PromptsClient';

export const metadata = {
  title: 'System Prompts - Admin',
};

export default async function PromptsPage() {
  await requireAdmin();

  const prompts = await prisma.systemPrompt.findMany({
    include: {
      rams_format: { select: { id: true, name: true } },
    },
    orderBy: { created_at: 'asc' },
  });

  const promptsData = prompts.map((prompt) => ({
    id: prompt.id,
    formatId: prompt.format_id,
    formatName: prompt.rams_format?.name || 'Unknown',
    text: prompt.content,
    createdAt: prompt.created_at,
    updatedAt: prompt.updated_at,
  }));

  return <PromptsClient prompts={promptsData} />;
}
