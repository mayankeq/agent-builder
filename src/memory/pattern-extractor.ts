import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createLogger } from '../utils/logger';
import { SessionData } from './session-storage';

const logger = createLogger('PatternExtractor');

export interface Pattern {
  domain: string;
  commonCapabilities: string[];
  successCriteria: string[];
  techStack: Array<{
    name: string;
    category: string;
    frequency: number;
  }>;
  avgDuration: number;
  avgTokenUsage: number;
  sampleSize: number;
  extractedAt: string;
}

/**
 * Pattern Extractor - Learns from successful sessions
 * Extracts common patterns by domain for future use
 */
export class PatternExtractor {
  private patternsDir: string;

  constructor(baseDir?: string) {
    this.patternsDir =
      baseDir || path.join(os.homedir(), '.synthient', 'patterns');

    // Ensure directory exists
    if (!fs.existsSync(this.patternsDir)) {
      fs.mkdirSync(this.patternsDir, { recursive: true });
      logger.info('Created patterns directory', { path: this.patternsDir });
    }
  }

  /**
   * Extract patterns from a set of sessions
   */
  async extractPatterns(sessions: SessionData[]): Promise<void> {
    try {
      // Group sessions by domain
      const sessionsByDomain = this.groupByDomain(sessions);

      // Extract patterns for each domain
      for (const [domain, domainSessions] of Object.entries(
        sessionsByDomain
      )) {
        if (domainSessions.length < 2) {
          // Need at least 2 sessions to extract patterns
          continue;
        }

        const pattern = this.extractDomainPattern(domain, domainSessions);
        await this.savePattern(pattern);

        logger.info('Pattern extracted', {
          domain,
          sampleSize: domainSessions.length,
        });
      }
    } catch (error) {
      logger.error('Failed to extract patterns', error as Error);
      throw error;
    }
  }

  /**
   * Extract pattern for a specific domain
   */
  private extractDomainPattern(
    domain: string,
    sessions: SessionData[]
  ): Pattern {
    // Extract common capabilities
    const capabilitiesMap = new Map<string, number>();
    sessions.forEach((session) => {
      session.research?.capabilities?.forEach((cap: string) => {
        capabilitiesMap.set(cap, (capabilitiesMap.get(cap) || 0) + 1);
      });
    });

    // Get capabilities that appear in >50% of sessions
    const threshold = sessions.length * 0.5;
    const commonCapabilities = Array.from(capabilitiesMap.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([cap, _]) => cap);

    // Extract common success criteria
    const criteriaMap = new Map<string, number>();
    sessions.forEach((session) => {
      session.research?.successCriteria?.forEach((sc: string) => {
        criteriaMap.set(sc, (criteriaMap.get(sc) || 0) + 1);
      });
    });

    const successCriteria = Array.from(criteriaMap.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([sc, _]) => sc);

    // Extract common tech stack
    const techStackMap = new Map<
      string,
      { name: string; category: string; count: number }
    >();
    sessions.forEach((session) => {
      session.design?.techStack?.forEach(
        (tech: { name: string; category: string }) => {
          const key = tech.name;
          if (techStackMap.has(key)) {
            techStackMap.get(key)!.count++;
          } else {
            techStackMap.set(key, {
              name: tech.name,
              category: tech.category,
              count: 1,
            });
          }
        }
      );
    });

    const techStack = Array.from(techStackMap.values())
      .map((tech) => ({
        name: tech.name,
        category: tech.category,
        frequency: tech.count / sessions.length,
      }))
      .sort((a, b) => b.frequency - a.frequency);

    // Calculate averages
    const totalDuration = sessions.reduce(
      (sum, s) => sum + (s.duration || 0),
      0
    );
    const totalTokens = sessions.reduce(
      (sum, s) => sum + (s.tokenUsage || 0),
      0
    );

    return {
      domain,
      commonCapabilities,
      successCriteria,
      techStack,
      avgDuration: totalDuration / sessions.length,
      avgTokenUsage: totalTokens / sessions.length,
      sampleSize: sessions.length,
      extractedAt: new Date().toISOString(),
    };
  }

