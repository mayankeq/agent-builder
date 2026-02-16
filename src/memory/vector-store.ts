import { createLogger } from '../utils/logger';
import { FileManager } from '../utils/file-manager';
import * as path from 'path';
import * as lancedb from '@lancedb/lancedb';

const logger = createLogger('VectorStore');

export interface VectorDocument {
  id: string;
  text: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface SearchResult {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, any>;
}

/**
 * Vector Store - Manages embeddings for fast similarity search
 * Uses LanceDB for local vector storage without external dependencies
 */
export class VectorStore {
  private dbPath: string;
  private db: any;
  private table: any;
  private tableName: string;

  constructor(storagePath: string, tableName: string = 'patterns') {
    this.dbPath = path.join(storagePath, 'vectors');
    this.tableName = tableName;
  }

  /**
   * Initialize the vector store
   */
  async initialize(): Promise<void> {
    try {
      await FileManager.ensureDir(this.dbPath);

      // Connect to LanceDB (local, serverless vector database)
      this.db = await lancedb.connect(this.dbPath);

      // Try to open existing table or create new one
      try {
        this.table = await this.db.openTable(this.tableName);
        logger.info('Opened existing vector table', { tableName: this.tableName });
      } catch (error) {
        // Table doesn't exist, will be created on first insert
        logger.info('Vector table will be created on first insert', {
          tableName: this.tableName
        });
      }
    } catch (error) {
      logger.error('Failed to initialize vector store', error as Error);
      throw error;
    }
  }

  /**
   * Generate embeddings using a simple TF-IDF-like approach
   * For production, consider using OpenAI embeddings or Anthropic embeddings
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Simple embedding: bag-of-words with normalized term frequencies
    // This is a basic implementation - for better results, use:
    // - OpenAI ada-002 embeddings
    // - Anthropic embeddings (when available)
    // - Sentence transformers (via Python integration)

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    // Create a fixed-size vocabulary from common technical terms
    const vocab = this.getVocabulary();
    const embedding = new Array(vocab.length).fill(0);

    // Count term frequencies
    for (const word of words) {
      const index = vocab.indexOf(word);
      if (index !== -1) {
        embedding[index]++;
      }
    }

    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  /**
   * Get fixed vocabulary for embeddings
   * In production, use a more sophisticated approach
   */
  private getVocabulary(): string[] {
    return [
      // Common agent terms
      'agent', 'task', 'workflow', 'process', 'execute', 'handle', 'manage',
      'coordinator', 'orchestrator', 'pipeline', 'phase', 'step',

      // Programming terms
      'function', 'class', 'interface', 'type', 'method', 'api', 'endpoint',
      'service', 'client', 'server', 'database', 'query', 'request', 'response',

      // Architecture terms
      'architecture', 'design', 'pattern', 'component', 'module', 'system',
      'microservice', 'monolith', 'distributed', 'concurrent', 'async',

      // Data terms
      'data', 'storage', 'cache', 'memory', 'file', 'json', 'yaml',
      'parse', 'serialize', 'transform', 'validate', 'format',

      // Quality terms
      'test', 'validation', 'error', 'exception', 'logging', 'monitoring',
      'performance', 'optimization', 'quality', 'security', 'reliability',

      // Output formats
      'skill', 'mcp', 'cli', 'library', 'package', 'npm', 'pip',
      'typescript', 'python', 'javascript', 'code', 'template',

      // Operations
      'create', 'read', 'update', 'delete', 'list', 'search', 'filter',
      'sort', 'group', 'aggregate', 'join', 'merge', 'split',

      // Misc
      'user', 'config', 'settings', 'options', 'parameter', 'argument',
      'documentation', 'example', 'tutorial', 'guide', 'reference'
    ];
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(documents: VectorDocument[]): Promise<void> {
    if (documents.length === 0) {
      return;
    }

    try {
      // Generate embeddings for all documents
      const docsWithEmbeddings = await Promise.all(
        documents.map(async (doc) => ({
          id: doc.id,
          text: doc.text,
          vector: await this.generateEmbedding(doc.text),
          metadata: JSON.stringify(doc.metadata),
        }))
      );

      // Create or append to table
      if (!this.table) {
        this.table = await this.db.createTable(
          this.tableName,
          docsWithEmbeddings
        );
        logger.info('Created vector table', {
          tableName: this.tableName,
          documentCount: documents.length
        });
      } else {
        await this.table.add(docsWithEmbeddings);
        logger.info('Added documents to vector table', {
          documentCount: documents.length
        });
      }
    } catch (error) {
      logger.error('Failed to add documents to vector store', error as Error);
      throw error;
    }
  }

  /**
   * Search for similar documents
   */
  async search(
    query: string,
    limit: number = 5,
    threshold: number = 0.7
  ): Promise<SearchResult[]> {
    if (!this.table) {
      logger.warning('Vector table not initialized, returning empty results');
      return [];
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Perform vector search
      const results = await this.table
        .search(queryEmbedding)
        .limit(limit)
        .execute();

      // Parse and filter results
      const searchResults: SearchResult[] = results
        .map((result: any) => ({
          id: result.id,
          score: result._distance ? 1 - result._distance : 0, // Convert distance to similarity
          text: result.text,
          metadata: JSON.parse(result.metadata || '{}'),
        }))
        .filter((result: SearchResult) => result.score >= threshold);

      logger.info('Vector search completed', {
        query: query.substring(0, 50),
        resultCount: searchResults.length
      });

      return searchResults;
    } catch (error) {
      logger.error('Vector search failed', error as Error);
      return [];
    }
  }

  /**
   * Delete documents by ID
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    if (!this.table || ids.length === 0) {
      return;
    }

    try {
      await this.table.delete(`id IN (${ids.map(id => `'${id}'`).join(',')})`);
      logger.info('Deleted documents from vector store', { count: ids.length });
    } catch (error) {
      logger.error('Failed to delete documents', error as Error);
      throw error;
    }
  }

  /**
   * Get statistics about the vector store
   */
  async getStats(): Promise<{ count: number }> {
    if (!this.table) {
      return { count: 0 };
    }

    try {
      const count = await this.table.countRows();
      return { count };
    } catch (error) {
      logger.error('Failed to get vector store stats', error as Error);
      return { count: 0 };
    }
  }

  /**
   * Close the vector store
   */
  async close(): Promise<void> {
    // LanceDB doesn't require explicit closing
    logger.info('Vector store closed');
  }
}

/**
 * Integration helper for better embeddings using Claude
 */
export class ClaudeEmbeddingGenerator {
  /**
   * Generate embeddings using Claude API
   * Note: This is a placeholder - Anthropic doesn't have a direct embeddings API yet
   * Consider using OpenAI ada-002 for production
   */
  static async generateEmbedding(_text: string): Promise<number[]> {
    // TODO: Implement when Anthropic releases embeddings API
    // For now, return empty array to signal fallback to simple embeddings
    return [];
  }

  /**
   * Batch generate embeddings
   */
  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.generateEmbedding(text)));
  }
}
