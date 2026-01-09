const db = require('../config/database');

class Artist {
  static async getAll() {
    try {
      console.log('🔍 Fetching all artists...');
      const result = await db.query('SELECT * FROM artists ORDER BY artist_id');
      console.log('✅ Artists fetched:', result.rows.length, 'artists');
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Artist.getAll:', error.message);
      throw error;
    }
  }

  static async getById(id) {
    try {
      console.log('🔍 Fetching artist with ID:', id);
      const result = await db.query('SELECT * FROM artists WHERE artist_id = $1', [id]);
      
      if (result.rows.length === 0) {
        console.log('⚠️ No artist found with ID:', id);
        return null;
      }
      
      console.log('✅ Artist found:', result.rows[0].artist_name);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in Artist.getById:', error.message);
      throw error;
    }
  }

  static async create(data) {
    try {
      console.log('🆕 Creating new artist:', data.artist_name);
      const result = await db.query(
        'INSERT INTO artists (artist_name, bio, contact_email, phone) VALUES ($1, $2, $3, $4) RETURNING artist_id',
        [data.artist_name, data.bio, data.contact_email, data.phone]
      );
      console.log('✅ Artist created with ID:', result.rows[0].artist_id);
      return result.rows[0].artist_id;
    } catch (error) {
      console.error('❌ Error in Artist.create:', error.message);
      throw error;
    }
  }
}

module.exports = Artist;