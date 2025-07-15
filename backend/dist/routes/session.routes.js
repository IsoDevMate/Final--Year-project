"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const session_controller_1 = require("../controllers/session.controller");
const router = express_1.default.Router();
// Create a new session
router.post('/create', session_controller_1.SessionController.createSession);
// Get all sessions
router.get('/', session_controller_1.SessionController.getSessions);
// Get a session by ID
router.get('/:id', session_controller_1.SessionController.getSessionById);
// Update a session
router.patch('/:id', session_controller_1.SessionController.updateSession);
// Delete a session
router.delete('/:id', session_controller_1.SessionController.deleteSession);
// Register for a session
router.post('/:id/register', session_controller_1.SessionController.registerForSession);
// Add material to a session
router.post('/:id/material', session_controller_1.SessionController.addSessionMaterial);
// Toggle live stream status
router.patch('/:id/livestream', session_controller_1.SessionController.toggleLiveStream);
// Get sessions by event ID
router.get('/event/:eventId', session_controller_1.SessionController.getSessionsByEvent);
exports.default = router;
