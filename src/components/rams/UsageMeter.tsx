'use client';

export interface UsageMeterProps {
  used: number;
  limit: number;
  tier: string;
}

export function UsageMeter({ used, limit, tier }: UsageMeterProps) {
  const percentage = Math.min((used / limit) * 100, 100);
  const isAtLimit = used >= limit;
  const isWarning = percentage >= 50 && percentage < 80;
  const isCritical = percentage >= 80;

  let barClass = 'usage-meter__bar-fill--green';
  if (isCritical) {
    barClass = 'usage-meter__bar-fill--red';
  } else if (isWarning) {
    barClass = 'usage-meter__bar-fill--amber';
  }

  return (
    <div className="usage-meter">
      <div className="usage-meter__header">
        <span className="usage-meter__text">
          {used} of {limit} RAMS used this month
        </span>
        {isAtLimit && (
          <span className="usage-meter__limit-badge">Limit Reached</span>
        )}
      </div>

      <div className="usage-meter__bar">
        <div
          className={`usage-meter__bar-fill ${barClass}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
        />
      </div>

      {isAtLimit && tier !== 'unlimited' && (
        <div className="usage-meter__upgrade">
          <p className="usage-meter__upgrade-text">
            You've reached your monthly limit. Upgrade to continue generating RAMS.
          </p>
          <a href="/rams-builder#pricing" className="usage-meter__upgrade-button">
            View Plans
          </a>
        </div>
      )}
    </div>
  );
}
