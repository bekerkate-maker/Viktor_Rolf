import '../App.css';

function Home() {
  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">VIKTOR & ROLF</h1>
        <h2 className="home-subtitle">Sample Control System</h2>
        <div className="home-divider"></div>
      </div>

      <div className="home-content">
        <section className="home-section">
          <h3>Welcome</h3>
          <p>
            This internal system is developed for the Viktor & Rolf fashion house and is intended 
            for use by our product developers, quality control teams, and production departments.
          </p>
        </section>

        <section className="home-section">
          <h3>About the System</h3>
          <p>
            The Sample Control System provides a centralized platform for managing all quality 
            processes within our collections. From sample tracking to detailed quality reviews 
            and direct communication with our suppliers - everything in one place.
          </p>
        </section>

        <div className="home-modules">
          <div className="home-module-card">
            <div className="module-icon">✓</div>
            <h4>Quality Control</h4>
            <p>
              Manage quality reviews, add photos and comments, and track the status 
              of samples throughout the entire development process.
            </p>
            <a href="/quality-control" className="module-link">
              Go to Quality Control →
            </a>
          </div>

          <div className="home-module-card">
            <div className="module-icon">✉</div>
            <h4>Supplier Communications</h4>
            <p>
              Centralize all communication with suppliers. Track messages, share attachments, 
              and maintain a complete overview of all correspondence.
            </p>
            <a href="/supplier-communications" className="module-link">
              Go to Supplier Communications →
            </a>
          </div>
        </div>

        <section className="home-section home-features">
          <h3>Features</h3>
          <ul className="features-list">
            <li>Real-time tracking of samples and quality reviews</li>
            <li>Photo uploads for visual documentation</li>
            <li>Structured communication with suppliers</li>
            <li>Detailed audit trail for complete traceability</li>
            <li>Intuitive interface designed for fashion professionals</li>
          </ul>
        </section>

        <section className="home-footer-section">
          <p className="home-footer-text">
            For questions or support, please contact the IT team.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Home;
