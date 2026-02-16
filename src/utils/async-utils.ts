import { createLogger } from './logger';

const logger = createLogger('AsyncUtils');

/**
 * Semaphore for controlling concurrency
 */
export class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    if (permits <= 0) {
      throw new Error('Semaphore permits must be positive');
    }
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.queue.length > 0) {
      const resolve = this.queue.shift()!;
      this.permits--;
      resolve();
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  getAvailablePermits(): number {
    return this.permits;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

/**
 * Execute tasks with limited concurrency
 */
export async function parallelLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const semaphore = new Semaphore(limit);
  return Promise.all(tasks.map((task) => semaphore.execute(task)));
}

/**
 * Batch executor for processing items in parallel batches
 */
export class ParallelBatch<R> {
  private jobs: Array<() => Promise<R>> = [];

  constructor(private maxConcurrency: number = 10) {}

  addJob(fn: () => Promise<R>): void {
    this.jobs.push(fn);
  }

  addJobs(...fns: Array<() => Promise<R>>): void {
    this.jobs.push(...fns);
  }

  async runJobs(): Promise<R[]> {
    logger.info(`Running ${this.jobs.length} jobs with concurrency ${this.maxConcurrency}`);

    const results = await parallelLimit(this.jobs, this.maxConcurrency);

    this.jobs = [];
    return results;
  }

  getJobCount(): number {
    return this.jobs.length;
  }

  clear(): void {
    this.jobs = [];
  }
}

/**
 * Wait for available workers in a pool
 */
export async function waitForAvailableWorkers(
  semaphore: Semaphore,
  threshold: number = 1
): Promise<void> {
  while (semaphore.getAvailablePermits() < threshold) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
}

/**
 * Throttle function execution
 */
export function throttle(
  fn: (...args: any[]) => void,
  intervalMs: number
): (...args: any[]) => void {
  let lastCall = 0;

  return function (...args: any[]) {
    const now = Date.now();

    if (now - lastCall >= intervalMs) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Retry async operation
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts) {
        logger.debug(`Attempt ${attempt} failed, retrying...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Execute with timeout
 */
export async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}
