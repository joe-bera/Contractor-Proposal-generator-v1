import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'contractor-proposals';

export interface UploadResult {
  url: string;
  key: string;
  filename: string;
}

class StorageService {
  /**
   * Generate a presigned URL for uploading a file
   */
  async getPresignedUploadUrl(
    filename: string,
    contentType: string,
    folder: string = 'uploads'
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const ext = filename.split('.').pop() || '';
    const key = `${folder}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-west-2'}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  /**
   * Upload a file directly (from buffer)
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    contentType: string,
    folder: string = 'uploads'
  ): Promise<UploadResult> {
    const ext = filename.split('.').pop() || '';
    const key = `${folder}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-west-2'}.amazonaws.com/${key}`;

    return { url, key, filename };
  }

  /**
   * Get a presigned URL for downloading/viewing a file
   */
  async getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Delete a file
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  }

  /**
   * Get the public URL for a file
   */
  getPublicUrl(key: string): string {
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-west-2'}.amazonaws.com/${key}`;
  }

  /**
   * Extract key from full S3 URL
   */
  extractKeyFromUrl(url: string): string | null {
    const match = url.match(/amazonaws\.com\/(.+)$/);
    return match ? match[1] : null;
  }
}

export const storageService = new StorageService();
