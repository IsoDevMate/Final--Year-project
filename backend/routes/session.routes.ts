import express from 'express';
import { SessionController } from '../controllers/session.controller';
const router = express.Router();

// Create a new session
router.post('/create', SessionController.createSession);

// Get all sessions
router.get('/', SessionController.getSessions);

// Get a session by ID
router.get('/:id', SessionController.getSessionById);

// Update a session
router.patch('/:id', SessionController.updateSession);

// Delete a session
router.delete('/:id', SessionController.deleteSession);

// Register for a session
router.post('/:id/register', SessionController.registerForSession);

// Add material to a session
router.post('/:id/material', SessionController.addSessionMaterial);

// Toggle live stream status
router.patch('/:id/livestream', SessionController.toggleLiveStream);

// Get sessions by event ID
router.get('/event/:eventId', SessionController.getSessionsByEvent);

export default router;
