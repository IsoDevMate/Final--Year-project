// import * as admin from 'firebase-admin';
// import { AppError } from '../utils/errors.utils';
// import { v4 as uuidv4 } from 'uuid';
// import config from '../config/config';

// const firebaseConfig = JSON.parse(Buffer.from(process.env.FIREBASE_CONFIG!, 'base64').toString('utf-8'));

// if (!firebaseConfig) {
//   throw new AppError('Firebase configuration is missing', 500);
// }

// const serviceAccountConfig = firebaseConfig;

// if (!serviceAccountConfig) {
//   throw new AppError('Service account configuration is missing', 500);
// }

// const serviceAccounting = {
//   type: serviceAccountConfig.type,
//   project_id: serviceAccountConfig.project_id,
//   private_key_id: serviceAccountConfig.private_key_id,
//   private_key: serviceAccountConfig.private_key.replace(/\\n/g, '\n'),
//   client_email: serviceAccountConfig.client_email,
//   client_id: serviceAccountConfig.client_id,
//   auth_uri: serviceAccountConfig.auth_uri,
//   token_uri: serviceAccountConfig.token_uri,
//   auth_provider_x509_cert_url: serviceAccountConfig.auth_provider_x509_cert_url,
//   client_x509_cert_url: serviceAccountConfig.client_x509_cert_url,
//   universe_domain: serviceAccountConfig.universe_domain
// };

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccounting as admin.ServiceAccount),
//   storageBucket: config.storagebucketnameis,
// });

// export class StorageService {
//   private bucket: any;
//   private readonly bucketName: string = config.storagebucketnameis;

//   constructor() {
//     this.bucket = admin.storage().bucket(this.bucketName);
//   }

//   async uploadFile(
//     file: Buffer,
//     fileName: string,
//     userId: string,
//     fileType: 'image' | 'audio' | 'video' | 'document'
//   ): Promise<{
//     url: string;
//     storageRef: string;
//     fileName: string;
//     fileSize: number;
//   }> {
//     try {
//       const fileExtension = fileName.split('.').pop();
//       const uniqueFileName = `${uuidv4()}.${fileExtension}`;
//       const filePath = `uploads/${userId}/${fileType}s/${uniqueFileName}`;
//       const fileBuffer = file;
//       const fileRef = this.bucket.file(filePath);

//       await fileRef.save(fileBuffer, {
//         metadata: {
//           contentType: this.getContentType(fileType, fileExtension || '')
//         }
//       });

//       await fileRef.makePublic();
//       const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${filePath}`;
//       const [metadata] = await fileRef.getMetadata();

//       return {
//         url: publicUrl,
//         storageRef: filePath,
//         fileName: fileName,
//         fileSize: metadata.size ? parseInt(metadata.size.toString(), 10) : 0
//       };
//     } catch (error) {
//       if (error instanceof Error) {
//         throw new AppError(`File upload failed: ${error.message}`, 500);
//       }
//       throw new AppError('File upload failed', 500);
//     }
//   }

//   // Other methods remain the same
//   async deleteFile(storageRef: string): Promise<void> {
//     try {
//       const fileRef = this.bucket.file(storageRef);
//       await fileRef.delete();
//     } catch (error) {
//       if (error instanceof Error) {
//         throw new AppError(`File deletion failed: ${error.message}`, 500);
//       }
//       throw new AppError('File deletion failed', 500);
//     }
//   }

//   private getContentType(fileType: string, extension: string): string {
//     const types: Record<string, Record<string, string>> = {
//       image: {
//         jpg: 'image/jpeg',
//         jpeg: 'image/jpeg',
//         png: 'image/png',
//         gif: 'image/gif',
//         default: 'image/jpeg'
//       },
//       video: {
//         mp4: 'video/mp4',
//         mov: 'video/quicktime',
//         avi: 'video/x-msvideo',
//         default: 'video/mp4'
//       },
//       audio: {
//         mp3: 'audio/mpeg',
//         wav: 'audio/wav',
//         m4a: 'audio/mp4',
//         default: 'audio/mpeg'
//       },
//       document: {
//         pdf: 'application/pdf',
//         doc: 'application/msword',
//         docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//         txt: 'text/plain',
//         default: 'application/octet-stream'
//       }
//     };

//     const lowerExt = extension.toLowerCase();
//     const fileTypeTypes = types[fileType];

//     if (!fileTypeTypes) {
//       return 'application/octet-stream';
//     }

//     return fileTypeTypes[lowerExt] || fileTypeTypes.default || 'application/octet-stream';
//   }
// }

// export const storageService = new StorageService();

