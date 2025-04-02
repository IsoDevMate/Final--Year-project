import express from 'express';
import { ReportController } from '../controllers/report.controllers';
import { AuthMiddleware } from '../middleware/auth.mddleware';
import { UserRole } from '../models/user.model';

const router = express.Router();
const reportController = new ReportController();

// Routes for report generation
// Generate a summary report of all events for the authenticated user
router.get('/events/summary', AuthMiddleware.verifyToken,  AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]),reportController.generateEventsSummaryReport);
router.get('/events/:id/attendees', AuthMiddleware.verifyToken,
     AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]),reportController.generateEventAttendeesReport);
router.get('/events/:id/analytics', AuthMiddleware.verifyToken,  AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]),reportController.generateEventAnalyticsReport);

// Export the router
export default router;
