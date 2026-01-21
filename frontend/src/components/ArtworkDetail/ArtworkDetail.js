import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { artworkAPI, getImageURL } from '../../services/api';
import './ArtworkDetail.css';

function ArtworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const fetchArtwork = useCallback(async () => {
    try {
      setLoading(true);
      const response = await artworkAPI.getArtworkById(id);
      setArtwork(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching artwork:', error);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchArtwork();
    }
  }, [id, fetchArtwork]);

  const handleBookNow = () => {
    setShowBookingModal(true);
  };

  const handleViewArtist = () => {
    if (artwork && artwork.artist_id) {
      navigate(`/artist/${artwork.artist_id}`);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading artwork details...</p>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="error-container">
        <h2>Artwork not found</h2>
        <p>The artwork you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/')}>Go Back Home</button>
      </div>
    );
  }

  return (
    <div className="artwork-detail-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="artwork-content">
        <div className="artwork-image-section">
          <img 
            src={getImageURL(artwork.image_url)} 
            alt={artwork.title}
            className="artwork-main-image"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/500x600?text=Image+Not+Found';
            }}
          />
          {artwork.is_bestseller && (
            <div className="bestseller-badge">⭐ Best Seller</div>
          )}
        </div>

        <div className="artwork-info-section">
          <h1 className="artwork-title">{artwork.title}</h1>
          
          <div className="artist-badge" onClick={handleViewArtist}>
            <span className="artist-label">By</span>
            <span className="artist-name-link">{artwork.artist_name}</span>
          </div>

          <div className="price-section">
            <span className="price-label">Price:</span>
            <span className="price-amount">NPR {artwork.price ? artwork.price.toLocaleString() : '0'}</span>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Category:</span>
              <span className="info-value">{artwork.category || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Wall Size:</span>
              <span className="info-value">{artwork.wall_size || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Views:</span>
              <span className="info-value">{artwork.views || 0} views</span>
            </div>
          </div>

          {artwork.description && (
            <div className="description-section">
              <h3>Description</h3>
              <p>{artwork.description}</p>
            </div>
          )}

          <div className="artist-contact-section">
            <h3>Artist Contact</h3>
            <p><strong>Email:</strong> {artwork.artist_email || 'N/A'}</p>
            {artwork.artist_phone && <p><strong>Phone:</strong> {artwork.artist_phone}</p>}
          </div>

          <button className="book-now-btn" onClick={handleBookNow}>
            Book Artist Consultation
          </button>
        </div>
      </div>

      {showBookingModal && (
        <BookingModal 
          artwork={artwork}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
}

function BookingModal({ artwork, onClose }) {
  const navigate = useNavigate();
  
  // ⭐ ONLY CHANGE: Check if user is authenticated
  const user = localStorage.getItem('user');
  const isAuthenticated = !!user;

  const handleLogin = () => {
    onClose();
    navigate(`/login?redirect=${encodeURIComponent(`/booking/${artwork.artwork_id}`)}`);
  };

  const handleSignup = () => {
    onClose();
    navigate(`/signup?redirect=${encodeURIComponent(`/booking/${artwork.artwork_id}`)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate(`/booking/${artwork.artwork_id}`);
  };

  // ⭐ ONLY CHANGE: Show auth required modal if not logged in
  if (!isAuthenticated) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          
          <h2>🔐 Account Required</h2>
          <p className="modal-subtitle">You need an account to book this artwork</p>

          <p className="modal-info" style={{margin: '20px 0', lineHeight: '1.5'}}>
            To book <strong>{artwork.title}</strong> for <strong>NPR {artwork.price?.toLocaleString()}</strong>, please login to your existing account or create a new one.
          </p>

          <div className="modal-actions" style={{flexDirection: 'column', gap: '10px'}}>
            <button 
              type="button" 
              className="submit-btn" 
              onClick={handleLogin}
              style={{width: '100%'}}
            >
              Login to Existing Account
            </button>
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={handleSignup}
              style={{width: '100%', background: 'white', color: '#667eea', border: '2px solid #667eea'}}
            >
              Create New Account
            </button>
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={onClose}
              style={{width: '100%', marginTop: '10px'}}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ⭐ UNCHANGED: Original modal for authenticated users
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2>Book Consultation</h2>
        <p className="modal-subtitle">Schedule a meeting with {artwork.artist_name}</p>

        <form onSubmit={handleSubmit}>
          <p className="modal-info" style={{margin: '20px 0', lineHeight: '1.5'}}>
            Click "Continue to Booking" to proceed with booking <strong>{artwork.title}</strong> for <strong>NPR {artwork.price?.toLocaleString()}</strong>
          </p>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Continue to Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ArtworkDetail;