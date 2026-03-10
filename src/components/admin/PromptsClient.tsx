'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Prompt {
  id: string;
  formatId: string;
  formatName: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PromptsClientProps {
  prompts: Prompt[];
}

export function PromptsClient({ prompts: initialPrompts }: PromptsClientProps) {
  const router = useRouter();
  const [prompts, setPrompts] = useState(initialPrompts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);

  const startEdit = (prompt: Prompt) => {
    setEditingId(prompt.id);
    setEditText(prompt.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async () => {
    if (!editingId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          text: editText,
        }),
      });

      if (!res.ok) throw new Error('Failed to update prompt');

      setPrompts(
        prompts.map((p) =>
          p.id === editingId
            ? {
                ...p,
                text: editText,
                updatedAt: new Date(),
              }
            : p
        )
      );
      setEditingId(null);
      setEditText('');
      router.refresh();
    } catch (error) {
      alert('Error updating prompt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem 0' }}>
      <h1 style={{ marginBottom: '1.5rem', color: '#1B5B50', fontSize: '1.5rem' }}>
        System Prompts
      </h1>

      <div className="admin-prompts" style={{ display: 'grid', gap: '2rem' }}>
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            style={{
              padding: '1.5rem',
              border: '1px solid #e0e0e0',
              borderRadius: '0.5rem',
              backgroundColor: 'white',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#1B5B50' }}>{prompt.formatName}</h3>
              <div style={{ fontSize: '0.75rem', color: '#999' }}>
                Updated {new Date(prompt.updatedAt).toLocaleDateString()}
              </div>
            </div>

            {editingId === prompt.id ? (
              <div>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="admin-prompt-editor"
                  rows={15}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid #1B5B50',
                    borderRadius: '0.25rem',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    marginBottom: '1rem',
                  }}
                />

                <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#999' }}>
                  {editText.length} characters
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={saveEdit}
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
                    Save Changes
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      padding: '0.75rem 1.5rem',
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
                <pre
                  style={{
                    backgroundColor: '#f5f5f5',
                    padding: '1rem',
                    borderRadius: '0.25rem',
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    maxHeight: '300px',
                    marginBottom: '1rem',
                  }}
                >
                  {prompt.text}
                </pre>

                <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '1rem' }}>
                  {prompt.text.length} characters
                </div>

                <button
                  onClick={() => startEdit(prompt)}
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
                  Edit Prompt
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
