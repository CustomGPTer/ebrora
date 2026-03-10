'use client';

import { useState } from 'react';
import Link from 'next/link';

interface User {
  name: string | null;
  email: string;
  logo: string | null;
}

interface Subscription {
  plan: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

interface Generation {
  id: string;
  formatName: string;
  status: string;
  createdAt: string;
  fileUrl: string | null;
  isExpired: boolean;
}

interface SavedDetails {
  companyName: string | null;
  companyAddress: string | null;
  defaultSupervisor: string | null;
  defaultPrincipalContractor: string | null;
  phoneNumber: string | null;
  email: string | null;
}

interface AccountDashboardClientProps {
  user: User;
  subscription: Subscription | null;
  generationCount: number;
  generations: Generation[];
  savedDetails: SavedDetails | null;
  initialTab?: string;
}

type TabType = 'overview' | 'documents' | 'saved-details' | 'subscription' | 'settings';

export default function AccountDashboardClient({
  user,
  subscription,
  generationCount,
  generations,
  savedDetails,
  initialTab = 'overview',
}: AccountDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab as TabType);

  const usageLimit = subscription?.plan === 'pro' ? 100 : subscription?.plan === 'starter' ? 20 : 5;
  const usagePercentage = (generationCount / usageLimit) * 100;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="account__panel">
            <div className="account__section">
              <h2>Welcome back, {user.name || user.email}</h2>
              <p>Manage your account, documents, and subscription below.</p>
            </div>

            <div className="account__card">
              <h3>Subscription Status</h3>
              <div className="account__subscription-badge">
                <span className="badge">{subscription?.plan.toUpperCase() || 'FREE'}</span>
              </div>
              <p>Plan: {subscription?.plan || 'Free'}</p>
              <p>Status: {subscription?.status || 'Active'}</p>
            </div>

            <div className="account__card">
              <h3>Monthly Usage</h3>
              <div className="usage-meter">
                <div className="usage-meter__bar">
                  <div className="usage-meter__fill" style={{ width: `${Math.min(usagePercentage, 100)}%` }}></div>
                </div>
                <p className="usage-meter__text">
                  {generationCount} / {usageLimit} documents generated
                </p>
              </div>
            </div>

            <div className="account__card">
              <h3>Quick Actions</h3>
              <div className="quick-actions">
                <Link href="/generate" className="button button--primary">
                  Generate RAMS
                </Link>
                <Link href="/pricing" className="button button--secondary">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="account__panel">
            <div className="account__section">
              <h2>My Documents</h2>
              <p>View and manage your recently generated documents.</p>
            </div>

            <DocumentHistory generations={generations} />
          </div>
        );

      case 'saved-details':
        return (
          <div className="account__panel">
            <div className="account__section">
              <h2>Saved Details</h2>
              <p>Save your company information to auto-fill questionnaires.</p>
            </div>

            <SavedDetailsForm initialData={savedDetails} />

            <div className="account__card">
              <h3>Company Logo</h3>
              <p>Upload a logo for your Client Branded RAMS documents.</p>
              <LogoUpload currentLogo={user.logo} />
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="account__panel">
            <div className="account__section">
              <h2>Subscription Management</h2>
              <p>Manage your subscription plan and billing.</p>
            </div>

            <div className="account__card">
              <h3>Current Plan</h3>
              <p>Plan: <strong>{subscription?.plan || 'Free'}</strong></p>
              <p>Status: <strong>{subscription?.status || 'Active'}</strong></p>
              {subscription?.currentPeriodEnd && (
                <p>Next billing date: <strong>{new Date(subscription.currentPeriodEnd).toLocaleDateString()}</strong></p>
              )}
            </div>

            <div className="account__card">
              <h3>Usage This Period</h3>
              <div className="usage-meter">
                <div className="usage-meter__bar">
                  <div className="usage-meter__fill" style={{ width: `${Math.min(usagePercentage, 100)}%` }}></div>
                </div>
                <p className="usage-meter__text">
                  {generationCount} / {usageLimit} documents
                </p>
              </div>
            </div>

            <div className="account__card">
              <h3>Plan Options</h3>
              <div className="subscription-actions">
                <button className="button button--secondary">Upgrade Plan</button>
                <button className="button button--secondary">Downgrade Plan</button>
                <button className="button button--danger">Cancel Subscription</button>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="account__panel">
            <div className="account__section">
              <h2>Settings</h2>
              <p>Manage your profile and security.</p>
            </div>

            <div className="account__card">
              <h3>Profile Information</h3>
              <div className="account__section">
                <p>Name: <strong>{user.name || 'Not set'}</strong></p>
                <p>Email: <strong>{user.email}</strong></p>
              </div>
            </div>

            <ChangePasswordForm />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="account__wrapper">
      <div className="account__header">
        <h1>My Account</h1>
      </div>

      <div className="account__tabs">
        {(['overview', 'documents', 'saved-details', 'subscription', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            className={`account__tab ${activeTab === tab ? 'account__tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'documents' && 'My Documents'}
            {tab === 'saved-details' && 'Saved Details'}
            {tab === 'subscription' && 'Subscription'}
            {tab === 'settings' && 'Settings'}
          </button>
        ))}
      </div>

      {renderTabContent()}
    </div>
  );
}

import DocumentHistory from './DocumentHistory';
import SavedDetailsForm from './SavedDetailsForm';
import LogoUpload from './LogoUpload';
import ChangePasswordForm from './ChangePasswordForm';
