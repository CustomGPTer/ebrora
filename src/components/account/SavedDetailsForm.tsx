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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        setMessage({ type: 'success', text: 'Details saved successfully.' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to save details.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setLoading(false);
    }
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="companyName" className={labelClass}>Company Name</label>
            <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="Your company name" className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>Contact Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Contact email" className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="companyAddress" className={labelClass}>Company Address</label>
          <textarea id="companyAddress" name="companyAddress" value={formData.companyAddress} onChange={handleInputChange} placeholder="Full company address" rows={3} className={inputClass + ' resize-none'} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phoneNumber" className={labelClass}>Phone Number</label>
            <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Phone number" className={inputClass} />
          </div>
          <div>
            <label htmlFor="defaultSupervisor" className={labelClass}>Default Supervisor</label>
            <input type="text" id="defaultSupervisor" name="defaultSupervisor" value={formData.defaultSupervisor} onChange={handleInputChange} placeholder="Supervisor name" className={inputClass} />
          </div>
        </div>

        <div className="sm:w-1/2">
          <label htmlFor="defaultPrincipalContractor" className={labelClass}>Default Principal Contractor</label>
          <input type="text" id="defaultPrincipalContractor" name="defaultPrincipalContractor" value={formData.defaultPrincipalContractor} onChange={handleInputChange} placeholder="Principal contractor name" className={inputClass} />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B5745] text-white text-sm font-semibold rounded-lg hover:bg-[#143f33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </form>
    </div>
  );
}
