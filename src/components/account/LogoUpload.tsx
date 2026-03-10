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
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please upload a PNG, JPG, or SVG file' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must not exceed 2MB' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/account/logo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to upload logo' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while uploading logo' });
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/account/logo', {
        method: 'DELETE',
      });

      if (response.ok) {
        setPreview(null);
        setMessage({ type: 'success', text: 'Logo deleted successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to delete logo' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while deleting logo' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logo-upload">
      {message && (
        <div className={`message message--${message.type}`}>
          {message.text}
        </div>
      )}

      <p className="logo-upload__note">Used in Client Branded RAMS format</p>

      {!preview ? (
        <div
          className={`logo-upload__dropzone ${isDragging ? 'logo-upload__dropzone--active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <p>Drag and drop your logo here, or click to select</p>
          <p className="logo-upload__formats">PNG, JPG, or SVG (max 2MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={loading}
          />
        </div>
      ) : (
        <div className="logo-upload__preview">
          <img src={preview} alt="Company logo" />
          <div className="logo-upload__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              Change Logo
            </button>
            <button
              type="button"
              className="button button--danger"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete Logo
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
            disabled={loading}
          />
        </div>
      )}
    </div>
  );
}
