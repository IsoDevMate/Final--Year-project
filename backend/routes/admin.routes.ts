import { Router } from 'express';
import { AuthMiddleware } from '../middleware/auth.mddleware';
import { UserRole, User } from '../models/user.model';
import { Event } from '../models/event.model';
import { Note } from '../models/note.model';
import { MpesaPayment } from '../models/mpesapayment.model';
import { Token } from '../models/token.model';
import { ResponseUtil } from '../utils/response.utils';

const router = Router();

// All admin routes require auth + admin role
router.use(AuthMiddleware.verifyToken, AuthMiddleware.hasRole([UserRole.ADMIN]));

// GET all users
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').lean();
    return ResponseUtil.success(res, 200, users, 'Users fetched successfully');
  } catch (e) { next(e); }
});

// GET single user
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return ResponseUtil.error(res, 404, 'User not found');
    return ResponseUtil.success(res, 200, user, 'User fetched successfully');
  } catch (e) { next(e); }
});

// PUT update user (role, etc.)
router.put('/users/:id', async (req, res, next) => {
  try {
    const { role, firstName, lastName, email, isVerified } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { ...(role && { role }), ...(firstName && { firstName }), ...(lastName && { lastName }), ...(email && { email }), ...(isVerified !== undefined && { isVerified }) },
      { new: true }
    ).select('-password');
    if (!updated) return ResponseUtil.error(res, 404, 'User not found');
    return ResponseUtil.success(res, 200, updated, 'User updated successfully');
  } catch (e) { next(e); }
});

// DELETE user with cascade
router.delete('/users/:id', async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return ResponseUtil.error(res, 404, 'User not found');

    if (target.role === UserRole.ORGANIZER) {
      await Event.deleteMany({ organizer: target._id });
    } else {
      await Event.updateMany({ attendees: target._id }, { $pull: { attendees: target._id } });
    }

    await Note.deleteMany({ user: target._id });
    await MpesaPayment.deleteMany({ userId: target._id });
    await Token.deleteMany({ userId: target._id });
    await User.findByIdAndDelete(req.params.id);

    return ResponseUtil.success(res, 200, null, 'User deleted successfully');
  } catch (e) { next(e); }
});

// GET all events (admin view)
router.get('/events', async (req, res, next) => {
  try {
    const events = await Event.find({}).populate('organizer', 'firstName lastName email').lean();
    return ResponseUtil.success(res, 200, events, 'Events fetched successfully');
  } catch (e) { next(e); }
});

// DELETE any event
router.delete('/events/:id', async (req, res, next) => {
  try {
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) return ResponseUtil.error(res, 404, 'Event not found');
    return ResponseUtil.success(res, 200, null, 'Event deleted successfully');
  } catch (e) { next(e); }
});

// GET dashboard stats
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, totalEvents, totalOrganizers, totalAttendees] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      User.countDocuments({ role: UserRole.ORGANIZER }),
      User.countDocuments({ role: UserRole.ATTENDEE }),
    ]);
    return ResponseUtil.success(res, 200, { totalUsers, totalEvents, totalOrganizers, totalAttendees }, 'Stats fetched');
  } catch (e) { next(e); }
});

export default router;
