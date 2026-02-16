import { Request, Response, NextFunction } from 'express';
import { logger } from '../monitoring/logger';
import { httpRequestErrors } from '../monitoring/metrics';

// Custom error class for application errors
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Main error handling middleware
 */
export function errorHandlerMiddleware(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const isOperational = isAppError ? err.isOperational : false;

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: (req as any).user?.userId,
      statusCode,
    });
  } else {
    logger.warn('Client error', {
      error: err.message,
      path: req.path,
      method: req.method,
      userId: (req as any).user?.userId,
      statusCode,
    });
  }

  // Track error metrics
  const errorType = isAppError ? err.name : 'UnknownError';
  httpRequestErrors.inc({
    method: req.method,
    route: req.route?.path || req.path,
    error_type: errorType,
  });

  // Prepare error response
  const errorResponse: any = {
    error: getErrorName(statusCode),
    message: err.message,
  };

  // Add details for operational errors in development
  if (isAppError && err.details) {
    errorResponse.details = err.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && !isOperational) {
    errorResponse.stack = err.stack;
  }

  // Add request ID if available
  const requestId = (req as any).id;
  if (requestId) {
    errorResponse.requestId = requestId;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Async error wrapper to catch promise rejections
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Get error name from status code
 */
function getErrorName(statusCode: number): string {
  const errorNames: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  return errorNames[statusCode] || 'Error';
}

/**
 * Handle 404 errors for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.debug('Route not found', {
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
    path: req.path,
  });
}

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });

  // In production, you might want to restart the process
  if (process.env.NODE_ENV === 'production') {
    // Give time to log before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
});

logger.info('Error handling middleware initialized');
