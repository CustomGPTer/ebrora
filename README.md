# Ebrora - Construction Templates & RAMS Builder

A modern Next.js application for Ebrora, converting the existing static HTML site to a dynamic platform with a RAMS (Risk Assessment Method Statements) builder powered by OpenAI.

## Project Overview

- **Stack**: Next.js 14+ (App Router), TypeScript, React 18
- **Database**: PostgreSQL (Supabase or Neon) with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth + email/password
- **AI**: OpenAI API for intelligent RAMS document generation
- **Deployment**: Vercel (London region)
- **Styling**: Custom CSS with Ebrora brand colors and typography

## Quick Start

### Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn package manager
- PostgreSQL database (Supabase or Neon recommended)
- Google OAuth credentials
- OpenAI API key (for RAMS Builder)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/ebrora.git
   cd ebrora
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in all required values in `.env.local`:
   - Database connection string
   - NextAuth credentials (generate with `openssl rand -base64 32`)
   - Google OAuth credentials
   - OpenAI API key
   - Email configuration (SMTP)
   - PayPal credentials
   - Mailchimp API key

4. **Setup Prisma**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed  # Optional: populate test data
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

6. **Type checking**
   ```bash
   npm run type-check
   ```

## Environment Variables

All environment variables must be set in `.env.local`. See `.env.example` for all available options.

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - NextAuth callback URL
- `NEXTAUTH_SECRET` - Generated secret key for NextAuth
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret

### Optional Variables
- `OPENAI_API_KEY` - For RAMS Builder functionality
- `OPENAI_MODEL` - OpenAI model (default: gpt-4-turbo)
- `SMTP_*` - Email configuration
- `PAYPAL_*` - PayPal integration
- `MAILCHIMP_*` - Newsletter integration
- `GA_MEASUREMENT_ID` - Google Analytics (default: G-ZVPRYV7LNX)

## Database Setup

### Supabase (Recommended)

1. Create a new Postgres project at [supabase.com](https://supabase.com)
2. Copy the connection string from the Supabase dashboard
3. Set `DATABASE_URL` in `.env.local`
4. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

### Neon

1. Create a new database at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Set `DATABASE_URL` in `.env.local`
4. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

### Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database: `createdb ebrora`
3. Set `DATABASE_URL="postgresql://user:password@localhost:5432/ebrora"`
4. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

## Prisma Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate

# Reset database (development only)
npx prisma migrate reset

# Seed database with test data
npm run prisma:seed

# Open Prisma Studio (visual database explorer)
npx prisma studio
```

## Build and Deployment

### Local Build

```bash
npm run build
npm start
```

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Set all environment variables in Vercel project settings
4. Deploy from `main` branch automatically

#### Manual Vercel Deployment

```bash
npm install -g vercel
vercel
```

Follow the prompts to connect your project.

### Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Database migrations applied
- [ ] Build succeeds locally and on Vercel
- [ ] Test authentication flows
- [ ] Verify API routes work
- [ ] Check analytics integration
- [ ] Test email notifications
- [ ] Verify RAMS Builder functionality
- [ ] Test PayPal integration (staging)
- [ ] Newsletter signup working

## Project Structure

```
/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Authentication pages (login, signup)
│   ├── (admin)/             # Admin dashboard
│   ├── api/                 # API routes
│   │   ├── auth/           # NextAuth configuration
│   │   ├── products/       # Product API endpoints
│   │   ├── rams/           # RAMS Builder API
│   │   ├── contact/        # Contact form API
│   │   ├── newsletter/     # Newsletter subscription
│   │   └── cron/           # Scheduled cron jobs
│   ├── products/            # Product pages
│   ├── rams/                # RAMS Builder pages
│   ├── blog/                # Blog pages (MDX)
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
│
├── components/              # React components
│   ├── ui/                 # Reusable UI components
│   ├── forms/              # Form components
│   ├── navigation/         # Navigation components
│   └── ...
│
├── lib/                     # Utility functions
│   ├── auth.ts             # NextAuth configuration
│   ├── db.ts               # Prisma client
│   ├── email.ts            # Email utilities
│   ├── openai.ts           # OpenAI API wrapper
│   ├── stripe.ts           # Payment processing
│   └── ...
│
├── prisma/                  # Database schema
│   ├── schema.prisma       # Schema definition
│   └── migrations/         # Migration files
│
├── public/                  # Static assets
│   ├── images/
│   ├── fonts/
│   └── ...
│
├── styles/                  # Global styles
│   ├── globals.css         # Global styles
│   ├── variables.css       # CSS variables
│   └── ...
│
├── types/                   # TypeScript types
│   └── index.ts            # Type definitions
│
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── next.config.mjs          # Next.js configuration
├── package.json             # Dependencies
├── postcss.config.js        # PostCSS configuration
├── tsconfig.json            # TypeScript configuration
├── vercel.json              # Vercel deployment config
└── README.md                # This file
```

## Brand Colors and Fonts

### Colors
- **Primary Green**: `#1B5745`
- **Secondary Green**: `#1B5B50`
- **Gold/Accent**: `#D4A44C`
- **Text**: Dark gray/black for body text
- **Background**: White/light gray

### Fonts
- **Body**: DM Sans
- **Headings**: Playfair Display

## Key Features

### RAMS Builder
- AI-powered document generation using OpenAI
- Interactive form-based RAMS creation
- PDF export functionality
- Save and edit existing RAMs documents

### Product Store
- Product catalog with detailed descriptions
- Dynamic pricing and availability
- Shopping cart and checkout
- PayPal integration for payments

### User Authentication
- Google OAuth login
- Email/password registration
- Password reset functionality
- User profile management

### Newsletter
- Mailchimp integration
- Subscription forms across the site
- Campaign management

### Admin Dashboard
- Product management
- User management
- Order tracking
- Analytics and reporting

### Blog
- MDX-based blog posts
- Search functionality
- Category filtering
- Related posts

## API Routes

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signup` - Sign up
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Products
- `GET /api/products` - Get all products
- `GET /api/products/[id]` - Get product by ID
- `POST /api/products` - Create product (admin)
- `PUT /api/products/[id]` - Update product (admin)
- `DELETE /api/products/[id]` - Delete product (admin)

### RAMS Builder
- `POST /api/rams/generate` - Generate RAMS document
- `GET /api/rams/[id]` - Get RAMS document
- `POST /api/rams/[id]/export` - Export as PDF

### Contact
- `POST /api/contact` - Submit contact form

### Newsletter
- `POST /api/newsletter/subscribe` - Subscribe to newsletter

### Cron Jobs
- `GET /api/cron/cleanup` - 12-hour cleanup job

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

## Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checker
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed database with initial data
```

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database server is running
- Ensure network access is allowed for remote databases
- Try connecting with a database client to verify connectivity

### NextAuth Issues
- `NEXTAUTH_SECRET` is required and must be unique
- `NEXTAUTH_URL` must match deployment URL exactly
- Clear cookies if authentication isn't working

### Build Failures
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript errors with `npm run type-check`
- Verify all environment variables are set
- Clear `.next` folder and rebuild

### Email Not Sending
- Verify SMTP credentials are correct
- Check email logs in Vercel
- Test with a simple email first
- For Gmail, use app-specific password, not your account password

## Documentation Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [NextAuth.js Documentation](https://next-auth.js.org/getting-started/introduction)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request

## License

Copyright © 2024 Ebrora Ltd. All rights reserved.

## Support

For issues, questions, or feedback, please contact support@ebrora.com

