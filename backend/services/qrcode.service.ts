import * as QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { AppError } from '../utils/errors.utils';
import { StorageService } from './upload.service';
export class QRCodeService {

  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  /**
   * Generate a JWT token with event and user information
   */
  generateTokenForEventAttendee(eventId: string, userId: string): string {
    try {
      // Create payload with limited but necessary info
      const payload = {
        eventId,
        user: {
          id: userId,
         //...othere user properties
        },
        type: 'event-registration',
        createdAt: new Date().toISOString(),
      };

      // Sign with QR code specific secret from config
      return jwt.sign(payload, config.jwt.qrCodeSecret as string, {
        expiresIn: config.jwt.accessTokenExpiration as number
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(`Error generating QR token: ${error.message}`, 500);
      }
      throw new AppError('Error generating QR token', 500);
    }
  }

  /**
   * Generate QR code as data URL from a token
   */
  async generateQRCode(token: string): Promise<string> {
    try {
      // Try Firebase Storage first; fall back to base64 data URL if unavailable
      try {
        const qrCodeBuffer = await QRCode.toBuffer(token);
        const fileName = `qrcode-${Date.now()}.png`;
        const uploadResult = await this.storageService.uploadFile(
          qrCodeBuffer,
          fileName,
          'system',
          'image'
        );
        return uploadResult.url;
      } catch {
        // Firebase unavailable — return inline data URL (works in email <img> tags)
        return await QRCode.toDataURL(token);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(`Error generating QR code: ${error.message}`, 500);
      }
      throw new AppError('Error generating QR code', 500);
    }
  }

  /**
   * Verify a QR code token
   */
  verifyToken(token: string): { eventId: string; userId: string } | null {
    try {
      if (!config.jwt.qrCodeSecret) {
        throw new AppError('QR code secret is not defined', 500);
      }
      const decoded = jwt.verify(token, config.jwt.qrCodeSecret) as unknown as {
        eventId: string;
        userId: string;
        type: string;
      };

      // Ensure this is an event registration token
      if (decoded.type !== 'event-registration') {
        return null;
      }

      return {
        eventId: decoded.eventId,
        userId: decoded.userId
      };
    } catch (error) {
      return null;
    }
  }
}
