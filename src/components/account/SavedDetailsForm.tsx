'use client';

import { useState } from 'react';

interface SavedDetailsFormProps {
  initialData: {
    companyName: string | null;
    companyAddress: string | null;
    defaultSupervisor: string | null;
    defaultPrincipalContractor: string | null;
    phoneNumber: string | null;
    email: string | null;
  } | null;
}

export default function SavedDetailsForm({ initialData }: SavedDetailsFormProps) {
  const [formData, setFormData] = useState({
    companyName: initialData?.companyName || '',
    companyAddress: initialData?.companyAddress || '',
    defaultSupervisor: initialData?.defaultSupervisor || '',
    defaultPrincipalContractor: initialData?.defaultPrincipalContractor || '',
    phoneNumber: initialData?.phoneNumber || '',
    email: initialData?.email || '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/account/saved-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Saved details updated successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to save details' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving details' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account__card saved-details">
      <h3>Company Information</h3>
      {message && (
        <div className={`message message--${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="saved-details__form">
        <div className="saved-details__field">
          <label htmlFor="companyName">Company Name</label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            placeholder="Your company name"
          />
        </div>

        <div className="saved-details__field">
          <label htmlFor="companyAddress">Company Address</label>
          <textarea
            id="companyAddress"
            name="companyAddress"
            value={formData.companyAddress}
            onChange={handleInputChange}
            placeholder="Full company address"
            rows={3}
          />
        </div>

        <div className="saved-details__field">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="Phone number"
          />
        </div>

        <div className="saved-details__field">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Contact email"
          />
        </div>

        <div className="saved-details__field">
          <label htmlFor="defaultSupervisor">Default Supervisor</label>
          <input
            type="text"
            id="defaultSupervisor"
            name="defaultSupervisor"
            value={formData.defaultSupervisor}
            onChange={handleInputChange}
            placeholder="Supervisor name"
          />
        </div>

        <div className="saved-details__field">
          <label htmlFor="defaultPrincipalContractor">Default Principal Contractor</label>
          <input
            type="text"
            id="defaultPrincipalContractor"
            name="defaultPrincipalContractor"
            value={formData.defaultPrincipalContractor}
            onChange={handleInputChange}
            placeholder="Principal contractor name"
          />
        </div>

        <button type="submit" className="button button--primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Details'}
        </button>
      </form>
    </div>
  );
}
