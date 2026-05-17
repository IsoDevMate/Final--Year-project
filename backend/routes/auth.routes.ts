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

// Change password (requires current password)
router.post('/change-password', AuthMiddleware.verifyToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return ResponseUtil.error(res, 400, 'Current and new password are required');
    if (newPassword.length < 8) return ResponseUtil.error(res, 400, 'New password must be at least 8 characters');

    const userId = (req.user as any).userId;
    const user = await User.findById(userId);
    if (!user) return ResponseUtil.error(res, 404, 'User not found');

    const bcrypt = await import('bcrypt');
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return ResponseUtil.error(res, 400, 'Current password is incorrect');

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    // Revoke all other tokens so other sessions are invalidated
    await Token.deleteMany({ userId });
    return ResponseUtil.success(res, 200, null, 'Password changed successfully');
  } catch (e) { next(e); }
});

// List active sessions (tokens) for current user
router.get('/sessions', AuthMiddleware.verifyToken, async (req, res, next) => {
  try {
    const userId = (req.user as any).userId;
    const currentToken = req.headers.authorization?.split(' ')[1];
    const sessions = await Token.find({ userId }).lean();
    const data = sessions.map(s => ({
      _id: s._id,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.token === currentToken,
      userAgent: (req.headers['user-agent'] || 'Unknown') // simplified — all tokens show same UA
    }));
    return ResponseUtil.success(res, 200, data, 'Sessions retrieved');
  } catch (e) { next(e); }
});

// Revoke a specific session
router.delete('/sessions/:tokenId', AuthMiddleware.verifyToken, async (req, res, next) => {
  try {
    const userId = (req.user as any).userId;
    await Token.deleteOne({ _id: req.params.tokenId, userId });
    return ResponseUtil.success(res, 200, null, 'Session revoked');
  } catch (e) { next(e); }
});

// Revoke all sessions except current
router.delete('/sessions', AuthMiddleware.verifyToken, async (req, res, next) => {
  try {
    const userId = (req.user as any).userId;
    const currentToken = req.headers.authorization?.split(' ')[1];
    await Token.deleteMany({ userId, token: { $ne: currentToken } });
    return ResponseUtil.success(res, 200, null, 'All other sessions revoked');
  } catch (e) { next(e); }
});
router.post('/deactivate', AuthMiddleware.verifyToken, async (req, res, next) => {
  try {
    const userId = (req.user as any).userId;
    await User.findByIdAndUpdate(userId, { isActive: false });
    // Revoke all tokens so they must re-login (which will be blocked)
    await Token.deleteMany({ userId });
    return ResponseUtil.success(res, 200, null, 'Account deactivated successfully');
  } catch (e) { next(e); }
});

// Reactivate own account
router.post('/reactivate', AuthMiddleware.verifyToken, async (req, res, next) => {
  try {
    const userId = (req.user as any).userId;
    await User.findByIdAndUpdate(userId, { isActive: true });
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
