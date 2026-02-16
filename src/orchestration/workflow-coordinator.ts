import { createLogger } from '../utils/logger';
import {
  WorkflowContext,
  WorkflowPhase,
  Research,
  Requirements,
  Design,
  Implementation,
  BuildOptions,
  BuildResult,
  WorkflowMetrics,
  PhaseMetrics,
} from '../types/workflow';
import { AgentFactory } from './agent-factory';
// import { PhaseManager } from './phase-manager';
import { ParallelBatch } from '../utils/async-utils';
import { v4 as uuidv4 } from 'uuid';
import { SessionStorage } from '../memory/session-storage';
import { PatternExtractor } from '../memory/pattern-extractor';
import { ExportService } from '../packaging/export-service';
import { readExistingAgents } from '../utils/existing-agent-reader';
import * as fs from 'fs/promises';
import * as path from 'path';

const logger = createLogger('WorkflowCoordinator');

/**
 * Workflow Coordinator - Orchestrates the five-phase agent building workflow
 * Manages: Clarification → Design → Implementation → Packaging → Learning
 */
export class WorkflowCoordinator {
  private agentFactory: AgentFactory;
  private sessionStorage: SessionStorage;
  private patternExtractor: PatternExtractor;
  private exportService: ExportService;
  // Phase manager available for future validation
  // private phaseManager: PhaseManager;

  constructor(agentFactory: AgentFactory) {
    this.agentFactory = agentFactory;
    this.sessionStorage = new SessionStorage();
    this.patternExtractor = new PatternExtractor();
    this.exportService = new ExportService();
    // this.phaseManager = new PhaseManager();
  }

  /**
   * Main entry point - Build an agent from user request
   */
  async buildAgent(
    userRequest: string,
    options: BuildOptions
  ): Promise<BuildResult> {
    const sessionId = uuidv4();
    const startTime = new Date();

    logger.info('Starting agent build', { sessionId, userRequest });

    const context = this.initializeContext(sessionId, userRequest, options);

    // Load existing agents if directory provided
    if (options.existingAgentsDir) {
      try {
        logger.info('Loading existing agents from', { directory: options.existingAgentsDir });
        const existingAgents = await readExistingAgents(options.existingAgentsDir);
        context.existingAgents = existingAgents;
        logger.info('Existing agents loaded successfully', {
          agentFiles: existingAgents.agentFiles.size,
          hasIndex: !!existingAgents.agentsIndex,
          hasClaudeMd: !!existingAgents.claudeMd,
        });
      } catch (error) {
        logger.warning('Failed to load existing agents, continuing without them', error as Error);
        // Continue without existing agents rather than failing
      }
    }

    try {
      // Phase 0: Research (with extended thinking)
      const research = await this.runResearchPhase(context);
      context.withResearch(research);

      // Phase 1: Clarification
      const requirements = await this.runClarificationPhase(context);
      context.withRequirements(requirements);

      // Phase 2: Design (with extended thinking)
      const design = await this.runDesignPhase(requirements, context);
      context.withDesign(design);

      // Phase 3: Implementation (parallel: code + tests + docs)
      const implementation = await this.runImplementationPhase(design, context);
      context.withImplementation(implementation);

      // Save implementation files immediately
      const outputDir = `./output/${sessionId}`;
      await this.saveImplementationFiles(outputDir, implementation);
      logger.info('Implementation files saved', { outputDir, fileCount: Object.keys(implementation.code).length });

      // Use implementation code as artifacts (skip packaging)
      const artifacts = {
        ...implementation.code,
        ...implementation.tests,
        ...implementation.docs,
      };

      // Phase 4.5: Auto-Deploy (if enabled)
      const autoDeploy = context.options.autoDeploy !== false; // Default to true
      if (autoDeploy) {
        await this.runDeploymentPhase(context);
      } else {
        logger.info('Auto-deploy disabled, skipping deployment phase');
      }

      // Phase 4.75: Export - Create downloadable ZIP
      logger.info('Creating downloadable package');
      const exportResult = await this.exportService.exportAgent(
        context,
        `./output/${context.sessionId}`
      );

      if (exportResult.success) {
        logger.info('Package created', {
          zipPath: exportResult.zipPath,
          size: exportResult.size,
        });
      } else {
        logger.error('Package creation failed', new Error(exportResult.error));
      }

      // Phase 5: Learning
      await this.runLearningPhase(context);

      const endTime = new Date();
      const totalDuration = endTime.getTime() - startTime.getTime();

      logger.info('Agent build completed successfully', {
        sessionId,
        duration: totalDuration,
      });

      return {
        sessionId,
        outputDir: `./generated/${sessionId}`,
        artifacts,
        metrics: {
          ...context.metrics,
          totalDuration,
        },
      };
    } catch (error) {
      logger.error('Agent build failed', error as Error, { sessionId });
      throw error;
    }
  }

