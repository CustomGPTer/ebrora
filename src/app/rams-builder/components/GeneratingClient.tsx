'use client';

import { useState, useEffect } from 'react';
import { TemplateSlug } from '@/lib/rams/types';
import { TEMPLATE_CONFIGS } from '@/lib/rams/template-config';

interface GeneratingClientProps {
  phase: 'questions' | 'document';
  templateSlug: TemplateSlug;
}

const QUESTION_STEPS = [
  'Analysing your work description...',
  'Identifying key safety considerations...',
  'Tailoring questions to your template...',
  'Generating 20 targeted questions...',
];

const DOCUMENT_STEPS = [
  'Analysing your responses...',
  'Identifying hazards and risks...',
  'Generating control measures...',
  'Writing sequence of works...',
  'Building risk assessment table...',
  'Compiling method statement sections...',
  'Assembling your RAMS document...',
  'Formatting and finalising...',
];

export default function GeneratingClient({ phase, templateSlug }: GeneratingClientProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = phase === 'questions' ? QUESTION_STEPS : DOCUMENT_STEPS;
  const config = TEMPLATE_CONFIGS[templateSlug];

  useEffect(() => {
    const interval = phase === 'questions' ? 800 : 2000;
    const timer = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, interval);
    return () => clearInterval(timer);
  }, [phase, steps.length]);

  return (
    <div className="generating">
      <div className="generating-content">
        {/* Animated spinner */}
        <div className="generating-spinner">
          <div className="generating-spinner-ring" />
          <div className="generating-spinner-logo">E</div>
        </div>

        <h2>
          {phase === 'questions'
            ? 'Preparing Your Questions'
            : 'Building Your RAMS'
          }
        </h2>

        <p className="generating-template">
          {config.displayName} • {config.pageCount} pages
        </p>

        {/* Progress steps */}
        <div className="generating-steps">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`generating-step ${idx < currentStep ? 'completed' : idx === currentStep ? 'active' : 'pending'}`}
            >
              <div className="generating-step-icon">
                {idx < currentStep ? '✓' : idx === currentStep ? '•' : '○'}
              </div>
              <span>{step}</span>
            </div>
          ))}
        </div>

        {phase === 'document' && (
          <p className="generating-note">
            This usually takes 10–20 seconds depending on template complexity.
            Please don&apos;t close this page.
          </p>
        )}
      </div>
    </div>
  );
}
