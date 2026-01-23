// backend/tests/artworkController.test.js

const artworkController = require('../controllers/artworkController');
const Artwork = require('../models/Artwork');

// Mock the Artwork model
jest.mock('../models/Artwork');

describe('Artwork Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: { user_id: 1, role: 'admin' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllArtworks', () => {
    it('should return all artworks successfully', async () => {
      const mockArtworks = [
        {
          artwork_id: 1,
          title: 'Golden Elegance',
          image_url: 'image1.jpg',
          price: 19500
        },
        {
          artwork_id: 2,
          title: 'Red Dynamics',
          image_url: 'image2.jpg',
          price: 18500
        }
      ];

      Artwork.getAll.mockResolvedValue(mockArtworks);

      await artworkController.getAllArtworks(req, res);

      expect(Artwork.getAll).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: expect.arrayContaining([
          expect.objectContaining({
            image_url: '/wall_arts/image1.jpg'
          })
        ])
      });
    });

    it('should handle errors when fetching artworks', async () => {
      Artwork.getAll.mockRejectedValue(new Error('Database error'));

      await artworkController.getAllArtworks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching artworks',
        error: 'Database error'
      });
    });
  });

  describe('getArtworkById', () => {
    it('should return artwork by ID', async () => {
      const mockArtwork = {
        artwork_id: 1,
        title: 'Golden Elegance',
        image_url: 'image1.jpg',
        price: 19500
      };

      req.params.id = '1';
      Artwork.getById.mockResolvedValue(mockArtwork);

      await artworkController.getArtworkById(req, res);

      expect(Artwork.getById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          image_url: '/wall_arts/image1.jpg'
        })
      });
    });

    it('should return 404 when artwork not found', async () => {
      req.params.id = '999';
      Artwork.getById.mockResolvedValue(null);

      await artworkController.getArtworkById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Artwork not found'
      });
    });
  });

  describe('createArtwork', () => {
    it('should create artwork successfully (admin)', async () => {
      req.body = {
        title: 'New Artwork',
        description: 'Beautiful painting',
        category: 'Abstract',
        price: 15000,
        image_url: 'new-image.jpg',
        artist_id: 1,
        is_bestseller: false,
        wall_size: 'Medium (3x4 ft)'
      };

      Artwork.create.mockResolvedValue(3);

      await artworkController.createArtwork(req, res);

      expect(Artwork.create).toHaveBeenCalledWith({
        title: 'New Artwork',
        description: 'Beautiful painting',
        category: 'Abstract',
        price: 15000,
        image_url: 'new-image.jpg',
        artist_id: 1,
        is_bestseller: false,
        wall_size: 'Medium (3x4 ft)'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Artwork created successfully',
        data: { artwork_id: 3 }
      });
    });

    it('should deny access for non-admin users', async () => {
      req.user.role = 'user';

      await artworkController.createArtwork(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Admin only.'
      });
    });

    it('should return 400 when required fields missing', async () => {
      req.body = {
        title: 'New Artwork'
        // Missing other required fields
      };

      await artworkController.createArtwork(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide all required fields'
      });
    });
  });

  describe('updateArtwork', () => {
    it('should update artwork successfully (admin)', async () => {
      req.params.id = '1';
      req.body = {
        title: 'Updated Artwork',
        description: 'Updated description',
        category: 'Modern',
        price: 20000,
        image_url: 'updated-image.jpg',
        artist_id: 1,
        is_bestseller: true,
        wall_size: 'Large (4x5 ft)'
      };

      const mockUpdatedArtwork = {
        artwork_id: 1,
        ...req.body
      };

      Artwork.update.mockResolvedValue(mockUpdatedArtwork);

      await artworkController.updateArtwork(req, res);

      expect(Artwork.update).toHaveBeenCalledWith('1', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Artwork updated successfully',
        data: mockUpdatedArtwork
      });
    });

    it('should return 404 when artwork to update not found', async () => {
      req.params.id = '999';
      req.body = {
        title: 'Updated Artwork',
        description: 'Updated description',
        category: 'Modern',
        price: 20000,
        image_url: 'updated-image.jpg',
        artist_id: 1
      };

      Artwork.update.mockResolvedValue(null);

      await artworkController.updateArtwork(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Artwork not found'
      });
    });
  });

  describe('deleteArtwork', () => {
    it('should delete artwork successfully (admin)', async () => {
      req.params.id = '1';
      Artwork.delete.mockResolvedValue({ artwork_id: 1 });

      await artworkController.deleteArtwork(req, res);

      expect(Artwork.delete).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Artwork deleted successfully',
        data: { artwork_id: 1 }
      });
    });

    it('should deny access for non-admin users', async () => {
      req.user.role = 'user';
      req.params.id = '1';

      await artworkController.deleteArtwork(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Admin only.'
      });
    });
  });

  describe('searchArtworks', () => {
    it('should search artworks by query', async () => {
      req.query.q = 'Golden';
      const mockResults = [
        {
          artwork_id: 1,
          title: 'Golden Elegance',
          image_url: 'image1.jpg'
        }
      ];

      Artwork.search.mockResolvedValue(mockResults);

      await artworkController.searchArtworks(req, res);

      expect(Artwork.search).toHaveBeenCalledWith('Golden');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: expect.any(Array)
      });
    });

    it('should return 400 when search query missing', async () => {
      req.query = {};

      await artworkController.searchArtworks(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Search query is required'
      });
    });
  });

  describe('uploadImage', () => {
    it('should upload image successfully (admin)', async () => {
      req.file = {
        filename: 'test-image-123.jpg',
        path: '/uploads/test-image-123.jpg'
      };

      await artworkController.uploadImage(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          image_url: 'test-image-123.jpg',
          full_path: '/wall_arts/test-image-123.jpg'
        }
      });
    });

    it('should return 400 when no file uploaded', async () => {
      req.file = null;

      await artworkController.uploadImage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please upload an image file'
      });
    });

    it('should deny access for non-admin users', async () => {
      req.user.role = 'user';
      req.file = {
        filename: 'test-image.jpg'
      };

      await artworkController.uploadImage(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});