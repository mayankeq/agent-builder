import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import path from 'path';
import GoogleOAuthService from './auth/google-oauth';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'synthient',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Initialize OAuth service
const authService = new GoogleOAuthService(db);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(passport.initialize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use('/api', limiter);

// Authentication Routes
app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=auth_failed' }),
  (req: any, res: Response) => {
    const token = req.user.token;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
);

app.post('/auth/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/auth/me', authService.requireAuth(), async (req: any, res: Response) => {
  const result = await db.query('SELECT id, email, name, picture, domain FROM users WHERE id = $1', [req.user.id]);
  res.json(result.rows[0]);
});

app.get('/auth/config', (req: Request, res: Response) => {
  res.json({
    allowed_domains: authService.getAllowedDomains(),
    google_oauth_enabled: true,
  });
});

// Email Subscription Endpoint (Public - No Auth Required)
app.post('/api/subscribe', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    // Validate email
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Store in database
    const query = `
      INSERT INTO email_subscribers (email, name, subscribed_at, source)
      VALUES ($1, $2, NOW(), 'website')
      ON CONFLICT (email) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, email_subscribers.name),
        subscribed_at = NOW()
      RETURNING id, email, name
    `;

    const result = await db.query(query, [email.toLowerCase().trim(), name?.trim() || null]);

    // TODO: Add to your email marketing service (Mailchimp, ConvertKit, etc.)
    // Example:
    // await mailchimp.lists.addListMember(LIST_ID, { email_address: email, status: 'subscribed' });

    console.log('📧 New subscriber:', email);

    res.json({
      success: true,
      message: 'Successfully subscribed!',
      subscriber: result.rows[0]
    });
  } catch (error) {
    console.error('Error subscribing email:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Get subscriber count (Public)
app.get('/api/subscribers/count', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT COUNT(*) as count FROM email_subscribers');
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    res.json({ count: 500 }); // Fallback
  }
});

// Protected API Routes
app.post('/api/agents/create', authService.requireAuth(), async (req: any, res: Response) => {
  const { description, output_format, language, options } = req.body;
  res.json({ message: 'Agent creation started', session_id: 'session-123', status: 'in_progress' });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

db.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Synthient server running on http://localhost:${PORT}`);
      console.log(`🔐 Allowed domains: ${authService.getAllowedDomains().join(', ')}`);
    });
  })
  .catch((error) => {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  });

export default app;
