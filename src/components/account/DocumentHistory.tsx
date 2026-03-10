'use client';

import Link from 'next/link';

interface DocumentHistoryProps {
  generations: Array<{
    id: string;
    formatName: string;
    status: string;
    createdAt: string;
    fileUrl: string | null;
    isExpired: boolean;
  }>;
}

export default function DocumentHistory({ generations }: DocumentHistoryProps) {
  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'doc-history__status--completed';
      case 'PROCESSING':
        return 'doc-history__status--processing';
      case 'QUEUED':
        return 'doc-history__status--queued';
      case 'FAILED':
        return 'doc-history__status--failed';
      default:
        return 'doc-history__status--default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (generations.length === 0) {
    return (
      <div className="account__card">
        <p>No documents generated yet. <Link href="/generate">Start generating RAMS documents.</Link></p>
      </div>
    );
  }

  return (
    <div className="doc-history">
      <table className="doc-history__table">
        <thead>
          <tr>
            <th>Format</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {generations.map((gen) => (
            <tr key={gen.id}>
              <td>{gen.formatName}</td>
              <td>
                <span className={`doc-history__status ${getStatusBadgeClass(gen.status)}`}>
                  {gen.status.toUpperCase()}
                </span>
                {gen.isExpired && gen.status === 'COMPLETED' && (
                  <span className="doc-history__expired"> (Expired)</span>
                )}
              </td>
              <td>{formatDate(gen.createdAt)}</td>
              <td>
                {gen.status === 'COMPLETED' && !gen.isExpired && gen.fileUrl && (
                  <a href={gen.fileUrl} className="button button--small button--primary" download>
                    Download
                  </a>
                )}
                {gen.status === 'FAILED' && (
                  <Link href={`/generate?regenerate=${gen.id}`} className="button button--small button--secondary">
                    Re-generate
                  </Link>
                )}
                {gen.isExpired && (
                  <span className="text-muted">Expired</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
