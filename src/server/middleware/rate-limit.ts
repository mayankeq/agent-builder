import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../monitoring/logger';
import { audit } from '../monitoring/audit';

/**
 * Standard rate limiter for API endpoints
 */
export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
  },
  handler: async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;

    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userId,
      path: req.path,
      method: req.method,
    });

    // Audit rate limit event
    await audit.rateLimitExceeded(userId, req.path, req.ip || 'unknown');

    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60), // seconds
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/metrics';
  },
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise IP
    const userId = (req as any).user?.userId;
    return userId || req.ip || 'unknown';
  },
});

/**
 * Strict rate limiter for sensitive endpoints (auth, API keys)
 */
export const strictRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many attempts, please try again later.',
  },
  handler: async (req: Request, res: Response) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many attempts from this IP, please try again later.',
      retryAfter: Math.ceil(15 * 60), // seconds
    });
  },
  keyGenerator: (req: Request) => {
    return req.ip || 'unknown';
  },
});

/**
 * Agent creation rate limiter (max 5 concurrent creations)
 */
export const agentCreationRateLimitMiddleware = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 agent creations per hour per user
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'You have reached the maximum number of agent creations per hour.',
  },
  handler: async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;

    logger.warn('Agent creation rate limit exceeded', {
      userId,
      ip: req.ip,
    });

    await audit.rateLimitExceeded(userId, '/api/agents/create', req.ip || 'unknown');

    res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have reached the maximum number of agent creations per hour.',
      retryAfter: Math.ceil(60 * 60), // seconds
    });
  },
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return req.ip || 'unknown';
    }
    return `user:${userId}`;
  },
  skip: (req: Request) => {
    // Don't rate limit if user is not authenticated (will be caught by auth middleware)
    return !(req as any).user;
  },
});

/**
 * Download rate limiter
 */
export const downloadRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Max 50 downloads per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many download requests, please try again later.',
  },
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.userId;
    return userId ? `download:${userId}` : req.ip || 'unknown';
  },
});

logger.info('Rate limiting middleware initialized');
