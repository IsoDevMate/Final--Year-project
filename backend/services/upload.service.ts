import * as admin from 'firebase-admin';
import * as serviceAccount from '../uploadtimes-2d6d3-firebase-adminsdk-8reyp-86b4c10c24.json';
import { AppError } from '../utils/errors.utils';
import { v4 as uuidv4 } from 'uuid';
import  config  from '../config/config';
const params = {
  type: serviceAccount.type,
  projectId: serviceAccount.project_id,
  privateKeyId: serviceAccount.private_key_id,
  privateKey: serviceAccount.private_key,
  clientEmail: serviceAccount.client_email,
  clientId: serviceAccount.client_id,
  authUri: serviceAccount.auth_uri,
  tokenUri: serviceAccount.token_uri,
  authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
  clientC509CertUrl: serviceAccount.client_x509_cert_url,
  universeDomain: serviceAccount.universe_domain,
};

admin.initializeApp({
  credential: admin.credential.cert(params as admin.ServiceAccount),
  storageBucket: config.storagebucketnameis,
});

export class StorageService {
  private bucket: any;
  private readonly bucketName: string = config.storagebucketnameis;

  constructor() {
    this.bucket = admin.storage().bucket(this.bucketName);
  }

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
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `uploads/${userId}/${fileType}s/${uniqueFileName}`;
      const fileBuffer = file;
      const fileRef = this.bucket.file(filePath);

      await fileRef.save(fileBuffer, {
        metadata: {
          contentType: this.getContentType(fileType, fileExtension || '')
        }
      });

      await fileRef.makePublic();
      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${filePath}`;
      const [metadata] = await fileRef.getMetadata();

      return {
        url: publicUrl,
        storageRef: filePath,
        fileName: fileName,
        fileSize: metadata.size ? parseInt(metadata.size.toString(), 10) : 0
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(`File upload failed: ${error.message}`, 500);
      }
      throw new AppError('File upload failed', 500);
    }
  }

  // Other methods remain the same
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

  private getContentType(fileType: string, extension: string): string {
    const types: Record<string, Record<string, string>> = {
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
    const fileTypeTypes = types[fileType];

    if (!fileTypeTypes) {
      return 'application/octet-stream';
    }

    return fileTypeTypes[lowerExt] || fileTypeTypes.default || 'application/octet-stream';
  }
}

export const storageService = new StorageService();
