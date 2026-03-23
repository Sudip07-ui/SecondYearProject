import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import VehicleCard from '../components/common/VehicleCard';
import './Home.css';

const STATS = [
  { icon: '', value: '500+', label: 'Vehicles Available' },
  { icon: '', value: '10K+', label: 'Happy Customers' },
  { icon: '', value: '50+', label: 'Pickup Locations' },
  { icon: '', value: '4.8', label: 'Average Rating' },
];

const HOW_IT_WORKS = [
  { step: '01', icon: '', title: 'Browse & Filter', desc: 'Find your perfect vehicle by type, fuel, price, and availability.' },
  { step: '02', icon: '', title: 'Verify Identity', desc: 'Complete our secure 3-step document upload for quick approval.' },
  { step: '03', icon: '', title: 'Book & Pay Online', desc: 'Reserve your vehicle with our secure digital payment system.' },
  { step: '04', icon: '', title: 'Pick Up & Ride', desc: 'Collect your vehicle and enjoy the journey!' },
];

const Home = () => {
  const [featured, setFeatured]   = useState([]);
  const [searchQ,  setSearchQ]    = useState('');
  const [loading,  setLoading]    = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/vehicles?status=available')
      .then(r => setFeatured(r.data.vehicles?.slice(0, 6) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/vehicles?search=${encodeURIComponent(searchQ)}`);
  };

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content container">
          <div className="hero-text">
            <span className="hero-badge">🇳🇵 Nepal's Digital Rental Platform</span>
            <h1 className="hero-title">Rent Any Vehicle<br /><span className="highlight">Anytime, Anywhere</span></h1>
            <p className="hero-sub">Bikes, scooters & cars — available online, 24/7. No paperwork. Instant booking.</p>
            <form className="hero-search" onSubmit={handleSearch}>
              <input
                className="form-control hero-input"
                placeholder="Search by vehicle model or brand..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-lg">Search 🔍</button>
            </form>
            <div className="hero-actions">
              <Link to="/vehicles" className="btn btn-primary btn-lg">Browse All Vehicles</Link>
              <Link to="/register" className="btn btn-outline btn-lg" style={{background:'rgba(255,255,255,.15)',color:'#fff',borderColor:'rgba(255,255,255,.5)'}}>Get Started Free</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card-float">
              <span style={{fontSize:'72px'}}>🛵</span>
              <div style={{marginTop:'8px',fontWeight:'700',fontSize:'16px',color:'var(--secondary)'}}>Book in 60 seconds</div>
              <div style={{fontSize:'13px',color:'var(--gray-500)'}}>Instant digital booking</div>
            </div>
          </div>
        </div>
        {/* Stats bar */}
        <div className="stats-bar">
          <div className="container stats-inner">
            {STATS.map(s => (
              <div className="stat-item" key={s.label}>
                <span className="stat-icon">{s.icon}</span>
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Vehicles */}
      <section className="section container">
        <div className="section-head">
          <div>
            <h2 className="section-title">Available Vehicles</h2>
            <p style={{color:'var(--gray-500)',marginTop:'4px'}}>Ready to ride — browse our verified fleet</p>
          </div>
          <Link to="/vehicles" className="btn btn-outline">View All →</Link>
        </div>
        {loading ? (
          <div style={{textAlign:'center',padding:'60px',color:'var(--gray-500)'}}>Loading vehicles...</div>
        ) : (
          <div className="grid-3">
            {featured.map(v => <VehicleCard key={v.id} vehicle={v} />)}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="how-section">
        <div className="container">
          <div className="section-head centered">
            <h2 className="section-title">How Rento Works</h2>
            <p>From browsing to riding in 4 easy steps</p>
          </div>
          <div className="grid-4 how-grid">
            {HOW_IT_WORKS.map(s => (
              <div className="how-card" key={s.step}>
                <div className="how-step">{s.step}</div>
                <div className="how-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features highlight */}
      <section className="section container">
        <div className="features-grid">
          <div className="feature-text">
            <h2>Everything You Need<br /></h2>
            <p>Rento replaces messy paperwork with a fully digital, secure rental experience.</p>
            <ul className="feature-list">
              {['Real-time vehicle availability'].map(f => (
                <li key={f}><span className="check">✅</span> {f}</li>
              ))}
            </ul>
            <Link to="/register" className="btn btn-primary btn-lg" style={{marginTop:'24px'}}>Start Renting Today</Link>
          </div>
          <div className="feature-visual">
            <div className="feature-img-card">
              <div style={{fontSize:'80px',textAlign:'center',padding:'32px'}}>🏍️🚗🛵</div>
              <div style={{padding:'0 24px 24px',textAlign:'center'}}>
                <div style={{fontWeight:'700',fontSize:'18px',color:'var(--secondary)'}}>Any Vehicle, Any Day</div>
                <div style={{color:'var(--gray-500)',fontSize:'14px',marginTop:'8px'}}>Bikes • Scooters • Cars • EVs</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container cta-inner">
          <h2>Ready to Ride?</h2>
          <p>Join thousands of happy renters on Nepal's simplest vehicle rental platform.</p>
          <div style={{display:'flex',gap:'16px',justifyContent:'center',flexWrap:'wrap'}}>
            <Link to="/vehicles" className="btn btn-primary btn-lg">Browse Vehicles</Link>
            <Link to="/register" className="btn btn-lg" style={{background:'rgba(255,255,255,.15)',color:'#fff',border:'2px solid rgba(255,255,255,.4)'}}>Create Account</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
