import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../auth/jwt';
import { logger } from '../monitoring/logger';
import { audit } from '../monitoring/audit';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to verify JWT token and attach user info to request
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.debug('Authentication failed: No authorization header', {
        path: req.path,
        ip: req.ip,
      });

      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      logger.debug('Authentication failed: Invalid authorization format', {
        path: req.path,
        ip: req.ip,
      });

      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format',
      });
      return;
    }

    const token = parts[1];

    // Verify token
    try {
      const payload = await verifyToken(token);

      // Attach user info to request
      req.user = payload;

      logger.debug('User authenticated', {
        userId: payload.userId,
        email: payload.email,
        path: req.path,
      });

      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token verification failed';

      logger.debug('Authentication failed: Token verification error', {
        error: errorMessage,
        path: req.path,
        ip: req.ip,
      });

      // Audit unauthorized access attempt
      await audit.unauthorizedAccess(
        undefined,
        req.path,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.status(401).json({
        error: 'Unauthorized',
        message: errorMessage,
      });
    }
  } catch (error) {
    logger.error('Authentication middleware error', {
      error,
      path: req.path,
    });

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // No token provided, continue without user
    return next();
  }

  try {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const payload = await verifyToken(token);
      req.user = payload;
    }
  } catch (error) {
    // Token invalid, but don't fail the request
    logger.debug('Optional auth: Invalid token ignored', {
      path: req.path,
    });
  }

  next();
}

/**
 * Middleware to require specific user (resource ownership check)
 */
export function requireUser(userIdField: string = 'userId') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField];

    if (!resourceUserId) {
      res.status(400).json({
        error: 'Bad Request',
        message: `${userIdField} is required`,
      });
      return;
    }

    if (req.user.userId !== resourceUserId) {
      logger.warn('Authorization failed: User mismatch', {
        requestedUserId: resourceUserId,
        actualUserId: req.user.userId,
        path: req.path,
      });

      audit.unauthorizedAccess(
        req.user.userId,
        req.path,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown'
      );

      res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied',
      });
      return;
    }

    next();
  };
}

/**
 * Extract user ID from request (from JWT or parameter)
 */
export function getUserId(req: Request): string | null {
  return req.user?.userId || null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(req: Request): boolean {
  return !!req.user;
}
