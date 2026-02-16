import winston from 'winston';
import path from 'path';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_DIR = process.env.LOG_DIR || './logs';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}] ${message}`;

    // Add metadata if present
    const metadataKeys = Object.keys(metadata);
    if (metadataKeys.length > 0) {
      // Filter out empty objects and standard winston fields
      const filteredMetadata = Object.fromEntries(
        Object.entries(metadata).filter(([key, value]) =>
          key !== 'timestamp' &&
          key !== 'level' &&
          key !== 'message' &&
          !(typeof value === 'object' && Object.keys(value).length === 0)
        )
      );

      if (Object.keys(filteredMetadata).length > 0) {
        msg += ` ${JSON.stringify(filteredMetadata)}`;
      }
    }

    return msg;
  })
);

// Create transports based on environment
const transports: winston.transport[] = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: NODE_ENV === 'production' ? structuredFormat : consoleFormat,
  })
);

// File transports (production only or if LOG_DIR is set)
if (NODE_ENV === 'production' || process.env.LOG_DIR) {
  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
      format: structuredFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );

  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
      format: structuredFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: structuredFormat,
  defaultMeta: {
    service: 'agent-builder-api',
    environment: NODE_ENV,
  },
  transports,
  exitOnError: false,
});

// Add request ID to log context
export function createLoggerWithRequestId(requestId: string): winston.Logger {
  return logger.child({ requestId });
}

// Stream for Morgan HTTP logger
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Helper functions for common logging patterns
export const loggers = {
  auth: (message: string, meta?: object) => {
    logger.info(message, { category: 'auth', ...meta });
  },

  security: (message: string, meta?: object) => {
    logger.warn(message, { category: 'security', ...meta });
  },

  database: (message: string, meta?: object) => {
    logger.debug(message, { category: 'database', ...meta });
  },

  api: (message: string, meta?: object) => {
    logger.info(message, { category: 'api', ...meta });
  },

  workflow: (message: string, meta?: object) => {
    logger.info(message, { category: 'workflow', ...meta });
  },
};

// Log unhandled errors
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise,
  });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });

  // Give logger time to write before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Log startup information
logger.info('Logger initialized', {
  level: LOG_LEVEL,
  environment: NODE_ENV,
  logDir: LOG_DIR,
  transports: transports.map(t => t.constructor.name),
});
