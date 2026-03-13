'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GeneratedQuestion, AnsweredQuestion, TemplateSlug } from '@/lib/rams/types';
import { TEMPLATE_CONFIGS } from '@/lib/rams/template-config';

interface QuestionnaireClientProps {
  questions: GeneratedQuestion[];
  onComplete: (answers: AnsweredQuestion[]) => void;
  onBack: () => void;
  templateSlug: TemplateSlug;
}

const QUESTIONS_PER_PAGE = 5;
const MAX_WORDS_PER_ANSWER = 45;

export default function QuestionnaireClient({ questions, onComplete, onBack, templateSlug }: QuestionnaireClientProps) {
  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    questions.forEach(q => { init[q.number] = ''; });
    return init;
  });
  const [currentPage, setCurrentPage] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const pageQuestions = questions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE
  );

  const config = TEMPLATE_CONFIGS[templateSlug];

  // Word count helper
  const getWordCount = (text: string): number => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  // Check if current page answers are valid
  const isCurrentPageValid = pageQuestions.every(q => {
    const answer = answers[q.number]?.trim();
    if (!answer) return false;
    return getWordCount(answer) <= MAX_WORDS_PER_ANSWER;
  });

  // Check if all answers are valid (for final submit)
  const allAnswersValid = questions.every(q => {
    const answer = answers[q.number]?.trim();
    return answer && getWordCount(answer) <= MAX_WORDS_PER_ANSWER;
  });

  const handleAnswerChange = useCallback((questionNumber: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionNumber]: value }));
  }, []);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
      scrollToTop();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      scrollToTop();
    }
  };

  const handleSubmit = () => {
    if (!allAnswersValid) return;
    const answeredQuestions: AnsweredQuestion[] = questions.map(q => ({
      number: q.number,
      question: q.question,
      answer: answers[q.number].trim(),
    }));
    onComplete(answeredQuestions);
  };

  const isLastPage = currentPage === totalPages - 1;

  return (
    <div className="questionnaire" ref={topRef}>
      <div className="questionnaire-header">
        <button className="rams-back-btn" onClick={currentPage === 0 ? onBack : handlePrev}>
          ← {currentPage === 0 ? 'Back to Description' : 'Previous Questions'}
        </button>
        <div className="questionnaire-info">
          <h2>Answer These Questions</h2>
          <p>Your answers will be used to generate a professional {config.displayName} RAMS document. Be as specific as possible — the quality of your RAMS depends on the detail you provide.</p>
        </div>
      </div>

      {/* Page indicator */}
      <div className="questionnaire-page-indicator">
        <span>Questions {currentPage * QUESTIONS_PER_PAGE + 1}–{Math.min((currentPage + 1) * QUESTIONS_PER_PAGE, questions.length)} of {questions.length}</span>
        <div className="questionnaire-page-dots">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`questionnaire-dot ${i === currentPage ? 'active' : ''} ${
                // Check if page is complete
                questions.slice(i * QUESTIONS_PER_PAGE, (i + 1) * QUESTIONS_PER_PAGE).every(q => answers[q.number]?.trim())
                  ? 'completed' : ''
              }`}
              onClick={() => { setCurrentPage(i); scrollToTop(); }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Questions */}
      <div className="questionnaire-questions">
        {pageQuestions.map(q => {
          const wordCount = getWordCount(answers[q.number] || '');
          const isOverLimit = wordCount > MAX_WORDS_PER_ANSWER;
          const isNearLimit = wordCount >= 35;

          return (
            <div key={q.number} className="questionnaire-item">
              <label className="questionnaire-label">
                <span className="questionnaire-number">{q.number}</span>
                <span className="questionnaire-question-text">{q.question}</span>
              </label>
              {q.context && (
                <p className="questionnaire-context">{q.context}</p>
              )}
              <div className="questionnaire-input-wrap">
                <textarea
                  value={answers[q.number] || ''}
                  onChange={e => handleAnswerChange(q.number, e.target.value)}
                  placeholder="Type your answer here..."
                  rows={3}
                  className={isOverLimit ? 'over-limit' : ''}
                />
                <div className={`questionnaire-counter ${isOverLimit ? 'over-limit' : isNearLimit ? 'near-limit' : ''}`}>
                  {wordCount} / {MAX_WORDS_PER_ANSWER} words
                </div>
              </div>
              {isOverLimit && (
                <p className="questionnaire-warning">Please keep your answer under {MAX_WORDS_PER_ANSWER} words.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="questionnaire-nav">
        <button
          className="rams-secondary-btn"
          onClick={handlePrev}
          disabled={currentPage === 0}
        >
          ← Previous
        </button>

        {isLastPage ? (
          <button
            className="rams-primary-btn"
            onClick={handleSubmit}
            disabled={!allAnswersValid}
          >
            Generate My RAMS →
          </button>
        ) : (
          <button
            className="rams-primary-btn"
            onClick={handleNext}
            disabled={!isCurrentPageValid}
          >
            Next Questions →
          </button>
        )}
      </div>
    </div>
  );
}
