import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowCoordinator } from '@/orchestration/workflow-coordinator';
import { AgentFactory } from '@/orchestration/agent-factory';
import { MockClaudeClient, createMockResponses } from '../utils/mock-claude-client';
import { createTestBuildOptions } from '../fixtures/workflow-fixtures';

describe('Performance Benchmarks', () => {
  let mockClaudeClient: MockClaudeClient;
  let coordinator: WorkflowCoordinator;

  beforeEach(() => {
    mockClaudeClient = new MockClaudeClient();
    const claudeClient = mockClaudeClient.createMock();
    const agentFactory = new AgentFactory(claudeClient as any);
    coordinator = new WorkflowCoordinator(agentFactory);

    const responses = createMockResponses();
    mockClaudeClient.setMockResponse('clarify', responses.clarification);
    mockClaudeClient.setMockResponse('design', responses.design);
    mockClaudeClient.setMockResponse('implement', responses.implementation);
    mockClaudeClient.setMockResponse('test', responses.testing);
    mockClaudeClient.setMockResponse('document', responses.documentation);
    mockClaudeClient.setMockResponse('package', responses.packaging);
  });

  describe('Phase Duration Benchmarks', () => {
    it('should measure clarification phase duration', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Benchmark test', options);

      const clarificationDuration = result.metrics.phaseMetrics.clarification.duration;

      expect(clarificationDuration).toBeGreaterThan(0);
      expect(clarificationDuration).toBeLessThan(5000); // 5s with mocks
    });

    it('should measure design phase duration', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Benchmark test', options);

      const designDuration = result.metrics.phaseMetrics.design.duration;

      expect(designDuration).toBeGreaterThan(0);
      expect(designDuration).toBeLessThan(5000);
    });

    it('should measure implementation phase duration', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Benchmark test', options);

      const implementationDuration = result.metrics.phaseMetrics.implementation.duration;

      expect(implementationDuration).toBeGreaterThan(0);
      expect(implementationDuration).toBeLessThan(5000);
    });

    it('should measure packaging phase duration', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Benchmark test', options);

      const packagingDuration = result.metrics.phaseMetrics.packaging.duration;

      expect(packagingDuration).toBeGreaterThan(0);
      expect(packagingDuration).toBeLessThan(5000);
    });

    it('should measure learning phase duration', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Benchmark test', options);

      const learningDuration = result.metrics.phaseMetrics.learning.duration;

      expect(learningDuration).toBeGreaterThan(0);
      expect(learningDuration).toBeLessThan(2000);
    });
  });

  describe('Total Workflow Duration', () => {
    it('should complete full workflow within time budget', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Performance test', options);

      // With mocks, should be very fast
      expect(result.metrics.totalDuration).toBeLessThan(10000); // 10s
    });

    it('should track total duration accurately', async () => {
      const options = createTestBuildOptions();
      const startTime = Date.now();
      const result = await coordinator.buildAgent('Duration test', options);
      const actualDuration = Date.now() - startTime;

      // Tracked duration should be close to actual
      expect(result.metrics.totalDuration).toBeGreaterThan(0);
      expect(result.metrics.totalDuration).toBeLessThanOrEqual(actualDuration * 1.1);
    });
  });

  describe('Throughput', () => {
    it('should handle multiple sequential builds efficiently', async () => {
      const options = createTestBuildOptions();
      const startTime = Date.now();

      for (let i = 0; i < 3; i++) {
        await coordinator.buildAgent(`Build ${i}`, options);
      }

      const totalTime = Date.now() - startTime;

      // With mocks, 3 builds should complete quickly
      expect(totalTime).toBeLessThan(20000); // 20s for 3 builds
    });

    it('should handle concurrent builds efficiently', async () => {
      const options = createTestBuildOptions();
      const startTime = Date.now();

      await Promise.all([
        coordinator.buildAgent('Build 1', options),
        coordinator.buildAgent('Build 2', options),
        coordinator.buildAgent('Build 3', options),
      ]);

      const totalTime = Date.now() - startTime;

      // Concurrent builds should be faster than sequential
      expect(totalTime).toBeLessThan(15000); // 15s for 3 concurrent
    });
  });

  describe('Phase Distribution', () => {
    it('should report phase time distribution', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Distribution test', options);

      const phaseDurations = Object.entries(result.metrics.phaseMetrics).map(
        ([phase, metrics]) => ({
          phase,
          duration: metrics.duration,
          percentage: (metrics.duration / result.metrics.totalDuration) * 100,
        })
      );

      // All phases should contribute to total time
      phaseDurations.forEach(({ phase, duration, percentage }) => {
        expect(duration).toBeGreaterThan(0);
        expect(percentage).toBeGreaterThan(0);
        expect(percentage).toBeLessThan(100);
      });

      // Total percentage should be close to 100%
      const totalPercentage = phaseDurations.reduce((sum, p) => sum + p.percentage, 0);
      expect(totalPercentage).toBeGreaterThan(95);
      expect(totalPercentage).toBeLessThanOrEqual(105); // Allow some variance
    });
  });

  describe('Optimization Levels', () => {
    it('should benchmark speed optimization', async () => {
      const options = createTestBuildOptions({ optimization: 'speed' });
      const result = await coordinator.buildAgent('Speed test', options);

      expect(result.metrics.totalDuration).toBeLessThan(10000);
    });

    it('should benchmark quality optimization', async () => {
      const options = createTestBuildOptions({ optimization: 'quality' });
      const result = await coordinator.buildAgent('Quality test', options);

      // Quality may take longer (in real scenario)
      expect(result.metrics.totalDuration).toBeGreaterThan(0);
    });

    it('should benchmark balanced optimization', async () => {
      const options = createTestBuildOptions({ optimization: 'balanced' });
      const result = await coordinator.buildAgent('Balanced test', options);

      expect(result.metrics.totalDuration).toBeGreaterThan(0);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory across multiple builds', async () => {
      const options = createTestBuildOptions();
      const initialMemory = process.memoryUsage().heapUsed;

      // Run multiple builds
      for (let i = 0; i < 5; i++) {
        await coordinator.buildAgent(`Memory test ${i}`, options);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Scalability', () => {
    it('should scale linearly with simple requests', async () => {
      const options = createTestBuildOptions();

      // Measure single build
      const start1 = Date.now();
      await coordinator.buildAgent('Single build', options);
      const duration1 = Date.now() - start1;

      // Measure three sequential builds
      const start3 = Date.now();
      for (let i = 0; i < 3; i++) {
        await coordinator.buildAgent(`Build ${i}`, options);
      }
      const duration3 = Date.now() - start3;

      // Should scale roughly linearly (within 50% margin)
      expect(duration3).toBeLessThan(duration1 * 3 * 1.5);
    });
  });

  describe('Phase Metrics Detail', () => {
    it('should provide detailed timing for all phases', async () => {
      const options = createTestBuildOptions();
      const result = await coordinator.buildAgent('Detail test', options);

      const phases = ['clarification', 'design', 'implementation', 'packaging', 'learning'];

      phases.forEach(phase => {
        const metrics = result.metrics.phaseMetrics[phase as keyof typeof result.metrics.phaseMetrics];
        expect(metrics).toBeDefined();
        expect(metrics.duration).toBeGreaterThan(0);
        expect(metrics.startTime).toBeInstanceOf(Date);
        expect(metrics.endTime).toBeInstanceOf(Date);
        expect(metrics.success).toBe(true);
      });
    });
  });
});
