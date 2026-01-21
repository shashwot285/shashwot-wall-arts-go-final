const Artwork = require('../models/Artwork');

// Get all artworks (with optional sorting)
exports.getAllArtworks = async (req, res) => {
  try {
    const { sort } = req.query;
    const artworks = sort ? await Artwork.getAllSorted(sort) : await Artwork.getAll();
    
    // Add /wall_arts/ prefix to all image URLs
    const artworksWithPath = artworks.map(artwork => ({
      ...artwork,
      image_url: artwork.image_url && !artwork.image_url.startsWith('/') 
        ? `/wall_arts/${artwork.image_url}` 
        : artwork.image_url
    }));
    
    res.status(200).json({
      success: true,
      count: artworksWithPath.length,
      data: artworksWithPath
    });
  } catch (error) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching artworks',
      error: error.message
    });
  }
};

// Get single artwork by ID
exports.getArtworkById = async (req, res) => {
  try {
    const artwork = await Artwork.getById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }

    // Add /wall_arts/ prefix to image URL
    if (artwork.image_url && !artwork.image_url.startsWith('/')) {
      artwork.image_url = `/wall_arts/${artwork.image_url}`;
    }

    res.status(200).json({
      success: true,
      data: artwork
    });
  } catch (error) {
    console.error('Error fetching artwork:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching artwork',
      error: error.message
    });
  }
};

// Get artworks by artist
exports.getArtworksByArtist = async (req, res) => {
  try {
    const artworks = await Artwork.getByArtist(req.params.artistId);
    
    // Add /wall_arts/ prefix to all image URLs
    const artworksWithPath = artworks.map(artwork => ({
      ...artwork,
      image_url: artwork.image_url && !artwork.image_url.startsWith('/') 
        ? `/wall_arts/${artwork.image_url}` 
        : artwork.image_url
    }));
    
    res.status(200).json({
      success: true,
      count: artworksWithPath.length,
      data: artworksWithPath
    });
  } catch (error) {
    console.error('Error fetching artworks by artist:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching artworks',
      error: error.message
    });
  }
};

// Search artworks
exports.searchArtworks = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const artworks = await Artwork.search(q);
    
    // Add /wall_arts/ prefix to all image URLs
    const artworksWithPath = artworks.map(artwork => ({
      ...artwork,
      image_url: artwork.image_url && !artwork.image_url.startsWith('/') 
        ? `/wall_arts/${artwork.image_url}` 
        : artwork.image_url
    }));
    
    res.status(200).json({
      success: true,
      count: artworksWithPath.length,
      data: artworksWithPath
    });
  } catch (error) {
    console.error('Error searching artworks:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching artworks',
      error: error.message
    });
  }
};

// ⭐ NEW: Create artwork (ADMIN ONLY)
exports.createArtwork = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('🆕 CREATE ARTWORK CALLED');
    console.log('👤 User:', req.user);
    console.log('📦 Request body:', req.body);
    
    // Check admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const { title, description, category, price, image_url, artist_id, is_bestseller, wall_size } = req.body;
    
    // Validate
    if (!title || !description || !category || !price || !image_url || !artist_id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    const artworkId = await Artwork.create({
      title,
      description,
      category,
      price,
      image_url,
      artist_id,
      is_bestseller: is_bestseller || false,
      wall_size: wall_size || null
    });
    
    console.log('✅ Artwork created with ID:', artworkId);
    
    res.status(201).json({
      success: true,
      message: 'Artwork created successfully',
      data: { artwork_id: artworkId }
    });
  } catch (error) {
    console.error('❌ Error creating artwork:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating artwork',
      error: error.message
    });
  }
};

// ⭐ NEW: Update artwork (ADMIN ONLY)
exports.updateArtwork = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('🔄 UPDATE ARTWORK CALLED');
    console.log('👤 User:', req.user);
    console.log('📝 Artwork ID:', req.params.id);
    console.log('📦 Request body:', req.body);
    
    // Check admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const { title, description, category, price, image_url, artist_id, is_bestseller, wall_size } = req.body;
    
    // Validate
    if (!title || !description || !category || !price || !image_url || !artist_id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    const updatedArtwork = await Artwork.update(req.params.id, {
      title,
      description,
      category,
      price,
      image_url,
      artist_id,
      is_bestseller: is_bestseller || false,
      wall_size: wall_size || null
    });
    
    if (!updatedArtwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }
    
    console.log('✅ Artwork updated successfully');
    
    res.status(200).json({
      success: true,
      message: 'Artwork updated successfully',
      data: updatedArtwork
    });
  } catch (error) {
    console.error('❌ Error updating artwork:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating artwork',
      error: error.message
    });
  }
};

// ⭐ NEW: Delete artwork (ADMIN ONLY)
exports.deleteArtwork = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('🗑️ DELETE ARTWORK CALLED');
    console.log('👤 User:', req.user);
    console.log('📝 Artwork ID:', req.params.id);
    
    // Check admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    const deletedArtwork = await Artwork.delete(req.params.id);
    
    if (!deletedArtwork) {
      return res.status(404).json({
        success: false,
        message: 'Artwork not found'
      });
    }
    
    console.log('✅ Artwork deleted successfully');
    
    res.status(200).json({
      success: true,
      message: 'Artwork deleted successfully',
      data: deletedArtwork
    });
  } catch (error) {
    console.error('❌ Error deleting artwork:', error);
    
    if (error.message.includes('existing bookings')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete artwork with existing bookings.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting artwork',
      error: error.message
    });
  }
};

// ⭐ NEW: Upload image (ADMIN ONLY)
exports.uploadImage = async (req, res) => {
  try {
    console.log('==========================================');
    console.log('📸 IMAGE UPLOAD CALLED');
    console.log('👤 User:', req.user);
    console.log('📁 File:', req.file);
    
    // Check admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }
    
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }
    
    // Return just the filename (not the full path)
    const imageUrl = req.file.filename;
    
    console.log('✅ Image uploaded:', imageUrl);
    
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        image_url: imageUrl,
        full_path: `/wall_arts/${imageUrl}`
      }
    });
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
};