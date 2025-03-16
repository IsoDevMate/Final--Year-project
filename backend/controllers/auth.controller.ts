import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { authService } from '../services/auth.service';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  passwordResetSchema,
  passwordResetConfirmSchema
} from '../utils/auth.validation.utils';
import { ResponseUtil } from '../utils/response.utils';
import { AppError } from '../utils/errors.utils';
export class AuthController {

 static  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const user = await authService.register(validatedData);

      return ResponseUtil.success(res, 201, user, 'User registered successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

 static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { user, tokens } = await authService.login(validatedData);

      return ResponseUtil.success(res, 200, { user, tokens }, 'Login successful');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }


 static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = refreshTokenSchema.parse(req.body);
      const tokens = await authService.refreshToken(validatedData.refreshToken);

      return ResponseUtil.success(res, 200, tokens, 'Token refreshed successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  // async logout(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { refreshToken } = req.body;

  //     if (!refreshToken) {
  //       return ResponseUtil.error(res, 400, 'Refresh token is required');
  //     }

  //     await authService.logout(refreshToken);

  //     return ResponseUtil.success(res, 200, null, 'Logout successful');
  //   } catch (error) {
  //     next(error);
  //   }
  // }

 static async generateQRCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, eventId } = req.body;

      if (!userId || !eventId) {
        return ResponseUtil.error(res, 400, 'User ID and Event ID are required');
      }

      const qrCodeDataUrl = await authService.generateQRCode(userId, eventId);

      return ResponseUtil.success(res, 200, { qrCodeDataUrl }, 'QR code generated successfully');
    } catch (error) {
      next(error);
    }
  }

 static async verifyQRCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { qrData } = req.body;

      if (!qrData) {
        return ResponseUtil.error(res, 400, 'QR code data is required');
      }

      const verificationResult = await authService.verifyQRCode(qrData);

      return ResponseUtil.success(res, 200, verificationResult, 'QR code verified successfully');
    } catch (error) {
      next(error);
    }
  }


static  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = passwordResetSchema.parse(req.body);
      await authService.forgotPassword({ email: validatedData.email });

      // Always return success even if email doesn't exist (for security)
      return ResponseUtil.success(res, 200, null, 'If the email exists, a password reset link will be sent');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }
}

export default new AuthController();

