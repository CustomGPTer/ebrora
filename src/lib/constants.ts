/**
 * Site Configuration
 * Centralized configuration for the Ebrora application
 */

export const SITE_CONFIG = {
  name: 'Ebrora',
  domain: 'ebrora.com',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://ebrora.com',
  description:
    'Professional Excel templates for UK construction industry. Generate RAMS documents instantly.',
  email: 'hello@ebrora.com',
  ga4Id: 'G-ZVPRYV7LNX',
  locale: 'en-GB',
  timezone: 'Europe/London',
  brand: {
    primary: '#1B5B50',
    gold: '#D4A44C',
    dark: '#1a1a1a',
    light: '#f5f5f5',
  },
};

/**
 * RAMS Builder Configuration
 */
export const RAMS_CONFIG = {
  maxFileSize: 2 * 1024 * 1024, // 2MB logo
  fileExpiryHours: 12,
  maxRetries: 2,
  generationTimeoutMs: 120000, // 2 minutes
  supportedLogoTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
  supportedFormats: ['docx', 'pdf', 'html'],
};

/**
 * Tier-based Limits
 */
export const TIER_LIMITS = {
  FREE: {
    ramsPerMonth: 1,
    formats: 2,
    maxLogoSize: 1024 * 1024, // 1MB
    storageHours: 24,
  },
  STANDARD: {
    ramsPerMonth: 10,
    formats: 10,
    maxLogoSize: 2 * 1024 * 1024, // 2MB
    storageHours: 7 * 24, // 7 days
  },
  PREMIUM: {
    ramsPerMonth: 25,
    formats: 10,
    maxLogoSize: 5 * 1024 * 1024, // 5MB
    storageHours: 30 * 24, // 30 days
  },
  ENTERPRISE: {
    ramsPerMonth: 'unlimited',
    formats: 10,
    maxLogoSize: 10 * 1024 * 1024, // 10MB
    storageHours: 'unlimited',
  },
} as const;

/**
 * Payment Configuration
 */
export const PAYMENT_CONFIG = {
  currency: 'GBP',
  paypal: {
    mode: process.env.NEXT_PUBLIC_PAYPAL_MODE || 'sandbox',
  },
};

/**
 * Email Configuration
 */
export const EMAIL_CONFIG = {
  from: 'hello@ebrora.com',
  replyTo: 'hello@ebrora.com',
  supportEmail: 'support@ebrora.com',
};

/**
 * Auth Configuration
 */
export const AUTH_CONFIG = {
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  sessionExpiryHours: 24,
  refreshTokenExpiryDays: 30,
};

/**
 * API Configuration
 */
export const API_CONFIG = {
  rateLimit: {
    default: 100, // requests per 15 minutes
    auth: 10, // for auth endpoints
    upload: 5, // for file uploads
  },
  timeout: 30000, // 30 seconds
};

/**
 * SEO Configuration
 */
export const SEO_CONFIG = {
  titleTemplate: '%s | Ebrora',
  defaultTitle:
    'Ebrora — Professional Excel Templates & RAMS Builder for UK Construction',
  defaultDescription:
    'Professional Excel templates for UK construction industry. Generate RAMS documents instantly with our AI-powered RAMS Builder. Start free.',
  ogImage: '/images/og-image.png',
  twitterHandle: '@ebrora',
};

/**
 * Featured Products (for homepage and catalog)
 */
export const FEATURED_PRODUCTS = [
  'risk-register',
  'site-induction',
  'method-statements',
];

/**
 * Product Categories
 */
export const PRODUCT_CATEGORIES = [
  'Safety Management',
  'Site Planning',
  'Documentation',
  'Compliance',
  'Training',
];

/**
 * FAQ Categories
 */
export const FAQ_CATEGORIES = [
  'General',
  'RAMS Builder',
  'Products',
  'Account & Billing',
  'Technical Support',
];

/**
 * Navigation Links
 */
export const NAV_LINKS = {
  main: [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'RAMS Builder', href: '/rams-builder' },
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/faq' },
  ],
  footer: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms-of-service' },
    { label: 'Refund Policy', href: '/refund-policy' },
    { label: 'Contact', href: '/contact' },
  ],
};

/**
 * Social Links
 */
export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/ebrora',
  linkedin: 'https://linkedin.com/company/ebrora',
  facebook: 'https://facebook.com/ebrora',
  github: 'https://github.com/ebrora',
};

/**
 * Feature Flags
 */
export const FEATURES = {
  enableRamsBuilder: true,
  enableBlog: true,
  enableFAQ: true,
  enablePayments: true,
  enableAdminPanel: true,
  enableAnalytics: true,
};

/**
 * Validation Patterns
 */
export const VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)]+$/,
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  invalidEmail: 'Please enter a valid email address',
  invalidPassword: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  required: 'This field is required',
  serverError: 'An error occurred. Please try again later',
  unauthorized: 'You do not have permission to access this resource',
  notFound: 'The requested resource was not found',
  rateLimited: 'Too many requests. Please try again later',
};

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  accountCreated: 'Account created successfully',
  loggedIn: 'Logged in successfully',
  updated: 'Updated successfully',
  deleted: 'Deleted successfully',
  emailSent: 'Email sent successfully',
};
