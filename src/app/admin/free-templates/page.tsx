import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';

export const metadata = { title: 'Free Templates – Admin' };

export default async function FreeTemplatesAdminPage() {
  await requireAdmin();

  const [categories, totalTemplates, publishedTemplates] = await Promise.all([
    prisma.freeTemplateCategory.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { templates: true } },
        templates: {
          select: { isPublished: true },
        },
      },
    }),
    prisma.freeTemplate.count(),
    prisma.freeTemplate.count({ where: { isPublished: true } }),
  ]);

  const categoriesData = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    format: c.format,
    description: c.description || '',
    totalTemplates: c._count.templates,
    publishedTemplates: c.templates.filter((t) => t.isPublished).length,
    order: c.order,
  }));

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <h2 className="admin-page-heading__title">Free Templates</h2>
          <p className="admin-page-heading__subtitle">
            {totalTemplates} total templates across {categories.length} categories • {publishedTemplates} published
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
            <div className="admin-stat-card__value">{categories.length}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--blue">✅</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Published</div>
            <div className="admin-stat-card__value">{publishedTemplates}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--orange">📝</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Drafts</div>
            <div className="admin-stat-card__value">{totalTemplates - publishedTemplates}</div>
          </div>
        </div>
      </div>

      {/* Categories Table */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">Template Categories</h3>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Format</th>
                <th>Slug</th>
                <th>Templates</th>
                <th>Published</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {categoriesData.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{cat.name}</span>
                    {cat.description && (
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginTop: '2px' }}>
                        {cat.description.slice(0, 60)}{cat.description.length > 60 ? '...' : ''}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="admin-badge admin-badge--standard">{cat.format}</span>
                  </td>
                  <td><span className="admin-table__mono">{cat.slug}</span></td>
                  <td style={{ fontWeight: 700 }}>{cat.totalTemplates}</td>
                  <td>{cat.publishedTemplates}</td>
                  <td>
                    {cat.publishedTemplates === cat.totalTemplates && cat.totalTemplates > 0 ? (
                      <span className="admin-badge admin-badge--active">All Published</span>
                    ) : cat.publishedTemplates === 0 ? (
                      <span className="admin-badge admin-badge--expired">{cat.totalTemplates === 0 ? 'Empty' : 'No Published'}</span>
                    ) : (
                      <span className="admin-badge admin-badge--processing">
                        {cat.totalTemplates - cat.publishedTemplates} draft{cat.totalTemplates - cat.publishedTemplates > 1 ? 's' : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {categoriesData.length === 0 && (
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
