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
    include: { rams_format: true },
  });

  if (!generation || generation.user_id !== session.user.id) {
    notFound();
  }

  const isExpired = generation.file_expires_at
    ? new Date(generation.file_expires_at) < new Date()
    : false;

  return (
    <DownloadClient
      generationId={generation.id}
      formatName={generation.rams_format.name}
      status={generation.status}
      fileUrl={generation.file_path}
      isExpired={isExpired}
      createdAt={generation.created_at.toISOString()}
    />
  );
}
