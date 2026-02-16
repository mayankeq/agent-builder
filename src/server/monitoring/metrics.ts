import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { logger } from './logger';

// Create a new registry
const register = new Registry();

// Add default metrics (CPU, memory, event loop, etc.)
collectDefaultMetrics({ register, prefix: 'agent_builder_' });

// Custom metrics

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'agent_builder_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'agent_builder_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestErrors = new Counter({
  name: 'agent_builder_http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'error_type'],
  registers: [register],
});

// WebSocket metrics
export const wsConnectionsActive = new Gauge({
  name: 'agent_builder_ws_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

export const wsMessagesTotal = new Counter({
  name: 'agent_builder_ws_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['type', 'direction'], // direction: 'sent' | 'received'
  registers: [register],
});

export const wsConnectionDuration = new Histogram({
  name: 'agent_builder_ws_connection_duration_seconds',
  help: 'Duration of WebSocket connections in seconds',
  buckets: [60, 300, 600, 1800, 3600], // 1min, 5min, 10min, 30min, 1hr
  registers: [register],
});

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'agent_builder_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'], // 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export const dbConnectionsActive = new Gauge({
  name: 'agent_builder_db_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

export const dbConnectionsIdle = new Gauge({
  name: 'agent_builder_db_connections_idle',
  help: 'Number of idle database connections',
  registers: [register],
});

export const dbQueryErrors = new Counter({
  name: 'agent_builder_db_query_errors_total',
  help: 'Total number of database query errors',
  labelNames: ['error_type'],
  registers: [register],
});

// Agent creation metrics
export const agentCreationsTotal = new Counter({
  name: 'agent_builder_agent_creations_total',
  help: 'Total number of agent creation requests',
  labelNames: ['output_type', 'language'],
  registers: [register],
});

export const agentCreationDuration = new Histogram({
  name: 'agent_builder_agent_creation_duration_seconds',
  help: 'Duration of agent creation workflow in seconds',
  labelNames: ['output_type', 'language', 'status'], // status: 'completed' | 'failed'
  buckets: [60, 300, 600, 900, 1200, 1800, 2400], // 1min to 40min
  registers: [register],
});

export const agentCreationsActive = new Gauge({
  name: 'agent_builder_agent_creations_active',
  help: 'Number of active agent creation workflows',
  registers: [register],
});

export const agentPhasesDuration = new Histogram({
  name: 'agent_builder_agent_phase_duration_seconds',
  help: 'Duration of each agent creation phase',
  labelNames: ['phase'], // 'clarification', 'design', 'implementation', 'packaging', 'learning'
  buckets: [30, 60, 120, 300, 600, 900], // 30s to 15min
  registers: [register],
});

// Authentication metrics
export const authAttemptsTotal = new Counter({
  name: 'agent_builder_auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['provider', 'status'], // status: 'success' | 'failure'
  registers: [register],
});

export const authSessionsActive = new Gauge({
  name: 'agent_builder_auth_sessions_active',
  help: 'Number of active authenticated sessions',
  registers: [register],
});

// API key metrics
export const apiKeyValidations = new Counter({
  name: 'agent_builder_api_key_validations_total',
  help: 'Total number of API key validation attempts',
  labelNames: ['result'], // result: 'valid' | 'invalid'
  registers: [register],
});

// Claude API metrics
export const claudeApiCallsTotal = new Counter({
  name: 'agent_builder_claude_api_calls_total',
  help: 'Total number of Claude API calls',
  labelNames: ['model', 'status'], // status: 'success' | 'error'
  registers: [register],
});

export const claudeApiDuration = new Histogram({
  name: 'agent_builder_claude_api_duration_seconds',
  help: 'Duration of Claude API calls in seconds',
  labelNames: ['model'],
  buckets: [1, 5, 10, 30, 60, 120, 300],
  registers: [register],
});

export const claudeApiTokensUsed = new Counter({
  name: 'agent_builder_claude_api_tokens_used_total',
  help: 'Total number of tokens used in Claude API calls',
  labelNames: ['model', 'type'], // type: 'input' | 'output'
  registers: [register],
});

// S3 metrics
export const s3OperationsTotal = new Counter({
  name: 'agent_builder_s3_operations_total',
  help: 'Total number of S3 operations',
  labelNames: ['operation', 'status'], // operation: 'upload' | 'download', status: 'success' | 'error'
  registers: [register],
});

export const s3OperationDuration = new Histogram({
  name: 'agent_builder_s3_operation_duration_seconds',
  help: 'Duration of S3 operations in seconds',
  labelNames: ['operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

/**
 * Get all metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  try {
    return await register.metrics();
  } catch (error) {
    logger.error('Error getting metrics', { error });
    throw error;
  }
}

/**
 * Get metrics content type
 */
export function getMetricsContentType(): string {
  return register.contentType;
}

/**
 * Clear all metrics (for testing)
 */
export function clearMetrics(): void {
  register.resetMetrics();
}

logger.info('Metrics initialized', {
  defaultMetricsEnabled: true,
  customMetricsCount: register.getSingleMetric('agent_builder_http_requests_total') ? 'available' : 'unavailable',
});

export { register };
