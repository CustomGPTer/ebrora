import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';
import GeneratingClient from '@/components/rams/GeneratingClient';

export const metadata: Metadata = {
  title: 'Generating RAMS — Ebrora',
  description: 'Your RAMS document is being generated.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GeneratingPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/auth/login?callbackUrl=/rams-builder');

  const { id } = await params;
  const generation = await prisma.generation.findUnique({
    where: { id },
    include: { rams_format: true },
  });

  if (!generation || generation.user_id !== session.user.id) {
    notFound();
  }

  return (
    <GeneratingClient
      generationId={generation.id}
      formatName={generation.rams_format.name}
      status={generation.status}
    />
  );
}
