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
      format: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const promptsData = prompts.map((prompt) => ({
    id: prompt.id,
    formatId: prompt.formatId,
    formatName: prompt.format?.name || 'Unknown',
    text: prompt.text,
    createdAt: prompt.createdAt,
    updatedAt: prompt.updatedAt,
  }));

  return <PromptsClient prompts={promptsData} />;
}
