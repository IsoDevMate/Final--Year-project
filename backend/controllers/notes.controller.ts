import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { NoteService } from '../services/note.service';
import {
  createNoteSchema,
  updateNoteSchema,
  noteQuerySchema,
  noteIdSchema
} from '../utils/note.validation.utils';
import { ResponseUtil } from '../utils/response.utils';
import { AppError } from '../utils/errors.utils';

export class NoteController {
  private noteService: NoteService;

  constructor() {
    this.noteService = new NoteService();
  }

  async createNote(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createNoteSchema.parse(req.body);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      // Get user ID from request (set by auth middleware)
      const userId = (req.user as any).userId;

      const note = await this.noteService.createNote(validatedData, userId);

      return ResponseUtil.success(res, 201, note, 'Note created successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async getNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = noteQuerySchema.parse(req.query);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;

      const notes = await this.noteService.getNotes(validatedQuery, userId);

      return ResponseUtil.success(res, 200, notes, 'Notes retrieved successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async getNoteById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = noteIdSchema.parse(req.params);
      const note = await this.noteService.getNoteById(id);

      if (!note) {
        return ResponseUtil.error(res, 404, 'Note not found');
      }

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;

      // Users can only view their own notes or public notes
      if (note.userId.toString() !== userId && !note.isPublic) {
        return ResponseUtil.error(res, 403, 'You do not have permission to view this note');
      }

      return ResponseUtil.success(res, 200, note, 'Note retrieved successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async updateNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = noteIdSchema.parse(req.params);
      const validatedData = updateNoteSchema.parse(req.body);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;

      const updatedNote = await this.noteService.updateNote(id, validatedData, userId);

      return ResponseUtil.success(res, 200, updatedNote, 'Note updated successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async deleteNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = noteIdSchema.parse(req.params);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;

      await this.noteService.deleteNote(id, userId);

      return ResponseUtil.success(res, 200, null, 'Note deleted successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async uploadAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = noteIdSchema.parse(req.params);

      if (!req.file) {
        return ResponseUtil.error(res, 400, 'No file uploaded');
      }

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;

      // Determine file type based on MIME type
      const fileType = req.file.mimetype.split('/')[0];

      const attachment = {
        type: fileType,
        url: req.file.path,
        name: req.file.originalname,
        size: req.file.size
      };

      const updatedNote = await this.noteService.addAttachment(id, attachment, userId);

      return ResponseUtil.success(res, 200, updatedNote, 'Attachment uploaded successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  async removeAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = noteIdSchema.parse(req.params);
      const { url } = req.body;

      if (!url) {
        return ResponseUtil.error(res, 400, 'Attachment URL is required');
      }

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const userId = (req.user as any).userId;

      const updatedNote = await this.noteService.removeAttachment(id, url, userId);

      return ResponseUtil.success(res, 200, updatedNote, 'Attachment removed successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }
}
