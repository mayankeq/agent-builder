import { describe, it, expect } from 'vitest';
import {
  encrypt,
  decrypt,
  hash,
  generateSecureToken,
  secureCompare,
  deriveKey,
  testEncryption,
  generateEncryptionKey,
} from '@/server/security/encryption';

describe('Encryption', () => {
  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt data correctly', () => {
      const plaintext = 'sensitive data';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different encrypted values for same input', () => {
      const plaintext = 'test data';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      // Should be different due to random IV
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should encrypt long strings', () => {
      const plaintext = 'a'.repeat(10000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt special characters', () => {
      const plaintext = '!@#$%^&*()_+{}[]|\\:";\'<>?,./\n\t';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt unicode characters', () => {
      const plaintext = 'Hello 世界 🌍 مرحبا';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should include IV and auth tag in encrypted data', () => {
      const plaintext = 'test';
      const encrypted = encrypt(plaintext);

      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(typeof encrypted.encrypted).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
      expect(typeof encrypted.authTag).toBe('string');
    });

    it('should fail to decrypt with wrong auth tag', () => {
      const plaintext = 'test';
      const encrypted = encrypt(plaintext);

      // Tamper with auth tag
      encrypted.authTag = Buffer.from('a'.repeat(16)).toString('base64');

      expect(() => decrypt(encrypted)).toThrow();
    });

    it('should fail to decrypt with wrong IV', () => {
      const plaintext = 'test';
      const encrypted = encrypt(plaintext);

      // Tamper with IV
      encrypted.iv = Buffer.from('b'.repeat(16)).toString('base64');

      expect(() => decrypt(encrypted)).toThrow();
    });
  });

  describe('hash', () => {
    it('should hash data consistently', () => {
      const data = 'password123';
      const hash1 = hash(data);
      const hash2 = hash(data);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different data', () => {
      const hash1 = hash('password1');
      const hash2 = hash('password2');

      expect(hash1).not.toBe(hash2);
    });

    it('should produce hex string', () => {
      const data = 'test';
      const hashed = hash(data);

      expect(typeof hashed).toBe('string');
      expect(hashed).toMatch(/^[a-f0-9]{64}$/); // SHA-256 = 64 hex chars
    });

    it('should handle empty string', () => {
      const hashed = hash('');

      expect(typeof hashed).toBe('string');
      expect(hashed.length).toBe(64);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate random token', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();

      expect(token1).not.toBe(token2);
    });

    it('should generate token with default length', () => {
      const token = generateSecureToken();

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate token with custom length', () => {
      const token = generateSecureToken(64);

      expect(typeof token).toBe('string');
      // Base64url encoding, length varies but should be substantial
      expect(token.length).toBeGreaterThan(80);
    });

    it('should use URL-safe characters', () => {
      const token = generateSecureToken();

      // Base64url should not contain +, /, or =
      expect(token).not.toContain('+');
      expect(token).not.toContain('/');
      expect(token).not.toContain('=');
    });
  });

  describe('secureCompare', () => {
    it('should return true for equal strings', () => {
      const str = 'test-string';
      expect(secureCompare(str, str)).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(secureCompare('string1', 'string2')).toBe(false);
    });

    it('should return false for different length strings', () => {
      expect(secureCompare('short', 'longer string')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(secureCompare('Test', 'test')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(secureCompare('', '')).toBe(true);
      expect(secureCompare('', 'test')).toBe(false);
    });
  });

  describe('deriveKey', () => {
    it('should derive key from password', () => {
      const password = 'my-password';
      const { key, salt } = deriveKey(password);

      expect(key).toBeInstanceOf(Buffer);
      expect(salt).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32); // 256 bits
    });

    it('should produce same key with same password and salt', () => {
      const password = 'my-password';
      const { key: key1, salt } = deriveKey(password);
      const { key: key2 } = deriveKey(password, salt);

      expect(key1.toString('hex')).toBe(key2.toString('hex'));
    });

    it('should produce different keys with different passwords', () => {
      const { key: key1 } = deriveKey('password1');
      const { key: key2 } = deriveKey('password2');

      expect(key1.toString('hex')).not.toBe(key2.toString('hex'));
    });

    it('should produce different keys with different salts', () => {
      const password = 'same-password';
      const { key: key1 } = deriveKey(password);
      const { key: key2 } = deriveKey(password);

      // Different random salts should produce different keys
      expect(key1.toString('hex')).not.toBe(key2.toString('hex'));
    });
  });

  describe('testEncryption', () => {
    it('should pass encryption test', () => {
      const result = testEncryption();
      expect(result).toBe(true);
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate base64 key', () => {
      const key = generateEncryptionKey();

      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    });

    it('should generate different keys', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });

    it('should generate valid base64', () => {
      const key = generateEncryptionKey();
      const buffer = Buffer.from(key, 'base64');

      expect(buffer.length).toBe(32); // 256 bits
    });
  });

  describe('end-to-end encryption', () => {
    it('should encrypt and decrypt API keys', () => {
      const apiKey = 'sk-test-1234567890abcdef';
      const encrypted = encrypt(apiKey);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(apiKey);
    });

    it('should encrypt and decrypt JSON data', () => {
      const jsonData = JSON.stringify({
        userId: 'user-123',
        apiKey: 'secret-key',
        config: { timeout: 5000 },
      });

      const encrypted = encrypt(jsonData);
      const decrypted = decrypt(encrypted);
      const parsed = JSON.parse(decrypted);

      expect(parsed.userId).toBe('user-123');
      expect(parsed.apiKey).toBe('secret-key');
      expect(parsed.config.timeout).toBe(5000);
    });
  });
});
