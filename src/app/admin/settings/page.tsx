import { requireAdmin } from '@/lib/auth-utils';

export const metadata = {
  title: 'Settings - Admin',
};

export default async function SettingsPage() {
  await requireAdmin();

  return (
    <div style={{ padding: '1.5rem 0' }}>
      <h1 style={{ marginBottom: '1.5rem', color: '#1B5B50', fontSize: '1.5rem' }}>
        System Settings
      </h1>

      <div
        style={{
          padding: '2rem',
          border: '1px solid #e0e0e0',
          borderRadius: '0.5rem',
          backgroundColor: '#f9f9f9',
          color: '#666',
          textAlign: 'center',
        }}
      >
        <p>System settings will be available here.</p>
        <p style={{ fontSize: '0.875rem', marginTop: '1rem', color: '#999' }}>
          Coming soon: Email configuration, API settings, and system-wide preferences.
        </p>
      </div>
    </div>
  );
}
