'use client';

export interface UpgradePromptProps {
  currentTier: string;
  feature?: string;
  compact?: boolean;
}

const TIER_FEATURES: Record<string, string[]> = {
  free: ['1 Format', '5 RAMS/month', 'Basic Support'],
  pro: ['5 Formats', '50 RAMS/month', 'Email Support', 'Custom Branding'],
  unlimited: ['10 Formats', 'Unlimited RAMS', 'Priority Support', 'API Access'],
};

export function UpgradePrompt({
  currentTier,
  feature,
  compact = false,
}: UpgradePromptProps) {
  const currentFeatures = TIER_FEATURES[currentTier] || TIER_FEATURES.free;
  const recommendedTier = currentTier === 'free' ? 'pro' : 'unlimited';
  const recommendedFeatures = TIER_FEATURES[recommendedTier] || TIER_FEATURES.unlimited;

  if (compact) {
    return (
      <div className="upgrade-prompt upgrade-prompt--compact">
        <div className="upgrade-prompt__body">
          {feature ? (
            <p className="upgrade-prompt__message">
              <strong>{feature}</strong> is only available in upgraded plans.
            </p>
          ) : (
            <p className="upgrade-prompt__message">
              Upgrade to unlock more features and higher limits.
            </p>
          )}
        </div>
        <a href="/rams-builder#pricing" className="upgrade-prompt__cta">
          Upgrade Now
        </a>
      </div>
    );
  }

  return (
    <div className="upgrade-prompt">
      <div className="upgrade-prompt__header">
        <h3 className="upgrade-prompt__title">Unlock More Power</h3>
        <p className="upgrade-prompt__subtitle">
          Upgrade your plan to access premium features
        </p>
      </div>

      <div className="upgrade-prompt__comparison">
        <div className="upgrade-prompt__tier-column">
          <h4 className="upgrade-prompt__tier-name">Your Plan: {currentTier}</h4>
          <ul className="upgrade-prompt__features">
            {currentFeatures.map((feat, idx) => (
              <li key={idx} className="upgrade-prompt__feature upgrade-prompt__feature--current">
                ✓ {feat}
              </li>
            ))}
          </ul>
        </div>

        <div className="upgrade-prompt__tier-column upgrade-prompt__tier-column--recommended">
          <h4 className="upgrade-prompt__tier-name upgrade-prompt__tier-name--recommended">
            Recommended: {recommendedTier}
          </h4>
          <ul className="upgrade-prompt__features">
            {recommendedFeatures.map((feat, idx) => (
              <li key={idx} className="upgrade-prompt__feature upgrade-prompt__feature--new">
                ✓ {feat}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="upgrade-prompt__footer">
        <a href="/rams-builder#pricing" className="upgrade-prompt__cta">
          View All Plans
        </a>
      </div>
    </div>
  );
}
