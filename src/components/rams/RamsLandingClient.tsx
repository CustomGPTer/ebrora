'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RAMS_FORMATS } from '@/data/rams-formats';
import { RAMS_TESTIMONIALS } from '@/data/rams-testimonials';

const QUESTIONS = [
  { number: 1, label: 'Activity or task?', group: 'Project Details' },
  { number: 2, label: 'Activity category', grhhoup: 'Activity & Environment' },
  { number: 3, label: 'Site name and address?', group: 'Project Details' },
  { number: 4, label: 'Principal contractor?', group: 'Project Details' },
  { number: 5, label: 'Supervisor / foreman?', group: 'Project Details' },
  { number: 6, label: 'Risk level', group: 'Activity & Environment' },
  { number: 7, label: 'Location and environment?', group: 'Activity & Environment' },
  { number: 8, label: 'Plant and equipment?', group: 'Activity & Environment' },
  { number: 9, label: 'Materials or substances?', group: 'Activity & Environment' },
  { number: 10, label: 'Sequence of works?', group: 'Method & Logistics' },
  { number: 11, label: 'Permits required?', group: 'Controls & PPE' },
  { number: 12, label: 'Existing controls?', group: 'Controls & PPE' },
  { number: 13, label: 'Interfaces with others?', group: 'Method & Logistics' },
  { number: 14, label: 'PPE required?', group: 'Controls & PPE' },
  { number: 15, label: 'Training / competency?', group: 'Controls & PPE' },
  { number: 16, label: 'Constraints / access?', group: 'Method & Logistics' },
  { number: 17, label: 'Emergency procedures?', group: 'Controls & PPE' },
  { number: 18, label: 'Duration', group: 'Method & Logistics' },
  { number: 19, label: 'Max operatives', group: 'Method & Logistics' },
  { number: 20, label: 'Additional info?', group: 'Method & Logistics' },
];

