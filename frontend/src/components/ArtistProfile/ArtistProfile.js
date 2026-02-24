import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { artistAPI, artworkAPI, getImageURL } from '../../services/api';
import './ArtistProfile.css';

function ArtistProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchArtistData = useCallback(async () => {
    try {
      setLoading(true);
      
      const artistResponse = await artistAPI.getArtistById(id);
      setArtist(artistResponse.data.data);
      
      const artworksResponse = await artworkAPI.getArtworksByArtist(id);
      setArtworks(artworksResponse.data.data.filter(art => art.artwork_id !== 20));
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching artist:', error);
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArtistData();
  }, [fetchArtistData]);

  const getFilteredArtworks = () => {
    switch(activeFilter) {
      case 'bestseller':
        return artworks.filter(art => art.is_bestseller);
      case 'price_low':
        return [...artworks].sort((a, b) => a.price - b.price);
      case 'price_high':
        return [...artworks].sort((a, b) => b.price - a.price);
      default:
        return artworks;
    }
  };

  const filteredArtworks = getFilteredArtworks();
  const totalViews = artworks.reduce((sum, art) => sum + art.views, 0);
  const bestsellerCount = artworks.filter(art => art.is_bestseller).length;
  const avgPrice = artworks.length > 0 
  ? artworks.reduce((sum, art) => sum + (parseFloat(art.price) || 0), 0) / artworks.length 
  : 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading artist profile...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="error-container">
        <h2>Artist not found</h2>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="artist-profile-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {/* Artist Header */}
      <div className="artist-header">
        <div className="artist-avatar">
          {artist.artist_name.charAt(0)}
        </div>
        <div className="artist-info">
          <h1>{artist.artist_name}</h1>
          <p className="artist-bio">{artist.bio}</p>
          <div className="artist-contact">
            <div className="contact-item">
              <span className="contact-icon">📧</span>
              <span>{artist.contact_email}</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📱</span>
              <span>{artist.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="artist-stats">
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-value">{artworks.length}</div>
          <div className="stat-label">Total Artworks</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-value">{bestsellerCount}</div>
          <div className="stat-label">Best Sellers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-value">{totalViews}</div>
          <div className="stat-label">Total Views</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"></div>
          <div className="stat-value">NPR {Math.round(avgPrice).toLocaleString()}</div>
          <div className="stat-label">Avg. Price</div>
        </div>
      </div>

      {/* Artworks Collection */}
      <div className="artworks-collection">
        <h2>Artworks Collection</h2>
        
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All ({artworks.length})
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'bestseller' ? 'active' : ''}`}
            onClick={() => setActiveFilter('bestseller')}
          >
            Best Sellers ({bestsellerCount})
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'price_low' ? 'active' : ''}`}
            onClick={() => setActiveFilter('price_low')}
          >
            Price: Low to High
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'price_high' ? 'active' : ''}`}
            onClick={() => setActiveFilter('price_high')}
          >
            Price: High to Low
          </button>
        </div>

        {filteredArtworks.length === 0 ? (
          <div className="no-artworks">No artworks found</div>
        ) : (
          <div className="artworks-grid">
            {filteredArtworks.map(artwork => (
              <div 
                key={artwork.artwork_id}
                className="artwork-card"
                onClick={() => navigate(`/artwork/${artwork.artwork_id}`)}
              >
                <div className="artwork-image">
                  <img 
                    src={getImageURL(artwork.image_url)} 
                    alt={artwork.title}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/350x400?text=Image+Not+Found';
                    }}
                  />
                  {artwork.is_bestseller && (
                    <span className="bestseller-badge">⭐ Best Seller</span>
                  )}
                </div>
                <div className="artwork-info">
                  <h3>{artwork.title}</h3>
                  <p className="artwork-category">{artwork.category}</p>
                  <div className="artwork-footer">
                    <span className="artwork-price">NPR {artwork.price.toLocaleString()}</span>
                    <span className="artwork-views">{artwork.views} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArtistProfile;