const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artistController');

// Get all artists
router.get('/', artistController.getAllArtists);

// Get artist with artworks
router.get('/:id', artistController.getArtistById);

module.exports = router;