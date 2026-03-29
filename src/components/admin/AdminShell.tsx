'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '@/styles/admin.css';

interface AdminShellProps {
  children: ReactNode;
}

const navSections = [
  {
    title: 'Overview',
    links: [
      { href: '/admin', label: 'Dashboard', icon: '📊' },
      { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
    ],
  },
  {
    title: 'Users & Revenue',
    links: [
      { href: '/admin/users', label: 'Users', icon: '👥' },
      { href: '/admin/email-captures', label: 'Registered Emails', icon: '📧' },
    ],
  },
  {
    title: 'AI Tools',
    links: [
      { href: '/admin/generations', label: 'RAMS Generations', icon: '⚙️' },
      { href: '/admin/formats', label: 'Formats', icon: '📋' },
      { href: '/admin/prompts', label: 'System Prompts', icon: '💬' },
    ],
  },
  {
    title: 'Content',
    links: [
      { href: '/admin/toolbox-talks', label: 'Toolbox Talks', icon: '🗣️' },
      { href: '/admin/free-templates', label: 'Free Templates', icon: '📁' },
    ],
  },
  {
    title: 'System',
    links: [
      { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
    ],
  },
];

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const pageTitle = () => {
    for (const section of navSections) {
      for (const link of section.links) {
        if (isActive(link.href)) return link.label;
      }
    }
    return 'Admin Panel';
  };

  return (
    <div className="admin-layout">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="admin-mobile-overlay admin-mobile-overlay--visible"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__brand-icon">E</div>
          <div className="admin-sidebar__brand-text">
            <span className="admin-sidebar__brand-name">Ebrora</span>
            <span className="admin-sidebar__brand-label">Admin Panel</span>
          </div>
        </div>

        <nav className="admin-nav">
          {navSections.map((section) => (
            <div key={section.title} className="admin-nav__section">
              <div className="admin-nav__section-title">{section.title}</div>
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`admin-nav__link ${isActive(link.href) ? 'admin-nav__link--active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="admin-nav__icon">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <Link href="/" className="admin-sidebar__back">
            ← Back to Ebrora
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="admin-mobile-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <h1 className="admin-header__title">{pageTitle()}</h1>
          </div>
          <div className="admin-header__actions">
            <button
              className="admin-header__refresh"
              onClick={() => window.location.reload()}
            >
              ↻ Refresh
            </button>
          </div>
        </header>

        <div className="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}
