export default function FeaturesSection() {
  const features = [
    {
      icon: '🛠️',
      title: 'Built for Construction',
      desc: 'Templates designed by construction professionals who understand your workflows and compliance needs.',
    },
    {
      icon: '⚡',
      title: 'Instant Download',
      desc: 'Get immediate access to all templates. Start using them in minutes, not hours.',
    },
    {
      icon: '🔒',
      title: 'Professional & Reliable',
      desc: 'Industry-standard Excel templates trusted by hundreds of construction companies across the UK.',
    },
    {
      icon: '💻',
      title: 'Windows & Mac',
      desc: 'All templates are fully compatible with Excel on Windows, Mac, and Google Sheets.',
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <h2>Why Choose Ebrora</h2>
        <div className="features-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="feature-card">
              <span className="feature-card__icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
