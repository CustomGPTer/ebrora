import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Refund Policy for Digital Templates',
    description:
          'Read the Ebrora refund policy. Understand our refund terms for instant-download digital Excel templates for UK construction professionals.',
    alternates: {
          canonical: 'https://ebrora.com/refund-policy',
    },
    openGraph: {
          title: 'Refund Policy | Ebrora',
          description:
                  'Refund terms for Ebrora instant-download digital Excel construction templates.',
          images: [
            {
                      url: 'https://ebrora.com/og-image.jpg',
                      width: 1200,
                      height: 630,
                      alt: 'Ebrora Refund Policy',
            },
                ],
          url: 'https://ebrora.com/refund-policy',
          type: 'website',
    },
    twitter: {
          card: 'summary_large_image',
          title: 'Refund Policy | Ebrora',
          description:
                  'Refund terms for Ebrora instant-download digital Excel construction templates.',
          images: ['https://ebrora.com/og-image.jpg'],
    },
};

export default function RefundPolicyPage() {
    return (
          <>
            {/* Page Header */}
                <section className="page-header">
                        <div className="container">
                                  <h1>Refund Policy</h1>h1>
                                  <p>Our refund terms for instant-download digital products</p>p>
                        </div>div>
                </section>section>
          
            {/* Content */}
                <section className="section">
                        <div className="container">
                                  <div className="legal-content">
                                              <p className="effective-date">Last updated: 3 April 2026</p>p>
                                  
                                              <p>
                                                            Thank you for purchasing from Ebrora. We take pride in delivering
                                                            professional, high-quality Excel templates for the construction and
                                                            civil engineering industry. Please read this Refund Policy
                                                            carefully before making a purchase.
                                              </p>p>
                                  
                                              <h2>1. Digital Product Nature</h2>h2>
                                              <p>
                                                            All Ebrora products are digital files (Excel templates) delivered
                                                            as instant downloads via Gumroad. Once a purchase is completed, you
                                                            will immediately receive a download link by email and through your
                                                            Gumroad library. Because our products are digital goods that can be
                                                            accessed instantly upon purchase, they are treated differently from
                                                            physical goods under consumer law.
                                              </p>p>
                                  
                                              <h2>2. General Refund Position</h2>h2>
                                              <p>
                                                            Due to the instant-download nature of our digital products, we do
                                                            not offer refunds as standard once a download link has been
                                                            delivered to you. This is because digital files cannot be
                                                            &ldquo;returned&rdquo; in the way a physical product can, and we have no way
                                                            to verify whether a file has been downloaded, copied, or used after
                                                            delivery.
                                              </p>p>
                                              <p>
                                                            We encourage all customers to review the free PDF preview of any
                                                            template before purchasing. These previews are available on each
                                                            product page and show the full layout, structure, and features of
                                                            the template so you can make an informed decision.
                                              </p>p>
                                  
                                              <h2>3. When We Will Issue a Refund</h2>h2>
                                              <p>
                                                            We will consider a full refund in the following circumstances:
                                              </p>p>
                                              <ul>
                                                            <li>
                                                                            <strong>Corrupted or damaged file:</strong>strong> if the downloaded
                                                                            file is corrupted, damaged, or cannot be opened in a supported
                                                                            version of Microsoft Excel (2016 or later, including Microsoft
                                                                            365), and we are unable to resolve the issue by providing a
                                                                            replacement file.
                                                            </li>li>
                                                            <li>
                                                                            <strong>Product not as described:</strong>strong> if the template is
                                                                            materially different from what was described on the product page
                                                                            and in the PDF preview — for example, if key features listed in
                                                                            the product description are missing or non-functional.
                                                            </li>li>
                                                            <li>
                                                                            <strong>Duplicate purchase:</strong>strong> if you accidentally
                                                                            purchased the same template twice, we will refund the duplicate
                                                                            order.
                                                            </li>li>
                                              </ul>ul>
                                  
                                              <h2>4. When We Will Not Issue a Refund</h2>h2>
                                              <p>
                                                            Refunds will not be issued in the following situations:
                                              </p>p>
                                              <ul>
                                                            <li>
                                                                            <strong>Change of mind:</strong>strong> if you simply no longer want the
                                                                            template after purchase.
                                                            </li>li>
                                                            <li>
                                                                            <strong>Failure to review the preview:</strong>strong> if the template
                                                                            matches the PDF preview and product description but does not meet
                                                                            your expectations.
                                                            </li>li>
                                                            <li>
                                                                            <strong>Incompatible software:</strong>strong> if you are using software
                                                                            other than Microsoft Excel (such as Google Sheets, LibreOffice,
                                                                            or Apple Numbers), as our templates are designed and tested
                                                                            specifically for Microsoft Excel. Compatibility information is
                                                                            clearly stated on our product pages.
                                                            </li>li>
                                                            <li>
                                                                            <strong>Inability to use the template:</strong>strong> if you lack the
                                                                            technical knowledge to use the template&apos;s features. We are happy
                                                                            to provide guidance via email, but this does not constitute
                                                                            grounds for a refund.
                                                            </li>li>
                                                            <li>
                                                                            <strong>Indirect losses:</strong>strong> we are not liable for any
                                                                            indirect or consequential losses arising from the use or
                                                                            inability to use our templates.
                                                            </li>li>
                                              </ul>ul>
                                  
                                              <h2>5. How to Request a Refund</h2>h2>
                                              <p>
                                                            If you believe you are entitled to a refund under the circumstances
                                                            described in Section 3, please contact us within 14 days of your
                                                            purchase:
                                              </p>p>
                                              <p>
                                                            Email:{' '}
                                                            <a href="mailto:hello@ebrora.com">hello@ebrora.com</a>a>
                                              </p>p>
                                              <p>When contacting us, please include:</p>p>
                                              <ul>
                                                            <li>
                                                                            Your full name and the email address used for the purchase.
                                                            </li>li>
                                                            <li>The name of the template you purchased.</li>li>
                                                            <li>Your Gumroad order number or receipt.</li>li>
                                                            <li>
                                                                            A clear description of the issue, including screenshots if
                                                                            applicable.
                                                            </li>li>
                                              </ul>ul>
                                              <p>
                                                            We aim to respond to all refund requests within 48 hours. If your
                                                            refund is approved, it will be processed through Gumroad and
                                                            returned to your original payment method. Please allow 5–10
                                                            business days for the refund to appear on your statement.
                                              </p>p>
                                  
                                              <h2>6. Replacements</h2>h2>
                                              <p>
                                                            In many cases, we may be able to resolve your issue without a
                                                            refund. If your file is corrupted or you are experiencing technical
                                                            difficulties, we will first attempt to provide a working
                                                            replacement file or technical support. A refund will only be issued
                                                            if the problem cannot be resolved.
                                              </p>p>
                                  
                                              <h2>7. Consumer Rights</h2>h2>
                                              <p>
                                                            This Refund Policy does not affect your statutory rights under UK
                                                            consumer law, including the Consumer Rights Act 2015. Under UK law,
                                                            digital content must be of satisfactory quality, fit for a
                                                            particular purpose, and as described. If our products fail to meet
                                                            these standards, you may be entitled to a repair, replacement, or
                                                            refund as appropriate.
                                              </p>p>
                                              <p>
                                                            For digital content purchased online, the Consumer Contracts
                                                            (Information, Cancellation and Additional Charges) Regulations 2013
                                                            provide a 14-day cancellation period. However, this right is lost
                                                            once you have downloaded or streamed the digital content, provided
                                                            you were informed of this and gave your consent at the point of
                                                            purchase. By completing a purchase through Gumroad and receiving
                                                            your download link, you acknowledge and consent to this.
                                              </p>p>
                                  
                                              <h2>8. Changes to This Policy</h2>h2>
                                              <p>
                                                            We may update this Refund Policy from time to time. Any changes
                                                            will be posted on this page with an updated &ldquo;Last updated&rdquo; date.
                                                            The policy in effect at the time of your purchase will apply to
                                                            that transaction.
                                              </p>p>
                                  
                                              <h2>9. Contact Us</h2>h2>
                                              <p>
                                                            If you have any questions about this Refund Policy, please contact
                                                            us:
                                              </p>p>
                                              <p>
                                                            Ebrora
                                                            <br />
                                                            Email: <a href="mailto:hello@ebrora.com">hello@ebrora.com</a>a>
                                                            <br />
                                                            United Kingdom
                                              </p>p>
                                  </div>div>
                        </div>div>
                </section>section>
          </>>
        );
}</>
