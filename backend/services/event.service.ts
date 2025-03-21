import { Types } from 'mongoose';
import { Event } from '../models/event.model';
import { AppError } from '../utils/errors.utils';
import { CreateEventDto, UpdateEventDto, EventQueryDto } from '../interfaces/event.interface';

export class EventService {
  async createEvent(eventData: CreateEventDto): Promise<Event> {
    try {
      const event = new Event(eventData);
      await event.save();
      return event;
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to create event', 500);
    }
  }

  async getEvents(queryParams: EventQueryDto): Promise<{ events: Event[], total: number, page: number, limit: number }> {
    try {
      const {
        page = 1,
        limit = 10,
        title,
        type,
        status,
        startDate,
        endDate,
        city,
        organizer
      } = queryParams;

      const skip = (page - 1) * limit;

      // Build query filters
      const filter: any = {};

      if (title) filter.title = { $regex: title, $options: 'i' };
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (city) filter['location.city'] = { $regex: city, $options: 'i' };
      if (organizer) filter.organizer = organizer;

      // Date range filter
      if (startDate || endDate) {
        filter.startDate = {};
        if (startDate) filter.startDate.$gte = new Date(startDate);
        if (endDate) filter.endDate = { $lte: new Date(endDate) };
      }

      // Execute query with pagination
      const events = await Event.find(filter)
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit)
        .populate('organizer', 'firstName lastName email');

      // Get total count for pagination
      const total = await Event.countDocuments(filter);

      return {
        events,
        total,
        page: Number(page),
        limit: Number(limit)
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to retrieve events', 500);
    }
  }

  async getEventById(eventId: string): Promise<Event | null> {
    try {
      if (!Types.ObjectId.isValid(eventId)) {
        throw new AppError('Invalid event ID', 400);
      }

      return await Event.findById(eventId)
        .populate('organizer', 'firstName lastName email')
        .populate('sessions')
        .populate('attendees', 'firstName lastName email');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve event', 500);
    }
  }

  async updateEvent(eventId: string, updateData: UpdateEventDto): Promise<Event | null> {
    try {
      if (!Types.ObjectId.isValid(eventId)) {
        throw new AppError('Invalid event ID', 400);
      }

      const event = await Event.findByIdAndUpdate(
        eventId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      return event;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to update event', 500);
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(eventId)) {
        throw new AppError('Invalid event ID', 400);
      }

      const result = await Event.findByIdAndDelete(eventId);

      if (!result) {
        throw new AppError('Event not found', 404);
      }

      // TODO: Delete associated sessions, notes, and other related data
      // This would be implemented when those services are created
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete event', 500);
    }
  }

  async registerAttendee(eventId: string, userId: string): Promise<Event | null> {
    try {
      if (!Types.ObjectId.isValid(eventId) || !Types.ObjectId.isValid(userId)) {
        throw new AppError('Invalid ID', 400);
      }

      // Check if event exists
      const event = await Event.findById(eventId);
      if (!event) {
        throw new AppError('Event not found', 404);
      }

      // Check if user is already registered
      if (event.attendees.includes(new Types.ObjectId(userId))) {
        throw new AppError('User already registered for this event', 400);
      }

      // Check if event has reached capacity
      if (event.capacity && event.attendees.length >= event.capacity) {
        throw new AppError('Event has reached maximum capacity', 400);
      }

      // Add user to attendees
      event.attendees.push(new Types.ObjectId(userId));
      await event.save();

      return event;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to register for event', 500);
    }
  }

  async unregisterAttendee(eventId: string, userId: string): Promise<Event | null> {
  try {
    if (!Types.ObjectId.isValid(eventId) || !Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid ID', 400);
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Check if user is registered
    if (!event.attendees.some(id => id.toString() === userId)) {
      throw new AppError('User is not registered for this event', 400);
    }

    // Remove user from attendees
    event.attendees = event.attendees.filter(id => id.toString() !== userId);
    await event.save();

    return event;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to unregister from event', 500);
  }
  }


  async uploadCoverImage(eventId: string, imageUrl: string): Promise<Event | null> {
    try {
      if (!Types.ObjectId.isValid(eventId)) {
        throw new AppError('Invalid event ID', 400);
      }

      const event = await Event.findByIdAndUpdate(
        eventId,
        { $set: { coverImage: imageUrl } },
        { new: true }
      );

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      return event;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to upload cover image', 500);
    }
  }
}
