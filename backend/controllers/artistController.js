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