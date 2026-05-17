"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionController = void 0;
const zod_1 = require("zod");
const session_service_1 = require("../services/session service");
const errors_utils_1 = require("../utils/errors.utils");
const mongoose_1 = require("mongoose");
const session_model_1 = require("../models/session.model");
const sessionBodySchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters').max(2000),
    eventId: zod_1.z.string().refine(id => mongoose_1.Types.ObjectId.isValid(id), 'Invalid event ID').optional(),
    event: zod_1.z.string().refine(id => mongoose_1.Types.ObjectId.isValid(id), 'Invalid event ID').optional(),
    startTime: zod_1.z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid start time'),
    endTime: zod_1.z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid end time'),
    location: zod_1.z.string().max(200).optional().default(''),
    capacity: zod_1.z.number().int().min(1).max(10000).optional(),
    speaker: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Speaker name is required').max(100).regex(/^[A-Za-z\s'\-]+$/, 'Speaker name must contain letters only'),
        title: zod_1.z.string().max(100).optional(),
        company: zod_1.z.string().max(100).optional(),
        bio: zod_1.z.string().max(500).optional(),
        photoUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
        userId: zod_1.z.string().optional(),
    }).optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
    isLiveStreamed: zod_1.z.boolean().optional(),
    streamUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
}).refine(d => new Date(d.endTime) > new Date(d.startTime), {
    message: 'End time must be after start time', path: ['endTime']
});
const sessionUpdateSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(200).optional(),
    description: zod_1.z.string().min(10).max(2000).optional(),
    startTime: zod_1.z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid start time').optional(),
    endTime: zod_1.z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid end time').optional(),
    location: zod_1.z.string().max(200).optional(),
    capacity: zod_1.z.number().int().min(1).max(10000).optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).max(20).optional(),
    isLiveStreamed: zod_1.z.boolean().optional(),
    streamUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
});
class SessionController {
    static createSession(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                let parsed;
                try {
                    parsed = sessionBodySchema.parse(req.body);
                }
                catch (e) {
                    return res.status(400).json({ success: false, message: ((_b = (_a = e.errors) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) || 'Invalid session data' });
                }
                // Support both 'event' and 'eventId' field names from frontend
                const sessionData = Object.assign(Object.assign({}, parsed), { event: parsed.event || parsed.eventId, status: session_model_1.SessionStatus.SCHEDULED });
                if (req.user && sessionData.speaker && !sessionData.speaker.userId) {
                    sessionData.speaker.userId = req.user._id;
                }
                const session = yield session_service_1.sessionService.createSession(sessionData);
                return res.status(201).json({ success: true, data: session, message: 'Session created successfully' });
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError)
                    return res.status(error.statusCode).json({ success: false, message: error.message });
                return res.status(500).json({ success: false, message: 'Failed to create session' });
            }
        });
    }
    static getSessions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield session_service_1.sessionService.getSessions(req.query);
                return res.status(200).json({
                    success: true,
                    data: result,
                    message: 'Sessions retrieved successfully'
                });
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    return res.status(error.statusCode).json({
                        success: false,
                        message: error.message
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve sessions'
                });
            }
        });
    }
    static getSessionById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionId = req.params.id;
                const session = yield session_service_1.sessionService.getSessionById(sessionId);
                if (!session) {
                    return res.status(404).json({
                        success: false,
                        message: 'Session not found'
                    });
                }
                return res.status(200).json({
                    success: true,
                    data: session,
                    message: 'Session retrieved successfully'
                });
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    return res.status(error.statusCode).json({
                        success: false,
                        message: error.message
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve session'
                });
            }
        });
    }
    static updateSession(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const sessionId = req.params.id;
                if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
                    return res.status(400).json({ success: false, message: 'Invalid session ID' });
                }
                let updateData;
                try {
                    updateData = sessionUpdateSchema.parse(req.body);
                }
                catch (e) {
                    return res.status(400).json({ success: false, message: ((_b = (_a = e.errors) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) || 'Invalid session data' });
                }
                const session = yield session_service_1.sessionService.updateSession(sessionId, updateData);
                return res.status(200).json({ success: true, data: session, message: 'Session updated successfully' });
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError)
                    return res.status(error.statusCode).json({ success: false, message: error.message });
                return res.status(500).json({ success: false, message: 'Failed to update session' });
            }
        });
    }
    static deleteSession(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionId = req.params.id;
                yield session_service_1.sessionService.deleteSession(sessionId);
                return res.status(200).json({
                    success: true,
                    message: 'Session deleted successfully'
                });
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    return res.status(error.statusCode).json({
                        success: false,
                        message: error.message
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete session'
                });
            }
        });
    }
    static registerForSession(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionId = req.params.id;
                const userId = req.user._id;
                const session = yield session_service_1.sessionService.registerAttendee(sessionId, userId);
                return res.status(200).json({
                    success: true,
                    data: session,
                    message: 'Successfully registered for session'
                });
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    return res.status(error.statusCode).json({
                        success: false,
                        message: error.message
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: 'Failed to register for session'
                });
            }
        });
    }
    static addSessionMaterial(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionId = req.params.id;
                const material = req.body;
                const session = yield session_service_1.sessionService.addSessionMaterial(sessionId, material);
                return res.status(200).json({
                    success: true,
                    data: session,
                    message: 'Material added to session successfully'
                });
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    return res.status(error.statusCode).json({
                        success: false,
                        message: error.message
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: 'Failed to add material to session'
                });
            }
        });
    }
    static toggleLiveStream(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionId = req.params.id;
                const { isLiveStreamed, streamUrl } = req.body;
                const session = yield session_service_1.sessionService.updateStreamStatus(sessionId, isLiveStreamed, streamUrl);
                return res.status(200).json({
                    success: true,
                    data: session,
                    message: `Live stream ${isLiveStreamed ? 'started' : 'stopped'} successfully`
                });
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    return res.status(error.statusCode).json({
                        success: false,
                        message: error.message
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update live stream status'
                });
            }
        });
    }
    static getSessionsByEvent(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const eventId = req.params.eventId;
                const sessions = yield session_service_1.sessionService.getSessionsByEventId(eventId);
                return res.status(200).json({
                    success: true,
                    data: sessions,
                    message: 'Sessions retrieved successfully'
                });
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    return res.status(error.statusCode).json({
                        success: false,
                        message: error.message
                    });
                }
                return res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve sessions for this event'
                });
            }
        });
    }
}
exports.SessionController = SessionController;
