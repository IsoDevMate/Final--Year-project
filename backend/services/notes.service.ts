

import { Types } from 'mongoose';
import { Note } from '../models/note.model';
import { AppError } from '../utils/errors.utils';
import { StorageService } from './upload.service';
import { CreateNoteDto, UpdateNoteDto, NoteQueryDto } from '../interfaces/note.interface';

export interface MediaAttachment {
  _id?: Types.ObjectId;
  type: 'image' | 'audio' | 'video' | 'document';
  url: string;
  fileName: string;
  fileSize: number;
  caption?: string;
  createdAt: Date;
  storageRef?: string;
}

export class NoteService {
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  async createNote(noteData: CreateNoteDto, userId: string): Promise<Note> {
    try {
      const note = new Note({
        ...noteData,
        user: new Types.ObjectId(userId)
      });

      await note.save();
      return note;
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to create note', 500);
    }
  }

  async getNotes(queryParams: NoteQueryDto, userId: string): Promise<{
    notes: Note[];
    total: number;
    page: number;
    limit: number
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        eventId,
        sessionId,
        searchTerm,
        tags,
        isPublic
      } = queryParams;

      const skip = (page - 1) * limit;

      // Build query filters
      const filter: any = {};

      // Users can see their own notes and notes shared with them
      filter.$or = [
        { user: new Types.ObjectId(userId) },
        { isPrivate: false },
        { sharedWith: { $in: [new Types.ObjectId(userId)] } }
      ];

      if (eventId) filter.event = new Types.ObjectId(eventId);
      if (sessionId) filter.sessionId = new Types.ObjectId(sessionId);
      if (tags && tags.length > 0) filter.tags = { $in: tags };
      if (isPublic !== undefined) filter.isPrivate = !isPublic;

      // Text search if searchTerm is provided
      if (searchTerm) {
        filter.$text = { $search: searchTerm };
      }

