'use client';

import { useRef, useState } from 'react';

interface LogoUploadProps {
  currentLogo: string | null;
}

export default function LogoUpload({ currentLogo }: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(currentLogo);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please upload a PNG, JPG, or SVG file.' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must not exceed 2MB.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/account/logo', { method: 'POST', body: formData });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Logo uploaded successfully.' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to upload logo.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while uploading.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) handleFileSelect(files[0]);
  };

  const handleDelete = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/account/logo', { method: 'DELETE' });

      if (response.ok) {
        setPreview(null);
        setMessage({ type: 'success', text: 'Logo deleted.' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to delete logo.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while deleting.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {!preview ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragging
              ? 'border-[#1B5745] bg-[#1B5745]/5'
              : 'border-gray-200 hover:border-gray-300 bg-gray-50'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            Drag and drop your logo here, or <span className="text-[#1B5745] font-medium">click to browse</span>
          </p>
          <p className="text-xs text-gray-400">PNG, JPG, or SVG (max 2MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={loading}
          />
        </div>
      ) : (
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-xl border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
            <img src={preview} alt="Company logo" className="max-w-full max-h-full object-contain" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Change Logo
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-red-600 text-sm font-semibold rounded-lg border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={loading}
          />
        </div>
      )}
    </div>
  );
}
