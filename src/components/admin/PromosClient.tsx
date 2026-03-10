'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Promo {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usageCount: number;
  expiresAt: Date | null;
  active: boolean;
  createdAt: Date;
}

interface PromosClientProps {
  promos: Promo[];
}

export function PromosClient({ promos: initialPromos }: PromosClientProps) {
  const router = useRouter();
  const [promos, setPromos] = useState(initialPromos);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountPercent: 10,
    maxUses: 100,
    expiresAt: '',
  });
  const [loading, setLoading] = useState(false);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      alert('Promo code is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          discountPercent: formData.discountPercent,
          maxUses: formData.maxUses,
          expiresAt: formData.expiresAt || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to create promo');

      const newPromo = await res.json();
      setPromos([newPromo, ...promos]);
      setFormData({
        code: '',
        discountPercent: 10,
        maxUses: 100,
        expiresAt: '',
      });
      setShowCreateForm(false);
      router.refresh();
    } catch (error) {
      alert('Error creating promo');
    } finally {
      setLoading(false);
    }
  };

  const togglePromoActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/admin/promos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !active }),
      });

      if (!res.ok) throw new Error('Failed to toggle promo');

      setPromos(
        promos.map((p) => (p.id === id ? { ...p, active: !active } : p))
      );
      router.refresh();
    } catch (error) {
      alert('Error toggling promo');
    }
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isLimitReached = (promo: Promo) => {
    return promo.usageCount >= promo.maxUses;
  };

  return (
    <div style={{ padding: '1.5rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, color: '#1B5B50', fontSize: '1.5rem' }}>
          Promo Code Management
        </h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#D4A44C',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {showCreateForm ? 'Cancel' : 'Create New Promo'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreatePromo}
          style={{
            padding: '1.5rem',
            border: '1px solid #1B5B50',
            borderRadius: '0.5rem',
            marginBottom: '2rem',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h2 style={{ margin: '0 0 1rem 0', color: '#1B5B50' }}>New Promo Code</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1B5B50' }}>
                Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SUMMER20"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.25rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1B5B50' }}>
                Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.25rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1B5B50' }}>
                Max Uses
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.25rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1B5B50' }}>
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '0.25rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

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
            Create Promo
          </button>
        </form>
      )}

      {/* Promos Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-promo-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #1B5B50' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Code
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Discount
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Uses
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Expiry
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Status
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', color: '#1B5B50' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {promos.map((promo) => {
              const expired = isExpired(promo.expiresAt);
              const limitReached = isLimitReached(promo);

              return (
                <tr key={promo.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{promo.code}</td>
                  <td style={{ padding: '0.75rem' }}>{promo.discountPercent}%</td>
                  <td style={{ padding: '0.75rem' }}>
                    {promo.usageCount} / {promo.maxUses}
                    {limitReached && (
                      <div style={{ fontSize: '0.75rem', color: '#d32f2f' }}>LIMIT REACHED</div>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#666' }}>
                    {promo.expiresAt ? (
                      <>
                        {new Date(promo.expiresAt).toLocaleDateString()}
                        {expired && <div style={{ color: '#d32f2f' }}>EXPIRED</div>}
                      </>
                    ) : (
                      'Never'
                    )}
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
                          expired || limitReached || !promo.active
                            ? '#f8d7da'
                            : '#d4edda',
                        color:
                          expired || limitReached || !promo.active
                            ? '#721c24'
                            : '#155724',
                      }}
                    >
                      {expired ? 'EXPIRED' : limitReached ? 'LIMIT' : promo.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <button
                      onClick={() => togglePromoActive(promo.id, promo.active)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: promo.active ? '#d32f2f' : '#1B5B50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      {promo.active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {promos.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
          No promo codes yet. Create one to get started.
        </div>
      )}
    </div>
  );
}
