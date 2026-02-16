import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
}

export interface Logger {
  debug(message: string, meta?: Record<string, any>): void;
  info(message: string, meta?: Record<string, any>): void;
  warning(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: Error, meta?: Record<string, any>): void;
}

class StructuredLogger implements Logger {
  constructor(
    private context: string,
    private level: LogLevel = LogLevel.INFO
  ) {}

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(
    level: string,
    message: string,
    meta?: Record<string, any>
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = chalk.gray(`[${this.context}]`);
    const timeStr = chalk.gray(timestamp);

    let levelStr: string;
    switch (level) {
      case 'DEBUG':
        levelStr = chalk.blue(level);
        break;
      case 'INFO':
        levelStr = chalk.green(level);
        break;
      case 'WARNING':
        levelStr = chalk.yellow(level);
        break;
      case 'ERROR':
        levelStr = chalk.red(level);
        break;
      default:
        levelStr = level;
    }

    let output = `${timeStr} ${levelStr} ${contextStr} ${message}`;

    if (meta && Object.keys(meta).length > 0) {
      output += chalk.gray(` | ${JSON.stringify(meta)}`);
    }

    return output;
  }

  debug(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, meta));
    }
  }

  info(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage('INFO', message, meta));
    }
  }

  warning(message: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARNING)) {
      console.warn(this.formatMessage('WARNING', message, meta));
    }
  }

  error(message: string, error?: Error, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorMeta = error
        ? { ...meta, error: error.message, stack: error.stack }
        : meta;
      console.error(this.formatMessage('ERROR', message, errorMeta));
    }
  }
}

export function createLogger(
  context: string,
  level?: LogLevel
): Logger {
  return new StructuredLogger(context, level);
}

export function getLogLevelFromString(level: string): LogLevel {
  switch (level.toUpperCase()) {
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'WARNING':
      return LogLevel.WARNING;
    case 'ERROR':
      return LogLevel.ERROR;
    default:
      return LogLevel.INFO;
  }
}
