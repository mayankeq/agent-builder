import crypto from 'crypto';
import { logger } from '../monitoring/logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

// Encryption key should be 32 bytes (256 bits) for AES-256
const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Get encryption key from environment or generate one
 */
function getEncryptionKey(): Buffer {
  const keyFromEnv = process.env.ENCRYPTION_KEY;

  if (keyFromEnv) {
    // Key should be base64 encoded 32-byte key
    try {
      const key = Buffer.from(keyFromEnv, 'base64');
      if (key.length !== 32) {
        throw new Error(`Encryption key must be 32 bytes, got ${key.length}`);
      }
      return key;
    } catch (error) {
      logger.error('Invalid ENCRYPTION_KEY format', { error });
      throw new Error('ENCRYPTION_KEY must be a base64-encoded 32-byte key');
    }
  }

  // Development mode: generate a random key (WARNING: not persistent)
  if (process.env.NODE_ENV !== 'production') {
    logger.warn('Using random encryption key - data will not be decryptable after restart');
    return crypto.randomBytes(32);
  }

  throw new Error('ENCRYPTION_KEY environment variable must be set in production');
}

export interface EncryptedData {
  encrypted: string;  // Base64-encoded encrypted data
  iv: string;         // Base64-encoded IV
  authTag: string;    // Base64-encoded authentication tag
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encrypt(plaintext: string): EncryptedData {
  try {
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  } catch (error) {
    logger.error('Encryption failed', { error });
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export function decrypt(encryptedData: EncryptedData): string {
  try {
    // Parse encrypted data
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    const encrypted = encryptedData.encrypted;

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Decryption failed', { error });
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data (one-way, for comparison)
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Derive key from password using PBKDF2 (for future use)
 */
export function deriveKey(password: string, salt?: Buffer): { key: Buffer; salt: Buffer } {
  const actualSalt = salt || crypto.randomBytes(SALT_LENGTH);
  const key = crypto.pbkdf2Sync(password, actualSalt, 100000, 32, 'sha256');

  return { key, salt: actualSalt };
}

/**
 * Validate encryption configuration on startup
 */
export function validateEncryptionConfig(): void {
  if (process.env.NODE_ENV === 'production' && !process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY must be set in production environment');
  }

  if (ENCRYPTION_KEY.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes');
  }

  logger.info('Encryption configuration validated');
}

/**
 * Generate a new encryption key (for setup)
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(32);
  return key.toString('base64');
}

/**
 * Test encryption/decryption functionality
 */
export function testEncryption(): boolean {
  try {
    const testData = 'test-data-' + Date.now();
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);

    if (decrypted !== testData) {
      throw new Error('Decrypted data does not match original');
    }

    logger.info('Encryption test passed');
    return true;
  } catch (error) {
    logger.error('Encryption test failed', { error });
    return false;
  }
}

// Export key generation utility for setup
if (require.main === module) {
  // If run directly, generate a new encryption key
  console.log('Generated encryption key (base64):');
  console.log(generateEncryptionKey());
  console.log('\nAdd this to your .env file as:');
  console.log(`ENCRYPTION_KEY=${generateEncryptionKey()}`);
}
