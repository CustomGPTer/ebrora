import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for Ebrora. Learn how we collect, use, and protect your personal data in compliance with UK GDPR.',
  alternates: {
    canonical: 'https://ebrora.com/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy | Ebrora',
    description:
      'Privacy Policy for Ebrora. Learn how we collect, use, and protect your personal data.',
    images: [
      {
        url: 'https://ebrora.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Privacy Policy',
      },
    ],
    url: 'https://ebrora.com/privacy-policy',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Ebrora',
    description:
      'Privacy Policy for Ebrora. Learn how we collect, use, and protect your personal data.',
    images: ['https://ebrora.com/og-image.jpg'],
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      {/* Page Header */}
      <section className="page-header">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p>How we collect, use, and protect your personal data</p>
        </div>
      </section>

      {/* Content */}
      <section className="section">
        <div className="container">
          <div className="legal-content">
            <p className="effective-date">Last updated: 3 April 2026</p>

            <p>
              Ebrora (“we”, “us”, or “our”) is a sole trader
              business based in the United Kingdom. We are committed to protecting
              your privacy and handling your personal data transparently and
              lawfully in accordance with the UK General Data Protection
              Regulation (UK GDPR) and the Data Protection Act 2018.
            </p>

            <p>
              This Privacy Policy explains what personal data we collect, why we
              collect it, how we use it, and your rights regarding that data when
              you visit our website at ebrora.com (the “Site”) or purchase our
              products.
            </p>

            <h2>1. Data Controller</h2>
            <p>
              The data controller responsible for your personal data is Ebrora, a
              sole trader registered in the United Kingdom. If you have any
              questions about this policy or your personal data, you can contact
              us at{' '}
              <a href="mailto:hello@ebrora.com">hello@ebrora.com</a>.
            </p>

            <h2>2. What Data We Collect</h2>

            <h3>2.1 Information You Provide Directly</h3>
            <ul>
              <li>
                <strong>Contact form submissions:</strong> your name, email
                address, subject, and message content when you use our contact
                form.
              </li>
              <li>
                <strong>Newsletter signup:</strong> your email address when you
                subscribe to our mailing list.
              </li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <ul>
              <li>
                <strong>Analytics data:</strong> we use Google Analytics (GA4) to
                collect anonymised usage data such as pages visited, time on site,
                referring source, browser type, device type, and approximate
                geographic location. This data does not personally identify you.
              </li>
              <li>
                <strong>Cookies:</strong> we use analytics cookies only with your
                explicit consent. See Section 7 for details.
              </li>
            </ul>

            <h3>2.3 Information Collected by Third Parties</h3>
            <ul>
              <li>
                <strong>Payment data:</strong> all purchases are processed by
                Gumroad (gumroad.com). When you buy a template, Gumroad collects
                your name, email address, billing address, and payment details. We
                do not have access to your full payment card details. Gumroad's
                privacy policy governs how they handle your payment information.
              </li>
            </ul>

            <h2>3. How We Use Your Data</h2>
            <p>
              We process your personal data for the following purposes and on the
              following lawful bases under UK GDPR:
            </p>
            <ul>
              <li>
                <strong>To respond to enquiries</strong> (lawful basis: legitimate
                interest) — when you submit our contact form, we use your name and
                email to reply to your message.
              </li>
              <li>
                <strong>To send marketing communications</strong> (lawful basis:
                consent) — if you subscribe to our newsletter, we use your email
                address to send you updates about new templates, offers, and news.
                You can unsubscribe at any time.
              </li>
              <li>
                <strong>To analyse site usage</strong> (lawful basis: consent) — we
                use Google Analytics to understand how visitors interact with our
                Site, helping us improve content and user experience. Analytics
                cookies are only set if you click “Accept” on our cookie banner.
              </li>
              <li>
                <strong>To fulfil product purchases</strong> (lawful basis:
                performance of a contract) — Gumroad processes transactions on our
                behalf to deliver your purchased digital templates.
              </li>
            </ul>

            <h2>4. Data Sharing</h2>
            <p>
              We do not sell, rent, or trade your personal data to any third
              parties. We share data only with the following service providers who
              process it on our behalf:
            </p>
            <ul>
              <li>
                <strong>Gumroad</strong> — for payment processing and digital
                product delivery.
              </li>
              <li>
                <strong>Google Analytics</strong> — for anonymised website usage
                statistics.
              </li>
              <li>
                <strong>Formspree</strong> — for processing contact form
                submissions.
              </li>
            </ul>
            <p>
              These providers are bound by their own privacy policies and data
              processing agreements. Some of these providers may transfer data
              outside the UK; where this occurs, appropriate safeguards are in
              place in accordance with UK GDPR requirements.
            </p>

            <h2>5. Data Retention</h2>
            <ul>
              <li>
                <strong>Contact form data:</strong> retained for up to 12 months
                after your enquiry is resolved, then deleted.
              </li>
              <li>
                <strong>Newsletter subscriber data:</strong> retained until you
                unsubscribe, at which point your email address is removed.
              </li>
              <li>
                <strong>Analytics data:</strong> Google Analytics data is retained
                for 14 months by default and is anonymised.
              </li>
              <li>
                <strong>Purchase data:</strong> retained by Gumroad in accordance
                with their retention policy and applicable legal obligations.
              </li>
            </ul>

            <h2>6. Your Rights Under UK GDPR</h2>
            <p>Under UK data protection law, you have the following rights:</p>
            <ul>
              <li>
                <strong>Right of access</strong> — you can request a copy of the
                personal data we hold about you.
              </li>
              <li>
                <strong>Right to rectification</strong> — you can ask us to
                correct inaccurate or incomplete data.
              </li>
              <li>
                <strong>Right to erasure</strong> — you can request that we delete
                your personal data where there is no compelling reason to continue
                processing it.
              </li>
              <li>
                <strong>Right to restrict processing</strong> — you can request
                that we limit how we use your data.
              </li>
              <li>
                <strong>Right to data portability</strong> — you can request your
                data in a structured, commonly used, machine-readable format.
              </li>
              <li>
                <strong>Right to object</strong> — you can object to processing
                based on legitimate interests or direct marketing.
              </li>
              <li>
                <strong>Right to withdraw consent</strong> — where we rely on your
                consent, you can withdraw it at any time without affecting the
                lawfulness of prior processing.
              </li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{' '}
              <a href="mailto:hello@ebrora.com">hello@ebrora.com</a>. We will
              respond within one month of receiving your request.
            </p>

            <h2>7. Cookies</h2>
            <p>
              Our Site uses a cookie consent banner. We only set analytics cookies
              (Google Analytics) if you actively click “Accept”. If you click
              “Decline” or take no action, no analytics cookies are set.
            </p>
            <p>The cookies we use are:</p>
            <ul>
              <li>
                <strong>ebrora_cookie_consent</strong> — a first-party cookie that
                records your cookie preference. Duration: 1 year.
              </li>
              <li>
                <strong>_ga / _ga_*</strong> — Google Analytics cookies used to
                distinguish users and sessions. Duration: up to 2 years. Only set
                if you consent.
              </li>
            </ul>
            <p>
              You can also manage cookies through your browser settings. Note that
              blocking all cookies may affect the functionality of some websites.
            </p>

            <h2>8. Children's Privacy</h2>
            <p>
              Our Site and products are not directed at individuals under the age
              of 18. We do not knowingly collect personal data from children. If
              you believe a child has provided us with personal data, please
              contact us and we will take steps to delete it.
            </p>

            <h2>9. Security</h2>
            <p>
              We take reasonable technical and organisational measures to protect
              your personal data against unauthorised access, loss, or misuse. Our
              Site is served over HTTPS, and our third-party service providers
              maintain their own security standards.
            </p>

            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes
              will be posted on this page with an updated “Last updated” date. We
              encourage you to review this page periodically.
            </p>

            <h2>11. Complaints</h2>
            <p>
              If you are not satisfied with how we handle your personal data, you
              have the right to lodge a complaint with the Information
              Commissioner's Office (ICO), the UK's supervisory authority for data
              protection:
            </p>
            <p>
              Information Commissioner's Office
              <br />
              Website:{' '}
              <a href="https://ico.org.uk" target="_blank" rel="noopener">
                ico.org.uk
              </a>
              <br />
              Telephone: 0303 123 1113
            </p>

            <h2>12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or wish to
              exercise your data rights, please contact us:
            </p>
            <p>
              Ebrora
              <br />
              Email:{' '}
              <a href="mailto:hello@ebrora.com">hello@ebrora.com</a>
              <br />
              United Kingdom
            </p>
          </div>
        </div>
      </section>
    </>
  );
        }
