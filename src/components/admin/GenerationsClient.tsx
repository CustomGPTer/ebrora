'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface Generation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  formatName: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  answers: any;
}

interface Props {
  generations: Generation[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  currentStatus: string;
  statusCounts: Record<string, number>;
}

export function GenerationsClient({ generations, currentPage, totalPages, totalCount, currentStatus, statusCounts }: Props) {
  const router = useRouter();
  const [selectedGen, setSelectedGen] = useState<Generation | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams();
    if (status !== 'ALL') params.set('status', status);
    params.set('page', '1');
    router.push(`/admin/generations?${params.toString()}`);
  };

  const handleRetry = async (genId: string) => {
    if (!confirm('Retry this generation?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generationId: genId }),
      });
      if (!res.ok) throw new Error('Failed');
      router.refresh();
    } catch { alert('Error retrying'); }
    finally { setLoading(false); }
  };

  const pageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (currentStatus !== 'ALL') params.set('status', currentStatus);
    params.set('page', p.toString());
    return `/admin/generations?${params.toString()}`;
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'COMPLETED': return 'admin-badge--completed';
      case 'FAILED': return 'admin-badge--failed';
      case 'PROCESSING': return 'admin-badge--processing';
      case 'QUEUED': return 'admin-badge--queued';
      default: return 'admin-badge--free';
    }
  };

  const statuses = ['ALL', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'];

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <h2 className="admin-page-heading__title">RAMS Generations</h2>
          <p className="admin-page-heading__subtitle">{totalCount} total generations</p>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="admin-filters">
        {statuses.map((s) => (
          <button
            key={s}
            className={`admin-filter-btn ${currentStatus === s ? 'admin-filter-btn--active' : ''}`}
            onClick={() => handleStatusFilter(s)}
          >
            {s} {s !== 'ALL' && statusCounts[s] ? `(${statusCounts[s]})` : ''}
          </button>
        ))}
      </div>

      <div className="admin-pagination__info">
        Showing {Math.min((currentPage - 1) * 50 + 1, totalCount)}–{Math.min(currentPage * 50, totalCount)} of {totalCount}
      </div>

      {/* Table */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Format</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {generations.map((gen) => (
                <tr key={gen.id}>
                  <td><span className="admin-table__mono">{gen.id.substring(0, 8)}</span></td>
                  <td>
                    <span className="admin-table__user-name">{gen.userName}</span>
                    <span className="admin-table__user-email">{gen.userEmail}</span>
                  </td>
                  <td>{gen.formatName}</td>
                  <td><span className={`admin-badge ${statusBadge(gen.status)}`}>{gen.status}</span></td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--admin-text-secondary)' }}>
                    {gen.completedAt
                      ? `${Math.round((new Date(gen.completedAt).getTime() - new Date(gen.createdAt).getTime()) / 1000)}s`
                      : '—'}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
                    {formatDistanceToNow(new Date(gen.createdAt), { addSuffix: true })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button className="admin-btn admin-btn--gold admin-btn--sm" onClick={() => setSelectedGen(gen)}>
                        View
                      </button>
                      {gen.status === 'FAILED' && (
                        <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => handleRetry(gen.id)} disabled={loading}>
                          Retry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {generations.length === 0 && (
                <tr><td colSpan={7}><div className="admin-empty"><div className="admin-empty__icon">⚙️</div><p className="admin-empty__text">No generations found</p></div></td></tr>
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

      {/* Detail Modal */}
      {selectedGen && (
        <div className="admin-modal-overlay" onClick={() => setSelectedGen(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">Generation Details</h3>
              <button className="admin-modal__close" onClick={() => setSelectedGen(null)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div style={{ marginBottom: '1rem' }}>
                <label className="admin-label">ID</label>
                <div className="admin-table__mono">{selectedGen.id}</div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="admin-label">User</label>
                <div>{selectedGen.userName} — {selectedGen.userEmail}</div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="admin-label">Format</label>
                <div>{selectedGen.formatName}</div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="admin-label">Status</label>
                <span className={`admin-badge ${statusBadge(selectedGen.status)}`}>{selectedGen.status}</span>
              </div>
              {selectedGen.errorMessage && (
                <div className="admin-alert admin-alert--danger" style={{ marginBottom: '1rem' }}>
                  <span className="admin-alert__icon">🔴</span>
                  <span className="admin-alert__text">{selectedGen.errorMessage}</span>
                </div>
              )}
              {selectedGen.answers && (
                <div style={{ marginBottom: '1rem' }}>
                  <label className="admin-label">Answers</label>
                  <pre style={{
                    background: 'var(--admin-bg)', padding: '1rem', borderRadius: '6px',
                    overflow: 'auto', fontSize: '0.75rem', maxHeight: '300px',
                    border: '1px solid var(--admin-border-light)', lineHeight: 1.6,
                  }}>
                    {JSON.stringify(selectedGen.answers, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--outline" onClick={() => setSelectedGen(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
