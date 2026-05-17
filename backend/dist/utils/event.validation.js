"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventIdSchema = exports.eventQuerySchema = exports.updateEventSchema = exports.createEventSchema = void 0;
const zod_1 = require("zod");
const event_model_1 = require("../models/event.model");
// Location schema
const locationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Location name is required').max(100),
    address: zod_1.z.string().max(200).optional().default(''),
    city: zod_1.z.string().min(1, 'City is required').max(50),
    country: zod_1.z.string().min(1, 'Country is required').max(50),
    mapLink: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    coordinates: zod_1.z.object({
        latitude: zod_1.z.number().min(-90).max(90),
        longitude: zod_1.z.number().min(-180).max(180)
    }).nullable().optional()
});
// Create event schema
exports.createEventSchema = zod_1.z.object({
    title: zod_1.z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(100, 'Title cannot exceed 100 characters'),
    description: zod_1.z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(1000, 'Description cannot exceed 1000 characters'),
    type: zod_1.z.enum([
        event_model_1.EventType.CONFERENCE,
        event_model_1.EventType.SEMINAR,
        event_model_1.EventType.WORKSHOP,
        event_model_1.EventType.EXPO,
        event_model_1.EventType.OTHER
    ], { errorMap: () => ({ message: 'Event type must be one of: conference, seminar, workshop, expo, other' }) }),
    status: zod_1.z.enum([
        event_model_1.EventStatus.DRAFT,
        event_model_1.EventStatus.PUBLISHED,
        event_model_1.EventStatus.ONGOING,
        event_model_1.EventStatus.COMPLETED,
        event_model_1.EventStatus.CANCELLED
    ], { errorMap: () => ({ message: 'Event status must be one of: draft, published, ongoing, completed, cancelled' }) }).default(event_model_1.EventStatus.DRAFT),
    startDate: zod_1.z.string()
        .min(1, 'Start date is required')
        .refine((date) => !isNaN(Date.parse(date)), { message: 'Start date must be a valid date format (YYYY-MM-DD or ISO string)' })
        .refine((date) => new Date(date) > new Date(), { message: 'Start date must be in the future' }),
    endDate: zod_1.z.string()
        .min(1, 'End date is required')
        .refine((date) => !isNaN(Date.parse(date)), { message: 'End date must be a valid date format (YYYY-MM-DD or ISO string)' }),
    location: locationSchema,
    capacity: zod_1.z.number()
        .int('Capacity must be a whole number')
        .min(30, 'Minimum event capacity is 30 people')
        .max(5000, 'Maximum event capacity is 5000 people'),
    ticketPrice: zod_1.z.number()
        .min(0, 'Ticket price cannot be negative')
        .max(10000, 'Ticket price cannot exceed $10,000')
        .optional(),
    // Allow these fields but ignore them (they shouldn't be sent by client)
    coverImage: zod_1.z.any().optional(),
    sessions: zod_1.z.any().optional(),
    attendees: zod_1.z.any().optional()
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: 'End date must be after start date',
    path: ['endDate']
});
// Update event schema
exports.updateEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters').optional(),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters').optional(),
    type: zod_1.z.enum([
        event_model_1.EventType.CONFERENCE,
        event_model_1.EventType.SEMINAR,
        event_model_1.EventType.WORKSHOP,
        event_model_1.EventType.EXPO,
        event_model_1.EventType.OTHER
    ]).optional(),
    status: zod_1.z.enum([
        event_model_1.EventStatus.DRAFT,
        event_model_1.EventStatus.PUBLISHED,
        event_model_1.EventStatus.ONGOING,
        event_model_1.EventStatus.COMPLETED,
        event_model_1.EventStatus.CANCELLED
    ]).optional(),
    startDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Start date must be a valid date' }).optional(),
    endDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'End date must be a valid date' }).optional(),
    location: zod_1.z.object({
        name: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        mapLink: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
        coordinates: zod_1.z.object({
            latitude: zod_1.z.number().min(-90).max(90),
            longitude: zod_1.z.number().min(-180).max(180)
        }).nullable().optional()
    }).optional(),
    capacity: zod_1.z.number()
        .int('Capacity must be a whole number')
        .min(30, 'Minimum event capacity is 30 people')
        .max(5000, 'Maximum event capacity is 5000 people')
        .optional(),
    ticketPrice: zod_1.z.number().min(0).optional(),
    coverImage: zod_1.z.string().optional(),
});
// Event query schema
exports.eventQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().optional(),
    title: zod_1.z.string().optional(),
    type: zod_1.z.enum([
        event_model_1.EventType.CONFERENCE,
        event_model_1.EventType.SEMINAR,
        event_model_1.EventType.WORKSHOP,
        event_model_1.EventType.EXPO,
        event_model_1.EventType.OTHER
    ]).optional(),
    status: zod_1.z.enum([
        event_model_1.EventStatus.DRAFT,
        event_model_1.EventStatus.PUBLISHED,
        event_model_1.EventStatus.ONGOING,
        event_model_1.EventStatus.COMPLETED,
        event_model_1.EventStatus.CANCELLED
    ]).optional(),
    startDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Start date must be a valid date' }).optional(),
    endDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'End date must be a valid date' }).optional(),
    city: zod_1.z.string().optional(),
    organizer: zod_1.z.string().optional()
});
// Event ID schema
exports.eventIdSchema = zod_1.z.object({
    id: zod_1.z.string().refine((id) => /^[0-9a-fA-F]{24}$/.test(id), { message: 'Invalid event ID format' })
});