import * as admin from 'firebase-admin';
import { AppError } from '../utils/errors.utils';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/config';

// Improved Firebase configuration handling with proper types
let firebaseConfig: Record<string, any> | null = null;
let serviceAccounting: admin.ServiceAccount | null = null;

try {
  // Check if Firebase config exists before trying to parse it
  if (!process.env.FIREBASE_CONFIG) {
    console.error('FIREBASE_CONFIG environment variable is not set');
    throw new AppError('Firebase configuration is missing', 500);
  }

  // Parse the base64-encoded config
  firebaseConfig = JSON.parse(Buffer.from(process.env.FIREBASE_CONFIG, 'base64').toString('utf-8'));

  if (!firebaseConfig) {
    throw new AppError('Firebase configuration is invalid or empty', 500);
  }

  // Set up service account configuration
  serviceAccounting = {
    type: firebaseConfig.type,
    project_id: firebaseConfig.project_id,
    private_key_id: firebaseConfig.private_key_id,
    private_key: firebaseConfig.private_key.replace(/\\n/g, '\n'),
    client_email: firebaseConfig.client_email,
    client_id: firebaseConfig.client_id,
    auth_uri: firebaseConfig.auth_uri,
    token_uri: firebaseConfig.token_uri,
    auth_provider_x509_cert_url: firebaseConfig.auth_provider_x509_cert_url,
    client_x509_cert_url: firebaseConfig.client_x509_cert_url,
    universe_domain: firebaseConfig.universe_domain
  } as admin.ServiceAccount;

  // Initialize Firebase only if config is valid
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccounting),
    storageBucket: config.storagebucketnameis,
  });

  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  // We don't rethrow here to allow the service to be imported without crashing immediately
  // The individual methods will handle errors when called
}

export class StorageService {
  private bucket: any
  private readonly bucketName: string = config.storagebucketnameis;
  private isInitialized: boolean;

  constructor() {
    this.isInitialized = !!firebaseConfig;

    if (this.isInitialized) {
      try {
        this.bucket = admin.storage().bucket(this.bucketName);
        console.log(`Storage bucket initialized: ${this.bucketName}`);
      } catch (error) {
        console.error('Failed to initialize storage bucket:', error);
        this.isInitialized = false;
      }
    }
  }

  private checkInitialization(): void {
    if (!this.isInitialized || !this.bucket) {
      throw new AppError('Storage service is not properly initialized', 500);
    }
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
    this.checkInitialization();

    try {
      if (!file || !Buffer.isBuffer(file)) {
        throw new AppError('Invalid file data provided', 400);
      }

      if (!fileName) {
        throw new AppError('File name is required', 400);
      }

      const fileExtension = fileName.split('.').pop() || '';
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `uploads/${userId}/${fileType}s/${uniqueFileName}`;
      const fileRef = this.bucket!.file(filePath);

      await fileRef.save(file, {
        metadata: {
          contentType: this.getContentType(fileType, fileExtension)
        }
      });

      await fileRef.makePublic();
      const publicUrl = `https://storage.googleapis.com/${this.bucket!.name}/${filePath}`;

      let fileSize = 0;
      try {
        const [metadata] = await fileRef.getMetadata();
        fileSize = metadata.size ? parseInt(metadata.size.toString(), 10) : 0;
      } catch (metadataError) {
        console.error('Failed to get file metadata:', metadataError);
        // Continue without metadata as it's not critical
      }

      return {
        url: publicUrl,
        storageRef: filePath,
        fileName: fileName,
        fileSize: fileSize
      };
    } catch (error) {
      console.error('File upload error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new AppError(`File upload failed: ${error.message}`, 500);
      }
      throw new AppError('File upload failed', 500);
    }
  }

  async deleteFile(storageRef: string): Promise<void> {
    this.checkInitialization();

    try {
      if (!storageRef) {
        throw new AppError('Storage reference is required', 400);
      }

      const fileRef = this.bucket!.file(storageRef);
      await fileRef.delete();
    } catch (error) {
      console.error('File deletion error:', error);
      if (error instanceof AppError) {
        throw error;
      }
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
        webp: 'image/webp',
        svg: 'image/svg+xml',
        default: 'image/jpeg'
      },
      video: {
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        avi: 'video/x-msvideo',
        webm: 'video/webm',
        mkv: 'video/x-matroska',
        default: 'video/mp4'
      },
      audio: {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        m4a: 'audio/mp4',
        ogg: 'audio/ogg',
        aac: 'audio/aac',
        default: 'audio/mpeg'
      },
      document: {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        txt: 'text/plain',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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
