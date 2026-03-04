// frontend/src/components/MyBookings/MyBookings.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI, getImageURL } from '../../services/api';
import './MyBookings.css';

function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // ⭐ NEW: Notification and confirmation states
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    message: '',
    onConfirm: null
  });

  // ⭐ NEW: Notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ⭐ NEW: Confirmation helper
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

  const fetchBookings = useCallback(async () => {
    try {
      console.log('==========================================');
      console.log('📚 FETCHING BOOKINGS FROM BACKEND');
      
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('👤 Current user:', user);

      if (!user || !user.token) {
        console.log('❌ No user or token found');
        navigate('/login');
        return;
      }

      const response = await bookingAPI.getUserBookings();
      
      console.log('📦 RAW RESPONSE:', response);
      console.log('📦 RESPONSE.DATA:', response.data);
      
      if (response.data && response.data.success) {
        const bookingsData = response.data.bookings || response.data.data || [];
        console.log('✅ BOOKINGS DATA:', bookingsData);
        console.log('✅ BOOKINGS LENGTH:', bookingsData.length);
        console.log('✅ IS ARRAY?', Array.isArray(bookingsData));
        
        setBookings(bookingsData);
        setLoading(false);
        
        console.log('✅ STATE UPDATED - Bookings count:', bookingsData.length);
      } else {
        console.log('❌ Response success was false');
        setError('Failed to load bookings');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ ERROR FETCHING BOOKINGS:', error);
      console.error('❌ ERROR RESPONSE:', error.response);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        setError(error.message || 'Failed to load bookings');
      }
      
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ⭐ NEW: Cancel booking function
  const handleCancelBooking = (bookingId) => {
    showConfirm(
      'Are you sure you want to cancel this booking?',
      async () => {
        try {
          console.log('🚫 Cancelling booking:', bookingId);
          await bookingAPI.cancelBooking(bookingId);
          
          showNotification('Booking cancelled successfully!', 'success');
          await fetchBookings(); // Refresh bookings
        } catch (error) {
          console.error('❌ Error cancelling booking:', error);
          showNotification(error.response?.data?.message || 'Failed to cancel booking', 'error');
        }
      }
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      completed: '#10b981',
      cancelled: '#ef4444'
    };
    return colors[status?.toLowerCase()] || colors.pending;
  };//test

  const handleBookingClick = (booking) => {
    console.log('🔘 Booking clicked:', booking.booking_id);
    setSelectedBooking(selectedBooking?.booking_id === booking.booking_id ? null : booking);
  };

  console.log('🎨 RENDERING MyBookings Component');
  console.log('🎨 Current bookings state:', bookings);
  console.log('🎨 Bookings length:', bookings.length);
  console.log('🎨 Loading:', loading);
  console.log('🎨 Error:', error);

  if (loading) {
    return (
      <div className="my-bookings-page">
        <div className="loading">Loading your bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-bookings-page">
        <div className="error-message">{error}</div>
        <button onClick={fetchBookings} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  const hasBookings = Array.isArray(bookings) && bookings.length > 0;
  console.log('🎨 hasBookings:', hasBookings);

  return (
    <div className="my-bookings-page">
      {/* ⭐ NEW: Notification Toast */}
      {notification && (
        <div className={`popup-notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* ⭐ NEW: Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="modal-overlay">
          <div className="confirm-dialog">
            <h3>Confirm Cancellation</h3>
            <p>{confirmDialog.message}</p>
            <div className="dialog-actions">
              <button onClick={handleCancel} className="cancel-btn">
                No, Keep It
              </button>
              <button onClick={handleConfirm} className="confirm-btn">
                Yes, Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Home
        </button>
        <h1>My Bookings</h1>
        <p className="subtitle">Manage your artwork bookings</p>
      </div>

      {!hasBookings ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No Bookings Yet</h2>
          <p>You haven't made any bookings. Explore our collection and book your favorite artwork!</p>
          <button onClick={() => navigate('/')} className="browse-btn">
            Browse Artworks
          </button>
        </div>
      ) : (
        <div className="bookings-container">
          <div className="bookings-count">
            {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'}
          </div>
          
          <div className="bookings-list">
            {bookings.map((booking, index) => {
              console.log(`🎨 Rendering booking ${index + 1}:`, booking);
              return (
                <div 
                  key={booking.booking_id} 
                  className={`booking-item ${selectedBooking?.booking_id === booking.booking_id ? 'active' : ''}`}
                  onClick={() => handleBookingClick(booking)}
                >
                  <div className="booking-summary">
                    <div className="booking-image">
                      <img
                        src={getImageURL(booking.image_url)}
                        alt={booking.artwork_title || 'Artwork'}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/80x100?text=No+Image';
                        }}
                      />
                    </div>

                    <div className="booking-info">
                      <h3 className="booking-title">{booking.artwork_title || 'Untitled Artwork'}</h3>
                      <p className="booking-artist">by {booking.artist_name || 'Unknown Artist'}</p>
                      <div className="booking-meta">
                        <span className="booking-id">#{booking.booking_id}</span>
                        <span className="booking-date">{formatDate(booking.created_at)}</span>
                      </div>
                    </div>

                    <div className="booking-right">
                      <span 
                        className="booking-status"
                        style={{ backgroundColor: getStatusColor(booking.status) }}
                      >
                        {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending'}
                      </span>
                      <span className="booking-amount">NPR {booking.total_amount?.toLocaleString() || '0'}</span>
                      <span className="expand-icon">{selectedBooking?.booking_id === booking.booking_id ? '▼' : '▶'}</span>
                    </div>
                  </div>

                  {selectedBooking?.booking_id === booking.booking_id && (
                    <div className="booking-details">
                      <button 
                        className="close-details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(null);
                        }}
                        title="Close details"
                      >
                        ✕
                      </button>

                      <div className="details-grid">
                        <div className="detail-item">
                          <span className="detail-label">Customer Name</span>
                          <span className="detail-value">{booking.customer_name}</span>
                        </div>
                        
                        <div className="detail-item">
                          <span className="detail-label">Email</span>
                          <span className="detail-value">{booking.email}</span>
                        </div>
                        
                        <div className="detail-item">
                          <span className="detail-label">Phone</span>
                          <span className="detail-value">{booking.phone}</span>
                        </div>
                        
                        <div className="detail-item">
                          <span className="detail-label">Preferred Date</span>
                          <span className="detail-value">{formatDate(booking.preferred_date)}</span>
                        </div>
                        
                        <div className="detail-item">
                          <span className="detail-label">Preferred Time</span>
                          <span className="detail-value">{booking.preferred_time || 'N/A'}</span>
                        </div>
                        
                        <div className="detail-item">
                          <span className="detail-label">Booked On</span>
                          <span className="detail-value">{formatDate(booking.created_at)}</span>
                        </div>
                        
                        <div className="detail-item full-width">
                          <span className="detail-label">Delivery Address</span>
                          <span className="detail-value">{booking.delivery_address}</span>
                        </div>
                        
                        {booking.special_instructions && (
                          <div className="detail-item full-width">
                            <span className="detail-label">Special Instructions</span>
                            <span className="detail-value">{booking.special_instructions}</span>
                          </div>
                        )}

                        {/* ⭐ NEW: Cancel Button (only for pending bookings) */}
                        {booking.status?.toLowerCase() === 'pending' && (
                          <div className="detail-item full-width">
                            <button 
                              className="cancel-booking-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelBooking(booking.booking_id);
                              }}
                            >
                              🚫 Cancel Booking
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyBookings;