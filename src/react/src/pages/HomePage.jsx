import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../app/home/home.css';

function HomePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const features = useMemo(
    () => [
      {
        icon: '🎯',
        title: 'Find Your Dream Job',
        description: 'Browse thousands of job opportunities from top companies'
      },
      {
        icon: '🏢',
        title: 'For Employers',
        description: 'Post jobs and find the best talent for your organization'
      },
      {
        icon: '📝',
        title: 'Easy Application',
        description: 'Apply to jobs with just a few clicks and track your applications'
      },
      {
        icon: '🔔',
        title: 'Smart Notifications',
        description: 'Get instant updates about your applications and interviews'
      }
    ],
    []
  );

  const stats = useMemo(
    () => [
      { number: '1000+', label: 'Active Jobs' },
      { number: '500+', label: 'Companies' },
      { number: '10K+', label: 'Job Seekers' },
      { number: '5K+', label: 'Success Stories' }
    ],
    []
  );

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const searchJobs = () => {
    if (searchTerm.trim()) {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const destination = currentUser?.role === 'candidate' ? '/candidate/browse-jobs' : '/login';
      navigate(destination, { state: { initialSearch: searchTerm.trim() } });
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="container">
          <div className="nav-brand">
            <h2>🚀 JobPortal</h2>
          </div>
          <div className="nav-links">
            <a onClick={() => scrollToSection('home')} style={{ cursor: 'pointer' }}>Home</a>
            <a onClick={() => scrollToSection('features')} style={{ cursor: 'pointer' }}>Features</a>
            <a onClick={() => scrollToSection('about')} style={{ cursor: 'pointer' }}>About</a>
            <button className="btn-outline" onClick={() => navigate('/login')}>Login</button>
            <button className="btn-primary" onClick={() => navigate('/register')}>Sign Up</button>
          </div>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Find Your Perfect Job Match</h1>
            <p className="hero-subtitle">Connect with top employers and discover opportunities that match your skills and aspirations</p>

            <div className="search-container">
              <input
                type="text"
                placeholder="Job title, keywords, or company"
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === 'Enter') {
                    searchJobs();
                  }
                }}
              />
              <button className="search-btn" onClick={searchJobs}>
                Search Jobs
              </button>
            </div>

            <div className="quick-actions">
              <span>Popular searches:</span>
              <a href="#">Software Engineer</a>
              <a href="#">Graphic Designer</a>
              <a href="#">Marketing Manager</a>
            </div>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="container">
          <h2 className="section-title">Why Choose JobPortal?</h2>
          <div className="features-grid">
            {features.map((feature) => (
              <div className="feature-card" key={feature.title}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="stats" id="about">
        <div className="container">
          <h2 className="section-title" style={{ color: 'white', marginBottom: '2rem' }}>About JobPortal</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '3rem', opacity: 0.95 }}>JobPortal is a comprehensive job search platform connecting talented candidates with leading companies. Our mission is to simplify the job search process and help you find the perfect career opportunity.</p>

          <div className="stats-grid">
            {stats.map((stat) => (
              <div className="stat-item" key={stat.label}>
                <h3>{stat.number}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="about-features" style={{ marginTop: '3rem' }}>
            <div className="about-item">
              <h3>🎯 Our Vision</h3>
              <p>To be the most trusted job portal platform, empowering careers and building successful teams.</p>
            </div>
            <div className="about-item">
              <h3>💼 For Job Seekers</h3>
              <p>Access thousands of opportunities, track applications, and connect with top employers.</p>
            </div>
            <div className="about-item">
              <h3>🏢 For Employers</h3>
              <p>Find the best talent, streamline hiring, and build your dream team efficiently.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta" id="about">
        <div className="container">
          <h2>About JobPortal</h2>
          <p>JobPortal is a comprehensive job search platform connecting talented candidates with leading companies. Our mission is to simplify the job search process and help you find the perfect career opportunity.</p>
          <div className="about-features">
            <div className="about-item">
              <h3>🎯 Our Vision</h3>
              <p>To be the most trusted job portal platform, empowering careers and building successful teams.</p>
            </div>
            <div className="about-item">
              <h3>💼 For Job Seekers</h3>
              <p>Access thousands of opportunities, track applications, and connect with top employers.</p>
            </div>
            <div className="about-item">
              <h3>🏢 For Employers</h3>
              <p>Find the best talent, streamline hiring, and build your dream team efficiently.</p>
            </div>
          </div>
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p>Join thousands of job seekers and employers today</p>
          <div className="cta-buttons">
            <button className="btn-large btn-primary" onClick={() => navigate('/register')}>Create Account</button>
            <button className="btn-large btn-outline-white" onClick={() => navigate('/login')}>Login Now</button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>🚀 JobPortal</h3>
              <p>Connecting talent with opportunity</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <a href="#">About Us</a>
              <a href="#">Contact</a>
              <a href="#">Privacy Policy</a>
            </div>
            <div className="footer-section">
              <h4>For Employers</h4>
              <a href="#">Post a Job</a>
              <a href="#">Pricing</a>
              <a href="#">Resources</a>
            </div>
            <div className="footer-section">
              <h4>For Job Seekers</h4>
              <a href="#">Browse Jobs</a>
              <a href="#">Career Advice</a>
              <a href="#">Resume Tips</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>2025 JobPortal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

export default HomePage;
