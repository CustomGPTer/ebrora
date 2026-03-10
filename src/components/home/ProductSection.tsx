'use client';

import { useState, useMemo } from 'react';
import { useSearch } from '@/contexts/SearchContext';
import type { Product, Category } from '@/lib/types';

interface ProductSectionProps {
  products: Product[];
  categories: Record<string, Category>;
}

type SortOption = 'featured' | 'newest' | 'price-low' | 'price-high' | 'popular';

function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  const num = priceStr.replace(/[^0-9.]/g, '');
  return parseFloat(num) || 0;
}

function seededRandom(s: number): number {
  const x = Math.sin(s) * 10000;
  return x - Math.floor(x);
}

export default function ProductSection({ products, categories }: ProductSectionProps) {
  const { searchTerm } = useSearch();
  const [currentCategory, setCurrentCategory] = useState('all');
  const [currentSort, setCurrentSort] = useState<SortOption>('featured');
  const [visibleCount, setVisibleCount] = useState(8);

  // Featured products — rotated daily using time-based seed (matches original JS)
  const featuredProducts = useMemo(() => {
    const featured = products.filter((p) => p.featured);
    if (featured.length === 0) return [];

    const now = new Date();
    let seed =
      now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate() + now.getHours();

    // Fisher-Yates shuffle with seeded random
    const shuffled = [...featured];
    for (let i = shuffled.length - 1; i > 0; i--) {
      seed++;
      const j = Math.floor(seededRandom(seed) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, 4);
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Category filter
    if (currentCategory !== 'all') {
      filtered = filtered.filter(
        (p) => p.category && p.category.includes(currentCategory)
      );
    }

    // Search filter
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const searchable = (
          p.title + ' ' + p.desc + ' ' + p.badge + ' ' + (p.category || []).join(' ')
        ).toLowerCase();
        return searchable.includes(query);
      });
    }

    // Sort
    switch (currentSort) {
      case 'featured':
        filtered.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (b.popularity || 0) - (a.popularity || 0);
        });
        break;
      case 'newest':
        filtered.sort((a, b) => {
          if (a.new && !b.new) return -1;
          if (!a.new && b.new) return 1;
          return 0;
        });
        break;
      case 'price-low':
        filtered.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        break;
      case 'price-high':
        filtered.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
    }

    return filtered;
  }, [products, currentCategory, searchTerm, currentSort]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const remaining = filteredProducts.length - visibleCount;

  const handleCategoryClick = (slug: string) => {
    setCurrentCategory(slug);
    setVisibleCount(8);
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 8);
  };

  const handleClearFilters = () => {
    setCurrentCategory('all');
    setVisibleCount(8);
  };

  return (
    <>
      {/* Category Filter */}
      <div className="category-filter" id="products">
        <div className="container">
          <ul className="category-filter__inner" id="filterPills" role="list" aria-label="Filter templates by category">
            <li>
              <button
                className={`category-filter__btn${currentCategory === 'all' ? ' active' : ''}`}
                data-category="all"
                onClick={() => handleCategoryClick('all')}
              >
                All
              </button>
            </li>
            {Object.entries(categories).map(([slug, cat]) => {
              const count = products.filter(
                (p) => p.category && p.category.includes(slug)
              ).length;
              return (
                <li key={slug}>
                  <button
                    className={`category-filter__btn${currentCategory === slug ? ' active' : ''}`}
                    data-category={slug}
                    onClick={() => handleCategoryClick(slug)}
                  >
                    {cat.icon} {cat.label}
                    <span className="category-filter__count">({count})</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Featured Products */}
      {featuredProducts.length > 0 &&
        currentCategory === 'all' &&
        searchTerm.trim() === '' &&
        currentSort === 'featured' && (
          <section className="section" id="featuredSection">
            <div className="container">
              <div className="section__header">
                <h2>Featured Templates</h2>
              </div>
              <div className="product-grid" id="featuredGrid">
                {featuredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categories={categories}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

      {/* All Products */}
      <section className="section section--alt">
        <div className="container">
          <div className="section__header">
            <h2>
              All Templates{' '}
              <span id="productCount" className="section__count">
                ({filteredProducts.length})
              </span>
            </h2>
            <div className="sort-controls">
              <select
                id="sortSelect"
                className="category-filter__btn"
                aria-label="Sort products"
                value={currentSort}
                onChange={(e) => setCurrentSort(e.target.value as SortOption)}
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>

          <div className="product-grid" id="productsGrid">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categories={categories}
              />
            ))}
          </div>

          {remaining > 0 && (
            <div
              className="load-more-container"
              id="loadMoreContainer"
              style={{ textAlign: 'center', marginTop: '2rem' }}
            >
              <button
                className="btn btn--outline btn--large"
                id="loadMoreBtn"
                onClick={handleLoadMore}
              >
                View More Templates ({remaining} remaining)
              </button>
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div id="noResults" className="no-results visible">
              <div className="no-results__icon">🔍</div>
              <h3 className="no-results__title">No templates found</h3>
              <p className="no-results__text">
                Try adjusting your search or filter to find what you&apos;re looking for.
              </p>
              <button className="btn btn--outline" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/* ----------------------------------------------------------------- */
/* Product Card Component                                            */
/* ----------------------------------------------------------------- */

interface ProductCardProps {
  product: Product;
  categories: Record<string, Category>;
}

function ProductCard({ product, categories }: ProductCardProps) {
  const categoryLabel =
    product.category &&
    product.category.length > 0 &&
    categories[product.category[0]]
      ? categories[product.category[0]].label
      : '';

  const hasImages = product.images && product.images.length > 0;
  const mainImage = hasImages ? product.images[0] : '';
  const hoverImage = hasImages && product.images.length > 1 ? product.images[1] : mainImage;

  const handlePdfClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(product.pdfLink, '_blank');
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(product.buyLink, '_blank');
  };

  return (
    <a href={`/${product.id}`} className="product-card" data-product-id={product.id}>
      <div className="product-card__image-wrap">
        {hasImages ? (
          <>
            <img src={mainImage} alt={product.title} className="main-img" loading="lazy" />
            <img
              src={hoverImage}
              alt={`${product.title} preview`}
              className="hover-img"
              loading="lazy"
            />
          </>
        ) : (
          <div className="product-card__placeholder">{product.icon || '📊'}</div>
        )}
        {categoryLabel && <span className="product-card__category">{categoryLabel}</span>}
        {product.new && <span className="product-card__ribbon">NEW</span>}
      </div>
      <div className="product-card__body">
        <h3 className="product-card__title">{product.title}</h3>
        <p className="product-card__desc">{product.desc}</p>
        <div className="product-card__price-row">
          <span className="product-card__price">
            {product.price}{' '}
            {product.oldPrice && <span className="was">{product.oldPrice}</span>}
          </span>
        </div>
        <div className="product-card__btn-row">
          <span className="btn btn--outline" onClick={handlePdfClick}>
            Free PDF
          </span>
          <span className="btn btn--primary" onClick={handleBuyClick}>
            Buy Now
          </span>
        </div>
        <p
          style={{
            fontSize: '0.72rem',
            fontStyle: 'italic',
            color: '#888',
            marginTop: '0.5rem',
            marginBottom: '0',
          }}
        >
          🔒 Secure checkout via Gumroad
        </p>
      </div>
    </a>
  );
}
