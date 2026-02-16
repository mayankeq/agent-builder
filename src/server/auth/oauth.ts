import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AzureADStrategy } from 'passport-azure-ad-oauth2';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../monitoring/logger';
import { UserStore } from '../storage/user-store';
import { generateToken } from './jwt';
import { auditLog } from '../monitoring/audit';

const userStore = new UserStore();

// SSO Provider configuration
const SSO_PROVIDERS = {
  google: {
    enabled: !!process.env.GOOGLE_CLIENT_ID,
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
  },
  azure: {
    enabled: !!process.env.AZURE_CLIENT_ID,
    clientID: process.env.AZURE_CLIENT_ID || '',
    clientSecret: process.env.AZURE_CLIENT_SECRET || '',
    tenant: process.env.AZURE_TENANT_ID || 'common',
    callbackURL: process.env.AZURE_CALLBACK_URL || 'http://localhost:3000/api/auth/azure/callback',
  },
  okta: {
    enabled: !!process.env.OKTA_CLIENT_ID,
    domain: process.env.OKTA_DOMAIN || '',
    clientID: process.env.OKTA_CLIENT_ID || '',
    clientSecret: process.env.OKTA_CLIENT_SECRET || '',
    callbackURL: process.env.OKTA_CALLBACK_URL || 'http://localhost:3000/api/auth/okta/callback',
  },
};

/**
 * Configure Passport strategies for SSO providers
 */
export function configureOAuthStrategies(): void {
  // Google OAuth2 Strategy
  if (SSO_PROVIDERS.google.enabled) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: SSO_PROVIDERS.google.clientID,
          clientSecret: SSO_PROVIDERS.google.clientSecret,
          callbackURL: SSO_PROVIDERS.google.callbackURL,
          scope: ['profile', 'email'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error('No email found in Google profile'), undefined);
            }

            // Find or create user
            let user = await userStore.findByEmail(email);
            if (!user) {
              user = await userStore.create({
                email,
                name: profile.displayName,
                sso_provider: 'google',
                sso_id: profile.id,
              });
              logger.info('New user created via Google OAuth', { userId: user.id, email });
            } else {
              // Update last login
              await userStore.updateLastLogin(user.id);
            }

            return done(null, user);
          } catch (error) {
            logger.error('Error in Google OAuth callback', { error });
            return done(error as Error, undefined);
          }
        }
      )
    );
    logger.info('Google OAuth strategy configured');
  }

  // Azure AD Strategy
  if (SSO_PROVIDERS.azure.enabled) {
    passport.use(
      new AzureADStrategy(
        {
          clientID: SSO_PROVIDERS.azure.clientID,
          clientSecret: SSO_PROVIDERS.azure.clientSecret,
          callbackURL: SSO_PROVIDERS.azure.callbackURL,
          tenant: SSO_PROVIDERS.azure.tenant,
        },
        async (_accessToken: string, _refreshToken: string, _params: any, profile: any, done: any) => {
          try {
            const email = profile.upn || profile.email;
            if (!email) {
              return done(new Error('No email found in Azure AD profile'), undefined);
            }

            let user = await userStore.findByEmail(email);
            if (!user) {
              user = await userStore.create({
                email,
                name: profile.displayName,
                sso_provider: 'azure',
                sso_id: profile.oid,
              });
              logger.info('New user created via Azure AD OAuth', { userId: user.id, email });
            } else {
              await userStore.updateLastLogin(user.id);
            }

            return done(null, user);
          } catch (error) {
            logger.error('Error in Azure AD OAuth callback', { error });
            return done(error, undefined);
          }
        }
      )
    );
    logger.info('Azure AD OAuth strategy configured');
  }

  // Note: Okta would use OpenID Connect strategy
  // Implementation depends on specific Okta configuration
}

/**
 * Handle OAuth callback and generate JWT
 */
export function handleOAuthCallback(provider: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(provider, { session: false }, async (err: Error, user: any) => {
      if (err || !user) {
        logger.error('OAuth authentication failed', { provider, error: err });
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      }

      try {
        // Generate JWT token
        const token = generateToken({
          userId: user.id,
          email: user.email,
          name: user.name,
        });

        // Log successful authentication
        await auditLog({
          userId: user.id,
          eventType: 'login',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          details: { provider },
        });

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
      } catch (error) {
        logger.error('Error generating token after OAuth', { error, provider });
        res.redirect(`${process.env.FRONTEND_URL}/login?error=token_generation_failed`);
      }
    })(req, res, next);
  };
}

/**
 * Get list of available SSO providers
 */
export function getAvailableProviders(): string[] {
  return Object.entries(SSO_PROVIDERS)
    .filter(([_, config]) => config.enabled)
    .map(([provider]) => provider);
}

/**
 * Validate SSO configuration on startup
 */
export function validateSSOConfig(): void {
  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    logger.warn('No SSO providers configured. Users will not be able to log in.');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('At least one SSO provider must be configured in production');
    }
  }

  logger.info(`SSO providers configured: ${availableProviders.join(', ')}`);
}

export { passport, SSO_PROVIDERS };
