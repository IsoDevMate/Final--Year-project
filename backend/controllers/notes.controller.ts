import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { NoteService } from '../services/notes.service';
import {
  createNoteSchema,
  updateNoteSchema,
  noteQuerySchema,
  noteIdSchema
} from '../utils/notes.validation.utils';
import { ResponseUtil } from '../utils/response.utils';
import { AppError } from '../utils/errors.utils';

export class NoteController {
  private static noteService: NoteService = new NoteService(); //research  moore why this works like this...

   static async createNote(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createNoteSchema.parse(req.body);

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      // Get user ID from request (set by auth middleware)
      const userId = (req.user as any).userId;

      const noteData = { ...validatedData, eventId: validatedData.event };
      const note = await NoteController.noteService.createNote(noteData, userId);

      return ResponseUtil.success(res, 201, note, 'Note created successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

   static async getNotes(req: Request, res: Response, next: NextFunction) {
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

  // static async getNoteById(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { id } = noteIdSchema.parse(req.params);
  //     // Check if user object exists (should be set by auth middleware)
  //     if (!req.user) {
  //       return ResponseUtil.error(res, 401, 'Not authenticated');
  //     }

  //     const userId = (req.user as any).userId;

  //     const note = await this.noteService.getNoteById(id, userId);

  //     if (!note) {
  //       return ResponseUtil.error(res, 404, 'Note not found');
  //     }

  //     return ResponseUtil.success(res, 200, note, 'Note retrieved successfully');
  //   } catch (error) {
  //     if (error instanceof ZodError) {
  //       return ResponseUtil.error(res, 400, error.errors[0].message);
  //     }
  //     next(error);
  //   }
  // }

  static async getNoteById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = noteIdSchema.parse(req.params);
    if (!req.user) {
      return ResponseUtil.error(res, 401, 'Not authenticated');
    }

    const userId = (req.user as any).userId;

    try {
      const note = await this.noteService.getNoteById(id, userId);
      return ResponseUtil.success(res, 200, note, 'Note retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return ResponseUtil.error(res, error.statusCode || 500, error.message);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return ResponseUtil.error(res, 400, error.errors[0].message);
    }
    next(error);
  }
}

  static async updateNote(req: Request, res: Response, next: NextFunction) {
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

  static async deleteNote(req: Request, res: Response, next: NextFunction) {
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



  static async uploadAttachment(req: Request, res: Response, next: NextFunction) {
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
    const fileType = req.file.mimetype.split('/')[0] as 'image' | 'audio' | 'video' | 'document';

    // Create a Buffer from the file
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    const caption = req.body.caption || '';

    const updatedNote = await this.noteService.addMediaAttachment(
      id,
      userId,
      fileBuffer,
      fileName,
      fileType,
      caption
    );

    return ResponseUtil.success(res, 200, updatedNote, 'Attachment uploaded successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      return ResponseUtil.error(res, 400, error.errors[0].message);
    }
    next(error);
  }
}


static async removeAttachment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = noteIdSchema.parse(req.params);
    const { attachmentId } = req.body;

    if (!attachmentId) {
      return ResponseUtil.error(res, 400, 'Attachment ID is required');
    }

    // Check if user object exists (should be set by auth middleware)
    if (!req.user) {
      return ResponseUtil.error(res, 401, 'Not authenticated');
    }

    const userId = (req.user as any).userId;

    const updatedNote = await this.noteService.removeMediaAttachment(id, attachmentId, userId);

    return ResponseUtil.success(res, 200, updatedNote, 'Attachment removed successfully');
  } catch (error) {
    if (error instanceof ZodError) {
      return ResponseUtil.error(res, 400, error.errors[0].message);
    }
    next(error);
  }
}

  static async shareNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = noteIdSchema.parse(req.params);
      const { userId } = req.body;

      if (!userId) {
        return ResponseUtil.error(res, 400, 'User ID is required');
      }

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const currentUserId = (req.user as any).userId;

      const updatedNote = await this.noteService.shareNote(id, userId, currentUserId);

      return ResponseUtil.success(res, 200, updatedNote, 'Note shared successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }

  static async unshareNote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = noteIdSchema.parse(req.params);
      const { userId } = req.body;

      if (!userId) {
        return ResponseUtil.error(res, 400, 'User ID is required');
      }

      // Check if user object exists (should be set by auth middleware)
      if (!req.user) {
        return ResponseUtil.error(res, 401, 'Not authenticated');
      }

      const currentUserId = (req.user as any).userId;

      const updatedNote = await this.noteService.unshareNote(id, userId, currentUserId);

      return ResponseUtil.success(res, 200, updatedNote, 'Note unshared successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        return ResponseUtil.error(res, 400, error.errors[0].message);
      }
      next(error);
    }
  }
}
