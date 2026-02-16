import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { logger } from './monitoring/logger';
import { verifyToken } from './auth/jwt';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  sessionId?: string;
  isAlive: boolean;
}

interface SessionUpdate {
  type: 'session_update' | 'phase_change' | 'progress' | 'error' | 'completed';
  sessionId: string;
  data: {
    status?: string;
    phase?: string;
    progress?: number;
    message?: string;
    error?: string;
    artifacts?: string;
  };
  timestamp: string;
}

// Store active WebSocket connections by session ID
const sessionConnections = new Map<string, Set<AuthenticatedWebSocket>>();

/**
 * Initialize WebSocket server with authentication and connection management
 */
export function initializeWebSocket(wss: WebSocketServer): void {
  logger.info('Initializing WebSocket server');

  // Heartbeat interval to detect dead connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      const authenticatedWs = ws as AuthenticatedWebSocket;
      if (!authenticatedWs.isAlive) {
        logger.debug('Terminating dead WebSocket connection');
        return authenticatedWs.terminate();
      }
      authenticatedWs.isAlive = false;
      authenticatedWs.ping();
    });
  }, 30000); // 30 seconds

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', async (ws: WebSocket, request: IncomingMessage) => {
    const authenticatedWs = ws as AuthenticatedWebSocket;
    authenticatedWs.isAlive = true;

    // Extract token from query string
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    const sessionId = url.searchParams.get('sessionId');

    if (!token) {
      logger.warn('WebSocket connection attempt without token');
      authenticatedWs.close(4001, 'Authentication required');
      return;
    }

    if (!sessionId) {
      logger.warn('WebSocket connection attempt without sessionId');
      authenticatedWs.close(4002, 'Session ID required');
      return;
    }

    try {
      // Verify JWT token
      const payload = await verifyToken(token);
      authenticatedWs.userId = payload.userId;
      authenticatedWs.sessionId = sessionId;

      logger.info(`WebSocket connected: user=${payload.userId}, session=${sessionId}`);

      // Add to session connections
      if (!sessionConnections.has(sessionId)) {
        sessionConnections.set(sessionId, new Set());
      }
      sessionConnections.get(sessionId)!.add(authenticatedWs);

      // Send welcome message
      authenticatedWs.send(JSON.stringify({
        type: 'connected',
        sessionId,
        timestamp: new Date().toISOString(),
      }));

      // Handle pong responses for heartbeat
      authenticatedWs.on('pong', () => {
        authenticatedWs.isAlive = true;
      });

      // Handle messages from client
      authenticatedWs.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          handleClientMessage(authenticatedWs, message);
        } catch (error) {
          logger.error('Error parsing WebSocket message', { error });
          authenticatedWs.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
          }));
        }
      });

      // Handle disconnection
      authenticatedWs.on('close', () => {
        logger.info(`WebSocket disconnected: user=${authenticatedWs.userId}, session=${sessionId}`);
        if (sessionId && sessionConnections.has(sessionId)) {
          sessionConnections.get(sessionId)!.delete(authenticatedWs);
          if (sessionConnections.get(sessionId)!.size === 0) {
            sessionConnections.delete(sessionId);
          }
        }
      });

      authenticatedWs.on('error', (error) => {
        logger.error('WebSocket error', { error, userId: authenticatedWs.userId, sessionId });
      });

    } catch (error) {
      logger.warn('WebSocket authentication failed', { error });
      authenticatedWs.close(4003, 'Authentication failed');
    }
  });
}

/**
 * Handle messages from client
 */
function handleClientMessage(ws: AuthenticatedWebSocket, message: any): void {
  switch (message.type) {
    case 'ping':
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString(),
      }));
      break;

    case 'subscribe':
      // Already subscribed on connection, but acknowledge
      ws.send(JSON.stringify({
        type: 'subscribed',
        sessionId: ws.sessionId,
        timestamp: new Date().toISOString(),
      }));
      break;

    default:
      logger.debug('Unknown WebSocket message type', { type: message.type });
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Unknown message type',
      }));
  }
}

/**
 * Broadcast session update to all connected clients for that session
 */
export function broadcastSessionUpdate(update: SessionUpdate): void {
  const { sessionId } = update;
  const connections = sessionConnections.get(sessionId);

  if (!connections || connections.size === 0) {
    logger.debug(`No active WebSocket connections for session ${sessionId}`);
    return;
  }

  const message = JSON.stringify(update);
  let successCount = 0;
  let errorCount = 0;

  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
        successCount++;
      } catch (error) {
        logger.error('Error sending WebSocket message', { error, sessionId });
        errorCount++;
      }
    }
  });

  logger.debug(`Broadcast session update: session=${sessionId}, sent=${successCount}, errors=${errorCount}`);
}

/**
 * Send update to specific user's connections across all their sessions
 */
export function sendUserUpdate(userId: string, update: any): void {
  let sentCount = 0;

  sessionConnections.forEach((connections, _sessionId) => {
    connections.forEach((ws) => {
      if (ws.userId === userId && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(update));
          sentCount++;
        } catch (error) {
          logger.error('Error sending user update', { error, userId });
        }
      }
    });
  });

  logger.debug(`Sent user update: userId=${userId}, connections=${sentCount}`);
}

/**
 * Get count of active connections for a session
 */
export function getSessionConnectionCount(sessionId: string): number {
  return sessionConnections.get(sessionId)?.size || 0;
}

/**
 * Close all connections for a session
 */
export function closeSessionConnections(sessionId: string, code: number = 1000, reason: string = 'Session ended'): void {
  const connections = sessionConnections.get(sessionId);
  if (!connections) {
    return;
  }

  connections.forEach((ws) => {
    try {
      ws.close(code, reason);
    } catch (error) {
      logger.error('Error closing WebSocket connection', { error, sessionId });
    }
  });

  sessionConnections.delete(sessionId);
  logger.info(`Closed all WebSocket connections for session ${sessionId}`);
}

export { SessionUpdate };
