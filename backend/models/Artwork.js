const db = require('../config/database');

class Artwork {
  static async getAll() {
    try {
      console.log('🔍 Fetching all artworks...');
      const result = await db.query(`
        SELECT a.*, ar.artist_name 
        FROM artworks a 
        LEFT JOIN artists ar ON a.artist_id = ar.artist_id
        ORDER BY a.created_at DESC
      `);
      console.log('✅ Artworks fetched:', result.rows.length, 'artworks');
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Artwork.getAll:', error.message);
      throw error;
    }
  }

  static async getById(id) {
    try {
      console.log('🔍 Fetching artwork with ID:', id);
      const result = await db.query(`
        SELECT a.*, ar.artist_name, ar.bio as artist_bio, 
               ar.contact_email as artist_email, ar.phone as artist_phone
        FROM artworks a 
        LEFT JOIN artists ar ON a.artist_id = ar.artist_id 
        WHERE a.artwork_id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        console.log('⚠️ No artwork found with ID:', id);
        return null;
      }
      
      console.log('✅ Artwork found:', result.rows[0].title);
      
      await db.query('UPDATE artworks SET views = views + 1 WHERE artwork_id = $1', [id]);
      console.log('👁️ View count incremented for artwork:', id);
      
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in Artwork.getById:', error.message);
      throw error;
    }
  }

  static async getByArtist(artistId) {
    try {
      console.log('🔍 Fetching artworks for artist ID:', artistId);
      const result = await db.query(`
        SELECT * FROM artworks 
        WHERE artist_id = $1
        ORDER BY is_bestseller DESC, views DESC
      `, [artistId]);
      console.log('✅ Found', result.rows.length, 'artworks for artist:', artistId);
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Artwork.getByArtist:', error.message);
      throw error;
    }
  }

  static async getAllSorted(sortBy) {
    try {
      console.log('🔍 Fetching artworks sorted by:', sortBy);
      let query = `
        SELECT a.*, ar.artist_name 
        FROM artworks a 
        LEFT JOIN artists ar ON a.artist_id = ar.artist_id
      `;
      
      switch(sortBy) {
        case 'price_low':
          query += ' ORDER BY a.price ASC';
          break;
        case 'price_high':
          query += ' ORDER BY a.price DESC';
          break;
        case 'bestseller':
          query += ' ORDER BY a.is_bestseller DESC, a.views DESC';
          break;
        case 'newest':
          query += ' ORDER BY a.created_at DESC';
          break;
        default:
          query += ' ORDER BY a.created_at DESC';
      }
      
      const result = await db.query(query);
      console.log('✅ Sorted artworks fetched:', result.rows.length, 'artworks');
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Artwork.getAllSorted:', error.message);
      throw error;
    }
  }

  static async search(searchTerm) {
    try {
      console.log('🔍 Searching artworks with term:', searchTerm);
      const result = await db.query(`
        SELECT a.*, ar.artist_name 
        FROM artworks a 
        LEFT JOIN artists ar ON a.artist_id = ar.artist_id
        WHERE a.title ILIKE $1 OR a.description ILIKE $1 OR 
              ar.artist_name ILIKE $1 OR a.category ILIKE $1
      `, [`%${searchTerm}%`]);
      console.log('✅ Search found:', result.rows.length, 'artworks');
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Artwork.search:', error.message);
      throw error;
    }
  }

  // ⭐ NEW: Create artwork
  static async create(data) {
    try {
      console.log('🆕 Creating new artwork:', data.title);
      const result = await db.query(
        `INSERT INTO artworks 
         (title, description, category, price, image_url, artist_id, is_bestseller)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING artwork_id`,
        [
          data.title,
          data.description,
          data.category,
          parseFloat(data.price),
          data.image_url,
          parseInt(data.artist_id),
          data.is_bestseller || false
        ]
      );
      console.log('✅ Artwork created with ID:', result.rows[0].artwork_id);
      return result.rows[0].artwork_id;
    } catch (error) {
      console.error('❌ Error in Artwork.create:', error.message);
      throw error;
    }
  }

  // ⭐ NEW: Update artwork
  static async update(id, data) {
    try {
      console.log('🔄 Updating artwork ID:', id);
      const result = await db.query(
        `UPDATE artworks 
         SET title = $1, description = $2, category = $3, price = $4, 
             image_url = $5, artist_id = $6, is_bestseller = $7
         WHERE artwork_id = $8
         RETURNING *`,
        [
          data.title,
          data.description,
          data.category,
          parseFloat(data.price),
          data.image_url,
          parseInt(data.artist_id),
          data.is_bestseller || false,
          id
        ]
      );
      
      if (result.rows.length === 0) {
        console.log('⚠️ No artwork found to update with ID:', id);
        return null;
      }
      
      console.log('✅ Artwork updated:', result.rows[0].title);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in Artwork.update:', error.message);
      throw error;
    }
  }

  // ⭐ FIXED: Delete artwork (removed booking check)
  static async delete(id) {
    try {
      console.log('🗑️ Deleting artwork ID:', id);
      
      // ❌ REMOVED BOOKING CHECK - Just delete the artwork
      
      const result = await db.query(
        'DELETE FROM artworks WHERE artwork_id = $1 RETURNING artwork_id',
        [id]
      );
      
      if (result.rows.length === 0) {
        console.log('⚠️ No artwork found to delete with ID:', id);
        return null;
      }
      
      console.log('✅ Artwork deleted:', id);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in Artwork.delete:', error.message);
      throw error;
    }
  }
}

module.exports = Artwork;