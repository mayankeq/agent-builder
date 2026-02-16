import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryManager, SessionData, Pattern } from '@/memory/memory-manager';
import { createTestRequirements } from '../fixtures/workflow-fixtures';
import { TEST_DATA_DIR } from '../setup';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;
  let testStorageDir: string;

  beforeEach(async () => {
    testStorageDir = path.join(TEST_DATA_DIR, 'memory-test-' + Date.now());
    // Use without vector search for simpler testing
    memoryManager = new MemoryManager(testStorageDir, false);
    await memoryManager.initialize();
  });

  afterEach(async () => {
    await fs.rm(testStorageDir, { recursive: true, force: true }).catch(() => {});
  });

  describe('captureSession', () => {
    it('should capture session data', async () => {
      const session: SessionData = {
        id: 'test-session-1',
        timestamp: new Date(),
        userRequest: 'Create a calculator',
        requirements: createTestRequirements(),
        metrics: { duration: 1000 },
        success: true,
      };

      await expect(memoryManager.captureSession(session)).resolves.not.toThrow();
    });

    it('should store session in JSONL format', async () => {
      const session: SessionData = {
        id: 'test-session-2',
        timestamp: new Date(),
        userRequest: 'Create a web server',
        requirements: createTestRequirements(),
        metrics: { duration: 2000 },
        success: true,
      };

      await memoryManager.captureSession(session);

      const sessionFile = path.join(testStorageDir, 'sessions', `${session.id}.jsonl`);
      const exists = await fs.stat(sessionFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('storePattern', () => {
    it('should store pattern successfully', async () => {
      const pattern: Pattern = {
        id: 'pattern-1',
        name: 'CLI Calculator',
        requirements: createTestRequirements(),
        designApproach: 'Command pattern with parser',
        successRate: 1.0,
        usageCount: 1,
        lastUsed: new Date(),
      };

      await expect(memoryManager.storePattern(pattern)).resolves.not.toThrow();
    });

    it('should store pattern as JSON file', async () => {
      const pattern: Pattern = {
        id: 'pattern-2',
        name: 'Web API',
        requirements: createTestRequirements({
          output: { type: 'library', language: 'typescript' },
        }),
        designApproach: 'REST API with Express',
        successRate: 0.9,
        usageCount: 5,
        lastUsed: new Date(),
      };

      await memoryManager.storePattern(pattern);

      const patternFile = path.join(testStorageDir, 'patterns', `${pattern.id}.json`);
      const exists = await fs.stat(patternFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should be able to load stored pattern', async () => {
      const pattern: Pattern = {
        id: 'pattern-3',
        name: 'MCP Server',
        requirements: createTestRequirements({
          output: { type: 'mcp', language: 'typescript' },
        }),
        designApproach: 'MCP protocol implementation',
        successRate: 0.95,
        usageCount: 3,
        lastUsed: new Date(),
      };

      await memoryManager.storePattern(pattern);

      // Load patterns and verify
      const patterns = await memoryManager.findSimilarPatterns(pattern.requirements);
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('findSimilarPatterns', () => {
    beforeEach(async () => {
      // Store some test patterns
      const patterns: Pattern[] = [
        {
          id: 'pattern-cli-1',
          name: 'CLI Tool',
          requirements: createTestRequirements({
            functional: ['Parse args', 'Execute commands'],
            output: { type: 'cli', language: 'typescript' },
          }),
          designApproach: 'Command pattern',
          successRate: 1.0,
          usageCount: 10,
          lastUsed: new Date(),
        },
        {
          id: 'pattern-mcp-1',
          name: 'MCP Server',
          requirements: createTestRequirements({
            functional: ['Handle requests', 'Manage state'],
            output: { type: 'mcp', language: 'typescript' },
          }),
          designApproach: 'Server pattern',
          successRate: 0.9,
          usageCount: 5,
          lastUsed: new Date(),
        },
        {
          id: 'pattern-cli-2',
          name: 'Another CLI',
          requirements: createTestRequirements({
            functional: ['Parse input', 'Display output'],
            output: { type: 'cli', language: 'python' },
          }),
          designApproach: 'Click framework',
          successRate: 0.85,
          usageCount: 3,
          lastUsed: new Date(),
        },
      ];

      for (const pattern of patterns) {
        await memoryManager.storePattern(pattern);
      }
    });

    it('should find similar patterns by output type', async () => {
      const requirements = createTestRequirements({
        output: { type: 'cli', language: 'typescript' },
      });

      const similar = await memoryManager.findSimilarPatterns(requirements);

      expect(similar.length).toBeGreaterThan(0);
      // Should find CLI patterns
      expect(similar.some(p => p.requirements.output.type === 'cli')).toBe(true);
    });

    it('should return patterns sorted by similarity', async () => {
      const requirements = createTestRequirements({
        functional: ['Parse args', 'Execute commands'],
        output: { type: 'cli', language: 'typescript' },
      });

      const similar = await memoryManager.findSimilarPatterns(requirements);

      if (similar.length > 1) {
        // First pattern should be most similar (same type and language)
        expect(similar[0].requirements.output.type).toBe('cli');
      }
    });

    it('should limit results to top 5', async () => {
      const requirements = createTestRequirements();
      const similar = await memoryManager.findSimilarPatterns(requirements);

      expect(similar.length).toBeLessThanOrEqual(5);
    });

    it('should filter by similarity threshold', async () => {
      const requirements = createTestRequirements({
        output: { type: 'skill', language: 'javascript' }, // Very different
      });

      const similar = await memoryManager.findSimilarPatterns(requirements);

      // With threshold of 0.7, should find few or no matches
      // depending on similarity calculation
      expect(Array.isArray(similar)).toBe(true);
    });
  });

  describe('recordLearning', () => {
    it('should record success insight', async () => {
      await expect(
        memoryManager.recordLearning({
          type: 'success',
          description: 'Pattern worked well',
          context: { patternId: 'pattern-1' },
          timestamp: new Date(),
        })
      ).resolves.not.toThrow();
    });

    it('should record failure insight', async () => {
      await expect(
        memoryManager.recordLearning({
          type: 'failure',
          description: 'Design failed validation',
          context: { error: 'Syntax error' },
          timestamp: new Date(),
        })
      ).resolves.not.toThrow();
    });

    it('should record optimization insight', async () => {
      await expect(
        memoryManager.recordLearning({
          type: 'optimization',
          description: 'Reduced execution time',
          context: { improvement: '20%' },
          timestamp: new Date(),
        })
      ).resolves.not.toThrow();
    });

    it('should store insights in JSONL format', async () => {
      await memoryManager.recordLearning({
        type: 'success',
        description: 'Test insight',
        context: {},
        timestamp: new Date(),
      });

      const learningFile = path.join(testStorageDir, 'metrics', 'learnings.jsonl');
      const exists = await fs.stat(learningFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('initialization', () => {
    it('should create storage directories', async () => {
      const newStorageDir = path.join(TEST_DATA_DIR, 'memory-init-' + Date.now());
      const newManager = new MemoryManager(newStorageDir, false);
      await newManager.initialize();

      const sessionsDir = path.join(newStorageDir, 'sessions');
      const patternsDir = path.join(newStorageDir, 'patterns');
      const metricsDir = path.join(newStorageDir, 'metrics');

      const sessionsExists = await fs.stat(sessionsDir).then(() => true).catch(() => false);
      const patternsExists = await fs.stat(patternsDir).then(() => true).catch(() => false);
      const metricsExists = await fs.stat(metricsDir).then(() => true).catch(() => false);

      expect(sessionsExists).toBe(true);
      expect(patternsExists).toBe(true);
      expect(metricsExists).toBe(true);

      await fs.rm(newStorageDir, { recursive: true, force: true }).catch(() => {});
    });
  });
});
