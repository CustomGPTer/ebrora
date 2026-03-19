'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: string;
  status: string;
  generationsCount: number;
  createdAt: Date;
  disabled: boolean;
}

interface UsersClientProps {
  users: User[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  currentTier: string;
  currentSearch: string;
}

export function UsersClient({
  users,
  currentPage,
  totalPages,
  totalCount,
  currentTier,
  currentSearch,
}: UsersClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [tier, setTier] = useState(currentTier);
  const [loading, setLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (tier !== 'ALL') params.set('tier', tier);
    params.set('page', '1');
    router.push(`/admin/users?${params.toString()}`);
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Change user role to ${newRole}?`)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!res.ok) throw new Error('Failed to update user');
      router.refresh();
    } catch (error) {
      alert('Error updating user');
    }
  };

  const handleDisableUser = async (userId: string) => {
    if (!confirm('Disable this user account?')) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, disabled: true }),
      });

      if (!res.ok) throw new Error('Failed to disable user');
      router.refresh();
    } catch (error) {
      alert('Error disabling user');
    }
  };

  const pageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (tier !== 'ALL') params.set('tier', tier);
    params.set('page', pageNum.toString());
    return `/admin/users?${params.toString()}`;
  };

  return (
    <div style={{ padding: '1.5rem 0' }}>
      <h1 style={{ marginBottom: '1.5rem', color: '#1B5B50', fontSize: '1.5rem' }}>
        User Management
      </h1>

      {/* Search & Filter */}
      <form onSubmit={handleSearch} className="admin-search">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '0.25rem',
            }}
          />
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            style={{
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '0.25rem',
              backgroundColor: 'white',
            }}
          >
            <option value="ALL">All Tiers</option>
            <option value="FREE">Free</option>
            <option value="STANDARD">Standard</option>
            <option value="PROFESSIONAL">Professional</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#1B5B50',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Search
          </button>
        </div>
      </form>

      {/* Results Info */}
      <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.875rem' }}>
        Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalCount)} of{' '}
        {totalCount} users
      </div>

      {/* Users Table */}
      <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr className="admin-table__header" style={{ borderBottom: '2px solid #1B5B50' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Name
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Email
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Role
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Tier
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Generations
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Joined
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="admin-table__row"
                style={{
                  borderBottom: '1px solid #e0e0e0',
                  opacity: user.disabled ? 0.6 : 1,
                }}
              >
                <td style={{ padding: '0.75rem' }}>
                  <strong>{user.name}</strong>
                  {user.disabled && (
                    <div style={{ fontSize: '0.75rem', color: '#d32f2f' }}>DISABLED</div>
                  )}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{user.email}</td>
                <td style={{ padding: '0.75rem' }}>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '0.25rem',
                    }}
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      backgroundColor:
                        user.tier === 'PROFESSIONAL'
                          ? '#fce4ec'
                          : user.tier === 'STANDARD'
                            ? '#e3f2fd'
                            : '#f5f5f5',
                      color: user.tier === 'PROFESSIONAL' ? '#c2185b' : user.tier === 'STANDARD' ? '#1565c0' : '#666',
                    }}
                  >
                    {user.tier}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>{user.generationsCount}</td>
                <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#999' }}>
                  {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <button
                    onClick={() => handleDisableUser(user.id)}
                    disabled={user.disabled}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: user.disabled ? '#ccc' : '#d32f2f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: user.disabled ? 'default' : 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    {user.disabled ? 'Disabled' : 'Disable'}
                  </button>
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

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
    </div>
  );
}
