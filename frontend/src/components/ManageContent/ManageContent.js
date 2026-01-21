// frontend/src/components/ManageContent/ManageContent.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { artistAPI, artworkAPI, getImageURL } from '../../services/api';
import './ManageContent.css';

function ManageContent() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('artists');
  const [artists, setArtists] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedArtistFilter, setSelectedArtistFilter] = useState('all');
  
  // Notification state
  const [notification, setNotification] = useState(null);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    message: '',
    onConfirm: null
  });
  
  // Form states
  const [showArtistForm, setShowArtistForm] = useState(false);
  const [showArtworkForm, setShowArtworkForm] = useState(false);
  const [editingArtist, setEditingArtist] = useState(null);
  const [editingArtwork, setEditingArtwork] = useState(null);
  
  // ⭐ NEW: Image upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [artistForm, setArtistForm] = useState({
    artist_name: '',
    bio: '',
    contact_email: '',
    phone: ''
  });
  
  const [artworkForm, setArtworkForm] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    image_url: '',
    artist_id: '',
    is_bestseller: false,
    wall_size: ''
  });

  // Notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Confirmation helper
  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ show: true, message, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    setConfirmDialog({ show: false, message: '', onConfirm: null });
  };

  const handleCancel = () => {
    setConfirmDialog({ show: false, message: '', onConfirm: null });
  };

  // Check admin access
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [navigate]);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching artists and artworks...');
      
      const [artistsRes, artworksRes] = await Promise.all([
        artistAPI.getAllArtists(),
        artworkAPI.getAllArtworks()
      ]);
      
      console.log('📦 Artists response:', artistsRes.data);
      console.log('📦 Artworks response:', artworksRes.data);
      
      const artistsData = artistsRes.data.data || artistsRes.data || [];
      const artworksData = artworksRes.data.data || artworksRes.data || [];
      
      console.log('✅ Artists loaded:', artistsData.length);
      console.log('✅ Artworks loaded:', artworksData.length);
      
      setArtists(artistsData);
      setArtworks(artworksData);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const getFilteredArtworks = () => {
    if (selectedArtistFilter === 'all') {
      return artworks;
    }
    return artworks.filter(artwork => artwork.artist_id === parseInt(selectedArtistFilter));
  };

  // ⭐ NEW: Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      console.log('📁 File selected:', file.name);
    }
  };

  // ⭐ NEW: Upload image to server
  const handleImageUpload = async () => {
    if (!selectedFile) {
      showNotification('Please select an image first', 'error');
      return;
    }

    try {
      setUploading(true);
      console.log('📤 Uploading image...');

      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await artworkAPI.uploadImage(formData);
      console.log('✅ Upload response:', response.data);

      const uploadedFilename = response.data.data.image_url;
      
      // Set the filename in the form
      setArtworkForm({ ...artworkForm, image_url: uploadedFilename });
      
      showNotification('Image uploaded successfully!', 'success');
      console.log('✅ Image filename set:', uploadedFilename);
      
      setUploading(false);
    } catch (error) {
      console.error('❌ Upload error:', error);
      showNotification(error.response?.data?.message || 'Failed to upload image', 'error');
      setUploading(false);
    }
  };

  // ========== ARTIST FUNCTIONS ==========
  
  const handleArtistSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('💾 Saving artist:', artistForm);
      
      let response;
      if (editingArtist) {
        response = await artistAPI.updateArtist(editingArtist.artist_id, artistForm);
        console.log('✅ Artist updated:', response.data);
        showNotification('Artist updated successfully!', 'success');
      } else {
        response = await artistAPI.createArtist(artistForm);
        console.log('✅ Artist created:', response.data);
        showNotification('Artist created successfully!', 'success');
      }
      
      await fetchData();
      
      setArtistForm({ artist_name: '', bio: '', contact_email: '', phone: '' });
      setEditingArtist(null);
      setShowArtistForm(false);
    } catch (error) {
      console.error('❌ Error saving artist:', error);
      showNotification(error.response?.data?.message || 'Failed to save artist', 'error');
    }
  };

  const handleEditArtist = (artist) => {
    console.log('✏️ Editing artist:', artist);
    setEditingArtist(artist);
    setArtistForm({
      artist_name: artist.artist_name,
      bio: artist.bio,
      contact_email: artist.contact_email,
      phone: artist.phone || ''
    });
    setShowArtistForm(true);
  };

  const handleDeleteArtist = (artistId) => {
    showConfirm(
      'Are you sure you want to delete this artist? This will fail if artist has artworks.',
      async () => {
        try {
          console.log('🗑️ Deleting artist:', artistId);
          await artistAPI.deleteArtist(artistId);
          console.log('✅ Artist deleted');
          
          await fetchData();
          showNotification('Artist deleted successfully!', 'success');
        } catch (error) {
          console.error('❌ Error deleting artist:', error);
          showNotification(error.response?.data?.message || 'Failed to delete artist', 'error');
        }
      }
    );
  };

  // ========== ARTWORK FUNCTIONS ==========
  
  const handleArtworkSubmit = async (e) => {
    e.preventDefault();
    
    // ⭐ MODIFIED: Check if image is uploaded
    if (!artworkForm.image_url) {
      showNotification('Please upload an image first', 'error');
      return;
    }
    
    try {
      console.log('💾 Saving artwork:', artworkForm);
      
      let response;
      if (editingArtwork) {
        response = await artworkAPI.updateArtwork(editingArtwork.artwork_id, artworkForm);
        console.log('✅ Artwork updated:', response.data);
        showNotification('Artwork updated successfully!', 'success');
      } else {
        response = await artworkAPI.createArtwork(artworkForm);
        console.log('✅ Artwork created:', response.data);
        showNotification('Artwork created successfully!', 'success');
      }
      
      await fetchData();
      
      // Reset form
      setArtworkForm({
        title: '',
        description: '',
        category: '',
        price: '',
        image_url: '',
        artist_id: '',
        is_bestseller: false,
        wall_size: ''
      });
      setSelectedFile(null);
      setImagePreview(null);
      setEditingArtwork(null);
      setShowArtworkForm(false);
    } catch (error) {
      console.error('❌ Error saving artwork:', error);
      showNotification(error.response?.data?.message || 'Failed to save artwork', 'error');
    }
  };

  const handleEditArtwork = (artwork) => {
    console.log('✏️ Editing artwork:', artwork);
    setEditingArtwork(artwork);
    setArtworkForm({
      title: artwork.title,
      description: artwork.description,
      category: artwork.category,
      price: artwork.price,
      image_url: artwork.image_url.replace('/wall_arts/', ''),
      artist_id: artwork.artist_id,
      is_bestseller: artwork.is_bestseller || false,
      wall_size: artwork.wall_size || ''
    });
    
    // Set preview to existing image
    setImagePreview(getImageURL(artwork.image_url));
    
    setShowArtworkForm(true);
  };

  const handleDeleteArtwork = (artworkId) => {
    showConfirm(
      'Are you sure you want to delete this artwork?',
      async () => {
        try {
          console.log('🗑️ Deleting artwork:', artworkId);
          await artworkAPI.deleteArtwork(artworkId);
          console.log('✅ Artwork deleted');
          
          await fetchData();
          showNotification('Artwork deleted successfully!', 'success');
        } catch (error) {
          console.error('❌ Error deleting artwork:', error);
          showNotification(error.response?.data?.message || 'Failed to delete artwork', 'error');
        }
      }
    );
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const filteredArtworks = getFilteredArtworks();

  return (
    <div className="manage-content-page">
      {/* Notification Toast */}
      {notification && (
        <div className={`popup-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="modal-overlay">
          <div className="confirm-dialog">
            <h3>Confirm Action</h3>
            <p>{confirmDialog.message}</p>
            <div className="dialog-actions">
              <button onClick={handleCancel} className="cancel-btn">
                Cancel
              </button>
              <button onClick={handleConfirm} className="confirm-btn">
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Home
        </button>
        <h1>Manage Content</h1>
        <p className="subtitle">Add, edit, or delete artists and artworks</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'artists' ? 'active' : ''}`}
          onClick={() => setActiveTab('artists')}
        >
          👨‍🎨 Artists ({artists.length})
        </button>
        <button
          className={`tab ${activeTab === 'artworks' ? 'active' : ''}`}
          onClick={() => setActiveTab('artworks')}
        >
          🖼️ Artworks ({artworks.length})
        </button>
      </div>

      {/* ARTISTS TAB */}
      {activeTab === 'artists' && (
        <div className="content-section">
          <div className="section-header">
            <h2>Artists</h2>
            <button
              className="add-button"
              onClick={() => {
                setShowArtistForm(!showArtistForm);
                setEditingArtist(null);
                setArtistForm({ artist_name: '', bio: '', contact_email: '', phone: '' });
              }}
            >
              {showArtistForm ? '✕ Cancel' : '+ Add Artist'}
            </button>
          </div>

          {showArtistForm && (
            <form className="content-form" onSubmit={handleArtistSubmit}>
              <h3>{editingArtist ? 'Edit Artist' : 'Add New Artist'}</h3>
              
              <div className="form-group">
                <label>Artist Name *</label>
                <input
                  type="text"
                  value={artistForm.artist_name}
                  onChange={(e) => setArtistForm({ ...artistForm, artist_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Bio *</label>
                <textarea
                  value={artistForm.bio}
                  onChange={(e) => setArtistForm({ ...artistForm, bio: e.target.value })}
                  required
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Contact Email *</label>
                <input
                  type="email"
                  value={artistForm.contact_email}
                  onChange={(e) => setArtistForm({ ...artistForm, contact_email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={artistForm.phone}
                  onChange={(e) => setArtistForm({ ...artistForm, phone: e.target.value })}
                />
              </div>

              <button type="submit" className="submit-button">
                {editingArtist ? 'Update Artist' : 'Create Artist'}
              </button>
            </form>
          )}

          <div className="items-list">
            {artists.map((artist) => (
              <div key={artist.artist_id} className="item-card">
                <div className="item-info">
                  <h3>{artist.artist_name}</h3>
                  <p className="item-bio">{artist.bio}</p>
                  <p className="item-meta">📧 {artist.contact_email}</p>
                  {artist.phone && <p className="item-meta">📞 {artist.phone}</p>}
                </div>
                <div className="item-actions">
                  <button onClick={() => handleEditArtist(artist)} className="edit-btn">
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDeleteArtist(artist.artist_id)} className="delete-btn">
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ARTWORKS TAB */}
      {activeTab === 'artworks' && (
        <div className="content-section">
          <div className="section-header">
            <h2>Artworks</h2>
            <div className="header-actions">
              <select
                className="artist-filter"
                value={selectedArtistFilter}
                onChange={(e) => setSelectedArtistFilter(e.target.value)}
              >
                <option value="all">All Artists ({artworks.length})</option>
                {artists.map((artist) => {
                  const count = artworks.filter(a => a.artist_id === artist.artist_id).length;
                  return (
                    <option key={artist.artist_id} value={artist.artist_id}>
                      {artist.artist_name} ({count})
                    </option>
                  );
                })}
              </select>

              <button
                className="add-button"
                onClick={() => {
                  setShowArtworkForm(!showArtworkForm);
                  setEditingArtwork(null);
                  setArtworkForm({
                    title: '',
                    description: '',
                    category: '',
                    price: '',
                    image_url: '',
                    artist_id: '',
                    is_bestseller: false,
                    wall_size: ''
                  });
                  setSelectedFile(null);
                  setImagePreview(null);
                }}
              >
                {showArtworkForm ? '✕ Cancel' : '+ Add Artwork'}
              </button>
            </div>
          </div>

          {showArtworkForm && (
            <form className="content-form" onSubmit={handleArtworkSubmit}>
              <h3>{editingArtwork ? 'Edit Artwork' : 'Add New Artwork'}</h3>
              
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={artworkForm.title}
                  onChange={(e) => setArtworkForm({ ...artworkForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={artworkForm.description}
                  onChange={(e) => setArtworkForm({ ...artworkForm, description: e.target.value })}
                  required
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <input
                    type="text"
                    value={artworkForm.category}
                    onChange={(e) => setArtworkForm({ ...artworkForm, category: e.target.value })}
                    required
                    placeholder="e.g., Abstract, Landscape"
                  />
                </div>

                <div className="form-group">
                  <label>Price (NPR) *</label>
                  <input
                    type="number"
                    value={artworkForm.price}
                    onChange={(e) => setArtworkForm({ ...artworkForm, price: e.target.value })}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Wall Size</label>
                <select
                  value={artworkForm.wall_size}
                  onChange={(e) => setArtworkForm({ ...artworkForm, wall_size: e.target.value })}
                >
                  <option value="">Select size (optional)</option>
                  <option value="Small (2x3 ft)">Small (2x3 ft)</option>
                  <option value="Medium (3x4 ft)">Medium (3x4 ft)</option>
                  <option value="Large (4x5 ft)">Large (4x5 ft)</option>
                  <option value="Extra Large (5x6 ft)">Extra Large (5x6 ft)</option>
                </select>
              </div>

              {/* ⭐ NEW: Image Upload Section */}
              <div className="form-group">
                <label>Artwork Image *</label>
                <div className="image-upload-section">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    id="image-input"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="image-input" className="file-select-btn">
                    📁 Choose Image
                  </label>
                  
                  {selectedFile && (
                    <span className="file-name">{selectedFile.name}</span>
                  )}
                  
                  {selectedFile && !artworkForm.image_url && (
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={uploading}
                      className="upload-btn"
                    >
                      {uploading ? '⏳ Uploading...' : '📤 Upload'}
                    </button>
                  )}
                  
                  {artworkForm.image_url && (
                    <span className="success-indicator">✅ Uploaded: {artworkForm.image_url}</span>
                  )}
                </div>
                
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Artist *</label>
                <select
                  value={artworkForm.artist_id}
                  onChange={(e) => setArtworkForm({ ...artworkForm, artist_id: e.target.value })}
                  required
                >
                  <option value="">Select an artist</option>
                  {artists.map((artist) => (
                    <option key={artist.artist_id} value={artist.artist_id}>
                      {artist.artist_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={artworkForm.is_bestseller}
                    onChange={(e) => setArtworkForm({ ...artworkForm, is_bestseller: e.target.checked })}
                  />
                  Mark as Bestseller
                </label>
              </div>

              <button type="submit" className="submit-button" disabled={uploading}>
                {editingArtwork ? 'Update Artwork' : 'Create Artwork'}
              </button>
            </form>
          )}

          <div className="items-list">
            {filteredArtworks.length === 0 ? (
              <div className="empty-state">
                No artworks found for this artist.
              </div>
            ) : (
              filteredArtworks.map((artwork) => (
                <div key={artwork.artwork_id} className="item-card artwork-card">
                  <img
                    src={getImageURL(artwork.image_url)}
                    alt={artwork.title}
                    className="artwork-thumbnail"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100x120?text=No+Image';
                    }}
                  />
                  <div className="item-info">
                    <h3>{artwork.title}</h3>
                    <p className="item-artist">by {artwork.artist_name}</p>
                    <p className="item-meta">{artwork.category} • NPR {artwork.price?.toLocaleString()}</p>
                    {artwork.is_bestseller && <span className="bestseller-badge">⭐ Bestseller</span>}
                  </div>
                  <div className="item-actions">
                    <button onClick={() => handleEditArtwork(artwork)} className="edit-btn">
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDeleteArtwork(artwork.artwork_id)} className="delete-btn">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageContent;