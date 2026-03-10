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
  createdAt: Date;
  completedAt: Date | null;
  estimatedDurationSeconds: number;
  errorMessage: string | null;
  answers: any;
}

interface GenerationsClientProps {
  generations: Generation[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  currentStatus: string;
}

export function GenerationsClient({
  generations,
  currentPage,
  totalPages,
  totalCount,
  currentStatus,
}: GenerationsClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [selectedGen, setSelectedGen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    const params = new URLSearchParams();
    if (newStatus !== 'ALL') params.set('status', newStatus);
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

      if (!res.ok) throw new Error('Failed to retry generation');
      router.refresh();
    } catch (error) {
      alert('Error retrying generation');
    } finally {
      setLoading(false);
    }
  };

  const pageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    if (status !== 'ALL') params.set('status', status);
    params.set('page', pageNum.toString());
    return `/admin/generations?${params.toString()}`;
  };

  const selectedGenData = generations.find((g) => g.id === selectedGen);

  return (
    <div style={{ padding: '1.5rem 0' }}>
      <h1 style={{ marginBottom: '1.5rem', color: '#1B5B50', fontSize: '1.5rem' }}>
        Generation Monitoring
      </h1>

      {/* Status Filter */}
      <div className="admin-filters" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['ALL', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'].map((s) => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #1B5B50',
              backgroundColor: status === s ? '#1B5B50' : 'white',
              color: status === s ? 'white' : '#1B5B50',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Results Info */}
      <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.875rem' }}>
        Showing {(currentPage - 1) * 50 + 1} to {Math.min(currentPage * 50, totalCount)} of{' '}
        {totalCount} generations
      </div>

      {/* Generations Table */}
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table className="admin-gen-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #1B5B50' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                ID
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                User
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Format
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Status
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Created
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Duration
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {generations.map((gen) => (
              <tr key={gen.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '0.75rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  {gen.id.substring(0, 8)}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.875rem' }}>{gen.userName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#999' }}>{gen.userEmail}</div>
                </td>
                <td style={{ padding: '0.75rem' }}>{gen.formatName}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      backgroundColor:
                        gen.status === 'COMPLETED'
                          ? '#d4edda'
                          : gen.status === 'FAILED'
                            ? '#f8d7da'
                            : '#fff3cd',
                      color:
                        gen.status === 'COMPLETED'
                          ? '#155724'
                          : gen.status === 'FAILED'
                            ? '#721c24'
                            : '#856404',
                    }}
                  >
                    {gen.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#999' }}>
                  {formatDistanceToNow(new Date(gen.createdAt), { addSuffix: true })}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                  {gen.completedAt
                    ? `${Math.round(
                        (new Date(gen.completedAt).getTime() - new Date(gen.createdAt).getTime()) /
                          1000
                      )}s`
                    : '—'}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <button
                    onClick={() => setSelectedGen(gen.id)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#D4A44C',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      marginRight: '0.5rem',
                    }}
                  >
                    View
                  </button>
                  {gen.status === 'FAILED' && (
                    <button
                      onClick={() => handleRetry(gen.id)}
                      disabled={loading}
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#d32f2f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          {currentPage > 1 && (
            <a
              href={pageUrl(currentPage - 1)}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #1B5B50',
                color: '#1B5B50',
                textDecoration: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
              }}
            >
              ← Prev
            </a>
          )}

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={pageUrl(p)}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #ddd',
                backgroundColor: p === currentPage ? '#1B5B50' : 'white',
                color: p === currentPage ? 'white' : '#1B5B50',
                textDecoration: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
              }}
            >
              {p}
            </a>
          ))}

          {currentPage < totalPages && (
            <a
              href={pageUrl(currentPage + 1)}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid #1B5B50',
                color: '#1B5B50',
                textDecoration: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
              }}
            >
              Next →
            </a>
          )}
        </div>
      )}

      {/* Details Modal */}
      {selectedGenData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setSelectedGen(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '0.5rem',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 1rem 0', color: '#1B5B50' }}>Generation Details</h2>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.25rem' }}>
                ID
              </div>
              <div style={{ fontFamily: 'monospace' }}>{selectedGenData.id}</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.25rem' }}>
                User
              </div>
              <div>{selectedGenData.userName}</div>
              <div style={{ fontSize: '0.875rem', color: '#999' }}>{selectedGenData.userEmail}</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.25rem' }}>
                Status
              </div>
              <div>{selectedGenData.status}</div>
            </div>

            {selectedGenData.errorMessage && (
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8d7da', borderRadius: '0.25rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.25rem' }}>
                  Error
                </div>
                <div style={{ color: '#721c24', fontSize: '0.875rem' }}>
                  {selectedGenData.errorMessage}
                </div>
              </div>
            )}

            {selectedGenData.answers && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.25rem' }}>
                  Answers
                </div>
                <pre
                  style={{
                    backgroundColor: '#f5f5f5',
                    padding: '1rem',
                    borderRadius: '0.25rem',
                    overflow: 'auto',
                    fontSize: '0.75rem',
                  }}
                >
                  {JSON.stringify(selectedGenData.answers, null, 2)}
                </pre>
              </div>
            )}

            <button
              onClick={() => setSelectedGen(null)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#1B5B50',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
