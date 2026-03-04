// backend/models/Booking.js

const pool = require('../config/database');

class Booking {
  static async create(data) {
    try {
      console.log('💾 BOOKING MODEL - CREATE METHOD');
      console.log('📥 Data received:', data);
      
      const query = `
        INSERT INTO bookings (
          user_id, artwork_id, customer_name, email, phone, 
          preferred_date, preferred_time, delivery_address, 
          special_instructions, total_amount, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING booking_id
      `;
      
      const values = [
        data.user_id,
        data.artwork_id,
        data.customer_name,
        data.email,
        data.phone,
        data.preferred_date,
        data.preferred_time,
        data.delivery_address,
        data.special_instructions || null,
        data.total_amount,
        'pending'
      ];

      console.log('📝 SQL Query:', query);
      console.log('📝 SQL Values:', values);

      const result = await pool.query(query, values);
      
      console.log('✅ SQL Result:', result.rows);
      console.log('✅ Booking ID:', result.rows[0].booking_id);
      
      return result.rows[0].booking_id;
    } catch (error) {
      console.error('❌ BOOKING MODEL - SQL Insert Error:', error.message);
      console.error('❌ Full error:', error);
      throw error;
    }
  }

  static async getByUser(userId) {
    try {
      console.log('🔍 BOOKING MODEL - GET BY USER METHOD');
      console.log('👤 User ID:', userId);
      
      const query = `
        SELECT 
          b.*,
          a.title AS artwork_title, 
          a.image_url,
          ar.artist_name
        FROM bookings b
        LEFT JOIN artworks a ON b.artwork_id = a.artwork_id
        LEFT JOIN artists ar ON a.artist_id = ar.artist_id
        WHERE b.user_id = $1
        ORDER BY b.created_at DESC
      `;
      
      console.log('📝 SQL Query:', query);
      console.log('📝 SQL Value:', [userId]);
      
      const result = await pool.query(query, [userId]);
      
      console.log('✅ SQL Result rows count:', result.rows.length);
      console.log('✅ Bookings found:', result.rows);
      
      return result.rows;
    } catch (error) {
      console.error('❌ BOOKING MODEL - SQL Fetch Error:', error.message);
      console.error('❌ Full error:', error);
      throw error;
    }
  }

  // ⭐ NEW METHOD - GET ALL BOOKINGS (ADMIN ONLY)
  static async getAllBookings() {
    try {
      console.log('👑 BOOKING MODEL - GET ALL BOOKINGS METHOD (ADMIN)');
      
      const query = `
        SELECT 
          b.*,
          a.title AS artwork_title, 
          a.image_url,
          ar.artist_name,
          u.username,
          u.email AS user_email
        FROM bookings b
        LEFT JOIN artworks a ON b.artwork_id = a.artwork_id
        LEFT JOIN artists ar ON a.artist_id = ar.artist_id
        LEFT JOIN users u ON b.user_id = u.user_id
        ORDER BY b.created_at DESC
      `;
      
      console.log('📝 SQL Query:', query);
      
      const result = await pool.query(query);
      
      console.log('✅ Total bookings found:', result.rows.length);
      
      return result.rows;
    } catch (error) {
      console.error('❌ BOOKING MODEL - SQL Fetch Error:', error.message);
      console.error('❌ Full error:', error);
      throw error;
    }
  }

  // ⭐ NEW METHOD - UPDATE BOOKING STATUS (ADMIN ONLY)
  static async updateStatus(bookingId, status) {
    try {
      console.log('🔄 BOOKING MODEL - UPDATE STATUS METHOD');
      console.log('📝 Booking ID:', bookingId);
      console.log('📝 New Status:', status);
      
      const query = `
        UPDATE bookings 
        SET status = $1 
        WHERE booking_id = $2 
        RETURNING *
      `;
      
      const values = [status, bookingId];
      
      console.log('📝 SQL Query:', query);
      console.log('📝 SQL Values:', values);
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Booking not found');
      }//test
      
      console.log('✅ Status updated successfully');
      
      return result.rows[0];
    } catch (error) {
      console.error('❌ BOOKING MODEL - SQL Update Error:', error.message);
      console.error('❌ Full error:', error);
      throw error;
    }
  }
}

module.exports = Booking;