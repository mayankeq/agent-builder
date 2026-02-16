import { Router, Request, Response } from 'express';
import { asyncHandler, ValidationError } from '../middleware/error-handler';
import { strictRateLimitMiddleware } from '../middleware/rate-limit';
import { query } from '../storage/database';
import { encrypt, decrypt } from '../security/encryption';
import { logger } from '../monitoring/logger';
import { audit } from '../monitoring/audit';
import { apiKeyValidations } from '../monitoring/metrics';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

interface EncryptedApiKey {
  id: string;
  user_id: string;
  encrypted_key: string;
  iv: string;
  auth_tag: string;
  is_valid: boolean;
  last_validated?: Date;
  created_at: Date;
}

/**
 * POST /api/api-keys
 * Add or update user's Anthropic API key
 */
router.post('/',
  strictRateLimitMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
      throw new ValidationError('API key is required');
    }

    // Basic format validation
    if (!apiKey.startsWith('sk-ant-')) {
      throw new ValidationError('Invalid API key format');
    }

    // Encrypt the API key
    const encrypted = encrypt(apiKey);

    // Check if user already has an API key
    const existing = await query<EncryptedApiKey>(
      'SELECT id FROM user_api_keys WHERE user_id = $1',
      [userId]
    );

    let sql: string;
    let params: any[];

    if (existing.rows.length > 0) {
      // Update existing key
      sql = `
        UPDATE user_api_keys
        SET encrypted_key = $1, iv = $2, auth_tag = $3, is_valid = true, last_validated = NULL
        WHERE user_id = $4
        RETURNING id
      `;
      params = [encrypted.encrypted, encrypted.iv, encrypted.authTag, userId];
    } else {
      // Insert new key
      sql = `
        INSERT INTO user_api_keys (user_id, encrypted_key, iv, auth_tag, is_valid)
        VALUES ($1, $2, $3, $4, true)
        RETURNING id
      `;
      params = [userId, encrypted.encrypted, encrypted.iv, encrypted.authTag];
    }

    await query(sql, params);

    // Audit log
    await audit.apiKeyAdded(userId, req.ip || 'unknown');

    logger.info('API key stored', { userId });

    res.json({
      success: true,
      message: 'API key stored successfully',
    });
  })
);

/**
 * POST /api/api-keys/validate
 * Validate user's stored API key
 */
router.post('/validate',
  strictRateLimitMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Get encrypted API key
    const result = await query<EncryptedApiKey>(
      'SELECT * FROM user_api_keys WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new ValidationError('No API key found');
    }

    const encryptedKey = result.rows[0];

    try {
      // Decrypt API key
      const apiKey = decrypt({
        encrypted: encryptedKey.encrypted_key,
        iv: encryptedKey.iv,
        authTag: encryptedKey.auth_tag,
      });

      // Test API key with Anthropic
      const client = new Anthropic({ apiKey });

      // Make a minimal API call to validate
      await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'test',
        }],
      });

      // Update validation status
      await query(
        'UPDATE user_api_keys SET is_valid = true, last_validated = NOW() WHERE id = $1',
        [encryptedKey.id]
      );

      logger.info('API key validated', { userId });
      apiKeyValidations.inc({ result: 'valid' });

      res.json({
        valid: true,
        message: 'API key is valid',
        lastValidated: new Date(),
      });
    } catch (error: any) {
      // Mark as invalid
      await query(
        'UPDATE user_api_keys SET is_valid = false WHERE id = $1',
        [encryptedKey.id]
      );

      const errorMessage = error.message || 'API key validation failed';
      logger.warn('API key validation failed', { userId, error: errorMessage });

      apiKeyValidations.inc({ result: 'invalid' });

      await audit.apiKeyValidationFailed(userId, req.ip || 'unknown', errorMessage);

      res.status(400).json({
        valid: false,
        message: 'API key is invalid',
        error: errorMessage,
      });
    }
  })
);

/**
 * GET /api/api-keys/status
 * Get API key status (exists, valid, last validated)
 */
router.get('/status',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result = await query<EncryptedApiKey>(
      'SELECT is_valid, last_validated, created_at FROM user_api_keys WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.json({
        exists: false,
      });
      return;
    }

    const apiKey = result.rows[0];

    res.json({
      exists: true,
      valid: apiKey.is_valid,
      lastValidated: apiKey.last_validated,
      createdAt: apiKey.created_at,
    });
  })
);

/**
 * DELETE /api/api-keys
 * Delete user's API key
 */
router.delete('/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const result = await query(
      'DELETE FROM user_api_keys WHERE user_id = $1',
      [userId]
    );

    if (result.rowCount === 0) {
      throw new ValidationError('No API key found');
    }

    logger.info('API key deleted', { userId });

    res.json({
      success: true,
      message: 'API key deleted successfully',
    });
  })
);

export default router;
