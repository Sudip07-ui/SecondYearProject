import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="footer-container">
      <div className="footer-brand">
        <div className="footer-logo">🛵 Rento</div>
        <p>Simple Wheels Rental Platform. Fast, safe, digital vehicle rentals in Nepal.</p>
      </div>
      <div className="footer-links">
        <h4>Quick Links</h4>
        <Link to="/vehicles">Browse Vehicles</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
      <div className="footer-links">
        <h4>Support</h4>
        <a href="mailto:sudiprijal7787@gmail.com">sudiprijal7787@gmail.com</a>
        <a href="tel:+9779825934448">+977 9825934448</a>
      </div>
      <div className="footer-links">
        <h4>Legal</h4>
        <span style={{fontSize:'12px',color:'var(--gray-500)'}}>Min. age: 18 yrs</span>
      </div>
    </div>
    <div className="footer-bottom">
      <p>© 2024 Rento – Simple Wheels Rental Platform. Built with React, Node.js & MySQL.</p>
    </div>
  </footer>
);

export default Footer;
