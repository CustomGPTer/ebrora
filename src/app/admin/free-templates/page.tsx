import { requireAdmin } from '@/lib/auth-utils';
import { scanAllTemplates, getTotalTemplateCount } from '@/lib/free-templates';
import { FT_CATEGORIES } from '@/data/free-template-categories';

export const metadata = { title: 'Free Templates – Admin' };

export default async function FreeTemplatesAdminPage() {
  await requireAdmin();

  const categoriesWithFiles = scanAllTemplates();
  const totalTemplates = getTotalTemplateCount();
  const totalCategories = FT_CATEGORIES.length;
  const totalSubcategories = FT_CATEGORIES.reduce((n, c) => n + c.subcategories.length, 0);

  // File type breakdown
  const fileTypes: Record<string, number> = {};
  for (const cat of categoriesWithFiles) {
    for (const sub of cat.subcategories) {
      for (const t of sub.templates) {
        const ext = t.fileType.toUpperCase();
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      }
    }
  }

  // Categories with populated subcategories
  const categoriesData = categoriesWithFiles.map((c) => ({
    name: c.name,
    slug: c.slug,
    description: c.description,
    order: c.order,
    totalTemplates: c.totalTemplates,
    subcategoryCount: c.subcategories.length,
    populatedSubcats: c.subcategories.filter((s) => s.templates.length > 0).length,
  }));

  // Also show categories from the master list that have zero files
  const scannedSlugs = new Set(categoriesWithFiles.map((c) => c.slug));
  const emptyCategories = FT_CATEGORIES.filter((c) => !scannedSlugs.has(c.slug)).map((c) => ({
    name: c.name,
    slug: c.slug,
    description: c.description,
    order: c.order,
    totalTemplates: 0,
    subcategoryCount: c.subcategories.length,
    populatedSubcats: 0,
  }));

  const allCategories = [...categoriesData, ...emptyCategories].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <h2 className="admin-page-heading__title">Free Templates</h2>
          <p className="admin-page-heading__subtitle">
            {totalTemplates} templates across {totalCategories} categories ({totalSubcategories} subcategories)
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--green">📁</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Total Templates</div>
            <div className="admin-stat-card__value">{totalTemplates}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--gold">📂</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Categories</div>
            <div className="admin-stat-card__value">{totalCategories}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--blue">📋</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Subcategories</div>
            <div className="admin-stat-card__value">{totalSubcategories}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--orange">📊</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">File Types</div>
            <div className="admin-stat-card__value" style={{ fontSize: '0.85rem' }}>
              {Object.entries(fileTypes).sort((a, b) => b[1] - a[1]).map(([ext, count]) => `${ext}: ${count}`).join(' \u2022 ')}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">Template Categories</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            File-based &bull; Scanned from /data/free-templates/
          </span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Slug</th>
                <th>Subcategories</th>
                <th>Populated</th>
                <th>Templates</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {allCategories.map((cat) => (
                <tr key={cat.slug}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{cat.name}</span>
                    {cat.description && (
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                        {cat.description.slice(0, 60)}{cat.description.length > 60 ? '...' : ''}
                      </span>
                    )}
                  </td>
                  <td><span className="admin-table__mono">{cat.slug}</span></td>
                  <td>{cat.subcategoryCount}</td>
                  <td>{cat.populatedSubcats}</td>
                  <td style={{ fontWeight: 700 }}>{cat.totalTemplates}</td>
                  <td>
                    {cat.totalTemplates > 0 && cat.populatedSubcats === cat.subcategoryCount ? (
                      <span className="admin-badge admin-badge--active">Full</span>
                    ) : cat.totalTemplates > 0 ? (
                      <span className="admin-badge admin-badge--processing">Partial</span>
                    ) : (
                      <span className="admin-badge admin-badge--expired">Empty</span>
                    )}
                  </td>
                </tr>
              ))}
              {allCategories.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty">
                      <div className="admin-empty__icon">📁</div>
                      <p className="admin-empty__text">No template categories found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
