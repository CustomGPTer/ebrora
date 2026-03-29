'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface Capture {
  id: string;
  email: string;
  name: string;
  source: string;
  sourceId: string;
  createdAt: string;
}

interface Props {
  captures: Capture[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  currentSource: string;
  currentSearch: string;
  sourceCounts: { source: string; count: number }[];
}

export function EmailCapturesClient({ captures, currentPage, totalPages, totalCount, currentSource, currentSearch, sourceCounts }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (currentSource !== 'ALL') params.set('source', currentSource);
    params.set('page', '1');
    router.push(`/admin/email-captures?${params.toString()}`);
  };

  const handleSourceFilter = (source: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (source !== 'ALL') params.set('source', source);
    params.set('page', '1');
    router.push(`/admin/email-captures?${params.toString()}`);
  };

  const pageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (currentSource !== 'ALL') params.set('source', currentSource);
    params.set('page', p.toString());
    return `/admin/email-captures?${params.toString()}`;
  };

  const exportCSV = () => {
    const headers = ['Email', 'Name', 'Tier', 'Status', 'Registered'];
    const rows = captures.map((c) => [
      c.email, c.name, c.source, c.sourceId,
      new Date(c.createdAt).toLocaleDateString('en-GB'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebrora-registered-emails-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sourceLabel = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <h2 className="admin-page-heading__title">Registered Emails</h2>
          <p className="admin-page-heading__subtitle">{totalCount} registered emails</p>
        </div>
        <button className="admin-btn admin-btn--outline admin-export-btn" onClick={exportCSV}>
          📥 Export CSV
        </button>
      </div>

      {/* Source Stats */}
      <div className="admin-stats" style={{ marginBottom: '1.25rem' }}>
        {sourceCounts.slice(0, 4).map((s) => (
          <div key={s.source} className="admin-stat-card" style={{ cursor: 'pointer' }} onClick={() => handleSourceFilter(s.source)}>
            <div className="admin-stat-card__icon admin-stat-card__icon--green">📧</div>
            <div className="admin-stat-card__body">
              <div className="admin-stat-card__label">{sourceLabel(s.source)}</div>
              <div className="admin-stat-card__value">{s.count}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <button
          className={`admin-filter-btn ${currentSource === 'ALL' ? 'admin-filter-btn--active' : ''}`}
          onClick={() => handleSourceFilter('ALL')}
        >
          All
        </button>
        {sourceCounts.map((s) => (
          <button
            key={s.source}
            className={`admin-filter-btn ${currentSource === s.source ? 'admin-filter-btn--active' : ''}`}
            onClick={() => handleSourceFilter(s.source)}
          >
            {sourceLabel(s.source)} ({s.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="admin-search-bar">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input"
        />
        <button type="submit" className="admin-btn admin-btn--primary">Search</button>
      </form>

      {/* Table */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {captures.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.email}</td>
                  <td>{c.name || '—'}</td>
                  <td><span className="admin-badge admin-badge--standard">{sourceLabel(c.source)}</span></td>
                  <td><span className="admin-table__mono">{c.sourceId || '—'}</span></td>
                  <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.8125rem' }}>
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
              {captures.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="admin-empty">
                      <div className="admin-empty__icon">📧</div>
                      <p className="admin-empty__text">No registered emails found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          {currentPage > 1 && <a href={pageUrl(currentPage - 1)} className="admin-pagination__btn">← Prev</a>}
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <a key={p} href={pageUrl(p)} className={`admin-pagination__btn ${p === currentPage ? 'admin-pagination__btn--active' : ''}`}>{p}</a>
          ))}
          {currentPage < totalPages && <a href={pageUrl(currentPage + 1)} className="admin-pagination__btn">Next →</a>}
        </div>
      )}
    </div>
  );
}
