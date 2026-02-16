/**
 * Performance metrics for operations
 */
export interface PerformanceMetric {
  operationId: string;
  operationName: string;
  category: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryBefore?: number;
  memoryAfter?: number;
  memoryDelta?: number;
  metadata?: Record<string, any>;
}

/**
 * Success metrics for sessions
 */
export interface SuccessMetrics {
  sessionId: string;
  timestamp: Date;
  completionRate: number;
  testPassRate?: number;
  validationScore?: number;
  userSatisfaction?: number;
  tokenUsage: number;
  duration: number;
  errorCount: number;
}

/**
 * Performance optimization tracking
 */
export interface OptimizationMetric {
  type: string;
  strategy: string;
  impact: string;
  estimatedImprovement?: number;
  actualImprovement?: number;
}

/**
 * Metrics tracker interface
 */
export interface IMetricsTracker {
  recordMetrics(metrics: SuccessMetrics): Promise<void>;
  getAverageMetrics(days?: number): Promise<SuccessMetrics>;
  trackTokenUsage(sessionId: string, tokens: number): void;
  trackSuccessRate(): Promise<number>;
}
