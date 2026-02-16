// Real Google OAuth Server for Synthient
// Uses passport-google-oauth20 for authentication

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Agent runner integration
const { createAgent, getSession, listSessions } = require('./agent-runner');

// Load config from auth-domains.yaml
const fs = require('fs');
const yaml = require('yaml');
const path = require('path');

let allowedDomains = ['trilogy.com', 'devfactory.com', 'aurea.com', 'vrya.com'];
try {
  const configPath = path.join(__dirname, 'config', 'auth-domains.yaml');
  const configFile = fs.readFileSync(configPath, 'utf8');
  const config = yaml.parse(configFile);
  if (config.allowed_domains) {
    allowedDomains = config.allowed_domains;
  }
} catch (error) {
  console.log('Using default allowed domains');
}

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

// Initialize Passport
app.use(passport.initialize());

// In-memory user storage (replace with database in production)
const users = new Map();
const sessions = new Map();

// Helper: Check if email domain is allowed
function isAllowedDomain(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return allowedDomains.some(d => d.toLowerCase() === domain);
}

// Helper: Check if it's a workspace account (not personal Gmail)
function isWorkspaceAccount(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain !== 'gmail.com' && domain !== 'googlemail.com';
}

// Helper: Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      domain: user.domain
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h', issuer: 'synthient' }
  );
}

// Helper: Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const isVerified = profile.emails[0].verified;

      // Validation checks
      if (!isVerified) {
        return done(null, false, { message: 'Email not verified' });
      }

      if (!isWorkspaceAccount(email)) {
        return done(null, false, {
          message: 'Only Google Workspace accounts are allowed. Personal Gmail accounts are not permitted.'
        });
      }

      if (!isAllowedDomain(email)) {
        const domain = email.split('@')[1];
        return done(null, false, {
          message: `Domain ${domain} is not authorized. Allowed domains: ${allowedDomains.join(', ')}`
        });
      }

      // Create or update user
      const domain = email.split('@')[1];
      const user = {
        id: profile.id,
        email,
        name: profile.displayName,
        picture: profile.photos?.[0]?.value,
        domain,
        provider: 'google',
        lastLogin: new Date().toISOString()
      };

      users.set(user.id, user);

      // Generate JWT token
      const token = generateToken(user);

      return done(null, { user, token });
    } catch (error) {
      console.error('OAuth error:', error);
      return done(error, null);
    }
  }
));

// Middleware: Require authentication
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    oauth: 'enabled'
  });
});

// Get auth configuration
app.get('/api/auth/config', (req, res) => {
  res.json({
    allowed_domains: allowedDomains,
    google_oauth_enabled: true,
    workspace_only: true
  });
});

