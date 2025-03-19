import express from 'express';
import { LivestreamController } from '../controllers/livestream.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

// Create a new livestream
router.post('/', authMiddleware, LivestreamController.createLivestream);

// Update livestream status
router.patch('/:id/status', authMiddleware, LivestreamController.updateLivestreamStatus);

// Get all livestreams for an event
router.get('/event/:eventId', authMiddleware, LivestreamController.getLivestreams);

// Get a specific livestream
router.get('/:id', authMiddleware, LivestreamController.getLivestreamById);

// Join a livestream
router.post('/:id/join', authMiddleware, LivestreamController.joinLivestream);

export default router;
