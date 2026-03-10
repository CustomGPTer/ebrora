'use client';

import { useState, useEffect } from 'react';

interface TooltipStep {
  id: number;
  title: string;
  description: string;
  highlightSelector: string;
}

const TOOLTIP_STEPS: TooltipStep[] = [
  {
    id: 1,
    title: 'Choose Your Format',
    description: 'Select from 10 professional RAMS formats designed for different industries and risk types.',
    highlightSelector: '[data-onboarding="format-grid"]',
  },
  {
    id: 2,
    title: 'Answer the Questions',
    description: 'Fill in the guided questionnaire with your project details. Takes just 5-10 minutes.',
    highlightSelector: '[data-onboarding="questionnaire"]',
  },
  {
    id: 3,
    title: 'Click Build RAMS',
    description: 'Hit the button to generate your professional RAMS document instantly.',
    highlightSelector: '[data-onboarding="submit-button"]',
  },
];

const ONBOARDING_STORAGE_KEY = 'ebrora_onboarding_dismissed';

export function OnboardingTooltips() {
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!isDismissed) {
      setCurrentStep(1);
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep && currentStep < TOOLTIP_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    handleDismiss();
  };

  const handleDismiss = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setIsVisible(false);
    setCurrentStep(null);
  };

  if (!isVisible || currentStep === null) {
    return null;
  }

  const step = TOOLTIP_STEPS[currentStep - 1];
  if (!step) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div className="onboarding__overlay" onClick={handleDismiss} />

      {/* Tooltip */}
      <div className="onboarding__tooltip">
        <div className="onboarding__step">
          <div className="onboarding__step-header">
            <h3 className="onboarding__step-title">{step.title}</h3>
            <button
              className="onboarding__close"
              onClick={handleDismiss}
              aria-label="Close onboarding"
            >
              ✕
            </button>
          </div>

          <p className="onboarding__step-description">{step.description}</p>

          <div className="onboarding__step-counter">
            Step {currentStep} of {TOOLTIP_STEPS.length}
          </div>

          <div className="onboarding__actions">
            <button
              className="onboarding__button onboarding__button--secondary"
              onClick={handleSkip}
            >
              Skip
            </button>
            {currentStep < TOOLTIP_STEPS.length ? (
              <button
                className="onboarding__button onboarding__button--primary"
                onClick={handleNext}
              >
                Next
              </button>
            ) : (
              <button
                className="onboarding__button onboarding__button--primary"
                onClick={handleDismiss}
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
