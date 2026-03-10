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
    return {
      score,
      label: labels[Math.min(score, 5)],
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Update strength indicator for new password field
    if (name === 'newPassword') {
      setStrength(calculatePasswordStrength(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    // Validate password strength
    if (formData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
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
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setStrength(null);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while changing password' });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (score: number) => {
    if (score <= 1) return '#d32f2f';
    if (score <= 2) return '#f57c00';
    if (score <= 3) return '#fbc02d';
    if (score <= 4) return '#7cb342';
    return '#388e3c';
  };

  return (
    <div className="account__card change-password">
      <h3>Change Password</h3>
      {message && (
        <div className={`message message--${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="change-password__form">
        <div className="change-password__field">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            placeholder="Enter your current password"
            required
          />
        </div>

        <div className="change-password__field">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            placeholder="Enter new password"
            required
          />
          {strength && formData.newPassword && (
            <div className="change-password__strength">
              <div className="strength-meter">
                <div
                  className="strength-meter__bar"
                  style={{
                    width: `${(strength.score / 6) * 100}%`,
                    backgroundColor: getStrengthColor(strength.score),
                  }}
                ></div>
              </div>
              <p className="strength-meter__label">{strength.label}</p>
            </div>
          )}
        </div>

        <div className="change-password__field">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm new password"
            required
          />
        </div>

        <button type="submit" className="button button--primary" disabled={loading}>
          {loading ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
