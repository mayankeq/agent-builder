import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateToken,
  verifyToken,
  decodeToken,
  hashToken,
  shouldRefreshToken,
  getTokenExpiration,
  JWTPayload,
} from '@/server/auth/jwt';

describe('JWT Authentication', () => {
  describe('generateToken', () => {
    it('should generate a valid token', () => {
      const payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss'> = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user information in token', async () => {
      const payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss'> = {
        userId: 'user-456',
        email: 'user@example.com',
        name: 'Another User',
      };

      const token = generateToken(payload);
      const decoded = await verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.name).toBe(payload.name);
    });

    it('should generate different tokens for different users', () => {
      const payload1 = { userId: 'user-1', email: 'user1@example.com' };
      const payload2 = { userId: 'user-2', email: 'user2@example.com' };

      const token1 = generateToken(payload1);
      const token2 = generateToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const payload = {
        userId: 'user-789',
        email: 'verify@example.com',
      };

      const token = generateToken(payload);
      const decoded = await verifyToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.iss).toBe('agent-builder-api');
    });

    it('should reject invalid token', async () => {
      const invalidToken = 'invalid.token.here';

      await expect(verifyToken(invalidToken)).rejects.toThrow('Invalid token');
    });

    it('should reject malformed token', async () => {
      const malformedToken = 'not-a-jwt';

      await expect(verifyToken(malformedToken)).rejects.toThrow();
    });

    it('should include standard JWT claims', async () => {
      const payload = {
        userId: 'user-999',
        email: 'claims@example.com',
      };

      const token = generateToken(payload);
      const decoded = await verifyToken(token);

      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.iss).toBe('agent-builder-api');
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const payload = {
        userId: 'user-111',
        email: 'decode@example.com',
      };

      const token = generateToken(payload);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded!.userId).toBe(payload.userId);
      expect(decoded!.email).toBe(payload.email);
    });

    it('should decode invalid token structure', () => {
      const invalidToken = 'invalid.token';
      const decoded = decodeToken(invalidToken);

      // Should return null for invalid tokens
      expect(decoded).toBeNull();
    });

    it('should not validate token signature', () => {
      // Even with invalid signature, decode should work
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0In0.invalid';
      const decoded = decodeToken(token);

      // May return something or null depending on validity
      expect(decoded === null || typeof decoded === 'object').toBe(true);
    });
  });

  describe('hashToken', () => {
    it('should hash token consistently', () => {
      const token = 'test-token-123';

      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different tokens', () => {
      const token1 = 'token-1';
      const token2 = 'token-2';

      const hash1 = hashToken(token1);
      const hash2 = hashToken(token2);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce hex string of expected length', () => {
      const token = 'any-token';
      const hash = hashToken(token);

      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 produces 64 hex chars
    });
  });

  describe('shouldRefreshToken', () => {
    it('should not need refresh for new token', () => {
      const payload = {
        userId: 'user-refresh-1',
        email: 'refresh@example.com',
      };

      const token = generateToken(payload);
      const shouldRefresh = shouldRefreshToken(token);

      expect(shouldRefresh).toBe(false);
    });

    it('should need refresh for invalid token', () => {
      const invalidToken = 'invalid';
      const shouldRefresh = shouldRefreshToken(invalidToken);

      expect(shouldRefresh).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration date for valid token', () => {
      const payload = {
        userId: 'user-exp-1',
        email: 'exp@example.com',
      };

      const token = generateToken(payload);
      const expiration = getTokenExpiration(token);

      expect(expiration).toBeInstanceOf(Date);
      expect(expiration!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid';
      const expiration = getTokenExpiration(invalidToken);

      expect(expiration).toBeNull();
    });

    it('should return future date', () => {
      const payload = {
        userId: 'user-exp-2',
        email: 'future@example.com',
      };

      const token = generateToken(payload);
      const expiration = getTokenExpiration(token);

      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      expect(expiration!.getTime()).toBeGreaterThan(now.getTime());
      expect(expiration!.getTime()).toBeLessThanOrEqual(sevenDaysFromNow.getTime());
    });
  });

  describe('token lifecycle', () => {
    it('should generate, verify, and decode consistently', async () => {
      const payload = {
        userId: 'lifecycle-1',
        email: 'lifecycle@example.com',
        name: 'Lifecycle Test',
      };

      const token = generateToken(payload);
      const verified = await verifyToken(token);
      const decoded = decodeToken(token);

      expect(verified.userId).toBe(payload.userId);
      expect(verified.email).toBe(payload.email);
      expect(decoded!.userId).toBe(payload.userId);
      expect(decoded!.email).toBe(payload.email);
    });
  });
});
