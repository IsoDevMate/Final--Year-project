import { Request, Response } from 'express';
import { sessionService } from '../services/session service';
import { AppError } from '../utils/errors.utils';
import { CreateSessionDto, UpdateSessionDto, SessionMaterialDto } from '../interfaces/session.interface';

export class SessionController {
  static async createSession(req: Request, res: Response) {
    try {
      const sessionData: CreateSessionDto = req.body;

      // If the request has a user object (from auth middleware), set the speaker userId
      if (req.user && sessionData.speaker && !sessionData.speaker.userId) {
        sessionData.speaker.userId = (req.user as any)._id;
      }

      const session = await sessionService.createSession(sessionData);

      return res.status(201).json({
        success: true,
        data: session,
        message: 'Session created successfully'
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
        message: 'Failed to create session'
      });
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
      const updateData: UpdateSessionDto = req.body;

      const session = await sessionService.updateSession(sessionId, updateData);

      return res.status(200).json({
        success: true,
        data: session,
        message: 'Session updated successfully'
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
        message: 'Failed to update session'
      });
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
