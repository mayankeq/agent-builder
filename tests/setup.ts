import { beforeAll, afterAll, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.ANTHROPIC_API_KEY = 'test-api-key';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-only-32chars';
process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/agent_builder_test';

// Test data directory
export const TEST_DATA_DIR = path.join(__dirname, 'test-data');
export const TEST_OUTPUT_DIR = path.join(__dirname, 'test-output');

beforeAll(async () => {
  // Create test directories
  await fs.mkdir(TEST_DATA_DIR, { recursive: true });
  await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
});

afterEach(async () => {
  // Clean up test output directory after each test
  try {
    const files = await fs.readdir(TEST_OUTPUT_DIR);
    await Promise.all(
      files.map(file => fs.rm(path.join(TEST_OUTPUT_DIR, file), { recursive: true, force: true }))
    );
  } catch (error) {
    // Ignore errors if directory doesn't exist
  }
});

afterAll(async () => {
  // Clean up test directories
  await fs.rm(TEST_DATA_DIR, { recursive: true, force: true }).catch(() => {});
  await fs.rm(TEST_OUTPUT_DIR, { recursive: true, force: true }).catch(() => {});
});
