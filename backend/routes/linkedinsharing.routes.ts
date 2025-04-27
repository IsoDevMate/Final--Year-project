import express from 'express';
import { AuthMiddleware } from '../middleware/auth.mddleware';
import LinkedInSharingController from '../controllers/linkedinsharing.controller';

const router = express.Router();

// Middleware to verify token
router.use(AuthMiddleware.verifyToken);


router.get('/status', LinkedInSharingController.checkLinkedInStatus);


// Share a note to LinkedIn
router.post('/share/note/:noteId', LinkedInSharingController.shareNote);

// Generic content sharing
router.post('/share/content', LinkedInSharingController.shareContent);

// Specific content type sharing routes
router.post('/share/text', LinkedInSharingController.shareTextPost);
router.post('/share/image', LinkedInSharingController.shareImagePost);
router.post('/share/video', LinkedInSharingController.shareVideoPost);
router.post('/share/article', LinkedInSharingController.shareArticlePost);

// Get LinkedIn access token
router.post('/access-token', LinkedInSharingController.getAccessToken);

export default router;
