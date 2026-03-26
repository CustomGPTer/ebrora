import { requireAdmin } from '@/lib/auth-utils';

export const metadata = { title: 'Settings – Admin' };

export default async function SettingsPage() {
  await requireAdmin();

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <h2 className="admin-page-heading__title">Settings</h2>
          <p className="admin-page-heading__subtitle">System configuration and preferences</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">System Settings</h3>
        </div>
        <div className="admin-card__body">
          <div className="admin-empty">
            <div className="admin-empty__icon">⚙️</div>
            <p className="admin-empty__text">
              Settings page coming soon — email configuration, API settings, and system-wide preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
