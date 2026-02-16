import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '../monitoring/logger';

// Database configuration from environment
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'agent_builder',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
};

// Create PostgreSQL connection pool
const pool = new Pool(DB_CONFIG);

// Pool event handlers
pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', { error: err });
});

pool.on('remove', () => {
  logger.debug('Database connection removed from pool');
});

/**
 * Execute a query with automatic error handling and logging
 */
export async function query<T = any>(
  text: string,
  params?: any[],
  client?: PoolClient
): Promise<QueryResult<T>> {
  const start = Date.now();
  const targetClient = client || pool;

  try {
    const result = await targetClient.query<T>(text, params);
    const duration = Date.now() - start;

    logger.debug('Database query executed', {
      duration,
      rows: result.rowCount,
      command: result.command,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Database query error', {
      error,
      duration,
      query: text.substring(0, 100), // Log first 100 chars only
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transaction management
 */
export async function getClient(): Promise<PoolClient> {
  try {
    const client = await pool.connect();
    logger.debug('Database client acquired from pool');
    return client;
  } catch (error) {
    logger.error('Failed to acquire database client', { error });
    throw error;
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    logger.debug('Transaction started');

    const result = await callback(client);

    await client.query('COMMIT');
    logger.debug('Transaction committed');

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back', { error });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as now, version() as version');
    logger.info('Database connection test successful', {
      timestamp: result.rows[0].now,
      version: result.rows[0].version.split(',')[0], // Just first part
    });
    return true;
  } catch (error) {
    logger.error('Database connection test failed', { error });
    return false;
  }
}

/**
 * Get pool statistics
 */
export function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
}

/**
 * Close all database connections
 */
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing database pool', { error });
    throw error;
  }
}

/**
 * Validate database configuration
 */
export function validateDatabaseConfig(): void {
  const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required database configuration: ${missing.join(', ')}`);
  }

  logger.info('Database configuration validated', {
    host: DB_CONFIG.host,
    database: DB_CONFIG.database,
    user: DB_CONFIG.user,
    poolMax: DB_CONFIG.max,
  });
}

/**
 * Helper to build parameterized queries safely
 */
export function buildQuery(
  baseQuery: string,
  conditions: Record<string, any>,
  startIndex: number = 1
): { text: string; values: any[] } {
  const values: any[] = [];
  const whereClauses: string[] = [];
  let paramIndex = startIndex;

  for (const [key, value] of Object.entries(conditions)) {
    if (value !== undefined && value !== null) {
      whereClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const text = `${baseQuery} ${whereClause}`;

  return { text, values };
}

/**
 * Helper for pagination
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function buildPaginationQuery(
  baseQuery: string,
  params: PaginationParams = {}
): { query: string; offset: number; limit: number } {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  const orderBy = params.orderBy || 'created_at';
  const orderDirection = params.orderDirection || 'DESC';

  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const query = `${baseQuery} ORDER BY ${orderBy} ${orderDirection} LIMIT ${limit} OFFSET ${offset}`;

  return { query, offset, limit };
}

// Export pool for advanced use cases
export { pool };
