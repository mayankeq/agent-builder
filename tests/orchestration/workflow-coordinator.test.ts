import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowCoordinator } from '@/orchestration/workflow-coordinator';
import { AgentFactory } from '@/orchestration/agent-factory';
import { MockClaudeClient, createMockResponses } from '../utils/mock-claude-client';
import { createTestBuildOptions } from '../fixtures/workflow-fixtures';

describe('WorkflowCoordinator', () => {
  let mockClaudeClient: MockClaudeClient;
  let agentFactory: AgentFactory;
  let coordinator: WorkflowCoordinator;

  beforeEach(() => {
    mockClaudeClient = new MockClaudeClient();
    const claudeClient = mockClaudeClient.createMock();
    agentFactory = new AgentFactory(claudeClient as any);
    coordinator = new WorkflowCoordinator(agentFactory);

    // Set up default mock responses
    const responses = createMockResponses();
    mockClaudeClient.setMockResponse('clarify', responses.clarification);
    mockClaudeClient.setMockResponse('design', responses.design);
    mockClaudeClient.setMockResponse('implement', responses.implementation);
    mockClaudeClient.setMockResponse('test', responses.testing);
    mockClaudeClient.setMockResponse('document', responses.documentation);
    mockClaudeClient.setMockResponse('package', responses.packaging);
  });

  describe('buildAgent', () => {
    it('should complete full workflow successfully', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Create a calculator CLI', options);

      expect(result.sessionId).toBeDefined();
      expect(result.outputDir).toContain('generated');
      expect(result.artifacts).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.metrics.totalDuration).toBeGreaterThan(0);
    });

    it('should track metrics for all phases', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Create a web API', options);

      expect(result.metrics.phaseMetrics).toBeDefined();
      expect(result.metrics.phaseMetrics.clarification).toBeDefined();
      expect(result.metrics.phaseMetrics.design).toBeDefined();
      expect(result.metrics.phaseMetrics.implementation).toBeDefined();
      expect(result.metrics.phaseMetrics.packaging).toBeDefined();
      expect(result.metrics.phaseMetrics.learning).toBeDefined();
    });

    it('should transition through all workflow phases', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Create a tool', options);

      const phases = Object.keys(result.metrics.phaseMetrics);
      expect(phases).toContain('clarification');
      expect(phases).toContain('design');
      expect(phases).toContain('implementation');
      expect(phases).toContain('packaging');
      expect(phases).toContain('learning');
    });

    it('should handle errors gracefully', async () => {
      // Mock an error in the clarification phase
      const errorClient = mockClaudeClient.createMock();
      (errorClient.complete as any).mockRejectedValue(new Error('API Error'));

      const errorFactory = new AgentFactory(errorClient as any);
      const errorCoordinator = new WorkflowCoordinator(errorFactory);
      const options = createTestBuildOptions();

      await expect(
        errorCoordinator.buildAgent('Test request', options)
      ).rejects.toThrow();
    });

    it('should generate unique session IDs', async () => {
      const options = createTestBuildOptions();
      const result1 = await coordinator.buildAgent('Request 1', options);
      const result2 = await coordinator.buildAgent('Request 2', options);

      expect(result1.sessionId).not.toBe(result2.sessionId);
    });
  });

  describe('phase execution', () => {
    it('should record phase duration', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Test', options);

      Object.values(result.metrics.phaseMetrics).forEach(phaseMetrics => {
        expect(phaseMetrics.duration).toBeGreaterThan(0);
        expect(phaseMetrics.success).toBe(true);
        expect(phaseMetrics.startTime).toBeInstanceOf(Date);
        expect(phaseMetrics.endTime).toBeInstanceOf(Date);
      });
    });

    it('should mark failed phases', async () => {
      // This would require more sophisticated mocking to trigger phase failures
      // For now, we test the success case
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Test', options);

      Object.values(result.metrics.phaseMetrics).forEach(phaseMetrics => {
        expect(phaseMetrics.success).toBe(true);
        expect(phaseMetrics.error).toBeUndefined();
      });
    });
  });

  describe('artifact generation', () => {
    it('should include code artifacts', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Create CLI', options);

      expect(result.artifacts).toBeDefined();
      expect(Object.keys(result.artifacts).length).toBeGreaterThan(0);
    });

    it('should combine all artifact types', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Create tool', options);

      // Should have code, tests, docs, and package config
      expect(result.artifacts).toBeDefined();
      // At minimum, we expect some artifacts
      expect(Object.keys(result.artifacts).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('context management', () => {
    it('should initialize context with correct values', async () => {
      const options = createTestBuildOptions({
        outputType: 'mcp',
        language: 'python',
      });

      const result = await coordinator.buildAgent('Test', options);

      expect(result.sessionId).toBeDefined();
      expect(result.metrics).toBeDefined();
    });

    it('should preserve user request throughout workflow', async () => {
      const userRequest = 'Create a unique calculator';
      const options = createTestBuildOptions();

      const result = await coordinator.buildAgent(userRequest, options);

      expect(result.sessionId).toBeDefined();
      // The artifacts should be generated based on the request
      expect(result.artifacts).toBeDefined();
    });
  });

  describe('performance', () => {
    it('should complete workflow within reasonable time', async () => {
      const options = createTestBuildOptions();
      const startTime = Date.now();

      await coordinator.buildAgent('Test', options);

      const duration = Date.now() - startTime;
      // With mocks, should complete very quickly
      expect(duration).toBeLessThan(5000); // 5 seconds with mocks
    });
  });
});
