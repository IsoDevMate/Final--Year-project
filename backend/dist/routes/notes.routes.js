"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notes_controller_1 = require("../controllers/notes.controller");
const auth_mddleware_1 = require("../middleware/auth.mddleware");
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    }
});
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_mddleware_1.AuthMiddleware.verifyToken);
// Get notes (with pagination and filters)
router.get('/', (req, res, next) => notes_controller_1.NoteController.getNotes(req, res, next));
// Get a specific note by ID
router.get('/:id', (req, res, next) => notes_controller_1.NoteController.getNoteById(req, res, next));
// Create a new note
router.post('/', (req, res, next) => notes_controller_1.NoteController.createNote(req, res, next));
// Update a note
router.put('/:id', (req, res, next) => notes_controller_1.NoteController.updateNote(req, res, next));
// Delete a note
router.delete('/:id', (req, res, next) => notes_controller_1.NoteController.deleteNote(req, res, next));
// Add media attachment to a note
router.post('/:id/media', upload.single('file'), (req, res, next) => notes_controller_1.NoteController.uploadAttachment(req, res, next));
// Remove media attachment from a note
router.delete('/:id/media/:attachmentId', (req, res, next) => notes_controller_1.NoteController.removeAttachment(req, res, next));
// Share a note with other users
router.post('/:id/share', (req, res, next) => notes_controller_1.NoteController.shareNote(req, res, next));
// Unshare a note with other users
router.post('/:id/unshare', (req, res, next) => notes_controller_1.NoteController.unshareNote(req, res, next));
exports.default = router;
