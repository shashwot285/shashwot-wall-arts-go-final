const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateToken } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authenticateToken);

// Routes - SPECIFIC ROUTES FIRST!
router.get('/all-bookings', bookingController.getAllBookings);
router.get('/my-bookings', bookingController.getUserBookings);
router.post('/', bookingController.createBooking);
router.patch('/:id/status', bookingController.updateBookingStatus); // Admin only
router.patch('/:id/cancel', bookingController.cancelOwnBooking); // ⭐ NEW: User cancel
router.get('/:id', bookingController.getBookingById);

module.exports = router;