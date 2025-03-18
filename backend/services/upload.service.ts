import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/errors.utils';

export class StorageService {
  private bucket: admin.storage.Bucket;

  constructor() {
    this.bucket = admin.storage().bucket();
  }

  /**
   * Upload a file to Firebase Storage
   * @param file - The file buffer
   * @param fileName - Original filename
   * @param userId - User ID for path construction
   * @param fileType - Type of file (image, video, audio, document)
   */
  async uploadFile(
    file: Buffer,
    fileName: string,
    userId: string,
    fileType: 'image' | 'audio' | 'video' | 'document'
  ): Promise<{
    url: string;
    storageRef: string;
    fileName: string;
    fileSize: number;
  }> {
    try {
      // Generate a unique filename
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;

      // Create a proper path in storage
      const filePath = `uploads/${userId}/${fileType}s/${uniqueFileName}`;
      const fileBuffer = file;

      // Create a file reference
      const fileRef = this.bucket.file(filePath);

      // Upload the file
      await fileRef.save(fileBuffer, {
        metadata: {
          contentType: this.getContentType(fileType, fileExtension || '')
        }
      });

      // Make the file publicly accessible
      await fileRef.makePublic();

      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${filePath}`;

      const [metadata] = await fileRef.getMetadata();

      return {
        url: publicUrl,
        storageRef: filePath,
        fileName: fileName,
        fileSize: parseInt(metadata.size, 10)
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(`File upload failed: ${error.message}`, 500);
      }
      throw new AppError('File upload failed', 500);
    }
  }

  /**
   * Delete a file from Firebase Storage
   * @param storageRef - The storage reference path
   */
  async deleteFile(storageRef: string): Promise<void> {
    try {
      const fileRef = this.bucket.file(storageRef);
      await fileRef.delete();
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(`File deletion failed: ${error.message}`, 500);
      }
      throw new AppError('File deletion failed', 500);
    }
  }

  /**
   * Determine content type based on file type and extension
   */
  private getContentType(fileType: string, extension: string): string {
    const types = {
      image: {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        default: 'image/jpeg'
      },
      video: {
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        avi: 'video/x-msvideo',
        default: 'video/mp4'
      },
      audio: {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        m4a: 'audio/mp4',
        default: 'audio/mpeg'
      },
      document: {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        txt: 'text/plain',
        default: 'application/octet-stream'
      }
    };

    const lowerExt = extension.toLowerCase();
    return types[fileType as keyof typeof types]?.[lowerExt as keyof typeof types[keyof typeof types]] ||
           types[fileType as keyof typeof types]?.default ||
           'application/octet-stream';
  }
}

export const storageService = new StorageService();
