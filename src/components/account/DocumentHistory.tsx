'use client';

import Link from 'next/link';

/** Unified generation — covers both RAMS and AI tool documents */
interface Generation {
  id: string;
  formatName: string;
  source: 'RAMS' | 'AI_TOOL';
  toolSlug: string | null;
  status: string;
  createdAt: string;
  fileUrl: string | null;
  isExpired: boolean;
}

interface DocumentHistoryProps {
  generations: Generation[];
}

/** Humanise a tool slug → display label */
const TOOL_LABELS: Record<string, string> = {
  'coshh': 'COSHH Assessment',
  'itp': 'ITP',
  'manual-handling': 'Manual Handling RA',
  'dse': 'DSE Assessment',
  'tbt-generator': 'Toolbox Talk',
  'confined-spaces': 'Confined Space RA',
  'incident-report': 'Incident Report',
  'lift-plan': 'Lift Plan',
  'emergency-response': 'Emergency Response',
  'quality-checklist': 'Quality Checklist',
  'scope-of-works': 'Scope of Works',
  'permit-to-dig': 'Permit to Dig',
  'powra': 'POWRA',
  'early-warning': 'Early Warning',
  'ncr': 'NCR',
  'ce-notification': 'CE Notification',
  'programme-checker': 'Programme Checker',
  'cdm-checker': 'CDM Compliance',
  'noise-assessment': 'Noise Assessment',
  'quote-generator': 'Quotation',
  'safety-alert': 'Safety Alert',
  'carbon-footprint': 'Carbon Footprint',
  'rams-review': 'RAMS Review',
  'delay-notification': 'Delay Notification',
  'variation-confirmation': 'Variation Confirmation',
  'rfi-generator': 'RFI',
  'payment-application': 'Payment Application',
  'daywork-sheet': 'Daywork Sheet',
  'carbon-reduction-plan': 'Carbon Reduction Plan',
  'wah-assessment': 'Working at Height RA',
  'wbv-assessment': 'WBV Assessment',
  'riddor-report': 'RIDDOR Report',
  'traffic-management': 'Traffic Management',
  'waste-management': 'Waste Management',
  'invasive-species': 'Invasive Species RA',
};

function getDisplayName(gen: Generation): string {
  if (gen.source === 'RAMS') return gen.formatName || 'RAMS';
  if (gen.toolSlug && TOOL_LABELS[gen.toolSlug]) return TOOL_LABELS[gen.toolSlug];
  if (gen.toolSlug) {
    return gen.toolSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return gen.formatName || 'Document';
}

function getBuilderRoute(gen: Generation): string {
  if (gen.source === 'RAMS') return `/rams-builder?regenerate=${gen.id}`;
  if (gen.toolSlug) return `/${gen.toolSlug}-builder`;
  return '/';
}

export default function DocumentHistory({ generations }: DocumentHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'PROCESSING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'QUEUED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'FAILED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'EXPIRED':
        return 'bg-gray-50 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  if (generations.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">
          No documents generated yet.{' '}
          <Link href="/rams-builder" className="text-[#1B5745] font-medium hover:text-[#143f33]">
            Start building a RAMS
          </Link>{' '}
          or try one of our{' '}
          <Link href="/pricing" className="text-[#1B5745] font-medium hover:text-[#143f33]">
            35 AI document tools
          </Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Document</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Source</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
            <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Date</th>
            <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {generations.map((gen) => (
            <tr key={`${gen.source}-${gen.id}`} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-3 px-3 font-medium text-gray-900">
                {getDisplayName(gen)}
                <span className="md:hidden ml-2 text-[10px] font-semibold text-gray-400 uppercase">
                  {gen.source === 'RAMS' ? 'RAMS' : 'AI'}
                </span>
              </td>
              <td className="py-3 px-3 hidden md:table-cell">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${
                    gen.source === 'RAMS'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {gen.source === 'RAMS' ? 'RAMS Builder' : 'AI Tool'}
                </span>
              </td>
              <td className="py-3 px-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusStyles(gen.status)}`}>
                  {gen.status.charAt(0).toUpperCase() + gen.status.slice(1).toLowerCase()}
                </span>
                {gen.isExpired && gen.status.toUpperCase() === 'COMPLETED' && (
                  <span className="ml-1.5 text-xs text-gray-400">(Expired)</span>
                )}
              </td>
              <td className="py-3 px-3 text-gray-500 hidden sm:table-cell">{formatDate(gen.createdAt)}</td>
              <td className="py-3 px-3 text-right">
                {gen.status.toUpperCase() === 'COMPLETED' && !gen.isExpired && gen.fileUrl && (
                  <a
                    href={gen.fileUrl}
                    download
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1B5745] text-white text-xs font-semibold rounded-md hover:bg-[#143f33] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download
                  </a>
                )}
                {gen.status.toUpperCase() === 'FAILED' && (
                  <Link
                    href={getBuilderRoute(gen)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Retry
                  </Link>
                )}
                {gen.isExpired && gen.status.toUpperCase() === 'COMPLETED' && (
                  <span className="text-xs text-gray-400">Expired</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
