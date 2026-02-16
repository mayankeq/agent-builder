import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import yaml from 'yaml';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

interface AuthConfig {
  allowed_domains: string[];
  oauth: {
    google: {
      client_id: string;
      client_secret: string;
      callback_url: string;
    };
  };
  jwt: {
    secret: string;
    expires_in: string;
    issuer: string;
  };
  security: {
    require_verified_email: boolean;
    workspace_only: boolean;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  domain: string;
  provider: string;
  created_at: Date;
  last_login: Date;
}

export class GoogleOAuthService {
  private config: AuthConfig;
  private db: any; // Replace with your actual DB type

  constructor(dbConnection: any) {
    this.db = dbConnection;
    this.config = this.loadConfig();
    this.setupPassport();
  }

  private loadConfig(): AuthConfig {
    const configPath = path.join(__dirname, '../../../config/auth-domains.yaml');
    const configFile = fs.readFileSync(configPath, 'utf8');

    // Replace environment variables
    const configWithEnv = configFile.replace(/\$\{(\w+)(?::-([^}]+))?\}/g, (match, envVar, defaultValue) => {
      return process.env[envVar] || defaultValue || '';
    });

    return yaml.parse(configWithEnv);
  }

  /**
   * Check if an email domain is allowed
   */
  private isAllowedDomain(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    return this.config.allowed_domains.some(
      allowedDomain => domain === allowedDomain.toLowerCase()
    );
  }

  /**
   * Check if email is a Google Workspace account (not personal Gmail)
   */
  private isWorkspaceAccount(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    // Personal Gmail accounts are @gmail.com or @googlemail.com
    return domain !== 'gmail.com' && domain !== 'googlemail.com';
  }

  /**
   * Validate user based on security policies
   */
  private async validateUser(profile: Profile): Promise<{ valid: boolean; reason?: string }> {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      return { valid: false, reason: 'No email found in profile' };
    }

    // Check if email is verified
    if (this.config.security.require_verified_email) {
      const isVerified = profile.emails?.[0]?.verified;
      if (!isVerified) {
        return { valid: false, reason: 'Email not verified' };
      }
    }

    // Check if it's a workspace account
    if (this.config.security.workspace_only && !this.isWorkspaceAccount(email)) {
      return { valid: false, reason: 'Only Google Workspace accounts are allowed' };
    }

    // Check if domain is allowed
    if (!this.isAllowedDomain(email)) {
      const domain = email.split('@')[1];
      return {
        valid: false,
        reason: `Domain ${domain} is not authorized. Allowed domains: ${this.config.allowed_domains.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Save or update user in database
   */
  private async saveUser(profile: Profile): Promise<User> {
    const email = profile.emails?.[0]?.value!;
    const domain = email.split('@')[1];

    const userData: User = {
      id: profile.id,
      email,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value,
      domain,
      provider: 'google',
      created_at: new Date(),
      last_login: new Date(),
    };

    // Check if user exists
    const existingUser = await this.db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      // Update last login
      await this.db.query(
        'UPDATE users SET last_login = $1, picture = $2 WHERE email = $3',
        [new Date(), userData.picture, email]
      );
      return { ...existingUser.rows[0], last_login: new Date() };
    } else {
      // Insert new user
      const result = await this.db.query(
        `INSERT INTO users (id, email, name, picture, domain, provider, created_at, last_login)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          userData.id,
          userData.email,
          userData.name,
          userData.picture,
          userData.domain,
          userData.provider,
          userData.created_at,
          userData.last_login,
        ]
      );
      return result.rows[0];
    }
  }

  /**
   * Generate JWT token for authenticated user
   */
  generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        domain: user.domain,
      },
      this.config.jwt.secret,
      {
        expiresIn: this.config.jwt.expires_in,
        issuer: this.config.jwt.issuer,
      }
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.config.jwt.secret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Setup Passport Google OAuth strategy
   */
  private setupPassport(): void {
    passport.use(
      new GoogleStrategy(
        {
          clientID: this.config.oauth.google.client_id,
          clientSecret: this.config.oauth.google.client_secret,
          callbackURL: this.config.oauth.google.callback_url,
          scope: ['profile', 'email'],
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: Profile,
          done: VerifyCallback
        ) => {
          try {
            // Validate user
            const validation = await this.validateUser(profile);

            if (!validation.valid) {
              return done(null, false, { message: validation.reason });
            }

            // Save/update user
            const user = await this.saveUser(profile);

            // Generate JWT
            const token = this.generateToken(user);

            // Return user with token
            return done(null, { user, token });
          } catch (error) {
            console.error('OAuth error:', error);
            return done(error as Error, undefined);
          }
        }
      )
    );

    // Serialize user for session
    passport.serializeUser((user: any, done) => {
      done(null, user.user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done) => {
      try {
        const result = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
        done(null, result.rows[0]);
      } catch (error) {
        done(error, null);
      }
    });
  }

  /**
   * Get list of allowed domains (for display purposes)
   */
  getAllowedDomains(): string[] {
    return this.config.allowed_domains;
  }

  /**
   * Middleware to protect routes
   */
  requireAuth() {
    return async (req: any, res: any, next: any) => {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No authentication token provided',
        });
      }

      const decoded = this.verifyToken(token);

      if (!decoded) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        });
      }

      // Attach user to request
      req.user = decoded;
      next();
    };
  }
}

export default GoogleOAuthService;
