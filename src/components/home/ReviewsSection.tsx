'use client';

import { useState } from 'react';
import type { Review } from '@/lib/types';

interface ReviewsSectionProps {
  reviews: Review[];
}

export default function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const [allReviewsVisible, setAllReviewsVisible] = useState(false);

  const displayedReviews = allReviewsVisible ? reviews : reviews.slice(0, 6);

  return (
    <section className="section" id="reviews">
      <div className="container">
        <div className="section__header">
          <h2>What Our Customers Say</h2>
        </div>
        <div className="reviews-grid" id="reviewsGrid">
          {displayedReviews.map((review, idx) => {
            const stars = '★'.repeat(review.stars);
            return (
              <div key={idx} className="review-card">
                <div className="review-card__stars">{stars}</div>
                <p className="review-card__text">&ldquo;{review.text}&rdquo;</p>
                <p className="review-card__author">{review.author}</p>
                <p className="review-card__role">{review.role}</p>
              </div>
            );
          })}
        </div>
        {reviews.length > 6 && (
          <div className="reviews__toggle">
            <button
              className="btn btn--outline"
              id="reviewsToggle"
              onClick={() => setAllReviewsVisible(!allReviewsVisible)}
            >
              {allReviewsVisible ? 'Show Fewer Reviews' : 'Show More Reviews'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
