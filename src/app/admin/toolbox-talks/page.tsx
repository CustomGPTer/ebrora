import { requireAdmin } from '@/lib/auth-utils';
import { getAllCategories, getAvailableTalkCount, getTotalExpectedCount } from '@/data/tbt-structure';

export const metadata = { title: 'Toolbox Talks – Admin' };

export default async function ToolboxTalksAdminPage() {
  await requireAdmin();

  const categories = getAllCategories();
  const totalTalks = getAvailableTalkCount();
  const totalExpected = getTotalExpectedCount();

  const categoriesData = categories.map((c) => {
    const talkCount = c.subfolders.reduce((n, s) => n + s.talks.length, 0);
    const expectedCount = c.subfolders.reduce((n, s) => n + s.expectedTalks.length, 0);
    return {
      id: c.slug,
      code: c.code,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      totalTalks: talkCount,
      expectedTalks: expectedCount,
      subfolderCount: c.subfolders.length,
    };
  });

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <h2 className="admin-page-heading__title">Toolbox Talks</h2>
          <p className="admin-page-heading__subtitle">
            {totalTalks} available talks across {categories.length} categories • {totalExpected} expected
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--green">🗣️</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Available Talks</div>
            <div className="admin-stat-card__value">{totalTalks}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--gold">📂</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Categories</div>
            <div className="admin-stat-card__value">{categories.length}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--blue">📁</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Subfolders</div>
            <div className="admin-stat-card__value">{categoriesData.reduce((n, c) => n + c.subfolderCount, 0)}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--orange">📊</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Coverage</div>
            <div className="admin-stat-card__value">{totalExpected > 0 ? Math.round((totalTalks / totalExpected) * 100) : 0}%</div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">Categories</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            File-based • Data from tbt-structure.ts
          </span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Category</th>
                <th>Slug</th>
                <th>Subfolders</th>
                <th>Talks</th>
                <th>Expected</th>
                <th>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {categoriesData.map((cat) => {
                const pct = cat.expectedTalks > 0 ? Math.round((cat.totalTalks / cat.expectedTalks) * 100) : 0;
                return (
                  <tr key={cat.id}>
                    <td><span className="admin-table__mono">{cat.code}</span></td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{cat.name}</span>
                      {cat.description && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                          {cat.description.slice(0, 60)}{cat.description.length > 60 ? '...' : ''}
                        </span>
                      )}
                    </td>
                    <td><span className="admin-table__mono">{cat.slug}</span></td>
                    <td>{cat.subfolderCount}</td>
                    <td style={{ fontWeight: 700 }}>{cat.totalTalks}</td>
                    <td>{cat.expectedTalks}</td>
                    <td>
                      {pct === 100 ? (
                        <span className="admin-badge admin-badge--active">100%</span>
                      ) : pct >= 75 ? (
                        <span className="admin-badge admin-badge--processing">{pct}%</span>
                      ) : pct > 0 ? (
                        <span className="admin-badge admin-badge--standard">{pct}%</span>
                      ) : (
                        <span className="admin-badge admin-badge--expired">0%</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {categoriesData.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty">
                      <div className="admin-empty__icon">🗣️</div>
                      <p className="admin-empty__text">No toolbox talk categories found</p>
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
