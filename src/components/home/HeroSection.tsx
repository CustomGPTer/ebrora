'use client';

import { useState } from 'react';
import { useSearch } from '@/contexts/SearchContext';
import type { Product } from '@/lib/types';

const COMPLIANCE_KEYWORDS: Record<string, string> = {
  'CDM 2015': 'inspection',
  'LOLER': 'LOLER',
  'PUWER': 'PUWER',
  'BS Standards': 'BS 5975',
  'UK HSE Compliant': 'HSE',
};

interface HeroSectionProps {
  products: Product[];
}

export default function HeroSection({ products }: HeroSectionProps) {
  const { setSearchTerm } = useSearch();
  const [searchInput, setSearchInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  const getSearchResults = (query: string): Product[] => {
    const q = query.toLowerCase();
    return products.filter((p) => {
      const searchable = (
        p.title + ' ' + p.desc + ' ' + p.badge + ' ' + (p.category || []).join(' ')
      ).toLowerCase();
      return searchable.includes(q);
    });
  };

  const handleSearchInput = (value: string) => {
    setSearchInput(value);
    setSearchTerm(value);

    if (value.trim().length >= 3) {
      const results = getSearchResults(value.trim());
      setSuggestions(results.slice(0, 6));
      setShowDropdown(true);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSearchSubmit = () => {
    setShowDropdown(false);
    setSearchTerm(searchInput);
    setTimeout(() => {
      const grid = document.getElementById('productsGrid');
      if (grid) {
        const navHeight = document.getElementById('nav')?.offsetHeight || 0;
        const gridTop = grid.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
        window.scrollTo({ top: gridTop, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSuggestionClick = (product: Product) => {
    setSearchInput(product.title);
    setSearchTerm(product.title);
    setShowDropdown(false);
    setTimeout(() => {
      const card = document.querySelector(`[data-product-id="${product.id}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (card as HTMLElement).style.boxShadow = '0 0 0 3px var(--color-primary)';
        setTimeout(() => {
          (card as HTMLElement).style.boxShadow = '';
        }, 2000);
      }
    }, 100);
  };

  const handleComplianceBadgeClick = (badge: string) => {
    const keyword = COMPLIANCE_KEYWORDS[badge] || badge;
    setSearchInput(keyword);
    setSearchTerm(keyword);
    setShowDropdown(false);
    setTimeout(() => {
      const grid = document.getElementById('productsGrid');
      if (grid) {
        const navHeight = document.getElementById('nav')?.offsetHeight || 0;
        const gridTop = grid.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
        window.scrollTo({ top: gridTop, behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <section className="hero">
      <div className="container">
        <span className="hero__badge">Construction &amp; Civil Engineering</span>
        <h1>Professional Excel <span>Templates</span> Built by Industry Experts</h1>

        <div className="hero__compliance">
          {Object.keys(COMPLIANCE_KEYWORDS).map((badge) => (
            <button
              key={badge}
              type="button"
              className="hero__compliance-badge"
              onClick={() => handleComplianceBadgeClick(badge)}
              style={{
                cursor: 'pointer',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                lineHeight: 'inherit',
                letterSpacing: 'inherit',
                textTransform: 'inherit',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              {badge}
            </button>
          ))}
        </div>

        <p className="hero__subtitle">
          Save hours every week with ready-to-use spreadsheets designed for UK site managers, civil
          engineers, and project teams working to CDM 2015 and British Standards. Instant download,
          no signup required.
        </p>

        <div className="hero__search" id="heroSearch">
          <span className="hero__search-icon">🔍</span>
          <input
            type="text"
            id="searchInput"
            placeholder="Search templates… e.g. Gantt chart, inspection, COSHH"
            autoComplete="off"
            aria-label="Search templates"
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => {
              if (searchInput.trim().length >= 3) {
                const results = getSearchResults(searchInput.trim());
                setSuggestions(results.slice(0, 6));
                setShowDropdown(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => setShowDropdown(false), 200);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowDropdown(false);
              }
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchSubmit();
              }
            }}
          />
          <button type="button" id="searchBtn" onClick={handleSearchSubmit}>
            Search
          </button>

          {showDropdown && (
            <div
              className={`search-dropdown${suggestions.length > 0 ? ' visible' : ''}`}
              role="listbox"
              aria-label="Search suggestions"
            >
              {suggestions.length === 0 ? (
                <div className="search-dropdown__empty">No templates found</div>
              ) : (
                <>
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      className="search-dropdown__item"
                      role="option"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSuggestionClick(product);
                      }}
                    >
                      <span className="search-dropdown__icon">{product.icon || ''}</span>
                      <span className="search-dropdown__info">
                        <span className="search-dropdown__title">{product.title}</span>
                        <span className="search-dropdown__badge">{product.badge}</span>
                      </span>
                      <span className="search-dropdown__price">{product.price}</span>
                    </button>
                  ))}
                  {getSearchResults(searchInput.trim()).length > 6 && (
                    <div className="search-dropdown__more">
                      + {getSearchResults(searchInput.trim()).length - 6} more — press Search to see
                      all
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* UPDATE PRICE AS NEEDED */}
        <p className="hero__price">Templates from £9.99</p>
        <a href="#products" className="hero__browse">
          Browse all templates ↓
        </a>
      </div>
    </section>
  );
}
