'use client';

interface AnalyticsData {
  aiToolsBySlug: { slug: string; label: string; count: number }[];
  monthlyAiTools: number;
  lastMonthAiTools: number;
  ramsFormatUsage: { formatId: string; formatName: string; count: number }[];
  topUsers: { id: string; name: string; email: string; ramsCount: number; aiToolCount: number; total: number }[];
  downloadsByType: { type: string; count: number }[];
}

interface Props {
  data: AnalyticsData;
}

export function AnalyticsClient({ data }: Props) {
  const totalAiToolUses = data.aiToolsBySlug.reduce((sum, t) => sum + t.count, 0);
  const totalRamsUses = data.ramsFormatUsage.reduce((sum, r) => sum + r.count, 0);
  const totalDownloads = data.downloadsByType.reduce((sum, d) => sum + d.count, 0);
  const monthChange = data.lastMonthAiTools > 0
    ? Math.round(((data.monthlyAiTools - data.lastMonthAiTools) / data.lastMonthAiTools) * 100)
    : 0;

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <h2 className="admin-page-heading__title">Analytics</h2>
          <p className="admin-page-heading__subtitle">Tool usage, popular content, and top users</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--green">🤖</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Total AI Tool Uses</div>
            <div className="admin-stat-card__value">{totalAiToolUses.toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--gold">⚙️</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Total RAMS Generations</div>
            <div className="admin-stat-card__value">{totalRamsUses.toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--blue">📥</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">Total Downloads</div>
            <div className="admin-stat-card__value">{totalDownloads.toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--orange">📊</div>
          <div className="admin-stat-card__body">
            <div className="admin-stat-card__label">AI Tools This Month</div>
            <div className="admin-stat-card__value">{data.monthlyAiTools.toLocaleString()}</div>
            {monthChange !== 0 && (
              <div className={`admin-stat-card__change ${monthChange > 0 ? 'admin-stat-card__change--up' : 'admin-stat-card__change--down'}`}>
                {monthChange > 0 ? '↑' : '↓'} {Math.abs(monthChange)}% vs last month
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        {/* AI Tool Usage by Type */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h3 className="admin-card__title">AI Tools — Usage by Type</h3>
          </div>
          <div className="admin-card__body" style={{ padding: 0 }}>
            {data.aiToolsBySlug.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Tool</th>
                    <th>Uses</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.aiToolsBySlug.map((t) => (
                    <tr key={t.slug}>
                      <td style={{ fontWeight: 600 }}>{t.label}</td>
                      <td>{t.count.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            height: '6px', borderRadius: '3px', background: 'var(--admin-green)',
                            width: `${Math.max((t.count / (totalAiToolUses || 1)) * 100, 4)}%`, maxWidth: '120px',
                          }} />
                          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                            {totalAiToolUses > 0 ? Math.round((t.count / totalAiToolUses) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="admin-empty">
                <div className="admin-empty__icon">🤖</div>
                <p className="admin-empty__text">No AI tool usage data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* RAMS Format Usage */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h3 className="admin-card__title">RAMS — Usage by Format</h3>
          </div>
          <div className="admin-card__body" style={{ padding: 0 }}>
            {data.ramsFormatUsage.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Format</th>
                    <th>Uses</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ramsFormatUsage.map((r) => (
                    <tr key={r.formatId}>
                      <td style={{ fontWeight: 600 }}>{r.formatName}</td>
                      <td>{r.count.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            height: '6px', borderRadius: '3px', background: 'var(--admin-gold)',
                            width: `${Math.max((r.count / (totalRamsUses || 1)) * 100, 4)}%`, maxWidth: '120px',
                          }} />
                          <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                            {totalRamsUses > 0 ? Math.round((r.count / totalRamsUses) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="admin-empty">
                <div className="admin-empty__icon">⚙️</div>
                <p className="admin-empty__text">No RAMS generation data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Users */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3 className="admin-card__title">Top Users by Usage</h3>
        </div>
        <div className="admin-card__body" style={{ padding: 0 }}>
          {data.topUsers.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User</th>
                  <th>RAMS</th>
                  <th>AI Tools</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.topUsers.map((u, i) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700, color: 'var(--admin-text-muted)' }}>{i + 1}</td>
                    <td>
                      <span className="admin-table__user-name">{u.name || '—'}</span>
                      <span className="admin-table__user-email">{u.email}</span>
                    </td>
                    <td>{u.ramsCount}</td>
                    <td>{u.aiToolCount}</td>
                    <td style={{ fontWeight: 700 }}>{u.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="admin-empty">
              <div className="admin-empty__icon">👥</div>
              <p className="admin-empty__text">No usage data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Downloads by Type */}
      {data.downloadsByType.length > 0 && (
        <div className="admin-card" style={{ marginTop: '1.5rem' }}>
          <div className="admin-card__header">
            <h3 className="admin-card__title">Downloads by Content Type</h3>
          </div>
          <div className="admin-card__body" style={{ padding: 0 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Content Type</th>
                  <th>Downloads</th>
                </tr>
              </thead>
              <tbody>
                {data.downloadsByType.map((d) => (
                  <tr key={d.type}>
                    <td style={{ fontWeight: 600 }}>{d.type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                    <td>{d.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
