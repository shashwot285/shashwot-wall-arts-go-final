// backend/tests/artworkModel.test.js

const Artwork = require('../models/Artwork');
const db = require('../config/database');

// Mock the database module
jest.mock('../config/database');

describe('Artwork Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all artworks with artist names', async () => {
      const mockArtworks = [
        {
          artwork_id: 1,
          title: 'Golden Elegance',
          description: 'Traditional artwork',
          category: 'Traditional',
          price: 19500,
          image_url: 'image1.jpg',
          artist_id: 1,
          artist_name: 'Artist 1',
          is_bestseller: true,
          wall_size: 'Large (4x5 ft)',
          views: 100
        },
        {
          artwork_id: 2,
          title: 'Red Dynamics',
          description: 'Modern artwork',
          category: 'Modern',
          price: 18500,
          image_url: 'image2.jpg',
          artist_id: 2,
          artist_name: 'Artist 2',
          is_bestseller: false,
          wall_size: 'Medium (3x4 ft)',
          views: 50
        }
      ];

      db.query.mockResolvedValue({ rows: mockArtworks });

      const result = await Artwork.getAll();

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockArtworks);
      expect(result).toHaveLength(2);
      expect(result[0].artist_name).toBe('Artist 1');
    });

    it('should return empty array when no artworks exist', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await Artwork.getAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getById', () => {
    it('should fetch artwork by ID and increment view count', async () => {
      const mockArtwork = {
        artwork_id: 1,
        title: 'Golden Elegance',
        price: 19500,
        artist_name: 'Artist 1',
        artist_email: 'artist1@example.com',
        artist_phone: '+977-1234567890',
        views: 100
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockArtwork] }) // First call - fetch artwork
        .mockResolvedValueOnce({ rows: [] }); // Second call - increment views

      const result = await Artwork.getById(1);

      expect(db.query).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockArtwork);
      expect(result.artwork_id).toBe(1);
    });

    it('should return null when artwork not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await Artwork.getById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new artwork', async () => {
      const artworkData = {
        title: 'New Artwork',
        description: 'Beautiful painting',
        category: 'Abstract',
        price: 15000,
        image_url: 'new-image.jpg',
        artist_id: 1,
        is_bestseller: false,
        wall_size: 'Medium (3x4 ft)'
      };

      db.query.mockResolvedValue({ rows: [{ artwork_id: 3 }] });

      const result = await Artwork.create(artworkData);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toBe(3);
    });

    it('should handle wall_size as null when not provided', async () => {
      const artworkData = {
        title: 'New Artwork',
        description: 'Beautiful painting',
        category: 'Abstract',
        price: 15000,
        image_url: 'new-image.jpg',
        artist_id: 1,
        is_bestseller: false
      };

      db.query.mockResolvedValue({ rows: [{ artwork_id: 4 }] });

      const result = await Artwork.create(artworkData);

      expect(result).toBe(4);
    });
  });

  describe('update', () => {
    it('should update an existing artwork', async () => {
      const updatedData = {
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
        ...updatedData
      };

      db.query.mockResolvedValue({ rows: [mockUpdatedArtwork] });

      const result = await Artwork.update(1, updatedData);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUpdatedArtwork);
      expect(result.title).toBe('Updated Artwork');
    });

    it('should return null when artwork to update not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await Artwork.update(999, {});

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an artwork', async () => {
      db.query.mockResolvedValue({ rows: [{ artwork_id: 1 }] });

      const result = await Artwork.delete(1);

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ artwork_id: 1 });
    });

    it('should return null when artwork to delete not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await Artwork.delete(999);

      expect(result).toBeNull();
    });
  });

  describe('search', () => {
    it('should search artworks by keyword', async () => {
      const mockResults = [
        {
          artwork_id: 1,
          title: 'Golden Elegance',
          category: 'Traditional',
          artist_name: 'Artist 1'
        }
      ];

      db.query.mockResolvedValue({ rows: mockResults });

      const result = await Artwork.search('Golden');

      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResults);
      expect(result).toHaveLength(1);
    });
  });

  describe('getAllSorted', () => {
    it('should sort artworks by price (low to high)', async () => {
      const mockArtworks = [
        { artwork_id: 1, price: 10000 },
        { artwork_id: 2, price: 20000 }
      ];

      db.query.mockResolvedValue({ rows: mockArtworks });

      const result = await Artwork.getAllSorted('price_low');

      expect(result).toEqual(mockArtworks);
    });

    it('should sort artworks by bestseller status', async () => {
      const mockArtworks = [
        { artwork_id: 1, is_bestseller: true },
        { artwork_id: 2, is_bestseller: false }
      ];

      db.query.mockResolvedValue({ rows: mockArtworks });

      const result = await Artwork.getAllSorted('bestseller');

      expect(result).toEqual(mockArtworks);
    });
  });
});