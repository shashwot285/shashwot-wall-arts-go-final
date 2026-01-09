// backend/controllers/artworkController.js

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