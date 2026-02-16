import { createLogger } from '../utils/logger';
import { Pattern, SessionData } from './memory-manager';

const logger = createLogger('PatternMatcher');

/**
 * Pattern Matcher - Extracts and recognizes patterns from sessions
 */
export class PatternMatcher {
  /**
   * Extract patterns from session
   */
  async extractPatterns(session: SessionData): Promise<Pattern[]> {
    const patterns: Pattern[] = [];

    try {
      // Extract pattern if session was successful
      if (session.success && session.design) {
        const pattern: Pattern = {
          id: `pattern-${Date.now()}`,
          name: this.generatePatternName(session),
          requirements: session.requirements,
          designApproach: this.summarizeDesign(session.design),
          successRate: 1.0,
          usageCount: 1,
          lastUsed: new Date(),
        };

        patterns.push(pattern);

        logger.info('Pattern extracted', { patternId: pattern.id });
      }
    } catch (error) {
      logger.error('Failed to extract patterns', error as Error);
    }

    return patterns;
  }

  /**
   * Calculate similarity between requirements
   */
  calculateSimilarity(req1: any, req2: any): number {
    // Simple similarity calculation
    // In production, would use more sophisticated NLP techniques

    let score = 0;
    let total = 0;

    // Compare output types
    if (req1.output?.type && req2.output?.type) {
      total++;
      if (req1.output.type === req2.output.type) score++;
    }

    // Compare languages
    if (req1.output?.language && req2.output?.language) {
      total++;
      if (req1.output.language === req2.output.language) score++;
    }

    return total > 0 ? score / total : 0;
  }

  /**
   * Cluster similar patterns
   */
  async clusterPatterns(patterns: Pattern[]): Promise<Map<string, Pattern[]>> {
    const clusters = new Map<string, Pattern[]>();

    // Simple clustering by output type
    for (const pattern of patterns) {
      const key = pattern.requirements.output.type || 'unknown';

      if (!clusters.has(key)) {
        clusters.set(key, []);
      }

      clusters.get(key)!.push(pattern);
    }

    logger.info(`Clustered ${patterns.length} patterns into ${clusters.size} groups`);

    return clusters;
  }

  /**
   * Recommend best pattern for requirements
   */
  recommendPattern(requirements: any, patterns: Pattern[]): Pattern | null {
    if (patterns.length === 0) {
      return null;
    }

    // Score each pattern
    const scored = patterns.map(pattern => ({
      pattern,
      score: this.scorePattern(requirements, pattern),
    }));

    // Sort by score and return best
    scored.sort((a, b) => b.score - a.score);

    return scored[0].score > 0.5 ? scored[0].pattern : null;
  }

  /**
   * Score pattern match
   */
  private scorePattern(requirements: any, pattern: Pattern): number {
    let score = 0;

    // Similarity to requirements
    score += this.calculateSimilarity(requirements, pattern.requirements) * 0.5;

    // Success rate of pattern
    score += pattern.successRate * 0.3;

    // Recency (more recent = better)
    const daysSinceUse = (Date.now() - pattern.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 1 - daysSinceUse / 90) * 0.2;

    return score;
  }

  /**
   * Generate pattern name
   */
  private generatePatternName(session: SessionData): string {
    const type = session.requirements.output.type || 'agent';
    const language = session.requirements.output.language || 'ts';

    return `${type}-${language}-pattern`;
  }

  /**
   * Summarize design approach
   */
  private summarizeDesign(design: any): string {
    if (!design) return 'No design';

    const components = design.components?.length || 0;
    const techStack = design.techStack?.length || 0;

    return `${components} components, ${techStack} technologies`;
  }
}
