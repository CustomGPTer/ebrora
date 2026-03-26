'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Prompt {
  id: string;
  formatId: string;
  formatName: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  prompts: Prompt[];
}

export function PromptsClient({ prompts: initialPrompts }: Props) {
  const router = useRouter();
  const [prompts, setPrompts] = useState(initialPrompts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);

  const startEdit = (p: Prompt) => { setEditingId(p.id); setEditText(p.text); };
  const cancelEdit = () => { setEditingId(null); setEditText(''); };

  const saveEdit = async () => {
    if (!editingId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, text: editText }),
      });
      if (!res.ok) throw new Error('Failed');
      setPrompts(prompts.map((p) => p.id === editingId ? { ...p, text: editText, updatedAt: new Date().toISOString() } : p));
      cancelEdit();
      router.refresh();
    } catch { alert('Error updating prompt'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="admin-page-heading">
        <div>
          <h2 className="admin-page-heading__title">System Prompts</h2>
          <p className="admin-page-heading__subtitle">{prompts.length} prompts configured</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {prompts.map((prompt) => (
          <div key={prompt.id} className="admin-card admin-prompt-card">
            <div className="admin-card__header">
              <h3 className="admin-card__title">{prompt.formatName}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                Updated {new Date(prompt.updatedAt).toLocaleDateString('en-GB')}
              </span>
            </div>
            <div className="admin-card__body">
              {editingId === prompt.id ? (
                <div>
                  <textarea
                    className="admin-textarea"
                    rows={15}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div className="admin-char-count" style={{ margin: '0.5rem 0 1rem' }}>
                    {editText.length} characters
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="admin-btn admin-btn--primary" onClick={saveEdit} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button className="admin-btn admin-btn--outline" onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <pre style={{
                    background: 'var(--admin-bg)', padding: '1rem', borderRadius: '6px',
                    overflow: 'auto', fontSize: '0.8125rem', maxHeight: '300px',
                    margin: '0 0 0.75rem', border: '1px solid var(--admin-border-light)', lineHeight: 1.6,
                  }}>
                    {prompt.text}
                  </pre>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="admin-char-count">{prompt.text.length} characters</span>
                    <button className="admin-btn admin-btn--gold" onClick={() => startEdit(prompt)}>Edit Prompt</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {prompts.length === 0 && (
          <div className="admin-card">
            <div className="admin-empty"><div className="admin-empty__icon">💬</div><p className="admin-empty__text">No system prompts found</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
