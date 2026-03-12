'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BlogPost, BlogCategory } from '@/data/posts';
import { Product } from '@/lib/types';

interface BlogPostClientProps {
  post: BlogPost;
  category: BlogCategory;
  relatedProducts: (Product | undefined)[];
  relatedPosts: BlogPost[];
}

export default function BlogPostClient({
  post,
  category,
  relatedProducts,
  relatedPosts,
}: BlogPostClientProps) {
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);

  // Format date to "1 March 2026" format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Handle copy link
  const handleCopyLink = () => {
    const url = `https://ebrora.com/blog/${post.id}`;
    navigator.clipboard.writeText(url);
    setCopyLinkSuccess(true);
    setTimeout(() => setCopyLinkSuccess(false), 2000);
  };

  // Handle share to LinkedIn
  const handleShareLinkedIn = () => {
    const url = `https://ebrora.com/blog/${post.id}`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  };

  // Handle share to X (Twitter)
  const handleShareX = () => {
    const url = `https://ebrora.com/blog/${post.id}`;
    const text = `${post.title} - ${post.excerpt.slice(0, 50)}...`;
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(xUrl, '_blank', 'width=600,height=400');
  };

  return (
    <main className="blog-post">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/blog">Blog</Link>
        <span>/</span>
        <span>{post.title}</span>
      </nav>

      {/* Article Header */}
      <header className="blog-post__header">
        <div className="blog-post__meta">
          <span className="blog-post__category">{category.icon} {category.label}</span>
          <span className="blog-post__date">{formatDate(post.date)}</span>
          <span className="blog-post__author">By {post.author}</span>
        </div>
        <h1 className="blog-post__title">{post.title}</h1>
      </header>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="blog-post__featured-image">
          <img src={`/${post.featuredImage}`} alt={post.title} />
        </div>
      )}

      <div className="blog-post__container">
        {/* Main Content */}
        <div className="blog-post__main">
          {/* Article Content */}
          <div
            className="blog-post__content"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Share Buttons */}
          <div className="blog-post__share">
            <span className="blog-post__share-label">Share this article:</span>
            <div className="blog-post__share-buttons">
              <button
                onClick={handleCopyLink}
                className="blog-post__share-button blog-post__share-button--link"
                title="Copy link"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M10.5 6.5H6.5C5.39543 6.5 4.5 7.39543 4.5 8.5V14.5C4.5 15.6046 5.39543 16.5 6.5 16.5H12.5C13.6046 16.5 14.5 15.6046 14.5 14.5V10.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.5 3.5H11.5M15.5 3.5L15.5 7.5M15.5 3.5L9 10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {copyLinkSuccess ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={handleShareLinkedIn}
                className="blog-post__share-button blog-post__share-button--linkedin"
                title="Share on LinkedIn"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 0H2C0.9 0 0 0.9 0 2V18C0 19.1 0.9 20 2 20H18C19.1 20 20 19.1 20 18V2C20 0.9 19.1 0 18 0ZM6 17H3V8H6V17ZM4.5 6.5C3.5 6.5 2.7 5.7 2.7 4.7C2.7 3.7 3.5 2.9 4.5 2.9C5.5 2.9 6.3 3.7 6.3 4.7C6.3 5.7 5.5 6.5 4.5 6.5ZM17 17H14V11.7C14 10.8 13.3 10.1 12.4 10.1C11.5 10.1 10.8 10.8 10.8 11.7V17H7.8V8H10.8V9C11.3 8.3 12.2 7.8 13.2 7.8C15.3 7.8 17 9.5 17 11.6V17Z" />
                </svg>
                LinkedIn
              </button>
              <button
                onClick={handleShareX}
                className="blog-post__share-button blog-post__share-button--x"
                title="Share on X"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.8 7.4L18.6 0H16.9L10.9 6.4L6 0H0.6L7.7 11.1L0.6 20H2.3L8.5 13.3L13.4 20H18.8L11.8 7.4ZM3 2H5.4L16.9 18H14.5L3 2Z" />
                </svg>
                X
              </button>
            </div>
          </div>

          {/* Back to Blog Link */}
          <div className="blog-post__back">
            <Link href="/blog" className="blog-post__back-link">
              ← Back to Blog
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="blog-post__sidebar">
          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="blog-post__related-products">
              <h3>Related Products</h3>
              <div className="blog-post__related-products-list">
                {relatedProducts.map(
                  (product) =>
                    product && (
                      <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        className="blog-post__related-product-card"
                      >
                        {product.images[0] && (
                          <img
                            src={`/${product.images[0]}`}
                            alt={product.title}
                            className="blog-post__related-product-image"
                          />
                        )}
                        <h4 className="blog-post__related-product-name">
                          {product.title}
                        </h4>
                        <p className="blog-post__related-product-price">
                          {product.price !== '£0' ? product.price : 'Free'}
                        </p>
                      </Link>
                    )
                )}
              </div>
            </section>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="blog-post__related-posts">
              <h3>Related Articles</h3>
              <div className="blog-post__related-posts-list">
                {relatedPosts.map((relatedPost) => {
                  const relatedCategory = relatedPost.category;
                  return (
                    <Link
                      key={relatedPost.id}
                      href={`/blog/${relatedPost.id}`}
                      className="blog-post__related-post-card"
                    >
                      <h4 className="blog-post__related-post-title">
                        {relatedPost.title}
                      </h4>
                      <p className="blog-post__related-post-date">
                        {formatDate(relatedPost.date)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </aside>
      </div>

      {/* Bottom CTA */}
      <section className="blog-post__cta">
        <div className="blog-post__cta-container">
          <h2>Build Better Sites with Our Templates</h2>
          <p>
            The templates and systems discussed in this article can save your team hours every week.
            Explore our full product range to find tools that match your workflow.
          </p>
          <Link href="/products" className="blog-post__cta-button">
            Explore Products
          </Link>
        </div>
      </section>
    </main>
  );
}