export default function RamsLandingClient() {
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % RAMS_TESTIMONIALS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentTestimonial = RAMS_TESTIMONIALS[currentTestimonialIndex];

  // Pricing data
  const pricing: {
    monthly: Record<string, { price: string; cta: string; badgePrice?: string; badgeText?: string }>;
    yearly: Record<string, { price: string; cta: string; badgePrice?: string; badgeText?: string }>;
  } = {
    monthly: {
      free: { price: '£0', cta: 'Get Started Free' },
      standard: { price: '£9.99', cta: 'Start Standard' },
      professional: { price: '£19.99', cta: 'Start Professional' },
    },
    yearly: {
      free: { price: '£0', cta: 'Get Started Free' },
      standard: { price: '£95.90', badgePrice: '£7.99/mo', badgeText: 'Save 20%', cta: 'Start Standard' },
      professional: { price: '£191.90', badgePrice: '£15.99/mo', badgeText: 'Save 20%', cta: 'Start Professional' },
    },
  };

  const currentPricing = billingPeriod === 'monthly' ? pricing.monthly : pricing.yearly;
  const billingText = billingPeriod === 'monthly' ? '/mo' : '/yr';

  return (
    <main className="rams-landing">
      {/* A) Hero Section */}
      <section className="rams-hero">
        <div className="container">
          <div className="hero-badge">RAMS Builder</div>
          <h1 className="hero-title">Professional RAMS Documents in Minutes</h1>
          <p className="hero-subtitle">
            Generate compliant, site-specific Risk Assessments and Method Statements. Answer 20 simple questions, choose
            your format, and download a ready-to-use Word document.
          </p>

          <div className="hero-ctas">
            <Link href="/rams-builder" className="btn btn--primary btn--large">
              Build Your First RAMS — Free
            </Link>
            <a href="#pricing" className="btn btn--outline btn--large">
              See Pricing
            </a>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <div className="stat-value">10 Industry Formats</div>
              <div className="stat-label">Tailored to UK construction standards</div>
            </div>
            <div className="stat">
              <div className="stat-value">CDM 2015 Compliant</div>
              <div className="stat-label">Built to meet current regulations</div>
            </div>
            <div className="stat">
              <div className="stat-value">Ready in Under 5 Minutes</div>
              <div className="stat-label">Instant download, straight to site</div>
            </div>
          </div>
        </div>
      </section>

      {/* B) Demo Video Placeholder */}
      <section className="demo-video-section">
        <div className="container">
          <h2 className="section-title">See the RAMS Builder in Action</h2>
          <div className="video-placeholder">
            <div className="play-button">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="40" cy="40" r="40" fill="white" />
                <path d="M32 25L32 55L58 40L32 25Z" fill="#000" />
              </svg>
            </div>
            <p className="video-coming-soon">Video coming soon</p>
          </div>
        </div>
      </section>

      {/* C) Format Selection Grid */}
      <section className="format-selection">
        <div className="container">
          <h2 className="section-title">Choose Your Format</h2>
          <p className="section-subtitle">10 industry-standard formats covering every type of construction activity</p>

          <div className="format-grid">
            {RAMS_FORMATS.map((format) => (
              <div key={format.id} className="format-card">
                {format.isFree && <div className="format-badge">FREE</div>}
                <h3 className="format-name">{format.name}</h3>
                <p className="format-scoring">{format.scoringType}</p>
                <p className="format-description">{format.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* D) Greyed-out Questionnaire Preview */}
      <section className="questionnaire-preview-section">
        <div className="container">
          <h2 className="section-title">Answer 20 Simple Questions</h2>
          <p className="section-subtitle">Tell us about your activity and we'll generate a complete, site-specific RAMS document.</p>

          <div className="questionnaire-preview-wrapper">
            <div className="questionnaire-preview">
              {/* Organize questions by group */}
              {['Project Details', 'Activity & Environment', 'Controls & PPE', 'Method & Logistics'].map((group) => (
                <div key={group} className="question-group">
                  <h4 className="group-title">{group}</h4>
                  <div className="question-fields">
                    {QUESTIONS.filter((q) => q.group === group).map((question) => (
                      <div key={question.number} className="question-field">
                        <label>Q{question.number}: {question.label}</label>
                        <input type="text" disabled placeholder="Answer will appear here" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Overlay */}
            <div className="questionnaire-overlay">
              <div className="overlay-content">
                <p className="overlay-text">Create a free account to get started</p>
                <Link href="/auth/register" className="btn btn--primary">
                  Sign Up Free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* E) Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <h2 className="section-title">What Construction Professionals Say</h2>

          <div className="testimonial-carousel">
            <div className="testimonial-card">
              <p className="testimonial-quote">"{currentTestimonial.quote}"</p>
              <div className="testimonial-author">
                <div className="author-info">
                  <p className="author-name">{currentTestimonial.author}</p>
                  <p className="author-title">
                    {currentTestimonial.role}, {currentTestimonial.company}
                  </p>
                </div>
              </div>
            </div>

            <div className="testimonial-dots">
              {RAMS_TESTIMONIALS.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentTestimonialIndex ? 'active' : ''}`}
                  onClick={() => setCurrentTestimonialIndex(index)}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* F) Pricing Section */}
      <section className="pricing-section" id="pricing">
        <div className="container">
          <h2 className="section-title">Simple, Transparent Pricing</h2>

          {/* Billing Toggle */}
          <div className="pricing-toggle">
            <button
              className={`toggle-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </button>
            <button
              className={`toggle-btn ${billingPeriod === 'yearly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              Yearly
            </button>
          </div>

          {/* Pricing Cards */}
          <div className="pricing-grid">
            {/* FREE Card */}
            <div className="pricing-card pricing-card--free">
              <div className="card-header">
                <h3 className="card-title">Free</h3>
                <div className="card-price">
                  <span className="price">{currentPricing.free.price}</span>
                </div>
              </div>

              <ul className="features-list">
                <li>1 RAMS per month</li>
                <li>2 basic formats (Standard 5×5, H/M/L Simple)</li>
                <li>No company logo</li>
                <li>Standard generation</li>
              </ul>

              <Link href="/auth/register" className="btn btn--outline btn--block">
                {currentPricing.free.cta}
              </Link>
            </div>

            {/* STANDARD Card (Most Popular) */}
            <div className="pricing-card pricing-card--standard pricing-card--featured">
              <div className="popular-badge">Most Popular</div>

              <div className="card-header">
                <h3 className="card-title">Standard</h3>
                <div className="card-price">
                  <span className="price">
                    {currentPricing.standard.price}
                  </span>
                  <span className="billing-period">{billingText}</span>
                  {billingPeriod === 'yearly' && currentPricing.standard.badgePrice && (
                    <span className="monthly-equiv">({currentPricing.standard.badgePrice})</span>
                  )}
                </div>
                {billingPeriod === 'yearly' && currentPricing.standard.badgeText && (
                  <span className="save-badge">{currentPricing.standard.badgeText}</span>
                )}
              </div>

              <ul className="features-list">
                <li>10 RAMS per month</li>
                <li>All 10 formats</li>
                <li>Company logo on documents</li>
                <li>Priority generation</li>
                <li>14-day money-back guarantee</li>
              </ul>

              <Link href="/auth/register" className="btn btn--primary btn--block">
                {currentPricing.standard.cta}
              </Link>
            </div>

            {/* PROFESSIONAL Card */}
            <div className="pricing-card pricing-card--professional">
              <div className="card-header">
                <h3 className="card-title">Professional</h3>
                <div className="card-price">
                  <span className="price">
                    {currentPricing.professional.price}
                  </span>
                  <span className="billing-period">{billingText}</span>
                  {billingPeriod === 'yearly' && currentPricing.professional.badgePrice && (
                    <span className="monthly-equiv">({currentPricing.professional.badgePrice})</span>
                  )}
                </div>
                {billingPeriod === 'yearly' && currentPricing.professional.badgeText && (
                  <span className="save-badge">{currentPricing.professional.badgeText}</span>
                )}
              </div>

              <ul className="features-list">
                <li>25 RAMS per month</li>
                <li>All 10 formats</li>
                <li>Company logo on documents</li>
                <li>Priority generation</li>
                <li>14-day money-back guarantee</li>
                <li>Email support</li>
              </ul>

              <Link href="/auth/register" className="btn btn--primary btn--block">
                {currentPricing.professional.cta}
              </Link>
            </div>
          </div>

          {/* Pricing Note */}
          <div className="pricing-note">
            <p>
              <strong>Need just one?</strong> Pay £2.99 per RAMS — no subscription required.
            </p>
          </div>

          {/* 14-day Guarantee */}
          <div className="guarantee-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm-2 15l-5-5 1.41-1.41L10 13.17l7.59-7.59L19 7l-9 9z"
                fill="currentColor"
              />
            </svg>
            <p>14-day money-back guarantee on all paid plans</p>
          </div>
        </div>
      </section>

      {/* G) How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>

          <div className="steps-grid">
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M24 14V24M24 24L32 32M24 24L16 32"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="step-title">Choose Your Format</h3>
              <p className="step-description">Select from 10 industry-standard RAMS formats</p>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="6" width="36" height="36" rx="2" stroke="currentColor" strokeWidth="2" />
                  <line x1="6" y1="16" x2="42" y2="16" stroke="currentColor" strokeWidth="2" />
                  <line x1="12" y1="24" x2="36" y2="24" stroke="currentColor" strokeWidth="2" />
                  <line x1="12" y1="32" x2="36" y2="32" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="step-title">Answer 20 Questions</h3>
              <p className="step-description">Tell us about your activity, site, and requirements</p>
            </div>

            {/* Step 3 */}
            <div className="step-card">
              <div className="step-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8 24L20 36L40 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="step-title">Download Your RAMS</h3>
              <p className="step-description">Get a professional Word document ready for site use</p>
            </div>
          </div>
        </div>
      </section>

      {/* H) Final CTA Section */}
      <section className="final-cta">
        <div className="container">
          <h2 className="cta-title">Ready to Build Your First RAMS?</h2>
          <div className="cta-buttons">
            <Link href="/auth/register" className="btn btn--primary btn--large">
              Get Started Free
            </Link>
            <Link href="#formats" className="btn btn--outline btn--large">
              See All Formats
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
