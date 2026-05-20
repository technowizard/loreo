import { Buffer } from 'node:buffer';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { fetchWithValidatedRedirects, rotatedUserAgent } from '@/lib/api-client.js';
import { env } from '@/lib/env-config.js';
import { generateId } from '@/lib/generate-id.js';
import { logger } from '@/lib/logger.js';
import { isValidUrl } from '@/lib/url-validator.js';

type FileType = 'uploads' | 'articles' | 'avatars';
type ImageType = 'uploads' | 'articles' | 'avatars';

interface UploadResult {
  key: string;
  publicUrl?: string;
  url: string;
}

interface IStorageService {
  uploadFile: (
    buffer: Buffer,
    originalName: string,
    userId?: string,
    fileType?: FileType
  ) => Promise<UploadResult>;

  uploadImage: (
    buffer: Buffer,
    originalName: string,
    userId?: string,
    imageType?: ImageType
  ) => Promise<UploadResult>;

  uploadImageFromUrl: (
    imageUrl: string,
    metadata?: Record<string, string>
  ) => Promise<UploadResult | null>;

  deleteFile: (key: string) => Promise<void>;

  getSignedUrl: (key: string, expiresIn?: number) => Promise<string>;

  getPublicUrl: (key: string) => string | undefined;

  getImageUrl: (key: string) => Promise<string>;

  getUserImageUrl: (key: string) => Promise<string>;

  fileExists: (key: string) => Promise<boolean>;

  getFileBuffer: (key: string) => Promise<Buffer>;

  getContentType: (extension: string) => string;

  isUserFile: (key: string, userId: string) => boolean;

  isSharedFile: (key: string) => boolean;

  extractUserIdFromKey: (key: string) => string | null;
}

// Shared utilities used by both adapters
const sharedUtils = {
  getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.slice(Math.max(0, lastDot)) : '';
  },

  getContentType(extension: string): string {
    const contentTypes: Record<string, string> = {
      '.gif': 'image/gif',
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpeg',
      '.json': 'application/json',
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.txt': 'text/plain',
      '.webp': 'image/webp'
    };
    return contentTypes[extension.toLowerCase()] ?? 'application/octet-stream';
  },

  isImageFile(extension: string): boolean {
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(extension.toLowerCase());
  },

  extractFilenameFromUrl(url: string): string | null {
    try {
      const filename = new URL(url).pathname.split('/').pop();
      return filename?.includes('.') ? filename : null;
    } catch {
      return null;
    }
  },

  isUserFile(key: string, userId: string): boolean {
    return this.isSafeStorageKey(key) && key.startsWith(`user-${userId}/`);
  },

  isSharedFile(key: string): boolean {
    return this.isSafeStorageKey(key) && key.startsWith('shared/');
  },

  isSafeStorageKey(key: string): boolean {
    if (!key || key.includes('\\')) return false;
    if (path.isAbsolute(key) || path.win32.isAbsolute(key)) return false;

    const parts = key.split('/');
    return parts.every((part) => part && part !== '.' && part !== '..');
  },

  extractUserIdFromKey(key: string): string | null {
    const match = key.match(/^user-([^/]+)\//);
    return match ? (match[1] as string) : null;
  },

  generateTypedKey(extension: string, userId: string, fileType: FileType): string {
    const date = new Date().toISOString().split('T')[0];
    const id = generateId('short');

    switch (fileType) {
      case 'avatars':
        return `user-${userId}/avatars/current${extension}`;
      case 'articles':
        return `user-${userId}/articles/${date}/${id}${extension}`;
      default:
        return `user-${userId}/uploads/${date}/${id}${extension}`;
    }
  },

  generateKey(extension: string, userId?: string, fileType: string = 'uploads'): string {
    const date = new Date().toISOString().split('T')[0];
    const id = generateId('short');

    return userId
      ? `user-${userId}/${fileType}/${date}/${id}${extension}`
      : `shared/${fileType}/${date}/${id}${extension}`;
  }
};

// Local filesystem adapter — works for both 'local' and 'local-docker' modes
class LocalStorageAdapter implements IStorageService {
  private storagePath: string;
  private publicUrl: string;

  constructor(storagePath: string, publicUrl: string) {
    this.storagePath = storagePath;
    this.publicUrl = publicUrl;
    fs.mkdir(this.storagePath, { recursive: true }).catch((error) =>
      logger.error(`Failed to initialize local storage: ${error}`)
    );
  }

  private filePath(key: string): string {
    if (!sharedUtils.isSafeStorageKey(key)) {
      throw new Error('Invalid storage key');
    }

    const storageRoot = path.resolve(this.storagePath);
    const resolvedPath = path.resolve(storageRoot, key);
    const relativePath = path.relative(storageRoot, resolvedPath);

    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error('Invalid storage key');
    }

