import { createLogger } from '../utils/logger';
import { FileManager } from '../utils/file-manager';
import { Requirements } from '../types/workflow';
import { VectorStore, VectorDocument } from './vector-store';
import * as path from 'path';

const logger = createLogger('MemoryManager');

export interface SessionData {
  id: string;
  timestamp: Date;
  userRequest: string;
  requirements: Requirements;
  design?: any;
  implementation?: any;
  metrics: any;
  success: boolean;
}

export interface Pattern {
  id: string;
  name: string;
  requirements: Requirements;
  designApproach: string;
  successRate: number;
  usageCount: number;
  lastUsed: Date;
}

export interface LearningInsight {
  type: 'success' | 'failure' | 'optimization';
  description: string;
  context: any;
  timestamp: Date;
}

/**
 * Memory Manager - Handles learning storage and pattern recognition
 */
export class MemoryManager {
  private storageDir: string;
  private vectorStore: VectorStore;
  private useVectorSearch: boolean;

  constructor(storageDir?: string, useVectorSearch: boolean = true) {
    this.storageDir = storageDir || path.join(process.cwd(), 'data', 'memory');
    this.useVectorSearch = useVectorSearch;
    this.vectorStore = new VectorStore(this.storageDir, 'patterns');
    this.ensureDirectories();
    logger.info('Memory manager initialized', {
      storageDir: this.storageDir,
      vectorSearch: useVectorSearch
    });
  }

  /**
   * Initialize async resources (vector store)
   */
  async initialize(): Promise<void> {
    if (this.useVectorSearch) {
      try {
        await this.vectorStore.initialize();
        logger.info('Vector store initialized');
      } catch (error) {
        logger.warning('Failed to initialize vector store, falling back to basic search', {
          error: (error as Error).message
        });
        this.useVectorSearch = false;
      }
    }
  }

  /**
   * Capture session data for learning
   */
  async captureSession(session: SessionData): Promise<void> {
    try {
      const sessionFile = path.join(
        this.storageDir,
        'sessions',
        `${session.id}.jsonl`
      );

      // Append session event as JSONL
      await FileManager.appendJSONL(sessionFile, {
        event: 'session_complete',
        recordedAt: new Date().toISOString(),
        data: session,
      });

      logger.info('Session captured', { sessionId: session.id });
    } catch (error) {
      logger.error('Failed to capture session', error as Error);
    }
  }

  /**
   * Find similar patterns based on requirements
   */
  async findSimilarPatterns(requirements: Requirements): Promise<Pattern[]> {
    try {
      // Use vector search if available (much faster for large pattern sets)
      if (this.useVectorSearch) {
        return await this.findPatternsWithVectorSearch(requirements);
      }

      // Fallback to basic similarity calculation
      const allPatterns = await this.loadPatterns();

      // Calculate similarity for each pattern
      const scored = allPatterns.map(pattern => ({
        pattern,
        similarity: this.calculateSimilarity(requirements, pattern.requirements),
      }));

      // Filter and sort by similarity
      return scored
        .filter(p => p.similarity > 0.7)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
        .map(p => p.pattern);
    } catch (error) {
      logger.error('Failed to find similar patterns', error as Error);
      return [];
    }
  }

  /**
   * Find patterns using vector search (faster for large datasets)
   */
  private async findPatternsWithVectorSearch(requirements: Requirements): Promise<Pattern[]> {
    try {
      // Create search query from requirements
      const query = this.requirementsToText(requirements);

      // Perform vector search
      const results = await this.vectorStore.search(query, 5, 0.7);

      // Load full pattern details for matching IDs
      const patterns: Pattern[] = [];
      for (const result of results) {
        const pattern = await this.loadPattern(result.id);
        if (pattern) {
          patterns.push(pattern);
        }
      }

      logger.info('Vector search found patterns', { count: patterns.length });
      return patterns;
    } catch (error) {
      logger.error('Vector search failed, falling back to basic search', error as Error);
      this.useVectorSearch = false;
      return this.findSimilarPatterns(requirements);
    }
  }

