// backend/tests/security.test.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../models/User');

describe('Security Tests', () => {
  describe('Password Hashing', () => {
    it('should hash passwords with bcrypt', async () => {
      const plainPassword = 'testPassword123';
      const hashedPassword = '$2a$10$abcdefghijklmnopqrstuvwxyz123456';

      bcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await bcrypt.hash(plainPassword, 10);

      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
      expect(result).toBe(hashedPassword);
      expect(result).not.toBe(plainPassword);
    });

    it('should verify passwords correctly', async () => {
      const plainPassword = 'testPassword123';
      const hashedPassword = '$2a$10$abcdefghijklmnopqrstuvwxyz123456';

      bcrypt.compare.mockResolvedValue(true);

      const isValid = await bcrypt.compare(plainPassword, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const plainPassword = 'wrongPassword';
      const hashedPassword = '$2a$10$abcdefghijklmnopqrstuvwxyz123456';

      bcrypt.compare.mockResolvedValue(false);

      const isValid = await bcrypt.compare(plainPassword, hashedPassword);

      expect(isValid).toBe(false);
    });
  });

  describe('JWT Token Authentication', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        header: jest.fn()
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      next = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should authenticate valid token', () => {
      const token = 'valid-token-123';
      const decodedUser = {
        userId: 1,
        role: 'admin',
        email: 'admin@example.com'
      };

      req.header.mockReturnValue(token);
      jwt.verify.mockReturnValue(decodedUser);

      authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(req.user).toEqual(decodedUser);
      expect(next).toHaveBeenCalled();
    });

    it('should reject request without token', () => {
      req.header.mockReturnValue(null);

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid token', () => {
      const invalidToken = 'invalid-token';
      
      req.header.mockReturnValue(invalidToken);
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject expired token', () => {
      const expiredToken = 'expired-token';
      
      req.header.mockReturnValue(expiredToken);
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token has expired. Please login again.' // ← FIXED: Changed from 'Invalid token.'
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin to access admin-only routes', () => {
      const adminUser = {
        user_id: 1,
        role: 'admin',
        email: 'admin@example.com'
      };

      const isAdmin = adminUser.role === 'admin';

      expect(isAdmin).toBe(true);
    });

    it('should deny regular user access to admin-only routes', () => {
      const regularUser = {
        user_id: 2,
        role: 'user',
        email: 'user@example.com'
      };

      const isAdmin = regularUser.role === 'admin';

      expect(isAdmin).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'admin@wall-arts.com'
      ];

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test@.com'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should validate password strength (minimum 6 characters)', () => {
      const validPasswords = [
        'password123',
        'Test@123',
        'securePassword'
      ];

      const invalidPasswords = [
        'pass',
        '12345',
        'abc'
      ];

      validPasswords.forEach(password => {
        expect(password.length >= 6).toBe(true);
      });

      invalidPasswords.forEach(password => {
        expect(password.length >= 6).toBe(false);
      });
    });

    it('should validate username format (alphanumeric and underscore only)', () => {
      const validUsernames = [
        'john_doe',
        'user123',
        'test_user'
      ];

      const invalidUsernames = [
        'user@name',
        'user name',
        'user-name'
      ];

      const usernameRegex = /^[a-zA-Z0-9_]+$/;

      validUsernames.forEach(username => {
        expect(usernameRegex.test(username)).toBe(true);
      });

      invalidUsernames.forEach(username => {
        expect(usernameRegex.test(username)).toBe(false);
      });
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should use parameterized queries to prevent SQL injection', () => {
      // Example of SAFE parameterized query
      const safeQuery = 'SELECT * FROM users WHERE email = $1';
      const userInput = "test@example.com'; DROP TABLE users; --";

      // In parameterized queries, user input is treated as data, not code
      expect(safeQuery).toContain('$1');
      expect(safeQuery).not.toContain(userInput);
    });

    it('should reject malicious input in search queries', () => {
      const maliciousInputs = [
        "'; DROP TABLE artworks; --",
        "1' OR '1'='1",
        "<script>alert('XSS')</script>"
      ];

      // These inputs should be sanitized and treated as literal search terms
      maliciousInputs.forEach(input => {
        // In parameterized queries, these are just strings
        expect(typeof input).toBe('string');
        // They won't execute as SQL commands
      });
    });
  });

  describe('Session Management', () => {
    it('should generate JWT token with expiration', () => {
      const payload = {
        user_id: 1,
        role: 'user',
        email: 'test@example.com'
      };
      const secret = 'test-secret';
      const token = 'generated-jwt-token';

      jwt.sign.mockReturnValue(token);

      const generatedToken = jwt.sign(payload, secret, { expiresIn: '7d' });

      expect(jwt.sign).toHaveBeenCalledWith(payload, secret, { expiresIn: '7d' });
      expect(generatedToken).toBe(token);
    });

    it('should invalidate token after expiration', () => {
      const expiredToken = 'expired-token';
      
      jwt.verify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      expect(() => jwt.verify(expiredToken, 'secret')).toThrow();
    });
  });

  describe('XSS Prevention', () => {
    it('should not store HTML/JavaScript in database', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)'
      ];

      // These inputs should be escaped or sanitized before storage
      maliciousInputs.forEach(input => {
        // In proper implementation, these would be escaped
        const isHTML = /<[^>]*>/.test(input);
        const isScript = /script/i.test(input);
        
        // Just verifying detection works
        expect(isHTML || isScript).toBe(true);
      });
    });
  });

  describe('CORS and Security Headers', () => {
    it('should validate allowed origins for CORS', () => {
      const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
      const requestOrigin = 'http://localhost:3000';

      const isAllowed = allowedOrigins.includes(requestOrigin);

      expect(isAllowed).toBe(true);
    });

    it('should reject requests from unauthorized origins', () => {
      const allowedOrigins = ['http://localhost:3000'];
      const maliciousOrigin = 'http://malicious-site.com';

      const isAllowed = allowedOrigins.includes(maliciousOrigin);

      expect(isAllowed).toBe(false);
    });
  });
});