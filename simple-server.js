// Simple OAuth Server for Testing
// Run with: node simple-server.js

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// CORS
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:8000'],
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Auth config
app.get('/api/auth/config', (req, res) => {
  res.json({
    allowed_domains: ['trilogy.com', 'devfactory.com', 'aurea.com', 'vrya.com'],
    google_oauth_enabled: true
  });
});

// Initiate Google OAuth (mock)
app.get('/api/auth/google', (req, res) => {
  console.log('OAuth initiated - redirecting to mock callback...');

  // For testing: Generate a mock token and redirect
  const mockToken = 'mock-jwt-token-' + Date.now();
  const frontendUrl = 'http://localhost:3001';

  // In production, this would redirect to Google OAuth
  // For now, redirect directly back with a token
  res.redirect(`${frontendUrl}/auth/callback?token=${mockToken}`);
});

// Get current user (mock)
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token || !token.startsWith('mock-jwt-token')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({
    id: '123456',
    email: 'test@trilogy.com',
    name: 'Test User',
    picture: 'https://via.placeholder.com/150',
    domain: 'trilogy.com'
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

// Create agent (mock)
app.post('/api/agents/create', (req, res) => {
  const { description, output_format, language } = req.body;

  const sessionId = 'session-' + Date.now();

  console.log('Creating agent:', { description, output_format, language, sessionId });

  res.json({
    id: sessionId,
    message: 'Agent creation started',
    status: 'in_progress'
  });
});

// List agents (mock)
app.get('/api/agents', (req, res) => {
  res.json({
    agents: [
      {
        id: 'session-123',
        description: 'Customer support chatbot',
        output_format: 'mcp',
        language: 'typescript',
        status: 'completed',
        progress: 100,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        completed_at: new Date().toISOString(),
        result: {
          output_path: '/output/customer-support-bot',
          files: ['index.ts', 'package.json', 'README.md'],
          tests_passed: 42,
          tests_total: 42
        }
      },
      {
        id: 'session-456',
        description: 'Data analysis agent',
        output_format: 'cli',
        language: 'python',
        status: 'in_progress',
        progress: 65,
        created_at: new Date(Date.now() - 1200000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    total: 2
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Simple OAuth Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 OAuth endpoint: http://localhost:${PORT}/api/auth/google`);
  console.log('\n✅ Backend ready! Now you can test the frontend OAuth flow.\n');
});
