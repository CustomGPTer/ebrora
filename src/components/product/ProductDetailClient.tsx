'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Product, Category } from '@/lib/types';

interface ProductDetailClientProps {
  product: Product;
  related: Product[];
  categories: Record<string, Category>;h
}

export default function ProductDetailClient({
  product,
  related,
  categories,
}: ProductDetailClientProps) {
  const [activeImage, setActiveImage] = useState(0);

  const hasImages = product.images && product.images.length > 0;
  const mainImage = hasImages ? product.images[activeImage] : '';

  const changeImage = (index: number) => {
    setActiveImage(index);
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <div className="container">
          <Link href="/">Home</Link>
          <span className="breadcrumb__separator">/</span>
          <Link href="/#products">Templates</Link>
          <span className="breadcrumb__separator">/</span>
          <span className="breadcrumb__current">{product.title}</span>
        </div>
      </div>

      {/* Product Detail */}
      <div className="product-detail">
        <div className="product-detail__grid">
          {/* Left Column — Gallery */}
          <div className="product-gallery">
            {/* Main Image */}
            <div className="product-gallery__main">
              {hasImages ? (
                <img
                  id="galleryMainImg"
                  src={`/${mainImage}`}
                  alt={product.title}
                />
              ) : (
                <>
                  <div className="product-gallery__placeholder">
                    {product.icon || '📊'}
                  </div>
                  <p
                    style={{
                      position: 'absolute',
                      bottom: '1rem',
                      left: 0,
                      right: 0,
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      color: '#888',
                    }}
                  >
                    Screenshots coming soon
                  </p>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {hasImages && product.images.length > 1 && (
              <div className="product-gallery__thumbs">
                {product.images.map((img, i) => (
                  <div
                    key={i}
                    className={`product-gallery__thumb${i === activeImage ? ' active' : ''}`}
                    onClick={() => changeImage(i)}
                  >
                    <img
                      src={`/${img}`}
                      alt={`Thumbnail ${i + 1}`}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* YouTube Embed */}
            {product.youtubeId && product.youtubeId.trim() !== '' && (
              <div className="product-gallery__video">
                <iframe
                  src={`https://www.youtube.com/embed/${product.youtubeId}`}
                  title={`${product.title} video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Right Column — Product Info */}
          <div>
            {/* Product Info */}
            <div className="product-info">
              {/* Category Badges */}
              <div className="product-info__badges">
                {product.category &&
                  product.category.map((slug) => {
                    const cat = categories[slug];
                    if (!cat) return null;
                    return (
                      <a key={slug} href="/#products" className="product-info__badge">
                        {cat.icon} {cat.label}
                      </a>
                    );
                  })}
                {product.new && (
                  <span className="product-info__badge product-info__badge--new">NEW</span>
                )}
              </div>

              {/* Title */}
              <h1 className="product-info__title">{product.title}</h1>

              {/* Stars */}
              <div className="product-info__stars">
                <span className="product-info__stars-icons">★★★★★</span>
                <span className="product-info__stars-count">4.9 out of 5</span>
              </div>

              {/* Price */}
              <div className="product-info__price-block">
                <div className="product-info__price">
                  {product.price}
                  {product.oldPrice && <span className="was"> {product.oldPrice}</span>}
                </div>
                <p className="product-info__vat">All prices include VAT where applicable</p>
              </div>

              {/* Buy Buttons */}
              <div className="product-info__btn-row">
                <a
                  href={product.buyLink}
                  target="_blank"
                  rel="noopener"
                  className="btn btn--primary btn--large"
                >
                  🛒 Buy Now — {product.price}
                </a>
                <a
                  href={product.pdfLink}
                  target="_blank"
                  rel="noopener"
                  className="btn btn--outline btn--large"
                >
                  📄 Download Free PDF
                </a>
              </div>

              {/* Gumroad Notice */}
              <p className="product-info__gumroad-notice">
                🔒 You&apos;ll be taken to Gumroad.com to complete your purchase securely. Your
                Excel file will be delivered instantly to your email after payment.
              </p>
            </div>

            {/* Meta Table */}
            <table className="product-meta-table">
              <tbody>
                <tr>
                  <td>Compatibility</td>
                  <td>{product.compatible || 'Windows & Mac'}</td>
                </tr>
                <tr>
                  <td>Version</td>
                  <td>{product.version || '1.0'}</td>
                </tr>
                <tr>
                  <td>File Size</td>
                  <td>{product.fileSize || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Last Updated</td>
                  <td>{product.lastUpdate || 'N/A'}</td>
                </tr>
                <tr>
                  <td>Delivery</td>
                  <td>Instant digital download via email</td>
                </tr>
                <tr>
                  <td>Licence</td>
                  <td>Single user, lifetime access</td>
                </tr>
              </tbody>
            </table>

            {/* Description */}
            <div className="product-description">
              <h2>Description</h2>
              {product.longDesc ? (
                <div dangerouslySetInnerHTML={{ __html: product.longDesc }} />
              ) : (
                <p>{product.desc}</p>
              )}
            </div>

            {/* Key Features */}
            {product.features && product.features.length > 0 && (
              <div className="product-features">
                <h2>Key Features</h2>
                <div className="product-features__grid">
                  {product.features.map((feature, i) => (
                    <div key={i} className="product-features__item">
                      ✓ {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bundle Section */}
            {product.isBundle &&
              product.bundleProducts &&
              product.bundleProducts.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h2>What&apos;s Included in This Bundle</h2>
                  <div style={{ marginTop: '1rem' }}>
                    {product.bundleProducts.map((bundledId) => (
                      <div
                        key={bundledId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.6rem 0',
                          borderBottom: '1px solid var(--color-border)',
                        }}
                      >
                        <span style={{ fontSize: '1.3rem' }}>📊</span>
                        <div>
                          <Link
                            href={`/${bundledId}`}
                            style={{
                              fontWeight: 600,
                              color: 'var(--color-primary-dark)',
                            }}
                          >
                            {bundledId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* CTA Bar */}
      <section className="product-cta-bar">
        <div className="container">
          <h2>Need a Custom Version?</h2>
          <p>
            We can adapt any template to match your company&apos;s branding, workflows, or
            reporting requirements.
          </p>
          <a href="/#contact" className="btn btn--accent btn--large">
            Get in Touch →
          </a>
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="related-products">
          <h2>You Might Also Like</h2>
          <div className="product-grid container">
            {related.map((p) => {
              const catLabel =
                p.category &&
                p.category.length > 0 &&
                categories[p.category[0]]
                  ? categories[p.category[0]].label
                  : '';
              const relHasImages = p.images && p.images.length > 0;
              const relMainImage = relHasImages ? p.images[0] : '';
              const relHoverImage =
                relHasImages && p.images.length > 1 ? p.images[1] : relMainImage;

              return (
                <a key={p.id} href={`/${p.id}`} className="product-card">
                  <div className="product-card__image-wrap">
                    {relHasImages ? (
                      <>
                        <img
                          src={`/${relMainImage}`}
                          alt={p.title}
                          className="main-img"
                          loading="lazy"
                        />
                        <img
                          src={`/${relHoverImage}`}
                          alt={`${p.title} preview`}
                          className="hover-img"
                          loading="lazy"
                        />
                      </>
                    ) : (
                      <div className="product-card__placeholder">{p.icon || '📊'}</div>
                    )}
                    {catLabel && <span className="product-card__category">{catLabel}</span>}
                    {p.new && <span className="product-card__ribbon">NEW</span>}
                  </div>
                  <div className="product-card__body">
                    <h3 className="product-card__title">{p.title}</h3>
                    <p className="product-card__desc">{p.desc}</p>
                    <div className="product-card__price-row">
                      <span className="product-card__price">
                        {p.price}
                        {p.oldPrice && <span className="was"> {p.oldPrice}</span>}
                      </span>
                    </div>
                    <div className="product-card__btn-row">
                      <span className="btn btn--outline">View Details</span>
                      <span className="btn btn--primary">Buy Now</span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
