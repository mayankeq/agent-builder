#!/usr/bin/env node

/**
 * =============================================================================
 * Database Migration Runner
 * =============================================================================
 * Handles database migrations for Agent Builder
 * Usage: node scripts/migrate.js [up|down|status]
 * =============================================================================
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required');
  process.exit(1);
}

/**
 * Create a database client
 */
function createClient() {
  return new Client({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

/**
 * Ensure migrations table exists
 */
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations(client) {
  const result = await client.query(
    `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id`
  );
  return result.rows.map(row => row.name);
}

/**
 * Get list of pending migrations
 */
async function getPendingMigrations(appliedMigrations) {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql') && f !== 'init.sql')
    .sort();

  return files.filter(f => !appliedMigrations.includes(f));
}

/**
 * Run a migration file
 */
async function runMigration(client, filename, direction = 'up') {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  let content = fs.readFileSync(filepath, 'utf8');

  if (direction === 'down') {
    // Extract DOWN migration section
    const downMatch = content.match(/-- DOWN Migration[\s\S]*$/);
    if (!downMatch) {
      throw new Error(`No DOWN migration found in ${filename}`);
    }
    content = downMatch[0]
      .replace(/-- DOWN Migration.*\n/, '')
      .replace(/-- To rollback, run:\n/g, '')
      .replace(/^-- /gm, '');
  } else {
    // Remove DOWN migration section for UP
    content = content.replace(/-- =+\n-- DOWN Migration[\s\S]*$/, '');
  }

  await client.query(content);
}

/**
 * Apply pending migrations
 */
async function migrateUp() {
  const client = createClient();

  try {
    await client.connect();
    console.log('Connected to database');

    await ensureMigrationsTable(client);

    const appliedMigrations = await getAppliedMigrations(client);
    const pendingMigrations = await getPendingMigrations(appliedMigrations);

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      console.log(`Running migration: ${migration}`);

      await client.query('BEGIN');

      try {
        await runMigration(client, migration, 'up');

        await client.query(
          `INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`,
          [migration]
        );

        await client.query('COMMIT');
        console.log(`  Completed: ${migration}`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`  Failed: ${migration}`);
        throw error;
      }
    }

    console.log('All migrations completed successfully');
  } finally {
    await client.end();
  }
}

/**
 * Rollback last migration
 */
async function migrateDown() {
  const client = createClient();

  try {
    await client.connect();
    console.log('Connected to database');

    await ensureMigrationsTable(client);

    const result = await client.query(
      `SELECT name FROM ${MIGRATIONS_TABLE} ORDER BY id DESC LIMIT 1`
    );

    if (result.rows.length === 0) {
      console.log('No migrations to rollback');
      return;
    }

    const lastMigration = result.rows[0].name;
    console.log(`Rolling back migration: ${lastMigration}`);

    await client.query('BEGIN');

    try {
      await runMigration(client, lastMigration, 'down');

      await client.query(
        `DELETE FROM ${MIGRATIONS_TABLE} WHERE name = $1`,
        [lastMigration]
      );

      await client.query('COMMIT');
      console.log(`  Rolled back: ${lastMigration}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`  Rollback failed: ${lastMigration}`);
      throw error;
    }
  } finally {
    await client.end();
  }
}

/**
 * Show migration status
 */
async function migrateStatus() {
  const client = createClient();

  try {
    await client.connect();
    console.log('Connected to database');

    await ensureMigrationsTable(client);

    const appliedMigrations = await getAppliedMigrations(client);
    const pendingMigrations = await getPendingMigrations(appliedMigrations);

    console.log('\nMigration Status:');
    console.log('=================\n');

    console.log('Applied migrations:');
    if (appliedMigrations.length === 0) {
      console.log('  (none)');
    } else {
      appliedMigrations.forEach(m => console.log(`  [x] ${m}`));
    }

    console.log('\nPending migrations:');
    if (pendingMigrations.length === 0) {
      console.log('  (none)');
    } else {
      pendingMigrations.forEach(m => console.log(`  [ ] ${m}`));
    }
  } finally {
    await client.end();
  }
}

/**
 * Main entry point
 */
async function main() {
  const command = process.argv[2] || 'up';

  try {
    switch (command) {
      case 'up':
        await migrateUp();
        break;
      case 'down':
        await migrateDown();
        break;
      case 'status':
        await migrateStatus();
        break;
      default:
        console.log('Usage: node scripts/migrate.js [up|down|status]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  }
}

main();
