import express from 'express';
import { AuthMiddleware } from '../middleware/auth.mddleware';
import { LinkedInSharingController } from '../controllers/linkedinsharing.controller';

const router = express.Router();

// Middleware to verify token
router.use(AuthMiddleware.verifyToken);

// Check if user has LinkedIn sharing capabilities
router.get('/status', LinkedInSharingController.checkLinkedInStatus);

// Share a note to LinkedIn
router.post('/share/note/:noteId', LinkedInSharingController.shareNote);

export default router;
