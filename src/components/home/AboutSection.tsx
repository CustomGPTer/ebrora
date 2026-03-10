'use client';

interface AboutSectionProps {
  templateCount: number;
  categoryCount: number;
}

export default function AboutSection({ templateCount, categoryCount }: AboutSectionProps) {
  return (
    <section className="section section--alt" id="about">
      <div className="container">
        <div className="about-grid">
          <div className="about__visual">🏗️</div>
          <div className="about__content">
            <h2>About Ebrora</h2>
            <p>
              Ebrora was created by construction professionals who were tired of spending evenings
              building spreadsheets from scratch for every new project. We build the tools we wish we
              had when we started out — professional, reliable, and ready to use on day one.
            </p>
            <p>
              Every template is designed with real site workflows in mind, tested by practising
              engineers and site managers, and refined based on customer feedback. Whether you manage
              earthworks, M&amp;E installations, or full project programmes, our templates help you
              work smarter.
            </p>
            <div className="about__stats">
              <div className="about__stat">
                <span className="about__stat-number" id="statTemplates">
                  {templateCount}+
                </span>
                <span className="about__stat-label">Templates</span>
              </div>
              <div className="about__stat">
                <span className="about__stat-number" id="statCategories">
                  {categoryCount}
                </span>
                <span className="about__stat-label">Categories</span>
              </div>
              <div className="about__stat">
                <span className="about__stat-number">500+</span>
                <span className="about__stat-label">Customers</span>
              </div>
              <div className="about__stat">
                <span className="about__stat-number">4.9</span>
                <span className="about__stat-label">Avg Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
