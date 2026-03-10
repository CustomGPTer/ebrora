import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import type { Metadata } from 'next';
import DownloadClient from '@/components/rams/DownloadClient';

export const metadata: Metadata = {
  title: 'Download RAMS — Ebrora',
  description: 'Download your generated RAMS document.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DownloadPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/auth/login?callbackUrl=/rams-builder');

  const { id } = await params;
  const generation = await prisma.generation.findUnique({
    where: { id },
    include: { format: true },
  });

  if (!generation || generation.userId !== session.user.id) {
    notFound();
  }

  const isExpired = generation.fileExpiresAt
    ? new Date(generation.fileExpiresAt) < new Date()
    : false;

  return (
    <DownloadClient
      generationId={generation.id}
      formatName={generation.format.name}
      status={generation.status}
      fileUrl={generation.fileUrl}
      isExpired={isExpired}
      createdAt={generation.createdAt.toISOString()}
    />
  );
}
