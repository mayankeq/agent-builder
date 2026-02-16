import { Router, Request, Response } from 'express';
import { asyncHandler, NotFoundError, AuthorizationError } from '../middleware/error-handler';
import { downloadRateLimitMiddleware } from '../middleware/rate-limit';
import { SessionStore } from '../storage/session-store';
import { S3Store } from '../storage/s3-store';
import { audit } from '../monitoring/audit';
import { logger } from '../monitoring/logger';

const router = Router();
const sessionStore = new SessionStore();
const s3Store = new S3Store();

/**
 * GET /api/downloads/:sessionId/artifacts
 * Download all artifacts as ZIP
 */
router.get('/:sessionId/artifacts',
  downloadRateLimitMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const sessionId = req.params.sessionId;

    // Get session
    const session = await sessionStore.getById(sessionId);

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Check ownership
    if (session.user_id !== userId) {
      throw new AuthorizationError('Access denied');
    }

    // Check if artifacts exist
    if (!session.artifacts_s3_key) {
      res.status(404).json({
        error: 'Not Found',
        message: 'No artifacts available for this session',
      });
      return;
    }

    // Check session is completed
    if (session.status !== 'completed') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Session is not completed yet',
      });
      return;
    }

    try {
      // Download from S3
      const buffer = await s3Store.downloadFile(session.artifacts_s3_key);

      // Audit log
      await audit.downloadArtifacts(userId, sessionId, req.ip || 'unknown');

      logger.info('Artifacts downloaded', { sessionId, userId, size: buffer.length });

      // Set response headers
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${sessionId}.zip"`);
      res.setHeader('Content-Length', buffer.length);

      // Send file
      res.send(buffer);
    } catch (error) {
      logger.error('Error downloading artifacts', { error, sessionId });
      throw new Error('Failed to download artifacts');
    }
  })
);

/**
 * GET /api/downloads/:sessionId/artifacts/url
 * Get presigned URL for artifacts download
 */
router.get('/:sessionId/artifacts/url',
  downloadRateLimitMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const sessionId = req.params.sessionId;
    const expiresIn = Math.min(parseInt(req.query.expiresIn as string) || 3600, 7200); // max 2 hours

    // Get session
    const session = await sessionStore.getById(sessionId);

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Check ownership
    if (session.user_id !== userId) {
      throw new AuthorizationError('Access denied');
    }

    // Check if artifacts exist
    if (!session.artifacts_s3_key) {
      res.status(404).json({
        error: 'Not Found',
        message: 'No artifacts available for this session',
      });
      return;
    }

    // Check session is completed
    if (session.status !== 'completed') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Session is not completed yet',
      });
      return;
    }

    try {
      // Generate presigned URL
      const url = await s3Store.getDownloadUrl(session.artifacts_s3_key, expiresIn);

      logger.info('Presigned download URL generated', { sessionId, userId, expiresIn });

      res.json({
        url,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      });
    } catch (error) {
      logger.error('Error generating download URL', { error, sessionId });
      throw new Error('Failed to generate download URL');
    }
  })
);

/**
 * GET /api/downloads/:sessionId/metadata
 * Get artifacts metadata (size, files, etc.)
 */
router.get('/:sessionId/metadata',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const sessionId = req.params.sessionId;

    // Get session
    const session = await sessionStore.getById(sessionId);

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Check ownership
    if (session.user_id !== userId) {
      throw new AuthorizationError('Access denied');
    }

    // Check if artifacts exist
    if (!session.artifacts_s3_key) {
      res.status(404).json({
        error: 'Not Found',
        message: 'No artifacts available for this session',
      });
      return;
    }

    try {
      // Get metadata from S3
      const metadata = await s3Store.getFileMetadata(session.artifacts_s3_key);

      res.json({
        sessionId,
        artifacts: {
          size: metadata.size,
          lastModified: metadata.lastModified,
          contentType: metadata.contentType,
          s3Key: session.artifacts_s3_key,
        },
        session: {
          status: session.status,
          outputType: session.output_type,
          language: session.language,
          completedAt: session.completed_at,
        },
      });
    } catch (error) {
      logger.error('Error getting artifacts metadata', { error, sessionId });
      throw new Error('Failed to get artifacts metadata');
    }
  })
);

export default router;
