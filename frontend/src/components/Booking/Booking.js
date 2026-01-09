// frontend/src/components/Booking/Booking.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { artworkAPI, bookingAPI, getImageURL } from '../../services/api';
import './Booking.css';

function Booking() {
  const { artworkId } = useParams();
  const navigate = useNavigate();
  
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    preferred_date: '',
    preferred_time: '',
    delivery_address: '',
    special_instructions: ''
  });

  // Fetch artwork details
  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        console.log('🎨 Fetching artwork details for ID:', artworkId);
        const response = await artworkAPI.getArtworkById(artworkId);
        console.log('✅ Artwork loaded:', response.data);
        setArtwork(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('❌ Error fetching artwork:', error);
        setError('Failed to load artwork details');
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [artworkId]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      console.log('==========================================');
      console.log('📝 SUBMITTING BOOKING');
      
      // Get user data from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('👤 Current user:', {
        user_id: user?.user_id,
        email: user?.email,
        hasToken: !!user?.token
      });

      if (!user || !user.token) {
        throw new Error('User not authenticated. Please login again.');
      }

      // Prepare booking data
      const bookingData = {
        artwork_id: parseInt(artworkId),
        customer_name: formData.customer_name,
        email: formData.email,
        phone: formData.phone,
        preferred_date: formData.preferred_date,
        preferred_time: formData.preferred_time,
        delivery_address: formData.delivery_address,
        special_instructions: formData.special_instructions,
        total_amount: parseFloat(artwork.price)
      };

      console.log('📦 Booking data to send:', bookingData);

      // Submit booking
      const response = await bookingAPI.createBooking(bookingData);
      
      console.log('✅ Booking response:', response.data);

      if (response.data.success) {
        console.log('🎉 Booking successful! Booking ID:', response.data.data.booking_id);
        
        // Create custom success popup
        const popup = document.createElement('div');
        popup.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 2rem 3rem;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          z-index: 10000;
          text-align: center;
          min-width: 400px;
        `;
        popup.innerHTML = `
          <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
          <h2 style="margin: 0 0 0.5rem 0; color: #1f2937; font-size: 1.5rem;">Booking Complete!</h2>
          <p style="color: #6b7280; margin: 0 0 1.5rem 0;">Redirecting to My Bookings...</p>
        `;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 9999;
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(popup);
        
        setTimeout(() => {
          document.body.removeChild(overlay);
          document.body.removeChild(popup);
          navigate('/my-bookings');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Booking failed');
      }
    } catch (error) {
      console.error('❌ Booking error:', error);
      
      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('user');
          navigate('/login');
        }, 2000);
      } else {
        setError(
          error.response?.data?.message || 
          error.message || 
          'Failed to create booking. Please try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading artwork details...</div>;
  }

  if (error && !artwork) {
    return <div className="error">{error}</div>;
  }

  if (!artwork) {
    return <div className="error">Artwork not found</div>;
  }

  return (
    <div className="booking-container">
      {/* ⭐ BACK BUTTON */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>
      </div>

      <div className="booking-content">
        {/* ⭐ SIMPLIFIED: Just Image and Price Tag */}
        <div className="artwork-preview">
          <img 
            src={getImageURL(artwork.image_url)} 
            alt={artwork.title}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x500?text=Image+Not+Found';
            }}
          />
          <div className="price-tag">
            NPR {artwork.price?.toLocaleString()}
          </div>
        </div>

        {/* Booking Form */}
        <div className="booking-form-section">
          <h1>Complete Your Booking</h1>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Preferred Date *</label>
                <input
                  type="date"
                  name="preferred_date"
                  value={formData.preferred_date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Preferred Time *</label>
                <input
                  type="time"
                  name="preferred_time"
                  value={formData.preferred_time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Delivery Address *</label>
              <textarea
                name="delivery_address"
                value={formData.delivery_address}
                onChange={handleChange}
                required
                placeholder="Enter your complete delivery address"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Special Instructions (Optional)</label>
              <textarea
                name="special_instructions"
                value={formData.special_instructions}
                onChange={handleChange}
                placeholder="Any special instructions for delivery or installation?"
                rows="3"
              />
            </div>

            <button 
              type="submit" 
              className="submit-booking-btn"
              disabled={submitting}
            >
              {submitting ? 'Processing...' : 'Continue Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Booking;