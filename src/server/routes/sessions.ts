import { Router, Request, Response } from 'express';
import { asyncHandler, NotFoundError, AuthorizationError } from '../middleware/error-handler';
import { SessionStore } from '../storage/session-store';
import { getSessionAuditLog } from '../monitoring/audit';
import { logger } from '../monitoring/logger';

const router = Router();
const sessionStore = new SessionStore();

/**
 * GET /api/sessions
 * List user's sessions with pagination and filtering
 */
router.get('/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);
    const status = req.query.status as string | undefined;

    // Validate status if provided
    if (status && !['pending', 'in_progress', 'completed', 'failed', 'cancelled'].includes(status)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid status filter',
      });
      return;
    }

    const { sessions, total } = await sessionStore.listByUser(userId, {
      page,
      pageSize,
      status: status as any,
    });

    const totalPages = Math.ceil(total / pageSize);

    res.json({
      sessions: sessions.map(session => ({
        id: session.id,
        userRequest: session.user_request,
        status: session.status,
        currentPhase: session.current_phase,
        progress: session.progress,
        outputType: session.output_type,
        language: session.language,
        error: session.error,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        completedAt: session.completed_at,
        hasArtifacts: !!session.artifacts_s3_key,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  })
);

/**
 * GET /api/sessions/:id
 * Get detailed session information
 */
router.get('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const sessionId = req.params.id;

    const session = await sessionStore.getById(sessionId);

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Check ownership
    if (session.user_id !== userId) {
      throw new AuthorizationError('Access denied');
    }

    // Get audit log
    const auditLog = await getSessionAuditLog(sessionId);

    res.json({
      session: {
        id: session.id,
        userRequest: session.user_request,
        status: session.status,
        currentPhase: session.current_phase,
        progress: session.progress,
        outputType: session.output_type,
        language: session.language,
        error: session.error,
        metadata: session.metadata,
        artifactsS3Key: session.artifacts_s3_key,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        completedAt: session.completed_at,
      },
      auditLog: auditLog.map(log => ({
        eventType: log.event_type,
        details: log.details,
        timestamp: log.created_at,
      })),
    });
  })
);

/**
 * POST /api/sessions/:id/cancel
 * Cancel an in-progress session
 */
router.post('/:id/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const sessionId = req.params.id;

    const session = await sessionStore.getById(sessionId);

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Check ownership
    if (session.user_id !== userId) {
      throw new AuthorizationError('Access denied');
    }

    // Can only cancel pending or in_progress sessions
    if (!['pending', 'in_progress'].includes(session.status)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Can only cancel pending or in-progress sessions',
      });
      return;
    }

    // Cancel the session
    await sessionStore.cancel(sessionId);

    logger.info('Session cancelled', { sessionId, userId });

    res.json({
      success: true,
      message: 'Session cancelled successfully',
      sessionId,
    });
  })
);

/**
 * DELETE /api/sessions/:id
 * Delete a session and its artifacts
 */
router.delete('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const sessionId = req.params.id;

    const session = await sessionStore.getById(sessionId);

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    // Check ownership
    if (session.user_id !== userId) {
      throw new AuthorizationError('Access denied');
    }

    // Delete session
    await sessionStore.delete(sessionId);

    logger.info('Session deleted', { sessionId, userId });

    res.json({
      success: true,
      message: 'Session deleted successfully',
    });
  })
);

/**
 * GET /api/sessions/stats
 * Get user's session statistics
 */
router.get('/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const stats = await sessionStore.getStats(userId);

    res.json({
      stats: {
        total: stats.total,
        completed: stats.completed,
        failed: stats.failed,
        inProgress: stats.inProgress,
        averageDuration: Math.round(stats.avgDuration), // minutes
      },
    });
  })
);

export default router;
