// frontend/src/components/SplashScreen/SplashScreen.js

import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1.67; // Adjusted for 3 seconds (100 / 60 steps)
      });
    }, 50);

    // Auto-hide after 3 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [onFinish]);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        {/* Artwork Frames */}
        <div className="artwork-frames">
          <div className="frame">
            <img src="/wall_arts/img1.png" alt="Artwork 1" />
          </div>
          <div className="frame">
            <img src="/wall_arts/4_2.png" alt="Artwork 2" />
          </div>
          <div className="frame">
            <img src="/wall_arts/img6_4.jpg" alt="Artwork 3" />
          </div>
        </div>

        {/* Logo */}
        <h1 className="splash-logo">WALL ART GO</h1>

        {/* Tagline */}
        <p className="splash-tagline">"Transform Your Space With Art"</p>

        {/* Features */}
        <div className="splash-features">
          <div className="feature-item">• Browse Artworks</div>
          <div className="feature-item">• Book Artists</div>
          <div className="feature-item">• Customize Your Order</div>
        </div>

        {/* Progress Dots */}
        <div className="progress-dots">
          <span className={`dot ${progress > 0 ? 'active' : ''}`}></span>
          <span className={`dot ${progress > 25 ? 'active' : ''}`}></span>
          <span className={`dot ${progress > 50 ? 'active' : ''}`}></span>
          <span className={`dot ${progress > 75 ? 'active' : ''}`}></span>
          <span className={`dot ${progress > 90 ? 'active' : ''}`}></span>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;