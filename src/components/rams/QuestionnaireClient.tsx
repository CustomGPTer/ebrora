'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FormatCard from '@/components/rams/FormatCard';
import WordCounter from '@/components/rams/WordCounter';
import { RAMS_FORMATS } from '@/data/rams-formats';

interface QuestionnaireClientProps {
  userId: string;
  userTier: 'FREE' | 'STANDARD' | 'PREMIUM';
}

interface Question {
  id: string;
  number: number;
  label: string;
  type: 'TEXT' | 'DROPDOWN';
  section: 'PROJECT_DETAILS' | 'ACTIVITY_ENVIRONMENT' | 'CONTROLS_PPE' | 'METHOD_LOGISTICS';
  options?: string[];
  maxWords?: number;
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    number: 1,
    label: 'Activity or task?',
    type: 'TEXT',
    section: 'PROJECT_DETAILS',
    maxWords: 50,
  },
  {
    id: 'q2',
    number: 2,
    label: 'Activity category',
    type: 'DROPDOWN',
    section: 'ACTIVITY_ENVIRONMENT',
    options: [
      'Excavation',
      'Working at Height',
      'Confined Space',
      'Hot Works',
      'Lifting Operations',
      'General Construction',
      'Demolition',
      'M&E Installation',
      'Concrete Works',
      'Piling',
    ],
  },
  {
    id: 'q3',
    number: 3,
    label: 'Site name and address?',
    type: 'TEXT',
    section: 'PROJECT_DETAILS',
    maxWords: 50,
  },
  {
    id: 'q4',
    number: 4,
    label: 'Principal contractor?',
    type: 'TEXT',
    section: 'PROJECT_DETAILS',
    maxWords: 50,
  },
  {
    id: 'q5',
    number: 5,
    label: 'Supervisor / foreman?',
    type: 'TEXT',
    section: 'PROJECT_DETAILS',
    maxWords: 50,
  },
  {
    id: 'q6',
    number: 6,
    label: 'Risk level',
    type: 'DROPDOWN',
    section: 'ACTIVITY_ENVIRONMENT',
    options: ['High', 'Medium', 'Low'],
  },
  {
    id: 'q7',
    number: 7,
    label: 'Location and environment?',
    type: 'TEXT',
    section: 'ACTIVITY_ENVIRONMENT',
    maxWords: 50,
  },
  {
    id: 'q8',
    number: 8,
    label: 'Plant and equipment?',
    type: 'TEXT',
    section: 'ACTIVITY_ENVIRONMENT',
    maxWords: 50,
  },
  {
    id: 'q9',
    number: 9,
    label: 'Materials or substances?',
    type: 'TEXT',
    section: 'ACTIVITY_ENVIRONMENT',
    maxWords: 50,
  },
  {
    id: 'q10',
    number: 10,
    label: 'Sequence of works?',
    type: 'TEXT',
    section: 'METHOD_LOGISTICS',
    maxWords: 50,
  },
  {
    id: 'q11',
    number: 11,
    label: 'Permits required?',
    type: 'DROPDOWN',
    section: 'CONTROLS_PPE',
    options: ['Yes', 'No', 'Not Sure'],
  },
  {
    id: 'q12',
    number: 12,
    label: 'Existing controls?',
    type: 'TEXT',
    section: 'CONTROLS_PPE',
    maxWords: 50,
  },
  {
    id: 'q13',
    number: 13,
    label: 'Interfaces with others?',
    type: 'TEXT',
    section: 'METHOD_LOGISTICS',
    maxWords: 50,
  },
  {
    id: 'q14',
    number: 14,
    label: 'PPE required?',
    type: 'TEXT',
    section: 'CONTROLS_PPE',
    maxWords: 50,
  },
  {
    id: 'q15',
    number: 15,
    label: 'Training / competency?',
    type: 'TEXT',
    section: 'CONTROLS_PPE',
    maxWords: 50,
  },
  {
    id: 'q16',
    number: 16,
    label: 'Constraints / access?',
    type: 'TEXT',
    section: 'METHOD_LOGISTICS',
    maxWords: 50,
  },
  {
    id: 'q17',
    number: 17,
    label: 'Emergency procedures?',
    type: 'TEXT',
    section: 'CONTROLS_PPE',
    maxWords: 50,
  },
  {
    id: 'q18',
    number: 18,
    label: 'Duration',
    type: 'DROPDOWN',
    section: 'METHOD_LOGISTICS',
    options: ['Less than 1 day', '1–5 days', '1–4 weeks', 'More than 4 weeks'],
  },
  {
    id: 'q19',
    number: 19,
    label: 'Max operatives',
    type: 'DROPDOWN',
    section: 'METHOD_LOGISTICS',
    options: ['1–2', '3–5', '6–10', 'More than 10'],
  },
  {
    id: 'q20',
    number: 20,
    label: 'Additional info?',
    type: 'TEXT',
    section: 'METHOD_LOGISTICS',
    maxWords: 50,
  },
];

