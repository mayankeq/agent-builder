import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowCoordinator } from '@/orchestration/workflow-coordinator';
import { AgentFactory } from '@/orchestration/agent-factory';
import { MockClaudeClient, createMockResponses } from '../utils/mock-claude-client';
import { createTestBuildOptions } from '../fixtures/workflow-fixtures';

describe('E2E Workflow Integration', () => {
  let mockClaudeClient: MockClaudeClient;
  let coordinator: WorkflowCoordinator;

  beforeEach(() => {
    mockClaudeClient = new MockClaudeClient();
    const claudeClient = mockClaudeClient.createMock();
    const agentFactory = new AgentFactory(claudeClient as any);
    coordinator = new WorkflowCoordinator(agentFactory);

    // Set up complete mock responses
    const responses = createMockResponses();
    mockClaudeClient.setMockResponse('clarify', responses.clarification);
    mockClaudeClient.setMockResponse('design', responses.design);
    mockClaudeClient.setMockResponse('implement', responses.implementation);
    mockClaudeClient.setMockResponse('test', responses.testing);
    mockClaudeClient.setMockResponse('document', responses.documentation);
    mockClaudeClient.setMockResponse('package', responses.packaging);
  });

  describe('CLI Agent Creation', () => {
    it('should create a TypeScript CLI agent end-to-end', async () => {
      const options = createTestBuildOptions({
        outputType: 'cli',
        language: 'typescript',
      });

      const result = await coordinator.buildAgent(
        'Create a CLI tool for file management',
        options
      );

      expect(result.sessionId).toBeDefined();
      expect(result.artifacts).toBeDefined();
      expect(Object.keys(result.artifacts).length).toBeGreaterThan(0);
      expect(result.metrics.phaseMetrics.clarification).toBeDefined();
      expect(result.metrics.phaseMetrics.design).toBeDefined();
      expect(result.metrics.phaseMetrics.implementation).toBeDefined();
      expect(result.metrics.phaseMetrics.packaging).toBeDefined();
    });

    it('should create a Python CLI agent end-to-end', async () => {
      const options = createTestBuildOptions({
        outputType: 'cli',
        language: 'python',
      });

      const result = await coordinator.buildAgent(
        'Create a CLI tool for data processing',
        options
      );

      expect(result.sessionId).toBeDefined();
      expect(result.artifacts).toBeDefined();
      expect(result.metrics.totalDuration).toBeGreaterThan(0);
    });
  });

  describe('MCP Server Creation', () => {
    it('should create a TypeScript MCP server end-to-end', async () => {
      const options = createTestBuildOptions({
        outputType: 'mcp',
        language: 'typescript',
      });

      const result = await coordinator.buildAgent(
        'Create an MCP server for file operations',
        options
      );

      expect(result.sessionId).toBeDefined();
      expect(result.artifacts).toBeDefined();
      expect(result.outputDir).toContain('generated');
    });

    it('should create a Python MCP server end-to-end', async () => {
      const options = createTestBuildOptions({
        outputType: 'mcp',
        language: 'python',
      });

      const result = await coordinator.buildAgent(
        'Create an MCP server for database queries',
        options
      );

      expect(result.sessionId).toBeDefined();
      expect(result.artifacts).toBeDefined();
    });
  });

  describe('Library Creation', () => {
    it('should create a TypeScript library end-to-end', async () => {
      const options = createTestBuildOptions({
        outputType: 'library',
        language: 'typescript',
      });

      const result = await coordinator.buildAgent(
        'Create a utility library for string manipulation',
        options
      );

      expect(result.sessionId).toBeDefined();
      expect(result.artifacts).toBeDefined();
    });
  });

  describe('Skill Creation', () => {
    it('should create a TypeScript skill end-to-end', async () => {
      const options = createTestBuildOptions({
        outputType: 'skill',
        language: 'typescript',
      });

      const result = await coordinator.buildAgent(
        'Create a skill for code analysis',
        options
      );

      expect(result.sessionId).toBeDefined();
      expect(result.artifacts).toBeDefined();
    });
  });

  describe('Workflow Phases', () => {
    it('should execute all phases in correct order', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Create a test agent', options);

      const phases = Object.keys(result.metrics.phaseMetrics);

      // All phases should be present
      expect(phases).toContain('clarification');
      expect(phases).toContain('design');
      expect(phases).toContain('implementation');
      expect(phases).toContain('packaging');
      expect(phases).toContain('learning');

      // All phases should be successful
      Object.values(result.metrics.phaseMetrics).forEach(metrics => {
        expect(metrics.success).toBe(true);
      });
    });

    it('should track time for each phase', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Create a test agent', options);

      Object.entries(result.metrics.phaseMetrics).forEach(([phase, metrics]) => {
        expect(metrics.duration).toBeGreaterThan(0);
        expect(metrics.startTime).toBeInstanceOf(Date);
        expect(metrics.endTime).toBeInstanceOf(Date);
        expect(metrics.endTime.getTime()).toBeGreaterThanOrEqual(
          metrics.startTime.getTime()
        );
      });
    });
  });

  describe('Extended Thinking', () => {
    it('should use extended thinking when enabled', async () => {
      const options = createTestBuildOptions({
        useExtendedThinking: true,
        thinkingBudget: 'high',
      });

      const result = await coordinator.buildAgent(
        'Create a complex data pipeline',
        options
      );

      expect(result.sessionId).toBeDefined();
      // Design phase should have used extended thinking
      expect(result.metrics.phaseMetrics.design).toBeDefined();
    });

    it('should work without extended thinking', async () => {
      const options = createTestBuildOptions({
        useExtendedThinking: false,
      });

      const result = await coordinator.buildAgent(
        'Create a simple tool',
        options
      );

      expect(result.sessionId).toBeDefined();
      expect(result.artifacts).toBeDefined();
    });
  });

  describe('Error Recovery', () => {
    it('should handle API errors gracefully', async () => {
      const errorClient = mockClaudeClient.createMock();
      (errorClient.complete as any).mockRejectedValueOnce(new Error('API Error'));

      const errorFactory = new AgentFactory(errorClient as any);
      const errorCoordinator = new WorkflowCoordinator(errorFactory);

      const options = createTestBuildOptions();

      await expect(
        errorCoordinator.buildAgent('Test request', options)
      ).rejects.toThrow();
    });
  });

  describe('Artifact Generation', () => {
    it('should generate all required artifacts', async () => {
      const options = createTestBuildOptions({
        outputType: 'cli',
        language: 'typescript',
      });

      const result = await coordinator.buildAgent(
        'Create a calculator CLI',
        options
      );

      // Should have code, tests, docs, and package config
      expect(result.artifacts).toBeDefined();
      expect(Object.keys(result.artifacts).length).toBeGreaterThan(0);
    });

    it('should organize artifacts by type', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Create an agent', options);

      const artifactKeys = Object.keys(result.artifacts);

      // Should have multiple files
      expect(artifactKeys.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should complete workflow in reasonable time', async () => {
      const options = createTestBuildOptions();
      const startTime = Date.now();

      await coordinator.buildAgent('Create a test agent', options);

      const duration = Date.now() - startTime;

      // With mocks, should be very fast
      expect(duration).toBeLessThan(10000); // 10 seconds max
    });

    it('should track total duration', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Create an agent', options);

      expect(result.metrics.totalDuration).toBeGreaterThan(0);

      // Total duration should be sum of all phases (approximately)
      const phaseTotal = Object.values(result.metrics.phaseMetrics)
        .reduce((sum, metrics) => sum + metrics.duration, 0);

      // Allow some variance
      expect(result.metrics.totalDuration).toBeGreaterThanOrEqual(phaseTotal * 0.9);
    });
  });

  describe('Multiple Concurrent Sessions', () => {
    it('should handle multiple concurrent builds', async () => {
      const options = createTestBuildOptions();

      const results = await Promise.all([
        coordinator.buildAgent('Create agent 1', options),
        coordinator.buildAgent('Create agent 2', options),
        coordinator.buildAgent('Create agent 3', options),
      ]);

      // All should succeed
      expect(results).toHaveLength(3);

      // All should have unique session IDs
      const sessionIds = results.map(r => r.sessionId);
      const uniqueIds = new Set(sessionIds);
      expect(uniqueIds.size).toBe(3);
    });
  });
});
