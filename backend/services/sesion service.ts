import { Types } from 'mongoose';
import { Session, SessionStatus } from '../models/session.model';
import { AppError } from '../utils/errors.utils';
import {
  CreateSessionDto,
  UpdateSessionDto,
  SessionQueryDto,
  SessionMaterialDto
} from '../interfaces/session.interface';

export class SessionService {
  async createSession(sessionData: CreateSessionDto): Promise<Session> {
    try {
      const session = new Session(sessionData);
      await session.save();

      // Update the event to include this session
      if (sessionData.event) {
        const Event = require('../models/event.model').Event;
        await Event.findByIdAndUpdate(
          sessionData.event,
          { $push: { sessions: session._id } }
        );
      }

      return session;
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to create session', 500);
    }
  }

  async getSessions(queryParams: SessionQueryDto): Promise<{ sessions: Session[], total: number, page: number, limit: number }> {
    try {
      const {
        page = 1,
        limit = 10,
        title,
        event,
        speaker,
        status,
        startDate,
        endDate,
        isLiveStreamed,
        tags
      } = queryParams;

      const skip = (page - 1) * limit;

      // Build query filters
      const filter: any = {};

      if (title) filter.title = { $regex: title, $options: 'i' };
      if (event) filter.event = new Types.ObjectId(event);
      if (speaker) filter['speaker.name'] = { $regex: speaker, $options: 'i' };
      if (status) filter.status = status;
      if (isLiveStreamed !== undefined) filter.isLiveStreamed = isLiveStreamed;
      if (tags && tags.length > 0) filter.tags = { $in: tags };

      // Date range filter
      if (startDate) filter.startTime = { $gte: new Date(startDate) };
      if (endDate) filter.endTime = { $lte: new Date(endDate) };

      // Execute query with pagination
      const sessions = await Session.find(filter)
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(limit)
        .populate('event', 'title')
        .populate('speaker.userId', 'firstName lastName email profileImage');

      // Get total count for pagination
      const total = await Session.countDocuments(filter);

      return {
        sessions,
        total,
        page: Number(page),
        limit: Number(limit)
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to retrieve sessions', 500);
    }
  }

  async getSessionById(sessionId: string): Promise<Session | null> {
    try {
      if (!Types.ObjectId.isValid(sessionId)) {
        throw new AppError('Invalid session ID', 400);
      }

      return await Session.findById(sessionId)
        .populate('event', 'title description startDate endDate location')
        .populate('speaker.userId', 'firstName lastName email profileImage bio')
        .populate('attendees', 'firstName lastName email');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve session', 500);
    }
  }

  async updateSession(sessionId: string, updateData: UpdateSessionDto): Promise<Session | null> {
    try {
      if (!Types.ObjectId.isValid(sessionId)) {
        throw new AppError('Invalid session ID', 400);
      }

      const session = await Session.findByIdAndUpdate(
        sessionId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!session) {
        throw new AppError('Session not found', 404);
      }

      return session;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to update session', 500);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(sessionId)) {
        throw new AppError('Invalid session ID', 400);
      }

      const session = await Session.findById(sessionId);
      if (!session) {
        throw new AppError('Session not found', 404);
      }

      // Remove the session from the event
      const Event = require('../models/event.model').Event;
      await Event.findByIdAndUpdate(
        session.event,
        { $pull: { sessions: sessionId } }
      );

      // Delete the session
      await Session.findByIdAndDelete(sessionId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete session', 500);
    }
  }

  async registerAttendee(sessionId: string, userId: string): Promise<Session | null> {
    try {
      if (!Types.ObjectId.isValid(sessionId) || !Types.ObjectId.isValid(userId)) {
        throw new AppError('Invalid ID', 400);
      }

      // Check if session exists
      const session = await Session.findById(sessionId);
      if (!session) {
        throw new AppError('Session not found', 404);
      }

      // Check if user is already registered
      if (session.attendees.includes(new Types.ObjectId(userId))) {
        throw new AppError('User already registered for this session', 400);
      }

      // Check if session has reached capacity
      if (session.capacity && session.attendees.length >= session.capacity) {
        throw new AppError('Session has reached maximum capacity', 400);
      }

      // Add user to attendees
      session.attendees.push(new Types.ObjectId(userId));
      await session.save();

      return session;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to register for session', 500);
    }
  }

  async addSessionMaterial(sessionId: string, material: SessionMaterialDto): Promise<Session | null> {
    try {
      if (!Types.ObjectId.isValid(sessionId)) {
        throw new AppError('Invalid session ID', 400);
      }

      const session = await Session.findById(sessionId);
      if (!session) {
        throw new AppError('Session not found', 404);
      }

      // Add material URL to session materials
      if (!session.materials) {
        session.materials = [];
      }
      session.materials.push(material.url);
      await session.save();

      return session;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to add session material', 500);
    }
  }

  async updateStreamStatus(sessionId: string, isLiveStreamed: boolean, streamUrl?: string): Promise<Session | null> {
    try {
      if (!Types.ObjectId.isValid(sessionId)) {
        throw new AppError('Invalid session ID', 400);
      }

      const updateData: any = { isLiveStreamed };
      if (streamUrl) {
        updateData.streamUrl = streamUrl;
      }

      const session = await Session.findByIdAndUpdate(
        sessionId,
        { $set: updateData },
        { new: true }
      );

      if (!session) {
        throw new AppError('Session not found', 404);
      }

      return session;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update stream status', 500);
    }
  }

  async getSessionsByEventId(eventId: string): Promise<Session[]> {
    try {
      if (!Types.ObjectId.isValid(eventId)) {
        throw new AppError('Invalid event ID', 400);
      }

      return await Session.find({ event: new Types.ObjectId(eventId) })
        .sort({ startTime: 1 })
        .populate('speaker.userId', 'firstName lastName email');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve sessions for this event', 500);
    }
  }
}

export const sessionService = new SessionService();
