import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth-utils';
import AccountDashboardClient from '@/components/account/AccountDashboardClient';

export const metadata: Metadata = {
  title: 'My Account - Ebrora',
  description: 'Manage your account, subscription, and settings',
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AccountPage({ searchParams }: PageProps) {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const tab = (typeof params.tab === 'string' ? params.tab : 'overview') as string;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      subscription: true,
      logos: true,
      saved_details: true,
    },
  });

  if (!user) {
    redirect('/auth/login');
  }

  const subscription = user.subscription
    ? {
        plan: user.subscription.tier,
        status: user.subscription.status,
        currentPeriodStart: user.subscription.current_period_start,
        currentPeriodEnd: user.subscription.current_period_end,
      }
    : null;

  const generationCount = await prisma.generation.count({
    where: {
      user_id: session.user.id,
      created_at: {
        gte: subscription?.currentPeriodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  const recentGenerations = await prisma.generation.findMany({
    where: { user_id: session.user.id },
    select: {
      id: true,
      format_id: true,
      status: true,
      created_at: true,
      blobUrl: true,
      expiresAt: true,
    },
    orderBy: { created_at: 'desc' },
    take: 10,
  });

  const generations = recentGenerations.map((gen) => ({
    id: gen.id,
    formatName: gen.format_id,
    status: gen.status,
    createdAt: gen.created_at.toISOString(),
    fileUrl: gen.blobUrl,
    isExpired: gen.expiresAt ? new Date() > gen.expiresAt : false,
  }));

  const savedDetails = user.saved_details
    ? {
        companyName: user.saved_details.company_name,
        companyAddress: user.saved_details.site_address,
        defaultSupervisor: user.saved_details.supervisor,
        defaultPrincipalContractor: user.saved_details.principal_contractor,
        phoneNumber: null,
        email: null,
      }
    : null;

  const latestLogo = user.logos && user.logos.length > 0 ? user.logos[0] : null;

  return (
    <main className="account">
      <AccountDashboardClient
        user={{
          name: user.name,
          email: user.email,
          logo: latestLogo?.file_path ?? null,
        }}
        subscription={subscription}
        generationCount={generationCount}
        generations={generations}
        savedDetails={savedDetails}
        initialTab={tab}
      />
    </main>
  );
}
