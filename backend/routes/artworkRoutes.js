const express = require('express');
const router = express.Router();
const artworkController = require('../controllers/artworkController');
const { authenticateToken } = require('../middleware/auth');

// Public routes (no auth needed)
router.get('/search', artworkController.searchArtworks);
router.get('/artist/:artistId', artworkController.getArtworksByArtist);
router.get('/', artworkController.getAllArtworks);
router.get('/:id', artworkController.getArtworkById);

// Protected routes (admin only)
router.post('/', authenticateToken, artworkController.createArtwork);
router.patch('/:id', authenticateToken, artworkController.updateArtwork);
router.delete('/:id', authenticateToken, artworkController.deleteArtwork);

module.exports = router;