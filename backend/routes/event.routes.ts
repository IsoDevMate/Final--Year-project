import { Router } from 'express';
import { EventController } from '../controllers/event.controller';
import { AuthMiddleware } from '../middleware/auth.mddleware';
import { UserRole } from '../models/user.model';
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB limit
  }
});

const router = Router();
const eventController = new EventController();


router.get(
  '/registered',
  AuthMiddleware.verifyToken,
  eventController.getEventsihvaeRegisteredasaused.bind(eventController)
);

router.get(
  '/organizer/events',
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]),
  eventController.getOrganizerEvents.bind(eventController)
);

// Get attendees for a specific event
router.get(
  '/:id/attendees',
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]),
  eventController.getEventAttendees.bind(eventController)
);


router.put(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]),
  eventController.updateEvent.bind(eventController)
);

router.get('/:id', eventController.getEventById.bind(eventController));

// Protected routes - only authenticated users
router.post(
  '/register/:id',
  AuthMiddleware.verifyToken,
  eventController.registerForEvent.bind(eventController)
);

router.delete(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]),
  eventController.deleteEvent.bind(eventController)
);

// Unregister from event
router.delete(
  '/register/:id',
  AuthMiddleware.verifyToken,
  eventController.unregisterFromEvent.bind(eventController)
);

// Cover image upload
router.post(
  '/:id/cover-image',
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]),
  upload.single('image'),
  eventController.uploadEventCoverImage.bind(eventController)
);

router.get('/', eventController.getEvents.bind(eventController));

// Organizer routes - only event organizers and admins
router.post(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasRole([UserRole.ORGANIZER, UserRole.ADMIN]),
  eventController.createEvent.bind(eventController)
);


export default router;
