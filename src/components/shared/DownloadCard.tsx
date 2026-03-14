// src/components/shared/DownloadCard.tsx
"use client";

interface DownloadCardProps {
  title: string;
  description?: string;
  fileSize?: number;
  isFree: boolean;
  isLocked: boolean;
  downloadUrl?: string;
  onDownload?: () => void;
  onUnlock?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function DownloadCard({
  title,
  description,
  fileSize,
  isFree,
  isLocked,
  downloadUrl,
  onDownload,
  onUnlock,
}: DownloadCardProps) {
  const handleClick = () => {
    if (isLocked && onUnlock) {
      onUnlock();
    } else if (onDownload) {
      onDownload();
    }
  };

  return (
    <div className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#1B5745]/30 hover:shadow-md transition-all duration-200">
      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-xl">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700">Sign up to download</p>
          <p className="text-xs text-gray-500 mt-0.5">Free with email</p>
          <button
            onClick={handleClick}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B5745] text-white text-xs font-semibold rounded-lg hover:bg-[#164a3b] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Unlock with Email
          </button>
        </div>
      )}

      <div className="p-5">
        {/* File type icon and badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
            </svg>
          </div>
          {isFree && !isLocked && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1B5745] bg-[#1B5745]/8 px-2 py-0.5 rounded-full">
              Free
            </span>
          )}
        </div>

        {/* Title and description */}
        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#1B5745] transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        {/* Footer with file size and download button */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          {fileSize ? (
            <span className="text-xs text-gray-400">
              PDF &middot; {formatFileSize(fileSize)}
            </span>
          ) : (
            <span className="text-xs text-gray-400">PDF</span>
          )}

          {!isLocked && (
            <button
              onClick={handleClick}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B5745] hover:text-[#143f33] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