    return resolvedPath;
  }

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    userId?: string,
    fileType: FileType = 'uploads'
  ): Promise<UploadResult> {
    const ext = sharedUtils.getFileExtension(originalName);
    const key = userId
      ? sharedUtils.generateTypedKey(ext, userId, fileType)
      : sharedUtils.generateKey(ext, userId, fileType);

    const filePath = this.filePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);

    logger.info(`File uploaded to local storage: ${key}`);
    return { key, url: `${this.publicUrl}/files/${key}` };
  }

  async uploadImage(
    buffer: Buffer,
    originalName: string,
    userId?: string,
    imageType: ImageType = 'uploads'
  ): Promise<UploadResult> {
    const ext = sharedUtils.getFileExtension(originalName);
    if (!sharedUtils.isImageFile(ext)) {
      throw new Error('File is not a supported image format');
    }
    return this.uploadFile(buffer, originalName, userId, imageType);
  }

  async uploadImageFromUrl(
    imageUrl: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult | null> {
    if (!(await isValidUrl(imageUrl))) {
      logger.warn(`Rejected image URL: ${imageUrl}`);
      return null;
    }

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        logger.info(`Downloading image from URL: ${imageUrl} (attempt ${attempt})`);

        const response = await fetchWithValidatedRedirects(imageUrl, {
          headers: { 'User-Agent': rotatedUserAgent },
          timeoutMs: 5000
        });

        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.startsWith('image/')) {
          throw new Error(`URL does not point to an image. Content-Type: ${contentType}`);
        }

        const contentLength = response.headers.get('content-length');
        const maxSize = 10 * 1024 * 1024;
        if (contentLength && Number.parseInt(contentLength, 10) > maxSize) {
          throw new Error('Image is too large (max 10MB)');
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length > maxSize) {
          throw new Error('Downloaded image is too large (max 10MB)');
        }

        const originalName = sharedUtils.extractFilenameFromUrl(imageUrl) ?? 'image.jpg';
        logger.info(`Downloaded ${buffer.length} bytes from ${imageUrl}`);

        return this.uploadImage(buffer, originalName, metadata?.userId, 'articles');
      } catch (error) {
        const isRetryable =
          error instanceof Error &&
          (['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'].some((c) =>
            (error as Error).message.includes(c)
          ) ||
            (error as Error).message.includes('Failed to download image: 5'));

        if (!isRetryable || attempt === 2) {
          logger.error(
            `Error downloading/uploading image from URL ${imageUrl}: ${(error as Error).message}`
          );
          return null;
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return null;
  }

  async deleteFile(key: string): Promise<void> {
    await fs.unlink(this.filePath(key));
    logger.info(`File deleted: ${key}`);
  }

  async getSignedUrl(key: string): Promise<string> {
    return `${this.publicUrl}/files/${key}`;
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/files/${key}`;
  }

  async getImageUrl(key: string): Promise<string> {
    return `${this.publicUrl}/files/${key}`;
  }

  async getUserImageUrl(key: string): Promise<string> {
    return `${this.publicUrl}/files/${key}`;
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await fs.access(this.filePath(key));
      return true;
    } catch {
      return false;
    }
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    return fs.readFile(this.filePath(key));
  }

  getContentType(extension: string): string {
    return sharedUtils.getContentType(extension);
  }

  isUserFile(key: string, userId: string): boolean {
    return sharedUtils.isUserFile(key, userId);
  }

  isSharedFile(key: string): boolean {
    return sharedUtils.isSharedFile(key);
  }

  extractUserIdFromKey(key: string): string | null {
    return sharedUtils.extractUserIdFromKey(key);
  }
}

// S3-compatible adapter — works with AWS S3, Cloudflare R2, MinIO, and any S3-compatible backend.
// Set S3_ENDPOINT for non-AWS targets (R2, MinIO). Omit for standard AWS S3.
class S3StorageAdapter implements IStorageService {
  private client: S3Client;
  private bucketName: string;
  private publicUrl: string | undefined;

  constructor() {
    const accessKeyId = env.S3_ACCESS_KEY_ID;
    const secretAccessKey = env.S3_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('Missing S3 credentials. Set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.');
    }

    this.bucketName = env.S3_BUCKET_NAME || 'storage';
    this.publicUrl = env.S3_PUBLIC_URL || undefined;

    this.client = new S3Client({
      credentials: { accessKeyId, secretAccessKey },
      region: env.S3_REGION || 'auto',
      // Omit endpoint for AWS S3 — the SDK resolves regional endpoints automatically
      ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT } : {})
    });
  }

  private generateKey(extension: string, userId?: string, fileType: FileType = 'uploads'): string {
    return sharedUtils.generateTypedKey(
      extension,
      userId ?? 'shared',
      userId ? fileType : 'uploads'
    );
  }

  private async putObject(key: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType
      })
    );

    const url = this.publicUrl ? `${this.publicUrl}/${key}` : await this.getSignedUrl(key);

    return { key, url, publicUrl: this.publicUrl ? url : undefined };
  }

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    userId?: string,
    fileType: FileType = 'uploads'
  ): Promise<UploadResult> {
    const ext = sharedUtils.getFileExtension(originalName);
    const key = this.generateKey(ext, userId, fileType);
    const contentType = sharedUtils.getContentType(ext);
    return this.putObject(key, buffer, contentType);
  }

  async uploadImage(
    buffer: Buffer,
    originalName: string,
    userId?: string,
    imageType: ImageType = 'uploads'
  ): Promise<UploadResult> {
    const ext = sharedUtils.getFileExtension(originalName);
    if (!sharedUtils.isImageFile(ext)) {
      throw new Error('File is not a supported image format');
    }
    return this.uploadFile(buffer, originalName, userId, imageType);
  }

  async uploadImageFromUrl(
    imageUrl: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult | null> {
    try {
      if (!(await isValidUrl(imageUrl))) {
        logger.warn(`Rejected image URL: ${imageUrl}`);
        return null;
      }

      const response = await fetchWithValidatedRedirects(imageUrl, {
        headers: { 'User-Agent': rotatedUserAgent },
        timeoutMs: 5000
      });

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const originalName = sharedUtils.extractFilenameFromUrl(imageUrl) ?? 'image.jpg';

      return this.uploadImage(buffer, originalName, metadata?.userId, 'articles');
    } catch (error) {
      logger.error(`S3 uploadImageFromUrl failed for ${imageUrl}: ${(error as Error).message}`);
      return null;
    }
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }));
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucketName, Key: key }), {
      expiresIn
    });
  }

  getPublicUrl(key: string): string | undefined {
    return this.publicUrl ? `${this.publicUrl}/${key}` : undefined;
  }

  async getImageUrl(key: string): Promise<string> {
    return this.publicUrl ? `${this.publicUrl}/${key}` : this.getSignedUrl(key);
  }

  async getUserImageUrl(key: string): Promise<string> {
    return this.getImageUrl(key);
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucketName, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucketName, Key: key })
    );
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) {
      throw new Error(`Empty response body for key: ${key}`);
    }
    return Buffer.from(bytes);
  }

  getContentType(extension: string): string {
    return sharedUtils.getContentType(extension);
  }

  isUserFile(key: string, userId: string): boolean {
    return sharedUtils.isUserFile(key, userId);
  }

  isSharedFile(key: string): boolean {
    return sharedUtils.isSharedFile(key);
  }

  extractUserIdFromKey(key: string): string | null {
    return sharedUtils.extractUserIdFromKey(key);
  }
}

// Selects the right adapter based on STORAGE_PROVIDER env var
class StorageService implements IStorageService {
  private provider: IStorageService;

  constructor() {
    const storageProvider = env.STORAGE_PROVIDER;

    switch (storageProvider) {
      case 's3':
        logger.info('Storage provider: S3-compatible');
        this.provider = new S3StorageAdapter();
        break;

      case 'local-docker':
        logger.info('Storage provider: local (Docker volume)');
        this.provider = new LocalStorageAdapter(
          env.STORAGE_PATH || './data/storage',
          env.PUBLIC_URL || `http://localhost:${env.PORT}`
        );
        break;

      default:
        // 'local' — project-relative directory, works without any external dependencies
        logger.info('Storage provider: local (project directory)');
        this.provider = new LocalStorageAdapter(
          path.resolve(process.cwd(), 'data/storage'),
          env.PUBLIC_URL || `http://localhost:${env.PORT}`
        );
    }
  }

  uploadFile(buffer: Buffer, originalName: string, userId?: string, fileType?: FileType) {
    return this.provider.uploadFile(buffer, originalName, userId, fileType);
  }

  uploadImage(buffer: Buffer, originalName: string, userId?: string, imageType?: ImageType) {
    return this.provider.uploadImage(buffer, originalName, userId, imageType);
  }

  uploadImageFromUrl(imageUrl: string, metadata?: Record<string, string>) {
    return this.provider.uploadImageFromUrl(imageUrl, metadata);
  }

  deleteFile(key: string) {
    return this.provider.deleteFile(key);
  }

  getSignedUrl(key: string, expiresIn?: number) {
    return this.provider.getSignedUrl(key, expiresIn);
  }

  getPublicUrl(key: string) {
    return this.provider.getPublicUrl(key);
  }

  getImageUrl(key: string) {
    return this.provider.getImageUrl(key);
  }

  getUserImageUrl(key: string) {
    return this.provider.getUserImageUrl(key);
  }

  fileExists(key: string) {
    return this.provider.fileExists(key);
  }

  getFileBuffer(key: string) {
    return this.provider.getFileBuffer(key);
  }

  getContentType(extension: string) {
    return this.provider.getContentType(extension);
  }

  isUserFile(key: string, userId: string) {
    return this.provider.isUserFile(key, userId);
  }

  isSharedFile(key: string) {
    return this.provider.isSharedFile(key);
  }

  extractUserIdFromKey(key: string) {
    return this.provider.extractUserIdFromKey(key);
  }
}

export type { FileType, ImageType, IStorageService, UploadResult };

export const storageService = new StorageService();
