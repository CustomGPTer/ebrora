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
              Ebrora was built by construction professionals who were tired of spending evenings
              writing RAMS from scratch, chasing compliance paperwork, and rebuilding spreadsheets
              for every new project. We built the platform we wish we had when we started out —
              AI document generators, ready-to-use templates, free toolbox talks, and site
              calculators, all in one place.
            </p>
            <p>
              Every tool on the platform is designed around real UK site workflows and tested by
              practising engineers and site managers. From AI-powered RAMS and COSHH assessments to
              premium Excel templates, 1,500+ free toolbox talks, and 40+ construction calculators —
              Ebrora helps site teams spend less time on paperwork and more time delivering projects.
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
