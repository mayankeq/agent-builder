import { createLogger } from './logger';

const logger = createLogger('ErrorHandler');

/**
 * Custom error types
 */
export class AgentBuilderError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AgentBuilderError';
  }
}

export class ValidationError extends AgentBuilderError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ApiError extends AgentBuilderError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'API_ERROR', details);
    this.name = 'ApiError';
  }
}

export class TimeoutError extends AgentBuilderError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'TIMEOUT_ERROR', details);
    this.name = 'TimeoutError';
  }
}

/**
 * Retry options
 */
export interface RetryOptions {
  maxAttempts: number;
  initialBackoff: number;
  maxBackoff?: number;
  exponentialBase?: number;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxAttempts,
    initialBackoff,
    maxBackoff = 30000,
    exponentialBase = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.debug(`Attempt ${attempt}/${maxAttempts}`);
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts || !shouldRetry(lastError)) {
        logger.error(
          `Failed after ${attempt} attempts`,
          lastError
        );
        throw lastError;
      }

      const backoff = Math.min(
        initialBackoff * Math.pow(exponentialBase, attempt - 1),
        maxBackoff
      );

      logger.warning(
        `Attempt ${attempt} failed, retrying in ${backoff}ms`,
        { error: lastError.message }
      );

      await sleep(backoff);
    }
  }

  throw lastError || new Error('Retry failed with no error');
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wrap function with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Safe JSON parse with error handling
 */
export function safeJSONParse<T>(
  json: string,
  fallback: T
): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    logger.warning('Failed to parse JSON, using fallback', {
      error: (error as Error).message,
    });
    return fallback;
  }
}

/**
 * Format error for user display
 */
export function formatError(error: Error): string {
  if (error instanceof AgentBuilderError) {
    let message = `${error.name}: ${error.message}`;
    if (error.details) {
      message += `\nDetails: ${JSON.stringify(error.details, null, 2)}`;
    }
    return message;
  }
  return `Error: ${error.message}`;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof TimeoutError) {
    return true;
  }

  if (error instanceof ApiError) {
    const statusCode = (error.details?.statusCode as number) || 0;
    return statusCode >= 500 || statusCode === 429;
  }

  return false;
}
