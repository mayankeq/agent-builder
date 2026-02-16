import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
// import { WebSocketServer } from 'ws';
import { config } from '../config/config-manager';
import { logger } from './monitoring/logger';
// import { initializeWebSocket } from './websocket';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { errorHandlerMiddleware } from './middleware/error-handler';
import { requestLoggerMiddleware } from './middleware/request-logger';

// Import routes
import agentsRouter from './routes/agents';
import sessionsRouter from './routes/sessions';
import authRouter from './routes/auth';
import apiKeysRouter from './routes/api-keys';
import downloadsRouter from './routes/downloads';

const app: Express = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
const corsOptions = {
  origin: NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLoggerMiddleware);

// Health check endpoint (no auth required)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', (_req: Request, res: Response) => {
  // TODO: Implement Prometheus metrics
  res.status(200).send('# Metrics endpoint\n');
});

// Public routes (no authentication required)
app.use('/api/auth', authRouter);

// Protected routes (authentication required)
app.use('/api/agents', authMiddleware, rateLimitMiddleware, agentsRouter);
app.use('/api/sessions', authMiddleware, rateLimitMiddleware, sessionsRouter);
app.use('/api/api-keys', authMiddleware, rateLimitMiddleware, apiKeysRouter);
app.use('/api/downloads', authMiddleware, downloadsRouter);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
  });
});

// Error handling middleware (must be last)
app.use(errorHandlerMiddleware);

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket server (temporarily disabled)
// const wss = new WebSocketServer({ server: httpServer });
// initializeWebSocket(wss);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Agent-Builder API server running on port ${PORT} in ${NODE_ENV} mode`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export { app, httpServer };
