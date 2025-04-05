import { Types } from 'mongoose';
import { Event } from '../models/event.model';
import { AppError } from '../utils/errors.utils';
import { CreateEventDto, UpdateEventDto, EventQueryDto } from '../interfaces/event.interface';
import { QRCodeService } from './qrcode.service';
import { EmailService } from './email.service';
import { MpesaPayment } from '../models/mpesapayment.model';

export class EventService {
  private qrCodeService: QRCodeService;
  private emailService: EmailService;

  constructor() {
    this.qrCodeService = new QRCodeService();
    this.emailService = new EmailService();
  }

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

      // Delete associated sessions
      await Event.updateMany(
        { _id: eventId },
        { $unset: { sessions: "" } }
      );

      // Delete associated notes or other related data
      const Note = await import('../models/note.model').then(module => module.Note);
      await Note.deleteMany({ eventId });



    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete event', 500);
    }
  }




async registerAttendee(eventId: string, userId: string): Promise<{ event: Event | null, qrCodeUrl: string }> {
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

    // If event has a ticket price, check for payment
    if (event.ticketPrice && event.ticketPrice > 0) {
      // Import here to avoid circular dependency
      const MpesaPayment = await import('../models/mpesapayment.model').then(module => module.MpesaPayment);
      const { MpesaPaymentStatus } = await import('../models/mpesapayment.model');

      // Check if payment exists and is completed
      const payment = await MpesaPayment.findOne({
        eventId: new Types.ObjectId(eventId),
        userId: new Types.ObjectId(userId),
        status: MpesaPaymentStatus.COMPLETED
      });

      if (!payment) {
        throw new AppError('Payment required to register for this event', 400);
      }
    }

    // Add user to attendees
    event.attendees.push(new Types.ObjectId(userId));
    await event.save();

    // Generate QR code token and QR code
    const token = this.qrCodeService.generateTokenForEventAttendee(eventId, userId);
    const qrCodeUrl = await this.qrCodeService.generateQRCode(token);

    // Get user details for sending email
    const populatedEvent = await Event.findById(eventId)
      .populate({
        path: 'attendees',
        match: { _id: userId },
        select: 'email firstName lastName'
      });

    if (!populatedEvent) {
      throw new AppError('Event not found after population', 404);
    }

    // Find the specific attendee in the populated attendees array
    const attendee = populatedEvent.attendees.find(a => a._id.toString() === userId) as unknown as { email: string, firstName: string, lastName: string };

    // Send email with QR code if we have user's email
    if (attendee) {
      await EmailService.sendEventRegistrationEmail(
        attendee.email,
        {
          eventName: event.title,
          eventDate: event.startDate.toDateString(),
          eventLocation: `${event.location.name}, ${event.location.city}`,
          qrCodeUrl,
          attendeeName: `${attendee.firstName} ${attendee.lastName}`
        }
      );
    }

    return { event, qrCodeUrl };
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

      // Note: QR code is now invalid because it won't match any registration
      // No need to explicitly invalidate it as the user is no longer in attendees list

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

  async verifyEventAttendee(qrCodeToken: string): Promise<{ isValid: boolean; eventDetails?: any; attendeeDetails?: any }> {
    try {
      // Verify the token from QR code
      const decodedToken = this.qrCodeService.verifyToken(qrCodeToken);

      if (!decodedToken) {
        return { isValid: false };
      }

      // Check if user is still registered for the event
      const event = await Event.findById(decodedToken.eventId)
        .populate('organizer', 'firstName lastName email')
        .select('title startDate endDate location status type');

      if (!event) {
        return { isValid: false };
      }

      // Check if user is in attendees list
      const isAttending = event.attendees.some(
        id => id.toString() === decodedToken.userId
      );

      if (!isAttending) {
        return { isValid: false };
      }

      // Get attendee details
      const attendee = await import('../models/user.model').then(module => {
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
    } catch (error) {
      return { isValid: false };
    }
  }

  async getEventsihvaeRegisteredasauser(userId: string): Promise<Event[]> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new AppError('Invalid user ID', 400);
      }

      const events = await Event.find({ attendees: userId })
        .populate('organizer', 'firstName lastName email')
        .populate('sessions')
        .populate('attendees', 'firstName lastName email');

      return events;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve registered events', 500);
    }
  }



static async getEventsByOrganizer(organizerId: string): Promise<Event[]> {
  try {
    if (!Types.ObjectId.isValid(organizerId)) {
      throw new AppError('Invalid organizer ID', 400);
    }

    const events = await Event.find({ organizer: organizerId })
      .populate('sessions')
      .sort({ startDate: -1 });

    return events;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to retrieve organizer events', 500);
  }
}

  static async getEventAttendees(eventId: string, requestingUserId: string): Promise<any[]> {
  try {
    if (!Types.ObjectId.isValid(eventId)) {
      throw new AppError('Invalid event ID', 400);
    }

    const event = await Event.findById(eventId);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Check if user is the organizer or admin
    if (event.organizer.toString() !== requestingUserId) {
      throw new AppError('Not authorized to view attendees', 403);
    }

    // Get detailed attendee information
    const populatedEvent = await Event.findById(eventId)
      .populate('attendees', 'firstName lastName email phone')
      .select('attendees');

    if (!populatedEvent) {
      throw new AppError('Event not found after population', 404);
    }

    return populatedEvent.attendees;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to retrieve event attendees', 500);
  }
}

  async getEventSessions(eventId: string): Promise<any[]> {
    try {
      if (!Types.ObjectId.isValid(eventId)) {
        throw new AppError('Invalid event ID', 400);
      }

      const event = await Event.findById(eventId)
        .populate('sessions')
        .select('sessions');

      if (!event) {
        throw new AppError('Event not found', 404);
      }

      return event.sessions;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve event sessions', 500);
    }
  }
}
