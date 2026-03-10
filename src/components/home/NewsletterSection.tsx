export default function NewsletterSection() {
  return (
    <section className="newsletter section section--alt">
      <div className="container">
        <h2>Stay Updated</h2>
        <p>Get exclusive templates, tips, and construction industry insights delivered to your inbox.</p>
        <form className="newsletter__form" action="https://ebrora.us21.list-manage.com/subscribe/post" method="POST">
          <input type="hidden" name="u" value="placeholder_mailchimp_id" />
          <input type="hidden" name="id" value="placeholder_list_id" />

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              type="email"
              name="EMAIL"
              placeholder="Enter your email"
              required
              style={{
                flex: 1,
                minWidth: '250px',
                padding: '0.75rem 1rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
            <button
              type="submit"
              className="btn btn--accent"
              style={{ whiteSpace: 'nowrap' }}
            >
              Subscribe
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
