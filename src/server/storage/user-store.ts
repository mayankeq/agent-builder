import { query, transaction, PoolClient } from './database';
import { logger } from '../monitoring/logger';
import { hashToken } from '../auth/jwt';

export interface User {
  id: string;
  email: string;
  name?: string;
  sso_provider?: string;
  sso_id?: string;
  created_at: Date;
  last_login?: Date;
}

export interface CreateUserParams {
  email: string;
  name?: string;
  sso_provider?: string;
  sso_id?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export class UserStore {
  /**
   * Create a new user
   */
  async create(params: CreateUserParams): Promise<User> {
    const sql = `
      INSERT INTO users (email, name, sso_provider, sso_id, last_login)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;

    try {
      const result = await query<User>(sql, [
        params.email,
        params.name || null,
        params.sso_provider || null,
        params.sso_id || null,
      ]);

      const user = result.rows[0];
      logger.info('User created', {
        userId: user.id,
        email: user.email,
        provider: params.sso_provider,
      });

      return user;
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        logger.warn('User creation failed: Email already exists', { email: params.email });
        throw new Error('User with this email already exists');
      }

      logger.error('Error creating user', { error, params });
      throw new Error('Failed to create user');
    }
  }

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE id = $1';

    try {
      const result = await query<User>(sql, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by ID', { error, userId });
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE email = $1';

    try {
      const result = await query<User>(sql, [email]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by email', { error, email });
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find user by SSO provider and ID
   */
  async findBySSOId(provider: string, ssoId: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE sso_provider = $1 AND sso_id = $2';

    try {
      const result = await query<User>(sql, [provider, ssoId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user by SSO ID', { error, provider, ssoId });
      throw new Error('Failed to find user');
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    const sql = 'UPDATE users SET last_login = NOW() WHERE id = $1';

    try {
      await query(sql, [userId]);
      logger.debug('User last login updated', { userId });
    } catch (error) {
      logger.error('Error updating last login', { error, userId });
      // Don't throw - this is not critical
    }
  }

  /**
   * Update user profile
   */
  async update(userId: string, updates: Partial<CreateUserParams>): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(userId);
    const sql = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await query<User>(sql, values);
      const user = result.rows[0];

      if (!user) {
        throw new Error('User not found');
      }

      logger.info('User updated', { userId, fields: Object.keys(updates) });
      return user;
    } catch (error) {
      logger.error('Error updating user', { error, userId, updates });
      throw new Error('Failed to update user');
    }
  }

  /**
   * Delete user (and all associated data via CASCADE)
   */
  async delete(userId: string): Promise<void> {
    const sql = 'DELETE FROM users WHERE id = $1';

    try {
      const result = await query(sql, [userId]);

      if (result.rowCount === 0) {
        throw new Error('User not found');
      }

      logger.info('User deleted', { userId });
    } catch (error) {
      logger.error('Error deleting user', { error, userId });
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Create user session
   */
  async createSession(userId: string, token: string, expiresAt: Date): Promise<UserSession> {
    const tokenHash = hashToken(token);
    const sql = `
      INSERT INTO user_sessions (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    try {
      const result = await query<UserSession>(sql, [userId, tokenHash, expiresAt]);
      const session = result.rows[0];

      logger.debug('User session created', {
        sessionId: session.id,
        userId,
        expiresAt,
      });

      return session;
    } catch (error) {
      logger.error('Error creating user session', { error, userId });
      throw new Error('Failed to create user session');
    }
  }

  /**
   * Find session by token
   */
  async findSession(token: string): Promise<UserSession | null> {
    const tokenHash = hashToken(token);
    const sql = `
      SELECT * FROM user_sessions
      WHERE token_hash = $1 AND expires_at > NOW()
    `;

    try {
      const result = await query<UserSession>(sql, [tokenHash]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding user session', { error });
      throw new Error('Failed to find user session');
    }
  }

  /**
   * Delete user session (logout)
   */
  async deleteSession(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    const sql = 'DELETE FROM user_sessions WHERE token_hash = $1';

    try {
      await query(sql, [tokenHash]);
      logger.debug('User session deleted');
    } catch (error) {
      logger.error('Error deleting user session', { error });
      throw new Error('Failed to delete user session');
    }
  }

  /**
   * Delete all sessions for a user
   */
  async deleteAllSessions(userId: string): Promise<number> {
    const sql = 'DELETE FROM user_sessions WHERE user_id = $1';

    try {
      const result = await query(sql, [userId]);
      const count = result.rowCount || 0;

      logger.info('All user sessions deleted', { userId, count });
      return count;
    } catch (error) {
      logger.error('Error deleting all user sessions', { error, userId });
      throw new Error('Failed to delete user sessions');
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const sql = 'DELETE FROM user_sessions WHERE expires_at < NOW()';

    try {
      const result = await query(sql);
      const count = result.rowCount || 0;

      if (count > 0) {
        logger.info('Expired user sessions cleaned up', { count });
      }

      return count;
    } catch (error) {
      logger.error('Error cleaning up expired sessions', { error });
      throw new Error('Failed to clean up expired sessions');
    }
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
  }> {
    const sql = `
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '7 days') as active_users,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 day') as new_users_today
      FROM users
    `;

    try {
      const result = await query(sql);
      const row = result.rows[0];

      return {
        totalUsers: parseInt(row.total_users) || 0,
        activeUsers: parseInt(row.active_users) || 0,
        newUsersToday: parseInt(row.new_users_today) || 0,
      };
    } catch (error) {
      logger.error('Error getting user stats', { error });
      throw new Error('Failed to get user stats');
    }
  }
}