  /**
   * Convert requirements to searchable text
   */
  private requirementsToText(requirements: Requirements): string {
    const parts = [
      ...(requirements.functional || []),
      JSON.stringify(requirements.technical || {}),
      JSON.stringify(requirements.architectural || {}),
      requirements.output?.type || '',
      requirements.output?.language || '',
    ];
    return parts.filter(Boolean).join(' ');
  }

  /**
   * Store extracted patterns
   */
  async storePattern(pattern: Pattern): Promise<void> {
    try {
      const patternFile = path.join(
        this.storageDir,
        'patterns',
        `${pattern.id}.json`
      );

      await FileManager.writeJSON(patternFile, pattern);

      // Also add to vector store for faster search
      if (this.useVectorSearch) {
        const text = this.requirementsToText(pattern.requirements);
        const doc: VectorDocument = {
          id: pattern.id,
          text: text,
          metadata: {
            name: pattern.name,
            outputType: pattern.requirements.output?.type || 'unknown',
            language: pattern.requirements.output?.language || 'unknown',
            successRate: pattern.successRate,
            usageCount: pattern.usageCount,
          },
        };

        await this.vectorStore.addDocuments([doc]);
      }

      logger.info('Pattern stored', { patternId: pattern.id });
    } catch (error) {
      logger.error('Failed to store pattern', error as Error);
    }
  }

  /**
   * Load a single pattern by ID
   */
  private async loadPattern(id: string): Promise<Pattern | null> {
    try {
      const patternFile = path.join(this.storageDir, 'patterns', `${id}.json`);
      if (await FileManager.exists(patternFile)) {
        return await FileManager.readJSON<Pattern>(patternFile);
      }
      return null;
    } catch (error) {
      logger.error('Failed to load pattern', error as Error);
      return null;
    }
  }

  /**
   * Record learning insight
   */
  async recordLearning(insight: LearningInsight): Promise<void> {
    try {
      const learningFile = path.join(
        this.storageDir,
        'metrics',
        'learnings.jsonl'
      );

      await FileManager.appendJSONL(learningFile, {
        ...insight,
        recordedAt: new Date().toISOString(),
      });

      logger.info('Learning recorded', { type: insight.type });
    } catch (error) {
      logger.error('Failed to record learning', error as Error);
    }
  }

  /**
   * Load all patterns
   */
  private async loadPatterns(): Promise<Pattern[]> {
    const patterns: Pattern[] = [];
    const patternsDir = path.join(this.storageDir, 'patterns');

    try {
      const files = await FileManager.listFiles(patternsDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(patternsDir, file);
          const pattern = await FileManager.readJSON<Pattern>(filePath);
          patterns.push(pattern);
        }
      }
    } catch (error) {
      logger.warning('No patterns found or failed to load');
    }

    return patterns;
  }

  /**
   * Calculate similarity between requirements (simple implementation)
   */
  private calculateSimilarity(req1: Requirements, req2: Requirements): number {
    let score = 0;
    let total = 0;

    // Compare output types
    total++;
    if (req1.output.type === req2.output.type) score++;

    // Compare languages
    total++;
    if (req1.output.language === req2.output.language) score++;

    // Compare functional requirements (keyword overlap)
    if (req1.functional.length > 0 && req2.functional.length > 0) {
      const overlap = this.calculateTextOverlap(
        req1.functional.join(' '),
        req2.functional.join(' ')
      );
      score += overlap;
      total++;
    }

    return total > 0 ? score / total : 0;
  }

  /**
   * Calculate text overlap (simple keyword matching)
   */
  private calculateTextOverlap(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));

    return intersection.size / Math.max(words1.size, words2.size);
  }

  /**
   * Ensure storage directories exist
   */
  private ensureDirectories(): void {
    const dirs = [
      path.join(this.storageDir, 'sessions'),
      path.join(this.storageDir, 'patterns'),
      path.join(this.storageDir, 'metrics'),
    ];

    for (const dir of dirs) {
      FileManager.ensureDir(dir).catch(error => {
        logger.error(`Failed to create directory: ${dir}`, error);
      });
    }
  }
}
