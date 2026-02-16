import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { logger } from '../monitoring/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_ISSUER = 'agent-builder-api';

export interface JWTPayload {
  userId: string;
  email: string;
  name?: string;
  iat?: number;
  exp?: number;
  iss?: string;
}

/**
 * Generate a JWT token for authenticated user
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss'>): string {
  try {
    const token = jwt.sign(
      payload,
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
        issuer: JWT_ISSUER,
        algorithm: 'HS256',
      }
    );

    logger.debug('JWT token generated', { userId: payload.userId });
    return token;
  } catch (error) {
    logger.error('Error generating JWT token', { error });
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      JWT_SECRET,
      {
        issuer: JWT_ISSUER,
        algorithms: ['HS256'],
      },
      (err, decoded) => {
        if (err) {
          logger.debug('JWT verification failed', { error: err.message });
          if (err.name === 'TokenExpiredError') {
            reject(new Error('Token expired'));
          } else if (err.name === 'JsonWebTokenError') {
            reject(new Error('Invalid token'));
          } else {
            reject(new Error('Token verification failed'));
          }
        } else {
          resolve(decoded as JWTPayload);
        }
      }
    );
  });
}

/**
 * Decode token without verification (for inspection only)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    logger.error('Error decoding JWT token', { error });
    return null;
  }
}

/**
 * Calculate token hash for storage (SHA-256)
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Refresh token if it's close to expiration
 */
export function shouldRefreshToken(token: string): boolean {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;

    // Refresh if less than 1 day remaining
    return timeUntilExpiry < 86400;
  } catch (error) {
    return true;
  }
}

/**
 * Get token expiration date
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}

/**
 * Validate JWT secret is properly configured
 */
export function validateJWTConfig(): void {
  if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'development-secret-change-in-production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }

  if (JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET is shorter than 32 characters, consider using a longer secret');
  }
}
