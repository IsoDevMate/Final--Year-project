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
const session_service_1 = require("../services/session service");
const errors_utils_1 = require("../utils/errors.utils");
class SessionController {
    static createSession(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sessionData = req.body;
                // If the request has a user object (from auth middleware), set the speaker userId
                if (req.user && sessionData.speaker && !sessionData.speaker.userId) {
                    sessionData.speaker.userId = req.user._id;
                }
                const session = yield session_service_1.sessionService.createSession(sessionData);
                return res.status(201).json({
                    success: true,
                    data: session,
                    message: 'Session created successfully'
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
                    message: 'Failed to create session'
                });
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
            try {
                const sessionId = req.params.id;
                const updateData = req.body;
                const session = yield session_service_1.sessionService.updateSession(sessionId, updateData);
                return res.status(200).json({
                    success: true,
                    data: session,
                    message: 'Session updated successfully'
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
                    message: 'Failed to update session'
                });
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
