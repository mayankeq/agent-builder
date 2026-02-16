import * as fs from 'fs/promises';
import * as path from 'path';
import { createLogger } from './logger';

const logger = createLogger('FileManager');

export class FileManager {
  /**
   * Read file contents
   */
  static async readFile(filePath: string): Promise<string> {
    try {
      logger.debug(`Reading file: ${filePath}`);
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      logger.error(`Failed to read file: ${filePath}`, error as Error);
      throw error;
    }
  }

  /**
   * Write file contents
   */
  static async writeFile(filePath: string, content: string): Promise<void> {
    try {
      logger.debug(`Writing file: ${filePath}`);
      await fs.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      logger.error(`Failed to write file: ${filePath}`, error as Error);
      throw error;
    }
  }

  /**
   * Append to file (for JSONL streaming)
   */
  static async appendFile(filePath: string, content: string): Promise<void> {
    try {
      logger.debug(`Appending to file: ${filePath}`);
      await fs.appendFile(filePath, content, 'utf-8');
    } catch (error) {
      logger.error(`Failed to append to file: ${filePath}`, error as Error);
      throw error;
    }
  }

  /**
   * Create directory recursively
   */
  static async mkdir(dirPath: string): Promise<void> {
    try {
      logger.debug(`Creating directory: ${dirPath}`);
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create directory: ${dirPath}`, error as Error);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  static async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List files in directory
   */
  static async listFiles(dirPath: string): Promise<string[]> {
    try {
      logger.debug(`Listing files in: ${dirPath}`);
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name);
    } catch (error) {
      logger.error(`Failed to list files in: ${dirPath}`, error as Error);
      throw error;
    }
  }

  /**
   * Copy file
   */
  static async copyFile(source: string, destination: string): Promise<void> {
    try {
      logger.debug(`Copying file: ${source} -> ${destination}`);
      await fs.copyFile(source, destination);
    } catch (error) {
      logger.error(`Failed to copy file: ${source}`, error as Error);
      throw error;
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      logger.debug(`Deleting file: ${filePath}`);
      await fs.unlink(filePath);
    } catch (error) {
      logger.error(`Failed to delete file: ${filePath}`, error as Error);
      throw error;
    }
  }

  /**
   * Read JSON file
   */
  static async readJSON<T>(filePath: string): Promise<T> {
    const content = await this.readFile(filePath);
    return JSON.parse(content);
  }

  /**
   * Write JSON file
   */
  static async writeJSON(
    filePath: string,
    data: any,
    pretty: boolean = true
  ): Promise<void> {
    const content = pretty
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data);
    await this.writeFile(filePath, content);
  }

  /**
   * Append JSONL entry
   */
  static async appendJSONL(filePath: string, data: any): Promise<void> {
    const line = JSON.stringify(data) + '\n';
    await this.appendFile(filePath, line);
  }

  /**
   * Read all JSONL entries
   */
  static async readJSONL<T>(filePath: string): Promise<T[]> {
    const content = await this.readFile(filePath);
    return content
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line));
  }

  /**
   * Ensure directory exists
   */
  static async ensureDir(dirPath: string): Promise<void> {
    if (!(await this.exists(dirPath))) {
      await this.mkdir(dirPath);
    }
  }

  /**
   * Get file size in bytes
   */
  static async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      logger.error(`Failed to get file size: ${filePath}`, error as Error);
      throw error;
    }
  }

  /**
   * Resolve path relative to project root
   */
  static resolveProjectPath(...paths: string[]): string {
    return path.join(process.cwd(), ...paths);
  }
}
