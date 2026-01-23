// backend/tests/artworkRoutes.test.js

const request = require('supertest');
const express = require('express');
const artworkRoutes = require('../routes/artworkRoutes');
const Artwork = require('../models/Artwork');
const jwt = require('jsonwebtoken');

// Mock the Artwork model
jest.mock('../models/Artwork');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/artworks', artworkRoutes);

// Mock JWT for authentication
jest.mock('jsonwebtoken');

describe('Artwork API Endpoints', () => {
  let adminToken, userToken;

  beforeAll(() => {
    // Generate mock tokens
    adminToken = 'mock-admin-token';
    userToken = 'mock-user-token';

    // Mock JWT verification
    jwt.verify.mockImplementation((token) => {
      if (token === adminToken) {
        return { user_id: 1, role: 'admin' };
      } else if (token === userToken) {
        return { user_id: 2, role: 'user' };
      }
      throw new Error('Invalid token');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/artworks', () => {
    it('should get all artworks', async () => {
      const mockArtworks = [
        {
          artwork_id: 1,
          title: 'Golden Elegance',
          price: 19500,
          image_url: 'image1.jpg'
        },
        {
          artwork_id: 2,
          title: 'Red Dynamics',
          price: 18500,
          image_url: 'image2.jpg'
        }
      ];

      Artwork.getAll.mockResolvedValue(mockArtworks);

      const response = await request(app)
        .get('/api/artworks')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    it('should get sorted artworks when sort query provided', async () => {
      const mockSortedArtworks = [
        { artwork_id: 2, price: 15000 },
        { artwork_id: 1, price: 20000 }
      ];

      Artwork.getAllSorted.mockResolvedValue(mockSortedArtworks);

      const response = await request(app)
        .get('/api/artworks?sort=price_low')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Artwork.getAllSorted).toHaveBeenCalledWith('price_low');
    });
  });

  describe('GET /api/artworks/:id', () => {
    it('should get artwork by ID', async () => {
      const mockArtwork = {
        artwork_id: 1,
        title: 'Golden Elegance',
        price: 19500,
        image_url: 'image1.jpg',
        artist_name: 'Artist 1'
      };

      Artwork.getById.mockResolvedValue(mockArtwork);

      const response = await request(app)
        .get('/api/artworks/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.artwork_id).toBe(1);
      expect(response.body.data.title).toBe('Golden Elegance');
    });

    it('should return 404 when artwork not found', async () => {
      Artwork.getById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/artworks/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Artwork not found');
    });
  });

  describe('GET /api/artworks/search', () => {
    it('should search artworks by query', async () => {
      const mockResults = [
        {
          artwork_id: 1,
          title: 'Golden Elegance',
          image_url: 'image1.jpg'
        }
      ];

      Artwork.search.mockResolvedValue(mockResults);

      const response = await request(app)
        .get('/api/artworks/search?q=Golden')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(Artwork.search).toHaveBeenCalledWith('Golden');
    });

    it('should return 400 when search query missing', async () => {
      const response = await request(app)
        .get('/api/artworks/search')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Search query is required');
    });
  });

  describe('GET /api/artworks/artist/:artistId', () => {
    it('should get artworks by artist', async () => {
      const mockArtworks = [
        {
          artwork_id: 1,
          title: 'Artwork 1',
          artist_id: 1,
          image_url: 'image1.jpg'
        },
        {
          artwork_id: 2,
          title: 'Artwork 2',
          artist_id: 1,
          image_url: 'image2.jpg'
        }
      ];

      Artwork.getByArtist.mockResolvedValue(mockArtworks);

      const response = await request(app)
        .get('/api/artworks/artist/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(Artwork.getByArtist).toHaveBeenCalledWith('1');
    });
  });

  describe('POST /api/artworks (Admin Only)', () => {
    it('should create artwork with valid admin token', async () => {
      const newArtwork = {
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

      const response = await request(app)
        .post('/api/artworks')
        .set('x-auth-token', adminToken)
        .send(newArtwork)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Artwork created successfully');
      expect(response.body.data.artwork_id).toBe(3);
    });

    it('should deny access without admin token', async () => {
      const newArtwork = {
        title: 'New Artwork',
        description: 'Beautiful painting',
        category: 'Abstract',
        price: 15000,
        image_url: 'new-image.jpg',
        artist_id: 1
      };

      const response = await request(app)
        .post('/api/artworks')
        .set('x-auth-token', userToken)
        .send(newArtwork)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin only.');
    });

    it('should return 400 when required fields missing', async () => {
      const incompleteArtwork = {
        title: 'New Artwork'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/artworks')
        .set('x-auth-token', adminToken)
        .send(incompleteArtwork)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide all required fields');
    });
  });

  describe('PATCH /api/artworks/:id (Admin Only)', () => {
    it('should update artwork with valid admin token', async () => {
      const updateData = {
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
        ...updateData
      };

      Artwork.update.mockResolvedValue(mockUpdatedArtwork);

      const response = await request(app)
        .patch('/api/artworks/1')
        .set('x-auth-token', adminToken)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Artwork updated successfully');
    });

    it('should return 404 when artwork to update not found', async () => {
      const updateData = {
        title: 'Updated Artwork',
        description: 'Updated description',
        category: 'Modern',
        price: 20000,
        image_url: 'updated-image.jpg',
        artist_id: 1
      };

      Artwork.update.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/artworks/999')
        .set('x-auth-token', adminToken)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Artwork not found');
    });
  });

  describe('DELETE /api/artworks/:id (Admin Only)', () => {
    it('should delete artwork with valid admin token', async () => {
      Artwork.delete.mockResolvedValue({ artwork_id: 1 });

      const response = await request(app)
        .delete('/api/artworks/1')
        .set('x-auth-token', adminToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Artwork deleted successfully');
    });

    it('should deny access without admin token', async () => {
      const response = await request(app)
        .delete('/api/artworks/1')
        .set('x-auth-token', userToken)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin only.');
    });

    it('should return 404 when artwork to delete not found', async () => {
      Artwork.delete.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/artworks/999')
        .set('x-auth-token', adminToken)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Artwork not found');
    });
  });
});