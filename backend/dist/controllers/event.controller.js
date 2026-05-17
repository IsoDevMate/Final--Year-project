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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventController = void 0;
const zod_1 = require("zod");
const event_service_1 = require("../services/event.service");
const event_validation_1 = require("../utils/event.validation");
const response_utils_1 = require("../utils/response.utils");
const errors_utils_1 = require("../utils/errors.utils");
const user_model_1 = require("../models/user.model");
const upload_service_1 = require("../services/upload.service");
const mongoose_1 = require("mongoose");
class EventController {
    constructor() {
        this.eventService = new event_service_1.EventService();
        this.storageService = new upload_service_1.StorageService();
    }
    createEvent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const requestId = Math.random().toString(36).substring(7);
            console.log(`[${requestId}] Event creation started - User: ${((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || 'unknown'}`);
            try {
                console.log(`[${requestId}] Validating request body...`);
                const validatedData = event_validation_1.createEventSchema.parse(req.body);
                console.log(`[${requestId}] Request validation successful`);
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    console.log(`[${requestId}] Authentication failed - No user object found`);
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                // Get user ID from request (set by auth middleware)
                const organizer = req.user.userId;
                console.log(`[${requestId}] User authenticated - Organizer ID: ${organizer}`);
                console.log(`[${requestId}] Calling event service to create event...`);
                // Clean up the data - remove fields that shouldn't be sent by client
                const { coverImage, sessions, attendees } = validatedData, cleanData = __rest(validatedData, ["coverImage", "sessions", "attendees"]);
                const event = yield this.eventService.createEvent(Object.assign(Object.assign({}, cleanData), { startDate: new Date(validatedData.startDate), endDate: new Date(validatedData.endDate), organizer }));
                console.log(`[${requestId}] Event created successfully - Event ID: ${event._id}`);
                return response_utils_1.ResponseUtil.success(res, 201, event, 'Event created successfully');
            }
            catch (error) {
                console.log(`[${requestId}] Error occurred during event creation`);
                // Handle Zod validation errors with detailed messages
                if (error instanceof zod_1.ZodError) {
                    const formattedErrors = (0, errors_utils_1.formatValidationErrors)(error.errors);
                    console.log(`[${requestId}] Zod validation error: ${formattedErrors}`);
                    return response_utils_1.ResponseUtil.error(res, 400, `Validation failed: ${formattedErrors}`);
                }
                // Handle AppError instances
                if (error instanceof errors_utils_1.AppError) {
                    console.log(`[${requestId}] AppError: ${error.message} (Status: ${error.statusCode})`);
                    return response_utils_1.ResponseUtil.error(res, error.statusCode, error.message);
                }
                // Handle other errors
                console.error(`[${requestId}] Unexpected error during event creation:`, error);
                next(error);
            }
        });
    }
    getEvents(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validatedQuery = event_validation_1.eventQuerySchema.parse(req.query);
                const events = yield this.eventService.getEvents(validatedQuery);
                return response_utils_1.ResponseUtil.success(res, 200, events, 'Events retrieved successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    getEventById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                // Validate ID format first
                if (!mongoose_1.Types.ObjectId.isValid(id)) {
                    return response_utils_1.ResponseUtil.error(res, 400, 'Invalid event ID format');
                }
                const event = yield this.eventService.getEventById(id);
                if (!event) {
                    return response_utils_1.ResponseUtil.error(res, 404, 'Event not found');
                }
                return response_utils_1.ResponseUtil.success(res, 200, event, 'Event fetched successfully');
            }
            catch (error) {
                next(error);
            }
        });
    }
    updateEvent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = event_validation_1.eventIdSchema.parse(req.params);
                console.log('[updateEvent] body received:', JSON.stringify(req.body, null, 2));
                const validatedData = event_validation_1.updateEventSchema.parse(req.body);
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const userRole = req.user.role;
                // Get the event to check ownership
                const event = yield this.eventService.getEventById(id);
                if (!event) {
                    return response_utils_1.ResponseUtil.error(res, 404, 'Event not found');
                }
                // Add these debug logs
                console.log('User ID:', userId);
                console.log('User Role:', userRole);
                console.log('Event Organizer ID:', event.organizer);
                console.log('Comparison result:', event.organizer === userId);
                if ((typeof event.organizer === 'object' && event.organizer !== null && '_id' in event.organizer ? event.organizer._id.toString() : String(event.organizer)) !== userId && userRole !== user_model_1.UserRole.ADMIN) {
                    return response_utils_1.ResponseUtil.error(res, 403, 'You do not have permission to update this event');
                }
                const updatedEvent = yield this.eventService.updateEvent(id, Object.assign(Object.assign({}, validatedData), { startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined, endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined }));
                return response_utils_1.ResponseUtil.success(res, 200, updatedEvent, 'Event updated successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    const allErrors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
                    console.error('[updateEvent] Zod validation errors:', allErrors);
                    return response_utils_1.ResponseUtil.error(res, 400, allErrors);
                }
                next(error);
            }
        });
    }
    deleteEvent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = event_validation_1.eventIdSchema.parse(req.params);
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const userRole = req.user.role;
                // Get the event to check ownership
                const event = yield this.eventService.getEventById(id);
                if (!event) {
                    return response_utils_1.ResponseUtil.error(res, 404, 'Event not found');
                }
                // Add these debug logs
                console.log('User ID:', userId);
                console.log('User Role:', userRole);
                console.log('Event Organizer ID:', event.organizer);
                // Check if user is the organizer or an admin
                if ((typeof event.organizer === 'object' && event.organizer !== null && '_id' in event.organizer ? event.organizer._id.toString() : String(event.organizer)) !== userId && userRole !== user_model_1.UserRole.ADMIN) {
                    return response_utils_1.ResponseUtil.error(res, 403, 'You do not have permission to delete this event');
                }
                yield this.eventService.deleteEvent(id);
                return response_utils_1.ResponseUtil.success(res, 200, null, 'Event deleted successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    registerForEvent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = event_validation_1.eventIdSchema.parse(req.params);
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const registrationResult = yield this.eventService.registerAttendee(id, userId);
                console.log(`Registration result: ${JSON.stringify(registrationResult)}`);
                return response_utils_1.ResponseUtil.success(res, 200, registrationResult, 'Registered for event successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                if (error instanceof errors_utils_1.AppError) {
                    return response_utils_1.ResponseUtil.error(res, error.statusCode, error.message);
                }
                next(error);
            }
        });
    }
    unregisterFromEvent(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = event_validation_1.eventIdSchema.parse(req.params);
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const unregistrationResult = yield this.eventService.unregisterAttendee(id, userId);
                return response_utils_1.ResponseUtil.success(res, 200, unregistrationResult, 'Unregistered from event successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                if (error instanceof errors_utils_1.AppError) {
                    return response_utils_1.ResponseUtil.error(res, error.statusCode, error.message);
                }
                next(error);
            }
        });
    }
    uploadEventCoverImage(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = event_validation_1.eventIdSchema.parse(req.params);
                console.log(`Processing upload for event ID: ${id}`);
                if (!req.file) {
                    return response_utils_1.ResponseUtil.error(res, 400, 'No file uploaded');
                }
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const userRole = req.user.role;
                console.log(`User attempting upload: ${userId}, role: ${userRole}`);
                // Get the event to check ownership
                try {
                    const event = yield this.eventService.getEventById(id);
                    if (!event) {
                        return response_utils_1.ResponseUtil.error(res, 404, 'Event not found');
                    }
                    // Check if user is the organizer or an admin
                    if (event.organizer.toString() !== userId && userRole !== user_model_1.UserRole.ADMIN && userRole !== user_model_1.UserRole.ORGANIZER) {
                        return response_utils_1.ResponseUtil.error(res, 403, 'You do not have permission to update this event');
                    }
                    // Use the storage service to upload the file
                    const uploadResult = yield this.storageService.uploadFile(req.file.buffer, req.file.originalname, userId, 'image');
                    console.log(`File uploaded successfully: ${uploadResult.url}`);
                    // Update the event with the new cover image URL
                    const updatedEvent = yield this.eventService.uploadCoverImage(id, uploadResult.url);
                    if (updatedEvent) {
                        console.log(`Event updated with new cover image: ${updatedEvent.coverImage}`);
                    }
                    else {
                        console.log('Event update failed, updatedEvent is null');
                    }
                    return response_utils_1.ResponseUtil.success(res, 200, updatedEvent, 'Event cover image uploaded successfully');
                }
                catch (error) {
                    console.error('Error retrieving event:', error);
                    throw error;
                }
            }
            catch (error) {
                console.error('Error in uploadEventCoverImage:', error); // Add error logging
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    getOrganizerEvents(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const userRole = req.user.role;
                // Only organizers and admins can access this endpoint
                if (userRole !== user_model_1.UserRole.ORGANIZER && userRole !== user_model_1.UserRole.ADMIN) {
                    return response_utils_1.ResponseUtil.error(res, 403, 'Insufficient permissions');
                }
                const events = yield event_service_1.EventService.getEventsByOrganizer(userId);
                return response_utils_1.ResponseUtil.success(res, 200, events, 'Organizer events retrieved successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    getEventAttendees(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = event_validation_1.eventIdSchema.parse(req.params);
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const userRole = req.user.role;
                // Only organizers and admins can access attendee information
                if (userRole !== user_model_1.UserRole.ORGANIZER && userRole !== user_model_1.UserRole.ADMIN) {
                    return response_utils_1.ResponseUtil.error(res, 403, 'Insufficient permissions');
                }
                try {
                    const attendees = yield event_service_1.EventService.getEventAttendees(id, userId);
                    return response_utils_1.ResponseUtil.success(res, 200, attendees, 'Event attendees retrieved successfully');
                }
                catch (error) {
                    if (error instanceof errors_utils_1.AppError) {
                        return response_utils_1.ResponseUtil.error(res, error.statusCode, error.message);
                    }
                    throw error;
                }
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
    getEventsihvaeRegisteredasaused(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if user object exists (should be set by auth middleware)
                if (!req.user) {
                    return response_utils_1.ResponseUtil.error(res, 401, 'Not authenticated');
                }
                const userId = req.user.userId;
                const events = yield this.eventService.getEventsihvaeRegisteredasauser(userId);
                return response_utils_1.ResponseUtil.success(res, 200, events, 'Events retrieved successfully');
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
                    return response_utils_1.ResponseUtil.error(res, 400, error.errors[0].message);
                }
                next(error);
            }
        });
    }
}
exports.EventController = EventController;
