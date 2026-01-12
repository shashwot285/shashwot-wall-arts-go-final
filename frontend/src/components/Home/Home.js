import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { artworkAPI, artistAPI, getImageURL } from '../../services/api';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [artworksByArtist, setArtworksByArtist] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSort, setActiveSort] = useState('');
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const artistsResponse = await artistAPI.getAllArtists();
      const artistsData = artistsResponse.data.data;
      setArtists(artistsData);
      
      const artworksPromises = artistsData.map(artist =>
        artworkAPI.getArtworksByArtist(artist.artist_id)
      );
      
      const artworksResponses = await Promise.all(artworksPromises);
      
      const artworksMap = {};
      artistsData.forEach((artist, index) => {
        // ✅ REMOVED THE FILTER - Show ALL artworks now!
        artworksMap[artist.artist_id] = artworksResponses[index].data.data;
      });
      
      setArtworksByArtist(artworksMap);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleSort = async (sortType) => {
    try {
      setActiveSort(sortType);
      setShowPriceDropdown(false);
      
      const response = await artworkAPI.getAllArtworks(sortType);
      const sortedArtworks = response.data.data;
      
      const artworksMap = {};
      artists.forEach(artist => {
        // ✅ REMOVED THE FILTER - Show ALL artworks now!
        artworksMap[artist.artist_id] = sortedArtworks.filter(
          art => art.artist_id === artist.artist_id
        );
      });
      
      setArtworksByArtist(artworksMap);
    } catch (error) {
      console.error('Error sorting artworks:', error);
    }
  };

  const scrollSlider = (artistId, direction) => {
    const slider = document.getElementById(`slider-${artistId}`);
    if (slider) {
      slider.scrollBy({
        left: direction * 380,
        behavior: 'smooth'
      });
    }
  };

  const viewArtworkDetails = (artworkId) => {
    if (artworkId) {
      navigate(`/artwork/${artworkId}`);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{marginTop: '15px', fontWeight: '600'}}>Curating Collection...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="header">
        <h1>WALL ART GO</h1>
        <p>Curated Collection of Exceptional Artworks</p>
      </div>

      <div className="top-bar">
        <div className="sort-options">
          <span className="sort-label">Sort by:</span>
          
          <div className="dropdown">
            <button 
              className={`sort-btn ${activeSort.includes('price') ? 'active' : ''}`}
              onClick={() => setShowPriceDropdown(!showPriceDropdown)}
            >
              {activeSort === 'price_low' ? 'Price: Low to High' : 
               activeSort === 'price_high' ? 'Price: High to Low' : 
               'Price'} ▼
            </button>
            {showPriceDropdown && (
              <div className="dropdown-content">
                <button onClick={() => handleSort('price_low')}>Low to High</button>
                <button onClick={() => handleSort('price_high')}>High to Low</button>
              </div>
            )}
          </div>
          
          <button 
            className={`sort-btn ${activeSort === 'bestseller' ? 'active' : ''}`}
            onClick={() => handleSort('bestseller')}
          >
            Best Sellers
          </button>
          
          <button 
            className={`sort-btn ${activeSort === 'newest' ? 'active' : ''}`}
            onClick={() => handleSort('newest')}
          >
            Newest
          </button>
        </div>
      </div>

      <div className="artists-container">
        {artists.map((artist) => (
          <div key={artist.artist_id} className="artist-section">
            <div className="artist-header">
              <div className="artist-info">
                <h2>{artist.artist_name}</h2>
                <p className="artist-bio">{artist.bio}</p>
              </div>
              <button 
                className="view-profile-btn"
                onClick={() => navigate(`/artist/${artist.artist_id}`)}
              >
                View Profile →
              </button>
            </div>

            <div className="slider-container">
              <button 
                className="slider-arrow left"
                onClick={() => scrollSlider(artist.artist_id, -1)}
                aria-label="Scroll left"
              >
                ‹
              </button>

              <div className="artworks-slider" id={`slider-${artist.artist_id}`}>
                {artworksByArtist[artist.artist_id]?.map((artwork) => (
                  <div 
                    key={artwork.artwork_id} 
                    className="artwork-card"
                    onClick={() => viewArtworkDetails(artwork.artwork_id)}
                  >
                    <div className="artwork-image-container">
                      <img 
                        src={getImageURL(artwork.image_url)} 
                        alt={artwork.title}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x400?text=Image+Not+Found';
                        }}
                      />
                      {artwork.is_bestseller && (
                        <span className="bestseller-badge">Best Seller</span>
                      )}
                    </div>
                    <div className="artwork-info">
                      <h3>{artwork.title}</h3>
                      <p className="artwork-size">{artwork.wall_size}</p>
                      <p className="artwork-price">NPR {artwork.price.toLocaleString()}</p>
                      <button 
                        className="view-details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          viewArtworkDetails(artwork.artwork_id);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                className="slider-arrow right"
                onClick={() => scrollSlider(artist.artist_id, 1)}
                aria-label="Scroll right"
              >
                ›
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;