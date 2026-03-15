import { ReactNode } from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth-utils';
import type { Metadata } from 'next';

interface AdminLayoutProps {
    children: ReactNode;
}

export const metadata: Metadata = {
    title: 'Admin Panel – Ebrora',
    robots: {
          index: false,
          follow: false,
    },
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
    await requireAdmin();

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
    { href: '/admin/formats', label: 'Formats', icon: '📋' },
    { href: '/admin/generations', label: 'Generations', icon: '⚙️' },
    { href: '/admin/prompts', label: 'System Prompts', icon: '💬' },
    { href: '/admin/promos', label: 'Promo Codes', icon: '🎟️' },
    { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
      ];

  return (
        <div className="admin-layout">
              <aside className="admin-layout__sidebar">
                      <div style={{ padding: '1.5rem 1rem', borderBottom: '1px solid #e0e0e0' }}>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1B5B50', fontWeight: 'bold' }}>
                                            Ebrora Admin
                                </h2>h2>
                      </div>div>
                      <nav className="admin-nav">
                        {navLinks.map((link) => (
                      <Link key={link.href} href={link.href} className="admin-nav__link">
                                    <span style={{ marginRight: '0.5rem' }}>{link.icon}</span>span>
                        {link.label}
                      </Link>Link>
                    ))}
                      </nav>nav>
              </aside>aside>
              <main className="admin-layout__content">
                      <header
                                  style={{
                                                padding: '1.5rem',
                                                borderBottom: '1px solid #e0e0e0',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                  }}
                                >
                                <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1B5B50' }}>Admin Panel</h1>h1>
                                <Link href="/" style={{ color: '#1B5B50', textDecoration: 'none' }}>
                                            ← Back to Site
                                </Link>Link>
                      </header>header>
                      <div style={{ padding: '1.5rem' }}>{children}</div>div>
              </main>main>
        </div>div>
      );
}</div>
