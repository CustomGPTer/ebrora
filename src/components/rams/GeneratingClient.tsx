'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TemplateSlug } from '@/lib/rams/types';
import { TEMPLATE_CONFIGS } from '@/lib/rams/template-config';

// ---------------------------------------------------------------------------
// Unified GeneratingClient
// Mode 1 (Inline): pass `phase` + `templateSlug` — visual-only loading animation
// Mode 2 (Standalone): pass `generationId` — polls /api/rams/status/[id], redirects on COMPLETED
// ---------------------------------------------------------------------------

interface InlineProps {
  phase: 'questions' | 'document';
  templateSlug: TemplateSlug;
  generationId?: undefined;
  formatName?: undefined;
  status?: undefined;
}

interface StandaloneProps {
  generationId: string;
  formatName: string;
  status: string;
  phase?: undefined;
  templateSlug?: undefined;
}

type GeneratingClientProps = InlineProps | StandaloneProps;

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

const STANDALONE_STEPS = [
  'Analysing your answers...',
  'Identifying hazards & controls...',
  'Building risk assessments...',
  'Generating method statement...',
  'Formatting document...',
];

export default function GeneratingClient(props: GeneratingClientProps) {
  const isInline = props.phase !== undefined;

  if (isInline) {
    return <InlineGenerating phase={props.phase} templateSlug={props.templateSlug} />;
  }

  return (
    <StandaloneGenerating
      generationId={props.generationId}
      formatName={props.formatName}
      status={props.status}
    />
  );
}

// ---------------------------------------------------------------------------
// Inline mode — visual-only loading with stepped messages
// ---------------------------------------------------------------------------
function InlineGenerating({ phase, templateSlug }: { phase: 'questions' | 'document'; templateSlug: TemplateSlug }) {
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

// ---------------------------------------------------------------------------
// Standalone mode — polls API, redirects on completion
// ---------------------------------------------------------------------------
function StandaloneGenerating({
  generationId,
  formatName,
  status,
}: {
  generationId: string;
  formatName: string;
  status: string;
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const steps = STANDALONE_STEPS;

  useEffect(() => {
    // Step animation timer
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 3000);

    // Poll status
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/rams/status/${generationId}`);
        if (!response.ok) throw new Error('Failed to fetch status');

        const data = await response.json();

        if (data.status === 'COMPLETED') {
          router.push(`/rams-builder/download/${generationId}`);
        } else if (data.status === 'FAILED') {
          setError(data.error || 'Generation failed. Please try again.');
        }
      } catch (err) {
        console.error('Error polling status:', err);
        setError('Connection error. Please check your internet connection.');
      }
    };

    // If already completed on page load, redirect immediately
    if (status === 'COMPLETED') {
      router.push(`/rams-builder/download/${generationId}`);
      return () => clearInterval(stepTimer);
    }

    // Poll every 3 seconds
    pollStatus();
    const pollInterval = setInterval(pollStatus, 3000);

    return () => {
      clearInterval(stepTimer);
      clearInterval(pollInterval);
    };
  }, [generationId, router, status, steps.length]);

  if (error) {
    return (
      <div className="generating">
        <div className="generating-content">
          <div className="generating-spinner">
            <div className="generating-spinner-logo" style={{ color: '#C93C3C' }}>!</div>
          </div>
          <h2>Generation Failed</h2>
          <p className="generating-note" style={{ color: '#C93C3C' }}>{error}</p>
          <a href="/rams-builder" className="rams-primary-btn" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
            Try Again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="generating">
      <div className="generating-content">
        {/* Animated spinner */}
        <div className="generating-spinner">
          <div className="generating-spinner-ring" />
          <div className="generating-spinner-logo">E</div>
        </div>

        <h2>Building Your RAMS</h2>
        <p className="generating-template">{formatName}</p>

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

        <p className="generating-note">
          This may take up to a minute. Please keep this page open.
        </p>
      </div>
    </div>
  );
}
