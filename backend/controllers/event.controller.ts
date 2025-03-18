import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { EventService } from '../services/event.service';
import {
  createEventSchema,
  updateEventSchema,
  eventQuerySchema,
  eventIdSchema
} from '../utils/event.validation.utils';
import { ResponseUtil } from '../utils/response.utils';
import { AppError } from '../utils/errors.utils';
import { UserRole } from '../models/user.model';

export class EventController {
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService();
  }

  async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createEventSchema.parse(req.body);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      // Get user ID from request (set by auth middleware)
      const organizer = (req.user as any).userId;

      const event = await this.eventService.createEvent({
        ...validatedData,
        organizer
      });

      return ResponseUtil.success(res, 201, event, 'Event created successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = eventQuerySchema.parse(req.query);
      const events = await this.eventService.getEvents(validatedQuery);

      return ResponseUtil.success(res, 200, events, 'Events retrieved successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async getEventById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = eventIdSchema.parse(req.params);
      const event = await this.eventService.getEventById(id);

      if (!event) {
        return ResponseUtil.error(res, 404, 'Event not found');
      }

      return ResponseUtil.success(res, 200, event, 'Event retrieved successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = eventIdSchema.parse(req.params);
      const validatedData = updateEventSchema.parse(req.body);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;
      const userRole = (req.user as any).role;

      // Get the event to check ownership
      const event = await this.eventService.getEventById(id);

      if (!event) {
        return ResponseUtil.error(res, 404, 'Event not found');
      }

      // Check if user is the organizer or an admin
      if (event.organizer.toString() !== userId && userRole !== UserRole.ADMIN) {
        return ResponseUtil.error(res, 403, 'You do not have permission to update this event');
      }

      const updatedEvent = await this.eventService.updateEvent(id, validatedData);

      return ResponseUtil.success(res, 200, updatedEvent, 'Event updated successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = eventIdSchema.parse(req.params);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;
      const userRole = (req.user as any).role;

      // Get the event to check ownership
      const event = await this.eventService.getEventById(id);

      if (!event) {
        return ResponseUtil.error(res, 404, 'Event not found');
      }

      // Check if user is the organizer or an admin
      if (event.organizer.toString() !== userId && userRole !== UserRole.ADMIN) {
        return ResponseUtil.error(res, 403, 'You do not have permission to delete this event');
      }

      await this.eventService.deleteEvent(id);

      return ResponseUtil.success(res, 200, null, 'Event deleted successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async registerForEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = eventIdSchema.parse(req.params);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;

      const registrationResult = await this.eventService.registerAttendee(id, userId);

      return ResponseUtil.success(res, 200, registrationResult, 'Registered for event successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async uploadEventCoverImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = eventIdSchema.parse(req.params);

      if (!req.file) {
        return ResponseUtil.error(res, 400, 'No file uploaded');
      }

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;
      const userRole = (req.user as any).role;

      // Get the event to check ownership
      const event = await this.eventService.getEventById(id);

      if (!event) {
        return ResponseUtil.error(res, 404, 'Event not found');
      }

      // Check if user is the organizer or an admin
      if (event.organizer.toString() !== userId && userRole !== UserRole.ADMIN) {
        return ResponseUtil.error(res, 403, 'You do not have permission to update this event');
      }

      // Assume the file path is stored in req.file.path
      const imageUrl = req.file.path;

      const updatedEvent = await this.eventService.uploadCoverImage(id, imageUrl);

      return ResponseUtil.success(res, 200, updatedEvent, 'Event cover image uploaded successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }
}
