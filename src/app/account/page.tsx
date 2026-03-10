import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth-utils';
import AccountDashboardClient from '@/components/account/AccountDashboardClient';

export const metadata: Metadata = {
  title: 'My Account — Ebrora',
  description: 'Manage your account, subscription, and settings',
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AccountPage({ searchParams }: PageProps) {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const params = await searchParams;
  const tab = (typeof params.tab === 'string' ? params.tab : 'overview') as string;

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      subscription: true,
      logo: true,
      savedDetails: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  // Fetch subscription info
  const subscription = user.subscription
    ? {
        plan: user.subscription.plan,
        status: user.subscription.status,
        currentPeriodStart: user.subscription.currentPeriodStart,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
      }
    : null;

  // Fetch usage stats
  const generationCount = await prisma.generation.count({
    where: {
      userId: session.user.id,
      createdAt: {
        gte: subscription?.currentPeriodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
  });

  // Fetch recent generations (last 10)
  const recentGenerations = await prisma.generation.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      formatName: true,
      status: true,
      createdAt: true,
      fileUrl: true,
      expiresAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Transform generations
  const generations = recentGenerations.map((gen) => ({
    id: gen.id,
    formatName: gen.formatName,
    status: gen.status,
    createdAt: gen.createdAt.toISOString(),
    fileUrl: gen.fileUrl,
    isExpired: gen.expiresAt ? new Date() > gen.expiresAt : false,
  }));

  // Fetch saved details
  const savedDetails = user.savedDetails
    ? {
        companyName: user.savedDetails.companyName,
        companyAddress: user.savedDetails.companyAddress,
        defaultSupervisor: user.savedDetails.defaultSupervisor,
        defaultPrincipalContractor: user.savedDetails.defaultPrincipalContractor,
        phoneNumber: user.savedDetails.phoneNumber,
        email: user.savedDetails.email,
      }
    : null;

  return (
    <main className="account">
      <AccountDashboardClient
        user={{
          name: user.name,
          email: user.email,
          logo: user.logo,
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
