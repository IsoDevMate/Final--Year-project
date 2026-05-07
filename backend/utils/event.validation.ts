import { z } from 'zod';
import { EventType, EventStatus } from '../models/event.model';

// Location schema
const locationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(100),
  address: z.string().max(200).optional().default(''),
  city: z.string().min(1, 'City is required').max(50),
  country: z.string().min(1, 'Country is required').max(50),
  mapLink: z.string().url().optional().or(z.literal('')),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).nullable().optional()
});

// Create event schema
export const createEventSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description cannot exceed 1000 characters'),
  type: z.enum([
    EventType.CONFERENCE,
    EventType.SEMINAR,
    EventType.WORKSHOP,
    EventType.EXPO,
    EventType.OTHER
  ], { errorMap: () => ({ message: 'Event type must be one of: conference, seminar, workshop, expo, other' }) }),
  status: z.enum([
    EventStatus.DRAFT,
    EventStatus.PUBLISHED,
    EventStatus.ONGOING,
    EventStatus.COMPLETED,
    EventStatus.CANCELLED
  ], { errorMap: () => ({ message: 'Event status must be one of: draft, published, ongoing, completed, cancelled' }) }).default(EventStatus.DRAFT),
  startDate: z.string()
    .min(1, 'Start date is required')
    .refine(
      (date) => !isNaN(Date.parse(date)),
      { message: 'Start date must be a valid date format (YYYY-MM-DD or ISO string)' }
    )
    .refine(
      (date) => new Date(date) > new Date(),
      { message: 'Start date must be in the future' }
    ),
  endDate: z.string()
    .min(1, 'End date is required')
    .refine(
      (date) => !isNaN(Date.parse(date)),
      { message: 'End date must be a valid date format (YYYY-MM-DD or ISO string)' }
    ),
  location: locationSchema,
  capacity: z.number()
    .int('Capacity must be a whole number')
    .min(30, 'Minimum event capacity is 30 people')
    .max(5000, 'Maximum event capacity is 5000 people'),
  ticketPrice: z.number()
    .min(0, 'Ticket price cannot be negative')
    .max(10000, 'Ticket price cannot exceed $10,000')
    .optional(),
  // Allow these fields but ignore them (they shouldn't be sent by client)
  coverImage: z.any().optional(),
  sessions: z.any().optional(),
  attendees: z.any().optional()
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
   capacity: z.number()
    .int('Capacity must be a whole number')
    .min(30, 'Minimum event capacity is 30 people')
    .max(5000, 'Maximum event capacity is 5000 people')
    .optional(),
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
