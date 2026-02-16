import { query, transaction, PoolClient } from './database';
import { logger } from '../monitoring/logger';
import { broadcastSessionUpdate } from '../websocket';

export interface Session {
  id: string;
  user_id: string;
  user_request: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  current_phase?: 'clarification' | 'design' | 'implementation' | 'packaging' | 'learning';
  progress: number;
  output_type?: 'skill' | 'mcp' | 'cli' | 'library';
  language?: 'typescript' | 'python';
  artifacts_s3_key?: string;
  error?: string;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface CreateSessionParams {
  user_id: string;
  user_request: string;
  output_type?: string;
  language?: string;
  metadata?: Record<string, any>;
}

export interface UpdateSessionParams {
  status?: Session['status'];
  current_phase?: Session['current_phase'];
  progress?: number;
  artifacts_s3_key?: string;
  error?: string;
  metadata?: Record<string, any>;
  completed_at?: Date;
}

export class SessionStore {
  /**
   * Create a new session
   */
  async create(params: CreateSessionParams): Promise<Session> {
    const sql = `
      INSERT INTO sessions (user_id, user_request, status, progress, output_type, language, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    try {
      const result = await query<Session>(sql, [
        params.user_id,
        params.user_request,
        'pending',
        0.0,
        params.output_type || null,
        params.language || null,
        JSON.stringify(params.metadata || {}),
      ]);

      const session = result.rows[0];
      logger.info('Session created', { sessionId: session.id, userId: params.user_id });

      return session;
    } catch (error) {
      logger.error('Error creating session', { error, params });
      throw new Error('Failed to create session');
    }
  }

  /**
   * Get session by ID
   */
  async getById(sessionId: string): Promise<Session | null> {
    const sql = 'SELECT * FROM sessions WHERE id = $1';

    try {
      const result = await query<Session>(sql, [sessionId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting session', { error, sessionId });
      throw new Error('Failed to get session');
    }
  }

  /**
   * Update session
   */
  async update(sessionId: string, params: UpdateSessionParams): Promise<Session> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(params.status);
    }

    if (params.current_phase !== undefined) {
      updates.push(`current_phase = $${paramIndex++}`);
      values.push(params.current_phase);
    }

    if (params.progress !== undefined) {
      updates.push(`progress = $${paramIndex++}`);
      values.push(params.progress);
    }

    if (params.artifacts_s3_key !== undefined) {
      updates.push(`artifacts_s3_key = $${paramIndex++}`);
      values.push(params.artifacts_s3_key);
    }

    if (params.error !== undefined) {
      updates.push(`error = $${paramIndex++}`);
      values.push(params.error);
    }

    if (params.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(params.metadata));
    }

    if (params.completed_at !== undefined) {
      updates.push(`completed_at = $${paramIndex++}`);
      values.push(params.completed_at);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(sessionId);
    const sql = `
      UPDATE sessions
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await query<Session>(sql, values);
      const session = result.rows[0];

      if (!session) {
        throw new Error('Session not found');
      }

      logger.debug('Session updated', { sessionId, updates: Object.keys(params) });

      // Broadcast update via WebSocket
      broadcastSessionUpdate({
        type: params.status === 'completed' ? 'completed' : params.current_phase ? 'phase_change' : 'progress',
        sessionId: session.id,
        data: {
          status: session.status,
          phase: session.current_phase,
          progress: session.progress,
          artifacts: session.artifacts_s3_key,
          error: session.error,
        },
        timestamp: new Date().toISOString(),
      });

      return session;
    } catch (error) {
      logger.error('Error updating session', { error, sessionId, params });
      throw new Error('Failed to update session');
    }
  }

  /**
   * Get sessions for user with pagination
   */
  async listByUser(
    userId: string,
    options: {
      page?: number;
      pageSize?: number;
      status?: Session['status'];
    } = {}
  ): Promise<{ sessions: Session[]; total: number }> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE user_id = $1';
    const params: any[] = [userId];

    if (options.status) {
      whereClause += ' AND status = $2';
      params.push(options.status);
    }

    try {
      // Get total count
      const countSql = `SELECT COUNT(*) FROM sessions ${whereClause}`;
      const countResult = await query<{ count: string }>(countSql, params);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const sql = `
        SELECT * FROM sessions
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      const result = await query<Session>(sql, [...params, pageSize, offset]);

      return {
        sessions: result.rows,
        total,
      };
    } catch (error) {
      logger.error('Error listing sessions', { error, userId, options });
      throw new Error('Failed to list sessions');
    }
  }

  /**
   * Cancel session
   */
  async cancel(sessionId: string): Promise<Session> {
    return this.update(sessionId, {
      status: 'cancelled',
      completed_at: new Date(),
    });
  }

  /**
   * Delete session (for cleanup)
   */
  async delete(sessionId: string): Promise<void> {
    const sql = 'DELETE FROM sessions WHERE id = $1';

    try {
      await query(sql, [sessionId]);
      logger.info('Session deleted', { sessionId });
    } catch (error) {
      logger.error('Error deleting session', { error, sessionId });
      throw new Error('Failed to delete session');
    }
  }

  /**
   * Get session statistics
   */
  async getStats(userId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
    avgDuration: number;
  }> {
    const sql = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60) FILTER (WHERE status = 'completed') as avg_duration
      FROM sessions
      WHERE user_id = $1
    `;

    try {
      const result = await query(sql, [userId]);
      const row = result.rows[0];

      return {
        total: parseInt(row.total) || 0,
        completed: parseInt(row.completed) || 0,
        failed: parseInt(row.failed) || 0,
        inProgress: parseInt(row.in_progress) || 0,
        avgDuration: parseFloat(row.avg_duration) || 0,
      };
    } catch (error) {
      logger.error('Error getting session stats', { error, userId });
      throw new Error('Failed to get session stats');
    }
  }

  /**
   * Clean up old sessions (7+ days old)
   */
  async cleanupOld(): Promise<number> {
    const sql = `
      DELETE FROM sessions
      WHERE completed_at < NOW() - INTERVAL '7 days'
        AND status IN ('completed', 'failed', 'cancelled')
    `;

    try {
      const result = await query(sql);
      const deletedCount = result.rowCount || 0;

      if (deletedCount > 0) {
        logger.info('Old sessions cleaned up', { count: deletedCount });
      }

      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old sessions', { error });
      throw new Error('Failed to clean up old sessions');
    }
  }
}
