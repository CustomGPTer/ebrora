import { ReactNode } from 'react';
import { requireAdmin } from '@/lib/auth-utils';
import { AdminShell } from '@/components/admin/AdminShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel – Ebrora',
  robots: { index: false, follow: false },
};

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  await requireAdmin();

  return <AdminShell>{children}</AdminShell>;
}
