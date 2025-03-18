import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Livestream, StreamStatus } from '../models/livestream.model';
import { Event } from '../models/event.model';
import { User } from '../models/user.model';
import { AppError } from '../utils/errors.utils';
import { CreateLivestreamDto, UpdateLivestreamDto, LivestreamQueryDto } from '../interfaces/livestream.interface';

export class LivestreamService {
  async createLivestream(streamerId: string, livestreamData: CreateLivestreamDto): Promise<Livestream> {
    try {
      // Validate event exists
      if (!Types.ObjectId.isValid(livestreamData.eventId)) {
        throw new AppError('Invalid event ID', 400);
      }

      const event = await Event.findById(livestreamData.eventId);
      if (!event) {
        throw new AppError('Event not found', 404);
      }

      // Validate session belongs to event
      if (!Types.ObjectId.isValid(livestreamData.sessionId)) {
        throw new AppError('Invalid session ID', 400);
      }

      // For now, we'll skip session validation since we don't have that model yet
      // In a real implementation, you'd verify the session exists and belongs to the event

      // Validate user exists
      if (!Types.ObjectId.isValid(streamerId)) {
        throw new AppError('Invalid streamer ID', 400);
      }

      const user = await User.findById(streamerId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate a unique room ID
      const roomId = uuidv4();

      const livestream = new Livestream({
        ...livestreamData,
        streamerId: new Types.ObjectId(streamerId),
        roomId,
        viewerCount: 0,
        status: StreamStatus.SCHEDULED
      });

      await livestream.save();
      return livestream;
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to create livestream', 500);
    }
  }

  async getLivestreams(queryParams: LivestreamQueryDto): Promise<{
    livestreams: Livestream[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        eventId,
        sessionId,
        streamerId,
        status,
        startDate,
        endDate
      } = queryParams;

      const skip = (page - 1) * limit;

      // Build query filters
      const filter: any = {};

      if (eventId) {
        if (!Types.ObjectId.isValid(eventId)) {
          throw new AppError('Invalid event ID', 400);
        }
        filter.eventId = eventId;
      }

      if (sessionId) {
        if (!Types.ObjectId.isValid(sessionId)) {
          throw new AppError('Invalid session ID', 400);
        }
        filter.sessionId = sessionId;
      }

      if (streamerId) {
        if (!Types.ObjectId.isValid(streamerId)) {
          throw new AppError('Invalid streamer ID', 400);
        }
        filter.streamerId = streamerId;
      }

      if (status) {
        filter.status = status;
      }

      // Date range filter for scheduled start time
      if (startDate || endDate) {
        filter.scheduledStartTime = {};
        if (startDate) filter.scheduledStartTime.$gte = new Date(startDate);
        if (endDate) filter.scheduledStartTime.$lte = new Date(endDate);
      }

      // Execute query with pagination
      const livestreams = await Livestream.find(filter)
        .sort({ scheduledStartTime: 1 })
        .skip(skip)
        .limit(limit)
        .populate('streamerId', 'firstName lastName email profileImage')
        .populate('eventId', 'title')
        .populate('sessionId', 'title');

      // Get total count for pagination
      const total = await Livestream.countDocuments(filter);

      return {
        livestreams,
        total,
        page: Number(page),
        limit: Number(limit)
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve livestreams', 500);
    }
  }

  async getLivestreamById(livestreamId: string): Promise<Livestream | null> {
    try {
      if (!Types.ObjectId.isValid(livestreamId)) {
        throw new AppError('Invalid livestream ID', 400);
      }

      return await Livestream.findById(livestreamId)
        .populate('streamerId', 'firstName lastName email profileImage')
        .populate('eventId', 'title')
        .populate('sessionId', 'title');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve livestream', 500);
    }
  }

  async updateLivestream(livestreamId: string, streamerId: string, updateData: UpdateLivestreamDto): Promise<Livestream | null> {
    try {
      if (!Types.ObjectId.isValid(livestreamId)) {
        throw new AppError('Invalid livestream ID', 400);
      }

      // Find the livestream
      const livestream = await Livestream.findById(livestreamId);
      if (!livestream) {
        throw new AppError('Livestream not found', 404);
      }

      // Verify the user is the streamer
      if (livestream.streamerId.toString() !== streamerId) {
        throw new AppError('You do not have permission to update this livestream', 403);
      }

      // Apply updates
      Object.assign(livestream, updateData);
      await livestream.save();

      return livestream;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
            }
            throw new AppError('Failed to update livestream', 500);
        }
    }
