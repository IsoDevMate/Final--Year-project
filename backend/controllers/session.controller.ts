import { Request, Response } from 'express';
import { z } from 'zod';
import { sessionService } from '../services/session service';
import { AppError } from '../utils/errors.utils';
import { CreateSessionDto, UpdateSessionDto, SessionMaterialDto } from '../interfaces/session.interface';
import { Types } from 'mongoose';
import { SessionStatus } from '../models/session.model';

const sessionBodySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  eventId: z.string().refine(id => Types.ObjectId.isValid(id), 'Invalid event ID').optional(),
  event: z.string().refine(id => Types.ObjectId.isValid(id), 'Invalid event ID').optional(),
  startTime: z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid start time'),
  endTime: z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid end time'),
  location: z.string().max(200).optional().default(''),
  capacity: z.number().int().min(1).max(10000).optional(),
  speaker: z.object({
    name: z.string().min(1, 'Speaker name is required').max(100),
    title: z.string().max(100).optional(),
    company: z.string().max(100).optional(),
    bio: z.string().max(500).optional(),
    photoUrl: z.string().url().optional().or(z.literal('')),
    userId: z.string().optional(),
  }).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  isLiveStreamed: z.boolean().optional(),
  streamUrl: z.string().url().optional().or(z.literal('')),
}).refine(d => new Date(d.endTime) > new Date(d.startTime), {
  message: 'End time must be after start time', path: ['endTime']
});

const sessionUpdateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  startTime: z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid start time').optional(),
  endTime: z.string().refine(d => !isNaN(Date.parse(d)), 'Invalid end time').optional(),
  location: z.string().max(200).optional(),
  capacity: z.number().int().min(1).max(10000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  isLiveStreamed: z.boolean().optional(),
  streamUrl: z.string().url().optional().or(z.literal('')),
});

export class SessionController {
  static async createSession(req: Request, res: Response) {
    try {
      let parsed: any;
      try {
        parsed = sessionBodySchema.parse(req.body);
      } catch (e: any) {
        return res.status(400).json({ success: false, message: e.errors?.[0]?.message || 'Invalid session data' });
      }

      // Support both 'event' and 'eventId' field names from frontend
      const sessionData: CreateSessionDto = {
        ...parsed,
        event: parsed.event || parsed.eventId,
        status: SessionStatus.SCHEDULED,
      };

      if (req.user && sessionData.speaker && !sessionData.speaker.userId) {
        sessionData.speaker.userId = (req.user as any)._id;
      }

      const session = await sessionService.createSession(sessionData);
      return res.status(201).json({ success: true, data: session, message: 'Session created successfully' });
    } catch (error) {
      if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, message: error.message });
      return res.status(500).json({ success: false, message: 'Failed to create session' });
    }
  }

  static async getSessions(req: Request, res: Response) {
    try {
      const result = await sessionService.getSessions(req.query);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Sessions retrieved successfully'
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve sessions'
      });
    }
  }

  static async getSessionById(req: Request, res: Response) {
    try {
      const sessionId = req.params.id;
      const session = await sessionService.getSessionById(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: session,
        message: 'Session retrieved successfully'
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve session'
      });
    }
  }

  static async updateSession(req: Request, res: Response) {
    try {
      const sessionId = req.params.id;
      if (!Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ success: false, message: 'Invalid session ID' });
      }

      let updateData: UpdateSessionDto;
      try {
        updateData = sessionUpdateSchema.parse(req.body) as UpdateSessionDto;
      } catch (e: any) {
        return res.status(400).json({ success: false, message: e.errors?.[0]?.message || 'Invalid session data' });
      }

      const session = await sessionService.updateSession(sessionId, updateData);
      return res.status(200).json({ success: true, data: session, message: 'Session updated successfully' });
    } catch (error) {
      if (error instanceof AppError) return res.status(error.statusCode).json({ success: false, message: error.message });
      return res.status(500).json({ success: false, message: 'Failed to update session' });
    }
  }

  static async deleteSession(req: Request, res: Response) {
    try {
      const sessionId = req.params.id;
      await sessionService.deleteSession(sessionId);

      return res.status(200).json({
        success: true,
        message: 'Session deleted successfully'
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to delete session'
      });
    }
  }

  static async registerForSession(req: Request, res: Response) {
    try {
      const sessionId = req.params.id;
      const userId = (req.user as any)._id;

      const session = await sessionService.registerAttendee(sessionId, userId);

      return res.status(200).json({
        success: true,
        data: session,
        message: 'Successfully registered for session'
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to register for session'
      });
    }
  }

  static async addSessionMaterial(req: Request, res: Response) {
    try {
      const sessionId = req.params.id;
      const material: SessionMaterialDto = req.body;

      const session = await sessionService.addSessionMaterial(sessionId, material);

      return res.status(200).json({
        success: true,
        data: session,
        message: 'Material added to session successfully'
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to add material to session'
      });
    }
  }

  static async toggleLiveStream(req: Request, res: Response) {
    try {
      const sessionId = req.params.id;
      const { isLiveStreamed, streamUrl } = req.body;

      const session = await sessionService.updateStreamStatus(sessionId, isLiveStreamed, streamUrl);

      return res.status(200).json({
        success: true,
        data: session,
        message: `Live stream ${isLiveStreamed ? 'started' : 'stopped'} successfully`
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to update live stream status'
      });
    }
  }

  static async getSessionsByEvent(req: Request, res: Response) {
    try {
      const eventId = req.params.eventId;
      const sessions = await sessionService.getSessionsByEventId(eventId);

      return res.status(200).json({
        success: true,
        data: sessions,
        message: 'Sessions retrieved successfully'
      });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve sessions for this event'
      });
    }
  }
}
