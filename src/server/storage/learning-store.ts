import { query } from './database';
import { logger } from '../monitoring/logger';

export interface LearningPattern {
  id: string;
  pattern_type: 'requirement' | 'architecture' | 'implementation' | 'common_issue' | 'optimization' | 'best_practice';
  similarity_hash: string;
  pattern_data: any;
  source_sessions: string[];
  usage_count: number;
  success_rate: number;
  avg_tokens_saved: number;
  tags: string[];
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface PatternSuggestion {
  pattern_id: string;
  pattern_type: string;
  pattern_data: any;
  similarity_score: number;
  usage_count: number;
  success_rate: number;
}

export class LearningStore {
  /**
   * Store a learning pattern extracted from a session
   */
  async storePattern(params: {
    pattern_type: LearningPattern['pattern_type'];
    pattern_data: any;
    session_id: string;
    tags?: string[];
    metadata?: any;
  }): Promise<string> {
    // Create similarity hash from pattern data
    const similarityHash = this.createSimilarityHash(params.pattern_data);

    // Check if similar pattern exists
    const existing = await query<LearningPattern>(
      'SELECT id, source_sessions FROM learning_patterns WHERE similarity_hash = $1',
      [similarityHash]
    );

    if (existing.rows.length > 0) {
      // Update existing pattern
      const pattern = existing.rows[0];
      const updatedSessions = [...pattern.source_sessions, params.session_id];

      await query(
        `UPDATE learning_patterns
         SET source_sessions = $1, updated_at = NOW()
         WHERE id = $2`,
        [updatedSessions, pattern.id]
      );

      logger.info('Updated existing learning pattern', { patternId: pattern.id });
      return pattern.id;
    }

    // Insert new pattern
    const sql = `
      INSERT INTO learning_patterns (
        pattern_type, similarity_hash, pattern_data, source_sessions, tags, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    try {
      const result = await query<{ id: string }>(sql, [
        params.pattern_type,
        similarityHash,
        JSON.stringify(params.pattern_data),
        [params.session_id],
        params.tags || [],
        params.metadata ? JSON.stringify(params.metadata) : null,
      ]);

      const patternId = result.rows[0].id;
      logger.info('Stored new learning pattern', { patternId, type: params.pattern_type });

      return patternId;
    } catch (error) {
      logger.error('Error storing learning pattern', { error });
      throw new Error('Failed to store learning pattern');
    }
  }

  /**
   * Find similar patterns for a new request
   */
  async findSimilarPatterns(params: {
    userRequest: string;
    outputType: string;
    language: string;
    threshold?: number;
    limit?: number;
  }): Promise<PatternSuggestion[]> {
    const threshold = params.threshold || 0.7;
    const limit = params.limit || 5;

    try {
      const result = await query<PatternSuggestion>(
        'SELECT * FROM find_similar_patterns($1, $2, $3, $4, $5)',
        [params.userRequest, params.outputType, params.language, threshold, limit]
      );

      logger.info('Found similar patterns', {
        count: result.rows.length,
        outputType: params.outputType,
      });

      return result.rows;
    } catch (error) {
      logger.error('Error finding similar patterns', { error });
      return [];
    }
  }

  /**
   * Suggest patterns to a session
   */
  async suggestPatterns(
    sessionId: string,
    patterns: PatternSuggestion[]
  ): Promise<void> {
    if (patterns.length === 0) {
      return;
    }

    try {
      const values = patterns.map((p, idx) => {
        const offset = idx * 3;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
      }).join(', ');

      const params = patterns.flatMap(p => [
        sessionId,
        p.pattern_id,
        p.similarity_score,
      ]);

      await query(
        `INSERT INTO pattern_suggestions (session_id, pattern_id, similarity_score)
         VALUES ${values}`,
        params
      );

      logger.info('Suggested patterns to session', {
        sessionId,
        count: patterns.length,
      });
    } catch (error) {
      logger.error('Error suggesting patterns', { error, sessionId });
    }
  }

  /**
   * Record user feedback on a pattern suggestion
   */
  async recordFeedback(params: {
    sessionId: string;
    patternId: string;
    feedback: 'accepted' | 'rejected' | 'modified';
    applied: boolean;
    tokensSaved?: number;
  }): Promise<void> {
    try {
      await query(
        `UPDATE pattern_suggestions
         SET user_feedback = $1, applied = $2, tokens_saved = $3
         WHERE session_id = $4 AND pattern_id = $5`,
        [params.feedback, params.applied, params.tokensSaved || 0, params.sessionId, params.patternId]
      );

      logger.info('Recorded pattern feedback', {
        sessionId: params.sessionId,
        patternId: params.patternId,
        feedback: params.feedback,
      });
    } catch (error) {
      logger.error('Error recording pattern feedback', { error });
    }
  }

  /**
   * Update pattern success rate based on session outcome
   */
  async updatePatternSuccess(
    sessionId: string,
    success: boolean
  ): Promise<void> {
    try {
      // Get all patterns used in this session
      const suggestions = await query<{ pattern_id: string }>(
        `SELECT pattern_id FROM pattern_suggestions
         WHERE session_id = $1 AND applied = TRUE`,
        [sessionId]
      );

      if (suggestions.rows.length === 0) {
        return;
      }

      // Update success rate for each pattern
      for (const { pattern_id } of suggestions.rows) {
        await query(
          `UPDATE learning_patterns
           SET
             success_rate = (
               (success_rate * usage_count + $1) /
               NULLIF(usage_count + 1, 0)
             )
           WHERE id = $2`,
          [success ? 1.0 : 0.0, pattern_id]
        );
      }

      logger.info('Updated pattern success rates', {
        sessionId,
        count: suggestions.rows.length,
        success,
      });
    } catch (error) {
      logger.error('Error updating pattern success', { error });
    }
  }

  /**
   * Get pattern analytics
   */
  async getPatternAnalytics(patternId?: string): Promise<any[]> {
    try {
      const sql = patternId
        ? 'SELECT * FROM pattern_analytics WHERE id = $1'
        : 'SELECT * FROM pattern_analytics ORDER BY usage_count DESC LIMIT 20';

      const params = patternId ? [patternId] : [];
      const result = await query(sql, params);

      return result.rows;
    } catch (error) {
      logger.error('Error getting pattern analytics', { error });
      return [];
    }
  }

  /**
   * Create similarity hash from pattern data
   */
  private createSimilarityHash(data: any): string {
    const crypto = require('crypto');
    const normalized = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }
}
