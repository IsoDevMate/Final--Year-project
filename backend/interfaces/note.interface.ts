import { NoteType } from '../models/note.model';

export interface NoteAttachmentDto {
  type: NoteType;
  url: string;
  name: string;
  size: number;
}

export interface CreateNoteDto {
  eventId: string;
  sessionId?: string;
  title: string;
  content: string;
  attachments?: NoteAttachmentDto[];
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  attachments?: NoteAttachmentDto[];
  tags?: string[];
  isPublic?: boolean;
}

export interface NoteQueryDto {
  page?: number;
  limit?: number;
  eventId?: string;
  sessionId?: string;
  searchTerm?: string;
  tags?: string[];
  isPublic?: boolean;
}
