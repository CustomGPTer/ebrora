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
  paypalId: string | null;
  stripeId: string | null;
  paymentProvider: string;
  ramsCount: number;
  aiToolCount: number;
  authMethod: string;
  emailVerified: boolean;
  createdAt: string;
}

interface Props {
  users: User[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  currentTier: string;
  currentSearch: string;
  currentVerified: string;
}

export function UsersClient({ users, currentPage, totalPages, totalCount, currentTier, currentSearch, currentVerified }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [tier, setTier] = useState(currentTier);
  const [verified, setVerified] = useState(currentVerified);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', role: '', tier: '' });
  const [loading, setLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (tier !== 'ALL') params.set('tier', tier);
    if (verified !== 'ALL') params.set('verified', verified);
    params.set('page', '1');
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleTierFilter = (newTier: string) => {
    setTier(newTier);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (newTier !== 'ALL') params.set('tier', newTier);
    if (verified !== 'ALL') params.set('verified', verified);
    params.set('page', '1');
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleVerifiedFilter = (newVerified: string) => {
    setVerified(newVerified);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (tier !== 'ALL') params.set('tier', tier);
    if (newVerified !== 'ALL') params.set('verified', newVerified);
    params.set('page', '1');
    router.push(`/admin/users?${params.toString()}`);
  };

  const pageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (tier !== 'ALL') params.set('tier', tier);
    if (verified !== 'ALL') params.set('verified', verified);
    params.set('page', pageNum.toString());
    return `/admin/users?${params.toString()}`;
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ name: user.name, role: user.role, tier: user.tier });
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editingUser.id, ...editForm }),
      });
      if (!res.ok) throw new Error('Failed');
      setEditingUser(null);
      router.refresh();
    } catch {
      alert('Error updating user');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteUser.id }),
      });
      if (!res.ok) throw new Error('Failed');
      setDeleteUser(null);
      router.refresh();
    } catch {
      alert('Error deleting user');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!editingUser) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editingUser.id, verifyEmail: true }),
      });
      if (!res.ok) throw new Error('Failed');
      // Update local state to reflect verification
      setEditingUser({ ...editingUser, emailVerified: true });
      router.refresh();
    } catch {
      alert('Error verifying email');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Tier', 'Verified', 'Status', 'RAMS', 'AI Tools', 'Auth', 'Joined'];
    const rows = users.map((u) => [
      u.name, u.email, u.role, u.tier, u.emailVerified ? 'Yes' : 'No', u.status,
      u.ramsCount, u.aiToolCount, u.authMethod,
      new Date(u.createdAt).toLocaleDateString('en-GB'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebrora-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tierBadgeClass = (t: string) => {
    switch (t) {
      case 'UNLIMITED': return 'admin-badge--professional';
      case 'PROFESSIONAL': return 'admin-badge--professional';
      case 'STARTER': return 'admin-badge--standard';
      case 'STANDARD': return 'admin-badge--standard';
      default: return 'admin-badge--free';
    }
  };

  return (
    <div>
      {/* Page Heading */}
      <div className="admin-page-heading">
        <div>
          <h2 className="admin-page-heading__title">User Management</h2>
          <p className="admin-page-heading__subtitle">{totalCount} total users</p>
        </div>
        <button className="admin-btn admin-btn--outline admin-export-btn" onClick={exportCSV}>
          📥 Export CSV
        </button>
      </div>

      {/* Search & Filter */}
      <form onSubmit={handleSearch} className="admin-search-bar">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-input"
        />
        <select
          value={tier}
          onChange={(e) => handleTierFilter(e.target.value)}
          className="admin-select"
        >
          <option value="ALL">All Tiers</option>
          <option value="FREE">Free</option>
          <option value="STARTER">Starter</option>
          <option value="PROFESSIONAL">Professional</option>
          <option value="UNLIMITED">Unlimited</option>
        </select>
        <select
          value={verified}
          onChange={(e) => handleVerifiedFilter(e.target.value)}
          className="admin-select"
        >
          <option value="ALL">All Verified</option>
          <option value="YES">✓ Verified</option>
          <option value="NO">✗ Unverified</option>
        </select>
        <button type="submit" className="admin-btn admin-btn--primary">
          Search
        </button>
      </form>

      {/* Results */}
      <div className="admin-pagination__info">
        Showing {Math.min((currentPage - 1) * 20 + 1, totalCount)}–{Math.min(currentPage * 20, totalCount)} of {totalCount}
      </div>

      {/* Table */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Tier</th>
                <th>Verified</th>
                <th>RAMS</th>
                <th>AI Tools</th>
                <th>Auth</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <span className="admin-table__user-name">{user.name || '—'}</span>
                    <span className="admin-table__user-email">{user.email}</span>
                  </td>
                  <td>
                    <span className={`admin-badge ${user.role === 'ADMIN' ? 'admin-badge--admin' : 'admin-badge--user'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${tierBadgeClass(user.tier)}`}>
                      {user.tier}
                    </span>
                  </td>
                  <td>
                    {user.emailVerified ? (
                      <span className="admin-badge admin-badge--success" title="Email verified">✓</span>
                    ) : (
                      <span className="admin-badge admin-badge--warning" title="Email not verified">✗</span>
                    )}
                  </td>
                  <td>{user.ramsCount}</td>
                  <td>{user.aiToolCount}</td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-secondary)' }}>
                      {user.authMethod}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button className="admin-btn admin-btn--gold admin-btn--sm" onClick={() => openEdit(user)}>
                        Edit
                      </button>
                      <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => setDeleteUser(user)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="admin-empty">
                      <div className="admin-empty__icon">👥</div>
                      <p className="admin-empty__text">No users found</p>
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
          {currentPage > 1 && (
            <a href={pageUrl(currentPage - 1)} className="admin-pagination__btn">← Prev</a>
          )}
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let p: number;
            if (totalPages <= 7) {
              p = i + 1;
            } else if (currentPage <= 4) {
              p = i + 1;
            } else if (currentPage >= totalPages - 3) {
              p = totalPages - 6 + i;
            } else {
              p = currentPage - 3 + i;
            }
            return (
              <a
                key={p}
                href={pageUrl(p)}
                className={`admin-pagination__btn ${p === currentPage ? 'admin-pagination__btn--active' : ''}`}
              >
                {p}
              </a>
            );
          })}
          {currentPage < totalPages && (
            <a href={pageUrl(currentPage + 1)} className="admin-pagination__btn">Next →</a>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="admin-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">Edit User</h3>
              <button className="admin-modal__close" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div style={{ marginBottom: '1rem' }}>
                <label className="admin-label">Email</label>
                <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-secondary)', padding: '0.5rem 0' }}>
                  {editingUser.email}
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="admin-label">Name</label>
                <input
                  className="admin-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="admin-label">Role</label>
                <select
                  className="admin-select"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="admin-label">Subscription Tier</label>
                <select
                  className="admin-select"
                  value={editForm.tier}
                  onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="FREE">Free</option>
                  <option value="STARTER">Starter</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="UNLIMITED">Unlimited</option>
                </select>
              </div>
              {editingUser.paymentProvider && editingUser.paymentProvider !== 'PAYPAL' && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <label className="admin-label">Payment Provider</label>
                  <div className="admin-table__mono" style={{ padding: '0.5rem 0' }}>{editingUser.paymentProvider}</div>
                </div>
              )}
              {editingUser.paypalId && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <label className="admin-label">PayPal Subscription ID</label>
                  <div className="admin-table__mono" style={{ padding: '0.5rem 0' }}>{editingUser.paypalId}</div>
                </div>
              )}
              {editingUser.stripeId && (
                <div style={{ marginBottom: '1rem' }}>
                  <label className="admin-label">Stripe Subscription ID</label>
                  <div className="admin-table__mono" style={{ padding: '0.5rem 0' }}>{editingUser.stripeId}</div>
                </div>
              )}
              {!editingUser.paypalId && !editingUser.stripeId && (
                <div style={{ marginBottom: '1rem' }}>
                  <label className="admin-label">Subscription ID</label>
                  <div style={{ padding: '0.5rem 0', color: 'var(--admin-text-muted)' }}>None (admin-granted or free)</div>
                </div>
              )}
              {/* Email Verification Status */}
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--admin-bg-secondary)', borderRadius: '0.5rem' }}>
                <label className="admin-label">Email Verification</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {editingUser.emailVerified ? (
                    <span style={{ color: '#16a34a', fontSize: '0.875rem', fontWeight: 500 }}>
                      ✓ Email verified
                    </span>
                  ) : (
                    <>
                      <span style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                        ✗ Email not verified
                      </span>
                      <button
                        type="button"
                        className="admin-btn admin-btn--success admin-btn--sm"
                        onClick={handleVerifyEmail}
                        disabled={loading}
                      >
                        {loading ? 'Verifying...' : 'Verify Now'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--outline" onClick={() => setEditingUser(null)}>Cancel</button>
              <button className="admin-btn admin-btn--primary" onClick={saveEdit} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUser && (
        <div className="admin-modal-overlay" onClick={() => setDeleteUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3 className="admin-modal__title">Delete User</h3>
              <button className="admin-modal__close" onClick={() => setDeleteUser(null)}>✕</button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-alert admin-alert--danger" style={{ marginBottom: '1rem' }}>
                <span className="admin-alert__icon">⚠️</span>
                <span className="admin-alert__text">
                  This action is permanent and cannot be undone. All user data, subscriptions, and generations will be deleted.
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-secondary)' }}>
                Are you sure you want to delete <strong>{deleteUser.name || deleteUser.email}</strong>?
              </p>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--outline" onClick={() => setDeleteUser(null)}>Cancel</button>
              <button className="admin-btn admin-btn--danger" onClick={confirmDelete} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