// Initiate Google OAuth
app.get('/api/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

// Google OAuth callback
app.get('/api/auth/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`
  }),
  (req, res) => {
    if (!req.user || !req.user.token) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_token`);
    }

    const { token } = req.user;

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// Get current user
app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = users.get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    domain: user.domain
  });
});

// Logout
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  sessions.delete(token);

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Create agent
app.post('/api/agents/create', requireAuth, (req, res) => {
  const { description, output_format, language, options } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  try {
    const sessionId = createAgent({
      description,
      output_format: output_format || 'mcp',
      language: language || 'typescript',
      options: options || {},
      userId: req.user.id
    });

    const session = getSession(sessionId);

    console.log('Creating agent:', {
      user: req.user.email,
      sessionId,
      description,
      output_format,
      language
    });

    res.json({
      id: session.id,
      message: 'Agent creation started',
      status: session.status,
      progress: session.progress,
      description: session.description,
      output_format: session.output_format,
      language: session.language,
      created_at: session.created_at
    });
  } catch (error) {
    console.error('Agent creation error:', error);
    res.status(500).json({
      error: 'Failed to create agent',
      message: error.message
    });
  }
});

// Get agent
app.get('/api/agents/:sessionId', requireAuth, (req, res) => {
  const { sessionId } = req.params;
  const session = getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Verify user owns this session
  if (session.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json({
    id: session.id,
    status: session.status,
    progress: session.progress,
    description: session.description,
    output_format: session.output_format,
    language: session.language,
    created_at: session.created_at,
    updated_at: session.updated_at,
    completed_at: session.completed_at,
    result: session.result,
    error: session.error,
    logs: session.logs.slice(-50) // Last 50 log entries
  });
});

// List agents
app.get('/api/agents', requireAuth, (req, res) => {
  const userSessions = listSessions(req.user.id);

  const agents = userSessions.map(session => ({
    id: session.id,
    user_id: session.userId,
    description: session.description,
    output_format: session.output_format,
    language: session.language,
    status: session.status,
    progress: session.progress,
    created_at: session.created_at,
    updated_at: session.updated_at,
    completed_at: session.completed_at,
    result: session.result,
    error: session.error,
    logs: session.logs.slice(-50) // Last 50 log entries for each agent
  }));

  res.json({
    agents,
    total: agents.length
  });
});

// Stream logs via Server-Sent Events (SSE)
app.get('/api/agents/:sessionId/logs/stream', (req, res) => {
  const { sessionId } = req.params;
  const { token } = req.query;

  // Verify token from query param (EventSource doesn't support custom headers)
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }

  const session = getSession(sessionId);

  // Verify session exists and belongs to user
  if (!session || session.userId !== decoded.id) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial logs
  let lastSentIndex = 0;
  session.logs.forEach((log, index) => {
    res.write(`data: ${JSON.stringify({ ...log, index })}\n\n`);
    lastSentIndex = index + 1;
  });

  // Send current status
  res.write(`data: ${JSON.stringify({
    type: 'status',
    status: session.status,
    progress: session.progress,
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Poll for new logs every 500ms
  const pollInterval = setInterval(() => {
    const currentSession = getSession(sessionId);
    if (!currentSession) {
      clearInterval(pollInterval);
      res.end();
      return;
    }

    // Send any new logs
    const newLogs = currentSession.logs.slice(lastSentIndex);
    newLogs.forEach((log, index) => {
      res.write(`data: ${JSON.stringify({ ...log, index: lastSentIndex + index })}\n\n`);
    });
    lastSentIndex = currentSession.logs.length;

    // Send status update
    res.write(`data: ${JSON.stringify({
      type: 'status',
      status: currentSession.status,
      progress: currentSession.progress,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Close connection if completed or failed
    if (currentSession.status === 'completed' || currentSession.status === 'failed') {
      res.write(`data: ${JSON.stringify({ type: 'done', status: currentSession.status })}\n\n`);
      clearInterval(pollInterval);
      res.end();
    }
  }, 500);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(pollInterval);
  });
});

// Download agent ZIP
app.get('/api/agents/:sessionId/download', requireAuth, (req, res) => {
  const { sessionId } = req.params;
  const session = getSession(sessionId);

  // Verify session exists and belongs to user
  if (!session || session.userId !== req.user.id) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  // Check if agent generation completed
  if (session.status !== 'completed') {
    return res.status(400).json({ error: 'Agent generation not completed yet' });
  }

  // Check if ZIP exists
  const zipPath = path.join(__dirname, 'output', 'downloads', `${sessionId}-${session.output_format}.zip`);
  if (!fs.existsSync(zipPath)) {
    return res.status(404).json({ error: 'Download package not found' });
  }

  // Send file for download
  res.download(zipPath, `${sessionId}-${session.output_format}.zip`, (err) => {
    if (err) {
      console.error('Download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`\n🚀 Synthient OAuth Server running on http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`🔐 OAuth endpoint: http://localhost:${port}/api/auth/google`);
    console.log(`\n🏢 Allowed domains: ${allowedDomains.join(', ')}`);
    console.log(`🔑 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Configured' : '⚠️  NOT CONFIGURED - Update .env file'}`);
    console.log(`\n✅ Server ready!\n`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} is in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

startServer(PORT);
