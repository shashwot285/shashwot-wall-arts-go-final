const Artist = require('../models/Artist');
const Artwork = require('../models/Artwork');

// Get all artists
exports.getAllArtists = async (req, res) => {
  try {
    const artists = await Artist.getAll();
    
    res.status(200).json({
      success: true,
      count: artists.length,
      data: artists
    });
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching artists',
      error: error.message
    });
  }
};

// Get single artist by ID with their artworks
exports.getArtistById = async (req, res) => {
  try {
    const artist = await Artist.getById(req.params.id);
    
    if (!artist) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }

    // Get artist's artworks
    const artworks = await Artwork.getByArtist(req.params.id);
    
    // Add artworks to artist data
    artist.artworks = artworks;

    res.status(200).json({
      success: true,
      data: artist
    });
  } catch (error) {
    console.error('Error fetching artist:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching artist',
      error: error.message
    });
  }
};

// ⭐ NEW: Create artist (ADMIN ONLY)
exports.createArtist = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('🆕 CREATE ARTIST CALLED');
    console.log('👤 User:', req.user);
    console.log('📦 Request body:', req.body);
    
    // Check admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const { artist_name, bio, contact_email, phone } = req.body;
    
    // Validate
    if (!artist_name || !bio || !contact_email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide artist name, bio, and email'
      });
    }
    
    const artistId = await Artist.create({
      artist_name,
      bio,
      contact_email,
      phone: phone || null
    });
    
    console.log('✅ Artist created with ID:', artistId);
    
    res.status(201).json({
      success: true,
      message: 'Artist created successfully',
      data: { artist_id: artistId }
    });
  } catch (error) {
    console.error('❌ Error creating artist:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating artist',
      error: error.message
    });
  }
};

// ⭐ NEW: Update artist (ADMIN ONLY)
exports.updateArtist = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('🔄 UPDATE ARTIST CALLED');
    console.log('👤 User:', req.user);
    console.log('📝 Artist ID:', req.params.id);
    console.log('📦 Request body:', req.body);
    
    // Check admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const { artist_name, bio, contact_email, phone } = req.body;
    
    // Validate
    if (!artist_name || !bio || !contact_email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide artist name, bio, and email'
      });
    }
    
    const updatedArtist = await Artist.update(req.params.id, {
      artist_name,
      bio,
      contact_email,
      phone: phone || null
    });
    
    if (!updatedArtist) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }
    
    console.log('✅ Artist updated successfully');
    
    res.status(200).json({
      success: true,
      message: 'Artist updated successfully',
      data: updatedArtist
    });
  } catch (error) {
    console.error('❌ Error updating artist:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating artist',
      error: error.message
    });
  }
};

// ⭐ NEW: Delete artist (ADMIN ONLY)
exports.deleteArtist = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('🗑️ DELETE ARTIST CALLED');
    console.log('👤 User:', req.user);
    console.log('📝 Artist ID:', req.params.id);
    
    // Check admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const deletedArtist = await Artist.delete(req.params.id);
    
    if (!deletedArtist) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }
    
    console.log('✅ Artist deleted successfully');
    
    res.status(200).json({
      success: true,
      message: 'Artist deleted successfully',
      data: deletedArtist
    });
  } catch (error) {
    console.error('❌ Error deleting artist:', error);
    
    if (error.message.includes('existing artworks')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete artist with existing artworks. Please delete artworks first.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting artist',
      error: error.message
    });
  }
};