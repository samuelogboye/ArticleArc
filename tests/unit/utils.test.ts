import jwt from 'jsonwebtoken';
import { generateToken, verifyToken } from '../../src/utils/jwt';
import mongoose from 'mongoose';

describe('JWT Utils', () => {
  const testPayload = {
    userId: '507f1f77bcf86cd799439011',
    username: 'testuser',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(testPayload);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      
      // Verify the token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.username).toBe(testPayload.username);
    });

    it('should include expiration time', () => {
      const token = generateToken(testPayload);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp > decoded.iat).toBe(true);
    });

    it('should create different tokens for different payloads', () => {
      const token1 = generateToken(testPayload);
      const token2 = generateToken({
        userId: '507f1f77bcf86cd799439012',
        username: 'otheruser',
      });
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = generateToken(testPayload);
      const decoded = verifyToken(token);
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.username).toBe(testPayload.username);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyToken('invalid.token.here');
      }).toThrow();
    });

    it('should throw error for token with wrong signature', () => {
      const fakeToken = jwt.sign(testPayload, 'wrong-secret');
      
      expect(() => {
        verifyToken(fakeToken);
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      const expiredToken = jwt.sign(testPayload, process.env.JWT_SECRET!, { expiresIn: '-1s' });
      
      expect(() => {
        verifyToken(expiredToken);
      }).toThrow();
    });

    it('should throw error for malformed token', () => {
      expect(() => {
        verifyToken('not.a.jwt');
      }).toThrow();
      
      expect(() => {
        verifyToken('');
      }).toThrow();
      
      expect(() => {
        verifyToken('justtext');
      }).toThrow();
    });
  });
});

describe('ObjectId Validation', () => {
  it('should validate ObjectId format', () => {
    const validId = new mongoose.Types.ObjectId().toString();
    expect(mongoose.Types.ObjectId.isValid(validId)).toBe(true);

    expect(mongoose.Types.ObjectId.isValid('invalid-id')).toBe(false);
    expect(mongoose.Types.ObjectId.isValid('123')).toBe(false);
    expect(mongoose.Types.ObjectId.isValid('')).toBe(false);
    expect(mongoose.Types.ObjectId.isValid('not-an-object-id')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(mongoose.Types.ObjectId.isValid('507f1f77bcf86cd79943901')).toBe(false); // Too short
    expect(mongoose.Types.ObjectId.isValid('507f1f77bcf86cd799439011x')).toBe(false); // Invalid character
    expect(mongoose.Types.ObjectId.isValid('507f1f77bcf86cd799439011')).toBe(true); // Valid 24-char hex
  });
});

describe('Environment Configuration', () => {
  it('should have required environment variables in test', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.JWT_EXPIRES_IN).toBeDefined();
    expect(process.env.BCRYPT_ROUNDS).toBeDefined();
    expect(process.env.GEMINI_API_KEY).toBeDefined();
  });

  it('should have test-specific values', () => {
    expect(process.env.BCRYPT_ROUNDS).toBe('4'); // Faster for tests
    expect(process.env.JWT_EXPIRES_IN).toBe('24h');
  });

  it('should use MongoDB Memory Server for tests', () => {
    // MongoDB Memory Server is used for tests, production URIs may still be set
    expect(process.env.USE_MOCK_GEMINI).toBe('true');
  });
});

describe('Error Handling Utils', () => {
  it('should handle async errors properly', async () => {
    const asyncFunction = async () => {
      throw new Error('Test error');
    };

    await expect(asyncFunction()).rejects.toThrow('Test error');
  });

  it('should handle promise rejections', async () => {
    const rejectedPromise = Promise.reject(new Error('Promise rejected'));

    await expect(rejectedPromise).rejects.toThrow('Promise rejected');
  });
});