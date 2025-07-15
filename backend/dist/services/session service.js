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
exports.sessionService = exports.SessionService = void 0;
const mongoose_1 = require("mongoose");
const session_model_1 = require("../models/session.model");
const errors_utils_1 = require("../utils/errors.utils");
class SessionService {
    createSession(sessionData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const session = new session_model_1.Session(sessionData);
                yield session.save();
                // Update the event to include this session
                if (sessionData.event) {
                    const Event = require('../models/event.model').Event;
                    yield Event.findByIdAndUpdate(sessionData.event, { $push: { sessions: session._id } });
                }
                return session;
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(error.message, 400);
                }
                throw new errors_utils_1.AppError('Failed to create session', 500);
            }
        });
    }
    getSessions(queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = 1, limit = 10, title, event, speaker, status, startDate, endDate, isLiveStreamed, tags } = queryParams;
                const skip = (page - 1) * limit;
                // Build query filters
                const filter = {};
                if (title)
                    filter.title = { $regex: title, $options: 'i' };
                if (event)
                    filter.event = new mongoose_1.Types.ObjectId(event);
                if (speaker)
                    filter['speaker.name'] = { $regex: speaker, $options: 'i' };
                if (status)
                    filter.status = status;
                if (isLiveStreamed !== undefined)
                    filter.isLiveStreamed = isLiveStreamed;
                if (tags && tags.length > 0)
                    filter.tags = { $in: tags };
                // Date range filter
                if (startDate)
                    filter.startTime = { $gte: new Date(startDate) };
                if (endDate)
                    filter.endTime = { $lte: new Date(endDate) };
                // Execute query with pagination
                const sessions = yield session_model_1.Session.find(filter)
                    .sort({ startTime: 1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('event', 'title')
                    .populate('speaker.userId', 'firstName lastName email profileImage');
                // Get total count for pagination
                const total = yield session_model_1.Session.countDocuments(filter);
                return {
                    sessions,
                    total,
                    page: Number(page),
                    limit: Number(limit)
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(error.message, 400);
                }
                throw new errors_utils_1.AppError('Failed to retrieve sessions', 500);
            }
        });
    }
    getSessionById(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
                    throw new errors_utils_1.AppError('Invalid session ID', 400);
                }
                return yield session_model_1.Session.findById(sessionId)
                    .populate('event', 'title description startDate endDate location')
                    .populate('speaker.userId', 'firstName lastName email profileImage bio')
                    .populate('attendees', 'firstName lastName email');
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to retrieve session', 500);
            }
        });
    }
    updateSession(sessionId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
                    throw new errors_utils_1.AppError('Invalid session ID', 400);
                }
                const session = yield session_model_1.Session.findByIdAndUpdate(sessionId, { $set: updateData }, { new: true, runValidators: true });
                if (!session) {
                    throw new errors_utils_1.AppError('Session not found', 404);
                }
                return session;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(error.message, 400);
                }
                throw new errors_utils_1.AppError('Failed to update session', 500);
            }
        });
    }
    deleteSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
                    throw new errors_utils_1.AppError('Invalid session ID', 400);
                }
                const session = yield session_model_1.Session.findById(sessionId);
                if (!session) {
                    throw new errors_utils_1.AppError('Session not found', 404);
                }
                // Remove the session from the event
                const Event = require('../models/event.model').Event;
                yield Event.findByIdAndUpdate(session.event, { $pull: { sessions: sessionId } });
                // Delete the session
                yield session_model_1.Session.findByIdAndDelete(sessionId);
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to delete session', 500);
            }
        });
    }
    registerAttendee(sessionId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(sessionId) || !mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new errors_utils_1.AppError('Invalid ID', 400);
                }
                // Check if session exists
                const session = yield session_model_1.Session.findById(sessionId);
                if (!session) {
                    throw new errors_utils_1.AppError('Session not found', 404);
                }
                // Check if user is already registered
                if (session.attendees.includes(new mongoose_1.Types.ObjectId(userId))) {
                    throw new errors_utils_1.AppError('User already registered for this session', 400);
                }
                // Check if session has reached capacity
                if (session.capacity && session.attendees.length >= session.capacity) {
                    throw new errors_utils_1.AppError('Session has reached maximum capacity', 400);
                }
                // Add user to attendees
                session.attendees.push(new mongoose_1.Types.ObjectId(userId));
                yield session.save();
                return session;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to register for session', 500);
            }
        });
    }
    addSessionMaterial(sessionId, material) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
                    throw new errors_utils_1.AppError('Invalid session ID', 400);
                }
                const session = yield session_model_1.Session.findById(sessionId);
                if (!session) {
                    throw new errors_utils_1.AppError('Session not found', 404);
                }
                // Add material URL to session materials
                if (!session.materials) {
                    session.materials = [];
                }
                session.materials.push(material.url);
                yield session.save();
                return session;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to add session material', 500);
            }
        });
    }
    updateStreamStatus(sessionId, isLiveStreamed, streamUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(sessionId)) {
                    throw new errors_utils_1.AppError('Invalid session ID', 400);
                }
                const updateData = { isLiveStreamed };
                if (streamUrl) {
                    updateData.streamUrl = streamUrl;
                }
                const session = yield session_model_1.Session.findByIdAndUpdate(sessionId, { $set: updateData }, { new: true });
                if (!session) {
                    throw new errors_utils_1.AppError('Session not found', 404);
                }
                return session;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to update stream status', 500);
            }
        });
    }
    getSessionsByEventId(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(eventId)) {
                    throw new errors_utils_1.AppError('Invalid event ID', 400);
                }
                return yield session_model_1.Session.find({ event: new mongoose_1.Types.ObjectId(eventId) })
                    .sort({ startTime: 1 })
                    .populate('speaker.userId', 'firstName lastName email');
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to retrieve sessions for this event', 500);
            }
        });
    }
}
exports.SessionService = SessionService;
exports.sessionService = new SessionService();
