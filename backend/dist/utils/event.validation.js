"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventIdSchema = exports.eventQuerySchema = exports.updateEventSchema = exports.createEventSchema = void 0;
const zod_1 = require("zod");
const event_model_1 = require("../models/event.model");
// Location schema
const locationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Location name is required'),
    address: zod_1.z.string().min(1, 'Address is required'),
    city: zod_1.z.string().min(1, 'City is required'),
    country: zod_1.z.string().min(1, 'Country is required'),
    coordinates: zod_1.z.object({
        latitude: zod_1.z.number(),
        longitude: zod_1.z.number()
    }).optional()
});
// Create event schema
exports.createEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
    type: zod_1.z.enum([
        event_model_1.EventType.CONFERENCE,
        event_model_1.EventType.SEMINAR,
        event_model_1.EventType.WORKSHOP,
        event_model_1.EventType.EXPO,
        event_model_1.EventType.OTHER
    ]),
    status: zod_1.z.enum([
        event_model_1.EventStatus.DRAFT,
        event_model_1.EventStatus.PUBLISHED,
        event_model_1.EventStatus.ONGOING,
        event_model_1.EventStatus.COMPLETED,
        event_model_1.EventStatus.CANCELLED
    ]).default(event_model_1.EventStatus.DRAFT),
    startDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'Start date must be a valid date' }),
    endDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), { message: 'End date must be a valid date' }),
    location: locationSchema,
    capacity: zod_1.z.number().int()
        .refine(value => value >= 30, { message: 'Minimum event capacity is 30' })
        .refine(value => value <= 5000, { message: 'Maximum event capacity is 5000' })
        .optional(),
    ticketPrice: zod_1.z.number().min(0).optional()
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
    location: locationSchema.partial().optional(),
    capacity: zod_1.z.number().int()
        .refine(value => value >= 30, { message: 'Minimum event capacity is 30' })
        .refine(value => value <= 5000, { message: 'Maximum event capacity is 5000' })
        .optional(),
    ticketPrice: zod_1.z.number().min(0).optional()
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
