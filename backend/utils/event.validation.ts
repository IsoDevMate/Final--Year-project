import { z } from 'zod';
import { EventType, EventStatus } from '../models/event.model';

// Location schema
const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional()
});

// Create event schema
export const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum([
    EventType.CONFERENCE,
    EventType.SEMINAR,
    EventType.WORKSHOP,
    EventType.EXPO,
    EventType.OTHER
  ]),
  status: z.enum([
    EventStatus.DRAFT,
    EventStatus.PUBLISHED,
    EventStatus.ONGOING,
    EventStatus.COMPLETED,
    EventStatus.CANCELLED
  ]).default(EventStatus.DRAFT),
  startDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'Start date must be a valid date' }
  ),
  endDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'End date must be a valid date' }
  ),
  location: locationSchema,
  capacity: z.number().int().positive().optional(),
  ticketPrice: z.number().min(0).optional()
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  {
    message: 'End date must be after start date',
    path: ['endDate']
  }
);

// Update event schema
export const updateEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  type: z.enum([
    EventType.CONFERENCE,
    EventType.SEMINAR,
    EventType.WORKSHOP,
    EventType.EXPO,
    EventType.OTHER
  ]).optional(),
  status: z.enum([
    EventStatus.DRAFT,
    EventStatus.PUBLISHED,
    EventStatus.ONGOING,
    EventStatus.COMPLETED,
    EventStatus.CANCELLED
  ]).optional(),
  startDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'Start date must be a valid date' }
  ).optional(),
  endDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'End date must be a valid date' }
  ).optional(),
  location: locationSchema.partial().optional(),
  capacity: z.number().int().positive().optional(),
  ticketPrice: z.number().min(0).optional()
});

// Event query schema
export const eventQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  title: z.string().optional(),
  type: z.enum([
    EventType.CONFERENCE,
    EventType.SEMINAR,
    EventType.WORKSHOP,
    EventType.EXPO,
    EventType.OTHER
  ]).optional(),
  status: z.enum([
    EventStatus.DRAFT,
    EventStatus.PUBLISHED,
    EventStatus.ONGOING,
    EventStatus.COMPLETED,
    EventStatus.CANCELLED
  ]).optional(),
  startDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'Start date must be a valid date' }
  ).optional(),
  endDate: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    { message: 'End date must be a valid date' }
  ).optional(),
  city: z.string().optional(),
  organizer: z.string().optional()
});

// Event ID schema
export const eventIdSchema = z.object({
  id: z.string().refine(
    (id) => /^[0-9a-fA-F]{24}$/.test(id),
    { message: 'Invalid event ID format' }
  )
});
