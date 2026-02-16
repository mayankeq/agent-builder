import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createLogger } from '../utils/logger';
import { WorkflowContext } from '../types/workflow';

const logger = createLogger('SessionStorage');

export interface SessionData {
  sessionId: string;
  timestamp: string;
  domain: string;
  userRequest: string;
  qualityTier: 'simple' | 'advanced';
  outputs: {
    format: string;
    language: string;
    success: boolean;
    deployed: boolean;
  };
  duration: number;
  tokenUsage: number;
  research?: any;
  requirements?: any;
  design?: any;
  userFeedback?: string;
  errors?: string[];
}

/**
 * Session Storage - Saves session data for learning
 * Uses JSONL format for efficient append-only logging
 */
export class SessionStorage {
  private sessionsDir: string;

  constructor(baseDir?: string) {
    this.sessionsDir =
      baseDir || path.join(os.homedir(), '.synthient', 'sessions');

    // Ensure directory exists
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
      logger.info('Created sessions directory', { path: this.sessionsDir });
    }
  }

  /**
   * Save session data to JSONL file
   */
  async saveSession(context: WorkflowContext): Promise<void> {
    try {
      const sessionData: SessionData = {
        sessionId: context.sessionId,
        timestamp: new Date().toISOString(),
        domain: context.research?.domain || 'general',
        userRequest: context.userRequest,
        qualityTier: context.options.qualityTier || 'simple',
        outputs: {
          format: context.options.outputType || 'skill',
          language: context.options.language || 'typescript',
          success: true, // Will be set based on actual completion
          deployed: context.options.autoDeploy !== false,
        },
        duration: context.metrics.totalDuration,
        tokenUsage: context.metrics.tokenUsage,
        research: context.research,
        requirements: context.requirements,
        design: {
          components: context.design?.components?.length || 0,
          techStack: context.design?.techStack?.length || 0,
          decisions: context.design?.decisions?.length || 0,
        },
      };

      // Append to JSONL file
      const sessionFile = path.join(
        this.sessionsDir,
        `${context.sessionId}.jsonl`
      );
      const jsonLine = JSON.stringify(sessionData) + '\n';
      fs.appendFileSync(sessionFile, jsonLine, 'utf-8');

      logger.info('Session saved', {
        sessionId: context.sessionId,
        file: sessionFile,
      });
    } catch (error) {
      logger.error('Failed to save session', error as Error);
      throw error;
    }
  }

  /**
   * Load session data by ID
   */
  async loadSession(sessionId: string): Promise<SessionData[]> {
    try {
      const sessionFile = path.join(this.sessionsDir, `${sessionId}.jsonl`);

      if (!fs.existsSync(sessionFile)) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      const content = fs.readFileSync(sessionFile, 'utf-8');
      const lines = content.trim().split('\n');

      return lines.map((line) => JSON.parse(line));
    } catch (error) {
      logger.error('Failed to load session', error as Error);
      throw error;
    }
  }

  /**
   * List all sessions
   */
  async listSessions(): Promise<{ sessionId: string; timestamp: string }[]> {
    try {
      const files = fs.readdirSync(this.sessionsDir);
      const sessionFiles = files.filter((f) => f.endsWith('.jsonl'));

      const sessions = [];
      for (const file of sessionFiles) {
        const sessionId = path.basename(file, '.jsonl');
        const filePath = path.join(this.sessionsDir, file);
        const stats = fs.statSync(filePath);

        sessions.push({
          sessionId,
          timestamp: stats.mtime.toISOString(),
        });
      }

      // Sort by timestamp descending
      sessions.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return sessions;
    } catch (error) {
      logger.error('Failed to list sessions', error as Error);
      return [];
    }
  }

  /**
   * Get sessions by domain
   */
  async getSessionsByDomain(domain: string): Promise<SessionData[]> {
    try {
      const sessions = await this.listSessions();
      const domainSessions: SessionData[] = [];

      for (const session of sessions) {
        const sessionData = await this.loadSession(session.sessionId);
        const latestData = sessionData[sessionData.length - 1];
        if (latestData.domain === domain) {
          domainSessions.push(latestData);
        }
      }

      return domainSessions;
    } catch (error) {
      logger.error('Failed to get sessions by domain', error as Error);
      return [];
    }
  }

  /**
   * Get successful sessions for pattern extraction
   */
  async getSuccessfulSessions(limit: number = 50): Promise<SessionData[]> {
    try {
      const sessions = await this.listSessions();
      const successfulSessions: SessionData[] = [];

      for (const session of sessions.slice(0, limit)) {
        const sessionData = await this.loadSession(session.sessionId);
        const latestData = sessionData[sessionData.length - 1];
        if (latestData.outputs.success) {
          successfulSessions.push(latestData);
        }
      }

      return successfulSessions;
    } catch (error) {
      logger.error('Failed to get successful sessions', error as Error);
      return [];
    }
  }
}
