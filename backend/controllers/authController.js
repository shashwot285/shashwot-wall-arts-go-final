// backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name, phone, securityQuestion, securityAnswer } = req.body;
    
    console.log('📝 Registration attempt:', { username, email, full_name, phone, securityQuestion });
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password'
      });
    }

    // ⭐ IMPORTANT: Validate security question fields
    if (!securityQuestion || !securityAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Please select a security question and provide an answer'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create new user
    const newUser = await User.create({ username, email, password, full_name, phone });
    console.log('✅ User created:', newUser);

    // ⭐ IMPORTANT: Add security question for ALL new users
    const hashedAnswer = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10);
    await db.query(
      'UPDATE users SET security_question = $1, security_answer = $2 WHERE user_id = $3',
      [securityQuestion, hashedAnswer, newUser.user_id]
    );
    console.log('✅ Security question added for:', email);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.user_id,
        email: newUser.email,
        role: newUser.role || 'user'
      }, 
      process.env.JWT_SECRET || 'your-secret-key-here', 
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user_id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name,
        phone: newUser.phone,
        role: newUser.role || 'user',
        token: token
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Login user (NO CHANGES - kept exactly as is)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:', email);
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isMatch = await User.verifyPassword(password, user.password_hash);
    if (!isMatch) {
      console.log('❌ Invalid password for:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.user_id,
        email: user.email,
        role: user.role || 'user'
      }, 
      process.env.JWT_SECRET || 'your-secret-key-here', 
      { expiresIn: '7d' }
    );
    
    console.log('✅ Login successful:', email);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role || 'user',
        token: token
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};