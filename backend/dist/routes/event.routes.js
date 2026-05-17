"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controller_1 = require("../controllers/event.controller");
const auth_mddleware_1 = require("../middleware/auth.mddleware");
const user_model_1 = require("../models/user.model");
const multer_1 = __importDefault(require("multer"));
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB limit
    }
});
const router = (0, express_1.Router)();
const eventController = new event_controller_1.EventController();
// Protected routes - only authenticated users
router.post('/register/:id', auth_mddleware_1.AuthMiddleware.verifyToken, eventController.registerForEvent.bind(eventController));
router.get('/registered', auth_mddleware_1.AuthMiddleware.verifyToken, eventController.getEventsihvaeRegisteredasaused.bind(eventController));
router.get('/organizer/events', auth_mddleware_1.AuthMiddleware.verifyToken, auth_mddleware_1.AuthMiddleware.hasRole([user_model_1.UserRole.ORGANIZER, user_model_1.UserRole.ADMIN]), eventController.getOrganizerEvents.bind(eventController));
// Get attendees for a specific event
router.get('/:id/attendees', auth_mddleware_1.AuthMiddleware.verifyToken, auth_mddleware_1.AuthMiddleware.hasRole([user_model_1.UserRole.ORGANIZER, user_model_1.UserRole.ADMIN]), eventController.getEventAttendees.bind(eventController));
router.get('/:id', eventController.getEventById.bind(eventController));
router.put('/:id', auth_mddleware_1.AuthMiddleware.verifyToken, auth_mddleware_1.AuthMiddleware.hasRole([user_model_1.UserRole.ORGANIZER, user_model_1.UserRole.ADMIN]), eventController.updateEvent.bind(eventController));
router.delete('/:id', auth_mddleware_1.AuthMiddleware.verifyToken, auth_mddleware_1.AuthMiddleware.hasRole([user_model_1.UserRole.ORGANIZER, user_model_1.UserRole.ADMIN]), eventController.deleteEvent.bind(eventController));
// Unregister from event
router.delete('/register/:id', auth_mddleware_1.AuthMiddleware.verifyToken, eventController.unregisterFromEvent.bind(eventController));
// Cover image upload
router.post('/:id/cover-image', auth_mddleware_1.AuthMiddleware.verifyToken, auth_mddleware_1.AuthMiddleware.hasRole([user_model_1.UserRole.ORGANIZER, user_model_1.UserRole.ADMIN]), upload.single('image'), eventController.uploadEventCoverImage.bind(eventController));
router.get('/', eventController.getEvents.bind(eventController));
// Organizer routes - only event organizers and admins
router.post('/', (req, res, next) => {
    console.log('🎯 Event creation route hit!');
    next();
}, auth_mddleware_1.AuthMiddleware.verifyToken, auth_mddleware_1.AuthMiddleware.hasRole([user_model_1.UserRole.ORGANIZER, user_model_1.UserRole.ADMIN]), eventController.createEvent.bind(eventController));
exports.default = router;