  /**
   * Phase 0: Research - Deep analysis with extended thinking
   */
  private async runResearchPhase(context: WorkflowContext): Promise<Research> {
    logger.info('Starting research phase');

    const phaseStart = Date.now();
    context.transitionTo('research');

    const researchAgent = this.agentFactory.create('research');

    // Adjust thinking budget based on quality tier
    const qualityTier = context.options.qualityTier || 'simple';
    // Research agent will use its default thinking budget, but we log the tier
    logger.info('Research tier', { qualityTier });

    const result = await researchAgent.execute(context);

    const research = result.data.research as Research;

    const phaseEnd = Date.now();
    this.recordPhaseMetrics(context, 'research', phaseStart, phaseEnd, true);

    logger.info('Research phase completed', {
      domain: research.domain,
      intent: research.userIntent.slice(0, 100),
      capabilities: research.capabilities.length,
      patterns: research.relevantPatterns.length,
      usedThinking: research.thinkingTrace !== undefined,
    });

    return research;
  }

  /**
   * Phase 1: Clarification - Gather requirements through questions
   */
  private async runClarificationPhase(
    context: WorkflowContext
  ): Promise<Requirements> {
    logger.info('Starting clarification phase');

    const phaseStart = Date.now();
    context.transitionTo('clarification');

    const clarificationAgent = this.agentFactory.create('clarification');

    // Interactive mode would handle Q&A here
    // For now, we'll use a simplified version
    const result = await clarificationAgent.execute(context);

    const requirements = result.data.requirements as Requirements;

    const phaseEnd = Date.now();
    this.recordPhaseMetrics(context, 'clarification', phaseStart, phaseEnd, true);

    logger.info('Clarification phase completed', {
      functional: requirements.functional.length,
      outputType: requirements.output.type,
    });

    return requirements;
  }

  /**
   * Phase 2: Design - Create architecture with extended thinking
   */
  private async runDesignPhase(
    _requirements: Requirements,
    context: WorkflowContext
  ): Promise<Design> {
    logger.info('Starting design phase');

    const phaseStart = Date.now();
    context.transitionTo('design');

    const designAgent = this.agentFactory.create('design');
    const result = await designAgent.execute(context);

    const design = result.data.design as Design;

    const phaseEnd = Date.now();
    this.recordPhaseMetrics(context, 'design', phaseStart, phaseEnd, true);

    logger.info('Design phase completed', {
      components: design.components.length,
      usedThinking: design.thinkingTrace !== undefined,
    });

    return design;
  }

  /**
   * Phase 3: Implementation - Generate code, tests, and docs
   * First generates code, then runs tests and docs in parallel
   */
  private async runImplementationPhase(
    _design: Design,
    context: WorkflowContext
  ): Promise<Implementation> {
    logger.info('Starting implementation phase');

    const phaseStart = Date.now();
    context.transitionTo('implementation');

    // Step 1: Generate code first
    const implementationAgent = this.agentFactory.create('implementation');
    logger.info('Running implementation agent');
    const codeResult = await implementationAgent.execute(context);
    const code = codeResult.data.code;

    // Update context with generated code so tests and docs can access it
    const tempImplementation: Implementation = {
      code,
      tests: {},
      docs: {},
      config: {},
    };
    context.withImplementation(tempImplementation);

    // Step 2: Generate tests and docs in parallel (they both need the code)
    // Make these optional - don't fail the build if they fail
    const testingAgent = this.agentFactory.create('testing');
    const documentationAgent = this.agentFactory.create('documentation');

    const batch = new ParallelBatch<any>(2);

    batch.addJobs(
      async () => {
        try {
          logger.info('Running testing agent');
          const result = await testingAgent.execute(context);
          return result.data.tests;
        } catch (error) {
          logger.warning('Testing agent failed, continuing without tests', error as Error);
          return {};
        }
      },
      async () => {
        try {
          logger.info('Running documentation agent');
          const result = await documentationAgent.execute(context);
          return result.data.docs;
        } catch (error) {
          logger.warning('Documentation agent failed, continuing without docs', error as Error);
          return {};
        }
      }
    );

    const [tests, docs] = await batch.runJobs();

    const implementation: Implementation = {
      code,
      tests,
      docs,
      config: {},
    };

    const phaseEnd = Date.now();
    this.recordPhaseMetrics(context, 'implementation', phaseStart, phaseEnd, true);

    logger.info('Implementation phase completed', {
      codeFiles: Object.keys(code).length,
      testFiles: Object.keys(tests).length,
      docFiles: Object.keys(docs).length,
    });

    return implementation;
  }

