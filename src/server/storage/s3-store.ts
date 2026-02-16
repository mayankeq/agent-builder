import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { logger } from '../monitoring/logger';
import { s3OperationsTotal, s3OperationDuration } from '../monitoring/metrics';
import * as path from 'path';
import * as fs from 'fs/promises';
import archiver from 'archiver';

// S3 configuration
const S3_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.AWS_S3_BUCKET || 'agent-builder-artifacts',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  } : undefined,
};

// Create S3 client
const s3Client = new S3Client({
  region: S3_CONFIG.region,
  credentials: S3_CONFIG.credentials,
});

export class S3Store {
  private bucket: string;

  constructor(bucket?: string) {
    this.bucket = bucket || S3_CONFIG.bucket;
  }

  /**
   * Upload a file to S3
   */
  async uploadFile(
    key: string,
    content: Buffer | Readable | string,
    contentType?: string
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: content,
        ContentType: contentType || 'application/octet-stream',
        ServerSideEncryption: 'AES256',
      });

      await s3Client.send(command);

      const duration = (Date.now() - startTime) / 1000;
      logger.info('File uploaded to S3', { key, bucket: this.bucket, duration });

      s3OperationsTotal.inc({ operation: 'upload', status: 'success' });
      s3OperationDuration.observe({ operation: 'upload' }, duration);

      return key;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      logger.error('S3 upload failed', { error, key, bucket: this.bucket, duration });

      s3OperationsTotal.inc({ operation: 'upload', status: 'error' });
      s3OperationDuration.observe({ operation: 'upload' }, duration);

      throw new Error('Failed to upload file to S3');
    }
  }

  /**
   * Upload large file using multipart upload
   */
  async uploadLargeFile(
    key: string,
    content: Readable | Buffer,
    contentType?: string
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: content,
          ContentType: contentType || 'application/octet-stream',
          ServerSideEncryption: 'AES256',
        },
        queueSize: 4, // concurrent uploads
        partSize: 5 * 1024 * 1024, // 5 MB
      });

      await upload.done();

      const duration = (Date.now() - startTime) / 1000;
      logger.info('Large file uploaded to S3', { key, bucket: this.bucket, duration });

      s3OperationsTotal.inc({ operation: 'upload', status: 'success' });
      s3OperationDuration.observe({ operation: 'upload' }, duration);

      return key;
    } catch (error) {
      logger.error('S3 large file upload failed', { error, key });
      s3OperationsTotal.inc({ operation: 'upload', status: 'error' });
      throw new Error('Failed to upload large file to S3');
    }
  }

  /**
   * Upload directory as ZIP to S3
   */
  async uploadDirectory(sessionId: string, localPath: string): Promise<string> {
    const key = `sessions/${sessionId}/artifacts.zip`;
    const startTime = Date.now();

    try {
      // Create ZIP archive
      const archive = archiver('zip', { zlib: { level: 9 } });

      // Track archive errors
      archive.on('error', (err) => {
        throw err;
      });

      // Add directory to archive
      archive.directory(localPath, false);

      // Finalize archive
      archive.finalize();

      // Upload to S3
      await this.uploadLargeFile(key, archive as Readable, 'application/zip');

      const duration = (Date.now() - startTime) / 1000;
      logger.info('Directory uploaded to S3 as ZIP', {
        sessionId,
        localPath,
        key,
        duration,
      });

      return key;
    } catch (error) {
      logger.error('Failed to upload directory to S3', { error, sessionId, localPath });
      throw new Error('Failed to upload directory to S3');
    }
  }

  /**
   * Download file from S3
   */
  async downloadFile(key: string): Promise<Buffer> {
    const startTime = Date.now();

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await s3Client.send(command);
      const stream = response.Body as Readable;

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      const duration = (Date.now() - startTime) / 1000;
      logger.info('File downloaded from S3', { key, size: buffer.length, duration });

      s3OperationsTotal.inc({ operation: 'download', status: 'success' });
      s3OperationDuration.observe({ operation: 'download' }, duration);

      return buffer;
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      logger.error('S3 download failed', { error, key, duration });

      s3OperationsTotal.inc({ operation: 'download', status: 'error' });
      s3OperationDuration.observe({ operation: 'download' }, duration);

      throw new Error('Failed to download file from S3');
    }
  }

  /**
   * Get presigned URL for download
   */
  async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn });

      logger.debug('Generated presigned download URL', { key, expiresIn });
      return url;
    } catch (error) {
      logger.error('Failed to generate presigned URL', { error, key });
      throw new Error('Failed to generate download URL');
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await s3Client.send(command);

      logger.info('File deleted from S3', { key, bucket: this.bucket });
      s3OperationsTotal.inc({ operation: 'delete', status: 'success' });
    } catch (error) {
      logger.error('S3 delete failed', { error, key });
      s3OperationsTotal.inc({ operation: 'delete', status: 'error' });
      throw new Error('Failed to delete file from S3');
    }
  }

  /**
   * Check if file exists in S3
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      logger.error('Error checking S3 file existence', { error, key });
      throw error;
    }
  }

  /**
   * List files in a directory (prefix)
   */
  async listFiles(prefix: string): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      });

      const response = await s3Client.send(command);
      const keys = (response.Contents || []).map(obj => obj.Key!).filter(Boolean);

      logger.debug('Listed S3 files', { prefix, count: keys.length });
      return keys;
    } catch (error) {
      logger.error('Failed to list S3 files', { error, prefix });
      throw new Error('Failed to list files from S3');
    }
  }

  /**
   * Delete all files for a session (cleanup)
   */
  async deleteSession(sessionId: string): Promise<number> {
    const prefix = `sessions/${sessionId}/`;

    try {
      const keys = await this.listFiles(prefix);

      if (keys.length === 0) {
        logger.debug('No files to delete for session', { sessionId });
        return 0;
      }

      // Delete files one by one (could be optimized with batch delete)
      for (const key of keys) {
        await this.deleteFile(key);
      }

      logger.info('Session files deleted from S3', { sessionId, count: keys.length });
      return keys.length;
    } catch (error) {
      logger.error('Failed to delete session files', { error, sessionId });
      throw new Error('Failed to delete session files from S3');
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<{
    size: number;
    lastModified: Date;
    contentType: string;
  }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await s3Client.send(command);

      return {
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        contentType: response.ContentType || 'application/octet-stream',
      };
    } catch (error) {
      logger.error('Failed to get S3 file metadata', { error, key });
      throw new Error('Failed to get file metadata');
    }
  }
}

/**
 * Validate S3 configuration
 */
export function validateS3Config(): void {
  if (!S3_CONFIG.bucket) {
    throw new Error('AWS_S3_BUCKET environment variable must be set');
  }

  if (process.env.NODE_ENV === 'production') {
    if (!S3_CONFIG.credentials?.accessKeyId || !S3_CONFIG.credentials?.secretAccessKey) {
      logger.warn('AWS credentials not found, using IAM role or default credentials');
    }
  }

  logger.info('S3 configuration validated', {
    region: S3_CONFIG.region,
    bucket: S3_CONFIG.bucket,
    credentialsConfigured: !!S3_CONFIG.credentials,
  });
}
