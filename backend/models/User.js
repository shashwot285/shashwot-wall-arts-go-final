const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(data) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      
      // FIXED: Return the entire user object, not just user_id
      const result = await db.query(
        `INSERT INTO users (username, email, password_hash, full_name, phone, role) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING user_id, username, email, full_name, phone, role, created_at`,
        [
          data.username, 
          data.email, 
          hashedPassword, 
          data.full_name || null, 
          data.phone || null,
          'user'  // Default role
        ]
      );
      
      return result.rows[0];  // Return full user object
    } catch (error) {
      console.error('Error in User.create:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1', 
        [email]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in User.findByEmail:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await db.query(
        'SELECT user_id, username, email, full_name, phone, role, created_at FROM users WHERE user_id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in User.findById:', error);
      throw error;
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Error in User.verifyPassword:', error);
      throw error;
    }
  }
}

module.exports = User;