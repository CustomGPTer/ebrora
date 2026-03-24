'use client';

import { useState } from 'react';
import Link from 'next/link';
import DocumentHistory from './DocumentHistory';
import SavedDetailsForm from './SavedDetailsForm';
import LogoUpload from './LogoUpload';
import ChangePasswordForm from './ChangePasswordForm';

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
  tbtDownloadCount: number;
  templateDownloadCount: number;
  generations: Generation[];
  savedDetails: SavedDetails | null;
  initialTab?: string;
  aiToolUsage: Record<string, { used: number; limit: number }>;
}

type TabType = 'overview' | 'documents' | 'saved-details' | 'subscription' | 'settings';

const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    key: 'documents',
    label: 'My Documents',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    key: 'saved-details',
    label: 'Saved Details',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    key: 'subscription',
    label: 'Subscription',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function AccountDashboardClient({
  user,
  subscription,
  generationCount,
  tbtDownloadCount,
  templateDownloadCount,
  generations,
  savedDetails,
  initialTab = 'overview',
  aiToolUsage,
}: AccountDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab as TabType);

  // RAMS limits
  const ramsLimit = subscription?.plan === 'PROFESSIONAL' ? 25 : subscription?.plan === 'STANDARD' ? 10 : 1;
  const ramsPercentage = Math.min((generationCount / ramsLimit) * 100, 100);

  // TBT limits
  const tbtLimit = subscription?.plan === 'PROFESSIONAL' ? 20 : subscription?.plan === 'STANDARD' ? 10 : 2;
  const tbtPercentage = Math.min((tbtDownloadCount / tbtLimit) * 100, 100);

  // Template limits
  const templateLimit = subscription?.plan === 'PROFESSIONAL' ? 40 : subscription?.plan === 'STANDARD' ? 20 : 2;
  const templatePercentage = Math.min((templateDownloadCount / templateLimit) * 100, 100);

  const planLabel = subscription?.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1).toLowerCase()
    : 'Free';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-gradient-to-b from-[#0f2d22] to-[#1B5745]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-white text-lg font-bold shrink-0">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {user.name || 'My Account'}
              </h1>
              <p className="text-sm text-emerald-200/70">{user.email}</p>
            </div>
            <div className="ml-auto hidden sm:block">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-emerald-100">
                {planLabel} Plan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-[#1B5745] text-[#1B5745]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ─── OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Plan card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Current Plan</p>
                <p className="text-2xl font-bold text-gray-900">{planLabel}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Status: <span className={`font-medium ${subscription?.status === 'ACTIVE' || !subscription ? 'text-green-600' : 'text-amber-600'}`}>{subscription?.status || 'Active'}</span>
                </p>
              </div>

              {/* RAMS usage */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">RAMS Generated</p>
                <p className="text-2xl font-bold text-gray-900">
                  {generationCount} <span className="text-base font-normal text-gray-400">/ {ramsLimit}</span>
                </p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${ramsPercentage}%`,
                      backgroundColor: ramsPercentage > 80 ? '#dc2626' : '#1B5745',
                    }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">per month</p>
              </div>

              {/* TBT downloads */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Toolbox Talks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tbtDownloadCount} <span className="text-base font-normal text-gray-400">/ {tbtLimit}</span>
                </p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${tbtPercentage}%`,
                      backgroundColor: tbtPercentage > 80 ? '#dc2626' : '#1B5745',
                    }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">downloads / rolling 30 days</p>
              </div>

              {/* Template downloads */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Free Templates</p>
                <p className="text-2xl font-bold text-gray-900">
                  {templateDownloadCount} <span className="text-base font-normal text-gray-400">/ {templateLimit}</span>
                </p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${templatePercentage}%`,
                      backgroundColor: templatePercentage > 80 ? '#dc2626' : '#1B5745',
                    }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">downloads / rolling 30 days</p>
              </div>
            </div>

            {/* AI Tool stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* COSHH Assessments */}
              {(() => {
                const coshh = aiToolUsage['coshh'] || { used: 0, limit: 1 };
                const coshhPct = Math.min((coshh.used / coshh.limit) * 100, 100);
                return (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">COSHH Assessments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {coshh.used} <span className="text-base font-normal text-gray-400">/ {coshh.limit}</span>
                    </p>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${coshhPct}%`,
                          backgroundColor: coshhPct > 80 ? '#dc2626' : '#1B5745',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">per month</p>
                  </div>
                );
              })()}

              {/* Toolbox Talk Generator */}
              {(() => {
                const tbtGen = aiToolUsage['tbt-generator'] || { used: 0, limit: 1 };
                const tbtGenPct = Math.min((tbtGen.used / tbtGen.limit) * 100, 100);
                return (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Toolbox Talk Generator</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tbtGen.used} <span className="text-base font-normal text-gray-400">/ {tbtGen.limit}</span>
                    </p>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${tbtGenPct}%`,
                          backgroundColor: tbtGenPct > 80 ? '#dc2626' : '#1B5745',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">per month</p>
                  </div>
                );
              })()}

              {/* ITP Generator */}
              {(() => {
                const itp = aiToolUsage['itp'] || { used: 0, limit: 1 };
                const itpPct = Math.min((itp.used / itp.limit) * 100, 100);
                return (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">ITP Generator</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {itp.used} <span className="text-base font-normal text-gray-400">/ {itp.limit}</span>
                    </p>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${itpPct}%`,
                          backgroundColor: itpPct > 80 ? '#dc2626' : '#1B5745',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">per month</p>
                  </div>
                );
              })()}

              {/* Manual Handling */}
              {(() => {
                const mh = aiToolUsage['manual-handling'] || { used: 0, limit: 1 };
                const mhPct = Math.min((mh.used / mh.limit) * 100, 100);
                return (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Manual Handling</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {mh.used} <span className="text-base font-normal text-gray-400">/ {mh.limit}</span>
                    </p>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${mhPct}%`,
                          backgroundColor: mhPct > 80 ? '#dc2626' : '#1B5745',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">per month</p>
                  </div>
                );
              })()}
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/rams-builder"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B5745] text-white text-sm font-semibold rounded-lg hover:bg-[#143f33] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Generate RAMS
                </Link>
                <Link
                  href="/rams-builder/pricing"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View Pricing
                </Link>
                <Link
                  href="/toolbox-talks"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Toolbox Talks
                </Link>
              </div>
            </div>

            {/* Recent documents */}
            {generations.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">Recent Documents</h2>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="text-sm font-medium text-[#1B5745] hover:text-[#143f33] transition-colors"
                  >
                    View all &rarr;
                  </button>
                </div>
                <DocumentHistory generations={generations.slice(0, 5)} />
              </div>
            )}
          </div>
        )}

        {/* ─── DOCUMENTS ─── */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-base font-bold text-gray-900">My Documents</h2>
                <p className="text-sm text-gray-500 mt-1">View and download your recently generated RAMS documents.</p>
              </div>
              <DocumentHistory generations={generations} />
            </div>
          </div>
        )}

        {/* ─── SAVED DETAILS ─── */}
        {activeTab === 'saved-details' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900">Company Information</h2>
                <p className="text-sm text-gray-500 mt-1">Save your company details to auto-fill RAMS questionnaires.</p>
              </div>
              <SavedDetailsForm initialData={savedDetails} />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-base font-bold text-gray-900">Company Logo</h2>
                <p className="text-sm text-gray-500 mt-1">Upload a logo for your Client Branded RAMS documents.</p>
              </div>
              <LogoUpload currentLogo={user.logo} />
            </div>
          </div>
        )}

        {/* ─── SUBSCRIPTION ─── */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            {/* Current plan */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Current Plan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Plan</p>
                  <p className="text-lg font-bold text-gray-900">{planLabel}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Status</p>
                  <p className="text-lg font-bold text-green-600">{subscription?.status || 'Active'}</p>
                </div>
                {subscription?.currentPeriodEnd && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Next Billing</p>
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Usage */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Usage This Period</h2>
              <div className="space-y-5">
                {/* RAMS */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">RAMS Generated</span>
                    <span className="text-sm text-gray-500">{generationCount} / {ramsLimit}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${ramsPercentage}%`, backgroundColor: ramsPercentage > 80 ? '#dc2626' : '#1B5745' }} />
                  </div>
                </div>
                {/* TBTs */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">Toolbox Talk Downloads</span>
                    <span className="text-sm text-gray-500">{tbtDownloadCount} / {tbtLimit}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${tbtPercentage}%`, backgroundColor: tbtPercentage > 80 ? '#dc2626' : '#1B5745' }} />
                  </div>
                </div>
                {/* Templates */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700">Free Template Downloads</span>
                    <span className="text-sm text-gray-500">{templateDownloadCount} / {templateLimit}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${templatePercentage}%`, backgroundColor: templatePercentage > 80 ? '#dc2626' : '#1B5745' }} />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">Download limits reset on a rolling 30-day basis.</p>
            </div>

            {/* Plan options */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Plan Options</h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/rams-builder/pricing"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B5745] text-white text-sm font-semibold rounded-lg hover:bg-[#143f33] transition-colors"
                >
                  Upgrade Plan
                </Link>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                  Downgrade Plan
                </button>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 text-red-600 text-sm font-semibold rounded-lg border border-red-200 hover:bg-red-50 transition-colors">
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── SETTINGS ─── */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Profile info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Profile Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Name</p>
                  <p className="text-sm font-medium text-gray-900">{user.name || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Change password */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">Change Password</h2>
              <ChangePasswordForm />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
