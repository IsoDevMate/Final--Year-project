import { Router } from 'express';
import{ AuthController } from '../controllers/auth.controller';
import{ LinkedInController }from '../controllers/linkedin.controller';
import { AuthMiddleware } from '../middleware/auth.mddleware';
import { UserRole, User } from '../models/user.model';
import { Event } from '../models/event.model';
import { Note } from '../models/note.model';
import { MpesaPayment } from '../models/mpesapayment.model';
import { Token } from '../models/token.model';
import { ResponseUtil } from '../utils/response.utils';

const router = Router();
// Email & Password Authentication
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', AuthController.requestPasswordReset);
router.post('/reset-password', AuthController.resetPassword);
router.put('/update-profile',
  AuthMiddleware.verifyToken,
  AuthController.updateProfile);
router.get('/profile',
  AuthMiddleware.verifyToken,
  AuthController.getUserProfile);

// Deactivate own account (sets isVerified=false as a soft disable flag)
router.post('/deactivate', AuthMiddleware.verifyToken, async (req, res, next) => {
  try {
    const userId = (req.user as any).userId;
    await User.findByIdAndUpdate(userId, { isVerified: false });
    // Revoke all tokens
    await Token.deleteMany({ userId });
    return ResponseUtil.success(res, 200, null, 'Account deactivated successfully');
  } catch (e) { next(e); }
});

// Reactivate own account
router.post('/reactivate', AuthMiddleware.verifyToken, async (req, res, next) => {
  try {
    const userId = (req.user as any).userId;
    await User.findByIdAndUpdate(userId, { isVerified: true });
    return ResponseUtil.success(res, 200, null, 'Account reactivated successfully');
  } catch (e) { next(e); }
});

// Delete own account with cascade
router.delete('/account', AuthMiddleware.verifyToken, async (req, res, next) => {
  try {
    const userId = (req.user as any).userId;
    const userRole = (req.user as any).role;

    if (userRole === UserRole.ORGANIZER) {
      // Delete all events created by organizer (and their attendee references)
      await Event.deleteMany({ organizer: userId });
    } else {
      // Remove user from attendees list of all events they registered for
      await Event.updateMany({ attendees: userId }, { $pull: { attendees: userId } });
    }

    // Delete all notes by this user
    await Note.deleteMany({ user: userId });

    // Delete all M-Pesa payments by this user
    await MpesaPayment.deleteMany({ userId });

    // Delete all tokens
    await Token.deleteMany({ userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    return ResponseUtil.success(res, 200, null, 'Account deleted successfully');
  } catch (e) { next(e); }
});

// LinkedIn OAuth
router.get('/linkedin', LinkedInController.getAuthUrl);
router.get('/linkedin/callback', LinkedInController.handleCallback);

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