  /**
   * Phase 4.5: Deployment - Auto-deploy generated agents (DISABLED)
   */
  private async runDeploymentPhase(context: WorkflowContext): Promise<void> {
    logger.info('Starting deployment phase');

    const phaseStart = Date.now();

    const deployAgent = this.agentFactory.create('deploy');
    const result = await deployAgent.execute(context);

    const deployment = result.data.deployment;

    const phaseEnd = Date.now();
    this.recordPhaseMetrics(context, 'packaging', phaseStart, phaseEnd, true);

    logger.info('Deployment phase completed', {
      installed: deployment.installed,
      path: deployment.skillPath,
    });
  }

  /**
   * Phase 5: Learning - Capture session data for improvement
   */
  private async runLearningPhase(context: WorkflowContext): Promise<void> {
    logger.info('Starting learning phase');

    const phaseStart = Date.now();
    context.transitionTo('learning');

    try {
      // 1. Save session data
      await this.sessionStorage.saveSession(context);
      logger.info('Session data saved', { sessionId: context.sessionId });

      // 2. Extract patterns periodically (every 10 sessions)
      const sessions = await this.sessionStorage.listSessions();
      if (sessions.length % 10 === 0) {
        logger.info('Extracting patterns from recent sessions');
        const successfulSessions =
          await this.sessionStorage.getSuccessfulSessions(50);
        await this.patternExtractor.extractPatterns(successfulSessions);
        logger.info('Pattern extraction completed');
      }

      const phaseEnd = Date.now();
      this.recordPhaseMetrics(context, 'learning', phaseStart, phaseEnd, true);

      logger.info('Learning phase completed', {
        sessionId: context.sessionId,
        totalSessions: sessions.length,
      });
    } catch (error) {
      logger.error('Learning phase failed', error as Error);
      const phaseEnd = Date.now();
      this.recordPhaseMetrics(
        context,
        'learning',
        phaseStart,
        phaseEnd,
        false,
        (error as Error).message
      );
      // Don't throw - learning failure shouldn't fail the whole build
    }
  }

  /**
   * Initialize workflow context
   */
  private initializeContext(
    sessionId: string,
    userRequest: string,
    options: BuildOptions
  ): WorkflowContext {
    const metrics: WorkflowMetrics = {
      totalDuration: 0,
      phaseMetrics: {} as Record<WorkflowPhase, PhaseMetrics>,
      tokenUsage: 0,
      errorCount: 0,
    };

    return {
      sessionId,
      userRequest,
      currentPhase: 'research',
      options,
      metrics,
      memory: null,
      startTime: new Date(),

      withResearch(research: Research) {
        this.research = research;
        return this;
      },

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

      transitionTo(phase: WorkflowPhase) {
        this.currentPhase = phase;
      },

      captureThinking(thinking: any) {
        logger.debug('Captured thinking trace', { phase: thinking.phase });
      },
    };
  }

  /**
   * Record metrics for a completed phase
   */
  private recordPhaseMetrics(
    context: WorkflowContext,
    phase: WorkflowPhase,
    startTime: number,
    endTime: number,
    success: boolean,
    error?: string
  ): void {
    const metrics: PhaseMetrics = {
      duration: endTime - startTime,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      success,
      error,
    };

    context.metrics.phaseMetrics[phase] = metrics;
  }

  /**
   * Save implementation files to disk
   */
  private async saveImplementationFiles(
    outputDir: string,
    implementation: Implementation
  ): Promise<void> {
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });

    // Save all code files
    for (const [filePath, content] of Object.entries(implementation.code)) {
      const fullPath = path.join(outputDir, filePath);
      const dir = path.dirname(fullPath);

      // Ensure directory exists
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(fullPath, content, 'utf-8');
      logger.debug(`Saved file: ${filePath}`);
    }

    // Save test files if any
    for (const [filePath, content] of Object.entries(implementation.tests || {})) {
      const fullPath = path.join(outputDir, filePath);
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
    }

    // Save doc files if any
    for (const [filePath, content] of Object.entries(implementation.docs || {})) {
      const fullPath = path.join(outputDir, filePath);
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
    }
  }
}
