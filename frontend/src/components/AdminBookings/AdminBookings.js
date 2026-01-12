// frontend/src/components/AdminBookings/AdminBookings.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI, getImageURL } from '../../services/api';
import './AdminBookings.css';

function AdminBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // ⭐ NEW STATE: Filtering & Sorting
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // ⭐ NEW STATE: Confirmation Modal
  const [confirmationData, setConfirmationData] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) {
        navigate('/login');
        return;
      }

      if (user.role !== 'admin') {
        navigate('/my-bookings');
        return;
      }

      const response = await bookingAPI.getAllBookings();
      
      if (response.data && response.data.success) {
        const bookingsData = response.data.bookings || response.data.data || [];
        setBookings(bookingsData);
        setLoading(false);
      } else {
        setError('Failed to load bookings');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('user');
        navigate('/login');
      } else if (error.response?.status === 403) {
        navigate('/my-bookings');
      } else {
        setError(error.message || 'Failed to load bookings');
      }
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ⭐ MODIFIED: Open Confirmation Modal instead of immediate update
  const handleStatusChangeRequest = (bookingId, newStatus) => {
    setConfirmationData({
      bookingId,
      newStatus
    });
  };

  // ⭐ NEW: Actually perform the update after confirmation
  const confirmStatusUpdate = async () => {
    if (!confirmationData) return;

    const { bookingId, newStatus } = confirmationData;
    
    // Close modal immediately
    setConfirmationData(null);

    try {
      setUpdatingStatus(bookingId);
      console.log('🔄 Updating status for booking:', bookingId, 'to:', newStatus);
      
      const response = await bookingAPI.updateBookingStatus(bookingId, newStatus);
      
      if (response.data.success) {
        console.log('✅ Status updated successfully');
        
        setBookings(prevBookings =>
          prevBookings.map(booking =>
            booking.booking_id === bookingId
              ? { ...booking, status: newStatus }
              : booking
          )
        );
      }
    } catch (error) {
      console.error('❌ Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
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
  };

  const handleBookingClick = (booking) => {
    setSelectedBooking(selectedBooking?.booking_id === booking.booking_id ? null : booking);
  };

  // ⭐ NEW: Filter and Sort Logic
  const getFilteredAndSortedBookings = () => {
    let result = [...bookings];

    // 1. Filter
    if (filterStatus !== 'all') {
      result = result.filter(b => b.status === filterStatus);
    }

    // 2. Sort
    result.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  };

  const filteredBookings = getFilteredAndSortedBookings();

  if (loading) {
    return (
      <div className="admin-bookings-page">
        <div className="loading">Loading all bookings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-bookings-page">
        <div className="error-message">{error}</div>
        <button onClick={fetchBookings} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="admin-bookings-page">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Home
        </button>
        <h1>All Bookings</h1>
        <p className="subtitle">Manage all customer bookings</p>
      </div>

      {/* ⭐ NEW: Filters and Sort Controls */}
      <div className="filters-container">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('confirmed')}
          >
            Confirmed
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('completed')}
          >
            Completed
          </button>
          <button 
            className={`filter-tab ${filterStatus === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilterStatus('cancelled')}
          >
            Cancelled
          </button>
        </div>

        <div className="sort-controls">
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No Bookings Found</h2>
          <p>
            {filterStatus === 'all' 
              ? "No bookings have been made yet." 
              : `No ${filterStatus} bookings found.`}
          </p>
        </div>
      ) : (
        <div className="bookings-container">
          <div className="bookings-count">
            {filteredBookings.length} {filteredBookings.length === 1 ? 'Booking' : 'Bookings'}
          </div>
          
          <div className="bookings-list">
            {filteredBookings.map((booking) => {
              return (
                <div 
                  key={booking.booking_id} 
                  className={`booking-item ${selectedBooking?.booking_id === booking.booking_id ? 'active' : ''}`}
                >
                  <div className="booking-summary" onClick={() => handleBookingClick(booking)}>
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
                        <span className="booking-user">👤 {booking.username || booking.user_email}</span>
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
                      {/* Close Button */}
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

                      {/* Status Dropdown */}
                      <div className="status-update-section">
                        <label className="status-label">Update Status:</label>
                        <select
                          className="status-dropdown"
                          value={booking.status}
                          // ⭐ UPDATED: Call handleStatusChangeRequest instead of direct update
                          onChange={(e) => handleStatusChangeRequest(booking.booking_id, e.target.value)}
                          disabled={updatingStatus === booking.booking_id}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        {updatingStatus === booking.booking_id && (
                          <span className="updating-text">Updating...</span>
                        )}
                      </div>

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
                          <span className="detail-label">User Account</span>
                          <span className="detail-value">{booking.username || booking.user_email}</span>
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
                        
                        <div className="detail-item">
                          <span className="detail-label">Booking ID</span>
                          <span className="detail-value">#{booking.booking_id}</span>
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
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ⭐ NEW: Confirmation Modal */}
      {confirmationData && (
        <div className="confirmation-modal-overlay">
          <div className="confirmation-modal">
            <h3>Are you sure?</h3>
            <p>
              Do you want to change the status of this booking to <strong>{confirmationData.newStatus.toUpperCase()}</strong>?
            </p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setConfirmationData(null)}>
                Cancel
              </button>
              <button className="modal-btn confirm" onClick={confirmStatusUpdate}>
                Yes, Change it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBookings;