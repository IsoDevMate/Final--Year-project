import { Router } from 'express';
import { NoteController } from '../controllers/notes.controller';
import { AuthMiddleware } from '../middleware/auth.mddleware';
import multer from 'multer';
import { UserRole } from '../models/user.model';


const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
});

const router = Router();

// All routes require authentication
router.use(AuthMiddleware.verifyToken);

// Get notes (with pagination and filters)
router.get('/', (req, res, next) => NoteController.getNotes(req, res, next));

// Get a specific note by ID
router.get('/:id', (req, res, next) => NoteController.getNoteById(req, res, next));

// Create a new note
router.post('/', (req, res, next) => NoteController.createNote(req, res, next));

// Update a note
router.put('/:id', (req, res, next) => NoteController.updateNote(req, res, next));

// Delete a note
router.delete('/:id', (req, res, next) => NoteController.deleteNote(req, res, next));

// Add media attachment to a note
router.post(
  '/:id/media',
  upload.single('file'),
  (req, res, next) => NoteController.uploadAttachment(req, res, next)
);

// Remove media attachment from a note
router.delete(
  '/:id/media/:attachmentId',
  (req, res, next) => NoteController.removeAttachment(req, res, next)
);

// Share a note with other users
router.post(
  '/:id/share',
  (req, res, next) => NoteController.shareNote(req, res, next)
);

// Unshare a note with other users
router.post(
  '/:id/unshare',
  (req, res, next) => NoteController.unshareNote(req, res, next)
);

export default router;
