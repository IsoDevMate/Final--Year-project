"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.EventService = void 0;
const mongoose_1 = require("mongoose");
const event_model_1 = require("../models/event.model");
const errors_utils_1 = require("../utils/errors.utils");
const qrcode_service_1 = require("./qrcode.service");
const email_service_1 = require("./email.service");
class EventService {
    constructor() {
        this.qrCodeService = new qrcode_service_1.QRCodeService();
        this.emailService = new email_service_1.EmailService();
    }
    createEvent(eventData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const event = new event_model_1.Event(eventData);
                yield event.save();
                return event;
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(error.message, 400);
                }
                throw new errors_utils_1.AppError('Failed to create event', 500);
            }
        });
    }
    getEvents(queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = 1, limit = 10, title, type, status, startDate, endDate, city, organizer } = queryParams;
                const skip = (page - 1) * limit;
                // Build query filters
                const filter = {};
                if (title)
                    filter.title = { $regex: title, $options: 'i' };
                if (type)
                    filter.type = type;
                if (status)
                    filter.status = status;
                if (city)
                    filter['location.city'] = { $regex: city, $options: 'i' };
                if (organizer)
                    filter.organizer = organizer;
                // Date range filter
                if (startDate || endDate) {
                    filter.startDate = {};
                    if (startDate)
                        filter.startDate.$gte = new Date(startDate);
                    if (endDate)
                        filter.endDate = { $lte: new Date(endDate) };
                }
                // Execute query with pagination
                const events = yield event_model_1.Event.find(filter)
                    .sort({ startDate: 1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('organizer', 'firstName lastName email');
                // Get total count for pagination
                const total = yield event_model_1.Event.countDocuments(filter);
                return {
                    events,
                    total,
                    page: Number(page),
                    limit: Number(limit)
                };
            }
            catch (error) {
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(error.message, 400);
                }
                throw new errors_utils_1.AppError('Failed to retrieve events', 500);
            }
        });
    }
    getEventById(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(eventId)) {
                    throw new errors_utils_1.AppError('Invalid event ID', 400);
                }
                return yield event_model_1.Event.findById(eventId)
                    .populate('organizer', 'firstName lastName email')
                    .populate('sessions')
                    .populate('attendees', 'firstName lastName email');
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to retrieve event', 500);
            }
        });
    }
    updateEvent(eventId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(eventId)) {
                    throw new errors_utils_1.AppError('Invalid event ID', 400);
                }
                const event = yield event_model_1.Event.findByIdAndUpdate(eventId, { $set: updateData }, { new: true, runValidators: true });
                if (!event) {
                    throw new errors_utils_1.AppError('Event not found', 404);
                }
                return event;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                if (error instanceof Error) {
                    throw new errors_utils_1.AppError(error.message, 400);
                }
                throw new errors_utils_1.AppError('Failed to update event', 500);
            }
        });
    }
    deleteEvent(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(eventId)) {
                    throw new errors_utils_1.AppError('Invalid event ID', 400);
                }
                const result = yield event_model_1.Event.findByIdAndDelete(eventId);
                if (!result) {
                    throw new errors_utils_1.AppError('Event not found', 404);
                }
                // Delete associated sessions
                yield event_model_1.Event.updateMany({ _id: eventId }, { $unset: { sessions: "" } });
                // Delete associated notes or other related data
                const Note = yield Promise.resolve().then(() => __importStar(require('../models/note.model'))).then(module => module.Note);
                yield Note.deleteMany({ eventId });
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to delete event', 500);
            }
        });
    }
    registerAttendee(eventId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(eventId) || !mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new errors_utils_1.AppError('Invalid ID', 400);
                }
                // Check if event exists
                const event = yield event_model_1.Event.findById(eventId);
                if (!event) {
                    throw new errors_utils_1.AppError('Event not found', 404);
                }
                // Check if user is already registered
                if (event.attendees.includes(new mongoose_1.Types.ObjectId(userId))) {
                    throw new errors_utils_1.AppError('User already registered for this event', 400);
                }
                // Check if event has reached capacity
                if (event.capacity && event.attendees.length >= event.capacity) {
                    throw new errors_utils_1.AppError('Event has reached maximum capacity', 400);
                }
                // If event has a ticket price, check for payment
                if (event.ticketPrice && event.ticketPrice > 0) {
                    // Import here to avoid circular dependency
                    const MpesaPayment = yield Promise.resolve().then(() => __importStar(require('../models/mpesapayment.model'))).then(module => module.MpesaPayment);
                    const { MpesaPaymentStatus } = yield Promise.resolve().then(() => __importStar(require('../models/mpesapayment.model')));
                    // Check if payment exists and is completed
                    const payment = yield MpesaPayment.findOne({
                        eventId: new mongoose_1.Types.ObjectId(eventId),
                        userId: new mongoose_1.Types.ObjectId(userId),
                        status: MpesaPaymentStatus.COMPLETED
                    });
                    if (!payment) {
                        throw new errors_utils_1.AppError('Payment required to register for this event', 400);
                    }
                }
                // Add user to attendees
                event.attendees.push(new mongoose_1.Types.ObjectId(userId));
                yield event.save();
                // Generate QR code token and QR code
                const token = this.qrCodeService.generateTokenForEventAttendee(eventId, userId);
                const qrCodeUrl = yield this.qrCodeService.generateQRCode(token);
                // Get user details for sending email
                const populatedEvent = yield event_model_1.Event.findById(eventId)
                    .populate({
                    path: 'attendees',
                    match: { _id: userId },
                    select: 'email firstName lastName'
                });
                if (!populatedEvent) {
                    throw new errors_utils_1.AppError('Event not found after population', 404);
                }
                // Find the specific attendee in the populated attendees array
                const attendee = populatedEvent.attendees.find(a => a._id.toString() === userId);
                // Send email with QR code if we have user's email
                if (attendee) {
                    process.nextTick(() => __awaiter(this, void 0, void 0, function* () {
                        try {
                            yield email_service_1.EmailService.sendEventRegistrationEmail(attendee.email, {
                                eventName: event.title,
                                eventDate: event.startDate.toDateString(),
                                eventLocation: `${event.location.name}, ${event.location.city}`,
                                qrCodeUrl,
                                attendeeName: `${attendee.firstName} ${attendee.lastName}`
                            });
                        }
                        catch (err) {
                            console.error('Email sending error:', err);
                        }
                    }));
                }
                return { event, qrCodeUrl };
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to register for event', 500);
            }
        });
    }
    unregisterAttendee(eventId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(eventId) || !mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new errors_utils_1.AppError('Invalid ID', 400);
                }
                // Check if event exists
                const event = yield event_model_1.Event.findById(eventId);
                if (!event) {
                    throw new errors_utils_1.AppError('Event not found', 404);
                }
                // Check if user is registered
                if (!event.attendees.some(id => id.toString() === userId)) {
                    throw new errors_utils_1.AppError('User is not registered for this event', 400);
                }
                // Remove user from attendees
                event.attendees = event.attendees.filter(id => id.toString() !== userId);
                yield event.save();
                // Note: QR code is now invalid because it won't match any registration
                // No need to explicitly invalidate it as the user is no longer in attendees list
                return event;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to unregister from event', 500);
            }
        });
    }
    uploadCoverImage(eventId, imageUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(eventId)) {
                    throw new errors_utils_1.AppError('Invalid event ID', 400);
                }
                const event = yield event_model_1.Event.findByIdAndUpdate(eventId, { $set: { coverImage: imageUrl } }, { new: true });
                if (!event) {
                    throw new errors_utils_1.AppError('Event not found', 404);
                }
                return event;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to upload cover image', 500);
            }
        });
    }
    verifyEventAttendee(qrCodeToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Verify the token from QR code
                const decodedToken = this.qrCodeService.verifyToken(qrCodeToken);
                if (!decodedToken) {
                    return { isValid: false };
                }
                // Check if user is still registered for the event
                const event = yield event_model_1.Event.findById(decodedToken.eventId)
                    .populate('organizer', 'firstName lastName email')
                    .select('title startDate endDate location status type');
                if (!event) {
                    return { isValid: false };
                }
                // Check if user is in attendees list
                const isAttending = event.attendees.some(id => id.toString() === decodedToken.userId);
                if (!isAttending) {
                    return { isValid: false };
                }
                // Get attendee details
                const attendee = yield Promise.resolve().then(() => __importStar(require('../models/user.model'))).then(module => {
                    const User = module.User;
                    return User.findById(decodedToken.userId).select('firstName lastName email');
                });
                if (!attendee) {
                    return { isValid: false };
                }
                return {
                    isValid: true,
                    eventDetails: event,
                    attendeeDetails: attendee
                };
            }
            catch (error) {
                return { isValid: false };
            }
        });
    }
    getEventsihvaeRegisteredasauser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new errors_utils_1.AppError('Invalid user ID', 400);
                }
                const events = yield event_model_1.Event.find({ attendees: userId })
                    .populate('organizer', 'firstName lastName email')
                    .populate('sessions')
                    .populate('attendees', 'firstName lastName email');
                return events;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to retrieve registered events', 500);
            }
        });
    }
    static getEventsByOrganizer(organizerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(organizerId)) {
                    throw new errors_utils_1.AppError('Invalid organizer ID', 400);
                }
                const events = yield event_model_1.Event.find({ organizer: organizerId })
                    .populate('sessions')
                    .sort({ startDate: -1 });
                return events;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to retrieve organizer events', 500);
            }
        });
    }
    static getEventAttendees(eventId, requestingUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(eventId)) {
                    throw new errors_utils_1.AppError('Invalid event ID', 400);
                }
                const event = yield event_model_1.Event.findById(eventId);
                if (!event) {
                    throw new errors_utils_1.AppError('Event not found', 404);
                }
                // Check if user is the organizer or admin
                if (event.organizer.toString() !== requestingUserId) {
                    throw new errors_utils_1.AppError('Not authorized to view attendees', 403);
                }
                // Get detailed attendee information
                const populatedEvent = yield event_model_1.Event.findById(eventId)
                    .populate('attendees', 'firstName lastName email phone')
                    .select('attendees');
                if (!populatedEvent) {
                    throw new errors_utils_1.AppError('Event not found after population', 404);
                }
                return populatedEvent.attendees;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to retrieve event attendees', 500);
            }
        });
    }
    getEventSessions(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!mongoose_1.Types.ObjectId.isValid(eventId)) {
                    throw new errors_utils_1.AppError('Invalid event ID', 400);
                }
                const event = yield event_model_1.Event.findById(eventId)
                    .populate('sessions')
                    .select('sessions');
                if (!event) {
                    throw new errors_utils_1.AppError('Event not found', 404);
                }
                return event.sessions;
            }
            catch (error) {
                if (error instanceof errors_utils_1.AppError) {
                    throw error;
                }
                throw new errors_utils_1.AppError('Failed to retrieve event sessions', 500);
            }
        });
    }
}
exports.EventService = EventService;
