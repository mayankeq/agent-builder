import { query } from '../storage/database';
import { logger } from './logger';

export interface AuditLogEntry {
  userId?: string;
  sessionId?: string;
  eventType: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

/**
 * Log an audit event to the database
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  const sql = `
    INSERT INTO audit_log (user_id, session_id, event_type, ip_address, user_agent, details)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;

  try {
    await query(sql, [
      entry.userId || null,
      entry.sessionId || null,
      entry.eventType,
      entry.ipAddress || null,
      entry.userAgent || null,
      entry.details ? JSON.stringify(entry.details) : null,
    ]);

    logger.debug('Audit log entry created', {
      eventType: entry.eventType,
      userId: entry.userId,
      sessionId: entry.sessionId,
    });
  } catch (error) {
    // Don't throw - audit logging failure shouldn't break the application
    logger.error('Failed to create audit log entry', { error, entry });
  }
}

/**
 * Predefined audit event types for consistency
 */
export const AuditEvents = {
  // Authentication events
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOGIN_FAILED: 'login_failed',
  SESSION_EXPIRED: 'session_expired',

  // Agent creation events
  CREATE_SESSION: 'create_session',
  SESSION_COMPLETED: 'session_completed',
  SESSION_FAILED: 'session_failed',
  SESSION_CANCELLED: 'session_cancelled',

  // API key events
  API_KEY_ADDED: 'api_key_added',
  API_KEY_VALIDATED: 'api_key_validated',
  API_KEY_VALIDATION_FAILED: 'api_key_validation_failed',
  API_KEY_DELETED: 'api_key_deleted',

  // Download events
  DOWNLOAD_ARTIFACTS: 'download_artifacts',
  DOWNLOAD_FILE: 'download_file',

  // Security events
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_TOKEN: 'invalid_token',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',

  // Administrative events
  USER_CREATED: 'user_created',
  USER_DELETED: 'user_deleted',
  SETTINGS_UPDATED: 'settings_updated',
} as const;

/**
 * Helper functions for common audit events
 */
export const audit = {
  login: async (userId: string, ipAddress: string, userAgent: string, provider: string) => {
    await auditLog({
      userId,
      eventType: AuditEvents.LOGIN,
      ipAddress,
      userAgent,
      details: { provider },
    });
  },

  logout: async (userId: string, ipAddress: string) => {
    await auditLog({
      userId,
      eventType: AuditEvents.LOGOUT,
      ipAddress,
    });
  },

  loginFailed: async (email: string, ipAddress: string, reason: string) => {
    await auditLog({
      eventType: AuditEvents.LOGIN_FAILED,
      ipAddress,
      details: { email, reason },
    });
  },

  createSession: async (userId: string, sessionId: string, request: string, ipAddress: string) => {
    await auditLog({
      userId,
      sessionId,
      eventType: AuditEvents.CREATE_SESSION,
      ipAddress,
      details: { request },
    });
  },

  sessionCompleted: async (userId: string, sessionId: string, durationSeconds: number) => {
    await auditLog({
      userId,
      sessionId,
      eventType: AuditEvents.SESSION_COMPLETED,
      details: { durationSeconds },
    });
  },

  sessionFailed: async (userId: string, sessionId: string, error: string) => {
    await auditLog({
      userId,
      sessionId,
      eventType: AuditEvents.SESSION_FAILED,
      details: { error },
    });
  },

  apiKeyAdded: async (userId: string, ipAddress: string) => {
    await auditLog({
      userId,
      eventType: AuditEvents.API_KEY_ADDED,
      ipAddress,
    });
  },

  apiKeyValidationFailed: async (userId: string, ipAddress: string, reason: string) => {
    await auditLog({
      userId,
      eventType: AuditEvents.API_KEY_VALIDATION_FAILED,
      ipAddress,
      details: { reason },
    });
  },

  downloadArtifacts: async (userId: string, sessionId: string, ipAddress: string) => {
    await auditLog({
      userId,
      sessionId,
      eventType: AuditEvents.DOWNLOAD_ARTIFACTS,
      ipAddress,
    });
  },

  unauthorizedAccess: async (userId: string | undefined, resource: string, ipAddress: string, userAgent: string) => {
    await auditLog({
      userId,
      eventType: AuditEvents.UNAUTHORIZED_ACCESS,
      ipAddress,
      userAgent,
      details: { resource },
    });
  },

  rateLimitExceeded: async (userId: string | undefined, endpoint: string, ipAddress: string) => {
    await auditLog({
      userId,
      eventType: AuditEvents.RATE_LIMIT_EXCEEDED,
      ipAddress,
      details: { endpoint },
    });
  },
};

/**
 * Get audit log for a user
 */
export async function getUserAuditLog(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    eventType?: string;
  } = {}
): Promise<any[]> {
  const limit = Math.min(options.limit || 50, 100);
  const offset = options.offset || 0;

  let sql = `
    SELECT *
    FROM audit_log
    WHERE user_id = $1
  `;

  const params: any[] = [userId];

  if (options.eventType) {
    sql += ` AND event_type = $${params.length + 1}`;
    params.push(options.eventType);
  }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  try {
    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    logger.error('Failed to get user audit log', { error, userId });
    throw error;
  }
}

/**
 * Get audit log for a session
 */
export async function getSessionAuditLog(sessionId: string): Promise<any[]> {
  const sql = `
    SELECT *
    FROM audit_log
    WHERE session_id = $1
    ORDER BY created_at ASC
  `;

  try {
    const result = await query(sql, [sessionId]);
    return result.rows;
  } catch (error) {
    logger.error('Failed to get session audit log', { error, sessionId });
    throw error;
  }
}

/**
 * Get security-related audit events (last 24 hours)
 */
export async function getSecurityEvents(limit: number = 100): Promise<any[]> {
  const sql = `
    SELECT *
    FROM audit_log
    WHERE event_type IN ($1, $2, $3, $4, $5)
      AND created_at > NOW() - INTERVAL '24 hours'
    ORDER BY created_at DESC
    LIMIT $6
  `;

  try {
    const result = await query(sql, [
      AuditEvents.LOGIN_FAILED,
      AuditEvents.UNAUTHORIZED_ACCESS,
      AuditEvents.RATE_LIMIT_EXCEEDED,
      AuditEvents.INVALID_TOKEN,
      AuditEvents.SUSPICIOUS_ACTIVITY,
      limit,
    ]);
    return result.rows;
  } catch (error) {
    logger.error('Failed to get security events', { error });
    throw error;
  }
}

logger.info('Audit logging initialized');
