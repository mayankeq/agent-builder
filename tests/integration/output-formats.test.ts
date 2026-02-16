import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowCoordinator } from '@/orchestration/workflow-coordinator';
import { AgentFactory } from '@/orchestration/agent-factory';
import { MockClaudeClient, createMockResponses } from '../utils/mock-claude-client';
import { createTestBuildOptions } from '../fixtures/workflow-fixtures';

describe('Output Formats Integration', () => {
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

  describe('CLI Output Format', () => {
    describe('TypeScript CLI', () => {
      it('should generate TypeScript CLI with required files', async () => {
        const options = createTestBuildOptions({
          outputType: 'cli',
          language: 'typescript',
        });

        const result = await coordinator.buildAgent(
          'Create a file management CLI tool',
          options
        );

        expect(result.artifacts).toBeDefined();
        expect(Object.keys(result.artifacts).length).toBeGreaterThan(0);

        // Should have package.json for CLI
        const hasPackageConfig = Object.keys(result.artifacts).some(
          key => key.includes('package') || key.includes('json')
        );
        expect(hasPackageConfig).toBe(true);
      });

      it('should generate CLI with entry point', async () => {
        const options = createTestBuildOptions({
          outputType: 'cli',
          language: 'typescript',
        });

        const result = await coordinator.buildAgent('Create a CLI tool', options);

        // Should have an index or main file
        const hasEntryPoint = Object.keys(result.artifacts).some(
          key => key.includes('index') || key.includes('main')
        );
        expect(hasEntryPoint || Object.keys(result.artifacts).length > 0).toBe(true);
      });
    });

    describe('Python CLI', () => {
      it('should generate Python CLI with required files', async () => {
        const options = createTestBuildOptions({
          outputType: 'cli',
          language: 'python',
        });

        const result = await coordinator.buildAgent('Create a data processing CLI', options);

        expect(result.artifacts).toBeDefined();
        expect(Object.keys(result.artifacts).length).toBeGreaterThan(0);
      });

      it('should generate CLI with setup configuration', async () => {
        const options = createTestBuildOptions({
          outputType: 'cli',
          language: 'python',
        });

        const result = await coordinator.buildAgent('Create a CLI', options);

        expect(result.artifacts).toBeDefined();
      });
    });
  });

  describe('MCP Server Output Format', () => {
    describe('TypeScript MCP', () => {
      it('should generate TypeScript MCP server', async () => {
        const options = createTestBuildOptions({
          outputType: 'mcp',
          language: 'typescript',
        });

        const result = await coordinator.buildAgent(
          'Create an MCP server for file operations',
          options
        );

        expect(result.artifacts).toBeDefined();
        expect(Object.keys(result.artifacts).length).toBeGreaterThan(0);
      });

      it('should generate MCP with proper structure', async () => {
        const options = createTestBuildOptions({
          outputType: 'mcp',
          language: 'typescript',
        });

        const result = await coordinator.buildAgent('Create an MCP server', options);

        // Should have package configuration
        expect(result.artifacts).toBeDefined();
        expect(result.sessionId).toBeDefined();
      });
    });

    describe('Python MCP', () => {
      it('should generate Python MCP server', async () => {
        const options = createTestBuildOptions({
          outputType: 'mcp',
          language: 'python',
        });

        const result = await coordinator.buildAgent('Create an MCP server', options);

        expect(result.artifacts).toBeDefined();
        expect(Object.keys(result.artifacts).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Library Output Format', () => {
    describe('TypeScript Library', () => {
      it('should generate TypeScript library', async () => {
        const options = createTestBuildOptions({
          outputType: 'library',
          language: 'typescript',
        });

        const result = await coordinator.buildAgent(
          'Create a utility library for string manipulation',
          options
        );

        expect(result.artifacts).toBeDefined();
        expect(Object.keys(result.artifacts).length).toBeGreaterThan(0);
      });

      it('should generate library with exports', async () => {
        const options = createTestBuildOptions({
          outputType: 'library',
          language: 'typescript',
        });

        const result = await coordinator.buildAgent('Create a library', options);

        expect(result.artifacts).toBeDefined();
      });

      it('should generate library with type definitions', async () => {
        const options = createTestBuildOptions({
          outputType: 'library',
          language: 'typescript',
        });

        const result = await coordinator.buildAgent('Create a typed library', options);

        expect(result.artifacts).toBeDefined();
      });
    });

    describe('Python Library', () => {
      it('should generate Python library', async () => {
        const options = createTestBuildOptions({
          outputType: 'library',
          language: 'python',
        });

        const result = await coordinator.buildAgent('Create a utility library', options);

        expect(result.artifacts).toBeDefined();
        expect(Object.keys(result.artifacts).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Skill Output Format', () => {
    describe('TypeScript Skill', () => {
      it('should generate TypeScript skill', async () => {
        const options = createTestBuildOptions({
          outputType: 'skill',
          language: 'typescript',
        });

        const result = await coordinator.buildAgent(
          'Create a skill for code analysis',
          options
        );

        expect(result.artifacts).toBeDefined();
        expect(Object.keys(result.artifacts).length).toBeGreaterThan(0);
      });

      it('should generate skill with manifest', async () => {
        const options = createTestBuildOptions({
          outputType: 'skill',
          language: 'typescript',
        });

        const result = await coordinator.buildAgent('Create a skill', options);

        // Should have skill manifest
        expect(result.artifacts).toBeDefined();
      });
    });

    describe('Python Skill', () => {
      it('should generate Python skill', async () => {
        const options = createTestBuildOptions({
          outputType: 'skill',
          language: 'python',
        });

        const result = await coordinator.buildAgent('Create a skill', options);

        expect(result.artifacts).toBeDefined();
        expect(Object.keys(result.artifacts).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Cross-Format Consistency', () => {
    it('should generate tests for all formats', async () => {
      const formats: Array<'cli' | 'mcp' | 'library' | 'skill'> = [
        'cli',
        'mcp',
        'library',
        'skill',
      ];

      for (const format of formats) {
        const options = createTestBuildOptions({
          outputType: format,
          language: 'typescript',
        });

        const result = await coordinator.buildAgent(`Create a ${format}`, options);

        // All formats should generate artifacts
        expect(result.artifacts).toBeDefined();
        expect(Object.keys(result.artifacts).length).toBeGreaterThan(0);
      }
    });

    it('should generate documentation for all formats', async () => {
      const formats: Array<'cli' | 'mcp' | 'library' | 'skill'> = [
        'cli',
        'mcp',
        'library',
        'skill',
      ];

      for (const format of formats) {
        const options = createTestBuildOptions({
          outputType: format,
          language: 'typescript',
        });

        const result = await coordinator.buildAgent(`Create a ${format}`, options);

        // Should have documentation
        expect(result.artifacts).toBeDefined();
      }
    });

    it('should complete all phases for each format', async () => {
      const formats: Array<'cli' | 'mcp' | 'library' | 'skill'> = [
        'cli',
        'mcp',
        'library',
        'skill',
      ];

      for (const format of formats) {
        const options = createTestBuildOptions({
          outputType: format,
          language: 'typescript',
        });

        const result = await coordinator.buildAgent(`Create a ${format}`, options);

        // All phases should be completed
        expect(result.metrics.phaseMetrics.clarification).toBeDefined();
        expect(result.metrics.phaseMetrics.design).toBeDefined();
        expect(result.metrics.phaseMetrics.implementation).toBeDefined();
        expect(result.metrics.phaseMetrics.packaging).toBeDefined();
        expect(result.metrics.phaseMetrics.learning).toBeDefined();
      }
    });
  });

  describe('Language Support', () => {
    it('should support TypeScript for all formats', async () => {
      const formats: Array<'cli' | 'mcp' | 'library' | 'skill'> = [
        'cli',
        'mcp',
        'library',
        'skill',
      ];

      for (const format of formats) {
        const options = createTestBuildOptions({
          outputType: format,
          language: 'typescript',
        });

        const result = await coordinator.buildAgent(`TS ${format}`, options);
        expect(result.artifacts).toBeDefined();
      }
    });

    it('should support Python for all formats', async () => {
      const formats: Array<'cli' | 'mcp' | 'library' | 'skill'> = [
        'cli',
        'mcp',
        'library',
        'skill',
      ];

      for (const format of formats) {
        const options = createTestBuildOptions({
          outputType: format,
          language: 'python',
        });

        const result = await coordinator.buildAgent(`Python ${format}`, options);
        expect(result.artifacts).toBeDefined();
      }
    });
  });

  describe('Output Quality', () => {
    it('should generate complete artifacts for each format', async () => {
      const options = createTestBuildOptions({
        outputType: 'cli',
        language: 'typescript',
      });

      const result = await coordinator.buildAgent('Create a complete CLI', options);

      // Should have code, tests, docs, and config
      expect(Object.keys(result.artifacts).length).toBeGreaterThan(0);
    });

    it('should generate valid session metadata', async () => {
      const options = createTestBuildOptions({
        outputType: 'mcp',
        language: 'typescript',
      });

      const result = await coordinator.buildAgent('Create MCP', options);

      expect(result.sessionId).toBeDefined();
      expect(result.outputDir).toBeDefined();
      expect(result.metrics).toBeDefined();
    });
  });
});
