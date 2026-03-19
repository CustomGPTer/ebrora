'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface GeneratingClientProps {
  generationId: string;
  formatName: string;
  status: string;
}

export default function GeneratingClient({
  generationId,
  formatName,
  status,
}: GeneratingClientProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    'Analysing your answers...',
    'Identifying hazards & controls...',
    'Building risk assessments...',
    'Generating method statement...',
    'Formatting document...',
  ];

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/rams/status/${generationId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }

        const data = await response.json();
        setCurrentStatus(data.status);

        if (data.status === 'COMPLETED') {
          router.push(`/rams-builder/download/${generationId}`);
        } else if (data.status === 'FAILED') {
          setError(data.error || 'Generation failed. Please try again.');
        } else {
          // Update step based on how far along we are
          const stepMap: { [key: string]: number } = {
            PENDING: 0,
            ANALYSING: 0,
            HAZARDS: 1,
            RISKS: 2,
            STATEMENT: 3,
            FORMATTING: 4,
          };
          setCurrentStep(stepMap[data.status] || 0);
        }
      } catch (err) {
        console.error('Error polling status:', err);
        setError('Connection error. Please check your internet connection.');
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollStatus, 3000);

    // Initial poll immediately
    pollStatus();

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [generationId, router]);

  if (error) {
    return (
      <div className="generating">
        <div className="generating__card">
          <div className="generating__title">Generation Failed</div>
          <div className="generating__message" style={{ color: '#C93C3C' }}>
            {error}
          </div>
          <a
            href="/rams-builder"
            className="btn btn--primary"
            style={{ marginTop: '2rem' }}
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="generating">
      <div className="generating__card">
        <div className="generating__spinner"></div>

        <div className="generating__title">Generating Your RAMS</div>
        <div className="generating__format">{formatName}</div>

        <div className="generating__progress">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`generating__step ${
                index < currentStep
                  ? 'generating__step--done'
                  : index === currentStep
                    ? 'generating__step--active'
                    : ''
              }`}
            >
              <div className="generating__step-number">
                {index < currentStep ? '✓' : index + 1}
              </div>
              <div className="generating__step-label">{step}</div>
            </div>
          ))}
        </div>

        <div className="generating__message">
          This may take a few minutes. Please keep this page open.
        </div>
      </div>
    </div>
  );
}