      // Execute query with pagination
      const notes = await Note.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'firstName lastName email')
        .populate('event', 'title')
        .populate('session', 'title');

      // Get total count for pagination
      const total = await Note.countDocuments(filter);

      return {
        notes,
        total,
        page: Number(page),
        limit: Number(limit)
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to retrieve notes', 500);
    }
  }

  async getNoteById(noteId: string, userId: string): Promise<Note | null> {
    try {
      if (!Types.ObjectId.isValid(noteId)) {
        throw new AppError('Invalid note ID', 400);
      }

      const note = await Note.findById(noteId)
        .populate('user', 'firstName lastName email')
        .populate('event', 'title')
        .populate('session', 'title');

      if (!note) {
        throw new AppError('Note not found', 404);
      }


       const isOwner = note.user.toString() === userId;
       const isSharedWithUser = note.sharedWith?.some(id => id.toString() === userId);
       const isPublic = !note.isPrivate;

       console.log({ isOwner, isSharedWithUser, isPublic });

       // User can view if ANY of these conditions are true
       if (!(isOwner || isSharedWithUser || isPublic)) {
         throw new AppError('You do not have permission to view this note', 403);
       }

      return note;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve note', 500);
    }
  }

  async updateNote(noteId: string, updateData: UpdateNoteDto, userId: string): Promise<Note | null> {
    try {
      if (!Types.ObjectId.isValid(noteId)) {
        throw new AppError('Invalid note ID', 400);
      }

      // Find the note first to check ownership
      const note = await Note.findById(noteId);

      if (!note) {
        throw new AppError('Note not found', 404);
      }

      // Check if user is the owner
      if (note.user.toString() !== userId) {
        throw new AppError('You do not have permission to update this note', 403);
      }

      // Update the note
      const updatedNote = await Note.findByIdAndUpdate(
        noteId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      return updatedNote;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to update note', 500);
    }
  }

  async deleteNote(noteId: string, userId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(noteId)) {
        throw new AppError('Invalid note ID', 400);
      }

      // Find the note first to check ownership
      const note = await Note.findById(noteId);

      if (!note) {
        throw new AppError('Note not found', 404);
      }

      // Check if user is the owner
      if (note.user.toString() !== userId) {
        throw new AppError('You do not have permission to delete this note', 403);
      }

      // Delete all attached media files from storage
      if (note.mediaAttachments && note.mediaAttachments.length > 0) {
        for (const attachment of note.mediaAttachments) {
          if (attachment.storageRef) {
            await this.storageService.deleteFile(attachment.storageRef);
          }
        }
      }

      await Note.findByIdAndDelete(noteId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete note', 500);
    }
  }

  async addMediaAttachment(
    noteId: string,
    userId: string,
    file: Buffer,
    fileName: string,
    fileType: 'image' | 'audio' | 'video' | 'document',
    caption?: string
  ): Promise<Note | null> {
    try {
      if (!Types.ObjectId.isValid(noteId)) {
        throw new AppError('Invalid note ID', 400);
      }

      // Find the note first to check ownership
      const note = await Note.findById(noteId);

      if (!note) {
        throw new AppError('Note not found', 404);
      }

      // Check if user is the owner
      if (note.user.toString() !== userId) {
        throw new AppError('You do not have permission to update this note', 403);
      }

      // Upload file to Firebase Storage
      const uploadedFile = await this.storageService.uploadFile(
        file,
        fileName,
        userId,
        fileType
      );

      // Add attachment to note
      const newAttachment: MediaAttachment = {
        type: fileType,
        url: uploadedFile.url,
        storageRef: uploadedFile.storageRef,
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        caption: caption || '',
        createdAt: new Date()
      };

      if (!note.mediaAttachments) {
        note.mediaAttachments = [];
      }

      note.mediaAttachments.push(newAttachment);
      await note.save();

      return note;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new AppError(error.message, 400);
      }
      throw new AppError('Failed to add media attachment', 500);
    }
  }

  async removeMediaAttachment(noteId: string, attachmentId: string, userId: string): Promise<Note | null> {
    try {
      if (!Types.ObjectId.isValid(noteId)) {
        throw new AppError('Invalid note ID', 400);
      }

      // Find the note first to check ownership
      const note = await Note.findById(noteId);

      if (!note) {
        throw new AppError('Note not found', 404);
      }

      // Check if user is the owner
      if (note.user.toString() !== userId) {
        throw new AppError('You do not have permission to update this note', 403);
      }

      // Check if note has any attachments
      if (!note.mediaAttachments || note.mediaAttachments.length === 0) {
        throw new AppError('No attachments found', 404);
      }

      // Find the attachment
      const attachmentIndex = note.mediaAttachments.findIndex(
        attachment => attachment._id?.toString() === attachmentId
      );

      if (attachmentIndex === -1) {
        throw new AppError('Attachment not found', 404);
      }

      // Get storage reference before removing from array
      const storageRef = note.mediaAttachments[attachmentIndex].storageRef;

      // Remove attachment from note
      note.mediaAttachments.splice(attachmentIndex, 1);
      await note.save();

      // Delete file from storage
      if (storageRef) {
        await this.storageService.deleteFile(storageRef);
      }

      return note;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to remove media attachment', 500);
    }
  }

  async shareNote(noteId: string, shareWithUserIds: string[], userId: string): Promise<Note | null> {
    try {
      if (!Types.ObjectId.isValid(noteId)) {
        throw new AppError('Invalid note ID', 400);
      }

      // Find the note first to check ownership
      const note = await Note.findById(noteId);

      if (!note) {
        throw new AppError('Note not found', 404);
      }

      // Check if user is the owner
      if (note.user.toString() !== userId) {
        throw new AppError('You do not have permission to share this note', 403);
      }

      // Convert string IDs to ObjectIds and validate they exist
      const validUserIds = shareWithUserIds.filter(id => Types.ObjectId.isValid(id))
        .map(id => new Types.ObjectId(id));

      // Update the sharedWith
      if (!note.sharedWith) {
        note.sharedWith = [];
      }

      note.sharedWith = [...new Set([...note.sharedWith, ...validUserIds])];
      await note.save();

      return note;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to share note', 500);
    }
  }

  async unshareNote(noteId: string, unshareWithUserIds: string[], userId: string): Promise<Note | null> {
    try {
      if (!Types.ObjectId.isValid(noteId)) {
        throw new AppError('Invalid note ID', 400);
      }

      // Find the note first to check ownership
      const note = await Note.findById(noteId);

      if (!note) {
        throw new AppError('Note not found', 404);
      }

      // Check if user is the owner
      if (note.user.toString() !== userId) {
        throw new AppError('You do not have permission to unshare this note', 403);
      }

      // Convert string IDs to ObjectIds and validate they exist
      const validUserIds = unshareWithUserIds.filter(id => Types.ObjectId.isValid(id))
        .map(id => new Types.ObjectId(id));

      // Remove users from sharedWith array
      if (note.sharedWith && note.sharedWith.length > 0) {
        note.sharedWith = note.sharedWith.filter(userId =>
          !validUserIds.some(id => id.toString() === userId.toString())
        );
        await note.save();
      }

      return note;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to unshare note', 500);
    }
  }
}

export const noteService = new NoteService();
