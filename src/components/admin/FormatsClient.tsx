'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Format {
  id: string;
  name: string;
  description: string;
  scoringType: string;
  isFree: boolean;
  enabled: boolean;
  order: number;
}

interface Props {
  formats: Format[];
}

export function FormatsClient({ formats: initialFormats }: Props) {
  const router = useRouter();
  const [formats, setFormats] = useState(initialFormats);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Format>>({});
  const [loading, setLoading] = useState(false);

  const startEdit = (f: Format) => { setEditingId(f.id); setEditData({ ...f }); };
  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async () => {
    if (!editingId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/formats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editData }),
      });
      if (!res.ok) throw new Error('Failed');
      setFormats(formats.map((f) => f.id === editingId ? { ...f, ...editData } as Format : f));
      cancelEdit();
      router.refresh();
    } catch { alert('Error updating format'); }
    finally { setLoading(false); }
  };

  const toggleFormat = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/admin/formats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !enabled }),
      });
      if (!res.ok) throw new Error('Failed');
      setFormats(formats.map((f) => (f.id === id ? { ...f, enabled: !enabled } : f)));
    } catch { alert('Error toggling format'); }
  };

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <h2 className="admin-page-heading__title">Format Management</h2>
          <p className="admin-page-heading__subtitle">
            {formats.length} formats • {formats.filter((f) => f.enabled).length} enabled
          </p>
        </div>
      </div>

      <div className="admin-card">
        {formats.map((format) => (
          <div
            key={format.id}
            className={`admin-format-card ${!format.enabled ? 'admin-format-card--disabled' : ''}`}
          >
            {editingId === format.id ? (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="admin-label">Name</label>
                  <input className="admin-input" value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="admin-label">Description</label>
                  <textarea className="admin-textarea" rows={3} value={editData.description || ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} style={{ fontFamily: 'inherit' }} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="admin-label">Scoring Type</label>
                  <input className="admin-input" value={editData.scoringType || ''} onChange={(e) => setEditData({ ...editData, scoringType: e.target.value })} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={editData.isFree || false} onChange={(e) => setEditData({ ...editData, isFree: e.target.checked })} />
                    <span style={{ fontSize: '0.875rem' }}>Free Format</span>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="admin-btn admin-btn--primary" onClick={saveEdit} disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button className="admin-btn admin-btn--outline" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="admin-format-card__header">
                  <div style={{ flex: 1 }}>
                    <h3 className="admin-format-card__name">{format.name}</h3>
                    <p className="admin-format-card__desc">{format.description}</p>
                  </div>
                  <label className="admin-toggle">
                    <input type="checkbox" checked={format.enabled} onChange={() => toggleFormat(format.id, format.enabled)} />
                    <span className="admin-toggle__track" />
                    <span className="admin-toggle__label">{format.enabled ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div className="admin-format-card__meta">
                    <div className="admin-format-card__meta-item">
                      <span className="admin-format-card__meta-label">Scoring</span>
                      <span className="admin-format-card__meta-value">{format.scoringType}</span>
                    </div>
                    <div className="admin-format-card__meta-item">
                      <span className="admin-format-card__meta-label">Free</span>
                      <span className="admin-format-card__meta-value">{format.isFree ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="admin-format-card__meta-item">
                      <span className="admin-format-card__meta-label">Order</span>
                      <span className="admin-format-card__meta-value">{format.order}</span>
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <button className="admin-btn admin-btn--gold admin-btn--sm" onClick={() => startEdit(format)}>Edit</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {formats.length === 0 && (
          <div className="admin-empty"><div className="admin-empty__icon">📋</div><p className="admin-empty__text">No formats found</p></div>
        )}
      </div>
    </div>
  );
}
