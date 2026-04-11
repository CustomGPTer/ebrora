'use client';

import Image from 'next/image';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { BlogPost, BlogCategory } from '@/data/posts';

interface BlogListingClientProps {
  posts: BlogPost[];
  categories: Record<string, BlogCategory>;
}

export default function BlogListingClient({ posts, categories }: BlogListingClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter posts based on selected category and search query
  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        const matchesCategory = !selectedCategory || post.category === selectedCategory;
        const matchesSearch =
          !searchQuery ||
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [posts, selectedCategory, searchQuery]);

  // Format date to "1 March 2026" format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <main>
      {/* Page Header */}
      <div className="page-header">
        <h1>Ebrora Blog</h1>
        <p>Practical guides, safety insights, and tools for construction professionals</p>
      </div>

      {/* Blog Filter */}
      <div className="blog-filter">
        <div className="blog-filter__inner">
          <button
            className={`blog-filter__btn ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            All Articles
          </button>
          {Object.entries(categories).map(([key, category]) => (
            <button
              key={key}
              className={`blog-filter__btn ${selectedCategory === key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(key)}
            >
              <span>{category.icon}</span> {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Search */}
      <div className="blog-search">
        <div className="blog-search__icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M19 19L14.65 14.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="blog-search__input"
        />
      </div>

      {/* Article Grid */}
      {filteredPosts.length > 0 ? (
        <div className="article-grid">
          {filteredPosts.map((post) => {
            const category = categories[post.category];
            return (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="article-card"
              >
                <div className="article-card__image">
                  <Image
                    src={`/${post.featuredImage}`}
                    alt={post.title}
                    width={600}
                    height={400}
                                      />
                  <span className="article-card__category">
                    {category.icon} {category.label}
                  </span>
                </div>
                <div className="article-card__body">
                  <h3 className="article-card__title">{post.title}</h3>
                  <p className="article-card__date">{formatDate(post.date)}</p>
                  <p className="article-card__excerpt">{post.excerpt}</p>
                  <span className="article-card__read-more">Read More →</span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="no-results">
          <p>No articles found matching your search. Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-container">
          <h2>Get Construction Tips in Your Inbox</h2>
          <p>Subscribe to our monthly newsletter for site management tips, safety guides, and tools for construction teams.</p>
          <form className="newsletter-form">
            <input
              type="email"
              placeholder="Enter your email"
              required
              className="newsletter-form__input"
            />
            <button type="submit" className="newsletter-form__button">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