  /**
   * Group sessions by domain
   */
  private groupByDomain(
    sessions: SessionData[]
  ): Record<string, SessionData[]> {
    const grouped: Record<string, SessionData[]> = {};

    sessions.forEach((session) => {
      const domain = session.domain || 'general';
      if (!grouped[domain]) {
        grouped[domain] = [];
      }
      grouped[domain].push(session);
    });

    return grouped;
  }

  /**
   * Save pattern to file
   */
  private async savePattern(pattern: Pattern): Promise<void> {
    try {
      const filename = `${pattern.domain}-pattern.json`;
      const filepath = path.join(this.patternsDir, filename);

      // Load existing pattern if it exists
      let existingPattern: Pattern | null = null;
      if (fs.existsSync(filepath)) {
        existingPattern = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
      }

      // Merge with existing pattern if available
      const mergedPattern = existingPattern
        ? this.mergePatterns(existingPattern, pattern)
        : pattern;

      fs.writeFileSync(filepath, JSON.stringify(mergedPattern, null, 2));

      logger.info('Pattern saved', { domain: pattern.domain, file: filepath });
    } catch (error) {
      logger.error('Failed to save pattern', error as Error);
      throw error;
    }
  }

  /**
   * Merge new pattern with existing pattern
   */
  private mergePatterns(existing: Pattern, newPattern: Pattern): Pattern {
    // Weighted average based on sample size
    const totalSamples = existing.sampleSize + newPattern.sampleSize;

    return {
      domain: existing.domain,
      commonCapabilities: this.mergeArrays(
        existing.commonCapabilities,
        newPattern.commonCapabilities
      ),
      successCriteria: this.mergeArrays(
        existing.successCriteria,
        newPattern.successCriteria
      ),
      techStack: this.mergeTechStack(existing.techStack, newPattern.techStack),
      avgDuration:
        (existing.avgDuration * existing.sampleSize +
          newPattern.avgDuration * newPattern.sampleSize) /
        totalSamples,
      avgTokenUsage:
        (existing.avgTokenUsage * existing.sampleSize +
          newPattern.avgTokenUsage * newPattern.sampleSize) /
        totalSamples,
      sampleSize: totalSamples,
      extractedAt: new Date().toISOString(),
    };
  }

  /**
   * Merge two arrays keeping unique items
   */
  private mergeArrays(arr1: string[], arr2: string[]): string[] {
    return Array.from(new Set([...arr1, ...arr2]));
  }

  /**
   * Merge tech stack arrays
   */
  private mergeTechStack(
    stack1: Pattern['techStack'],
    stack2: Pattern['techStack']
  ): Pattern['techStack'] {
    const merged = new Map<string, Pattern['techStack'][0]>();

    // Add stack1
    stack1.forEach((tech) => {
      merged.set(tech.name, tech);
    });

    // Merge stack2
    stack2.forEach((tech) => {
      if (merged.has(tech.name)) {
        const existing = merged.get(tech.name)!;
        merged.set(tech.name, {
          ...existing,
          frequency: (existing.frequency + tech.frequency) / 2,
        });
      } else {
        merged.set(tech.name, tech);
      }
    });

    return Array.from(merged.values()).sort(
      (a, b) => b.frequency - a.frequency
    );
  }

  /**
   * Load pattern for a domain
   */
  async loadPattern(domain: string): Promise<Pattern | null> {
    try {
      const filename = `${domain}-pattern.json`;
      const filepath = path.join(this.patternsDir, filename);

      if (!fs.existsSync(filepath)) {
        return null;
      }

      return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    } catch (error) {
      logger.error('Failed to load pattern', error as Error);
      return null;
    }
  }

  /**
   * List all available patterns
   */
  async listPatterns(): Promise<Pattern[]> {
    try {
      const files = fs.readdirSync(this.patternsDir);
      const patternFiles = files.filter((f) => f.endsWith('-pattern.json'));

      const patterns = [];
      for (const file of patternFiles) {
        const filepath = path.join(this.patternsDir, file);
        const pattern = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        patterns.push(pattern);
      }

      return patterns;
    } catch (error) {
      logger.error('Failed to list patterns', error as Error);
      return [];
    }
  }
}
