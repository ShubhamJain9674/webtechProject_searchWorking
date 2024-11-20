import React from 'react';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="homepage">
      <div className="hero-section">
        <h2 className="headline">Welcome to PriceScout</h2>
        <p className="subheadline">Track Amazon product prices and get alerts when prices drop!</p>
        <a href="/track" className="cta-button">Start Tracking Now</a>
      </div>
    </div>
  );
};

export default HomePage;
