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

interface FormatsClientProps {
  formats: Format[];
}

export function FormatsClient({ formats: initialFormats }: FormatsClientProps) {
  const router = useRouter();
  const [formats, setFormats] = useState(initialFormats);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Format>>({});
  const [loading, setLoading] = useState(false);

  const startEdit = (format: Format) => {
    setEditingId(format.id);
    setEditData({ ...format });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!editingId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/formats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          ...editData,
        }),
      });

      if (!res.ok) throw new Error('Failed to update format');

      setFormats(
        formats.map((f) =>
          f.id === editingId
            ? {
                ...f,
                name: editData.name || f.name,
                description: editData.description || f.description,
                scoringType: editData.scoringType || f.scoringType,
                isFree: editData.isFree !== undefined ? editData.isFree : f.isFree,
                enabled: editData.enabled !== undefined ? editData.enabled : f.enabled,
              }
            : f
        )
      );
      setEditingId(null);
      setEditData({});
      router.refresh();
    } catch (error) {
      alert('Error updating format');
    } finally {
      setLoading(false);
    }
  };

  const toggleFormat = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/admin/formats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !enabled }),
      });

      if (!res.ok) throw new Error('Failed to toggle format');

      setFormats(
        formats.map((f) => (f.id === id ? { ...f, enabled: !enabled } : f))
      );
      router.refresh();
    } catch (error) {
      alert('Error toggling format');
    }
  };

  return (
    <div style={{ padding: '1.5rem 0' }}>
      <h1 style={{ marginBottom: '1.5rem', color: '#1B5B50', fontSize: '1.5rem' }}>
        Format Management
      </h1>

      <div className="admin-formats" style={{ display: 'grid', gap: '1rem' }}>
        {formats.map((format) => (
          <div
            key={format.id}
            className="admin-format-card"
            style={{
              padding: '1.5rem',
              border: '1px solid #e0e0e0',
              borderRadius: '0.5rem',
              backgroundColor: format.enabled ? 'white' : '#f5f5f5',
              opacity: format.enabled ? 1 : 0.7,
            }}
          >
            {editingId === format.id ? (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1B5B50' }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '0.25rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1B5B50' }}>
                    Description
                  </label>
                  <textarea
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '0.25rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#1B5B50' }}>
                    Scoring Type
                  </label>
                  <input
                    type="text"
                    value={editData.scoringType || ''}
                    onChange={(e) => setEditData({ ...editData, scoringType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '0.25rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={editData.isFree || false}
                      onChange={(e) => setEditData({ ...editData, isFree: e.target.checked })}
                    />
                    <span>Free Format</span>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={saveEdit}
                    disabled={loading}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#1B5B50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#ddd',
                      color: '#333',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1B5B50' }}>{format.name}</h3>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
                      {format.description}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <label className="admin-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={format.enabled}
                        onChange={() => toggleFormat(format.id, format.enabled)}
                      />
                      <span style={{ fontSize: '0.875rem' }}>
                        {format.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>
                      Scoring Type
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#1B5B50' }}>
                      {format.scoringType}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>
                      Free Format
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#1B5B50' }}>
                      {format.isFree ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => startEdit(format)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#D4A44C',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
