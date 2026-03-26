import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';

export const metadata = { title: 'Toolbox Talks – Admin' };

export default async function ToolboxTalksAdminPage() {
  await requireAdmin();

  const [categories, totalTalks, publishedTalks] = await Promise.all([
    prisma.toolboxCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { talks: true } },
        talks: {
          select: { isPublished: true },
        },
      },
    }),
    prisma.toolboxTalk.count(),
    prisma.toolboxTalk.count({ where: { isPublished: true } }),
  ]);

  const categoriesData = categories.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    slug: c.slug,
    description: c.description || '',
    totalTalks: c._count.talks,
    publishedTalks: c.talks.filter((t) => t.isPublished).length,
    order: c.order,
  }));

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <h2 className="admin-page-heading__title">Toolbox Talks</h2>
          <p className="admin-page-heading__subtitle">
            {totalTalks} total talks across {categories.length} categories • {publishedTalks} published
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--green">🗣️</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Total Talks</div>
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
          <div className="admin-stat-card__icon admin-stat-card__icon--blue">✅</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Published</div>
            <div className="admin-stat-card__value">{publishedTalks}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--orange">📝</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Drafts</div>
            <div className="admin-stat-card__value">{totalTalks - publishedTalks}</div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">Categories</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            Sorted by display order
          </span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Category</th>
                <th>Slug</th>
                <th>Talks</th>
                <th>Published</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {categoriesData.map((cat) => (
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
                  <td style={{ fontWeight: 700 }}>{cat.totalTalks}</td>
                  <td>{cat.publishedTalks}</td>
                  <td>
                    {cat.publishedTalks === cat.totalTalks ? (
                      <span className="admin-badge admin-badge--active">All Published</span>
                    ) : cat.publishedTalks === 0 ? (
                      <span className="admin-badge admin-badge--expired">No Published</span>
                    ) : (
                      <span className="admin-badge admin-badge--processing">
                        {cat.totalTalks - cat.publishedTalks} draft{cat.totalTalks - cat.publishedTalks > 1 ? 's' : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {categoriesData.length === 0 && (
                <tr>
                  <td colSpan={6}>
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
