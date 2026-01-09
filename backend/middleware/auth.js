// backend/middleware/auth.js

const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  console.log('==========================================');
  console.log('🔐 AUTH MIDDLEWARE TRIGGERED');
  console.log('📍 Route:', req.method, req.originalUrl);
  
  // Get token from header
  const token = req.header('x-auth-token');
  
  console.log('🔑 Token in header:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

  // Check if token exists
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
    
    console.log('✅ Token verified successfully');
    console.log('👤 Decoded token payload:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });
    
    // Add user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    console.log('✅ User attached to request:', req.user);
    
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

module.exports = { authenticateToken };