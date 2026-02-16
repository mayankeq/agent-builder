import { Router, Request, Response } from 'express';
import { asyncHandler, ValidationError } from '../middleware/error-handler';
import { agentCreationRateLimitMiddleware } from '../middleware/rate-limit';
import { SessionStore } from '../storage/session-store';
import { S3Store } from '../storage/s3-store';
import { query } from '../storage/database';
import { decrypt } from '../security/encryption';
import { logger } from '../monitoring/logger';
import { audit } from '../monitoring/audit';
import { agentCreationsTotal, agentCreationsActive } from '../monitoring/metrics';
import { WorkflowCoordinator } from '../../orchestration/workflow-coordinator';

const router = Router();
const sessionStore = new SessionStore();
const s3Store = new S3Store();

/**
 * POST /api/agents/create
 * Create a new agent
 */
router.post('/create',
  agentCreationRateLimitMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const {
      description,
      outputType = 'mcp',
      language = 'typescript',
      interactive = false,
    } = req.body;

    // Validation
    if (!description || typeof description !== 'string') {
      throw new ValidationError('Agent description is required');
    }

    if (!['skill', 'mcp', 'cli', 'library'].includes(outputType)) {
      throw new ValidationError('Invalid output type');
    }

    if (!['typescript', 'python'].includes(language)) {
      throw new ValidationError('Invalid language');
    }

    // Get user's API key
    const apiKeyResult = await query(
      'SELECT encrypted_key, iv, auth_tag, is_valid FROM user_api_keys WHERE user_id = $1',
      [userId]
    );

    if (apiKeyResult.rows.length === 0) {
      throw new ValidationError('No API key configured. Please add your Anthropic API key first.');
    }

    const encryptedKey = apiKeyResult.rows[0];

    if (!encryptedKey.is_valid) {
      throw new ValidationError('API key is invalid. Please update your API key.');
    }

    // Decrypt API key
    let anthropicApiKey: string;
    try {
      anthropicApiKey = decrypt({
        encrypted: encryptedKey.encrypted_key,
        iv: encryptedKey.iv,
        authTag: encryptedKey.auth_tag,
      });
    } catch (error) {
      logger.error('Failed to decrypt API key', { userId, error });
      throw new ValidationError('Failed to access API key');
    }

    // Create session
    const session = await sessionStore.create({
      user_id: userId,
      user_request: description,
      output_type: outputType,
      language,
      metadata: {
        interactive,
        startedAt: new Date().toISOString(),
      },
    });

    // Audit log
    await audit.createSession(userId, session.id, description, req.ip || 'unknown');

    // Track metrics
    agentCreationsTotal.inc({ output_type: outputType, language });
    agentCreationsActive.inc();

    logger.info('Agent creation started', {
      sessionId: session.id,
      userId,
      outputType,
      language,
    });

    // Start workflow asynchronously
    startWorkflow(session.id, description, outputType, language, anthropicApiKey)
      .catch(error => {
        logger.error('Workflow execution failed', { sessionId: session.id, error });
        agentCreationsActive.dec();
      });

    // Return session ID immediately
    res.status(202).json({
      sessionId: session.id,
      status: 'pending',
      message: 'Agent creation started',
    });
  })
);

/**
 * Start workflow execution in background
 */
async function startWorkflow(
  sessionId: string,
  description: string,
  outputType: string,
  language: string,
  apiKey: string
): Promise<void> {
  const startTime = Date.now();

  try {
    // Update session to in_progress
    await sessionStore.update(sessionId, {
      status: 'in_progress',
      current_phase: 'clarification',
      progress: 0.1,
    });

    // Initialize workflow coordinator
    const coordinator = new WorkflowCoordinator({
      sessionId,
      userRequest: description,
      outputType: outputType as any,
      language: language as any,
      anthropicApiKey: apiKey,
      onProgress: async (phase, progress) => {
        await sessionStore.update(sessionId, {
          current_phase: phase as any,
          progress,
        });
      },
    });

    // Execute workflow
    const result = await coordinator.execute();

    // Upload artifacts to S3
    const s3Key = await s3Store.uploadDirectory(sessionId, result.outputPath);

    // Update session to completed
    await sessionStore.update(sessionId, {
      status: 'completed',
      progress: 1.0,
      artifacts_s3_key: s3Key,
      completed_at: new Date(),
    });

    const duration = (Date.now() - startTime) / 1000;
    logger.info('Agent creation completed', { sessionId, duration });

    // Audit log
    const session = await sessionStore.getById(sessionId);
    if (session) {
      await audit.sessionCompleted(session.user_id, sessionId, duration);
    }

  } catch (error: any) {
    const duration = (Date.now() - startTime) / 1000;
    const errorMessage = error.message || 'Workflow execution failed';

    logger.error('Agent creation failed', { sessionId, error: errorMessage, duration });

    // Update session to failed
    await sessionStore.update(sessionId, {
      status: 'failed',
      error: errorMessage,
      completed_at: new Date(),
    });

    // Audit log
    const session = await sessionStore.getById(sessionId);
    if (session) {
      await audit.sessionFailed(session.user_id, sessionId, errorMessage);
    }
  } finally {
    agentCreationsActive.dec();
  }
}

/**
 * GET /api/agents/examples
 * Get example agent templates
 */
router.get('/examples', (_req: Request, res: Response) => {
  const examples = [
    {
      id: 'web-scraper',
      name: 'Web Scraper',
      description: 'A web scraper that extracts product information from e-commerce sites',
      outputType: 'mcp',
      language: 'typescript',
    },
    {
      id: 'data-processor',
      name: 'Data Processor',
      description: 'Process CSV files and generate summary statistics',
      outputType: 'cli',
      language: 'python',
    },
    {
      id: 'api-client',
      name: 'API Client',
      description: 'A REST API client library for GitHub with authentication',
      outputType: 'library',
      language: 'typescript',
    },
    {
      id: 'code-analyzer',
      name: 'Code Analyzer',
      description: 'Analyze code quality and suggest improvements',
      outputType: 'skill',
      language: 'python',
    },
    {
      id: 'log-parser',
      name: 'Log Parser',
      description: 'Parse application logs and extract error patterns',
      outputType: 'cli',
      language: 'typescript',
    },
  ];

  res.json({ examples });
});

export default router;
