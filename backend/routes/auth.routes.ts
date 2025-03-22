import { Router } from 'express';
import{ AuthController } from '../controllers/auth.controller';
import{ LinkedInController }from '../controllers/linkedin.controller';
import { AuthMiddleware } from '../middleware/auth.mddleware';
import { UserRole } from '../models/user.model';

const router = Router();
// Email & Password Authentication
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', AuthController.requestPasswordReset);

// QR Code for Event Access
router.post(
  '/generate-qr-code',
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]),
  AuthController.generateQRCode
);
router.post(
  '/verify-qr-code',
  AuthMiddleware.verifyToken,
  AuthController.verifyQRCode
);

// LinkedIn OAuth
router.get('/linkedin', LinkedInController.getAuthUrl);
router.get('/linkedin/callback', LinkedInController.handleCallback);

// // Social auth routes (protected - user must be authenticated first)
// router.post('/social/link', AuthGuard.verifyToken, authController.socialLogin);

// Test protected route
router.get(
  '/me',
  AuthMiddleware.verifyToken,
  (req, res) => {
    return res.status(200).json({
      success: true,
      data: req.user as any,
      message: 'User authenticated successfully'
    });
  }
);

export default router;


