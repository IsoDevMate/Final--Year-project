import { z } from 'zod';
import { Types } from 'mongoose';


const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};

// Media attachment validation schema
const mediaAttachmentSchema = z.object({
  type: z.enum(['image', 'audio', 'video', 'document']),
  url: z.string().url('Invalid URL format'),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  storageRef: z.string().optional(),
  caption: z.string().optional(),
});

// Note ID validation schema
export const noteIdSchema = z.object({
  id: z.string().refine(isValidObjectId, {
    message: 'Invalid note ID format'
  })
});

// Create note validation schema
export const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
  content: z.string().min(1, 'Content is required'),
  event: z.string().refine(isValidObjectId, {
    message: 'Invalid event ID format'
  }),
  session: z.string().refine(isValidObjectId, {
    message: 'Invalid session ID format'
  }).optional(),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().optional().default(true),
});

// Update note validation schema
export const updateNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

// Query parameters validation schema
export const noteQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  event: z.string().refine(isValidObjectId, {
    message: 'Invalid event ID format'
  }).optional(),
  session: z.string().refine(isValidObjectId, {
    message: 'Invalid session ID format'
  }).optional(),
  searchTerm: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().optional(),
});

// Media attachment validation schema
export const mediaAttachmentUploadSchema = z.object({
  noteId: z.string().refine(isValidObjectId, {
    message: 'Invalid note ID format'
  }),
  fileType: z.enum(['image', 'audio', 'video', 'document']),
  caption: z.string().optional(),
});

// Media attachment removal validation schema
export const mediaAttachmentRemovalSchema = z.object({
  attachmentId: z.string().refine(isValidObjectId, {
    message: 'Invalid attachment ID format'
  }),
});

// Note sharing validation schema
export const noteShareSchema = z.object({
  userIds: z.array(z.string().refine(isValidObjectId, {
    message: 'Invalid user ID format'
  })).min(1, 'At least one user ID is required'),
});

// Export types based on schemas
export type CreateNoteDto = z.infer<typeof createNoteSchema>;
export type UpdateNoteDto = z.infer<typeof updateNoteSchema>;
export type NoteQueryDto = z.infer<typeof noteQuerySchema>;
export type MediaAttachmentDto = z.infer<typeof mediaAttachmentSchema>;
