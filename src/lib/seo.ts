import { SITE_CONFIG } from './constants';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  image?: string;
  author: string;
  publishedAt: Date | string;
  updatedAt?: Date | string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateProductJsonLd(product: Product): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image || `${SITE_CONFIG.url}/images/placeholder.png`,
    offers: {
      '@type': 'Offer',
      url: `${SITE_CONFIG.url}/products/${product.id}`,
      priceCurrency: 'GBP',
      price: product.price.toString(),
      availability: 'https://schema.org/InStock',
    },
    brand: {
      '@type': 'Brand',
      name: SITE_CONFIG.name,
    },
  };
}

export function generateBlogPostJsonLd(post: BlogPost): object {
  const publishedDate = new Date(post.publishedAt).toISOString();
  const updatedDate = post.updatedAt ? new Date(post.updatedAt).toISOString() : publishedDate;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.content.substring(0, 160),
    image: post.image || `${SITE_CONFIG.url}/images/placeholder.png`,
    datePublished: publishedDate,
    dateModified: updatedDate,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/logo.png`,
      },
    },
  };
}

export function generateOrganizationJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    email: SITE_CONFIG.email,
    description: SITE_CONFIG.description,
    logo: `${SITE_CONFIG.url}/logo.png`,
    sameAs: [
      'https://twitter.com/ebrora',
      'https://linkedin.com/company/ebrora',
      'https://facebook.com/ebrora',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GB',
    },
  };
}

export function generateBreadcrumbJsonLd(items: BreadcrumbItem[]): object {
  const breadcrumbList = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbList,
  };
}

export function generateFAQJsonLd(faqs: FAQ[]): object {
  const mainEntity = faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}

export function generateLocalBusinessJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    email: SITE_CONFIG.email,
    description: SITE_CONFIG.description,
    telephone: '+441234567890',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GB',
      addressRegion: 'UK',
    },
    priceRange: '£',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    },
  };
}

export function generateServiceJsonLd(
  name: string,
  description: string,
  areaServed: string[] = ['UK']
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    areaServed: areaServed.map((area) => ({
      '@type': 'Place',
      name: area,
    })),
  };
}
