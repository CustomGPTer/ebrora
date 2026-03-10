'use client';

import type { RamsFormatInfo } from '@/data/rams-formats';

interface FormatCardProps {
  format: RamsFormatInfo;
  isSelected: boolean;
  isLocked: boolean;
  onSelect: (slug: string) => void;
}

export default function FormatCard({
  format,
  isSelected,
  isLocked,
  onSelect,
}: FormatCardProps) {
  return (
    <button
      onClick={() => onSelect(format.slug)}
      className={`format-card${isSelected ? ' format-card--selected' : ''}${
        isLocked ? ' format-card--locked' : ''
      }`}
      aria-pressed={isSelected}
    >
      {format.isFree && <span className="format-card__free-badge">FREE</span>}

      <div className="format-card__content">
        <h3 className="format-card__title">{format.name}</h3>
        <p className="format-card__scoring-type">{format.scoringType}</p>
        <p className="format-card__description">{format.description}</p>
      </div>

      {isLocked && (
        <div className="format-card__lock-overlay">
          <svg
            className="format-card__lock-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
      )}
    </button>
  );
}
