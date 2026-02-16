import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowContext,
  Requirements,
  Design,
  Implementation,
  BuildOptions,
  WorkflowMetrics,
} from '@/types/workflow';

/**
 * Create a basic workflow context for testing
 */
export function createTestWorkflowContext(overrides?: Partial<WorkflowContext>): WorkflowContext {
  const sessionId = overrides?.sessionId || uuidv4();
  const metrics: WorkflowMetrics = {
    totalDuration: 0,
    phaseMetrics: {} as any,
    tokenUsage: 0,
    errorCount: 0,
  };

  return {
    sessionId,
    userRequest: overrides?.userRequest || 'Test user request',
    currentPhase: overrides?.currentPhase || 'clarification',
    options: overrides?.options || createTestBuildOptions(),
    metrics: overrides?.metrics || metrics,
    memory: null,
    startTime: overrides?.startTime || new Date(),

    withRequirements(requirements: Requirements) {
      this.requirements = requirements;
      return this;
    },

    withDesign(design: Design) {
      this.design = design;
      return this;
    },

    withImplementation(implementation: Implementation) {
      this.implementation = implementation;
      return this;
    },

    transitionTo(phase) {
      this.currentPhase = phase;
    },

    captureThinking(thinking: any) {
      // No-op for testing
    },

    ...overrides,
  };
}

/**
 * Create test build options
 */
export function createTestBuildOptions(overrides?: Partial<BuildOptions>): BuildOptions {
  return {
    outputType: overrides?.outputType || 'cli',
    language: overrides?.language || 'typescript',
    interactive: overrides?.interactive ?? false,
    useExtendedThinking: overrides?.useExtendedThinking ?? true,
    thinkingBudget: overrides?.thinkingBudget || 'medium',
    optimization: overrides?.optimization || 'balanced',
    ...overrides,
  };
}

/**
 * Create test requirements
 */
export function createTestRequirements(overrides?: Partial<Requirements>): Requirements {
  return {
    functional: overrides?.functional || [
      'Process user input',
      'Generate output',
      'Handle errors',
    ],
    technical: overrides?.technical || {
      language: 'typescript',
      framework: 'none',
      dependencies: [],
    },
    architectural: overrides?.architectural || {
      patterns: ['MVC'],
      constraints: [],
    },
    output: overrides?.output || {
      type: 'cli',
      language: 'typescript',
    },
    clarificationRounds: overrides?.clarificationRounds || 1,
    ...overrides,
  };
}

/**
 * Create test design
 */
export function createTestDesign(overrides?: Partial<Design>): Design {
  return {
    components: overrides?.components || [
      {
        name: 'Main',
        type: 'entry',
        responsibilities: ['Application entry point'],
        dependencies: ['Handler'],
      },
      {
        name: 'Handler',
        type: 'logic',
        responsibilities: ['Business logic'],
        dependencies: [],
      },
    ],
    dataFlow: overrides?.dataFlow || 'Input -> Handler -> Output',
    architecture: overrides?.architecture || 'Layered',
    technologies: overrides?.technologies || ['typescript', 'node'],
    thinkingTrace: overrides?.thinkingTrace,
    ...overrides,
  };
}

/**
 * Create test implementation
 */
export function createTestImplementation(overrides?: Partial<Implementation>): Implementation {
  return {
    code: overrides?.code || {
      'index.ts': 'export function main() { console.log("Hello"); }',
      'handler.ts': 'export class Handler { process() {} }',
    },
    tests: overrides?.tests || {
      'index.test.ts': 'describe("main", () => { it("works", () => {}) });',
    },
    docs: overrides?.docs || {
      'README.md': '# Test Project\n\nA test project',
    },
    config: overrides?.config || {},
    ...overrides,
  };
}

/**
 * Create a complete workflow context with all phases populated
 */
export function createCompleteWorkflowContext(): WorkflowContext {
  const context = createTestWorkflowContext();
  context.requirements = createTestRequirements();
  context.design = createTestDesign();
  context.implementation = createTestImplementation();
  return context;
}
