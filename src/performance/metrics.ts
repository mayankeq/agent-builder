import { createLogger } from '../utils/logger';
import { PerformanceMetric } from '../types/metrics';

const logger = createLogger('PerformanceMetrics');

/**
 * Performance Metrics - Measures operation performance
 */
export class PerformanceMetrics {
  private metrics: Map<string, PerformanceMetric> = new Map();

  /**
   * Start tracking an operation
   */
  startOperation(operationId: string, operationName: string, category: string = 'general'): void {
    const metric: PerformanceMetric = {
      operationId,
      operationName,
      category,
      startTime: Date.now(),
      memoryBefore: this.getCurrentMemoryUsage(),
    };

    this.metrics.set(operationId, metric);

    logger.debug(`Operation started: ${operationName}`, { operationId });
  }

  /**
   * End tracking an operation
   */
  endOperation(operationId: string, metadata?: Record<string, any>): PerformanceMetric | null {
    const metric = this.metrics.get(operationId);

    if (!metric) {
      logger.warning(`Operation not found: ${operationId}`);
      return null;
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.memoryAfter = this.getCurrentMemoryUsage();
    metric.memoryDelta = metric.memoryAfter - (metric.memoryBefore || 0);
    metric.metadata = metadata;

    logger.info(`Operation completed: ${metric.operationName}`, {
      operationId,
      duration: metric.duration,
    });

    return metric;
  }

  /**
   * Get metrics for an operation
   */
  getOperationMetrics(operationId: string): PerformanceMetric | null {
    return this.metrics.get(operationId) || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const allMetrics = this.getAllMetrics();

    if (allMetrics.length === 0) {
      return 'No performance metrics recorded';
    }

    const completed = allMetrics.filter(m => m.duration !== undefined);
    const avgDuration = completed.reduce((sum, m) => sum + (m.duration || 0), 0) / completed.length;

    const report = `
Performance Report
==================
Total Operations: ${allMetrics.length}
Completed: ${completed.length}
Average Duration: ${Math.round(avgDuration)}ms

Operations:
${completed.map(m => `  - ${m.operationName}: ${m.duration}ms`).join('\n')}
    `;

    return report.trim();
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    logger.debug('Metrics cleared');
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }
}
