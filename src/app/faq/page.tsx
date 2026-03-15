import { Metadata } from 'next';
import FaqClient from '@/components/faq/FaqClient';
import { FAQ_DATA } from '@/data/faq';

export const metadata: Metadata = {
  title: {
    absolute: 'Construction RAMS & Excel Template FAQs | Ebrora',
  },
  description:
    'Answers to common questions about Ebrora construction Excel templates. Covers compatibility, purchasing, macros, CDM 2015 compliance, refunds and custom services.',
  alternates: {
    canonical: 'https://ebrora.com/faq',
  },
  openGraph: {
    title: 'Construction RAMS & Excel Template FAQs | Ebrora',
    description:
      'Common questions about our Excel templates for UK construction and civil engineering. Compatibility, purchasing, macros and custom services.',
    images: [
      {
        url: 'https://ebrora.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ebrora FAQ – Construction Excel Templates',
      },
    ],
    url: 'https://ebrora.com/faq',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Construction RAMS & Excel Template FAQs | Ebrora',
    description: 'Common questions about our Excel templates for UK construction professionals.',
    images: ['https://ebrora.com/og-image.jpg'],
  },
};

function generateFaqSchema() {
  const faqEntries = FAQ_DATA.flatMap((section) =>
    section.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    }))
  );
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntries,
  };
}

export default function FAQPage() {
  const faqSchema = generateFaqSchema();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section className="page-header">
        <div className="container">
          <h1>Frequently Asked Questions</h1>
          <p>Find answers to common questions about our Excel templates</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <FaqClient />
        </div>
      </section>
    </>
  );
}
