import { createLogger } from '../utils/logger';
import { FileManager } from '../utils/file-manager';
import { SuccessMetrics } from '../types/metrics';
import * as path from 'path';

const logger = createLogger('MetricsTracker');

/**
 * Metrics Tracker - Tracks success metrics and performance over time
 */
export class MetricsTracker {
  private storageDir: string;
  private metricsFile: string;

  constructor(storageDir?: string) {
    this.storageDir = storageDir || path.join(process.cwd(), 'data', 'memory', 'metrics');
    this.metricsFile = path.join(this.storageDir, 'metrics.jsonl');

    logger.info('Metrics tracker initialized');
  }

  /**
   * Record session metrics
   */
  async recordMetrics(metrics: SuccessMetrics): Promise<void> {
    try {
      await FileManager.appendJSONL(this.metricsFile, {
        ...metrics,
        timestamp: metrics.timestamp.toISOString(),
      });

      logger.info('Metrics recorded', {
        sessionId: metrics.sessionId,
        completionRate: metrics.completionRate,
      });
    } catch (error) {
      logger.error('Failed to record metrics', error as Error);
    }
  }

  /**
   * Get average metrics over time period
   */
  async getAverageMetrics(days: number = 30): Promise<SuccessMetrics | null> {
    try {
      const allMetrics = await this.loadMetrics();

      if (allMetrics.length === 0) {
        return null;
      }

      // Filter by date
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const recent = allMetrics.filter(m => m.timestamp >= cutoff);

      if (recent.length === 0) {
        return null;
      }

      // Calculate averages
      const avg: SuccessMetrics = {
        sessionId: 'average',
        timestamp: new Date(),
        completionRate: this.average(recent.map(m => m.completionRate)),
        testPassRate: this.average(recent.map(m => m.testPassRate || 0)),
        validationScore: this.average(recent.map(m => m.validationScore || 0)),
        userSatisfaction: this.average(recent.map(m => m.userSatisfaction || 0)),
        tokenUsage: this.average(recent.map(m => m.tokenUsage)),
        duration: this.average(recent.map(m => m.duration)),
        errorCount: this.average(recent.map(m => m.errorCount)),
      };

      return avg;
    } catch (error) {
      logger.error('Failed to calculate average metrics', error as Error);
      return null;
    }
  }

  /**
   * Track success rate over time
   */
  async trackSuccessRate(days: number = 30): Promise<number> {
    try {
      const allMetrics = await this.loadMetrics();

      if (allMetrics.length === 0) {
        return 0;
      }

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const recent = allMetrics.filter(m => m.timestamp >= cutoff);

      if (recent.length === 0) {
        return 0;
      }

      const successCount = recent.filter(m => m.completionRate >= 0.8).length;

      return successCount / recent.length;
    } catch (error) {
      logger.error('Failed to track success rate', error as Error);
      return 0;
    }
  }

  /**
   * Track token usage
   */
  trackTokenUsage(sessionId: string, tokens: number): void {
    logger.info('Token usage tracked', { sessionId, tokens });
    // This would be called during session and recorded with other metrics
  }

  /**
   * Load all metrics from JSONL file
   */
  private async loadMetrics(): Promise<SuccessMetrics[]> {
    try {
      const exists = await FileManager.exists(this.metricsFile);

      if (!exists) {
        return [];
      }

      const entries = await FileManager.readJSONL<any>(this.metricsFile);

      return entries.map(entry => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
    } catch (error) {
      logger.error('Failed to load metrics', error as Error);
      return [];
    }
  }

  /**
   * Calculate average of numbers
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return sum / numbers.length;
  }
}
