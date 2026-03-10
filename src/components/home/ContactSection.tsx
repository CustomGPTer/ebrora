'use client';

import { useState } from 'react';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="section" id="contact">
      <div className="container">
        <div className="contact-grid">
          {/* Contact Info */}
          <div className="contact__info">
            <h2>Get in Touch</h2>
            <p>
              Have a question, suggestion, or need a custom template? We&apos;d love to hear from
              you.
            </p>

            <div className="contact__item">
              <div className="contact__item-icon">✉️</div>
              <div className="contact__item-text">
                <strong>Email</strong>
                <a href="mailto:hello@ebrora.com">hello@ebrora.com</a>
              </div>
            </div>

            <div className="contact__item">
              <div className="contact__item-icon">⏰</div>
              <div className="contact__item-text">
                <strong>Response Time</strong>
                <span>Usually within 24 hours</span>
              </div>
            </div>

            <div className="contact__item">
              <div className="contact__item-icon">📍</div>
              <div className="contact__item-text">
                <strong>Based in</strong>
                <span>United Kingdom</span>
              </div>
            </div>

            <div className="social-links">
              <a
                href="https://www.linkedin.com/in/ebrora/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://x.com/EbroraSheets"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="X (Twitter)"
                title="X (Twitter)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/channel/UCQy-rQ3Ye1kIPpT19A1c0lg"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="YouTube"
                title="YouTube"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <form className="contact__form" id="contactForm" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="contactName">Name</label>
              <input
                type="text"
                id="contactName"
                name="name"
                placeholder="Your full name"
                required
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="contactEmail">Email</label>
              <input
                type="email"
                id="contactEmail"
                name="email"
                placeholder="you@example.com"
                required
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="contactSubject">Subject</label>
              <select
                id="contactSubject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleInputChange}
              >
                <option value="" disabled>
                  Select a subject
                </option>
                <option value="general">General Enquiry</option>
                <option value="support">Template Support</option>
                <option value="custom">Custom Template Request</option>
                <option value="feedback">Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="contactMessage">Message</label>
              <textarea
                id="contactMessage"
                name="message"
                placeholder="How can we help?"
                required
                value={formData.message}
                onChange={handleInputChange}
              />
            </div>
            <button
              type="submit"
              className="btn btn--primary btn--large"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending…' : 'Send Message'}
            </button>

            {submitStatus === 'success' && (
              <p style={{ marginTop: '1rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                Thank you! We&apos;ll get back to you within 24 hours.
              </p>
            )}
            {submitStatus === 'error' && (
              <p style={{ marginTop: '1rem', color: '#c62828', fontWeight: 500 }}>
                Something went wrong. Please email us directly at hello@ebrora.com.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