const SECTION_ORDER = [
  'PROJECT_DETAILS',
  'ACTIVITY_ENVIRONMENT',
  'CONTROLS_PPE',
  'METHOD_LOGISTICS',
] as const;

const SECTION_TITLES: Record<string, string> = {
  PROJECT_DETAILS: 'Project Details',
  ACTIVITY_ENVIRONMENT: 'Activity & Environment',
  CONTROLS_PPE: 'Controls & PPE',
  METHOD_LOGISTICS: 'Method & Logistics',
};

export default function QuestionnaireClient({
  userId,
  userTier,
}: QuestionnaireClientProps) {
  const router = useRouter();
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [useSavedDetails, setUseSavedDetails] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLockedMessage, setShowLockedMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>('PROJECT_DETAILS');

  // Track window size for mobile/desktop view
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Count answered questions
  const answeredCount = Object.values(answers).filter((a) => a.trim().length > 0).length;
  const totalQuestions = QUESTIONS.length;

  const handleFormatSelect = (slug: string) => {
    const format = RAMS_FORMATS.find((f) => f.slug === slug);
    if (!format) return;

    const isLocked = !format.isFree && userTier === 'FREE';
    if (isLocked) {
      setShowLockedMessage(slug);
      return;
    }

    setSelectedFormat(slug);
    setShowLockedMessage(null);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    const question = QUESTIONS.find((q) => q.id === questionId);
    if (question?.type === 'TEXT' && question?.maxWords) {
      const words = value
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);
      if (words.length > question.maxWords) return;
    }
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handlePreview = () => setShowPreview(!showPreview);

  const handleSubmit = async () => {
    if (!selectedFormat) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/rams/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formatSlug: selectedFormat, answers }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to generate RAMS'}`);
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();
      router.push(`/rams-builder/generating/${data.generationId}`);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit. Please try again.');
      setIsSubmitting(false);
    }
  };

  const selectedFormatObj = RAMS_FORMATS.find((f) => f.slug === selectedFormat);

  // Group questions by section
  const groupedQuestions = QUESTIONS.reduce(
    (acc, question) => {
      if (!acc[question.section]) acc[question.section] = [];
      acc[question.section].push(question);
      return acc;
    },
    {} as Record<string, Question[]>
  );

  // Render a question field
  const renderQuestion = (question: Question) => (
    <div key={question.id} className="questionnaire__field">
      <label htmlFor={question.id} className="questionnaire__label">
        {question.number}. {question.label}
      </label>
      {question.type === 'DROPDOWN' ? (
        <select
          id={question.id}
          value={answers[question.id] || ''}
          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          className="questionnaire__select"
        >
          <option value="">Select an option</option>
          {question.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <>
          <textarea
            id={question.id}
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="questionnaire__textarea"
            placeholder={`Enter answer (max ${question.maxWords} words)`}
            rows={3}
          />
          <WordCounter text={answers[question.id] || ''} maxWords={question.maxWords || 50} />
        </>
      )}
    </div>
  );

  return (
    <main className="questionnaire">
      {/* Format Selection */}
      <section className="questionnaire__format-section">
        <h1 className="questionnaire__title">Select RAMS Format</h1>
        <p className="questionnaire__subtitle">
          Choose the format that best suits your project needs
        </p>

        <div className="format-grid">
          {RAMS_FORMATS.map((format) => (
            <FormatCard
              key={format.slug}
              format={format}
              isSelected={selectedFormat === format.slug}
              isLocked={!format.isFree && userTier === 'FREE'}
              onSelect={handleFormatSelect}
            />
          ))}
        </div>

        {showLockedMessage && (
          <div className="polite-message polite-message--info">
            <p>
              This format is available on the Standard plan.{' '}
              <a href="/rams-builder#pricing" className="polite-message__link">
                Upgrade to access all 10 formats
              </a>
            </p>
          </div>
        )}

        {!selectedFormat && !showLockedMessage && (
          <div className="polite-message polite-message--info">
            <p>Please select a format above to continue.</p>
          </div>
        )}
      </section>

      {selectedFormat && !showPreview && (
        <>
          {/* Progress Bar */}
          <section className="questionnaire__progress-section">
            <div className="questionnaire__progress">
              <p className="questionnaire__progress-text">
                {answeredCount} of {totalQuestions} answered
              </p>
              <div className="questionnaire__progress-bar-container">
                <div
                  className="questionnaire__progress-bar"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                />
              </div>
            </div>
          </section>

          {/* Use Saved Details Toggle */}
          <section className="questionnaire__toggle-section">
            <label className="questionnaire__toggle-label">
              <input
                type="checkbox"
                checked={useSavedDetails}
                onChange={(e) => setUseSavedDetails(e.target.checked)}
                className="questionnaire__toggle-input"
              />
              <span className="questionnaire__toggle-text">
                Use saved details (company name, address, supervisor, principal contractor)
              </span>
            </label>
          </section>

          {/* Questionnaire Form */}
          <section className="questionnaire__form-section">
            {isMobile ? (
              /* Mobile: Accordion */
              <div className="questionnaire__accordion">
                {SECTION_ORDER.map((section) => {
                  const questions = groupedQuestions[section] || [];
                  return (
                    <div key={section} className="questionnaire__accordion-item">
                      <button
                        className={`questionnaire__accordion-button${
                          openAccordion === section ? ' active' : ''
                        }`}
                        onClick={() =>
                          setOpenAccordion(openAccordion === section ? null : section)
                        }
                        aria-expanded={openAccordion === section}
                      >
                        <span>{SECTION_TITLES[section]}</span>
                        <span className="questionnaire__accordion-icon">
                          {openAccordion === section ? '−' : '+'}
                        </span>
                      </button>
                      {openAccordion === section && (
                        <div className="questionnaire__accordion-content">
                          {questions.map(renderQuestion)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Desktop: All sections open */
              <div className="questionnaire__sections">
                {SECTION_ORDER.map((section) => {
                  const questions = groupedQuestions[section] || [];
                  return (
                    <div key={section} className="questionnaire__section">
                      <h2 className="questionnaire__section-title">
                        {SECTION_TITLES[section]}
                      </h2>
                      {questions.map(renderQuestion)}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Action Buttons */}
          <section className="questionnaire__actions-section">
            <div className="questionnaire__actions">
              <button
                onClick={handlePreview}
                className="btn btn--outline"
                disabled={answeredCount === 0}
              >
                Preview Answers
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn--primary btn--large"
                disabled={!selectedFormat || answeredCount === 0 || isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? 'Building RAMS...' : 'Build RAMS'}
              </button>
            </div>
          </section>
        </>
      )}

      {/* Preview Mode */}
      {showPreview && selectedFormatObj && (
        <section className="questionnaire__preview-section">
          <div className="questionnaire__preview">
            <h2 className="questionnaire__preview-title">Preview Your RAMS</h2>

            <div className="questionnaire__preview-format">
              <h3 className="questionnaire__preview-format-name">{selectedFormatObj.name}</h3>
              <p className="questionnaire__preview-format-type">
                {selectedFormatObj.scoringType}
              </p>
            </div>

            <div className="questionnaire__preview-answers">
              {QUESTIONS.map((question) => (
                <div key={question.id} className="questionnaire__preview-item">
                  <h4 className="questionnaire__preview-question">
                    Q{question.number}: {question.label}
                  </h4>
                  <p className="questionnaire__preview-answer">
                    {answers[question.id] || '(Not answered)'}
                  </p>
                </div>
              ))}
            </div>

            <div className="questionnaire__preview-actions">
              <button onClick={handlePreview} className="btn btn--outline">
                Edit Answers
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn--primary btn--large"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? 'Building RAMS...' : 'Confirm & Build'}
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
