// =============================================================================
// /visualise/[documentId] — server component
// Deep-link to a specific saved draft. Auth + tier gated. Fetches the document
// row to confirm ownership, then mounts VisualiseClient with the initial draft ID.
// =============================================================================

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { resolveEffectiveTier } from '@/lib/payments/resolve-tier';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';

import VisualiseClient from '@/components/visualise/VisualiseClient';

export const metadata: Metadata = {
  title: 'Draft — Visualise | Ebrora',
  robots: { index: false, follow: false }, // Never index per-user drafts.
};

interface PageProps {
  params: { documentId: string };
}

export default async function VisualiseDraftPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/auth/login?callbackUrl=/visualise/${params.documentId}`);
  }

  const subscription = await prisma.subscription.findUnique({
    where: { user_id: session.user.id },
  });
  const tier = resolveEffectiveTier(subscription);

  if (tier === 'FREE') {
    redirect('/visualise');
  }

  const document = await prisma.visualiseDocument.findUnique({
    where: { id: params.documentId },
    select: { id: true, user_id: true, title: true },
  });

  if (!document || document.user_id !== session.user.id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <BreadcrumbNav
          items={[
            { label: 'Visualise', href: '/visualise' },
            { label: document.title || 'Draft' },
          ]}
        />
      </div>
      <VisualiseClient tier={tier} initialDocumentId={params.documentId} />
    </div>
  );
}
