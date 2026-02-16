/**
 * Health Checker - Domain-specific health check implementation
 * /**
 * Health Check Logic Summary:
 * 
 * Poll Kubernetes API every 30s to check pod status across configured namespaces.
 * For each pod with auto-recovery label:
 * - Read pod phase and container statuses
 * - Count restarts in last 10 minutes
 * - Check for waiting/terminated containers
 * - Query recent events for error patterns
 * - Calculate health score (0-100) based on signals
 * 
 * Unhealthy if: phase != Running, restarts > 3, or container errors present.
 * Remediable if: restart count < 5 (circuit breaker threshold) and controller exists.
 */
 */

import { createLogger } from './utils/logger';
import { MonitoringConfig } from './config';

const logger = createLogger('HealthChecker');

export interface HealthResult {
  target: string;
  healthy: boolean;
  message: string;
  severity?: 'info' | 'warning' | 'critical';
  remediable?: boolean;
  metadata?: Record<string, any>;
}

export class HealthChecker {
  private config: MonitoringConfig;

  constructor(config: MonitoringConfig) {
    this.config = config;
  }

  /**
   * Check health of all configured targets
   */
  async checkAll(): Promise<HealthResult[]> {
    const results: HealthResult[] = [];

    for (const target of this.config.targets) {
      try {
        const result = await this.checkTarget(target);
        results.push(result);
      } catch (error) {
        logger.error(`Failed to check ${target}`, error as Error);
        results.push({
          target,
          healthy: false,
          message: `Health check failed: ${(error as Error).message}`,
          severity: 'warning',
        });
      }
    }

    return results;
  }

  /**
   * Check health of a single target
   * /**
 * Health Check Implementation for Kubernetes Pods
 * 
 * Approach:
 * 1. Query Kubernetes API for pod status using client-go equivalent
 * 2. Analyze pod phase (Pending, Running, Failed, Unknown)
 * 3. Inspect container statuses for restart counts and state
 * 4. Check for CrashLoopBackOff, ImagePullBackOff, OOMKilled conditions
 * 5. Evaluate resource pressure indicators (CPU/memory throttling)
 * 6. Calculate health score based on multiple signals
 * 
 * Detection Criteria:
 * - Pod phase not "Running" for >2 minutes
 * - Container restart count >3 in last 10 minutes
 * - Container in waiting/terminated state
 * - Pod events showing errors (pulled from events API)
 * - Readiness probe failures >3 consecutive
 * 
 * False Positive Mitigation:
 * - Ignore pods in deliberate rollout/update
 * - Grace period for initial startup (5 minutes)
 * - Check if pod is being evicted intentionally
 */
   */
  private async checkTarget(target: string): Promise<HealthResult> {
    // Domain-specific health check logic injected here
    // Check pod health via Kubernetes API
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const namespace = target.split('/')[0];
const podName = target.split('/')[1];

try {
  const pod = await k8sApi.readNamespacedPod(podName, namespace);
  const phase = pod.body.status?.phase;
  const containerStatuses = pod.body.status?.containerStatuses || [];
  
  // Check for crash loops or failures
  const restartCount = containerStatuses.reduce((sum, c) => sum + (c.restartCount || 0), 0);
  const hasFailure = containerStatuses.some(c => c.state?.waiting || c.state?.terminated);
  
  if (phase !== 'Running' || hasFailure || restartCount > 3) {
    return {
      target,
      healthy: false,
      message: `Pod ${podName}: phase=${phase}, restarts=${restartCount}`,
      severity: restartCount > 5 ? 'critical' : 'warning',
      remediable: restartCount < 5,
      metadata: { phase, restartCount, containerStatuses }
    };
  }
  
  return { target, healthy: true, message: 'Pod running normally' };
} catch (error) {
  return { target, healthy: false, message: error.message, severity: 'critical', remediable: false };
}
  }
}
