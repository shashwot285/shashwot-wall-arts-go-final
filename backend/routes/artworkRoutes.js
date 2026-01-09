const express = require('express');
const router = express.Router();
const artworkController = require('../controllers/artworkController');

// Search artworks (must be before /:id route)
router.get('/search', artworkController.searchArtworks);

// Get artworks by artist
router.get('/artist/:artistId', artworkController.getArtworksByArtist);

// Get all artworks (with optional sorting)
router.get('/', artworkController.getAllArtworks);

// Get single artwork
router.get('/:id', artworkController.getArtworkById);

module.exports = router;