import { Metadata } from 'next';
import FaqClient from '@/components/faq/FaqClient';
import { FAQ_DATA } from '@/data/faq';

export const metadata: Metadata = {
  title: 'FAQ — Ebrora | Frequently Asked Questions About Our Excel Templates',
  description:
    "Answers to common questions about Ebrora's UK construction Excel templates. Covers compatibility, purchasing, macros, CDM 2015, refunds, and custom template services.",
  openGraph: {
    title: 'FAQ — Ebrora | Excel Template Questions Answered',
    description:
      'Common questions about our Excel templates for UK construction and civil engineering professionals. Compatibility, purchasing, macros, and custom services.',
    images: [
      {
        url: 'https://ebrora.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ebrora FAQ'
      }
    ],
    url: 'https://ebrora.com/faq',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ — Ebrora | Excel Template Questions Answered',
    description:
      'Common questions about our Excel templates for UK construction and civil engineering professionals.',
    images: ['https://ebrora.com/og-image.jpg']
  }
};

function generateFaqSchema() {
  const faqEntries = FAQ_DATA.flatMap(section =>
    section.items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntries
  };
}

export default function FAQPage() {
  const faqSchema = generateFaqSchema();

  return (
    <>
      {/* Schema.org FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions about our Excel templates</p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="section">
        <div className="container">
          <FaqClient />
        </div>
      </section>
    </>
  );
}
