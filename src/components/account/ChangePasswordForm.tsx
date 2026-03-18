'use client';

import { useState } from 'react';

interface PasswordStrength {
  score: number;
  label: string;
}

export default function ChangePasswordForm() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    return { score, label: labels[Math.min(score, 5)] };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'newPassword') {
      setStrength(calculatePasswordStrength(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully.' });
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setStrength(null);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to change password.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (score: number) => {
    if (score <= 1) return '#dc2626';
    if (score <= 2) return '#f59e0b';
    if (score <= 3) return '#eab308';
    if (score <= 4) return '#84cc16';
    return '#16a34a';
  };

  const inputClass =
    'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B5745]/20 focus:border-[#1B5745] transition-colors';
  const labelClass = 'block text-xs font-semibold text-gray-600 mb-1.5';

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

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label htmlFor="currentPassword" className={labelClass}>Current Password</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            placeholder="Enter current password"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="newPassword" className={labelClass}>New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            placeholder="Enter new password"
            required
            className={inputClass}
          />
          {strength && formData.newPassword && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(strength.score / 6) * 100}%`,
                    backgroundColor: getStrengthColor(strength.score),
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className={labelClass}>Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm new password"
            required
            className={inputClass}
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B5745] text-white text-sm font-semibold rounded-lg hover:bg-[#143f33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
