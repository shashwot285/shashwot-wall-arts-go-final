const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import database connection (PostgreSQL)
require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (images from wall_arts folder)
app.use('/images', express.static(path.join(__dirname, '../wall_arts')));

// Import routes
const artworkRoutes = require('./routes/artworkRoutes');
const artistRoutes = require('./routes/artistRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes'); // ⭐ NEW: Password reset routes

// Use routes
app.use('/api/artworks', artworkRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/password-reset', passwordResetRoutes); // ⭐ NEW: Password reset endpoint

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running with PostgreSQL database',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` Images available at http://localhost:${PORT}/images/`);
  console.log(`  PostgreSQL Database Connected`);
});