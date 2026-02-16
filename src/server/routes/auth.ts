import { Router, Request, Response } from 'express';
import passport from 'passport';
import { asyncHandler } from '../middleware/error-handler';
import { strictRateLimitMiddleware } from '../middleware/rate-limit';
import { authMiddleware } from '../middleware/auth';
import { UserStore } from '../storage/user-store';
import { generateToken, getTokenExpiration } from '../auth/jwt';
import { handleOAuthCallback, getAvailableProviders } from '../auth/oauth';
import { logger } from '../monitoring/logger';
import { audit } from '../monitoring/audit';
import { authAttemptsTotal } from '../monitoring/metrics';

const router = Router();
const userStore = new UserStore();

/**
 * GET /api/auth/providers
 * Get list of available SSO providers
 */
router.get('/providers', (req: Request, res: Response) => {
  const providers = getAvailableProviders();

  res.json({
    providers,
    count: providers.length,
  });
});

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get('/google',
  strictRateLimitMiddleware,
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get('/google/callback',
  handleOAuthCallback('google')
);

/**
 * GET /api/auth/azure
 * Initiate Azure AD OAuth flow
 */
router.get('/azure',
  strictRateLimitMiddleware,
  passport.authenticate('azure_ad_oauth2', { session: false })
);

/**
 * GET /api/auth/azure/callback
 * Azure AD OAuth callback
 */
router.get('/azure/callback',
  handleOAuthCallback('azure_ad_oauth2')
);

/**
 * POST /api/auth/logout
 * Logout user (invalidate session)
 */
router.post('/logout',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      // Delete the session
      await userStore.deleteSession(token);

      // Audit logout
      await audit.logout(userId, req.ip || 'unknown');

      logger.info('User logged out', { userId });
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  })
);

/**
 * POST /api/auth/logout-all
 * Logout from all devices (delete all sessions)
 */
router.post('/logout-all',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const count = await userStore.deleteAllSessions(userId);

    logger.info('User logged out from all devices', { userId, sessionCount: count });

    res.json({
      success: true,
      message: `Logged out from ${count} device(s)`,
      count,
    });
  })
);

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await userStore.findById(userId);

    if (!user) {
      res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
      return;
    }

    // Get token expiration
    const token = req.headers.authorization?.split(' ')[1];
    const expiresAt = token ? getTokenExpiration(token) : null;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.sso_provider,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      },
      session: {
        expiresAt,
      },
    });
  })
);

/**
 * POST /api/auth/refresh
 * Refresh JWT token (if close to expiration)
 */
router.post('/refresh',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;

    // Generate new token
    const newToken = generateToken({
      userId: user.userId,
      email: user.email,
      name: user.name,
    });

    // Get new expiration
    const expiresAt = getTokenExpiration(newToken);

    // Store new session
    if (expiresAt) {
      await userStore.createSession(user.userId, newToken, expiresAt);
    }

    // Delete old session (if token provided)
    const oldToken = req.headers.authorization?.split(' ')[1];
    if (oldToken) {
      await userStore.deleteSession(oldToken);
    }

    logger.info('Token refreshed', { userId: user.userId });

    res.json({
      token: newToken,
      expiresAt,
    });
  })
);

/**
 * GET /api/auth/status
 * Check authentication status (public endpoint)
 */
router.get('/status', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const hasToken = !!authHeader && authHeader.startsWith('Bearer ');

  res.json({
    authenticated: hasToken,
    providers: getAvailableProviders(),
  });
});

export default router;
