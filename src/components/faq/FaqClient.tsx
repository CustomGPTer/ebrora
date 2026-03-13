'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FAQ_DATA } from '@/data/faq';
import type { FAQSection } from '@/data/faq';

export default function FaqClient() {
    const [openId, setOpenId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredSections, setFilteredSections] = useState<FAQSection[]>(FAQ_DATA);

  // Handle hash on page load
  useEffect(() => {
        const hash = window.location.hash.slice(1);
        if (hash) {
                setOpenId(hash);
                setTimeout(() => {
                          const el = document.getElementById(hash);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
        }
  }, []);

  // Filter FAQs based on search
  useEffect(() => {
        if (!searchQuery.trim()) {
                setFilteredSections(FAQ_DATA);
                return;
        }
        const q = searchQuery.toLowerCase();
        const filtered = FAQ_DATA.map((section) => ({
                ...section,
                items: section.items.filter(
                          (item) =>
                                      item.question.toLowerCase().includes(q) ||
                                      item.answer.toLowerCase().includes(q),
                        ),
        })).filter((section) => section.items.length > 0);

                setFilteredSections(filtered);
  }, [searchQuery]);

  const toggleFaq = (id: string) => {
        setOpenId(openId === id ? null : id);
  };

  const clearSearch = () => {
        setSearchQuery('');
  };

  const hasResults = filteredSections.some((s) => s.items.length > 0);

  return (
        <>
          {/* Search */}
              <div className="faq-search">
                      <span className="faq-search__icon">{'\u{1F50D}'}</span>span>
                      <input
                                  type="text"
                                  id="faqSearchInput"
                                  placeholder="Search FAQs... e.g. macros, refund, Mac"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  autoComplete="off"
                                  aria-label="Search frequently asked questions"
                                />
              </div>div>
        
          {/* No Results */}
          {!hasResults && searchQuery && (
                  <div className="no-results visible" id="faqNoResults">
                            <div className="no-results__icon">{'\u{1F50D}'}</div>div>
                            <h3 className="no-results__title">No matching questions found</h3>h3>
                            <p className="no-results__text">
                                        Try a different search term, or browse the sections below.
                            </p>p>
                            <button className="btn btn--outline" onClick={clearSearch}>
                                        Clear Search
                            </button>button>
                  </div>div>
              )}
        
          {/* FAQ Sections */}
          {filteredSections.map((section) => (
                  <div
                              key={section.id}
                              className="faq-section"
                              data-faq-section={section.id}
                              role="region"
                              aria-label={`${section.title} questions`}
                            >
                            <h2 className="faq-section__heading">{section.title}</h2>h2>
                    {section.items.map((item) => {
                                          const isOpen = openId === item.id;
                                          return (
                                                          <div
                                                                            key={item.id}
                                                                            id={item.id}
                                                                            className={`faq-item${isOpen ? ' open' : ''}`}
                                                                            data-faq=""
                                                                          >
                                                                          <button
                                                                                              className="faq-item__question"
                                                                                              onClick={() => toggleFaq(item.id)}
                                                                                              aria-expanded={isOpen}
                                                                                            >
                                                                            {item.question}
                                                                                            <span className="faq-item__arrow">{'\u25BC'}</span>span>
                                                                          </button>button>
                                                                          <div className="faq-item__answer">
                                                                                            <p dangerouslySetInnerHTML={{ __html: item.answer }} />
                                                                          </div>div>
                                                          </div>div>
                                                        );
                            })}
                  </div>div>
                ))}
        
          {/* CTA */}
              <div className="faq-cta">
                      <h2>Can&apos;t Find What You&apos;re Looking For?</h2>h2>
                      <p>
                                Our team is happy to help with any questions about our templates,
                                purchasing, or custom services.
                      </p>p>
                      <Link href="/#contact" className="btn btn--primary btn--large">
                                Get in Touch &rarr;
                      </Link>Link>
              </div>div>
        </>>
      );
}</>
