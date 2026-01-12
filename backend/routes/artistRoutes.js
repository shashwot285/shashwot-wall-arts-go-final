const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artistController');
const { authenticateToken } = require('../middleware/auth');

// Public routes (no auth needed)
router.get('/', artistController.getAllArtists);
router.get('/:id', artistController.getArtistById);

// Protected routes (admin only)
router.post('/', authenticateToken, artistController.createArtist);
router.patch('/:id', authenticateToken, artistController.updateArtist);
router.delete('/:id', authenticateToken, artistController.deleteArtist);

module.exports = router;