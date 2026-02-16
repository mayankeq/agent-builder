import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger, createLoggerWithRequestId } from '../monitoring/logger';
import { httpRequestDuration, httpRequestTotal } from '../monitoring/metrics';

/**
 * Middleware to log HTTP requests and responses
 */
export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate unique request ID
  const requestId = uuidv4();
  (req as any).id = requestId;

  // Create request-specific logger
  const requestLogger = createLoggerWithRequestId(requestId);

  // Record start time
  const startTime = Date.now();

  // Log request
  requestLogger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?.userId,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    res.send = originalSend;

    // Calculate duration
    const duration = (Date.now() - startTime) / 1000; // seconds
    const statusCode = res.statusCode;

    // Log response
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    requestLogger.log(logLevel, 'Request completed', {
      method: req.method,
      path: req.path,
      statusCode,
      duration,
      userId: (req as any).user?.userId,
    });

    // Record metrics
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: statusCode.toString(),
      },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: statusCode.toString(),
    });

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Middleware to add request ID to response headers
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).id || uuidv4();
  (req as any).id = requestId;

  res.setHeader('X-Request-ID', requestId);

  next();
}

/**
 * Middleware to log slow requests
 */
export function slowRequestLoggerMiddleware(thresholdMs: number = 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      if (duration > thresholdMs) {
        logger.warn('Slow request detected', {
          method: req.method,
          path: req.path,
          duration,
          statusCode: res.statusCode,
          userId: (req as any).user?.userId,
        });
      }
    });

    next();
  };
}

logger.info('Request logging middleware initialized');
