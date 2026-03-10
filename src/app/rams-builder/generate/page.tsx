import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-utils';
import type { Metadata } from 'next';
import QuestionnaireClient from '@/components/rams/QuestionnaireClient';

export const metadata: Metadata = {
  title: 'Generate RAMS — Ebrora RAMS Builder',
  description:
    'Generate a professional RAMS document. Choose your format, answer 20 questions, and download your document.',
};

export default async function GeneratePage() {
  const session = await getSession();
  if (!session) redirect('/auth/login?callbackUrl=/rams-builder/generate');

  // In production, fetch user's subscription tier from DB
  // For now, pass session data with default FREE tier
  return <QuestionnaireClient userId={session.user.id} userTier="FREE" />;
}
