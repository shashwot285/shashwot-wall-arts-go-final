// backend/controllers/bookingController.js

const Booking = require('../models/Booking');

// Create new booking
exports.createBooking = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('📝 CREATE BOOKING CALLED');
    console.log('👤 User from token:', req.user);
    console.log('👤 User ID:', req.user.userId);
    console.log('📦 Request body:', req.body);
    
    const {
      artwork_id,
      customer_name,
      email,
      phone,
      preferred_date,
      preferred_time,
      delivery_address,
      special_instructions,
      total_amount
    } = req.body;

    // Validate required fields
    if (!artwork_id || !customer_name || !email || !phone || !preferred_date || !delivery_address) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Prepare booking data
    const bookingData = {
      user_id: req.user.userId,
      artwork_id: parseInt(artwork_id),
      customer_name,
      email,
      phone,
      preferred_date,
      preferred_time,
      delivery_address,
      special_instructions: special_instructions || null,
      total_amount: parseFloat(total_amount)
    };

    console.log('📋 Final booking data to insert:', bookingData);

    const bookingId = await Booking.create(bookingData);
    
    console.log('✅ Booking created successfully with ID:', bookingId);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking_id: bookingId
      }
    });
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('📚 GET USER BOOKINGS CALLED');
    console.log('👤 User from token:', req.user);
    console.log('👤 User ID:', req.user.userId);
    
    const bookings = await Booking.getByUser(req.user.userId);
    
    console.log('📊 Bookings found:', bookings.length);
    console.log('📦 Bookings data:', bookings);
    console.log('🔥 SENDING RESPONSE WITH DATA KEY');

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// Get single booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 GET BOOKING BY ID:', id);
    console.log('👤 User ID:', req.user.userId);

    const bookings = await Booking.getByUser(req.user.userId);
    const booking = bookings.find(b => b.booking_id === parseInt(id));

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('❌ Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
};

// GET ALL BOOKINGS (ADMIN ONLY)
exports.getAllBookings = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('👑 GET ALL BOOKINGS (ADMIN) CALLED');
    console.log('👤 User from token:', req.user);
    console.log('🔐 User Role:', req.user.role);
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log('❌ Access denied - User is not admin');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const bookings = await Booking.getAllBookings();
    
    console.log('📊 Total bookings found:', bookings.length);

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('❌ Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
};

// UPDATE BOOKING STATUS (ADMIN ONLY)
exports.updateBookingStatus = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('🔄 UPDATE BOOKING STATUS CALLED');
    console.log('👤 User from token:', req.user);
    console.log('🔐 User Role:', req.user.role);
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log('❌ Access denied - User is not admin');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('📝 Booking ID:', id);
    console.log('📝 New Status:', status);
    
    // Validate status
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, confirmed, completed, or cancelled'
      });
    }
    
    const updatedBooking = await Booking.updateStatus(parseInt(id), status);
    
    console.log('✅ Booking status updated successfully');
    
    res.status(200).json({
      success: true,
      message: 'Booking status updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('❌ Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
};

// ⭐ NEW: CANCEL OWN BOOKING (USER)
exports.cancelOwnBooking = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('🚫 CANCEL OWN BOOKING CALLED');
    console.log('👤 User ID:', req.user.userId);
    console.log('📝 Booking ID:', req.params.id);
    
    const bookingId = parseInt(req.params.id);
    
    // Get booking to verify ownership and status
    const bookings = await Booking.getByUser(req.user.userId);
    const booking = bookings.find(b => b.booking_id === bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to cancel it'
      });
    }
    
    // Only allow cancelling pending bookings
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status: ${booking.status}. Only pending bookings can be cancelled.`
      });
    }
    
    const updatedBooking = await Booking.updateStatus(bookingId, 'cancelled');
    
    console.log('✅ Booking cancelled successfully by user');
    
    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: updatedBooking
    });
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};